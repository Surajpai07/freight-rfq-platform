'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function AdminRFQsPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [rfqs, setRfqs] = useState<any[]>([])

  useEffect(() => {
    async function loadRFQs() {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData?.user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userData.user.id)
        .single()

      if (profile?.role !== 'ADMIN') {
        router.push('/dashboard')
        return
      }

      const { data, error } = await supabase
        .from('admin_rfqs_view')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        alert(error.message)
      } else {
        setRfqs(data || [])
      }

      setLoading(false)
    }

    loadRFQs()
  }, [router])

  if (loading) return <p>Loading RFQs...</p>

  return (
    <div style={{ padding: 40 }}>
      <h1>Admin – RFQs</h1>

      {rfqs.length === 0 && <p>No RFQs found.</p>}

      {rfqs.map(rfq => (
        <div
          key={rfq.rfq_id}
          style={{
            border: '1px solid #ddd',
            padding: 14,
            marginBottom: 12,
            borderRadius: 6,
          }}
        >
          <p><strong>Origin:</strong> {rfq.origin}</p>
          <p><strong>Destination:</strong> {rfq.destination}</p>
          <p><strong>Status:</strong> {rfq.status}</p>

          <p>
            <strong>Organization:</strong>{' '}
            {rfq.org_email}
          </p>

          <p>
            <strong>Winner:</strong>{' '}
            {rfq.winner_email || 'Not awarded yet'}
          </p>
        </div>
      ))}
    </div>
  )
}
