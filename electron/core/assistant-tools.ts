import type { ToolDefinition } from '../cloud/chat'
import { createSkillTools, type SkillToolDependencies } from './skills/tools'

/**
 * The assistant loop is added in a later spec; keep the skill tools behind the
 * same factory name so that loop can compose them without changing contracts.
 */
export function createAssistantTools(deps: SkillToolDependencies): ToolDefinition[] {
  return createSkillTools(deps)
}

export { createSkillTools }
export type { SkillToolDependencies }
