import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { CreativeLabState, Creative, CreativeCluster, CreativeGraphData, CreativeFilters, CreativeBrief } from '@/types/aie'

interface CreativeLabStore extends CreativeLabState {
  // Actions
  setCreatives: (creatives: Creative[]) => void
  setClusters: (clusters: CreativeCluster[]) => void
  setGraphData: (graphData: CreativeGraphData) => void
  updateCreative: (creative: Creative) => void
  updateCluster: (cluster: CreativeCluster) => void
  setSelectedCreative: (creative?: Creative) => void
  setFilters: (filters: Partial<CreativeFilters>) => void
  addBrief: (brief: CreativeBrief) => void
  setLoading: (loading: boolean) => void
  clearBriefs: () => void
  resetFilters: () => void
}

const defaultFilters: CreativeFilters = {
  tags: [],
  clusters: [],
  platforms: [],
  performance_thresholds: {
    min_ctr: 0,
    min_roas: 0,
    max_fatigue: 1
  }
}

export const useCreativeLabStore = create<CreativeLabStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    creatives: [],
    clusters: [],
    graph_data: {
      nodes: [],
      edges: []
    },
    filters: defaultFilters,
    selected_creative: undefined,
    briefs: [],
    loading: false,

    // Actions
    setCreatives: (creatives) => set({ creatives }),

    setClusters: (clusters) => set({ clusters }),

    setGraphData: (graphData) => set({ graph_data }),

    updateCreative: (updatedCreative) => set((state) => ({
      creatives: state.creatives.map(creative =>
        creative.id === updatedCreative.id ? updatedCreative : creative
      ),
      selected_creative: state.selected_creative?.id === updatedCreative.id 
        ? updatedCreative 
        : state.selected_creative
    })),

    updateCluster: (updatedCluster) => set((state) => ({
      clusters: state.clusters.map(cluster =>
        cluster.id === updatedCluster.id ? updatedCluster : cluster
      )
    })),

    setSelectedCreative: (creative) => set({ selected_creative: creative }),

    setFilters: (newFilters) => set((state) => ({
      filters: { ...state.filters, ...newFilters }
    })),

    addBrief: (brief) => set((state) => ({
      briefs: [brief, ...state.briefs.slice(0, 9)] // Keep last 10
    })),

    setLoading: (loading) => set({ loading }),

    clearBriefs: () => set({ briefs: [] }),

    resetFilters: () => set({ filters: defaultFilters })
  }))
)

// Selectors for derived state
export const useCreativeLabSelectors = {
  filteredCreatives: (state: CreativeLabState) => {
    const { creatives, filters } = state
    
    return creatives.filter(creative => {
      // Tag filter
      if (filters.tags.length > 0 && !filters.tags.some(tag => creative.tags.includes(tag))) {
        return false
      }
      
      // Cluster filter
      if (filters.clusters.length > 0 && !filters.clusters.includes(creative.cluster)) {
        return false
      }
      
      // Platform filter
      if (filters.platforms.length > 0 && !filters.platforms.includes(creative.platform)) {
        return false
      }
      
      // Performance thresholds
      const { min_ctr, min_roas, max_fatigue } = filters.performance_thresholds
      if (creative.performance.ctr < min_ctr) return false
      if (creative.performance.roas < min_roas) return false
      if (creative.performance.fatigue_score > max_fatigue) return false
      
      return true
    })
  },

  topPerformingCreatives: (state: CreativeLabState, limit = 10) => {
    return [...state.creatives]
      .sort((a, b) => b.performance.roas - a.performance.roas)
      .slice(0, limit)
  },

  fatiguedCreatives: (state: CreativeLabState) => {
    return state.creatives.filter(creative => 
      creative.performance.fatigue_score > 0.7
    )
  },

  clustersByPerformance: (state: CreativeLabState) => {
    return [...state.clusters]
      .sort((a, b) => b.performance.avg_roas - a.performance.avg_roas)
  },

  availableTags: (state: CreativeLabState) => {
    const allTags = state.creatives.flatMap(creative => creative.tags)
    return [...new Set(allTags)].sort()
  },

  availableClusters: (state: CreativeLabState) => {
    return [...new Set(state.creatives.map(creative => creative.cluster))].sort()
  },

  availablePlatforms: (state: CreativeLabState) => {
    return [...new Set(state.creatives.map(creative => creative.platform))].sort()
  },

  performanceStats: (state: CreativeLabState) => {
    const creatives = state.creatives
    if (creatives.length === 0) {
      return {
        avg_ctr: 0,
        avg_roas: 0,
        avg_fatigue: 0,
        total_spend: 0,
        total_revenue: 0
      }
    }

    const totalSpend = creatives.reduce((sum, c) => sum + c.performance.spend, 0)
    const totalRevenue = creatives.reduce((sum, c) => sum + c.performance.revenue, 0)
    const avgCtr = creatives.reduce((sum, c) => sum + c.performance.ctr, 0) / creatives.length
    const avgRoas = totalRevenue / totalSpend || 0
    const avgFatigue = creatives.reduce((sum, c) => sum + c.performance.fatigue_score, 0) / creatives.length

    return {
      avg_ctr: avgCtr,
      avg_roas: avgRoas,
      avg_fatigue: avgFatigue,
      total_spend: totalSpend,
      total_revenue: totalRevenue
    }
  }
}
