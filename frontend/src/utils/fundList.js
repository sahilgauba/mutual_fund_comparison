import axios from 'axios';

const MFAPI_SEARCH_URL = 'https://api.mfapi.in/mf/search';

export const searchFunds = async (query) => {
  try {
    const response = await axios.get(`${MFAPI_SEARCH_URL}/${encodeURIComponent(query)}`);
    if (!response.data) {
      throw new Error('Invalid response from MFAPI search');
    }
    return response.data.map(fund => ({
      schemeCode: fund.schemeCode,
      schemeName: fund.schemeName
    }));
  } catch (error) {
    console.error('Error searching funds:', error);
    throw error;
  }
};

// Common mutual funds for quick access
export const POPULAR_FUNDS = [
  {
    schemeCode: "119598",
    schemeName: "Mirae Asset Large Cap Fund - Regular Plan - Growth"
  },
  {
    schemeCode: "120505",
    schemeName: "Axis Bluechip Fund - Regular Plan - Growth"
  },
  {
    schemeCode: "120716",
    schemeName: "HDFC Index Fund-NIFTY 50 Plan"
  },
  {
    schemeCode: "121133",
    schemeName: "Nippon India Index Fund - Nifty Plan"
  },
  {
    schemeCode: "120503",
    schemeName: "Axis Midcap Fund - Regular Plan - Growth"
  }
]; 