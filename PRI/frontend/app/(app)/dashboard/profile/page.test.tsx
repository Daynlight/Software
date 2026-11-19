import { render, screen } from '@testing-library/react'
import EditProfilePage from './page'

jest.mock('next/navigation', () => {
  const router = { replace: jest.fn() }
  return { useRouter: () => router, __router: router }
})

const fetchMock = jest.fn()

function response(body: unknown, ok = true): Response {
  return { ok, json: () => Promise.resolve(body) } as Response
}

beforeEach(() => {
  fetchMock.mockReset()
  global.fetch = fetchMock as unknown as typeof fetch
})

describe('EditProfilePage', () => {
  it('shows the profile of the logged-in user', async () => {
    fetchMock.mockResolvedValue(
      response({
        id: '123456',
        firstName: 'Jan',
        lastName: 'Kowalski',
        studentNumber: 'S12345',
        photoUrl: null,
      }),
    )

    render(<EditProfilePage />)

    expect(await screen.findByText('Jan')).toBeInTheDocument()
    expect(screen.getByText('Moje dane')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Zapisz profil' })).toBeInTheDocument()
  })
})
