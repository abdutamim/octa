import { execFileSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { describe, expect, it } from 'vitest'
import {
  createWorkspace,
  dependencyOrder,
  detectProject,
  mergeBuild,
  normalizeBuildPlan,
  readySubtasks,
  removeWorkspace,
  type BuildPlan,
  type BuildWorkspace,
  type CommandRunner,
  type CoderSessionResult,
  runCoder,
  runQa,
  RecoveryManager,
  registerBuiltOutput,
  writeBuildSpec
} from '../electron/core/octa/build'

function git(cwd: string, args: string[]): string {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: 'Octa test',
      GIT_AUTHOR_EMAIL: 'octa-test@localhost',
      GIT_COMMITTER_NAME: 'Octa test',
      GIT_COMMITTER_EMAIL: 'octa-test@localhost'
    }
  })
}

function tempProject(): { root: string; home: string } {
  const root = mkdtempSync(join(tmpdir(), 'octa-build-project-'))
  const home = mkdtempSync(join(tmpdir(), 'octa-build-home-'))
  writeFileSync(join(root, 'README.md'), '# test\n', 'utf8')
  git(root, ['init'])
  git(root, ['checkout', '-b', 'main'])
  git(root, ['add', '.'])
  git(root, ['commit', '-m', 'initial'])
  return { root, home }
}

function planWithTasks(): BuildPlan {
  return normalizeBuildPlan({
    feature: 'test build',
    complexity: 'medium',
    acceptance: ['The first file exists.', 'The second file exists.'],
    phases: [
      { id: 'phase-1', name: 'Foundation', subtasks: [{ id: 'first', description: 'Create first file', files_to_create: ['first.txt'] }] },
      { id: 'phase-2', name: 'Follow-up', depends_on: ['phase-1'], subtasks: [{ id: 'second', description: 'Create second file', needs: ['first'], files_to_create: ['second.txt'] }] }
    ]
  }, { buildId: 'test-build', request: 'test build' })
}

describe('native build plan model', () => {
  it('writes spec and plan artifacts through the spec planner profile', async () => {
    const outputDir = mkdtempSync(join(tmpdir(), 'octa-build-spec-'))
    let profile: string | undefined
    const result = await writeBuildSpec({
      buildId: 'profile-build',
      request: 'Build a small tool',
      outputDir,
      planner: {
        plan: async (_input, options) => {
          profile = options.profile
          return { feature: 'Small tool', complexity: 'medium', acceptance: ['It works.'], steps: [{ id: 'tool', description: 'Build the tool', needs: [] }] }
        }
      }
    })
    expect(profile).toBe('spec')
    expect(result.plan.phases).toHaveLength(2)
    expect(existsSync(result.specPath)).toBe(true)
    expect(existsSync(result.planPath)).toBe(true)
    expect(readFileSync(result.specPath, 'utf8')).toContain('## Implementation plan')
  })

  it('normalizes phases, acceptance, verification, and dependency order', () => {
    const plan = planWithTasks()
    expect(plan.phases).toHaveLength(2)
    expect(plan.phases[0].subtasks[0].acceptance).toEqual(['The first file exists.', 'The second file exists.'])
    expect(plan.phases[0].subtasks[0].verificationCommands).toEqual(['npm test'])
    expect(dependencyOrder(plan).map((task) => task.id)).toEqual(['first', 'second'])
    expect(readySubtasks(plan).map((task) => task.id)).toEqual(['first'])
  })

  it('chooses the requested phase count for a sentence-only plan', () => {
    const plan = normalizeBuildPlan({ steps: [{ id: 'one', description: 'One' }, { id: 'two', description: 'Two' }, { id: 'three', description: 'Three' }] }, {
      buildId: 'large-build',
      request: 'Build a large platform with authentication and multiple services',
      complexity: 'large'
    })
    expect(plan.complexity).toBe('large')
    expect(plan.phases).toHaveLength(4)
  })

  it('redistributes planner phases when their shape disagrees with complexity', () => {
    const plan = normalizeBuildPlan({
      complexity: 'large',
      phases: [{ id: 'planner-phase', subtasks: [{ id: 'one', description: 'One' }, { id: 'two', description: 'Two' }] }]
    }, { buildId: 'large-shaped-build', request: 'large build', complexity: 'large' })
    expect(plan.phases).toHaveLength(4)
    expect(plan.phases.flatMap((phase) => phase.subtasks).map((task) => task.id)).toEqual(['one', 'two'])
  })
})

describe('native Git workspaces', () => {
  it('creates and removes an isolated worktree and detects Astro commands', async () => {
    const project = tempProject()
    writeFileSync(join(project.root, 'package.json'), JSON.stringify({
      scripts: { test: 'echo test', build: 'astro build' },
      devDependencies: { astro: '^5.0.0' }
    }), 'utf8')
    git(project.root, ['add', 'package.json'])
    git(project.root, ['commit', '-m', 'project metadata'])
    const detected = detectProject(project.root)
    expect(detected.type).toBe('astro')
    expect(detected.testCommand).toBe('npm test')
    const workspace = await createWorkspace({ id: 'workspace-test', octaHome: project.home, projectPath: project.root })
    expect(workspace.mode).toBe('isolated')
    expect(workspace.branch).toBe('build/workspace-test')
    expect(existsSync(join(workspace.path, '.git'))).toBe(true)
    expect(git(project.root, ['branch', '--show-current']).trim()).toBe('main')
    await removeWorkspace(workspace)
    expect(existsSync(workspace.path)).toBe(false)
    expect(git(project.root, ['branch', '--list', workspace.branch]).trim()).toBe('')
  })

  it('previews conflicts and lets the resolver finish a real merge', async () => {
    const project = tempProject()
    writeFileSync(join(project.root, 'shared.txt'), 'base\n', 'utf8')
    git(project.root, ['add', 'shared.txt'])
    git(project.root, ['commit', '-m', 'shared base'])
    const workspace = await createWorkspace({ id: 'merge-test', octaHome: project.home, projectPath: project.root })
    writeFileSync(join(workspace.path, 'shared.txt'), 'build\n', 'utf8')
    git(workspace.path, ['add', 'shared.txt'])
    git(workspace.path, ['commit', '-m', 'build change'])
    writeFileSync(join(project.root, 'shared.txt'), 'target\n', 'utf8')
    git(project.root, ['add', 'shared.txt'])
    git(project.root, ['commit', '-m', 'target change'])
    const result = await mergeBuild({
      buildId: 'merge-test',
      workspace,
      conflictResolver: async ({ targetPath }) => {
        writeFileSync(join(targetPath, 'shared.txt'), 'resolved\n', 'utf8')
        return true
      }
    })
    expect(result.merged).toBe(true)
    expect(readFileSync(join(project.root, 'shared.txt'), 'utf8')).toBe('resolved\n')
    await removeWorkspace(workspace)
  })
})

describe('coder, QA, and recovery', () => {
  it('commits once per subtask and writes session summaries', async () => {
    const project = tempProject()
    const workspace = await createWorkspace({ id: 'coder-test', octaHome: project.home, projectPath: project.root })
    const plan = planWithTasks()
    const sessions: string[] = []
    const result = await runCoder({
      buildId: 'coder-test',
      workspace,
      plan,
      spec: {
        buildId: 'coder-test', title: 'Test', overview: 'Test', objective: 'Test', complexity: 'medium', workflowType: 'custom',
        requirements: [], acceptance: plan.acceptance, filesTouched: [], verificationCommands: ['npm test'], assumptions: [], openQuestions: [], language: 'en'
      },
      executor: async ({ subtask }) => {
        const filename = subtask.id === 'first' ? 'first.txt' : 'second.txt'
        writeFileSync(join(workspace.path, filename), `${subtask.id}\n`, 'utf8')
        sessions.push(subtask.id)
        return { status: 'completed', summary: `completed ${subtask.id}` }
      },
      savePlan: () => undefined
    })
    expect(result.failed).toBeUndefined()
    expect(sessions).toEqual(['first', 'second'])
    expect(git(workspace.path, ['log', '--format=%s', '-2']).split(/\r?\n/).filter(Boolean)).toEqual([
      'build/coder-test: Create second file',
      'build/coder-test: Create first file'
    ])
    expect(existsSync(join(workspace.metadataPath, 'memory', 'session_001.json'))).toBe(true)
    expect(existsSync(join(workspace.metadataPath, 'memory', 'session_002.json'))).toBe(true)
  })

  it('caps QA at three loops even when Sol keeps requesting changes', async () => {
    const project = tempProject()
    const workspace = await createWorkspace({ id: 'qa-test', octaHome: project.home, projectPath: project.root })
    const plan = normalizeBuildPlan({ steps: [{ id: 'only', description: 'No-op' }] }, { buildId: 'qa-test', request: 'qa test' })
    let reviews = 0
    let fixes = 0
    const result = await runQa({
      buildId: 'qa-test',
      workspace,
      spec: {
        buildId: 'qa-test', title: 'QA', overview: 'QA', objective: 'QA', complexity: 'small', workflowType: 'custom',
        requirements: [], acceptance: ['It works.'], filesTouched: [], verificationCommands: [], assumptions: [], openQuestions: [], language: 'en'
      },
      plan,
      testCommand: undefined,
      reviewer: async () => { reviews += 1; return { verdict: 'revise', issues: [{ message: 'Still wrong.' }] } },
      fixer: async () => { fixes += 1; return { status: 'completed' } },
      maxLoops: 99
    })
    expect(result.passed).toBe(false)
    expect(result.loops).toBe(3)
    expect(reviews).toBe(3)
    expect(fixes).toBe(2)
  })

  it('resumes an interrupted subtask and rolls back to the last good commit', async () => {
    const project = tempProject()
    const workspace = await createWorkspace({ id: 'recovery-test', octaHome: project.home, projectPath: project.root })
    writeFileSync(join(workspace.path, 'good.txt'), 'good\n', 'utf8')
    git(workspace.path, ['add', 'good.txt'])
    git(workspace.path, ['commit', '-m', 'good commit'])
    const goodHash = git(workspace.path, ['rev-parse', 'HEAD']).trim()
    writeFileSync(join(workspace.path, 'bad.txt'), 'bad\n', 'utf8')
    git(workspace.path, ['add', 'bad.txt'])
    git(workspace.path, ['commit', '-m', 'bad commit'])
    const plan = normalizeBuildPlan({ steps: [{ id: 'one', description: 'One' }] }, { buildId: 'recovery-test', request: 'recovery test' })
    plan.phases[0].subtasks[0].status = 'in_progress'
    const recovery = new RecoveryManager({ workspace, plan })
    recovery.recordGoodCommit(goodHash, 'one', 'good commit')
    expect(recovery.resumeFromLastCommit().nextSubtask?.id).toBe('one')
    await recovery.rollbackToLastGoodCommit()
    expect(existsSync(join(workspace.path, 'good.txt'))).toBe(true)
    expect(existsSync(join(workspace.path, 'bad.txt'))).toBe(false)
    expect(readFileSync(join(workspace.path, 'good.txt'), 'utf8')).toBe('good\n')
  })

  it('registers the Arabic word-count request in an isolated skills registry', async () => {
    const library = mkdtempSync(join(tmpdir(), 'octa-build-skills-'))
    copyFileSync(resolve('skills-library', 'MANIFEST.json'), join(library, 'MANIFEST.json'))
    const brief = 'ابنيلي tool يعمل word count لملف'
    const spec = {
      buildId: 'word-count-tool', title: 'Word count tool', overview: brief, objective: brief,
      complexity: 'small' as const, workflowType: 'custom', requirements: [brief],
      acceptance: ['Counts words without overwriting the source file.'], filesTouched: ['word-count.js'],
      verificationCommands: ['node word-count.js'], assumptions: [], openQuestions: [], language: 'ar-EG'
    }
    const plan = {
      planId: 'word-count-tool', feature: 'Word count tool', summary: brief, complexity: 'small' as const,
      workflowType: 'custom', phases: [], acceptance: spec.acceptance, assumptions: [], questions: [], deliverables: []
    }
    const result = await registerBuiltOutput({
      buildId: 'word-count-tool', brief, spec, plan, skillsLibraryPath: library, skillCreator: async () => false
    })
    const manifest = JSON.parse(readFileSync(join(library, 'MANIFEST.json'), 'utf8')) as { skills: Array<{ name: string }> }
    expect(result.name).toBe('word-count')
    expect(manifest.skills.some((entry) => entry.name === 'word-count')).toBe(true)
    expect(readFileSync(result.path, 'utf8')).toContain('هذه المهارة')
  })
})
