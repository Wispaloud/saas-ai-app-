'use client'

import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreativeList } from '@/components/creative-lab/CreativeList'
import { CreativeGraph } from '@/components/creative-lab/CreativeGraph'
import { CreativeDetail } from '@/components/creative-lab/CreativeDetail'
import { BriefGenerator } from '@/components/creative-lab/BriefGenerator'
import { useCreativeLabStore, useCreativeLabSelectors } from '@/lib/stores/creative-lab-store'
import { useCreativeLabCreatives, useCreativeLabClusters } from '@/lib/hooks/use-aie-api'
import { 
  Zap, 
  Network, 
  Eye, 
  Brain,
  TrendingUp,
  BarChart3,
  Activity,
  Filter,
  Target
} from 'lucide-react'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Create a client for this page
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export default function CreativeLabPage() {
  const { selected_creative, filters, setFilters } = useCreativeLabStore()
  const { data: creatives, isLoading: creativesLoading } = useCreativeLabCreatives(filters)
  const { data: clusters, isLoading: clustersLoading } = useCreativeLabClusters()
  
  // Update store with fetched data
  React.useEffect(() => {
    if (creatives) {
      useCreativeLabStore.getState().setCreatives(creatives as any)
    }
  }, [creatives])

  React.useEffect(() => {
    if (clusters) {
      useCreativeLabStore.getState().setClusters(clusters as any)
    }
  }, [clusters])

  const performanceStats = useCreativeLabSelectors.performanceStats(useCreativeLabStore.getState())

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Zap className="h-6 w-6 text-purple-600" />
                  Creative Lab
                </h1>
                <p className="text-gray-600">Creative intelligence and generation system</p>
              </div>
              
              {/* Performance Stats */}
              <div className="flex items-center space-x-4">
                <Card className="px-4 py-2">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                    <div className="text-right">
                      <div className="text-xs text-gray-600">Avg ROAS</div>
                      <div className="text-lg font-semibold">
                        {performanceStats.avg_roas.toFixed(2)}x
                      </div>
                    </div>
                  </div>
                </Card>
                
                <Card className="px-4 py-2">
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-green-600" />
                    <div className="text-right">
                      <div className="text-xs text-gray-600">Avg CTR</div>
                      <div className="text-lg font-semibold">
                        {(performanceStats.avg_ctr * 100).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </Card>
                
                <Card className="px-4 py-2">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-yellow-600" />
                    <div className="text-right">
                      <div className="text-xs text-gray-600">Avg Fatigue</div>
                      <div className="text-lg font-semibold">
                        {(performanceStats.avg_fatigue * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-12 gap-6">
            {/* Left Panel: Creative List */}
            <div className="col-span-3">
              <CreativeList maxItems={100} showFilters={true} />
            </div>

            {/* Center Panel: Graph or Detail */}
            <div className="col-span-6">
              {selected_creative ? (
                <CreativeDetail creative={selected_creative} />
              ) : (
                <CreativeGraph width={600} height={500} showControls={true} />
              )}
            </div>

            {/* Right Panel: Brief Generator */}
            <div className="col-span-3">
              <BriefGenerator maxBriefs={10} />
            </div>
          </div>

          {/* Bottom Section: Additional Analytics */}
          <div className="mt-6 grid grid-cols-12 gap-6">
            {/* Top Performing Clusters */}
            <div className="col-span-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Top Performing Clusters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {clustersLoading ? (
                    <div className="text-center py-8">
                      <Activity className="h-8 w-8 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Loading clusters...</p>
                    </div>
                  ) : clusters && (clusters as any).length > 0 ? (
                    <div className="space-y-3">
                      {(clusters as any).slice(0, 5).map((cluster: any, index: number) => (
                        <div key={cluster.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-sm font-medium text-purple-600">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium">{cluster.name}</div>
                              <div className="text-sm text-gray-600">{cluster.angle}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-green-600">
                              {cluster.performance.avg_roas.toFixed(2)}x
                            </div>
                            <div className="text-xs text-gray-600">
                              {cluster.creatives.length} creatives
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Network className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">No clusters available</p>
                      <p className="text-sm text-gray-500">Clusters will appear here as creatives are grouped</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Creative Performance Trends */}
            <div className="col-span-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Performance Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">Performance Chart</p>
                      <p className="text-sm text-gray-500">Trend analysis would be displayed here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Footer Status */}
          <div className="mt-8 text-center text-xs text-gray-500">
            <div className="flex items-center justify-center space-x-4">
              <span>
                {(creatives as any)?.length || 0} creatives loaded
              </span>
              <span>•</span>
              <span>
                {(clusters as any)?.length || 0} clusters analyzed
              </span>
              <span>•</span>
              <span>
                Real-time updates enabled
              </span>
            </div>
          </div>
        </div>
      </div>
    </QueryClientProvider>
  )
}
