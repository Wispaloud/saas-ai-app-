import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { 
  PlayCircle, 
  CheckCircle, 
  XCircle, 
  Clock,
  Zap,
  AlertTriangle,
  Activity,
  ExternalLink,
  RefreshCw
} from 'lucide-react'
import { useWarRoomStore, useWarRoomSelectors } from '@/lib/stores/war-room-store'
import { Execution, ExecutionStatus } from '@/types/aie'

interface ExecutionPanelProps {
  maxItems?: number
}

export const ExecutionPanel: React.FC<ExecutionPanelProps> = ({ maxItems = 50 }) => {
  const { executions } = useWarRoomStore()
  const activeExecutions = useWarRoomSelectors.activeExecutions

  const getStatusColor = (status: ExecutionStatus) => {
    switch (status) {
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'SUCCESS': return 'bg-green-100 text-green-800 border-green-200'
      case 'FAILED': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: ExecutionStatus) => {
    switch (status) {
      case 'IN_PROGRESS': return <Activity className="h-3 w-3 animate-pulse" />
      case 'SUCCESS': return <CheckCircle className="h-3 w-3" />
      case 'FAILED': return <XCircle className="h-3 w-3" />
      default: return <Clock className="h-3 w-3" />
    }
  }

  const getLatencyColor = (latency: number) => {
    if (latency < 1000) return 'text-green-600'
    if (latency < 5000) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatLatency = (latency: number) => {
    if (latency < 1000) return `${latency}ms`
    return `${(latency / 1000).toFixed(1)}s`
  }

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      facebook: '📘',
      instagram: '📷',
      google: '🔍',
      tiktok: '🎵',
      linkedin: '💼',
      twitter: '🐦'
    }
    return icons[platform] || '🌐'
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

  const getExecutionProgress = (execution: Execution) => {
    if (execution.status === 'SUCCESS') return 100
    if (execution.status === 'FAILED') return 0
    if (execution.status === 'IN_PROGRESS') {
      // Estimate progress based on time elapsed
      const elapsed = Date.now() - new Date(execution.started_at).getTime()
      const typicalDuration = 30000 // 30 seconds typical
      return Math.min((elapsed / typicalDuration) * 100, 95)
    }
    return 0
  }

  const filteredExecutions = executions.slice(0, maxItems)

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Execution Panel
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">
              {activeExecutions.length} active
            </Badge>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[600px]">
          <div className="space-y-2 p-4">
            {filteredExecutions.length === 0 ? (
              <div className="text-center py-8">
                <Zap className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No executions yet</p>
                <p className="text-sm text-gray-500">Executions will appear here when decisions are acted upon</p>
              </div>
            ) : (
              filteredExecutions.map((execution) => (
                <ExecutionCard
                  key={execution.id}
                  execution={execution}
                  getStatusColor={getStatusColor}
                  getStatusIcon={getStatusIcon}
                  getLatencyColor={getLatencyColor}
                  formatLatency={formatLatency}
                  getPlatformIcon={getPlatformIcon}
                  getTimeAgo={getTimeAgo}
                  getExecutionProgress={getExecutionProgress}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

interface ExecutionCardProps {
  execution: Execution
  getStatusColor: (status: ExecutionStatus) => string
  getStatusIcon: (status: ExecutionStatus) => React.ReactNode
  getLatencyColor: (latency: number) => string
  formatLatency: (latency: number) => string
  getPlatformIcon: (platform: string) => string
  getTimeAgo: (timestamp: string) => string
  getExecutionProgress: (execution: Execution) => number
}

const ExecutionCard: React.FC<ExecutionCardProps> = ({
  execution,
  getStatusColor,
  getStatusIcon,
  getLatencyColor,
  formatLatency,
  getPlatformIcon,
  getTimeAgo,
  getExecutionProgress
}) => {
  const [expanded, setExpanded] = React.useState(false)
  const progress = getExecutionProgress(execution)

  return (
    <Card className={`border ${getStatusColor(execution.status)} hover:shadow-md transition-shadow`}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          {/* Left: Icon and Content */}
          <div className="flex items-start space-x-3 flex-1">
            <div className="mt-1">
              {getStatusIcon(execution.status)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <Badge className={getStatusColor(execution.status)}>
                  {getStatusIcon(execution.status)}
                  {execution.status.replace('_', ' ')}
                </Badge>
                <span className="text-xs text-gray-500">
                  {getTimeAgo(execution.started_at)}
                </span>
              </div>
              
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-lg">{getPlatformIcon(execution.platform)}</span>
                <span className="text-sm font-medium text-gray-900">
                  {execution.action.replace('_', ' ')}
                </span>
                <Badge variant="outline" className="text-xs">
                  ID: {execution.id.slice(-8)}
                </Badge>
              </div>
              
              {/* Progress Bar for Active Executions */}
              {execution.status === 'IN_PROGRESS' && (
                <div className="mb-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
              
              {/* Metrics */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span className={getLatencyColor(execution.latency_ms)}>
                      {formatLatency(execution.latency_ms)}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <span className="text-gray-600">Decision:</span>
                    <span className="font-medium">
                      {execution.decision_id.slice(-8)}
                    </span>
                  </div>
                </div>
                
                {execution.status === 'FAILED' && (
                  <div className="flex items-center space-x-1 text-red-600">
                    <AlertTriangle className="h-3 w-3" />
                    <span className="font-medium">Failed</span>
                  </div>
                )}
              </div>
              
              {/* Expandable Details */}
              {expanded && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="space-y-3">
                    {/* Execution Details */}
                    <div>
                      <span className="text-sm font-medium text-gray-900">Execution Details</span>
                      <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-600">Started:</span>
                          <span className="ml-1">
                            {new Date(execution.started_at).toLocaleString()}
                          </span>
                        </div>
                        {execution.completed_at && (
                          <div>
                            <span className="text-gray-600">Completed:</span>
                            <span className="ml-1">
                              {new Date(execution.completed_at).toLocaleString()}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-600">Platform:</span>
                          <span className="ml-1 capitalize">{execution.platform}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Action:</span>
                          <span className="ml-1">{execution.action}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Parameters */}
                    {Object.keys(execution.parameters).length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-gray-900">Parameters</span>
                        <div className="mt-1 bg-gray-50 p-2 rounded text-xs">
                          {Object.entries(execution.parameters).map(([key, value]) => (
                            <div key={key}>
                              <span className="text-gray-600">{key}:</span>
                              <span className="ml-1">
                                {typeof value === 'object' 
                                  ? JSON.stringify(value, null, 2)
                                  : String(value)
                                }
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Result/Error */}
                    {execution.result && (
                      <div>
                        <span className="text-sm font-medium text-gray-900">Result</span>
                        <div className="mt-1 bg-green-50 p-2 rounded text-xs">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(execution.result, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                    
                    {execution.error && (
                      <div>
                        <span className="text-sm font-medium text-red-600">Error</span>
                        <div className="mt-1 bg-red-50 p-2 rounded text-xs text-red-700">
                          {execution.error}
                        </div>
                      </div>
                    )}
                    
                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                      {execution.status === 'FAILED' && (
                        <Button variant="outline" size="sm">
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Retry
                        </Button>
                      )}
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
