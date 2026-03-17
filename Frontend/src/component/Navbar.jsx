import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard,
  SendHorizonal,
  TrendingUp,
  ArrowLeftRight,
  BriefcaseBusiness,
  Trophy,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Landmark
} from 'lucide-react'

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navLinks = isAdmin()
    ? [{ to: '/admin', label: 'Admin Panel', icon: ShieldCheck }]
    : [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/send', label: 'Send Money', icon: SendHorizonal },
        { to: '/stocks', label: 'Stocks', icon: TrendingUp },
        { to: '/portfolio', label: 'Portfolio', icon: BriefcaseBusiness },
        { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
        { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
      ]

  return (
    <div className='min-h-screen bg-[#f0f4f8]'>

      {/* Navbar */}
      <nav className='bg-white border-b border-gray-200 px-6 lg:px-10 sticky top-0 z-50 shadow-sm'>
        <div className='max-w-7xl mx-auto flex items-center justify-between h-16'>

          {/* Logo */}
          <div className='flex items-center gap-3'>
            <div className='w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white'>
              <Landmark size={18} />
            </div>
            <span className='text-lg font-bold text-gray-900'>SkyBank</span>
          </div>

          {/* Desktop Nav Links */}
          <div className='hidden md:flex items-center gap-1'>
            {navLinks.map((link) => {
              const Icon = link.icon
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive
                      ? 'bg-blue-50 text-blue-600 font-semibold'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                    }`
                  }
                >
                  <Icon size={15} />
                  {link.label}
                </NavLink>
              )
            })}
          </div>

          {/* Right Side */}
          <div className='hidden md:flex items-center gap-3'>
            <span className='text-sm text-gray-500'>{user?.username}</span>
            <div className='w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold'>
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={handleLogout}
              className='flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 font-medium transition-colors ml-2'
            >
              <LogOut size={15} />
              Logout
            </button>
          </div>

          {/* Mobile Hamburger */}
          <button
            className='md:hidden text-gray-500 hover:text-gray-900'
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className='md:hidden border-t border-gray-100 py-3 flex flex-col gap-1'>
            {navLinks.map((link) => {
              const Icon = link.icon
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
                    ${isActive
                      ? 'bg-blue-50 text-blue-600 font-semibold'
                      : 'text-gray-600 hover:bg-gray-100'
                    }`
                  }
                >
                  <Icon size={16} />
                  {link.label}
                </NavLink>
              )
            })}
            <div className='flex items-center justify-between px-4 py-3 mt-2 border-t border-gray-100'>
              <span className='text-sm text-gray-500'>{user?.username}</span>
              <button
                onClick={handleLogout}
                className='flex items-center gap-1 text-sm text-red-500 font-medium'
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Page Content */}
      <main className='max-w-7xl mx-auto px-4 lg:px-10 py-8'>
        <Outlet />
      </main>

    </div>
  )
}

export default Navbar