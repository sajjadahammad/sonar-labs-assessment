import { createSlice, type PayloadAction, createAsyncThunk } from "@reduxjs/toolkit"



export type Role = "admin" | "analyst" | "viewer"

export interface AuthUser {
  id: string
  name: string
  email: string
  role: Role
}

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

/*  Demo users                         */


export const MOCK_USERS: AuthUser[] = [
  {
    id: "admin-001",
    name: "John Admin",
    email: "admin@analytics.com",
    role: "admin",
  },
  {
    id: "analyst-001",
    name: "Sarah Analyst",
    email: "sarah@analytics.com",
    role: "analyst",
  },
  {
    id: "viewer-001",
    name: "Victor Viewer",
    email: "victor@analytics.com",
    role: "viewer",
  },
]


/*  Async thunk: initialise auth from localStorage                            */


export const initializeAuth = createAsyncThunk("auth/initialize", async () => {
  const raw = localStorage.getItem("auth_user")
  return raw ? (JSON.parse(raw) as AuthUser) : null
})


/*  Slice                                                                     */

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
}

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload
      state.isAuthenticated = Boolean(action.payload)
      if (typeof window !== "undefined") {
        if (action.payload) {
         localStorage.setItem("auth_user", JSON.stringify(action.payload))
        } else {
          localStorage.removeItem("auth_user")
        }
      }
    },
    logout(state) {
      state.user = null
      state.isAuthenticated = false
    window.localStorage.removeItem("auth_user")
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.user = action.payload
        state.isAuthenticated = Boolean(action.payload)
        state.isLoading = false
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.isLoading = false
        state.error = "Failed to initialise auth"
      })
  },
})

/* -------------------------------------------------------------------------- */
/*  Exports                                                                   */
/* -------------------------------------------------------------------------- */

export const { setUser, logout } = authSlice.actions
export default authSlice.reducer
