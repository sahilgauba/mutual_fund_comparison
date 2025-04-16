import axios from 'axios';

// Constants
const MFAPI_BASE_URL = 'https://api.mfapi.in/mf/';
const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';
const YAHOO_FINANCE_BASE_URL = 'https://query2.finance.yahoo.com/v6/finance/quote';

// Fetch mutual fund data directly from MFAPI
export const fetchFundData = async (schemeCode, startDate, endDate) => {
  try {
    console.log('Fetching fund data:', { schemeCode, startDate, endDate });
    const response = await axios.get(`${MFAPI_BASE_URL}${schemeCode}`);
    
    // Log the raw response
    console.log('Raw MFAPI response:', response);

    if (!response.data) {
      console.error('No data in response');
      throw new Error('No data received from MFAPI');
    }

    // Log the data structure
    console.log('MFAPI data structure:', {
      hasData: !!response.data.data,
      dataLength: response.data.data?.length,
      firstItem: response.data.data?.[0],
      meta: response.data.meta
    });

    if (!response.data.data || !Array.isArray(response.data.data)) {
      console.error('Invalid data structure:', response.data);
      throw new Error('Invalid data structure from MFAPI');
    }

    // Filter data based on date range
    const filteredData = response.data.data.filter(item => {
      const date = new Date(item.date);
      return date >= startDate && date <= endDate;
    });

    console.log('Filtered data:', {
      originalLength: response.data.data.length,
      filteredLength: filteredData.length,
      startDate,
      endDate,
      firstFilteredItem: filteredData[0],
      lastFilteredItem: filteredData[filteredData.length - 1]
    });

    if (filteredData.length === 0) {
      throw new Error('No data available for the selected date range');
    }

    // Transform data into required format
    const transformedData = filteredData.map(item => ({
      date: new Date(item.date),
      nav: parseFloat(item.nav)
    })).sort((a, b) => a.date - b.date);

    console.log('Transformed data:', {
      length: transformedData.length,
      firstItem: transformedData[0],
      lastItem: transformedData[transformedData.length - 1]
    });

    return transformedData;
  } catch (error) {
    console.error('Error in fetchFundData:', {
      error,
      message: error.message,
      response: error.response,
      schemeCode,
      startDate,
      endDate
    });
    throw error;
  }
};

// Fetch index data from Yahoo Finance
export const fetchIndexData = async (symbol, startDate, endDate) => {
  try {
    console.log('Fetching index data:', { symbol, startDate, endDate });
    
    const response = await axios.get(YAHOO_FINANCE_BASE_URL, {
      params: {
        symbols: symbol,
        range: '1d',
        interval: '1d',
        indicators: 'quote',
        includeTimestamps: true
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Origin': null,
        'Sec-Fetch-Site': 'cross-site',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Dest': 'empty',
        'Referer': 'https://finance.yahoo.com/',
      }
    });

    console.log('Yahoo Finance response:', response);

    if (!response.data?.quoteResponse?.result?.[0]) {
      console.error('Invalid Yahoo Finance response:', response);
      throw new Error('Invalid response from Yahoo Finance');
    }

    const quote = response.data.quoteResponse.result[0];
    
    // Since we're getting current data, we'll need to fetch historical data differently
    const historicalResponse = await axios.get(`https://query2.finance.yahoo.com/v8/finance/chart/${symbol}`, {
      params: {
        period1: Math.floor(startDate.getTime() / 1000),
        period2: Math.floor(endDate.getTime() / 1000),
        interval: '1d',
        events: 'history',
        includeAdjustedClose: true
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Origin': null,
        'Sec-Fetch-Site': 'cross-site',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Dest': 'empty',
        'Referer': 'https://finance.yahoo.com/',
      }
    });

    if (!historicalResponse.data?.chart?.result?.[0]) {
      throw new Error('No historical data available');
    }

    const result = historicalResponse.data.chart.result[0];
    const { timestamp, indicators } = result;
    const quotes = indicators.quote[0];

    if (!timestamp || !quotes || !quotes.close) {
      throw new Error('Missing data in Yahoo Finance response');
    }

    // Transform data into required format
    const data = timestamp.map((time, index) => ({
      date: new Date(time * 1000),
      close: quotes.close[index]
    })).filter(item => item.close !== null)
      .sort((a, b) => a.date - b.date);

    if (data.length === 0) {
      throw new Error('No data available for the selected date range');
    }

    console.log('Index data fetched successfully:', { dataPoints: data.length });
    return data;
  } catch (error) {
    console.error('Error fetching index data:', {
      error: error.message,
      response: error.response?.data,
      symbol,
      startDate,
      endDate
    });
    throw new Error(`Failed to fetch index data: ${error.message}`);
  }
};

// Calculate normalized performance
export const calculatePerformance = (fundData, indexData) => {
  try {
    if (!fundData?.length || !indexData?.length) {
      console.error('Missing data for performance calculation:', { 
        fundDataLength: fundData?.length, 
        indexDataLength: indexData?.length 
      });
      throw new Error('Insufficient data for performance calculation');
    }

    // Find common date range
    const startDate = new Date(Math.max(
      fundData[0].date.getTime(),
      indexData[0].date.getTime()
    ));
    const endDate = new Date(Math.min(
      fundData[fundData.length - 1].date.getTime(),
      indexData[indexData.length - 1].date.getTime()
    ));

    // Filter data within common date range
    const filteredFundData = fundData.filter(
      item => item.date >= startDate && item.date <= endDate
    );
    const filteredIndexData = indexData.filter(
      item => item.date >= startDate && item.date <= endDate
    );

    if (filteredFundData.length === 0 || filteredIndexData.length === 0) {
      console.error('No overlapping data found between fund and index');
      throw new Error('No overlapping data found between fund and index');
    }

    // Normalize values (set first value as 100)
    const initialFundValue = filteredFundData[0].nav;
    const initialIndexValue = filteredIndexData[0].close;

    const fundPerformance = filteredFundData.map(item => ({
      date: item.date,
      value: (item.nav / initialFundValue) * 100
    }));

    const indexPerformance = filteredIndexData.map(item => ({
      date: item.date,
      value: (item.close / initialIndexValue) * 100
    }));

    console.log('Performance calculation successful:', {
      dataPoints: fundPerformance.length,
      startDate,
      endDate
    });

    return { fundPerformance, indexPerformance };
  } catch (error) {
    console.error('Error calculating performance:', error);
    throw error;
  }
};

// Index symbol mapping
export const INDEX_SYMBOLS = {
  'NIFTY 50': '^NSEI',
  'NIFTY NEXT 50': 'NIFTYNEXT50.NS',
  'NIFTY MIDCAP 100': 'NIFMDCP100.NS',
  'NIFTY BANK': '^NSEBANK',
  'NIFTY IT': 'NIFTYIT.NS'
}; 