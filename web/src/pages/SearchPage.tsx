import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  Autocomplete,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Link,
  InputAdornment,
  Chip,
} from '@mui/material';
import {
  LocationOn,
  CheckCircleOutline,
  VerifiedUser,
  MoneyOff,
  CompareArrows,
  CalendarToday,
  People,
  Star,
} from '@mui/icons-material';
import { apiClient, type LocationOption } from '../lib/api';

// Featured destinations data
const featuredDestinations = [
  {
    city: 'Munich',
    country: 'Germany',
    image: 'https://images.unsplash.com/photo-1595867818082-083862f3d630?w=800&auto=format&fit=crop',
    priceFrom: 89,
  },
  {
    city: 'Berlin',
    country: 'Germany',
    image: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800&auto=format&fit=crop',
    priceFrom: 75,
  },
  {
    city: 'Paris',
    country: 'France',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop',
    priceFrom: 120,
  },
  {
    city: 'Amsterdam',
    country: 'Netherlands',
    image: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&auto=format&fit=crop',
    priceFrom: 95,
  },
  {
    city: 'Vienna',
    country: 'Austria',
    image: 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=800&auto=format&fit=crop',
    priceFrom: 85,
  },
  {
    city: 'Prague',
    country: 'Czech Republic',
    image: 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=800&auto=format&fit=crop',
    priceFrom: 65,
  },
];

// Quick category suggestions
const quickCategories = [
  { label: 'Popular right now', query: 'Munich' },
  { label: 'Weekend Getaways', query: 'Berlin' },
  { label: 'Budget Stays', query: 'Prague' },
  { label: 'Family-friendly', query: 'Vienna' },
];

// Trust indicators
const trustFeatures = [
  { icon: CheckCircleOutline, text: 'Real-time availability' },
  { icon: VerifiedUser, text: 'Verified partners' },
  { icon: MoneyOff, text: 'No hidden fees' },
  { icon: CompareArrows, text: 'Compare dozens of sites' },
];

export default function SearchPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    location_id: '',
    starts_on: '',
    ends_on: '',
    capacity: 1,
  });
  const [selectedLocation, setSelectedLocation] = useState<LocationOption | null>(null);
  const [locationOptions, setLocationOptions] = useState<LocationOption[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationInputValue, setLocationInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced location search
  const searchLocations = async (query: string) => {
    if (query.length < 2) {
      setLocationOptions([]);
      return;
    }

    setLocationLoading(true);
    try {
      const response = await apiClient.autocompleteLocations(query);
      setLocationOptions(response.data.locations);
    } catch (err) {
      console.error('Failed to fetch locations:', err);
      setLocationOptions([]);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.location_id) {
      setError('Please select a location');
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.createSearch(formData);
      navigate(`/search/${response.data.search_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const prefillLocation = async (cityName: string) => {
    setLocationInputValue(cityName);
    await searchLocations(cityName);
    // Scroll to search bar
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa' }}>
      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          minHeight: { xs: '70vh', md: '60vh' },
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.12) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: { xs: 4, md: 8 },
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(102, 126, 234, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(118, 75, 162, 0.1) 0%, transparent 50%)',
            pointerEvents: 'none',
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ textAlign: 'center', mb: 5 }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 600,
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                letterSpacing: '-0.02em',
                color: '#1a1a1a',
                mb: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Find your perfect stay
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 300,
                color: '#666',
                maxWidth: '600px',
                mx: 'auto',
              }}
            >
              Compare hotels from multiple sources in one click.
            </Typography>
          </Box>

          {/* Search Bar Card */}
          <Paper
            elevation={4}
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: 4,
              maxWidth: '1000px',
              mx: 'auto',
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08)',
            }}
          >
            {error && (
              <Alert 
                severity="error" 
                sx={{ mb: 3, borderRadius: 2 }}
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Grid container spacing={2} alignItems="flex-start">
                <Grid item xs={12} md={3}>
                  <Autocomplete
                    value={selectedLocation}
                    onChange={(_, newValue) => {
                      setSelectedLocation(newValue);
                      setFormData({ ...formData, location_id: newValue?.id || '' });
                    }}
                    inputValue={locationInputValue}
                    onInputChange={(_, newInputValue) => {
                      setLocationInputValue(newInputValue);
                      searchLocations(newInputValue);
                    }}
                    options={locationOptions}
                    loading={locationLoading}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    getOptionLabel={(option) => option.label}
                    noOptionsText="Start typing to search..."
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Where"
                        required
                        placeholder="City or location"
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <InputAdornment position="start">
                              <LocationOn sx={{ color: '#667eea' }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <>
                              {locationLoading ? (
                                <CircularProgress color="inherit" size={20} />
                              ) : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          },
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={2.5}>
                  <TextField
                    label="Check-in"
                    type="date"
                    value={formData.starts_on}
                    onChange={(e) =>
                      setFormData({ ...formData, starts_on: e.target.value })
                    }
                    required
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarToday sx={{ color: '#667eea' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={2.5}>
                  <TextField
                    label="Check-out"
                    type="date"
                    value={formData.ends_on}
                    onChange={(e) =>
                      setFormData({ ...formData, ends_on: e.target.value })
                    }
                    required
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarToday sx={{ color: '#667eea' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    label="Guests"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({ ...formData, capacity: parseInt(e.target.value) })
                    }
                    required
                    fullWidth
                    inputProps={{ min: 1, max: 12 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <People sx={{ color: '#667eea' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading}
                    fullWidth
                    sx={{
                      py: 2,
                      height: '56px',
                      borderRadius: 2,
                      textTransform: 'none',
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8a 100%)',
                        boxShadow: '0 6px 30px rgba(102, 126, 234, 0.4)',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    {loading ? 'Searching...' : 'Search'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Container>
      </Box>

      {/* Quick Categories */}
      <Container maxWidth="lg" sx={{ mt: -3, mb: 6, position: 'relative', zIndex: 2 }}>
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            overflowX: 'auto',
            pb: 2,
            px: 1,
            '&::-webkit-scrollbar': {
              height: 6,
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f1f1',
              borderRadius: 3,
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#667eea',
              borderRadius: 3,
            },
          }}
        >
          {quickCategories.map((category, index) => (
            <Chip
              key={index}
              label={category.label}
              onClick={() => prefillLocation(category.query)}
              sx={{
                py: 2.5,
                px: 1,
                fontSize: '0.95rem',
                fontWeight: 500,
                background: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: 3,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  borderColor: 'transparent',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)',
                },
              }}
            />
          ))}
        </Box>
      </Container>

      {/* Trust Strip */}
      <Box
        sx={{
          bgcolor: 'white',
          py: 4,
          borderTop: '1px solid #f0f0f0',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={3} justifyContent="center">
            {trustFeatures.map((feature, index) => (
              <Grid item xs={6} sm={3} key={index}>
                <Box
                  sx={{
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <feature.icon
                    sx={{
                      fontSize: 40,
                      color: '#667eea',
                      mb: 0.5,
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      color: '#333',
                      fontSize: '0.9rem',
                    }}
                  >
                    {feature.text}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Featured Destinations */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ mb: 5, textAlign: 'center' }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              color: '#1a1a1a',
              mb: 1,
              letterSpacing: '-0.01em',
            }}
          >
            Explore popular destinations
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: '#666',
              fontWeight: 300,
            }}
          >
            Discover amazing stays in cities across Europe
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {featuredDestinations.map((destination, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                onClick={() => prefillLocation(destination.city)}
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  borderRadius: 3,
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.12)',
                    '& .destination-image': {
                      transform: 'scale(1.05)',
                    },
                  },
                }}
              >
                <Box sx={{ position: 'relative', paddingTop: '66.67%', overflow: 'hidden' }}>
                  <CardMedia
                    component="img"
                    image={destination.image}
                    alt={destination.city}
                    className="destination-image"
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.5s ease',
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
                      p: 3,
                    }}
                  >
                    <Typography
                      variant="h5"
                      sx={{
                        color: 'white',
                        fontWeight: 600,
                        mb: 0.5,
                      }}
                    >
                      {destination.city}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontWeight: 300,
                      }}
                    >
                      from €{destination.priceFrom}/night
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Example Search Result Teaser */}
      <Box sx={{ bgcolor: 'white', py: 8 }}>
        <Container maxWidth="lg">
          <Box sx={{ mb: 5, textAlign: 'center' }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 600,
                color: '#1a1a1a',
                mb: 1,
                letterSpacing: '-0.01em',
              }}
            >
              What you'll discover
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: '#666',
                fontWeight: 300,
              }}
            >
              Preview of search results you can expect
            </Typography>
          </Box>

          <Box sx={{ maxWidth: '800px', mx: 'auto' }}>
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                overflow: 'hidden',
              }}
            >
              <Grid container>
                <Grid item xs={12} md={5}>
                  <CardMedia
                    component="img"
                    image="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop"
                    alt="Example hotel"
                    sx={{
                      height: { xs: 200, md: '100%' },
                      objectFit: 'cover',
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={7}>
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          sx={{
                            fontSize: 18,
                            color: '#ffa726',
                          }}
                        />
                      ))}
                    </Box>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 600,
                        mb: 1,
                        color: '#1a1a1a',
                      }}
                    >
                      Grand Plaza Hotel
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#666',
                        mb: 2,
                        fontWeight: 300,
                      }}
                    >
                      City Center, Munich
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        color: '#333',
                        mb: 3,
                        lineHeight: 1.6,
                      }}
                    >
                      Luxury hotel featuring spacious rooms, rooftop terrace, spa facilities, and fine dining restaurant.
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#666',
                            display: 'block',
                          }}
                        >
                          Starting from
                        </Typography>
                        <Typography
                          variant="h4"
                          sx={{
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                          }}
                        >
                          €129
                          <Typography
                            component="span"
                            variant="body2"
                            sx={{ color: '#666', fontWeight: 400 }}
                          >
                            /night
                          </Typography>
                        </Typography>
                      </Box>
                      <Chip
                        label="Example result"
                        size="small"
                        sx={{
                          bgcolor: 'rgba(102, 126, 234, 0.1)',
                          color: '#667eea',
                          fontWeight: 500,
                        }}
                      />
                    </Box>
                  </CardContent>
                </Grid>
              </Grid>
            </Card>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          bgcolor: '#1a1a1a',
          color: 'white',
          py: 6,
          mt: 8,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} justifyContent="space-between" alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  mb: 1,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Hotel Comparison
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: 300,
                }}
              >
                Built with BaseAPI · Compare smarter.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  display: 'flex',
                  gap: 3,
                  justifyContent: { xs: 'flex-start', md: 'flex-end' },
                  flexWrap: 'wrap',
                }}
              >
                <Link
                  href="#"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 400,
                    transition: 'color 0.2s ease',
                    '&:hover': {
                      color: '#667eea',
                    },
                  }}
                >
                  About
                </Link>
                <Link
                  href="#"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 400,
                    transition: 'color 0.2s ease',
                    '&:hover': {
                      color: '#667eea',
                    },
                  }}
                >
                  Contact
                </Link>
                <Link
                  href="#"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 400,
                    transition: 'color 0.2s ease',
                    '&:hover': {
                      color: '#667eea',
                    },
                  }}
                >
                  Privacy
                </Link>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}