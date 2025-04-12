import { createTheme, PaletteMode } from "@mui/material/styles";

const getTheme = (mode: PaletteMode) =>
  createTheme({
    palette: {
      mode, // Switch between light and dark mode
      primary: {
        main: mode === "light" ? "#6a0dad" : "#bb86fc", // Purple tones
      },
      secondary: {
        main: mode === "light" ? "#d3c4fc" : "#03dac6", // Light purple in light mode, teal in dark mode
      },
      background: {
        default: mode === "light" ? "#ffffff" : "#121212", // White for light mode, dark gray for dark mode
        paper: mode === "light" ? "#f3e5f5" : "#1e1e1e", // Tinted background for surfaces like cards
      },
      text: {
        primary: mode === "light" ? "#4a148c" : "#ffffff", // Dark purple for light mode, white for dark mode
        secondary: mode === "light" ? "#9c27b0" : "#d3c4fc", // Lighter lavender tones for both
      },
    },
    typography: {
      fontFamily: "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif", // Custom font stack
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          colorPrimary: {
            backgroundColor: mode === "light" ? "#6a0dad" : "#1e1e1e", // Adjust AppBar color for themes
          },
        },
      },
    },
  });

export default getTheme;