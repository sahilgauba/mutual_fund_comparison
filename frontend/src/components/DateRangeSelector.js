import React, { useState, useEffect } from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { Box, Button, Stack, TextField } from '@mui/material';
import { subMonths, subYears, format, differenceInMonths, differenceInYears } from 'date-fns'; // Using date-fns for calculations
import dayjs from 'dayjs'; // Using dayjs for MUI compatibility

const DateRangeSelector = ({ startDate, endDate, onStartDateChange, onEndDateChange, onPredefinedRangeClick }) => {
  const [selectedRange, setSelectedRange] = useState(null);

  // Update selected range when dates change
  useEffect(() => {
    if (startDate && endDate) {
      const months = differenceInMonths(endDate, startDate);
      const years = differenceInYears(endDate, startDate);
      
      if (months === 1) setSelectedRange('1M');
      else if (months === 3) setSelectedRange('3M');
      else if (months === 6) setSelectedRange('6M');
      else if (years === 1) setSelectedRange('1Y');
      else if (years === 3) setSelectedRange('3Y');
      else if (years === 5) setSelectedRange('5Y');
      else setSelectedRange(null);
    }
  }, [startDate, endDate]);

  // Helper to set both dates for predefined ranges
  const setRange = (months, rangeKey) => {
    const end = new Date();
    const start = subMonths(end, months);
    setSelectedRange(rangeKey);
    onPredefinedRangeClick(start, end);
  };

  const setYearRange = (years, rangeKey) => {
    const end = new Date();
    const start = subYears(end, years);
    setSelectedRange(rangeKey);
    onPredefinedRangeClick(start, end);
  };

  // MAX range needs special handling - maybe default to 5 years or fetch actual min date?
  // For now, let's default to 5 years for MAX.
  const setMaxRange = () => {
    const end = new Date();
    const start = subYears(end, 5); // Default MAX to 5 years
    setSelectedRange('MAX');
    onPredefinedRangeClick(start, end);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <DatePicker
            label="Start Date"
            value={startDate ? dayjs(startDate) : null}
            onChange={(newValue) => {
              setSelectedRange(null);
              onStartDateChange(newValue ? newValue.toDate() : null);
            }}
            renderInput={(params) => <TextField {...params} helperText={params?.inputProps?.placeholder} sx={{ minWidth: '180px' }}/>}
            maxDate={dayjs(endDate).subtract(1, 'day')}
          />
          <DatePicker
            label="End Date"
            value={endDate ? dayjs(endDate) : null}
            onChange={(newValue) => {
              setSelectedRange(null);
              onEndDateChange(newValue ? newValue.toDate() : null);
            }}
            renderInput={(params) => <TextField {...params} helperText={params?.inputProps?.placeholder} sx={{ minWidth: '180px' }}/>}
            minDate={startDate ? dayjs(startDate).add(1, 'day') : undefined}
            maxDate={dayjs()}
          />
        </Stack>
        <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center">
          <Button 
            size="small" 
            variant={selectedRange === '1M' ? 'contained' : 'outlined'} 
            onClick={() => setRange(1, '1M')}
          >
            1M
          </Button>
          <Button 
            size="small" 
            variant={selectedRange === '3M' ? 'contained' : 'outlined'} 
            onClick={() => setRange(3, '3M')}
          >
            3M
          </Button>
          <Button 
            size="small" 
            variant={selectedRange === '6M' ? 'contained' : 'outlined'} 
            onClick={() => setRange(6, '6M')}
          >
            6M
          </Button>
          <Button 
            size="small" 
            variant={selectedRange === '1Y' ? 'contained' : 'outlined'} 
            onClick={() => setYearRange(1, '1Y')}
          >
            1Y
          </Button>
          <Button 
            size="small" 
            variant={selectedRange === '3Y' ? 'contained' : 'outlined'} 
            onClick={() => setYearRange(3, '3Y')}
          >
            3Y
          </Button>
          <Button 
            size="small" 
            variant={selectedRange === '5Y' ? 'contained' : 'outlined'} 
            onClick={() => setYearRange(5, '5Y')}
          >
            5Y
          </Button>
          <Button 
            size="small" 
            variant={selectedRange === '10Y' ? 'contained' : 'outlined'} 
            onClick={() => setYearRange(10, '10Y')}
          >
            10Y
          </Button>
        </Stack>
      </Box>
    </LocalizationProvider>
  );
};

export default DateRangeSelector; 