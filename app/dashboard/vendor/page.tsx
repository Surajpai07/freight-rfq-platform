'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function VendorDashboard() {
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

      if (profile?.role !== 'VENDOR') {
        router.push('/dashboard')
        return
      }

      // fetch LIVE and CLOSED RFQs
      const { data, error } = await supabase
        .from('rfqs')
        .select('*')
        .in('status', ['LIVE', 'CLOSED'])
        .order('created_at', { ascending: false })

      if (!error && data) {
        setRfqs(data)
      }

      setLoading(false)
    }

    loadRFQs()
  }, [router])

  if (loading) {
    return <p>Loading RFQs...</p>
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Vendor RFQ Inbox</h1>

      {rfqs.length === 0 ? (
        <p>No RFQs available.</p>
      ) : (
        <table border={1} cellPadding={10}>
          <thead>
            <tr>
              <th>Origin</th>
              <th>Destination</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rfqs.map((rfq) => (
              <tr key={rfq.id}>
                <td>{rfq.origin}</td>
                <td>{rfq.destination}</td>
                <td>{rfq.status}</td>
                <td>
                  {/* ✅ CORRECT NAVIGATION */}
                  <button
                    onClick={() =>
                      router.push(`/dashboard/vendor/rfq/${rfq.id}`)
                    }
                  >
                    View RFQ
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
