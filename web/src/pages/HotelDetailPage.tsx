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
  Stack,
  Divider,
  Fade,
  Grid,
} from '@mui/material';
import { ArrowBack, People, Star, CheckCircle, LocationOn } from '@mui/icons-material';
import { apiClient, type Hotel, type SearchResult, type Room } from '../lib/api';

export default function HotelDetailPage() {
  const { searchId, hotelId } = useParams<{ searchId: string; hotelId: string }>();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHotel = async () => {
      if (!searchId || !hotelId) return;

      try {
        const response = await apiClient.getSearch(searchId);
        const foundHotel = response.data.hotels.find((h: Hotel) => h.id === hotelId);
        if (foundHotel) {
          setHotel(foundHotel);
        } else {
          setError('Hotel not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load hotel');
      } finally {
        setLoading(false);
      }
    };

    fetchHotel();
  }, [searchId, hotelId]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(to bottom, #fafafa 0%, #f5f5f5 100%)',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress 
            size={60} 
            sx={{ 
              color: '#667eea',
              mb: 2,
            }} 
          />
          <Typography 
            variant="body1" 
            sx={{ 
              color: '#666',
              fontWeight: 300,
            }}
          >
            Loading hotel details...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', background: '#fafafa', py: 8 }}>
        <Container maxWidth="md">
          <Alert 
            severity="error" 
            sx={{ 
              borderRadius: 2,
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            }}
          >
            {error}
          </Alert>
        </Container>
      </Box>
    );
  }

  if (!hotel) {
    return null;
  }

  const getCheapestOffer = (room: Room) => {
    return room.offers.reduce((min, offer) => 
      offer.effective_price < min.effective_price ? offer : min
    , room.offers[0]);
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #fafafa 0%, #ffffff 100%)' }}>
      {/* Hero Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          pt: 4,
          pb: 12,
          position: 'relative',
          overflow: 'hidden',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -2,
            left: 0,
            right: 0,
            height: '80px',
            background: 'linear-gradient(to bottom, transparent, #fafafa)',
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate(`/search/${searchId}`)}
            sx={{
              mb: 4,
              color: 'white',
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '1rem',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              px: 2.5,
              py: 1,
              borderRadius: 2,
              border: '1px solid rgba(255, 255, 255, 0.2)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.25)',
                borderColor: 'rgba(255, 255, 255, 0.4)',
                transform: 'translateX(-4px)',
              },
            }}
          >
            Back to Results
          </Button>

          <Fade in timeout={600}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <Typography
                  variant="h2"
                  component="h1"
                  sx={{
                    fontWeight: 600,
                    letterSpacing: '-0.02em',
                    color: 'white',
                    fontSize: { xs: '2rem', md: '3rem' },
                  }}
                >
                  {hotel.title}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {Array.from({ length: hotel.star_rating }).map((_, i) => (
                    <Star key={i} sx={{ fontSize: 28, color: '#fbbf24' }} />
                  ))}
                </Box>
              </Box>
              <Typography
                variant="h6"
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.95)', 
                  fontWeight: 300,
                  maxWidth: '800px',
                  lineHeight: 1.6,
                  fontSize: { xs: '1rem', md: '1.15rem' },
                }}
              >
                {hotel.description}
              </Typography>
            </Box>
          </Fade>
        </Container>
      </Box>

      {/* Content */}
      <Container maxWidth="lg" sx={{ mt: -6, pb: 8 }}>
        {/* Section Header */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              color: '#1a1a1a',
              mb: 1,
              letterSpacing: '-0.01em',
            }}
          >
            Available Rooms
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: '#666',
              fontWeight: 300,
            }}
          >
            Choose from {hotel.rooms.length} room {hotel.rooms.length === 1 ? 'option' : 'options'}
          </Typography>
        </Box>

        <Stack spacing={4}>
          {hotel.rooms.map((room, index) => {
            const cheapestOffer = getCheapestOffer(room);
            const hasDiscount = room.offers.some(offer => offer.discount > 0);

            return (
              <Fade in timeout={400 + (index * 100)} key={room.id}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: '1px solid #e0e0e0',
                    overflow: 'hidden',
                    background: 'white',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 8px 32px rgba(102, 126, 234, 0.12)',
                      borderColor: 'transparent',
                    },
                  }}
                >
                  <CardContent sx={{ p: 0 }}>
                    {/* Room Header */}
                    <Box
                      sx={{
                        p: 4,
                        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                        borderBottom: '1px solid #f0f0f0',
                      }}
                    >
                      <Grid container spacing={3} alignItems="center">
                        <Grid item xs={12} md={8}>
                          <Typography
                            variant="h5"
                            sx={{
                              fontWeight: 600,
                              color: '#1a1a1a',
                              mb: 1.5,
                              letterSpacing: '-0.01em',
                            }}
                          >
                            {room.category}
                          </Typography>
                          <Typography
                            variant="body1"
                            sx={{ 
                              color: '#666', 
                              mb: 2,
                              lineHeight: 1.6,
                              fontWeight: 300,
                            }}
                          >
                            {room.description}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                            <Chip
                              icon={<People />}
                              label={`${room.capacity} ${room.capacity === 1 ? 'guest' : 'guests'}`}
                              size="small"
                              sx={{
                                borderRadius: 2,
                                background: 'white',
                                color: '#667eea',
                                fontWeight: 500,
                                border: '1px solid rgba(102, 126, 234, 0.3)',
                              }}
                            />
                            {hasDiscount && (
                              <Chip
                                label="Special Offers Available"
                                size="small"
                                sx={{
                                  borderRadius: 2,
                                  background: '#10b981',
                                  color: 'white',
                                  fontWeight: 500,
                                }}
                              />
                            )}
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Box
                            sx={{
                              textAlign: { xs: 'left', md: 'right' },
                              p: 3,
                              borderRadius: 2,
                              background: 'white',
                              border: '2px solid #667eea',
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                color: '#999',
                                fontWeight: 500,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                fontSize: '0.7rem',
                                display: 'block',
                                mb: 0.5,
                              }}
                            >
                              Best Price
                            </Typography>
                            <Typography
                              variant="h3"
                              sx={{
                                fontWeight: 700,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                fontSize: '2.5rem',
                                letterSpacing: '-0.02em',
                                mb: 0.5,
                              }}
                            >
                              ${cheapestOffer.effective_price.toFixed(0)}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ 
                                color: '#999',
                                fontWeight: 300,
                              }}
                            >
                              per night
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>

                    {/* Offers Section */}
                    <Box sx={{ p: 4 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 600,
                          color: '#1a1a1a',
                          mb: 3,
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          fontSize: '0.8rem',
                        }}
                      >
                        Booking Options ({room.offers.length})
                      </Typography>

                      <Stack spacing={2.5}>
                        {room.offers.map((offer, offerIndex) => (
                          <Box
                            key={offer.id}
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              p: 3,
                              borderRadius: 2.5,
                              background:
                                offerIndex === 0
                                  ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)'
                                  : '#fafafa',
                              border: offerIndex === 0 ? '2px solid #667eea' : '1px solid #e5e7eb',
                              transition: 'all 0.3s ease',
                              flexDirection: { xs: 'column', sm: 'row' },
                              gap: { xs: 2, sm: 0 },
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 16px rgba(102, 126, 234, 0.15)',
                              },
                            }}
                          >
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, flexWrap: 'wrap' }}>
                                {offerIndex === 0 && (
                                  <Chip
                                    icon={<CheckCircle sx={{ fontSize: 16 }} />}
                                    label="Best Deal"
                                    size="small"
                                    sx={{
                                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                      color: 'white',
                                      fontWeight: 600,
                                      height: 26,
                                      fontSize: '0.75rem',
                                    }}
                                  />
                                )}
                                {offer.discount > 0 && (
                                  <Chip
                                    label={`Save ${offer.discount.toFixed(0)}%`}
                                    size="small"
                                    sx={{
                                      background: '#10b981',
                                      color: 'white',
                                      fontWeight: 600,
                                      height: 26,
                                      fontSize: '0.75rem',
                                    }}
                                  />
                                )}
                              </Box>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  color: '#666',
                                  fontSize: '0.9rem',
                                  fontWeight: 400,
                                }}
                              >
                                Available: {new Date(offer.starts_on).toLocaleDateString()} - {new Date(offer.ends_on).toLocaleDateString()}
                              </Typography>
                            </Box>
                            <Box 
                              sx={{ 
                                textAlign: { xs: 'left', sm: 'right' },
                                width: { xs: '100%', sm: 'auto' },
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: { xs: 'flex-start', sm: 'flex-end' },
                              }}
                            >
                              {offer.discount > 0 && (
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: '#999',
                                    textDecoration: 'line-through',
                                    mb: 0.5,
                                    fontSize: '0.9rem',
                                  }}
                                >
                                  ${offer.price.toFixed(2)}
                                </Typography>
                              )}
                              <Typography
                                variant="h4"
                                sx={{
                                  fontWeight: 700,
                                  color: offerIndex === 0 ? '#667eea' : '#1a1a1a',
                                  fontSize: '2rem',
                                  letterSpacing: '-0.01em',
                                }}
                              >
                                ${offer.effective_price.toFixed(2)}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ 
                                  color: '#999',
                                  fontSize: '0.85rem',
                                  fontWeight: 300,
                                }}
                              >
                                per night
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  </CardContent>
                </Card>
              </Fade>
            );
          })}
        </Stack>
      </Container>
    </Box>
  );
}