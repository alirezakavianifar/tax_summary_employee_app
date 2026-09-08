/**
 * In-Memory Token Manager
 * Stores the JWT access token purely in JavaScript memory (module scope)
 * to protect against persistent XSS token theft via localStorage.
 */
let inMemoryAccessToken: string | null = null

export const tokenManager = {
  getAccessToken: (): string | null => {
    return inMemoryAccessToken
  },
  setAccessToken: (token: string | null): void => {
    inMemoryAccessToken = token
  },
  clearAccessToken: (): void => {
    inMemoryAccessToken = null
  },
}
