import React from 'react';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { INDEX_SYMBOLS } from '../utils/dataUtils';

const IndexSelector = ({ selectedIndex, onIndexChange }) => {
  return (
    <FormControl fullWidth>
      <InputLabel id="index-select-label">Select Index</InputLabel>
      <Select
        labelId="index-select-label"
        id="index-select"
        value={selectedIndex}
        label="Select Index"
        onChange={(e) => onIndexChange(e.target.value)}
      >
        {Object.keys(INDEX_SYMBOLS).map((index) => (
          <MenuItem key={index} value={index}>
            {index}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default IndexSelector; 