import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Brain, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  Activity,
  Zap,
  Shield,
  Power
} from 'lucide-react'
import { useWarRoomStore } from '@/lib/stores/war-room-store'
import { useSystemConfig } from '@/lib/hooks/use-aie-api'

export const WarRoomHeader: React.FC = () => {
  const { system, connected } = useWarRoomStore()
  const systemConfigMutation = useSystemConfig()

  const handleModeChange = (mode: 'AUTO' | 'MANUAL' | 'HYBRID') => {
    systemConfigMutation.mutate({
      mode,
      confidence_threshold: system.confidence_threshold,
      kill_switch: system.kill_switch
    })
  }

  const handleConfidenceChange = (threshold: number) => {
    systemConfigMutation.mutate({
      mode: system.mode,
      confidence_threshold: threshold,
      kill_switch: system.kill_switch
    })
  }

  const handleKillSwitch = () => {
    systemConfigMutation.mutate({
      mode: system.mode,
      confidence_threshold: system.confidence_threshold,
      kill_switch: !system.kill_switch
    })
  }

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'AUTO': return 'bg-green-100 text-green-800'
      case 'MANUAL': return 'bg-blue-100 text-blue-800'
      case 'HYBRID': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getHealthStatus = () => {
    if (system.kill_switch) return { status: 'KILLED', color: 'bg-red-100 text-red-800', icon: Power }
    if (system.alerts > 0) return { status: 'ALERTS', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle }
    return { status: 'HEALTHY', color: 'bg-green-100 text-green-800', icon: Shield }
  }

  const healthStatus = getHealthStatus()
  const HealthIcon = healthStatus.icon

  return (
    <div className="space-y-4">
      {/* Main Status Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {/* Left: System Status */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Brain className={`h-5 w-5 ${connected ? 'text-green-600' : 'text-gray-400'}`} />
                <span className="text-sm font-medium">AIE System</span>
                <Badge className={healthStatus.color}>
                  <HealthIcon className="h-3 w-3 mr-1" />
                  {healthStatus.status}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Activity className="h-4 w-4" />
                <span>{connected ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>

            {/* Center: Key Metrics */}
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  <DollarSign className="h-4 w-4" />
                  <span>Spend Today</span>
                </div>
                <div className="text-lg font-semibold">
                  ${system.spend_today.toLocaleString()}
                </div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  <TrendingUp className="h-4 w-4" />
                  <span>ROAS Today</span>
                </div>
                <div className="text-lg font-semibold">
                  {system.roas_today.toFixed(2)}x
                </div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  <Zap className="h-4 w-4" />
                  <span>Active Decisions</span>
                </div>
                <div className="text-lg font-semibold">
                  {system.active_decisions}
                </div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Alerts</span>
                </div>
                <div className={`text-lg font-semibold ${system.alerts > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {system.alerts}
                </div>
              </div>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center space-x-3">
              {/* Mode Selector */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Mode:</span>
                <div className="flex space-x-1">
                  {(['AUTO', 'MANUAL', 'HYBRID'] as const).map((mode) => (
                    <Button
                      key={mode}
                      variant={system.mode === mode ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleModeChange(mode)}
                      disabled={systemConfigMutation.isPending}
                    >
                      {mode}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Confidence Threshold */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Confidence:</span>
                <input
                  type="range"
                  min="0.5"
                  max="1.0"
                  step="0.05"
                  value={system.confidence_threshold}
                  onChange={(e) => handleConfidenceChange(parseFloat(e.target.value))}
                  className="w-20"
                  disabled={systemConfigMutation.isPending}
                />
                <span className="text-sm text-gray-600">
                  {Math.round(system.confidence_threshold * 100)}%
                </span>
              </div>

              {/* Kill Switch */}
              <Button
                variant={system.kill_switch ? 'destructive' : 'outline'}
                size="sm"
                onClick={handleKillSwitch}
                disabled={systemConfigMutation.isPending}
                className="flex items-center space-x-1"
              >
                <Power className="h-4 w-4" />
                <span>{system.kill_switch ? 'KILLED' : 'KILL SWITCH'}</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Last Update */}
      <div className="text-xs text-gray-500 text-right">
        Last updated: {new Date(system.last_updated).toLocaleString()}
      </div>
    </div>
  )
}
