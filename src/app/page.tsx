import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import DashboardTopBar from '@/components/dashboard/DashboardTopBar'
import WeatherWidget from '@/components/dashboard/WeatherWidget'
import StockWidget from '@/components/dashboard/StockWidget'
import FreshBooksWidget from '@/components/dashboard/FreshBooksWidget'
import RecentFilesWidget from '@/components/dashboard/RecentFilesWidget'

function WidgetSkeleton() {
  return (
    <div style={{
      background: '#16161e',
      border: '1px solid #2a2a3a',
      borderRadius: '12px',
      padding: '20px',
      minHeight: '160px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ color: '#2a2a3a', fontSize: '12px' }}>Loading…</div>
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
        padding: '28px 24px',
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto',
        boxSizing: 'border-box',
      }}>
        {/* Page title */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{
            fontSize: '22px',
            fontWeight: '600',
            color: '#e2e8f0',
            margin: 0,
            letterSpacing: '-0.02em',
          }}>
            Dashboard
          </h1>
          <p style={{ fontSize: '13px', color: '#4a4a6a', margin: '4px 0 0' }}>
            Good day, Travis. Here&apos;s what&apos;s going on.
          </p>
        </div>

        {/* Row 1: 3-col grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
          marginBottom: '16px',
        }}
          className="dashboard-grid-row1"
        >
          <Suspense fallback={<WidgetSkeleton />}>
            <WeatherWidget />
          </Suspense>
          <Suspense fallback={<WidgetSkeleton />}>
            <FreshBooksWidget />
          </Suspense>
          <Suspense fallback={<WidgetSkeleton />}>
            <StockWidget />
          </Suspense>
        </div>

        {/* Row 2: Full width */}
        <Suspense fallback={<WidgetSkeleton />}>
          <RecentFilesWidget />
        </Suspense>
      </main>

      <style>{`
        @media (max-width: 768px) {
          .dashboard-grid-row1 {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
