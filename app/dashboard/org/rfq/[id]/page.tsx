'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, useParams } from 'next/navigation'

export default function RFQDetails() {
  const router = useRouter()
  const params = useParams()
  const rfqId = params.id as string

  const [loading, setLoading] = useState(true)
  const [rfq, setRfq] = useState<any>(null)
  const [bids, setBids] = useState<any[]>([])

  useEffect(() => {
    async function loadData() {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userData.user.id)
        .single()

      if (profile?.role !== 'ORG') {
        router.push('/dashboard')
        return
      }

      // Load RFQ
      const { data: rfqData, error: rfqError } = await supabase
        .from('rfqs')
        .select('*')
        .eq('id', rfqId)
        .single()

      if (rfqError) {
        router.push('/dashboard/org')
        return
      }

      setRfq(rfqData)

      // Load bids for this RFQ
      const { data: bidsData } = await supabase
        .from('bids')
        .select('*')
        .eq('rfq_id', rfqId)
        .order('price', { ascending: true })

      setBids(bidsData || [])
      setLoading(false)
    }

    loadData()
  }, [router, rfqId])

  if (loading) {
    return <p>Loading RFQ...</p>
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>RFQ Details</h1>

      <p><strong>Origin:</strong> {rfq.origin}</p>
      <p><strong>Destination:</strong> {rfq.destination}</p>
      <p><strong>Status:</strong> {rfq.status}</p>

      <hr />

      <h2>Vendor Bids</h2>

      {bids.length === 0 ? (
        <p>No bids received yet.</p>
      ) : (
        <table border={1} cellPadding={10}>
<thead>
  <tr>
    <th>Rank</th>
    <th>Vendor</th>
    <th>Price</th>
    <th>Transit Days</th>
    <th>Action</th>
  </tr>
</thead>

          <tbody>
          {bids.map((bid, index) => {
  let rank = '—'
  if (index === 0) rank = 'L1'
  else if (index === 1) rank = 'L2'
  else if (index === 2) rank = 'L3'

  return (
    <tr
      key={bid.id}
      style={{
        backgroundColor: bid.is_winner ? '#d1e7dd' : index === 0 ? '#e6ffe6' : 'transparent',
        fontWeight: bid.is_winner ? 'bold' : 'normal',
      }}
    >
      <td>{rank}</td>
      <td>{bid.vendor_id}</td>
      <td>{bid.price}</td>
      <td>{bid.transit_days}</td>
      <td>
        {rfq.status === 'LIVE' && !bid.is_winner && (
          <button
            onClick={async () => {
              // mark this bid as winner
              await supabase
                .from('bids')
                .update({ is_winner: true })
                .eq('id', bid.id)

              // close RFQ
              await supabase
                .from('rfqs')
                .update({ status: 'CLOSED' })
                .eq('id', rfq.id)

              router.refresh()
            }}
          >
            Select Winner
          </button>
        )}

        {bid.is_winner && '🏆 Winner'}
      </td>
    </tr>
  )
})}

          </tbody>
        </table>
      )}

      <br />

      <button onClick={() => router.push('/dashboard/org')}>
        Back to RFQs
      </button>
    </div>
  )
}
