import { FlatCompat } from "@eslint/eslintrc"
import prettier from "eslint-config-prettier"

const compat = new FlatCompat({ baseDirectory: import.meta.dirname })

/**
 * Next's recommended rules plus a few the audit wanted enforced rather than
 * remembered: no unused code, no stray `console.log`, no implicit `any`
 * creeping back in through an untyped import.
 */
export default [
  { ignores: [".next/**", "node_modules/**", "docs/**", "next-env.d.ts"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
    },
  },
  prettier,
]
