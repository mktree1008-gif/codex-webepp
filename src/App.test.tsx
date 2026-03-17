import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test } from 'vitest'
import App from './App'

describe('App', () => {
  test('renders English first and switches to Korean', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(
      screen.getByText(
        'Solid-state electrode network planning, with every assumption visible.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Equations and model conditions')).toBeInTheDocument()
    expect(
      screen.getByText('P_raw = P0 * Delta^beta'),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Book view' }))
    expect(
      screen.getAllByText((_, node) =>
        (node?.textContent ?? '').replace(/\s+/g, '').includes('Praw=P0·Δβ'),
      ).length,
    ).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: '한국어' }))

    expect(
      screen.getByText('모든 가정을 드러내는 고체전해질 전극 네트워크 계산기.'),
    ).toBeInTheDocument()
    expect(screen.getByText('사용한 식과 모델 조건')).toBeInTheDocument()
    expect(screen.getByText('수학책형 보기')).toBeInTheDocument()
  }, 15000)

  test('shows total-solids wt% sum status in preset input', async () => {
    const user = userEvent.setup()
    render(<App />)

    const amInput = screen.getByLabelText('AM wt%') as HTMLInputElement
    expect(amInput).not.toHaveAttribute('readonly')
    expect(screen.getByText('WT% sum matches 100%')).toBeInTheDocument()

    const seInput = screen.getByLabelText(
      'SE wt% (total solids basis)',
    ) as HTMLInputElement
    const cnfInput = screen.getByLabelText('CNF wt%') as HTMLInputElement

    await user.clear(seInput)
    await user.type(seInput, '80')
    await user.clear(cnfInput)
    await user.type(cnfInput, '30')

    expect(screen.getByText('WT% sum should be 100%')).toBeInTheDocument()
  })

  test('opens formulation engine tab and renders recommendation section', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Formulation Engine' }))
    expect(screen.getByText('Integrated formulation engine')).toBeInTheDocument()
    expect(screen.getByText('CNF/PTFE neighborhood score heatmap')).toBeInTheDocument()
  })
})
