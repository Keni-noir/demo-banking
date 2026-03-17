import pool from '../config/db.js';

const getAllUsers = async (req, res) => {
    try{
        const result = await pool.query(
            `SELECT id, username, email, role, created_at FROM users WHERE role = 'user' ORDER BY username ASC`
        )
        res.status(200).json(result.rows)
    }catch(error){
        res.status(500).json({ message: 'Server error', error: error.message })
    }
}

const mintMoney = async (req, res) => {
    try {
        const { user_id, amount } = req.body

        if (!user_id || !amount || amount <= 0) {
            return res.status(400).json({ message: 'Invalid user or amount' })
        }

        await pool.query(
            'UPDATE wallets SET balance = balance + $1 WHERE user_id = $2',
            [amount, user_id]
        )

        const transaction = await pool.query(
            `INSERT INTO transactions (sender_id, receiver_id, amount, type)
             VALUES (NULL, $1, $2, 'mint')
             RETURNING *`,
            [user_id, amount]
        )

        res.status(200).json({
            message: 'Money minted successfully',
            transaction: transaction.rows[0]
        })

    } catch(error){
        res.status(500).json({ message: 'Server error', error: error.message })
    }
}

const getTransactions = async (req, res) => {
    try {
        const { type, min_amount, max_amount, from_date, to_date } = req.query

        let query = `
            SELECT 
                t.*,
                sender.username AS sender_username,
                receiver.username AS receiver_username
            FROM transactions t
            LEFT JOIN users sender ON sender.id = t.sender_id
            LEFT JOIN users receiver ON receiver.id = t.receiver_id
            WHERE 1=1
        `

        const values = []
        let index = 1

        if (type) {
            query += ` AND t.type = $${index}`
            values.push(type)
            index++
        }

        if (min_amount) {
            query += ` AND t.amount >= $${index}`
            values.push(min_amount)
            index++
        }

        if (max_amount) {
            query += ` AND t.amount <= $${index}`
            values.push(max_amount)
            index++
        }

        if (from_date) {
            query += ` AND t.created_at >= $${index}`
            values.push(from_date)
            index++
        }

        if (to_date) {
            query += ` AND t.created_at <= $${index}`
            values.push(to_date)
            index++
        }

        query += ' ORDER BY t.created_at DESC'

        const result = await pool.query(query, values)

        res.status(200).json(result.rows)

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message })
    }
}

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params

        if (!id) {
            return res.status(400).json({ message: 'Invalid user ID' })
        }

        await pool.query(
            'DELETE FROM users WHERE id = $1',
            [id]
        )

        res.status(200).json({ message: 'User deleted successfully' })

    } catch(error){
        res.status(500).json({ message: 'Server error', error: error.message })
    }
}

export { getAllUsers, mintMoney, deleteUser, getTransactions }