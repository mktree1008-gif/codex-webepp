import { fmtNumber, fmtPercent } from './i18n'
import type { CalculationResult } from './types'

export const buildBilingualSummary = (result: CalculationResult) => {
  const { composition, probability, thresholds, inverse, input, geometry } = result

  return [
    'English',
    `Case: ${input.label.en}`,
    `Model: ${result.input.mode}, active network = ${result.thresholds.active === result.thresholds.segregated ? 'segregated' : 'random'}`,
    `CNF weight fraction: ${fmtPercent(composition.weightFractions.cnf)}`,
    `CNF volume fraction (used in percolation equations): ${fmtPercent(composition.volumeFractions.cnf)}`,
    `AM/SE/CNF/PTFE volume fractions: ${fmtPercent(composition.volumeFractions.am)}, ${fmtPercent(composition.volumeFractions.se)}, ${fmtPercent(composition.volumeFractions.cnf)}, ${fmtPercent(composition.volumeFractions.ptfe)}`,
    `AM/SE/CNF/PTFE weight fractions: ${fmtPercent(composition.weightFractions.am)}, ${fmtPercent(composition.weightFractions.se)}, ${fmtPercent(composition.weightFractions.cnf)}, ${fmtPercent(composition.weightFractions.ptfe)}`,
    `AM:additive size ratio = ${fmtNumber(geometry.amToAdditiveRatio, 2)}`,
    `V_available = ${fmtNumber(probability.vAvailable, 4)}`,
    `Veff = ${fmtNumber(probability.veff, 5)}`,
    `Vth(random) = ${fmtNumber(thresholds.random, 6)}`,
    `Vth(segregated) = ${fmtNumber(thresholds.segregated, 6)}`,
    `P_raw = ${fmtNumber(probability.pRaw, 4)}`,
    `P_capped = ${fmtNumber(probability.pCapped, 4)}`,
    `Conductivity level = ${fmtNumber(probability.sigma, 2)} S/m`,
    inverse.minCnfWeightFraction === null
      ? 'Minimum CNF for target P: not reachable within the model limits'
      : `Minimum CNF for target P=${fmtPercent(inverse.targetProbability)}: ${fmtPercent(inverse.minCnfWeightFraction)} wt% (${fmtPercent(inverse.minCnfVolFraction ?? 0)} vol%)`,
    inverse.minPtfeWeightFraction === null
      ? 'Minimum PTFE for target P: not reachable within the model limits'
      : `Minimum PTFE for target P=${fmtPercent(inverse.targetProbability)}: ${fmtPercent(inverse.minPtfeWeightFraction)} wt% (${fmtPercent(inverse.minPtfeVolFraction ?? 0)} vol%)`,
    '',
    '한국어',
    `케이스: ${input.label.ko}`,
    `CNF 중량분율: ${fmtPercent(composition.weightFractions.cnf)}`,
    `CNF 부피분율(퍼콜레이션 식에 사용): ${fmtPercent(composition.volumeFractions.cnf)}`,
    `활물질/고체전해질/CNF/PTFE 부피분율: ${fmtPercent(composition.volumeFractions.am)}, ${fmtPercent(composition.volumeFractions.se)}, ${fmtPercent(composition.volumeFractions.cnf)}, ${fmtPercent(composition.volumeFractions.ptfe)}`,
    `활물질/고체전해질/CNF/PTFE 중량분율: ${fmtPercent(composition.weightFractions.am)}, ${fmtPercent(composition.weightFractions.se)}, ${fmtPercent(composition.weightFractions.cnf)}, ${fmtPercent(composition.weightFractions.ptfe)}`,
    `활물질:도전재 입경비 = ${fmtNumber(geometry.amToAdditiveRatio, 2)}`,
    `가용 부피 V_available = ${fmtNumber(probability.vAvailable, 4)}`,
    `유효 농도 Veff = ${fmtNumber(probability.veff, 5)}`,
    `Vth(무작위) = ${fmtNumber(thresholds.random, 6)}`,
    `Vth(세그리게이트) = ${fmtNumber(thresholds.segregated, 6)}`,
    `P_raw = ${fmtNumber(probability.pRaw, 4)}`,
    `P = ${fmtNumber(probability.pCapped, 4)}`,
    `전도도 수준 = ${fmtNumber(probability.sigma, 2)} S/m`,
    inverse.minCnfWeightFraction === null
      ? '목표 확률에 필요한 최소 CNF: 현재 모델 범위에서는 도달 불가'
      : `목표 확률 P=${fmtPercent(inverse.targetProbability)}를 위한 최소 CNF: ${fmtPercent(inverse.minCnfWeightFraction)} wt% (${fmtPercent(inverse.minCnfVolFraction ?? 0)} vol%)`,
  ].join('\n')
}
