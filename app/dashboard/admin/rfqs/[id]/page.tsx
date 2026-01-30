'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useParams, useRouter } from 'next/navigation'

export default function AdminRFQDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const rfqId = params?.id as string | undefined

  const [loading, setLoading] = useState(true)
  const [rfq, setRfq] = useState<any>(null)
  const [bids, setBids] = useState<any[]>([])

  useEffect(() => {
    async function loadRFQ() {
      try {
        if (!rfqId) return

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

        // Load RFQ
        const { data: rfqData } = await supabase
          .from('rfqs')
          .select('*')
          .eq('id', rfqId)
          .single()

        if (!rfqData) {
          router.push('/dashboard/admin/rfqs')
          return
        }

        setRfq(rfqData)

        // Load all bids
        const { data: bidsData } = await supabase
          .from('bids')
          .select(`
            id,
            price,
            transit_days,
            is_winner,
            vendor_id
          `)
          .eq('rfq_id', rfqId)
          .order('price', { ascending: true })

        setBids(bidsData || [])
      } finally {
        setLoading(false)
      }
    }

    loadRFQ()
  }, [rfqId, router])

  if (loading) return <p>Loading RFQ...</p>
  if (!rfq) return <p>RFQ not found</p>

  return (
    <div style={{ padding: 40 }}>
      <h1>Admin – RFQ Details</h1>

      <p><strong>Origin:</strong> {rfq.origin}</p>
      <p><strong>Destination:</strong> {rfq.destination}</p>
      <p><strong>Status:</strong> {rfq.status}</p>

      <hr />

      <h3>Shipping Description</h3>
      <p
        style={{
          whiteSpace: 'pre-wrap',
          background: '#f5f5f5',
          padding: 12,
          borderRadius: 6,
        }}
      >
        {rfq.description || 'No description provided.'}
      </p>

      <hr />

      <h3>Bids</h3>

      {bids.length === 0 && <p>No bids submitted.</p>}

      {bids.map((bid, index) => (
        <div
          key={bid.id}
          style={{
            border: '1px solid #ddd',
            padding: 12,
            marginBottom: 10,
            background: bid.is_winner ? '#e6ffe6' : '#fff',
          }}
        >
          <p><strong>Rank:</strong> {index + 1}</p>
          <p><strong>Vendor ID:</strong> {bid.vendor_id}</p>
          <p><strong>Price:</strong> {bid.price}</p>
          <p><strong>Transit Days:</strong> {bid.transit_days}</p>

          {bid.is_winner && <strong>🏆 Winner</strong>}
        </div>
      ))}

      <br />

      <button onClick={() => router.push('/dashboard/admin/rfqs')}>
        Back to RFQs
      </button>
    </div>
  )
}
