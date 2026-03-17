CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(10) DEFAULT 'user' NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance NUMERIC(15, 2) DEFAULT 10000.00 NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TYPE transaction_type AS ENUM ('transfer', 'stock_buy', 'stock_sell', 'mint');

CREATE TABLE transactions(
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES users(id),
  receiver_id UUID REFERENCES users(id),
  amount NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
  type transaction_type NOT NULL,
  note TEXT NULL,
  created_at TIMESTAMP DEFAULT NOW()
)

CREATE TABLE stocks(
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stock_symbol VARCHAR(10) UNIQUE NOT NULL,
  company_name VARCHAR(50) NOT NULL,
  current_price NUMERIC(15, 2) NOT NULL CHECK (current_price > 0),
  created_at TIMESTAMP DEFAULT NOW()
)

CREATE TABLE stock_prices_history(
   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
   stock_id UUID REFERENCES stocks(id) ON DELETE CASCADE,
   price NUMERIC(15, 2) NOT NULL,
   created_at TIMESTAMP DEFAULT NOW()
)
CREATE TABLE portfolios(
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stock_id UUID NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  average_buy_price NUMERIC(15, 2) NOT NULL CHECK (average_buy_price > 0),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, stock_id)
)