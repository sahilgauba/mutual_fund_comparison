import React, { useState } from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { Box, Button, Stack } from '@mui/material';
import { subMonths, subYears } from 'date-fns';
import dayjs from 'dayjs';

const DateRangeSelector = ({ startDate, endDate, onStartDateChange, onEndDateChange, onPredefinedRangeClick }) => {
  const [selectedRange, setSelectedRange] = useState(null);

  const setRange = (months) => {
    const end = new Date();
    const start = subMonths(end, months);
    setSelectedRange(`${months}M`);
    onPredefinedRangeClick(start, end);
  };

  const setYearRange = (years) => {
    const end = new Date();
    const start = subYears(end, years);
    setSelectedRange(`${years}Y`);
    onPredefinedRangeClick(start, end);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <DatePicker
            label="Start Date"
            value={startDate ? dayjs(startDate) : null}
            onChange={(newValue) => {
              setSelectedRange(null);
              onStartDateChange(newValue ? newValue.toDate() : null);
            }}
            maxDate={dayjs(endDate || new Date())}
          />
          <DatePicker
            label="End Date"
            value={endDate ? dayjs(endDate) : null}
            onChange={(newValue) => {
              setSelectedRange(null);
              onEndDateChange(newValue ? newValue.toDate() : null);
            }}
            minDate={dayjs(startDate)}
            maxDate={dayjs()}
          />
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center">
          <Button
            size="small"
            variant={selectedRange === '1M' ? 'contained' : 'outlined'}
            onClick={() => setRange(1)}
          >
            1M
          </Button>
          <Button
            size="small"
            variant={selectedRange === '3M' ? 'contained' : 'outlined'}
            onClick={() => setRange(3)}
          >
            3M
          </Button>
          <Button
            size="small"
            variant={selectedRange === '6M' ? 'contained' : 'outlined'}
            onClick={() => setRange(6)}
          >
            6M
          </Button>
          <Button
            size="small"
            variant={selectedRange === '1Y' ? 'contained' : 'outlined'}
            onClick={() => setYearRange(1)}
          >
            1Y
          </Button>
          <Button
            size="small"
            variant={selectedRange === '3Y' ? 'contained' : 'outlined'}
            onClick={() => setYearRange(3)}
          >
            3Y
          </Button>
          <Button
            size="small"
            variant={selectedRange === '5Y' ? 'contained' : 'outlined'}
            onClick={() => setYearRange(5)}
          >
            5Y
          </Button>
          <Button
            size="small"
            variant={selectedRange === '10Y' ? 'contained' : 'outlined'}
            onClick={() => setYearRange(10)}
          >
            10Y
          </Button>
        </Stack>
      </Box>
    </LocalizationProvider>
  );
};

export default DateRangeSelector; 