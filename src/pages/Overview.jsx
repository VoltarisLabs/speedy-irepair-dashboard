import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Phone, Calendar, PhoneMissed, PhoneForwarded, TrendingUp, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { fmtTime, fmtPhone, TIMEZONE } from '../lib/format'
import { formatInTimeZone } from 'date-fns-tz'

function startOfTodayUTC() {
  // Today's start at midnight ET, expressed in UTC ISO
  const now = new Date()
  const etNow = formatInTimeZone(now, TIMEZONE, 'yyyy-MM-dd')
  return new Date(`${etNow}T00:00:00-05:00`).toISOString() // approx EST; date-fns-tz handles DST below in queries
}

function StatCard({ icon: Icon, label, value, sub, onClick, accent = 'speedy-accent' }) {
  const Wrapper = onClick ? 'button' : 'div'
  return (
    <Wrapper
      {...(onClick ? { onClick, type: 'button' } : {})}
      className={`rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5 text-left ${
        onClick ? 'hover:bg-white/[0.04] hover:border-white/[0.10] transition-colors cursor-pointer w-full' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl bg-${accent}/10 border border-${accent}/20 flex items-center justify-center`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-zinc-500 mt-1">{label}</div>
      {sub && <div className="text-[11px] text-zinc-600 mt-2">{sub}</div>}
    </Wrapper>
  )
}

export default function Overview() {
  const todayStart = startOfTodayUTC()
  const navigate = useNavigate()

  const { data: kpis, isLoading } = useQuery({
    queryKey: ['overview-kpis'],
    queryFn: async () => {
      const [todayCalls, todayBookings, recentCalls] = await Promise.all([
        supabase
          .from('calls')
          .select('id, outcome, duration_seconds', { count: 'exact' })
          .gte('started_at', todayStart),
        supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .gte('start_at', todayStart),
        supabase
          .from('calls')
          .select('id, started_at, caller_phone, caller_name, outcome, service_requested, duration_seconds')
          .order('started_at', { ascending: false })
          .limit(8),
      ])

      const totalToday = todayCalls.count || 0
      const callsList = todayCalls.data || []
      const booked = callsList.filter((c) => c.outcome === 'booked').length
      const missed = callsList.filter((c) => c.outcome === 'missed' || c.outcome === 'abandoned').length
      const escalated = callsList.filter((c) => c.outcome === 'escalated').length
      const conversion = totalToday > 0 ? Math.round((booked / totalToday) * 100) : 0
      const avgDuration = callsList.length
        ? Math.round(callsList.reduce((s, c) => s + (c.duration_seconds || 0), 0) / callsList.length)
        : 0

      return {
        totalToday,
        bookedToday: booked,
        missedToday: missed,
        escalatedToday: escalated,
        conversion,
        avgDuration,
        bookingsToday: todayBookings.count || 0,
        recent: recentCalls.data || [],
      }
    },
    refetchInterval: 30_000,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-speedy-accent animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Today</h1>
        <p className="text-sm text-zinc-500 mt-1">
          {formatInTimeZone(new Date(), TIMEZONE, "EEEE, MMMM d 'at' h:mm a 'ET'")}
        </p>
      </div>

      {/* KPI grid — clickable cards filter the Calls page */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          icon={Phone}
          label="Calls today"
          value={kpis.totalToday}
          onClick={() => navigate('/dashboard/calls?range=today')}
        />
        <StatCard
          icon={Calendar}
          label="Bookings today"
          value={kpis.bookingsToday}
          onClick={() => navigate('/dashboard/bookings')}
        />
        <StatCard
          icon={PhoneForwarded}
          label="Escalated today"
          value={kpis.escalatedToday}
          sub={kpis.escalatedToday > 0 ? 'Tap to review' : undefined}
          onClick={() => navigate('/dashboard/calls?outcome=escalated&range=today')}
        />
        <StatCard
          icon={PhoneMissed}
          label="Missed today"
          value={kpis.missedToday}
          onClick={() => navigate('/dashboard/calls?outcome=missed&range=today')}
        />
        <StatCard
          icon={TrendingUp}
          label="Conversion"
          value={`${kpis.conversion}%`}
          sub={`${kpis.bookedToday} of ${kpis.totalToday}`}
        />
      </div>

      {/* Recent calls */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h2 className="text-sm font-semibold text-white">Recent calls</h2>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {kpis.recent.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-zinc-500">
              No calls yet. Once Jess starts answering, calls will appear here.
            </div>
          ) : (
            kpis.recent.map((c) => (
              <div key={c.id} className="px-5 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-medium truncate">
                    {c.caller_name || fmtPhone(c.caller_phone) || 'Unknown'}
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    {c.service_requested || '—'} · {fmtTime(c.started_at)}
                  </div>
                </div>
                <OutcomeBadge outcome={c.outcome} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function OutcomeBadge({ outcome }) {
  const styles = {
    booked: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    escalated: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    missed: 'bg-red-500/10 text-red-400 border-red-500/20',
    abandoned: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    info_only: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    spam: 'bg-zinc-700/30 text-zinc-500 border-zinc-700/40',
    other: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  }
  const cls = styles[outcome] || styles.other
  const label = outcome ? outcome.replace('_', ' ') : 'unknown'
  return (
    <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wide rounded border ${cls}`}>
      {label}
    </span>
  )
}
