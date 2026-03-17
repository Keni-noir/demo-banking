import express from 'express'
import {
  getStocks,
  buyStock,
  sellStock,
  getPortfolio
} from '../controllers/stockcontroller.js'
import { protect, userOnly } from '../middlewares/authmiddlewares.js'
import { validateStockTransaction } from '../middlewares/validateMiddleWare.js'

const router = express.Router()

router.get('/', protect, getStocks)
router.post('/buy', protect, userOnly, validateStockTransaction, buyStock)
router.post('/sell', protect, userOnly, validateStockTransaction, sellStock)
router.get('/portfolio', protect, userOnly, getPortfolio)

export default router