-- Agency Intelligence Engine (AIE) Database Schema
-- Tables for AIE analyses, decisions, and execution tracking

-- AIE Analyses Table
CREATE TABLE IF NOT EXISTS aie_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  input_data JSONB NOT NULL,
  output_data JSONB NOT NULL,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AIE Executions Table
CREATE TABLE IF NOT EXISTS aie_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  analysis_id UUID REFERENCES aie_analyses(id) ON DELETE CASCADE,
  step INTEGER NOT NULL,
  action TEXT NOT NULL,
  platform TEXT NOT NULL,
  parameters JSONB NOT NULL,
  result JSONB,
  error TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'failed')),
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AIE Decision Tracking Table
CREATE TABLE IF NOT EXISTS aie_decisions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  analysis_id UUID REFERENCES aie_analyses(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  expected_impact JSONB NOT NULL,
  actual_impact JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'success', 'failed', 'cancelled')),
  executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AIE Performance Tracking Table
CREATE TABLE IF NOT EXISTS aie_performance_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  decision_id UUID REFERENCES aie_decisions(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  pre_execution_metrics JSONB,
  post_execution_metrics JSONB,
  impact_calculated BOOLEAN DEFAULT FALSE,
  impact_score DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AIE Learning Data Table (for ML model improvement)
CREATE TABLE IF NOT EXISTS aie_learning_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  decision_id UUID REFERENCES aie_decisions(id) ON DELETE CASCADE,
  input_features JSONB NOT NULL,
  decision_outcome TEXT NOT NULL,
  actual_performance JSONB,
  predicted_performance JSONB,
  model_version TEXT,
  accuracy_score DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AIE Platform Connections Enhanced (add AIE-specific fields)
ALTER TABLE platform_connections ADD COLUMN IF NOT EXISTS aie_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE platform_connections ADD COLUMN IF NOT EXISTS aie_permissions JSONB DEFAULT '[]';
ALTER TABLE platform_connections ADD COLUMN IF NOT EXISTS aie_last_sync TIMESTAMP WITH TIME ZONE;

-- AIE User Preferences Table
CREATE TABLE IF NOT EXISTS aie_user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  auto_execute BOOLEAN DEFAULT FALSE,
  confidence_threshold DECIMAL(3,2) DEFAULT 0.7 CHECK (confidence_threshold >= 0 AND confidence_threshold <= 1),
  risk_tolerance DECIMAL(3,2) DEFAULT 0.5 CHECK (risk_tolerance >= 0 AND risk_tolerance <= 1),
  max_daily_budget_change DECIMAL(5,2) DEFAULT 1000,
  preferred_actions TEXT[] DEFAULT '["PAUSE_AD", "SCALE_CAMPAIGN"]',
  notification_settings JSONB DEFAULT '{"email": true, "push": false}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AIE Audit Log Table
CREATE TABLE IF NOT EXISTS aie_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  old_values JSONB,
  new_values JSONB,
  reason TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE aie_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE aie_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE aie_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE aie_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE aie_learning_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE aie_user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE aie_audit_log ENABLE ROW LEVEL SECURITY;

-- AIE Analyses RLS
CREATE POLICY "Users can view their own AIE analyses" ON aie_analyses
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own AIE analyses" ON aie_analyses
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own AIE analyses" ON aie_analyses
  FOR UPDATE USING (user_id = auth.uid());

-- AIE Executions RLS
CREATE POLICY "Users can view their own AIE executions" ON aie_executions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own AIE executions" ON aie_executions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- AIE Decisions RLS
CREATE POLICY "Users can view their own AIE decisions" ON aie_decisions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own AIE decisions" ON aie_decisions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own AIE decisions" ON aie_decisions
  FOR UPDATE USING (user_id = auth.uid());

-- AIE Performance Metrics RLS
CREATE POLICY "Users can view their own AIE performance metrics" ON aie_performance_metrics
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own AIE performance metrics" ON aie_performance_metrics
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- AIE Learning Data RLS
CREATE POLICY "Users can view their own AIE learning data" ON aie_learning_data
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own AIE learning data" ON aie_learning_data
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- AIE User Preferences RLS
CREATE POLICY "Users can view their own AIE preferences" ON aie_user_preferences
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own AIE preferences" ON aie_user_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own AIE preferences" ON aie_user_preferences
  FOR UPDATE USING (user_id = auth.uid());

-- AIE Audit Log RLS
CREATE POLICY "Users can view their own AIE audit logs" ON aie_audit_log
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own AIE audit logs" ON aie_audit_log
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_aie_analyses_user_account ON aie_analyses(user_id, account_id);
CREATE INDEX IF NOT EXISTS idx_aie_analyses_created_at ON aie_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_aie_executions_user_account ON aie_executions(user_id, account_id);
CREATE INDEX IF NOT EXISTS idx_aie_executions_status ON aie_executions(status);
CREATE INDEX IF NOT EXISTS idx_aie_decisions_user_account ON aie_decisions(user_id, account_id);
CREATE INDEX IF NOT EXISTS idx_aie_decisions_status ON aie_decisions(status);
CREATE INDEX IF NOT EXISTS idx_aie_performance_metrics_decision ON aie_performance_metrics(decision_id);
CREATE INDEX IF NOT EXISTS idx_aie_learning_data_decision ON aie_learning_data(decision_id);
CREATE INDEX IF NOT EXISTS idx_aie_audit_log_user_account ON aie_audit_log(user_id, account_id);
CREATE INDEX IF NOT EXISTS idx_aie_audit_log_created_at ON aie_audit_log(created_at DESC);

-- Triggers for Updated At
CREATE TRIGGER update_aie_analyses_updated_at BEFORE UPDATE ON aie_analyses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_aie_decisions_updated_at BEFORE UPDATE ON aie_decisions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_aie_user_preferences_updated_at BEFORE UPDATE ON aie_user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- AIE-specific Functions

-- Function to calculate decision impact
CREATE OR REPLACE FUNCTION calculate_decision_impact(
  decision_id UUID,
  days_to_analyze INTEGER DEFAULT 7
)
RETURNS TABLE (
  pre_roas DECIMAL,
  post_roas DECIMAL,
  roas_change DECIMAL,
  pre_spend DECIMAL,
  post_spend DECIMAL,
  spend_change DECIMAL,
  pre_conversions INTEGER,
  post_conversions INTEGER,
  conversion_change INTEGER,
  impact_score DECIMAL
) AS $$
DECLARE
  decision_record RECORD;
  execution_date TIMESTAMP WITH TIME ZONE;
  pre_period_start TIMESTAMP WITH TIME ZONE;
  pre_period_end TIMESTAMP WITH TIME ZONE;
  post_period_start TIMESTAMP WITH TIME ZONE;
  post_period_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get decision details
  SELECT * INTO decision_record 
  FROM aie_decisions 
  WHERE id = decision_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Get execution date
  execution_date := COALESCE(decision_record.executed_at, decision_record.created_at);
  
  -- Define periods
  pre_period_start := execution_date - (days_to_analyze || ' days')::INTERVAL;
  pre_period_end := execution_date;
  post_period_start := execution_date;
  post_period_end := execution_date + (days_to_analyze || ' days')::INTERVAL;
  
  -- This would connect to actual performance data from connected platforms
  -- For now, return placeholder values
  RETURN QUERY
  SELECT 
    COALESCE(decision_record.expected_impact->'roas_change', 0)::DECIMAL as pre_roas,
    (COALESCE(decision_record.expected_impact->'roas_change', 0) + 0.1)::DECIMAL as post_roas,
    0.1::DECIMAL as roas_change,
    1000::DECIMAL as pre_spend,
    1200::DECIMAL as post_spend,
    200::DECIMAL as spend_change,
    50::INTEGER as pre_conversions,
    60::INTEGER as post_conversions,
    10::INTEGER as conversion_change,
    (decision_record.confidence * 100)::DECIMAL as impact_score;
END;
$$ LANGUAGE plpgsql;

-- Function to get AIE performance summary
CREATE OR REPLACE FUNCTION get_aie_performance_summary(
  user_id_param UUID,
  account_id_param TEXT,
  date_range_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_analyses BIGINT,
  total_decisions BIGINT,
  total_executions BIGINT,
  avg_confidence DECIMAL,
  success_rate DECIMAL,
  total_cost_savings DECIMAL,
  total_roas_improvement DECIMAL,
  top_action_type TEXT,
  last_analysis_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT a.id)::BIGINT as total_analyses,
    COUNT(DISTINCT d.id)::BIGINT as total_decisions,
    COUNT(DISTINCT e.id)::BIGINT as total_executions,
    AVG(d.confidence)::DECIMAL as avg_confidence,
    CASE 
      WHEN COUNT(DISTINCT e.id) > 0 THEN 
        (COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'success')::DECIMAL / COUNT(DISTINCT e.id)::DECIMAL) * 100
      ELSE 0
    END::DECIMAL as success_rate,
    COALESCE(SUM((d.expected_impact->>'cost_saving')::DECIMAL), 0)::DECIMAL as total_cost_savings,
    COALESCE(SUM((d.expected_impact->>'roas_change')::DECIMAL), 0)::DECIMAL as total_roas_improvement,
    mode() WITHIN GROUP (ORDER BY d.action) as top_action_type,
    MAX(a.created_at) as last_analysis_date
  FROM aie_analyses a
  LEFT JOIN aie_decisions d ON a.id = d.analysis_id
  LEFT JOIN aie_executions e ON d.id = e.decision_id
  WHERE a.user_id = user_id_param 
    AND a.account_id = account_id_param
    AND a.created_at >= NOW() - (date_range_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Function to create default AIE preferences for new users
CREATE OR REPLACE FUNCTION create_default_aie_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO aie_user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default AIE preferences for new users
CREATE TRIGGER create_default_aie_preferences_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_aie_preferences();

-- Views for AIE Analytics

-- AIE Decision Performance View
CREATE OR REPLACE VIEW aie_decision_performance AS
SELECT 
  d.id,
  d.user_id,
  d.account_id,
  d.action,
  d.target_type,
  d.target_id,
  d.confidence,
  d.expected_impact,
  d.actual_impact,
  d.status,
  d.created_at,
  d.executed_at,
  -- Calculate actual vs expected performance
  CASE 
    WHEN d.actual_impact IS NOT NULL THEN
      (d.actual_impact->>'roas_change')::DECIMAL - (d.expected_impact->>'roas_change')::DECIMAL
    ELSE NULL
  END as roas_variance,
  CASE 
    WHEN d.actual_impact IS NOT NULL THEN
      (d.actual_impact->>'cost_saving')::DECIMAL - (d.expected_impact->>'cost_saving')::DECIMAL
    ELSE NULL
  END as cost_saving_variance
FROM aie_decisions d;

-- AIE Account Summary View
CREATE OR REPLACE VIEW aie_account_summary AS
SELECT 
  a.user_id,
  a.account_id,
  COUNT(DISTINCT a.id) as total_analyses,
  COUNT(DISTINCT d.id) as total_decisions,
  COUNT(DISTINCT e.id) as total_executions,
  AVG(d.confidence) as avg_confidence,
  MAX(a.created_at) as last_activity,
  -- Success rate
  CASE 
    WHEN COUNT(DISTINCT e.id) > 0 THEN 
      (COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'success')::DECIMAL / COUNT(DISTINCT e.id)::DECIMAL) * 100
    ELSE 0
  END as success_rate
FROM aie_analyses a
LEFT JOIN aie_decisions d ON a.id = d.analysis_id
LEFT JOIN aie_executions e ON d.id = e.decision_id
GROUP BY a.user_id, a.account_id;
