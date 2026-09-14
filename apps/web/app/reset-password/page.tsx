import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ResetPasswordView } from '../../src/components/ResetPasswordView'

// Guard: this page only makes sense with a recovery session. Reading cookies()
// forces dynamic rendering; without an sb-* auth cookie (expired or used link)
// the visitor is bounced to the request form before any reset UI renders.
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Set Password — MyFinanceOS',
  description: 'Set a new password for your MyFinanceOS account.',
  robots: { index: false, follow: false },
}

export default async function ResetPasswordPage() {
  const cookieStore = await cookies()
  const hasAuthCookie = cookieStore.getAll().some((c) => c.name.startsWith('sb-'))

  if (!hasAuthCookie) {
    redirect('/forgot-password')
  }

  return <ResetPasswordView />
}
