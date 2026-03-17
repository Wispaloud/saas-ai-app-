-- AdGen Platform Database Schema
-- Enhanced SaaS platform with War Rooms and Creative Labs

-- War Rooms Tables
CREATE TABLE IF NOT EXISTS war_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS war_room_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  war_room_id UUID REFERENCES war_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(war_room_id, user_id)
);

-- Creative Labs Tables
CREATE TABLE IF NOT EXISTS creative_labs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  war_room_id UUID REFERENCES war_rooms(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaigns Table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  war_room_id UUID REFERENCES war_rooms(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
  budget DECIMAL(10,2),
  target_audience JSONB,
  objectives TEXT[],
  platforms TEXT[],
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ad Creatives Table
CREATE TABLE IF NOT EXISTS ad_creatives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  creative_lab_id UUID REFERENCES creative_labs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  copy TEXT,
  image_url TEXT,
  video_url TEXT,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'google', 'tiktok', 'linkedin', 'twitter')),
  creative_type TEXT DEFAULT 'image' CHECK (creative_type IN ('image', 'video', 'carousel', 'story', 'text')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'testing', 'active', 'paused', 'archived')),
  performance_metrics JSONB DEFAULT '{}',
  a_b_test_group TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- A/B Testing Tables
CREATE TABLE IF NOT EXISTS ab_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  creative_lab_id UUID REFERENCES creative_labs(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'setup' CHECK (status IN ('setup', 'running', 'completed', 'paused')),
  test_type TEXT DEFAULT 'creative' CHECK (test_type IN ('creative', 'copy', 'audience', 'landing')),
  hypothesis TEXT,
  success_metrics TEXT[],
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  sample_size INTEGER,
  confidence_level DECIMAL(3,2) DEFAULT 0.95,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ab_test_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id UUID REFERENCES ab_tests(id) ON DELETE CASCADE,
  creative_id UUID REFERENCES ad_creatives(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  traffic_split DECIMAL(3,2) DEFAULT 50.00,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  spend DECIMAL(10,2) DEFAULT 0.00,
  ctr DECIMAL(5,4) DEFAULT 0.0000,
  conversion_rate DECIMAL(5,4) DEFAULT 0.0000,
  cpa DECIMAL(10,2) DEFAULT 0.00,
  is_winner BOOLEAN DEFAULT FALSE,
  statistical_significance BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asset Library Tables
CREATE TABLE IF NOT EXISTS asset_library (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video', 'audio', 'document')),
  file_size INTEGER,
  dimensions JSONB,
  tags TEXT[],
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  war_room_id UUID REFERENCES war_rooms(id) ON DELETE CASCADE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team Collaboration Tables
CREATE TABLE IF NOT EXISTS team_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  war_room_id UUID REFERENCES war_rooms(id) ON DELETE CASCADE,
  creative_lab_id UUID REFERENCES creative_labs(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('created', 'updated', 'deleted', 'commented', 'shared', 'launched')),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('war_room', 'creative_lab', 'campaign', 'creative', 'ab_test', 'asset')),
  entity_id UUID,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('war_room', 'creative_lab', 'campaign', 'creative', 'ab_test', 'asset')),
  entity_id UUID NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Platform Integration Tables
CREATE TABLE IF NOT EXISTS platform_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'google', 'tiktok', 'linkedin', 'twitter')),
  account_id TEXT NOT NULL,
  account_name TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  permissions TEXT[],
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'error')),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced AI Generations Table
ALTER TABLE ai_generations ADD COLUMN IF NOT EXISTS platform TEXT CHECK (platform IN ('facebook', 'instagram', 'google', 'tiktok', 'linkedin', 'twitter', 'general'));
ALTER TABLE ai_generations ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE;
ALTER TABLE ai_generations ADD COLUMN IF NOT EXISTS creative_id UUID REFERENCES ad_creatives(id) ON DELETE CASCADE;
ALTER TABLE ai_generations ADD COLUMN IF NOT EXISTS war_room_id UUID REFERENCES war_rooms(id) ON DELETE CASCADE;
ALTER TABLE ai_generations ADD COLUMN IF NOT EXISTS creative_lab_id UUID REFERENCES creative_labs(id) ON DELETE CASCADE;
ALTER TABLE ai_generations ADD COLUMN IF NOT EXISTS generation_type TEXT CHECK (generation_type IN ('copy', 'creative_concept', 'headlines', 'cta', 'targeting', 'strategy'));

-- RLS Policies
ALTER TABLE war_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE war_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE creative_labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_connections ENABLE ROW LEVEL SECURITY;

-- War Rooms RLS
CREATE POLICY "Users can view war rooms they are members of" ON war_rooms
  FOR SELECT USING (
    owner_id = auth.uid() OR 
    id IN (SELECT war_room_id FROM war_room_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create war rooms" ON war_rooms
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "War room owners can update" ON war_rooms
  FOR UPDATE USING (owner_id = auth.uid() OR 
    id IN (SELECT war_room_id FROM war_room_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

CREATE POLICY "War room owners can delete" ON war_rooms
  FOR DELETE USING (owner_id = auth.uid());

-- Creative Labs RLS
CREATE POLICY "Users can view creative labs they have access to" ON creative_labs
  FOR SELECT USING (
    owner_id = auth.uid() OR 
    war_room_id IN (SELECT war_room_id FROM war_room_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create creative labs" ON creative_labs
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Creative lab owners can update" ON creative_labs
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Creative lab owners can delete" ON creative_labs
  FOR DELETE USING (owner_id = auth.uid());

-- Campaigns RLS
CREATE POLICY "Users can view campaigns they have access to" ON campaigns
  FOR SELECT USING (
    owner_id = auth.uid() OR 
    war_room_id IN (SELECT war_room_id FROM war_room_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create campaigns" ON campaigns
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Campaign owners can update" ON campaigns
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Campaign owners can delete" ON campaigns
  FOR DELETE USING (owner_id = auth.uid());

-- Ad Creatives RLS
CREATE POLICY "Users can view creatives they have access to" ON ad_creatives
  FOR SELECT USING (
    campaign_id IN (SELECT id FROM campaigns WHERE 
      owner_id = auth.uid() OR 
      war_room_id IN (SELECT war_room_id FROM war_room_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can create creatives" ON ad_creatives
  FOR INSERT WITH CHECK (
    campaign_id IN (SELECT id FROM campaigns WHERE 
      owner_id = auth.uid() OR 
      war_room_id IN (SELECT war_room_id FROM war_room_members WHERE user_id = auth.uid())
    )
  );

-- Additional RLS policies for other tables would follow similar patterns...

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_war_rooms_owner ON war_rooms(owner_id);
CREATE INDEX IF NOT EXISTS idx_war_rooms_members ON war_room_members(war_room_id, user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_war_room ON campaigns(war_room_id);
CREATE INDEX IF NOT EXISTS idx_creatives_campaign ON ad_creatives(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ab_tests_lab ON ab_tests(creative_lab_id);
CREATE INDEX IF NOT EXISTS idx_activities_user ON team_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_entity ON comments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ai_generations_platform ON ai_generations(platform);

-- Triggers for Updated At
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_war_rooms_updated_at BEFORE UPDATE ON war_rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_creative_labs_updated_at BEFORE UPDATE ON creative_labs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ad_creatives_updated_at BEFORE UPDATE ON ad_creatives
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ab_tests_updated_at BEFORE UPDATE ON ab_tests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ab_test_variants_updated_at BEFORE UPDATE ON ab_test_variants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_library_updated_at BEFORE UPDATE ON asset_library
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
