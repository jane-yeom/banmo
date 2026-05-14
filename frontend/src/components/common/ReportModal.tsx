'use client';

import { useState } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import api from '@/lib/axios';

interface ReportModalProps {
  type: 'POST' | 'BOARD' | 'USER';
  targetId: string;
  targetName?: string;
  onClose: () => void;
}

const REASONS = [
  { value: 'FAKE', label: '허위 공고' },
  { value: 'PRICE', label: '최저임금 미달 페이' },
  { value: 'ABUSE', label: '욕설 / 비방 / 괴롭힘' },
  { value: 'SPAM', label: '스팸 / 도배' },
  { value: 'FRAUD', label: '사기 / 허위정보' },
];

export default function ReportModal({
  type, targetId, targetName, onClose,
}: ReportModalProps) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return alert('신고 사유를 선택해주세요');
    setSubmitting(true);
    try {
      await api.post('/reports', {
        targetType: type,
        targetId,
        reason,
        description,
      });
      setDone(true);
    } catch (e: any) {
      alert(e.response?.data?.message || '신고 접수에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white', borderRadius: '20px 20px 0 0',
          padding: '24px 20px 40px',
          width: '100%', maxWidth: 600,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={20} color="#EF4444" strokeWidth={1.8} />
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>신고하기</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={22} color="#9CA3AF" />
          </button>
        </div>

        {done ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <CheckCircle size={48} color="#5AAB7A" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>신고가 접수되었습니다</div>
            <p style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.6 }}>
              관리자 검토 후 적절한 조치가 이루어집니다.<br />
              허위 신고는 제재를 받을 수 있습니다.
            </p>
            <button
              onClick={onClose}
              style={{
                marginTop: 20, padding: '12px 32px',
                background: '#7B82BE', color: 'white',
                border: 'none', borderRadius: 12,
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}
            >
              확인
            </button>
          </div>
        ) : (
          <>
            {targetName && (
              <div style={{
                background: '#FEF2F2', borderRadius: 10,
                padding: '10px 14px', marginBottom: 16,
                fontSize: 13, color: '#EF4444',
              }}>
                신고 대상: <strong>{targetName}</strong>
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{
                fontSize: 13, fontWeight: 700,
                color: '#444', display: 'block', marginBottom: 10,
              }}>
                신고 사유 <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {REASONS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setReason(r.value)}
                    style={{
                      padding: '8px 14px', borderRadius: 99,
                      border: `1.5px solid ${reason === r.value ? '#EF4444' : '#DDD9EF'}`,
                      background: reason === r.value ? '#FEF2F2' : 'white',
                      color: reason === r.value ? '#EF4444' : '#666',
                      fontSize: 13, cursor: 'pointer',
                      fontWeight: reason === r.value ? 600 : 400,
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{
                fontSize: 13, fontWeight: 700,
                color: '#444', display: 'block', marginBottom: 8,
              }}>
                상세 내용 (선택)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="신고 내용을 상세히 입력해주세요"
                rows={3}
                maxLength={500}
                style={{
                  width: '100%', padding: '12px 14px',
                  border: '1.5px solid #DDD9EF', borderRadius: 12,
                  fontSize: 14, outline: 'none', resize: 'none',
                  lineHeight: 1.6, boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || !reason}
              style={{
                width: '100%', padding: '14px',
                background: reason ? '#EF4444' : '#DDD9EF',
                color: 'white', border: 'none',
                borderRadius: 12, fontSize: 15,
                fontWeight: 700,
                cursor: reason ? 'pointer' : 'not-allowed',
              }}
            >
              {submitting ? '접수 중...' : '신고 접수'}
            </button>

            <p style={{
              fontSize: 11, color: '#9CA3AF',
              textAlign: 'center', marginTop: 10,
            }}>
              허위 신고 시 서비스 이용이 제한될 수 있습니다
            </p>
          </>
        )}
      </div>
    </div>
  );
}
