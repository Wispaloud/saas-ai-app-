import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  TrendingUp, 
  AlertTriangle, 
  Activity,
  Clock,
  Eye,
  Target,
  BarChart3,
  Zap
} from 'lucide-react'
import { useWarRoomStore, useWarRoomSelectors } from '@/lib/stores/war-room-store'
import { Insight, InsightType } from '@/types/aie'

interface InsightStreamProps {
  maxItems?: number
  showFilters?: boolean
}

export const InsightStream: React.FC<InsightStreamProps> = ({ 
  maxItems = 50, 
  showFilters = true 
}) => {
  const { insights } = useWarRoomStore()
  const insightsBySeverity = useWarRoomSelectors.insightsBySeverity

  const getInsightIcon = (type: InsightType) => {
    switch (type) {
      case 'winner': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'anomaly': return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'fatigue': return <Activity className="h-4 w-4 text-yellow-600" />
      default: return <Zap className="h-4 w-4 text-gray-600" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatMetrics = (metrics: Record<string, number>) => {
    return Object.entries(metrics).map(([key, value]) => {
      const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      const formattedValue = typeof value === 'number' && value < 10 
        ? value.toFixed(2) 
        : value.toLocaleString()
      
      return (
        <div key={key} className="text-xs">
          <span className="text-gray-600">{formattedKey}:</span>
          <span className="ml-1 font-medium">{formattedValue}</span>
        </div>
      )
    })
  }

  const getTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  const filteredInsights = insights.slice(0, maxItems)

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Insight Stream
          </CardTitle>
          <Badge variant="outline">
            {filteredInsights.length} active
          </Badge>
        </div>
        
        {showFilters && (
          <div className="flex items-center space-x-2 pt-2">
            <span className="text-sm text-gray-600">Filter:</span>
            <Button variant="outline" size="sm">All</Button>
            <Button variant="outline" size="sm">High</Button>
            <Button variant="outline" size="sm">Medium</Button>
            <Button variant="outline" size="sm">Low</Button>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[600px]">
          <div className="space-y-2 p-4">
            {filteredInsights.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No insights available</p>
                <p className="text-sm text-gray-500">Insights will appear here as they're detected</p>
              </div>
            ) : (
              filteredInsights.map((insight) => (
                <InsightCard
                  key={insight.id}
                  insight={insight}
                  getInsightIcon={getInsightIcon}
                  getSeverityColor={getSeverityColor}
                  formatMetrics={formatMetrics}
                  getTimeAgo={getTimeAgo}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

interface InsightCardProps {
  insight: Insight
  getInsightIcon: (type: InsightType) => React.ReactNode
  getSeverityColor: (severity: string) => string
  formatMetrics: (metrics: Record<string, number>) => React.ReactNode[]
  getTimeAgo: (timestamp: string) => string
}

const InsightCard: React.FC<InsightCardProps> = ({
  insight,
  getInsightIcon,
  getSeverityColor,
  formatMetrics,
  getTimeAgo
}) => {
  const [expanded, setExpanded] = React.useState(false)

  return (
    <Card className={`border ${getSeverityColor(insight.severity)} hover:shadow-md transition-shadow`}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          {/* Left: Icon and Content */}
          <div className="flex items-start space-x-3 flex-1">
            <div className="mt-1">
              {getInsightIcon(insight.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <Badge className={getSeverityColor(insight.severity)}>
                  {insight.severity}
                </Badge>
                <span className="text-xs text-gray-500">
                  {getTimeAgo(insight.timestamp)}
                </span>
              </div>
              
              <p className="text-sm font-medium text-gray-900 mb-1">
                {insight.reason}
              </p>
              
              <div className="flex items-center space-x-2 text-xs text-gray-600 mb-2">
                <Target className="h-3 w-3" />
                <span>{insight.entity.type}:{insight.entity.id}</span>
                {insight.entity.name && <span>• {insight.entity.name}</span>}
              </div>
              
              {/* Metrics Preview */}
              <div className="flex items-center space-x-4 text-xs">
                {formatMetrics(insight.metrics_snapshot).slice(0, 2)}
              </div>
              
              {/* Expandable Details */}
              {expanded && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    {formatMetrics(insight.metrics_snapshot)}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">
                      Confidence: {Math.round(insight.confidence * 100)}%
                    </span>
                    <div className="flex space-x-1">
                      <Button variant="outline" size="sm">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <BarChart3 className="h-3 w-3 mr-1" />
                        Analyze
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Right: Actions */}
          <div className="flex flex-col items-end space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="text-xs"
            >
              {expanded ? 'Hide' : 'Details'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
