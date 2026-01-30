'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function AdminUsersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [orgs, setOrgs] = useState<any[]>([])
  const [vendors, setVendors] = useState<any[]>([])

  useEffect(() => {
    async function loadUsers() {
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

      const { data: users } = await supabase
        .from('admin_users_view')
        .select('*')

      setOrgs(users?.filter(u => u.role === 'ORG') || [])
      setVendors(users?.filter(u => u.role === 'VENDOR') || [])
      setLoading(false)
    }

    loadUsers()
  }, [router])

  if (loading) return <p>Loading users...</p>

  return (
    <div style={{ padding: 40 }}>
      <h1>Admin – Users</h1>

      <h2>Organizations</h2>
      {orgs.length === 0 && <p>No organizations found.</p>}
      {orgs.map(org => (
        <div
          key={org.id}
          style={{ padding: 10, borderBottom: '1px solid #ddd' }}
        >
          <p><strong>Email:</strong> {org.email}</p>
          <p><strong>Org ID:</strong> {org.id}</p>
          <p><strong>Created:</strong> {new Date(org.created_at).toDateString()}</p>
        </div>
      ))}

      <hr />

      <h2>Vendors</h2>
      {vendors.length === 0 && <p>No vendors found.</p>}
      {vendors.map(vendor => (
        <div
          key={vendor.id}
          style={{ padding: 10, borderBottom: '1px solid #ddd' }}
        >
          <p><strong>Email:</strong> {vendor.email}</p>
          <p><strong>Vendor ID:</strong> {vendor.id}</p>
          <p><strong>Created:</strong> {new Date(vendor.created_at).toDateString()}</p>
        </div>
      ))}
    </div>
  )
}
