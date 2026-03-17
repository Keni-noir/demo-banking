import { useState, useEffect } from 'react'
import API from '../api/axios'
import { useAuth } from '../context/AuthContext'
import {
  SendHorizonal,
  User,
  DollarSign,
  FileText,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react'

const SendMoney = () => {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    receiver_username: '',
    amount: '',
    note: ''
  })
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [wallet, setWallet] = useState(null)
  const [hideBalance, setHideBalance] = useState(false)

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const res = await API.get('/wallet')
        setWallet(res.data)
      } catch (err) {
        console.error(err)
      }
    }
    fetchWallet()
  }, [])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const handleReview = (e) => {
    e.preventDefault()
    if (!formData.receiver_username) return setError('Please enter a username')
    if (!formData.amount || formData.amount <= 0) return setError('Please enter a valid amount')
    if (formData.receiver_username === user?.username) return setError('You cannot send money to yourself')
    if (parseFloat(formData.amount) > parseFloat(wallet?.balance)) return setError('Insufficient funds')
    setStep(2)
  }

  const handleSend = async () => {
    setLoading(true)
    setError('')
    try {
      await API.post('/wallet/send', {
        receiver_username: formData.receiver_username,
        amount: parseFloat(formData.amount),
        note: formData.note || null
      })
      setStep(3)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
      setStep(1)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({ receiver_username: '', amount: '', note: '' })
    setStep(1)
    setError('')
  }

  return (
    <div className='max-w-lg mx-auto'>

      {/* Header */}
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-gray-900'>Send Money</h1>
        <p className='text-gray-500 text-sm mt-1'>
          Transfer fake money to another user instantly
        </p>
      </div>

      {/* Balance Banner */}
      {wallet && (
        <div className='bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4 mb-6 flex items-center justify-between'>
          <p className='text-sm text-blue-700 font-medium'>Available Balance</p>
          <div className='flex items-center gap-2'>
            <p className='text-lg font-bold text-blue-600'>
              {hideBalance
                ? '••••••'
                : `$${parseFloat(wallet.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
              }
            </p>
            <button
              onClick={() => setHideBalance(!hideBalance)}
              className='text-blue-400 hover:text-blue-600 transition-colors'
            >
              {hideBalance ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
      )}

      {/* Step 1 — Form */}
      {step === 1 && (
        <div className='bg-white rounded-2xl border border-gray-200 shadow-sm p-6'>

          {error && (
            <div className='flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-5'>
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          <form onSubmit={handleReview} className='flex flex-col gap-5'>
            <div>
              <label className='text-sm font-semibold text-gray-700 block mb-2'>Send to</label>
              <div className='relative'>
                <User size={15} className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400' />
                <input
                  type='text'
                  name='receiver_username'
                  value={formData.receiver_username}
                  onChange={handleChange}
                  placeholder='Enter username'
                  className='w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'
                />
              </div>
            </div>

            <div>
              <label className='text-sm font-semibold text-gray-700 block mb-2'>Amount</label>
              <div className='relative'>
                <DollarSign size={15} className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400' />
                <input
                  type='number'
                  name='amount'
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder='0.00'
                  min='1'
                  step='0.01'
                  className='w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'
                />
              </div>
            </div>

            <div>
              <label className='text-sm font-semibold text-gray-700 block mb-2'>
                Note <span className='text-gray-400 font-normal'>(optional)</span>
              </label>
              <div className='relative'>
                <FileText size={15} className='absolute left-4 top-3.5 text-gray-400' />
                <textarea
                  name='note'
                  value={formData.note}
                  onChange={handleChange}
                  placeholder='What is this for?'
                  rows={3}
                  className='w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none'
                />
              </div>
            </div>

            <button
              type='submit'
              className='w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2'
            >
              <SendHorizonal size={15} />
              Review Transfer
            </button>
          </form>
        </div>
      )}

      {/* Step 2 — Confirm */}
      {step === 2 && (
        <div className='bg-white rounded-2xl border border-gray-200 shadow-sm p-6'>
          <h2 className='text-lg font-bold text-gray-900 mb-5'>Confirm Transfer</h2>

          <div className='flex flex-col gap-4 mb-6'>
            <div className='flex justify-between items-center py-3 border-b border-gray-100'>
              <span className='text-sm text-gray-500'>From</span>
              <span className='text-sm font-semibold text-gray-900'>@{user?.username}</span>
            </div>
            <div className='flex justify-between items-center py-3 border-b border-gray-100'>
              <span className='text-sm text-gray-500'>To</span>
              <span className='text-sm font-semibold text-gray-900'>@{formData.receiver_username}</span>
            </div>
            <div className='flex justify-between items-center py-3 border-b border-gray-100'>
              <span className='text-sm text-gray-500'>Amount</span>
              <span className='text-lg font-bold text-blue-600'>
                ${parseFloat(formData.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            {formData.note && (
              <div className='flex justify-between items-center py-3 border-b border-gray-100'>
                <span className='text-sm text-gray-500'>Note</span>
                <span className='text-sm font-semibold text-gray-900'>{formData.note}</span>
              </div>
            )}
            <div className='flex justify-between items-center py-3'>
              <span className='text-sm text-gray-500'>Remaining Balance</span>
              <span className='text-sm font-semibold text-gray-900'>
                ${(parseFloat(wallet?.balance) - parseFloat(formData.amount)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
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
              onClick={() => setStep(1)}
              className='flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-sm transition-all'
            >
              Go Back
            </button>
            <button
              onClick={handleSend}
              disabled={loading}
              className='flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2'
            >
              {loading ? (
                <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
              ) : (
                <>
                  <SendHorizonal size={15} />
                  Confirm Send
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Success */}
      {step === 3 && (
        <div className='bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center'>
          <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <CheckCircle size={32} className='text-green-500' />
          </div>
          <h2 className='text-xl font-bold text-gray-900 mb-2'>Transfer Successful!</h2>
          <p className='text-gray-500 text-sm mb-2'>
            You sent <span className='font-semibold text-gray-900'>${parseFloat(formData.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span> to
          </p>
          <p className='text-blue-600 font-bold text-lg mb-6'>@{formData.receiver_username}</p>
          <button
            onClick={handleReset}
            className='w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm transition-all'
          >
            Send Again
          </button>
        </div>
      )}

    </div>
  )
}

export default SendMoney