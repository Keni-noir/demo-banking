import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = () => {
  const { isLoggedIn } = useAuth()

  return isLoggedIn() ? <Outlet /> : <Navigate to='/login' />
}

export default ProtectedRoute