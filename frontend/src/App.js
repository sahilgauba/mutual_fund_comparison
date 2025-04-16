import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, CircularProgress } from '@mui/material';
import FundSelector from './components/FundSelector';
import IndexSelector from './components/IndexSelector';
import DateRangeSelector from './components/DateRangeSelector';
import PerformanceChart from './components/PerformanceChart';
import { fetchFundData, fetchIndexData, calculatePerformance, INDEX_SYMBOLS } from './utils/dataUtils';
import './App.css';

function App() {
  const [selectedFund, setSelectedFund] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState('NIFTY 50');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState(null);

  // Handle predefined range selection
  const handlePredefinedRangeClick = (start, end) => {
    setStartDate(start);
    setEndDate(end);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedFund || !selectedIndex || !startDate || !endDate) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch both fund and index data in parallel
        const [fundData, indexData] = await Promise.all([
          fetchFundData(selectedFund.schemeCode, startDate, endDate),
          fetchIndexData(INDEX_SYMBOLS[selectedIndex], startDate, endDate)
        ]);

        // Calculate performance
        const performance = calculatePerformance(fundData, indexData);

        // Prepare chart data
        setChartData({
          labels: performance.fundPerformance.map(item => item.date),
          datasets: [
            {
              label: selectedFund.schemeName,
              data: performance.fundPerformance.map(item => item.value),
              borderColor: 'rgb(75, 192, 192)',
              tension: 0.1
            },
            {
              label: selectedIndex,
              data: performance.indexPerformance.map(item => item.value),
              borderColor: 'rgb(255, 99, 132)',
              tension: 0.1
            }
          ]
        });
      } catch (err) {
        setError('Failed to fetch data. Please try again later.');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedFund, selectedIndex, startDate, endDate]);

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Mutual Fund Performance Analyzer
        </Typography>

        <Box sx={{ mb: 4 }}>
          <FundSelector
            selectedFund={selectedFund}
            onFundChange={setSelectedFund}
          />
        </Box>

        <Box sx={{ mb: 4 }}>
          <IndexSelector
            selectedIndex={selectedIndex}
            onIndexChange={setSelectedIndex}
            indices={Object.keys(INDEX_SYMBOLS)}
          />
        </Box>

        <Box sx={{ mb: 4 }}>
          <DateRangeSelector
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onPredefinedRangeClick={handlePredefinedRangeClick}
          />
        </Box>

        {error && (
          <Typography color="error" align="center" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" sx={{ my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          chartData && <PerformanceChart chartData={chartData} />
        )}
      </Box>
    </Container>
  );
}

export default App;
