import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DecisionActionRequest, SystemConfigRequest, CreativeBriefRequest, CreativeActionRequest } from '@/types/aie'

// Base API configuration
const API_BASE = '/api/aie'

// Generic API client
const apiClient = {
  get: async <T>(url: string): Promise<T> => {
    const response = await fetch(`${API_BASE}${url}`)
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
    return response.json()
  },

  post: async <T>(url: string, data?: any): Promise<T> => {
    const response = await fetch(`${API_BASE}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    })
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
    return response.json()
  },

  put: async <T>(url: string, data?: any): Promise<T> => {
    const response = await fetch(`${API_BASE}${url}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    })
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
    return response.json()
  },

  delete: async <T>(url: string): Promise<T> => {
    const response = await fetch(`${API_BASE}${url}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
    return response.json()
  }
}

// War Room API Hooks
export const useWarRoomSystemState = () => {
  return useQuery({
    queryKey: ['war-room', 'system'],
    queryFn: () => apiClient.get('/system/state'),
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000
  })
}

export const useWarRoomDecisions = () => {
  return useQuery({
    queryKey: ['war-room', 'decisions'],
    queryFn: () => apiClient.get('/decisions'),
    refetchInterval: 15000, // Refresh every 15 seconds
    staleTime: 5000
  })
}

export const useWarRoomInsights = () => {
  return useQuery({
    queryKey: ['war-room', 'insights'],
    queryFn: () => apiClient.get('/insights'),
    refetchInterval: 20000, // Refresh every 20 seconds
    staleTime: 10000
  })
}

export const useWarRoomExecutions = () => {
  return useQuery({
    queryKey: ['war-room', 'executions'],
    queryFn: () => apiClient.get('/executions'),
    refetchInterval: 10000, // Refresh every 10 seconds
    staleTime: 5000
  })
}

// Decision Actions
export const useDecisionAction = (decisionId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: DecisionActionRequest) => 
      apiClient.post(`/decisions/${decisionId}/${data.action}`, data),
    
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['war-room', 'decisions'] })
      queryClient.invalidateQueries({ queryKey: ['war-room', 'system'] })
    },
    
    onError: (error) => {
      console.error('Decision action failed:', error)
    }
  })
}

export const useSystemConfig = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (config: SystemConfigRequest) => 
      apiClient.post('/system/config', config),
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['war-room', 'system'] })
    },
    
    onError: (error) => {
      console.error('System config update failed:', error)
    }
  })
}

// Creative Lab API Hooks
export const useCreativeLabCreatives = (filters?: any) => {
  return useQuery({
    queryKey: ['creative-lab', 'creatives', filters],
    queryFn: () => filters ? apiClient.get(`/creatives?${new URLSearchParams(filters).toString()}`) : apiClient.get('/creatives'),
    staleTime: 30000
  })
}

export const useCreativeLabClusters = () => {
  return useQuery({
    queryKey: ['creative-lab', 'clusters'],
    queryFn: () => apiClient.get('/clusters'),
    staleTime: 60000
  })
}

export const useCreativeLabGraph = () => {
  return useQuery({
    queryKey: ['creative-lab', 'graph'],
    queryFn: () => apiClient.get('/creatives/graph'),
    staleTime: 120000
  })
}

export const useCreativeDetail = (creativeId: string) => {
  return useQuery({
    queryKey: ['creative-lab', 'creative', creativeId],
    queryFn: () => apiClient.get(`/creatives/${creativeId}`),
    enabled: !!creativeId,
    staleTime: 30000
  })
}

// Creative Actions
export const useCreativeAction = (creativeId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreativeActionRequest) => 
      apiClient.post(`/creatives/${creativeId}/${data.action}`, data),
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creative-lab', 'creatives'] })
      queryClient.invalidateQueries({ queryKey: ['creative-lab', 'graph'] })
    },
    
    onError: (error) => {
      console.error('Creative action failed:', error)
    }
  })
}

export const useCreativeBriefGeneration = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreativeBriefRequest) => 
      apiClient.post('/creative/generate-brief', data),
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creative-lab', 'briefs'] })
    },
    
    onError: (error) => {
      console.error('Brief generation failed:', error)
    }
  })
}

// Performance Analytics
export const usePerformanceMetrics = (timeRange: string = '7d') => {
  return useQuery({
    queryKey: ['analytics', 'performance', timeRange],
    queryFn: () => apiClient.get(`/analytics/performance?range=${timeRange}`),
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000
  })
}

export const useCreativePerformance = (creativeId: string, timeRange: string = '7d') => {
  return useQuery({
    queryKey: ['analytics', 'creative', creativeId, timeRange],
    queryFn: () => apiClient.get(`/analytics/creative/${creativeId}?range=${timeRange}`),
    enabled: !!creativeId,
    refetchInterval: 30000,
    staleTime: 15000
  })
}

// Real-time subscriptions
export const useRealTimeSubscription = (channel: string) => {
  const queryClient = useQueryClient()

  React.useEffect(() => {
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/ws/${channel}`)
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        // Invalidate relevant queries based on event type
        switch (data.type) {
          case 'decision.updated':
          case 'decision.created':
            queryClient.invalidateQueries({ queryKey: ['war-room', 'decisions'] })
            break
          case 'insight.created':
            queryClient.invalidateQueries({ queryKey: ['war-room', 'insights'] })
            break
          case 'execution.updated':
            queryClient.invalidateQueries({ queryKey: ['war-room', 'executions'] })
            break
          case 'creative.updated':
            queryClient.invalidateQueries({ queryKey: ['creative-lab', 'creatives'] })
            queryClient.invalidateQueries({ queryKey: ['creative-lab', 'graph'] })
            break
          case 'system.updated':
            queryClient.invalidateQueries({ queryKey: ['war-room', 'system'] })
            break
        }
      } catch (error) {
        console.error('WebSocket message parsing error:', error)
      }
    }

    return () => {
      ws.close()
    }
  }, [channel, queryClient])
}
