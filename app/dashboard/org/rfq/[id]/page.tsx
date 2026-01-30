'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useParams, useRouter } from 'next/navigation'

export default function OrgRFQDetails() {
  const router = useRouter()
  const params = useParams()
  const rfqId = params?.id as string | undefined

  const [loading, setLoading] = useState(true)
  const [rfq, setRfq] = useState<any>(null)
  const [activeRound, setActiveRound] = useState<any>(null)
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

        if (profile?.role !== 'ORG') {
          router.push('/dashboard')
          return
        }

        const { data: rfqData } = await supabase
          .from('rfqs')
          .select('*')
          .eq('id', rfqId)
          .single()

        if (!rfqData) {
          router.push('/dashboard/org')
          return
        }

        setRfq(rfqData)

        if (rfqData.status === 'LIVE') {
          const { data: round } = await supabase
            .from('rfq_rounds')
            .select('*')
            .eq('rfq_id', rfqId)
            .eq('status', 'LIVE')
            .maybeSingle()

          setActiveRound(round)

          if (round) {
            const { data: bidsData } = await supabase
              .from('bids')
              .select('id, vendor_id, price, transit_days, is_winner')
              .eq('rfq_id', rfqId)
              .eq('round_id', round.id)
              .order('price', { ascending: true })

            setBids(bidsData || [])
          }
        }
      } finally {
        setLoading(false)
      }
    }

    loadRFQ()
  }, [rfqId, router])

  const updateRFQStatus = async (status: 'DRAFT' | 'LIVE' | 'CLOSED') => {
    if (!rfq) return
    if (!confirm(`Change RFQ status to ${status}?`)) return

    const { error } = await supabase
      .from('rfqs')
      .update({ status })
      .eq('id', rfq.id)

    if (error) alert(error.message)
    else window.location.reload()
  }

  const selectWinner = async (bidId: string) => {
    if (!confirm('Select this bid as winner and close RFQ?')) return

    await supabase.from('bids').update({ is_winner: true }).eq('id', bidId)
    await supabase.from('rfqs').update({ status: 'CLOSED' }).eq('id', rfq.id)

    window.location.reload()
  }

  if (loading) return <p>Loading RFQ...</p>
  if (!rfq) return <p>RFQ not found</p>

  return (
    <div style={{ padding: 40 }}>
      <h1>RFQ Details (Buyer)</h1>

      <p><strong>Origin:</strong> {rfq.origin}</p>
      <p><strong>Destination:</strong> {rfq.destination}</p>
      <p><strong>Status:</strong> {rfq.status}</p>

      {/* RFQ STATUS CONTROLS */}
      <div style={{ marginTop: 15 }}>
        {rfq.status === 'DRAFT' && (
          <button onClick={() => updateRFQStatus('LIVE')}>
            Publish RFQ
          </button>
        )}

        {rfq.status === 'LIVE' && (
          <>
            <button onClick={() => updateRFQStatus('DRAFT')}>
              Move to Draft
            </button>
            <button
              onClick={() => updateRFQStatus('CLOSED')}
              style={{ background: 'red', color: '#fff', marginLeft: 10 }}
            >
              Close RFQ
            </button>
          </>
        )}
      </div>

      <hr />

      {/* SHIPPING DESCRIPTION */}
      <h3>Shipping Description</h3>
      <p
        style={{
          whiteSpace: 'pre-wrap',
          background: '#f9f9f9',
          padding: 12,
          borderRadius: 6,
        }}
      >
        {rfq.description || 'No description provided.'}
      </p>

      <hr />

      {/* ROUND + BIDS */}
      {rfq.status === 'LIVE' && activeRound && (
        <>
          <h2>Current Round: {activeRound.round_no}</h2>

          {bids.length === 0 && <p>No bids yet.</p>}

          {bids.map((bid, index) => (
            <div
              key={bid.id}
              style={{
                border: '1px solid #ddd',
                padding: 10,
                marginBottom: 10,
                background: bid.is_winner ? '#e6ffe6' : '#fff',
              }}
            >
              <p><strong>Rank:</strong> {index + 1}</p>
              <p>Vendor ID: {bid.vendor_id}</p>
              <p>Price: {bid.price}</p>
              <p>Transit Days: {bid.transit_days}</p>

              {!bid.is_winner && (
                <button onClick={() => selectWinner(bid.id)}>
                  Select Winner
                </button>
              )}

              {bid.is_winner && <strong>🏆 Winner</strong>}
            </div>
          ))}
        </>
      )}

      <br />
      <button onClick={() => router.push('/dashboard/org')}>
        Back
      </button>
    </div>
  )
}
