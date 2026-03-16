import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import './App.css'
import { calculateCase } from './lib/calculations'
import {
  accessibleRuleLabels,
  compositionModeLabels,
  fmtNumber,
  fmtPercent,
  languageNames,
  networkModelLabels,
  thresholdModeLabels,
} from './lib/i18n'
import {
  customCaseTemplate,
  defaultDensities,
  defaultGeometry,
  defaultModelAssumptions,
  presetCases,
} from './lib/presets'
import { buildBilingualSummary } from './lib/summary'
import type {
  AccessibleVolumeRule,
  CalculationResult,
  CaseInput,
  CompositionMode,
  DensitySet,
  GeometryInput,
  Locale,
  ModelAssumptions,
  ValidationWarning,
} from './lib/types'

const textByLocale = {
  en: {
    eyebrow: 'Bilingual Percolation Calculator',
    title: 'Solid-state electrode network planning, with every assumption visible.',
    subtitle:
      'Compare CNF/PTFE scenarios, audit the derivation trail, and back-solve the minimum conductive loading needed for a target probability.',
    loadPreset: 'Load preset',
    customCase: 'Custom case',
    copySummary: 'Copy bilingual summary',
    copied: 'Summary copied.',
    copyFailed: 'Clipboard access failed.',
    inputs: 'Inputs',
    caseSetup: 'Case setup',
    mode: 'Composition mode',
    composition: 'Composition',
    densities: 'Densities (g/cm³)',
    geometry: 'Geometry',
    assumptions: 'Model assumptions',
    results: 'Results',
    comparison: 'Preset comparison',
    methods: 'Equations and model conditions',
    equationView: 'Equation style',
    equationCode: 'Code view',
    equationBook: 'Book view',
    derivation: 'Derivation trace',
    warnings: 'Warnings and notes',
    binder: 'Optional PTFE network panel',
    activeThreshold: 'Active threshold',
    vAvailable: 'Accessible volume',
    veff: 'Effective conductive fraction',
    probability: 'Percolation probability',
    probabilityRaw: 'Uncapped probability',
    conductivity: 'Conductivity level',
    minCnfWt: 'Minimum CNF(wt%) for target P',
    minCnfVol: 'Minimum CNF vol%',
    minPtfeWt: 'Minimum PTFE(wt%) for target P',
    minPtfeVol: 'Minimum PTFE vol%',
    networkModel: 'Active network model',
    thresholdMode: 'Threshold mode',
    accessibleRule: 'CNF accessible-volume rule',
    binderRule: 'PTFE accessible-volume rule',
    targetProbability: 'Target probability',
    beta: 'Beta exponent',
    t: 'Conductivity exponent',
    p0: 'P0 empirical factor',
    sigma0: 'Sigma0 prefactor (S/m)',
    vthIdeal: 'Vth,ideal',
    directRandom: 'Direct Vth random',
    directSegregated: 'Direct Vth segregated',
    cnfAspectRatio: 'CNF aspect ratio',
    ptfeAspectRatio: 'PTFE aspect ratio',
    amParticle: 'AM particle size (µm)',
    seParticle: 'SE particle size (µm)',
    additiveSize: 'Additive diameter / size (µm)',
    amDensity: 'AM density',
    seDensity: 'SE density',
    cnfDensity: 'CNF density',
    ptfeDensity: 'PTFE density',
    porosity: 'Porosity',
    cnfVol: 'CNF vol%',
    ptfeWt: 'PTFE wt%',
    seMatrixWt: 'SE wt% (total solids basis)',
    amVol: 'AM vol%',
    seVol: 'SE vol%',
    ptfeVol: 'PTFE vol%',
    amWt: 'AM wt%',
    seWt: 'SE wt% (total solids basis)',
    cnfWt: 'CNF wt%',
    sum: 'Sum',
    sumOk: 'WT% sum matches 100%',
    sumAdjust: 'WT% sum should be 100%',
    summaryNote:
      'Preset interpretation uses total-solid wt% basis. Input AM/SE/CNF/PTFE directly so their sum is 100 wt%. The app converts wt% to volume fractions, then evaluates percolation.',
    tableComponent: 'Component',
    tableVolume: 'Vol%',
    tableWeight: 'Wt%',
    tableMass: 'Mass basis',
    randomVth: 'Vth random',
    segregatedVth: 'Vth segregated',
    currentCase: 'Current case',
    formula: 'Formula',
    substitution: 'Substitution',
    value: 'Value',
    caseName: 'Case',
    binderProbability: 'PTFE probability',
    binderVeff: 'PTFE Veff',
    binderThreshold: 'PTFE active Vth',
    unreachable: 'Not reachable in current model window',
    methodsIntro:
      'These are the exact equations used in this app. The mixed-input workflow begins with wt% inputs, converts them into volume fractions with densities, and then applies a volume-fraction percolation model.',
    methodsWorkflow: '1. Mixed-input interpretation',
    methodsWorkflowText:
      'For the preset workflow, AM wt%, SE wt%, CNF wt%, and PTFE wt% are all direct total-solid inputs. Their sum should be 100 wt%. Porosity ε defines the solid fraction as 1 - ε.',
    methodsMassBalance: '2. wt% to vol% conversion',
    methodsAccessible: '3. Accessible volume and effective concentration',
    methodsThresholds: '4. Percolation threshold model',
    methodsProbability: '5. Probability and conductivity',
    methodsInverse: '6. Inverse solver',
    methodsConditions: '7. Model conditions and interpretation',
    methodsCondition1:
      'Percolation is evaluated in converted volume fraction, not directly in wt%.',
    methodsCondition2:
      'P0 and sigma0 are empirical fitting parameters; changing them can strongly change the result.',
    methodsCondition3:
      'The segregated model assumes large AM particles confine CNF into a reduced accessible region.',
    methodsCondition4:
      'The accessible-volume rule determines whether CNF is excluded only from AM, from AM+SE, or from neither.',
    methodsCondition5:
      'The capped probability shown in the result is P = min(Praw, 1).',
    methodsCondition6:
      'The inverse solvers find minimum CNF wt% and minimum PTFE wt% that each reach the chosen target probability, then report derived vol% values too.',
    references: 'Reference notes',
    referencesText:
      'This implementation follows a continuum/segregated percolation workflow: lab inputs in wt%, percolation scaling in converted vol%, segregated threshold lowered by particle-size ratio, and probability/conductivity scaled above threshold.',
    selectedEquation: 'Selected equation explanation',
    whyThisEquation: 'Why this equation exists',
    howToReadIt: 'How to read it',
    validityConditions: 'When this is valid',
    variables: 'Variables',
    probabilityCurve: 'Probability curve for the current case',
    probabilityCurveText:
      'This visual shows how capped percolation probability changes as CNF wt% changes while the other current assumptions stay fixed.',
    currentPoint: 'Current input',
    targetPoint: 'Target probability solution',
  },
  ko: {
    eyebrow: '이중언어 퍼콜레이션 계산기',
    title: '모든 가정을 드러내는 고체전해질 전극 네트워크 계산기.',
    subtitle:
      'CNF/PTFE 시나리오를 비교하고, 도출 과정을 검토하고, 목표 확률을 위한 최소 도전재 함량을 역산합니다.',
    loadPreset: '프리셋 불러오기',
    customCase: '사용자 정의 케이스',
    copySummary: '영문/국문 요약 복사',
    copied: '요약을 복사했습니다.',
    copyFailed: '클립보드 접근에 실패했습니다.',
    inputs: '입력',
    caseSetup: '케이스 설정',
    mode: '조성 입력 방식',
    composition: '조성',
    densities: '밀도 (g/cm³)',
    geometry: '기하학 입력',
    assumptions: '모델 가정',
    results: '결과',
    comparison: '프리셋 비교',
    methods: '사용한 식과 모델 조건',
    equationView: '수식 표시 방식',
    equationCode: '코드형 보기',
    equationBook: '수학책형 보기',
    derivation: '도출 과정',
    warnings: '경고 및 참고',
    binder: '선택형 PTFE 네트워크 패널',
    activeThreshold: '활성 임계값',
    vAvailable: '가용 부피',
    veff: '유효 도전재 농도',
    probability: '퍼콜레이션 확률',
    probabilityRaw: '보정 전 확률',
    conductivity: '전도도 수준',
    minCnfWt: '목표 P를 위한 최소 CNF(wt%)',
    minCnfVol: '최소 CNF vol%',
    networkModel: '활성 네트워크 모델',
    thresholdMode: '임계값 계산 방식',
    accessibleRule: 'CNF 가용부피 규칙',
    binderRule: 'PTFE 가용부피 규칙',
    targetProbability: '목표 확률',
    beta: '베타 지수',
    t: '전도도 지수',
    p0: 'P0 경험 계수',
    sigma0: 'Sigma0 계수 (S/m)',
    vthIdeal: 'Vth,ideal',
    directRandom: '직접 입력 Vth random',
    directSegregated: '직접 입력 Vth segregated',
    cnfAspectRatio: 'CNF 종횡비',
    ptfeAspectRatio: 'PTFE 종횡비',
    amParticle: '활물질 입경 (µm)',
    seParticle: '고체전해질 입경 (µm)',
    additiveSize: '도전재 직경 / 크기 (µm)',
    amDensity: '활물질 밀도',
    seDensity: '고체전해질 밀도',
    cnfDensity: 'CNF 밀도',
    ptfeDensity: 'PTFE 밀도',
    porosity: '기공도',
    cnfVol: 'CNF vol%',
    ptfeWt: 'PTFE wt%',
    seMatrixWt: 'SE wt% (전체 고형분 기준)',
    amVol: '활물질 vol%',
    seVol: '고체전해질 vol%',
    ptfeVol: 'PTFE vol%',
    amWt: '활물질 wt%',
    seWt: 'SE wt% (전체 고형분 기준)',
    cnfWt: 'CNF wt%',
    sum: '합계',
    summaryNote:
      '프리셋 해석: 활물질, SE, CNF, PTFE를 모두 전체 고형분 기준 wt%로 직접 입력합니다. 앱은 이 wt%를 부피분율로 변환한 뒤 퍼콜레이션을 계산합니다.',
    tableComponent: '성분',
    tableVolume: 'Vol%',
    tableWeight: 'Wt%',
    tableMass: '질량 기준',
    randomVth: 'Vth random',
    segregatedVth: 'Vth segregated',
    currentCase: '현재 케이스',
    formula: '수식',
    substitution: '대입',
    value: '값',
    caseName: '케이스',
    binderProbability: 'PTFE 확률',
    binderVeff: 'PTFE Veff',
    binderThreshold: 'PTFE 활성 Vth',
    unreachable: '현재 모델 범위에서는 도달 불가',
    methodsIntro:
      '아래 식이 이 앱에서 실제로 사용되는 계산식입니다. 혼합 입력 워크플로는 wt% 입력을 먼저 밀도로 vol%로 변환한 뒤, 그 부피분율에 퍼콜레이션 모델을 적용합니다.',
    methodsWorkflow: '1. 혼합 입력 해석',
    methodsWorkflowText:
      '프리셋 워크플로에서 활물질 wt%, SE wt%, CNF wt%, PTFE wt%는 모두 전체 고형분 기준 직접 입력값입니다. 이들의 합은 100 wt%가 되어야 합니다. 기공도 ε는 고형분 부피를 1 - ε로 정의합니다.',
    methodsMassBalance: '2. wt%에서 vol%로 변환',
    methodsAccessible: '3. 가용 부피와 유효 농도',
    methodsThresholds: '4. 퍼콜레이션 임계값 모델',
    methodsProbability: '5. 확률과 전도도',
    methodsInverse: '6. 최소 CNF 역산',
    methodsConditions: '7. 모델 조건과 해석',
    methodsCondition1:
      '퍼콜레이션 평가는 wt%가 아니라 변환된 부피분율 기준으로 수행됩니다.',
    methodsCondition2:
      'P0와 sigma0는 경험적 피팅 계수이므로, 값이 바뀌면 결과가 크게 달라질 수 있습니다.',
    methodsCondition3:
      '세그리게이트 모델은 큰 활물질 입자가 CNF를 더 작은 가용 영역으로 밀어 넣는다고 가정합니다.',
    methodsCondition4:
      '가용부피 규칙은 CNF가 활물질만 피하는지, 활물질+고체전해질을 모두 피하는지, 혹은 전체 부피를 쓰는지 결정합니다.',
    methodsCondition5:
      '결과 화면의 최종 확률은 P = min(Praw, 1)로 제한된 값입니다.',
    methodsCondition6:
      '역산기는 선택한 목표 확률에 도달하는 최소 CNF wt%를 찾고, 함께 해당 vol%도 보고합니다.',
    references: '참고 메모',
    referencesText:
      '이 구현은 연속체/세그리게이트 퍼콜레이션 워크플로를 따릅니다. 실험 입력은 wt%로 받고, 퍼콜레이션 스케일링은 변환된 vol%로 계산하며, 세그리게이트 임계값은 입경비로 낮아지고, 임계점 이상에서 확률/전도도를 스케일링합니다.',
    selectedEquation: '선택한 식 설명',
    whyThisEquation: '왜 이 식을 쓰는가',
    howToReadIt: '어떻게 읽어야 하는가',
    validityConditions: '이 식이 유효한 조건',
    variables: '변수 설명',
    probabilityCurve: '현재 케이스의 확률 곡선',
    probabilityCurveText:
      '이 그래프는 현재 다른 가정을 고정한 상태에서 CNF wt%가 변할 때 capped percolation probability가 어떻게 바뀌는지 보여줍니다.',
    currentPoint: '현재 입력값',
    targetPoint: '목표 확률 해',
  },
} as const

type EquationView = 'code' | 'book'

type EquationVariable = {
  symbol: string
  meaning: string
}

type EquationEntry = {
  id: string
  code: string
  pretty: ReactNode
  summary: string
  explanation: string
  conditions: string
  variables: EquationVariable[]
}

type EquationSection = {
  title: string
  description?: string
  equations: EquationEntry[]
}

type WalkthroughStep = {
  title: string
  description: string
  equation: string
  value: string
}

type TransportTab = 'ec' | 'ic' | 'ecic'

type IBranchResult = {
  vAvailable: number
  veff: number
  diff: number
  pRaw: number
  pCapped: number
  sigma: number
  thresholds: {
    random: number
    segregated: number
    active: number
  }
  inverse: {
    minSeWeightFraction: number | null
    minSeVolFraction: number | null
  }
}

type DualRecommendation = {
  feasible: boolean
  amWeightFraction: number
  seWeightFraction: number
  cnfWeightFraction: number
  ptfeWeightFraction: number
  ecProbability: number
  icProbability: number
}

type PtfeModelMode =
  | 'fibril_segregated'
  | 'particle_random'
  | 'fibril_random'
  | 'fibril_am_se_excluded'

type PtfeModelSpec = {
  label: Record<Locale, string>
  short: Record<Locale, string>
  description: Record<Locale, string>
  networkModel: ModelAssumptions['networkModel']
  binderRule: AccessibleVolumeRule
  vthScale: number
}

type CnfRuleSpec = {
  label: Record<Locale, string>
  description: Record<Locale, string>
  availableExpression: string
}

const ptfeModelSpecs: Record<PtfeModelMode, PtfeModelSpec> = {
  fibril_segregated: {
    label: {
      en: 'Fibril + Segregated',
      ko: 'Fibril + Segregated',
    },
    short: {
      en: 'Default',
      ko: '기본',
    },
    description: {
      en: 'PTFE is treated as fibrils that connect along a segregated network path with full-electrode PTFE access.',
      ko: 'PTFE를 fibril로 보고, 전극 골격 경로를 따라 segregated 네트워크를 형성한다고 가정합니다.',
    },
    networkModel: 'segregated',
    binderRule: 'full_electrode',
    vthScale: 1,
  },
  particle_random: {
    label: {
      en: 'Particle + Random',
      ko: 'Particle + Random',
    },
    short: {
      en: 'Conservative',
      ko: '보수적',
    },
    description: {
      en: 'PTFE is treated as particle-like random dispersion. This branch applies PTFE Vth,ideal = 3 × base to be conservative.',
      ko: 'PTFE를 입자형 무작위 분산으로 가정한 보수 모델입니다. PTFE Vth,ideal을 기본값 대비 3배로 적용합니다.',
    },
    networkModel: 'random',
    binderRule: 'full_electrode',
    vthScale: 3,
  },
  fibril_random: {
    label: {
      en: 'Fibril + Random',
      ko: 'Fibril + Random',
    },
    short: {
      en: 'Middle',
      ko: '중간',
    },
    description: {
      en: 'PTFE keeps fibril geometry, but the network is random without segregated concentration gain.',
      ko: 'PTFE 형상은 fibril로 유지하되, 네트워크는 random으로 가정합니다.',
    },
    networkModel: 'random',
    binderRule: 'full_electrode',
    vthScale: 1,
  },
  fibril_am_se_excluded: {
    label: {
      en: 'Fibril + AM+SE Excluded',
      ko: 'Fibril + AM+SE Excluded',
    },
    short: {
      en: 'Reduced space',
      ko: '축소 공간',
    },
    description: {
      en: 'PTFE keeps fibril geometry and uses only the AM+SE excluded interstitial space for accessible volume.',
      ko: 'PTFE 형상은 fibril로 유지하고, AM+SE 제외 공간만 PTFE 가용부피로 사용하는 모델입니다.',
    },
    networkModel: 'segregated',
    binderRule: 'exclude_am_se',
    vthScale: 1,
  },
}

const cnfAccessibleRuleSpecs: Record<AccessibleVolumeRule, CnfRuleSpec> = {
  full_electrode: {
    label: {
      en: 'Full electrode',
      ko: '전극 전체 기준',
    },
    description: {
      en: 'CNF is assumed to disperse across the whole electrode volume (random baseline).',
      ko: 'CNF가 전극 전체 부피에 분산된다고 가정하는 가장 단순한 baseline 모델입니다.',
    },
    availableExpression: 'Vavailable = 1',
  },
  exclude_am: {
    label: {
      en: 'Exclude AM only',
      ko: 'AM만 제외',
    },
    description: {
      en: 'CNF cannot enter AM particles, so it occupies only non-AM space.',
      ko: 'CNF가 활물질(AM) 내부에는 존재하지 못한다고 보고, AM을 제외한 공간만 가용 공간으로 둡니다.',
    },
    availableExpression: 'Vavailable = 1 - VAM',
  },
  exclude_am_se: {
    label: {
      en: 'Exclude AM + SE',
      ko: 'AM+SE 제외',
    },
    description: {
      en: 'CNF is confined to AM/SE interstitial space (strong segregated-concentration assumption).',
      ko: 'CNF가 AM/SE 입자 사이의 좁은 간극에만 존재한다고 가정하는 강한 segregated 모델입니다.',
    },
    availableExpression: 'Vavailable = 1 - VAM - VSE',
  },
}

type FieldProps = {
  label: string
  value: number
  onChange: (next: number) => void
  step?: string
  percent?: boolean
  min?: number
  max?: number
  readOnly?: boolean
}

function NumberField({
  label,
  value,
  onChange,
  step = '0.01',
  percent = false,
  min,
  max,
  readOnly = false,
}: FieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        value={percent ? (value * 100).toString() : value.toString()}
        step={step}
        min={min}
        max={max}
        readOnly={readOnly}
        onChange={(event) => {
          const parsed = Number(event.target.value)
          if (!readOnly && !Number.isNaN(parsed)) {
            onChange(percent ? parsed / 100 : parsed)
          }
        }}
      />
    </label>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (next: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function ResultCard({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: string
  tone?: 'default' | 'accent'
}) {
  return (
    <div className={`result-card result-card--${tone}`}>
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  )
}

function EquationBlock({
  title,
  description,
  equations,
  view,
  selectedEquationId,
  onSelect,
}: {
  title: string
  description?: string
  equations: EquationEntry[]
  view: EquationView
  selectedEquationId: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="equation-block">
      <div>
        <h3>{title}</h3>
        {description ? <p>{description}</p> : null}
      </div>
      <div className="equation-list">
        {equations.map((equation) => (
          <button
            key={equation.id}
            className={`equation-button ${
              selectedEquationId === equation.id ? 'active' : ''
            }`}
            onClick={() => onSelect(equation.id)}
            aria-pressed={selectedEquationId === equation.id}
          >
            <div className={view === 'code' ? 'equation-code' : 'equation-pretty'}>
              {view === 'code' ? <code>{equation.code}</code> : equation.pretty}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function BookEquation({
  lhs,
  rhs,
  note,
}: {
  lhs: ReactNode
  rhs: ReactNode
  note?: ReactNode
}) {
  return (
    <div className="math-line">
      <span className="math-lhs">{lhs}</span>
      <span className="math-equals">=</span>
      <span className="math-rhs">{rhs}</span>
      {note ? <span className="math-note">{note}</span> : null}
    </div>
  )
}

function ProbabilityCurve({
  points,
  currentX,
  currentY,
  targetX,
  targetY,
  xLabel,
  yLabel,
}: {
  points: Array<{ x: number; y: number }>
  currentX: number
  currentY: number
  targetX?: number
  targetY?: number
  xLabel: string
  yLabel: string
}) {
  const width = 720
  const height = 260
  const margin = { top: 24, right: 20, bottom: 42, left: 54 }
  const maxX = Math.max(...points.map((point) => point.x), currentX, targetX ?? 0.05)
  const xScale = (value: number) =>
    margin.left + (value / Math.max(maxX, 1e-6)) * (width - margin.left - margin.right)
  const yScale = (value: number) =>
    height - margin.bottom - value * (height - margin.top - margin.bottom)
  const path = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${xScale(point.x)} ${yScale(point.y)}`)
    .join(' ')

  return (
    <div className="curve-card">
      <svg viewBox={`0 0 ${width} ${height}`} className="curve-svg" role="img">
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
          <g key={tick}>
            <line
              x1={margin.left}
              x2={width - margin.right}
              y1={yScale(tick)}
              y2={yScale(tick)}
              className="curve-grid"
            />
            <text x={margin.left - 10} y={yScale(tick) + 4} className="curve-axis-label">
              {tick.toFixed(2)}
            </text>
          </g>
        ))}
        <line
          x1={margin.left}
          x2={width - margin.right}
          y1={height - margin.bottom}
          y2={height - margin.bottom}
          className="curve-axis"
        />
        <line
          x1={margin.left}
          x2={margin.left}
          y1={margin.top}
          y2={height - margin.bottom}
          className="curve-axis"
        />
        <path d={path} className="curve-path" />
        <line
          x1={xScale(currentX)}
          x2={xScale(currentX)}
          y1={margin.top}
          y2={height - margin.bottom}
          className="curve-marker curve-marker--current"
        />
        <circle cx={xScale(currentX)} cy={yScale(currentY)} r={5} className="curve-dot curve-dot--current" />
        {targetX !== undefined && targetY !== undefined ? (
          <>
            <line
              x1={xScale(targetX)}
              x2={xScale(targetX)}
              y1={margin.top}
              y2={height - margin.bottom}
              className="curve-marker curve-marker--target"
            />
            <circle cx={xScale(targetX)} cy={yScale(targetY)} r={5} className="curve-dot curve-dot--target" />
          </>
        ) : null}
        <text x={width / 2} y={height - 8} className="curve-axis-title">
          {xLabel}
        </text>
        <text
          x={18}
          y={height / 2}
          className="curve-axis-title"
          transform={`rotate(-90 18 ${height / 2})`}
        >
          {yLabel}
        </text>
      </svg>
    </div>
  )
}

type ReverseSeMode = 'fixed' | 'optimize'

type ReverseDesignConfig = {
  fixedPtfeWeightFraction: number
  targetProbability: number
  porosity: number
  seMode: ReverseSeMode
  fixedSeWeightFraction: number
  seRangeMin: number
  seRangeMax: number
  seStep: number
  ptfeRangeMin: number
  ptfeRangeMax: number
  cnfRangeMin: number
  cnfRangeMax: number
  cnfStep: number
}

type ReverseDesignCandidate = {
  amWeightFraction: number
  seWeightFraction: number
  cnfWeightFraction: number
  ptfeWeightFraction: number
  additiveFraction: number
  margin: number
  calculation: CalculationResult
}

type ReverseDesignResult = {
  best: ReverseDesignCandidate | null
  evaluatedCount: number
  feasibleCount: number
  fixedPtfeApplied: number
  warnings: string[]
}

type ReversePhasePoint = {
  cnfWeightFraction: number
  ptfeWeightFraction: number
  probability: number | null
  feasible: boolean
}

type ReversePhaseMapData = {
  points: ReversePhasePoint[]
  cnfValues: number[]
  ptfeValues: number[]
  contour: Array<{ cnfWeightFraction: number; ptfeWeightFraction: number }>
}

const createRange = (min: number, max: number, step: number): number[] => {
  const safeStep = Math.max(step, 1e-6)
  const start = Math.min(min, max)
  const end = Math.max(min, max)
  const values: number[] = []
  let current = start
  let guard = 0
  while (current <= end + 1e-12 && guard < 20000) {
    values.push(Number(current.toFixed(6)))
    current += safeStep
    guard += 1
  }
  if (values.length === 0 || Math.abs(values[values.length - 1] - end) > 1e-6) {
    values.push(Number(end.toFixed(6)))
  }
  return values
}

const buildReverseDesignCase = (
  id: string,
  config: ReverseDesignConfig,
  weights: {
    am: number
    se: number
    cnf: number
    ptfe: number
  },
): CaseInput => ({
  id,
  label: {
    en: 'Reverse design candidate',
    ko: '역설계 후보',
  },
  mode: 'presetMixed',
  porosity: config.porosity,
  amWeightFraction: weights.am,
  seWeightFraction: weights.se,
  cnfWeightFraction: weights.cnf,
  ptfeWeightFraction: weights.ptfe,
})

const runReverseDesign = (
  config: ReverseDesignConfig,
  densities: DensitySet,
  geometry: GeometryInput,
  assumptions: ModelAssumptions,
): ReverseDesignResult => {
  const warnings: string[] = []
  const fixedPtfeApplied = clamp(
    config.fixedPtfeWeightFraction,
    config.ptfeRangeMin,
    config.ptfeRangeMax,
  )

  if (Math.abs(fixedPtfeApplied - config.fixedPtfeWeightFraction) > 1e-8) {
    warnings.push('PTFE input was clamped to the configured practical PTFE range.')
  }

  const forcedAssumptions: ModelAssumptions = {
    ...assumptions,
    targetProbability: config.targetProbability,
    networkModel: 'segregated',
    accessibleVolumeRule: 'exclude_am_se',
    binderAccessibleVolumeRule: 'full_electrode',
  }

  const seValues =
    config.seMode === 'fixed'
      ? [config.fixedSeWeightFraction]
      : createRange(config.seRangeMin, config.seRangeMax, config.seStep)
  const cnfValues = createRange(config.cnfRangeMin, config.cnfRangeMax, config.cnfStep)

  let best: ReverseDesignCandidate | null = null
  let evaluatedCount = 0
  let feasibleCount = 0

  seValues.forEach((seWeightFraction) => {
    cnfValues.forEach((cnfWeightFraction) => {
      const amWeightFraction = 1 - seWeightFraction - cnfWeightFraction - fixedPtfeApplied
      if (amWeightFraction < 0) {
        return
      }

      const candidateInput = buildReverseDesignCase('reverse-design-candidate', config, {
        am: amWeightFraction,
        se: seWeightFraction,
        cnf: cnfWeightFraction,
        ptfe: fixedPtfeApplied,
      })

      const candidateCalculation = calculateCase(
        candidateInput,
        densities,
        geometry,
        forcedAssumptions,
      )
      evaluatedCount += 1

      if (candidateCalculation.probability.pCapped < config.targetProbability) {
        return
      }

      feasibleCount += 1
      const candidate: ReverseDesignCandidate = {
        amWeightFraction,
        seWeightFraction,
        cnfWeightFraction,
        ptfeWeightFraction: fixedPtfeApplied,
        additiveFraction: cnfWeightFraction + fixedPtfeApplied,
        margin: candidateCalculation.probability.diff,
        calculation: candidateCalculation,
      }

      if (!best) {
        best = candidate
        return
      }

      const additiveDelta = candidate.additiveFraction - best.additiveFraction
      if (additiveDelta < -1e-9) {
        best = candidate
        return
      }
      if (Math.abs(additiveDelta) <= 1e-9) {
        if (candidate.cnfWeightFraction < best.cnfWeightFraction - 1e-9) {
          best = candidate
          return
        }
        if (
          Math.abs(candidate.cnfWeightFraction - best.cnfWeightFraction) <= 1e-9 &&
          candidate.margin > best.margin + 1e-9
        ) {
          best = candidate
        }
      }
    })
  })

  if (!best) {
    warnings.push('No feasible candidate was found within the configured CNF/PTFE/SE ranges.')
  }

  return {
    best,
    evaluatedCount,
    feasibleCount,
    fixedPtfeApplied,
    warnings,
  }
}

const buildReversePhaseMap = (
  config: ReverseDesignConfig,
  seWeightFraction: number,
  densities: DensitySet,
  geometry: GeometryInput,
  assumptions: ModelAssumptions,
): ReversePhaseMapData => {
  const forcedAssumptions: ModelAssumptions = {
    ...assumptions,
    targetProbability: config.targetProbability,
    networkModel: 'segregated',
    accessibleVolumeRule: 'exclude_am_se',
    binderAccessibleVolumeRule: 'full_electrode',
  }

  const cnfStep = Math.max((config.cnfRangeMax - config.cnfRangeMin) / 24, 1e-4)
  const ptfeStep = Math.max((config.ptfeRangeMax - config.ptfeRangeMin) / 20, 1e-4)
  const cnfValues = createRange(config.cnfRangeMin, config.cnfRangeMax, cnfStep)
  const ptfeValues = createRange(config.ptfeRangeMin, config.ptfeRangeMax, ptfeStep)

  const points: ReversePhasePoint[] = []
  const contour: Array<{ cnfWeightFraction: number; ptfeWeightFraction: number }> = []

  ptfeValues.forEach((ptfeWeightFraction) => {
    let contourCandidate: number | null = null
    cnfValues.forEach((cnfWeightFraction) => {
      const amWeightFraction = 1 - seWeightFraction - cnfWeightFraction - ptfeWeightFraction
      if (amWeightFraction < 0) {
        points.push({
          cnfWeightFraction,
          ptfeWeightFraction,
          probability: null,
          feasible: false,
        })
        return
      }

      const caseInput = buildReverseDesignCase('reverse-map-candidate', config, {
        am: amWeightFraction,
        se: seWeightFraction,
        cnf: cnfWeightFraction,
        ptfe: ptfeWeightFraction,
      })
      const calculation = calculateCase(caseInput, densities, geometry, forcedAssumptions)
      const probability = calculation.probability.pCapped
      const feasible = probability >= config.targetProbability
      points.push({
        cnfWeightFraction,
        ptfeWeightFraction,
        probability,
        feasible,
      })
      if (feasible && contourCandidate === null) {
        contourCandidate = cnfWeightFraction
      }
    })
    if (contourCandidate !== null) {
      contour.push({
        cnfWeightFraction: contourCandidate,
        ptfeWeightFraction,
      })
    }
  })

  return {
    points,
    cnfValues,
    ptfeValues,
    contour,
  }
}

const phaseMapColor = (probability: number | null, targetProbability: number) => {
  if (probability === null) {
    return 'rgba(34, 46, 38, 0.08)'
  }
  const clamped = clamp(probability, 0, 1)
  if (clamped >= targetProbability) {
    return `rgba(52, 127, 94, ${0.2 + 0.6 * clamped})`
  }
  return `rgba(241, 113, 56, ${0.14 + 0.5 * clamped})`
}

function ReversePhaseMap({
  data,
  targetProbability,
  locale,
}: {
  data: ReversePhaseMapData
  targetProbability: number
  locale: Locale
}) {
  const width = 760
  const height = 360
  const margin = { top: 24, right: 18, bottom: 52, left: 66 }
  const plotWidth = width - margin.left - margin.right
  const plotHeight = height - margin.top - margin.bottom
  const cnfMin = data.cnfValues[0] ?? 0
  const cnfMax = data.cnfValues[data.cnfValues.length - 1] ?? 1
  const ptfeMin = data.ptfeValues[0] ?? 0
  const ptfeMax = data.ptfeValues[data.ptfeValues.length - 1] ?? 1
  const xScale = (value: number) =>
    margin.left + ((value - cnfMin) / Math.max(cnfMax - cnfMin, 1e-9)) * plotWidth
  const yScale = (value: number) =>
    margin.top + (1 - (value - ptfeMin) / Math.max(ptfeMax - ptfeMin, 1e-9)) * plotHeight
  const cellWidth = plotWidth / Math.max(data.cnfValues.length, 1)
  const cellHeight = plotHeight / Math.max(data.ptfeValues.length, 1)
  const contourPath = data.contour
    .map((point, index) =>
      `${index === 0 ? 'M' : 'L'} ${xScale(point.cnfWeightFraction)} ${yScale(point.ptfeWeightFraction)}`,
    )
    .join(' ')

  const legendText =
    locale === 'en'
      ? `Green region: P ≥ ${fmtPercent(targetProbability)}`
      : `초록 영역: P ≥ ${fmtPercent(targetProbability)}`

  return (
    <div className="phase-map-card">
      <svg viewBox={`0 0 ${width} ${height}`} className="phase-map-svg" role="img">
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
          const y = margin.top + (1 - tick) * plotHeight
          return (
            <g key={tick}>
              <line
                x1={margin.left}
                x2={width - margin.right}
                y1={y}
                y2={y}
                className="curve-grid"
              />
            </g>
          )
        })}
        {data.points.map((point) => (
          <g key={`${point.cnfWeightFraction}-${point.ptfeWeightFraction}`}>
            <rect
              x={xScale(point.cnfWeightFraction) - cellWidth / 2}
              y={yScale(point.ptfeWeightFraction) - cellHeight / 2}
              width={cellWidth + 0.4}
              height={cellHeight + 0.4}
              fill={phaseMapColor(point.probability, targetProbability)}
              className={point.feasible ? 'phase-map-cell--feasible' : 'phase-map-cell'}
            />
          </g>
        ))}
        {contourPath ? <path d={contourPath} className="phase-map-contour" /> : null}
        <line
          x1={margin.left}
          x2={width - margin.right}
          y1={height - margin.bottom}
          y2={height - margin.bottom}
          className="curve-axis"
        />
        <line
          x1={margin.left}
          x2={margin.left}
          y1={margin.top}
          y2={height - margin.bottom}
          className="curve-axis"
        />
        {[cnfMin, (cnfMin + cnfMax) / 2, cnfMax].map((tick) => (
          <text
            key={`x-${tick}`}
            x={xScale(tick)}
            y={height - margin.bottom + 18}
            textAnchor="middle"
            className="curve-axis-label"
          >
            {fmtPercent(tick)}
          </text>
        ))}
        {[ptfeMin, (ptfeMin + ptfeMax) / 2, ptfeMax].map((tick) => (
          <text
            key={`y-${tick}`}
            x={margin.left - 10}
            y={yScale(tick) + 4}
            textAnchor="end"
            className="curve-axis-label"
          >
            {fmtPercent(tick)}
          </text>
        ))}
        <text x={width / 2} y={height - 12} className="curve-axis-title">
          {locale === 'en' ? 'CNF wt%' : 'CNF wt%'}
        </text>
        <text
          x={18}
          y={height / 2}
          className="curve-axis-title"
          transform={`rotate(-90 18 ${height / 2})`}
        >
          {locale === 'en' ? 'PTFE wt%' : 'PTFE wt%'}
        </text>
      </svg>
      <p className="phase-map-legend">{legendText}</p>
    </div>
  )
}

const cloneCase = (input: CaseInput): CaseInput => JSON.parse(JSON.stringify(input))

type ScrollDirection = 'up' | 'down'

type ScrollNavState = {
  scrollTop: number
  scrollProgress: number
  direction: ScrollDirection
  isAtTop: boolean
  isAtBottom: boolean
  isMobile: boolean
  isScrollable: boolean
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const RAIL_LONG_PRESS_MS = 500

function App() {
  const [locale, setLocale] = useState<Locale>('en')
  const [currentInput, setCurrentInput] = useState<CaseInput>(presetCases[0].input)
  const [densities, setDensities] = useState<DensitySet>(defaultDensities)
  const [geometry, setGeometry] = useState<GeometryInput>(defaultGeometry)
  const [assumptions, setAssumptions] = useState<ModelAssumptions>(defaultModelAssumptions)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle')
  const [equationView, setEquationView] = useState<EquationView>('book')
  const [transportTab, setTransportTab] = useState<TransportTab>('ec')
  const [ptfeModelMode, setPtfeModelMode] = useState<PtfeModelMode>('fibril_segregated')
  const [reverseDesignConfig, setReverseDesignConfig] = useState<ReverseDesignConfig>({
    fixedPtfeWeightFraction: 0.02,
    targetProbability: 0.9999,
    porosity: 0.09,
    seMode: 'fixed',
    fixedSeWeightFraction: 0.24,
    seRangeMin: 0.21,
    seRangeMax: 0.35,
    seStep: 0.01,
    ptfeRangeMin: 0.005,
    ptfeRangeMax: 0.02,
    cnfRangeMin: 0.002,
    cnfRangeMax: 0.02,
    cnfStep: 0.0005,
  })
  const [selectedEquationId, setSelectedEquationId] = useState('workflow-solid')
  const [scrollNav, setScrollNav] = useState<ScrollNavState>({
    scrollTop: 0,
    scrollProgress: 0,
    direction: 'down',
    isAtTop: true,
    isAtBottom: false,
    isMobile: false,
    isScrollable: false,
  })

  const scrollRafRef = useRef<number | null>(null)
  const previousScrollTopRef = useRef(0)
  const railTrackRef = useRef<HTMLButtonElement | null>(null)
  const railLongPressTimerRef = useRef<number | null>(null)
  const railDragActiveRef = useRef(false)
  const railPointerIdRef = useRef<number | null>(null)
  const railStartClientYRef = useRef(0)
  const [isRailDragging, setIsRailDragging] = useState(false)
  const [railDragProgress, setRailDragProgress] = useState<number | null>(null)

  const deferredInput = useDeferredValue(currentInput)
  const deferredDensities = useDeferredValue(densities)
  const deferredGeometry = useDeferredValue(geometry)
  const deferredAssumptions = useDeferredValue(assumptions)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const updateScrollNav = () => {
      const documentElement = document.documentElement
      const scrollTop = Math.max(window.scrollY || documentElement.scrollTop || 0, 0)
      const maxScroll = Math.max(documentElement.scrollHeight - window.innerHeight, 0)
      const isScrollable = maxScroll > 2
      const progress = isScrollable ? clamp(scrollTop / maxScroll, 0, 1) : 0
      const isAtTop = scrollTop <= 2
      const isAtBottom = !isScrollable || scrollTop >= maxScroll - 2
      const rawDirection: ScrollDirection =
        scrollTop > previousScrollTopRef.current
          ? 'down'
          : scrollTop < previousScrollTopRef.current
            ? 'up'
            : 'down'
      const isMobile = window.matchMedia('(max-width: 720px)').matches

      previousScrollTopRef.current = scrollTop

      setScrollNav((previous) => {
        const direction = rawDirection === 'down' && scrollTop === previous.scrollTop
          ? previous.direction
          : rawDirection

        if (
          previous.scrollTop === scrollTop &&
          previous.scrollProgress === progress &&
          previous.direction === direction &&
          previous.isAtTop === isAtTop &&
          previous.isAtBottom === isAtBottom &&
          previous.isMobile === isMobile &&
          previous.isScrollable === isScrollable
        ) {
          return previous
        }

        return {
          scrollTop,
          scrollProgress: progress,
          direction,
          isAtTop,
          isAtBottom,
          isMobile,
          isScrollable,
        }
      })
    }

    const scheduleUpdate = () => {
      if (scrollRafRef.current !== null) {
        return
      }

      scrollRafRef.current = window.requestAnimationFrame(() => {
        scrollRafRef.current = null
        updateScrollNav()
      })
    }

    updateScrollNav()
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)

    return () => {
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
      if (scrollRafRef.current !== null) {
        window.cancelAnimationFrame(scrollRafRef.current)
      }
    }
  }, [])

  const text = textByLocale[locale]
  const transportTabLabel =
    locale === 'en'
      ? { ec: 'EC', ic: 'IC', ecic: 'EC + IC' }
      : { ec: '전자전도(EC)', ic: '이온전도(IC)', ecic: '통합(EC+IC)' }
  const ionicResultsLabel =
    locale === 'en'
      ? 'Ionic transport results (SE network)'
      : '이온전도 결과 (SE 네트워크)'
  const dualResultsLabel =
    locale === 'en'
      ? 'Integrated EC + IC recommendation'
      : 'EC + IC 통합 추천 결과'
  const minSeWtLabel =
    locale === 'en' ? 'Minimum SE(wt%) for target P' : '목표 P를 위한 최소 SE(wt%)'
  const minSeVolLabel =
    locale === 'en' ? 'Minimum SE vol%' : '최소 SE vol%'

  const ptfeModelLabel = locale === 'en' ? 'PTFE model selector' : 'PTFE 모델 선택'
  const ptfeComparisonJumpLabel = locale === 'en' ? '*Comparison' : '*비교 보기'
  const cnfComparisonSectionTitle =
    locale === 'en'
      ? 'CNF accessible-volume model comparison'
      : 'CNF 가용부피 모델 비교'
  const cnfComparisonSectionSubtitle =
    locale === 'en'
      ? 'This panel explains why CNF minimum loading changes when available-volume assumptions change (Full electrode vs Exclude AM vs Exclude AM+SE).'
      : 'CNF 최소 필요량이 가용부피 가정(전극 전체 / AM 제외 / AM+SE 제외)에 따라 왜 달라지는지 비교합니다.'
  const cnfComparisonModelHeader = locale === 'en' ? 'CNF model' : 'CNF 모델'
  const cnfComparisonAssumptionHeader =
    locale === 'en' ? 'Assumption summary' : '가정 요약'
  const cnfComparisonAvailableHeader =
    locale === 'en' ? 'Available-volume rule' : '가용부피 식'
  const cnfComparisonProbabilityHeader =
    locale === 'en' ? 'Percolation probability' : '퍼콜레이션 확률'
  const cnfComparisonConductivityHeader =
    locale === 'en' ? 'Conductivity level' : '전도도 수준'
  const ptfeComparisonSectionTitle =
    locale === 'en'
      ? 'PTFE model comparison (why minima differ)'
      : 'PTFE 모델 비교 (최소분율이 달라지는 이유)'
  const ptfeComparisonSectionSubtitle =
    locale === 'en'
      ? 'The same chemistry can yield different minimum PTFE values when network shape/space assumptions change.'
      : '동일 조성이라도 PTFE 네트워크 형상/가용공간 가정이 바뀌면 최소 PTFE 결과가 달라집니다.'
  const ptfeComparisonModelHeader = locale === 'en' ? 'PTFE model' : 'PTFE 모델'
  const ptfeComparisonAssumptionHeader =
    locale === 'en' ? 'Assumption summary' : '가정 요약'
  const ptfeComparisonProbabilityHeader =
    locale === 'en' ? 'PTFE probability' : 'PTFE 확률'
  const ptfeComparisonConductivityHeader =
    locale === 'en' ? 'PTFE conductivity' : 'PTFE 전도도'
  const reverseDesignTitle =
    locale === 'en'
      ? 'Reverse design optimizer (PTFE-fixed)'
      : '역설계 최적화 (PTFE 고정)'
  const reverseDesignSubtitle =
    locale === 'en'
      ? 'Fix a practical PTFE level, then find the minimum CNF and recommended AM/SE composition that still reaches the target percolation probability.'
      : '현실적인 PTFE 수준을 먼저 고정한 뒤, 목표 퍼콜레이션 확률을 만족하는 최소 CNF와 AM/SE 권장 조성을 역설계합니다.'
  const reverseFixedPtfeLabel =
    locale === 'en' ? 'Fixed PTFE wt%' : '고정 PTFE wt%'
  const reverseTargetPLabel =
    locale === 'en' ? 'Reverse-design target probability' : '역설계 목표 확률'
  const reversePorosityLabel =
    locale === 'en' ? 'Reverse-design porosity' : '역설계 기공도'
  const reverseSeModeLabel =
    locale === 'en' ? 'SE handling mode' : 'SE 처리 모드'
  const reverseFixedSeLabel =
    locale === 'en' ? 'Fixed SE wt%' : '고정 SE wt%'
  const reverseSeMinLabel =
    locale === 'en' ? 'SE min wt% (optimize mode)' : 'SE 최소 wt% (최적화 모드)'
  const reverseSeMaxLabel =
    locale === 'en' ? 'SE max wt% (optimize mode)' : 'SE 최대 wt% (최적화 모드)'
  const reverseSeStepLabel =
    locale === 'en' ? 'SE scan step' : 'SE 탐색 간격'
  const reversePtfeMinLabel =
    locale === 'en' ? 'PTFE practical min wt%' : 'PTFE 실용 최소 wt%'
  const reversePtfeMaxLabel =
    locale === 'en' ? 'PTFE practical max wt%' : 'PTFE 실용 최대 wt%'
  const reverseCnfMinLabel =
    locale === 'en' ? 'CNF practical min wt%' : 'CNF 실용 최소 wt%'
  const reverseCnfMaxLabel =
    locale === 'en' ? 'CNF practical max wt%' : 'CNF 실용 최대 wt%'
  const reverseCnfStepLabel =
    locale === 'en' ? 'CNF scan step' : 'CNF 탐색 간격'
  const reverseRecommendedLabel =
    locale === 'en' ? 'Recommended composition' : '권장 조성'
  const reverseAdditiveObjectiveLabel =
    locale === 'en' ? 'Objective: minimize CNF + PTFE' : '목표: CNF + PTFE 최소화'
  const reverseMarginLabel =
    locale === 'en' ? 'Percolation margin (Veff - Vth)' : '퍼콜레이션 여유도 (Veff - Vth)'
  const reverseFeasibleLabel =
    locale === 'en' ? 'Feasible candidates in range' : '범위 내 만족 후보 수'
  const reverseEvaluatedLabel =
    locale === 'en' ? 'Evaluated candidates' : '평가한 후보 수'
  const reverseModelLockNote =
    locale === 'en'
      ? 'Reverse-design CNF model is locked to Fiber + Segregated with CNF accessible-volume rule = Exclude AM + SE. PTFE network is evaluated as Fibril + Segregated.'
      : '역설계 CNF 모델은 Fiber + Segregated, CNF 가용부피 규칙은 Exclude AM + SE로 고정됩니다. PTFE 네트워크는 Fibril + Segregated 기준으로 해석합니다.'
  const reverseNoSolutionMessage =
    locale === 'en'
      ? 'No feasible composition was found in the configured practical ranges. Widen CNF/SE ranges or lower target P.'
      : '설정한 실용 범위 안에서 만족하는 조성을 찾지 못했습니다. CNF/SE 범위를 넓히거나 목표 P를 완화해 주세요.'
  const reverseFixedModeOption =
    locale === 'en' ? 'Fix SE wt%' : 'SE wt% 고정'
  const reverseOptimizeModeOption =
    locale === 'en' ? 'Optimize SE within range' : 'SE 범위 최적화'
  const reverseMapTitle =
    locale === 'en'
      ? 'CNF vs PTFE phase map (percolation probability)'
      : 'CNF vs PTFE 상도 (퍼콜레이션 확률)'
  const reverseMapSubtitle =
    locale === 'en'
      ? 'Contour line shows the approximate boundary where P reaches the target.'
      : '등고선은 P가 목표값에 도달하는 경계(근사)를 나타냅니다.'
  const cnfDiameterLabel =
    locale === 'en' ? 'CNF diameter / size (µm)' : 'CNF 직경 / 크기 (µm)'
  const ptfeFibrilDiameterLabel =
    locale === 'en' ? 'PTFE fibril diameter (µm)' : 'PTFE fibril 직경 (µm)'

  const equationSections: EquationSection[] = [
    {
      title: text.methodsWorkflow,
      description: text.methodsWorkflowText,
      equations: [
        {
          id: 'workflow-porosity',
          code: 'epsilon = porosity',
          pretty: <BookEquation lhs={<>ε</>} rhs={<>porosity</>} />,
          summary:
            locale === 'en'
              ? 'Defines the porosity symbol used everywhere else.'
              : '이후 모든 식에서 사용하는 기공도 기호를 정의합니다.',
          explanation:
            locale === 'en'
              ? 'Porosity is the void fraction of the electrode. Once epsilon is set, the solid volume available to AM, SE, CNF, and PTFE is 1 - epsilon.'
              : '기공도는 전극 내부 빈 공간의 분율입니다. epsilon이 정해지면 AM, SE, CNF, PTFE가 차지할 수 있는 고형분 부피는 1 - epsilon이 됩니다.',
          conditions:
            locale === 'en'
              ? 'Assumes all phase fractions are expressed on the same total-electrode basis.'
              : '모든 상 분율이 동일한 전체 전극 기준으로 표현된다고 가정합니다.',
          variables: [
            { symbol: 'ε', meaning: locale === 'en' ? 'porosity' : '기공도' },
          ],
        },
        {
          id: 'workflow-solid',
          code: 'V_solid = 1 - epsilon',
          pretty: <BookEquation lhs={<>V<sub>solid</sub></>} rhs={<>1 - ε</>} />,
          summary:
            locale === 'en'
              ? 'Turns porosity into the total solid fraction.'
              : '기공도를 전체 고형분 분율로 바꿉니다.',
          explanation:
            locale === 'en'
              ? 'The mixed-input workflow needs a fixed solid-volume budget before converting masses into volumes. This equation sets that budget.'
              : '혼합 입력 워크플로는 질량을 부피로 바꾸기 전에 전체 고형분 부피 예산이 필요합니다. 이 식이 그 기준을 정합니다.',
          conditions:
            locale === 'en'
              ? 'Valid when the electrode basis is normalized to total volume = 1.'
              : '전체 전극 부피를 1로 정규화했을 때 유효합니다.',
          variables: [
            {
              symbol: 'Vsolid',
              meaning: locale === 'en' ? 'total solid volume fraction' : '전체 고형분 부피분율',
            },
            { symbol: 'ε', meaning: locale === 'en' ? 'porosity' : '기공도' },
          ],
        },
        {
          id: 'workflow-balance',
          code: 'w_AM + w_SE + w_CNF + w_PTFE = 1',
          pretty: (
            <BookEquation
              lhs={
                <>
                  w<sub>AM</sub> + w<sub>SE</sub> + w<sub>CNF</sub> + w<sub>PTFE</sub>
                </>
              }
              rhs={<>1</>}
            />
          ),
          summary:
            locale === 'en' ? 'Closes the direct weight-fraction balance.' : '직접 중량분율 합계를 닫아 줍니다.',
          explanation:
            locale === 'en'
              ? 'In the preset workflow, all four components are direct total-solid inputs. The sum should be 1.00, or 100 wt%.'
              : '프리셋 워크플로에서는 4개 성분 모두가 전체 고형분 기준 직접 입력값입니다. 합은 1.00, 즉 100 wt%가 되어야 합니다.',
          conditions:
            locale === 'en' ? 'Best used when the four-component sum is exactly 100 wt%.' : '4개 성분 합이 정확히 100 wt%일 때 가장 해석이 명확합니다.',
          variables: [
            { symbol: 'wAM', meaning: locale === 'en' ? 'active-material weight fraction' : '활물질 중량분율' },
            { symbol: 'wSE', meaning: locale === 'en' ? 'SE weight fraction' : 'SE 중량분율' },
            { symbol: 'wCNF', meaning: locale === 'en' ? 'CNF weight fraction' : 'CNF 중량분율' },
            { symbol: 'wPTFE', meaning: locale === 'en' ? 'PTFE weight fraction' : 'PTFE 중량분율' },
          ],
        },
      ],
    },
    {
      title: text.methodsMassBalance,
      equations: [
        {
          id: 'mass-total-solid',
          code: 'M_solid = (1 - epsilon) / [w_AM/rho_AM + w_SE/rho_SE + w_CNF/rho_CNF + w_PTFE/rho_PTFE]',
          pretty: (
            <BookEquation
              lhs={<>M<sub>solid</sub></>}
              rhs={
                <>
                  (1 - ε) / [w<sub>AM</sub>/ρ<sub>AM</sub> + w<sub>SE</sub>/ρ<sub>SE</sub> + w<sub>CNF</sub>/ρ<sub>CNF</sub> + w<sub>PTFE</sub>/ρ<sub>PTFE</sub>]
                </>
              }
            />
          ),
          summary:
            locale === 'en'
              ? 'Solves the total solid mass that fits inside the available solid volume.'
              : '가용한 고형분 부피 안에 들어가는 전체 고형분 질량을 계산합니다.',
          explanation:
            locale === 'en'
              ? 'This is the main bridge between wt%-based formulation inputs and vol%-based percolation math. Once Msolid is known, each phase mass and volume follow directly.'
              : '이 식이 wt% 기반 배합 입력과 vol% 기반 퍼콜레이션 수학을 연결하는 핵심 다리입니다. Msolid가 정해지면 각 상의 질량과 부피를 바로 계산할 수 있습니다.',
          conditions:
            locale === 'en'
              ? 'Assumes the densities are constant and the phases add volumetrically.'
              : '밀도가 상수이고 각 상의 부피가 가법적으로 합쳐진다고 가정합니다.',
          variables: [
            { symbol: 'Msolid', meaning: locale === 'en' ? 'total solid mass on a unit-volume basis' : '단위 전극부피 기준 전체 고형분 질량' },
            { symbol: 'ρ', meaning: locale === 'en' ? 'density' : '밀도' },
          ],
        },
        {
          id: 'mass-phase',
          code: 'M_i = w_i * M_solid',
          pretty: <BookEquation lhs={<>M<sub>i</sub></>} rhs={<>w<sub>i</sub> · M<sub>solid</sub></>} />,
          summary:
            locale === 'en' ? 'Gets each phase mass from its weight fraction.' : '각 상의 중량분율로부터 질량을 구합니다.',
          explanation:
            locale === 'en'
              ? 'After solving the total solid mass, each phase mass is just its assigned share of that total.'
              : '전체 고형분 질량이 정해진 뒤에는 각 상 질량은 그 총량에 대한 자신의 비율만큼입니다.',
          conditions:
            locale === 'en' ? 'Requires normalized weight fractions.' : '정규화된 중량분율이 필요합니다.',
          variables: [
            { symbol: 'Mi', meaning: locale === 'en' ? 'mass of phase i' : 'i상 질량' },
            { symbol: 'wi', meaning: locale === 'en' ? 'weight fraction of phase i' : 'i상 중량분율' },
          ],
        },
        {
          id: 'mass-to-volume',
          code: 'phi_i = M_i / rho_i',
          pretty: <BookEquation lhs={<>φ<sub>i</sub></>} rhs={<>M<sub>i</sub> / ρ<sub>i</sub></>} />,
          summary:
            locale === 'en'
              ? 'Converts each phase mass into the volume fraction used by the percolation model.'
              : '각 상 질량을 퍼콜레이션 모델이 사용하는 부피분율로 변환합니다.',
          explanation:
            locale === 'en'
              ? 'This is why the app can accept CNF wt% while still using a volume-fraction threshold and scaling law.'
              : '이 식 덕분에 앱은 CNF wt%를 입력받으면서도 부피분율 기반 임계값과 스케일링 법칙을 사용할 수 있습니다.',
          conditions:
            locale === 'en' ? 'Uses the density set currently entered in the app.' : '앱에 현재 입력된 밀도 세트를 사용합니다.',
          variables: [
            { symbol: 'φi', meaning: locale === 'en' ? 'volume fraction of phase i' : 'i상 부피분율' },
            { symbol: 'ρi', meaning: locale === 'en' ? 'density of phase i' : 'i상 밀도' },
          ],
        },
      ],
    },
    {
      title: text.methodsAccessible,
      equations: [
        {
          id: 'available-am',
          code: 'V_available = 1 - phi_AM   (exclude AM only)',
          pretty: <BookEquation lhs={<>V<sub>available</sub></>} rhs={<>1 - φ<sub>AM</sub></>} note={<>exclude AM only</>} />,
          summary:
            locale === 'en' ? 'Accessible volume when CNF cannot occupy the AM interior.' : 'CNF가 활물질 내부를 차지하지 못한다고 볼 때의 가용 부피입니다.',
          explanation:
            locale === 'en'
              ? 'This is the most common segregated assumption in the current tool: AM blocks part of the space, so CNF becomes locally concentrated in the remainder.'
              : '현재 도구에서 가장 기본적인 세그리게이트 가정입니다. 활물질이 공간 일부를 막아 CNF가 남은 공간에 국부적으로 농축된다고 봅니다.',
          conditions:
            locale === 'en' ? 'Best for CNF networks concentrated around AM boundaries.' : '활물질 경계 근처에 CNF 네트워크가 집중될 때 적합합니다.',
          variables: [
            { symbol: 'Vavailable', meaning: locale === 'en' ? 'CNF-accessible volume' : 'CNF 가용 부피' },
            { symbol: 'φAM', meaning: locale === 'en' ? 'AM volume fraction' : '활물질 부피분율' },
          ],
        },
        {
          id: 'available-am-se',
          code: 'V_available = 1 - phi_AM - phi_SE   (exclude AM + SE)',
          pretty: <BookEquation lhs={<>V<sub>available</sub></>} rhs={<>1 - φ<sub>AM</sub> - φ<sub>SE</sub></>} note={<>exclude AM + SE</>} />,
          summary:
            locale === 'en' ? 'A stricter accessible-volume assumption.' : '더 엄격한 가용부피 가정입니다.',
          explanation:
            locale === 'en'
              ? 'Use this when both AM and SE are treated as blocked regions for the conductive network, leaving only a reduced interstitial space.'
              : '활물질과 고체전해질 모두가 도전 네트워크가 점유할 수 없는 막힌 영역이라고 볼 때 사용합니다.',
          conditions:
            locale === 'en' ? 'Produces stronger local concentration and more aggressive Veff values.' : '더 강한 국부 농축과 더 공격적인 Veff 값을 만듭니다.',
          variables: [
            { symbol: 'φSE', meaning: locale === 'en' ? 'SE volume fraction' : '고체전해질 부피분율' },
          ],
        },
        {
          id: 'available-full',
          code: 'V_available = 1   (full electrode)',
          pretty: <BookEquation lhs={<>V<sub>available</sub></>} rhs={<>1</>} note={<>full electrode</>} />,
          summary:
            locale === 'en' ? 'No segregated concentration; the filler can access the whole electrode basis.' : '세그리게이트 농축이 없고 필러가 전극 전체 기준을 쓴다고 보는 경우입니다.',
          explanation:
            locale === 'en'
              ? 'This is closer to a non-segregated or fully accessible network assumption.'
              : '무세그리게이트 또는 전체 접근 가능 네트워크 가정에 더 가깝습니다.',
          conditions:
            locale === 'en' ? 'Useful as a comparison baseline.' : '비교 기준선으로 유용합니다.',
          variables: [],
        },
        {
          id: 'effective-volume',
          code: 'V_eff = phi_CNF / V_available',
          pretty: <BookEquation lhs={<>V<sub>eff</sub></>} rhs={<>φ<sub>CNF</sub> / V<sub>available</sub></>} />,
          summary:
            locale === 'en' ? 'Computes the local conductive concentration felt by the network.' : '네트워크가 실제로 느끼는 국부 도전재 농도를 계산합니다.',
          explanation:
            locale === 'en'
              ? 'This is the core segregated-network idea: the same total CNF amount can behave like a much higher local concentration if the accessible region is small.'
              : '이 식이 세그리게이트 네트워크의 핵심입니다. 전체 CNF 양이 같아도 가용 영역이 작으면 훨씬 높은 국부 농도처럼 작동할 수 있습니다.',
          conditions:
            locale === 'en' ? 'Sensitive to the accessible-volume rule selected above.' : '위에서 고른 가용부피 규칙에 매우 민감합니다.',
          variables: [
            { symbol: 'Veff', meaning: locale === 'en' ? 'effective conductive fraction' : '유효 도전재 농도' },
            { symbol: 'φCNF', meaning: locale === 'en' ? 'CNF volume fraction' : 'CNF 부피분율' },
          ],
        },
      ],
    },
    {
      title: text.methodsThresholds,
      equations: [
        {
          id: 'threshold-ratio',
          code: 'R = R_matrix / R_additive',
          pretty: <BookEquation lhs={<>R</>} rhs={<>R<sub>matrix</sub> / R<sub>additive</sub></>} />,
          summary:
            locale === 'en' ? 'Defines the particle-size ratio used to lower the segregated threshold.' : '세그리게이트 임계값을 낮추는 데 쓰이는 입경비를 정의합니다.',
          explanation:
            locale === 'en'
              ? 'A larger matrix particle relative to the additive generally means stronger confinement and therefore a lower segregated threshold.'
              : '매트릭스 입자가 도전재보다 클수록 confinement가 강해지고 세그리게이트 임계값은 더 낮아지는 경향이 있습니다.',
          conditions:
            locale === 'en' ? 'Uses the current AM particle size and additive size inputs.' : '현재 입력된 활물질 입경과 도전재 크기를 사용합니다.',
          variables: [
            { symbol: 'R', meaning: locale === 'en' ? 'size ratio' : '입경비' },
          ],
        },
        {
          id: 'threshold-random',
          code: 'V_th,random = V_th,ideal   (formula mode)',
          pretty: <BookEquation lhs={<>V<sub>th,random</sub></>} rhs={<>V<sub>th,ideal</sub></>} note={<>formula mode</>} />,
          summary:
            locale === 'en' ? 'Uses the input ideal threshold directly as the random-network baseline.' : '입력한 이상 임계값을 무작위 네트워크 기준값으로 바로 사용합니다.',
          explanation:
            locale === 'en'
              ? 'This lets the user anchor the model to an assumed or literature-based ideal threshold before applying segregated corrections.'
              : '세그리게이트 보정을 적용하기 전에 사용자가 가정값이나 문헌값으로 이상 임계값을 고정할 수 있게 합니다.',
          conditions:
            locale === 'en' ? 'Applies when threshold mode is set to formula.' : 'threshold mode가 formula일 때 적용됩니다.',
          variables: [
            { symbol: 'Vth,ideal', meaning: locale === 'en' ? 'ideal/random threshold input' : '이상/무작위 임계값 입력' },
          ],
        },
        {
          id: 'threshold-ar',
          code: 'V_th,random ≈ 1 / AR   (AR heuristic mode)',
          pretty: <BookEquation lhs={<>V<sub>th,random</sub></>} rhs={<>1 / AR</>} note={<>AR heuristic</>} />,
          summary:
            locale === 'en' ? 'Approximates the random threshold from aspect ratio.' : '종횡비로부터 무작위 임계값을 근사합니다.',
          explanation:
            locale === 'en'
              ? 'For high-aspect-ratio rodlike fillers, the threshold often decreases roughly with increasing aspect ratio. This is a simple heuristic, not a full rod percolation theory.'
              : '고종횡비 막대형 필러에서는 임계값이 종횡비 증가에 따라 대략 감소하는 경우가 많습니다. 다만 이는 완전한 로드 퍼콜레이션 이론이 아닌 단순 휴리스틱입니다.',
          conditions:
            locale === 'en' ? 'Best used as a quick estimate when no better threshold input is available.' : '더 나은 임계값 정보가 없을 때 빠른 추정용으로 적합합니다.',
          variables: [
            { symbol: 'AR', meaning: locale === 'en' ? 'aspect ratio' : '종횡비' },
          ],
        },
        {
          id: 'threshold-segregated',
          code: 'V_th,seg = V_th,random / (1 + R)',
          pretty: <BookEquation lhs={<>V<sub>th,seg</sub></>} rhs={<>V<sub>th,random</sub> / (1 + R)</>} />,
          summary:
            locale === 'en' ? 'Lowers the threshold under segregated confinement.' : '세그리게이트 confinement 아래에서 임계값을 낮춥니다.',
          explanation:
            locale === 'en'
              ? 'This is the active segregation correction in the app. When the matrix is much larger than the additive, the same filler loading can percolate at a lower nominal threshold.'
              : '이 식이 앱에서 사용하는 세그리게이트 보정입니다. 매트릭스가 도전재보다 훨씬 크면 같은 필러 함량도 더 낮은 공칭 임계값에서 퍼콜레이션할 수 있습니다.',
          conditions:
            locale === 'en' ? 'This is a compact engineering model, not a universal law.' : '보편 법칙이 아니라 간략화된 공학 모델입니다.',
          variables: [
            { symbol: 'Vth,seg', meaning: locale === 'en' ? 'segregated threshold' : '세그리게이트 임계값' },
          ],
        },
        {
          id: 'threshold-active',
          code: 'V_th,active = V_th,seg   or   V_th,random',
          pretty: <BookEquation lhs={<>V<sub>th,active</sub></>} rhs={<>V<sub>th,seg</sub> or V<sub>th,random</sub></>} />,
          summary:
            locale === 'en' ? 'Chooses the threshold actually used in the probability and conductivity equations.' : '확률과 전도도 식에 실제로 들어가는 임계값을 선택합니다.',
          explanation:
            locale === 'en'
              ? 'If the active model is segregated, the app uses the segregated threshold. If the active model is random/excluded-volume, it uses the random threshold.'
              : '활성 모델이 세그리게이트면 세그리게이트 임계값을, 무작위/제외부피 모델이면 무작위 임계값을 사용합니다.',
          conditions:
            locale === 'en' ? 'Controlled by the Active network model selector.' : 'Active network model 선택기에 의해 결정됩니다.',
          variables: [],
        },
      ],
    },
    {
      title: text.methodsProbability,
      equations: [
        {
          id: 'probability-delta',
          code: 'Delta = max(V_eff - V_th,active, 0)',
          pretty: <BookEquation lhs={<>Δ</>} rhs={<>max(V<sub>eff</sub> - V<sub>th,active</sub>, 0)</>} />,
          summary:
            locale === 'en' ? 'Measures how far the system is above threshold.' : '시스템이 임계값을 얼마나 초과했는지 측정합니다.',
          explanation:
            locale === 'en'
              ? 'Below threshold, the driving term is zero. Above threshold, Delta is the excess conductive concentration that powers both the probability and conductivity scaling laws.'
              : '임계값 이하에서는 구동항이 0입니다. 임계값 이상에서는 Delta가 확률과 전도도 스케일링을 움직이는 초과 도전재 농도 역할을 합니다.',
          conditions:
            locale === 'en' ? 'This app does not model sub-threshold tunneling separately.' : '이 앱은 임계값 이하의 터널링을 별도 모델로 다루지 않습니다.',
          variables: [
            { symbol: 'Δ', meaning: locale === 'en' ? 'excess above threshold' : '임계값 초과량' },
          ],
        },
        {
          id: 'probability-raw',
          code: 'P_raw = P0 * Delta^beta',
          pretty: <BookEquation lhs={<>P<sub>raw</sub></>} rhs={<>P<sub>0</sub> · Δ<sup>β</sup></>} />,
          summary:
            locale === 'en' ? 'Computes the uncapped percolation probability scaling.' : '상한을 두기 전의 퍼콜레이션 확률 스케일링을 계산합니다.',
          explanation:
            locale === 'en'
              ? 'This is the app’s probability law. Beta controls how sharply the network grows above threshold, and P0 shifts the magnitude to match the chosen empirical assumptions.'
              : '이 식이 앱의 확률 법칙입니다. beta는 임계점 فوق에서 네트워크가 얼마나 급하게 자라는지, P0는 경험적 가정에 맞게 크기를 얼마나 이동시키는지 결정합니다.',
          conditions:
            locale === 'en' ? 'P0 is an adjustable empirical factor, not a universal constant.' : 'P0는 보편 상수가 아니라 조정 가능한 경험 계수입니다.',
          variables: [
            { symbol: 'Praw', meaning: locale === 'en' ? 'uncapped probability' : '상한 전 확률' },
            { symbol: 'β', meaning: locale === 'en' ? 'probability scaling exponent' : '확률 스케일링 지수' },
            { symbol: 'P0', meaning: locale === 'en' ? 'empirical prefactor' : '경험적 계수' },
          ],
        },
        {
          id: 'probability-capped',
          code: 'P = min(P_raw, 1)',
          pretty: <BookEquation lhs={<>P</>} rhs={<>min(P<sub>raw</sub>, 1)</>} />,
          summary:
            locale === 'en' ? 'Caps the displayed probability at 100%.' : '표시되는 확률을 100%로 제한합니다.',
          explanation:
            locale === 'en'
              ? 'The scaling law can exceed 1 numerically when the chosen assumptions are aggressive. The physical display value is therefore capped at 1.'
              : '가정이 공격적이면 스케일링 식은 수치적으로 1을 넘을 수 있습니다. 물리적으로 표시되는 값은 따라서 1로 제한합니다.',
          conditions:
            locale === 'en' ? 'The app still shows Praw separately so users can see how strong the uncapped scaling is.' : '앱은 uncapped scaling이 얼마나 강한지 보이도록 Praw도 별도로 보여줍니다.',
          variables: [
            { symbol: 'P', meaning: locale === 'en' ? 'final displayed probability' : '최종 표시 확률' },
          ],
        },
        {
          id: 'probability-conductivity',
          code: 'sigma = sigma0 * Delta^t',
          pretty: <BookEquation lhs={<>σ</>} rhs={<>σ<sub>0</sub> · Δ<sup>t</sup></>} />,
          summary:
            locale === 'en' ? 'Scales conductivity above threshold with the same excess term.' : '같은 초과량 항으로 임계값 فوق의 전도도를 스케일링합니다.',
          explanation:
            locale === 'en'
              ? 'This gives a conductivity level, not a full transport model. Sigma0 sets the prefactor and t controls how sharply conductivity grows once the network forms.'
              : '이 식은 완전한 수송모델이 아니라 전도도 수준을 줍니다. sigma0가 계수 역할을 하고 t가 네트워크 형성 후 얼마나 급하게 전도도가 증가하는지 정합니다.',
          conditions:
            locale === 'en' ? 'Highly sensitive to sigma0 and therefore best interpreted comparatively.' : 'sigma0에 매우 민감하므로 절대값보다 비교 지표로 읽는 것이 좋습니다.',
          variables: [
            { symbol: 'σ', meaning: locale === 'en' ? 'conductivity level' : '전도도 수준' },
            { symbol: 'σ0', meaning: locale === 'en' ? 'conductivity prefactor' : '전도도 계수' },
            { symbol: 't', meaning: locale === 'en' ? 'conductivity exponent' : '전도도 지수' },
          ],
        },
      ],
    },
    {
      title: text.methodsInverse,
      equations: [
        {
          id: 'inverse-target',
          code: 'Find minimum w_CNF such that P(w_CNF) >= P_target',
          pretty: <BookEquation lhs={<>min w<sub>CNF</sub></>} rhs={<>such that P(w<sub>CNF</sub>) ≥ P<sub>target</sub></>} />,
          summary:
            locale === 'en' ? 'Defines the inverse design target.' : '역설계 목표를 정의합니다.',
          explanation:
            locale === 'en'
              ? 'Instead of predicting probability from a chosen loading, this equation asks for the smallest CNF wt% that reaches the target probability under the same assumptions.'
              : '선택한 함량에서 확률을 예측하는 대신, 같은 가정 아래 목표 확률에 도달하는 최소 CNF wt%를 묻는 식입니다.',
          conditions:
            locale === 'en' ? 'The solver is numerical and uses the same mixed-input interpretation as the forward model.' : '해는 수치적으로 찾으며, 정방향 모델과 같은 혼합 입력 해석을 사용합니다.',
          variables: [
            { symbol: 'Ptarget', meaning: locale === 'en' ? 'requested target probability' : '목표 확률' },
          ],
        },
        {
          id: 'inverse-report',
          code: 'Convert solved w_CNF to phi_CNF with the same density set',
          pretty: <BookEquation lhs={<>report</>} rhs={<>solved w<sub>CNF</sub> and derived φ<sub>CNF</sub></>} />,
          summary:
            locale === 'en' ? 'Returns both the solved wt% and the derived vol%.' : '해당 wt%와 함께 유도된 vol%도 같이 반환합니다.',
          explanation:
            locale === 'en'
              ? 'This matters because the user often thinks in wt%, while the actual percolation threshold and scaling are still being evaluated in volume fraction.'
              : '사용자는 보통 wt%로 사고하지만 실제 퍼콜레이션 임계값과 스케일링은 여전히 부피분율 기준으로 평가되기 때문에 중요합니다.',
          conditions:
            locale === 'en' ? 'Uses the same density set as the rest of the calculation.' : '전체 계산과 동일한 밀도 세트를 사용합니다.',
          variables: [],
        },
      ],
    },
    {
      title:
        locale === 'en'
          ? '8. PTFE inverse companion equations'
          : '8. PTFE 역산 보조 식',
      equations: [
        {
          id: 'inverse-ptfe-target-companion',
          code: 'Find minimum w_PTFE such that P_PTFE(w_PTFE) >= P_target',
          pretty: (
            <BookEquation
              lhs={<>min w<sub>PTFE</sub></>}
              rhs={<>such that P<sub>PTFE</sub>(w<sub>PTFE</sub>) ≥ P<sub>target</sub></>}
            />
          ),
          summary:
            locale === 'en'
              ? 'Defines minimum PTFE wt% design target under the PTFE branch.'
              : 'PTFE 분기 모델에서 최소 PTFE wt% 목표를 정의합니다.',
          explanation:
            locale === 'en'
              ? 'SE and CNF stay fixed while PTFE is varied. The inverse solver returns the lowest PTFE wt% that satisfies target probability.'
              : 'SE와 CNF는 고정하고 PTFE만 변화시켜 목표 확률을 만족하는 최소 PTFE wt%를 찾습니다.',
          conditions:
            locale === 'en'
              ? 'Evaluated with PTFE aspect ratio and PTFE accessible-volume rule.'
              : 'PTFE 종횡비와 PTFE 가용부피 규칙을 적용합니다.',
          variables: [
            {
              symbol: 'PPTFE',
              meaning:
                locale === 'en'
                  ? 'percolation probability from PTFE-network branch'
                  : 'PTFE 네트워크 분기에서 계산한 확률',
            },
          ],
        },
        {
          id: 'inverse-ptfe-report-companion',
          code: 'Convert solved w_PTFE to phi_PTFE with the same density set',
          pretty: (
            <BookEquation
              lhs={<>report</>}
              rhs={<>solved w<sub>PTFE</sub> and derived ?<sub>PTFE</sub></>}
            />
          ),
          summary:
            locale === 'en'
              ? 'Reports PTFE in both wt% and vol% after solving.'
              : '역산 후 PTFE를 wt%와 vol%로 함께 보고합니다.',
          explanation:
            locale === 'en'
              ? 'The model equations still run in volume fraction, so showing both units keeps input and model domains aligned.'
              : '모델은 vol% 기준으로 계산되므로 입력 기준(wt%)과 모델 기준(vol%)을 함께 보여줍니다.',
          conditions:
            locale === 'en'
              ? 'Uses the same density conversion path as the main forward solver.'
              : '정방향 솔버와 동일한 밀도 변환 경로를 사용합니다.',
          variables: [],
        },
      ],
    },
  ]
  const allEquations = equationSections.flatMap((section) => section.equations)

  const buildIonicBranch = (calculation: CalculationResult): IBranchResult => {
    const computeIonicProbability = (target: CalculationResult) => {
      const solidVolume = Math.max(target.composition.totalSolidVolume, 1e-9)
      const seSolidFraction = target.composition.volumeFractions.se / solidVolume
      const amToSeRatio = clamp(
        deferredGeometry.amParticleSizeUm / Math.max(deferredGeometry.seParticleSizeUm, 1e-9),
        0,
        1e6,
      )
      const randomThreshold =
        deferredAssumptions.thresholdMode === 'direct'
          ? deferredAssumptions.directVthRandom
          : deferredAssumptions.vthIdeal
      const segregatedThreshold = randomThreshold / (1 + amToSeRatio)
      const activeThreshold =
        deferredAssumptions.networkModel === 'segregated'
          ? segregatedThreshold
          : randomThreshold
      const diff = Math.max(0, seSolidFraction - activeThreshold)
      const pRaw = deferredAssumptions.p0 * Math.pow(diff, deferredAssumptions.beta)
      const pCapped = Math.min(1, pRaw)
      const sigma = deferredAssumptions.sigma0 * Math.pow(diff, deferredAssumptions.t)

      return {
        seSolidFraction,
        diff,
        pRaw,
        pCapped,
        sigma,
        randomThreshold,
        segregatedThreshold,
        activeThreshold,
      }
    }

    const ionicCore = computeIonicProbability(calculation)

    const solveMinimumSe = (): {
      minSeWeightFraction: number | null
      minSeVolFraction: number | null
    } => {
      const template = {
        seWeightFraction: calculation.composition.weightFractions.se,
        cnfWeightFraction: calculation.composition.weightFractions.cnf,
        ptfeWeightFraction: calculation.composition.weightFractions.ptfe,
      }
      const targetProbability = deferredAssumptions.targetProbability
      const upperBound =
        1 - template.cnfWeightFraction - template.ptfeWeightFraction - 1e-6
      if (upperBound <= 0) {
        return { minSeWeightFraction: null, minSeVolFraction: null }
      }

      const evaluateSeProbability = (seWeightFraction: number) => {
        const candidate = calculateCase(
          {
            id: `${calculation.input.id}-se-inverse`,
            label: calculation.input.label,
            mode: 'presetMixed',
            porosity: calculation.input.porosity,
            seWeightFraction,
            cnfWeightFraction: template.cnfWeightFraction,
            ptfeWeightFraction: template.ptfeWeightFraction,
            amWeightFraction: Math.max(
              0,
              1 - seWeightFraction - template.cnfWeightFraction - template.ptfeWeightFraction,
            ),
          },
          deferredDensities,
          deferredGeometry,
          deferredAssumptions,
        )
        const ionic = computeIonicProbability(candidate)
        return { probability: ionic.pCapped, candidate }
      }

      const hiResult = evaluateSeProbability(upperBound)
      if (hiResult.probability < targetProbability) {
        return { minSeWeightFraction: null, minSeVolFraction: null }
      }

      let low = 0
      let high = upperBound
      for (let iteration = 0; iteration < 70; iteration += 1) {
        const mid = (low + high) / 2
        const { probability } = evaluateSeProbability(mid)
        if (probability >= targetProbability) {
          high = mid
        } else {
          low = mid
        }
      }

      const solved = evaluateSeProbability(high).candidate
      return {
        minSeWeightFraction: solved.composition.weightFractions.se,
        minSeVolFraction: solved.composition.volumeFractions.se,
      }
    }

    return {
      vAvailable: 1,
      veff: ionicCore.seSolidFraction,
      diff: ionicCore.diff,
      pRaw: ionicCore.pRaw,
      pCapped: ionicCore.pCapped,
      sigma: ionicCore.sigma,
      thresholds: {
        random: ionicCore.randomThreshold,
        segregated: ionicCore.segregatedThreshold,
        active: ionicCore.activeThreshold,
      },
      inverse: solveMinimumSe(),
    }
  }

  const withPtfeModelAssumptions = (
    base: ModelAssumptions,
    mode: PtfeModelMode,
  ): ModelAssumptions => {
    const spec = ptfeModelSpecs[mode]
    return {
      ...base,
      networkModel: spec.networkModel,
      binderAccessibleVolumeRule: spec.binderRule,
      vthIdeal: base.vthIdeal * spec.vthScale,
      directVthRandom: base.directVthRandom * spec.vthScale,
      directVthSegregated: base.directVthSegregated * spec.vthScale,
    }
  }

  const evaluatePtfeModelCase = (input: CaseInput, mode: PtfeModelMode) =>
    calculateCase(
      input,
      deferredDensities,
      deferredGeometry,
      withPtfeModelAssumptions(deferredAssumptions, mode),
    )

  const result = calculateCase(
    deferredInput,
    deferredDensities,
    deferredGeometry,
    deferredAssumptions,
  )
  const comparison = presetCases.map((preset) =>
    calculateCase(preset.input, deferredDensities, deferredGeometry, deferredAssumptions),
  )
  const selectedPtfeModelSpec = ptfeModelSpecs[ptfeModelMode]
  const selectedPtfeModelResult = evaluatePtfeModelCase(deferredInput, ptfeModelMode)
  const displayedMinPtfeWeightFraction = selectedPtfeModelResult.inverse.minPtfeWeightFraction
  const displayedMinPtfeVolFraction = selectedPtfeModelResult.inverse.minPtfeVolFraction
  const summaryResult: CalculationResult = {
    ...result,
    inverse: {
      ...result.inverse,
      minPtfeWeightFraction: displayedMinPtfeWeightFraction,
      minPtfeVolFraction: displayedMinPtfeVolFraction,
    },
    binder: selectedPtfeModelResult.binder,
  }
  const ptfeComparisonByCaseId = new Map(
    presetCases.map((preset) => [preset.id, evaluatePtfeModelCase(preset.input, ptfeModelMode)] as const),
  )
  const cnfRuleComparisonRows = (Object.keys(cnfAccessibleRuleSpecs) as AccessibleVolumeRule[]).map(
    (rule) => {
      const modelResult = calculateCase(
        deferredInput,
        deferredDensities,
        deferredGeometry,
        {
          ...deferredAssumptions,
          accessibleVolumeRule: rule,
        },
      )
      return {
        rule,
        spec: cnfAccessibleRuleSpecs[rule],
        probability: modelResult.probability.pCapped,
        conductivity: modelResult.probability.sigma,
        minCnfWt: modelResult.inverse.minCnfWeightFraction,
        minCnfVol: modelResult.inverse.minCnfVolFraction,
      }
    },
  )
  const ptfeModelComparisonRows = (Object.keys(ptfeModelSpecs) as PtfeModelMode[]).map(
    (mode) => {
      const spec = ptfeModelSpecs[mode]
      const modelResult = evaluatePtfeModelCase(deferredInput, mode)
      return {
        mode,
        spec,
        probability: modelResult.binder.probability.pCapped,
        conductivity: modelResult.binder.probability.sigma,
        minPtfeWt: modelResult.inverse.minPtfeWeightFraction,
        minPtfeVol: modelResult.inverse.minPtfeVolFraction,
      }
    },
  )
  const ionicResult = buildIonicBranch(result)
  const ionicComparison = comparison.map((entry) => ({
    entry,
    ionic: buildIonicBranch(entry),
  }))

  const buildDualRecommendation = (
    ecCalculation: CalculationResult,
    icCalculation: IBranchResult,
  ): DualRecommendation => {
    const recommendedCnf =
      ecCalculation.inverse.minCnfWeightFraction ??
      ecCalculation.composition.weightFractions.cnf
    const recommendedSe =
      icCalculation.inverse.minSeWeightFraction ??
      ecCalculation.composition.weightFractions.se
    const fixedPtfe = ecCalculation.composition.weightFractions.ptfe
    const recommendedAm = 1 - recommendedSe - recommendedCnf - fixedPtfe

    if (recommendedAm <= 0) {
      return {
        feasible: false,
        amWeightFraction: Math.max(recommendedAm, 0),
        seWeightFraction: recommendedSe,
        cnfWeightFraction: recommendedCnf,
        ptfeWeightFraction: fixedPtfe,
        ecProbability: 0,
        icProbability: 0,
      }
    }

    const recommendedCase = calculateCase(
      {
        id: `${ecCalculation.input.id}-ecic-recommended`,
        label: ecCalculation.input.label,
        mode: 'presetMixed',
        porosity: ecCalculation.input.porosity,
        amWeightFraction: recommendedAm,
        seWeightFraction: recommendedSe,
        cnfWeightFraction: recommendedCnf,
        ptfeWeightFraction: fixedPtfe,
      },
      deferredDensities,
      deferredGeometry,
      deferredAssumptions,
    )
    const recommendedIonic = buildIonicBranch(recommendedCase)
    const target = deferredAssumptions.targetProbability

    return {
      feasible:
        recommendedCase.probability.pCapped >= target &&
        recommendedIonic.pCapped >= target,
      amWeightFraction: recommendedAm,
      seWeightFraction: recommendedSe,
      cnfWeightFraction: recommendedCnf,
      ptfeWeightFraction: fixedPtfe,
      ecProbability: recommendedCase.probability.pCapped,
      icProbability: recommendedIonic.pCapped,
    }
  }

  const dualRecommendation = buildDualRecommendation(result, ionicResult)
  const dualComparison = ionicComparison.map(({ entry, ionic }) => ({
    entry,
    ionic,
    recommendation: buildDualRecommendation(entry, ionic),
  }))
  const reverseDesignResult = useMemo(
    () =>
      runReverseDesign(
        reverseDesignConfig,
        deferredDensities,
        deferredGeometry,
        deferredAssumptions,
      ),
    [reverseDesignConfig, deferredDensities, deferredGeometry, deferredAssumptions],
  )
  const reverseMapSeWeightFraction =
    reverseDesignConfig.seMode === 'fixed'
      ? reverseDesignConfig.fixedSeWeightFraction
      : (reverseDesignResult.best?.seWeightFraction ?? reverseDesignConfig.fixedSeWeightFraction)
  const reversePhaseMap = useMemo(
    () =>
      buildReversePhaseMap(
        reverseDesignConfig,
        reverseMapSeWeightFraction,
        deferredDensities,
        deferredGeometry,
        deferredAssumptions,
      ),
    [
      reverseDesignConfig,
      reverseMapSeWeightFraction,
      deferredDensities,
      deferredGeometry,
      deferredAssumptions,
    ],
  )
  const selectedEquation =
    allEquations.find((equation) => equation.id === selectedEquationId) ?? allEquations[0]
  const probabilityCurve =
    currentInput.mode === 'presetMixed'
      ? (() => {
          const currentWeight = result.composition.weightFractions.cnf
          const targetWeight = result.inverse.minCnfWeightFraction ?? currentWeight
          const maxWeight = Math.min(
            0.25,
            Math.max(currentWeight * 2.5, targetWeight * 1.25, 0.05),
          )
          const points = Array.from({ length: 25 }, (_, index) => {
            const weight = (maxWeight * index) / 24
            const pointResult = calculateCase(
              {
                ...currentInput,
                amWeightFraction: Math.max(
                  0,
                  1 -
                    currentInput.seWeightFraction -
                    currentInput.ptfeWeightFraction -
                    weight,
                ),
                cnfWeightFraction: weight,
              },
              deferredDensities,
              deferredGeometry,
              deferredAssumptions,
            )
            return {
              x: weight,
              y: pointResult.probability.pCapped,
            }
          })
          return {
            points,
            currentX: currentWeight,
            currentY: result.probability.pCapped,
            targetX: result.inverse.minCnfWeightFraction ?? undefined,
            targetY:
              result.inverse.minCnfWeightFraction === null
                ? undefined
                : deferredAssumptions.targetProbability,
          }
        })()
      : null

  const weightFractionSum =
    currentInput.mode === 'presetMixed' || currentInput.mode === 'directWeight'
      ? currentInput.amWeightFraction +
        currentInput.seWeightFraction +
        currentInput.cnfWeightFraction +
        currentInput.ptfeWeightFraction
      : null
  const isWeightFractionSumValid =
    weightFractionSum === null ? false : Math.abs(weightFractionSum - 1) <= 1e-6

  const setCaseValue = (patch: Partial<CaseInput>) => {
    setCurrentInput((previous) => ({
      ...previous,
      ...patch,
    }) as CaseInput)
  }

  const setPresetWeightValue = (
    key:
      | 'amWeightFraction'
      | 'seWeightFraction'
      | 'cnfWeightFraction'
      | 'ptfeWeightFraction',
    next: number,
  ) => {
    setCurrentInput((previous) => {
      if (previous.mode !== 'presetMixed') {
        return previous
      }
      return {
        ...previous,
        [key]: next,
      }
    })
  }

  const setCaseMode = (mode: CompositionMode) => {
    setCurrentInput((previous) => {
      if (mode === previous.mode) {
        return previous
      }
      if (mode === 'presetMixed') {
        return {
          ...cloneCase(customCaseTemplate),
          label: previous.label,
        }
      }
      if (mode === 'directVolume') {
        return {
          id: previous.id,
          label: previous.label,
          mode,
          porosity: previous.porosity,
          amVolFraction: result.composition.volumeFractions.am,
          seVolFraction: result.composition.volumeFractions.se,
          cnfVolFraction: result.composition.volumeFractions.cnf,
          ptfeVolFraction: result.composition.volumeFractions.ptfe,
        }
      }
      return {
        id: previous.id,
        label: previous.label,
        mode,
        porosity: previous.porosity,
        amWeightFraction: result.composition.weightFractions.am,
        seWeightFraction: result.composition.weightFractions.se,
        cnfWeightFraction: result.composition.weightFractions.cnf,
        ptfeWeightFraction: result.composition.weightFractions.ptfe,
      }
    })
  }

  const loadPreset = (presetId: string) => {
    const preset = presetCases.find((candidate) => candidate.id === presetId)
    if (!preset) {
      return
    }
    startTransition(() => {
      setCurrentInput(cloneCase(preset.input))
    })
  }

  const loadCustom = () => {
    startTransition(() => {
      setCurrentInput({
        ...cloneCase(customCaseTemplate),
        label: customCaseTemplate.label,
      })
    })
  }

  const updateDensity = (key: keyof DensitySet, value: number) => {
    setDensities((previous) => ({ ...previous, [key]: value }))
  }

  const updateGeometry = (key: keyof GeometryInput, value: number) => {
    setGeometry((previous) => ({ ...previous, [key]: value }))
  }

  const updateAssumption = <K extends keyof ModelAssumptions>(
    key: K,
    value: ModelAssumptions[K],
  ) => {
    setAssumptions((previous) => ({ ...previous, [key]: value }))
  }

  const updateReverseDesign = <K extends keyof ReverseDesignConfig>(
    key: K,
    value: ReverseDesignConfig[K],
  ) => {
    setReverseDesignConfig((previous) => ({ ...previous, [key]: value }))
  }

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(buildBilingualSummary(summaryResult))
      setCopyStatus('copied')
    } catch {
      setCopyStatus('failed')
    }
  }

  const renderWarnings = (warnings: ValidationWarning[]) =>
    warnings.map((warning) => (
      <li key={warning.code} className={`warning warning--${warning.severity}`}>
        {warning.message[locale]}
      </li>
    ))

  const sumOkLabel =
    locale === 'en' ? 'WT% sum matches 100%' : 'WT% 합계가 100%입니다'
  const sumAdjustLabel =
    locale === 'en'
      ? 'WT% sum should be 100%'
      : 'WT% 합계를 100%로 맞춰주세요'

  const scrollRailLabel =
    locale === 'en'
      ? 'Jump to a specific scroll position'
      : '스크롤을 원하는 위치로 바로 이동'
  const jumpToTopLabel =
    locale === 'en' ? 'Jump to top' : '맨 위로 이동'
  const jumpToBottomLabel =
    locale === 'en' ? 'Jump to bottom' : '맨 아래로 이동'

  const showMobileScrollNav = scrollNav.isMobile && scrollNav.isScrollable
  const jumpDirection: ScrollDirection = scrollNav.isAtBottom
    ? 'up'
    : scrollNav.isAtTop
      ? 'down'
      : scrollNav.direction
  const jumpButtonLabel =
    jumpDirection === 'down' ? jumpToBottomLabel : jumpToTopLabel
  const railProgress = railDragProgress ?? scrollNav.scrollProgress
  const jumpToResultsLabel =
    locale === 'en' ? 'Go to results' : '결과 바로 보기'

  const clearRailLongPressTimer = () => {
    if (railLongPressTimerRef.current !== null) {
      window.clearTimeout(railLongPressTimerRef.current)
      railLongPressTimerRef.current = null
    }
  }

  const jumpToLogicLabel =
    locale === 'en' ? 'Calculation steps' : '계산 과정 보기'
  const logicSectionTitle =
    locale === 'en'
      ? 'Step-by-step calculation walkthrough'
      : '단계별 계산 과정 안내'
  const logicSectionSubtitle =
    locale === 'en'
      ? 'Only the currently selected case is shown below, with the exact path to probability, conductivity, and minimum CNF/PTFE(wt%).'
      : '아래 각 케이스에서 모델 가정과 확률·전도도·최소 CNF(wt%) 도출 과정을 순서대로 확인할 수 있습니다.'
  const minPtfeWtLabel =
    locale === 'en' ? 'Minimum PTFE(wt%) for target P' : '목표 P를 위한 최소 PTFE(wt%)'
  const minPtfeVolLabel =
    locale === 'en' ? 'Minimum PTFE vol%' : '최소 PTFE vol%'
  const currentCaseTitle =
    locale === 'en' ? 'Current input (editable)' : '현재 입력값 (사용자 편집)'
  const presetCaseTitle =
    locale === 'en' ? 'Preset case' : '프리셋 케이스'

  const scrollToProgress = (progress: number, behavior: ScrollBehavior) => {
    if (typeof window === 'undefined') {
      return
    }

    const documentElement = document.documentElement
    const maxScroll = Math.max(documentElement.scrollHeight - window.innerHeight, 0)

    window.scrollTo({
      top: clamp(progress, 0, 1) * maxScroll,
      behavior,
    })
  }

  const scrollToResults = () => {
    const resultsPanel = document.getElementById('results-panel')
    if (!resultsPanel) {
      return
    }
    resultsPanel.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  const scrollToLogic = () => {
    const logicPanel = document.getElementById('calculation-logic-section')
    if (!logicPanel) {
      return
    }
    logicPanel.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  const scrollToPtfeComparison = () => {
    const panel =
      document.getElementById('cnf-model-comparison-section') ??
      document.getElementById('ptfe-model-comparison-section')
    if (!panel) {
      return
    }
    panel.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  const updateScrollByClientY = (clientY: number) => {
    const track = railTrackRef.current
    if (!track) {
      return
    }
    const bounds = track.getBoundingClientRect()
    const relativeY = clientY - bounds.top
    const nextProgress = clamp(bounds.height > 0 ? relativeY / bounds.height : 0, 0, 1)

    if (railDragActiveRef.current) {
      const documentElement = document.documentElement
      const maxScroll = Math.max(documentElement.scrollHeight - window.innerHeight, 0)
      setRailDragProgress(nextProgress)
      window.scrollTo(0, nextProgress * maxScroll)
      return
    }

    scrollToProgress(nextProgress, 'auto')
  }

  const handleMobileJumpClick = () => {
    scrollToProgress(jumpDirection === 'down' ? 1 : 0, 'smooth')
  }

  const handleRailClick = (event: MouseEvent<HTMLButtonElement>) => {
    updateScrollByClientY(event.clientY)
  }

  const handleRailKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Home') {
      event.preventDefault()
      scrollToProgress(0, 'smooth')
      return
    }
    if (event.key === 'End') {
      event.preventDefault()
      scrollToProgress(1, 'smooth')
      return
    }
    if (event.key === 'ArrowUp' || event.key === 'PageUp') {
      event.preventDefault()
      scrollToProgress(scrollNav.scrollProgress - 0.1, 'smooth')
      return
    }
    if (event.key === 'ArrowDown' || event.key === 'PageDown') {
      event.preventDefault()
      scrollToProgress(scrollNav.scrollProgress + 0.1, 'smooth')
    }
  }

  const handleThumbPointerDown = (event: PointerEvent<HTMLSpanElement>) => {
    event.preventDefault()
    event.stopPropagation()

    const thumbElement = event.currentTarget
    const pointerId = event.pointerId

    railPointerIdRef.current = pointerId
    railStartClientYRef.current = event.clientY
    railDragActiveRef.current = false
    setIsRailDragging(false)
    clearRailLongPressTimer()

    railLongPressTimerRef.current = window.setTimeout(() => {
      railDragActiveRef.current = true
      setIsRailDragging(true)
      try {
        thumbElement.setPointerCapture(pointerId)
      } catch {
        // Ignore unsupported capture cases.
      }
      updateScrollByClientY(railStartClientYRef.current)
    }, RAIL_LONG_PRESS_MS)
  }

  const handleThumbPointerMove = (event: PointerEvent<HTMLSpanElement>) => {
    if (!railDragActiveRef.current) {
      return
    }

    event.preventDefault()
    updateScrollByClientY(event.clientY)
  }

  const finishThumbDrag = (
    event: PointerEvent<HTMLSpanElement>,
    shouldPreventDefault: boolean,
  ) => {
    if (shouldPreventDefault) {
      event.preventDefault()
    }
    event.stopPropagation()
    clearRailLongPressTimer()

    if (railDragActiveRef.current) {
      const pointerId = railPointerIdRef.current
      if (
        pointerId !== null &&
        event.currentTarget.hasPointerCapture(pointerId)
      ) {
        event.currentTarget.releasePointerCapture(pointerId)
      }
    }

    railDragActiveRef.current = false
    railPointerIdRef.current = null
    setRailDragProgress(null)
    setIsRailDragging(false)
  }

  const handleThumbPointerUp = (event: PointerEvent<HTMLSpanElement>) => {
    finishThumbDrag(event, railDragActiveRef.current)
  }

  const handleThumbPointerCancel = (event: PointerEvent<HTMLSpanElement>) => {
    finishThumbDrag(event, true)
  }

  const buildWalkthroughSteps = (
    calculation: CalculationResult,
    minPtfeWeightFraction: number | null,
  ): WalkthroughStep[] => {
    const cnfVol = calculation.composition.volumeFractions.cnf
    const cnfWt = calculation.composition.weightFractions.cnf
    const diff = Math.max(calculation.probability.diff, 0)
    const minimumCnfWt =
      calculation.inverse.minCnfWeightFraction === null
        ? text.unreachable
        : fmtPercent(calculation.inverse.minCnfWeightFraction)
    const minimumPtfeWt =
      minPtfeWeightFraction === null
        ? text.unreachable
        : fmtPercent(minPtfeWeightFraction)

    return [
      {
        title: locale === 'en' ? 'Step 1 · Normalize composition' : '1단계 · 조성 정규화',
        description:
          locale === 'en'
            ? 'Use AM/SE/CNF/PTFE on one solids basis and apply porosity.'
            : 'AM/SE/CNF/PTFE를 동일한 고형분 기준으로 정리하고 기공도를 반영합니다.',
        equation: 'wAM + wSE + wCNF + wPTFE = 1,  Vsolid = 1 - ε',
        value: `AM ${fmtPercent(calculation.composition.weightFractions.am)}, SE ${fmtPercent(calculation.composition.weightFractions.se)}, CNF ${fmtPercent(cnfWt)}, PTFE ${fmtPercent(calculation.composition.weightFractions.ptfe)}, ε ${fmtPercent(calculation.input.porosity)}`,
      },
      {
        title: locale === 'en' ? 'Step 2 · Convert wt% to vol%' : '2단계 · wt% → vol% 변환',
        description:
          locale === 'en'
            ? 'Convert mass fractions to volume fractions with densities.'
            : '밀도값으로 질량 조성을 부피 조성으로 변환합니다.',
        equation: 'Msolid = (1-ε)/Σ(wi/ρi),  φi = (wi·Msolid)/ρi',
        value: `CNF vol ${fmtPercent(cnfVol)}, AM vol ${fmtPercent(calculation.composition.volumeFractions.am)}, SE vol ${fmtPercent(calculation.composition.volumeFractions.se)}`,
      },
      {
        title:
          locale === 'en'
            ? 'Step 3 · Accessible volume and Veff'
            : '3단계 · 가용부피/유효농도(Veff)',
        description:
          locale === 'en'
            ? 'Apply the selected accessible-volume rule and compute Veff.'
            : '선택한 가용부피 규칙을 적용하고 Veff를 계산합니다.',
        equation: 'Vavailable = rule(AM, SE),  Veff = φCNF / Vavailable',
        value: `Vavailable ${fmtNumber(calculation.probability.vAvailable, 4)}, Veff ${fmtNumber(calculation.probability.veff, 5)}`,
      },
      {
        title:
          locale === 'en'
            ? 'Step 4 · Active threshold'
            : '4단계 · 활성 임계치(Vth_active)',
        description:
          locale === 'en'
            ? 'Derive active threshold from threshold mode and geometry.'
            : '선택한 임계치 모드와 기하 파라미터로 활성 임계치를 결정합니다.',
        equation: 'Δ = max(Veff - Vth_active, 0)',
        value: `Vth_active ${fmtNumber(calculation.thresholds.active, 6)}, Δ ${fmtNumber(diff, 6)}`,
      },
      {
        title:
          locale === 'en'
            ? 'Step 5 · Probability and conductivity'
            : '5단계 · 확률/전도도 계산',
        description:
          locale === 'en'
            ? 'Compute percolation and conductivity from Δ.'
            : 'Δ 기반으로 퍼콜레이션 확률과 전도도를 계산합니다.',
        equation: 'Praw = P0·Δ^β,  P = min(Praw, 1),  σ = σ0·Δ^t',
        value: `P ${fmtPercent(calculation.probability.pCapped)} (raw ${fmtNumber(calculation.probability.pRaw, 4)}), σ ${fmtNumber(calculation.probability.sigma, 2)} S/m`,
      },
      {
        title:
          locale === 'en'
            ? 'Step 6 · Inverse minimum CNF/PTFE'
            : '6단계 · 최소 CNF/PTFE 역산',
        description:
          locale === 'en'
            ? 'Back-solve minimum CNF(wt%) and minimum PTFE(wt%) that each reach target probability.'
            : '목표 확률을 만족하는 최소 CNF(wt%)와 최소 PTFE(wt%)를 각각 역산합니다.',
        equation:
          'min wCNF such that P_CNF(wCNF) ≥ Ptarget;  min wPTFE such that P_PTFE(wPTFE) ≥ Ptarget',
        value: `${locale === 'en' ? 'Target' : '목표'} ${fmtPercent(calculation.inverse.targetProbability)} → CNF ${minimumCnfWt}, PTFE ${minimumPtfeWt}`,
      },
    ]
  }

  const buildIonicWalkthroughSteps = (
    calculation: CalculationResult,
    ionic: IBranchResult,
  ): WalkthroughStep[] => {
    const minimumSeWt =
      ionic.inverse.minSeWeightFraction === null
        ? text.unreachable
        : fmtPercent(ionic.inverse.minSeWeightFraction)

    return [
      {
        title: locale === 'en' ? 'Step 1 · Convert composition to solid basis' : '1단계 · 고형분 기준 변환',
        description:
          locale === 'en'
            ? 'SE network is evaluated on solid skeleton basis (excluding porosity).'
            : 'SE 네트워크는 기공을 제외한 고형분 골격 기준으로 평가합니다.',
        equation: 'VSE,solid = VSE / (1 - ε)',
        value: `VSE ${fmtPercent(calculation.composition.volumeFractions.se)} → VSE,solid ${fmtNumber(
          ionic.veff,
          5,
        )}`,
      },
      {
        title: locale === 'en' ? 'Step 2 · Set ionic threshold' : '2단계 · 이온 임계치 설정',
        description:
          locale === 'en'
            ? 'Use threshold mode and AM/SE size ratio to get active ionic threshold.'
            : '임계치 모드와 AM/SE 입경비로 활성 이온 임계치를 계산합니다.',
        equation: 'Vth,seg,ion = Vth,random / (1 + DAM / DSE)',
        value: `Vth,active ${fmtNumber(ionic.thresholds.active, 6)} (random ${fmtNumber(
          ionic.thresholds.random,
          6,
        )}, seg ${fmtNumber(ionic.thresholds.segregated, 6)})`,
      },
      {
        title: locale === 'en' ? 'Step 3 · Ionic probability and conductivity' : '3단계 · 이온 확률/전도도',
        description:
          locale === 'en'
            ? 'Apply the same percolation scaling law to ionic branch.'
            : '동일한 퍼콜레이션 스케일링 식을 이온 분기에 적용합니다.',
        equation: 'Pion = min(P0·max(Veff,ion - Vth,ion, 0)^β, 1),  σion = σ0·Δ^t',
        value: `P ${fmtPercent(ionic.pCapped)} (raw ${fmtNumber(ionic.pRaw, 4)}), σ ${fmtNumber(
          ionic.sigma,
          2,
        )} S/m`,
      },
      {
        title: locale === 'en' ? 'Step 4 · Inverse minimum SE' : '4단계 · 최소 SE 역산',
        description:
          locale === 'en'
            ? 'Back-solve minimum SE(wt%) to satisfy target probability.'
            : '목표 확률을 만족하는 최소 SE(wt%)를 역산합니다.',
        equation: 'min wSE such that Pion(wSE) ≥ Ptarget',
        value: `${locale === 'en' ? 'Target' : '목표'} ${fmtPercent(
          deferredAssumptions.targetProbability,
        )} → ${minimumSeWt}`,
      },
    ]
  }

  const buildCombinedWalkthroughSteps = (
    calculation: CalculationResult,
    ionic: IBranchResult,
    recommendation: DualRecommendation,
  ): WalkthroughStep[] => [
    {
      title: locale === 'en' ? 'Step 1 · Compute EC and IC independently' : '1단계 · EC/IC 독립 계산',
      description:
        locale === 'en'
          ? 'Evaluate EC on CNF network and IC on SE network under the same composition.'
          : '동일 조성에서 CNF 기반 EC와 SE 기반 IC를 각각 계산합니다.',
      equation: 'PEC = f(CNF),  PIC = f(SE)',
      value: `EC ${fmtPercent(calculation.probability.pCapped)}, IC ${fmtPercent(ionic.pCapped)}`,
    },
    {
      title: locale === 'en' ? 'Step 2 · Inverse minima for dual target' : '2단계 · 이중 타깃 최소치 역산',
      description:
        locale === 'en'
          ? 'Back-solve minimum CNF and minimum SE for the same target probability.'
          : '같은 목표 확률에 대해 최소 CNF와 최소 SE를 각각 역산합니다.',
      equation: 'min wCNF, min wSE such that PEC ≥ Ptarget and PIC ≥ Ptarget',
      value: `CNF ${fmtPercent(calculation.inverse.minCnfWeightFraction ?? 0)}, SE ${fmtPercent(
        ionic.inverse.minSeWeightFraction ?? 0,
      )}`,
    },
    {
      title: locale === 'en' ? 'Step 3 · Recommend EC+IC composition' : '3단계 · EC+IC 추천 조성',
      description:
        locale === 'en'
          ? 'Combine both minima, adjust AM by mass balance, and check both targets.'
          : '두 최소치를 결합하고 질량수지로 AM을 보정한 뒤 두 타깃 만족 여부를 확인합니다.',
      equation: 'wAM = 1 - wSE - wCNF - wPTFE',
      value: recommendation.feasible
        ? `AM ${fmtPercent(recommendation.amWeightFraction)}, SE ${fmtPercent(
            recommendation.seWeightFraction,
          )}, CNF ${fmtPercent(recommendation.cnfWeightFraction)}, PTFE ${fmtPercent(
            recommendation.ptfeWeightFraction,
          )}`
        : text.unreachable,
    },
  ]

  const selectedWalkthroughCase = {
    key: result.input.id,
    label: result.input.label[locale],
    calculation: result,
  }
  const selectedWalkthroughSteps =
    transportTab === 'ec'
      ? buildWalkthroughSteps(
          selectedWalkthroughCase.calculation,
          displayedMinPtfeWeightFraction,
        )
      : transportTab === 'ic'
        ? buildIonicWalkthroughSteps(selectedWalkthroughCase.calculation, ionicResult)
        : buildCombinedWalkthroughSteps(
            selectedWalkthroughCase.calculation,
            ionicResult,
            dualRecommendation,
          )
  const walkthroughModelText =
    transportTab === 'ec'
      ? `${networkModelLabels[deferredAssumptions.networkModel][locale]} 쨌 ${
          accessibleRuleLabels[deferredAssumptions.accessibleVolumeRule][locale]
        } 쨌 ${thresholdModeLabels[deferredAssumptions.thresholdMode][locale]}`
      : transportTab === 'ic'
        ? locale === 'en'
          ? `${networkModelLabels[deferredAssumptions.networkModel][locale]} · solid-basis SE network`
          : `${networkModelLabels[deferredAssumptions.networkModel][locale]} · 고형분 기준 SE 네트워크`
        : locale === 'en'
          ? 'Dual target: EC(CNF) + IC(SE)'
          : '이중 타깃: EC(CNF) + IC(SE)'
  const selectedCaseTypeLabel =
    result.input.id === customCaseTemplate.id ? currentCaseTitle : presetCaseTitle

  useEffect(
    () => () => {
      clearRailLongPressTimer()
    },
    [],
  )

  return (
    <div className="shell">
      <header className="hero-panel">
        <div>
          <p className="eyebrow">{text.eyebrow}</p>
          <h1>{text.title}</h1>
          <p className="subtitle">{text.subtitle}</p>
        </div>
        <div className="hero-actions">
          <div className="language-toggle" role="tablist" aria-label="Language">
            {(['en', 'ko'] as const).map((code) => (
              <button
                key={code}
                className={code === locale ? 'active' : ''}
                onClick={() => startTransition(() => setLocale(code))}
              >
                {languageNames[code]}
              </button>
            ))}
          </div>
          <button className="copy-button" onClick={handleCopySummary}>
            {text.copySummary}
          </button>
          <p className="copy-status" aria-live="polite">
            {copyStatus === 'copied'
              ? text.copied
              : copyStatus === 'failed'
                ? text.copyFailed
                : ''}
          </p>
        </div>
      </header>

      <nav className="transport-tabs" aria-label="Transport model tabs">
        {(['ec', 'ic', 'ecic'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            className={transportTab === tab ? 'active' : ''}
            onClick={() => setTransportTab(tab)}
          >
            {transportTabLabel[tab]}
          </button>
        ))}
      </nav>

      <main className="workspace">
        <section className="sidebar">
          <article className="panel">
            <div className="panel-heading">
              <h2>{text.caseSetup}</h2>
              <p>{text.summaryNote}</p>
            </div>
            <div className="preset-grid">
              {presetCases.map((preset) => (
                <button
                  key={preset.id}
                  className={currentInput.id === preset.id ? 'preset active' : 'preset'}
                  onClick={() => loadPreset(preset.id)}
                >
                  {text.loadPreset}: {preset.label[locale]}
                </button>
              ))}
              <button
                className={currentInput.id === 'custom' ? 'preset active' : 'preset'}
                onClick={loadCustom}
              >
                {text.customCase}
              </button>
            </div>
            <p className="current-case">
              {text.currentCase}: <strong>{currentInput.label[locale]}</strong>
            </p>
            <SelectField
              label={text.mode}
              value={currentInput.mode}
              onChange={(next) => setCaseMode(next as CompositionMode)}
              options={(
                Object.keys(compositionModeLabels) as Array<CompositionMode>
              ).map((mode) => ({
                value: mode,
                label: compositionModeLabels[mode][locale],
              }))}
            />
            <div className="field-grid">
              {currentInput.mode === 'presetMixed' && (
                <>
                  <NumberField
                    label={text.amWt}
                    value={currentInput.amWeightFraction}
                    onChange={(next) =>
                      setPresetWeightValue('amWeightFraction', next)
                    }
                    percent
                  />
                  <NumberField
                    label={text.seWt}
                    value={currentInput.seWeightFraction}
                    onChange={(next) =>
                      setPresetWeightValue('seWeightFraction', next)
                    }
                    percent
                  />
                  <NumberField
                    label={text.cnfWt}
                    value={currentInput.cnfWeightFraction}
                    onChange={(next) =>
                      setPresetWeightValue('cnfWeightFraction', next)
                    }
                    percent
                  />
                  <NumberField
                    label={text.ptfeWt}
                    value={currentInput.ptfeWeightFraction}
                    onChange={(next) =>
                      setPresetWeightValue('ptfeWeightFraction', next)
                    }
                    percent
                  />
                  <NumberField
                    label={text.sum}
                    value={weightFractionSum ?? 0}
                    onChange={() => {}}
                    percent
                    readOnly
                  />
                  <div
                    className={`sum-status ${
                      isWeightFractionSumValid
                        ? 'sum-status--ok'
                        : 'sum-status--warn'
                    }`}
                  >
                    <span>
                      {isWeightFractionSumValid ? sumOkLabel : sumAdjustLabel}
                    </span>
                    <strong>{fmtPercent(weightFractionSum ?? 0)}</strong>
                  </div>
                </>
              )}
              {currentInput.mode === 'directVolume' && (
                <>
                  <NumberField
                    label={text.amVol}
                    value={currentInput.amVolFraction}
                    onChange={(next) => setCaseValue({ amVolFraction: next })}
                    percent
                  />
                  <NumberField
                    label={text.seVol}
                    value={currentInput.seVolFraction}
                    onChange={(next) => setCaseValue({ seVolFraction: next })}
                    percent
                  />
                  <NumberField
                    label={text.cnfVol}
                    value={currentInput.cnfVolFraction}
                    onChange={(next) => setCaseValue({ cnfVolFraction: next })}
                    percent
                  />
                  <NumberField
                    label={text.ptfeVol}
                    value={currentInput.ptfeVolFraction}
                    onChange={(next) => setCaseValue({ ptfeVolFraction: next })}
                    percent
                  />
                </>
              )}
              {currentInput.mode === 'directWeight' && (
                <>
                  <NumberField
                    label={text.amWt}
                    value={currentInput.amWeightFraction}
                    onChange={(next) => setCaseValue({ amWeightFraction: next })}
                    percent
                  />
                  <NumberField
                    label={text.seWt}
                    value={currentInput.seWeightFraction}
                    onChange={(next) => setCaseValue({ seWeightFraction: next })}
                    percent
                  />
                  <NumberField
                    label={text.cnfWt}
                    value={currentInput.cnfWeightFraction}
                    onChange={(next) => setCaseValue({ cnfWeightFraction: next })}
                    percent
                  />
                  <NumberField
                    label={text.ptfeWt}
                    value={currentInput.ptfeWeightFraction}
                    onChange={(next) => setCaseValue({ ptfeWeightFraction: next })}
                    percent
                  />
                  <NumberField
                    label={text.sum}
                    value={weightFractionSum ?? 0}
                    onChange={() => {}}
                    percent
                    readOnly
                  />
                  <div
                    className={`sum-status ${
                      isWeightFractionSumValid
                        ? 'sum-status--ok'
                        : 'sum-status--warn'
                    }`}
                  >
                    <span>
                      {isWeightFractionSumValid ? sumOkLabel : sumAdjustLabel}
                    </span>
                    <strong>{fmtPercent(weightFractionSum ?? 0)}</strong>
                  </div>
                </>
              )}
              <NumberField
                label={text.porosity}
                value={currentInput.porosity}
                onChange={(next) => setCaseValue({ porosity: next })}
                percent
              />
            </div>
            <div className="case-setup-actions">
              <button
                type="button"
                className="result-jump-button"
                onClick={scrollToResults}
              >
                {jumpToResultsLabel}
              </button>
            </div>
          </article>

          <article className="panel">
            <div className="panel-heading">
              <h2>{text.densities}</h2>
            </div>
            <div className="field-grid">
              <NumberField
                label={text.amDensity}
                value={densities.am}
                onChange={(next) => updateDensity('am', next)}
              />
              <NumberField
                label={text.seDensity}
                value={densities.se}
                onChange={(next) => updateDensity('se', next)}
              />
              <NumberField
                label={text.cnfDensity}
                value={densities.cnf}
                onChange={(next) => updateDensity('cnf', next)}
              />
              <NumberField
                label={text.ptfeDensity}
                value={densities.ptfe}
                onChange={(next) => updateDensity('ptfe', next)}
              />
            </div>
          </article>

          <article className="panel">
            <div className="panel-heading">
              <h2>{text.geometry}</h2>
            </div>
            <div className="field-grid">
              <NumberField
                label={text.cnfAspectRatio}
                value={geometry.cnfAspectRatio}
                onChange={(next) => updateGeometry('cnfAspectRatio', next)}
                step="1"
              />
              <NumberField
                label={text.ptfeAspectRatio}
                value={geometry.ptfeAspectRatio}
                onChange={(next) => updateGeometry('ptfeAspectRatio', next)}
                step="1"
              />
              <NumberField
                label={text.amParticle}
                value={geometry.amParticleSizeUm}
                onChange={(next) => updateGeometry('amParticleSizeUm', next)}
              />
              <NumberField
                label={text.seParticle}
                value={geometry.seParticleSizeUm}
                onChange={(next) => updateGeometry('seParticleSizeUm', next)}
              />
              <NumberField
                label={cnfDiameterLabel}
                value={geometry.additiveSizeUm}
                onChange={(next) => updateGeometry('additiveSizeUm', next)}
              />
              <NumberField
                label={ptfeFibrilDiameterLabel}
                value={geometry.ptfeFibrilSizeUm}
                onChange={(next) => updateGeometry('ptfeFibrilSizeUm', next)}
              />
            </div>
          </article>

          <article className="panel">
            <div className="panel-heading">
              <h2>{text.assumptions}</h2>
            </div>
            <div className="field-grid">
              <SelectField
                label={text.thresholdMode}
                value={assumptions.thresholdMode}
                onChange={(next) =>
                  updateAssumption('thresholdMode', next as ModelAssumptions['thresholdMode'])
                }
                options={(
                  Object.keys(thresholdModeLabels) as Array<
                    ModelAssumptions['thresholdMode']
                  >
                ).map((mode) => ({
                  value: mode,
                  label: thresholdModeLabels[mode][locale],
                }))}
              />
              <SelectField
                label={text.networkModel}
                value={assumptions.networkModel}
                onChange={(next) =>
                  updateAssumption('networkModel', next as ModelAssumptions['networkModel'])
                }
                options={(
                  Object.keys(networkModelLabels) as Array<
                    ModelAssumptions['networkModel']
                  >
                ).map((mode) => ({
                  value: mode,
                  label: networkModelLabels[mode][locale],
                }))}
              />
              <SelectField
                label={text.accessibleRule}
                value={assumptions.accessibleVolumeRule}
                onChange={(next) =>
                  updateAssumption(
                    'accessibleVolumeRule',
                    next as ModelAssumptions['accessibleVolumeRule'],
                  )
                }
                options={(
                  Object.keys(accessibleRuleLabels) as Array<AccessibleVolumeRule>
                ).map((rule) => ({
                  value: rule,
                  label: accessibleRuleLabels[rule][locale],
                }))}
              />
              <SelectField
                label={text.binderRule}
                value={assumptions.binderAccessibleVolumeRule}
                onChange={(next) =>
                  updateAssumption(
                    'binderAccessibleVolumeRule',
                    next as ModelAssumptions['binderAccessibleVolumeRule'],
                  )
                }
                options={(
                  Object.keys(accessibleRuleLabels) as Array<AccessibleVolumeRule>
                ).map((rule) => ({
                  value: rule,
                  label: accessibleRuleLabels[rule][locale],
                }))}
              />
              <SelectField
                label={ptfeModelLabel}
                value={ptfeModelMode}
                onChange={(next) => setPtfeModelMode(next as PtfeModelMode)}
                options={(Object.keys(ptfeModelSpecs) as PtfeModelMode[]).map((mode) => ({
                  value: mode,
                  label: ptfeModelSpecs[mode].label[locale],
                }))}
              />
              <button
                type="button"
                className="ptfe-comparison-jump-button"
                onClick={scrollToPtfeComparison}
              >
                {ptfeComparisonJumpLabel}
              </button>
              <NumberField
                label={text.beta}
                value={assumptions.beta}
                onChange={(next) => updateAssumption('beta', next)}
              />
              <NumberField
                label={text.t}
                value={assumptions.t}
                onChange={(next) => updateAssumption('t', next)}
              />
              <NumberField
                label={text.p0}
                value={assumptions.p0}
                onChange={(next) => updateAssumption('p0', next)}
              />
              <NumberField
                label={text.sigma0}
                value={assumptions.sigma0}
                onChange={(next) => updateAssumption('sigma0', next)}
              />
              <NumberField
                label={text.targetProbability}
                value={assumptions.targetProbability}
                onChange={(next) => updateAssumption('targetProbability', next)}
              />
              {assumptions.thresholdMode !== 'direct' && (
                <NumberField
                  label={text.vthIdeal}
                  value={assumptions.vthIdeal}
                  onChange={(next) => updateAssumption('vthIdeal', next)}
                />
              )}
              {assumptions.thresholdMode === 'direct' && (
                <>
                  <NumberField
                    label={text.directRandom}
                    value={assumptions.directVthRandom}
                    onChange={(next) => updateAssumption('directVthRandom', next)}
                  />
                  <NumberField
                    label={text.directSegregated}
                    value={assumptions.directVthSegregated}
                    onChange={(next) => updateAssumption('directVthSegregated', next)}
                  />
                </>
              )}
            </div>
          </article>
        </section>

        <section className="content">
          <article className="panel" id="results-panel">
            <div className="panel-heading panel-heading--row">
              <h2>
                {transportTab === 'ec'
                  ? text.results
                  : transportTab === 'ic'
                    ? ionicResultsLabel
                    : dualResultsLabel}
              </h2>
              <button
                type="button"
                className="logic-jump-button"
                onClick={scrollToLogic}
              >
                {jumpToLogicLabel}
              </button>
            </div>
            <div className="results-grid">
              {transportTab === 'ec' ? (
                <>
                  <ResultCard label={text.probability} value={fmtPercent(result.probability.pCapped)} tone="accent" />
                  <ResultCard label={text.probabilityRaw} value={fmtNumber(result.probability.pRaw, 4)} />
                  <ResultCard
                    label={text.conductivity}
                    value={`${fmtNumber(result.probability.sigma, 2)} S/m`}
                    tone="accent"
                  />
                  <ResultCard label={text.vAvailable} value={fmtNumber(result.probability.vAvailable, 4)} />
                  <ResultCard label={text.veff} value={fmtNumber(result.probability.veff, 5)} />
                  <ResultCard label={text.activeThreshold} value={fmtNumber(result.thresholds.active, 6)} />
                  <ResultCard
                    label={text.minCnfWt}
                    value={
                      result.inverse.minCnfWeightFraction === null
                        ? text.unreachable
                        : fmtPercent(result.inverse.minCnfWeightFraction)
                    }
                    tone="accent"
                  />
                  <ResultCard
                    label={text.minCnfVol}
                    value={
                      result.inverse.minCnfVolFraction === null
                        ? text.unreachable
                        : fmtPercent(result.inverse.minCnfVolFraction)
                    }
                  />
                  <ResultCard
                    label={minPtfeWtLabel}
                    value={
                      displayedMinPtfeWeightFraction === null
                        ? text.unreachable
                        : fmtPercent(displayedMinPtfeWeightFraction)
                    }
                    tone="accent"
                  />
                  <ResultCard
                    label={minPtfeVolLabel}
                    value={
                      displayedMinPtfeVolFraction === null
                        ? text.unreachable
                        : fmtPercent(displayedMinPtfeVolFraction)
                    }
                  />
                </>
              ) : null}
              {transportTab === 'ic' ? (
                <>
                  <ResultCard label={text.probability} value={fmtPercent(ionicResult.pCapped)} tone="accent" />
                  <ResultCard label={text.probabilityRaw} value={fmtNumber(ionicResult.pRaw, 4)} />
                  <ResultCard label={text.conductivity} value={`${fmtNumber(ionicResult.sigma, 2)} S/m`} />
                  <ResultCard label={text.vAvailable} value={fmtNumber(ionicResult.vAvailable, 4)} />
                  <ResultCard label={text.veff} value={fmtNumber(ionicResult.veff, 5)} />
                  <ResultCard label={text.activeThreshold} value={fmtNumber(ionicResult.thresholds.active, 6)} />
                  <ResultCard
                    label={minSeWtLabel}
                    value={
                      ionicResult.inverse.minSeWeightFraction === null
                        ? text.unreachable
                        : fmtPercent(ionicResult.inverse.minSeWeightFraction)
                    }
                  />
                  <ResultCard
                    label={minSeVolLabel}
                    value={
                      ionicResult.inverse.minSeVolFraction === null
                        ? text.unreachable
                        : fmtPercent(ionicResult.inverse.minSeVolFraction)
                    }
                  />
                </>
              ) : null}
              {transportTab === 'ecic' ? (
                <>
                  <ResultCard label="EC probability" value={fmtPercent(result.probability.pCapped)} tone="accent" />
                  <ResultCard label="IC probability" value={fmtPercent(ionicResult.pCapped)} tone="accent" />
                  <ResultCard
                    label="EC conductivity"
                    value={`${fmtNumber(result.probability.sigma, 2)} S/m`}
                    tone="accent"
                  />
                  <ResultCard label="IC conductivity" value={`${fmtNumber(ionicResult.sigma, 2)} S/m`} />
                  <ResultCard
                    label={text.minCnfWt}
                    value={
                      result.inverse.minCnfWeightFraction === null
                        ? text.unreachable
                        : fmtPercent(result.inverse.minCnfWeightFraction)
                    }
                    tone="accent"
                  />
                  <ResultCard
                    label={minSeWtLabel}
                    value={
                      ionicResult.inverse.minSeWeightFraction === null
                        ? text.unreachable
                        : fmtPercent(ionicResult.inverse.minSeWeightFraction)
                    }
                  />
                  <ResultCard
                    label={locale === 'en' ? 'Recommended AM wt%' : '추천 AM wt%'}
                    value={fmtPercent(dualRecommendation.amWeightFraction)}
                  />
                  <ResultCard
                    label={locale === 'en' ? 'Recommended SE wt%' : '추천 SE wt%'}
                    value={fmtPercent(dualRecommendation.seWeightFraction)}
                  />
                  <ResultCard
                    label={locale === 'en' ? 'Recommended CNF wt%' : '추천 CNF wt%'}
                    value={fmtPercent(dualRecommendation.cnfWeightFraction)}
                  />
                  <ResultCard
                    label={locale === 'en' ? 'Dual-target check' : '이중 타깃 만족 여부'}
                    value={
                      dualRecommendation.feasible
                        ? locale === 'en'
                          ? 'Pass'
                          : '만족'
                        : locale === 'en'
                          ? 'Needs adjustment'
                          : '추가 조정 필요'
                    }
                  />
                </>
              ) : null}
            </div>

            <div className="tables">
              <div className="table-card">
                <h3>{text.composition}</h3>
                <table className="responsive-table">
                  <thead>
                    <tr>
                      <th>{text.tableComponent}</th>
                      <th>{text.tableVolume}</th>
                      <th>{text.tableWeight}</th>
                      <th>{text.tableMass}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['AM', result.composition.volumeFractions.am, result.composition.weightFractions.am, result.composition.masses.am],
                      ['SE', result.composition.volumeFractions.se, result.composition.weightFractions.se, result.composition.masses.se],
                      ['CNF', result.composition.volumeFractions.cnf, result.composition.weightFractions.cnf, result.composition.masses.cnf],
                      ['PTFE', result.composition.volumeFractions.ptfe, result.composition.weightFractions.ptfe, result.composition.masses.ptfe],
                    ].map(([label, vol, wt, mass]) => (
                      <tr key={label}>
                        <td data-label={text.tableComponent}>{label}</td>
                        <td data-label={text.tableVolume}>{fmtPercent(vol as number)}</td>
                        <td data-label={text.tableWeight}>{fmtPercent(wt as number)}</td>
                        <td data-label={text.tableMass}>{fmtNumber(mass as number, 4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="table-card">
                <h3>{text.binder}</h3>
                <p className="ptfe-binder-model-note">
                  {selectedPtfeModelSpec.label[locale]} ({selectedPtfeModelSpec.short[locale]})
                </p>
                <div className="mini-stats">
                  <div>
                    <span>{text.binderProbability}</span>
                    <strong>{fmtPercent(selectedPtfeModelResult.binder.probability.pCapped)}</strong>
                  </div>
                  <div>
                    <span>{text.binderVeff}</span>
                    <strong>{fmtNumber(selectedPtfeModelResult.binder.probability.veff, 5)}</strong>
                  </div>
                  <div>
                    <span>{text.binderThreshold}</span>
                    <strong>{fmtNumber(selectedPtfeModelResult.binder.thresholds.active, 6)}</strong>
                  </div>
                </div>
              </div>
            </div>
          </article>

          {transportTab === 'ec' ? (
            <article className="panel">
              <div className="panel-heading">
                <h2>{reverseDesignTitle}</h2>
                <p>{reverseDesignSubtitle}</p>
              </div>
              <div className="reverse-note-card">
                <strong>{reverseAdditiveObjectiveLabel}</strong>
                <p>{reverseModelLockNote}</p>
              </div>
              <div className="field-grid reverse-controls-grid">
                <NumberField
                  label={reverseFixedPtfeLabel}
                  value={reverseDesignConfig.fixedPtfeWeightFraction}
                  onChange={(next) => updateReverseDesign('fixedPtfeWeightFraction', next)}
                  percent
                />
                <NumberField
                  label={reverseTargetPLabel}
                  value={reverseDesignConfig.targetProbability}
                  onChange={(next) => updateReverseDesign('targetProbability', next)}
                  percent
                />
                <NumberField
                  label={reversePorosityLabel}
                  value={reverseDesignConfig.porosity}
                  onChange={(next) => updateReverseDesign('porosity', next)}
                  percent
                />
                <SelectField
                  label={reverseSeModeLabel}
                  value={reverseDesignConfig.seMode}
                  onChange={(next) => updateReverseDesign('seMode', next as ReverseSeMode)}
                  options={[
                    { value: 'fixed', label: reverseFixedModeOption },
                    { value: 'optimize', label: reverseOptimizeModeOption },
                  ]}
                />
                {reverseDesignConfig.seMode === 'fixed' ? (
                  <NumberField
                    label={reverseFixedSeLabel}
                    value={reverseDesignConfig.fixedSeWeightFraction}
                    onChange={(next) => updateReverseDesign('fixedSeWeightFraction', next)}
                    percent
                  />
                ) : (
                  <>
                    <NumberField
                      label={reverseSeMinLabel}
                      value={reverseDesignConfig.seRangeMin}
                      onChange={(next) => updateReverseDesign('seRangeMin', next)}
                      percent
                    />
                    <NumberField
                      label={reverseSeMaxLabel}
                      value={reverseDesignConfig.seRangeMax}
                      onChange={(next) => updateReverseDesign('seRangeMax', next)}
                      percent
                    />
                    <NumberField
                      label={reverseSeStepLabel}
                      value={reverseDesignConfig.seStep}
                      onChange={(next) => updateReverseDesign('seStep', next)}
                      percent
                    />
                  </>
                )}
                <NumberField
                  label={reversePtfeMinLabel}
                  value={reverseDesignConfig.ptfeRangeMin}
                  onChange={(next) => updateReverseDesign('ptfeRangeMin', next)}
                  percent
                />
                <NumberField
                  label={reversePtfeMaxLabel}
                  value={reverseDesignConfig.ptfeRangeMax}
                  onChange={(next) => updateReverseDesign('ptfeRangeMax', next)}
                  percent
                />
                <NumberField
                  label={reverseCnfMinLabel}
                  value={reverseDesignConfig.cnfRangeMin}
                  onChange={(next) => updateReverseDesign('cnfRangeMin', next)}
                  percent
                />
                <NumberField
                  label={reverseCnfMaxLabel}
                  value={reverseDesignConfig.cnfRangeMax}
                  onChange={(next) => updateReverseDesign('cnfRangeMax', next)}
                  percent
                />
                <NumberField
                  label={reverseCnfStepLabel}
                  value={reverseDesignConfig.cnfStep}
                  onChange={(next) => updateReverseDesign('cnfStep', next)}
                  percent
                />
              </div>

              {reverseDesignResult.best ? (
                <>
                  <div className="panel-heading reverse-result-heading">
                    <h3>{reverseRecommendedLabel}</h3>
                    <p>
                      {reverseFeasibleLabel}: {reverseDesignResult.feasibleCount} / {reverseDesignResult.evaluatedCount}
                    </p>
                  </div>
                  <div className="results-grid">
                    <ResultCard
                      label={locale === 'en' ? 'Recommended AM wt%' : '권장 AM wt%'}
                      value={fmtPercent(reverseDesignResult.best.amWeightFraction)}
                    />
                    <ResultCard
                      label={locale === 'en' ? 'Recommended SE wt%' : '권장 SE wt%'}
                      value={fmtPercent(reverseDesignResult.best.seWeightFraction)}
                    />
                    <ResultCard
                      label={locale === 'en' ? 'Recommended CNF wt%' : '권장 CNF wt%'}
                      value={fmtPercent(reverseDesignResult.best.cnfWeightFraction)}
                      tone="accent"
                    />
                    <ResultCard
                      label={locale === 'en' ? 'Fixed PTFE wt% (applied)' : '고정 PTFE wt% (적용)'}
                      value={fmtPercent(reverseDesignResult.fixedPtfeApplied)}
                      tone="accent"
                    />
                    <ResultCard
                      label={text.probability}
                      value={fmtPercent(reverseDesignResult.best.calculation.probability.pCapped)}
                      tone="accent"
                    />
                    <ResultCard
                      label={text.conductivity}
                      value={`${fmtNumber(reverseDesignResult.best.calculation.probability.sigma, 2)} S/m`}
                      tone="accent"
                    />
                    <ResultCard
                      label={text.veff}
                      value={fmtNumber(reverseDesignResult.best.calculation.probability.veff, 5)}
                    />
                    <ResultCard
                      label={reverseMarginLabel}
                      value={fmtNumber(reverseDesignResult.best.margin, 6)}
                    />
                    <ResultCard
                      label={locale === 'en' ? 'Minimum additives (CNF + PTFE)' : '최소 첨가제 합 (CNF + PTFE)'}
                      value={fmtPercent(reverseDesignResult.best.additiveFraction)}
                    />
                    <ResultCard
                      label={reverseEvaluatedLabel}
                      value={`${reverseDesignResult.evaluatedCount}`}
                    />
                  </div>
                </>
              ) : (
                <div className="reverse-empty-state">
                  <p>{reverseNoSolutionMessage}</p>
                </div>
              )}

              {reverseDesignResult.warnings.length > 0 ? (
                <ul className="warning-list reverse-warning-list">
                  {reverseDesignResult.warnings.map((warning) => (
                    <li key={warning} className="warning warning--info">
                      {locale === 'en'
                        ? warning
                        : warning ===
                            'PTFE input was clamped to the configured practical PTFE range.'
                          ? '입력 PTFE 값이 설정된 실용 범위로 자동 보정되었습니다.'
                          : '설정한 CNF/PTFE/SE 범위 내에서 만족하는 후보를 찾지 못했습니다.'}
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="curve-wrapper reverse-phase-wrapper">
                <div className="panel-heading">
                  <h3>{reverseMapTitle}</h3>
                  <p>{reverseMapSubtitle}</p>
                </div>
                <ReversePhaseMap
                  data={reversePhaseMap}
                  targetProbability={reverseDesignConfig.targetProbability}
                  locale={locale}
                />
              </div>
            </article>
          ) : null}

          <article className="panel">
            <div className="panel-heading">
              <h2>
                {transportTab === 'ec'
                  ? text.comparison
                  : transportTab === 'ic'
                    ? locale === 'en'
                      ? 'IC preset comparison'
                      : 'IC 프리셋 비교'
                    : locale === 'en'
                      ? 'EC + IC preset comparison'
                      : 'EC + IC 프리셋 비교'}
              </h2>
            </div>
            <div className="table-card">
              <table className="responsive-table">
                <thead>
                  {transportTab === 'ec' ? (
                    <tr>
                      <th>{text.caseName}</th>
                      <th>{text.probability}</th>
                      <th>{text.conductivity}</th>
                      <th>{text.minCnfWt}</th>
                      <th>{text.minCnfVol}</th>
                      <th>{minPtfeWtLabel}</th>
                      <th>{minPtfeVolLabel}</th>
                    </tr>
                  ) : null}
                  {transportTab === 'ic' ? (
                    <tr>
                      <th>{text.caseName}</th>
                      <th>{text.probability}</th>
                      <th>{text.conductivity}</th>
                      <th>{minSeWtLabel}</th>
                      <th>{minSeVolLabel}</th>
                    </tr>
                  ) : null}
                  {transportTab === 'ecic' ? (
                    <tr>
                      <th>{text.caseName}</th>
                      <th>EC P</th>
                      <th>IC P</th>
                      <th>EC σ</th>
                      <th>IC σ</th>
                      <th>{text.minCnfWt}</th>
                      <th>{minSeWtLabel}</th>
                      <th>{locale === 'en' ? 'Recommendation' : '추천 조성'}</th>
                    </tr>
                  ) : null}
                </thead>
                <tbody>
                  {transportTab === 'ec'
                    ? comparison.map((entry) => {
                        const ptfeEntry = ptfeComparisonByCaseId.get(entry.input.id)
                        return (
                          <tr key={entry.input.id}>
                            <td data-label={text.caseName}>{entry.input.label[locale]}</td>
                            <td data-label={text.probability}>{fmtPercent(entry.probability.pCapped)}</td>
                            <td data-label={text.conductivity}>{fmtNumber(entry.probability.sigma, 2)} S/m</td>
                            <td data-label={text.minCnfWt}>
                              {entry.inverse.minCnfWeightFraction === null
                                ? text.unreachable
                                : fmtPercent(entry.inverse.minCnfWeightFraction)}
                            </td>
                            <td data-label={text.minCnfVol}>
                              {entry.inverse.minCnfVolFraction === null
                                ? text.unreachable
                                : fmtPercent(entry.inverse.minCnfVolFraction)}
                            </td>
                            <td data-label={minPtfeWtLabel}>
                              {ptfeEntry?.inverse.minPtfeWeightFraction === null ||
                              ptfeEntry?.inverse.minPtfeWeightFraction === undefined
                                ? text.unreachable
                                : fmtPercent(ptfeEntry.inverse.minPtfeWeightFraction)}
                            </td>
                            <td data-label={minPtfeVolLabel}>
                              {ptfeEntry?.inverse.minPtfeVolFraction === null ||
                              ptfeEntry?.inverse.minPtfeVolFraction === undefined
                                ? text.unreachable
                                : fmtPercent(ptfeEntry.inverse.minPtfeVolFraction)}
                            </td>
                          </tr>
                        )
                      })
                    : null}
                  {transportTab === 'ic'
                    ? ionicComparison.map(({ entry, ionic }) => (
                        <tr key={entry.input.id}>
                          <td data-label={text.caseName}>{entry.input.label[locale]}</td>
                          <td data-label={text.probability}>{fmtPercent(ionic.pCapped)}</td>
                          <td data-label={text.conductivity}>{fmtNumber(ionic.sigma, 2)} S/m</td>
                          <td data-label={minSeWtLabel}>
                            {ionic.inverse.minSeWeightFraction === null
                              ? text.unreachable
                              : fmtPercent(ionic.inverse.minSeWeightFraction)}
                          </td>
                          <td data-label={minSeVolLabel}>
                            {ionic.inverse.minSeVolFraction === null
                              ? text.unreachable
                              : fmtPercent(ionic.inverse.minSeVolFraction)}
                          </td>
                        </tr>
                      ))
                    : null}
                  {transportTab === 'ecic'
                    ? dualComparison.map(({ entry, ionic, recommendation }) => (
                        <tr key={entry.input.id}>
                          <td data-label={text.caseName}>{entry.input.label[locale]}</td>
                          <td data-label="EC P">{fmtPercent(entry.probability.pCapped)}</td>
                          <td data-label="IC P">{fmtPercent(ionic.pCapped)}</td>
                          <td data-label="EC σ">{fmtNumber(entry.probability.sigma, 2)} S/m</td>
                          <td data-label="IC σ">{fmtNumber(ionic.sigma, 2)} S/m</td>
                          <td data-label={text.minCnfWt}>
                            {entry.inverse.minCnfWeightFraction === null
                              ? text.unreachable
                              : fmtPercent(entry.inverse.minCnfWeightFraction)}
                          </td>
                          <td data-label={minSeWtLabel}>
                            {ionic.inverse.minSeWeightFraction === null
                              ? text.unreachable
                              : fmtPercent(ionic.inverse.minSeWeightFraction)}
                          </td>
                          <td data-label={locale === 'en' ? 'Recommendation' : '추천 조성'}>
                            {recommendation.feasible
                              ? `AM ${fmtPercent(recommendation.amWeightFraction)}, SE ${fmtPercent(
                                  recommendation.seWeightFraction,
                                )}, CNF ${fmtPercent(
                                  recommendation.cnfWeightFraction,
                                )}, PTFE ${fmtPercent(recommendation.ptfeWeightFraction)}`
                              : text.unreachable}
                          </td>
                        </tr>
                      ))
                    : null}
                </tbody>
              </table>
            </div>
          </article><article className="panel">
            <div className="panel-heading">
              <h2>{text.warnings}</h2>
            </div>
            <ul className="warning-list">{renderWarnings(result.warnings)}</ul>
          </article>

          <article className="panel">
            <div className="panel-heading">
              <h2>{text.methods}</h2>
              <p>{text.methodsIntro}</p>
              <div className="inline-toggle" role="tablist" aria-label={text.equationView}>
                <button
                  className={equationView === 'code' ? 'active' : ''}
                  onClick={() => setEquationView('code')}
                >
                  {text.equationCode}
                </button>
                <button
                  className={equationView === 'book' ? 'active' : ''}
                  onClick={() => setEquationView('book')}
                >
                  {text.equationBook}
                </button>
              </div>
            </div>
            <div className="methods-grid">
              {equationSections.map((section) => (
                <EquationBlock
                  key={section.title}
                  title={section.title}
                  description={section.description}
                  equations={section.equations}
                  view={equationView}
                  selectedEquationId={selectedEquation.id}
                  onSelect={setSelectedEquationId}
                />
              ))}
            </div>
            <div className="equation-detail-card">
              <div className="panel-heading">
                <h3>{text.selectedEquation}</h3>
              </div>
              <div className={equationView === 'code' ? 'equation-code equation-detail-line' : 'equation-pretty equation-detail-line'}>
                {equationView === 'code' ? <code>{selectedEquation.code}</code> : selectedEquation.pretty}
              </div>
              <div className="detail-grid">
                <div>
                  <h4>{text.whyThisEquation}</h4>
                  <p>{selectedEquation.summary}</p>
                </div>
                <div>
                  <h4>{text.howToReadIt}</h4>
                  <p>{selectedEquation.explanation}</p>
                </div>
                <div>
                  <h4>{text.validityConditions}</h4>
                  <p>{selectedEquation.conditions}</p>
                </div>
              </div>
              {selectedEquation.variables.length > 0 ? (
                <div className="variables-card">
                  <h4>{text.variables}</h4>
                  <div className="variable-list">
                    {selectedEquation.variables.map((variable) => (
                      <div key={`${selectedEquation.id}-${variable.symbol}`} className="variable-row">
                        <code>{variable.symbol}</code>
                        <span>{variable.meaning}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
            {probabilityCurve ? (
              <div className="curve-wrapper">
                <div className="panel-heading">
                  <h3>{text.probabilityCurve}</h3>
                  <p>{text.probabilityCurveText}</p>
                </div>
                <ProbabilityCurve
                  points={probabilityCurve.points}
                  currentX={probabilityCurve.currentX}
                  currentY={probabilityCurve.currentY}
                  targetX={probabilityCurve.targetX}
                  targetY={probabilityCurve.targetY}
                  xLabel={text.cnfWt}
                  yLabel={text.probability}
                />
                <div className="curve-legend">
                  <span><i className="legend-swatch legend-swatch--current" /> {text.currentPoint}</span>
                  <span><i className="legend-swatch legend-swatch--target" /> {text.targetPoint}</span>
                </div>
              </div>
            ) : null}
            <div className="conditions-card">
              <h3>{text.methodsConditions}</h3>
              <ul className="conditions-list">
                <li>{text.methodsCondition1}</li>
                <li>{text.methodsCondition2}</li>
                <li>{text.methodsCondition3}</li>
                <li>{text.methodsCondition4}</li>
                <li>{text.methodsCondition5}</li>
                <li>{text.methodsCondition6}</li>
              </ul>
            </div>
            <div className="reference-card">
              <h3>{text.references}</h3>
              <p>{text.referencesText}</p>
            </div>
          </article>



          <article className="panel" id="cnf-model-comparison-section">
            <div className="panel-heading">
              <h2>{cnfComparisonSectionTitle}</h2>
              <p>{cnfComparisonSectionSubtitle}</p>
            </div>
            <div className="ptfe-comparison-callout">
              <strong>{cnfAccessibleRuleSpecs[deferredAssumptions.accessibleVolumeRule].label[locale]}</strong>
              <p>{cnfAccessibleRuleSpecs[deferredAssumptions.accessibleVolumeRule].description[locale]}</p>
            </div>
            <div className="table-card">
              <table className="responsive-table">
                <thead>
                  <tr>
                    <th>{cnfComparisonModelHeader}</th>
                    <th>{cnfComparisonAssumptionHeader}</th>
                    <th>{cnfComparisonAvailableHeader}</th>
                    <th>{cnfComparisonProbabilityHeader}</th>
                    <th>{cnfComparisonConductivityHeader}</th>
                    <th>{text.minCnfWt}</th>
                    <th>{text.minCnfVol}</th>
                  </tr>
                </thead>
                <tbody>
                  {cnfRuleComparisonRows.map((row) => (
                    <tr
                      key={row.rule}
                      className={
                        row.rule === deferredAssumptions.accessibleVolumeRule
                          ? 'ptfe-comparison-row-active'
                          : ''
                      }
                    >
                      <td data-label={cnfComparisonModelHeader}>
                        {row.spec.label[locale]}
                        {row.rule === deferredAssumptions.accessibleVolumeRule ? (
                          <span className="ptfe-comparison-selected-badge">
                            {locale === 'en' ? 'Selected' : '선택됨'}
                          </span>
                        ) : null}
                      </td>
                      <td data-label={cnfComparisonAssumptionHeader}>
                        {row.spec.description[locale]}
                      </td>
                      <td data-label={cnfComparisonAvailableHeader}>
                        <code>{row.spec.availableExpression}</code>
                      </td>
                      <td data-label={cnfComparisonProbabilityHeader}>
                        {fmtPercent(row.probability)}
                      </td>
                      <td data-label={cnfComparisonConductivityHeader}>
                        {fmtNumber(row.conductivity, 2)} S/m
                      </td>
                      <td data-label={text.minCnfWt}>
                        {row.minCnfWt === null ? text.unreachable : fmtPercent(row.minCnfWt)}
                      </td>
                      <td data-label={text.minCnfVol}>
                        {row.minCnfVol === null ? text.unreachable : fmtPercent(row.minCnfVol)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="ptfe-equation-grid">
              <div className="ptfe-equation-card">
                <h3>{locale === 'en' ? 'Core equations (book style)' : '핵심 식 (book 형식)'}</h3>
                <div className="equation-pretty">
                  <BookEquation
                    lhs={
                      <>
                        V<sub>eff,CNF</sub>
                      </>
                    }
                    rhs={
                      <>
                        V<sub>CNF</sub> / V<sub>available</sub>
                      </>
                    }
                  />
                </div>
                <div className="equation-pretty">
                  <BookEquation
                    lhs={
                      <>
                        P
                      </>
                    }
                    rhs={
                      <>
                        min(P<sub>0</sub> × max(V<sub>eff,CNF</sub> - V<sub>th</sub>, 0)
                        <sup>β</sup>, 1)
                      </>
                    }
                  />
                </div>
                <div className="equation-pretty">
                  <BookEquation
                    lhs={
                      <>
                        min w<sub>CNF</sub>
                      </>
                    }
                    rhs={
                      <>
                        argmin<sub>w</sub>{' '}
                        {'{'}P(w) ≥ P<sub>target</sub>{'}'}
                      </>
                    }
                  />
                </div>
              </div>
              <div className="ptfe-equation-card">
                <h3>{locale === 'en' ? 'Code-style assumptions' : '코드형 가정 정리'}</h3>
                <div className="equation-code">
                  <code>{'Full electrode: Vavailable = 1'}</code>
                </div>
                <div className="equation-code">
                  <code>{'Exclude AM: Vavailable = 1 - VAM'}</code>
                </div>
                <div className="equation-code">
                  <code>{'Exclude AM+SE: Vavailable = 1 - VAM - VSE'}</code>
                </div>
                <p className="ptfe-equation-note">
                  {locale === 'en'
                    ? 'As Vavailable gets smaller, Veff,CNF increases for the same CNF loading, so percolation is reached with less CNF.'
                    : '같은 CNF 함량에서도 Vavailable이 작아질수록 Veff,CNF가 커지므로 퍼콜레이션 달성이 더 쉬워집니다.'}
                </p>
              </div>
            </div>
          </article>

          <article className="panel" id="ptfe-model-comparison-section">
            <div className="panel-heading">
              <h2>{ptfeComparisonSectionTitle}</h2>
              <p>{ptfeComparisonSectionSubtitle}</p>
            </div>
            <div className="ptfe-comparison-callout">
              <strong>{ptfeModelSpecs[ptfeModelMode].label[locale]}</strong>
              <p>{ptfeModelSpecs[ptfeModelMode].description[locale]}</p>
            </div>
            <div className="table-card">
              <table className="responsive-table">
                <thead>
                  <tr>
                    <th>{ptfeComparisonModelHeader}</th>
                    <th>{ptfeComparisonAssumptionHeader}</th>
                    <th>{ptfeComparisonProbabilityHeader}</th>
                    <th>{ptfeComparisonConductivityHeader}</th>
                    <th>{minPtfeWtLabel}</th>
                    <th>{minPtfeVolLabel}</th>
                  </tr>
                </thead>
                <tbody>
                  {ptfeModelComparisonRows.map((row) => (
                    <tr
                      key={row.mode}
                      className={row.mode === ptfeModelMode ? 'ptfe-comparison-row-active' : ''}
                    >
                      <td data-label={ptfeComparisonModelHeader}>
                        {row.spec.label[locale]}
                        {row.mode === ptfeModelMode ? (
                          <span className="ptfe-comparison-selected-badge">
                            {locale === 'en' ? 'Selected' : '선택됨'}
                          </span>
                        ) : null}
                      </td>
                      <td data-label={ptfeComparisonAssumptionHeader}>
                        {row.spec.description[locale]}
                      </td>
                      <td data-label={ptfeComparisonProbabilityHeader}>
                        {fmtPercent(row.probability)}
                      </td>
                      <td data-label={ptfeComparisonConductivityHeader}>
                        {fmtNumber(row.conductivity, 2)} S/m
                      </td>
                      <td data-label={minPtfeWtLabel}>
                        {row.minPtfeWt === null ? text.unreachable : fmtPercent(row.minPtfeWt)}
                      </td>
                      <td data-label={minPtfeVolLabel}>
                        {row.minPtfeVol === null ? text.unreachable : fmtPercent(row.minPtfeVol)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="ptfe-equation-grid">
              <div className="ptfe-equation-card">
                <h3>{locale === 'en' ? 'Core equations (book style)' : '핵심 식 (book 스타일)'}</h3>
                <div className="equation-pretty">
                  <BookEquation
                    lhs={
                      <>
                        V<sub>eff,PTFE</sub>
                      </>
                    }
                    rhs={
                      <>
                        V<sub>PTFE</sub> / V<sub>available</sub>
                      </>
                    }
                  />
                </div>
                <div className="equation-pretty">
                  <BookEquation
                    lhs={
                      <>
                        P<sub>PTFE</sub>
                      </>
                    }
                    rhs={
                      <>
                        min(P<sub>0</sub> · max(V<sub>eff,PTFE</sub> - V<sub>th,PTFE</sub>, 0)
                        <sup>β</sup>, 1)
                      </>
                    }
                  />
                </div>
                <div className="equation-pretty">
                  <BookEquation
                    lhs={
                      <>
                        min w<sub>PTFE</sub>
                      </>
                    }
                    rhs={
                      <>
                        argmin<sub>w</sub>{' '}
                        {'{'}P<sub>PTFE</sub>(w) ≥ P<sub>target</sub>{'}'}
                      </>
                    }
                  />
                </div>
              </div>
              <div className="ptfe-equation-card">
                <h3>{locale === 'en' ? 'Code-style assumptions' : '코드형 가정 정리'}</h3>
                <div className="equation-code">
                  <code>{'Veff,PTFE = VPTFE / Vavailable'}</code>
                </div>
                <div className="equation-code">
                  <code>{'PPTFE = min(P0 * max(Veff,PTFE - Vth,PTFE, 0)^beta, 1)'}</code>
                </div>
                <div className="equation-code">
                  <code>{'Particle + Random: Vth,ideal,PTFE = 3 * Vth,ideal(base)'}</code>
                </div>
                <p className="ptfe-equation-note">
                  {locale === 'en'
                    ? 'Different Vavailable and Vth assumptions are the main reason the minimum PTFE requirement changes across models.'
                    : '모델별로 Vavailable과 Vth 가정이 달라지기 때문에 최소 PTFE 요구량이 달라집니다.'}
                </p>
              </div>
            </div>
          </article>

          

          <article className="panel">
            <div className="panel-heading">
              <h2>{text.derivation}</h2>
            </div>
            <div className="table-card">
              <table className="responsive-table">
                <thead>
                  <tr>
                    <th>{text.caseName}</th>
                    <th>{text.formula}</th>
                    <th>{text.substitution}</th>
                    <th>{text.value}</th>
                  </tr>
                </thead>
                <tbody>
                  {result.derivation.map((step) => (
                    <tr key={`${step.label.en}-${step.value}`}>
                      <td data-label={text.caseName}>{step.label[locale]}</td>
                      <td data-label={text.formula}><code>{step.formula}</code></td>
                      <td data-label={text.substitution}><code>{step.substituted}</code></td>
                      <td data-label={text.value}>{step.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="panel calculation-logic-panel" id="calculation-logic-section">
            <div className="panel-heading">
              <h2>{logicSectionTitle}</h2>
              <p>{logicSectionSubtitle}</p>
            </div>
            <div className="walkthrough-grid">
              <section
                key={selectedWalkthroughCase.key}
                className="walkthrough-card"
                aria-label={selectedCaseTypeLabel}
                data-model={walkthroughModelText}
              >
                  <header className="walkthrough-card-header">
                    <h3>{selectedWalkthroughCase.label}</h3>
                    <p className="walkthrough-card-model">
                      {networkModelLabels[deferredAssumptions.networkModel][locale]} ·{' '}
                      {accessibleRuleLabels[deferredAssumptions.accessibleVolumeRule][locale]} ·{' '}
                      {thresholdModeLabels[deferredAssumptions.thresholdMode][locale]}
                    </p>
                  </header>
                  <ol className="walkthrough-step-list">
                    {selectedWalkthroughSteps.map((step, index) => (
                      <li
                        key={`${selectedWalkthroughCase.key}-${step.title}`}
                        className="walkthrough-step-item"
                      >
                        <span className="walkthrough-step-index" aria-hidden>
                          {index + 1}
                        </span>
                        <div className="walkthrough-step-content">
                          <p className="walkthrough-step-title">{step.title}</p>
                          <p className="walkthrough-step-description">{step.description}</p>
                          <p className="walkthrough-step-equation">
                            <code>{step.equation}</code>
                          </p>
                          <p className="walkthrough-step-value">{step.value}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>
            </div>
          </article>
        </section>
      </main>
      {showMobileScrollNav ? (
        <>
          <div className="mobile-scroll-rail" aria-hidden={false}>
            <button
              type="button"
              className="mobile-scroll-rail-track"
              ref={railTrackRef}
              onClick={handleRailClick}
              onKeyDown={handleRailKeyDown}
              aria-label={scrollRailLabel}
            >
              <span
                className={`mobile-scroll-rail-thumb ${
                  isRailDragging ? 'is-dragging' : ''
                }`}
                style={{ top: `${railProgress * 100}%` }}
                onPointerDown={handleThumbPointerDown}
                onPointerMove={handleThumbPointerMove}
                onPointerUp={handleThumbPointerUp}
                onPointerCancel={handleThumbPointerCancel}
                onContextMenu={(event) => event.preventDefault()}
              />
            </button>
          </div>
          <button
            type="button"
            className="mobile-jump-fab"
            onClick={handleMobileJumpClick}
            aria-label={jumpButtonLabel}
            title={jumpButtonLabel}
          >
            <span aria-hidden>{jumpDirection === 'down' ? '\u2193' : '\u2191'}</span>
          </button>
        </>
      ) : null}
    </div>
  )
}

export default App
