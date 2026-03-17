import jwt from 'jsonwebtoken'


export const protect = (req, res, next) => {
  try {
    // get token from request headers
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token, authorization denied' })
    }

    // extract token from header
    const token = authHeader.split(' ')[1]

    // verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // attach user to request object
    req.user = decoded

    next()

  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' })
  }
}

export const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied, admins only' })
  }
  next()
}

export const userOnly = (req, res, next) => {
  if (req.user.role !== 'user') {
    return res.status(403).json({ message: 'Access denied, users only' })
  }
  next()
}