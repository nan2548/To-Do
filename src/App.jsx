import { useState, useRef, useEffect, useMemo } from 'react'
import { Trash2, Plus, Check, Search, CalendarDays } from 'lucide-react'

const PRI = {
  low:  { label: 'ต่ำ',  cls: 'bg-emerald-100 text-emerald-700', dot: '#10b981' },
  med:  { label: 'กลาง', cls: 'bg-amber-100 text-amber-700',     dot: '#f59e0b' },
  high: { label: 'สูง',  cls: 'bg-rose-100 text-rose-700',       dot: '#f43f5e' },
}
const NEXT = { low: 'med', med: 'high', high: 'low' }
const CATS = {
  work:     { label: 'งาน',       cls: 'bg-sky-100 text-sky-700' },
  personal: { label: 'ส่วนตัว',    cls: 'bg-violet-100 text-violet-700' },
  shopping: { label: 'ช้อปปิ้ง',   cls: 'bg-pink-100 text-pink-700' },
  health:   { label: 'สุขภาพ',    cls: 'bg-teal-100 text-teal-700' },
}
const FILTERS = [['all', 'ทั้งหมด'], ['active', 'ยังไม่เสร็จ'], ['done', 'เสร็จแล้ว']]

const pad = (n) => String(n).padStart(2, '0')
const toStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const todayStr = () => toStr(new Date())
const offset = (days) => { const d = new Date(); d.setDate(d.getDate() + days); return toStr(d) }
const fmt = (s) => new Date(s + 'T00:00:00').toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })

// 'overdue' | 'today' | 'later' | null
const dueState = (t, today) => (!t.due || t.done ? (t.due ? 'later' : null) : t.due < today ? 'overdue' : t.due === today ? 'today' : 'later')
const DUE_CLS = {
  overdue: 'bg-red-100 text-red-700',
  today: 'bg-yellow-100 text-yellow-800',
  later: 'bg-gray-100 text-gray-600',
}
const DUE_LABEL = { overdue: 'เลยกำหนด · ', today: 'วันนี้ · ', later: '' }

let uid = 6
const seed = [
  { id: 1, text: 'ซื้อของเข้าบ้าน', done: false, pri: 'med', cat: 'shopping', due: offset(0) },
  { id: 2, text: 'ส่งรายงานให้หัวหน้า', done: false, pri: 'high', cat: 'work', due: offset(-1) },
  { id: 3, text: 'ออกกำลังกาย 30 นาที', done: true, pri: 'low', cat: 'health', due: offset(0) },
  { id: 4, text: 'โทรหาที่บ้าน', done: false, pri: 'low', cat: 'personal', due: offset(3) },
  { id: 5, text: 'นัดตรวจสุขภาพประจำปี', done: false, pri: 'med', cat: 'health', due: '' },
]

function Donut({ done, active, overdue }) {
  const total = done + active + overdue
  const segs = [
    [done, '#10b981'],
    [active, '#6366f1'],
    [overdue, '#ef4444'],
  ]
  let acc = 0
  return (
    <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90 shrink-0">
      <circle cx="18" cy="18" r="15.9155" fill="none" stroke="var(--line)" strokeWidth="4" />
      {total > 0 &&
        segs.map(([v, c], i) => {
          const len = (v / total) * 100
          const el = v > 0 && (
            <circle key={i} cx="18" cy="18" r="15.9155" fill="none" stroke={c} strokeWidth="4"
              strokeDasharray={`${len} ${100 - len}`} strokeDashoffset={-acc} />
          )
          acc += len
          return el
        })}
    </svg>
  )
}

function Item({ t, today, onToggle, onDelete, onEdit, onPri }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(t.text)
  const ref = useRef(null)
  useEffect(() => { if (editing && ref.current) ref.current.focus() }, [editing])

  const save = () => {
    const v = val.trim()
    if (v) onEdit(t.id, v)
    else setVal(t.text)
    setEditing(false)
  }
  const p = PRI[t.pri]
  const ds = dueState(t, today)

  return (
    <li className={`item entering card mb-2 ${t.leaving ? 'leaving' : ''}`} style={{ borderLeft: `4px solid ${p.dot}` }}>
      <div className="flex items-center gap-3 p-3">
        <button
          onClick={() => onToggle(t.id)}
          aria-label="ทำเครื่องหมายว่าเสร็จ"
          className={`shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center text-white transition-colors ${
            t.done ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300'
          }`}
        >
          {t.done && <Check size={14} strokeWidth={3} />}
        </button>

        <div className="flex-1 min-w-0">
          {editing ? (
            <input ref={ref} className="inp w-full" value={val} onChange={(e) => setVal(e.target.value)} onBlur={save}
              onKeyDown={(e) => {
                if (e.key === 'Enter') save()
                if (e.key === 'Escape') { setVal(t.text); setEditing(false) }
              }} />
          ) : (
            <span onDoubleClick={() => setEditing(true)} title="ดับเบิลคลิกเพื่อแก้ไข"
              className={`block break-words cursor-text select-none ${t.done ? 'line-through opacity-50' : ''}`}>
              {t.text}
            </span>
          )}
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${CATS[t.cat].cls}`}>{CATS[t.cat].label}</span>
            {ds && (
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${DUE_CLS[ds]}`}>
                <CalendarDays size={11} />{DUE_LABEL[ds]}{fmt(t.due)}
              </span>
            )}
          </div>
        </div>

        <button onClick={() => onPri(t.id)} title="คลิกเพื่อเปลี่ยนระดับความสำคัญ"
          className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${p.cls}`}>
          {p.label}
        </button>
        <button onClick={() => onDelete(t.id)} aria-label="ลบ"
          className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-colors">
          <Trash2 size={18} />
        </button>
      </div>
    </li>
  )
}

export default function App() {
  const [todos, setTodos] = useState(seed)
  const [text, setText] = useState('')
  const [pri, setPri] = useState('med')
  const [cat, setCat] = useState('personal')
  const [due, setDue] = useState('')
  const [filter, setFilter] = useState('all')
  const [catFilter, setCatFilter] = useState('all')
  const [query, setQuery] = useState('')
  const today = todayStr()

  const add = () => {
    const v = text.trim()
    if (!v) return
    setTodos((ts) => [{ id: uid++, text: v, done: false, pri, cat, due }, ...ts])
    setText('')
    setDue('')
  }
  const toggle = (id) => setTodos((ts) => ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  const edit = (id, v) => setTodos((ts) => ts.map((t) => (t.id === id ? { ...t, text: v } : t)))
  const cycle = (id) => setTodos((ts) => ts.map((t) => (t.id === id ? { ...t, pri: NEXT[t.pri] } : t)))
  const del = (id) => {
    setTodos((ts) => ts.map((t) => (t.id === id ? { ...t, leaving: true } : t)))
    setTimeout(() => setTodos((ts) => ts.filter((t) => t.id !== id)), 250)
  }
  const clearDone = () => setTodos((ts) => ts.filter((t) => !t.done))

  const remaining = todos.filter((t) => !t.done).length
  const doneCount = todos.length - remaining
  const overdueCount = todos.filter((t) => dueState(t, today) === 'overdue').length
  const activeCount = remaining - overdueCount
  const pct = todos.length ? Math.round((doneCount / todos.length) * 100) : 0

  const catCounts = useMemo(() => {
    const c = { all: todos.length }
    Object.keys(CATS).forEach((k) => (c[k] = todos.filter((t) => t.cat === k).length))
    return c
  }, [todos])

  const q = query.trim().toLowerCase()
  const shown = todos.filter(
    (t) =>
      (filter === 'all' || (filter === 'active' ? !t.done : t.done)) &&
      (catFilter === 'all' || t.cat === catFilter) &&
      (!q || t.text.toLowerCase().includes(q)),
  )

  const sideBtn = (k, label, active) => (
    <button key={k} onClick={() => setCatFilter(k)}
      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${active ? 'bg-indigo-500 text-white font-medium' : 'hover:bg-black/5'}`}>
      <span>{label}</span>
      <span className={`text-xs px-2 py-0.5 rounded-full ${active ? 'bg-white/25' : ''}`} style={active ? {} : { background: 'var(--line)' }}>{catCounts[k]}</span>
    </button>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-1">รายการสิ่งที่ต้องทำ</h1>
      <p className="text-sm mb-5" style={{ color: 'var(--muted)' }}>จัดการงานของคุณให้เป็นระเบียบ</p>

      <div className="grid gap-4 md:grid-cols-[230px_1fr] items-start">
        {/* Sidebar */}
        <aside className="space-y-4 md:sticky md:top-4">
          <div className="card p-3">
            <div className="text-xs font-semibold mb-2 px-1" style={{ color: 'var(--muted)' }}>หมวดหมู่</div>
            {sideBtn('all', 'ทั้งหมด', catFilter === 'all')}
            {Object.entries(CATS).map(([k, c]) => sideBtn(k, c.label, catFilter === k))}
          </div>

          <div className="card p-4">
            <div className="text-xs font-semibold mb-3" style={{ color: 'var(--muted)' }}>สถิติ</div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Donut done={doneCount} active={activeCount} overdue={overdueCount} />
                <div className="absolute inset-0 flex items-center justify-center text-lg font-semibold">{pct}%</div>
              </div>
              <div className="text-xs space-y-1.5">
                <div className="font-medium text-sm">ทั้งหมด {todos.length} งาน</div>
                <div className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-full bg-emerald-500" />เสร็จแล้ว {doneCount}</div>
                <div className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-full bg-indigo-500" />กำลังทำ {activeCount}</div>
                <div className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-full bg-red-500" />เลยกำหนด {overdueCount}</div>
              </div>
            </div>
            <div className="text-xs mt-3" style={{ color: 'var(--muted)' }}>เสร็จสมบูรณ์ {pct}%</div>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0">
          <div className="card p-3 mb-4">
            <div className="flex gap-2">
              <input className="inp flex-1 min-w-0" placeholder="เพิ่มงานใหม่..." value={text}
                onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
              <button onClick={add} className="flex items-center gap-1 bg-indigo-500 hover:bg-indigo-600 text-white font-medium px-4 rounded-lg transition-colors">
                <Plus size={18} /><span className="hidden sm:inline">เพิ่ม</span>
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-3 text-sm">
              <select className="inp !py-1 text-xs" value={cat} onChange={(e) => setCat(e.target.value)}>
                {Object.entries(CATS).map(([k, c]) => <option key={k} value={k}>{c.label}</option>)}
              </select>
              <input type="date" className="inp !py-1 text-xs" value={due} onChange={(e) => setDue(e.target.value)} title="วันกำหนดส่ง" />
              <span className="ml-1" style={{ color: 'var(--muted)' }}>ความสำคัญ:</span>
              {Object.keys(PRI).map((k) => (
                <button key={k} onClick={() => setPri(k)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${PRI[k].cls} ${pri === k ? 'ring-2 ring-offset-1 ring-indigo-400' : 'opacity-60'}`}>
                  {PRI[k].label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
            <input className="inp w-full !pl-9" placeholder="ค้นหางาน..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>

          <div className="flex gap-1 mb-4 p-1 rounded-xl" style={{ background: 'var(--line)' }}>
            {FILTERS.map(([k, label]) => (
              <button key={k} onClick={() => setFilter(k)}
                className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === k ? 'card' : ''}`}
                style={filter === k ? {} : { color: 'var(--muted)' }}>
                {label}
              </button>
            ))}
          </div>

          <ul className="list-none p-0">
            {shown.length === 0 ? (
              <li className="text-center py-10 text-sm" style={{ color: 'var(--muted)' }}>
                {q ? 'ไม่พบงานที่ค้นหา' : filter === 'done' ? 'ยังไม่มีงานที่เสร็จ' : 'ไม่มีงานในรายการ 🎉'}
              </li>
            ) : (
              shown.map((t) => <Item key={t.id} t={t} today={today} onToggle={toggle} onDelete={del} onEdit={edit} onPri={cycle} />)
            )}
          </ul>

          <div className="flex items-center justify-between text-sm mt-4">
            <span style={{ color: 'var(--muted)' }}>เหลืออีก {remaining} งาน</span>
            <button onClick={clearDone} disabled={doneCount === 0}
              className="font-medium text-rose-500 disabled:opacity-30 disabled:cursor-not-allowed hover:underline">
              ล้างงานที่เสร็จแล้ว ({doneCount})
            </button>
          </div>
          <p className="text-xs text-center mt-6" style={{ color: 'var(--muted)' }}>
            ดับเบิลคลิกที่ข้อความเพื่อแก้ไข • คลิกป้ายเพื่อเปลี่ยนความสำคัญ
          </p>
        </main>
      </div>
    </div>
  )
}
