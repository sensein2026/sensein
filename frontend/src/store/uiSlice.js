import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  isMobileMenuOpen: false,
  isCartDrawerOpen: false,
  isAuthModalOpen: false,
  authRedirectUrl: null,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleMobileMenu: (state) => {
      state.isMobileMenuOpen = !state.isMobileMenuOpen
    },
    closeMobileMenu: (state) => {
      state.isMobileMenuOpen = false
    },
    toggleCartDrawer: (state) => {
      state.isCartDrawerOpen = !state.isCartDrawerOpen
    },
    setCartDrawerOpen: (state, action) => {
      state.isCartDrawerOpen = action.payload
    },
    openAuthModal: (state, action) => {
      state.isAuthModalOpen = true
      state.authRedirectUrl = action?.payload || null
    },
    closeAuthModal: (state) => {
      state.isAuthModalOpen = false
      state.authRedirectUrl = null
    },
    toggleAuthModal: (state) => {
      state.isAuthModalOpen = !state.isAuthModalOpen
    },
  },
})

export const {
  toggleMobileMenu,
  closeMobileMenu,
  toggleCartDrawer,
  setCartDrawerOpen,
  openAuthModal,
  closeAuthModal,
  toggleAuthModal,
} = uiSlice.actions
export default uiSlice.reducer
