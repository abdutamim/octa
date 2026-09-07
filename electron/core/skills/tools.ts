import type { ToolDefinition } from '../../cloud/chat'
import {
  runSkill as startSkill,
  type JobHandle,
  type JobRunnerOptions,
  type RunSkillRequest
} from '../jobs/runner'
import { SkillRegistry, type SkillListOptions } from './registry'

export interface SkillToolDependencies {
  registry: SkillRegistry
  /** Injectable for tests and for future planner/workflow runners. */
  runSkill?: (request: RunSkillRequest, options?: JobRunnerOptions) => JobHandle
  runnerOptions?: JobRunnerOptions
}

function optionalString(args: Record<string, unknown>, key: string): string | undefined {
  const value = args[key]
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value !== 'string') throw new Error(`${key} must be a string.`)
  return value.trim() || undefined
}

function requiredString(args: Record<string, unknown>, key: string): string {
  const value = args[key]
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${key} must be a non-empty string.`)
  return value.trim()
}

function listOptions(args: Record<string, unknown>): SkillListOptions {
  const includeReference = args.includeReference
  if (includeReference !== undefined && typeof includeReference !== 'boolean') {
    throw new Error('includeReference must be a boolean.')
  }
  return {
    department: optionalString(args, 'department'),
    query: optionalString(args, 'query'),
    includeReference
  }
}

/** Tool definitions consumed by Gemini/Claude assistant loops. */
export function createSkillTools(deps: SkillToolDependencies): ToolDefinition[] {
  const run = deps.runSkill ?? startSkill
  return [
    {
      name: 'list_skills',
      description: 'List runnable Octa skills by department or search query. Reference skills are omitted unless requested.',
      parameters: {
        type: 'object',
        properties: {
          department: { type: 'string', description: 'Optional department filter.' },
          query: { type: 'string', description: 'Optional search across skill names and descriptions.' },
          includeReference: { type: 'boolean', description: 'Include reference-only skills in the result.' }
        }
      },
      execute: async (args) => deps.registry.listSkills(listOptions(args))
    },
    {
      name: 'run_skill',
      description: 'Start a runnable Octa skill job with the supplied JSON input. The job id and folder are returned immediately.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Exact skill name from list_skills.' },
          input: { type: 'object', description: 'JSON input passed to the skill.' }
        },
        required: ['name']
      },
      execute: async (args) => {
        const name = requiredString(args, 'name')
        const skill = deps.registry.getSkill(name)
        if (!skill) throw new Error(`Skill "${name}" was not found.`)
        if (skill.verdict === 'reference' || skill.verdict === 'drop' || skill.verdict === 'merge') {
          throw new Error(`Skill "${name}" is not runnable (verdict: ${skill.verdict}).`)
        }
        // Resolve before starting so a missing folder is reported to the
        // assistant instead of becoming a silent failed job.
        deps.registry.resolveSkillDir(name)
        const runner = deps.registry.runnerFor(name)
        const handle = run({
          name,
          input: args.input === undefined ? {} : args.input,
          runner,
          department: skill.department,
          autonomy: skill.autonomy,
          skillsLibraryPath: deps.registry.libraryPath
        }, deps.runnerOptions)
        return {
          id: handle.id,
          jobId: handle.jobId,
          folder: handle.folder,
          name,
          runner
        }
      }
    }
  ]
}
