import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useTenant } from '../hooks/useTenant'

const DAYS = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
]

export default function Settings() {
  const queryClient = useQueryClient()
  const { data: profile, isLoading } = useTenant()
  const tenant = profile?.tenant

  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (tenant && !form) {
      setForm({
        transfer_phone: tenant.transfer_phone || '',
        escalation_email: tenant.escalation_email || '',
        business_hours: tenant.business_hours || {},
      })
    }
  }, [tenant])

  if (isLoading || !form) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-7 h-7 text-speedy-accent animate-spin" />
      </div>
    )
  }

  function setHour(day, field, value) {
    setForm((f) => {
      const cur = f.business_hours[day] || { open: '09:00', close: '18:00' }
      return { ...f, business_hours: { ...f.business_hours, [day]: { ...cur, [field]: value } } }
    })
  }

  function toggleClosed(day) {
    setForm((f) => {
      const isClosed = f.business_hours[day] === null
      return {
        ...f,
        business_hours: {
          ...f.business_hours,
          [day]: isClosed ? { open: '09:00', close: '18:00' } : null,
        },
      }
    })
  }

  async function save() {
    setSaving(true)
    const { error } = await supabase
      .from('tenants')
      .update({
        transfer_phone: form.transfer_phone || null,
        escalation_email: form.escalation_email || null,
        business_hours: form.business_hours,
      })
      .eq('id', tenant.id)
    setSaving(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Saved')
    queryClient.invalidateQueries({ queryKey: ['tenant'] })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-zinc-500 mt-1">Configure how Jess handles your calls</p>
      </div>

      {/* Contact */}
      <Card title="Contact & escalation">
        <Field label="Transfer phone" hint="Where Jess transfers calls when she escalates">
          <input
            type="tel"
            value={form.transfer_phone}
            onChange={(e) => setForm({ ...form, transfer_phone: e.target.value })}
            placeholder="+1 (330) 555-0100"
            className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-speedy-accent/40"
          />
        </Field>

        <Field label="Escalation email" hint="Where to email you when something needs attention">
          <input
            type="email"
            value={form.escalation_email}
            onChange={(e) => setForm({ ...form, escalation_email: e.target.value })}
            placeholder="owner@speedyirepair.com"
            className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-speedy-accent/40"
          />
        </Field>
      </Card>

      {/* Business hours */}
      <Card title="Business hours" subtitle="Times shown in Eastern (Akron, OH)">
        <div className="space-y-2.5">
          {DAYS.map((d) => {
            const h = form.business_hours[d.key]
            const closed = h === null
            return (
              <div key={d.key} className="flex items-center gap-3">
                <div className="w-24 text-sm text-zinc-300">{d.label}</div>
                {closed ? (
                  <div className="flex-1 text-sm text-zinc-600">Closed</div>
                ) : (
                  <>
                    <input
                      type="time"
                      value={h?.open || '09:00'}
                      onChange={(e) => setHour(d.key, 'open', e.target.value)}
                      className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/[0.08] text-white text-sm focus:outline-none focus:border-speedy-accent/40"
                    />
                    <span className="text-zinc-600 text-xs">to</span>
                    <input
                      type="time"
                      value={h?.close || '18:00'}
                      onChange={(e) => setHour(d.key, 'close', e.target.value)}
                      className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/[0.08] text-white text-sm focus:outline-none focus:border-speedy-accent/40"
                    />
                  </>
                )}
                <button
                  onClick={() => toggleClosed(d.key)}
                  className="ml-auto text-xs text-zinc-500 hover:text-white px-2 py-1 rounded transition-colors"
                >
                  {closed ? 'Open this day' : 'Close this day'}
                </button>
              </div>
            )
          })}
        </div>
      </Card>

      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-speedy-accent to-speedy-accent2 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save changes
        </button>
      </div>
    </div>
  )
}

function Card({ title, subtitle, children }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl">
      <div className="px-5 py-4 border-b border-white/[0.06]">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        {subtitle && <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-xs text-zinc-300 font-medium mb-1.5">{label}</label>
      {hint && <p className="text-[11px] text-zinc-500 mb-2">{hint}</p>}
      {children}
    </div>
  )
}
