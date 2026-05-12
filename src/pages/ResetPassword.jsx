import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, Phone, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [recoveryMode, setRecoveryMode] = useState(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true)
    })
    if (window.location.hash.includes('type=recovery')) setRecoveryMode(true)
    return () => subscription.unsubscribe()
  }, [])

  async function requestReset(e) {
    e.preventDefault()
    setSubmitting(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setSubmitting(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Reset link sent. Check your email.')
  }

  async function setPassword(e) {
    e.preventDefault()
    setSubmitting(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSubmitting(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Password updated. Redirecting...')
    setTimeout(() => navigate('/dashboard', { replace: true }), 800)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#050508]">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[200px] -left-[150px] w-[500px] h-[500px] rounded-full bg-speedy-accent/[0.06] blur-[120px]" />
        <div className="absolute -bottom-[200px] -right-[150px] w-[500px] h-[500px] rounded-full bg-speedy-accent2/[0.05] blur-[120px]" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-speedy-accent to-speedy-accent2 flex items-center justify-center ring-1 ring-white/10">
            <Phone className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-lg font-bold text-white tracking-tight">Speedy iRepair</div>
            <div className="text-[11px] text-zinc-500 font-medium">Dashboard</div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-7">
          <h1 className="text-xl font-semibold text-white mb-1">
            {recoveryMode ? 'Set new password' : 'Reset your password'}
          </h1>
          <p className="text-sm text-zinc-500 mb-6">
            {recoveryMode ? 'Choose a new password for your account.' : "Enter your email and we'll send you a reset link."}
          </p>

          {recoveryMode ? (
            <form onSubmit={setPassword} className="space-y-4">
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min 8 chars)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-speedy-accent/40 transition-colors"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-speedy-accent to-speedy-accent2 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Update password
              </button>
            </form>
          ) : (
            <form onSubmit={requestReset} className="space-y-4">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@speedyirepair.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-speedy-accent/40 transition-colors"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-speedy-accent to-speedy-accent2 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Send reset link
              </button>
            </form>
          )}

          <Link to="/login" className="mt-5 flex items-center gap-2 text-xs text-zinc-500 hover:text-white transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
