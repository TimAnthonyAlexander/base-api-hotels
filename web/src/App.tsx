import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import SearchPage from './pages/SearchPage';
import ResultsPage from './pages/ResultsPage';
import HotelDetailPage from './pages/HotelDetailPage';
import BookingDetailPage from './pages/BookingDetailPage';
import BookingsListPage from './pages/BookingsListPage';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#003580',
    },
    secondary: {
      main: '#667eea',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h3: {
      fontWeight: 300,
      letterSpacing: '-0.02em',
    },
    h5: {
      fontWeight: 500,
    },
    body1: {
      fontWeight: 300,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/search/:searchId" element={<ResultsPage />} />
          <Route path="/search/:searchId/hotel/:hotelId" element={<HotelDetailPage />} />
          <Route path="/bookings" element={<BookingsListPage />} />
          <Route path="/booking/:bookingId" element={<BookingDetailPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;