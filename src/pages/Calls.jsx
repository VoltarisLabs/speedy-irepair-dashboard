import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Phone, Loader2, X, Play, FileText, Search } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { fmtDateTime, fmtDuration, fmtPhone } from '../lib/format'

const RANGES = [
  { id: 'today', label: 'Today', days: 1 },
  { id: '7d', label: '7 days', days: 7 },
  { id: '30d', label: '30 days', days: 30 },
  { id: 'all', label: 'All', days: null },
]

function rangeStart(range) {
  if (range === 'all') return null
  const r = RANGES.find((x) => x.id === range)
  if (!r || r.days === null) return null
  if (r.id === 'today') {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d.toISOString()
  }
  return new Date(Date.now() - r.days * 24 * 60 * 60 * 1000).toISOString()
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
  return (
    <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wide rounded border ${cls}`}>
      {outcome ? outcome.replace('_', ' ') : 'unknown'}
    </span>
  )
}

export default function Calls() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filter, setFilter] = useState(searchParams.get('outcome') || 'all')
  const [range, setRange] = useState(searchParams.get('range') || '7d')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(searchParams.get('call') || null)

  // Sync filter/range to URL so click-throughs from Overview persist
  useEffect(() => {
    const next = new URLSearchParams(searchParams)
    if (filter === 'all') next.delete('outcome')
    else next.set('outcome', filter)
    if (range === '7d') next.delete('range')
    else next.set('range', range)
    setSearchParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, range])

  const { data: calls, isLoading } = useQuery({
    queryKey: ['calls-list', filter, range],
    queryFn: async () => {
      let q = supabase
        .from('calls')
        .select('id, retell_call_id, channel, started_at, ended_at, duration_seconds, caller_phone, caller_name, outcome, service_requested, summary')
        .order('started_at', { ascending: false })
        .limit(200)
      if (filter !== 'all') q = q.eq('outcome', filter)
      const start = rangeStart(range)
      if (start) q = q.gte('started_at', start)
      const { data, error } = await q
      if (error) throw error
      return data || []
    },
    refetchInterval: 30_000,
  })

  // Client-side filter by search digits — match against phone + name
  const filtered = useMemo(() => {
    if (!calls) return []
    const q = search.trim().toLowerCase()
    if (!q) return calls
    const digits = q.replace(/\D/g, '')
    return calls.filter((c) => {
      const phoneDigits = (c.caller_phone || '').replace(/\D/g, '')
      const nameMatch = (c.caller_name || '').toLowerCase().includes(q)
      const phoneMatch = digits && phoneDigits.includes(digits)
      const summaryMatch = (c.summary || c.service_requested || '').toLowerCase().includes(q)
      return nameMatch || phoneMatch || summaryMatch
    })
  }, [calls, search])

  const { data: detail } = useQuery({
    queryKey: ['call-detail', selectedId],
    enabled: !!selectedId,
    queryFn: async () => {
      const { data } = await supabase
        .from('calls')
        .select('*')
        .eq('id', selectedId)
        .maybeSingle()
      return data
    },
  })

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Calls</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {filtered.length} {filtered.length === 1 ? 'call' : 'calls'}
            {search && ' matching search'}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
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
          <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs">
            {['all', 'booked', 'escalated', 'missed', 'abandoned'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-colors ${
                  filter === f ? 'bg-speedy-accent/15 text-white' : 'text-zinc-500 hover:text-zinc-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by phone, name, or service..."
          className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-speedy-accent/40"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-7 h-7 text-speedy-accent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-12 text-center">
          <Phone className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
          <p className="text-sm text-zinc-400">
            {search || filter !== 'all' || range !== '7d' ? 'No calls match your filters.' : 'No calls yet.'}
          </p>
          <p className="text-xs text-zinc-600 mt-1">
            {search ? 'Try a different search term.' : 'Calls will appear here as Jess answers them.'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl overflow-hidden">
          <div className="divide-y divide-white/[0.04]">
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className="w-full px-5 py-3.5 flex items-center gap-4 hover:bg-white/[0.03] transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center">
                  <Phone className="w-4 h-4 text-zinc-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-medium truncate">
                    {c.caller_name || fmtPhone(c.caller_phone) || 'Unknown caller'}
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5 truncate">
                    {c.service_requested || c.summary || 'No summary'}
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <div className="text-xs text-zinc-400">{fmtDateTime(c.started_at)}</div>
                  <div className="text-[11px] text-zinc-600 mt-0.5">{fmtDuration(c.duration_seconds)} · {c.channel}</div>
                </div>
                <OutcomeBadge outcome={c.outcome} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Detail drawer */}
      {selectedId && (
        <CallDetail call={detail} onClose={() => setSelectedId(null)} />
      )}
    </div>
  )
}

function CallDetail({ call, onClose }) {
  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-[#0a0a0f] border-l border-white/[0.06] overflow-y-auto">
        <div className="sticky top-0 z-10 px-5 py-4 flex items-center justify-between border-b border-white/[0.06] bg-[#0a0a0f]/95 backdrop-blur-xl">
          <h3 className="text-sm font-semibold text-white">Call detail</h3>
          <button onClick={onClose} className="p-2 -mr-2 text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!call ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-speedy-accent animate-spin" />
          </div>
        ) : (
          <div className="p-5 space-y-5">
            <div>
              <div className="text-lg font-semibold text-white">
                {call.caller_name || fmtPhone(call.caller_phone) || 'Unknown caller'}
              </div>
              <div className="text-xs text-zinc-500 mt-1">
                {fmtDateTime(call.started_at)} · {fmtDuration(call.duration_seconds)} · {call.channel}
              </div>
              <div className="mt-2"><OutcomeBadge outcome={call.outcome} /></div>
            </div>

            {call.summary && (
              <Section title="Summary" icon={FileText}>
                <p className="text-sm text-zinc-300 leading-relaxed">{call.summary}</p>
              </Section>
            )}

            {call.service_requested && (
              <Section title="Service requested">
                <p className="text-sm text-zinc-300">{call.service_requested}</p>
              </Section>
            )}

            {call.recording_url && (
              <Section title="Recording" icon={Play}>
                <audio controls className="w-full" src={call.recording_url} />
              </Section>
            )}

            {Array.isArray(call.transcript) && call.transcript.length > 0 && (
              <Section title="Transcript">
                <div className="space-y-2.5 max-h-96 overflow-y-auto pr-2">
                  {call.transcript.map((turn, i) => (
                    <div key={i} className="text-sm">
                      <div className="text-[10px] uppercase tracking-wide text-zinc-500 mb-0.5">
                        {turn.role === 'agent' ? 'Jess' : 'Caller'}
                      </div>
                      <div className={`rounded-xl px-3 py-2 ${
                        turn.role === 'agent'
                          ? 'bg-speedy-accent/[0.08] text-zinc-200'
                          : 'bg-white/[0.03] text-zinc-300'
                      }`}>
                        {turn.content}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>
        )}
      </div>
    </>
  )
}

function Section({ title, icon: Icon, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon className="w-3.5 h-3.5 text-zinc-500" />}
        <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 font-semibold">{title}</div>
      </div>
      {children}
    </div>
  )
}
