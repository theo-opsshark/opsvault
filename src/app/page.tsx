import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import DashboardTopBar from '@/components/dashboard/DashboardTopBar'
import WeatherWidget from '@/components/dashboard/WeatherWidget'
import StockWidget from '@/components/dashboard/StockWidget'
import FreshBooksWidget from '@/components/dashboard/FreshBooksWidget'
// import KuberaWidget from '@/components/dashboard/KuberaWidget'
import RecentFilesWidget from '@/components/dashboard/RecentFilesWidget'

function WidgetSkeleton() {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a1a24 0%, #16161e 100%)',
      border: '1px solid #2a2a3e',
      borderRadius: '14px',
      padding: '24px',
      minHeight: '200px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
      <div style={{
        color: '#2a2a3a',
        fontSize: '12px',
        animation: 'pulse-glow 2s ease-in-out infinite',
      }}>
        Loading…
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const auth = cookieStore.get('vault_auth')

  if (!auth || auth.value !== 'true') {
    redirect('/login')
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      background: '#0f0f13',
    }}>
      <DashboardTopBar />

      <main style={{
        flex: 1,
        padding: '32px 28px',
        maxWidth: '1400px',
        width: '100%',
        margin: '0 auto',
        boxSizing: 'border-box',
      }}>
        {/* Hero Section: Title + Quick Stats */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#e2e8f0',
            margin: 0,
            letterSpacing: '-0.03em',
            marginBottom: '8px',
          }}>
            Your Workspace
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#64748b',
            margin: 0,
            fontWeight: '400',
            letterSpacing: '0.01em',
          }}>
            Everything at a glance • Stay focused
          </p>
        </div>

        {/* Smart Grid Layout: 2 rows, 2 columns for top widgets */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '18px',
          marginBottom: '18px',
        }}
          className="dashboard-grid-main"
        >
          {/* Weather takes top-left */}
          <Suspense fallback={<WidgetSkeleton />}>
            <WeatherWidget />
          </Suspense>

          {/* FreshBooks takes top-right */}
          <Suspense fallback={<WidgetSkeleton />}>
            <FreshBooksWidget />
          </Suspense>

          {/* Stocks takes middle-right */}
          <Suspense fallback={<WidgetSkeleton />}>
            <StockWidget />
          </Suspense>
        </div>

        {/* Recent Files: Full width */}
        <Suspense fallback={<WidgetSkeleton />}>
          <RecentFilesWidget />
        </Suspense>
      </main>

      <style>{`
        @media (max-width: 1024px) {
          .dashboard-grid-main {
            grid-template-columns: 1fr 1fr !important;
          }
        }

        @media (max-width: 768px) {
          .dashboard-grid-main {
            grid-template-columns: 1fr !important;
          }
          
          main {
            padding: 28px 20px !important;
          }
        }
      `}</style>
    </div>
  )
}
