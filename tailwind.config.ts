const twConfig = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta semántica
        primary: {
          DEFAULT: "#2E7D32",   // Verde corporativo
          foreground: "#FFFFFF",
        },
        secondary: "#333333",    // Gris oscuro
        background: "#FFFFFF",   // Fondo principal
        surface: "#F5F5F5",      // Fondo alterno
        danger: {
          DEFAULT: "#C62828",    // Alerta / error
          foreground: "#FFFFFF",
        },
        success: {
          DEFAULT: "#66BB6A",    // Éxito / OK
          foreground: "#0B3D12", // opcional para texto oscuro sobre el verde claro
        },
      },
    },
  },
  plugins: [],
};

export default twConfig;