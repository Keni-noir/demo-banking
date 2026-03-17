import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './component/ProtectedRoute';
import AdminRoute from './component/AdminRoute';
import Navbar from './component/Navbar';
import Dashboard from './pages/Dashboard';
import SendMoney from './pages/SendMoney';
import Transactions from './pages/Transactions';
import Stocks from './pages/Stocks';
import Portfolio from './pages/Portfolio';
import Leaderboard from './pages/LeaderBoard';
import Admin from './pages/Admin';



const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* public routes */}
          <Route path = "/login" element = {<Login />} />
          <Route path = "/register" element = {<Register />} />

          {/* protected routes */}
          <Route element = {<ProtectedRoute />}>
            <Route element = {<Navbar />} >
              <Route path='/dashboard' element={<Dashboard />} />
              <Route path='/send' element={<SendMoney />} />
              <Route path='/transactions' element={<Transactions />} />
              <Route path='/stocks' element={<Stocks />} />
              <Route path='/portfolio' element={<Portfolio />} />
              <Route path='/leaderboard' element={<Leaderboard />} />
          </Route>
        </Route>

          {/* admin routes */}
          <Route element={<AdminRoute />}>
            <Route element={<Navbar />}>
              <Route path='/admin' element={<Admin />} />
            </Route>
          </Route>

          {/* default redirect */}
          <Route path='/' element={<Navigate to='/login' />} />
          <Route path='*' element={<Navigate to='/login' />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App