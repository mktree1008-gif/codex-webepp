import { calculateCase, calculateIonicBranch } from './calculations'
import type {
  DensitySet,
  FormulationCandidateMetrics,
  FormulationEngineConfig,
  FormulationMapData,
  GeometryInput,
  ModelAssumptions,
} from './types'

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value))

const createRange = (min: number, max: number, step: number): number[] => {
  const safeStep = Math.max(step, 1e-6)
  const start = Math.min(min, max)
  const end = Math.max(min, max)
  const values: number[] = []
  let current = start
  let guard = 0
  while (current <= end + 1e-12 && guard < 40000) {
    values.push(Number(current.toFixed(6)))
    current += safeStep
    guard += 1
  }
  if (values.length === 0 || Math.abs(values[values.length - 1] - end) > 1e-6) {
    values.push(Number(end.toFixed(6)))
  }
  return values
}

const buildCaseInput = (
  config: FormulationEngineConfig,
  seWeightFraction: number,
): {
  amWeightFraction: number
  seWeightFraction: number
  cnfWeightFraction: number
  ptfeWeightFraction: number
} | null => {
  const amWeightFraction =
    1 - config.cnfWeightFraction - config.ptfeWeightFraction - seWeightFraction
  if (amWeightFraction < 0) {
    return null
  }
  return {
    amWeightFraction,
    seWeightFraction,
    cnfWeightFraction: config.cnfWeightFraction,
    ptfeWeightFraction: config.ptfeWeightFraction,
  }
}

const evaluateCandidate = (
  config: FormulationEngineConfig,
  seWeightFraction: number,
  densities: DensitySet,
  geometry: GeometryInput,
  assumptions: ModelAssumptions,
): FormulationCandidateMetrics | null => {
  const composition = buildCaseInput(config, seWeightFraction)
  if (!composition) {
    return null
  }

  const calculation = calculateCase(
    {
      id: 'formulation-candidate',
      label: { en: 'Formulation candidate', ko: '조성 후보' },
      mode: 'presetMixed',
      porosity: config.porosity,
      ...composition,
    },
    densities,
    geometry,
    assumptions,
  )
  const ionic = calculateIonicBranch(
    calculation,
    densities,
    geometry,
    assumptions,
    {
      targetProbability: config.targetProbability,
      sigmaIonTarget: config.sigmaIonTarget,
      skipInverse: true,
    },
  )

  const pe = calculation.probability.pCapped
  const pb = calculation.binder.probability.pCapped
  const pion = ionic.pCapped
  const sigmaE = calculation.probability.sigma
  const sigmaIon = ionic.sigma

  const feasible =
    pe >= config.targetProbability &&
    pb >= config.targetProbability &&
    sigmaE >= config.sigmaETarget &&
    sigmaIon >= config.sigmaIonTarget

  const sE = clamp(pe / Math.max(config.targetProbability, 1e-9))
  const sB = clamp(pb / Math.max(config.targetProbability, 1e-9))
  const sSigmaE =
    config.sigmaETarget <= 0 ? 1 : clamp(sigmaE / Math.max(config.sigmaETarget, 1e-12))
  const sSigmaIon =
    config.sigmaIonTarget <= 0
      ? 1
      : clamp(sigmaIon / Math.max(config.sigmaIonTarget, 1e-12))
  const amWeightMax = Math.max(
    1 - config.cnfWeightFraction - config.ptfeWeightFraction - config.seMinWeightFraction,
    1e-9,
  )
  const sAm = clamp(composition.amWeightFraction / amWeightMax)

  const scoreBase =
    0.2 * sE + 0.2 * sB + 0.15 * sSigmaE + 0.25 * sSigmaIon + 0.2 * sAm
  const scoreFinal = scoreBase * Math.min(sE, sB, sSigmaE, sSigmaIon)

  return {
    amWeightFraction: composition.amWeightFraction,
    seWeightFraction: composition.seWeightFraction,
    cnfWeightFraction: composition.cnfWeightFraction,
    ptfeWeightFraction: composition.ptfeWeightFraction,
    pe,
    pb,
    pion,
    sigmaE,
    sigmaIon,
    scoreBase,
    scoreFinal,
    feasible,
    marginPe: pe - config.targetProbability,
    marginPb: pb - config.targetProbability,
    marginSigmaE: sigmaE - config.sigmaETarget,
    marginSigmaIon: sigmaIon - config.sigmaIonTarget,
    ecThreshold: calculation.thresholds.active,
    ptfeThreshold: calculation.binder.thresholds.active,
    ionThreshold: ionic.thresholds.active,
  }
}

export const runFormulationEngine = (
  config: FormulationEngineConfig,
  densities: DensitySet,
  geometry: GeometryInput,
  assumptions: ModelAssumptions,
) => {
  const candidates: FormulationCandidateMetrics[] = []
  const seValues = createRange(
    config.seMinWeightFraction,
    config.seMaxWeightFraction,
    config.seStep,
  )

  seValues.forEach((seWeightFraction) => {
    const candidate = evaluateCandidate(
      config,
      seWeightFraction,
      densities,
      geometry,
      assumptions,
    )
    if (candidate) {
      candidates.push(candidate)
    }
  })

  const feasible = candidates.filter((candidate) => candidate.feasible)
  const best = feasible.sort((left, right) => {
    if (right.scoreFinal !== left.scoreFinal) {
      return right.scoreFinal - left.scoreFinal
    }
    if (right.amWeightFraction !== left.amWeightFraction) {
      return right.amWeightFraction - left.amWeightFraction
    }
    const leftMinMargin = Math.min(
      left.marginPe,
      left.marginPb,
      left.marginSigmaE,
      left.marginSigmaIon,
    )
    const rightMinMargin = Math.min(
      right.marginPe,
      right.marginPb,
      right.marginSigmaE,
      right.marginSigmaIon,
    )
    return rightMinMargin - leftMinMargin
  })[0] ?? null

  return {
    best,
    candidates,
    evaluatedCount: candidates.length,
    feasibleCount: feasible.length,
  }
}

export const buildFormulationMap = (
  config: FormulationEngineConfig,
  densities: DensitySet,
  geometry: GeometryInput,
  assumptions: ModelAssumptions,
): FormulationMapData => {
  const cnfValues = createRange(config.mapCnfMin, config.mapCnfMax, config.mapStep)
  const ptfeValues = createRange(config.mapPtfeMin, config.mapPtfeMax, config.mapStep)

  const points: FormulationMapData['points'] = []
  ptfeValues.forEach((ptfeWeightFraction) => {
    cnfValues.forEach((cnfWeightFraction) => {
      const localConfig: FormulationEngineConfig = {
        ...config,
        cnfWeightFraction,
        ptfeWeightFraction,
      }
      const result = runFormulationEngine(localConfig, densities, geometry, assumptions)
      points.push({
        cnfWeightFraction,
        ptfeWeightFraction,
        score: result.best?.scoreFinal ?? null,
        feasible: result.feasibleCount > 0,
      })
    })
  })

  return {
    points,
    cnfValues,
    ptfeValues,
  }
}
