'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Plus, 
  FlaskConical, 
  TrendingUp, 
  Users, 
  PlayCircle,
  PauseCircle,
  CheckCircle,
  Clock,
  BarChart3,
  Target,
  Lightbulb
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface CreativeLab {
  id: string
  name: string
  description: string
  status: 'setup' | 'running' | 'completed' | 'paused'
  war_room_id: string
  war_room_name?: string
  test_count: number
  active_variants: number
  total_impressions: number
  total_conversions: number
  best_performer?: {
    variant_id: string
    conversion_rate: number
  }
  created_at: string
  updated_at: string
}

interface ABTest {
  id: string
  name: string
  creative_lab_id: string
  status: string
  test_type: string
  variants_count: number
  confidence_level: number
  statistical_significance: boolean
  winner_id?: string
  created_at: string
}

export default function CreativeLabsPage() {
  const [creativeLabs, setCreativeLabs] = useState<CreativeLab[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newLab, setNewLab] = useState({ name: '', description: '', war_room_id: '' })
  const [warRooms, setWarRooms] = useState<any[]>([])
  const [creating, setCreating] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchCreativeLabs()
    fetchWarRooms()
  }, [])

  async function fetchWarRooms() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('war_rooms')
        .select('id, name')
        .or(`owner_id.eq.${user.id},id.in.(
          SELECT war_room_id FROM war_room_members WHERE user_id = '${user.id}'
        )`)

      if (error) throw error
      setWarRooms(data || [])
    } catch (error) {
      console.error('Error fetching war rooms:', error)
    }
  }

  async function fetchCreativeLabs() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('creative_labs')
        .select(`
          *,
          war_rooms!inner(name),
          ab_tests(count),
          ab_test_variants(count),
          ab_test_variants(
            impressions,
            conversions,
            ctr,
            conversion_rate
          )
        `)
        .or(`owner_id.eq.${user.id},war_room_id.in.(
          SELECT war_room_id FROM war_room_members WHERE user_id = '${user.id}'
        )`)
        .order('updated_at', { ascending: false })

      if (error) throw error

      const processedData = (data || []).map(lab => {
        const allVariants = lab.ab_test_variants || []
        const totalImpressions = allVariants.reduce((sum: number, variant: any) => sum + (variant.impressions || 0), 0)
        const totalConversions = allVariants.reduce((sum: number, variant: any) => sum + (variant.conversions || 0), 0)
        
        const bestVariant = allVariants.reduce((best: any, variant: any) => 
          (!best || (variant.conversion_rate || 0) > (best.conversion_rate || 0)) ? variant : best
        , null)

        return {
          ...lab,
          war_room_name: lab.war_rooms?.name,
          test_count: lab.ab_tests?.[0]?.count || 0,
          active_variants: lab.ab_test_variants?.[0]?.count || 0,
          total_impressions: totalImpressions,
          total_conversions: totalConversions,
          best_performer: bestVariant ? {
            variant_id: bestVariant.id,
            conversion_rate: bestVariant.conversion_rate || 0
          } : undefined
        }
      })

      setCreativeLabs(processedData)
    } catch (error) {
      console.error('Error fetching creative labs:', error)
    } finally {
      setLoading(false)
    }
  }

  async function createCreativeLab() {
    if (!newLab.name.trim() || !newLab.war_room_id) return

    setCreating(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('creative_labs')
        .insert({
          name: newLab.name,
          description: newLab.description,
          war_room_id: newLab.war_room_id,
          owner_id: user.id
        })
        .select()
        .single()

      if (error) throw error

      // Create activity log
      await supabase
        .from('team_activities')
        .insert({
          user_id: user.id,
          creative_lab_id: data.id,
          war_room_id: newLab.war_room_id,
          activity_type: 'created',
          entity_type: 'creative_lab',
          entity_id: data.id,
          description: `Created creative lab: ${newLab.name}`
        })

      setNewLab({ name: '', description: '', war_room_id: '' })
      setShowCreateModal(false)
      fetchCreativeLabs()
      
      // Navigate to the new creative lab
      router.push(`/dashboard/creative-labs/${data.id}`)
    } catch (error) {
      console.error('Error creating creative lab:', error)
    } finally {
      setCreating(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'setup': return 'bg-yellow-100 text-yellow-800'
      case 'running': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'paused': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'setup': return <Clock className="h-3 w-3" />
      case 'running': return <PlayCircle className="h-3 w-3" />
      case 'completed': return <CheckCircle className="h-3 w-3" />
      case 'paused': return <PauseCircle className="h-3 w-3" />
      default: return <Clock className="h-3 w-3" />
    }
  }

  const calculateTestProgress = (lab: CreativeLab) => {
    if (lab.total_impressions === 0) return 0
    // Assume target of 1000 impressions per variant for statistical significance
    const targetImpressions = lab.active_variants * 1000
    return Math.min((lab.total_impressions / targetImpressions) * 100, 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading Creative Labs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Creative Labs</h1>
          <p className="text-gray-600">A/B testing and creative experimentation workspace</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Lab
        </Button>
      </div>

      {/* Create Creative Lab Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create New Creative Lab</CardTitle>
              <CardDescription>
                Set up a new experimentation space for A/B testing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Lab Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Facebook Ad Creative Testing"
                  value={newLab.name}
                  onChange={(e) => setNewLab({ ...newLab, name: e.target.value })}
                  disabled={creating}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="What are you testing?"
                  value={newLab.description}
                  onChange={(e) => setNewLab({ ...newLab, description: e.target.value })}
                  disabled={creating}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="war_room">War Room</Label>
                <select
                  id="war_room"
                  value={newLab.war_room_id}
                  onChange={(e) => setNewLab({ ...newLab, war_room_id: e.target.value })}
                  disabled={creating}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select a War Room</option>
                  {warRooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={createCreativeLab}
                  disabled={creating || !newLab.name.trim() || !newLab.war_room_id}
                  className="flex-1"
                >
                  {creating ? 'Creating...' : 'Create Lab'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Creative Labs Grid */}
      {creativeLabs.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <FlaskConical className="h-8 w-8 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Creative Labs Yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first creative lab to start A/B testing your ad creatives
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Creative Lab
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {creativeLabs.map((lab) => (
            <Card key={lab.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link href={`/dashboard/creative-labs/${lab.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{lab.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {lab.description || 'No description provided'}
                      </CardDescription>
                      {lab.war_room_name && (
                        <Badge variant="outline" className="mt-2">
                          <Target className="h-3 w-3 mr-1" />
                          {lab.war_room_name}
                        </Badge>
                      )}
                    </div>
                    <Badge className={`ml-2 ${getStatusColor(lab.status)}`}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(lab.status)}
                        {lab.status}
                      </div>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  {/* Test Progress */}
                  {lab.status === 'running' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Test Progress</span>
                        <span className="font-medium">{Math.round(calculateTestProgress(lab))}%</span>
                      </div>
                      <Progress value={calculateTestProgress(lab)} className="h-2" />
                    </div>
                  )}

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-gray-600">
                        <BarChart3 className="h-4 w-4" />
                        <span>Tests</span>
                      </div>
                      <div className="font-semibold">{lab.test_count}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>Impressions</span>
                      </div>
                      <div className="font-semibold">{lab.total_impressions.toLocaleString()}</div>
                    </div>
                  </div>

                  {/* Best Performer */}
                  {lab.best_performer && (
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-green-800">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm font-medium">Best Performer</span>
                      </div>
                      <div className="text-green-900 text-sm mt-1">
                        {(lab.best_performer.conversion_rate * 100).toFixed(2)}% conversion rate
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Analytics
                    </Button>
                    <Button size="sm" className="flex-1">
                      <Lightbulb className="h-4 w-4 mr-1" />
                      Enter Lab
                    </Button>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
