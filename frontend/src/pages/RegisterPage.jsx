import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { openAuthModal } from '@/store/uiSlice'

export default function RegisterPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(openAuthModal('/'))
    navigate('/', { replace: true })
  }, [dispatch, navigate])

  return null
}
