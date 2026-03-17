import pool from "../config/db.js";

const getWallet = async (req, res) => {
    try{
        const result = await pool.query(
            `SELECT w.balance, u.username, u.email 
             FROM wallets w 
             JOIN users u ON u.id = w.user_id
             WHERE w.user_id = $1`, [req.user.id]
        )

        res.status(200).json(result.rows[0])

    }catch(error){
        res.status(500).json({ message: 'Server error', error: error.message })
    }

    

}

//transaction Logic
const sendMoney = async (req, res) => {
    const { receiver_username, amount, note } = req.body

  // validate amount
  if (!amount || amount <= 0) {
    return res.status(400).json({ message: 'Invalid amount' })
  }

  const client = await pool.connect()

  try {
    // find receiver
    const receiverResult = await client.query(
      'SELECT id FROM users WHERE username = $1',
      [receiver_username]
    )

    if (receiverResult.rows.length === 0) {
      return res.status(404).json({ message: 'Receiver not found' })
    }

    const receiver = receiverResult.rows[0]

    // prevent sending to yourself
    if (receiver.id === req.user.id) {
      return res.status(400).json({ message: 'Cannot send money to yourself' })
    }

    // check sender balance
    const senderWallet = await client.query(
      'SELECT balance FROM wallets WHERE user_id = $1',
      [req.user.id]
    )

    if (senderWallet.rows[0].balance < amount) {
      return res.status(400).json({ message: 'Insufficient funds' })
    }

    // ── begin transaction ──
    await client.query('BEGIN')

    // deduct from sender
    await client.query(
      'UPDATE wallets SET balance = balance - $1 WHERE user_id = $2',
      [amount, req.user.id]
    )

    // add to receiver
    await client.query(
      'UPDATE wallets SET balance = balance + $1 WHERE user_id = $2',
      [amount, receiver.id]
    )

    // record transaction
    const transaction = await client.query(
      `INSERT INTO transactions (sender_id, receiver_id, amount, type, note)
       VALUES ($1, $2, $3, 'transfer', $4)
       RETURNING *`,
      [req.user.id, receiver.id, amount, note || null]
    )

    await client.query('COMMIT')

    res.status(200).json({
      message: 'Transfer successful',
      transaction: transaction.rows[0]
    })

  } catch (error) {
    await client.query('ROLLBACK')
    res.status(500).json({ message: 'Server error', error: error.message })
  } finally {
    client.release()
  }
}

//transaction history logic
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
      WHERE (t.sender_id = $1 OR t.receiver_id = $1)
    `

    const values = [req.user.id]
    let index = 2

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
// leaderboard logic
const getLeaderboard = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.username, w.balance
       FROM wallets w
       JOIN users u ON u.id = w.user_id
       ORDER BY w.balance DESC
       LIMIT 10`
    )

    res.status(200).json(result.rows)

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

export { getWallet, sendMoney, getTransactions, getLeaderboard }