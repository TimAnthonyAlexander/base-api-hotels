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
  Avatar,
} from '@mui/material';
import { 
  ArrowBack, 
  People, 
  Star, 
  CheckCircle, 
  LocalOffer,
  Bed,
  ArrowForward,
} from '@mui/icons-material';
import { apiClient, type Hotel, type SearchResult, type Room } from '../lib/api';

interface User {
  id: string;
  name: string;
  email: string;
}

export default function HotelDetailPage() {
  const { searchId, hotelId } = useParams<{ searchId: string; hotelId: string }>();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState<Hotel | null>(null);
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
      }
    };
    checkAuth();
  }, []);

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
            Loading hotel details...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa', py: 8 }}>
        <Container maxWidth="md">
          <Alert severity="error" sx={{ borderRadius: 2 }}>
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

  const getOverallBestPrice = () => {
    let minPrice = Infinity;
    hotel.rooms.forEach((room) => {
      room.offers.forEach((offer) => {
        if (offer.effective_price < minPrice) {
          minPrice = offer.effective_price;
        }
      });
    });
    return minPrice === Infinity ? 0 : minPrice;
  };

  // Placeholder images
  const heroImage = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&auto=format&fit=crop';
  const roomImages = [
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&auto=format&fit=crop',
  ];

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
              startIcon={<ArrowBack />}
              onClick={() => navigate(`/search/${searchId}`)}
              sx={{
                color: '#003580',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: 'rgba(0, 53, 128, 0.04)',
                },
              }}
            >
              Back to results
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

      {/* Hero Image */}
      <Box
        sx={{
          height: { xs: '250px', md: '400px' },
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.4) 100%), url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'flex-end',
          position: 'relative',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ pb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              {Array.from({ length: hotel.star_rating }).map((_, i) => (
                <Star key={i} sx={{ fontSize: 24, color: '#fbbf24' }} />
              ))}
            </Box>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: 'white',
                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                fontSize: { xs: '2rem', md: '3rem' },
              }}
            >
              {hotel.title}
            </Typography>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Key Info Card */}
        <Fade in timeout={400}>
          <Card
            elevation={0}
            sx={{
              mb: 4,
              borderRadius: 2,
              border: '1px solid #e0e0e0',
              bgcolor: 'white',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: '#1a1a1a',
                      mb: 1.5,
                    }}
                  >
                    About this property
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: '#666',
                      lineHeight: 1.7,
                      mb: 2,
                    }}
                  >
                    {hotel.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                    <Chip
                      icon={<CheckCircle />}
                      label="Free Wi-Fi"
                      size="small"
                      sx={{
                        bgcolor: '#f0fdf4',
                        color: '#15803d',
                        fontWeight: 500,
                      }}
                    />
                    <Chip
                      icon={<CheckCircle />}
                      label="24/7 Reception"
                      size="small"
                      sx={{
                        bgcolor: '#f0fdf4',
                        color: '#15803d',
                        fontWeight: 500,
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box
                    sx={{
                      p: 3,
                      borderRadius: 2,
                      bgcolor: '#f0f9ff',
                      border: '2px solid #003580',
                      textAlign: 'center',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#666',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        display: 'block',
                        mb: 1,
                      }}
                    >
                      Best Available Price
                    </Typography>
                    <Typography
                      variant="h2"
                      sx={{
                        fontWeight: 700,
                        color: '#003580',
                        fontSize: '3rem',
                        lineHeight: 1,
                        mb: 0.5,
                      }}
                    >
                      ${getOverallBestPrice().toFixed(0)}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#666',
                        mb: 2,
                      }}
                    >
                      per night
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#0369a1',
                        fontWeight: 500,
                      }}
                    >
                      See all {hotel.rooms.length} room options below
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Fade>

        {/* Rooms & Offers Section */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: '#1a1a1a',
              mb: 0.5,
            }}
          >
            Available Rooms
          </Typography>
          <Typography variant="body2" sx={{ color: '#666' }}>
            {hotel.rooms.length} room {hotel.rooms.length === 1 ? 'type' : 'types'} with multiple booking options
          </Typography>
        </Box>

        <Stack spacing={3}>
          {hotel.rooms.map((room, roomIndex) => {
            const cheapestOffer = getCheapestOffer(room);
            const roomImage = roomImages[roomIndex % roomImages.length];

            return (
              <Fade in timeout={500 + (roomIndex * 100)} key={room.id}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 2,
                    border: '1px solid #e0e0e0',
                    bgcolor: 'white',
                    overflow: 'hidden',
                  }}
                >
                  {/* Room Header with Image */}
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      borderBottom: '1px solid #e0e0e0',
                    }}
                  >
                    {/* Room Image */}
                    <Box
                      sx={{
                        width: { xs: '100%', sm: '200px' },
                        height: { xs: '180px', sm: 'auto' },
                        minHeight: { sm: '160px' },
                        backgroundImage: `url(${roomImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        flexShrink: 0,
                      }}
                    />

                    {/* Room Info */}
                    <Box sx={{ p: 3, flex: 1 }}>
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
                      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
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
                        <Chip
                          icon={<Bed sx={{ fontSize: 16 }} />}
                          label="King bed"
                          size="small"
                          sx={{
                            bgcolor: '#f9fafb',
                            color: '#666',
                            fontWeight: 500,
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>

                  {/* Offers List */}
                  <Box sx={{ p: 3 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 600,
                        color: '#1a1a1a',
                        mb: 2,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontSize: '0.75rem',
                      }}
                    >
                      Booking Options ({room.offers.length})
                    </Typography>

                    <Stack spacing={2}>
                      {room.offers.map((offer, offerIndex) => (
                        <Box
                          key={offer.id}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            p: 2.5,
                            borderRadius: 1.5,
                            border: offerIndex === 0 ? '2px solid #003580' : '1px solid #e0e0e0',
                            bgcolor: offerIndex === 0 ? '#f0f9ff' : 'white',
                            flexDirection: { xs: 'column', sm: 'row' },
                            gap: 2,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                            },
                          }}
                        >
                          <Box sx={{ flex: 1, width: '100%' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                              {offerIndex === 0 && (
                                <Chip
                                  icon={<LocalOffer sx={{ fontSize: 14 }} />}
                                  label="Best Deal"
                                  size="small"
                                  sx={{
                                    height: 24,
                                    bgcolor: '#003580',
                                    color: 'white',
                                    fontWeight: 600,
                                    fontSize: '0.7rem',
                                  }}
                                />
                              )}
                              {offer.discount > 0 && (
                                <Chip
                                  label={`${offer.discount.toFixed(0)}% OFF`}
                                  size="small"
                                  sx={{
                                    height: 24,
                                    bgcolor: '#10b981',
                                    color: 'white',
                                    fontWeight: 600,
                                    fontSize: '0.7rem',
                                  }}
                                />
                              )}
                            </Box>
                            <Typography
                              variant="body2"
                              sx={{
                                color: '#666',
                                fontSize: '0.85rem',
                              }}
                            >
                              Available: {new Date(offer.starts_on).toLocaleDateString()} - {new Date(offer.ends_on).toLocaleDateString()}
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                              width: { xs: '100%', sm: 'auto' },
                              justifyContent: { xs: 'space-between', sm: 'flex-end' },
                            }}
                          >
                            <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                              {offer.discount > 0 && (
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: '#999',
                                    textDecoration: 'line-through',
                                    fontSize: '0.85rem',
                                  }}
                                >
                                  ${offer.price.toFixed(2)}
                                </Typography>
                              )}
                              <Typography
                                variant="h5"
                                sx={{
                                  fontWeight: 700,
                                  color: '#003580',
                                  fontSize: '1.75rem',
                                  lineHeight: 1,
                                }}
                              >
                                ${offer.effective_price.toFixed(0)}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: '#666',
                                  fontSize: '0.75rem',
                                }}
                              >
                                per night
                              </Typography>
                            </Box>
                            <Button
                              endIcon={<ArrowForward />}
                              sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                bgcolor: '#003580',
                                color: 'white',
                                px: 2.5,
                                py: 1,
                                borderRadius: 1,
                                whiteSpace: 'nowrap',
                                '&:hover': {
                                  bgcolor: '#00244d',
                                },
                              }}
                            >
                              Book
                            </Button>
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                </Card>
              </Fade>
            );
          })}
        </Stack>
      </Container>
    </Box>
  );
}