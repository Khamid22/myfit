import { RULES } from './rules'
import type { CoachContext, Recommendation, RecommendationProvider, Rule, Scope } from './types'

export function runRules(rules: Rule[], ctx: CoachContext, scope: Scope, max = 3): Recommendation[] {
  return rules
    .filter((r) => r.scope === scope && safe(() => r.when(ctx)))
    .slice(0, max)
    .map((r) => ({ id: r.id, tone: r.tone, text: r.text(ctx) }))
}

function safe(fn: () => boolean) {
  try {
    return fn()
  } catch {
    return false
  }
}

/** V1 coach: deterministic rules. Swap or chain with an AI provider later. */
export const ruleCoach: RecommendationProvider = {
  recommend: (ctx, scope, max) => runRules(RULES, ctx, scope, max),
}
