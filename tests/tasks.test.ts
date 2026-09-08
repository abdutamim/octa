import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { TaskRepository } from '../electron/db/tasks'

describe('task repository', () => {
  let directory: string
  let repository: TaskRepository

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'tamim-tasks-'))
    repository = new TaskRepository(join(directory, 'tasks.db'))
  })

  afterEach(() => {
    repository.close()
    rmSync(directory, { recursive: true, force: true })
  })

  it('rejects a task with no title instead of storing a blank row', () => {
    expect(() => repository.create({ title: '   ' })).toThrow()
  })

  it('keeps Arabic titles intact', () => {
    const task = repository.create({ title: 'أكلّم العميل بتاع Outfred' })
    expect(repository.get(task.id)?.title).toBe('أكلّم العميل بتاع Outfred')
  })

  describe('time tracking', () => {
    it('accumulates only completed sessions', () => {
      const task = repository.create({ title: 'Build the tasks page' })
      repository.start(task.id, 1_000)
      repository.stop(task.id, 61_000)
      expect(repository.get(task.id)?.trackedSeconds).toBe(60)
    })

    it('reports a running task without counting its open session yet', () => {
      const task = repository.create({ title: 'Write the spec' })
      repository.start(task.id, 5_000)
      const running = repository.get(task.id)!
      expect(running.runningSince).toBe(5_000)
      expect(running.trackedSeconds).toBe(0)
    })

    it('stops the previous task when another one starts', () => {
      // Two clocks running at once would each claim the same wall-clock minutes.
      const first = repository.create({ title: 'First' })
      const second = repository.create({ title: 'Second' })
      repository.start(first.id, 0)
      repository.start(second.id, 30_000)

      expect(repository.get(first.id)?.runningSince).toBeNull()
      expect(repository.get(first.id)?.trackedSeconds).toBe(30)
      expect(repository.get(second.id)?.runningSince).toBe(30_000)
      expect(repository.running()?.id).toBe(second.id)
    })

    it('sums several sessions on the same task', () => {
      const task = repository.create({ title: 'Long job' })
      repository.start(task.id, 0)
      repository.stop(task.id, 60_000)
      repository.start(task.id, 100_000)
      repository.stop(task.id, 160_000)
      expect(repository.get(task.id)?.trackedSeconds).toBe(120)
    })

    it('closes the clock when a task is completed', () => {
      // Leaving it running would bill hours to something nobody is working on.
      const task = repository.create({ title: 'Finish and forget' })
      repository.start(task.id, 0)
      repository.update(task.id, { status: 'done' })
      expect(repository.get(task.id)?.runningSince).toBeNull()
    })

    it('closes the clock when a task is dropped', () => {
      const task = repository.create({ title: 'Abandon this' })
      repository.start(task.id, 0)
      repository.update(task.id, { status: 'dropped' })
      expect(repository.get(task.id)?.runningSince).toBeNull()
    })

    it('starting a task moves it into doing', () => {
      const task = repository.create({ title: 'Auto status', status: 'todo' })
      expect(repository.start(task.id).status).toBe('doing')
    })
  })

  describe('completion', () => {
    it('stamps completedAt once and does not move it on later edits', () => {
      const task = repository.create({ title: 'Ship it' })
      const done = repository.update(task.id, { status: 'done' })
      const stamp = done.completedAt
      expect(stamp).toBeTypeOf('number')
      const edited = repository.update(task.id, { title: 'Ship it properly' })
      expect(edited.completedAt).toBe(stamp)
    })

    it('clears completedAt when a task is reopened', () => {
      const task = repository.create({ title: 'Reopen me' })
      repository.update(task.id, { status: 'done' })
      expect(repository.update(task.id, { status: 'todo' }).completedAt).toBeNull()
    })
  })

  describe('listing', () => {
    it('puts undated tasks after dated ones rather than first', () => {
      // NULL sorts before everything in ascending order, which would push every
      // undated task to the top of the board.
      repository.create({ title: 'No date', status: 'todo' })
      repository.create({ title: 'Dated', status: 'todo', dueAt: 5_000 })
      expect(repository.list({ status: 'todo' }).map((task) => task.title)).toEqual([
        'Dated',
        'No date'
      ])
    })

    it('orders doing before todo before inbox', () => {
      repository.create({ title: 'C', status: 'inbox' })
      repository.create({ title: 'A', status: 'doing' })
      repository.create({ title: 'B', status: 'todo' })
      expect(repository.list().map((task) => task.title)).toEqual(['A', 'B', 'C'])
    })

    it('ranks higher priority first within a status', () => {
      repository.create({ title: 'Normal', status: 'todo', priority: 0 })
      repository.create({ title: 'Urgent', status: 'todo', priority: 2 })
      expect(repository.list({ status: 'todo' })[0].title).toBe('Urgent')
    })

    it('clamps an out-of-range priority instead of storing it', () => {
      expect(repository.create({ title: 'Wild', priority: 99 }).priority).toBe(2)
      expect(repository.create({ title: 'Negative', priority: -5 }).priority).toBe(0)
    })

    it('searches titles and notes', () => {
      repository.create({ title: 'Invoice Outfred', notes: '' })
      repository.create({ title: 'Unrelated', notes: 'mentions outfred inside' })
      repository.create({ title: 'Nothing to do with it' })
      expect(repository.list({ query: 'outfred' })).toHaveLength(2)
    })
  })

  it('deletes a task and its sessions together', () => {
    const task = repository.create({ title: 'Temporary' })
    repository.start(task.id, 0)
    repository.stop(task.id, 1_000)
    expect(repository.remove(task.id)).toBe(true)
    expect(repository.get(task.id)).toBeUndefined()
    expect(repository.sessions(task.id)).toHaveLength(0)
  })
})
