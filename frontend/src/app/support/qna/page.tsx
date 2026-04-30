'use client';

import { useState } from 'react';
import Link from 'next/link';

const FAQ_CATEGORIES = [
  {
    key: 'usage',
    label: '이용방법',
    icon: '📖',
    items: [
      { q: '반모는 어떤 서비스인가요?', a: '반주자와 연주자를 연결하는 매칭 플랫폼입니다. 반주자 구인·구직, 레슨, 공연 홍보, 연습실 대여, 중고악기 거래까지 음악 활동에 필요한 모든 것을 한 곳에서 해결할 수 있습니다.' },
      { q: '회원가입은 어떻게 하나요?', a: '이메일 또는 카카오 계정으로 간편하게 가입할 수 있습니다. 우측 상단의 로그인 버튼을 클릭하여 가입해주세요.' },
      { q: '공고는 어떻게 등록하나요?', a: '로그인 후 구인구직 메뉴에서 글쓰기 버튼을 클릭하세요. 카테고리, 지역, 페이 등을 입력하고 등록하면 됩니다.' },
      { q: '반주자에게 연락하려면?', a: '공고 상세페이지에서 채팅하기 버튼을 클릭하세요. 1:1 실시간 채팅으로 바로 연락할 수 있습니다.' },
      { q: '음표 등급이란?', a: '활동 신뢰도를 나타내는 등급입니다. 16분음표(신규)부터 온음표(최고)까지 활동 이력과 거래 신뢰도에 따라 등급이 올라갑니다.' },
    ],
  },
  {
    key: 'pay',
    label: '페이관련',
    icon: '💰',
    items: [
      { q: '최저 페이 기준이 있나요?', a: '시급 기준 최저시급(10,030원) 이하 공고는 등록이 제한됩니다. 반주자의 정당한 처우를 위해 시행하는 정책입니다.' },
      { q: '페이는 어떻게 결정하나요?', a: '공고 작성자와 지원자가 채팅으로 직접 협의할 수 있습니다. 공고에 희망 페이 범위를 명시하는 것을 권장합니다.' },
      { q: '상위노출 결제는 어떻게 하나요?', a: '공고 상세페이지에서 상위노출 버튼을 클릭하면 토스페이먼츠를 통해 결제할 수 있습니다. 상위노출 공고는 목록 상단에 고정 표시됩니다.' },
      { q: '환불은 가능한가요?', a: '상위노출 시작 전에는 전액 환불이 가능합니다. 이미 노출이 시작된 경우에는 환불이 제한될 수 있습니다. 문의하기로 접수해주세요.' },
      { q: '안전결제 기능이 있나요?', a: '현재 준비 중입니다. 빠른 시일 내에 제공할 예정입니다.' },
    ],
  },
  {
    key: 'account',
    label: '계정관련',
    icon: '👤',
    items: [
      { q: '비밀번호를 잊어버렸어요', a: '현재 비밀번호 찾기 기능을 준비 중입니다. 문의하기로 접수하시면 도움드리겠습니다.' },
      { q: '회원탈퇴는 어떻게 하나요?', a: '마이페이지 > 계정설정에서 회원탈퇴를 진행할 수 있습니다. 탈퇴 후에는 계정 복구가 불가능하니 신중하게 결정해주세요.' },
      { q: '닉네임 변경이 가능한가요?', a: '마이페이지 > 프로필 편집에서 닉네임을 변경할 수 있습니다.' },
      { q: '카카오 연동을 해제하고 싶어요', a: '고객센터 문의하기로 연락 주시면 처리해드리겠습니다.' },
      { q: '계정이 정지됐어요', a: '신고 누적 또는 이용 규정 위반 시 계정이 제한될 수 있습니다. 문의하기로 접수하시면 확인 후 답변드리겠습니다.' },
    ],
  },
  {
    key: 'report',
    label: '신고관련',
    icon: '🚨',
    items: [
      { q: '허위 공고를 신고하려면?', a: '공고 상세페이지 우측 상단의 신고 버튼을 클릭하세요. 신고 사유를 선택하고 내용을 입력하면 관리자가 검토합니다.' },
      { q: '반주비를 받지 못했어요', a: '문의하기로 접수해주시면 처리해드립니다. 거래 내역과 관련 증거를 함께 첨부해주시면 빠른 처리에 도움이 됩니다.' },
      { q: '신고 처리는 얼마나 걸리나요?', a: '영업일 기준 3일 이내 처리됩니다. 신고 내용에 따라 처리 기간이 달라질 수 있습니다.' },
      { q: '익명으로 신고 가능한가요?', a: '네, 신고자 정보는 피신고자에게 공개되지 않습니다. 안심하고 신고해주세요.' },
      { q: '신고 결과를 알 수 있나요?', a: '처리 완료 후 알림으로 안내해드립니다. 처리 결과의 세부 내용은 개인정보 보호를 위해 공개되지 않을 수 있습니다.' },
    ],
  },
];

export default function SupportQnaPage() {
  const [activeCategory, setActiveCategory] = useState('usage');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const currentCategory = FAQ_CATEGORIES.find((c) => c.key === activeCategory)!;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="mx-auto max-w-3xl flex items-center gap-2">
          <Link href="/support" className="text-gray-400 hover:text-gray-600 text-sm">고객센터</Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-medium text-gray-700">자주 묻는 질문</span>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">📋 자주 묻는 질문</h1>

        {/* 카테고리 탭 */}
        <div className="flex gap-2 overflow-x-auto mb-6 scrollbar-none">
          {FAQ_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => { setActiveCategory(cat.key); setOpenIndex(null); }}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeCategory === cat.key
                  ? 'bg-violet-700 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* 아코디언 */}
        <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm">
          {currentCategory.items.map((item, idx) => (
            <div key={idx} className="border-b border-gray-50 last:border-0">
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 text-violet-600 font-bold text-sm mt-0.5">Q</span>
                  <span className="text-sm font-medium text-gray-800">{item.q}</span>
                </div>
                <span className={`flex-shrink-0 text-gray-400 transition-transform ${openIndex === idx ? 'rotate-180' : ''}`}>
                  ▾
                </span>
              </button>
              {openIndex === idx && (
                <div className="flex gap-3 px-5 pb-4">
                  <span className="flex-shrink-0 text-teal-600 font-bold text-sm mt-0.5">A</span>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 더 궁금한 점 */}
        <div className="mt-6 rounded-2xl bg-violet-50 border border-violet-100 p-5 text-center">
          <p className="text-sm text-gray-700 mb-3">원하는 답변을 찾지 못하셨나요?</p>
          <Link
            href="/support/contact"
            className="inline-block rounded-lg bg-violet-700 px-5 py-2 text-sm font-medium text-white hover:bg-violet-800 transition-colors"
          >
            1:1 문의하기
          </Link>
        </div>
      </div>
    </div>
  );
}
