/*
  # Trading Journal Database Schema
  
  ## Overview
  Complete database structure for a professional trading journal application with multi-account support,
  comprehensive trade tracking, performance analytics, and audit trails.
  
  ## New Tables
  
  ### 1. `accounts`
  User-owned trading accounts for organizing trades
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `name` (text) - Account name/label
  - `account_type` (text) - Type: demo, live, paper
  - `currency` (text) - Base currency
  - `initial_balance` (numeric) - Starting balance
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### 2. `trades`
  Core trade records with comprehensive metadata
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `account_id` (uuid, references accounts)
  - `symbol` (text) - Trading symbol/ticker
  - `instrument_type` (text) - stocks, forex, futures, options, crypto, etc.
  - `direction` (text) - long or short
  - `quantity` (numeric) - Number of units
  - `leverage` (numeric, nullable) - Leverage ratio for margin trades
  - `entry_price` (numeric)
  - `exit_price` (numeric, nullable)
  - `entry_timestamp` (timestamptz)
  - `exit_timestamp` (timestamptz, nullable)
  - `fees` (numeric) - Total fees
  - `commission` (numeric) - Commission costs
  - `slippage` (numeric) - Slippage amount
  - `tags` (text[]) - Array of tags
  - `strategy` (text, nullable) - Strategy name
  - `notes` (text, nullable) - Trade notes
  - `profit_loss` (numeric, nullable) - Calculated P&L
  - `profit_loss_percent` (numeric, nullable) - P&L percentage
  - `r_multiple` (numeric, nullable) - Risk multiple
  - `status` (text) - open or closed
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### 3. `trade_screenshots`
  Image attachments for trades
  - `id` (uuid, primary key)
  - `trade_id` (uuid, references trades)
  - `user_id` (uuid, references auth.users)
  - `file_path` (text) - Storage path
  - `file_name` (text) - Original filename
  - `file_size` (integer) - Size in bytes
  - `uploaded_at` (timestamptz)
  
  ### 4. `trade_ohlc_data`
  Optional candlestick data for chart overlays
  - `id` (uuid, primary key)
  - `trade_id` (uuid, references trades)
  - `timestamp` (timestamptz)
  - `open` (numeric)
  - `high` (numeric)
  - `low` (numeric)
  - `close` (numeric)
  - `volume` (numeric, nullable)
  
  ### 5. `journals`
  Rich-text journal entries linked to trades
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `title` (text)
  - `content` (text) - Rich text/markdown content
  - `linked_trade_ids` (uuid[]) - Array of related trade IDs
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### 6. `journal_attachments`
  Image attachments for journal entries
  - `id` (uuid, primary key)
  - `journal_id` (uuid, references journals)
  - `user_id` (uuid, references auth.users)
  - `file_path` (text)
  - `file_name` (text)
  - `file_size` (integer)
  - `uploaded_at` (timestamptz)
  
  ### 7. `filter_presets`
  Saved filter configurations
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `name` (text) - Preset name
  - `filters` (jsonb) - Filter configuration
  - `created_at` (timestamptz)
  
  ### 8. `csv_mapping_presets`
  Saved CSV import mappings
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `name` (text) - Preset name
  - `mapping` (jsonb) - Column mapping configuration
  - `created_at` (timestamptz)
  
  ### 9. `audit_logs`
  Edit history and audit trail
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `entity_type` (text) - trade, journal, account
  - `entity_id` (uuid) - ID of affected entity
  - `action` (text) - create, update, delete
  - `changes` (jsonb) - Before/after values
  - `timestamp` (timestamptz)
  
  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Users can only access their own data
  - Authenticated users only
  - Proper policies for SELECT, INSERT, UPDATE, DELETE operations
  
  ## Indexes
  - Performance indexes on foreign keys and frequently queried columns
  - Trade queries optimized for dashboard and analytics
  - Composite indexes for common filter combinations
*/

-- Create accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  account_type text NOT NULL DEFAULT 'live',
  currency text NOT NULL DEFAULT 'USD',
  initial_balance numeric(15,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own accounts"
  ON accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accounts"
  ON accounts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts"
  ON accounts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own accounts"
  ON accounts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);

-- Create trades table
CREATE TABLE IF NOT EXISTS trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  symbol text NOT NULL,
  instrument_type text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('long', 'short')),
  quantity numeric(15,4) NOT NULL,
  leverage numeric(10,2),
  entry_price numeric(15,4) NOT NULL,
  exit_price numeric(15,4),
  entry_timestamp timestamptz NOT NULL,
  exit_timestamp timestamptz,
  fees numeric(15,2) DEFAULT 0,
  commission numeric(15,2) DEFAULT 0,
  slippage numeric(15,2) DEFAULT 0,
  tags text[] DEFAULT '{}',
  strategy text,
  notes text,
  profit_loss numeric(15,2),
  profit_loss_percent numeric(10,4),
  r_multiple numeric(10,2),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trades"
  ON trades FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trades"
  ON trades FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trades"
  ON trades FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own trades"
  ON trades FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_account_id ON trades(account_id);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_entry_timestamp ON trades(entry_timestamp);
CREATE INDEX IF NOT EXISTS idx_trades_exit_timestamp ON trades(exit_timestamp);
CREATE INDEX IF NOT EXISTS idx_trades_strategy ON trades(strategy);
CREATE INDEX IF NOT EXISTS idx_trades_user_status ON trades(user_id, status);

-- Create trade_screenshots table
CREATE TABLE IF NOT EXISTS trade_screenshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id uuid REFERENCES trades(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size integer NOT NULL,
  uploaded_at timestamptz DEFAULT now()
);

ALTER TABLE trade_screenshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trade screenshots"
  ON trade_screenshots FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trade screenshots"
  ON trade_screenshots FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own trade screenshots"
  ON trade_screenshots FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_trade_screenshots_trade_id ON trade_screenshots(trade_id);

-- Create trade_ohlc_data table
CREATE TABLE IF NOT EXISTS trade_ohlc_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id uuid REFERENCES trades(id) ON DELETE CASCADE NOT NULL,
  timestamp timestamptz NOT NULL,
  open numeric(15,4) NOT NULL,
  high numeric(15,4) NOT NULL,
  low numeric(15,4) NOT NULL,
  close numeric(15,4) NOT NULL,
  volume numeric(15,2)
);

ALTER TABLE trade_ohlc_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view OHLC data for own trades"
  ON trade_ohlc_data FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trades
      WHERE trades.id = trade_ohlc_data.trade_id
      AND trades.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert OHLC data for own trades"
  ON trade_ohlc_data FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trades
      WHERE trades.id = trade_ohlc_data.trade_id
      AND trades.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete OHLC data for own trades"
  ON trade_ohlc_data FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trades
      WHERE trades.id = trade_ohlc_data.trade_id
      AND trades.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_trade_ohlc_trade_id ON trade_ohlc_data(trade_id);
CREATE INDEX IF NOT EXISTS idx_trade_ohlc_timestamp ON trade_ohlc_data(timestamp);

-- Create journals table
CREATE TABLE IF NOT EXISTS journals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  linked_trade_ids uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE journals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own journals"
  ON journals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journals"
  ON journals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journals"
  ON journals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own journals"
  ON journals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_journals_user_id ON journals(user_id);

-- Create journal_attachments table
CREATE TABLE IF NOT EXISTS journal_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id uuid REFERENCES journals(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size integer NOT NULL,
  uploaded_at timestamptz DEFAULT now()
);

ALTER TABLE journal_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own journal attachments"
  ON journal_attachments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal attachments"
  ON journal_attachments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal attachments"
  ON journal_attachments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_journal_attachments_journal_id ON journal_attachments(journal_id);

-- Create filter_presets table
CREATE TABLE IF NOT EXISTS filter_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  filters jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE filter_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own filter presets"
  ON filter_presets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own filter presets"
  ON filter_presets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own filter presets"
  ON filter_presets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own filter presets"
  ON filter_presets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_filter_presets_user_id ON filter_presets(user_id);

-- Create csv_mapping_presets table
CREATE TABLE IF NOT EXISTS csv_mapping_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  mapping jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE csv_mapping_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own CSV mapping presets"
  ON csv_mapping_presets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own CSV mapping presets"
  ON csv_mapping_presets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own CSV mapping presets"
  ON csv_mapping_presets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own CSV mapping presets"
  ON csv_mapping_presets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_csv_mapping_presets_user_id ON csv_mapping_presets(user_id);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  changes jsonb NOT NULL,
  timestamp timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);

-- Create function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_accounts_updated_at') THEN
    CREATE TRIGGER update_accounts_updated_at
      BEFORE UPDATE ON accounts
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_trades_updated_at') THEN
    CREATE TRIGGER update_trades_updated_at
      BEFORE UPDATE ON trades
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_journals_updated_at') THEN
    CREATE TRIGGER update_journals_updated_at
      BEFORE UPDATE ON journals
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;