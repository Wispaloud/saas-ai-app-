'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  PlayCircle, 
  PauseCircle, 
  Target,
  Activity,
  Zap,
  BarChart3,
  RefreshCw,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface AIEAnalysis {
  id: string
  account_id: string
  input_data: any
  output_data: {
    insights: Array<{
      type: string
      entity_id: string
      reason: string
      severity: string
      confidence: number
    }>
    decisions: Array<{
      action: string
      target: {
        type: string
        id: string
      }
      reason: string
      confidence: number
      expected_impact: {
        roas_change: number
        cost_saving: number
        conversion_lift: number
      }
    }>
    execution_plan: Array<{
      step: number
      action: string
      platform: string
      parameters: any
    }>
    creative_briefs: Array<{
      based_on_cluster: string
      angle: string
      hook: string
      message: string
      cta: string
    }>
    confidence_summary: {
      overall_confidence: number
      data_quality_score: number
    }
  }
  created_at: string
}

export default function AIEDashboard() {
  const [analyses, setAnalyses] = useState<AIEAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [selectedAnalysis, setSelectedAnalysis] = useState<AIEAnalysis | null>(null)
  const [accountId, setAccountId] = useState('demo-account-001')
  const supabase = createClient()

  useEffect(() => {
    fetchAnalyses()
  }, [])

  async function fetchAnalyses() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const response = await fetch(`/api/aie/analyze?account_id=${accountId}`, {
        headers: {
          'Authorization': `Bearer ${await supabase.auth.getSession()}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setAnalyses(data.analyses || [])
      }
    } catch (error) {
      console.error('Error fetching analyses:', error)
    } finally {
      setLoading(false)
    }
  }

  async function runAnalysis() {
    setAnalyzing(true)
    try {
      // Mock data for demonstration - in real app, this would come from connected platforms
      const mockInput = {
        account_id: accountId,
        time_window: 'last_30_days',
        entities: {
          campaigns: [
            {
              id: 'camp_001',
              name: 'Q4 Product Launch',
              status: 'ACTIVE',
              budget: 1000,
              spend: 750,
              platform: 'facebook',
              objective: 'CONVERSIONS',
              start_date: '2026-02-15'
            },
            {
              id: 'camp_002',
              name: 'Brand Awareness',
              status: 'ACTIVE',
              budget: 500,
              spend: 480,
              platform: 'instagram',
              objective: 'REACH',
              start_date: '2026-02-10'
            }
          ],
          ad_sets: [],
          ads: []
        },
        performance: {
          campaign_level: [
            {
              entity_id: 'camp_001',
              date: '2026-03-15',
              impressions: 50000,
              clicks: 500,
              conversions: 25,
              spend: 750,
              revenue: 1500,
              ctr: 0.01,
              cpc: 1.5,
              cpa: 30,
              roas: 2.0
            },
            {
              entity_id: 'camp_002',
              date: '2026-03-15',
              impressions: 30000,
              clicks: 150,
              conversions: 3,
              spend: 480,
              revenue: 150,
              ctr: 0.005,
              cpc: 3.2,
              cpa: 160,
              roas: 0.31
            }
          ],
          ad_set_level: [],
          ad_level: []
        },
        creative_clusters: [
          {
            id: 'cluster_001',
            name: 'Product Benefits',
            angle: 'Highlight key features',
            hook: '🔥 Transform your workflow',
            message: 'Our product saves you 10 hours per week',
            cta: 'Start Free Trial',
            performance: {
              total_spend: 500,
              total_revenue: 1200,
              avg_roas: 2.4,
              avg_ctr: 0.012,
              conversion_rate: 0.05
            },
            ads: ['ad_001', 'ad_002']
          }
        ],
        insights: [],
        historical_decisions: [],
        constraints: {
          budget: 2000,
          scaling_limits: {
            daily_budget_increase: 200,
            max_campaign_budget: 5000,
            min_roas_for_scaling: 2.0,
            scaling_period_days: 7
          },
          risk_tolerance: 0.7
        }
      }

      const response = await fetch('/api/aie/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(mockInput)
      })

      if (response.ok) {
        const result = await response.json()
        console.log('AIE Analysis Result:', result)
        await fetchAnalyses()
        
        // Show success message
        if (result.decisions && result.decisions.length > 0) {
          setSelectedAnalysis({
            id: 'latest',
            account_id: accountId,
            input_data: mockInput,
            output_data: result,
            created_at: new Date().toISOString()
          })
        }
      }
    } catch (error) {
      console.error('Error running analysis:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  async function executePlan(analysis: AIEAnalysis) {
    setExecuting(true)
    try {
      const response = await fetch('/api/aie/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          execution_plan: analysis.output_data.execution_plan,
          account_id: analysis.account_id,
          confidence_threshold: 0.7
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Execution Result:', result)
        await fetchAnalyses()
      }
    } catch (error) {
      console.error('Error executing plan:', error)
    } finally {
      setExecuting(false)
    }
  }

  function getInsightIcon(type: string) {
    switch (type) {
      case 'winner': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'anomaly': return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'fatigue': return <Activity className="h-4 w-4 text-yellow-600" />
      default: return <Brain className="h-4 w-4 text-gray-600" />
    }
  }

  function getActionIcon(action: string) {
    switch (action) {
      case 'PAUSE_AD': return <PauseCircle className="h-4 w-4 text-red-600" />
      case 'SCALE_CAMPAIGN': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'LAUNCH_CREATIVE': return <Zap className="h-4 w-4 text-blue-600" />
      case 'REDUCE_BUDGET': return <Target className="h-4 w-4 text-yellow-600" />
      default: return <Brain className="h-4 w-4 text-gray-600" />
    }
  }

  function getConfidenceColor(confidence: number) {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100'
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading AIE Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-600" />
            Agency Intelligence Engine
          </h1>
          <p className="text-gray-600">Autonomous campaign optimization and decision system</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchAnalyses}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            onClick={runAnalysis}
            disabled={analyzing}
            className="flex items-center gap-2"
          >
            <Brain className="h-4 w-4" />
            {analyzing ? 'Analyzing...' : 'Run Analysis'}
          </Button>
        </div>
      </div>

      {/* Account Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <label htmlFor="account" className="text-sm font-medium">Account ID:</label>
            <input
              id="account"
              type="text"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              placeholder="Enter account ID"
            />
          </div>
        </CardContent>
      </Card>

      {/* Latest Analysis Results */}
      {selectedAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              Latest Analysis Results
            </CardTitle>
            <CardDescription>
              Confidence: {Math.round(selectedAnalysis.output_data.confidence_summary.overall_confidence * 100)}% | 
              Data Quality: {Math.round(selectedAnalysis.output_data.confidence_summary.data_quality_score * 100)}%
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Insights */}
            {selectedAnalysis.output_data.insights.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Insights ({selectedAnalysis.output_data.insights.length})
                </h4>
                <div className="space-y-2">
                  {selectedAnalysis.output_data.insights.map((insight, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{insight.reason}</p>
                        <p className="text-xs text-gray-600">Entity: {insight.entity_id}</p>
                      </div>
                      <Badge className={getConfidenceColor(insight.confidence)}>
                        {Math.round(insight.confidence * 100)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Decisions */}
            {selectedAnalysis.output_data.decisions.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Decisions ({selectedAnalysis.output_data.decisions.length})
                </h4>
                <div className="space-y-2">
                  {selectedAnalysis.output_data.decisions.map((decision, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      {getActionIcon(decision.action)}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{decision.action.replace('_', ' ')}</p>
                        <p className="text-xs text-gray-600">{decision.reason}</p>
                        <p className="text-xs text-gray-500">
                          Target: {decision.target.type}:{decision.target.id}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={getConfidenceColor(decision.confidence)}>
                          {Math.round(decision.confidence * 100)}%
                        </Badge>
                        <p className="text-xs text-gray-600 mt-1">
                          ROAS: +{decision.expected_impact.roas_change}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Execution Controls */}
            {selectedAnalysis.output_data.execution_plan.length > 0 && (
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={() => executePlan(selectedAnalysis)}
                  disabled={executing}
                  className="flex items-center gap-2"
                >
                  <PlayCircle className="h-4 w-4" />
                  {executing ? 'Executing...' : 'Execute Plan'}
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Review Details
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Historical Analyses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Analysis History</CardTitle>
          <CardDescription>Previous AIE analyses and their outcomes</CardDescription>
        </CardHeader>
        <CardContent>
          {analyses.length === 0 ? (
            <div className="text-center py-8">
              <Brain className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No analyses yet</p>
              <p className="text-sm text-gray-500">Run your first analysis to see results here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {analyses.map((analysis) => (
                <div
                  key={analysis.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedAnalysis(analysis)}
                >
                  <div>
                    <p className="font-medium">Analysis for {analysis.account_id}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(analysis.created_at).toLocaleString()} | 
                      {analysis.output_data.decisions.length} decisions | 
                      {analysis.output_data.insights.length} insights
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className={getConfidenceColor(analysis.output_data.confidence_summary.overall_confidence)}>
                      {Math.round(analysis.output_data.confidence_summary.overall_confidence * 100)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
