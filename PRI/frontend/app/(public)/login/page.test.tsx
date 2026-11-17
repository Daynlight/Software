import { render, screen } from '@testing-library/react'
import LoginPage from './page'

const mockGet = jest.fn()

jest.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: mockGet }),
}))

beforeEach(() => {
  mockGet.mockReturnValue(null)
})

describe('LoginPage', () => {
  it('starts the USOS login', () => {
    render(<LoginPage />)

    expect(
      screen.getByRole('link', { name: 'Zaloguj przez USOS' }),
    ).toHaveAttribute('href', '/api/auth/usos/login')
  })

  it('shows the error returned by the backend', () => {
    mockGet.mockReturnValue('usos_auth_failed')

    render(<LoginPage />)

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Logowanie przez USOS nie powiodło się. Spróbuj ponownie.',
    )
  })
})
