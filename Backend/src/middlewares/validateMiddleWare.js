import { body, validationResult } from 'express-validator'

export const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: errors.array()[0].msg
    })
  }
  next()
}

export const validateRegister = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters')
    .isAlphanumeric().withMessage('Username can only contain letters and numbers')
    .escape(),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/\d/).withMessage('Password must contain at least one number'),

  validate
]

export const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required'),

  validate
]

export const validateSendMoney = [
  body('receiver_username')
    .trim()
    .notEmpty().withMessage('Receiver username is required')
    .isAlphanumeric().withMessage('Invalid username format')
    .escape(),

  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0')
    .custom(value => {
      if (value > 1000000) throw new Error('Amount exceeds maximum transfer limit')
      return true
    }),

  body('note')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Note cannot exceed 200 characters')
    .escape(),

  validate
]
export const validateStockTransaction = [
  body('stock_id')
    .notEmpty().withMessage('Stock ID is required')
    .isUUID().withMessage('Invalid stock ID format'),

  body('quantity')
    .notEmpty().withMessage('Quantity is required')
    .isInt({ min: 1 }).withMessage('Quantity must be at least 1')
    .custom(value => {
      if (value > 10000) throw new Error('Quantity exceeds maximum limit')
      return true
    }),

  validate
]

export const validateMint = [
  body('user_id')
    .notEmpty().withMessage('User ID is required')
    .isUUID().withMessage('Invalid user ID format'),

  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0')
    .custom(value => {
      if (value > 1000000) throw new Error('Amount exceeds maximum mint limit')
      return true
    }),

  validate
]