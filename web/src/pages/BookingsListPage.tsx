import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    Card,
    CardContent,
    CardActionArea,
    CircularProgress,
    Alert,
    Button,
    Chip,
    Stack,
    Fade,
    Grid,
    Divider,
} from '@mui/material';
import {
    Home,
    CalendarToday,
    People,
    Star,
    Receipt,
    Hotel as HotelIcon,
    ArrowForward,
} from '@mui/icons-material';
import { apiClient, type BookingListItem } from '../lib/api';

interface User {
    id: string;
    name: string;
    email: string;
}

export default function BookingsListPage() {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState<BookingListItem[]>([]);
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
        const fetchBookings = async () => {
            try {
                const response = await apiClient.listBookings();
                setBookings(response.data.bookings);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load bookings');
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, []);

    const handleLogout = async () => {
        try {
            await apiClient.logout();
            setUser(null);
            navigate('/');
        } catch (err) {
            console.error('Logout failed:', err);
        }
    };

    const getNights = (startsOn: string, endsOn: string) => {
        return Math.ceil(
            (new Date(endsOn).getTime() - new Date(startsOn).getTime()) /
            (1000 * 60 * 60 * 24)
        );
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed':
                return { bg: '#f0fdf4', color: '#15803d' };
            case 'pending':
                return { bg: '#fef3c7', color: '#92400e' };
            case 'cancelled':
                return { bg: '#fee2e2', color: '#991b1b' };
            default:
                return { bg: '#f3f4f6', color: '#374151' };
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
                        Loading your bookings...
                    </Typography>
                </Box>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa', py: 8 }}>
                <Container maxWidth="lg">
                    <Alert severity="error" sx={{ borderRadius: 2, mb: 3 }}>
                        {error}
                    </Alert>
                    <Button
                        startIcon={<Home />}
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

            <Container maxWidth="lg" sx={{ py: 6 }}>
                {/* Header */}
                <Fade in timeout={300}>
                    <Box sx={{ mb: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Box
                                sx={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Receipt sx={{ fontSize: 28, color: 'white' }} />
                            </Box>
                            <Box>
                                <Typography
                                    variant="h3"
                                    sx={{
                                        fontWeight: 700,
                                        color: '#1a1a1a',
                                        fontSize: { xs: '2rem', md: '2.5rem' },
                                        letterSpacing: '-0.02em',
                                    }}
                                >
                                    My Bookings
                                </Typography>
                                <Typography
                                    variant="body1"
                                    sx={{
                                        color: '#666',
                                        fontSize: '1.1rem',
                                    }}
                                >
                                    {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'} total
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Fade>

                {/* Bookings List */}
                {bookings.length === 0 ? (
                    <Fade in timeout={400}>
                        <Card
                            elevation={0}
                            sx={{
                                p: 6,
                                borderRadius: 3,
                                border: '1px solid #e0e0e0',
                                textAlign: 'center',
                            }}
                        >
                            <Box
                                sx={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: '50%',
                                    bgcolor: '#f3f4f6',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mx: 'auto',
                                    mb: 3,
                                }}
                            >
                                <Receipt sx={{ fontSize: 40, color: '#9ca3af' }} />
                            </Box>
                            <Typography
                                variant="h5"
                                sx={{
                                    fontWeight: 600,
                                    color: '#1a1a1a',
                                    mb: 1,
                                }}
                            >
                                No bookings yet
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{
                                    color: '#666',
                                    mb: 3,
                                }}
                            >
                                Start exploring hotels and make your first booking
                            </Typography>
                            <Button
                                variant="contained"
                                size="large"
                                onClick={() => navigate('/')}
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    bgcolor: '#003580',
                                    px: 4,
                                    '&:hover': {
                                        bgcolor: '#00244d',
                                    },
                                }}
                            >
                                Search Hotels
                            </Button>
                        </Card>
                    </Fade>
                ) : (
                    <Stack spacing={3}>
                        {bookings.map((item, index) => {
                            const { booking, hotel, room, offer } = item;
                            const nights = getNights(booking.starts_on, booking.ends_on);
                            const totalCost = booking.total_price * nights;
                            const statusStyle = getStatusColor(booking.status);

                            return (
                                <Fade in timeout={400 + index * 50} key={booking.id}>
                                    <Card
                                        elevation={0}
                                        sx={{
                                            borderRadius: 2,
                                            border: '1px solid #e0e0e0',
                                            overflow: 'hidden',
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                                                transform: 'translateY(-2px)',
                                                borderColor: '#667eea',
                                            },
                                        }}
                                    >
                                        <CardActionArea
                                            onClick={() => navigate(`/booking/${booking.id}`)}
                                        >
                                            <CardContent sx={{ p: 3 }}>
                                                <Grid container spacing={3}>
                                                    {/* Left Column - Hotel & Room Info */}
                                                    <Grid item xs={12} md={7}>
                                                        <Box sx={{ mb: 2 }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                                {Array.from({ length: hotel.star_rating }).map((_, i) => (
                                                                    <Star key={i} sx={{ fontSize: 16, color: '#fbbf24' }} />
                                                                ))}
                                                                <Chip
                                                                    label={booking.status.toUpperCase()}
                                                                    size="small"
                                                                    sx={{
                                                                        height: 22,
                                                                        bgcolor: statusStyle.bg,
                                                                        color: statusStyle.color,
                                                                        fontWeight: 600,
                                                                        fontSize: '0.7rem',
                                                                        ml: 1,
                                                                    }}
                                                                />
                                                            </Box>
                                                            <Typography
                                                                variant="h6"
                                                                sx={{
                                                                    fontWeight: 600,
                                                                    color: '#003580',
                                                                    mb: 0.5,
                                                                    fontSize: '1.25rem',
                                                                }}
                                                            >
                                                                {hotel.title}
                                                            </Typography>
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    color: '#666',
                                                                    mb: 1,
                                                                }}
                                                            >
                                                                {room.category}
                                                            </Typography>
                                                        </Box>

                                                        <Grid container spacing={2}>
                                                            <Grid item xs={6} sm={4}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    <CalendarToday sx={{ fontSize: 16, color: '#667eea' }} />
                                                                    <Box>
                                                                        <Typography
                                                                            variant="caption"
                                                                            sx={{
                                                                                color: '#999',
                                                                                fontSize: '0.7rem',
                                                                                display: 'block',
                                                                            }}
                                                                        >
                                                                            Check-in
                                                                        </Typography>
                                                                        <Typography
                                                                            variant="body2"
                                                                            sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: '0.85rem' }}
                                                                        >
                                                                            {new Date(booking.starts_on).toLocaleDateString('en-US', {
                                                                                month: 'short',
                                                                                day: 'numeric',
                                                                            })}
                                                                        </Typography>
                                                                    </Box>
                                                                </Box>
                                                            </Grid>
                                                            <Grid item xs={6} sm={4}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    <CalendarToday sx={{ fontSize: 16, color: '#667eea' }} />
                                                                    <Box>
                                                                        <Typography
                                                                            variant="caption"
                                                                            sx={{
                                                                                color: '#999',
                                                                                fontSize: '0.7rem',
                                                                                display: 'block',
                                                                            }}
                                                                        >
                                                                            Check-out
                                                                        </Typography>
                                                                        <Typography
                                                                            variant="body2"
                                                                            sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: '0.85rem' }}
                                                                        >
                                                                            {new Date(booking.ends_on).toLocaleDateString('en-US', {
                                                                                month: 'short',
                                                                                day: 'numeric',
                                                                            })}
                                                                        </Typography>
                                                                    </Box>
                                                                </Box>
                                                            </Grid>
                                                            <Grid item xs={6} sm={4}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    <HotelIcon sx={{ fontSize: 16, color: '#667eea' }} />
                                                                    <Box>
                                                                        <Typography
                                                                            variant="caption"
                                                                            sx={{
                                                                                color: '#999',
                                                                                fontSize: '0.7rem',
                                                                                display: 'block',
                                                                            }}
                                                                        >
                                                                            Nights
                                                                        </Typography>
                                                                        <Typography
                                                                            variant="body2"
                                                                            sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: '0.85rem' }}
                                                                        >
                                                                            {nights}
                                                                        </Typography>
                                                                    </Box>
                                                                </Box>
                                                            </Grid>
                                                            <Grid item xs={6} sm={4}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    <People sx={{ fontSize: 16, color: '#667eea' }} />
                                                                    <Box>
                                                                        <Typography
                                                                            variant="caption"
                                                                            sx={{
                                                                                color: '#999',
                                                                                fontSize: '0.7rem',
                                                                                display: 'block',
                                                                            }}
                                                                        >
                                                                            Guests
                                                                        </Typography>
                                                                        <Typography
                                                                            variant="body2"
                                                                            sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: '0.85rem' }}
                                                                        >
                                                                            {booking.capacity}
                                                                        </Typography>
                                                                    </Box>
                                                                </Box>
                                                            </Grid>
                                                        </Grid>
                                                    </Grid>

                                                    {/* Right Column - Pricing & Action */}
                                                    <Grid item xs={12} md={5}>
                                                        <Box
                                                            sx={{
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                justifyContent: 'space-between',
                                                                height: '100%',
                                                                pl: { xs: 0, md: 3 },
                                                                borderLeft: { xs: 'none', md: '1px solid #e0e0e0' },
                                                            }}
                                                        >
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
                                                                    Total Cost
                                                                </Typography>
                                                                <Typography
                                                                    variant="h4"
                                                                    sx={{
                                                                        fontWeight: 700,
                                                                        color: '#10b981',
                                                                        fontSize: '2rem',
                                                                        lineHeight: 1,
                                                                        mb: 0.5,
                                                                    }}
                                                                >
                                                                    ${totalCost.toFixed(2)}
                                                                </Typography>
                                                                <Typography
                                                                    variant="caption"
                                                                    sx={{
                                                                        color: '#666',
                                                                        fontSize: '0.75rem',
                                                                    }}
                                                                >
                                                                    ${booking.total_price.toFixed(2)} per night
                                                                </Typography>
                                                            </Box>

                                                            <Box sx={{ mt: 2 }}>
                                                                <Typography
                                                                    variant="caption"
                                                                    sx={{
                                                                        color: '#999',
                                                                        fontSize: '0.7rem',
                                                                        display: 'block',
                                                                        mb: 0.5,
                                                                    }}
                                                                >
                                                                    Booking ID: {booking.id}
                                                                </Typography>
                                                                <Button
                                                                    endIcon={<ArrowForward />}
                                                                    fullWidth
                                                                    sx={{
                                                                        textTransform: 'none',
                                                                        fontWeight: 600,
                                                                        bgcolor: '#003580',
                                                                        color: 'white',
                                                                        py: 1,
                                                                        borderRadius: 1.5,
                                                                        '&:hover': {
                                                                            bgcolor: '#00244d',
                                                                        },
                                                                    }}
                                                                >
                                                                    View Details
                                                                </Button>
                                                            </Box>
                                                        </Box>
                                                    </Grid>
                                                </Grid>
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

