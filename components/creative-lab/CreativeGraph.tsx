import React, { useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Network, 
  ZoomIn, 
  ZoomOut, 
  Download,
  RefreshCw,
  Filter,
  Settings
} from 'lucide-react'
import { useCreativeLabStore } from '@/lib/stores/creative-lab-store'
import { useCreativeLabGraph } from '@/lib/hooks/use-aie-api'
import { CreativeGraphData } from '@/types/aie'

interface CreativeGraphProps {
  width?: number
  height?: number
  showControls?: boolean
}

export const CreativeGraph: React.FC<CreativeGraphProps> = ({ 
  width = 800, 
  height = 600,
  showControls = true 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { graph_data } = useCreativeLabStore()
  const { data: graphData, isLoading, refetch } = useCreativeLabGraph()
  
  const [zoom, setZoom] = React.useState(1)
  const [pan, setPan] = React.useState({ x: 0, y: 0 })
  const [selectedNode, setSelectedNode] = React.useState<string | null>(null)
  const [hoveredNode, setHoveredNode] = React.useState<string | null>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 })

  // Use the fetched graph data or store data
  const currentGraphData = graphData || graph_data

  useEffect(() => {
    if (!canvasRef.current || !currentGraphData) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, width, height)
    
    // Apply transformations
    ctx.save()
    ctx.translate(pan.x, pan.y)
    ctx.scale(zoom, zoom)

    // Draw edges
    if (currentGraphData && (currentGraphData as any).edges) {
      (currentGraphData as any).edges.forEach((edge: any) => {
        const sourceNode = (currentGraphData as any).nodes.find((n: any) => n.id === edge.source)
        const targetNode = (currentGraphData as any).nodes.find((n: any) => n.id === edge.target)
      
        if (sourceNode && targetNode) {
          ctx.beginPath()
          ctx.moveTo(sourceNode.data.x || 0, sourceNode.data.y || 0)
          ctx.lineTo(targetNode.data.x || 0, targetNode.data.y || 0)
          ctx.strokeStyle = edge.weight > 0.7 ? '#10b981' : edge.weight > 0.4 ? '#f59e0b' : '#ef4444'
          ctx.lineWidth = Math.max(1, edge.weight * 3)
          ctx.stroke()
        }
      })
    }

    // Draw nodes
    if (currentGraphData && (currentGraphData as any).nodes) {
      (currentGraphData as any).nodes.forEach((node: any) => {
        const x = node.data.x || 0
        const y = node.data.y || 0
        const radius = getNodeRadius(node.type)
        const color = getNodeColor(node.type)
        
        // Node shadow
        if (hoveredNode === node.id || selectedNode === node.id) {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
          ctx.shadowBlur = 10
          ctx.shadowOffsetX = 2
          ctx.shadowOffsetY = 2
        }
        
        // Node circle
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, 2 * Math.PI)
        ctx.fillStyle = color
        ctx.fill()
        
        // Reset shadow
        ctx.shadowColor = 'transparent'
        ctx.shadowBlur = 0
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0
        
        // Node border
        ctx.strokeStyle = selectedNode === node.id ? '#3b82f6' : '#ffffff'
        ctx.lineWidth = selectedNode === node.id ? 3 : 2
        ctx.stroke()
        
        // Node label
        ctx.fillStyle = '#ffffff'
        ctx.font = '12px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        
        // Truncate long labels
        const label = node.name.length > 10 ? node.name.substring(0, 10) + '...' : node.name
        ctx.fillText(label, x, y)
      })
    }

    ctx.restore()
  }, [currentGraphData, zoom, pan, selectedNode, hoveredNode, width, height])

  const getNodeRadius = (type: string) => {
    switch (type) {
      case 'creative': return 20
      case 'cluster': return 30
      case 'campaign': return 40
      default: return 25
    }
  }

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'creative': return '#8b5cf6'
      case 'cluster': return '#3b82f6'
      case 'campaign': return '#10b981'
      default: return '#6b7280'
    }
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !currentGraphData) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left - pan.x) / zoom
    const y = (e.clientY - rect.top - pan.y) / zoom
    
    // Find clicked node
    const clickedNode = currentGraphData && (currentGraphData as any).nodes ? 
      (currentGraphData as any).nodes.find((node: any) => {
        const nodeX = node.data.x || 0
        const nodeY = node.data.y || 0
        const distance = Math.sqrt(Math.pow(x - nodeX, 2) + Math.pow(y - nodeY, 2))
        return distance <= getNodeRadius(node.type)
      }) : null
    
    setSelectedNode(clickedNode ? clickedNode.id : null)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !currentGraphData) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    
    if (isDragging) {
      const dx = e.clientX - dragStart.x
      const dy = e.clientY - dragStart.y
      setPan({ x: pan.x + dx, y: pan.y + dy })
      setDragStart({ x: e.clientX, y: e.clientY })
    } else {
      const x = (e.clientX - rect.left - pan.x) / zoom
      const y = (e.clientY - rect.top - pan.y) / zoom
      
      // Find hovered node
      const hoveredNodeFound = currentGraphData && (currentGraphData as any).nodes ? 
        (currentGraphData as any).nodes.find((node: any) => {
          const nodeX = node.data.x || 0
          const nodeY = node.data.y || 0
          const distance = Math.sqrt(Math.pow(x - nodeX, 2) + Math.pow(y - nodeY, 2))
          return distance <= getNodeRadius(node.type)
        }) : null
      
      setHoveredNode(hoveredNodeFound ? hoveredNodeFound.id : null)
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom(prevZoom => Math.max(0.1, Math.min(5, prevZoom * delta)))
  }

  const handleZoomIn = () => {
    setZoom(prevZoom => Math.min(5, prevZoom * 1.2))
  }

  const handleZoomOut = () => {
    setZoom(prevZoom => Math.max(0.1, prevZoom / 1.2))
  }

  const handleReset = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setSelectedNode(null)
  }

  const handleExport = () => {
    if (!canvasRef.current) return
    
    const link = document.createElement('a')
    link.download = 'creative-graph.png'
    link.href = canvasRef.current.toDataURL()
    link.click()
  }

  const selectedNodeData = selectedNode 
    ? currentGraphData && (currentGraphData as any).nodes ? 
      (currentGraphData as any).nodes.find((n: any) => n.id === selectedNode) : null
    : null

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Network className="h-5 w-5" />
            Creative Graph
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">
              {currentGraphData && (currentGraphData as any).nodes ? (currentGraphData as any).nodes.length : 0} nodes
            </Badge>
            <Badge variant="outline">
              {currentGraphData && (currentGraphData as any).edges ? (currentGraphData as any).edges.length : 0} connections
            </Badge>
            {isLoading && (
              <Badge variant="secondary">
                <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                Loading
              </Badge>
            )}
          </div>
        </div>
        
        {showControls && (
          <div className="flex items-center space-x-2 pt-2">
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="h-3 w-3 mr-1" />
              Zoom In
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="h-3 w-3 mr-1" />
              Zoom Out
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Reset
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>
            <div className="flex items-center space-x-2 text-sm text-gray-600 ml-auto">
              <span>Zoom: {Math.round(zoom * 100)}%</span>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="border cursor-move"
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          />
          
          {/* Legend */}
          <div className="absolute top-4 left-4 bg-white bg-opacity-90 p-3 rounded-lg border text-xs">
            <div className="font-medium mb-2">Node Types</div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span>Creative</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Cluster</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Campaign</span>
              </div>
            </div>
          </div>
          
          {/* Selected Node Details */}
          {selectedNodeData && (
            <div className="absolute top-4 right-4 bg-white bg-opacity-90 p-3 rounded-lg border text-xs max-w-xs">
              <div className="font-medium mb-2">Selected: {selectedNodeData.name}</div>
              <div className="space-y-1">
                <div>
                  <span className="text-gray-600">Type:</span>
                  <span className="ml-1 capitalize">{selectedNodeData.type}</span>
                </div>
                <div>
                  <span className="text-gray-600">ID:</span>
                  <span className="ml-1 font-mono text-xs">
                    {selectedNodeData.id.slice(-8)}
                  </span>
                </div>
                {selectedNodeData.data.performance && (
                  <div>
                    <span className="text-gray-600">ROAS:</span>
                    <span className="ml-1 font-medium">
                      {selectedNodeData.data.performance.roas?.toFixed(2)}x
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-600">Loading graph data...</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
