import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import SessionStatus from './SessionStatus'

const mockPush = jest.fn()
const fetchMock = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

function response(body: unknown, ok = true): Response {
  return { ok, json: () => Promise.resolve(body) } as Response
}

const user = { id: '123', firstName: 'Jan', lastName: 'Kowalski' }

beforeEach(() => {
  mockPush.mockReset()
  fetchMock.mockReset()
  global.fetch = fetchMock as unknown as typeof fetch
})

describe('SessionStatus', () => {
  it('renders nothing while the session is checked', () => {
    fetchMock.mockReturnValue(new Promise(() => {}))

    const { container } = render(<SessionStatus />)

    expect(container).toBeEmptyDOMElement()
  })

  it('shows the authenticated user', async () => {
    fetchMock.mockResolvedValue(response(user))

    render(<SessionStatus />)

    expect(await screen.findByText('Jan Kowalski')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Wyloguj' }),
    ).toBeInTheDocument()
  })

  it('logs out and returns to the login page', async () => {
    fetchMock
      .mockResolvedValueOnce(response(user))
      .mockResolvedValueOnce(response(null))

    render(<SessionStatus />)

    fireEvent.click(await screen.findByRole('button', { name: 'Wyloguj' }))

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/login'))
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/logout', {
      method: 'POST',
    })
  })

  it('links to the login page for anonymous users', async () => {
    fetchMock.mockResolvedValue(response(null, false))

    render(<SessionStatus />)

    expect(await screen.findByRole('link', { name: 'Zaloguj' })).toHaveAttribute(
      'href',
      '/login',
    )
  })

  it('links to the login page when the session request fails', async () => {
    fetchMock.mockRejectedValue(new Error('network'))

    render(<SessionStatus />)

    expect(
      await screen.findByRole('link', { name: 'Zaloguj' }),
    ).toBeInTheDocument()
  })
})
