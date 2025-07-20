'use client';

import { memo, useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart3, Code, Eye, AlertTriangle, Table } from 'lucide-react';
import { Artifact } from '@/types/artifacts';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ChartRendererProps {
  artifact: Artifact;
}

export const ChartRenderer = memo(function ChartRenderer({
  artifact,
}: ChartRendererProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'data' | 'code'>(
    'preview'
  );

  // Try to parse the chart data
  const chartData = useMemo(() => {
    try {
      const parsed = JSON.parse(artifact.content);

      // Validate basic chart structure
      if (parsed && typeof parsed === 'object') {
        // Check for Chart.js format
        if (parsed.type && (parsed.data || parsed.datasets)) {
          return {
            isValid: true,
            data: parsed,
            type: parsed.type,
            title: parsed.title || artifact.title,
            hasData: !!(parsed.data || parsed.datasets),
            format: 'chartjs',
          };
        }

        // Check for simple data array format
        if (Array.isArray(parsed)) {
          return {
            isValid: true,
            data: { raw: parsed },
            type: 'auto',
            title: artifact.title,
            hasData: parsed.length > 0,
            format: 'array',
          };
        }

        // Check for object with data properties
        if (parsed.labels && parsed.values) {
          return {
            isValid: true,
            data: parsed,
            type: 'auto',
            title: parsed.title || artifact.title,
            hasData: !!(parsed.labels && parsed.values),
            format: 'simple',
          };
        }

        return {
          isValid: true,
          data: parsed,
          type: 'auto',
          title: artifact.title,
          hasData: Object.keys(parsed).length > 0,
          format: 'object',
        };
      }
    } catch {
      // Not JSON, might be CSV or other format
      const lines = artifact.content.trim().split('\n');
      if (lines.length > 1) {
        const headers = lines[0]?.split(',') || [];
        const rows = lines.slice(1).map((line) => line.split(','));

        return {
          isValid: true,
          data: { headers, rows, raw: artifact.content },
          type: 'auto',
          title: artifact.title,
          hasData: true,
          format: 'csv',
        };
      }
    }

    return {
      isValid: false,
      data: null,
      type: 'unknown',
      title: artifact.title,
      hasData: false,
      format: 'unknown',
    };
  }, [artifact.content, artifact.title]);

  // Convert data to Chart.js format
  const chartJsData = useMemo(() => {
    if (!chartData.hasData) return null;

    try {
      // If already in Chart.js format
      if (chartData.format === 'chartjs') {
        const data = chartData.data;
        // Validate Chart.js data structure
        if (data && data.datasets && Array.isArray(data.datasets)) {
          return data;
        }
        // If it has data property but not properly structured
        if (data && data.data && data.data.datasets) {
          return data.data;
        }
        // Fallback - try to convert if it's not properly structured
        return null;
      }

      // Convert CSV to chart data
      if (chartData.format === 'csv') {
        const { headers, rows } = chartData.data;
        if (
          headers &&
          Array.isArray(headers) &&
          headers.length >= 2 &&
          rows &&
          Array.isArray(rows) &&
          rows.length > 0
        ) {
          const labels = rows
            .map((row: string[]) => row[0]?.trim())
            .filter(Boolean);
          const datasets = headers
            .slice(1)
            .map((header: string, index: number) => ({
              label: header.trim(),
              data: rows.map((row: string[]) => {
                const value = parseFloat(row[index + 1]);
                return isNaN(value) ? 0 : value;
              }),
              backgroundColor: `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
              borderColor: `hsl(${(index * 137.5) % 360}, 70%, 40%)`,
              borderWidth: 1,
            }));

          return {
            labels,
            datasets,
          };
        }
      }

      // Convert simple format
      if (chartData.format === 'simple') {
        const { labels, values, ...rest } = chartData.data;
        if (labels && values) {
          const labelsArray = Array.isArray(labels)
            ? labels
            : Object.keys(labels || {});
          const valuesArray = Array.isArray(values)
            ? values
            : Object.values(values || {});

          if (labelsArray.length > 0 && valuesArray.length > 0) {
            return {
              labels: labelsArray,
              datasets: [
                {
                  label: rest.label || 'Data',
                  data: valuesArray,
                  backgroundColor: [
                    'hsl(0, 70%, 50%)',
                    'hsl(60, 70%, 50%)',
                    'hsl(120, 70%, 50%)',
                    'hsl(180, 70%, 50%)',
                    'hsl(240, 70%, 50%)',
                    'hsl(300, 70%, 50%)',
                  ],
                  borderWidth: 1,
                },
              ],
            };
          }
        }
      }

      // Convert array format
      if (chartData.format === 'array') {
        const data = chartData.data.raw;
        if (Array.isArray(data) && data.length > 0) {
          // Check if it's array of objects
          if (typeof data[0] === 'object' && data[0] !== null) {
            const keys = Object.keys(data[0]);
            if (keys.length >= 1) {
              const labelKey = keys[0];
              const valueKey = keys[1] || keys[0];

              return {
                labels: data.map((item) => item[labelKey]).filter(Boolean),
                datasets: [
                  {
                    label: valueKey,
                    data: data.map((item) => {
                      const value = parseFloat(item[valueKey]);
                      return isNaN(value) ? 0 : value;
                    }),
                    backgroundColor: 'hsl(220, 70%, 50%)',
                    borderColor: 'hsl(220, 70%, 40%)',
                    borderWidth: 1,
                  },
                ],
              };
            }
          } else {
            // Simple array of numbers or strings
            const numericData = data.map((value) => {
              const num = parseFloat(value);
              return isNaN(num) ? 0 : num;
            });

            return {
              labels: data.map((_, index) => `Item ${index + 1}`),
              datasets: [
                {
                  label: 'Values',
                  data: numericData,
                  backgroundColor: 'hsl(220, 70%, 50%)',
                  borderColor: 'hsl(220, 70%, 40%)',
                  borderWidth: 1,
                },
              ],
            };
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error converting chart data:', error);
      return null;
    }
  }, [chartData]);

  // Determine best chart type
  const suggestedChartType = useMemo(() => {
    if (chartData.type && chartData.type !== 'auto') {
      return chartData.type;
    }

    if (!chartJsData) return 'bar';

    const datasetCount = chartJsData.datasets?.length || 0;
    const dataPointCount = chartJsData.labels?.length || 0;

    // Use pie chart for single dataset with few data points
    if (datasetCount === 1 && dataPointCount <= 8) {
      return 'pie';
    }

    // Use line chart for time series or continuous data
    if (datasetCount === 1 && dataPointCount > 10) {
      return 'line';
    }

    // Default to bar chart
    return 'bar';
  }, [chartData.type, chartJsData]);

  const renderChart = () => {
    if (!chartJsData) {
      return (
        <div className="text-center py-8">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            No valid chart data found
          </p>
        </div>
      );
    }

    // Validate required Chart.js data structure
    if (
      !chartJsData.datasets ||
      !Array.isArray(chartJsData.datasets) ||
      chartJsData.datasets.length === 0
    ) {
      return (
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-2" />
          <p className="text-sm text-muted-foreground">
            Invalid chart data structure
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Missing or invalid datasets array
          </p>
        </div>
      );
    }

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: !!chartData.title,
          text: chartData.title,
        },
      },
      scales:
        suggestedChartType === 'pie' || suggestedChartType === 'doughnut'
          ? undefined
          : {
              y: {
                beginAtZero: true,
              },
            },
    };

    const commonProps = {
      data: chartJsData,
      options,
    };

    try {
      switch (suggestedChartType) {
        case 'line':
          return <Line {...commonProps} />;
        case 'pie':
          return <Pie {...commonProps} />;
        case 'doughnut':
          return <Doughnut {...commonProps} />;
        case 'bar':
        default:
          return <Bar {...commonProps} />;
      }
    } catch (error) {
      console.error('Chart rendering error:', error);
      return (
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-2" />
          <p className="text-sm text-muted-foreground">Error rendering chart</p>
          <p className="text-xs text-muted-foreground mt-1">
            Check console for details
          </p>
        </div>
      );
    }
  };

  const renderDataPreview = () => {
    if (!chartData.hasData) {
      return (
        <div className="text-center py-8">
          <Table className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No data to display</p>
        </div>
      );
    }

    if (chartData.format === 'csv') {
      const { headers, rows } = chartData.data;

      return (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-border rounded-lg text-xs">
            <thead>
              <tr className="bg-muted/50">
                {headers.map((header: string, i: number) => (
                  <th
                    key={i}
                    className="border border-border px-2 py-1 text-left font-medium"
                  >
                    {header.trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 10).map((row: string[], i: number) => (
                <tr key={i}>
                  {row.map((cell: string, j: number) => (
                    <td key={j} className="border border-border px-2 py-1">
                      {cell.trim()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 10 && (
            <p className="text-xs text-muted-foreground mt-2">
              Showing first 10 rows of {rows.length} total rows
            </p>
          )}
        </div>
      );
    }

    // JSON data preview
    return (
      <pre className="bg-muted/50 rounded-lg border border-border p-3 text-xs overflow-auto max-h-64">
        <code>{JSON.stringify(chartData.data, null, 2)}</code>
      </pre>
    );
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            <BarChart3 className="h-3 w-3 mr-1" />
            Chart Data
          </Badge>
          {chartData.hasData && (
            <Badge variant="outline" className="text-xs">
              {suggestedChartType}
            </Badge>
          )}
          {chartData.format && chartData.format !== 'unknown' && (
            <Badge variant="outline" className="text-xs">
              {chartData.format}
            </Badge>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as 'preview' | 'data' | 'code')
        }
        className="flex flex-col flex-1 min-h-0"
      >
        <TabsList className="grid w-full grid-cols-3 h-8 shrink-0">
          <TabsTrigger value="preview" className="text-xs">
            <Eye className="h-3 w-3 mr-1" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="data" className="text-xs">
            <Table className="h-3 w-3 mr-1" />
            Data
          </TabsTrigger>
          <TabsTrigger value="code" className="text-xs">
            <Code className="h-3 w-3 mr-1" />
            Raw
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="flex-1 min-h-0 m-0">
          <div className="h-full pt-4">
            {chartJsData ? (
              <div className="h-full min-h-[300px] relative">
                {renderChart()}
              </div>
            ) : (
              <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  <div className="space-y-2">
                    <p className="font-medium">Unable to parse chart data</p>
                    <p className="text-sm">
                      Please ensure your data is in a supported format:
                    </p>
                    <ul className="text-sm list-disc list-inside space-y-1">
                      <li>Chart.js format with type and data/datasets</li>
                      <li>CSV with headers</li>
                      <li>Simple object with labels and values arrays</li>
                      <li>Array of objects or numbers</li>
                    </ul>
                    {chartData.hasData && (
                      <div className="mt-3 p-3 bg-amber-100 dark:bg-amber-900/30 rounded text-xs">
                        <p>
                          <strong>Detected format:</strong> {chartData.format}
                        </p>
                        {chartData.title && (
                          <p>
                            <strong>Title:</strong> {chartData.title}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </TabsContent>

        <TabsContent value="data" className="flex-1 min-h-0 m-0">
          <div className="h-full pt-4 overflow-auto">{renderDataPreview()}</div>
        </TabsContent>

        <TabsContent value="code" className="flex-1 min-h-0 m-0">
          <div className="h-full pt-4 overflow-auto">
            <pre className="bg-muted/50 rounded-lg border border-border p-4 text-xs h-full">
              <code className="text-foreground">{artifact.content}</code>
            </pre>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
});
