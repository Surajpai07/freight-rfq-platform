'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function AdminDashboard() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    async function loadAdmin() {
      try {
        const { data: userData } = await supabase.auth.getUser()
        if (!userData?.user) {
          router.push('/login')
          return
        }

        setEmail(userData.user.email || '')

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userData.user.id)
          .single()

        if (profile?.role !== 'ADMIN') {
          router.push('/dashboard')
          return
        }

        const { data } = await supabase
          .from('admin_stats_view')
          .select('*')
          .single()

        setStats(data)
      } finally {
        setLoading(false)
      }
    }

    loadAdmin()
  }, [router])

  if (loading) {
    return <div className="p-10 text-gray-500">Loading admin dashboard...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* HEADER */}
      <div className="rounded-2xl bg-gradient-to-r from-gray-800 to-gray-900 p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold">Admin Control Panel</h1>
        <p className="mt-2 text-sm opacity-90">
          Logged in as <span className="font-medium">{email}</span>
        </p>
      </div>

      {/* KPI CARDS */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <KpiCard title="Total RFQs" value={stats?.total_rfqs ?? 0} />
        <KpiCard title="Organizations" value={stats?.total_orgs ?? 0} />
        <KpiCard title="Vendors" value={stats?.total_vendors ?? 0} />
      </div>

      {/* ACTIONS */}
      <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
        <ActionCard
          title="Manage Users"
          description="View organizations and vendors."
          button="View Users"
          onClick={() => router.push('/dashboard/admin/users')}
          primary
        />

        <ActionCard
          title="RFQ Oversight"
          description="View all RFQs and winners."
          button="View RFQs"
          onClick={() => router.push('/dashboard/admin/rfqs')}
        />
      </div>
    </div>
  )
}

/* ---------- Components ---------- */

function KpiCard({ title, value }: { title: string; value: any }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-gray-800">{value}</p>
    </div>
  )
}

function ActionCard({
  title,
  description,
  button,
  onClick,
  primary = false,
}: {
  title: string
  description: string
  button: string
  onClick: () => void
  primary?: boolean
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-md transition hover:-translate-y-1 hover:shadow-xl">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{description}</p>

      <button
        onClick={onClick}
        className={`mt-6 w-full rounded-lg px-4 py-2 font-medium ${
          primary
            ? 'bg-gray-900 text-white hover:bg-black'
            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
        }`}
      >
        {button}
      </button>
    </div>
  )
}
