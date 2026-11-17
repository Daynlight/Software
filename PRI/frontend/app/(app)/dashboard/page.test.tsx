import { render, screen, waitFor } from '@testing-library/react'
import DashboardPage from './page'

jest.mock('next/navigation', () => {
  const router = { replace: jest.fn() }
  return { useRouter: () => router, __router: router }
})

const router = (
  jest.requireMock('next/navigation') as { __router: { replace: jest.Mock } }
).__router
const fetchMock = jest.fn()

function response(body: unknown, ok = true): Response {
  return { ok, json: () => Promise.resolve(body) } as Response
}

const user = {
  id: '123456',
  firstName: 'Jan',
  lastName: 'Kowalski',
  studentNumber: 'S12345',
  photoUrl: 'https://example.com/photo.jpg',
}

beforeEach(() => {
  router.replace.mockReset()
  fetchMock.mockReset()
  global.fetch = fetchMock as unknown as typeof fetch
})

describe('DashboardPage', () => {
  it('shows a loading state while the session is checked', () => {
    fetchMock.mockReturnValue(new Promise(() => {}))

    render(<DashboardPage />)

    expect(screen.getByText('Sprawdzanie sesji…')).toBeInTheDocument()
  })

  it('shows the logged-in user instead of mock data', async () => {
    fetchMock.mockResolvedValue(response(user))

    render(<DashboardPage />)

    expect(
      await screen.findByRole('heading', { name: 'Pulpit: Jan Kowalski' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Numer albumu')).toBeInTheDocument()
    expect(screen.getByText('S12345')).toBeInTheDocument()
    expect(screen.queryByText('Numer USOS')).not.toBeInTheDocument()
    expect(screen.queryByText('123456')).not.toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: 'Zdjęcie profilowe' }),
    ).toHaveAttribute('src', 'https://example.com/photo.jpg')
    expect(screen.queryByText('Anna Kowalska')).not.toBeInTheDocument()
    expect(router.replace).not.toHaveBeenCalled()
  })

  it('redirects anonymous visitors to the login page', async () => {
    fetchMock.mockResolvedValue(response(null, false))

    render(<DashboardPage />)

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/login'))
  })

  it('redirects when the session request fails', async () => {
    fetchMock.mockRejectedValue(new Error('network'))

    render(<DashboardPage />)

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/login'))
  })

  it('falls back when USOS exposes no index number or photo', async () => {
    fetchMock.mockResolvedValue(
      response({ ...user, studentNumber: null, photoUrl: null }),
    )

    render(<DashboardPage />)

    await screen.findByRole('heading', { name: 'Pulpit: Jan Kowalski' })
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.getByText('Zdjęcie')).toBeInTheDocument()
    expect(
      screen.queryByRole('img', { name: 'Zdjęcie profilowe' }),
    ).not.toBeInTheDocument()
  })
})
