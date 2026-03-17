import { Router } from 'express'
import { register, login, getMe } from '../controllers/authcontrollers.js'
import { protect } from '../middlewares/authmiddlewares.js'
import { validateRegister, validateLogin } from '../middlewares/validateMiddleWare.js'
import { authLimiter } from '../middlewares/rateLimiter.js'

const router = Router()

router.post('/register', authLimiter, validateRegister, register)
router.post('/login', authLimiter, validateLogin, login)
router.get('/me', protect, getMe)

export default router