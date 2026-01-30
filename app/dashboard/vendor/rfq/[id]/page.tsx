'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, useParams } from 'next/navigation'

export default function VendorRFQDetails() {
  const router = useRouter()
  const params = useParams()
  const rfqId = params?.id as string | undefined

  const [loading, setLoading] = useState(true)
  const [rfq, setRfq] = useState<any>(null)
  const [price, setPrice] = useState('')
  const [transitDays, setTransitDays] = useState('')
  const [alreadyBid, setAlreadyBid] = useState(false)
  const [message, setMessage] = useState('')

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

        if (profile?.role !== 'VENDOR') {
          router.push('/dashboard')
          return
        }

        const { data: rfqData } = await supabase
          .from('rfqs')
          .select('*')
          .eq('id', rfqId)
          .single()

        if (!rfqData || rfqData.status !== 'LIVE') {
          router.push('/dashboard/vendor')
          return
        }

        setRfq(rfqData)

        const { data: round } = await supabase
          .from('rfq_rounds')
          .select('*')
          .eq('rfq_id', rfqId)
          .eq('status', 'LIVE')
          .single()

        const { data: existingBid } = await supabase
          .from('bids')
          .select('id')
          .eq('rfq_id', rfqId)
          .eq('round_id', round.id)
          .eq('vendor_id', userData.user.id)
          .maybeSingle()

        if (existingBid) {
          setAlreadyBid(true)
          setMessage('You already submitted a bid for this round.')
        }

        rfqData.active_round = round
        setRfq({ ...rfqData })
      } finally {
        setLoading(false)
      }
    }

    loadRFQ()
  }, [rfqId, router])

  const submitBid = async () => {
    const { data: userData } = await supabase.auth.getUser()

    const { error } = await supabase.from('bids').insert({
      rfq_id: rfqId,
      round_id: rfq.active_round.id,
      vendor_id: userData?.user?.id,
      price: Number(price),
      transit_days: Number(transitDays),
    })

    if (error) setMessage(error.message)
    else {
      setAlreadyBid(true)
      setMessage('Bid submitted successfully ✅')
    }
  }

  if (loading) return <p>Loading RFQ...</p>
  if (!rfq) return <p>RFQ not found</p>

  return (
    <div style={{ padding: 40 }}>
      <h1>RFQ Details (Vendor)</h1>

      <p><strong>Origin:</strong> {rfq.origin}</p>
      <p><strong>Destination:</strong> {rfq.destination}</p>

      <hr />

      <h3>Shipping Description</h3>
      <p
        style={{
          whiteSpace: 'pre-wrap',
          background: '#f3f3f3',
          padding: 12,
        }}
      >
        {rfq.description || 'No description provided.'}
      </p>

      <hr />

      {!alreadyBid ? (
        <>
          <h3>Submit Bid</h3>
          <input
            type="number"
            placeholder="Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <br /><br />
          <input
            type="number"
            placeholder="Transit Days"
            value={transitDays}
            onChange={(e) => setTransitDays(e.target.value)}
          />
          <br /><br />
          <button onClick={submitBid}>Submit Bid</button>
        </>
      ) : (
        <p style={{ color: 'green' }}>{message}</p>
      )}

      <br />
      <button onClick={() => router.push('/dashboard/vendor')}>
        Back
      </button>
    </div>
  )
}
