import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Container, CssBaseline, Box, CircularProgress, Alert, Typography, Grid, Button, Stack } from '@mui/material';
import { format } from 'date-fns';
import { subYears } from 'date-fns'; // Import subYears

// Import Components
import Header from './components/Header';
import FundSelector from './components/FundSelector';
import IndexSelector from './components/IndexSelector';
import DateRangeSelector from './components/DateRangeSelector';
import PerformanceChart from './components/PerformanceChart';

const API_URL = 'http://127.0.0.1:5001/api'; // Your Flask backend URL

function App() {
  // State Variables
  const [selectedFund, setSelectedFund] = useState(null); // Stores {schemeCode, schemeName}
  const [selectedIndex, setSelectedIndex] = useState(''); // Stores index name (string)
  const [startDate, setStartDate] = useState(subYears(new Date(), 1)); // Default start date (1 year ago)
  const [endDate, setEndDate] = useState(new Date()); // Default end date (today)
  const [chartData, setChartData] = useState(null); // Stores data for the chart
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Format date to YYYY-MM-DD for API
  const formatDate = (date) => format(date, 'yyyy-MM-dd');

  // Callback for fetching comparison data
  const fetchComparisonData = useCallback(async () => {
    // Basic validation
    if (!selectedFund || !selectedIndex || !startDate || !endDate) {
      setError('Please select a fund, an index, and a valid date range.');
      setChartData(null); // Clear previous chart data if any
      return;
    }
    if (startDate >= endDate) {
        setError('Start date must be before end date.');
        setChartData(null);
        return;
    }

    setLoading(true);
    setError(null);
    setChartData(null); // Clear previous chart while loading

    try {
      const params = {
        scheme_code: selectedFund.schemeCode,
        index_name: selectedIndex,
        start_date: formatDate(startDate),
        end_date: formatDate(endDate),
      };
      console.log("Fetching comparison with params:", params);
      const response = await axios.get(`${API_URL}/compare`, { params });
      console.log("API Response:", response.data);
      if(response.data && response.data.labels) {
          setChartData({
            ...response.data,
            fund_name: selectedFund.schemeName
          });
      } else if (response.data && response.data.error) {
          setError(response.data.error);
      } else {
          setError('Received unexpected data format from server.');
      }
    } catch (err) {
      console.error("Error fetching comparison data:", err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to fetch comparison data';
      setError(errorMsg);
      setChartData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedFund, selectedIndex, startDate, endDate]); // Dependencies for the callback

  // Handler for predefined date range clicks
  const handlePredefinedRange = (start, end) => {
    setStartDate(start);
    setEndDate(end);
    // Optionally trigger fetchComparisonData here if desired
    // fetchComparisonData();
  };

  // Reset function
  const handleReset = () => {
      setSelectedFund(null);
      setSelectedIndex('');
      setStartDate(subYears(new Date(), 1));
      setEndDate(new Date());
      setChartData(null);
      setError(null);
      setLoading(false);
  };

  return (
    <React.Fragment>
      <CssBaseline /> { /* Material UI Baseline */}
      <Header />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}> {/* Main content container */}
        <Typography variant="h5" gutterBottom>
            Performance Comparison
        </Typography>

        {/* Input Controls Section */}
        <Grid container spacing={3} sx={{ mb: 3 }} alignItems="flex-start"> {/* Use Grid for layout */}
          <Grid item xs={12} md={4}> {/* Fund Selector */}
            <FundSelector
              selectedFund={selectedFund}
              onFundChange={setSelectedFund}
            />
          </Grid>
          <Grid item xs={12} md={4}> {/* Index Selector */}
            <IndexSelector
              selectedIndex={selectedIndex}
              onIndexChange={setSelectedIndex}
            />
          </Grid>
          <Grid item xs={12} md={4}> {/* Date Range Selector - Takes more space potentially */}
            <DateRangeSelector
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              onPredefinedRangeClick={handlePredefinedRange}
            />
          </Grid>
        </Grid>

        {/* Action Buttons */}
        <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 3 }}>
            <Button
                variant="contained"
                color="primary"
                onClick={fetchComparisonData}
                disabled={loading || !selectedFund || !selectedIndex || !startDate || !endDate}
            >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Compare'}
            </Button>
             <Button variant="outlined" onClick={handleReset} disabled={loading}>
                Reset
            </Button>
        </Stack>

        {/* Display Area: Error Alert or Chart */}
        <Box sx={{ minHeight: '450px' }}> {/* Container for chart/loading/error */}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {loading && !error && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Loading chart data...</Typography>
            </Box>
          )}

          {!loading && (
            <PerformanceChart chartData={chartData} />
          )}
        </Box>

        {/* Footer Section (Optional) */}
        <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid #eee', textAlign: 'center' }}>
          <Typography variant="caption" color="textSecondary">
            Data Sources: MF NAVs from MFAPI.in, Index data via NSEpy. For illustrative purposes only.
          </Typography>
        </Box>

      </Container>
    </React.Fragment>
  );
}

export default App;
