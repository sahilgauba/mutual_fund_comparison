import React, { useState } from 'react';
import { Autocomplete, TextField, Box, CircularProgress } from '@mui/material';
import { searchFunds, POPULAR_FUNDS } from '../utils/fundList';

const FundSelector = ({ selectedFund, onFundChange }) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState(POPULAR_FUNDS);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // Debounce search
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  };

  // Handle search
  const handleSearch = async (query) => {
    if (!query || query.length < 3) {
      setOptions(POPULAR_FUNDS);
      return;
    }

    setLoading(true);
    try {
      const results = await searchFunds(query);
      setOptions(results);
    } catch (error) {
      console.error('Error searching funds:', error);
      setOptions(POPULAR_FUNDS);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  const debouncedSearch = React.useCallback(
    debounce(handleSearch, 300),
    []
  );

  return (
    <Autocomplete
      id="fund-selector"
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      value={selectedFund}
      onChange={(event, newValue) => {
        onFundChange(newValue);
      }}
      inputValue={inputValue}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue);
        debouncedSearch(newInputValue);
      }}
      options={options}
      getOptionLabel={(option) => option.schemeName || ''}
      isOptionEqualToValue={(option, value) => option.schemeCode === value.schemeCode}
      loading={loading}
      filterOptions={(x) => x}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Select Mutual Fund"
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