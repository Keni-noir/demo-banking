import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import API from '../api/axios'
import { Trophy, RefreshCw, Medal } from 'lucide-react'

const Leaderboard = () => {
  const { user } = useAuth()
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      const res = await API.get('/wallet/leaderboard')
      setLeaderboard(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getRankStyle = (index) => {
    if (index === 0) return {
      bg: 'bg-yellow-50 border-yellow-200',
      rank: 'bg-yellow-400 text-white',
      badge: '🥇',
      text: 'text-yellow-700'
    }
    if (index === 1) return {
      bg: 'bg-gray-50 border-gray-200',
      rank: 'bg-gray-400 text-white',
      badge: '🥈',
      text: 'text-gray-600'
    }
    if (index === 2) return {
      bg: 'bg-orange-50 border-orange-200',
      rank: 'bg-orange-400 text-white',
      badge: '🥉',
      text: 'text-orange-600'
    }
    return {
      bg: 'bg-white border-gray-200',
      rank: 'bg-gray-100 text-gray-600',
      badge: null,
      text: 'text-gray-500'
    }
  }

  const userRank = leaderboard.findIndex(entry => entry.username === user?.username) + 1

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[60vh]'>
        <div className='flex flex-col items-center gap-3'>
          <div className='w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin' />
          <p className='text-sm text-gray-500'>Loading leaderboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-6 max-w-2xl mx-auto'>

      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900 flex items-center gap-2'>
            <Trophy size={24} className='text-yellow-500' />
            Leaderboard
          </h1>
          <p className='text-gray-500 text-sm mt-1'>
            Top {leaderboard.length} richest users in DemoBank
          </p>
        </div>
        <button
          onClick={fetchLeaderboard}
          className='flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors'
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Your Rank Banner */}
      {userRank > 0 && (
        <div className='bg-blue-600 rounded-2xl px-6 py-4 text-white flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center'>
              <Medal size={20} className='text-white' />
            </div>
            <div>
              <p className='text-blue-200 text-xs font-medium'>Your Current Rank</p>
              <p className='font-bold text-lg'>#{userRank} out of {leaderboard.length}</p>
            </div>
          </div>
          <div className='text-right'>
            <p className='text-blue-200 text-xs font-medium'>Your Balance</p>
            <p className='font-bold text-lg'>
              ${parseFloat(leaderboard.find(e => e.username === user?.username)?.balance || 0)
                .toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      )}

      {/* Top 3 Podium */}
      {leaderboard.length >= 3 && (
        <div className='grid grid-cols-3 gap-3'>
          {/* 2nd Place */}
          <div className='bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center flex flex-col items-center justify-end mt-6'>
            <div className='w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-lg font-bold text-gray-600 mb-2'>
              {leaderboard[1]?.username?.charAt(0).toUpperCase()}
            </div>
            <p className='text-xs font-bold text-gray-700 truncate w-full text-center'>@{leaderboard[1]?.username}</p>
            <p className='text-sm font-bold text-gray-900 mt-1'>
              ${parseFloat(leaderboard[1]?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </p>
            <div className='w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-bold mt-2'>
              2
            </div>
          </div>

          {/* 1st Place */}
          <div className='bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-center flex flex-col items-center'>
            <div className='text-2xl mb-1'>👑</div>
            <div className='w-14 h-14 bg-yellow-400 rounded-full flex items-center justify-center text-lg font-bold text-white mb-2'>
              {leaderboard[0]?.username?.charAt(0).toUpperCase()}
            </div>
            <p className='text-xs font-bold text-yellow-700 truncate w-full text-center'>@{leaderboard[0]?.username}</p>
            <p className='text-sm font-bold text-gray-900 mt-1'>
              ${parseFloat(leaderboard[0]?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </p>
            <div className='w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-white text-sm font-bold mt-2'>
              1
            </div>
          </div>

          {/* 3rd Place */}
          <div className='bg-orange-50 border border-orange-200 rounded-2xl p-4 text-center flex flex-col items-center justify-end mt-6'>
            <div className='w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center text-lg font-bold text-orange-600 mb-2'>
              {leaderboard[2]?.username?.charAt(0).toUpperCase()}
            </div>
            <p className='text-xs font-bold text-orange-700 truncate w-full text-center'>@{leaderboard[2]?.username}</p>
            <p className='text-sm font-bold text-gray-900 mt-1'>
              ${parseFloat(leaderboard[2]?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </p>
            <div className='w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center text-white text-sm font-bold mt-2'>
              3
            </div>
          </div>
        </div>
      )}

      {/* Full List */}
      <div className='bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden'>
        <div className='px-6 py-3 bg-gray-50 border-b border-gray-200'>
          <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide'>Full Rankings</p>
        </div>
        <div className='divide-y divide-gray-100'>
          {leaderboard.map((entry, index) => {
            const style = getRankStyle(index)
            const isCurrentUser = entry.username === user?.username
            return (
              <div
                key={index}
                className={`flex items-center gap-4 px-6 py-4 transition-colors
                  ${isCurrentUser ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-gray-50'}`}
              >
                {/* Rank */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${style.rank}`}>
                  {index + 1}
                </div>

                {/* Avatar */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
                  ${isCurrentUser ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  {entry.username?.charAt(0).toUpperCase()}
                </div>

                {/* Name */}
                <div className='flex-1'>
                  <div className='flex items-center gap-2'>
                    <p className={`text-sm font-bold ${isCurrentUser ? 'text-blue-600' : 'text-gray-900'}`}>
                      @{entry.username}
                    </p>
                    {isCurrentUser && (
                      <span className='text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-lg font-semibold'>
                        You
                      </span>
                    )}
                    {style.badge && <span>{style.badge}</span>}
                  </div>
                </div>

                {/* Balance */}
                <p className='text-sm font-bold text-gray-900'>
                  ${parseFloat(entry.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}

export default Leaderboard