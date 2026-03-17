import rateLimit from 'express-rate-limit'

const skipInTest = () => process.env.NODE_ENV === 'test'

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skip: skipInTest,
  message: {
    message: 'Too many attempts from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
})

export const apiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
  skip: skipInTest,
  message: {
    message: 'Too many requests from this IP, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
})

export const transferLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  skip: skipInTest,
  message: {
    message: 'Transfer limit reached, please try again after an hour'
  },
  standardHeaders: true,
  legacyHeaders: false
})