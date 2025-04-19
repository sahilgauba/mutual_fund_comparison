# Mutual Fund Analyzer

A web application to analyze and compare mutual fund performance with market indices. Built with React frontend and Flask backend.

## Features

- Compare mutual fund performance with market indices
- Interactive performance charts
- Customizable date ranges (1M to 10Y)
- Multiple fund and index selection options

## Prerequisites

Before running the project, ensure you have the following installed:
- Python 3.7 or higher
- Node.js 14 or higher
- npm (comes with Node.js)

## Project Structure

```
mutual_fund_analyzer/
├── backend/               # Flask server
│   ├── app.py            # Main server file
│   ├── utils.py          # Utility functions
│   └── requirements.txt  # Python dependencies
│
└── frontend/             # React application
    ├── src/
    │   ├── components/   # React components
    │   └── App.js        # Main React component
    └── package.json      # Node.js dependencies
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate a Python virtual environment:
```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Start the Flask server:
```bash
python -m backend.app
# on linux
# gunicorn backend.app:app --bind 0.0.0.0:5001 --reload
```
The backend server will run on `http://localhost:5001`



### Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run build
```

## Dependencies

### Backend Dependencies
- Flask (2.0.1): Web framework
- Flask-CORS (3.0.10): Handle Cross-Origin Resource Sharing
- pandas (1.4.2): Data manipulation
- yfinance (0.1.70): Fetch market index data
- requests (2.27.1): HTTP requests
- python-dotenv (0.19.2): Environment management
- numpy (1.22.3): Numerical computations
- gunicorn (20.1.0): Production server

### Frontend Dependencies
- React (18.1.0): UI framework
- Material-UI (5.6.3): UI components
- Chart.js (3.7.1): Charting library
- date-fns (2.28.0): Date utilities
- axios (0.27.2): HTTP client

## Usage

1. Start both the backend and frontend servers following the setup instructions above
2. Select a mutual fund from the dropdown menu
3. Choose a market index for comparison
4. Select a date range using either the preset buttons (1M to 10Y) or custom date picker
5. The performance chart will update automatically to show the comparison

## Notes

- Always start the backend server before the frontend
- The backend must be running for the frontend to fetch data
- Make sure both servers are running on their designated ports (5000 for backend, 3000 for frontend)
- For development purposes, the application uses Flask's development server. For production, consider using gunicorn or a similar production server

## Data Sources

*   **Mutual Funds:** [MFAPI.in](https://mfapi.in/)
*   **Indices:** [NSEpy](https://nsepy.readthedocs.io/en/latest/) (accessing NSE historical data)

## Technologies Used

*   **Backend:** Python, Flask, Pandas, Requests, NSEpy
*   **Frontend:** React.js, Material-UI, Chart.js (or similar)
*   **Styling:** Material-UI
*   **Charting:** Chart.js / react-chartjs-2 