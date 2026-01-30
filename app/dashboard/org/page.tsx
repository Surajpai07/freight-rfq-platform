'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function OrgDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [rfqCount, setRfqCount] = useState(0)

  useEffect(() => {
    async function load() {
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

      if (profile?.role !== 'ORG') {
        router.push('/dashboard')
        return
      }

      const { count } = await supabase
        .from('rfqs')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', userData.user.id)

      setRfqCount(count || 0)
      setLoading(false)
    }

    load()
  }, [router])

  if (loading) {
    return <div className="p-10 text-gray-500">Loading dashboard...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* HEADER */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold">Organization Dashboard</h1>
        <p className="mt-2 text-sm opacity-90">
          Logged in as <span className="font-medium">{email}</span>
        </p>
      </div>

      {/* KPI CARDS */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <KpiCard title="Total RFQs" value={rfqCount} />
        <KpiCard title="Active RFQs" value="—" />
        <KpiCard title="Vendors Engaged" value="—" />
      </div>

      {/* ACTION CARDS */}
      <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
        <ActionCard
          title="Create RFQ"
          description="Create a new freight RFQ and invite vendors to bid."
          button="Create RFQ"
          onClick={() => router.push('/dashboard/org/rfq/create')}
          primary
        />

        <ActionCard
          title="Manage RFQs"
          description="View, publish, compare bids and award vendors."
          button="View RFQs"
          onClick={() => router.push('/dashboard/org')}
        />

        <ActionCard
          title="Organization Profile"
          description="Update company details and contact information."
          button="Edit Profile"
          onClick={() => router.push('/dashboard/profile')}
        />
      </div>

      {/* INFO SECTION */}
      <div className="mt-12 rounded-2xl bg-white p-8 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">How this platform works</h2>
        <ol className="list-decimal space-y-2 pl-5 text-gray-600">
          <li>Create an RFQ with complete shipment details</li>
          <li>Publish RFQ to invite vendor bids</li>
          <li>Compare bids transparently</li>
          <li>Select the best vendor and close RFQ</li>
        </ol>
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
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
        }`}
      >
        {button}
      </button>
    </div>
  )
}
