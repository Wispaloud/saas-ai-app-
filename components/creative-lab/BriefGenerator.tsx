import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Zap, 
  Brain, 
  Target, 
  TrendingUp,
  Copy,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  MessageSquare,
  ArrowRight
} from 'lucide-react'
import { useCreativeLabStore } from '@/lib/stores/creative-lab-store'
import { useCreativeBriefGeneration } from '@/lib/hooks/use-aie-api'
import { CreativeBrief } from '@/types/aie'

interface BriefGeneratorProps {
  maxBriefs?: number
}

export const BriefGenerator: React.FC<BriefGeneratorProps> = ({ maxBriefs = 10 }) => {
  const { clusters, selected_creative, briefs, addBrief, clearBriefs } = useCreativeLabStore()
  const [selectedCluster, setSelectedCluster] = useState<string>('')
  const [variationsCount, setVariationsCount] = useState(3)
  const [customPrompt, setCustomPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  
  const briefGenerationMutation = useCreativeBriefGeneration()

  const handleGenerateBriefs = async () => {
    if (!selectedCluster) return
    
    setIsGenerating(true)
    
    try {
      const cluster = clusters.find(c => c.id === selectedCluster)
      if (!cluster) return
      
      // Prepare performance data
      const topPerformanceData = {
        cluster_performance: cluster.performance,
        top_creatives: cluster.creatives.slice(0, 5).map(creative => ({
          name: creative.name,
          performance: creative.performance,
          tags: creative.tags
        })),
        avg_metrics: {
          ctr: cluster.performance.avg_ctr,
          roas: cluster.performance.avg_roas,
          conversion_rate: cluster.performance.conversion_rate
        }
      }
      
      const result = await briefGenerationMutation.mutateAsync({
        cluster_id: selectedCluster,
        top_performance_data: topPerformanceData,
        variations_count: variationsCount
      })
      
      if ((result as any).briefs) {
        (result as any).briefs.forEach((brief: CreativeBrief) => {
          addBrief(brief)
        })
      }
    } catch (error) {
      console.error('Error generating briefs:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyBrief = (brief: CreativeBrief) => {
    const briefText = `
Hook: ${brief.hook}
Angle: ${brief.angle}
Message: ${brief.message}
CTA: ${brief.cta}
Confidence: ${Math.round(brief.confidence * 100)}%
    `.trim()
    
    navigator.clipboard.writeText(briefText)
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

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800'
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const selectedClusterData = clusters.find(c => c.id === selectedCluster)

  return (
    <div className="space-y-4">
      {/* Generator Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Brief Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Cluster Selection */}
          <div className="space-y-2">
            <Label htmlFor="cluster">Select Cluster</Label>
            <Select value={selectedCluster} onValueChange={setSelectedCluster}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a cluster to generate briefs for" />
              </SelectTrigger>
              <SelectContent>
                {clusters.map((cluster) => (
                  <SelectItem key={cluster.id} value={cluster.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{cluster.name}</span>
                      <Badge variant="outline" className="ml-2">
                        {cluster.performance.avg_roas.toFixed(1)}x ROAS
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Variations Count */}
          <div className="space-y-2">
            <Label htmlFor="variations">Number of Variations</Label>
            <Input
              id="variations"
              type="number"
              min="1"
              max="10"
              value={variationsCount}
              onChange={(e) => setVariationsCount(parseInt(e.target.value) || 3)}
              placeholder="Number of brief variations to generate"
            />
          </div>

          {/* Custom Prompt */}
          <div className="space-y-2">
            <Label htmlFor="prompt">Custom Instructions (Optional)</Label>
            <Textarea
              id="prompt"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Add any specific instructions for the brief generation..."
              rows={3}
            />
          </div>

          {/* Selected Cluster Info */}
          {selectedClusterData && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-sm">
                <div className="font-medium text-blue-900 mb-1">
                  {selectedClusterData.name}
                </div>
                <div className="space-y-1 text-blue-700">
                  <div>Angle: {selectedClusterData.angle}</div>
                  <div>Hook: {selectedClusterData.hook}</div>
                  <div>Performance: {selectedClusterData.performance.avg_roas.toFixed(2)}x ROAS</div>
                </div>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <div className="flex space-x-2">
            <Button
              onClick={handleGenerateBriefs}
              disabled={!selectedCluster || isGenerating || briefGenerationMutation.isPending}
              className="flex items-center space-x-2"
            >
              <Zap className="h-4 w-4" />
              {isGenerating ? 'Generating...' : 'Generate Briefs'}
            </Button>
            
            <Button
              variant="outline"
              onClick={clearBriefs}
              disabled={briefs.length === 0}
            >
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated Briefs */}
      {briefs.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Generated Briefs</CardTitle>
              <Badge variant="outline">
                {briefs.length} briefs
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {briefs.slice(0, maxBriefs).map((brief, index) => (
                  <BriefCard
                    key={brief.id}
                    brief={brief}
                    index={index}
                    onCopy={handleCopyBrief}
                    getTimeAgo={getTimeAgo}
                    getConfidenceColor={getConfidenceColor}
                  />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {briefs.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No briefs generated yet</p>
            <p className="text-sm text-gray-500">Select a cluster and generate briefs to get started</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

interface BriefCardProps {
  brief: CreativeBrief
  index: number
  onCopy: (brief: CreativeBrief) => void
  getTimeAgo: (timestamp: string) => string
  getConfidenceColor: (confidence: number) => string
}

const BriefCard: React.FC<BriefCardProps> = ({
  brief,
  index,
  onCopy,
  getTimeAgo,
  getConfidenceColor
}) => {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Badge variant="outline">Brief #{index + 1}</Badge>
            <Badge className={getConfidenceColor(brief.confidence)}>
              {Math.round(brief.confidence * 100)}% confidence
            </Badge>
          </div>
          <div className="flex space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCopy(brief)}
              className="text-xs"
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="text-xs"
            >
              {expanded ? 'Hide' : 'Expand'}
            </Button>
          </div>
        </div>

        {/* Brief Content */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-sm">Hook</span>
            </div>
            <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
              {brief.hook}
            </p>
          </div>

          <div>
            <div className="flex items-center space-x-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="font-medium text-sm">Angle</span>
            </div>
            <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
              {brief.angle}
            </p>
          </div>

          <div>
            <div className="flex items-center space-x-2 mb-1">
              <MessageSquare className="h-4 w-4 text-purple-600" />
              <span className="font-medium text-sm">Message</span>
            </div>
            <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
              {brief.message}
            </p>
          </div>

          <div>
            <div className="flex items-center space-x-2 mb-1">
              <ArrowRight className="h-4 w-4 text-orange-600" />
              <span className="font-medium text-sm">CTA</span>
            </div>
            <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
              {brief.cta}
            </p>
          </div>
        </div>

        {/* Expanded Details */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-600">Based on cluster:</span>
                <span className="ml-1 font-medium">
                  {brief.based_on_cluster.slice(-8)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Generated:</span>
                <span className="ml-1">
                  {getTimeAgo(brief.generated_at)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Generated {getTimeAgo(brief.generated_at)}
          </div>
          <div className="flex items-center space-x-1">
            <CheckCircle className="h-3 w-3 text-green-500" />
            <span className="text-xs text-green-600">Ready to use</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
