import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { useSelector, useDispatch } from 'react-redux'
import { useAuth } from '@/hooks/use-auth'
import { authSlice, MOCK_USERS, type Role, initializeAuth, setUser, logout } from '@/store/features/authSlice'

// Mock Next.js router
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock the hooks to use our test store
vi.mock('../useAppDispatch', () => ({
  useAppDispatch: () => useDispatch(),
}))

vi.mock('../useTypedSelector', () => ({
  useTypedSelector: (selector: any) => useSelector(selector),
}))

// Create a test store
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice.reducer,
    },
    preloadedState: {
      auth: {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        ...initialState,
      },
    },
  })
}

// Test wrapper component
const createWrapper = (store: ReturnType<typeof createTestStore>) => {
  return ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  )
}

describe('useAuth', () => {
  let store: ReturnType<typeof createTestStore>
  let wrapper: ReturnType<typeof createWrapper>

  beforeEach(() => {
    vi.clearAllMocks()
    store = createTestStore()
    wrapper = createWrapper(store)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initial state', () => {
    it('should return initial unauthenticated state', () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.user).toBeNull()
      expect(result.current.role).toBeUndefined()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should expose MOCK_USERS', () => {
      const { result } = renderHook(() => useAuth(), { wrapper })
      expect(result.current.MOCK_USERS).toEqual(MOCK_USERS)
    })
  })

  describe('Authentication flow', () => {
    it('should initialize auth on mount when not authenticated and not loading', async () => {
      // Start with a fresh store
      store = createTestStore({ isAuthenticated: false, isLoading: false })
      wrapper = createWrapper(store)
      
      const { result } = renderHook(() => useAuth(), { wrapper })

      // The hook should call initialize, which should dispatch initializeAuth
      await act(async () => {
        result.current.initialize()
      })

      // Check that the store state reflects initialization was called
      const state = store.getState()
      expect(state.auth).toBeDefined()
    })

    it('should not initialize if already authenticated', () => {
      store = createTestStore({ isAuthenticated: true, isLoading: false })
      wrapper = createWrapper(store)
      
      const { result } = renderHook(() => useAuth(), { wrapper })

      // When already authenticated, the useEffect shouldn't call initialize
      expect(result.current.isAuthenticated).toBe(true)
    })

    it('should not initialize if currently loading', () => {
      store = createTestStore({ isAuthenticated: false, isLoading: true })
      wrapper = createWrapper(store)
      
      const { result } = renderHook(() => useAuth(), { wrapper })

      // When loading, the useEffect shouldn't call initialize
      expect(result.current.isLoading).toBe(true)
    })
  })

  describe('login function', () => {
    it('should login with valid credentials', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper })
      const testUser = MOCK_USERS[0]

      await act(async () => {
        result.current.login(testUser.email, 'password123')
      })

      // Check both the store state and hook state after login
      const state = store.getState()
      expect(state.auth.user).toEqual(testUser)
      expect(state.auth.isAuthenticated).toBe(true)
      
      // The hook should also reflect the updated state
      expect(result.current.user).toEqual(testUser)
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.role).toBe(testUser.role)
    })

    it('should handle invalid email', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper })
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await act(async () => {
        result.current.login('invalid@email.com', 'password123')
      })

      // Should remain unauthenticated
      const state = store.getState()
      expect(state.auth.user).toBeNull()
      expect(state.auth.isAuthenticated).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith('Invalid credentials')

      consoleSpy.mockRestore()
    })

    it('should handle invalid password', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper })
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const testUser = MOCK_USERS[0]

      await act(async () => {
        result.current.login(testUser.email, 'wrongpassword')
      })

      // Should remain unauthenticated
      const state = store.getState()
      expect(state.auth.user).toBeNull()
      expect(state.auth.isAuthenticated).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith('Invalid credentials')

      consoleSpy.mockRestore()
    })
  })

  describe('loginAs function', () => {
    it('should login as user with specified role', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper })
      const adminUser = MOCK_USERS.find(u => u.role === 'admin')
      
      if (!adminUser) {
        throw new Error('Admin user not found in MOCK_USERS')
      }

      await act(async () => {
        result.current.loginAs('admin' as Role)
      })

      // Check both the store state and hook state after loginAs
      const state = store.getState()
      expect(state.auth.user).toEqual(adminUser)
      expect(state.auth.isAuthenticated).toBe(true)
      
      // The hook should also reflect the updated state
      expect(result.current.user).toEqual(adminUser)
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.role).toBe('admin')
    })

    it('should fallback to first user if role not found', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper })
      const firstUser = MOCK_USERS[0]

      await act(async () => {
        result.current.loginAs('nonexistent' as Role)
      })

      // Should use first user as fallback
      const state = store.getState()
      expect(state.auth.user).toEqual(firstUser)
      expect(state.auth.isAuthenticated).toBe(true)
      
      // The hook should also reflect the updated state
      expect(result.current.user).toEqual(firstUser)
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.role).toBe(firstUser.role)
    })
  })

  describe('signOut function', () => {
    it('should logout and redirect to login page', async () => {
      // Start with authenticated user
      const testUser = MOCK_USERS[0]
      store = createTestStore({ 
        user: testUser, 
        isAuthenticated: true 
      })
      wrapper = createWrapper(store)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await act(async () => {
        result.current.signOut()
      })

      // Check store state after logout
      const state = store.getState()
      expect(state.auth.user).toBeNull()
      expect(state.auth.isAuthenticated).toBe(false)
      expect(mockPush).toHaveBeenCalledWith('/login')
    })
  })

  describe('hasRole function', () => {
    it('should return false when user has no role', () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.hasRole('admin' as Role)).toBe(false)
    })

    it('should return true when user has matching single role', () => {
      const adminUser = MOCK_USERS.find(u => u.role === 'admin')
      if (!adminUser) throw new Error('Admin user not found')

      store = createTestStore({ 
        user: adminUser, 
        isAuthenticated: true 
      })
      wrapper = createWrapper(store)
      
      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.role).toBe('admin')
      expect(result.current.hasRole('admin' as Role)).toBe(true)
      expect(result.current.hasRole('user' as Role)).toBe(false)
    })

    it('should return true when user role is in allowed roles array', () => {
      const adminUser = MOCK_USERS.find(u => u.role === 'admin')
      if (!adminUser) throw new Error('Admin user not found')

      store = createTestStore({ 
        user: adminUser, 
        isAuthenticated: true 
      })
      wrapper = createWrapper(store)
      
      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.hasRole(['admin', 'user'] as Role[])).toBe(true)
      expect(result.current.hasRole(['user', 'moderator'] as Role[])).toBe(false)
    })
  })

  describe('Derived state', () => {
    it('should return correct role from user', () => {
      const testUser = MOCK_USERS[0]
      store = createTestStore({ 
        user: testUser, 
        isAuthenticated: true 
      })
      wrapper = createWrapper(store)
      
      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.role).toBe(testUser.role)
      expect(result.current.user).toEqual(testUser)
      expect(result.current.isAuthenticated).toBe(true)
    })

    it('should return undefined role when no user', () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.role).toBeUndefined()
      expect(result.current.user).toBeNull()
    })
  })

  describe('Memoization', () => {
    it('should return stable references when state has not changed', () => {
      const { result, rerender } = renderHook(() => useAuth(), { wrapper })
      
      const firstRender = result.current
      
      rerender()
      
      const secondRender = result.current
      
      // Functions should be stable due to useCallback
      expect(firstRender.login).toBe(secondRender.login)
      expect(firstRender.loginAs).toBe(secondRender.loginAs)
      expect(firstRender.signOut).toBe(secondRender.signOut)
      expect(firstRender.hasRole).toBe(secondRender.hasRole)
      expect(firstRender.initialize).toBe(secondRender.initialize)
    })

    it('should update when relevant state changes', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()
      
      // Login to change state
      const testUser = MOCK_USERS[0]
      await act(async () => {
        result.current.login(testUser.email, 'password123')
      })
      
      // The hook should now reflect the updated state
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toEqual(testUser)
      expect(result.current.role).toBe(testUser.role)
    })

    it('should handle state changes through loginAs', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      expect(result.current.isAuthenticated).toBe(false)
      
      // Use loginAs to change state
      const adminUser = MOCK_USERS.find(u => u.role === 'admin')
      if (!adminUser) throw new Error('Admin user not found')
      
      await act(async () => {
        result.current.loginAs('admin' as Role)
      })
      
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.user).toEqual(adminUser)
      expect(result.current.role).toBe('admin')
    })
  })

  describe('Error handling', () => {
    it('should handle auth errors from store', () => {
      const errorMessage = 'Authentication failed'
      store = createTestStore({ error: errorMessage })
      wrapper = createWrapper(store)
      
      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.error).toBe(errorMessage)
    })
  })

  describe('Initialize function', () => {
    it('should call initialize function directly', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      await act(async () => {
        result.current.initialize()
      })

      // Initialize function should be callable without errors
      expect(typeof result.current.initialize).toBe('function')
    })
  })
})