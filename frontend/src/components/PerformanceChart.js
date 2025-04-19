import React, { useState, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { Box, Typography, ToggleButton, ToggleButtonGroup, Button, Stack, Tooltip as MuiTooltip, useTheme } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';
import { format, parseISO, differenceInDays } from 'date-fns';
import annotationPlugin from 'chartjs-plugin-annotation';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
  zoomPlugin,
  annotationPlugin
);

const PerformanceChart = ({ chartData }) => {
  const [valueType, setValueType] = useState('normalized');
  const chartRef = useRef(null);
  const theme = useTheme();

  // Custom colors with opacity
  const fundColor = '#2196f3';
  const indexColor = '#4caf50';
  const fundGradient = ['rgba(33, 150, 243, 0.1)', 'rgba(33, 150, 243, 0)'];
  const indexGradient = ['rgba(76, 175, 80, 0.1)', 'rgba(76, 175, 80, 0)'];

  if (!chartData || !chartData.labels || chartData.labels.length === 0) {
    return (
      <Box sx={{
        mt: 4,
        p: 3,
        textAlign: 'center',
        border: '1px dashed rgba(0, 0, 0, 0.12)',
        borderRadius: '8px',
        bgcolor: 'rgba(0, 0, 0, 0.02)',
        transition: 'all 0.3s ease'
      }}>
        <Typography variant="body1" color="text.secondary">
          Select a fund, index, and date range to see the performance chart.
        </Typography>
      </Box>
    );
  }

  const handleValueTypeChange = (event, newValueType) => {
    if (newValueType !== null) {
      setValueType(newValueType);
    }
  };

  const resetZoom = () => {
    if (chartRef.current) {
      chartRef.current.resetZoom();
    }
  };

  const formatDate = (dateStr) => {
    try {
      const date = parseISO(dateStr);
      if (dateStr === chartData.labels[0] || dateStr === chartData.labels[chartData.labels.length - 1]) {
        return format(date, 'dd MMM yyyy');
      }
      return format(date, 'dd MMM');
    } catch {
      return dateStr;
    }
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: valueType === 'normalized' ? 0 : 2,
      maximumFractionDigits: valueType === 'normalized' ? 0 : 2,
      style: valueType === 'normalized' ? 'decimal' : 'currency',
      currency: 'INR'
    }).format(value);
  };

  const calculatePerformance = (currentValue, initialValue) => {
    const performance = ((currentValue - initialValue) / initialValue) * 100;
    return performance.toFixed(2);
  };

  const calculateXIRR = (currentValue, initialValue, startDate, currentDate) => {
    try {
      // Convert dates to Date objects if they're strings
      const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
      const current = typeof currentDate === 'string' ? parseISO(currentDate) : currentDate;

      // Calculate years between dates (including fractional years)
      const years = differenceInDays(current, start) / 365;

      if (years === 0 || initialValue === 0) return 0;

      // XIRR formula: (FV/PV)^(1/t) - 1
      // Where FV = Final Value, PV = Present Value, t = time in years
      const xirr = (Math.pow(currentValue / initialValue, 1 / years) - 1) * 100;

      return xirr;
    } catch (error) {
      console.error('Error calculating XIRR:', error);
      return 0;
    }
  };

  const formatXIRR = (value) => {
    if (isNaN(value) || !isFinite(value)) return 'N/A';
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const downloadData = () => {
    // Create CSV content with proper escaping for Excel
    const escapeCSV = (value) => {
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    // Format the header section
    const headerRows = [
      ['Performance Data Export', '', ''],
      ['Generated on', new Date().toLocaleString(), ''],
      ['Fund', chartData.fund_name || 'N/A', ''],
      ['Index', chartData.index_name || 'N/A', ''],
      ['Value Type', valueType === 'normalized' ? 'Normalized (Base 100)' : 'Actual Values', ''],
      ['', '', ''] // Empty row for spacing
    ];

    // Column headers
    const columnHeaders = ['Date'];
    if (valueType === 'normalized') {
      columnHeaders.push('Fund (Normalized)', 'Index (Normalized)', 'Fund Performance (%)', 'Index Performance (%)');
    } else {
      columnHeaders.push('Fund Value (₹)', 'Index Value', 'Fund Performance (%)', 'Index Performance (%)');
    }

    // Prepare data rows
    const dataRows = chartData.labels.map((date, index) => {
      const fundValue = valueType === 'normalized'
        ? chartData.fund_performance[index]
        : chartData.fund_actual_values[index];
      const indexValue = valueType === 'normalized'
        ? chartData.index_performance[index]
        : chartData.index_actual_values[index];

      // Calculate performance relative to first day
      const fundPerf = calculatePerformance(fundValue, chartData.fund_performance[0]);
      const indexPerf = calculatePerformance(indexValue, chartData.index_performance[0]);

      return [
        formatDate(date),
        formatNumber(fundValue).replace('₹', '').trim(), // Remove currency symbol for better Excel handling
        formatNumber(indexValue).replace('₹', '').trim(),
        `${fundPerf}%`,
        `${indexPerf}%`
      ];
    });

    // Combine all rows and format as CSV
    const allRows = [
      ...headerRows,
      columnHeaders,
      ...dataRows
    ];

    // Convert to CSV string with proper line endings
    const csvContent = allRows
      .map(row => row.map(escapeCSV).join(','))
      .join('\r\n');

    // Create and trigger download
    const blob = new Blob(['\ufeff' + csvContent], { // Add BOM for Excel UTF-8 compatibility
      type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
    const filename = `${chartData.fund_name || 'fund'}_performance_${valueType}_${timestamp}.csv`
      .replace(/[^a-z0-9_-]/gi, '_')
      .toLowerCase();

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Clean up
  };

  const data = {
    labels: chartData.labels,
    datasets: [
      {
        label: chartData.fund_name || 'Fund',
        data: valueType === 'normalized' ? chartData.fund_performance : chartData.fund_actual_values,
        borderColor: fundColor,
        backgroundColor: fundColor,
        fill: {
          target: 'origin',
          above: (context) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return null;
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, fundGradient[0]);
            gradient.addColorStop(1, fundGradient[1]);
            return gradient;
          }
        },
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: fundColor,
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
        yAxisID: valueType === 'normalized' ? 'y' : 'y1'  // Use right axis for fund in actual view
      },
      {
        label: chartData.index_name || 'Index',
        data: valueType === 'normalized' ? chartData.index_performance : chartData.index_actual_values,
        borderColor: indexColor,
        backgroundColor: indexColor,
        fill: {
          target: 'origin',
          above: (context) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return null;
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, indexGradient[0]);
            gradient.addColorStop(1, indexGradient[1]);
            return gradient;
          }
        },
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: indexColor,
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
        yAxisID: 'y'  // Always use left axis for index
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: {
            family: theme.typography.fontFamily,
            size: 13,
            weight: 'bold'
          },
          color: (context) => {
            return context.dataset ? context.dataset.borderColor : '#666';
          },
          generateLabels: (chart) => {
            const datasets = chart.data.datasets;
            return datasets.map((dataset) => ({
              text: dataset.label,
              fillStyle: dataset.backgroundColor,
              strokeStyle: dataset.borderColor,
              lineWidth: 2,
              hidden: !chart.isDatasetVisible(datasets.indexOf(dataset)),
              index: datasets.indexOf(dataset),
              fontColor: dataset.borderColor
            }));
          }
        }
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#000',
        bodyColor: '#666',
        titleFont: {
          size: 13,
          weight: 'bold',
          family: theme.typography.fontFamily
        },
        bodyFont: {
          size: 12,
          family: theme.typography.fontFamily
        },
        padding: 12,
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        displayColors: true,
        callbacks: {
          title: (tooltipItems) => {
            return format(parseISO(tooltipItems[0].label), 'dd MMM yyyy');
          },
          label: (context) => {
            const datasetLabel = context.dataset.label;
            const value = context.parsed.y;
            const initialValue = context.dataset.data[0];
            const startDate = chartData.labels[0];
            const currentDate = chartData.labels[context.dataIndex];

            const xirr = calculateXIRR(value, initialValue, startDate, currentDate);

            return [
              `${datasetLabel}: ${formatNumber(value)}`,
              `XIRR: ${formatXIRR(xirr)}`
            ];
          }
        }
      },
      zoom: {
        pan: {
          enabled: true,
          mode: 'x',
        },
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true,
          },
          mode: 'x',
        },
      },
      annotation: {
        annotations: {
          crosshair: {
            type: 'line',
            xScaleID: 'x',
            yScaleID: 'y',
            xMin: 0,
            xMax: 0,
            borderColor: 'rgba(0, 0, 0, 0.1)',
            borderWidth: 1,
            borderDash: [5, 5],
            label: {
              enabled: false
            }
          }
        }
      }
    },
    scales: valueType === 'normalized' ? {
      x: {
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.04)',
          drawBorder: false,
          lineWidth: 1
        },
        ticks: {
          font: {
            size: 11,
            family: theme.typography.fontFamily
          },
          maxRotation: 0,
          minRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8,
          callback: (value) => formatDate(chartData.labels[value])
        },
        title: {
          display: true,
          text: 'Date',
          font: {
            size: 12,
            weight: 'bold',
            family: theme.typography.fontFamily
          },
          padding: { top: 10 }
        }
      },
      y: {
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.04)',
          drawBorder: false,
          lineWidth: 1
        },
        ticks: {
          font: {
            size: 11,
            family: theme.typography.fontFamily
          },
          callback: (value) => Math.round(value),
          maxTicksLimit: 8
        },
        title: {
          display: true,
          text: 'Normalized Value (Base 100)',
          font: {
            size: 12,
            weight: 'bold',
            family: theme.typography.fontFamily
          },
          padding: { bottom: 10 }
        }
      }
    } : {
      x: {
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.04)',
          drawBorder: false,
          lineWidth: 1
        },
        ticks: {
          font: {
            size: 11,
            family: theme.typography.fontFamily
          },
          maxRotation: 0,
          minRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8,
          callback: (value) => formatDate(chartData.labels[value])
        },
        title: {
          display: true,
          text: 'Date',
          font: {
            size: 12,
            weight: 'bold',
            family: theme.typography.fontFamily
          },
          padding: { top: 10 }
        }
      },
      y: {  // Left axis for Index
        type: 'linear',
        display: true,
        position: 'left',
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.04)',
          drawBorder: false,
          lineWidth: 1
        },
        ticks: {
          font: {
            size: 11,
            family: theme.typography.fontFamily
          },
          callback: (value) => Math.round(value),
          maxTicksLimit: 8,
          color: indexColor
        },
        title: {
          display: true,
          text: `${chartData.index_name || 'Index'} Value`,
          font: {
            size: 12,
            weight: 'bold',
            family: theme.typography.fontFamily
          },
          padding: { bottom: 10 },
          color: indexColor
        }
      },
      y1: {  // Right axis for Fund
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          display: false  // Don't show grid for second axis
        },
        ticks: {
          font: {
            size: 11,
            family: theme.typography.fontFamily
          },
          callback: (value) => Math.round(value),
          maxTicksLimit: 8,
          color: fundColor
        },
        title: {
          display: true,
          text: `${chartData.fund_name || 'Fund'} Value (₹)`,
          font: {
            size: 12,
            weight: 'bold',
            family: theme.typography.fontFamily
          },
          padding: { bottom: 10 },
          color: fundColor
        }
      }
    }
  };

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <ToggleButtonGroup
          value={valueType}
          exclusive
          onChange={handleValueTypeChange}
          size="small"
          sx={{
            '& .MuiToggleButton-root': {
              textTransform: 'none',
              px: 2,
            }
          }}
        >
          <ToggleButton value="normalized">
            Normalized (Base 100)
          </ToggleButton>
          <ToggleButton value="actual">
            Actual Value
          </ToggleButton>
        </ToggleButtonGroup>

        <Stack direction="row" spacing={1}>
          <MuiTooltip title="Reset Zoom">
            <Button
              variant="outlined"
              size="small"
              onClick={resetZoom}
              startIcon={<ZoomOutMapIcon />}
              sx={{ textTransform: 'none' }}
            >
              Reset Zoom
            </Button>
          </MuiTooltip>
          <MuiTooltip title="Download Data">
            <Button
              variant="outlined"
              size="small"
              onClick={downloadData}
              startIcon={<DownloadIcon />}
              sx={{ textTransform: 'none' }}
            >
              Download
            </Button>
          </MuiTooltip>
        </Stack>
      </Stack>

      <Box sx={{
        height: 500,
        bgcolor: '#fff',
        p: 2,
        borderRadius: 1,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease'
      }}>
        <Line ref={chartRef} data={data} options={options} />
      </Box>
    </Box>
  );
};

export default PerformanceChart; 