import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-7xl font-bold text-white mb-4">404</h1>
        <p className="text-zinc-400 mb-8">This page doesn't exist.</p>
        <Link
          to="/dashboard"
          className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-speedy-accent to-speedy-accent2 text-white font-medium"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
