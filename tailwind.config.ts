import type { Config } from "tailwindcss";

// SYSTEM — Palette exacte (Document 4, section 2)
const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#141414",      // encre : textes, icônes actives, boutons primaires
        mist: "#6B6B6B",     // gris : textes secondaires, métadonnées
        fog: "#9A9A9A",      // gris clair : textes tertiaires, placeholders
        card: "#F2F2F2",     // fonds de cartes, cases vides, hover
        line: "#DDDDDD",     // séparateurs, contours de champs
        paper: "#FFFFFF",    // fond général
        go: "#1F9D55",       // vert : validations, streaks
        miss: "#C0392B",     // rouge discret : « manquée »
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "Roboto",
          "Segoe UI",
          "sans-serif",
        ],
      },
      maxWidth: {
        app: "480px", // colonne centrée esprit application (Doc 4 §8)
      },
      transitionDuration: {
        page: "175", // transitions de page 150–200 ms (Doc 4 §7)
      },
    },
  },
  plugins: [],
};
export default config;
