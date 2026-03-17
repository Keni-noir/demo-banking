import request from 'supertest'
import app from '../index.js'
import { pool } from '../config/db.js'

const testUser = {
  username: 'teststockuser',
  email: 'teststockuser@test.com',
  password: 'password123'
}

let token
let stockId

beforeAll(async () => {
  await pool.query(`
    DELETE FROM transactions
    WHERE sender_id IN (SELECT id FROM users WHERE email = $1)
    OR receiver_id IN (SELECT id FROM users WHERE email = $1)
  `, [testUser.email])
  await pool.query('DELETE FROM users WHERE email = $1', [testUser.email])

  const res = await request(app)
    .post('/api/auth/register')
    .send(testUser)
  token = res.body.token

  const stockRes = await pool.query('SELECT id FROM stocks LIMIT 1')
  stockId = stockRes.rows[0].id
}, 15000)

afterAll(async () => {
  await pool.query(`
    DELETE FROM transactions
    WHERE sender_id IN (SELECT id FROM users WHERE email = $1)
    OR receiver_id IN (SELECT id FROM users WHERE email = $1)
  `, [testUser.email])
  await pool.query('DELETE FROM users WHERE email = $1', [testUser.email])
}, 15000)

describe('GET /api/stocks', () => {

  it('should return list of all stocks', async () => {
    const res = await request(app)
      .get('/api/stocks')
      .set('Authorization', `Bearer ${token}`)

    expect(res.statusCode).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThan(0)
  })

  it('should return stocks with required fields', async () => {
    const res = await request(app)
      .get('/api/stocks')
      .set('Authorization', `Bearer ${token}`)

    expect(res.statusCode).toBe(200)
    const stock = res.body[0]
    expect(stock).toHaveProperty('id')
    expect(stock).toHaveProperty('stock_symbol')
    expect(stock).toHaveProperty('company_name')
    expect(stock).toHaveProperty('current_price')
  })

  it('should not return stocks without token', async () => {
    const res = await request(app)
      .get('/api/stocks')

    expect(res.statusCode).toBe(401)
  })

})

describe('POST /api/stocks/buy', () => {

  it('should buy stock successfully', async () => {
    const res = await request(app)
      .post('/api/stocks/buy')
      .set('Authorization', `Bearer ${token}`)
      .send({ stock_id: stockId, quantity: 2 })

    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveProperty('message')
  })

  it('should deduct balance after buying stock', async () => {
    const walletRes = await request(app)
      .get('/api/wallet')
      .set('Authorization', `Bearer ${token}`)

    expect(walletRes.statusCode).toBe(200)
    expect(parseFloat(walletRes.body.balance)).toBeLessThan(10000)
  })

  it('should appear in portfolio after buying', async () => {
    const res = await request(app)
      .get('/api/stocks/portfolio')
      .set('Authorization', `Bearer ${token}`)

    expect(res.statusCode).toBe(200)
    expect(res.body.holdings.length).toBeGreaterThan(0)

    const holding = res.body.holdings.find(h => h.stock_id === stockId)
    expect(holding).toBeDefined()
    expect(holding.quantity).toBe(2)
  })

  it('should not buy stock with invalid stock id', async () => {
    const res = await request(app)
      .post('/api/stocks/buy')
      .set('Authorization', `Bearer ${token}`)
      .send({ stock_id: '00000000-0000-0000-0000-000000000000', quantity: 1 })

    expect(res.statusCode).toBe(404)
    expect(res.body).toHaveProperty('message')
  })

  it('should not buy stock with zero quantity', async () => {
    const res = await request(app)
      .post('/api/stocks/buy')
      .set('Authorization', `Bearer ${token}`)
      .send({ stock_id: stockId, quantity: 0 })

    expect(res.statusCode).toBe(400)
    expect(res.body).toHaveProperty('message')
  })

  it('should not buy stock with insufficient funds', async () => {
    const res = await request(app)
      .post('/api/stocks/buy')
      .set('Authorization', `Bearer ${token}`)
      .send({ stock_id: stockId, quantity: 999999 })

    expect(res.statusCode).toBe(400)
    expect(res.body).toHaveProperty('message')
  })

  it('should not buy stock without token', async () => {
    const res = await request(app)
      .post('/api/stocks/buy')
      .send({ stock_id: stockId, quantity: 1 })

    expect(res.statusCode).toBe(401)
  })

})

describe('GET /api/stocks/portfolio', () => {

  it('should return portfolio with holdings', async () => {
    const res = await request(app)
      .get('/api/stocks/portfolio')
      .set('Authorization', `Bearer ${token}`)

    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveProperty('holdings')
    expect(res.body).toHaveProperty('total_value')
    expect(res.body).toHaveProperty('total_profit_loss')
    expect(Array.isArray(res.body.holdings)).toBe(true)
  })

  it('should return holdings with required fields', async () => {
    const res = await request(app)
      .get('/api/stocks/portfolio')
      .set('Authorization', `Bearer ${token}`)

    expect(res.statusCode).toBe(200)
    const holding = res.body.holdings[0]
    expect(holding).toHaveProperty('stock_id')
    expect(holding).toHaveProperty('stock_symbol')
    expect(holding).toHaveProperty('quantity')
    expect(holding).toHaveProperty('average_buy_price')
    expect(holding).toHaveProperty('current_value')
    expect(holding).toHaveProperty('profit_loss')
  })

  it('should not return portfolio without token', async () => {
    const res = await request(app)
      .get('/api/stocks/portfolio')

    expect(res.statusCode).toBe(401)
  })

})

describe('POST /api/stocks/sell', () => {

  it('should sell stock successfully', async () => {
    const res = await request(app)
      .post('/api/stocks/sell')
      .set('Authorization', `Bearer ${token}`)
      .send({ stock_id: stockId, quantity: 1 })

    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveProperty('message')
  })

  it('should increase balance after selling stock', async () => {
    const walletBefore = await request(app)
      .get('/api/wallet')
      .set('Authorization', `Bearer ${token}`)

    const balanceBefore = parseFloat(walletBefore.body.balance)

    await request(app)
      .post('/api/stocks/sell')
      .set('Authorization', `Bearer ${token}`)
      .send({ stock_id: stockId, quantity: 1 })

    const walletAfter = await request(app)
      .get('/api/wallet')
      .set('Authorization', `Bearer ${token}`)

    expect(parseFloat(walletAfter.body.balance)).toBeGreaterThan(balanceBefore)
  })

  it('should not sell more shares than owned', async () => {
    const res = await request(app)
      .post('/api/stocks/sell')
      .set('Authorization', `Bearer ${token}`)
      .send({ stock_id: stockId, quantity: 99999 })

    expect(res.statusCode).toBe(400)
    expect(res.body).toHaveProperty('message')
  })

  it('should not sell stock you do not own', async () => {
    const otherStock = await pool.query(
      'SELECT id FROM stocks WHERE id != $1 LIMIT 1',
      [stockId]
    )
    const otherStockId = otherStock.rows[0].id

    const res = await request(app)
      .post('/api/stocks/sell')
      .set('Authorization', `Bearer ${token}`)
      .send({ stock_id: otherStockId, quantity: 1 })

    expect(res.statusCode).toBe(400)
    expect(res.body).toHaveProperty('message')
  })

  it('should not sell stock without token', async () => {
    const res = await request(app)
      .post('/api/stocks/sell')
      .send({ stock_id: stockId, quantity: 1 })

    expect(res.statusCode).toBe(401)
  })

})