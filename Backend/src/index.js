import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import  pool  from './config/db.js'
import authRoutes from './Routes/authRoutes.js'
import walletRoutes from './Routes/walletRoutes.js'
import stockRoutes from './Routes/stockRoutes.js'
import adminRoutes from './Routes/adminRoutes.js'
import { apiLimiter } from './middlewares/rateLimiter.js'
import { simulatePrices } from './controllers/stockcontroller.js'
import dotenv from 'dotenv'

dotenv.config()
const app = express()
const PORT = process.env.PORT || 5002


app.use(helmet())

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))

app.use(express.json({ limit: '10kb' }))


app.use('/api', apiLimiter)


app.use('/api/auth', authRoutes)
app.use('/api/wallet', walletRoutes)
app.use('/api/stocks', stockRoutes)
app.use('/api/admin', adminRoutes)


app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: 'Internal server error' })
})


app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})


if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, async () => {
    try {
      await pool.query('SELECT 1')
      console.log('Database connected')
      console.log(`Server running on port ${PORT}`)
      setInterval(simulatePrices, 60000)
      console.log('Stock price simulation started')
    } catch (err) {
      console.error('Database connection failed:', err.message)
      process.exit(1)
    }
  })
}

export default app