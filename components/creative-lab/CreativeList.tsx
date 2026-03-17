import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { 
  Eye, 
  Copy, 
  Tag, 
  TrendingUp, 
  TrendingDown,
  Zap,
  BarChart3,
  Target,
  PlayCircle,
  PauseCircle,
  Archive,
  Crown
} from 'lucide-react'
import { useCreativeLabStore, useCreativeLabSelectors } from '@/lib/stores/creative-lab-store'
import { useCreativeAction } from '@/lib/hooks/use-aie-api'
import { Creative } from '@/types/aie'

interface CreativeListProps {
  maxItems?: number
  showFilters?: boolean
}

export const CreativeList: React.FC<CreativeListProps> = ({ 
  maxItems = 50, 
  showFilters = true 
}) => {
  const { 
    selected_creative, 
    setSelectedCreative, 
    filters, 
    setFilters 
  } = useCreativeLabStore()
  
  const filteredCreatives = useCreativeLabSelectors.filteredCreatives
  const topPerformingCreatives = useCreativeLabSelectors.topPerformingCreatives
  const fatiguedCreatives = useCreativeLabSelectors.fatiguedCreatives
  const availableTags = useCreativeLabSelectors.availableTags
  const availableClusters = useCreativeLabSelectors.availableClusters
  const availablePlatforms = useCreativeLabSelectors.availablePlatforms

  const getPerformanceColor = (roas: number) => {
    if (roas >= 3) return 'text-green-600'
    if (roas >= 1.5) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getFatigueColor = (fatigue: number) => {
    if (fatigue >= 0.8) return 'text-red-600'
    if (fatigue >= 0.5) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'PAUSED': return 'bg-yellow-100 text-yellow-800'
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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

  const handleTagFilter = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag]
    setFilters({ tags: newTags })
  }

  const handleClusterFilter = (cluster: string) => {
    const newClusters = filters.clusters.includes(cluster)
      ? filters.clusters.filter(c => c !== cluster)
      : [...filters.clusters, cluster]
    setFilters({ clusters: newClusters })
  }

  const handlePlatformFilter = (platform: string) => {
    const newPlatforms = filters.platforms.includes(platform)
      ? filters.platforms.filter(p => p !== platform)
      : [...filters.platforms, platform]
    setFilters({ platforms: newPlatforms })
  }

  const resetFilters = () => {
    setFilters({
      tags: [],
      clusters: [],
      platforms: [],
      performance_thresholds: {
        min_ctr: 0,
        min_roas: 0,
        max_fatigue: 1
      }
    })
  }

  const displayCreatives = filteredCreatives.slice(0, maxItems)

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Creative Library
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">
              {displayCreatives.length} shown
            </Badge>
            <Badge variant="outline">
              {topPerformingCreatives.length} top
            </Badge>
            <Badge variant="outline">
              {fatiguedCreatives.length} fatigued
            </Badge>
          </div>
        </div>
        
        {showFilters && (
          <div className="space-y-3 pt-2">
            {/* Quick Filters */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Quick:</span>
              <Button variant="outline" size="sm" onClick={resetFilters}>
                All
              </Button>
              <Button variant="outline" size="sm">
                Top Performers
              </Button>
              <Button variant="outline" size="sm">
                Fatigued
              </Button>
              <Button variant="outline" size="sm">
                Active
              </Button>
            </div>

            {/* Tag Filters */}
            {availableTags.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm text-gray-600">Tags:</span>
                <div className="flex flex-wrap gap-1">
                  {availableTags.slice(0, 10).map(tag => (
                    <Button
                      key={tag}
                      variant={filters.tags.includes(tag) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleTagFilter(tag)}
                      className="text-xs"
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Cluster Filters */}
            {availableClusters.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm text-gray-600">Clusters:</span>
                <div className="flex flex-wrap gap-1">
                  {availableClusters.slice(0, 5).map(cluster => (
                    <Button
                      key={cluster}
                      variant={filters.clusters.includes(cluster) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleClusterFilter(cluster)}
                      className="text-xs"
                    >
                      {cluster}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Platform Filters */}
            <div className="space-y-2">
              <span className="text-sm text-gray-600">Platforms:</span>
              <div className="flex flex-wrap gap-1">
                {availablePlatforms.map(platform => (
                  <Button
                    key={platform}
                    variant={filters.platforms.includes(platform) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePlatformFilter(platform)}
                    className="text-xs"
                  >
                    {getPlatformIcon(platform)} {platform}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[600px]">
          <div className="space-y-2 p-4">
            {displayCreatives.length === 0 ? (
              <div className="text-center py-8">
                <Zap className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No creatives found</p>
                <p className="text-sm text-gray-500">Try adjusting your filters or add new creatives</p>
              </div>
            ) : (
              displayCreatives.map((creative) => (
                <CreativeCard
                  key={creative.id}
                  creative={creative}
                  isSelected={selected_creative?.id === creative.id}
                  onSelect={() => setSelectedCreative(creative)}
                  getPerformanceColor={getPerformanceColor}
                  getFatigueColor={getFatigueColor}
                  getStatusColor={getStatusColor}
                  getPlatformIcon={getPlatformIcon}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

interface CreativeCardProps {
  creative: Creative
  isSelected: boolean
  onSelect: () => void
  getPerformanceColor: (roas: number) => string
  getFatigueColor: (fatigue: number) => string
  getStatusColor: (status: string) => string
  getPlatformIcon: (platform: string) => string
}

const CreativeCard: React.FC<CreativeCardProps> = ({
  creative,
  isSelected,
  onSelect,
  getPerformanceColor,
  getFatigueColor,
  getStatusColor,
  getPlatformIcon
}) => {
  const [expanded, setExpanded] = React.useState(false)
  const duplicateMutation = useCreativeAction(creative.id)
  const tagMutation = useCreativeAction(creative.id)

  const handleDuplicate = () => {
    duplicateMutation.mutate({ action: 'duplicate' })
  }

  const handleMarkWinner = () => {
    tagMutation.mutate({ action: 'mark_winner', tags: [...creative.tags, 'winner'] })
  }

  const handleArchive = () => {
    tagMutation.mutate({ action: 'archive' })
  }

  return (
    <Card 
      className={`border hover:shadow-md transition-shadow cursor-pointer ${
        isSelected ? 'ring-2 ring-blue-500 border-blue-500' : ''
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          {/* Left: Content */}
          <div className="flex items-start space-x-3 flex-1">
            <div className="text-lg">
              {getPlatformIcon(creative.platform)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {creative.name}
                </h3>
                <Badge className={getStatusColor(creative.status)} variant="outline">
                  {creative.status}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-2 text-xs text-gray-600 mb-2">
                <span>Cluster: {creative.cluster}</span>
                <span>•</span>
                <span>Type: {creative.creative_type}</span>
              </div>
              
              {/* Tags */}
              {creative.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {creative.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              
              {/* Performance Metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">CTR:</span>
                  <span className="font-medium">{(creative.performance.ctr * 100).toFixed(2)}%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">ROAS:</span>
                  <span className={`font-medium ${getPerformanceColor(creative.performance.roas)}`}>
                    {creative.performance.roas.toFixed(2)}x
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Fatigue:</span>
                  <span className={`font-medium ${getFatigueColor(creative.performance.fatigue_score)}`}>
                    {(creative.performance.fatigue_score * 100).toFixed(0)}%
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Spend:</span>
                  <span className="font-medium">${creative.performance.spend.toLocaleString()}</span>
                </div>
              </div>
              
              {/* Performance Bars */}
              <div className="mt-2 space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-600 w-12">CTR</span>
                  <Progress 
                    value={creative.performance.ctr * 100} 
                    className="flex-1 h-1" 
                  />
                  <span className="text-xs w-10 text-right">
                    {(creative.performance.ctr * 100).toFixed(1)}%
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-600 w-12">ROAS</span>
                  <Progress 
                    value={Math.min(creative.performance.roas * 20, 100)} 
                    className="flex-1 h-1" 
                  />
                  <span className="text-xs w-10 text-right">
                    {creative.performance.roas.toFixed(1)}x
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-600 w-12">Fatigue</span>
                  <Progress 
                    value={creative.performance.fatigue_score * 100} 
                    className="flex-1 h-1" 
                  />
                  <span className="text-xs w-10 text-right">
                    {(creative.performance.fatigue_score * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              
              {/* Expandable Details */}
              {expanded && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-gray-600">Conversions:</span>
                      <span className="ml-1 font-medium">
                        {creative.performance.conversions}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Revenue:</span>
                      <span className="ml-1 font-medium">
                        ${creative.performance.revenue.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Created:</span>
                      <span className="ml-1">
                        {new Date(creative.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Updated:</span>
                      <span className="ml-1">
                        {new Date(creative.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDuplicate()
                      }}
                      disabled={duplicateMutation.isPending}
                      className="text-xs"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Duplicate
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMarkWinner()
                      }}
                      disabled={tagMutation.isPending}
                      className="text-xs"
                    >
                      <Crown className="h-3 w-3 mr-1" />
                      Mark Winner
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleArchive()
                      }}
                      disabled={tagMutation.isPending}
                      className="text-xs"
                    >
                      <Archive className="h-3 w-3 mr-1" />
                      Archive
                    </Button>
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
              onClick={(e) => {
                e.stopPropagation()
                setExpanded(!expanded)
              }}
              className="text-xs"
            >
              {expanded ? 'Hide' : 'Details'}
            </Button>
            
            <div className="flex space-x-1">
              {creative.status === 'ACTIVE' ? (
                <Button variant="ghost" size="sm" className="text-xs">
                  <PauseCircle className="h-3 w-3" />
                </Button>
              ) : (
                <Button variant="ghost" size="sm" className="text-xs">
                  <PlayCircle className="h-3 w-3" />
                </Button>
              )}
              
              <Button variant="ghost" size="sm" className="text-xs">
                <Eye className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
