'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import { useAuthStore } from '@/store/auth.store'
import { useNotificationStore, AppNotification } from '@/store/notification.store'
import { useMarkAsRead, useMarkAllAsRead } from '@/hooks/useNotifications'
import SubHeader from '@/components/layout/SubHeader'
import { Bell, MessageCircle, Send, Heart, Megaphone, Key, CheckCircle } from 'lucide-react'

const getIcon = (type: string) => {
  switch (type) {
    case 'CHAT_MESSAGE':        return <MessageCircle size={18} color="#1C1C1C" strokeWidth={1.8} />
    case 'APPLICATION':         return <Send size={18} color="#5AAB7A" strokeWidth={1.8} />
    case 'APPLICATION_STATUS':  return <CheckCircle size={18} color="#5AAB7A" strokeWidth={1.8} />
    case 'KEYWORD':             return <Key size={18} color="#D4A03A" strokeWidth={1.8} />
    case 'COMMENT':             return <MessageCircle size={18} color="#6A8FD4" strokeWidth={1.8} />
    case 'FAVORITE_POST':       return <Heart size={18} color="#EF4444" strokeWidth={1.8} />
    case 'NOTICE':              return <Megaphone size={18} color="#A06EC0" strokeWidth={1.8} />
    default:                    return <Bell size={18} color="#9CA3AF" strokeWidth={1.8} />
  }
}

const getBg = (type: string) => {
  switch (type) {
    case 'CHAT_MESSAGE':       return '#F0EDE6'
    case 'APPLICATION':        return '#EAF6EF'
    case 'APPLICATION_STATUS': return '#EAF6EF'
    case 'KEYWORD':            return '#FEF6E4'
    case 'COMMENT':            return '#EAF0FB'
    case 'FAVORITE_POST':      return '#FEF2F2'
    case 'NOTICE':             return '#F3EAF8'
    default:                   return '#F7F4ED'
  }
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const min  = Math.floor(diff / 60000)
  const hour = Math.floor(diff / 3600000)
  const day  = Math.floor(diff / 86400000)
  if (min < 1)  return '방금'
  if (min < 60) return `${min}분 전`
  if (hour < 24) return `${hour}시간 전`
  return `${day}일 전`
}

export default function NotificationsPage() {
  const router = useRouter()
  const { isLoggedIn, user } = useAuthStore()
  const { notifications, unreadCount, setNotifications } = useNotificationStore()
  const markAsRead    = useMarkAsRead()
  const markAllAsRead = useMarkAllAsRead()

  useEffect(() => {
    if (!isLoggedIn) router.replace('/login')
  }, [isLoggedIn, router])

  const { isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await apiClient.get<{
        notifications: AppNotification[]
        unreadCount: number
      }>('/notifications')
      return res.data
    },
    enabled: !!user,
    staleTime: 30_000,
  })

  useEffect(() => {
    if (!isLoading) return
  }, [isLoading, setNotifications])

  const handleRead = (notif: AppNotification) => {
    if (!notif.isRead) markAsRead.mutate(notif.id)
    if (notif.link)   router.push(notif.link)
  }

  // CHAT_MESSAGE는 같은 채팅방(link) 기준으로 최신 1개만 표시
  const deduplicatedNotifications = notifications.reduce<AppNotification[]>((acc, notif) => {
    if (notif.type === 'CHAT_MESSAGE' && notif.link) {
      const exists = acc.find(n => n.type === 'CHAT_MESSAGE' && n.link === notif.link);
      if (!exists) acc.push(notif); // 이미 최신순 정렬돼 있으므로 첫 번째만 유지
    } else {
      acc.push(notif);
    }
    return acc;
  }, [])

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', background: 'white', minHeight: '100vh' }}>
      <SubHeader
        title="알림"
        rightElement={
          unreadCount > 0 ? (
            <button
              onClick={() => markAllAsRead.mutate()}
              style={{
                background: 'none', border: 'none',
                color: '#1C1C1C', fontSize: 13,
                fontWeight: 600, cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              전체 읽음
            </button>
          ) : undefined
        }
      />

      {isLoading ? (
        <div style={{ padding: '20px 16px' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{
              display: 'flex', gap: 12, padding: '14px 0',
              borderBottom: '0.5px solid #F4F3F9',
            }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#F4F3F9' }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: 14, width: '60%', background: '#F4F3F9', borderRadius: 6, marginBottom: 6 }} />
                <div style={{ height: 12, width: '80%', background: '#F4F3F9', borderRadius: 6 }} />
              </div>
            </div>
          ))}
        </div>
      ) : deduplicatedNotifications.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '80px 20px', textAlign: 'center',
        }}>
          <Bell size={48} color="#E8E4DC" strokeWidth={1.2} />
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A', marginTop: 16, marginBottom: 6 }}>
            알림이 없어요
          </div>
          <div style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.6 }}>
            새로운 지원자나 채팅이 오면<br />여기서 확인할 수 있어요
          </div>
        </div>
      ) : (
        <div style={{ padding: '0 16px' }}>
          {deduplicatedNotifications.map(notif => (
            <div
              key={notif.id}
              onClick={() => handleRead(notif)}
              style={{
                display: 'flex', alignItems: 'flex-start',
                gap: 12, padding: '14px 0',
                borderBottom: '0.5px solid #F7F4ED',
                cursor: notif.link ? 'pointer' : 'default',
                background: notif.isRead ? 'white' : '#FAFAF8',
                transition: 'background 0.15s',
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: getBg(notif.type),
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0,
              }}>
                {getIcon(notif.type)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 14,
                  fontWeight: notif.isRead ? 400 : 700,
                  color: '#1A1A1A', marginBottom: 3, lineHeight: 1.4,
                }}>
                  {notif.title}
                </div>
                <div style={{
                  fontSize: 13, color: '#555555',
                  lineHeight: 1.5, marginBottom: 4,
                  overflow: 'hidden', textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                } as React.CSSProperties}>
                  {notif.body}
                </div>
                <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                  {timeAgo(notif.createdAt)}
                </div>
              </div>

              {!notif.isRead && (
                <div style={{
                  width: 8, height: 8,
                  borderRadius: '50%',
                  background: '#1C1C1C',
                  flexShrink: 0, marginTop: 4,
                }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
