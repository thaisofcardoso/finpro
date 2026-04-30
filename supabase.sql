-- =============================================
-- FinPro — SQL para rodar no Supabase
-- =============================================

-- 1. Criar tabela de transações
CREATE TABLE IF NOT EXISTS transactions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type             TEXT NOT NULL CHECK (type IN ('entrada', 'saida')),
  description      TEXT NOT NULL,
  category         TEXT NOT NULL,
  amount           NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  transaction_date DATE NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Índices para performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date DESC);

-- 3. Ativar Row Level Security
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS — cada usuário vê apenas seus dados
CREATE POLICY "users_select_own" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own" ON transactions
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "users_update_own" ON transactions
  FOR UPDATE USING (auth.uid() = user_id);
