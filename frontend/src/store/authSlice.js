import { createSlice } from '@reduxjs/toolkit'

const loadAuthFromStorage = () => {
  try {
    let savedToken = localStorage.getItem('sensein_token') || localStorage.getItem('token')
    if (savedToken === 'undefined' || savedToken === 'null' || savedToken === '') {
      savedToken = null
    }

    let savedUser = localStorage.getItem('sensein_user') || localStorage.getItem('user')
    let parsedUser = null
    if (savedUser && savedUser !== 'undefined' && savedUser !== 'null') {
      parsedUser = JSON.parse(savedUser)
    }

    return {
      token: savedToken || null,
      user: parsedUser || null,
    }
  } catch (e) {
    return { token: null, user: null }
  }
}

const saved = loadAuthFromStorage()

const initialState = {
  token: saved.token,
  user: saved.user,
  isAuthenticated: !!saved.token,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload || {}
      if (user) {
        state.user = user
        try {
          localStorage.setItem('sensein_user', JSON.stringify(user))
        } catch (e) { }
      }

      if (token !== undefined) {
        if (token && token !== 'undefined' && token !== 'null') {
          state.token = token
          state.isAuthenticated = true
          try {
            localStorage.setItem('sensein_token', token)
            localStorage.setItem('token', token)
          } catch (e) { }
        } else if (token === null || token === '') {
          state.token = null
          state.isAuthenticated = false
          try {
            localStorage.removeItem('sensein_token')
            localStorage.removeItem('token')
          } catch (e) { }
        }
      } else if (state.token) {
        state.isAuthenticated = true
      }
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      try {
        localStorage.removeItem('sensein_token')
        localStorage.removeItem('token')
        localStorage.removeItem('sensein_user')
        localStorage.removeItem('user')
      } catch (e) {
        // ignore localStorage errors
      }
    },
  },
})

export const { setCredentials, logout } = authSlice.actions
export const selectCurrentUser = (state) => state.auth.user
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated
export const selectToken = (state) => state.auth.token
export default authSlice.reducer
