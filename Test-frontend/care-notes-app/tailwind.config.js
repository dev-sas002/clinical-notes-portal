/**
 * One small, explicit palette.
 *
 * The project previously carried the shadcn/ui HSL custom-property theme
 * alongside hard-coded blues in components, so nothing agreed with anything
 * else. These are the only colours the UI is allowed to use.
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Calm clinical teal. Reserved for actions and active navigation.
        brand: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          500: "#14857c",
          600: "#0f766e",
          700: "#115e59",
          800: "#134e4a",
        },
        // Neutral ramp for surfaces, borders and text.
        ink: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
        },
        danger: {
          50: "#fef2f2",
          200: "#fecaca",
          600: "#dc2626",
          700: "#b91c1c",
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.04)",
        raised: "0 4px 12px rgba(15, 23, 42, 0.08)",
      },
      borderRadius: {
        card: "0.75rem",
      },
    },
  },
  plugins: [],
}
