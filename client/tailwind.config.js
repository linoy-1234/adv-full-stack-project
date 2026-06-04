/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Onco+Log brand palette
        sage: {
          DEFAULT: "#7CAE8E", // primary sage green
          light: "#A8C9B5",
          dark: "#5E9173",
          deep: "#2F4F3E", // dark text / oncologist accents
        },
        cream: {
          DEFAULT: "#FAF8F5", // warm base background
          card: "#FFFFFF",
          muted: "#F1EFE8",
        },
        status: {
          approved: "#7CAE8E",
          pending: "#E6B450", // amber
          hold: "#E08B5A",    // coral / on-hold
          danger: "#D9534F",  // allergies / out of range
          info: "#7BA7D9",    // scheduled / radiation
        },
      },
      fontFamily: {
        display: ['Poppins', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        card: "16px",
      },
      boxShadow: {
        card: "0 2px 12px rgba(47, 79, 62, 0.06)",
        "card-hover": "0 4px 20px rgba(47, 79, 62, 0.10)",
      },
      backgroundImage: {
        "crab-pattern": "url('/src/assets/crab-pattern.svg')",
      },
    },
  },
  plugins: [],
}