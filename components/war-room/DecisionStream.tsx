import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { 
  PauseCircle, 
  TrendingUp, 
  Zap, 
  Target,
  DollarSign,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  PlayCircle,
  Edit
} from 'lucide-react'
import { useWarRoomStore, useWarRoomSelectors } from '@/lib/stores/war-room-store'
import { useDecisionAction } from '@/lib/hooks/use-aie-api'
import { Decision, DecisionStatus } from '@/types/aie'

interface DecisionStreamProps {
  maxItems?: number
  showFilters?: boolean
}

export const DecisionStream: React.FC<DecisionStreamProps> = ({ 
  maxItems = 50, 
  showFilters = true 
}) => {
  const { decisions } = useWarRoomStore()
  const pendingDecisions = useWarRoomSelectors.pendingDecisions

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'PAUSE_AD': return <PauseCircle className="h-4 w-4 text-red-600" />
      case 'SCALE_CAMPAIGN': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'INCREASE_BUDGET': return <TrendingUp className="h-4 w-4 text-blue-600" />
      case 'REDUCE_BUDGET': return <Target className="h-4 w-4 text-yellow-600" />
      case 'LAUNCH_CREATIVE': return <Zap className="h-4 w-4 text-purple-600" />
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: DecisionStatus) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'APPROVED': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'EXECUTED': return 'bg-green-100 text-green-800 border-green-200'
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: DecisionStatus) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-3 w-3" />
      case 'APPROVED': return <CheckCircle className="h-3 w-3" />
      case 'EXECUTED': return <PlayCircle className="h-3 w-3" />
      case 'REJECTED': return <XCircle className="h-3 w-3" />
      default: return <AlertCircle className="h-3 w-3" />
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatImpact = (impact: Record<string, number>) => {
    const items = []
    
    if (impact.roas_change !== 0) {
      items.push(
        <div key="roas" className="flex items-center space-x-1">
          <BarChart3 className="h-3 w-3" />
          <span className="text-xs">
            ROAS: {impact.roas_change > 0 ? '+' : ''}{impact.roas_change.toFixed(2)}
          </span>
        </div>
      )
    }
    
    if (impact.cost_saving > 0) {
      items.push(
        <div key="saving" className="flex items-center space-x-1">
          <DollarSign className="h-3 w-3" />
          <span className="text-xs">Save: ${impact.cost_saving.toLocaleString()}</span>
        </div>
      )
    }
    
    if (impact.conversion_lift > 0) {
      items.push(
        <div key="conversions" className="flex items-center space-x-1">
          <Target className="h-3 w-3" />
          <span className="text-xs">+{impact.conversion_lift.toFixed(0)} conv</span>
        </div>
      )
    }
    
    return items
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

  const filteredDecisions = decisions.slice(0, maxItems)

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            Decision Stream
          </CardTitle>
          <Badge variant="outline">
            {pendingDecisions.length} pending
          </Badge>
        </div>
        
        {showFilters && (
          <div className="flex items-center space-x-2 pt-2">
            <span className="text-sm text-gray-600">Filter:</span>
            <Button variant="outline" size="sm">All</Button>
            <Button variant="outline" size="sm">Pending</Button>
            <Button variant="outline" size="sm">Executed</Button>
            <Button variant="outline" size="sm">Rejected</Button>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[600px]">
          <div className="space-y-2 p-4">
            {filteredDecisions.length === 0 ? (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No decisions available</p>
                <p className="text-sm text-gray-500">Decisions will appear here as they're generated</p>
              </div>
            ) : (
              filteredDecisions.map((decision) => (
                <DecisionCard
                  key={decision.id}
                  decision={decision}
                  getActionIcon={getActionIcon}
                  getStatusColor={getStatusColor}
                  getStatusIcon={getStatusIcon}
                  getConfidenceColor={getConfidenceColor}
                  formatImpact={formatImpact}
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

interface DecisionCardProps {
  decision: Decision
  getActionIcon: (action: string) => React.ReactNode
  getStatusColor: (status: DecisionStatus) => string
  getStatusIcon: (status: DecisionStatus) => React.ReactNode
  getConfidenceColor: (confidence: number) => string
  formatImpact: (impact: Record<string, number>) => React.ReactNode[]
  getTimeAgo: (timestamp: string) => string
}

const DecisionCard: React.FC<DecisionCardProps> = ({
  decision,
  getActionIcon,
  getStatusColor,
  getStatusIcon,
  getConfidenceColor,
  formatImpact,
  getTimeAgo
}) => {
  const [expanded, setExpanded] = React.useState(false)
  const approveMutation = useDecisionAction(decision.id)
  const rejectMutation = useDecisionAction(decision.id)

  const handleApprove = () => {
    approveMutation.mutate({ action: 'approve' })
  }

  const handleReject = () => {
    rejectMutation.mutate({ action: 'reject' })
  }

  const isLoading = approveMutation.isPending || rejectMutation.isPending

  return (
    <Card className={`border ${getStatusColor(decision.status)} hover:shadow-md transition-shadow`}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          {/* Left: Icon and Content */}
          <div className="flex items-start space-x-3 flex-1">
            <div className="mt-1">
              {getActionIcon(decision.action)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <Badge className={getStatusColor(decision.status)}>
                  <span className="flex items-center">
                    {getStatusIcon(decision.status)}
                    <span className="ml-1">{decision.status}</span>
                  </span>
                </Badge>
                <span className="text-xs text-gray-500">
                  {getTimeAgo(decision.created_at)}
                </span>
              </div>
              
              <p className="text-sm font-medium text-gray-900 mb-1">
                {decision.action.replace('_', ' ')} • {decision.target.type}
              </p>
              
              <p className="text-sm text-gray-600 mb-2">
                {decision.reason}
              </p>
              
              <div className="flex items-center space-x-2 text-xs text-gray-600 mb-2">
                <span>Target:</span>
                <span className="font-medium">{decision.target.id}</span>
                {decision.target.name && <span>• {decision.target.name}</span>}
              </div>
              
              {/* Confidence and Impact */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-600">Confidence:</span>
                  <div className="flex items-center space-x-1">
                    <Progress value={decision.confidence * 100} className="w-16 h-2" />
                    <span className={`text-xs font-medium ${getConfidenceColor(decision.confidence)}`}>
                      {Math.round(decision.confidence * 100)}%
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 text-xs">
                  {formatImpact(decision.expected_impact)}
                </div>
              </div>
              
              {/* Action Buttons for Pending Decisions */}
              {decision.status === 'PENDING' && (
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    onClick={handleApprove}
                    disabled={isLoading}
                    className="flex items-center space-x-1"
                  >
                    <CheckCircle className="h-3 w-3" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReject}
                    disabled={isLoading}
                    className="flex items-center space-x-1"
                  >
                    <XCircle className="h-3 w-3" />
                    Reject
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    <Edit className="h-3 w-3" />
                    Modify
                  </Button>
                </div>
              )}
              
              {/* Expandable Details */}
              {expanded && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-gray-600">Expected Impact:</span>
                      <div className="mt-1 space-y-1">
                        {Object.entries(decision.expected_impact).map(([key, value]) => (
                          <div key={key}>
                            <span className="text-gray-600">{key}:</span>
                            <span className="ml-1 font-medium">
                              {typeof value === 'number' ? value.toFixed(2) : value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-gray-600">Decision Details:</span>
                      <div className="mt-1 space-y-1">
                        <div>
                          <span className="text-gray-600">Created:</span>
                          <span className="ml-1">
                            {new Date(decision.created_at).toLocaleString()}
                          </span>
                        </div>
                        {decision.updated_at && (
                          <div>
                            <span className="text-gray-600">Updated:</span>
                            <span className="ml-1">
                              {new Date(decision.updated_at).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
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
