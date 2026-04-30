'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import apiClient from '@/lib/axios';
import { useAuthStore } from '@/store/auth.store';

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

const SETTINGS_ITEMS = [
  { key: 'chatMessage',       icon: '💬', label: '채팅 메시지',         desc: '새 채팅 메시지가 왔을 때' },
  { key: 'application',       icon: '📝', label: '새 지원자',           desc: '내 공고에 지원자가 생겼을 때' },
  { key: 'applicationStatus', icon: '🎉', label: '지원 결과',           desc: '지원한 공고의 합/불합격 결과' },
  { key: 'keyword',           icon: '🔍', label: '키워드 알림',         desc: '등록한 키워드가 포함된 공고 등록 시' },
  { key: 'comment',           icon: '💭', label: '댓글 알림',           desc: '내 게시글에 댓글이 달렸을 때' },
  { key: 'favoritePost',      icon: '⭐', label: '찜한 공고 업데이트',  desc: '찜한 공고가 수정됐을 때' },
  { key: 'notice',            icon: '📢', label: '공지사항',            desc: '새 공지사항이 등록됐을 때' },
] as const;

export default function NotificationSettingsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();

  useEffect(() => {
    if (!user) router.replace('/login');
  }, [user, router]);

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

  const handleToggle = (key: string, value: boolean) => {
    updateMutation.mutate({ [key]: value });
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="mb-4 text-sm text-gray-400 hover:text-gray-600"
        >
          ← 뒤로
        </button>
        <h1 className="text-2xl font-bold text-gray-900">알림 설정</h1>
        <p className="mt-1 text-sm text-gray-500">받고 싶은 알림을 선택하세요</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {SETTINGS_ITEMS.map(({ key, icon, label, desc }) => (
            <div
              key={key}
              className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{icon}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                </div>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={settings?.[key] ?? true}
                  onChange={(e) => handleToggle(key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600" />
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
