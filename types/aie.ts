// AIE System Type Definitions
// Production-grade interfaces for War Room and Creative Lab

export type SystemMode = 'AUTO' | 'MANUAL' | 'HYBRID'

export type InsightType = 'fatigue' | 'winner' | 'anomaly'
export type Severity = 'low' | 'medium' | 'high'
export type DecisionStatus = 'PENDING' | 'APPROVED' | 'EXECUTED' | 'REJECTED'
export type ExecutionStatus = 'IN_PROGRESS' | 'SUCCESS' | 'FAILED'

export interface Insight {
  id: string
  type: InsightType
  entity: {
    type: string
    id: string
    name?: string
  }
  severity: Severity
  metrics_snapshot: Record<string, number>
  reason: string
  confidence: number
  timestamp: string
}

export interface Decision {
  id: string
  action: string
  target: {
    type: string
    id: string
    name?: string
  }
  reason: string
  confidence: number
  status: DecisionStatus
  expected_impact: {
    roas_change: number
    cost_saving: number
    conversion_lift: number
  }
  created_at: string
  updated_at?: string
}

export interface Execution {
  id: string
  decision_id: string
  status: ExecutionStatus
  latency_ms: number
  platform: string
  action: string
  parameters: Record<string, any>
  result?: any
  error?: string
  started_at: string
  completed_at?: string
}

export interface SystemState {
  mode: SystemMode
  confidence_threshold: number
  kill_switch: boolean
  spend_today: number
  roas_today: number
  active_decisions: number
  alerts: number
  last_updated: string
}

export interface WarRoomState {
  insights: Insight[]
  decisions: Decision[]
  executions: Execution[]
  system: SystemState
  connected: boolean
  last_event?: string
}

export interface Creative {
  id: string
  name: string
  tags: string[]
  cluster: string
  cluster_id: string
  performance: {
    ctr: number
    roas: number
    fatigue_score: number
    conversions: number
    spend: number
    revenue: number
  }
  creative_type: string
  platform: string
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED'
  created_at: string
  updated_at: string
}

export interface CreativeCluster {
  id: string
  name: string
  angle: string
  hook: string
  message: string
  cta: string
  creatives: Creative[]
  performance: {
    total_spend: number
    total_revenue: number
    avg_roas: number
    avg_ctr: number
    conversion_rate: number
    fatigue_score: number
  }
}

export interface CreativeGraphData {
  nodes: Array<{
    id: string
    type: 'creative' | 'cluster' | 'campaign'
    name: string
    data: Record<string, any>
  }>
  edges: Array<{
    source: string
    target: string
    type: string
    weight: number
  }>
}

export interface CreativeFilters {
  tags: string[]
  clusters: string[]
  platforms: string[]
  performance_thresholds: {
    min_ctr: number
    min_roas: number
    max_fatigue: number
  }
}

export interface CreativeBrief {
  id: string
  hook: string
  angle: string
  message: string
  cta: string
  based_on_cluster: string
  confidence: number
  generated_at: string
}

export interface CreativeLabState {
  creatives: Creative[]
  clusters: CreativeCluster[]
  graph_data: CreativeGraphData
  filters: CreativeFilters
  selected_creative?: Creative
  briefs: CreativeBrief[]
  loading: boolean
}

// WebSocket Event Types
export type WebSocketEvent = 
  | { type: 'insight.created'; data: Insight }
  | { type: 'decision.created'; data: Decision }
  | { type: 'decision.updated'; data: Decision }
  | { type: 'execution.updated'; data: Execution }
  | { type: 'system.updated'; data: SystemState }
  | { type: 'creative.updated'; data: Creative }
  | { type: 'cluster.updated'; data: CreativeCluster }

// API Request/Response Types
export interface DecisionActionRequest {
  action: 'approve' | 'reject' | 'modify'
  modifications?: Record<string, any>
  reason?: string
}

export interface SystemConfigRequest {
  mode: SystemMode
  confidence_threshold: number
  kill_switch: boolean
}

export interface CreativeBriefRequest {
  cluster_id: string
  top_performance_data: Record<string, any>
  variations_count?: number
}

export interface CreativeActionRequest {
  action: 'tag' | 'duplicate' | 'mark_winner' | 'archive'
  tags?: string[]
  cluster_id?: string
}
