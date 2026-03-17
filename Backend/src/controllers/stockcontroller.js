import pool from "../config/db.js";

const getStocks = async (req, res) => {
    try{
        const result = await pool.query(
            `SELECT * FROM stocks ORDER BY stock_symbol ASC`
        ) 
        res.status(200).json(result.rows);  
     } catch (error){
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
     }
}

const buyStock = async (req, res) => {
    const {stock_id, quantity} = req.body;

    if (!stock_id || !quantity || quantity <= 0) {
    return res.status(400).json({ message: 'Invalid stock or quantity' })
  }

  const client = await pool.connect();
    try{
        const stockResult = await client.query(
          `SELECT * FROM stocks WHERE id = $1`, [stock_id]
        )
        if (stockResult.rows.length === 0){
            return res.status(404).json({ message: 'Stock not found' })
        }
        const stock = stockResult.rows[0]
    const totalCost = stock.current_price * quantity
    const walletResult = await client.query(
      'SELECT balance FROM wallets WHERE user_id = $1',
      [req.user.id]
    )

    if (walletResult.rows[0].balance < totalCost) {
      return res.status(400).json({ message: 'Insufficient funds' })
    }
    await client.query('BEGIN')
    await client.query(
      'UPDATE wallets SET balance = balance - $1 WHERE user_id = $2',
      [totalCost, req.user.id]
    )
    const existingPortfolio = await client.query(
      'SELECT * FROM portfolios WHERE user_id = $1 AND stock_id = $2',
      [req.user.id, stock_id]
    )

    if (existingPortfolio.rows.length > 0) {
      // user already owns this stock — update quantity and average buy price
      const existing = existingPortfolio.rows[0]

      const newQuantity = parseInt(existing.quantity) + parseInt(quantity)
      const newAverage = (
        (existing.quantity * existing.average_buy_price) +
        (quantity * stock.current_price)
      ) / newQuantity

      await client.query(
        `UPDATE portfolios 
         SET quantity = $1, average_buy_price = $2 
         WHERE user_id = $3 AND stock_id = $4`,
        [newQuantity, newAverage, req.user.id, stock_id]
      )
    } else {
      // first time buying this stock — create portfolio row
      await client.query(
        `INSERT INTO portfolios (user_id, stock_id, quantity, average_buy_price)
         VALUES ($1, $2, $3, $4)`,
        [req.user.id, stock_id, quantity, stock.current_price]
      )
    }

    // record transaction
    await client.query(
      `INSERT INTO transactions (sender_id, receiver_id, amount, type, note)
       VALUES ($1, NULL, $2, 'stock_buy', $3)`,
      [req.user.id, totalCost, `Bought ${quantity} shares of ${stock.symbol}`]
    )

    await client.query('COMMIT')

    res.status(200).json({
      message: `Successfully bought ${quantity} shares of ${stock.symbol}`,
      total_cost: totalCost
    })

    }catch(error){
        await client.query('ROLLBACK')
    res.status(500).json({ message: 'Server error', error: error.message })
    } finally {
    client.release()
  }
}


const sellStock = async (req, res) => {
  const { stock_id, quantity } = req.body

  if (!stock_id || !quantity || quantity <= 0) {
    return res.status(400).json({ message: 'Invalid stock or quantity' })
  }

  const client = await pool.connect()

  try {
    // get stock current price
    const stockResult = await client.query(
      'SELECT * FROM stocks WHERE id = $1',
      [stock_id]
    )

    if (stockResult.rows.length === 0) {
      return res.status(404).json({ message: 'Stock not found' })
    }

    const stock = stockResult.rows[0]

    // check if user owns this stock
    const portfolioResult = await client.query(
      'SELECT * FROM portfolios WHERE user_id = $1 AND stock_id = $2',
      [req.user.id, stock_id]
    )

    if (portfolioResult.rows.length === 0) {
      return res.status(400).json({ message: 'You do not own this stock' })
    }

    const portfolio = portfolioResult.rows[0]

    // check if user owns enough shares
    if (portfolio.quantity < quantity) {
      return res.status(400).json({ message: 'Insufficient shares' })
    }

    const totalValue = stock.current_price * quantity

    // ── begin transaction ──
    await client.query('BEGIN')

    // add to wallet
    await client.query(
      'UPDATE wallets SET balance = balance + $1 WHERE user_id = $2',
      [totalValue, req.user.id]
    )

    if (portfolio.quantity === parseInt(quantity)) {
      // selling all shares — delete portfolio row
      await client.query(
        'DELETE FROM portfolios WHERE user_id = $1 AND stock_id = $2',
        [req.user.id, stock_id]
      )
    } else {
      // selling some shares — reduce quantity
      await client.query(
        `UPDATE portfolios SET quantity = quantity - $1 
         WHERE user_id = $2 AND stock_id = $3`,
        [quantity, req.user.id, stock_id]
      )
    }

    // record transaction
    await client.query(
      `INSERT INTO transactions (sender_id, receiver_id, amount, type, note)
       VALUES ($1, NULL, $2, 'stock_sell', $3)`,
      [req.user.id, totalValue, `Sold ${quantity} shares of ${stock.symbol}`]
    )

    await client.query('COMMIT')

    res.status(200).json({
      message: `Successfully sold ${quantity} shares of ${stock.symbol}`,
      total_value: totalValue
    })

  } catch (error) {
    await client.query('ROLLBACK')
    res.status(500).json({ message: 'Server error', error: error.message })
  } finally {
    client.release()
  }
}

 const getPortfolio = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        p.quantity,
        p.average_buy_price,
        s.id AS stock_id,
        s.stock_symbol,
        s.company_name,
        s.current_price,
        (p.quantity * s.current_price) AS current_value,
        (p.quantity * s.current_price) - (p.quantity * p.average_buy_price) AS profit_loss
       FROM portfolios p
       JOIN stocks s ON s.id = p.stock_id
       WHERE p.user_id = $1
       ORDER BY current_value DESC`,
      [req.user.id]
    )

    // calculate total portfolio value and total profit/loss
    const totalValue = result.rows.reduce((sum, row) => sum + parseFloat(row.current_value), 0)
    const totalProfitLoss = result.rows.reduce((sum, row) => sum + parseFloat(row.profit_loss), 0)

    res.status(200).json({
      holdings: result.rows,
      total_value: totalValue.toFixed(2),
      total_profit_loss: totalProfitLoss.toFixed(2)
    })

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// ─── SIMULATE PRICE CHANGES ─────────────────────────────
 const simulatePrices = async () => {
  try {
    const stocks = await pool.query('SELECT * FROM stocks')

    for (const stock of stocks.rows) {
      // random price change between -10% and +10%
      const change = (Math.random() * 0.2) - 0.1
      const newPrice = Math.max(1, stock.current_price * (1 + change))

      // update stock price
      await pool.query(
        'UPDATE stocks SET current_price = $1 WHERE id = $2',
        [newPrice.toFixed(2), stock.id]
      )

      // record price history
      await pool.query(
        'INSERT INTO stock_prices_history (stock_id, price) VALUES ($1, $2)',
        [stock.id, newPrice.toFixed(2)]
      )
    }

    console.log('📈 Stock prices updated')
  } catch (error) {
    console.error('Price simulation error:', error.message)
  }
}
export { getStocks, buyStock, sellStock, getPortfolio, simulatePrices }