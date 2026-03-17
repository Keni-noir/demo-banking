import request from 'supertest'
import app from '../index.js'
import { pool } from '../config/db.js'

const senderUser = {
  username: 'testsender',
  email: 'testsender@test.com',
  password: 'password123'
}

const receiverUser = {
  username: 'testreceiver',
  email: 'testreceiver@test.com',
  password: 'password123'
}

let senderToken
let receiverToken

beforeAll(async () => {
  await pool.query(`
    DELETE FROM transactions
    WHERE sender_id IN (SELECT id FROM users WHERE email = ANY($1))
    OR receiver_id IN (SELECT id FROM users WHERE email = ANY($1))
  `, [[senderUser.email, receiverUser.email]])
  await pool.query('DELETE FROM users WHERE email = ANY($1)', [
    [senderUser.email, receiverUser.email]
  ])

  const senderRes = await request(app)
    .post('/api/auth/register')
    .send(senderUser)
  senderToken = senderRes.body.token

  const receiverRes = await request(app)
    .post('/api/auth/register')
    .send(receiverUser)
  receiverToken = receiverRes.body.token
}, 15000)

afterAll(async () => {
  await pool.query(`
    DELETE FROM transactions
    WHERE sender_id IN (SELECT id FROM users WHERE email = ANY($1))
    OR receiver_id IN (SELECT id FROM users WHERE email = ANY($1))
  `, [[senderUser.email, receiverUser.email]])
  await pool.query('DELETE FROM users WHERE email = ANY($1)', [
    [senderUser.email, receiverUser.email]
  ])
}, 15000)

describe('GET /api/wallet', () => {

  it('should return wallet with starting balance of 10000', async () => {
    const res = await request(app)
      .get('/api/wallet')
      .set('Authorization', `Bearer ${senderToken}`)

    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveProperty('balance')
    expect(parseFloat(res.body.balance)).toBe(10000)
  })

  it('should not return wallet without token', async () => {
    const res = await request(app)
      .get('/api/wallet')

    expect(res.statusCode).toBe(401)
  })

})

describe('POST /api/wallet/send', () => {

  it('should send money successfully', async () => {
    const res = await request(app)
      .post('/api/wallet/send')
      .set('Authorization', `Bearer ${senderToken}`)
      .send({
        receiver_username: receiverUser.username,
        amount: 500,
        note: 'test payment'
      })

    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveProperty('message')
  })

  it('should deduct balance from sender after sending', async () => {
    const res = await request(app)
      .get('/api/wallet')
      .set('Authorization', `Bearer ${senderToken}`)

    expect(res.statusCode).toBe(200)
    expect(parseFloat(res.body.balance)).toBe(9500)
  })

  it('should increase balance of receiver after receiving', async () => {
    const res = await request(app)
      .get('/api/wallet')
      .set('Authorization', `Bearer ${receiverToken}`)

    expect(res.statusCode).toBe(200)
    expect(parseFloat(res.body.balance)).toBe(10500)
  })

  it('should not send money with insufficient funds', async () => {
    const res = await request(app)
      .post('/api/wallet/send')
      .set('Authorization', `Bearer ${senderToken}`)
      .send({
        receiver_username: receiverUser.username,
        amount: 999999
      })

    expect(res.statusCode).toBe(400)
    expect(res.body).toHaveProperty('message')
  })

  it('should not send money to yourself', async () => {
    const res = await request(app)
      .post('/api/wallet/send')
      .set('Authorization', `Bearer ${senderToken}`)
      .send({
        receiver_username: senderUser.username,
        amount: 100
      })

    expect(res.statusCode).toBe(400)
    expect(res.body).toHaveProperty('message')
  })

  it('should not send money to non existent user', async () => {
    const res = await request(app)
      .post('/api/wallet/send')
      .set('Authorization', `Bearer ${senderToken}`)
      .send({
        receiver_username: 'ghostuser99',
        amount: 100
      })

    expect(res.statusCode).toBe(404)
    expect(res.body).toHaveProperty('message')
  })

  it('should not send with negative amount', async () => {
    const res = await request(app)
      .post('/api/wallet/send')
      .set('Authorization', `Bearer ${senderToken}`)
      .send({
        receiver_username: receiverUser.username,
        amount: -100
      })

    expect(res.statusCode).toBe(400)
    expect(res.body).toHaveProperty('message')
  })

  it('should not send without token', async () => {
    const res = await request(app)
      .post('/api/wallet/send')
      .send({
        receiver_username: receiverUser.username,
        amount: 100
      })

    expect(res.statusCode).toBe(401)
  })

})

describe('GET /api/wallet/transactions', () => {

  it('should return list of transactions', async () => {
    const res = await request(app)
      .get('/api/wallet/transactions')
      .set('Authorization', `Bearer ${senderToken}`)

    expect(res.statusCode).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThan(0)
  })

  it('should filter transactions by type', async () => {
    const res = await request(app)
      .get('/api/wallet/transactions?type=transfer')
      .set('Authorization', `Bearer ${senderToken}`)

    expect(res.statusCode).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    res.body.forEach(tx => {
      expect(tx.type).toBe('transfer')
    })
  })

  it('should not return transactions without token', async () => {
    const res = await request(app)
      .get('/api/wallet/transactions')

    expect(res.statusCode).toBe(401)
  })

})

describe('GET /api/wallet/leaderboard', () => {

  it('should return leaderboard array', async () => {
    const res = await request(app)
      .get('/api/wallet/leaderboard')
      .set('Authorization', `Bearer ${senderToken}`)

    expect(res.statusCode).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('should return users sorted by balance descending', async () => {
    const res = await request(app)
      .get('/api/wallet/leaderboard')
      .set('Authorization', `Bearer ${senderToken}`)

    expect(res.statusCode).toBe(200)
    for (let i = 0; i < res.body.length - 1; i++) {
      expect(parseFloat(res.body[i].balance))
        .toBeGreaterThanOrEqual(parseFloat(res.body[i + 1].balance))
    }
  })

  it('should not return leaderboard without token', async () => {
    const res = await request(app)
      .get('/api/wallet/leaderboard')

    expect(res.statusCode).toBe(401)
  })

})