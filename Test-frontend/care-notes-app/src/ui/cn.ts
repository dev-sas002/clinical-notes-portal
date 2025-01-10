/**
 * Join class names, dropping anything falsy.
 *
 * Six lines instead of `clsx` + `tailwind-merge`, both of which the project
 * pulled in for a scaffold nothing rendered.
 */
export const cn = (...values: Array<string | false | null | undefined>): string =>
  values.filter(Boolean).join(" ")
