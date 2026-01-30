'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function VendorDashboard() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [totalBids, setTotalBids] = useState(0)
  const [wins, setWins] = useState(0)

  useEffect(() => {
    async function loadDashboard() {
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

      if (profile?.role !== 'VENDOR') {
        router.push('/dashboard')
        return
      }

      const { count: bidCount } = await supabase
        .from('bids')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', userData.user.id)

      const { count: winCount } = await supabase
        .from('bids')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', userData.user.id)
        .eq('is_winner', true)

      setTotalBids(bidCount || 0)
      setWins(winCount || 0)
      setLoading(false)
    }

    loadDashboard()
  }, [router])

  const winRate =
    totalBids > 0 ? Math.round((wins / totalBids) * 100) : 0

  if (loading) {
    return <div className="p-10 text-gray-500">Loading dashboard...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* HEADER */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold">Vendor Dashboard</h1>
        <p className="mt-2 text-sm opacity-90">
          Logged in as <span className="font-medium">{email}</span>
        </p>
      </div>

      {/* KPI CARDS */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <KpiCard title="RFQs Participated" value={totalBids} />
        <KpiCard title="RFQs Won" value={wins} />
        <KpiCard title="Win Rate" value={`${winRate}%`} />
      </div>

      {/* ACTION CARDS */}
      <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
        <ActionCard
          title="Live RFQs"
          description="View open RFQs and submit competitive bids."
          button="Browse RFQs"
          primary
          onClick={() => router.push('/dashboard/vendor')}
        />

        <ActionCard
          title="My Bids"
          description="Track all bids you have submitted and outcomes."
          button="View Bids"
          onClick={() => router.push('/dashboard/vendor')}
        />

        <ActionCard
          title="Vendor Profile"
          description="Manage company details and contact information."
          button="Edit Profile"
          onClick={() => router.push('/dashboard/profile')}
        />
      </div>

      {/* INFO */}
      <div className="mt-12 rounded-2xl bg-white p-8 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">
          How to improve your success
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-gray-600">
          <li>Respond quickly to RFQs</li>
          <li>Offer competitive pricing</li>
          <li>Maintain consistent transit times</li>
          <li>Participate regularly</li>
        </ul>
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
    <div className="group rounded-2xl bg-white p-6 shadow-md transition hover:-translate-y-1 hover:shadow-xl">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{description}</p>

      <button
        onClick={onClick}
        className={`mt-6 w-full rounded-lg px-4 py-2 font-medium transition ${
          primary
            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
        }`}
      >
        {button}
      </button>
    </div>
  )
}
