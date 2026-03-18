/**
 * Return a Tailwind color class based on match score ranges.
 *   90-100: green (excellent)
 *   70-89:  blue  (good)
 *   50-69:  yellow (fair)
 *   0-49:   red   (poor)
 */
export function matchScoreClass(score: number): string {
  if (score >= 90) return "text-green-600"
  if (score >= 70) return "text-blue-600"
  if (score >= 50) return "text-yellow-600"
  return "text-red-600"
}
