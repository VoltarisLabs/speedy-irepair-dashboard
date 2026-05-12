import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useTenant() {
  return useQuery({
    queryKey: ['tenant'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data: profile } = await supabase
        .from('users')
        .select('id, tenant_id, email, full_name, role, tenant:tenants(*)')
        .eq('id', user.id)
        .maybeSingle()

      return profile
    },
  })
}
