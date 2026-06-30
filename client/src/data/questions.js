import datingGame from "../../dating_game.json"

export const QUESTIONS = datingGame

/**
 * @param {string} mode
 * @returns {Array<{ id: number, question: string, options: string[] }>}
 */
export function getQuestionsByMode(mode) {
  return QUESTIONS[mode] ?? []
}

/**
 * @param {{ id: number, question: string, options: string[] }} question
 * @returns {{ id: number, question: string, options: string[] }}
 */
export function withTwoRandomOptions(question) {
  const shuffled = [...question.options].sort(() => Math.random() - 0.5)
  return {
    ...question,
    options: shuffled.slice(0, 2),
  }
}

/**
 * @param {string} mode
 * @param {number[]} askedQuestionIds
 * @returns {{ id: number, question: string, options: string[] } | null}
 */
export function pickRandomQuestion(mode, askedQuestionIds) {
  const available = getQuestionsByMode(mode).filter(
    (q) => !askedQuestionIds.includes(q.id)
  )

  if (available.length === 0) return null

  return available[Math.floor(Math.random() * available.length)]
}
