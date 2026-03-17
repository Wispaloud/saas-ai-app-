'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Users, 
  Calendar, 
  Target, 
  Settings, 
  Archive,
  Play,
  Eye,
  MessageSquare
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface WarRoom {
  id: string
  name: string
  description: string
  status: 'active' | 'archived' | 'completed'
  member_count: number
  campaign_count: number
  created_at: string
  updated_at: string
  owner_id: string
}

export default function WarRoomsPage() {
  const [warRooms, setWarRooms] = useState<WarRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newWarRoom, setNewWarRoom] = useState({ name: '', description: '' })
  const [creating, setCreating] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchWarRooms()
  }, [])

  async function fetchWarRooms() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch war rooms where user is owner or member
      const { data: memberData } = await supabase
        .from('war_room_members')
        .select('war_room_id')
        .eq('user_id', user.id)

      const warRoomIds = memberData?.map(m => m.war_room_id) || []

      const { data, error } = await supabase
        .from('war_rooms')
        .select(`
          *,
          war_room_members(count),
          campaigns(count)
        `)
        .or(`owner_id.eq.${user.id},id.in.(${warRoomIds.join(',')})`)
        .order('updated_at', { ascending: false })

      if (error) throw error

      const processedData = (data || []).map(room => ({
        ...room,
        member_count: room.war_room_members?.[0]?.count || 0,
        campaign_count: room.campaigns?.[0]?.count || 0
      }))

      setWarRooms(processedData)
    } catch (error) {
      console.error('Error fetching war rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  async function createWarRoom() {
    if (!newWarRoom.name.trim()) return

    setCreating(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('war_rooms')
        .insert({
          name: newWarRoom.name,
          description: newWarRoom.description,
          owner_id: user.id
        })
        .select()
        .single()

      if (error) throw error

      // Add owner as member
      await supabase
        .from('war_room_members')
        .insert({
          war_room_id: data.id,
          user_id: user.id,
          role: 'owner'
        })

      // Create activity log
      await supabase
        .from('team_activities')
        .insert({
          user_id: user.id,
          war_room_id: data.id,
          activity_type: 'created',
          entity_type: 'war_room',
          entity_id: data.id,
          description: `Created war room: ${newWarRoom.name}`
        })

      setNewWarRoom({ name: '', description: '' })
      setShowCreateModal(false)
      fetchWarRooms()
      
      // Navigate to the new war room
      router.push(`/dashboard/war-rooms/${data.id}`)
    } catch (error) {
      console.error('Error creating war room:', error)
    } finally {
      setCreating(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play className="h-3 w-3" />
      case 'archived': return <Archive className="h-3 w-3" />
      case 'completed': return <Target className="h-3 w-3" />
      default: return <Settings className="h-3 w-3" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading War Rooms...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">War Rooms</h1>
          <p className="text-gray-600">Strategic campaign planning and collaboration spaces</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create War Room
        </Button>
      </div>

      {/* Create War Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create New War Room</CardTitle>
              <CardDescription>
                Set up a new strategic workspace for your campaign team
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">War Room Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Q4 Product Launch Campaign"
                  value={newWarRoom.name}
                  onChange={(e) => setNewWarRoom({ ...newWarRoom, name: e.target.value })}
                  disabled={creating}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="What's the focus of this campaign?"
                  value={newWarRoom.description}
                  onChange={(e) => setNewWarRoom({ ...newWarRoom, description: e.target.value })}
                  disabled={creating}
                />
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
                  onClick={createWarRoom}
                  disabled={creating || !newWarRoom.name.trim()}
                  className="flex-1"
                >
                  {creating ? 'Creating...' : 'Create War Room'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* War Rooms Grid */}
      {warRooms.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Target className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No War Rooms Yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first war room to start collaborating on campaigns
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create War Room
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {warRooms.map((warRoom) => (
            <Card key={warRoom.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link href={`/dashboard/war-rooms/${warRoom.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{warRoom.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {warRoom.description || 'No description provided'}
                      </CardDescription>
                    </div>
                    <Badge className={`ml-2 ${getStatusColor(warRoom.status)}`}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(warRoom.status)}
                        {warRoom.status}
                      </div>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{warRoom.member_count}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        <span>{warRoom.campaign_count}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(warRoom.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button size="sm" className="flex-1">
                      <Play className="h-4 w-4 mr-1" />
                      Enter
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
