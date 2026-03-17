import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import API from '../api/axios'
import {
  SendHorizonal,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Trophy,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react'

const Dashboard = () => {
  const { user } = useAuth()
  const [wallet, setWallet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [portfolio, setPortfolio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hideBalance, setHideBalance] = useState(() => {
  return localStorage.getItem('hideBalance') === 'true'})

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [walletRes, txRes, lbRes, portRes] = await Promise.all([
        API.get('/wallet'),
        API.get('/wallet/transactions'),
        API.get('/wallet/leaderboard'),
        API.get('/stocks/portfolio')
      ])
      setWallet(walletRes.data)
      setTransactions(txRes.data.slice(0, 4))
      setLeaderboard(lbRes.data.slice(0, 4))
      setPortfolio(portRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const totalSent = transactions
    .filter(tx => tx.sender_id === user?.id)
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0)

  const totalReceived = transactions
    .filter(tx => tx.receiver_id === user?.id)
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0)

  const getRankStyle = (index) => {
    if (index === 0) return 'bg-yellow-100 text-yellow-700'
    if (index === 1) return 'bg-gray-100 text-gray-600'
    if (index === 2) return 'bg-orange-100 text-orange-600'
    return 'bg-gray-50 text-gray-500'
  }

  const hidingBalance = () => {
    const newValue = !hideBalance
    setHideBalance(newValue)
    localStorage.setItem('hideBalance', newValue)
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[60vh]'>
        <div className='flex flex-col items-center gap-3'>
          <div className='w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin' />
          <p className='text-sm text-gray-500'>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-6'>

      {/* Greeting */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>
            Good morning, {user?.username} 👋
          </h1>
          <p className='text-gray-500 text-sm mt-1'>
            Here's what's happening with your account today.
          </p>
        </div>
        <button
          onClick={fetchAll}
          className='flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors'
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Balance Hero */}
      <div className='bg-blue-600 rounded-2xl p-8 text-white relative overflow-hidden'>
        <div className='absolute -top-16 -right-16 w-56 h-56 bg-white opacity-5 rounded-full' />
        <div className='absolute -bottom-20 right-24 w-44 h-44 bg-white opacity-5 rounded-full' />

        <div className='relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6'>
          <div>
            <div className='flex items-center gap-2 mb-2'>
              <p className='text-blue-200 text-sm font-medium'>Available Balance</p>
              <button
                onClick={hidingBalance}
                className='text-blue-200 hover:text-white transition-colors'
              >
                {hideBalance ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <h2 className='text-4xl md:text-5xl font-bold mb-6'>
              {hideBalance
                ? '••••••'
                : `$${parseFloat(wallet?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
              }
            </h2>
            <div className='flex flex-wrap gap-3'>
              <Link
                to='/send'
                className='flex items-center gap-2 bg-white text-blue-600 font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-blue-50 transition-all'
              >
                <SendHorizonal size={15} />
                Send Money
              </Link>
              <Link
                to='/stocks'
                className='flex items-center gap-2 bg-white/20 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-white/30 transition-all border border-white/30'
              >
                <TrendingUp size={15} />
                Invest
              </Link>
            </div>
          </div>

          {/* Right Stats */}
          <div className='flex flex-row md:flex-col gap-4 md:gap-6 md:text-right'>
            <div>
              <p className='text-blue-200 text-xs font-medium mb-1'>Portfolio Value</p>
              <p className='text-xl font-bold'>
                {hideBalance
                  ? '••••••'
                  : `$${parseFloat(portfolio?.total_value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                }
              </p>
            </div>
            <div>
              <p className='text-blue-200 text-xs font-medium mb-1'>Total Profit/Loss</p>
              <p className={`text-xl font-bold ${parseFloat(portfolio?.total_profit_loss) >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                {hideBalance
                  ? '••••••'
                  : `${parseFloat(portfolio?.total_profit_loss) >= 0 ? '+' : ''}$${parseFloat(portfolio?.total_profit_loss || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        <div className='bg-white rounded-2xl p-5 border border-gray-200 shadow-sm'>
          <div className='w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3'>
            <BarChart3 size={18} className='text-blue-600' />
          </div>
          <p className='text-xs text-gray-500 font-medium mb-1'>Portfolio Value</p>
          <p className='text-xl font-bold text-gray-900'>
            {hideBalance
              ? '••••••'
              : `$${parseFloat(portfolio?.total_value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
            }
          </p>
          <p className={`text-xs mt-1 font-medium ${parseFloat(portfolio?.total_profit_loss) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {parseFloat(portfolio?.total_profit_loss) >= 0 ? '↑' : '↓'} ${Math.abs(parseFloat(portfolio?.total_profit_loss || 0)).toFixed(2)} profit/loss
          </p>
        </div>

        <div className='bg-white rounded-2xl p-5 border border-gray-200 shadow-sm'>
          <div className='w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-3'>
            <ArrowDownLeft size={18} className='text-green-600' />
          </div>
          <p className='text-xs text-gray-500 font-medium mb-1'>Total Received</p>
          <p className='text-xl font-bold text-gray-900'>
            {hideBalance
              ? '••••••'
              : `$${totalReceived.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
            }
          </p>
          <p className='text-xs mt-1 font-medium text-green-500'>
            ↑ {transactions.filter(tx => tx.receiver_id === user?.id).length} transactions
          </p>
        </div>

        <div className='bg-white rounded-2xl p-5 border border-gray-200 shadow-sm'>
          <div className='w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mb-3'>
            <ArrowUpRight size={18} className='text-red-500' />
          </div>
          <p className='text-xs text-gray-500 font-medium mb-1'>Total Sent</p>
          <p className='text-xl font-bold text-gray-900'>
            {hideBalance
              ? '••••••'
              : `$${totalSent.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
            }
          </p>
          <p className='text-xs mt-1 font-medium text-red-500'>
            ↓ {transactions.filter(tx => tx.sender_id === user?.id).length} transactions
          </p>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-5 gap-4'>

        {/* Transactions */}
        <div className='lg:col-span-3 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm'>
          <div className='flex items-center justify-between mb-5'>
            <h3 className='font-bold text-gray-900'>Recent Transactions</h3>
            <Link to='/transactions' className='text-xs text-blue-600 font-semibold hover:underline'>
              View all →
            </Link>
          </div>

          {transactions.length === 0 ? (
            <div className='text-center py-8 text-gray-400 text-sm'>
              No transactions yet
            </div>
          ) : (
            <div className='flex flex-col divide-y divide-gray-100'>
              {transactions.map((tx) => {
                const isSender = tx.sender_id === user?.id
                return (
                  <div key={tx.id} className='flex items-center justify-between py-3'>
                    <div className='flex items-center gap-3'>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isSender ? 'bg-red-50' : 'bg-green-50'}`}>
                        {isSender
                          ? <ArrowUpRight size={16} className='text-red-500' />
                          : <ArrowDownLeft size={16} className='text-green-500' />
                        }
                      </div>
                      <div>
                        <p className='text-sm font-semibold text-gray-800'>
                          {tx.type === 'mint' ? 'Admin Mint' :
                           tx.type === 'stock_buy' ? tx.note :
                           tx.type === 'stock_sell' ? tx.note :
                           isSender ? `Sent to @${tx.receiver_username}` : `Received from @${tx.sender_username}`}
                        </p>
                        <p className='text-xs text-gray-400'>
                          {new Date(tx.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <span className={`text-sm font-bold ${isSender ? 'text-red-500' : 'text-green-600'}`}>
                      {hideBalance
                        ? '••••'
                        : `${isSender ? '-' : '+'}$${parseFloat(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                      }
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className='lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm'>
          <div className='flex items-center justify-between mb-5'>
            <h3 className='font-bold text-gray-900 flex items-center gap-2'>
              <Trophy size={16} className='text-yellow-500' />
              Leaderboard
            </h3>
            <Link to='/leaderboard' className='text-xs text-blue-600 font-semibold hover:underline'>
              View all →
            </Link>
          </div>

          <div className='flex flex-col gap-3'>
            {leaderboard.map((entry, index) => (
              <div key={index} className='flex items-center gap-3'>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${getRankStyle(index)}`}>
                  {index + 1}
                </div>
                <p className='flex-1 text-sm font-semibold text-gray-800'>@{entry.username}</p>
                <p className='text-sm font-bold text-blue-600'>
                  {hideBalance
                    ? '••••••'
                    : `$${parseFloat(entry.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                  }
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

export default Dashboard