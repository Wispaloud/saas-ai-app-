import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Eye, 
  Copy, 
  Tag, 
  TrendingUp, 
  BarChart3,
  Target,
  DollarSign,
  Users,
  Clock,
  Calendar,
  PlayCircle,
  PauseCircle,
  Archive,
  Crown,
  Zap,
  Activity
} from 'lucide-react'
import { useCreativeLabStore } from '@/lib/stores/creative-lab-store'
import { useCreativeAction, useCreativePerformance } from '@/lib/hooks/use-aie-api'
import { Creative } from '@/types/aie'

interface CreativeDetailProps {
  creative?: Creative
  timeRange?: string
}

export const CreativeDetail: React.FC<CreativeDetailProps> = ({ 
  creative, 
  timeRange = '7d' 
}) => {
  const { setSelectedCreative } = useCreativeLabStore()
  const duplicateMutation = useCreativeAction(creative?.id || '')
  const tagMutation = useCreativeAction(creative?.id || '')
  const { data: performanceData, isLoading } = useCreativePerformance(
    creative?.id || '', 
    timeRange
  )

  if (!creative) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <Eye className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Select a creative to view details</p>
            <p className="text-sm text-gray-500">Choose from the creative library on the left</p>
          </div>
        </CardContent>
      </Card>
    )
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'PAUSED': return 'bg-yellow-100 text-yellow-800'
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPerformanceColor = (value: number, type: 'roas' | 'ctr' | 'fatigue') => {
    if (type === 'roas') {
      if (value >= 3) return 'text-green-600'
      if (value >= 1.5) return 'text-yellow-600'
      return 'text-red-600'
    }
    if (type === 'ctr') {
      if (value >= 0.03) return 'text-green-600'
      if (value >= 0.01) return 'text-yellow-600'
      return 'text-red-600'
    }
    if (type === 'fatigue') {
      if (value <= 0.3) return 'text-green-600'
      if (value <= 0.7) return 'text-yellow-600'
      return 'text-red-600'
    }
    return 'text-gray-600'
  }

  const handleDuplicate = () => {
    duplicateMutation.mutate({ action: 'duplicate' })
  }

  const handleMarkWinner = () => {
    tagMutation.mutate({ 
      action: 'mark_winner', 
      tags: [...creative.tags, 'winner'] 
    })
  }

  const handleArchive = () => {
    tagMutation.mutate({ action: 'archive' })
  }

  const handleToggleStatus = () => {
    const newStatus = creative.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
    tagMutation.mutate({ 
      action: 'tag', 
      tags: [...creative.tags, `status_${newStatus.toLowerCase()}`] 
    })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">{getPlatformIcon(creative.platform)}</div>
              <div>
                <CardTitle className="text-xl">{creative.name}</CardTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge className={getStatusColor(creative.status)}>
                    {creative.status}
                  </Badge>
                  <Badge variant="outline">
                    {creative.creative_type}
                  </Badge>
                  <Badge variant="outline">
                    {creative.platform}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleStatus}
                disabled={tagMutation.isPending}
              >
                {creative.status === 'ACTIVE' ? (
                  <PauseCircle className="h-4 w-4 mr-1" />
                ) : (
                  <PlayCircle className="h-4 w-4 mr-1" />
                )}
                {creative.status === 'ACTIVE' ? 'Pause' : 'Activate'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleDuplicate}
                disabled={duplicateMutation.isPending}
              >
                <Copy className="h-4 w-4 mr-1" />
                Duplicate
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkWinner}
                disabled={tagMutation.isPending}
              >
                <Crown className="h-4 w-4 mr-1" />
                Mark Winner
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCreative(undefined)}
              >
                Close
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-gray-600">ROAS</span>
            </div>
            <div className={`text-2xl font-bold mt-1 ${getPerformanceColor(creative.performance.roas, 'roas')}`}>
              {creative.performance.roas.toFixed(2)}x
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-green-600" />
              <span className="text-sm text-gray-600">CTR</span>
            </div>
            <div className={`text-2xl font-bold mt-1 ${getPerformanceColor(creative.performance.ctr, 'ctr')}`}>
              {(creative.performance.ctr * 100).toFixed(2)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-gray-600">Fatigue</span>
            </div>
            <div className={`text-2xl font-bold mt-1 ${getPerformanceColor(creative.performance.fatigue_score, 'fatigue')}`}>
              {(creative.performance.fatigue_score * 100).toFixed(0)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-purple-600" />
              <span className="text-sm text-gray-600">Spend</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              ${creative.performance.spend.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Current Performance</h4>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Impressions</span>
                  <span className="font-medium">
                    {creative.performance.spend > 0 && creative.performance.ctr > 0
                      ? Math.round(creative.performance.spend / (creative.performance.ctr * (creative.performance.spend / (creative.performance.conversions || 1))))
                      : 0
                    }.toLocaleString()
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Clicks</span>
                  <span className="font-medium">
                    {creative.performance.ctr > 0 && creative.performance.spend > 0
                      ? Math.round(creative.performance.spend * creative.performance.ctr / 100).toLocaleString()
                      : 0
                    }
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Conversions</span>
                  <span className="font-medium">{creative.performance.conversions}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Revenue</span>
                  <span className="font-medium">${creative.performance.revenue.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">CPC</span>
                  <span className="font-medium">
                    ${creative.performance.ctr > 0 && creative.performance.spend > 0
                      ? (creative.performance.spend / (creative.performance.spend * creative.performance.ctr / 100)).toFixed(2)
                      : '0.00'
                    }
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">CPA</span>
                  <span className="font-medium">
                    ${creative.performance.conversions > 0 
                      ? (creative.performance.spend / creative.performance.conversions).toFixed(2)
                      : 'N/A'
                    }
                  </span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">Creative Information</h4>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Cluster</span>
                  <span className="font-medium">{creative.cluster}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Type</span>
                  <span className="font-medium">{creative.creative_type}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Platform</span>
                  <span className="font-medium capitalize">{creative.platform}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Created</span>
                  <span className="font-medium">
                    {new Date(creative.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Updated</span>
                  <span className="font-medium">
                    {new Date(creative.updated_at).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex items-start space-x-2">
                  <span className="text-sm text-gray-600">Tags</span>
                  <div className="flex flex-wrap gap-1">
                    {creative.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance Trend ({timeRange})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <Activity className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-600">Loading performance data...</p>
            </div>
          ) : performanceData ? (
            <div className="space-y-4">
              {/* This would be a chart component in a real implementation */}
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Performance Chart</p>
                  <p className="text-sm text-gray-500">Chart component would be implemented here</p>
                </div>
              </div>
              
              {/* Trend Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {(performanceData as any)?.trend?.roas_change > 0 ? '+' : ''}{(performanceData as any)?.trend?.roas_change || 0}%
                  </div>
                  <div className="text-sm text-gray-600">ROAS Change</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {(performanceData as any)?.trend?.ctr_change > 0 ? '+' : ''}{(performanceData as any)?.trend?.ctr_change || 0}%
                  </div>
                  <div className="text-sm text-gray-600">CTR Change</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {(performanceData as any)?.trend?.spend_change > 0 ? '+' : ''}{(performanceData as any)?.trend?.spend_change || 0}%
                  </div>
                  <div className="text-sm text-gray-600">Spend Change</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No performance data available</p>
              <p className="text-sm text-gray-500">Performance data will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
