'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, X, ChevronLeft, MapPin } from 'lucide-react';
import api from '@/lib/axios';
import Link from 'next/link';

const RECENT_KEY = 'banmo_recent_searches';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(RECENT_KEY);
    if (saved) setRecentSearches(JSON.parse(saved));
    const q = searchParams.get('q');
    if (q) handleSearch(q);
    inputRef.current?.focus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveRecent = (q: string) => {
    setRecentSearches(prev => {
      const updated = [q, ...prev.filter(r => r !== q)].slice(0, 10);
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const removeRecent = (q: string) => {
    setRecentSearches(prev => {
      const updated = prev.filter(r => r !== q);
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_KEY);
  };

  const handleSearch = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    setQuery(q);
    saveRecent(q.trim());
    try {
      const res = await api.get(`/posts?search=${encodeURIComponent(q)}&limit=20`);
      const data = res.data?.items || res.data?.data || res.data?.posts || res.data || [];
      setResults(Array.isArray(data) ? data : []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const categoryLabel: Record<string, string> = {
    JOB_OFFER: '반주자 구함', JOB_SEEK: '반주 지원',
    LESSON_OFFER: '레슨 구함', LESSON_SEEK: '레슨 지원',
    PERFORMANCE: '공연도우미', AFTERSCHOOL: '방과후교사',
    PROMO_CONCERT: '공연/연주회', PROMO_SPACE: '연습실', PROMO_CONTEST: '콩쿨',
    TRADE_LESSON: '레슨양도', TRADE_SPACE: '연습실양도',
    TRADE_TICKET: '티켓양도', TRADE_INSTRUMENT: '중고악기',
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', background: 'white', minHeight: '100vh' }}>

      {/* 검색 헤더 */}
      <div style={{
        position: 'sticky', top: 0, background: 'white',
        borderBottom: '0.5px solid #E8E4DC',
        padding: '10px 16px', zIndex: 10,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <button onClick={() => router.back()} style={{
          background: 'none', border: 'none',
          cursor: 'pointer', padding: 4, flexShrink: 0,
        }}>
          <ChevronLeft size={24} color="#1C1C1C" strokeWidth={2} />
        </button>
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center',
          background: '#F7F4ED', borderRadius: 12,
          padding: '0 12px', gap: 8,
        }}>
          <Search size={18} color="#9CA3AF" strokeWidth={1.8} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSearch(query);
            }}
            placeholder="공고 제목, 악기, 지역 검색"
            style={{
              flex: 1, border: 'none', background: 'none',
              fontSize: 15, outline: 'none', padding: '10px 0',
              color: '#1A1A1A',
            }}
          />
          {query && (
            <button onClick={() => { setQuery(''); setSearched(false); setResults([]); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
              <X size={16} color="#9CA3AF" />
            </button>
          )}
        </div>
        <button
          onClick={() => handleSearch(query)}
          style={{
            background: '#1C1C1C', color: 'white',
            border: 'none', borderRadius: 10,
            padding: '10px 14px', fontSize: 14,
            fontWeight: 700, cursor: 'pointer', flexShrink: 0,
          }}>
          검색
        </button>
      </div>

      <div style={{ padding: '16px 16px 100px' }}>

        {/* 최근 검색어 */}
        {!searched && recentSearches.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 12,
            }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>최근 검색어</span>
              <button onClick={clearRecent} style={{
                background: 'none', border: 'none',
                fontSize: 12, color: '#9CA3AF', cursor: 'pointer',
              }}>전체 삭제</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {recentSearches.map(q => (
                <div key={q} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: '#F7F4ED', borderRadius: 99,
                  padding: '7px 12px',
                }}>
                  <span
                    onClick={() => handleSearch(q)}
                    style={{ fontSize: 13, color: '#444', cursor: 'pointer' }}>
                    {q}
                  </span>
                  <button onClick={() => removeRecent(q)} style={{
                    background: 'none', border: 'none',
                    cursor: 'pointer', padding: 0, display: 'flex',
                  }}>
                    <X size={12} color="#9CA3AF" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 추천 검색어 */}
        {!searched && (
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
              추천 검색어
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[
                '피아노 반주', '바이올린', '콩쿠르 반주',
                '성악 반주', '레슨', '강남', '서울',
                '방과후', '중고 피아노', '공연/연주회',
              ].map(tag => (
                <button key={tag}
                  onClick={() => handleSearch(tag)}
                  style={{
                    padding: '7px 14px',
                    background: '#F0EDE6', color: '#000000',
                    border: 'none', borderRadius: 99,
                    fontSize: 13, fontWeight: 500,
                    cursor: 'pointer',
                  }}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 로딩 */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF' }}>
            검색 중...
          </div>
        )}

        {/* 검색 결과 */}
        {searched && !loading && (
          <div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 14 }}>
              <span style={{ color: '#1C1C1C', fontWeight: 700 }}>
                &quot;{query}&quot;
              </span>
              {' '}검색 결과 {results.length}건
            </div>

            {results.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '60px 0',
                color: '#9CA3AF',
              }}>
                <Search size={40} color="#9CA3AF" style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
                  검색 결과가 없어요
                </div>
                <div style={{ fontSize: 13 }}>
                  다른 키워드로 검색해보세요
                </div>
              </div>
            ) : (
              results.map(post => (
                <Link key={post.id} href={`/jobs/${post.id}`}
                  style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: 'white', borderRadius: 12,
                    padding: '14px', marginBottom: 10,
                    border: '0.5px solid #E8E4DC',
                  }}>
                    <div style={{ marginBottom: 6 }}>
                      <span style={{
                        background: '#F0EDE6', color: '#000000',
                        fontSize: 10, fontWeight: 700,
                        padding: '3px 8px', borderRadius: 6,
                      }}>
                        {categoryLabel[post.category] || post.category}
                      </span>
                    </div>
                    <div style={{
                      fontSize: 15, fontWeight: 600,
                      color: '#1A1A1A', marginBottom: 6,
                      lineHeight: 1.3,
                    }}>
                      {post.title}
                    </div>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <div style={{
                        display: 'flex', alignItems: 'center',
                        gap: 4, fontSize: 12, color: '#888',
                      }}>
                        <MapPin size={12} strokeWidth={1.8} />
                        {post.region || '지역 미정'}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#000000' }}>
                        {post.payText || (post.payType === 'NEGOTIABLE' ? '협의' :
                          post.payType === 'HOURLY' ? `시급 ${post.payMin?.toLocaleString()}원` :
                          post.payType === 'PER_SESSION' ? `회당 ${post.payMin?.toLocaleString()}원` :
                          post.payMin ? `월 ${post.payMin?.toLocaleString()}원` : '협의')}
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ padding: 20, textAlign: 'center', color: '#9CA3AF' }}>로딩 중...</div>}>
      <SearchContent />
    </Suspense>
  );
}
