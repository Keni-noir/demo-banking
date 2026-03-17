import { useState, useEffect } from 'react'
import API from '../api/axios'
import {
  TrendingUp,
  TrendingDown,
  Search,
  ShoppingCart,
  X,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react'

const Stocks = () => {
  const [stocks, setStocks] = useState([])
  const [wallet, setWallet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedStock, setSelectedStock] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [buyLoading, setBuyLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [stocksRes, walletRes] = await Promise.all([
        API.get('/stocks'),
        API.get('/wallet')
      ])
      setStocks(stocksRes.data)
      setWallet(walletRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleBuy = async () => {
    if (!selectedStock || quantity <= 0) return
    const totalCost = parseFloat(selectedStock.current_price) * quantity

    if (totalCost > parseFloat(wallet?.balance)) {
      return setError('Insufficient funds')
    }

    setBuyLoading(true)
    setError('')
    try {
      await API.post('/stocks/buy', {
        stock_id: selectedStock.id,
        quantity: parseInt(quantity)
      })
      setSuccess(`Successfully bought ${quantity} share${quantity > 1 ? 's' : ''} of ${selectedStock.stock_symbol}!`)
      setSelectedStock(null)
      setQuantity(1)
      fetchData()
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setBuyLoading(false)
    }
  }

  const handleCloseModal = () => {
    setSelectedStock(null)
    setQuantity(1)
    setError('')
  }

  const filteredStocks = stocks.filter(stock =>
    stock.stock_symbol?.toLowerCase().includes(search.toLowerCase()) ||
    stock.company_name?.toLowerCase().includes(search.toLowerCase())
  )

  const getPriceChange = () => {
    return (Math.random() * 10 - 5).toFixed(2)
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[60vh]'>
        <div className='flex flex-col items-center gap-3'>
          <div className='w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin' />
          <p className='text-sm text-gray-500'>Loading market data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-6'>

      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Stock Market</h1>
          <p className='text-gray-500 text-sm mt-1'>
            Buy and sell fake stocks with your balance
          </p>
        </div>
        <button
          onClick={fetchData}
          className='flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors'
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div className='flex items-center gap-2 bg-green-50 border border-green-200 text-green-600 text-sm px-4 py-3 rounded-xl'>
          <CheckCircle size={15} />
          {success}
          <button onClick={() => setSuccess('')} className='ml-auto'>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Balance & Search Row */}
      <div className='flex flex-col sm:flex-row gap-4'>

        {/* Balance */}
        <div className='bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4 flex items-center justify-between sm:w-64'>
          <p className='text-sm text-blue-700 font-medium'>Available Balance</p>
          <p className='text-lg font-bold text-blue-600'>
            ${parseFloat(wallet?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Search */}
        <div className='relative flex-1'>
          <Search size={15} className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400' />
          <input
            type='text'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Search by symbol or company name...'
            className='w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'
          />
        </div>

      </div>

      {/* Stocks Grid */}
      {filteredStocks.length === 0 ? (
        <div className='bg-white rounded-2xl border border-gray-200 p-12 text-center'>
          <Search size={32} className='mx-auto mb-3 text-gray-300' />
          <p className='text-gray-500 text-sm font-medium'>No stocks found</p>
          <p className='text-gray-400 text-xs mt-1'>Try a different search term</p>
        </div>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
          {filteredStocks.map((stock) => {
            const change = getPriceChange()
            const isUp = parseFloat(change) >= 0
            return (
              <div
                key={stock.id}
                className='bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer'
                onClick={() => {
                  setSelectedStock(stock)
                  setError('')
                  setQuantity(1)
                }}
              >
                {/* Stock Header */}
                <div className='flex items-start justify-between mb-4'>
                  <div className='w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white text-xs font-bold'>
                    {stock.stock_symbol?.slice(0, 2)}
                  </div>
                  <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg
                    ${isUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                    {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {isUp ? '+' : ''}{change}%
                  </span>
                </div>

                {/* Stock Info */}
                <p className='text-lg font-bold text-gray-900'>{stock.stock_symbol}</p>
                <p className='text-xs text-gray-500 mb-3'>{stock.company_name}</p>

                {/* Price */}
                <div className='flex items-center justify-between'>
                  <p className='text-xl font-bold text-gray-900'>
                    ${parseFloat(stock.current_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <button
                    className='flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all'
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedStock(stock)
                      setError('')
                      setQuantity(1)
                    }}
                  >
                    <ShoppingCart size={11} />
                    Buy
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Buy Modal */}
      {selectedStock && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4'>
          <div className='bg-white rounded-2xl shadow-xl w-full max-w-md p-6'>

            {/* Modal Header */}
            <div className='flex items-center justify-between mb-6'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white text-xs font-bold'>
                  {selectedStock.stock_symbol?.slice(0, 2)}
                </div>
                <div>
                  <p className='font-bold text-gray-900'>{selectedStock.stock_symbol}</p>
                  <p className='text-xs text-gray-500'>{selectedStock.company_name}</p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className='text-gray-400 hover:text-gray-600 transition-colors'
              >
                <X size={20} />
              </button>
            </div>

            {/* Price Info */}
            <div className='bg-gray-50 rounded-xl p-4 mb-5'>
              <div className='flex justify-between items-center mb-2'>
                <span className='text-sm text-gray-500'>Current Price</span>
                <span className='text-lg font-bold text-gray-900'>
                  ${parseFloat(selectedStock.current_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className='flex justify-between items-center mb-2'>
                <span className='text-sm text-gray-500'>Quantity</span>
                <div className='flex items-center gap-2'>
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className='w-7 h-7 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-bold transition-all'
                  >
                    -
                  </button>
                  <span className='w-8 text-center font-bold text-sm'>{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className='w-7 h-7 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-bold transition-all'
                  >
                    +
                  </button>
                </div>
              </div>
              <div className='border-t border-gray-200 pt-2 mt-2 flex justify-between items-center'>
                <span className='text-sm font-semibold text-gray-700'>Total Cost</span>
                <span className='text-lg font-bold text-blue-600'>
                  ${(parseFloat(selectedStock.current_price) * quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Balance Check */}
            <div className='flex justify-between items-center mb-5'>
              <span className='text-xs text-gray-500'>Your Balance</span>
              <span className={`text-xs font-semibold ${parseFloat(wallet?.balance) >= parseFloat(selectedStock.current_price) * quantity ? 'text-green-600' : 'text-red-500'}`}>
                ${parseFloat(wallet?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Error */}
            {error && (
              <div className='flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4'>
                <AlertCircle size={15} />
                {error}
              </div>
            )}

            {/* Actions */}
            <div className='flex gap-3'>
              <button
                onClick={handleCloseModal}
                className='flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-sm transition-all'
              >
                Cancel
              </button>
              <button
                onClick={handleBuy}
                disabled={buyLoading}
                className='flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2'
              >
                {buyLoading ? (
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                ) : (
                  <>
                    <ShoppingCart size={15} />
                    Buy Now
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

export default Stocks