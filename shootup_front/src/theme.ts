import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6366f1',
      light: '#818cf8',
      dark: '#4f46e5',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
      contrastText: '#ffffff'
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e'
    },
    text: {
      primary: '#f5f5f5',
      secondary: '#9ca3af'
    },
    success: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669'
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706'
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#dc2626'
    },
    grey: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827'
    }
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem'
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem'
    },
    h3: {
      fontWeight: 700,
      fontSize: '1.75rem'
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem'
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem'
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.125rem'
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5
    }
  },
  shape: {
    borderRadius: 12
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 12
        },
        sizeLarge: {
          padding: '12px 32px',
          fontSize: '1rem'
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          fontWeight: 500
        }
      }
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          backgroundColor: '#374151'
        }
      }
    }
  }
});

export default theme;