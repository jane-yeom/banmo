'use client'
import { useState, useRef, useEffect } from 'react'
import { ChevronDown, X, Search } from 'lucide-react'
import { INSTRUMENTS, INSTRUMENT_CATEGORIES } from '@/constants/instruments'

interface InstrumentSelectProps {
  value: string[]
  onChange: (instruments: string[]) => void
  placeholder?: string
  maxCount?: number
}

export default function InstrumentSelect({
  value,
  onChange,
  placeholder = '악기 선택 (복수 가능)',
  maxCount = 5,
}: InstrumentSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('전체')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const toggle = (inst: string) => {
    if (value.includes(inst)) {
      onChange(value.filter(i => i !== inst))
    } else {
      if (value.length >= maxCount) return
      onChange([...value, inst])
    }
  }

  const filtered = INSTRUMENTS.filter(inst => {
    const matchSearch = inst.includes(search)
    const matchCategory = activeCategory === '전체'
      || INSTRUMENT_CATEGORIES[activeCategory]?.includes(inst)
    return matchSearch && matchCategory
  })

  const categories = ['전체', ...Object.keys(INSTRUMENT_CATEGORIES)]

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', minHeight: 48,
          border: `1.5px solid ${open ? '#1C1C1C' : '#E8E4DC'}`,
          borderRadius: 12, padding: '10px 14px',
          cursor: 'pointer', background: 'white',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 8,
          boxSizing: 'border-box',
        }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, flex: 1 }}>
          {value.length === 0 ? (
            <span style={{ fontSize: 15, color: '#9CA3AF' }}>{placeholder}</span>
          ) : (
            value.map(inst => (
              <div key={inst} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: '#F0EDE6', borderRadius: 99,
                padding: '3px 10px', fontSize: 13, fontWeight: 500,
              }}>
                {inst}
                <button
                  onClick={e => { e.stopPropagation(); toggle(inst) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                  <X size={12} color="#555" />
                </button>
              </div>
            ))
          )}
        </div>
        <ChevronDown
          size={18} color="#9CA3AF"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '0.2s', flexShrink: 0 }}
        />
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: 'white', border: '1.5px solid #E8E4DC',
          borderRadius: 12, zIndex: 100, marginTop: 4,
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          overflow: 'hidden',
        }}>
          {/* 검색 */}
          <div style={{ padding: '10px 12px', borderBottom: '0.5px solid #F0EDE6', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search size={15} color="#9CA3AF" strokeWidth={1.8} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="악기 검색..."
              autoFocus
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, background: 'transparent' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={14} color="#9CA3AF" />
              </button>
            )}
          </div>

          {/* 카테고리 탭 */}
          <div style={{
            display: 'flex', overflowX: 'auto',
            padding: '8px 12px', gap: 6,
            borderBottom: '0.5px solid #F0EDE6',
            scrollbarWidth: 'none',
          }}>
            {categories.map(cat => (
              <button key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '4px 10px', borderRadius: 99,
                  border: 'none', cursor: 'pointer',
                  background: activeCategory === cat ? '#1C1C1C' : '#F0EDE6',
                  color: activeCategory === cat ? 'white' : '#555',
                  fontSize: 12, fontWeight: activeCategory === cat ? 600 : 400,
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                {cat}
              </button>
            ))}
          </div>

          {/* 악기 목록 */}
          <div style={{ maxHeight: 240, overflowY: 'auto', padding: '8px 12px' }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#9CA3AF', fontSize: 13 }}>
                검색 결과가 없어요
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {filtered.map(inst => (
                  <button key={inst}
                    onClick={() => toggle(inst)}
                    style={{
                      padding: '6px 12px', borderRadius: 99,
                      border: `1.5px solid ${value.includes(inst) ? '#1C1C1C' : '#E8E4DC'}`,
                      background: value.includes(inst) ? '#1C1C1C' : 'white',
                      color: value.includes(inst) ? 'white' : '#444',
                      fontSize: 13, cursor: 'pointer',
                      fontWeight: value.includes(inst) ? 600 : 400,
                      opacity: !value.includes(inst) && value.length >= maxCount ? 0.4 : 1,
                    }}>
                    {inst}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 하단 */}
          <div style={{ padding: '10px 14px', borderTop: '0.5px solid #F0EDE6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#9CA3AF' }}>{value.length}/{maxCount}개 선택</span>
            <button onClick={() => setOpen(false)} style={{
              padding: '6px 16px', background: '#1C1C1C',
              color: 'white', border: 'none', borderRadius: 8,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              완료
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
