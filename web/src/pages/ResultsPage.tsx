import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  CircularProgress,
  Alert,
  Chip,
  Stack,
} from '@mui/material';
import { Hotel as HotelIcon, Star } from '@mui/icons-material';
import { apiClient, Hotel, SearchResult } from '../lib/api';

export default function ResultsPage() {
  const { searchId } = useParams<{ searchId: string }>();
  const navigate = useNavigate();
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      if (!searchId) return;

      try {
        const response = await apiClient.getSearch(searchId);
        setSearchResult(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load results');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
    const interval = setInterval(fetchResults, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [searchId]);

  const getBestPrice = (hotel: Hotel): number => {
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

  if (!searchResult) {
    return null;
  }

  return (
    <Box sx={{ minHeight: '100vh', background: '#fafafa', py: 6 }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 6 }}>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontWeight: 300,
              letterSpacing: '-0.02em',
              color: '#1a1a1a',
              mb: 1,
            }}
          >
            Available Hotels
          </Typography>
          <Typography variant="body1" sx={{ color: '#666', fontWeight: 300 }}>
            {searchResult.search.results} {searchResult.search.results === 1 ? 'hotel' : 'hotels'} found
            {searchResult.search.status === 'pending' && ' (searching...)'}
            {searchResult.search.status === 'started' && ' (processing...)'}
          </Typography>
        </Box>

        {searchResult.hotels.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            {searchResult.search.status === 'completed'
              ? 'No hotels found for your search criteria'
              : 'Searching for available hotels...'}
          </Alert>
        ) : (
          <Stack spacing={3}>
            {searchResult.hotels.map((hotel) => {
              const bestPrice = getBestPrice(hotel);
              const roomCount = hotel.rooms.length;

              return (
                <Card
                  key={hotel.id}
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: '1px solid #e0e0e0',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      boxShadow: '0 8px 40px rgba(0, 0, 0, 0.12)',
                      transform: 'translateY(-4px)',
                      borderColor: '#667eea',
                    },
                  }}
                >
                  <CardActionArea
                    onClick={() => navigate(`/search/${searchId}/hotel/${hotel.id}`)}
                  >
                    <CardContent sx={{ p: 4 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          mb: 2,
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                            <Typography
                              variant="h5"
                              sx={{
                                fontWeight: 500,
                                color: '#1a1a1a',
                              }}
                            >
                              {hotel.title}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {Array.from({ length: hotel.star_rating }).map((_, i) => (
                                <Star
                                  key={i}
                                  sx={{ fontSize: 18, color: '#fbbf24' }}
                                />
                              ))}
                            </Box>
                          </Box>
                          <Typography
                            variant="body2"
                            sx={{ color: '#666', mb: 2, maxWidth: '80%' }}
                          >
                            {hotel.description}
                          </Typography>
                          <Chip
                            icon={<HotelIcon />}
                            label={`${roomCount} ${roomCount === 1 ? 'room' : 'rooms'} available`}
                            size="small"
                            sx={{
                              borderRadius: 1.5,
                              background: '#f3f4f6',
                              color: '#4b5563',
                            }}
                          />
                        </Box>
                        <Box
                          sx={{
                            textAlign: 'right',
                            ml: 4,
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#666',
                              fontWeight: 300,
                              mb: 0.5,
                            }}
                          >
                            From
                          </Typography>
                          <Typography
                            variant="h4"
                            sx={{
                              fontWeight: 600,
                              color: '#667eea',
                            }}
                          >
                            ${bestPrice.toFixed(2)}
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
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              );
            })}
          </Stack>
        )}
      </Container>
    </Box>
  );
}
