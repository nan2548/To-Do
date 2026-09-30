import { useState, useRef, useEffect } from 'react'
import { Trash2, Plus, Check } from 'lucide-react'

const PRI = {
  low:  { label: 'ต่ำ',  cls: 'bg-emerald-100 text-emerald-700', dot: '#10b981' },
  med:  { label: 'กลาง', cls: 'bg-amber-100 text-amber-700',     dot: '#f59e0b' },
  high: { label: 'สูง',  cls: 'bg-rose-100 text-rose-700',       dot: '#f43f5e' },
}
const NEXT = { low: 'med', med: 'high', high: 'low' }
const FILTERS = [['all', 'ทั้งหมด'], ['active', 'ยังไม่เสร็จ'], ['done', 'เสร็จแล้ว']]

let uid = 4
const seed = [
  { id: 1, text: 'ซื้อของเข้าบ้าน', done: false, pri: 'med' },
  { id: 2, text: 'ส่งรายงานให้หัวหน้า', done: false, pri: 'high' },
  { id: 3, text: 'ออกกำลังกาย 30 นาที', done: true, pri: 'low' },
]

function Item({ t, onToggle, onDelete, onEdit, onPri }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(t.text)
  const ref = useRef(null)

  useEffect(() => {
    if (editing && ref.current) ref.current.focus()
  }, [editing])

  const save = () => {
    const v = val.trim()
    if (v) onEdit(t.id, v)
    else setVal(t.text)
    setEditing(false)
  }
  const p = PRI[t.pri]

  return (
    <li
      className={`item entering card mb-2 ${t.leaving ? 'leaving' : ''}`}
      style={{ borderLeft: `4px solid ${p.dot}` }}
    >
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
            <input
              ref={ref}
              className="inp w-full"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              onBlur={save}
              onKeyDown={(e) => {
                if (e.key === 'Enter') save()
                if (e.key === 'Escape') { setVal(t.text); setEditing(false) }
              }}
            />
          ) : (
            <span
              onDoubleClick={() => setEditing(true)}
              title="ดับเบิลคลิกเพื่อแก้ไข"
              className={`block break-words cursor-text select-none ${t.done ? 'line-through opacity-50' : ''}`}
            >
              {t.text}
            </span>
          )}
        </div>

        <button
          onClick={() => onPri(t.id)}
          title="คลิกเพื่อเปลี่ยนระดับความสำคัญ"
          className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${p.cls}`}
        >
          {p.label}
        </button>

        <button
          onClick={() => onDelete(t.id)}
          aria-label="ลบ"
          className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
        >
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
  const [filter, setFilter] = useState('all')

  const add = () => {
    const v = text.trim()
    if (!v) return
    setTodos((ts) => [{ id: uid++, text: v, done: false, pri }, ...ts])
    setText('')
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
  const shown = todos.filter((t) => filter === 'all' || (filter === 'active' ? !t.done : t.done))

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-1">รายการสิ่งที่ต้องทำ</h1>
      <p className="text-sm mb-5" style={{ color: 'var(--muted)' }}>จัดการงานของคุณให้เป็นระเบียบ</p>

      <div className="card p-3 mb-4">
        <div className="flex gap-2">
          <input
            className="inp flex-1 min-w-0"
            placeholder="เพิ่มงานใหม่..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
          />
          <button
            onClick={add}
            className="flex items-center gap-1 bg-indigo-500 hover:bg-indigo-600 text-white font-medium px-4 rounded-lg transition-colors"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">เพิ่ม</span>
          </button>
        </div>
        <div className="flex items-center gap-2 mt-3 text-sm">
          <span style={{ color: 'var(--muted)' }}>ความสำคัญ:</span>
          {Object.keys(PRI).map((k) => (
            <button
              key={k}
              onClick={() => setPri(k)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${PRI[k].cls} ${
                pri === k ? 'ring-2 ring-offset-1 ring-indigo-400' : 'opacity-60'
              }`}
            >
              {PRI[k].label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-1 mb-4 p-1 rounded-xl" style={{ background: 'var(--line)' }}>
        {FILTERS.map(([k, label]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === k ? 'card' : ''}`}
            style={filter === k ? {} : { color: 'var(--muted)' }}
          >
            {label}
          </button>
        ))}
      </div>

      <ul className="list-none p-0">
        {shown.length === 0 ? (
          <li className="text-center py-10 text-sm" style={{ color: 'var(--muted)' }}>
            {filter === 'done' ? 'ยังไม่มีงานที่เสร็จ' : 'ไม่มีงานในรายการ 🎉'}
          </li>
        ) : (
          shown.map((t) => (
            <Item key={t.id} t={t} onToggle={toggle} onDelete={del} onEdit={edit} onPri={cycle} />
          ))
        )}
      </ul>

      <div className="flex items-center justify-between text-sm mt-4">
        <span style={{ color: 'var(--muted)' }}>เหลืออีก {remaining} งาน</span>
        <button
          onClick={clearDone}
          disabled={doneCount === 0}
          className="font-medium text-rose-500 disabled:opacity-30 disabled:cursor-not-allowed hover:underline"
        >
          ล้างงานที่เสร็จแล้ว ({doneCount})
        </button>
      </div>
      <p className="text-xs text-center mt-6" style={{ color: 'var(--muted)' }}>
        ดับเบิลคลิกที่ข้อความเพื่อแก้ไข • คลิกป้ายเพื่อเปลี่ยนความสำคัญ
      </p>
    </div>
  )
}
