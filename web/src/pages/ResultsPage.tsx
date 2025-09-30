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
  Fade,
  Button,
  CardMedia,
} from '@mui/material';
import { Hotel as HotelIcon, Star, ArrowForward, CalendarToday, People } from '@mui/icons-material';
import { apiClient, type Hotel, type SearchResult } from '../lib/api';
import SearchForm, { type SearchFormData } from '../components/SearchForm';

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
    const interval = setInterval(fetchResults, 2000);

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

  const handleNewSearch = async (data: SearchFormData) => {
    try {
      const response = await apiClient.createSearch(data);
      navigate(`/search/${response.data.search_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
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
          <CircularProgress 
            size={60} 
            sx={{ color: '#003580', mb: 2 }} 
          />
          <Typography variant="body1" sx={{ color: '#666', fontWeight: 400 }}>
            Finding the best hotels for you...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa', py: 8 }}>
        <Container maxWidth="lg">
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {error}
          </Alert>
        </Container>
      </Box>
    );
  }

  if (!searchResult) {
    return null;
  }

  const isSearching = searchResult.search.status === 'pending' || searchResult.search.status === 'started';

  // Placeholder images for hotels (in production, these would come from the API)
  const hotelImages = [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&auto=format&fit=crop',
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f9fafb' }}>
      {/* Top Navigation Bar */}
      <Box
        sx={{
          bgcolor: 'white',
          borderBottom: '1px solid #e0e0e0',
          py: 2,
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: '#003580',
              cursor: 'pointer',
            }}
            onClick={() => navigate('/')}
          >
            Hotel Comparison
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Compact Search Form */}
        <Box sx={{ mb: 3 }}>
          <SearchForm onSubmit={handleNewSearch} compact />
        </Box>

        {/* Context Header */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: '#1a1a1a',
              mb: 0.5,
              fontSize: { xs: '1.5rem', md: '2rem' },
            }}
          >
            Hotels Found
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="body1" sx={{ color: '#666', fontWeight: 400 }}>
              {searchResult.search.results} {searchResult.search.results === 1 ? 'result' : 'results'}
            </Typography>
            {isSearching && (
              <Chip
                label="Searching..."
                size="small"
                sx={{
                  bgcolor: '#e3f2fd',
                  color: '#003580',
                  fontWeight: 500,
                }}
              />
            )}
          </Box>
        </Box>

        {/* Results */}
        {searchResult.hotels.length === 0 ? (
          <Alert 
            severity="info" 
            sx={{ 
              borderRadius: 2,
              bgcolor: 'white',
            }}
          >
            {isSearching
              ? 'Searching for available hotels...'
              : 'No hotels found for your search criteria'}
          </Alert>
        ) : (
          <Stack spacing={2}>
            {searchResult.hotels.map((hotel, index) => {
              const bestPrice = getBestPrice(hotel);
              const roomCount = hotel.rooms.length;
              const imageUrl = hotelImages[index % hotelImages.length];

              return (
                <Fade in timeout={300 + (index * 50)} key={hotel.id}>
                  <Card
                    elevation={0}
                    sx={{
                      borderRadius: 2,
                      border: '1px solid #e0e0e0',
                      bgcolor: 'white',
                      overflow: 'hidden',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
                        transform: 'translateY(-2px)',
                        borderColor: '#003580',
                      },
                    }}
                  >
                    <CardActionArea
                      onClick={() => navigate(`/search/${searchId}/hotel/${hotel.id}`)}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: { xs: 'column', md: 'row' },
                        }}
                      >
                        {/* Image */}
                        <Box
                          sx={{
                            width: { xs: '100%', md: '280px' },
                            height: { xs: '200px', md: 'auto' },
                            flexShrink: 0,
                            position: 'relative',
                            overflow: 'hidden',
                          }}
                        >
                          <CardMedia
                            component="img"
                            image={imageUrl}
                            alt={hotel.title}
                            sx={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                        </Box>

                        {/* Content */}
                        <Box
                          sx={{
                            display: 'flex',
                            flex: 1,
                            flexDirection: { xs: 'column', sm: 'row' },
                          }}
                        >
                          <CardContent
                            sx={{
                              flex: 1,
                              p: 3,
                              '&:last-child': { pb: 3 },
                            }}
                          >
                            {/* Header */}
                            <Box sx={{ mb: 1.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                {Array.from({ length: hotel.star_rating }).map((_, i) => (
                                  <Star
                                    key={i}
                                    sx={{ fontSize: 16, color: '#fbbf24' }}
                                  />
                                ))}
                              </Box>
                              <Typography
                                variant="h6"
                                sx={{
                                  fontWeight: 600,
                                  color: '#003580',
                                  mb: 0.5,
                                  fontSize: '1.15rem',
                                }}
                              >
                                {hotel.title}
                              </Typography>
                            </Box>

                            {/* Description */}
                            <Typography
                              variant="body2"
                              sx={{
                                color: '#666',
                                mb: 2,
                                lineHeight: 1.5,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {hotel.description}
                            </Typography>

                            {/* Badges */}
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              <Chip
                                icon={<HotelIcon sx={{ fontSize: 14 }} />}
                                label={`${roomCount} room${roomCount !== 1 ? 's' : ''}`}
                                size="small"
                                sx={{
                                  height: 24,
                                  bgcolor: '#f0f9ff',
                                  color: '#0369a1',
                                  fontWeight: 500,
                                  fontSize: '0.75rem',
                                  '& .MuiChip-icon': { color: '#0369a1' },
                                }}
                              />
                            </Box>
                          </CardContent>

                          {/* Price Section */}
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              p: 3,
                              minWidth: { sm: '180px' },
                              textAlign: { xs: 'left', sm: 'right' },
                              bgcolor: { xs: 'transparent', sm: '#fafbfc' },
                              borderLeft: { xs: 'none', sm: '1px solid #e0e0e0' },
                            }}
                          >
                            <Box>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: '#666',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.05em',
                                  fontSize: '0.65rem',
                                  fontWeight: 600,
                                  display: 'block',
                                  mb: 0.5,
                                }}
                              >
                                From
                              </Typography>
                              <Typography
                                variant="h4"
                                sx={{
                                  fontWeight: 700,
                                  color: '#003580',
                                  fontSize: '2rem',
                                  lineHeight: 1,
                                  mb: 0.5,
                                }}
                              >
                                ${bestPrice.toFixed(0)}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: '#666',
                                  fontSize: '0.75rem',
                                  display: 'block',
                                  mb: 2,
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
                                px: 2,
                                py: 1,
                                borderRadius: 1,
                                fontSize: '0.9rem',
                                '&:hover': {
                                  bgcolor: '#00244d',
                                },
                              }}
                            >
                              View deals
                            </Button>
                          </Box>
                        </Box>
                      </Box>
                    </CardActionArea>
                  </Card>
                </Fade>
              );
            })}
          </Stack>
        )}
      </Container>
    </Box>
  );
}