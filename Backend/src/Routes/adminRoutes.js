import express from 'express'
import {
  getAllUsers,
  mintMoney,
  deleteUser,
  getTransactions
} from '../controllers/admincontrollers.js'
import { protect, adminOnly } from '../middlewares/authmiddlewares.js'
import { validateMint } from '../middlewares/validateMiddleWare.js'

const router = express.Router()

router.get('/', protect, adminOnly, getAllUsers)
router.post('/mint', protect, adminOnly, validateMint, mintMoney)
router.delete('/users/:id', protect, adminOnly, deleteUser)
router.get('/transactions', protect, adminOnly, getTransactions)

export default router