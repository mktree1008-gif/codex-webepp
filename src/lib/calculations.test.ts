import { describe, expect, test } from 'vitest'
import { calculateCase } from './calculations'
import {
  defaultDensities,
  defaultGeometry,
  defaultModelAssumptions,
  presetCases,
} from './presets'

describe('calculateCase', () => {
  test('round-trips direct weight inputs with fixed densities', () => {
    const result = calculateCase(
      {
        id: 'weights',
        label: { en: 'Weights', ko: '중량' },
        mode: 'directWeight',
        porosity: 0.09,
        amWeightFraction: 0.54,
        seWeightFraction: 0.31,
        cnfWeightFraction: 0.1,
        ptfeWeightFraction: 0.05,
      },
      defaultDensities,
      defaultGeometry,
      defaultModelAssumptions,
    )

    expect(result.composition.weightFractions.am).toBeCloseTo(0.54, 5)
    expect(result.composition.weightFractions.se).toBeCloseTo(0.31, 5)
    expect(result.composition.weightFractions.cnf).toBeCloseTo(0.1, 5)
    expect(result.composition.weightFractions.ptfe).toBeCloseTo(0.05, 5)
  })

  test('ships the expected SE presets', () => {
    expect(presetCases.map((preset) => preset.id)).toEqual(['se-35', 'se-24', 'se-21'])
    expect(presetCases.map((preset) => preset.input.seWeightFraction)).toEqual([0.35, 0.24, 0.21])
    expect(presetCases.map((preset) => preset.input.amWeightFraction)).toEqual([0.62, 0.73, 0.76])
  })

  test('reproduces the segregated threshold from Vth,ideal and size ratio', () => {
    const result = calculateCase(
      presetCases[1].input,
      defaultDensities,
      defaultGeometry,
      {
        ...defaultModelAssumptions,
        thresholdMode: 'formula',
        vthIdeal: 0.014,
      },
    )

    expect(result.thresholds.segregated).toBeCloseTo(0.014 / 51, 8)
  })

  test('returns zero probability below threshold', () => {
    const result = calculateCase(
      presetCases[1].input,
      defaultDensities,
      defaultGeometry,
      {
        ...defaultModelAssumptions,
        thresholdMode: 'direct',
        directVthRandom: 0.4,
        directVthSegregated: 0.4,
      },
    )

    expect(result.probability.pRaw).toBe(0)
    expect(result.probability.pCapped).toBe(0)
  })

  test('caps probability at 1 when the raw value exceeds 1', () => {
    const result = calculateCase(
      presetCases[0].input,
      defaultDensities,
      defaultGeometry,
      {
        ...defaultModelAssumptions,
        p0: 50,
      },
    )

    expect(result.probability.pRaw).toBeGreaterThan(1)
    expect(result.probability.pCapped).toBe(1)
  })

  test('inverse solver produces a CNF loading that hits the target probability', () => {
    const baseline = calculateCase(
      presetCases[2].input,
      defaultDensities,
      defaultGeometry,
      defaultModelAssumptions,
    )

    expect(baseline.inverse.minCnfVolFraction).not.toBeNull()
    expect(baseline.inverse.minCnfWeightFraction).not.toBeNull()

    const solved = calculateCase(
      {
        ...presetCases[2].input,
        amWeightFraction:
          1 -
          presetCases[2].input.seWeightFraction -
          presetCases[2].input.ptfeWeightFraction -
          (baseline.inverse.minCnfWeightFraction ?? presetCases[2].input.cnfWeightFraction),
        cnfWeightFraction:
          baseline.inverse.minCnfWeightFraction ?? presetCases[2].input.cnfWeightFraction,
      },
      defaultDensities,
      defaultGeometry,
      defaultModelAssumptions,
    )

    expect(solved.probability.pCapped).toBeGreaterThanOrEqual(
      defaultModelAssumptions.targetProbability,
    )
  })

  test('inverse solver produces a PTFE loading that hits the target probability', () => {
    const baseline = calculateCase(
      presetCases[2].input,
      defaultDensities,
      defaultGeometry,
      defaultModelAssumptions,
    )

    expect(baseline.inverse.minPtfeVolFraction).not.toBeNull()
    expect(baseline.inverse.minPtfeWeightFraction).not.toBeNull()

    const solved = calculateCase(
      {
        ...presetCases[2].input,
        amWeightFraction:
          1 -
          presetCases[2].input.seWeightFraction -
          presetCases[2].input.cnfWeightFraction -
          (baseline.inverse.minPtfeWeightFraction ?? presetCases[2].input.ptfeWeightFraction),
        ptfeWeightFraction:
          baseline.inverse.minPtfeWeightFraction ?? presetCases[2].input.ptfeWeightFraction,
      },
      defaultDensities,
      defaultGeometry,
      defaultModelAssumptions,
    )

    expect(solved.binder.probability.pCapped).toBeGreaterThanOrEqual(
      defaultModelAssumptions.targetProbability,
    )
  })

  test('warns when direct volume totals need normalization', () => {
    const result = calculateCase(
      {
        id: 'invalid-volume',
        label: { en: 'Invalid', ko: '불일치' },
        mode: 'directVolume',
        porosity: 0.09,
        amVolFraction: 0.6,
        seVolFraction: 0.37,
        cnfVolFraction: 0.03,
        ptfeVolFraction: 0.03,
      },
      defaultDensities,
      defaultGeometry,
      defaultModelAssumptions,
    )

    expect(result.warnings.some((warning) => warning.code === 'direct_volume_scaled')).toBe(true)
  })
})
