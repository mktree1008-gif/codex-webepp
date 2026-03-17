import { describe, expect, test } from 'vitest'
import { defaultDensities, defaultGeometry, defaultModelAssumptions } from './presets'
import { buildFormulationMap, runFormulationEngine } from './formulationEngine'

describe('formulationEngine', () => {
  test('optimizes AM/SE and returns a score-bounded recommendation', () => {
    const config = {
      cnfWeightFraction: 0.01,
      ptfeWeightFraction: 0.02,
      targetProbability: 0.05,
      sigmaETarget: 1e-6,
      sigmaIonTarget: 1e-12,
      porosity: 0.09,
      seMinWeightFraction: 0.2,
      seMaxWeightFraction: 0.4,
      seStep: 0.01,
      mapCnfMin: 0.008,
      mapCnfMax: 0.016,
      mapPtfeMin: 0.015,
      mapPtfeMax: 0.025,
      mapStep: 0.004,
    }
    const assumptions = {
      ...defaultModelAssumptions,
      targetProbability: config.targetProbability,
      sigmaETarget: config.sigmaETarget,
      sigmaIonTarget: config.sigmaIonTarget,
    }

    const result = runFormulationEngine(
      config,
      defaultDensities,
      defaultGeometry,
      assumptions,
    )

    expect(result.evaluatedCount).toBeGreaterThan(0)
    expect(result.feasibleCount).toBeGreaterThan(0)
    expect(result.best).not.toBeNull()
    expect((result.best?.scoreFinal ?? 0) <= (result.best?.scoreBase ?? 1)).toBe(true)
    expect(
      (result.best?.amWeightFraction ?? 0) +
        (result.best?.seWeightFraction ?? 0) +
        config.cnfWeightFraction +
        config.ptfeWeightFraction,
    ).toBeCloseTo(1, 6)
  })

  test('builds CNF/PTFE neighborhood map with expected lattice dimensions', () => {
    const config = {
      cnfWeightFraction: 0.01,
      ptfeWeightFraction: 0.02,
      targetProbability: 0.05,
      sigmaETarget: 1e-6,
      sigmaIonTarget: 1e-12,
      porosity: 0.09,
      seMinWeightFraction: 0.2,
      seMaxWeightFraction: 0.25,
      seStep: 0.01,
      mapCnfMin: 0.01,
      mapCnfMax: 0.014,
      mapPtfeMin: 0.02,
      mapPtfeMax: 0.024,
      mapStep: 0.002,
    }
    const assumptions = {
      ...defaultModelAssumptions,
      targetProbability: config.targetProbability,
      sigmaETarget: config.sigmaETarget,
      sigmaIonTarget: config.sigmaIonTarget,
    }

    const map = buildFormulationMap(config, defaultDensities, defaultGeometry, assumptions)
    expect(map.cnfValues.length).toBeGreaterThan(1)
    expect(map.ptfeValues.length).toBeGreaterThan(1)
    expect(map.points.length).toBe(map.cnfValues.length * map.ptfeValues.length)
  })
})
