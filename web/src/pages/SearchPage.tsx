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
} from '@mui/material';
import { apiClient } from '../lib/api';

export default function SearchPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    location_id: '',
    starts_on: '',
    ends_on: '',
    capacity: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
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

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={24}
          sx={{
            p: { xs: 3, sm: 5 },
            borderRadius: 4,
            backdropFilter: 'blur(10px)',
            background: 'rgba(255, 255, 255, 0.95)',
          }}
        >
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 300,
              letterSpacing: '-0.02em',
              color: '#1a1a1a',
              mb: 1,
            }}
          >
            Find Hotels
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: '#666',
              mb: 4,
              fontWeight: 300,
            }}
          >
            Search for the perfect place to stay
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                label="Location ID"
                value={formData.location_id}
                onChange={(e) =>
                  setFormData({ ...formData, location_id: e.target.value })
                }
                required
                fullWidth
                placeholder="019997c1-c45f-720f-9514-69c575d26535"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />

              <TextField
                label="Check-in Date"
                type="date"
                value={formData.starts_on}
                onChange={(e) =>
                  setFormData({ ...formData, starts_on: e.target.value })
                }
                required
                fullWidth
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />

              <TextField
                label="Check-out Date"
                type="date"
                value={formData.ends_on}
                onChange={(e) =>
                  setFormData({ ...formData, ends_on: e.target.value })
                }
                required
                fullWidth
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />

              <TextField
                label="Number of Guests"
                type="number"
                value={formData.capacity}
                onChange={(e) =>
                  setFormData({ ...formData, capacity: parseInt(e.target.value) })
                }
                required
                fullWidth
                inputProps={{ min: 1, max: 12 }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  fontWeight: 500,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8a 100%)',
                    boxShadow: '0 6px 25px rgba(102, 126, 234, 0.5)',
                  },
                }}
              >
                {loading ? 'Searching...' : 'Search Hotels'}
              </Button>
            </Box>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}
