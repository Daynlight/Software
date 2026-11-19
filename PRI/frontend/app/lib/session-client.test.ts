import { fetchCurrentUser, logout } from './session-client'

const user = { id: '123', firstName: 'Jan', lastName: 'Kowalski' }

function response(body: unknown, ok = true): Response {
  return { ok, json: () => Promise.resolve(body) } as Response
}

const fetchMock = jest.fn()

beforeEach(() => {
  fetchMock.mockReset()
  global.fetch = fetchMock as unknown as typeof fetch
})

describe('fetchCurrentUser', () => {
  it('returns the authenticated user', async () => {
    fetchMock.mockResolvedValue(response(user))

    await expect(fetchCurrentUser()).resolves.toEqual(user)
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/me')
  })

  it('returns null for an unauthorized response', async () => {
    fetchMock.mockResolvedValue(response(null, false))

    await expect(fetchCurrentUser()).resolves.toBeNull()
  })

  it('returns null when the request fails', async () => {
    fetchMock.mockRejectedValue(new Error('network'))

    await expect(fetchCurrentUser()).resolves.toBeNull()
  })
})

describe('logout', () => {
  it('posts to the logout endpoint', async () => {
    fetchMock.mockResolvedValue(response(null))

    await logout()

    expect(fetchMock).toHaveBeenCalledWith('/api/auth/logout', {
      method: 'POST',
    })
  })

  it('does not throw when the request fails', async () => {
    fetchMock.mockRejectedValue(new Error('network'))

    await expect(logout()).resolves.toBeUndefined()
  })
})
