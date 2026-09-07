import type { JobRunnerName } from '../../types'

export type SkillExecutorRunner = 'claude-skill' | 'codex-exec'

/** Skills whose workflows require Claude Code's MCP/tool-driven environment. */
export const CLAUDE_SKILL_FOLDERS: ReadonlySet<string> = new Set([
  'web-perf',
  'frontend-ui-polisher',
  'skill-creator',
  'photoshop-driver',
  'photoshop-posts',
  'carousel-forge',
  'carousel-studio',
  'tamim-carousel',
  'growth-os',
  'turnstile-spin',
  'mcp-server-builder'
])

/** Resolve the executor required by a manifest folder and its SKILL.md. */
export function runnerForSkill(
  folder: string,
  frontmatterRunner?: string,
  manifestRunner?: string
): SkillExecutorRunner {
  if (CLAUDE_SKILL_FOLDERS.has(folder) || frontmatterRunner === 'claude' || manifestRunner === 'claude') {
    return 'claude-skill'
  }
  return 'codex-exec'
}

export function isSkillExecutorRunner(value: JobRunnerName | string): value is SkillExecutorRunner {
  return value === 'claude-skill' || value === 'codex-exec'
}
