'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function CreateRFQ() {
  const router = useRouter()

  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function checkAccess() {
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
      }
    }

    checkAccess()
  }, [router])

  const handleCreateRFQ = async () => {
    setLoading(true)
    setError('')

    const { data: userData } = await supabase.auth.getUser()

    const { error } = await supabase.from('rfqs').insert({
      org_id: userData.user?.id,
      origin,
      destination,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      router.push('/dashboard/org')
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Create RFQ</h1>

      <br />

      <input
        placeholder="Origin (e.g. Shanghai)"
        value={origin}
        onChange={(e) => setOrigin(e.target.value)}
      />
      <br /><br />

      <input
        placeholder="Destination (e.g. Mumbai)"
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
      />
      <br /><br />

      <button onClick={handleCreateRFQ} disabled={loading}>
        {loading ? 'Creating...' : 'Create RFQ'}
      </button>

      <br /><br />

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}
