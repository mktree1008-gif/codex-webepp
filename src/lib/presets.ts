import type {
  AccessibleVolumeRule,
  DensitySet,
  GeometryInput,
  ModelAssumptions,
  PresetCase,
} from './types'

export const defaultDensities: DensitySet = {
  am: 2.0,
  se: 1.82,
  cnf: 2,
  ptfe: 2.2,
}

export const defaultGeometry: GeometryInput = {
  cnfAspectRatio: 200,
  ptfeAspectRatio: 100,
  amParticleSizeUm: 5,
  seParticleSizeUm: 5,
  seAspectRatio: 1,
  additiveSizeUm: 0.1,
  ptfeFibrilSizeUm: 0.1,
}

export const defaultAccessibleRule: AccessibleVolumeRule = 'exclude_am'

export const defaultModelAssumptions: ModelAssumptions = {
  thresholdMode: 'formula',
  networkModel: 'segregated',
  accessibleVolumeRule: defaultAccessibleRule,
  binderAccessibleVolumeRule: 'full_electrode',
  beta: 0.41,
  t: 2,
  p0: 3.87,
  sigma0: 1e4,
  vthIdeal: 0.014,
  directVthRandom: 0.01,
  directVthSegregated: 0.002,
  targetProbability: 0.9999,
  sigmaETarget: 1,
  sigmaIonTarget: 1e-3,
  sigmaSe0: 3e-3,
  ionicAlpha: 1.5,
  tauModelExponent: 0.5,
  fConnMode: 'p_ion',
}

export const presetCases: PresetCase[] = [
  {
    id: 'se-35',
    label: {
      en: 'SE 35 wt%',
      ko: '고체전해질 35 wt%',
    },
    input: {
      id: 'se-35',
      label: {
        en: 'SE 35 wt%',
        ko: '고체전해질 35 wt%',
      },
      mode: 'presetMixed',
      amWeightFraction: 0.62,
      seWeightFraction: 0.35,
      cnfWeightFraction: 0.01,
      ptfeWeightFraction: 0.02,
      porosity: 0.09,
    },
  },
  {
    id: 'se-24',
    label: {
      en: 'SE 24 wt%',
      ko: '고체전해질 24 wt%',
    },
    input: {
      id: 'se-24',
      label: {
        en: 'SE 24 wt%',
        ko: '고체전해질 24 wt%',
      },
      mode: 'presetMixed',
      amWeightFraction: 0.73,
      seWeightFraction: 0.24,
      cnfWeightFraction: 0.01,
      ptfeWeightFraction: 0.02,
      porosity: 0.09,
    },
  },
  {
    id: 'se-21',
    label: {
      en: 'SE 21 wt%',
      ko: '고체전해질 21 wt%',
    },
    input: {
      id: 'se-21',
      label: {
        en: 'SE 21 wt%',
        ko: '고체전해질 21 wt%',
      },
      mode: 'presetMixed',
      amWeightFraction: 0.76,
      seWeightFraction: 0.21,
      cnfWeightFraction: 0.01,
      ptfeWeightFraction: 0.02,
      porosity: 0.09,
    },
  },
]

export const customCaseTemplate = {
  id: 'custom',
  label: {
    en: 'Custom case',
    ko: '사용자 정의 케이스',
  },
  mode: 'presetMixed' as const,
  amWeightFraction: 0.73,
  seWeightFraction: 0.24,
  cnfWeightFraction: 0.01,
  ptfeWeightFraction: 0.02,
  porosity: 0.09,
}
