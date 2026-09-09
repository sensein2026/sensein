import { createSlice } from '@reduxjs/toolkit'

const token = localStorage.getItem('admin_token') || null
const userStr = localStorage.getItem('admin_user')
const user = userStr ? JSON.parse(userStr) : null

const initialState = {
  token,
  user,
  isAuthenticated: !!(token && user?.role === 'admin'),
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload
      state.user = user
      state.token = token
      state.isAuthenticated = user?.role === 'admin'
      localStorage.setItem('admin_token', token)
      localStorage.setItem('admin_user', JSON.stringify(user))
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
    },
  },
})

export const { setCredentials, logout } = authSlice.actions
export default authSlice.reducer

export const selectCurrentUser = (state) => state.auth.user
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated
