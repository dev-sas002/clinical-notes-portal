/**
 * Single source of truth for priority semantics.
 *
 * The Add Note form offers "1 - Lowest" through "5 - Highest", so 5 is the
 * most urgent note. Several display components previously used the opposite
 * scale (labelling priority 1 "Critical" and colouring it red), which
 * contradicted the form. Everything now reads from here.
 */

export const PRIORITY_LEVELS = [1, 2, 3, 4, 5] as const

const PRIORITY_LABELS: Record<number, string> = {
  1: "Lowest",
  2: "Low",
  3: "Medium",
  4: "High",
  5: "Highest",
}

/**
 * Badge background and text. The ramp runs cool to warm so urgency reads at
 * a glance without relying on colour alone - the number and the word are
 * always shown alongside it.
 */
const PRIORITY_BADGE_CLASSES: Record<number, string> = {
  1: "bg-ink-100 text-ink-600",
  2: "bg-sky-100 text-sky-800",
  3: "bg-amber-100 text-amber-800",
  4: "bg-orange-100 text-orange-800",
  5: "bg-rose-100 text-rose-800",
}

/** Solid fill used for bars in the distribution charts. */
const PRIORITY_BAR_CLASSES: Record<number, string> = {
  1: "bg-ink-400",
  2: "bg-sky-500",
  3: "bg-amber-500",
  4: "bg-orange-500",
  5: "bg-rose-600",
}

/** Left rule on a note card, matching the badge ramp. */
const PRIORITY_ACCENT_CLASSES: Record<number, string> = {
  1: "border-l-ink-300",
  2: "border-l-sky-400",
  3: "border-l-amber-400",
  4: "border-l-orange-500",
  5: "border-l-rose-500",
}

export const getPriorityLabel = (priority: number): string =>
  PRIORITY_LABELS[priority] ?? `Priority ${priority}`

export const getPriorityBadgeClass = (priority: number): string =>
  PRIORITY_BADGE_CLASSES[priority] ?? "bg-ink-100 text-ink-600"

export const getPriorityBarClass = (priority: number): string =>
  PRIORITY_BAR_CLASSES[priority] ?? "bg-ink-400"

export const getPriorityAccentClass = (priority: number): string =>
  PRIORITY_ACCENT_CLASSES[priority] ?? "border-l-ink-300"

/**
 * Percentage of `total` that `value` represents, clamped to 0-100 and safe
 * when `total` is 0 (which previously produced NaN and an invalid CSS width).
 */
export const toPercentage = (value: number, total: number): number => {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0) return 0
  return Math.min(100, Math.max(0, (value / total) * 100))
}

/** Category display names, so no component hard-codes its own casing. */
export const CATEGORY_LABELS: Record<string, string> = {
  medication: "Medication",
  observation: "Observation",
  treatment: "Treatment",
}

export const getCategoryLabel = (category: string): string =>
  CATEGORY_LABELS[category] ?? category

/** Category tint for the small badge on a note card. */
const CATEGORY_TONES: Record<string, string> = {
  medication: "bg-brand-50 text-brand-700",
  observation: "bg-indigo-50 text-indigo-700",
  treatment: "bg-violet-50 text-violet-700",
}

export const getCategoryTone = (category: string): string =>
  CATEGORY_TONES[category] ?? "bg-ink-100 text-ink-600"

/** Solid fill for a category bar. */
const CATEGORY_BAR_CLASSES: Record<string, string> = {
  medication: "bg-brand-600",
  observation: "bg-indigo-500",
  treatment: "bg-violet-500",
}

export const getCategoryBarClass = (category: string): string =>
  CATEGORY_BAR_CLASSES[category] ?? "bg-ink-400"
