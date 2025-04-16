import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Select, MenuItem, FormControl, InputLabel, CircularProgress, FormHelperText } from '@mui/material';

const API_URL = 'http://127.0.0.1:5001/api'; // Your Flask backend URL

const IndexSelector = ({ selectedIndex, onIndexChange }) => {
  const [indices, setIndices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    axios.get(`${API_URL}/indices`)
      .then(response => {
        // The API returns a list of index names (strings)
        setIndices(response.data || []);
      })
      .catch(err => {
        console.error("Error fetching indices:", err);
        setError('Failed to load indices');
        setIndices([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []); // Fetch only once on component mount

  return (
    <FormControl sx={{ width: 300, mb: 2 }} error={!!error}> {/* Added margin bottom */}
      <InputLabel id="index-selector-label">Select Index</InputLabel>
      <Select
        labelId="index-selector-label"
        id="index-selector"
        value={selectedIndex} // Controlled component
        label="Select Index"
        onChange={(event) => {
          onIndexChange(event.target.value); // Pass the selected index name (string) back up
        }}
        disabled={loading}
        renderValue={(selected) => {
          if (loading) return <em>Loading...</em>;
          if (!selected) return "";  // Return empty string when nothing is selected
          return selected;  // Just return the selected value
        }}
      >
        {/* Optional: Add a default/placeholder item */} 
         {/* <MenuItem value="" disabled><em>Select Index</em></MenuItem>  */} 

        {loading ? (
          <MenuItem value="" disabled sx={{ justifyContent: 'center' }}>
            <CircularProgress size={20} />
          </MenuItem>
        ) : !indices.length && !error ? (
          <MenuItem value="" disabled><em>No indices available</em></MenuItem>
        ) : (
          indices.map((indexName) => (
            <MenuItem key={indexName} value={indexName}>
              {indexName}
            </MenuItem>
          ))
        )}
      </Select>
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  );
};

export default IndexSelector; 