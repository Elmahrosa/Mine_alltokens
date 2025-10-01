-- TEOS Egypt Mining Portal Database Schema
-- Execute these statements in your Supabase SQL editor

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create tokens registry table
CREATE TABLE IF NOT EXISTS tokens (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insert default tokens
INSERT INTO tokens (symbol, name, description, icon_url) VALUES
('TEOS', 'TEOS Token', 'The primary governance and utility token of TEOS Egypt', '/icons/teos.png'),
('TUT', 'Tutankhamun Token', 'Cultural heritage token representing Egyptian legacy', '/icons/tut.png'),
('ERT', 'Egypt Token', 'Regional token for Egyptian civic participation', '/icons/ert.png')
ON CONFLICT (symbol) DO NOTHING;

-- Create users table with civic verification
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE,
  tier VARCHAR(20) DEFAULT 'free' CHECK (tier IN ('free', 'basic', 'pro')),
  
  -- Civic verification fields
  petition_signed BOOLEAN DEFAULT false,
  telegram_joined BOOLEAN DEFAULT false,
  facebook_followed BOOLEAN DEFAULT false,
  x_followed BOOLEAN DEFAULT false,
  civic_verified BOOLEAN DEFAULT false,
  civic_verified_at TIMESTAMP WITH TIME ZONE,
  
  -- Mining tracking
  last_mine_at TIMESTAMP WITH TIME ZONE,
  total_mines INTEGER DEFAULT 0,
  
  -- Referral system
  referral_code VARCHAR(20) UNIQUE,
  referred_by UUID REFERENCES users(id),
  total_referrals INTEGER DEFAULT 0,
  
  -- Tier upgrade tracking
  tier_upgraded_at TIMESTAMP WITH TIME ZONE,
  tier_expires_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create mining_events table
CREATE TABLE IF NOT EXISTS mining_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  token_symbol VARCHAR(10) REFERENCES tokens(symbol) NOT NULL,
  amount DECIMAL(18, 8) NOT NULL,
  tier VARCHAR(20) NOT NULL,
  referral_bonus DECIMAL(18, 8) DEFAULT 0,
  transaction_hash VARCHAR(128),
  mined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES users(id) NOT NULL,
  referred_id UUID REFERENCES users(id) NOT NULL,
  bonus_earned DECIMAL(18, 8) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(referrer_id, referred_id)
);

-- Create payments table for tier upgrades
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  tier VARCHAR(20) NOT NULL,
  amount DECIMAL(18, 8) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  transaction_hash VARCHAR(128) UNIQUE NOT NULL,
  wallet_address VARCHAR(128),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create user_balances table
CREATE TABLE IF NOT EXISTS user_balances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  token_symbol VARCHAR(10) REFERENCES tokens(symbol) NOT NULL,
  balance DECIMAL(18, 8) DEFAULT 0 NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, token_symbol)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_tier ON users(tier);
CREATE INDEX IF NOT EXISTS idx_users_civic_verified ON users(civic_verified);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_mining_events_user_id ON mining_events(user_id);
CREATE INDEX IF NOT EXISTS idx_mining_events_mined_at ON mining_events(mined_at);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_user_balances_user_id ON user_balances(user_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE mining_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_balances ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Users can view and update their own data
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Mining events - users can view their own events
CREATE POLICY "Users can view own mining events" ON mining_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own mining events" ON mining_events FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Referrals - users can view referrals they made or received
CREATE POLICY "Users can view referrals" ON referrals FOR SELECT USING (
  auth.uid() = referrer_id OR auth.uid() = referred_id
);
CREATE POLICY "Users can insert referrals" ON referrals FOR INSERT WITH CHECK (
  auth.uid() = referrer_id OR auth.uid() = referred_id
);

-- Payments - users can view their own payments
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payments" ON payments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User balances - users can view their own balances
CREATE POLICY "Users can view own balances" ON user_balances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own balances" ON user_balances FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own balances" ON user_balances FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Tokens are public (read-only)
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tokens are viewable by everyone" ON tokens FOR SELECT TO public USING (true);

-- Functions and triggers

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_balances table
CREATE TRIGGER update_user_balances_updated_at BEFORE UPDATE ON user_balances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := 'TEOS';
    i INTEGER;
BEGIN
    FOR i IN 1..6 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    ref_code TEXT;
BEGIN
    -- Generate unique referral code
    LOOP
        ref_code := generate_referral_code();
        EXIT WHEN NOT EXISTS (SELECT 1 FROM users WHERE referral_code = ref_code);
    END LOOP;
    
    -- Insert user record
    INSERT INTO users (id, email, referral_code)
    VALUES (NEW.id, NEW.email, ref_code);
    
    -- Initialize token balances
    INSERT INTO user_balances (user_id, token_symbol, balance)
    SELECT NEW.id, symbol, 0
    FROM tokens;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to check if user can mine (24-hour cooldown)
CREATE OR REPLACE FUNCTION can_user_mine(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    last_mine TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT last_mine_at INTO last_mine
    FROM users
    WHERE id = user_uuid;
    
    RETURN last_mine IS NULL OR last_mine < (NOW() - INTERVAL '24 hours');
END;
$$ LANGUAGE plpgsql;

-- Function to execute mining operation
CREATE OR REPLACE FUNCTION execute_mining(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    user_tier TEXT;
    user_civic_verified BOOLEAN;
    teos_amount DECIMAL(18, 8);
    tut_amount DECIMAL(18, 8);
    ert_amount DECIMAL(18, 8);
    referrer_id UUID;
    referral_bonus_pct DECIMAL(5, 4) := 0.05; -- 5%
    result JSON;
BEGIN
    -- Check if user can mine
    IF NOT can_user_mine(user_uuid) THEN
        RETURN json_build_object('success', false, 'error', 'Mining cooldown active');
    END IF;
    
    -- Get user info
    SELECT tier, civic_verified, referred_by
    INTO user_tier, user_civic_verified, referrer_id
    FROM users
    WHERE id = user_uuid;
    
    -- Check civic verification
    IF NOT user_civic_verified THEN
        RETURN json_build_object('success', false, 'error', 'Civic verification required');
    END IF;
    
    -- Set mining amounts based on tier
    CASE user_tier
        WHEN 'free' THEN
            teos_amount := 12;
            tut_amount := 6;
            ert_amount := 3;
        WHEN 'basic' THEN
            teos_amount := 24;
            tut_amount := 12;
            ert_amount := 6;
        WHEN 'pro' THEN
            teos_amount := 36;
            tut_amount := 18;
            ert_amount := 9;
        ELSE
            RETURN json_build_object('success', false, 'error', 'Invalid tier');
    END CASE;
    
    -- Record mining events
    INSERT INTO mining_events (user_id, token_symbol, amount, tier)
    VALUES 
        (user_uuid, 'TEOS', teos_amount, user_tier),
        (user_uuid, 'TUT', tut_amount, user_tier),
        (user_uuid, 'ERT', ert_amount, user_tier);
    
    -- Update user balances
    UPDATE user_balances SET 
        balance = balance + teos_amount,
        updated_at = NOW()
    WHERE user_id = user_uuid AND token_symbol = 'TEOS';
    
    UPDATE user_balances SET 
        balance = balance + tut_amount,
        updated_at = NOW()
    WHERE user_id = user_uuid AND token_symbol = 'TUT';
    
    UPDATE user_balances SET 
        balance = balance + ert_amount,
        updated_at = NOW()
    WHERE user_id = user_uuid AND token_symbol = 'ERT';
    
    -- Handle referral bonus
    IF referrer_id IS NOT NULL THEN
        -- Add referral bonus to referrer
        UPDATE user_balances SET 
            balance = balance + (teos_amount * referral_bonus_pct),
            updated_at = NOW()
        WHERE user_id = referrer_id AND token_symbol = 'TEOS';
        
        -- Record referral bonus
        INSERT INTO mining_events (user_id, token_symbol, amount, tier, referral_bonus)
        VALUES (referrer_id, 'TEOS', teos_amount * referral_bonus_pct, user_tier, teos_amount * referral_bonus_pct);
    END IF;
    
    -- Update user mining stats
    UPDATE users SET 
        last_mine_at = NOW(),
        total_mines = total_mines + 1,
        updated_at = NOW()
    WHERE id = user_uuid;
    
    -- Return success with mined amounts
    result := json_build_object(
        'success', true,
        'mined', json_build_object(
            'TEOS', teos_amount,
            'TUT', tut_amount,
            'ERT', ert_amount
        ),
        'tier', user_tier,
        'next_mine_at', NOW() + INTERVAL '24 hours'
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;
