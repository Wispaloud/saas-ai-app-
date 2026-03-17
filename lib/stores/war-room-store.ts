import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { WarRoomState, Insight, Decision, Execution, SystemState, WebSocketEvent } from '@/types/aie'

interface WarRoomStore extends WarRoomState {
  // Actions
  setConnected: (connected: boolean) => void
  addInsight: (insight: Insight) => void
  updateDecision: (decision: Decision) => void
  addDecision: (decision: Decision) => void
  updateExecution: (execution: Execution) => void
  updateSystem: (system: SystemState) => void
  processWebSocketEvent: (event: WebSocketEvent) => void
  clearAll: () => void
}

export const useWarRoomStore = create<WarRoomStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    insights: [],
    decisions: [],
    executions: [],
    system: {
      mode: 'MANUAL',
      confidence_threshold: 0.7,
      kill_switch: false,
      spend_today: 0,
      roas_today: 0,
      active_decisions: 0,
      alerts: 0,
      last_updated: new Date().toISOString()
    },
    connected: false,
    last_event: undefined,

    // Actions
    setConnected: (connected) => set({ connected }),

    addInsight: (insight) => set((state) => ({
      insights: [insight, ...state.insights.slice(0, 99)] // Keep last 100
    })),

    updateDecision: (updatedDecision) => set((state) => ({
      decisions: state.decisions.map(decision =>
        decision.id === updatedDecision.id ? updatedDecision : decision
      )
    })),

    addDecision: (decision) => set((state) => ({
      decisions: [decision, ...state.decisions.slice(0, 99)], // Keep last 100
      active_decisions: state.decisions.filter(d => d.status === 'PENDING').length + 1
    })),

    updateExecution: (execution) => set((state) => ({
      executions: state.executions.map(exec =>
        exec.id === execution.id ? execution : exec
      )
    })),

    updateSystem: (system) => set({ system }),

    processWebSocketEvent: (event) => {
      const state = get()
      
      switch (event.type) {
        case 'insight.created':
          state.addInsight(event.data)
          break
        case 'decision.created':
          state.addDecision(event.data)
          break
        case 'decision.updated':
          state.updateDecision(event.data)
          break
        case 'execution.updated':
          state.updateExecution(event.data)
          break
        case 'system.updated':
          state.updateSystem(event.data)
          break
        default:
          console.warn('Unknown WebSocket event type:', event)
      }

      set({ last_event: `${event.type} at ${new Date().toISOString()}` })
    },

    clearAll: () => set({
      insights: [],
      decisions: [],
      executions: [],
      system: {
        mode: 'MANUAL',
        confidence_threshold: 0.7,
        kill_switch: false,
        spend_today: 0,
        roas_today: 0,
        active_decisions: 0,
        alerts: 0,
        last_updated: new Date().toISOString()
      },
      connected: false,
      last_event: undefined
    })
  }))
)

// Selectors for derived state
export const useWarRoomSelectors = {
  insightsBySeverity: (severity: string) => (state: WarRoomState) => 
    state.insights.filter(insight => insight.severity === severity),
  
  pendingDecisions: (state: WarRoomState) => 
    state.decisions.filter(decision => decision.status === 'PENDING'),
  
  activeExecutions: (state: WarRoomState) => 
    state.executions.filter(execution => execution.status === 'IN_PROGRESS'),
  
  recentAlerts: (state: WarRoomState) => 
    state.insights.filter(insight => insight.severity === 'high').slice(0, 5),
  
  systemHealth: (state: WarRoomState) => ({
    isHealthy: state.system.alerts === 0 && !state.system.kill_switch,
    decisionRate: state.decisions.length > 0 ? 
      state.decisions.filter(d => d.status === 'EXECUTED').length / state.decisions.length : 0,
    avgConfidence: state.decisions.length > 0 ?
      state.decisions.reduce((sum, d) => sum + d.confidence, 0) / state.decisions.length : 0
  })
}
