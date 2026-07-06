import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        matched: {
          bg: "#dcfce7",
          text: "#166534",
          border: "#86efac",
        },
        unmatched: {
          bg: "#fee2e2",
          text: "#991b1b",
          border: "#fca5a5",
        },
        ignored: {
          bg: "#f1f5f9",
          text: "#475569",
          border: "#cbd5e1",
        },
      },
    },
  },
  plugins: [],
};

export default config;
