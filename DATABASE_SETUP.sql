-- ========================================
-- SaaS Platform Database Schema
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- Profiles Table
-- ========================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  CONSTRAINT profiles_user_id_unique UNIQUE (user_id)
);

-- ========================================
-- Subscriptions Table
-- ========================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'pro', 'enterprise')),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid')),
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ========================================
-- AI Generations Table
-- ========================================
CREATE TABLE IF NOT EXISTS public.ai_generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prompt TEXT NOT NULL,
  result TEXT NOT NULL,
  platform TEXT DEFAULT 'general' CHECK (platform IN ('facebook', 'instagram', 'google', 'linkedin', 'twitter', 'general')),
  model_used TEXT DEFAULT 'gpt-4-turbo-preview',
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ========================================
-- Usage Metrics Table
-- ========================================
CREATE TABLE IF NOT EXISTS public.usage_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  generations_count INTEGER DEFAULT 0,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  CONSTRAINT usage_metrics_user_date_unique UNIQUE (user_id, date)
);

-- ========================================
-- Updated At Trigger Function
-- ========================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- Add Updated At Triggers
-- ========================================
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ========================================
-- Row Level Security (RLS)
-- ========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_metrics ENABLE ROW LEVEL SECURITY;

-- ========================================
-- Profiles RLS Policies
-- ========================================
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ========================================
-- Subscriptions RLS Policies
-- ========================================
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- ========================================
-- AI Generations RLS Policies
-- ========================================
CREATE POLICY "Users can view own generations" ON public.ai_generations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generations" ON public.ai_generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own generations" ON public.ai_generations
  FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- Usage Metrics RLS Policies
-- ========================================
CREATE POLICY "Users can view own usage metrics" ON public.usage_metrics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own usage metrics" ON public.usage_metrics
  FOR UPDATE USING (auth.uid() = user_id);

-- ========================================
-- Profile Creation Trigger
-- ========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name');
  
  -- Create free subscription for new users
  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active');
  
  RETURN NEW;
END;
LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- Auth Trigger for Profile Creation
-- ========================================
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- Indexes for Performance
-- ========================================
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS ai_generations_user_id_idx ON public.ai_generations(user_id);
CREATE INDEX IF NOT EXISTS ai_generations_created_at_idx ON public.ai_generations(created_at);
CREATE INDEX IF NOT EXISTS usage_metrics_user_id_idx ON public.usage_metrics(user_id);
CREATE INDEX IF NOT EXISTS usage_metrics_date_idx ON public.usage_metrics(date);

-- ========================================
-- Views for Common Queries
-- ========================================
CREATE OR REPLACE VIEW public.user_dashboard AS
SELECT 
  p.id as profile_id,
  p.name,
  p.avatar_url,
  s.plan,
  s.status,
  s.current_period_end,
  COUNT(ag.id) as total_generations,
  COALESCE(SUM(ag.tokens_used), 0) as total_tokens_used,
  COALESCE(um.generations_count, 0) as current_month_generations
FROM public.profiles p
LEFT JOIN public.subscriptions s ON p.user_id = s.user_id
LEFT JOIN public.ai_generations ag ON p.user_id = ag.user_id
LEFT JOIN public.usage_metrics um ON p.user_id = um.user_id AND um.date = CURRENT_DATE
WHERE p.user_id = auth.uid()
GROUP BY p.id, p.name, p.avatar_url, s.plan, s.status, s.current_period_end;
