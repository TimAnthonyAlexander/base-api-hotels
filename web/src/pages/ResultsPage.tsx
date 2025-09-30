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
  Skeleton,
} from '@mui/material';
import { Hotel as HotelIcon, Star, Refresh } from '@mui/icons-material';
import { apiClient, type Hotel, type SearchResult } from '../lib/api';
import SearchForm, { type SearchFormData } from '../components/SearchForm';

export default function ResultsPage() {
  const { searchId } = useParams<{ searchId: string }>();
  const navigate = useNavigate();
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchFormOpen, setSearchFormOpen] = useState(false);

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
            Finding the best hotels for you...
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

  if (!searchResult) {
    return null;
  }

  const isSearching = searchResult.search.status === 'pending' || searchResult.search.status === 'started';

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #fafafa 0%, #ffffff 100%)' }}>
      {/* Header with gradient */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          pt: 4,
          pb: 8,
          position: 'relative',
          overflow: 'hidden',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -2,
            left: 0,
            right: 0,
            height: '60px',
            background: 'linear-gradient(to bottom, transparent, #fafafa)',
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography
              variant="h3"
              component="h1"
              sx={{
                fontWeight: 600,
                letterSpacing: '-0.02em',
                color: 'white',
                mb: 1,
                fontSize: { xs: '2rem', md: '2.5rem' },
              }}
            >
              Your Search Results
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.9)', 
                fontWeight: 300,
                fontSize: '1.1rem',
              }}
            >
              {searchResult.search.results} {searchResult.search.results === 1 ? 'hotel' : 'hotels'} found
              {isSearching && (
                <Chip
                  icon={<Refresh sx={{ animation: 'spin 1s linear infinite', '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }} />}
                  label="Searching"
                  size="small"
                  sx={{
                    ml: 2,
                    background: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontWeight: 500,
                  }}
                />
              )}
            </Typography>
          </Box>

          {/* Compact Search Form */}
          <SearchForm 
            onSubmit={handleNewSearch} 
            compact 
          />
        </Container>
      </Box>

      {/* Results Container */}
      <Container maxWidth="lg" sx={{ mt: -2, pb: 8 }}>
        {searchResult.hotels.length === 0 ? (
          <Fade in timeout={600}>
            <Alert 
              severity="info" 
              sx={{ 
                borderRadius: 3,
                border: '1px solid #e3f2fd',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              }}
            >
              {isSearching
                ? 'Searching for available hotels...'
                : 'No hotels found for your search criteria'}
            </Alert>
          </Fade>
        ) : (
          <Stack spacing={3}>
            {searchResult.hotels.map((hotel, index) => {
              const bestPrice = getBestPrice(hotel);
              const roomCount = hotel.rooms.length;

              return (
                <Fade in timeout={400 + (index * 100)} key={hotel.id}>
                  <Card
                    elevation={0}
                    sx={{
                      borderRadius: 3,
                      border: '1px solid #e0e0e0',
                      background: 'white',
                      overflow: 'hidden',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                        opacity: 0,
                        transition: 'opacity 0.3s ease',
                      },
                      '&:hover': {
                        boxShadow: '0 12px 48px rgba(102, 126, 234, 0.15)',
                        transform: 'translateY(-6px)',
                        borderColor: 'transparent',
                        '&::before': {
                          opacity: 1,
                        },
                      },
                    }}
                  >
                    <CardActionArea
                      onClick={() => navigate(`/search/${searchId}/hotel/${hotel.id}`)}
                      sx={{ 
                        '&:hover .MuiCardActionArea-focusHighlight': {
                          opacity: 0,
                        },
                      }}
                    >
                      <CardContent sx={{ p: 4 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            flexDirection: { xs: 'column', md: 'row' },
                            gap: 3,
                          }}
                        >
                          <Box sx={{ flex: 1, width: '100%' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5, flexWrap: 'wrap' }}>
                              <Typography
                                variant="h5"
                                sx={{
                                  fontWeight: 600,
                                  color: '#1a1a1a',
                                  fontSize: { xs: '1.25rem', md: '1.5rem' },
                                  letterSpacing: '-0.01em',
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
                              sx={{ 
                                color: '#666', 
                                mb: 2.5, 
                                maxWidth: { xs: '100%', md: '85%' },
                                lineHeight: 1.6,
                                fontWeight: 300,
                              }}
                            >
                              {hotel.description}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                              <Chip
                                icon={<HotelIcon />}
                                label={`${roomCount} ${roomCount === 1 ? 'room' : 'rooms'} available`}
                                size="small"
                                sx={{
                                  borderRadius: 2,
                                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)',
                                  color: '#667eea',
                                  fontWeight: 500,
                                  border: '1px solid rgba(102, 126, 234, 0.2)',
                                }}
                              />
                            </Box>
                          </Box>
                          <Box
                            sx={{
                              textAlign: { xs: 'left', md: 'right' },
                              minWidth: { md: '160px' },
                              width: { xs: '100%', md: 'auto' },
                              display: 'flex',
                              flexDirection: { xs: 'row', md: 'column' },
                              justifyContent: { xs: 'space-between', md: 'flex-start' },
                              alignItems: { xs: 'center', md: 'flex-end' },
                            }}
                          >
                            <Box>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: '#999',
                                  fontWeight: 400,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.05em',
                                  fontSize: '0.7rem',
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
                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent',
                                  backgroundClip: 'text',
                                  fontSize: { xs: '2rem', md: '2.5rem' },
                                  letterSpacing: '-0.02em',
                                }}
                              >
                                ${bestPrice.toFixed(0)}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: '#999',
                                  fontWeight: 300,
                                  fontSize: '0.85rem',
                                }}
                              >
                                per night
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </CardContent>
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