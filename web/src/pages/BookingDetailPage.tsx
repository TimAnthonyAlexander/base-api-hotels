import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
  Chip,
  Divider,
  Grid,
  Paper,
  Stack,
  Fade,
} from '@mui/material';
import {
  ArrowBack,
  CheckCircle,
  CalendarToday,
  People,
  Hotel as HotelIcon,
  Star,
  LocationOn,
  Receipt,
  Home,
} from '@mui/icons-material';
import { apiClient, type BookingDetail } from '../lib/api';

interface User {
  id: string;
  name: string;
  email: string;
}

export default function BookingDetailPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [bookingDetail, setBookingDetail] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await apiClient.getMe();
        setUser(response.data.user);
      } catch (err) {
        setUser(null);
        navigate('/login');
      }
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) return;

      try {
        const response = await apiClient.getBooking(bookingId);
        setBookingDetail(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load booking');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  const handleLogout = async () => {
    try {
      await apiClient.logout();
      setUser(null);
      navigate('/');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#fafafa',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ color: '#003580', mb: 2 }} />
          <Typography variant="body1" sx={{ color: '#666', fontWeight: 400 }}>
            Loading booking details...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa', py: 8 }}>
        <Container maxWidth="md">
          <Alert severity="error" sx={{ borderRadius: 2, mb: 3 }}>
            {error}
          </Alert>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/')}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              color: '#003580',
            }}
          >
            Back to Home
          </Button>
        </Container>
      </Box>
    );
  }

  if (!bookingDetail) {
    return null;
  }

  const { booking, hotel, room, offer, search } = bookingDetail;
  const nights = Math.ceil(
    (new Date(booking.ends_on).getTime() - new Date(booking.starts_on).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f9fafb' }}>
      {/* Top Navigation */}
      <Box
        sx={{
          bgcolor: 'white',
          borderBottom: '1px solid #e0e0e0',
          py: 2,
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Button
              startIcon={<Home />}
              onClick={() => navigate('/')}
              sx={{
                color: '#003580',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: 'rgba(0, 53, 128, 0.04)',
                },
              }}
            >
              Home
            </Button>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              {user && (
                <>
                  <Typography
                    sx={{
                      color: '#666',
                      fontWeight: 500,
                      fontSize: '0.95rem',
                      display: { xs: 'none', sm: 'block' },
                    }}
                  >
                    {user.name}
                  </Typography>
                  <Button
                    onClick={handleLogout}
                    variant="outlined"
                    size="small"
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      borderColor: '#003580',
                      color: '#003580',
                      '&:hover': {
                        bgcolor: 'rgba(0, 53, 128, 0.04)',
                        borderColor: '#003580',
                      },
                    }}
                  >
                    Log out
                  </Button>
                </>
              )}
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ py: 6 }}>
        {/* Success Header */}
        <Fade in timeout={400}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: '#10b981',
                mb: 3,
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.25)',
              }}
            >
              <CheckCircle sx={{ fontSize: 48, color: 'white' }} />
            </Box>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: '#1a1a1a',
                mb: 1,
                fontSize: { xs: '2rem', md: '2.5rem' },
              }}
            >
              Booking Confirmed!
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: '#666',
                fontSize: '1.1rem',
              }}
            >
              Your reservation has been successfully confirmed
            </Typography>
            <Chip
              label={`Booking ID: ${booking.id.slice(0, 8)}`}
              sx={{
                mt: 2,
                bgcolor: '#f0f9ff',
                color: '#003580',
                fontWeight: 600,
                fontFamily: 'monospace',
              }}
            />
          </Box>
        </Fade>

        {/* Hotel Details Card */}
        <Fade in timeout={500}>
          <Card
            elevation={0}
            sx={{
              mb: 3,
              borderRadius: 2,
              border: '1px solid #e0e0e0',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                p: 3,
                color: 'white',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                {Array.from({ length: hotel.star_rating }).map((_, i) => (
                  <Star key={i} sx={{ fontSize: 20, color: '#fbbf24' }} />
                ))}
              </Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  mb: 0.5,
                  fontSize: '1.75rem',
                }}
              >
                {hotel.title}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  opacity: 0.9,
                }}
              >
                {hotel.description}
              </Typography>
            </Box>

            <CardContent sx={{ p: 3 }}>
              <Grid container spacing={3}>
                {/* Room Details */}
                <Grid item xs={12}>
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="overline"
                      sx={{
                        color: '#999',
                        fontWeight: 600,
                        letterSpacing: '0.1em',
                        fontSize: '0.7rem',
                      }}
                    >
                      Room Details
                    </Typography>
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: '#1a1a1a',
                      mb: 1,
                    }}
                  >
                    {room.category}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#666',
                      mb: 2,
                      lineHeight: 1.6,
                    }}
                  >
                    {room.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      icon={<People sx={{ fontSize: 16 }} />}
                      label={`${room.capacity} guest${room.capacity !== 1 ? 's' : ''}`}
                      size="small"
                      sx={{
                        bgcolor: '#f0f9ff',
                        color: '#0369a1',
                        fontWeight: 500,
                      }}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Divider />
                </Grid>

                {/* Stay Details */}
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <CalendarToday sx={{ color: '#667eea', fontSize: 20, mt: 0.5 }} />
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#999',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          display: 'block',
                          mb: 0.5,
                        }}
                      >
                        Check-in
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                        {new Date(booking.starts_on).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <CalendarToday sx={{ color: '#667eea', fontSize: 20, mt: 0.5 }} />
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#999',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          display: 'block',
                          mb: 0.5,
                        }}
                      >
                        Check-out
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                        {new Date(booking.ends_on).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <HotelIcon sx={{ color: '#667eea', fontSize: 20, mt: 0.5 }} />
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#999',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          display: 'block',
                          mb: 0.5,
                        }}
                      >
                        Number of Nights
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                        {nights} {nights === 1 ? 'night' : 'nights'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <People sx={{ color: '#667eea', fontSize: 20, mt: 0.5 }} />
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#999',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          display: 'block',
                          mb: 0.5,
                        }}
                      >
                        Guests
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                        {booking.capacity} {booking.capacity === 1 ? 'guest' : 'guests'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Fade>

        {/* Price Summary */}
        <Fade in timeout={600}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: '2px solid #10b981',
              bgcolor: '#f0fdf4',
              mb: 3,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Receipt sx={{ color: '#10b981', fontSize: 24 }} />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: '#1a1a1a',
                }}
              >
                Price Summary
              </Typography>
            </Box>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body1" sx={{ color: '#666' }}>
                  ${booking.total_price.toFixed(2)} × {nights} {nights === 1 ? 'night' : 'nights'}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, color: '#1a1a1a' }}>
                  ${(booking.total_price * nights).toFixed(2)}
                </Typography>
              </Box>
              {offer.discount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip
                    label={`${offer.discount.toFixed(0)}% Discount Applied`}
                    size="small"
                    sx={{
                      bgcolor: '#10b981',
                      color: 'white',
                      fontWeight: 600,
                    }}
                  />
                  <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 600 }}>
                    -${((offer.price - offer.effective_price) * nights).toFixed(2)}
                  </Typography>
                </Box>
              )}
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: '#1a1a1a',
                  }}
                >
                  Total
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: '#10b981',
                  }}
                >
                  ${(booking.total_price * nights).toFixed(2)}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Fade>

        {/* Action Buttons */}
        <Fade in timeout={700}>
          <Stack spacing={2}>
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={() => navigate('/')}
              sx={{
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                bgcolor: '#003580',
                '&:hover': {
                  bgcolor: '#00244d',
                },
              }}
            >
              Return to Home
            </Button>
            <Button
              variant="outlined"
              size="large"
              fullWidth
              onClick={() => window.print()}
              sx={{
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                borderColor: '#003580',
                color: '#003580',
                '&:hover': {
                  bgcolor: 'rgba(0, 53, 128, 0.04)',
                  borderColor: '#003580',
                },
              }}
            >
              Print Confirmation
            </Button>
          </Stack>
        </Fade>
      </Container>
    </Box>
  );
}

