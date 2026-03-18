import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import VaultClient from '@/components/VaultClient'

export default async function VaultPage() {
  const cookieStore = await cookies()
  const auth = cookieStore.get('vault_auth')

  if (!auth || auth.value !== 'true') {
    redirect('/login')
  }

  return <VaultClient user={null} />
}
