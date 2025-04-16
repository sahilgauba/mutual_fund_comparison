from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import pandas as pd
import requests
import yfinance as yf
import os

# Import utility functions and lists
from utils import fetch_fund_data, fetch_index_data, calculate_performance, ALL_FUNDS, INDICES

app = Flask(__name__)

# Configure CORS based on environment
if os.environ.get('FLASK_ENV') == 'production':
    # In production, only allow requests from your frontend domain
    CORS(app, resources={r"/api/*": {
        "origins": [
            "http://localhost:3000",  # For local testing
            "https://your-frontend-domain.com"  # Replace with your actual frontend domain
        ],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }})
else:
    # In development, allow all origins
    CORS(app, resources={r"/api/*": {"origins": "*"}})

@app.route('/api/funds', methods=['GET'])
def get_funds():
    """Endpoint to get the list of available mutual funds."""
    # In a real application, you might fetch this dynamically or from a database
    # For now, using the static list from utils
    return jsonify(ALL_FUNDS)

@app.route('/api/indices', methods=['GET'])
def get_indices():
    """Endpoint to get the list of available indices."""
    # Return the predefined list of indices {Display Name: Symbol}
    return jsonify(list(INDICES.keys())) # Return only the display names for the dropdown

@app.route('/api/compare', methods=['GET'])
def compare_performance():
    """Endpoint to compare fund and index performance."""
    scheme_code = request.args.get('scheme_code')
    index_name = request.args.get('index_name') # Get the display name from frontend
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')

    # --- Input Validation --- 
    if not all([scheme_code, index_name, start_date_str, end_date_str]):
        return jsonify({"error": "Missing required parameters"}), 400

    try:
        # Convert dates
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    if start_date >= end_date:
        return jsonify({"error": "Start date must be before end date"}), 400

    # Get the correct index symbol from the display name
    index_symbol = INDICES.get(index_name)
    if not index_symbol:
        return jsonify({"error": f"Invalid index name: {index_name}"}), 400

    # Check if the scheme code is valid (basic check against our list)
    if not any(fund['schemeCode'] == scheme_code for fund in ALL_FUNDS):
         # In a real app, you might skip this if fetching funds dynamically
         pass # Allow codes not in the static list for now
         # return jsonify({"error": f"Invalid scheme code: {scheme_code}"}), 400

    # --- Data Fetching and Processing --- 
    try:
        print(f"Fetching data for Fund: {scheme_code}, Index: {index_symbol} ({index_name}) from {start_date_str} to {end_date_str}")
        
        fund_result = fetch_fund_data(scheme_code, start_date, end_date)
        index_result = fetch_index_data(index_symbol, start_date, end_date)

        # Check for errors or None returned from fetch functions
        if isinstance(fund_result, Exception):
             return jsonify({"error": f"Error fetching fund data for {scheme_code}: {str(fund_result)}"}), 500
        if fund_result is None:
             return jsonify({"error": f"No data found for fund {scheme_code} in the selected date range."}), 404

        if isinstance(index_result, Exception):
            # Special check for nsepy connection errors if possible (example)
            if "Connection refused" in str(index_result) or "Network is unreachable" in str(index_result):
                 error_detail = "Could not connect to NSE servers. Check network or firewall."
            else:
                 error_detail = str(index_result) # Return the specific exception message
            return jsonify({"error": f"Error fetching index data for {index_symbol}: {error_detail}"}), 500
        if index_result is None:
            return jsonify({"error": f"No data found for index {index_symbol} in the selected date range."}), 404

        # At this point, fund_result and index_result are DataFrames
        fund_df = fund_result
        index_df = index_result

        performance_data = calculate_performance(fund_df, index_df)

        if performance_data.empty:
            return jsonify({"error": "Could not calculate performance. Check data availability for the selected period."}), 500

        # Convert DataFrame to JSON format suitable for charting libraries
        result = {
            'labels': performance_data.index.tolist(), # Dates
            'fund_performance': performance_data['fund_performance'].round(2).tolist(),
            'index_performance': performance_data['index_performance'].round(2).tolist(),
            'fund_actual_values': performance_data['fund_actual_values'].round(2).tolist(),
            'index_actual_values': performance_data['index_actual_values'].round(2).tolist(),
            'fund_min': float(performance_data['fund_min'].iloc[0]),
            'fund_max': float(performance_data['fund_max'].iloc[0]),
            'index_min': float(performance_data['index_min'].iloc[0]),
            'index_max': float(performance_data['index_max'].iloc[0]),
            'fund_name': next((f['schemeName'] for f in ALL_FUNDS if f['schemeCode'] == scheme_code), scheme_code),
            'index_name': index_name
        }

        return jsonify(result)

    except Exception as e:
        print(f"An error occurred: {e}") # Log the error server-side
        return jsonify({"error": "An internal server error occurred"}), 500

@app.route('/api/funds/search', methods=['GET'])
def search_funds():
    """Endpoint to search for mutual funds using the MFAPI."""
    query = request.args.get('q', '')
    if not query:
        return jsonify([])
    
    try:
        # Call the MFAPI search endpoint
        response = requests.get(f'https://api.mfapi.in/mf/search', params={'q': query})
        response.raise_for_status()  # Raise an exception for bad status codes
        
        # Return the search results directly
        return jsonify(response.json())
    except requests.RequestException as e:
        return jsonify({"error": f"Failed to fetch search results: {str(e)}"}), 500

@app.route('/api/index-data', methods=['GET'])
def get_index_data():
    try:
        symbol = request.args.get('symbol')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')

        if not all([symbol, start_date, end_date]):
            return jsonify({'error': 'Missing required parameters'}), 400

        # Fetch data using yfinance
        ticker = yf.Ticker(symbol)
        df = ticker.history(start=start_date, end=end_date)

        if df.empty:
            return jsonify({'error': 'No data available for the specified range'}), 404

        # Convert data to list of dictionaries
        data = []
        for index, row in df.iterrows():
            data.append({
                'date': index.strftime('%Y-%m-%d'),
                'close': float(row['Close'])
            })

        return jsonify(data)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Get port from environment variable or default to 5001
    port = int(os.environ.get('PORT', 5001))
    # In production, listen on all interfaces
    host = '0.0.0.0' if os.environ.get('FLASK_ENV') == 'production' else 'localhost'
    app.run(host=host, port=port, debug=os.environ.get('FLASK_ENV') != 'production') 