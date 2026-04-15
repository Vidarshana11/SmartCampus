import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import apiClient from '../api/apiClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchMe = useCallback(async (activeToken) => {
    const res = await apiClient.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${activeToken}` },
    })
    return res.data?.user ?? null
  }, [])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setLoading(true)

      if (!token) {
        setUser(null)
        setLoading(false)
        return
      }

      try {
        const me = await fetchMe(token)
        if (!cancelled) setUser(me)
      } catch {
        // If token is invalid/expired, clear it so user must login again.
        if (!cancelled) {
          setToken(null)
          setUser(null)
          localStorage.removeItem('token')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [token, fetchMe])

  const login = async ({ email, password }) => {
    const res = await apiClient.post('/api/auth/login', { email, password })
    const nextToken = res.data?.token
    if (!nextToken) throw new Error('Login succeeded but token missing in response.')

    localStorage.setItem('token', nextToken)
    setToken(nextToken)
    // Set user optimistically if backend included it.
    if (res.data?.user) setUser(res.data.user)
    return res.data?.user
  }

  const register = async ({ email, name, password, role }) => {
    const res = await apiClient.post('/api/auth/register', { email, name, password, role })
    const nextToken = res.data?.token
    if (!nextToken) throw new Error('Register succeeded but token missing in response.')

    localStorage.setItem('token', nextToken)
    setToken(nextToken)
    if (res.data?.user) setUser(res.data.user)
    return res.data?.user
  }

  const loginWithToken = async (rawToken) => {
    if (!rawToken) throw new Error('OAuth token missing.')
    localStorage.setItem('token', rawToken)
    setToken(rawToken)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      role: user?.role,
      login,
      register,
      loginWithToken,
      logout,
      refreshMe: async () => {
        if (!token) return null
        const me = await fetchMe(token)
        setUser(me)
        return me
      },
    }),
    [token, user, loading, fetchMe]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider.')
  return ctx
}

