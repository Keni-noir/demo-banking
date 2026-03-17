import { useState, useEffect } from 'react'
import API from '../api/axios'
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  X,
  AlertCircle,
  CheckCircle,
  BarChart3,
  DollarSign
} from 'lucide-react'

const Portfolio = () => {
  const [portfolio, setPortfolio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedStock, setSelectedStock] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [sellLoading, setSellLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchPortfolio()
  }, [])

  const fetchPortfolio = async () => {
    setLoading(true)
    try {
      const res = await API.get('/stocks/portfolio')
      setPortfolio(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSell = async () => {
    if (!selectedStock || quantity <= 0) return

    setSellLoading(true)
    setError('')
    try {
      await API.post('/stocks/sell', {
        stock_id: selectedStock.stock_id,
        quantity: parseInt(quantity)
      })
      setSuccess(`Successfully sold ${quantity} share${quantity > 1 ? 's' : ''} of ${selectedStock.symbol}!`)
      setSelectedStock(null)
      setQuantity(1)
      fetchPortfolio()
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setSellLoading(false)
    }
  }

  const handleCloseModal = () => {
    setSelectedStock(null)
    setQuantity(1)
    setError('')
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[60vh]'>
        <div className='flex flex-col items-center gap-3'>
          <div className='w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin' />
          <p className='text-sm text-gray-500'>Loading your portfolio...</p>
        </div>
      </div>
    )
  }

  const totalProfitLoss = parseFloat(portfolio?.total_profit_loss || 0)
  const totalValue = parseFloat(portfolio?.total_value || 0)
  const isProfit = totalProfitLoss >= 0

  return (
    <div className='flex flex-col gap-6'>

      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>My Portfolio</h1>
          <p className='text-gray-500 text-sm mt-1'>
            {portfolio?.holdings?.length || 0} stock{portfolio?.holdings?.length !== 1 ? 's' : ''} owned
          </p>
        </div>
        <button
          onClick={fetchPortfolio}
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

      {/* Summary Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>

        <div className='bg-blue-600 rounded-2xl p-6 text-white relative overflow-hidden'>
          <div className='absolute -top-8 -right-8 w-32 h-32 bg-white opacity-5 rounded-full' />
          <div className='relative z-10'>
            <div className='w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3'>
              <BarChart3 size={18} className='text-white' />
            </div>
            <p className='text-blue-200 text-xs font-medium mb-1'>Total Portfolio Value</p>
            <p className='text-3xl font-bold'>
              ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className={`rounded-2xl p-6 text-white relative overflow-hidden ${isProfit ? 'bg-green-500' : 'bg-red-500'}`}>
          <div className='absolute -top-8 -right-8 w-32 h-32 bg-white opacity-5 rounded-full' />
          <div className='relative z-10'>
            <div className='w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3'>
              {isProfit
                ? <TrendingUp size={18} className='text-white' />
                : <TrendingDown size={18} className='text-white' />
              }
            </div>
            <p className='text-white/80 text-xs font-medium mb-1'>Total Profit / Loss</p>
            <p className='text-3xl font-bold'>
              {isProfit ? '+' : ''}${totalProfitLoss.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

      </div>

      {/* Holdings */}
      {!portfolio?.holdings?.length ? (
        <div className='bg-white rounded-2xl border border-gray-200 p-12 text-center'>
          <BarChart3 size={40} className='mx-auto mb-3 text-gray-300' />
          <p className='text-gray-500 font-medium'>No stocks owned yet</p>
          <p className='text-gray-400 text-sm mt-1'>Visit the stock market to start investing</p>
        </div>
      ) : (
        <div className='bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden'>

          {/* Table Header — Desktop */}
          <div className='hidden md:grid grid-cols-6 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200'>
            <div className='col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wide'>Stock</div>
            <div className='text-xs font-semibold text-gray-500 uppercase tracking-wide text-right'>Quantity</div>
            <div className='text-xs font-semibold text-gray-500 uppercase tracking-wide text-right'>Avg Buy Price</div>
            <div className='text-xs font-semibold text-gray-500 uppercase tracking-wide text-right'>Current Value</div>
            <div className='text-xs font-semibold text-gray-500 uppercase tracking-wide text-right'>P&L</div>
          </div>

          {/* Table Rows */}
          <div className='divide-y divide-gray-100'>
            {portfolio.holdings.map((holding) => {
              const pl = parseFloat(holding.profit_loss)
              const isHoldingProfit = pl >= 0
              return (
                <div
                  key={holding.stock_id}
                  className='grid grid-cols-2 md:grid-cols-6 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors items-center'
                >
                  {/* Stock Info */}
                  <div className='col-span-2 flex items-center gap-3'>
                    <div className='w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0'>
                      {holding.symbol?.slice(0, 2)}
                    </div>
                    <div>
                      <p className='font-bold text-gray-900 text-sm'>{holding.symbol}</p>
                      <p className='text-xs text-gray-500'>{holding.company_name}</p>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className='text-right'>
                    <p className='text-xs text-gray-400 md:hidden mb-0.5'>Quantity</p>
                    <p className='font-semibold text-gray-900 text-sm'>{holding.quantity}</p>
                  </div>

                  {/* Avg Buy Price */}
                  <div className='text-right'>
                    <p className='text-xs text-gray-400 md:hidden mb-0.5'>Avg Price</p>
                    <p className='font-semibold text-gray-900 text-sm'>
                      ${parseFloat(holding.average_buy_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <p className='text-xs text-gray-400'>
                      Now: ${parseFloat(holding.current_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  {/* Current Value */}
                  <div className='text-right'>
                    <p className='text-xs text-gray-400 md:hidden mb-0.5'>Value</p>
                    <p className='font-bold text-gray-900 text-sm'>
                      ${parseFloat(holding.current_value).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  {/* P&L + Sell */}
                  <div className='text-right flex flex-col items-end gap-2'>
                    <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg
                      ${isHoldingProfit ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                      {isHoldingProfit ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      {isHoldingProfit ? '+' : ''}${pl.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedStock(holding)
                        setQuantity(1)
                        setError('')
                      }}
                      className='text-xs bg-red-50 hover:bg-red-100 text-red-500 font-semibold px-3 py-1.5 rounded-lg transition-all'
                    >
                      Sell
                    </button>
                  </div>

                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Sell Modal */}
      {selectedStock && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4'>
          <div className='bg-white rounded-2xl shadow-xl w-full max-w-md p-6'>

            {/* Modal Header */}
            <div className='flex items-center justify-between mb-6'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center text-white text-xs font-bold'>
                  {selectedStock.symbol?.slice(0, 2)}
                </div>
                <div>
                  <p className='font-bold text-gray-900'>{selectedStock.symbol}</p>
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

            {/* Info */}
            <div className='bg-gray-50 rounded-xl p-4 mb-5'>
              <div className='flex justify-between items-center mb-2'>
                <span className='text-sm text-gray-500'>Shares Owned</span>
                <span className='font-bold text-gray-900'>{selectedStock.quantity}</span>
              </div>
              <div className='flex justify-between items-center mb-2'>
                <span className='text-sm text-gray-500'>Current Price</span>
                <span className='font-bold text-gray-900'>
                  ${parseFloat(selectedStock.current_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className='flex justify-between items-center mb-3'>
                <span className='text-sm text-gray-500'>Quantity to Sell</span>
                <div className='flex items-center gap-2'>
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className='w-7 h-7 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-bold transition-all'
                  >
                    -
                  </button>
                  <span className='w-8 text-center font-bold text-sm'>{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(selectedStock.quantity, quantity + 1))}
                    className='w-7 h-7 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-bold transition-all'
                  >
                    +
                  </button>
                </div>
              </div>
              <div className='border-t border-gray-200 pt-2 flex justify-between items-center'>
                <span className='text-sm font-semibold text-gray-700'>You will receive</span>
                <span className='text-lg font-bold text-green-600'>
                  ${(parseFloat(selectedStock.current_price) * quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
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
                onClick={handleSell}
                disabled={sellLoading}
                className='flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-semibold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2'
              >
                {sellLoading ? (
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                ) : (
                  <>
                    <DollarSign size={15} />
                    Confirm Sell
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

export default Portfolio