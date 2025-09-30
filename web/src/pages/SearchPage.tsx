import { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
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
  Avatar,
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
  TrendingUp,
  LocalOffer,
  Speed,
} from '@mui/icons-material';
import { apiClient, type LocationOption } from '../lib/api';

// Helper to get date strings
const getTodayString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const getTomorrowString = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

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
  { label: 'Munich', icon: '🏔️' },
  { label: 'Berlin', icon: '🎨' },
  { label: 'Amsterdam', icon: '🚲' },
  { label: 'Paris', icon: '🗼' },
  { label: 'Vienna', icon: '🎻' },
];

// Trust indicators - enhanced
const trustFeatures = [
  { 
    icon: CompareArrows, 
    title: 'All major booking sites', 
    subtitle: 'One search',
    color: '#667eea',
  },
  { 
    icon: Speed, 
    title: 'Real-time prices', 
    subtitle: 'Always current',
    color: '#764ba2',
  },
  { 
    icon: VerifiedUser, 
    title: 'Verified partners', 
    subtitle: 'Trusted sources',
    color: '#f093fb',
  },
  { 
    icon: LocalOffer, 
    title: 'Best deals guaranteed', 
    subtitle: 'No hidden fees',
    color: '#4facfe',
  },
];

// Partner logos placeholder
const partnerLogos = [
  'Booking.com',
  'Expedia',
  'Hotels.com',
  'Agoda',
  'Trivago',
  'Kayak',
];

interface User {
  id: string;
  name: string;
  email: string;
}

export default function SearchPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    location_id: '',
    starts_on: getTodayString(),
    ends_on: getTomorrowString(),
    capacity: 1,
  });
  const [selectedLocation, setSelectedLocation] = useState<LocationOption | null>(null);
  const [locationOptions, setLocationOptions] = useState<LocationOption[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationInputValue, setLocationInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await apiClient.getMe();
        setUser(response.data.user);
      } catch (err) {
        // User not authenticated, keep user as null
        setUser(null);
      } finally {
        setUserLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await apiClient.logout();
      setUser(null);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

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
      {/* Hero Section with City Background */}
      <Box
        sx={{
          position: 'relative',
          minHeight: { xs: '75vh', md: '65vh' },
          background: 'linear-gradient(135deg, rgba(0, 53, 128, 0.85) 0%, rgba(102, 126, 234, 0.9) 100%)',
          display: 'flex',
          flexDirection: 'column',
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
            backgroundImage: 'url("https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1600&auto=format&fit=crop")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.3,
            zIndex: 0,
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -2,
            left: 0,
            right: 0,
            height: '100px',
            background: 'linear-gradient(to bottom, transparent, #fafafa)',
            zIndex: 1,
          },
        }}
      >
        {/* Top Navigation Bar */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 3,
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
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: 'white',
                  fontSize: '1.25rem',
                }}
              >
                Hotel Comparison
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                {!userLoading && (
                  <>
                    {user ? (
                      // Logged in state
                      <>
                        <Typography
                          sx={{
                            color: 'rgba(255, 255, 255, 0.95)',
                            fontWeight: 500,
                            fontSize: '1rem',
                            display: { xs: 'none', sm: 'block' },
                          }}
                        >
                          Welcome, {user.name}
                        </Typography>
                        <Button
                          onClick={handleLogout}
                          sx={{
                            color: 'white',
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '1rem',
                            px: 3,
                            borderRadius: 2,
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            '&:hover': {
                              bgcolor: 'rgba(255, 255, 255, 0.1)',
                              borderColor: 'rgba(255, 255, 255, 0.5)',
                            },
                          }}
                        >
                          Log out
                        </Button>
                      </>
                    ) : (
                      // Logged out state
                      <>
                        <Button
                          component={RouterLink}
                          to="/login"
                          sx={{
                            color: 'white',
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '1rem',
                            px: 2,
                            borderRadius: 2,
                            '&:hover': {
                              bgcolor: 'rgba(255, 255, 255, 0.1)',
                            },
                          }}
                        >
                          Log in
                        </Button>
                        <Button
                          component={RouterLink}
                          to="/signup"
                          variant="contained"
                          sx={{
                            bgcolor: 'white',
                            color: '#003580',
                            textTransform: 'none',
                            fontWeight: 700,
                            fontSize: '1rem',
                            px: 3,
                            borderRadius: 2,
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                            '&:hover': {
                              bgcolor: 'rgba(255, 255, 255, 0.95)',
                              boxShadow: '0 6px 16px rgba(0, 0, 0, 0.25)',
                            },
                          }}
                        >
                          Sign up
                        </Button>
                      </>
                    )}
                  </>
                )}
              </Box>
            </Box>
          </Container>
        </Box>

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
          <Box sx={{ textAlign: 'center', mb: 5 }}>
            <Typography
              variant="h1"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '2.5rem', md: '4rem' },
                letterSpacing: '-0.02em',
                color: 'white',
                mb: 2,
                textShadow: '0 4px 20px rgba(0,0,0,0.3)',
              }}
            >
              Find your perfect stay
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 400,
                color: 'rgba(255, 255, 255, 0.95)',
                maxWidth: '700px',
                mx: 'auto',
                textShadow: '0 2px 10px rgba(0,0,0,0.2)',
                mb: 1,
              }}
            >
              Compare hotels from multiple sources in one click
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 300,
                color: 'rgba(255, 255, 255, 0.85)',
                textShadow: '0 2px 10px rgba(0,0,0,0.2)',
              }}
            >
              All major booking sites. Best prices guaranteed.
            </Typography>
          </Box>

          {/* Search Bar Card */}
          <Paper
            elevation={8}
            sx={{
              p: { xs: 3, md: 3.5 },
              borderRadius: 4,
              maxWidth: '1100px',
              mx: 'auto',
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 30px 80px rgba(0, 0, 0, 0.3)',
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
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { 
                    xs: '1fr',
                    md: 'repeat(12, 1fr)',
                  },
                  gap: 2,
                  alignItems: 'start',
                }}
              >
                <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 5' } }}>
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
                        placeholder="Munich, Berlin, or Paris"
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <InputAdornment position="start">
                              <LocationOn sx={{ color: '#003580' }} />
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
                            bgcolor: 'white',
                          },
                        }}
                      />
                    )}
                  />
                </Box>

                <Box sx={{ gridColumn: { xs: 'span 1', sm: 'span 4', md: 'span 2' } }}>
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
                          <CalendarToday sx={{ color: '#003580', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        bgcolor: 'white',
                      },
                    }}
                  />
                </Box>

                <Box sx={{ gridColumn: { xs: 'span 1', sm: 'span 4', md: 'span 2' } }}>
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
                          <CalendarToday sx={{ color: '#003580', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        bgcolor: 'white',
                      },
                    }}
                  />
                </Box>

                <Box sx={{ gridColumn: { xs: 'span 1', sm: 'span 4', md: 'span 1' } }}>
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
                          <People sx={{ color: '#003580', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        bgcolor: 'white',
                      },
                    }}
                  />
                </Box>

                <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
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
                      fontWeight: 700,
                      bgcolor: '#003580',
                      color: 'white',
                      boxShadow: '0 4px 20px rgba(0, 53, 128, 0.4)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        bgcolor: '#00244d',
                        boxShadow: '0 8px 30px rgba(0, 53, 128, 0.5)',
                        transform: 'translateY(-3px)',
                      },
                    }}
                  >
                    {loading ? 'Searching...' : 'Search'}
                  </Button>
                </Box>
              </Box>
            </form>
          </Paper>

          {/* Quick City Chips */}
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              justifyContent: 'center',
              flexWrap: 'wrap',
              mt: 3,
              px: 2,
            }}
          >
            {quickCategories.map((category, index) => (
              <Chip
                key={index}
                label={`${category.icon} ${category.label}`}
                onClick={() => prefillLocation(category.label)}
                sx={{
                  py: 2.5,
                  px: 2,
                  fontSize: '1rem',
                  fontWeight: 500,
                  background: 'rgba(255, 255, 255, 0.25)',
                  backdropFilter: 'blur(10px)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: 3,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.95)',
                    color: '#003580',
                    borderColor: 'white',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
                  },
                }}
              />
            ))}
          </Box>
        </Container>
      </Box>

      {/* Social Proof - Partner Logos */}
      <Box
        sx={{
          bgcolor: 'white',
          py: 4,
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="body2"
            sx={{
              textAlign: 'center',
              color: '#999',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontSize: '0.75rem',
              mb: 3,
            }}
          >
            Trusted by travelers across Europe · Comparing prices from
          </Typography>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: { xs: 3, md: 5 },
              flexWrap: 'wrap',
            }}
          >
            {partnerLogos.map((partner, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: '#f5f5f5',
                    color: '#666',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  {partner.charAt(0)}
                </Avatar>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#666',
                    fontWeight: 500,
                    fontSize: '0.9rem',
                  }}
                >
                  {partner}
                </Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Trust Strip - Enhanced */}
      <Box
        sx={{
          bgcolor: 'white',
          py: 5,
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} justifyContent="center">
            {trustFeatures.map((feature, index) => (
              <Grid item xs={6} md={3} key={index}>
                <Box
                  sx={{
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 2,
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      '& .feature-icon': {
                        transform: 'scale(1.1)',
                      },
                    },
                  }}
                >
                  <Box
                    className="feature-icon"
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${feature.color}15 0%, ${feature.color}25 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <feature.icon
                      sx={{
                        fontSize: 32,
                        color: feature.color,
                      }}
                    />
                  </Box>
                  <Box>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 700,
                        color: '#1a1a1a',
                        fontSize: '1rem',
                        mb: 0.5,
                      }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#666',
                        fontWeight: 400,
                        fontSize: '0.85rem',
                      }}
                    >
                      {feature.subtitle}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Featured Destinations with "Popular This Week" Header */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ mb: 5, textAlign: 'center' }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              mb: 2,
              px: 2,
              py: 0.5,
              bgcolor: 'rgba(102, 126, 234, 0.08)',
              borderRadius: 2,
            }}
          >
            <TrendingUp sx={{ color: '#667eea', fontSize: 20 }} />
            <Typography
              variant="caption"
              sx={{
                color: '#667eea',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              Popular This Week
            </Typography>
          </Box>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              color: '#1a1a1a',
              mb: 1,
              letterSpacing: '-0.02em',
              fontSize: { xs: '2rem', md: '2.5rem' },
            }}
          >
            Top destinations across Europe
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: '#666',
              fontWeight: 300,
              fontSize: '1.1rem',
            }}
          >
            Discover amazing stays in the most sought-after cities
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
                  boxShadow: '0 2px 16px rgba(0, 0, 0, 0.08)',
                  border: '1px solid #f0f0f0',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 16px 48px rgba(0, 0, 0, 0.15)',
                    borderColor: 'transparent',
                    '& .destination-image': {
                      transform: 'scale(1.08)',
                    },
                    '& .destination-overlay': {
                      background: 'linear-gradient(to top, rgba(0,53,128,0.85) 0%, transparent 100%)',
                    },
                  },
                }}
              >
                <Box sx={{ position: 'relative', paddingTop: '75%', overflow: 'hidden' }}>
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
                      transition: 'transform 0.6s ease',
                    }}
                  />
                  <Box
                    className="destination-overlay"
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)',
                      p: 3,
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <Typography
                      variant="h5"
                      sx={{
                        color: 'white',
                        fontWeight: 700,
                        mb: 0.5,
                        fontSize: '1.5rem',
                      }}
                    >
                      {destination.city}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontWeight: 400,
                        fontSize: '0.95rem',
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
      <Box sx={{ bgcolor: '#f9f9f9', py: 8 }}>
        <Container maxWidth="lg">
          <Box sx={{ mb: 5, textAlign: 'center' }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: '#1a1a1a',
                mb: 1,
                letterSpacing: '-0.02em',
                fontSize: { xs: '2rem', md: '2.5rem' },
              }}
            >
              What you'll discover
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: '#666',
                fontWeight: 300,
                fontSize: '1.1rem',
              }}
            >
              Detailed hotel information with real-time pricing
            </Typography>
          </Box>

          <Box sx={{ maxWidth: '900px', mx: 'auto' }}>
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden',
                border: '2px solid #f0f0f0',
              }}
            >
              <Grid container>
                <Grid item xs={12} md={5}>
                  <CardMedia
                    component="img"
                    image="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop"
                    alt="Example hotel"
                    sx={{
                      height: { xs: 240, md: '100%' },
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
                            fontSize: 20,
                            color: '#ffa726',
                          }}
                        />
                      ))}
                    </Box>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        mb: 1,
                        color: '#1a1a1a',
                        fontSize: '1.75rem',
                      }}
                    >
                      Grand Plaza Hotel
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#666',
                        mb: 2,
                        fontWeight: 400,
                      }}
                    >
                      📍 City Center, Munich
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        color: '#333',
                        mb: 3,
                        lineHeight: 1.7,
                        fontWeight: 300,
                      }}
                    >
                      Luxury hotel featuring spacious rooms, rooftop terrace, spa facilities, and fine dining restaurant in the heart of the city.
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#666',
                            display: 'block',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            fontSize: '0.7rem',
                            mb: 0.5,
                          }}
                        >
                          Starting from
                        </Typography>
                        <Typography
                          variant="h3"
                          sx={{
                            fontWeight: 800,
                            color: '#003580',
                            fontSize: '2.5rem',
                          }}
                        >
                          €129
                          <Typography
                            component="span"
                            variant="body1"
                            sx={{ color: '#666', fontWeight: 400, fontSize: '1rem' }}
                          >
                            /night
                          </Typography>
                        </Typography>
                      </Box>
                      <Chip
                        label="Example result"
                        size="small"
                        sx={{
                          bgcolor: 'rgba(0, 53, 128, 0.08)',
                          color: '#003580',
                          fontWeight: 600,
                          px: 1,
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
          mt: 0,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} justifyContent="space-between" alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  mb: 1,
                  color: 'white',
                }}
              >
                Hotel Comparison
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: 300,
                  mb: 2,
                }}
              >
                Built with BaseAPI · Compare smarter, travel better.
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '0.75rem',
                }}
              >
                © 2025 Hotel Comparison. All rights reserved.
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
                    fontWeight: 500,
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
                    fontWeight: 500,
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
                    fontWeight: 500,
                    transition: 'color 0.2s ease',
                    '&:hover': {
                      color: '#667eea',
                    },
                  }}
                >
                  Privacy
                </Link>
                <Link
                  href="#"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    transition: 'color 0.2s ease',
                    '&:hover': {
                      color: '#667eea',
                    },
                  }}
                >
                  Terms
                </Link>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}