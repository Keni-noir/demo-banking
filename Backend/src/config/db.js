import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()
const { Pool } = pg

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: process.env.NODE_ENV === 'test' ? 2 : 10
})
pool.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err.message)
    } else {
        console.log('Connected to the database successfully')
    }
})

export default pool