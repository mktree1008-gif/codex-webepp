import type {
  AccessibleVolumeRule,
  BinderResult,
  CalculationResult,
  CaseInput,
  CompositionResolved,
  DensitySet,
  DerivationStep,
  FractionMap,
  GeometryInput,
  ModelAssumptions,
  ProbabilityResult,
  ThresholdSet,
  ValidationWarning,
} from './types'

const fractionKeys: Array<keyof FractionMap> = ['am', 'se', 'cnf', 'ptfe']

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value))

const safeDivide = (numerator: number, denominator: number) =>
  denominator === 0 ? 0 : numerator / denominator

const createText = (en: string, ko: string) => ({ en, ko })

const createStep = (
  en: string,
  ko: string,
  formula: string,
  substituted: string,
  value: string,
  note?: { en: string; ko: string },
): DerivationStep => ({
  label: createText(en, ko),
  formula,
  substituted,
  value,
  note,
})

const normalizeFractions = (
  values: FractionMap,
  warnings: ValidationWarning[],
  code: string,
): FractionMap => {
  const total = values.am + values.se + values.cnf + values.ptfe
  if (total <= 0) {
    warnings.push({
      code,
      severity: 'warning',
      message: createText(
        'Composition totals are zero or negative. The solver fell back to zeros.',
        '조성 합계가 0 이하라서 계산기를 0 값으로 보정했습니다.',
      ),
    })
    return { am: 0, se: 0, cnf: 0, ptfe: 0 }
  }
  if (Math.abs(total - 1) > 1e-6) {
    warnings.push({
      code: `${code}_normalized`,
      severity: 'warning',
      message: createText(
        'Composition inputs were normalized because they did not sum to 100% of their basis.',
        '입력 조성의 합이 기준 100%와 달라 자동 정규화했습니다.',
      ),
    })
  }
  return {
    am: values.am / total,
    se: values.se / total,
    cnf: values.cnf / total,
    ptfe: values.ptfe / total,
  }
}

const getAccessibleVolume = (
  rule: AccessibleVolumeRule,
  volumes: FractionMap,
): number => {
  switch (rule) {
    case 'exclude_am':
      return 1 - volumes.am
    case 'exclude_am_se':
      return 1 - volumes.am - volumes.se
    case 'full_electrode':
      return 1
    default:
      return 1 - volumes.am
  }
}

const toSolidBasisFractions = (
  volumes: FractionMap,
  totalSolidVolume: number,
): FractionMap => {
  const basis = Math.max(totalSolidVolume, 1e-9)
  return {
    am: volumes.am / basis,
    se: volumes.se / basis,
    cnf: volumes.cnf / basis,
    ptfe: volumes.ptfe / basis,
  }
}

const deriveThresholds = (
  geometry: GeometryInput,
  assumptions: ModelAssumptions,
  aspectRatio = geometry.cnfAspectRatio,
  additiveSizeUm = geometry.additiveSizeUm,
): ThresholdSet => {
  const matrixParticleSize = (geometry.amParticleSizeUm + geometry.seParticleSizeUm) / 2
  const sizeRatio = safeDivide(matrixParticleSize, additiveSizeUm)
  const random =
    assumptions.thresholdMode === 'direct'
      ? assumptions.directVthRandom
      : assumptions.thresholdMode === 'ar'
        ? safeDivide(1, aspectRatio)
        : assumptions.vthIdeal

  const segregated =
    assumptions.thresholdMode === 'direct'
      ? assumptions.directVthSegregated
      : random / (1 + sizeRatio)

  const active =
    assumptions.networkModel === 'segregated' ? segregated : random

  return { random, segregated, active }
}

const resolvePresetMixed = (
  input: Extract<CaseInput, { mode: 'presetMixed' }>,
  densities: DensitySet,
  warnings: ValidationWarning[],
  steps: DerivationStep[],
): CompositionResolved => {
  const solidVolume = clamp(1 - input.porosity)
  const normalizedWeights = normalizeFractions(
    {
      am: input.amWeightFraction,
      se: input.seWeightFraction,
      cnf: input.cnfWeightFraction,
      ptfe: input.ptfeWeightFraction,
    },
    warnings,
    'preset_weight',
  )
  const solidSpecificVolume =
    normalizedWeights.am / densities.am +
    normalizedWeights.se / densities.se +
    normalizedWeights.cnf / densities.cnf +
    normalizedWeights.ptfe / densities.ptfe
  const totalSolidMass =
    solidSpecificVolume <= 0 ? 0 : safeDivide(solidVolume, solidSpecificVolume)
  const amMass = totalSolidMass * normalizedWeights.am
  const seMass = totalSolidMass * normalizedWeights.se
  const cnfMass = totalSolidMass * normalizedWeights.cnf
  const ptfeMass = totalSolidMass * normalizedWeights.ptfe
  const volumes: FractionMap = {
    am: safeDivide(amMass, densities.am),
    se: safeDivide(seMass, densities.se),
    cnf: safeDivide(cnfMass, densities.cnf),
    ptfe: safeDivide(ptfeMass, densities.ptfe),
  }

  const totalVolume = volumes.am + volumes.se + volumes.cnf + volumes.ptfe
  if (Math.abs(totalVolume - solidVolume) > 1e-4) {
    warnings.push({
      code: 'preset_volume_balance',
      severity: 'warning',
      message: createText(
        'The wt% to vol% conversion did not exactly match the requested porosity because of numerical rounding.',
        'wt%를 vol%로 변환하는 과정에서 반올림 때문에 목표 기공도와 미세한 차이가 생겼습니다.',
      ),
    })
  }
  const masses: FractionMap = {
    am: amMass,
    se: seMass,
    cnf: cnfMass,
    ptfe: ptfeMass,
  }
  steps.push(
    createStep(
      'Preset direct-weight mass balance',
      '프리셋 직접 중량 질량 균형식',
      'Msolid = (1 - porosity) / Σ(wi / ρi)',
      `${solidVolume.toFixed(4)} / [${normalizedWeights.am.toFixed(4)}/${densities.am.toFixed(2)} + ${normalizedWeights.se.toFixed(4)}/${densities.se.toFixed(2)} + ${normalizedWeights.cnf.toFixed(4)}/${densities.cnf.toFixed(2)} + ${normalizedWeights.ptfe.toFixed(4)}/${densities.ptfe.toFixed(2)}]`,
      `${totalSolidMass.toFixed(4)}`,
      createText(
        'Percolation is computed in volume fraction, so the mixed-input workflow converts AM, SE, CNF, and PTFE wt% into masses first and volume fractions second.',
        '퍼콜레이션은 부피분율 기준으로 계산되므로, 혼합 입력 워크플로는 AM, SE, CNF, PTFE wt%를 먼저 질량으로 해석한 뒤 부피분율로 변환합니다.',
      ),
    ),
  )

  return {
    volumeFractions: volumes,
    weightFractions: normalizedWeights,
    masses,
    normalized:
      Math.abs(
        input.amWeightFraction +
          input.seWeightFraction +
          input.cnfWeightFraction +
          input.ptfeWeightFraction -
          1,
    ) > 1e-6,
    totalSolidVolume: solidVolume,
    totalSolidMass,
    cnfWeightFractionOfSolids: normalizedWeights.cnf,
    seWeightFractionInMatrix: safeDivide(masses.se, masses.am + masses.se),
    ptfeWeightFractionOfSolids: normalizedWeights.ptfe,
  }
}

const resolveDirectVolume = (
  input: Extract<CaseInput, { mode: 'directVolume' }>,
  densities: DensitySet,
  warnings: ValidationWarning[],
  steps: DerivationStep[],
): CompositionResolved => {
  const targetSolidVolume = clamp(1 - input.porosity)
  const rawVolumes: FractionMap = {
    am: input.amVolFraction,
    se: input.seVolFraction,
    cnf: input.cnfVolFraction,
    ptfe: input.ptfeVolFraction,
  }
  const totalRawVolume = rawVolumes.am + rawVolumes.se + rawVolumes.cnf + rawVolumes.ptfe
  const scale = totalRawVolume <= 0 ? 0 : targetSolidVolume / totalRawVolume
  if (Math.abs(totalRawVolume - targetSolidVolume) > 1e-6) {
    warnings.push({
      code: 'direct_volume_scaled',
      severity: 'warning',
      message: createText(
        'Direct volume inputs were scaled to match the requested porosity.',
        '직접 입력한 부피분율을 목표 기공도에 맞게 스케일 조정했습니다.',
      ),
    })
  }
  const volumeFractions: FractionMap = {
    am: rawVolumes.am * scale,
    se: rawVolumes.se * scale,
    cnf: rawVolumes.cnf * scale,
    ptfe: rawVolumes.ptfe * scale,
  }
  const masses: FractionMap = {
    am: volumeFractions.am * densities.am,
    se: volumeFractions.se * densities.se,
    cnf: volumeFractions.cnf * densities.cnf,
    ptfe: volumeFractions.ptfe * densities.ptfe,
  }
  const totalSolidMass = masses.am + masses.se + masses.cnf + masses.ptfe
  const weightFractions: FractionMap = {
    am: safeDivide(masses.am, totalSolidMass),
    se: safeDivide(masses.se, totalSolidMass),
    cnf: safeDivide(masses.cnf, totalSolidMass),
    ptfe: safeDivide(masses.ptfe, totalSolidMass),
  }

  steps.push(
    createStep(
      'Direct volume normalization',
      '직접 부피분율 정규화',
      'Vscaled = Vraw × (1 - porosity) / ΣVraw',
      `${targetSolidVolume.toFixed(4)} / ${totalRawVolume.toFixed(4)} = ${scale.toFixed(4)}`,
      `${scale.toFixed(4)}`,
    ),
  )

  return {
    volumeFractions,
    weightFractions,
    masses,
    normalized: Math.abs(totalRawVolume - targetSolidVolume) > 1e-6,
    totalSolidVolume: targetSolidVolume,
    totalSolidMass,
    cnfWeightFractionOfSolids: weightFractions.cnf,
    seWeightFractionInMatrix: safeDivide(masses.se, masses.am + masses.se),
    ptfeWeightFractionOfSolids: weightFractions.ptfe,
  }
}

const resolveDirectWeight = (
  input: Extract<CaseInput, { mode: 'directWeight' }>,
  densities: DensitySet,
  warnings: ValidationWarning[],
  steps: DerivationStep[],
): CompositionResolved => {
  const normalizedWeights = normalizeFractions(
    {
      am: input.amWeightFraction,
      se: input.seWeightFraction,
      cnf: input.cnfWeightFraction,
      ptfe: input.ptfeWeightFraction,
    },
    warnings,
    'direct_weight',
  )
  const targetSolidVolume = clamp(1 - input.porosity)
  const specificVolume =
    normalizedWeights.am / densities.am +
    normalizedWeights.se / densities.se +
    normalizedWeights.cnf / densities.cnf +
    normalizedWeights.ptfe / densities.ptfe
  const totalSolidMass = specificVolume <= 0 ? 0 : targetSolidVolume / specificVolume
  const masses: FractionMap = {
    am: normalizedWeights.am * totalSolidMass,
    se: normalizedWeights.se * totalSolidMass,
    cnf: normalizedWeights.cnf * totalSolidMass,
    ptfe: normalizedWeights.ptfe * totalSolidMass,
  }
  const volumeFractions: FractionMap = {
    am: safeDivide(masses.am, densities.am),
    se: safeDivide(masses.se, densities.se),
    cnf: safeDivide(masses.cnf, densities.cnf),
    ptfe: safeDivide(masses.ptfe, densities.ptfe),
  }

  steps.push(
    createStep(
      'Direct weight conversion',
      '직접 중량분율 변환',
      'Msolid = (1 - porosity) / Σ(wi / ρi)',
      `${targetSolidVolume.toFixed(4)} / ${specificVolume.toFixed(4)} = ${totalSolidMass.toFixed(4)}`,
      `${totalSolidMass.toFixed(4)}`,
    ),
  )

  return {
    volumeFractions,
    weightFractions: normalizedWeights,
    masses,
    normalized: Math.abs(
      input.amWeightFraction +
        input.seWeightFraction +
        input.cnfWeightFraction +
        input.ptfeWeightFraction -
        1,
    ) > 1e-6,
    totalSolidVolume: targetSolidVolume,
    totalSolidMass,
    cnfWeightFractionOfSolids: normalizedWeights.cnf,
    seWeightFractionInMatrix: safeDivide(masses.se, masses.am + masses.se),
    ptfeWeightFractionOfSolids: normalizedWeights.ptfe,
  }
}

const resolveComposition = (
  input: CaseInput,
  densities: DensitySet,
  warnings: ValidationWarning[],
  steps: DerivationStep[],
): CompositionResolved => {
  switch (input.mode) {
    case 'presetMixed':
      return resolvePresetMixed(input, densities, warnings, steps)
    case 'directVolume':
      return resolveDirectVolume(input, densities, warnings, steps)
    case 'directWeight':
      return resolveDirectWeight(input, densities, warnings, steps)
    default:
      return resolvePresetMixed(input, densities, warnings, steps)
  }
}

const deriveProbability = (
  conductiveVolumeFraction: number,
  volumes: FractionMap,
  thresholds: ThresholdSet,
  assumptions: ModelAssumptions,
  rule: AccessibleVolumeRule,
): ProbabilityResult => {
  const vAvailable = Math.max(1e-9, getAccessibleVolume(rule, volumes))
  const veff = conductiveVolumeFraction / vAvailable
  const diff = Math.max(0, veff - thresholds.active)
  const pRaw = assumptions.p0 * Math.pow(diff, assumptions.beta)
  const pCapped = Math.min(1, pRaw)
  const sigma = assumptions.sigma0 * Math.pow(diff, assumptions.t)
  return { vAvailable, veff, diff, pRaw, pCapped, sigma }
}

const deriveBinder = (
  composition: CompositionResolved,
  geometry: GeometryInput,
  assumptions: ModelAssumptions,
): BinderResult => {
  const thresholds = deriveThresholds(
    geometry,
    assumptions,
    geometry.ptfeAspectRatio,
    geometry.ptfeFibrilSizeUm,
  )
  const solidBasisFractions = toSolidBasisFractions(
    composition.volumeFractions,
    composition.totalSolidVolume,
  )
  const probability = deriveProbability(
    solidBasisFractions.ptfe,
    solidBasisFractions,
    thresholds,
    assumptions,
    assumptions.binderAccessibleVolumeRule,
  )
  return {
    aspectRatio: geometry.ptfeAspectRatio,
    vAvailable: probability.vAvailable,
    veff: probability.veff,
    thresholds,
    probability,
  }
}

const buildInverseTemplate = (result: {
  composition: CompositionResolved
  input: CaseInput
}): Extract<CaseInput, { mode: 'presetMixed' }> => ({
  id: `${result.input.id}-inverse`,
  label: result.input.label,
  mode: 'presetMixed',
  amWeightFraction: result.composition.weightFractions.am,
  seWeightFraction: result.composition.weightFractions.se,
  cnfWeightFraction: result.composition.weightFractions.cnf,
  ptfeWeightFraction: result.composition.ptfeWeightFractionOfSolids,
  porosity: result.input.porosity,
})

type InverseTarget = 'cnf' | 'ptfe'

const buildInverseCandidate = (
  template: Extract<CaseInput, { mode: 'presetMixed' }>,
  target: InverseTarget,
  targetWeightFraction: number,
): Extract<CaseInput, { mode: 'presetMixed' }> => {
  const cnfWeightFraction =
    target === 'cnf' ? targetWeightFraction : template.cnfWeightFraction
  const ptfeWeightFraction =
    target === 'ptfe' ? targetWeightFraction : template.ptfeWeightFraction

  return {
    ...template,
    cnfWeightFraction,
    ptfeWeightFraction,
    amWeightFraction: Math.max(
      0,
      1 - template.seWeightFraction - cnfWeightFraction - ptfeWeightFraction,
    ),
  }
}

const computeTargetProbability = (
  target: InverseTarget,
  targetWeightFraction: number,
  template: Extract<CaseInput, { mode: 'presetMixed' }>,
  densities: DensitySet,
  geometry: GeometryInput,
  assumptions: ModelAssumptions,
): number => {
  const warnings: ValidationWarning[] = []
  const steps: DerivationStep[] = []
  const candidate = buildInverseCandidate(template, target, targetWeightFraction)
  const composition = resolvePresetMixed(candidate, densities, warnings, steps)
  const thresholds =
    target === 'cnf'
      ? deriveThresholds(geometry, assumptions)
      : deriveThresholds(
          geometry,
          assumptions,
          geometry.ptfeAspectRatio,
          geometry.ptfeFibrilSizeUm,
        )

  const probabilityVolumes =
    target === 'cnf'
      ? composition.volumeFractions
      : toSolidBasisFractions(
          composition.volumeFractions,
          composition.totalSolidVolume,
        )

  return deriveProbability(
    target === 'cnf'
      ? probabilityVolumes.cnf
      : probabilityVolumes.ptfe,
    probabilityVolumes,
    thresholds,
    assumptions,
    target === 'cnf'
      ? assumptions.accessibleVolumeRule
      : assumptions.binderAccessibleVolumeRule,
  ).pCapped
}

const solveInverseForTarget = (
  targetComponent: InverseTarget,
  template: Extract<CaseInput, { mode: 'presetMixed' }>,
  densities: DensitySet,
  geometry: GeometryInput,
  assumptions: ModelAssumptions,
): { minVolFraction: number | null; minWeightFraction: number | null } => {
  const fixedWeight =
    targetComponent === 'cnf'
      ? template.seWeightFraction + template.ptfeWeightFraction
      : template.seWeightFraction + template.cnfWeightFraction

  const upperBound = 1 - fixedWeight - 1e-6
  if (upperBound <= 0) {
    return { minVolFraction: null, minWeightFraction: null }
  }
  const hi = upperBound

  const targetProbability = assumptions.targetProbability
  const hiValue = computeTargetProbability(
    targetComponent,
    hi,
    template,
    densities,
    geometry,
    assumptions,
  )
  if (hiValue < targetProbability) {
    return { minVolFraction: null, minWeightFraction: null }
  }

  let low = 0
  let high = hi
  for (let index = 0; index < 80; index += 1) {
    const mid = (low + high) / 2
    const probability = computeTargetProbability(
      targetComponent,
      mid,
      template,
      densities,
      geometry,
      assumptions,
    )
    if (probability >= targetProbability) {
      high = mid
    } else {
      low = mid
    }
  }

  const warnings: ValidationWarning[] = []
  const steps: DerivationStep[] = []
  const solvedComposition = resolvePresetMixed(
    buildInverseCandidate(template, targetComponent, high),
    densities,
    warnings,
    steps,
  )

  return {
    minVolFraction:
      targetComponent === 'cnf'
        ? solvedComposition.volumeFractions.cnf
        : solvedComposition.volumeFractions.ptfe,
    minWeightFraction:
      targetComponent === 'cnf'
        ? solvedComposition.weightFractions.cnf
        : solvedComposition.weightFractions.ptfe,
  }
}

const solveInverse = (
  input: CaseInput,
  composition: CompositionResolved,
  densities: DensitySet,
  geometry: GeometryInput,
  assumptions: ModelAssumptions,
): {
  minCnfVolFraction: number | null
  minCnfWeightFraction: number | null
  minPtfeVolFraction: number | null
  minPtfeWeightFraction: number | null
} => {
  const template = buildInverseTemplate({ composition, input })
  const cnfInverse = solveInverseForTarget(
    'cnf',
    template,
    densities,
    geometry,
    assumptions,
  )
  const ptfeInverse = solveInverseForTarget(
    'ptfe',
    template,
    densities,
    geometry,
    assumptions,
  )

  return {
    minCnfVolFraction: cnfInverse.minVolFraction,
    minCnfWeightFraction: cnfInverse.minWeightFraction,
    minPtfeVolFraction: ptfeInverse.minVolFraction,
    minPtfeWeightFraction: ptfeInverse.minWeightFraction,
  }
}

export const calculateCase = (
  input: CaseInput,
  densities: DensitySet,
  geometry: GeometryInput,
  assumptions: ModelAssumptions,
): CalculationResult => {
  const warnings: ValidationWarning[] = []
  const derivation: DerivationStep[] = []

  if (assumptions.p0 !== 1) {
    warnings.push({
      code: 'p0_assumption',
      severity: 'info',
      message: createText(
        'P0 is being treated as an editable empirical factor, not a universal constant.',
        'P0는 보편 상수가 아니라 조정 가능한 경험 계수로 취급됩니다.',
      ),
    })
  }
  if (assumptions.sigma0 !== 1e4) {
    warnings.push({
      code: 'sigma0_assumption',
      severity: 'info',
      message: createText(
        'Conductivity depends strongly on the assumed sigma0 prefactor.',
        '전도도는 sigma0 가정값에 크게 의존합니다.',
      ),
    })
  }
  if (input.mode !== 'directVolume') {
    warnings.push({
      code: 'volume_fraction_model_note',
      severity: 'info',
      message: createText(
        'This workflow accepts wt% inputs, but the percolation equations are still evaluated in volume fraction after density conversion.',
        '이 워크플로는 wt% 입력을 받지만, 퍼콜레이션 식 자체는 밀도 변환 후의 부피분율로 계산됩니다.',
      ),
    })
  }

  const composition = resolveComposition(input, densities, warnings, derivation)
  const thresholds = deriveThresholds(geometry, assumptions)
  const probability = deriveProbability(
    composition.volumeFractions.cnf,
    composition.volumeFractions,
    thresholds,
    assumptions,
    assumptions.accessibleVolumeRule,
  )
  const binder = deriveBinder(composition, geometry, assumptions)
  const inverseSolved = solveInverse(input, composition, densities, geometry, assumptions)

  fractionKeys.forEach((key) => {
    derivation.push(
      createStep(
        `${key.toUpperCase()} fraction conversion`,
        `${key.toUpperCase()} 분율 변환`,
        'wi = mi / Σmi, vi = Vi / ΣVtotal',
        `w = ${composition.weightFractions[key].toFixed(4)}, v = ${composition.volumeFractions[key].toFixed(4)}`,
        `${composition.weightFractions[key].toFixed(4)} / ${composition.volumeFractions[key].toFixed(4)}`,
      ),
    )
  })

  derivation.push(
    createStep(
      'Accessible volume',
      '가용 부피',
      'Vavailable = rule(volume fractions)',
      `rule -> ${probability.vAvailable.toFixed(4)}`,
      `${probability.vAvailable.toFixed(4)}`,
    ),
    createStep(
      'Effective conductive fraction',
      '유효 도전재 농도',
      'Veff = VCNF / Vavailable',
      `${composition.volumeFractions.cnf.toFixed(5)} / ${probability.vAvailable.toFixed(5)}`,
      `${probability.veff.toFixed(5)}`,
    ),
    createStep(
      'CNF wt% to vol% conversion',
      'CNF wt%에서 vol%로 변환',
      'VCNF = MCNF / ρCNF',
      `${composition.masses.cnf.toFixed(5)} / ${densities.cnf.toFixed(2)}`,
      `${composition.volumeFractions.cnf.toFixed(5)}`,
      createText(
        'Percolation literature usually expresses threshold and scaling in volume fraction, so the converted CNF vol% is what enters Veff and Vth.',
        '퍼콜레이션 문헌은 보통 임계값과 스케일링을 부피분율로 표현하므로, 변환된 CNF vol%가 Veff와 Vth에 들어갑니다.',
      ),
    ),
    createStep(
      'Percolation thresholds',
      '퍼콜레이션 임계값',
      'Vth,seg = Vth,random / (1 + Rmatrix / Radditive)',
      `${thresholds.random.toFixed(6)} / (1 + ${safeDivide((geometry.amParticleSizeUm + geometry.seParticleSizeUm) / 2, geometry.additiveSizeUm).toFixed(2)})`,
      `random ${thresholds.random.toFixed(6)} | segregated ${thresholds.segregated.toFixed(6)}`,
    ),
    createStep(
      'Probability',
      '퍼콜레이션 확률',
      'Praw = P0 × max(Veff - Vth, 0)^β; P = min(Praw, 1)',
      `${assumptions.p0.toFixed(3)} × max(${probability.veff.toFixed(5)} - ${thresholds.active.toFixed(6)}, 0)^${assumptions.beta.toFixed(2)}`,
      `Praw ${probability.pRaw.toFixed(4)} | P ${probability.pCapped.toFixed(4)}`,
    ),
    createStep(
      'Conductivity scaling',
      '전도도 스케일링',
      'σ = σ0 × max(Veff - Vth, 0)^t',
      `${assumptions.sigma0.toExponential(2)} × ${probability.diff.toFixed(5)}^${assumptions.t.toFixed(2)}`,
      `${probability.sigma.toFixed(2)} S/m`,
    ),
    createStep(
      'Inverse CNF solver',
      '최소 CNF 역산',
      'Find minimum wCNF such that P >= Ptarget, then convert to VCNF',
      `Ptarget = ${assumptions.targetProbability.toFixed(4)}`,
      inverseSolved.minCnfVolFraction === null
        ? 'unreachable'
        : `${inverseSolved.minCnfWeightFraction?.toFixed(5)} wt / ${inverseSolved.minCnfVolFraction.toFixed(5)} vol`,
    ),
    createStep(
      'Inverse PTFE solver',
      '최소 PTFE 역산',
      'Find minimum wPTFE such that P_PTFE >= Ptarget, then convert to VPTFE',
      `Ptarget = ${assumptions.targetProbability.toFixed(4)}`,
      inverseSolved.minPtfeVolFraction === null
        ? 'unreachable'
        : `${inverseSolved.minPtfeWeightFraction?.toFixed(5)} wt / ${inverseSolved.minPtfeVolFraction.toFixed(5)} vol`,
    ),
  )

  return {
    input,
    composition,
    geometry: {
      ...geometry,
      amToAdditiveRatio: safeDivide(
        (geometry.amParticleSizeUm + geometry.seParticleSizeUm) / 2,
        geometry.additiveSizeUm,
      ),
      seToAdditiveRatio: safeDivide(geometry.seParticleSizeUm, geometry.additiveSizeUm),
    },
    thresholds,
    probability,
    binder,
    inverse: {
      targetProbability: assumptions.targetProbability,
      ...inverseSolved,
    },
    derivation,
    warnings,
  }
}
