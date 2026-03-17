import request from 'supertest'
import app from '../index.js'
import { pool } from '../config/db.js'

const testUser = {
  username: 'testuser',
  email: 'testuser@test.com',
  password: 'password123'
}

beforeAll(async () => {
  await pool.query(`
    DELETE FROM transactions
    WHERE sender_id IN (SELECT id FROM users WHERE username = ANY($1))
    OR receiver_id IN (SELECT id FROM users WHERE username = ANY($1))
  `, [['testuser', 'uniqueuser1', 'uniqueuser2']])
  await pool.query(
    'DELETE FROM users WHERE username = ANY($1)',
    [['testuser', 'uniqueuser1', 'uniqueuser2']]
  )
}, 15000)

afterAll(async () => {
  await pool.query(`
    DELETE FROM transactions
    WHERE sender_id IN (SELECT id FROM users WHERE username = ANY($1))
    OR receiver_id IN (SELECT id FROM users WHERE username = ANY($1))
  `, [['testuser', 'uniqueuser1', 'uniqueuser2']])
  await pool.query(
    'DELETE FROM users WHERE username = ANY($1)',
    [['testuser', 'uniqueuser1', 'uniqueuser2']]
  )
}, 15000)

describe('POST /api/auth/register', () => {

  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser)

    expect(res.statusCode).toBe(201)
    expect(res.body).toHaveProperty('token')
    expect(res.body.user.email).toBe(testUser.email)
    expect(res.body.user.username).toBe(testUser.username)
    expect(res.body.user).not.toHaveProperty('password_hash')
  })

  it('should not register with duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser)

    expect(res.statusCode).toBe(400)
    expect(res.body).toHaveProperty('message')
  })

  it('should not register with invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'uniqueuser1', email: 'notanemail', password: 'pass123' })

    expect(res.statusCode).toBe(400)
    expect(res.body.message).toBe('Please provide a valid email')
  })

  it('should not register with short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'uniqueuser2', email: 'unique2@test.com', password: '123' })

    expect(res.statusCode).toBe(400)
    expect(res.body.message).toBe('Password must be at least 6 characters')
  })

  it('should not register with short username', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'ab', email: 'unique3@test.com', password: 'pass123' })

    expect(res.statusCode).toBe(400)
    expect(res.body.message).toBe('Username must be between 3 and 50 characters')
  })

  it('should not register with missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'other@test.com' })

    expect(res.statusCode).toBe(400)
    expect(res.body).toHaveProperty('message')
  })

})

describe('POST /api/auth/login', () => {

  it('should login successfully with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password })

    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveProperty('token')
    expect(res.body.user.email).toBe(testUser.email)
  })

  it('should not login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'wrongpassword' })

    expect(res.statusCode).toBe(401)
    expect(res.body).toHaveProperty('message')
  })

  it('should not login with wrong email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'wrong@test.com', password: testUser.password })

    expect(res.statusCode).toBe(401)
    expect(res.body).toHaveProperty('message')
  })

  it('should not login with invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'notanemail', password: testUser.password })

    expect(res.statusCode).toBe(400)
    expect(res.body.message).toBe('Please provide a valid email')
  })

  it('should not login with missing password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email })

    expect(res.statusCode).toBe(400)
    expect(res.body).toHaveProperty('message')
  })

})

describe('GET /api/auth/me', () => {

  let token

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password })
    token = res.body.token
  }, 15000)

  it('should return current user with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)

    expect(res.statusCode).toBe(200)
    expect(res.body.email).toBe(testUser.email)
  })

  it('should not return user without token', async () => {
    const res = await request(app)
      .get('/api/auth/me')

    expect(res.statusCode).toBe(401)
  })

  it('should not return user with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalidtoken123')

    expect(res.statusCode).toBe(401)
  })

})