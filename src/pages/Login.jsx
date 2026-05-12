import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const navigate = useNavigate()
  const { session, loading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!authLoading && session) navigate('/dashboard', { replace: true })
  }, [authLoading, session, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setSubmitting(false)
    if (error) {
      toast.error(error.message || 'Sign in failed')
      return
    }
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#050508]">
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[200px] -left-[150px] w-[500px] h-[500px] rounded-full bg-speedy-accent/[0.06] blur-[120px]" />
        <div className="absolute -bottom-[200px] -right-[150px] w-[500px] h-[500px] rounded-full bg-speedy-accent2/[0.05] blur-[120px]" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Brand */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center ring-1 ring-white/10 overflow-hidden shadow-2xl">
            <img src="/logo.png" alt="Speedy iRepair" className="w-full h-full object-contain p-1.5" />
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white tracking-tight">Speedy iRepair</div>
            <div className="text-[11px] text-zinc-500 font-medium">Dashboard</div>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-7">
          <h1 className="text-xl font-semibold text-white mb-1">Welcome back</h1>
          <p className="text-sm text-zinc-500 mb-6">Sign in to your dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@speedyirepair.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-speedy-accent/40 focus:bg-black/60 transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs text-zinc-400 font-medium">Password</label>
                <Link to="/reset-password" className="text-xs text-speedy-accent hover:text-white transition-colors">
                  Forgot?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-white text-sm focus:outline-none focus:border-speedy-accent/40 focus:bg-black/60 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-speedy-accent to-speedy-accent2 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {submitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-[11px] text-zinc-600 text-center mt-6">
          Voltaris-Labs · Confidential
        </p>
      </div>
    </div>
  )
}
