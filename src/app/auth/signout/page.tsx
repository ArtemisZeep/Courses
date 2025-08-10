'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut as signOutClient } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import styles from './page.module.css'

export default function SignOutPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    console.log('[SignOut] Page mounted. Session status:', status)
    console.log('[SignOut] Current session:', session)
    fetch('/api/auth/session')
      .then(async (r) => {
        console.log('[SignOut] /api/auth/session before signout ->', r.status)
        try {
          const j = await r.json()
          console.log('[SignOut] session payload:', j)
        } catch (e) {
          console.warn('[SignOut] Failed to parse session JSON before signout')
        }
      })
      .catch((e) => console.error('[SignOut] Failed to fetch session before signout', e))
  }, [status, session])

  const handleCancel = () => {
    console.log('[SignOut] Cancel clicked. Redirecting to /dashboard')
    try {
      router.push('/dashboard')
    } catch (e) {
      console.error('[SignOut] Cancel navigation error:', e)
    }
  }

  const handleSignOut = async () => {
    if (busy) return
    setBusy(true)
    console.log('[SignOut] Sign out clicked. Starting signOutClient...')
    try {
      await signOutClient({ callbackUrl: '/' })
      console.log('[SignOut] signOutClient request sent. Browser should redirect soon.')
    } catch (e) {
      console.error('[SignOut] signOutClient error:', e)
      setBusy(false)
    } finally {
      // Best-effort: log session after attempt
      fetch('/api/auth/session')
        .then(async (r) => {
          console.log('[SignOut] /api/auth/session after signout ->', r.status)
          try {
            const j = await r.json()
            console.log('[SignOut] session after payload:', j)
          } catch (e) {
            console.warn('[SignOut] Failed to parse session JSON after signout')
          }
        })
        .catch((e) => console.error('[SignOut] Failed to fetch session after signout', e))
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <h1 className={styles.title}>Выйти из аккаунта</h1>
        <p className={styles.subtitle}>Вы уверены, что хотите выйти?</p>

        <div className={styles.actions}>
          <Button onClick={handleSignOut} disabled={busy} className={styles.btn}>
            {busy ? 'Выходим...' : 'Выйти'}
          </Button>
          <Button onClick={handleCancel} variant="outline" className={styles.btn}>
            Отмена
          </Button>
        </div>
        <div className={styles.meta}>
          <div>Статус сессии: {status}</div>
          <div>Пользователь: {session?.user?.email || '—'}</div>
        </div>
      </div>
    </div>
  )
}


