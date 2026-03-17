import express from 'express'
import {
  getWallet,
  sendMoney,
  getTransactions,
  getLeaderboard
} from '../controllers/walletcontroller.js'
import { protect, userOnly } from '../middlewares/authmiddlewares.js'
import { validateSendMoney } from '../middlewares/validateMiddleWare.js'
import { transferLimiter } from '../middlewares/rateLimiter.js'

const router = express.Router()

router.get('/', protect, userOnly, getWallet)
router.post('/send', protect, userOnly, transferLimiter, validateSendMoney, sendMoney)
router.get('/transactions', protect, userOnly, getTransactions)
router.get('/leaderboard', protect, getLeaderboard)

export default router