# Mutual Fund vs Index Performance Analyzer

A local web application to compare the performance of Indian mutual funds against market indices.

## Project Structure

```
mutual_fund_analyzer/
├── backend/
│   ├── app.py          # Flask application
│   ├── utils.py        # Data fetching and processing logic
│   ├── requirements.txt# Python dependencies
│   └── ...
├── frontend/
│   ├── public/
│   ├── src/            # React application source
│   ├── package.json    # Node dependencies
│   └── ...
└── README.md
```

## Setup and Run

### Backend (Flask)

1.  Navigate to the `backend` directory:
    ```bash
    cd mutual_fund_analyzer/backend
    ```
2.  Create a virtual environment (optional but recommended):
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows use `venv\Scripts\activate`
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Run the Flask development server:
    ```bash
    python app.py
    ```
    The backend will be running at `http://127.0.0.1:5001`.

### Frontend (React)

1.  Navigate to the `frontend` directory:
    ```bash
    cd ../frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    # or
    yarn install
    ```
3.  Start the React development server:
    ```bash
    npm start
    # or
    yarn start
    ```
    The frontend will open automatically in your browser, usually at `http://localhost:3000`.

## Features

*   Select Indian mutual funds (with search).
*   Select common Indian market indices.
*   Choose a custom date range or predefined periods (1M, 3M, 6M, 1Y, 3Y, 5Y, MAX).
*   View an interactive chart comparing normalized performance.

## Data Sources

*   **Mutual Funds:** [MFAPI.in](https://mfapi.in/)
*   **Indices:** [NSEpy](https://nsepy.readthedocs.io/en/latest/) (accessing NSE historical data)

## Technologies Used

*   **Backend:** Python, Flask, Pandas, Requests, NSEpy
*   **Frontend:** React.js, Material-UI, Chart.js (or similar)
*   **Styling:** Material-UI
*   **Charting:** Chart.js / react-chartjs-2 