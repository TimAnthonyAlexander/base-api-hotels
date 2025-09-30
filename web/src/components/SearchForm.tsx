import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Autocomplete,
  CircularProgress,
  InputAdornment,
  Paper,
} from '@mui/material';
import {
  LocationOn,
  CalendarToday,
  People,
} from '@mui/icons-material';
import { apiClient, type LocationOption } from '../lib/api';

interface SearchFormProps {
  onSubmit: (data: SearchFormData) => void;
  loading?: boolean;
  compact?: boolean;
  initialData?: Partial<SearchFormData>;
}

export interface SearchFormData {
  location_id: string;
  starts_on: string;
  ends_on: string;
  capacity: number;
}

const getTodayString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const getTomorrowString = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

export default function SearchForm({ onSubmit, loading = false, compact = false, initialData }: SearchFormProps) {
  const [formData, setFormData] = useState<SearchFormData>({
    location_id: initialData?.location_id || '',
    starts_on: initialData?.starts_on || getTodayString(),
    ends_on: initialData?.ends_on || getTomorrowString(),
    capacity: initialData?.capacity || 1,
  });
  const [selectedLocation, setSelectedLocation] = useState<LocationOption | null>(null);
  const [locationOptions, setLocationOptions] = useState<LocationOption[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationInputValue, setLocationInputValue] = useState('');

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Paper
      elevation={compact ? 0 : 4}
      sx={{
        p: compact ? 2 : 3,
        borderRadius: compact ? 2 : 3,
        border: compact ? '1px solid #e0e0e0' : 'none',
        background: 'white',
      }}
    >
      <form onSubmit={handleSubmit}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: compact ? 'repeat(5, 1fr)' : 'repeat(12, 1fr)',
            },
            gap: compact ? 1.5 : 2,
            alignItems: 'start',
          }}
        >
          <Box sx={{ gridColumn: { xs: 'span 1', sm: compact ? 'span 2' : 'span 5' } }}>
            <Autocomplete
              size={compact ? 'small' : 'medium'}
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
              noOptionsText="Start typing..."
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Location"
                  required
                  placeholder="City or location"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOn sx={{ color: '#003580', fontSize: compact ? 18 : 20 }} />
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
                      borderRadius: 1.5,
                      bgcolor: 'white',
                    },
                  }}
                />
              )}
            />
          </Box>

          <Box sx={{ gridColumn: { xs: 'span 1', sm: 'span 1' } }}>
            <TextField
              size={compact ? 'small' : 'medium'}
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
                    <CalendarToday sx={{ color: '#003580', fontSize: compact ? 16 : 18 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                  bgcolor: 'white',
                },
              }}
            />
          </Box>

          <Box sx={{ gridColumn: { xs: 'span 1', sm: 'span 1' } }}>
            <TextField
              size={compact ? 'small' : 'medium'}
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
                    <CalendarToday sx={{ color: '#003580', fontSize: compact ? 16 : 18 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                  bgcolor: 'white',
                },
              }}
            />
          </Box>

          <Box sx={{ gridColumn: { xs: 'span 1', sm: 'span 1' } }}>
            <TextField
              size={compact ? 'small' : 'medium'}
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
                    <People sx={{ color: '#003580', fontSize: compact ? 16 : 18 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                  bgcolor: 'white',
                },
              }}
            />
          </Box>

          <Box sx={{ gridColumn: { xs: 'span 1', sm: 'span 1' } }}>
            <Button
              type="submit"
              variant="contained"
              size={compact ? 'medium' : 'large'}
              disabled={loading}
              fullWidth
              sx={{
                height: compact ? '40px' : '56px',
                borderRadius: 1.5,
                textTransform: 'none',
                fontSize: compact ? '0.95rem' : '1rem',
                fontWeight: 600,
                bgcolor: '#003580',
                color: 'white',
                boxShadow: '0 2px 8px rgba(0, 53, 128, 0.25)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: '#00244d',
                  boxShadow: '0 4px 12px rgba(0, 53, 128, 0.35)',
                  transform: 'translateY(-1px)',
                },
                '&:disabled': {
                  bgcolor: '#ccc',
                },
              }}
            >
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </Box>
        </Box>
      </form>
    </Paper>
  );
}
