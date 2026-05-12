import { useEffect, useState, useRef } from 'react'
import { MessageSquare, Send, RefreshCw, ArrowLeft, Phone } from 'lucide-react'

const API_URL = 'https://n8n.srv1236458.hstgr.cloud/webhook/speedy-messages'

function relTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const diffMs = Date.now() - d.getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

async function api(body) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('API error ' + res.status)
  return res.json()
}

export default function Messages() {
  const [threads, setThreads] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [thread, setThread] = useState(null)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const bottomRef = useRef(null)

  async function loadThreads() {
    setLoading(true)
    setError(null)
    try {
      const data = await api({ action: 'list_threads' })
      setThreads(data.threads || [])
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  async function loadThread(leadId) {
    setSelectedId(leadId)
    setThread(null)
    try {
      const data = await api({ action: 'get_thread', lead_id: leadId })
      setThread(data)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 60)
    } catch (e) {
      setError(e.message)
    }
  }

  async function sendReply() {
    if (!reply.trim() || !thread?.lead?.phone) return
    setSending(true)
    try {
      await api({
        action: 'send_reply',
        lead_id: thread.lead.id,
        to_phone: thread.lead.phone,
        text: reply.trim(),
      })
      setReply('')
      await loadThread(thread.lead.id)
    } catch (e) {
      setError('Send failed: ' + e.message)
    }
    setSending(false)
  }

  useEffect(() => {
    loadThreads()
  }, [])

  return (
    <div className="flex h-[calc(100vh-64px)] -mx-4 sm:-mx-6 lg:-mx-8">
      {/* THREAD LIST */}
      <div className={`${selectedId ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-[340px] border-r border-white/[0.06] bg-[#0a0a0f]/40`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div>
            <h2 className="text-[15px] font-bold text-white">Messages</h2>
            <p className="text-[11px] text-zinc-500">{threads.length} customer{threads.length === 1 ? '' : 's'}</p>
          </div>
          <button
            onClick={loadThreads}
            className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && threads.length === 0 && (
            <div className="px-5 py-8 text-center text-[12px] text-zinc-500">Loading...</div>
          )}
          {!loading && threads.length === 0 && (
            <div className="px-5 py-12 text-center">
              <MessageSquare className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
              <p className="text-[12px] text-zinc-500">No customer conversations yet.</p>
              <p className="text-[11px] text-zinc-600 mt-1">Bookings will appear here as they come in.</p>
            </div>
          )}
          {threads.map((t) => (
            <button
              key={t.id}
              onClick={() => loadThread(t.id)}
              className={`w-full text-left px-5 py-3 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors ${
                selectedId === t.id ? 'bg-speedy-accent/[0.08]' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-[13px] font-semibold text-zinc-100 truncate">
                      {(t.display_name || 'Customer').replace(/\s*\(Speedy\)\s*$/, '')}
                    </div>
                    {t.source && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wide whitespace-nowrap ${
                        t.source === 'Voice Call'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/20'
                          : 'bg-speedy-accent/15 text-speedy-accent border border-speedy-accent/20'
                      }`}>
                        {t.source === 'Voice Call' ? 'voice' : 'chat'}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3" />
                    {t.phone || 'No phone'}
                  </div>
                </div>
                <div className="text-[10px] text-zinc-600 flex-shrink-0">{relTime(t.date_updated)}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* THREAD VIEW */}
      <div className={`${selectedId ? 'flex' : 'hidden md:flex'} flex-col flex-1 bg-[#0a0a0f]/20`}>
        {!thread && selectedId && (
          <div className="flex-1 flex items-center justify-center text-[12px] text-zinc-500">Loading thread...</div>
        )}
        {!selectedId && (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
            <MessageSquare className="w-10 h-10 text-zinc-700 mb-3" />
            <p className="text-[13px]">Select a customer to view conversation</p>
          </div>
        )}
        {thread && (
          <>
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
              <button
                onClick={() => { setSelectedId(null); setThread(null) }}
                className="md:hidden p-1 rounded text-zinc-400 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-speedy-accent/30 to-speedy-accent2/30 flex items-center justify-center text-[12px] font-bold text-white">
                {((thread.lead.display_name || 'C').replace(/\s*\(Speedy\)\s*$/, '').match(/\b\w/g) || ['?']).slice(0, 2).join('').toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold text-white truncate">
                  {(thread.lead.display_name || 'Customer').replace(/\s*\(Speedy\)\s*$/, '')}
                </div>
                <div className="text-[11px] text-zinc-500 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {thread.lead.phone || 'no phone'}
                </div>
              </div>
              <button
                onClick={() => loadThread(thread.lead.id)}
                className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {(thread.messages || []).length === 0 && (
                <div className="text-center text-[12px] text-zinc-500 py-8">No messages yet.</div>
              )}
              {(thread.messages || []).map((m) => {
                const outgoing = m.direction === 'outbound'
                const failed = m.status === 'error'
                return (
                  <div key={m.id} className={`flex ${outgoing ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[75%]">
                      <div
                        className={`px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                          outgoing
                            ? failed
                              ? 'bg-red-500/15 border border-red-500/30 text-red-200 rounded-tr-md'
                              : 'bg-gradient-to-br from-speedy-accent to-speedy-accent2 text-white rounded-tr-md'
                            : 'bg-white/[0.06] border border-white/[0.06] text-zinc-100 rounded-tl-md'
                        }`}
                      >
                        {m.text}
                      </div>
                      <div className="flex items-center gap-2 mt-1 px-1">
                        <span className="text-[10px] text-zinc-600">
                          {outgoing ? 'You' : 'Customer'} · {relTime(m.sent_at)}
                        </span>
                        {failed && <span className="text-[10px] text-red-400">failed</span>}
                        {!failed && outgoing && m.status && <span className="text-[10px] text-zinc-600">{m.status}</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* Reply Box */}
            <div className="border-t border-white/[0.06] px-4 py-3 bg-[#0a0a0f]/60">
              {error && <div className="text-[11px] text-red-400 mb-2">{error}</div>}
              <div className="flex gap-2 items-end">
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendReply()
                    }
                  }}
                  placeholder="Type your reply..."
                  rows={1}
                  className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-xl px-3.5 py-2.5 text-[13px] text-white placeholder-zinc-600 focus:outline-none focus:border-speedy-accent/40 resize-none max-h-24"
                />
                <button
                  onClick={sendReply}
                  disabled={!reply.trim() || sending}
                  className="bg-gradient-to-br from-speedy-accent to-speedy-accent2 text-white rounded-xl w-10 h-10 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity flex-shrink-0"
                >
                  {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-zinc-600 mt-2 px-1">
                Replies go through Close CRM as SMS to {thread.lead.phone || 'this customer'}. Press Enter to send, Shift+Enter for newline.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
