'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function DashboardRedirect() {
  const router = useRouter()

  useEffect(() => {
    async function redirectUser() {
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

      if (profile?.role === 'ORG') {
        router.push('/dashboard/org')
      } else if (profile?.role === 'VENDOR') {
        router.push('/dashboard/vendor')
      } else if (profile?.role === 'ADMIN') {
        router.push('/dashboard/admin')
      } else {
        router.push('/login')
      }
    }

    redirectUser()
  }, [router])

  return <p>Redirecting...</p>
}
