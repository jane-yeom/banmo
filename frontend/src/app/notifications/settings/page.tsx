'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SubHeader from '@/components/layout/SubHeader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import apiClient from '@/lib/axios';
import { useAuthStore } from '@/store/auth.store';
import { requestNotificationPermission } from '@/lib/firebase';
import {
  IconChat, IconNewApplicant, IconResult,
  IconKeyword, IconComment, IconFavorite, IconNotice,
} from '@/components/common/SectionIcons';

interface NotificationSettings {
  chatMessage: boolean;
  application: boolean;
  applicationStatus: boolean;
  keyword: boolean;
  comment: boolean;
  favoritePost: boolean;
  system: boolean;
  notice: boolean;
  pushEnabled: boolean;
}

function NotifRow({
  icon,
  bg,
  title,
  sub,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  bg: string;
  title: string;
  sub: string;
  value: boolean;
  onChange: () => void;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      gap: 12, padding: '14px 0',
      borderBottom: '0.5px solid #F7F4ED',
    }}>
      <div style={{
        width: 40, height: 40,
        background: bg, borderRadius: 11,
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#1A1A1A', marginBottom: 2 }}>
          {title}
        </div>
        <div style={{ fontSize: 12, color: '#888' }}>
          {sub}
        </div>
      </div>
      <div
        onClick={onChange}
        style={{
          width: 44, height: 24,
          background: value ? '#1C1C1C' : '#E8E4DC',
          borderRadius: 12, position: 'relative',
          cursor: 'pointer', transition: 'background 0.2s',
          flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute',
          width: 18, height: 18,
          background: 'white',
          borderRadius: '50%',
          top: 3,
          right: value ? 3 : 'auto',
          left: value ? 'auto' : 3,
          transition: 'all 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        }} />
      </div>
    </div>
  );
}

export default function NotificationSettingsPage() {
  const { user, isRestoring } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted || isRestoring) return;
    if (!user) router.replace('/login');
  }, [mounted, isRestoring, user, router]);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['notificationSettings'],
    queryFn: () =>
      apiClient.get<NotificationSettings>('/notifications/settings').then((r) => r.data),
    enabled: !!user,
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<NotificationSettings>) =>
      apiClient.patch('/notifications/settings', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notificationSettings'] });
      toast.success('알림 설정이 저장되었습니다');
    },
    onError: () => toast.error('저장에 실패했습니다'),
  });

  const toggle = (key: keyof NotificationSettings) => {
    if (!settings) return;
    updateMutation.mutate({ [key]: !settings[key] });
  };

  if (!user) return null;

  return (
    <>
      <SubHeader title="알림 설정" />

      <div style={{ maxWidth: 512, margin: '0 auto', padding: '8px 16px 40px' }}>
        {/* 푸시알림 권한 요청 버튼 */}
        <div style={{
          background: '#F0EDE6', borderRadius: 14, padding: '14px 16px',
          marginBottom: 16, marginTop: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1C1C1C', marginBottom: 2 }}>푸시 알림</div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>앱 종료 시에도 알림을 받습니다</div>
          </div>
          <button
            onClick={async () => {
              const token = await requestNotificationPermission();
              if (token) {
                await apiClient.post('/notifications/fcm-token', { token }).catch(() => {});
                toast.success('푸시 알림이 활성화됐습니다');
              } else {
                toast.error('알림 권한을 허용해주세요\n(설정 → Safari → 알림 허용)');
              }
            }}
            style={{
              padding: '8px 16px', background: '#1C1C1C', color: 'white',
              border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            알림 허용
          </button>
        </div>
        <p style={{ fontSize: 13, color: '#888', margin: '0 0 4px' }}>받고 싶은 알림을 선택하세요</p>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} style={{ height: 64, borderRadius: 12, background: '#F3F4F6' }} />
            ))}
          </div>
        ) : settings ? (
          <div>
            <NotifRow
              icon={<IconChat />} bg="#EAF6EF"
              title="채팅 메시지" sub="새 채팅 메시지가 왔을 때"
              value={settings.chatMessage} onChange={() => toggle('chatMessage')}
            />
            <NotifRow
              icon={<IconNewApplicant />} bg="#F0EDE6"
              title="새 지원자" sub="내 공고에 지원자가 생겼을 때"
              value={settings.application} onChange={() => toggle('application')}
            />
            <NotifRow
              icon={<IconResult />} bg="#F0EDE6"
              title="지원 결과" sub="지원한 공고의 합/불합격 결과"
              value={settings.applicationStatus} onChange={() => toggle('applicationStatus')}
            />
            <NotifRow
              icon={<IconKeyword />} bg="#F3EAF8"
              title="키워드 알림" sub="등록한 키워드가 포함된 공고 등록 시"
              value={settings.keyword} onChange={() => toggle('keyword')}
            />
            <NotifRow
              icon={<IconComment />} bg="#EAF6EF"
              title="댓글 알림" sub="내 게시글에 댓글이 달렸을 때"
              value={settings.comment} onChange={() => toggle('comment')}
            />
            <NotifRow
              icon={<IconFavorite />} bg="#F0EDE6"
              title="찜한 공고 업데이트" sub="찜한 공고가 수정됐을 때"
              value={settings.favoritePost} onChange={() => toggle('favoritePost')}
            />
            <NotifRow
              icon={<IconNotice />} bg="#FEF6E4"
              title="공지사항" sub="새 공지사항이 등록됐을 때"
              value={settings.notice} onChange={() => toggle('notice')}
            />
          </div>
        ) : null}
      </div>
    </>
  );
}
