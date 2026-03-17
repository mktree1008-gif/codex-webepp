export type Locale = 'en' | 'ko'

export type LocalizedText = Record<Locale, string>

export type FractionMap = {
  am: number
  se: number
  cnf: number
  ptfe: number
}

export type CompositionMode = 'presetMixed' | 'directVolume' | 'directWeight'

export type ThresholdMode = 'formula' | 'direct' | 'ar'

export type NetworkModel = 'segregated' | 'random'

export type AccessibleVolumeRule =
  | 'exclude_am'
  | 'exclude_am_se'
  | 'full_electrode'

export type IonicConnectionMode = 'p_ion' | 'unity'

export type DensitySet = {
  am: number
  se: number
  cnf: number
  ptfe: number
}

export type GeometryInput = {
  cnfAspectRatio: number
  ptfeAspectRatio: number
  amParticleSizeUm: number
  seParticleSizeUm: number
  seAspectRatio: number
  additiveSizeUm: number
  ptfeFibrilSizeUm: number
}

export type ModelAssumptions = {
  thresholdMode: ThresholdMode
  networkModel: NetworkModel
  accessibleVolumeRule: AccessibleVolumeRule
  binderAccessibleVolumeRule: AccessibleVolumeRule
  beta: number
  t: number
  p0: number
  sigma0: number
  vthIdeal: number
  directVthRandom: number
  directVthSegregated: number
  targetProbability: number
  sigmaETarget: number
  sigmaIonTarget: number
  sigmaSe0: number
  ionicAlpha: number
  tauModelExponent: number
  fConnMode: IonicConnectionMode
}

type BaseCaseInput = {
  id: string
  label: LocalizedText
  porosity: number
}

export type PresetMixedCaseInput = BaseCaseInput & {
  mode: 'presetMixed'
  amWeightFraction: number
  seWeightFraction: number
  cnfWeightFraction: number
  ptfeWeightFraction: number
}

export type DirectVolumeCaseInput = BaseCaseInput & {
  mode: 'directVolume'
  amVolFraction: number
  seVolFraction: number
  cnfVolFraction: number
  ptfeVolFraction: number
}

export type DirectWeightCaseInput = BaseCaseInput & {
  mode: 'directWeight'
  amWeightFraction: number
  seWeightFraction: number
  cnfWeightFraction: number
  ptfeWeightFraction: number
}

export type CaseInput =
  | PresetMixedCaseInput
  | DirectVolumeCaseInput
  | DirectWeightCaseInput

export type PresetCase = {
  id: string
  label: LocalizedText
  input: PresetMixedCaseInput
}

export type DerivationStep = {
  label: LocalizedText
  formula: string
  substituted: string
  value: string
  note?: LocalizedText
}

export type ValidationWarning = {
  code: string
  severity: 'warning' | 'info'
  message: LocalizedText
}

export type ThresholdSet = {
  random: number
  segregated: number
  active: number
}

export type CompositionResolved = {
  volumeFractions: FractionMap
  weightFractions: FractionMap
  masses: FractionMap
  normalized: boolean
  totalSolidVolume: number
  totalSolidMass: number
  cnfWeightFractionOfSolids: number
  seWeightFractionInMatrix: number
  ptfeWeightFractionOfSolids: number
}

export type ProbabilityResult = {
  vAvailable: number
  veff: number
  diff: number
  pRaw: number
  pCapped: number
  sigma: number
}

export type BinderResult = {
  aspectRatio: number
  vAvailable: number
  veff: number
  thresholds: ThresholdSet
  probability: ProbabilityResult
}

export type InverseSolveResult = {
  targetProbability: number
  minCnfVolFraction: number | null
  minCnfWeightFraction: number | null
  minPtfeVolFraction: number | null
  minPtfeWeightFraction: number | null
}

export type CalculationResult = {
  input: CaseInput
  composition: CompositionResolved
  geometry: GeometryInput & {
    amToAdditiveRatio: number
    seToAdditiveRatio: number
  }
  thresholds: ThresholdSet
  probability: ProbabilityResult
  binder: BinderResult
  inverse: InverseSolveResult
  derivation: DerivationStep[]
  warnings: ValidationWarning[]
}

export type IonicBranchResult = {
  vAvailable: number
  veff: number
  diff: number
  pRaw: number
  pCapped: number
  sigma: number
  thresholds: ThresholdSet
  tau: number
  fConn: number
  inverse: {
    minSeWeightFraction: number | null
    minSeVolFraction: number | null
  }
}

export type FormulationEngineConfig = {
  cnfWeightFraction: number
  ptfeWeightFraction: number
  targetProbability: number
  sigmaETarget: number
  sigmaIonTarget: number
  porosity: number
  seMinWeightFraction: number
  seMaxWeightFraction: number
  seStep: number
  mapCnfMin: number
  mapCnfMax: number
  mapPtfeMin: number
  mapPtfeMax: number
  mapStep: number
}

export type FormulationCandidateMetrics = {
  amWeightFraction: number
  seWeightFraction: number
  cnfWeightFraction: number
  ptfeWeightFraction: number
  pe: number
  pb: number
  pion: number
  sigmaE: number
  sigmaIon: number
  scoreBase: number
  scoreFinal: number
  feasible: boolean
  marginPe: number
  marginPb: number
  marginSigmaE: number
  marginSigmaIon: number
  ecThreshold: number
  ptfeThreshold: number
  ionThreshold: number
}

export type FormulationRecommendation = {
  best: FormulationCandidateMetrics | null
  candidates: FormulationCandidateMetrics[]
  evaluatedCount: number
  feasibleCount: number
}

export type FormulationMapPoint = {
  cnfWeightFraction: number
  ptfeWeightFraction: number
  score: number | null
  feasible: boolean
}

export type FormulationMapData = {
  points: FormulationMapPoint[]
  cnfValues: number[]
  ptfeValues: number[]
}
