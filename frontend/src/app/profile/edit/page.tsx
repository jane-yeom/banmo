'use client';

import { useState, useEffect, useRef, useCallback, DragEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import apiClient from '@/lib/axios';
import { useAuthStore } from '@/store/auth.store';
import { User } from '@/types';
import { useToast } from '@/hooks/useToast';
import ToastContainer from '@/components/common/Toast';
import { uploadImage } from '@/lib/upload';

const INSTRUMENTS = [
  '피아노', '바이올린', '비올라', '첼로', '콘트라베이스',
  '플루트', '오보에', '클라리넷', '바순', '호른',
  '트럼펫', '트롬본', '타악기', '기타', '하프',
];

const VIDEO_MAX_BYTES = 500 * 1024 * 1024;
const IMAGE_MAX_BYTES = 10 * 1024 * 1024;
const MAX_VIDEOS = 5;

interface ProfileForm {
  nickname: string;
  bio: string;
  region: string;
}

interface VideoUploadItem {
  id: string;
  file: File;
  progress: number;  // 0~100
  status: 'pending' | 'uploading' | 'done' | 'error';
  fileUrl?: string;
  error?: string;
}

async function getVideoPresignedUrl(
  fileName: string,
): Promise<{ uploadUrl: string; fileUrl: string }> {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? 'mp4';
  const mimeMap: Record<string, string> = {
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
  };
  const { data } = await apiClient.post<{ success: boolean; data: { uploadUrl: string; fileUrl: string; key: string } }>(
    '/media/presigned-url',
    { fileName, fileType: mimeMap[ext] ?? 'video/mp4', folder: 'videos' },
  );
  return data.data;
}

function uploadToS3(
  uploadUrl: string,
  file: File,
  contentType: string,
  onProgress: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => (xhr.status === 200 ? resolve() : reject(new Error(`HTTP ${xhr.status}`)));
    xhr.onerror = () => reject(new Error('네트워크 오류'));
    xhr.send(file);
  });
}

export default function ProfileEditPage() {
  const router = useRouter();
  const { user: me, setAuth, accessToken } = useAuthStore();
  const { toasts, show: showToast, dismiss } = useToast();

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [currentVideos, setCurrentVideos] = useState<string[]>([]);
  const [uploadQueue, setUploadQueue] = useState<VideoUploadItem[]>([]);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const videoInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileForm>();

  // 초기 프로필 로드
  useEffect(() => {
    if (!me) {
      router.replace('/login');
      return;
    }
    apiClient.get<User>(`/users/${me.id}`).then(({ data }) => {
      setProfileUser(data);
      setProfileImageUrl(data.profileImage);
      setSelectedInstruments(data.instruments?.filter(Boolean) ?? []);
      setCurrentVideos(data.videoUrls?.filter(Boolean) ?? []);
      reset({
        nickname: data.nickname ?? '',
        bio: data.bio ?? '',
        region: data.region ?? '',
      });
    });
  }, [me, reset, router]);

  // 악기 토글
  const toggleInstrument = (inst: string) => {
    setSelectedInstruments((prev) =>
      prev.includes(inst) ? prev.filter((i) => i !== inst) : [...prev, inst],
    );
  };

  // 프로필 이미지 업로드
  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > IMAGE_MAX_BYTES) {
      alert('이미지는 10MB 이하만 업로드 가능합니다.');
      return;
    }
    setImageUploading(true);
    try {
      const fileUrl = await uploadImage(file);
      await apiClient.patch('/users/me/profile-image', { imageUrl: fileUrl });
      setProfileImageUrl(fileUrl);
      if (me && accessToken) {
        setAuth({ ...me, profileImage: fileUrl }, accessToken);
      }
    } catch {
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setImageUploading(false);
    }
  };

  // 영상 파일 처리
  const processVideoFiles = useCallback(
    (files: File[]) => {
      const totalAfter = currentVideos.length + uploadQueue.filter((q) => q.status === 'done').length + files.length;
      if (totalAfter > MAX_VIDEOS) {
        alert(`연주 영상은 최대 ${MAX_VIDEOS}개까지 등록할 수 있습니다.`);
        return;
      }

      const newItems: VideoUploadItem[] = files
        .filter((file) => {
          if (file.size > VIDEO_MAX_BYTES) {
            alert(`${file.name}: 500MB를 초과하는 파일은 업로드할 수 없습니다.`);
            return false;
          }
          const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
          if (!['mp4', 'mov', 'avi'].includes(ext)) {
            alert(`${file.name}: mp4, mov, avi 형식만 업로드 가능합니다.`);
            return false;
          }
          return true;
        })
        .map((file) => ({
          id: `${Date.now()}-${Math.random()}`,
          file,
          progress: 0,
          status: 'pending' as const,
        }));

      if (newItems.length === 0) return;
      setUploadQueue((prev) => [...prev, ...newItems]);

      // 업로드 시작
      newItems.forEach((item) => startUpload(item));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentVideos.length, uploadQueue],
  );

  const startUpload = async (item: VideoUploadItem) => {
    setUploadQueue((prev) =>
      prev.map((q) => (q.id === item.id ? { ...q, status: 'uploading' } : q)),
    );
    try {
      const { uploadUrl, fileUrl } = await getVideoPresignedUrl(item.file.name);
      await uploadToS3(uploadUrl, item.file, item.file.type, (pct) => {
        setUploadQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, progress: pct } : q)),
        );
      });
      // 백엔드에 영상 URL 저장
      await apiClient.post('/users/me/videos', { videoUrl: fileUrl });
      setUploadQueue((prev) =>
        prev.map((q) =>
          q.id === item.id ? { ...q, status: 'done', progress: 100, fileUrl } : q,
        ),
      );
      setCurrentVideos((prev) => [...prev, fileUrl]);
    } catch (err) {
      const message = err instanceof Error ? err.message : '업로드 실패';
      setUploadQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'error', error: message } : q)),
      );
    }
  };

  // 드래그앤드롭
  const onDragOver = (e: DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    processVideoFiles(files);
  };

  // 현재 영상 삭제
  const deleteVideo = async (videoUrl: string) => {
    if (!confirm('이 영상을 삭제하시겠습니까?')) return;
    try {
      await apiClient.delete('/users/me/videos', { data: { videoUrl } });
      setCurrentVideos((prev) => prev.filter((v) => v !== videoUrl));
    } catch {
      alert('영상 삭제에 실패했습니다.');
    }
  };

  // 업로드 큐에서 제거 (done 이후)
  const removeFromQueue = (id: string) => {
    setUploadQueue((prev) => prev.filter((q) => q.id !== id));
  };

  // 프로필 저장
  const onSubmit = async (data: ProfileForm) => {
    setSaving(true);
    setSaveError(null);
    try {
      await apiClient.patch('/users/me', {
        ...data,
        instruments: selectedInstruments,
      });
      showToast('프로필이 저장되었습니다.', 'success');
      setTimeout(() => router.push(`/profile/${me?.id}`), 1000);
    } catch {
      setSaveError('저장에 실패했습니다. 다시 시도해주세요.');
      showToast('저장에 실패했습니다.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!profileUser) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-2xl bg-gray-200 animate-pulse" />
        ))}
      </div>
    );
  }

  const pendingVideoCount = currentVideos.length + uploadQueue.filter((q) => q.status === 'done').length;

  return (
    <>
    <ToastContainer toasts={toasts} dismiss={dismiss} />
    <div className="mx-auto max-w-xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← 뒤로
        </button>
        <h1 className="text-lg font-bold text-gray-900">프로필 편집</h1>
        <div className="w-10" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* 프로필 이미지 */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">프로필 사진</h2>
          <div className="flex items-center gap-4">
            {profileImageUrl ? (
              <Image
                src={profileImageUrl}
                alt="프로필"
                width={72}
                height={72}
                className="rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="h-[72px] w-[72px] rounded-full bg-violet-200 flex items-center justify-center text-violet-700 text-2xl font-bold border-2 border-gray-200">
                {(profileUser.nickname ?? '?')[0]}
              </div>
            )}
            <label className="cursor-pointer">
              <span className={`rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors ${imageUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                {imageUploading ? '업로드 중...' : '사진 변경'}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleImageChange}
                disabled={imageUploading}
              />
            </label>
          </div>
        </div>

        {/* 기본 정보 */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">기본 정보</h2>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">닉네임</label>
            <input
              {...register('nickname', { required: '닉네임을 입력하세요' })}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400"
              placeholder="닉네임"
            />
            {errors.nickname && (
              <p className="mt-1 text-xs text-red-500">{errors.nickname.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">자기소개</label>
            <textarea
              {...register('bio')}
              rows={4}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400 resize-none"
              placeholder="자신을 소개해주세요"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">활동 지역</label>
            <input
              {...register('region')}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400"
              placeholder="예: 서울 강남구"
            />
          </div>
        </div>

        {/* 악기 선택 */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">담당 악기</h2>
          <div className="grid grid-cols-3 gap-2">
            {INSTRUMENTS.map((inst) => {
              const checked = selectedInstruments.includes(inst);
              return (
                <label
                  key={inst}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${
                    checked
                      ? 'border-violet-400 bg-violet-50 text-violet-700'
                      : 'border-gray-200 text-gray-600 hover:border-violet-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={checked}
                    onChange={() => toggleInstrument(inst)}
                  />
                  <span className={`h-4 w-4 flex-shrink-0 rounded border-2 flex items-center justify-center ${checked ? 'border-violet-500 bg-violet-500' : 'border-gray-300'}`}>
                    {checked && (
                      <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 12 12" fill="currentColor">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </span>
                  {inst}
                </label>
              );
            })}
          </div>
        </div>

        {/* 연주 영상 업로드 */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">연주 영상</h2>
            <span className="text-xs text-gray-400">{pendingVideoCount} / {MAX_VIDEOS}</span>
          </div>

          {/* 기존 영상 목록 */}
          {currentVideos.length > 0 && (
            <div className="mb-4 space-y-2">
              {currentVideos.map((url, i) => (
                <div key={url} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                  <video src={url} className="h-12 w-20 rounded-lg object-cover bg-black" preload="metadata" />
                  <span className="flex-1 truncate text-xs text-gray-600">영상 {i + 1}</span>
                  <button
                    type="button"
                    onClick={() => deleteVideo(url)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 업로드 진행 중인 영상 */}
          {uploadQueue.map((item) => (
            <div key={item.id} className="mb-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
              <div className="flex items-center justify-between mb-1">
                <span className="truncate text-xs text-gray-600 max-w-[200px]">{item.file.name}</span>
                <div className="flex items-center gap-2">
                  {item.status === 'error' && (
                    <span className="text-xs text-red-500">{item.error}</span>
                  )}
                  {item.status === 'done' && (
                    <button
                      type="button"
                      onClick={() => removeFromQueue(item.id)}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
              {item.status === 'uploading' && (
                <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-violet-500 transition-all duration-300"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}
              {item.status === 'done' && (
                <div className="h-1.5 w-full rounded-full bg-green-200">
                  <div className="h-full w-full rounded-full bg-green-500" />
                </div>
              )}
              {item.status === 'error' && (
                <div className="h-1.5 w-full rounded-full bg-red-200" />
              )}
            </div>
          ))}

          {/* 드래그앤드롭 업로드 영역 */}
          {pendingVideoCount < MAX_VIDEOS && (
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => videoInputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 cursor-pointer transition-colors ${
                dragging
                  ? 'border-violet-400 bg-violet-50'
                  : 'border-gray-200 hover:border-violet-300 hover:bg-gray-50'
              }`}
            >
              <svg className="h-8 w-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <p className="text-sm text-gray-500">
                클릭하거나 파일을 여기로 드래그하세요
              </p>
              <p className="text-xs text-gray-400">mp4, mov, avi · 최대 500MB</p>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/x-msvideo"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  processVideoFiles(files);
                  e.target.value = '';
                }}
              />
            </div>
          )}
        </div>

        {/* 저장 버튼 */}
        {saveError && (
          <p className="text-sm text-red-500 text-center">{saveError}</p>
        )}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-violet-700 py-3.5 text-sm font-semibold text-white hover:bg-violet-800 transition-colors disabled:opacity-60"
        >
          {saving ? '저장 중...' : '저장하기'}
        </button>
      </form>
    </div>
    </>
  );
}
