import requests
import pandas as pd
# from nsepy import get_history # No longer using nsepy
import yfinance as yf
from datetime import datetime, timedelta

# Placeholder for MF list - ideally fetched from MFAPI or a static source
# Fetching the full list from MFAPI on every request might be slow.
# Consider caching this or using a pre-compiled list.
# For now, let's use a small static list for development.
# You can find a more comprehensive list at https://www.amfiindia.com/spages/NAVAll.txt
ALL_FUNDS = [
    {
        "schemeCode": "119551",
        "schemeName": "Aditya Birla Sun Life Banking & PSU Debt Fund  - DIRECT - IDCW"
    },
    {
        "schemeCode": "119062",
        "schemeName": "HDFC Hybrid Equity Fund - Growth Option - Direct Plan"
    },
    {
        "schemeCode": "120503",
        "schemeName": "Axis ELSS Tax Saver Fund - Direct Plan - Growth Option"
    },
    {
        "schemeCode": "120586",
        "schemeName": "ICICI Prudential Bluechip Fund - Direct Plan - Growth"
    },
    {
        "schemeCode": "120584",
        "schemeName": "ICICI Prudential Dynamic Bond Fund - Direct Plan -  Daily Dividend"
    },
    {
        "schemeCode": "120594",
        "schemeName": "ICICI Prudential Technology Fund - Direct Plan -  Growth"
    },
    {
        "schemeCode": "146774",
        "schemeName": "HDFC FMP 1127D March 2019 (1) - Quarterly IDCW Option - Direct Plan"
    }
]

# Predefined indices compatible with yfinance
# Mapping Display Name to Yahoo Finance Ticker Symbol
INDICES = {
    "Nifty 50": "^NSEI",
    "Nifty Next 50": "^NSMIDCP",
    "Nifty Midcap 100": "NIFTY_MIDCAP_100.NS",
    "Nifty Bank": "^NSEBANK",
    "Nifty IT": "^CNXIT",
    # Add other indices as needed, finding the correct Yahoo Finance symbol
    # e.g., "Nifty Pharma": "^CNXPHARMA" might work, but needs verification.
}

MFAPI_URL = "https://api.mfapi.in/mf/{}"

def fetch_fund_data(scheme_code, start_date, end_date):
    """Fetches mutual fund NAV data from MFAPI."""
    try:
        response = requests.get(MFAPI_URL.format(scheme_code))
        response.raise_for_status() # Raise an exception for bad status codes
        data = response.json()["data"]

        if not data:
            # Return None instead of empty DataFrame if no data found by API
            print(f"No data returned from MFAPI for {scheme_code}")
            return None

        df = pd.DataFrame(data)
        df['date'] = pd.to_datetime(df['date'], format='%d-%m-%Y')
        df['nav'] = pd.to_numeric(df['nav'])
        df = df.set_index('date')
        df = df.sort_index()

        # Filter by date range
        df = df[(df.index >= start_date) & (df.index <= end_date)]

        if df.empty:
             # Return None if filtering results in empty dataframe
            print(f"No data found for {scheme_code} within the specified date range.")
            return None

        return df[['nav']]

    except requests.exceptions.RequestException as e:
        print(f"Error fetching fund data for {scheme_code}: {e}")
        # Return the exception object
        return e
    except Exception as e:
        print(f"Error processing fund data for {scheme_code}: {e}")
        # Return the exception object
        return e

def fetch_index_data(index_symbol, start_date, end_date):
    """Fetches index data using yfinance."""
    try:
        # yfinance end date is exclusive, so add one day to include the end_date
        end_date_yf = end_date + timedelta(days=1)

        # Format dates for yfinance (YYYY-MM-DD string is fine)
        start_str = start_date.strftime('%Y-%m-%d')
        end_str = end_date_yf.strftime('%Y-%m-%d')

        print(f"Calling yf.download(ticker='{index_symbol}', start='{start_str}', end='{end_str}')")
        data = yf.download(index_symbol, start=start_str, end=end_str)
        print(f"yfinance returned DataFrame with {len(data)} rows for {index_symbol}")

        if data.empty:
            print(f"yfinance returned empty DataFrame for {index_symbol}")
            return None

        # Ensure we are selecting the 'Close' column correctly
        if 'Close' not in data.columns:
            print(f"Error: 'Close' column not found in yfinance data for {index_symbol}. Columns: {data.columns}")
            # Return an error or None, as we can't proceed
            return ValueError(f"'Close' column missing in yfinance data for {index_symbol}") 
        
        # Select the 'Close' column Series
        close_series = data['Close']
        
        # Convert Series to DataFrame, naming the column 'price' EXPLICITLY
        df = pd.DataFrame(close_series)
        df.columns = ['price'] # Directly assign the column name
        
        # Ensure index is timezone-naive
        if df.index.tz is not None:
            df.index = df.index.tz_localize(None)
            
        return df

    except Exception as e:
        print(f"Error fetching index data for {index_symbol} using yfinance: {e}")
        return e

def calculate_performance(fund_df, index_df):
    """Normalizes and aligns fund and index data, returning both normalized and actual values."""
    # Check if inputs are valid DataFrames before proceeding
    if not isinstance(fund_df, pd.DataFrame) or fund_df.empty:
        print("Invalid or empty fund data received for calculation.")
        return pd.DataFrame()
    if not isinstance(index_df, pd.DataFrame) or index_df.empty:
        print("Invalid or empty index data received for calculation.")
        return pd.DataFrame()

    # Ensure both indices are timezone-naive before merging
    if fund_df.index.tz is not None:
        fund_df = fund_df.copy()
        fund_df.index = fund_df.index.tz_localize(None)
    if index_df.index.tz is not None:
        index_df = index_df.copy()
        index_df.index = index_df.index.tz_localize(None)

    # Merge the dataframes
    combined_df = pd.merge(fund_df, index_df, left_index=True, right_index=True, how='inner')

    if combined_df.empty:
        print("No overlapping dates found between fund and index data.")
        return pd.DataFrame()

    # Store actual values
    actual_values = combined_df.copy()
    actual_values.rename(columns={'nav': 'fund_actual_values', 'price': 'index_actual_values'}, inplace=True)

    # Calculate min/max for each series with margin
    def calculate_range_with_margin(series):
        min_val = series.min()
        max_val = series.max()
        range_val = max_val - min_val
        margin = range_val * 0.05  # 5% margin
        return min_val - margin, max_val + margin

    fund_min, fund_max = calculate_range_with_margin(actual_values['fund_actual_values'])
    index_min, index_max = calculate_range_with_margin(actual_values['index_actual_values'])

    # Calculate normalized values
    try:
        first_row = combined_df.iloc[0]
        if (first_row == 0).any():
            print("Warning: First row contains zero, cannot normalize properly.")
            normalized_df = combined_df.copy()
        else:
            normalized_df = combined_df / first_row * 100
    except IndexError:
        print("Error: combined_df seems empty after checks, cannot access iloc[0].")
        return pd.DataFrame()

    # Rename columns for normalized values
    normalized_df.rename(columns={'nav': 'fund_performance', 'price': 'index_performance'}, inplace=True)

    # Combine normalized and actual values
    result_df = pd.DataFrame({
        'fund_performance': normalized_df['fund_performance'],
        'index_performance': normalized_df['index_performance'],
        'fund_actual_values': actual_values['fund_actual_values'],
        'index_actual_values': actual_values['index_actual_values'],
        'fund_min': fund_min,
        'fund_max': fund_max,
        'index_min': index_min,
        'index_max': index_max
    })

    # Format date index to string for JSON serialization
    result_df.index = result_df.index.strftime('%Y-%m-%d')

    return result_df 