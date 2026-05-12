import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Calendar, Loader2, X, User, Phone, Wrench, Clock, ExternalLink } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { fmtDateTime, fmtDate, fmtTime, fmtPhone, TIMEZONE } from '../lib/format'
import { formatInTimeZone } from 'date-fns-tz'

const RANGES = [
  { id: 'today', label: 'Today' },
  { id: 'tomorrow', label: 'Tomorrow' },
  { id: 'week', label: 'This week' },
  { id: 'all', label: 'All upcoming' },
]

function StatusBadge({ status }) {
  const styles = {
    confirmed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    accepted: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
    no_show: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  }
  const key = (status || '').toLowerCase().replace('_canceled_by_customer', 'cancelled')
  const cls = styles[key] || styles.confirmed
  return (
    <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wide rounded border ${cls}`}>
      {status ? status.replace('_', ' ').toLowerCase() : 'confirmed'}
    </span>
  )
}

function rangeBounds(range) {
  const now = new Date()
  const today = formatInTimeZone(now, TIMEZONE, 'yyyy-MM-dd')
  // Use UTC offsets — date-fns-tz handles DST when querying, this is approx for boundary
  const start = new Date(`${today}T00:00:00`)
  const tomorrow = new Date(start.getTime() + 24 * 60 * 60 * 1000)
  const dayAfter = new Date(start.getTime() + 48 * 60 * 60 * 1000)
  const weekEnd = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000)

  switch (range) {
    case 'today':
      return { from: start.toISOString(), to: tomorrow.toISOString() }
    case 'tomorrow':
      return { from: tomorrow.toISOString(), to: dayAfter.toISOString() }
    case 'week':
      return { from: start.toISOString(), to: weekEnd.toISOString() }
    case 'all':
    default:
      return { from: start.toISOString(), to: null }
  }
}

export default function Bookings() {
  const [range, setRange] = useState('today')
  const [selectedId, setSelectedId] = useState(null)
  const navigate = useNavigate()

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings-list', range],
    queryFn: async () => {
      const { from, to } = rangeBounds(range)
      let q = supabase
        .from('bookings')
        .select('id, square_booking_id, customer_name, customer_phone, service_name, service_variation_id, team_member_name, team_member_id, start_at, duration_minutes, status, call_id, created_at')
        .gte('start_at', from)
        .order('start_at', { ascending: true })
        .limit(200)
      if (to) q = q.lt('start_at', to)
      const { data, error } = await q
      if (error) throw error
      return data || []
    },
    refetchInterval: 30_000,
  })

  const { data: detail } = useQuery({
    queryKey: ['booking-detail', selectedId],
    enabled: !!selectedId,
    queryFn: async () => {
      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', selectedId)
        .maybeSingle()
      // Pull linked call if any
      let linkedCall = null
      if (data?.call_id) {
        const { data: c } = await supabase
          .from('calls')
          .select('id, started_at, caller_name, caller_phone, channel, outcome, duration_seconds, summary')
          .eq('id', data.call_id)
          .maybeSingle()
        linkedCall = c
      }
      return { ...data, linkedCall }
    },
  })

  const total = bookings?.length || 0

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Bookings</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Appointments synced from Square — {total} {total === 1 ? 'booking' : 'bookings'}
          </p>
        </div>
        <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs">
          {RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                range === r.id ? 'bg-speedy-accent/15 text-white' : 'text-zinc-500 hover:text-zinc-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-7 h-7 text-speedy-accent animate-spin" />
        </div>
      ) : total === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-12 text-center">
          <Calendar className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
          <p className="text-sm text-zinc-400">No bookings in this range.</p>
          <p className="text-xs text-zinc-600 mt-1">Once Jess books an appointment in Square, it will show up here.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl overflow-hidden">
          <div className="divide-y divide-white/[0.04]">
            {bookings.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedId(b.id)}
                className="w-full px-5 py-3.5 flex items-center gap-4 hover:bg-white/[0.03] transition-colors text-left"
              >
                <div className="w-12 flex-shrink-0 text-center">
                  <div className="text-[10px] uppercase tracking-wide text-zinc-500">{fmtDate(b.start_at, 'MMM')}</div>
                  <div className="text-lg font-bold text-white leading-tight">{fmtDate(b.start_at, 'd')}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-medium truncate">
                    {b.customer_name || fmtPhone(b.customer_phone) || 'Booking ' + (b.square_booking_id || '').slice(-6)}
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5 truncate">
                    {b.service_name || b.service_variation_id || 'Service TBD'} · {b.duration_minutes || 30}m
                    {b.team_member_name ? ` · ${b.team_member_name}` : ''}
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <div className="text-sm text-white font-medium">{fmtTime(b.start_at)}</div>
                  <div className="text-[11px] text-zinc-600 mt-0.5">{b.call_id ? 'from call' : 'manual'}</div>
                </div>
                <StatusBadge status={b.status} />
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedId && (
        <BookingDetail
          booking={detail}
          onClose={() => setSelectedId(null)}
          onOpenCall={(callId) => {
            setSelectedId(null)
            navigate(`/dashboard/calls?call=${callId}`)
          }}
        />
      )}
    </div>
  )
}

function BookingDetail({ booking, onClose, onOpenCall }) {
  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-[#0a0a0f] border-l border-white/[0.06] overflow-y-auto">
        <div className="sticky top-0 z-10 px-5 py-4 flex items-center justify-between border-b border-white/[0.06] bg-[#0a0a0f]/95 backdrop-blur-xl">
          <h3 className="text-sm font-semibold text-white">Booking detail</h3>
          <button onClick={onClose} className="p-2 -mr-2 text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!booking ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-speedy-accent animate-spin" />
          </div>
        ) : (
          <div className="p-5 space-y-5">
            <div>
              <div className="text-lg font-semibold text-white">
                {booking.customer_name || fmtPhone(booking.customer_phone) || 'Customer'}
              </div>
              <div className="text-xs text-zinc-500 mt-1">
                {fmtDateTime(booking.start_at)} · {booking.duration_minutes || 30} min
              </div>
              <div className="mt-2"><StatusBadge status={booking.status} /></div>
            </div>

            <DetailRow icon={Wrench} label="Service" value={booking.service_name || booking.service_variation_id || '—'} />
            <DetailRow icon={User} label="Tech" value={booking.team_member_name || booking.team_member_id || '—'} />
            <DetailRow icon={Phone} label="Customer phone" value={fmtPhone(booking.customer_phone) || '—'} />
            <DetailRow icon={Clock} label="Booked at" value={fmtDateTime(booking.created_at)} />
            <DetailRow icon={Calendar} label="Square ID" value={booking.square_booking_id || '—'} mono />

            {booking.linkedCall && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 font-semibold">Linked call</div>
                </div>
                <button
                  onClick={() => onOpenCall(booking.linkedCall.id)}
                  className="w-full text-left rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors p-3 flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center">
                    <Phone className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-medium truncate">
                      {booking.linkedCall.caller_name || fmtPhone(booking.linkedCall.caller_phone) || 'Unknown caller'}
                    </div>
                    <div className="text-xs text-zinc-500 truncate">
                      {booking.linkedCall.summary || `${booking.linkedCall.channel || 'call'} · ${fmtDateTime(booking.linkedCall.started_at)}`}
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-zinc-500" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

function DetailRow({ icon: Icon, label, value, mono }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-zinc-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 font-semibold">{label}</div>
        <div className={`text-sm text-zinc-200 mt-0.5 break-all ${mono ? 'font-mono text-xs' : ''}`}>{value}</div>
      </div>
    </div>
  )
}
