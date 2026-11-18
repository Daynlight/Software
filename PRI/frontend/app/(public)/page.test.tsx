import { render, screen } from '@testing-library/react'
import Page from './page'

describe('Page', () => {
  it('presents the project and its purpose', () => {
    render(<Page />)

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /Projekt Inżynierski - od pomysłu do współpracy z promotorem/,
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('Co obejmuje system')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'koordynator@przyklad.pl' }),
    ).toHaveAttribute('href', 'mailto:koordynator@przyklad.pl')
  })
})
