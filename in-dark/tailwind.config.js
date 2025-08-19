/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ["\"Noto Serif KR\"", "serif"],
        body: [
          "\"Noto Sans KR\"",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "\"Segoe UI\"",
          "Roboto",
          "\"Helvetica Neue\"",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "\"Fira Code\"",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "\"Liberation Mono\"",
          "\"Courier New\"",
          "monospace",
        ],
      },
    },
  },
  plugins: [
    function({ addComponents, addBase }) {
      addBase({
        html: { fontFamily: "var(--tw-font-body, 'Noto Sans KR', ui-sans-serif, system-ui, sans-serif)" },
        body: { fontSize: "1rem", lineHeight: "1.7" },
        h1: { fontFamily: "var(--tw-font-heading, 'Noto Serif KR', serif)", fontSize: "2rem", lineHeight: "1.25", fontWeight: "700" },
        h2: { fontFamily: "var(--tw-font-heading, 'Noto Serif KR', serif)", fontSize: "1.5rem", lineHeight: "1.33", fontWeight: "700" },
        h3: { fontFamily: "var(--tw-font-heading, 'Noto Serif KR', serif)", fontSize: "1.25rem", lineHeight: "1.35", fontWeight: "700" },
        code: { fontFamily: "var(--tw-font-mono, 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace)", fontSize: "0.875rem", lineHeight: "1.6" },
        pre: { fontFamily: "var(--tw-font-mono, 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace)", fontSize: "0.875rem", lineHeight: "1.6" },
      });

      addComponents({
        /* Font family helpers */
        ".font-heading": { fontFamily: "var(--tw-font-heading, 'Noto Serif KR', serif)" },
        ".font-body": { fontFamily: "var(--tw-font-body, 'Noto Sans KR', ui-sans-serif, system-ui, sans-serif)" },
        ".font-mono-custom": { fontFamily: "var(--tw-font-mono, 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace)" },

        /* Heading scale (paired with .font-heading) */
        ".text-heading-xxl": { fontSize: "2.5rem", lineHeight: "1.2", fontWeight: "700" }, // 40px
        ".text-heading-xl": { fontSize: "2rem", lineHeight: "1.25", fontWeight: "700" },   // 32px
        ".text-heading-lg": { fontSize: "1.5rem", lineHeight: "1.33", fontWeight: "700" }, // 24px

        /* Body scale (paired with .font-body) */
        ".text-body-lg": { fontSize: "1.125rem", lineHeight: "1.7", fontWeight: "500" },   // 18px
        ".text-body-md": { fontSize: "1rem", lineHeight: "1.7", fontWeight: "400" },       // 16px
        ".text-body-sm": { fontSize: "0.875rem", lineHeight: "1.6", fontWeight: "400" },   // 14px

        /* Mono scale (paired with .font-mono-custom) */
        ".text-mono-sm": { fontSize: "0.875rem", lineHeight: "1.6" }, // 14px
        ".text-mono-xs": { fontSize: "0.75rem", lineHeight: "1.5" },  // 12px
      });
    }
  ],
}
