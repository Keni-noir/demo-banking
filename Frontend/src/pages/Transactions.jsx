import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import API from '../api/axios'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  Search,
  X,
  TrendingUp,
  TrendingDown,
  Landmark
} from 'lucide-react'

const Transactions = () => {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    type: '',
    min_amount: '',
    max_amount: '',
    from_date: '',
    to_date: ''
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async (activeFilters = {}) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      Object.entries(activeFilters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })
      const res = await API.get(`/wallet/transactions?${params.toString()}`)
      setTransactions(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value })
  }

  const handleApplyFilters = () => {
    fetchTransactions(filters)
  }

  const handleClearFilters = () => {
    setFilters({
      type: '',
      min_amount: '',
      max_amount: '',
      from_date: '',
      to_date: ''
    })
    fetchTransactions({})
    setShowFilters(false)
  }

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(v => v !== '').length
  }

  const getTxIcon = (tx) => {
    const isSender = tx.sender_id === user?.id
    if (tx.type === 'mint') return <Landmark size={16} className='text-blue-500' />
    if (tx.type === 'stock_buy') return <TrendingUp size={16} className='text-purple-500' />
    if (tx.type === 'stock_sell') return <TrendingDown size={16} className='text-orange-500' />
    if (isSender) return <ArrowUpRight size={16} className='text-red-500' />
    return <ArrowDownLeft size={16} className='text-green-500' />
  }

  const getTxIconBg = (tx) => {
    const isSender = tx.sender_id === user?.id
    if (tx.type === 'mint') return 'bg-blue-50'
    if (tx.type === 'stock_buy') return 'bg-purple-50'
    if (tx.type === 'stock_sell') return 'bg-orange-50'
    if (isSender) return 'bg-red-50'
    return 'bg-green-50'
  }

  const getTxLabel = (tx) => {
    const isSender = tx.sender_id === user?.id
    if (tx.type === 'mint') return 'Admin Mint'
    if (tx.type === 'stock_buy') return tx.note || 'Stock Purchase'
    if (tx.type === 'stock_sell') return tx.note || 'Stock Sale'
    if (isSender) return `Sent to @${tx.receiver_username}`
    return `Received from @${tx.sender_username}`
  }

  const getTxAmount = (tx) => {
    const isSender = tx.sender_id === user?.id
    const isDebit = isSender && tx.type === 'transfer' || tx.type === 'stock_buy'
    return {
      text: `${isDebit ? '-' : '+'}$${parseFloat(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      color: isDebit ? 'text-red-500' : 'text-green-600'
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

  return (
    <div className='flex flex-col gap-6'>

      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Transactions</h1>
          <p className='text-gray-500 text-sm mt-1'>
            {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border
            ${showFilters || getActiveFilterCount() > 0
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
            }`}
        >
          <Filter size={14} />
          Filters
          {getActiveFilterCount() > 0 && (
            <span className='bg-white text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold'>
              {getActiveFilterCount()}
            </span>
          )}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className='bg-white rounded-2xl border border-gray-200 shadow-sm p-6'>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4'>

            {/* Type */}
            <div>
              <label className='text-xs font-semibold text-gray-600 block mb-2'>
                Transaction Type
              </label>
              <select
                name='type'
                value={filters.type}
                onChange={handleFilterChange}
                className='w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'
              >
                <option value=''>All Types</option>
                <option value='transfer'>Transfer</option>
                <option value='stock_buy'>Stock Buy</option>
                <option value='stock_sell'>Stock Sell</option>
                <option value='mint'>Mint</option>
              </select>
            </div>

            {/* Min Amount */}
            <div>
              <label className='text-xs font-semibold text-gray-600 block mb-2'>
                Min Amount
              </label>
              <input
                type='number'
                name='min_amount'
                value={filters.min_amount}
                onChange={handleFilterChange}
                placeholder='0.00'
                className='w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>

            {/* Max Amount */}
            <div>
              <label className='text-xs font-semibold text-gray-600 block mb-2'>
                Max Amount
              </label>
              <input
                type='number'
                name='max_amount'
                value={filters.max_amount}
                onChange={handleFilterChange}
                placeholder='99999.00'
                className='w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>

            {/* From Date */}
            <div>
              <label className='text-xs font-semibold text-gray-600 block mb-2'>
                From Date
              </label>
              <input
                type='date'
                name='from_date'
                value={filters.from_date}
                onChange={handleFilterChange}
                className='w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>

            {/* To Date */}
            <div>
              <label className='text-xs font-semibold text-gray-600 block mb-2'>
                To Date
              </label>
              <input
                type='date'
                name='to_date'
                value={filters.to_date}
                onChange={handleFilterChange}
                className='w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>

          </div>

          <div className='flex gap-3'>
            <button
              onClick={handleApplyFilters}
              className='flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all'
            >
              <Search size={14} />
              Apply Filters
            </button>
            <button
              onClick={handleClearFilters}
              className='flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all'
            >
              <X size={14} />
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Transactions List */}
      <div className='bg-white rounded-2xl border border-gray-200 shadow-sm'>

        {loading ? (
          <div className='flex items-center justify-center py-16'>
            <div className='flex flex-col items-center gap-3'>
              <div className='w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin' />
              <p className='text-sm text-gray-500'>Loading transactions...</p>
            </div>
          </div>
        ) : transactions.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-16 text-gray-400'>
            <Search size={32} className='mb-3 opacity-50' />
            <p className='text-sm font-medium'>No transactions found</p>
            <p className='text-xs mt-1'>Try adjusting your filters</p>
          </div>
        ) : (
          <div className='divide-y divide-gray-100'>
            {transactions.map((tx) => {
              const amount = getTxAmount(tx)
              const badge = getTxBadge(tx.type)
              return (
                <div key={tx.id} className='flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors'>
                  <div className='flex items-center gap-4'>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getTxIconBg(tx)}`}>
                      {getTxIcon(tx)}
                    </div>
                    <div>
                      <div className='flex items-center gap-2'>
                        <p className='text-sm font-semibold text-gray-800'>
                          {getTxLabel(tx)}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${badge.style}`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className='text-xs text-gray-400 mt-0.5'>
                        {new Date(tx.created_at).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${amount.color}`}>
                    {amount.text}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}

export default Transactions