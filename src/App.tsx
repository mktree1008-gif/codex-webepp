import {
  startTransition,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
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
    minCnfWt: 'Minimum CNF for target P',
    minCnfVol: 'Minimum CNF vol%',
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
      'The inverse solver finds the minimum CNF wt% that reaches the chosen target probability, then reports the derived CNF vol% too.',
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
    minCnfWt: '목표 P를 위한 최소 CNF',
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

function App() {
  const [locale, setLocale] = useState<Locale>('en')
  const [currentInput, setCurrentInput] = useState<CaseInput>(presetCases[0].input)
  const [densities, setDensities] = useState<DensitySet>(defaultDensities)
  const [geometry, setGeometry] = useState<GeometryInput>(defaultGeometry)
  const [assumptions, setAssumptions] = useState<ModelAssumptions>(defaultModelAssumptions)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle')
  const [equationView, setEquationView] = useState<EquationView>('code')
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
  ]
  const allEquations = equationSections.flatMap((section) => section.equations)
  const result = calculateCase(
    deferredInput,
    deferredDensities,
    deferredGeometry,
    deferredAssumptions,
  )
  const comparison = presetCases.map((preset) =>
    calculateCase(preset.input, deferredDensities, deferredGeometry, deferredAssumptions),
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

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(buildBilingualSummary(result))
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

  const handleMobileJumpClick = () => {
    scrollToProgress(jumpDirection === 'down' ? 1 : 0, 'smooth')
  }

  const handleRailClick = (event: MouseEvent<HTMLButtonElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const relativeY = event.clientY - bounds.top
    const nextProgress = bounds.height > 0 ? relativeY / bounds.height : 0
    scrollToProgress(nextProgress, 'auto')
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
                label={text.additiveSize}
                value={geometry.additiveSizeUm}
                onChange={(next) => updateGeometry('additiveSizeUm', next)}
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
          <article className="panel">
            <div className="panel-heading">
              <h2>{text.results}</h2>
            </div>
            <div className="results-grid">
              <ResultCard label={text.probability} value={fmtPercent(result.probability.pCapped)} tone="accent" />
              <ResultCard label={text.probabilityRaw} value={fmtNumber(result.probability.pRaw, 4)} />
              <ResultCard label={text.conductivity} value={`${fmtNumber(result.probability.sigma, 2)} S/m`} />
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
              />
              <ResultCard
                label={text.minCnfVol}
                value={
                  result.inverse.minCnfVolFraction === null
                    ? text.unreachable
                    : fmtPercent(result.inverse.minCnfVolFraction)
                }
              />
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
                <div className="mini-stats">
                  <div>
                    <span>{text.binderProbability}</span>
                    <strong>{fmtPercent(result.binder.probability.pCapped)}</strong>
                  </div>
                  <div>
                    <span>{text.binderVeff}</span>
                    <strong>{fmtNumber(result.binder.probability.veff, 5)}</strong>
                  </div>
                  <div>
                    <span>{text.binderThreshold}</span>
                    <strong>{fmtNumber(result.binder.thresholds.active, 6)}</strong>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <article className="panel">
            <div className="panel-heading">
              <h2>{text.comparison}</h2>
            </div>
            <div className="table-card">
              <table className="responsive-table">
                <thead>
                  <tr>
                    <th>{text.caseName}</th>
                    <th>{text.probability}</th>
                    <th>{text.conductivity}</th>
                    <th>{text.minCnfWt}</th>
                    <th>{text.minCnfVol}</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((entry) => (
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="panel">
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
        </section>
      </main>
      {showMobileScrollNav ? (
        <>
          <div className="mobile-scroll-rail" aria-hidden={false}>
            <button
              type="button"
              className="mobile-scroll-rail-track"
              onClick={handleRailClick}
              onKeyDown={handleRailKeyDown}
              aria-label={scrollRailLabel}
            >
              <span
                className="mobile-scroll-rail-thumb"
                style={{ top: `${scrollNav.scrollProgress * 100}%` }}
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
            <span aria-hidden>{jumpDirection === 'down' ? '↓' : '↑'}</span>
          </button>
        </>
      ) : null}
    </div>
  )
}

export default App
