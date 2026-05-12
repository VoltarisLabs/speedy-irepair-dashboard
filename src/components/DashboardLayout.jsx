import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'
import { useTenant } from '../hooks/useTenant'

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024)
  const { data: profile } = useTenant()

  useEffect(() => {
    let timer
    const handler = () => {
      clearTimeout(timer)
      timer = setTimeout(() => setIsDesktop(window.innerWidth >= 1024), 120)
    }
    window.addEventListener('resize', handler)
    return () => { clearTimeout(timer); window.removeEventListener('resize', handler) }
  }, [])

  const sidebarWidth = isDesktop ? (collapsed ? 72 : 260) : 0

  return (
    <div className="min-h-screen bg-[#050508] relative">
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[300px] -left-[200px] w-[600px] h-[600px] rounded-full bg-speedy-accent/[0.06] blur-[120px]" />
        <div className="absolute -bottom-[200px] -right-[200px] w-[500px] h-[500px] rounded-full bg-speedy-accent2/[0.04] blur-[120px]" />
      </div>

      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div
        className="relative z-10 flex flex-col min-h-screen transition-[margin] duration-200"
        style={{ marginLeft: sidebarWidth }}
      >
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-4 border-b border-white/[0.06] bg-[#050508]/85 backdrop-blur-xl">
          <button onClick={() => setMobileOpen(true)} className="p-2 -ml-2 text-zinc-300 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <div className="text-sm font-semibold text-white">
            {profile?.tenant?.company_name || 'Speedy iRepair'}
          </div>
          <div className="w-9" />
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
