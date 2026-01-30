'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function CreateRFQPage() {
  const router = useRouter()

  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function checkOrg() {
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
      }
    }

    checkOrg()
  }, [router])

  const createRFQ = async () => {
    setLoading(true)
    setMessage('')

    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) return

    const { data: rfq, error } = await supabase
      .from('rfqs')
      .insert({
        org_id: userData.user.id,
        origin,
        destination,
        description,
        status: 'DRAFT',
      })
      .select()
      .single()

    setLoading(false)

    if (error) {
      setMessage(error.message)
    } else {
      router.push(`/dashboard/org/rfq/${rfq.id}`)
    }
  }

  return (
    <div style={{ padding: 40, maxWidth: 600 }}>
      <h1>Create RFQ</h1>

      <label>Origin</label>
      <input
        type="text"
        value={origin}
        onChange={(e) => setOrigin(e.target.value)}
        style={{ width: '100%', marginBottom: 12 }}
      />

      <label>Destination</label>
      <input
        type="text"
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
        style={{ width: '100%', marginBottom: 12 }}
      />

      <label>Shipping Description / Instructions</label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={5}
        placeholder="Describe cargo details, packaging, special handling, timelines, etc."
        style={{ width: '100%', marginBottom: 20 }}
      />

      <button onClick={createRFQ} disabled={loading}>
        {loading ? 'Creating...' : 'Create RFQ'}
      </button>

      {message && <p style={{ marginTop: 10 }}>{message}</p>}
    </div>
  )
}
