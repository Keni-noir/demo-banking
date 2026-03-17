import { useState, useEffect } from 'react'
import API from '../api/axios'
import {
  Users,
  DollarSign,
  ArrowLeftRight,
  Trash2,
  Plus,
  X,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  ShieldCheck
} from 'lucide-react'

const Admin = () => {
  const [users, setUsers] = useState([])
  const [transactions, setTransactions] = useState([])
  const [activeTab, setActiveTab] = useState('users')
  const [loading, setLoading] = useState(true)
  const [mintModal, setMintModal] = useState(null)
  const [mintAmount, setMintAmount] = useState('')
  const [mintLoading, setMintLoading] = useState(false)
  const [deleteModal, setDeleteModal] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [usersRes, txRes] = await Promise.all([
        API.get('/admin'),
        API.get('/admin/transactions')
      ])
      setUsers(usersRes.data)
      setTransactions(txRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleMint = async () => {
    if (!mintAmount || mintAmount <= 0) {
      return setError('Please enter a valid amount')
    }
    setMintLoading(true)
    setError('')
    try {
      await API.post('/admin/mint', {
        user_id: mintModal.id,
        amount: parseFloat(mintAmount)
      })
      setSuccess(`Successfully minted $${parseFloat(mintAmount).toLocaleString()} to @${mintModal.username}`)
      setMintModal(null)
      setMintAmount('')
      fetchAll()
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setMintLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleteLoading(true)
    setError('')
    try {
      await API.delete(`/admin/users/${deleteModal.id}`)
      setSuccess(`User @${deleteModal.username} has been deleted`)
      setDeleteModal(null)
      fetchAll()
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setDeleteLoading(false)
    }
  }

  const getTxBadge = (type) => {
    const styles = {
      transfer: 'bg-gray-100 text-gray-600',
      stock_buy: 'bg-purple-100 text-purple-600',
      stock_sell: 'bg-orange-100 text-orange-600',
      mint: 'bg-blue-100 text-blue-600'
    }
    const labels = {
      transfer: 'Transfer',
      stock_buy: 'Stock Buy',
      stock_sell: 'Stock Sell',
      mint: 'Mint'
    }
    return { style: styles[type] || 'bg-gray-100 text-gray-600', label: labels[type] || type }
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[60vh]'>
        <div className='flex flex-col items-center gap-3'>
          <div className='w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin' />
          <p className='text-sm text-gray-500'>Loading admin panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-6'>

      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900 flex items-center gap-2'>
            <ShieldCheck size={24} className='text-blue-600' />
            Admin Panel
          </h1>
          <p className='text-gray-500 text-sm mt-1'>
            Manage users and monitor all transactions
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

      {/* Success/Error Messages */}
      {success && (
        <div className='flex items-center gap-2 bg-green-50 border border-green-200 text-green-600 text-sm px-4 py-3 rounded-xl'>
          <CheckCircle size={15} />
          {success}
          <button onClick={() => setSuccess('')} className='ml-auto'>
            <X size={14} />
          </button>
        </div>
      )}
      {error && !mintModal && !deleteModal && (
        <div className='flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl'>
          <AlertCircle size={15} />
          {error}
          <button onClick={() => setError('')} className='ml-auto'>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Stats */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        <div className='bg-white rounded-2xl p-5 border border-gray-200 shadow-sm'>
          <div className='w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3'>
            <Users size={18} className='text-blue-600' />
          </div>
          <p className='text-xs text-gray-500 font-medium mb-1'>Total Users</p>
          <p className='text-2xl font-bold text-gray-900'>{users.length}</p>
        </div>
        <div className='bg-white rounded-2xl p-5 border border-gray-200 shadow-sm'>
          <div className='w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-3'>
            <ArrowLeftRight size={18} className='text-green-600' />
          </div>
          <p className='text-xs text-gray-500 font-medium mb-1'>Total Transactions</p>
          <p className='text-2xl font-bold text-gray-900'>{transactions.length}</p>
        </div>
        <div className='bg-white rounded-2xl p-5 border border-gray-200 shadow-sm'>
          <div className='w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mb-3'>
            <DollarSign size={18} className='text-purple-600' />
          </div>
          <p className='text-xs text-gray-500 font-medium mb-1'>Total Minted</p>
          <p className='text-2xl font-bold text-gray-900'>
            ${transactions
              .filter(tx => tx.type === 'mint')
              .reduce((sum, tx) => sum + parseFloat(tx.amount), 0)
              .toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className='flex gap-2 bg-gray-100 p-1 rounded-xl w-fit'>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
            ${activeTab === 'users' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Users size={14} />
          Users ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
            ${activeTab === 'transactions' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <ArrowLeftRight size={14} />
          Transactions ({transactions.length})
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className='bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden'>
          <div className='hidden md:grid grid-cols-5 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200'>
            <div className='col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wide'>User</div>
            <div className='text-xs font-semibold text-gray-500 uppercase tracking-wide'>Role</div>
            <div className='text-xs font-semibold text-gray-500 uppercase tracking-wide'>Joined</div>
            <div className='text-xs font-semibold text-gray-500 uppercase tracking-wide text-right'>Actions</div>
          </div>
          <div className='divide-y divide-gray-100'>
            {users.map((u) => (
              <div key={u.id} className='grid grid-cols-2 md:grid-cols-5 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors items-center'>

                {/* User Info */}
                <div className='col-span-2 flex items-center gap-3'>
                  <div className='w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0'>
                    {u.username?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className='text-sm font-bold text-gray-900'>@{u.username}</p>
                    <p className='text-xs text-gray-500'>{u.email}</p>
                  </div>
                </div>

                {/* Role */}
                <div>
                  <span className={`text-xs px-2 py-1 rounded-lg font-semibold
                    ${u.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'}`}>
                    {u.role}
                  </span>
                </div>

                {/* Joined */}
                <div>
                  <p className='text-xs text-gray-500'>
                    {new Date(u.created_at).toLocaleDateString('en-US', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </p>
                </div>

                {/* Actions */}
                <div className='flex items-center justify-end gap-2'>
                  <button
                    onClick={() => {
                      setMintModal(u)
                      setMintAmount('')
                      setError('')
                    }}
                    className='flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all'
                  >
                    <Plus size={12} />
                    Mint
                  </button>
                  <button
                    onClick={() => setDeleteModal(u)}
                    className='flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-500 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all'
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className='bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden'>
          <div className='divide-y divide-gray-100'>
            {transactions.map((tx) => {
              const badge = getTxBadge(tx.type)
              return (
                <div key={tx.id} className='flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors'>
                  <div className='flex items-center gap-4'>
                    <div className='w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-sm'>
                      {tx.type === 'mint' ? '🏦' :
                       tx.type === 'stock_buy' ? '📈' :
                       tx.type === 'stock_sell' ? '📉' : '💸'}
                    </div>
                    <div>
                      <div className='flex items-center gap-2'>
                        <p className='text-sm font-semibold text-gray-800'>
                          {tx.type === 'mint' ? `Minted to @${tx.receiver_username}` :
                           tx.type === 'stock_buy' ? tx.note :
                           tx.type === 'stock_sell' ? tx.note :
                           `@${tx.sender_username} → @${tx.receiver_username}`}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${badge.style}`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className='text-xs text-gray-400 mt-0.5'>
                        {new Date(tx.created_at).toLocaleDateString('en-US', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <span className='text-sm font-bold text-gray-900'>
                    ${parseFloat(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Mint Modal */}
      {mintModal && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4'>
          <div className='bg-white rounded-2xl shadow-xl w-full max-w-md p-6'>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-lg font-bold text-gray-900'>Mint Money</h2>
              <button onClick={() => setMintModal(null)} className='text-gray-400 hover:text-gray-600'>
                <X size={20} />
              </button>
            </div>

            <div className='bg-gray-50 rounded-xl p-4 mb-5'>
              <p className='text-sm text-gray-500 mb-1'>Minting to</p>
              <p className='font-bold text-gray-900'>@{mintModal.username}</p>
              <p className='text-xs text-gray-500'>{mintModal.email}</p>
            </div>

            <div className='mb-5'>
              <label className='text-sm font-semibold text-gray-700 block mb-2'>Amount</label>
              <div className='relative'>
                <DollarSign size={15} className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400' />
                <input
                  type='number'
                  value={mintAmount}
                  onChange={(e) => {
                    setMintAmount(e.target.value)
                    setError('')
                  }}
                  placeholder='0.00'
                  min='1'
                  className='w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
            </div>

            {error && (
              <div className='flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4'>
                <AlertCircle size={15} />
                {error}
              </div>
            )}

            <div className='flex gap-3'>
              <button
                onClick={() => setMintModal(null)}
                className='flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-sm transition-all'
              >
                Cancel
              </button>
              <button
                onClick={handleMint}
                disabled={mintLoading}
                className='flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2'
              >
                {mintLoading ? (
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                ) : (
                  <>
                    <Plus size={15} />
                    Mint Money
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4'>
          <div className='bg-white rounded-2xl shadow-xl w-full max-w-md p-6'>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-lg font-bold text-gray-900'>Delete User</h2>
              <button onClick={() => setDeleteModal(null)} className='text-gray-400 hover:text-gray-600'>
                <X size={20} />
              </button>
            </div>

            <div className='bg-red-50 rounded-xl p-4 mb-5 text-center'>
              <div className='w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3'>
                <Trash2 size={20} className='text-red-500' />
              </div>
              <p className='text-sm text-gray-600'>
                Are you sure you want to delete
              </p>
              <p className='font-bold text-gray-900 text-lg'>@{deleteModal.username}?</p>
              <p className='text-xs text-red-500 mt-2'>
                This will permanently delete their account, wallet and all data.
              </p>
            </div>

            <div className='flex gap-3'>
              <button
                onClick={() => setDeleteModal(null)}
                className='flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-sm transition-all'
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className='flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-semibold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2'
              >
                {deleteLoading ? (
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                ) : (
                  <>
                    <Trash2 size={15} />
                    Delete User
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default Admin