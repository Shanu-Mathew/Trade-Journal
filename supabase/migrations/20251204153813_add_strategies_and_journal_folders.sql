/*
  # Add Strategies and Journal Folders

  ## Overview
  Adds support for user-defined trading strategies and journal folder organization.

  ## New Tables
  
  ### 1. `strategies`
  User-defined trading strategies with formatted content
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `account_id` (uuid, references accounts) - Account association
  - `title` (text) - Strategy name
  - `body` (text) - Strategy description/rules
  - `is_bulleted` (boolean) - Whether to format as bullet points
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### 2. `journal_folders`
  Folders for organizing journal entries
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `account_id` (uuid, references accounts)
  - `name` (text) - Folder name
  - `created_at` (timestamptz)
  
  ## Table Modifications
  
  ### `journals` table updates
  - Add `account_id` column to associate journals with accounts
  - Add `folder_id` column (nullable) to organize journals into folders
  - Add `entry_date` column to allow manual date/time selection
  
  ## Security
  - RLS enabled on all new tables
  - Users can only access their own strategies and folders
  - Proper SELECT, INSERT, UPDATE, DELETE policies
  
  ## Indexes
  - Performance indexes on foreign keys
  - Indexes for common queries
*/

-- Create strategies table
CREATE TABLE IF NOT EXISTS strategies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  is_bulleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own strategies"
  ON strategies FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own strategies"
  ON strategies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own strategies"
  ON strategies FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own strategies"
  ON strategies FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_strategies_user_id ON strategies(user_id);
CREATE INDEX IF NOT EXISTS idx_strategies_account_id ON strategies(account_id);

-- Create journal_folders table
CREATE TABLE IF NOT EXISTS journal_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE journal_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own journal folders"
  ON journal_folders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal folders"
  ON journal_folders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal folders"
  ON journal_folders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal folders"
  ON journal_folders FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_journal_folders_user_id ON journal_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_folders_account_id ON journal_folders(account_id);

-- Add columns to journals table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'journals' AND column_name = 'account_id'
  ) THEN
    ALTER TABLE journals ADD COLUMN account_id uuid REFERENCES accounts(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'journals' AND column_name = 'folder_id'
  ) THEN
    ALTER TABLE journals ADD COLUMN folder_id uuid REFERENCES journal_folders(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'journals' AND column_name = 'entry_date'
  ) THEN
    ALTER TABLE journals ADD COLUMN entry_date timestamptz DEFAULT now();
  END IF;
END $$;

-- Create index for journal folder queries
CREATE INDEX IF NOT EXISTS idx_journals_folder_id ON journals(folder_id);
CREATE INDEX IF NOT EXISTS idx_journals_account_id ON journals(account_id);
CREATE INDEX IF NOT EXISTS idx_journals_entry_date ON journals(entry_date);

-- Create trigger for strategies updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_strategies_updated_at') THEN
    CREATE TRIGGER update_strategies_updated_at
      BEFORE UPDATE ON strategies
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;