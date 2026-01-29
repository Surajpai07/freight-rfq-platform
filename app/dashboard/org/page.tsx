'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

type RFQ = {
  id: string
  origin: string
  destination: string
  status: string
  created_at: string
}

export default function OrgDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [rfqs, setRfqs] = useState<RFQ[]>([])

  useEffect(() => {
    async function loadRFQs() {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        router.push('/login')
        return
      }

      // check role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userData.user.id)
        .single()

      if (profile?.role !== 'ORG') {
        router.push('/dashboard')
        return
      }

      // fetch RFQs created by this ORG
      const { data: rfqData } = await supabase
        .from('rfqs')
        .select('*')
        .eq('org_id', userData.user.id)
        .order('created_at', { ascending: false })

      setRfqs(rfqData || [])
      setLoading(false)
    }

    loadRFQs()
  }, [router])

  if (loading) {
    return <p>Loading RFQs...</p>
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Organization Dashboard</h1>

      <br />

      <button onClick={() => router.push('/dashboard/org/create-rfq')}>
        + Create RFQ
      </button>

      <br /><br />

      <h2>My RFQs</h2>

      {rfqs.length === 0 ? (
        <p>No RFQs created yet.</p>
      ) : (
        <table border={1} cellPadding={10}>
          <thead>
            <tr>
              <th>Origin</th>
              <th>Destination</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {rfqs.map((rfq) => (
              <tr key={rfq.id}
                style={{ cursor: 'pointer' }}
                onClick={() => router.push(`/dashboard/org/rfq/${rfq.id}`)}>
                <td>{rfq.origin}</td>
                <td>{rfq.destination}</td>
                <td>{rfq.status}</td>
                <td>{new Date(rfq.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
