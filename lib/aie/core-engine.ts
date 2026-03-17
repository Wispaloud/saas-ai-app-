// Agency Intelligence Engine (AIE) - Core Decision System
// Deterministic, data-grounded decision system for AdGen Growth OS

export interface AIEInput {
  account_id: string
  time_window: string
  entities: {
    campaigns: Campaign[]
    ad_sets: AdSet[]
    ads: Ad[]
  }
  performance: {
    campaign_level: PerformanceMetric[]
    ad_set_level: PerformanceMetric[]
    ad_level: PerformanceMetric[]
  }
  creative_clusters: CreativeCluster[]
  insights: Insight[]
  historical_decisions: HistoricalDecision[]
  constraints: {
    budget: number
    scaling_limits: ScalingLimits
    risk_tolerance: number
  }
}

export interface Campaign {
  id: string
  name: string
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED'
  budget: number
  spend: number
  platform: string
  objective: string
  start_date: string
  end_date?: string
}

export interface AdSet {
  id: string
  campaign_id: string
  name: string
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED'
  budget: number
  spend: number
  target_audience: string
  platform: string
}

export interface Ad {
  id: string
  ad_set_id: string
  campaign_id: string
  name: string
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED'
  creative_id: string
  spend: number
  platform: string
  creative_type: string
}

export interface PerformanceMetric {
  entity_id: string
  date: string
  impressions: number
  clicks: number
  conversions: number
  spend: number
  revenue: number
  ctr: number
  cpc: number
  cpa: number
  roas: number
}

export interface CreativeCluster {
  id: string
  name: string
  angle: string
  hook: string
  message: string
  cta: string
  performance: {
    total_spend: number
    total_revenue: number
    avg_roas: number
    avg_ctr: number
    conversion_rate: number
  }
  ads: string[]
}

export interface Insight {
  type: 'fatigue' | 'winner' | 'anomaly'
  entity_id: string
  reason: string
  severity: 'low' | 'medium' | 'high'
  confidence: number
  date: string
}

export interface HistoricalDecision {
  id: string
  action: string
  target_type: string
  target_id: string
  reason: string
  confidence: number
  expected_impact: ExpectedImpact
  actual_impact?: ExpectedImpact
  executed_at: string
  result?: 'SUCCESS' | 'FAILED' | 'PARTIAL'
}

export interface ScalingLimits {
  daily_budget_increase: number
  max_campaign_budget: number
  min_roas_for_scaling: number
  scaling_period_days: number
}

export interface ExpectedImpact {
  roas_change: number
  cost_saving: number
  conversion_lift: number
}

export interface AIEDecision {
  action: 'PAUSE_AD' | 'SCALE_CAMPAIGN' | 'LAUNCH_CREATIVE' | 'REDUCE_BUDGET' | 'INCREASE_BUDGET'
  target: {
    type: 'ad' | 'ad_set' | 'campaign' | 'creative_cluster'
    id: string
  }
  reason: string
  confidence: number
  expected_impact: ExpectedImpact
}

export interface ExecutionStep {
  step: number
  action: string
  platform: string
  parameters: Record<string, any>
}

export interface CreativeBrief {
  based_on_cluster: string
  angle: string
  hook: string
  message: string
  cta: string
}

export interface AIEOutput {
  insights: Insight[]
  decisions: AIEDecision[]
  execution_plan: ExecutionStep[]
  creative_briefs: CreativeBrief[]
  confidence_summary: {
    overall_confidence: number
    data_quality_score: number
  }
}

export class AgencyIntelligenceEngine {
  private readonly KILL_CONDITIONS = {
    MIN_ROAS_THRESHOLD: 1.0,
    MIN_SPEND_THRESHOLD: 50,
    CTR_DECLINE_THRESHOLD: 0.3,
    FATIGUE_SCORE_THRESHOLD: 0.4
  }

  private readonly SCALE_CONDITIONS = {
    MIN_ROAS_FOR_SCALING: 2.0,
    MIN_STABLE_PERIODS: 3,
    CPA_DECLINE_THRESHOLD: 0.1,
    NO_FATIGUE_THRESHOLD: 0.7
  }

  async process(input: AIEInput): Promise<AIEOutput | { error: string }> {
    // Data validation
    if (!this.validateInput(input)) {
      return { error: 'INSUFFICIENT_DATA' }
    }

    // Generate insights
    const insights = this.generateInsights(input)

    // Make decisions
    const decisions = this.makeDecisions(input, insights)

    // Filter by confidence
    const highConfidenceDecisions = decisions.filter(d => d.confidence >= 0.7)

    if (highConfidenceDecisions.length === 0) {
      return {
        insights: [],
        decisions: [],
        execution_plan: [],
        creative_briefs: [],
        confidence_summary: {
          overall_confidence: 0.5,
          data_quality_score: this.calculateDataQuality(input)
        }
      }
    }

    // Create execution plan
    const executionPlan = this.createExecutionPlan(highConfidenceDecisions)

    // Generate creative briefs
    const creativeBriefs = this.generateCreativeBriefs(input, highConfidenceDecisions)

    // Calculate confidence scores
    const confidenceSummary = this.calculateConfidence(input, highConfidenceDecisions)

    return {
      insights,
      decisions: highConfidenceDecisions,
      execution_plan: executionPlan,
      creative_briefs: creativeBriefs,
      confidence_summary: confidenceSummary
    }
  }

  private validateInput(input: AIEInput): boolean {
    return (
      input.entities?.campaigns?.length > 0 ||
      input.entities?.ad_sets?.length > 0 ||
      input.entities?.ads?.length > 0
    ) && (
      input.performance?.campaign_level?.length > 0 ||
      input.performance?.ad_set_level?.length > 0 ||
      input.performance?.ad_level?.length > 0
    )
  }

  private generateInsights(input: AIEInput): Insight[] {
    const insights: Insight[] = []

    // Analyze campaign performance
    input.performance.campaign_level.forEach(metric => {
      const campaign = input.entities.campaigns.find(c => c.id === metric.entity_id)
      if (!campaign) return

      // Check for poor performance (kill condition)
      if (metric.roas < this.KILL_CONDITIONS.MIN_ROAS_THRESHOLD && 
          metric.spend > this.KILL_CONDITIONS.MIN_SPEND_THRESHOLD) {
        insights.push({
          type: 'anomaly',
          entity_id: metric.entity_id,
          reason: `ROAS ${metric.roas.toFixed(2)} below threshold ${this.KILL_CONDITIONS.MIN_ROAS_THRESHOLD} with spend $${metric.spend}`,
          severity: 'high',
          confidence: 0.9,
          date: new Date().toISOString()
        })
      }

      // Check for CTR decline
      const baselineCTR = this.calculateBaselineCTR(input, metric.entity_id)
      if (baselineCTR && metric.ctr < baselineCTR * (1 - this.KILL_CONDITIONS.CTR_DECLINE_THRESHOLD)) {
        insights.push({
          type: 'fatigue',
          entity_id: metric.entity_id,
          reason: `CTR ${metric.ctr.toFixed(2)} declined ${(baselineCTR - metric.ctr).toFixed(2)} from baseline ${baselineCTR.toFixed(2)}`,
          severity: 'medium',
          confidence: 0.8,
          date: new Date().toISOString()
        })
      }

      // Check for winners (scale condition)
      if (metric.roas >= this.SCALE_CONDITIONS.MIN_ROAS_FOR_SCALING) {
        const stablePeriods = this.checkStablePerformance(input, metric.entity_id)
        if (stablePeriods >= this.SCALE_CONDITIONS.MIN_STABLE_PERIODS) {
          insights.push({
            type: 'winner',
            entity_id: metric.entity_id,
            reason: `ROAS ${metric.roas.toFixed(2)} stable above threshold for ${stablePeriods} periods`,
            severity: 'high',
            confidence: 0.85,
            date: new Date().toISOString()
          })
        }
      }
    })

    return insights
  }

  private makeDecisions(input: AIEInput, insights: Insight[]): AIEDecision[] {
    const decisions: AIEDecision[] = []

    insights.forEach(insight => {
      switch (insight.type) {
        case 'anomaly':
          if (insight.severity === 'high') {
            // Kill poor performing campaigns
            decisions.push({
              action: 'PAUSE_AD',
              target: {
                type: 'campaign',
                id: insight.entity_id
              },
              reason: insight.reason,
              confidence: insight.confidence,
              expected_impact: {
                roas_change: 0,
                cost_saving: this.calculatePotentialSavings(input, insight.entity_id),
                conversion_lift: 0
              }
            })
          }
          break

        case 'fatigue':
          // Reduce budget for fatigued campaigns
          decisions.push({
            action: 'REDUCE_BUDGET',
            target: {
              type: 'campaign',
              id: insight.entity_id
            },
            reason: insight.reason,
            confidence: insight.confidence * 0.8, // Lower confidence for budget changes
            expected_impact: {
              roas_change: 0.1,
              cost_saving: this.calculatePotentialSavings(input, insight.entity_id) * 0.5,
              conversion_lift: -0.05
            }
          })
          break

        case 'winner':
          // Scale winning campaigns
          decisions.push({
            action: 'SCALE_CAMPAIGN',
            target: {
              type: 'campaign',
              id: insight.entity_id
            },
            reason: insight.reason,
            confidence: insight.confidence,
            expected_impact: {
              roas_change: 0,
              cost_saving: 0,
              conversion_lift: 0.3
            }
          })

          // Launch new creatives based on winning clusters
          const winningCluster = this.findWinningCreativeCluster(input, insight.entity_id)
          if (winningCluster) {
            decisions.push({
              action: 'LAUNCH_CREATIVE',
              target: {
                type: 'creative_cluster',
                id: winningCluster.id
              },
              reason: `Replicate winning creative cluster with ROAS ${winningCluster.performance.avg_roas.toFixed(2)}`,
              confidence: insight.confidence * 0.9,
              expected_impact: {
                roas_change: 0.1,
                cost_saving: 0,
                conversion_lift: 0.2
              }
            })
          }
          break
      }
    })

    return decisions
  }

  private createExecutionPlan(decisions: AIEDecision[]): ExecutionStep[] {
    const plan: ExecutionStep[] = []
    let stepNumber = 1

    // Sort decisions by priority and confidence
    const sortedDecisions = decisions.sort((a, b) => {
      const priority = {
        'PAUSE_AD': 1,
        'REDUCE_BUDGET': 2,
        'SCALE_CAMPAIGN': 3,
        'INCREASE_BUDGET': 4,
        'LAUNCH_CREATIVE': 5
      }
      return priority[a.action] - priority[b.action] || (b.confidence - a.confidence)
    })

    sortedDecisions.forEach(decision => {
      const entity = this.getEntityDetails(decision.target.id, decision.target.type)
      
      switch (decision.action) {
        case 'PAUSE_AD':
          plan.push({
            step: stepNumber++,
            action: 'pause_campaign',
            platform: entity.platform,
            parameters: {
              campaign_id: decision.target.id,
              reason: decision.reason
            }
          })
          break

        case 'REDUCE_BUDGET':
          plan.push({
            step: stepNumber++,
            action: 'reduce_budget',
            platform: entity.platform,
            parameters: {
              campaign_id: decision.target.id,
              reduction_percentage: 0.5,
              reason: decision.reason
            }
          })
          break

        case 'SCALE_CAMPAIGN':
          plan.push({
            step: stepNumber++,
            action: 'increase_budget',
            platform: entity.platform,
            parameters: {
              campaign_id: decision.target.id,
              increase_percentage: 0.3,
              reason: decision.reason
            }
          })
          break

        case 'INCREASE_BUDGET':
          plan.push({
            step: stepNumber++,
            action: 'increase_budget',
            platform: entity.platform,
            parameters: {
              campaign_id: decision.target.id,
              increase_percentage: 0.2,
              reason: decision.reason
            }
          })
          break

        case 'LAUNCH_CREATIVE':
          plan.push({
            step: stepNumber++,
            action: 'launch_creative_variations',
            platform: entity.platform,
            parameters: {
              creative_cluster_id: decision.target.id,
              variations_count: 3,
              reason: decision.reason
            }
          })
          break
      }
    })

    return plan
  }

  private generateCreativeBriefs(input: AIEInput, decisions: AIEDecision[]): CreativeBrief[] {
    const briefs: CreativeBrief[] = []

    decisions
      .filter(d => d.action === 'LAUNCH_CREATIVE')
      .forEach(decision => {
        const cluster = input.creative_clusters.find(c => c.id === decision.target.id)
        if (cluster) {
          // Generate 3 variations of the winning creative
          for (let i = 1; i <= 3; i++) {
            briefs.push({
              based_on_cluster: cluster.id,
              angle: `${cluster.angle} - Variation ${i}`,
              hook: this.generateHookVariation(cluster.hook, i),
              message: this.generateMessageVariation(cluster.message, i),
              cta: cluster.cta
            })
          }
        }
      })

    return briefs
  }

  private calculateConfidence(input: AIEInput, decisions: AIEDecision[]): {
    overall_confidence: number
    data_quality_score: number
  } {
    const dataQuality = this.calculateDataQuality(input)
    const avgDecisionConfidence = decisions.reduce((sum, d) => sum + d.confidence, 0) / decisions.length
    
    return {
      overall_confidence: (dataQuality + avgDecisionConfidence) / 2,
      data_quality_score: dataQuality
    }
  }

  private calculateDataQuality(input: AIEInput): number {
    let score = 0.5 // Base score

    // Check data completeness
    if (input.performance.campaign_level.length > 0) score += 0.1
    if (input.performance.ad_set_level.length > 0) score += 0.1
    if (input.performance.ad_level.length > 0) score += 0.1
    if (input.creative_clusters.length > 0) score += 0.1
    if (input.historical_decisions.length > 0) score += 0.1

    return Math.min(score, 1.0)
  }

  // Helper methods
  private calculateBaselineCTR(input: AIEInput, entityId: string): number | null {
    const metrics = input.performance.campaign_level.filter(m => m.entity_id === entityId)
    if (metrics.length < 7) return null // Need at least 7 days for baseline
    
    const sortedMetrics = metrics.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const baselinePeriod = sortedMetrics.slice(0, 7)
    return baselinePeriod.reduce((sum, m) => sum + m.ctr, 0) / baselinePeriod.length
  }

  private checkStablePerformance(input: AIEInput, entityId: string): number {
    const metrics = input.performance.campaign_level.filter(m => m.entity_id === entityId)
    return metrics.filter(m => m.roas >= this.SCALE_CONDITIONS.MIN_ROAS_FOR_SCALING).length
  }

  private calculatePotentialSavings(input: AIEInput, entityId: string): number {
    const campaign = input.entities.campaigns.find(c => c.id === entityId)
    return campaign ? campaign.budget * 0.7 : 0 // Assume 70% of budget would be wasted
  }

  private findWinningCreativeCluster(input: AIEInput, campaignId: string): CreativeCluster | null {
    const campaignAds = input.entities.ads.filter(a => a.campaign_id === campaignId)
    const clusterPerformance = input.creative_clusters.map(cluster => {
      const clusterAds = campaignAds.filter(ad => cluster.ads.includes(ad.creative_id))
      const totalSpend = clusterAds.reduce((sum, ad) => sum + ad.spend, 0)
      const totalRevenue = totalSpend * cluster.performance.avg_roas
      
      return {
        cluster,
        totalSpend,
        totalRevenue,
        avgROAS: cluster.performance.avg_roas
      }
    })

    const best = clusterPerformance.sort((a, b) => b.avgROAS - a.avgROAS)[0]
    return best?.totalSpend > 10 ? best.cluster : null // Minimum $10 spend
  }

  private getEntityDetails(entityId: string, entityType: string): any {
    // This would be implemented based on your data structure
    return { platform: 'facebook' } // Placeholder
  }

  private generateHookVariation(originalHook: string, variation: number): string {
    const variations = [
      `🔥 ${originalHook}`,
      `⚡ ${originalHook}`,
      `💯 ${originalHook}`
    ]
    return variations[variation - 1] || originalHook
  }

  private generateMessageVariation(originalMessage: string, variation: number): string {
    const prefixes = [
      "Discover why ",
      "Learn how ",
      "Find out "
    ]
    return prefixes[variation - 1] + originalMessage.toLowerCase()
  }
}

export default AgencyIntelligenceEngine
