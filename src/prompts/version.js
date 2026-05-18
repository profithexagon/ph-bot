/**
 * Prompt version registry.
 *
 * Bump PROMPT_VERSION whenever you make a meaningful change to any prompt under
 * src/prompts/*.js. The active version is auto-stamped on every assistant turn
 * saved to conversations.messages JSONB, so analytics can filter by version
 * without having to cross-reference deploy dates.
 *
 * Format: vMAJOR.MINOR-YYYY-MM-DD
 * - MAJOR: substantive rule / handler change
 * - MINOR: tweaks / clarifications / new substitutes in banned list
 * - DATE:  when this version was pushed live (UTC)
 *
 * Add a CHANGELOG entry on every bump so future analysis can map a conversation
 * to what was different about the bot at that time.
 */

const PROMPT_VERSION = 'v2.0-2026-05-18';

const CHANGELOG = [
  {
    version: 'v2.0-2026-05-18',
    summary: 'data-driven QC fixes from 12k-conversation analysis',
    changes: [
      'STOP/DNC: require explicit opt-out verb; clarifying probe for polite acks',
      'NOT INTERESTED: lead with short curiosity probe ("why?"), save 3-option close for fallback',
      'ALREADY HAS COVERAGE: added Corrisa competitor seed-doubt script',
      'NEW BUSINESS AUTO-REPLY DETECTION (fires before STOP/DNC)',
      'NEW PROBLEM OWNERSHIP DETECTION (mirror back, set collected_data.problem_ownership)',
      'NEW POST-TERMINAL HANDLING (empty response by default, route re-engagement to human)',
      'BANNED WORDS overhauled into NEVER/INSTEAD substitution table + PRE-SEND CHECK',
      'NEW SHORT CLARIFIER DEFAULT + strengthened ANTI-LOOP (~70% similarity check)',
    ],
  },
  {
    version: 'v1.0-2026-04-23',
    summary: 'initial 16-edit QC pass (admin)',
    changes: ['baseline prior to v2.0'],
  },
];

module.exports = { PROMPT_VERSION, CHANGELOG };
