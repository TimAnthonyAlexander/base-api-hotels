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
} from '@mui/material';
import { ArrowBack, People, Star } from '@mui/icons-material';
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
          background: '#fafafa',
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
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
    <Box sx={{ minHeight: '100vh', background: '#fafafa', py: 6 }}>
      <Container maxWidth="lg">
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(`/search/${searchId}`)}
          sx={{
            mb: 4,
            color: '#667eea',
            textTransform: 'none',
            fontWeight: 500,
            '&:hover': {
              background: 'rgba(102, 126, 234, 0.08)',
            },
          }}
        >
          Back to Results
        </Button>

        <Box sx={{ mb: 6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography
              variant="h3"
              component="h1"
              sx={{
                fontWeight: 300,
                letterSpacing: '-0.02em',
                color: '#1a1a1a',
              }}
            >
              {hotel.title}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {Array.from({ length: hotel.star_rating }).map((_, i) => (
                <Star key={i} sx={{ fontSize: 24, color: '#fbbf24' }} />
              ))}
            </Box>
          </Box>
          <Typography
            variant="body1"
            sx={{ color: '#666', fontWeight: 300, maxWidth: '70%' }}
          >
            {hotel.description}
          </Typography>
        </Box>

        <Typography
          variant="h5"
          sx={{
            fontWeight: 500,
            color: '#1a1a1a',
            mb: 4,
          }}
        >
          Available Rooms
        </Typography>

        <Stack spacing={3}>
          {hotel.rooms.map((room) => {
            const cheapestOffer = getCheapestOffer(room);
            const hasMultipleOffers = room.offers.length > 1;

            return (
              <Card
                key={room.id}
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: '1px solid #e0e0e0',
                  overflow: 'hidden',
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 3,
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 500,
                          color: '#1a1a1a',
                          mb: 1,
                        }}
                      >
                        {room.category}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: '#666', mb: 2, maxWidth: '80%' }}
                      >
                        {room.description}
                      </Typography>
                      <Chip
                        icon={<People />}
                        label={`Capacity: ${room.capacity} ${room.capacity === 1 ? 'guest' : 'guests'}`}
                        size="small"
                        sx={{
                          borderRadius: 1.5,
                          background: '#f3f4f6',
                          color: '#4b5563',
                        }}
                      />
                    </Box>
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      color: '#666',
                      mb: 2,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontSize: '0.75rem',
                    }}
                  >
                    Available Offers
                  </Typography>

                  <Stack spacing={2}>
                    {room.offers.map((offer, index) => (
                      <Box
                        key={offer.id}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          p: 2.5,
                          borderRadius: 2,
                          background:
                            index === 0
                              ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)'
                              : '#f9fafb',
                          border: index === 0 ? '1px solid #667eea' : '1px solid #e5e7eb',
                        }}
                      >
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                            {index === 0 && (
                              <Chip
                                label="Best Deal"
                                size="small"
                                sx={{
                                  background: '#667eea',
                                  color: 'white',
                                  fontWeight: 600,
                                  height: 24,
                                  fontSize: '0.7rem',
                                }}
                              />
                            )}
                            {offer.discount > 0 && (
                              <Chip
                                label={`${offer.discount.toFixed(0)}% off`}
                                size="small"
                                sx={{
                                  background: '#10b981',
                                  color: 'white',
                                  fontWeight: 600,
                                  height: 24,
                                  fontSize: '0.7rem',
                                }}
                              />
                            )}
                          </Box>
                          <Typography variant="body2" sx={{ color: '#666', fontSize: '0.85rem' }}>
                            Valid: {offer.starts_on} to {offer.ends_on}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          {offer.discount > 0 && (
                            <Typography
                              variant="body2"
                              sx={{
                                color: '#999',
                                textDecoration: 'line-through',
                                mb: 0.5,
                              }}
                            >
                              ${offer.price.toFixed(2)}
                            </Typography>
                          )}
                          <Typography
                            variant="h5"
                            sx={{
                              fontWeight: 600,
                              color: index === 0 ? '#667eea' : '#1a1a1a',
                            }}
                          >
                            ${offer.effective_price.toFixed(2)}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ color: '#999', fontSize: '0.85rem' }}
                          >
                            per night
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      </Container>
    </Box>
  );
}
