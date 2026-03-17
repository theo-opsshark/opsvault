import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'

export default async function Home() {
  const cookieStore = await cookies()
  const auth = cookieStore.get('vault_auth')

  if (!auth || auth.value !== 'true') {
    redirect('/login')
  }

  return <AppShell user={null} />
}
