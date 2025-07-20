# Chart Renderer Test Examples

## Test the chart renderer with these examples:

### 1. Simple Chart.js Format

```artifact:type=chart title="Monthly Sales"
{
  "type": "bar",
  "data": {
    "labels": ["Jan", "Feb", "Mar", "Apr", "May"],
    "datasets": [{
      "label": "Sales ($)",
      "data": [12000, 19000, 15000, 17000, 22000],
      "backgroundColor": "hsl(220, 70%, 50%)",
      "borderColor": "hsl(220, 70%, 40%)",
      "borderWidth": 1
    }]
  }
}
```

### 2. CSV Format

```artifact:type=chart title="Quarterly Revenue"
Month,Product A,Product B,Product C
Q1,1200,800,600
Q2,1500,900,750
Q3,1800,1100,900
Q4,2100,1300,1050
```

### 3. Simple Object Format

```artifact:type=chart title="Browser Usage"
{
  "labels": ["Chrome", "Firefox", "Safari", "Edge", "Other"],
  "values": [45.2, 23.8, 15.4, 8.9, 6.7],
  "label": "Market Share (%)"
}
```

### 4. Array of Numbers

```artifact:type=chart title="Daily Steps"
[8234, 9876, 7543, 10234, 8765, 9123, 7890]
```

### 5. Array of Objects

```artifact:type=chart title="Team Performance"
[
  {"name": "Alice", "score": 95},
  {"name": "Bob", "score": 87},
  {"name": "Charlie", "score": 92},
  {"name": "Diana", "score": 89}
]
```

### 6. Line Chart

```artifact:type=chart title="Temperature Over Time"
{
  "type": "line",
  "data": {
    "labels": ["6AM", "9AM", "12PM", "3PM", "6PM", "9PM"],
    "datasets": [{
      "label": "Temperature (°F)",
      "data": [65, 72, 78, 82, 79, 74],
      "backgroundColor": "hsl(120, 70%, 50%)",
      "borderColor": "hsl(120, 70%, 40%)",
      "borderWidth": 2,
      "fill": false
    }]
  }
}
```

### 7. Pie Chart (will auto-detect)

```artifact:type=chart title="Budget Allocation"
{
  "labels": ["Marketing", "Development", "Operations", "Sales"],
  "values": [25, 40, 20, 15],
  "label": "Budget (%)"
}
```

## How to Test:

1. Start the development server: `npm run dev`
2. Open the chat interface
3. Paste any of the above code blocks into a message
4. The chart should be automatically detected and rendered as an artifact
5. Click on the artifact to view the chart preview, data table, and raw code

## Expected Behavior:

- Charts should render correctly in the Preview tab
- Data tab should show a formatted table for CSV or JSON preview
- Raw tab should show the original content
- Chart type badges should appear correctly
- Error handling should show helpful messages for invalid data
