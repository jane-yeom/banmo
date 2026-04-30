'use client';

import Link from 'next/link';

const MENU_CARDS = [
  {
    icon: '📋',
    title: 'QnA',
    desc: '자주 묻는 질문을 확인하세요',
    href: '/support/qna',
    color: 'from-violet-50 to-violet-100',
    border: 'border-violet-200',
    textColor: 'text-violet-700',
  },
  {
    icon: '✉️',
    title: '문의하기',
    desc: '1:1 문의를 남겨주세요',
    href: '/support/contact',
    color: 'from-blue-50 to-blue-100',
    border: 'border-blue-200',
    textColor: 'text-blue-700',
  },
  {
    icon: '📢',
    title: '공지사항',
    desc: '서비스 공지를 확인하세요',
    href: '/support/notices',
    color: 'from-amber-50 to-amber-100',
    border: 'border-amber-200',
    textColor: 'text-amber-700',
  },
];

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 배너 */}
      <div className="bg-gradient-to-br from-violet-700 to-violet-900 py-12 text-center text-white">
        <div className="mx-auto max-w-2xl px-4">
          <h1 className="text-3xl font-bold mb-2">고객센터</h1>
          <p className="text-violet-200 text-base mb-6">무엇을 도와드릴까요?</p>
          <div className="mx-auto max-w-md">
            <div className="flex items-center rounded-full bg-white/20 backdrop-blur-sm px-5 py-3 text-sm text-violet-200">
              <svg className="h-4 w-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              아래 메뉴에서 도움말을 찾아보세요
            </div>
          </div>
        </div>
      </div>

      {/* 메뉴 카드 */}
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {MENU_CARDS.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className={`group flex flex-col items-center rounded-2xl border bg-gradient-to-br p-8 text-center transition-shadow hover:shadow-md ${card.color} ${card.border}`}
            >
              <span className="text-5xl mb-4">{card.icon}</span>
              <h2 className={`text-lg font-bold mb-1 ${card.textColor}`}>{card.title}</h2>
              <p className="text-sm text-gray-500">{card.desc}</p>
            </Link>
          ))}
        </div>

        {/* 운영시간 */}
        <div className="mt-8 rounded-2xl bg-white border border-gray-100 p-6 text-center">
          <p className="text-sm font-semibold text-gray-700 mb-1">고객센터 운영시간</p>
          <p className="text-sm text-gray-500">평일 09:00 ~ 18:00 (주말·공휴일 휴무)</p>
          <p className="text-xs text-gray-400 mt-2">문의하기를 통해 접수하시면 영업일 기준 3일 이내 답변드립니다.</p>
        </div>
      </div>
    </div>
  );
}
