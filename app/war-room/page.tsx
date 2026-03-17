'use client'

import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WarRoomHeader } from '@/components/war-room/Header'
import { InsightStream } from '@/components/war-room/InsightStream'
import { DecisionStream } from '@/components/war-room/DecisionStream'
import { ExecutionPanel } from '@/components/war-room/ExecutionPanel'
import { useWarRoomWebSocket } from '@/lib/websocket/war-room-client'
import { useWarRoomStore } from '@/lib/stores/war-room-store'

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

export default function WarRoomPage() {
  const { connected, last_event } = useWarRoomStore()
  
  // Initialize WebSocket connection
  const { connectionState } = useWarRoomWebSocket(
    `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'}/ws/war-room`
  )

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6">
          {/* Connection Status Banner */}
          {!connected && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-yellow-800">
                  Connecting to AIE System... ({connectionState})
                </span>
              </div>
            </div>
          )}

          {/* System Header */}
          <WarRoomHeader />

          {/* Main Content */}
          <div className="grid grid-cols-12 gap-6 mt-6">
            {/* Left Panel: Insight Stream */}
            <div className="col-span-3">
              <InsightStream maxItems={100} showFilters={true} />
            </div>

            {/* Center Panel: Decision Stream */}
            <div className="col-span-6">
              <DecisionStream maxItems={100} showFilters={true} />
            </div>

            {/* Right Panel: Execution Panel */}
            <div className="col-span-3">
              <ExecutionPanel maxItems={100} />
            </div>
          </div>

          {/* Footer Status */}
          <div className="mt-8 text-center text-xs text-gray-500">
            {connected ? (
              <span className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Connected to AIE System</span>
                {last_event && <span>• Last event: {last_event}</span>}
              </span>
            ) : (
              <span>Disconnected from AIE System</span>
            )}
          </div>
        </div>
      </div>
    </QueryClientProvider>
  )
}
