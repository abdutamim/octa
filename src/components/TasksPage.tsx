import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  Check,
  ChevronDown,
  CircleDashed,
  Flame,
  Pause,
  Play,
  Plus,
  Search,
  Trash2,
  X
} from 'lucide-react'
import type { NewTask, TaskRecord, TaskStatus } from '../../electron/types'

const COLUMNS: Array<{ status: TaskStatus; label: string }> = [
  { status: 'doing', label: 'Doing' },
  { status: 'todo', label: 'To do' },
  { status: 'inbox', label: 'Inbox' },
  { status: 'done', label: 'Done' }
]

const PRIORITY_LABEL = ['Normal', 'High', 'Urgent']

function elapsed(task: TaskRecord, now: number): number {
  const open = task.runningSince ? Math.max(0, Math.floor((now - task.runningSince) / 1000)) : 0
  return task.trackedSeconds + open
}

export function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0m'
  if (seconds < 60) return `${seconds}s`
  const total = Math.round(seconds / 60)
  const hours = Math.floor(total / 60)
  return hours ? `${hours}h ${total % 60}m` : `${total}m`
}

function dueLabel(dueAt: number | null, now: number): { text: string; tone: string } | undefined {
  if (!dueAt) return undefined
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  const days = Math.round((dueAt - start.getTime()) / 86_400_000)
  if (days < 0) return { text: `${Math.abs(days)}d overdue`, tone: 'overdue' }
  if (days === 0) return { text: 'Today', tone: 'today' }
  if (days === 1) return { text: 'Tomorrow', tone: 'soon' }
  return { text: new Date(dueAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), tone: '' }
}

function TaskComposer({
  projects,
  onCreate
}: {
  projects: string[]
  onCreate: (input: NewTask) => void
}): React.JSX.Element {
  const [title, setTitle] = useState('')
  const [open, setOpen] = useState(false)
  const [project, setProject] = useState('')
  const [priority, setPriority] = useState(0)
  const [due, setDue] = useState('')
  const [estimate, setEstimate] = useState('')

  const submit = (): void => {
    const trimmed = title.trim()
    if (!trimmed) return
    onCreate({
      title: trimmed,
      project,
      priority,
      // Noon avoids the date landing on the previous day in negative-offset zones.
      dueAt: due ? new Date(`${due}T12:00:00`).getTime() : null,
      estimateMinutes: estimate ? Number(estimate) : null,
      status: 'todo'
    })
    setTitle('')
    setDue('')
    setEstimate('')
    setPriority(0)
  }

  return (
    <section className="task-composer glass">
      <div className="task-composer-main">
        <Plus size={17} />
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && submit()}
          placeholder="What needs doing?"
          dir="auto"
          aria-label="New task title"
        />
        <button
          className="text-button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
        >
          Details <ChevronDown size={14} className={open ? 'flipped' : ''} />
        </button>
        <button className="primary-button compact" onClick={submit} disabled={!title.trim()}>
          Add
        </button>
      </div>
      {open && (
        <div className="task-composer-details">
          <label>
            <span>Project</span>
            <input
              value={project}
              onChange={(event) => setProject(event.target.value)}
              list="task-projects"
              placeholder="Outfred"
              dir="auto"
            />
            <datalist id="task-projects">
              {projects.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </label>
          <label>
            <span>Priority</span>
            <select value={priority} onChange={(event) => setPriority(Number(event.target.value))}>
              {PRIORITY_LABEL.map((label, index) => (
                <option key={label} value={index}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Due</span>
            <input type="date" value={due} onChange={(event) => setDue(event.target.value)} />
          </label>
          <label>
            <span>Estimate</span>
            <input
              type="number"
              min={1}
              value={estimate}
              onChange={(event) => setEstimate(event.target.value)}
              placeholder="minutes"
            />
          </label>
        </div>
      )}
    </section>
  )
}

function TaskCard({
  task,
  now,
  onToggleTimer,
  onComplete,
  onDelete,
  onEdit
}: {
  task: TaskRecord
  now: number
  onToggleTimer: () => void
  onComplete: () => void
  onDelete: () => void
  onEdit: (patch: Partial<NewTask>) => void
}): React.JSX.Element {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(task.title)
  const due = dueLabel(task.dueAt, now)
  const running = task.runningSince !== null
  const tracked = elapsed(task, now)
  const overBudget =
    task.estimateMinutes !== null && tracked > task.estimateMinutes * 60

  return (
    <article className={`task-card${running ? ' running' : ''}`}>
      <button
        className="task-check"
        onClick={onComplete}
        aria-label={task.status === 'done' ? 'Reopen task' : 'Complete task'}
      >
        {task.status === 'done' ? <Check size={14} /> : <CircleDashed size={15} />}
      </button>

      <div className="task-body">
        {editing ? (
          <input
            className="task-title-input"
            value={draft}
            autoFocus
            dir="auto"
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => {
              setEditing(false)
              if (draft.trim() && draft !== task.title) onEdit({ title: draft.trim() })
              else setDraft(task.title)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur()
              if (event.key === 'Escape') {
                setDraft(task.title)
                setEditing(false)
              }
            }}
          />
        ) : (
          <p className="task-title" dir="auto" onDoubleClick={() => setEditing(true)}>
            {task.title}
          </p>
        )}

        <div className="task-meta">
          {task.priority > 0 && (
            <span className={`task-flag p${task.priority}`}>
              <Flame size={11} /> {PRIORITY_LABEL[task.priority]}
            </span>
          )}
          {task.project && <span className="task-chip">{task.project}</span>}
          {due && <span className={`task-due ${due.tone}`}>{due.text}</span>}
          {(tracked > 0 || running) && (
            <span className={`task-time${overBudget ? ' over' : ''}${running ? ' live' : ''}`}>
              {formatDuration(tracked)}
              {task.estimateMinutes ? ` / ${formatDuration(task.estimateMinutes * 60)}` : ''}
            </span>
          )}
          {task.source === 'voice' && <span className="task-chip subtle">voice</span>}
        </div>
      </div>

      <div className="task-actions">
        {task.status !== 'done' && (
          <button
            className={`task-timer${running ? ' running' : ''}`}
            onClick={onToggleTimer}
            aria-label={running ? 'Stop timing' : 'Start timing'}
            title={running ? 'Stop timing' : 'Start timing'}
          >
            {running ? <Pause size={14} /> : <Play size={14} />}
          </button>
        )}
        <button onClick={onDelete} aria-label="Delete task" title="Delete task">
          <Trash2 size={14} />
        </button>
      </div>
    </article>
  )
}

export function TasksPage({ onBack }: { onBack: () => void }): React.JSX.Element {
  const [tasks, setTasks] = useState<TaskRecord[]>([])
  const [projects, setProjects] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [project, setProject] = useState('')
  const [now, setNow] = useState(() => Date.now())
  const [error, setError] = useState('')
  const timer = useRef<ReturnType<typeof setInterval>>(undefined)

  const load = useCallback(async () => {
    const [nextTasks, nextProjects] = await Promise.all([
      window.octa.tasks.list({ query, project: project || undefined }),
      window.octa.tasks.projects()
    ])
    setTasks(nextTasks)
    setProjects(nextProjects)
  }, [query, project])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => window.octa.onTasksChanged(() => void load()), [load])

  // Only tick while something is actually being timed; a second-by-second
  // re-render of a static board is pure waste.
  const hasRunning = tasks.some((task) => task.runningSince !== null)
  useEffect(() => {
    if (!hasRunning) return
    timer.current = setInterval(() => setNow(Date.now()), 1_000)
    return () => clearInterval(timer.current)
  }, [hasRunning])

  const run = async (action: Promise<unknown>): Promise<void> => {
    try {
      setError('')
      await action
      await load()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
    }
  }

  const grouped = useMemo(
    () =>
      COLUMNS.map((column) => ({
        ...column,
        items: tasks.filter((task) => task.status === column.status)
      })),
    [tasks]
  )

  const totalToday = useMemo(
    () => tasks.reduce((sum, task) => sum + elapsed(task, now), 0),
    [tasks, now]
  )

  return (
    <div className="page">
      <header className="compact-heading">
        <div>
          <span className="eyebrow">WORK</span>
          <h1>Tasks</h1>
        </div>
        <div className="heading-actions">
          <span className="task-total">{formatDuration(totalToday)} tracked</span>
          <button className="text-button" onClick={onBack}>
            <ArrowLeft size={15} /> Back home
          </button>
        </div>
      </header>

      <TaskComposer
        projects={projects}
        onCreate={(input) => void run(window.octa.tasks.create(input))}
      />

      {error && <p className="inline-error">{error}</p>}

      <div className="task-toolbar">
        <label className="search-box glass">
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tasks…"
            dir="auto"
          />
        </label>
        <select value={project} onChange={(event) => setProject(event.target.value)} aria-label="Filter by project">
          <option value="">All projects</option>
          {projects.map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
        {(query || project) && (
          <button
            className="text-button"
            onClick={() => {
              setQuery('')
              setProject('')
            }}
          >
            <X size={14} /> Clear
          </button>
        )}
      </div>

      <div className="task-board">
        {grouped.map((column) => (
          <section className="task-column" key={column.status}>
            <header>
              <h3>{column.label}</h3>
              <span>{column.items.length}</span>
            </header>
            <div className="task-column-list">
              {column.items.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  now={now}
                  onToggleTimer={() =>
                    void run(
                      task.runningSince
                        ? window.octa.tasks.stop(task.id)
                        : window.octa.tasks.start(task.id)
                    )
                  }
                  onComplete={() =>
                    void run(
                      window.octa.tasks.update(task.id, {
                        status: task.status === 'done' ? 'todo' : 'done'
                      })
                    )
                  }
                  onDelete={() => void run(window.octa.tasks.remove(task.id))}
                  onEdit={(patch) => void run(window.octa.tasks.update(task.id, patch))}
                />
              ))}
              {column.items.length === 0 && <p className="task-column-empty">Nothing here</p>}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
