import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const AdminRoute = () => {
  const { isLoggedIn, isAdmin } = useAuth()

  if (!isLoggedIn()) return <Navigate to='/login' />
  if (!isAdmin()) return <Navigate to='/dashboard' />

  return <Outlet />
}

export default AdminRoute