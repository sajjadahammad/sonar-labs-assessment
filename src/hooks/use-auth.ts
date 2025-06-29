"use client"

import { useCallback, useEffect, useMemo } from "react"
import { initializeAuth,logout, setUser, MOCK_USERS, type Role, type AuthUser } from "@/store/features/authSlice"
import { useAppDispatch } from "./useAppDispatch"
import { useTypedSelector } from "./useTypedSelector"

/**
 * useAuth ­– centralised authentication hook powered by Redux Toolkit
 */
export function useAuth() {
  const dispatch = useAppDispatch()
  const { user, isAuthenticated, isLoading, error } = useTypedSelector((s) => s.auth)

  /** Initialise (rehydrate) auth state on the client. */
  const initialize = useCallback(() => {
    dispatch(initializeAuth())
  }, [dispatch])

  const login = useCallback(
    (email: string, password: string) => {
      const found = MOCK_USERS.find((u) => u.email === email)
      // Optional password check here (for demo use "password123")
      if (found && password === "password123") {
        dispatch(setUser(found))
      } else {
        // Dispatch error or set error state
        console.error("Invalid credentials")
      }
    },
    [dispatch]
  )
  
  /** Demo-only helper – instantly log in as one of the MOCK_USERS. */
  const loginAs = useCallback(
    (role: Role) => {
      const found = MOCK_USERS.find((u) => u.role === role) ?? (MOCK_USERS[0] as AuthUser)
      dispatch(setUser(found))
    },
    [dispatch],
  )

  /** Standard logout – clears Redux state and localStorage. */
  const signOut = useCallback(() => {
    dispatch(logout())
  }, [dispatch])
  /*  Derived helpers                                                        */

  const role = user?.role

  const hasRole = useCallback(
    (allowed: Role | Role[]) => {
      if (!role) return false
      return Array.isArray(allowed) ? allowed.includes(role) : role === allowed
    },
    [role],
  )


  /*  Auto-bootstrap on first mount (client side)                            */

  useEffect(() => {
    if (!isAuthenticated && !isLoading) initialize()
  }, [initialize, isAuthenticated, isLoading])

  /*  Exposed API (memoised)                                                 */

  return useMemo(
    () => ({
      user,
      role,
      isAuthenticated,
      isLoading,
      error,
      initialize,
      login,
      loginAs,
      logout: signOut,
      hasRole,
      MOCK_USERS, // exposed for the demo /login page
    }),
    [user, role, isAuthenticated, isLoading, error, initialize,login, loginAs, signOut, hasRole],
  )
}
