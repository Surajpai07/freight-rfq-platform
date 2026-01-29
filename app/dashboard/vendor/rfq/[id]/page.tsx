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
  const [result, setResult] = useState<'WON' | 'LOST' | null>(null)
  const [winningBid, setWinningBid] = useState<{
  price: number
  transit_days: number
} | null>(null)


  useEffect(() => {
    async function loadRFQ() {
      try {
        // wait until route param is ready
        if (!rfqId) return

        const { data: userData } = await supabase.auth.getUser()
        if (!userData?.user) {
          router.push('/login')
          return
        }

        // role check
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userData.user.id)
          .single()

        if (profile?.role !== 'VENDOR') {
          router.push('/dashboard')
          return
        }

        // load RFQ
        const { data: rfqData, error: rfqError } = await supabase
          .from('rfqs')
          .select('*')
          .eq('id', rfqId)
          .single()

        if (rfqError || !rfqData) {
          router.push('/dashboard/vendor')
          return
        }

        // allow BOTH LIVE and CLOSED RFQs
        if (rfqData.status !== 'LIVE' && rfqData.status !== 'CLOSED') {
          router.push('/dashboard/vendor')
          return
        }

        setRfq(rfqData)

        // check existing bid
        const { data: existingBid } = await supabase
            .from('bids')
            .select('id, is_winner, price, transit_days')
            .eq('rfq_id', rfqId)
            .eq('vendor_id', userData.user.id)
            .maybeSingle()

        if (existingBid) {
  setAlreadyBid(true)
  setMessage('You have already submitted a bid for this RFQ.')

  if (rfqData.status === 'CLOSED') {
    if (existingBid.is_winner) {
      setResult('WON')
      setWinningBid({
        price: existingBid.price,
        transit_days: existingBid.transit_days,
      })
    } else {
      setResult('LOST')
    }
  }
}

      } finally {
        // ALWAYS stop loading
        setLoading(false)
      }
    }

    loadRFQ()
  }, [rfqId, router])

  // ---------------- UI ----------------

  if (loading) {
    return <p>Loading RFQ...</p>
  }

  if (!rfq) {
    return <p>RFQ not found</p>
  }

  const submitBid = async () => {
    const { data: userData } = await supabase.auth.getUser()

    const { error } = await supabase.from('bids').insert({
      rfq_id: rfqId,
      vendor_id: userData?.user?.id,
      price: Number(price),
      transit_days: Number(transitDays),
    })

    if (error) {
      setMessage(error.message)
    } else {
      setAlreadyBid(true)
      setMessage('Bid submitted successfully ✅')
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>RFQ Details</h1>

      <p><strong>Origin:</strong> {rfq.origin}</p>
      <p><strong>Destination:</strong> {rfq.destination}</p>
      <p><strong>Status:</strong> {rfq.status}</p>

      <hr />

     {result === 'WON' && winningBid && (
  <div style={{ color: 'green', fontWeight: 'bold' }}>
    <p>🏆 Congratulations! You WON this RFQ</p>
    <p>Winning Price: <strong>{winningBid.price}</strong></p>
    <p>Transit Days: <strong>{winningBid.transit_days}</strong></p>
  </div>
)}


      {result === 'LOST' && (
        <p style={{ color: 'red', fontWeight: 'bold' }}>
          ❌ You did not win this RFQ
        </p>
      )}

      {result === null && alreadyBid && (
        <p style={{ color: 'green' }}>{message}</p>
      )}

      {result === null && !alreadyBid && rfq.status === 'LIVE' && (
        <>
          <h3>Submit Your Bid</h3>

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
      )}

      <br /><br />

      <button onClick={() => router.push('/dashboard/vendor')}>
        Back to Inbox
      </button>
    </div>
  )
}
