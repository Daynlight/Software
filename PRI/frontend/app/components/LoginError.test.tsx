import { render, screen } from '@testing-library/react'
import LoginError from './LoginError'

const mockGet = jest.fn()

jest.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: mockGet }),
}))

beforeEach(() => {
  mockGet.mockReturnValue(null)
})

describe('LoginError', () => {
  it('renders nothing without an error', () => {
    render(<LoginError />)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('explains an unavailable USOS API', () => {
    mockGet.mockReturnValue('usos_unavailable')

    render(<LoginError />)

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Serwis USOS jest chwilowo niedostępny. Spróbuj ponownie za kilka minut.',
    )
  })

  it('explains a failed authorization', () => {
    mockGet.mockReturnValue('usos_auth_failed')

    render(<LoginError />)

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Logowanie przez USOS nie powiodło się. Spróbuj ponownie.',
    )
  })

  it('falls back to a generic message', () => {
    mockGet.mockReturnValue('unknown_error')

    render(<LoginError />)

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Logowanie nie powiodło się. Spróbuj ponownie.',
    )
  })
})
