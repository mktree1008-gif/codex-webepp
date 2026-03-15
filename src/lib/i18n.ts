import type { AccessibleVolumeRule, CompositionMode, Locale, NetworkModel, ThresholdMode } from './types'

export const languageNames: Record<Locale, string> = {
  en: 'English',
  ko: '한국어',
}

export const compositionModeLabels: Record<CompositionMode, Record<Locale, string>> = {
  presetMixed: {
    en: 'Preset-style mixed inputs',
    ko: '프리셋형 혼합 입력',
  },
  directVolume: {
    en: 'Direct volume fractions',
    ko: '직접 부피분율 입력',
  },
  directWeight: {
    en: 'Direct weight fractions',
    ko: '직접 중량분율 입력',
  },
}

export const thresholdModeLabels: Record<ThresholdMode, Record<Locale, string>> = {
  formula: {
    en: 'Segregated formula from Vth,ideal',
    ko: 'Vth,ideal 기반 세그리게이트 식',
  },
  direct: {
    en: 'Direct Vth inputs',
    ko: '직접 Vth 입력',
  },
  ar: {
    en: 'AR heuristic',
    ko: '종횡비(AR) 휴리스틱',
  },
}

export const networkModelLabels: Record<NetworkModel, Record<Locale, string>> = {
  segregated: {
    en: 'Segregated network',
    ko: '세그리게이트 네트워크',
  },
  random: {
    en: 'Random / excluded-volume',
    ko: '무작위 / 제외부피',
  },
}

export const accessibleRuleLabels: Record<
  AccessibleVolumeRule,
  Record<Locale, string>
> = {
  exclude_am: {
    en: 'Exclude AM only',
    ko: '활물질만 제외',
  },
  exclude_am_se: {
    en: 'Exclude AM + SE',
    ko: '활물질 + 고체전해질 제외',
  },
  full_electrode: {
    en: 'Full electrode volume',
    ko: '전극 전체 부피',
  },
}

export const fmtPercent = (value: number) => `${(value * 100).toFixed(2)}%`

export const fmtNumber = (value: number, digits = 4) => value.toFixed(digits)
