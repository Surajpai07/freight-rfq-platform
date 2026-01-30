'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [role, setRole] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function loadProfile() {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData?.user) {
        router.push('/login')
        return
      }

      // email from auth (read-only)
      setEmail(userData.user.email || '')

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, company_name, contact_name, contact_phone')
        .eq('id', userData.user.id)
        .single()

      if (!profile) {
        router.push('/dashboard')
        return
      }

      setRole(profile.role)
      setCompanyName(profile.company_name || '')
      setContactName(profile.contact_name || '')
      setContactPhone(profile.contact_phone || '')
      setLoading(false)
    }

    loadProfile()
  }, [router])

  const saveProfile = async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) return

    const { error } = await supabase
      .from('profiles')
      .update({
        company_name: companyName,
        contact_name: contactName,
        contact_phone: contactPhone,
      })
      .eq('id', userData.user.id)

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Profile updated successfully ✅')
    }
  }

  if (loading) return <p>Loading profile...</p>

  return (
    <div style={{ padding: 40, maxWidth: 500 }}>
      <h1>Profile Details</h1>

      <p><strong>Role:</strong> {role}</p>

      <label>Email (Login)</label>
      <input
        type="email"
        value={email}
        disabled
        style={{
          width: '100%',
          marginBottom: 12,
          background: '#f3f3f3',
          cursor: 'not-allowed',
        }}
      />

      <label>Company Name</label>
      <input
        type="text"
        value={companyName}
        onChange={e => setCompanyName(e.target.value)}
        style={{ width: '100%', marginBottom: 12 }}
      />

      <label>Contact Person Name</label>
      <input
        type="text"
        value={contactName}
        onChange={e => setContactName(e.target.value)}
        style={{ width: '100%', marginBottom: 12 }}
      />

      <label>Contact Phone</label>
      <input
        type="text"
        value={contactPhone}
        onChange={e => setContactPhone(e.target.value)}
        style={{ width: '100%', marginBottom: 20 }}
      />

      <button onClick={saveProfile}>
        Save Profile
      </button>

      {message && <p style={{ marginTop: 10 }}>{message}</p>}
    </div>
  )
}
