import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Autocomplete, TextField, CircularProgress, Box } from '@mui/material';
import debounce from 'lodash/debounce';

const API_URL = '/api'; // Your Flask backend URL

const FundSelector = ({ selectedFund, onFundChange }) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  // const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState(null);

  // Debounced search function
  const debouncedSearch = useMemo(
    () =>
      debounce(async (searchQuery) => {
        if (!searchQuery) {
          setOptions([]);
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);

        try {
          const response = await axios.get(`${API_URL}/funds/search`, {
            params: { q: searchQuery }
          });
          setOptions(response.data || []);
        } catch (err) {
          console.error("Error searching funds:", err);
          setError('Failed to search funds');
          setOptions([]);
        } finally {
          setLoading(false);
        }
      }, 300), // 300ms delay
    []
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  return (
    <Autocomplete
      id="fund-selector"
      sx={{
        width: { xs: '100%', sm: 450 }, // Responsive width
        mb: 2,
        '& .MuiOutlinedInput-root': { // Add slight elevation/shadow
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        }
      }}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      isOptionEqualToValue={(option, value) => option.schemeCode === value.schemeCode}
      getOptionLabel={(option) => option.schemeName || ''}
      options={options}
      loading={loading}
      value={selectedFund}
      onChange={(event, newValue) => {
        onFundChange(newValue);
      }}
      onInputChange={(event, newInputValue) => {
        // setInputValue(newInputValue);
        debouncedSearch(newInputValue);
      }}
      filterOptions={(x) => x} // Disable built-in filtering as we're using server-side search
      renderInput={(params) => (
        <TextField
          {...params}
          label="Search Mutual Fund"
          placeholder="Start typing fund name or scheme code..."
          error={!!error}
          helperText={error || "Type at least 3 characters to search"}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <React.Fragment>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </React.Fragment>
            ),
          }}
        />
      )}
      renderOption={(props, option) => (
        <Box component="li" {...props} key={option.schemeCode}>
          {option.schemeName}
        </Box>
      )}
    />
  );
};

export default FundSelector; 