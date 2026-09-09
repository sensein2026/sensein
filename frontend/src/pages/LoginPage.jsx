import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { openAuthModal } from '@/store/uiSlice'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const from = location.state?.from?.pathname || '/'

  useEffect(() => {
    dispatch(openAuthModal(from))
    navigate(from === '/login' || from === '/register' ? '/' : from, { replace: true })
  }, [dispatch, navigate, from])

  return null
}
