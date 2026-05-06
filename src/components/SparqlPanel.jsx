'use client'
import { useState, useRef } from 'react'
import {
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Database, Code2, Table2, Copy, Check, Clock, Hash
} from 'lucide-react'

// ── SPARQL syntax highlighter ──────────────────────────────
function highlightSparql(query) {
  const lines = query.split('\n')
  return lines.map((line, li) => {
    const parts = []
    let remaining = line
    let key = 0
    const commentMatch = remaining.match(/^(.*?)(#.*)$/)
    let commentSuffix = null
    if (commentMatch) { remaining = commentMatch[1]; commentSuffix = commentMatch[2] }

    const tokenRe = /(\?\w+)|(<[^>]+>)|("(?:[^"\\]|\\.)*")|(\b(?:SELECT|DISTINCT|WHERE|OPTIONAL|FILTER|BIND|VALUES|ORDER\s+BY|LIMIT|OFFSET|PREFIX|BASE|ASK|CONSTRUCT|DESCRIBE|FROM|NAMED|UNION|MINUS|EXISTS|NOT\s+EXISTS|IN|AS|GROUP\s+BY|HAVING|REGEX|STR|STRSTARTS|STRENDS|CONTAINS|REPLACE|BOUND|isBlank|isIRI|isLiteral|COALESCE|IF|CONCAT|LCASE|UCASE|STRLEN|SUBSTR|COUNT|SUM|MIN|MAX|AVG|SAMPLE|GROUP_CONCAT|TRUE|FALSE)\b|\ba\b)|(\b\w+:\w*)/g
    let lastIdx = 0
    let m
    while ((m = tokenRe.exec(remaining)) !== null) {
      if (m.index > lastIdx) parts.push(<span key={key++}>{remaining.slice(lastIdx, m.index)}</span>)
      const token = m[0]
      if      (m[1]) parts.push(<span key={key++} className="text-[#89dceb]">{token}</span>)
      else if (m[2]) parts.push(<span key={key++} className="text-[#a6e3a1]">{token}</span>)
      else if (m[3]) parts.push(<span key={key++} className="text-[#a6e3a1]">{token}</span>)
      else if (m[4]) parts.push(<span key={key++} className="text-[#cba6f7] font-medium">{token}</span>)
      else if (m[5]) parts.push(<span key={key++} className="text-[#fab387]">{token}</span>)
      lastIdx = m.index + token.length
    }
    if (lastIdx < remaining.length) parts.push(<span key={key++}>{remaining.slice(lastIdx)}</span>)
    if (commentSuffix) parts.push(<span key={key++} className="text-[#6c7086] italic">{commentSuffix}</span>)

    return (
      <span key={li} className="block">
        <span className="inline-block w-8 text-right mr-4 text-[#45475a] text-[11px] select-none">{li + 1}</span>
        <span>{parts}</span>
        {'\n'}
      </span>
    )
  })
}

// ── Component ──────────────────────────────────────────────
export default function SparqlPanel({ debug, narrow = false }) {
  const [open, setOpen]          = useState(false)
  const [activeQuery, setActive] = useState(0)
  const [activeTab, setTab]      = useState('query')
  const [copied, setCopied]      = useState(false)
  const navRef                   = useRef(null)

  if (!debug || debug.queries.length === 0) return null

  const q             = debug.queries[activeQuery]
  const totalBindings = debug.queries.reduce((s, qi) => s + qi.rawResults.length, 0)

  const copyQuery = () => {
    navigator.clipboard.writeText(q.query).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }

  const scrollNav = (dir) => {
    navRef.current?.scrollBy({ left: dir === 'right' ? 200 : -200, behavior: 'smooth' })
  }

  return (
    <div className={narrow ? 'my-6' : 'my-8'}>
      <div className="border border-[#dde8ec] rounded-xl overflow-hidden bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">

        {/* ── Toggle header ── */}
        <button
          className="w-full flex items-center justify-between px-4 py-3 bg-[#f7fafa] hover:bg-[#eaf1f4] transition-colors gap-3 text-left"
          onClick={() => setOpen(!open)}
        >
          <span className="flex items-center gap-2 text-[#0e2233] text-[12.5px] font-semibold tracking-[0.01em]">
            <Database size={13} className="text-[#2aab7e] shrink-0" />
            <span>SPARQL Ontologi</span>
            <span className="bg-[rgba(42,171,126,0.10)] text-[#2aab7e] text-[11px] font-medium px-2 py-0.5 rounded-full">
              {debug.queries.length} query
            </span>
            <span className="bg-[rgba(107,114,128,0.08)] text-[#6b7280] text-[11px] font-medium px-2 py-0.5 rounded-full hidden sm:inline">
              {totalBindings.toLocaleString('id-ID')} bindings
            </span>
          </span>
          <span className="flex items-center gap-1.5 text-[#8fa3b0] text-[11.5px] shrink-0">
            <span className="hidden sm:inline">{open ? 'Sembunyikan' : 'Lihat query & hasil'}</span>
            {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </span>
        </button>

        {open && (
          <div className="border-t border-[#eaf1f4] bg-[#f7fafa]">

            {/* ── Query nav tabs (multiple queries) ── */}
            {debug.queries.length > 1 && (
              <div className="flex items-stretch border-b border-[#eaf1f4] bg-[#eaf1f4]">
                <button
                  className="shrink-0 w-8 flex items-center justify-center text-[#8fa3b0] hover:text-[#0e2233] hover:bg-[#dde8ec] transition-colors border-r border-[#dde8ec]"
                  onClick={() => scrollNav('left')}
                >
                  <ChevronLeft size={14} />
                </button>

                <div
                  ref={navRef}
                  className="flex-1 flex overflow-x-auto gap-0.5 px-1.5 scroll-smooth"
                  style={{ scrollbarWidth: 'none' }}
                >
                  {debug.queries.map((qItem, i) => (
                    <button
                      key={i}
                      onClick={() => { setActive(i); setTab('query') }}
                      className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs whitespace-nowrap border-b-2 -mb-px transition-all ${
                        activeQuery === i
                          ? 'text-[#0e2233] font-medium border-[#2aab7e] bg-white'
                          : 'text-[#4f6370] font-normal border-transparent hover:text-[#2aab7e] hover:bg-[rgba(42,171,126,0.04)]'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full text-[10px] font-semibold flex items-center justify-center shrink-0 ${
                        activeQuery === i
                          ? 'bg-[#2aab7e] text-white'
                          : 'bg-[rgba(42,171,126,0.10)] text-[#2aab7e]'
                      }`}>
                        {i + 1}
                      </span>
                      <span>{qItem.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        activeQuery === i
                          ? 'bg-[rgba(42,171,126,0.10)] text-[#2aab7e]'
                          : 'bg-[rgba(107,114,128,0.10)] text-[#9ca3af]'
                      }`}>
                        {qItem.rawResults.length}
                      </span>
                    </button>
                  ))}
                </div>

                <button
                  className="shrink-0 w-8 flex items-center justify-center text-[#8fa3b0] hover:text-[#0e2233] hover:bg-[#dde8ec] transition-colors border-l border-[#dde8ec]"
                  onClick={() => scrollNav('right')}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}

            {/* ── Detail area ── */}
            <div className="bg-white">

              {/* Detail header */}
              <div className="flex items-center justify-between flex-wrap gap-2 px-4 py-2 border-b border-[#eaf1f4] bg-[#f7fafa]">
                <div className="flex items-center gap-3 flex-wrap">
                  {debug.queries.length === 1 && (
                    <span className="text-[12.5px] font-medium text-[#0e2233]">{q.label}</span>
                  )}
                  <span className="flex items-center gap-1 text-[11.5px] text-[#8fa3b0]">
                    <Hash size={11} />
                    {q.rawResults.length} binding{q.rawResults.length !== 1 ? 's' : ''}
                  </span>
                  {q.executedAt && (
                    <span className="flex items-center gap-1 text-[11.5px] text-[#8fa3b0]">
                      <Clock size={11} />
                      {q.executedAt}
                    </span>
                  )}
                </div>

                {/* Query / Result tabs */}
                <div className="flex gap-1">
                  {[
                    { id: 'query',  Icon: Code2,  label: 'Query' },
                    { id: 'result', Icon: Table2, label: 'Hasil'  },
                  ].map(({ id, Icon, label }) => (
                    <button
                      key={id}
                      onClick={() => setTab(id)}
                      className={`flex items-center gap-1 px-3 py-1.5 text-[11.5px] rounded-md border transition-all ${
                        activeTab === id
                          ? 'bg-[rgba(42,171,126,0.08)] border-[rgba(42,171,126,0.25)] text-[#0e2233] font-medium'
                          : 'border-transparent text-[#4f6370] hover:text-[#2aab7e] hover:bg-[rgba(42,171,126,0.06)]'
                      }`}
                    >
                      <Icon size={11} /> {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Query tab ── */}
              {activeTab === 'query' && (
                <div className="relative">
                  <button
                    onClick={copyQuery}
                    className="absolute top-2.5 right-3.5 z-10 flex items-center gap-1 px-2.5 py-1 text-[11px] text-[#9ca3af] bg-[rgba(40,40,60,0.7)] hover:text-white border border-[rgba(255,255,255,0.12)] hover:border-[rgba(255,255,255,0.3)] rounded-md transition-all"
                  >
                    {copied ? <Check size={11} /> : <Copy size={11} />}
                    {copied ? 'Tersalin' : 'Salin'}
                  </button>
                  <pre
                    className="m-0 px-5 py-4 text-[12.5px] leading-[1.7] bg-[#1e1e2e] overflow-x-auto text-[#cdd6f4] whitespace-pre"
                    style={{ fontFamily: "'SFMono-Regular', 'Consolas', 'Monaco', monospace" }}
                  >
                    <code>{highlightSparql(q.query.trim())}</code>
                  </pre>
                </div>
              )}

              {/* ── Result tab ── */}
              {activeTab === 'result' && (
                <div>
                  {q.rawResults.length === 0 ? (
                    <div className="flex items-center justify-center py-8 text-[13px] text-[#8fa3b0]">
                      Tidak ada hasil (0 bindings)
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto max-h-105 overflow-y-auto">
                        <table className="w-full border-collapse text-[12px] text-[#0e2233]">
                          <thead className="sticky top-0 z-10">
                            <tr>
                              <th className="text-center px-3 py-2 bg-[#f7fafa] text-[#8fa3b0] text-[11px] font-normal border-b border-[#dde8ec] w-9">
                                #
                              </th>
                              {Object.keys(q.rawResults[0]).map(col => (
                                <th
                                  key={col}
                                  className="text-left px-3 py-2 bg-[#f7fafa] font-semibold text-[11px] text-[#4f6370] border-b border-[#dde8ec] whitespace-nowrap"
                                  style={{ fontFamily: "'SFMono-Regular', monospace", letterSpacing: '0.02em' }}
                                >
                                  ?{col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {q.rawResults.slice(0, 100).map((row, ri) => (
                              <tr key={ri} className="even:bg-[#fafcfc] hover:bg-[#eaf1f4] transition-colors">
                                <td
                                  className="text-center px-3 py-1.5 border-b border-[#eaf1f4] text-[#d1d5db] text-[11px]"
                                  style={{ fontFamily: 'monospace' }}
                                >
                                  {ri + 1}
                                </td>
                                {Object.keys(q.rawResults[0]).map(col => {
                                  const cellVal  = row[col]?.value
                                  const cellType = row[col]?.type
                                  return (
                                    <td
                                      key={col}
                                      title={cellVal || ''}
                                      className="px-3 py-1.5 border-b border-[#eaf1f4] max-w-65 overflow-hidden text-ellipsis whitespace-nowrap align-middle"
                                    >
                                      {cellVal
                                        ? cellVal.includes('#')
                                          ? <span className="font-mono text-[11.5px] text-[#2aab7e] bg-[rgba(42,171,126,0.08)] px-1.5 py-0.5 rounded" title={cellVal}>{cellVal.split('#').pop()}</span>
                                          : cellType === 'uri'
                                            ? <span className="font-mono text-[11.5px] text-[#1a6fa8] bg-[rgba(26,111,168,0.06)] px-1.5 py-0.5 rounded" title={cellVal}>{cellVal.split('/').pop()}</span>
                                            : <span className="text-[#0e2233]">{cellVal}</span>
                                        : <span className="text-[#d1d5db]">—</span>
                                      }
                                    </td>
                                  )
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {q.rawResults.length > 100 && (
                        <p className="text-center text-[11.5px] text-[#8fa3b0] px-4 py-2.5 border-t border-dashed border-[#dde8ec] bg-[#f7fafa]">
                          Menampilkan 100 dari {q.rawResults.length.toLocaleString('id-ID')} baris
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  )
}