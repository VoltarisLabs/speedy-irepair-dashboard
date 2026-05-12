import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Phone, Calendar, MessageSquare, Settings, LogOut, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useTenant } from '../hooks/useTenant'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/dashboard/calls', icon: Phone, label: 'Calls' },
  { to: '/dashboard/bookings', icon: Calendar, label: 'Bookings' },
  { to: '/dashboard/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const navigate = useNavigate()
  const { data: profile } = useTenant()

  const company = profile?.tenant?.company_name || 'Speedy iRepair'
  const email = profile?.email || ''

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const content = (isMobile = false) => {
    const compact = collapsed && !isMobile
    return (
      <div className="flex flex-col h-full">
        {/* Brand */}
        <div className={`flex items-center h-16 border-b border-white/[0.06] flex-shrink-0 ${compact ? 'justify-center' : 'justify-between px-5'}`}>
          {!compact ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center ring-1 ring-white/10 overflow-hidden">
                <img src="/logo.png" alt="Speedy iRepair" className="w-full h-full object-contain p-0.5" />
              </div>
              <div>
                <div className="text-[14px] font-bold text-white tracking-tight">Speedy iRepair</div>
                <div className="text-[10px] text-zinc-500 font-medium">Dashboard</div>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center ring-1 ring-white/10 overflow-hidden">
              <img src="/logo.png" alt="Speedy iRepair" className="w-full h-full object-contain p-0.5" />
            </div>
          )}
          {isMobile && (
            <button onClick={() => setMobileOpen(false)} className="p-2 text-zinc-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className={`flex-1 py-4 ${compact ? 'px-2' : 'px-3'}`}>
          {!compact && (
            <p className="px-3 mb-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.18em]">Main</p>
          )}
          <div className="space-y-0.5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `group relative flex items-center rounded-xl text-sm font-medium transition-all ${
                    compact ? 'w-10 h-10 justify-center' : 'gap-3 px-3 py-2.5'
                  } ${
                    isActive
                      ? 'bg-speedy-accent/[0.10] text-white'
                      : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]'
                  }`
                }
              >
                <item.icon className="w-[17px] h-[17px] flex-shrink-0" />
                {!compact && <span>{item.label}</span>}
                {compact && (
                  <div className="absolute left-full ml-3 px-3 py-1.5 rounded-lg bg-[#111119] border border-white/10 text-[11px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                    {item.label}
                  </div>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Collapse */}
        <div className="hidden lg:block px-3 py-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`flex items-center justify-center rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] transition-all ${
              compact ? 'w-10 h-10 mx-auto' : 'w-full gap-2 px-3 py-2'
            }`}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {!compact && <span className="text-xs">Collapse</span>}
          </button>
        </div>

        {/* User */}
        <div className={`border-t border-white/[0.06] ${compact ? 'px-2 py-3' : 'px-3 py-3'}`}>
          <div className={`flex items-center gap-3 ${compact ? 'justify-center' : ''}`}>
            <div className="w-9 h-9 rounded-xl bg-white border border-white/10 flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="Speedy iRepair" className="w-full h-full object-contain p-0.5" />
            </div>
            {!compact && (
              <>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-zinc-200 truncate">{company}</div>
                  <div className="text-[11px] text-zinc-500 truncate">{email}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Desktop */}
      <aside
        className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-40 bg-[#0a0a0f]/85 backdrop-blur-2xl border-r border-white/[0.06] transition-[width] duration-200"
        style={{ width: collapsed ? 72 : 260 }}
      >
        {content()}
      </aside>

      {/* Mobile */}
      {mobileOpen && (
        <>
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          />
          <aside className="fixed left-0 top-0 bottom-0 z-50 w-[260px] bg-[#0a0a0f]/95 backdrop-blur-2xl border-r border-white/[0.06] lg:hidden">
            {content(true)}
          </aside>
        </>
      )}
    </>
  )
}
