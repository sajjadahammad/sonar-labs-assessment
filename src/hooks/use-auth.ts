"use client"

import { useCallback, useEffect, useMemo } from "react"
import { initializeAuth,logout, setUser, MOCK_USERS, type Role, type AuthUser } from "@/store/features/authSlice"
import { useAppDispatch } from "./useAppDispatch"
import { useTypedSelector } from "./useTypedSelector"

/**
 * useAuth ­– centralised authentication hook powered by Redux Toolkit
 *
 * Example:
 *   const { user, loginAs, logout } = useAuth()
 */
export function useAuth() {
  const dispatch = useAppDispatch()
  const { user, isAuthenticated, isLoading, error } = useTypedSelector((s) => s.auth)

  /** Initialise (rehydrate) auth state on the client. */
  const initialize = useCallback(() => {
    dispatch(initializeAuth())
  }, [dispatch])

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
      loginAs,
      logout: signOut,
      hasRole,
      MOCK_USERS, // exposed for the demo /login page
    }),
    [user, role, isAuthenticated, isLoading, error, initialize, loginAs, signOut, hasRole],
  )
}
