/**
 * CompletionTrends Component - Completion trends visualization
 * 
 * Displays completion trends over time with interactive charts
 * 
 * Created: 2025-07-09
 * Issue: #16 - Enhanced Analytics and Performance Insights Dashboard
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig
} from '@/components/ui/chart';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Filter,
  Download
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { CompletionTrend, DepartmentTrendData } from '@/types/reportManagement';
import { cn } from '@/lib/utils';

interface CompletionTrendsProps {
  trends: CompletionTrend[];
  onExportData?: () => void;
  loading?: boolean;
}

type ViewMode = 'line' | 'area' | 'bar' | 'pie';

const chartConfig: ChartConfig = {
  completionPercentage: {
    label: "Completion %",
    color: "hsl(var(--primary))",
  },
  totalSections: {
    label: "Total Sections",
    color: "hsl(var(--secondary))",
  },
  completedSections: {
    label: "Completed Sections",
    color: "hsl(var(--success))",
  },
};

const DEPARTMENT_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  'hsl(220, 90%, 60%)',
  'hsl(280, 90%, 60%)',
  'hsl(340, 90%, 60%)',
  'hsl(40, 90%, 60%)',
  'hsl(160, 90%, 60%)',
];

export const CompletionTrends: React.FC<CompletionTrendsProps> = ({
  trends,
  onExportData,
  loading = false
}) => {
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<ViewMode>('line');
  const [showDepartments, setShowDepartments] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | 'all'>('30d');

  // Filter trends based on selected period
  const filteredTrends = React.useMemo(() => {
    if (selectedPeriod === 'all') return trends;
    
    const days = selectedPeriod === '7d' ? 7 : 30;
    return trends.slice(-days);
  }, [trends, selectedPeriod]);

  // Get unique departments for legend
  const departments = React.useMemo(() => {
    const deptMap = new Map<string, string>();
    trends.forEach(trend => {
      trend.departmentData.forEach(dept => {
        deptMap.set(dept.departmentId, dept.departmentName);
      });
    });
    return Array.from(deptMap.entries()).map(([id, name]) => ({ id, name }));
  }, [trends]);

  // Transform data for department visualization
  const departmentTrendData = React.useMemo(() => {
    return filteredTrends.map(trend => {
      const result: any = {
        date: trend.date,
        completionPercentage: trend.completionPercentage,
        totalSections: trend.totalSections,
        completedSections: trend.completedSections,
      };
      
      trend.departmentData.forEach(dept => {
        result[`dept_${dept.departmentId}`] = dept.percentage;
      });
      
      return result;
    });
  }, [filteredTrends]);

  // Get latest completion data for pie chart
  const latestData = React.useMemo(() => {
    if (trends.length === 0) return [];
    
    const latest = trends[trends.length - 1];
    return latest.departmentData.map((dept, index) => ({
      name: dept.departmentName,
      value: dept.completed,
      total: dept.total,
      percentage: dept.percentage,
      color: DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length],
    }));
  }, [trends]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderChart = () => {
    if (loading) {
      return (
        <div className="h-80 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading chart...</div>
        </div>
      );
    }

    if (filteredTrends.length === 0) {
      return (
        <div className="h-80 flex items-center justify-center text-muted-foreground">
          {t('analytics.noDataAvailable')}
        </div>
      );
    }

    switch (viewMode) {
      case 'line':
        return (
          <ChartContainer config={chartConfig} className="h-80">
            <LineChart data={departmentTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                type="monotone"
                dataKey="completionPercentage"
                stroke="var(--color-completionPercentage)"
                strokeWidth={2}
                dot={{ fill: "var(--color-completionPercentage)" }}
              />
              {showDepartments && departments.map((dept, index) => (
                <Line
                  key={dept.id}
                  type="monotone"
                  dataKey={`dept_${dept.id}`}
                  stroke={DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length]}
                  strokeWidth={1}
                  strokeDasharray="5,5"
                  dot={{ r: 2 }}
                />
              ))}
            </LineChart>
          </ChartContainer>
        );

      case 'area':
        return (
          <ChartContainer config={chartConfig} className="h-80">
            <AreaChart data={departmentTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Area
                type="monotone"
                dataKey="completionPercentage"
                stroke="var(--color-completionPercentage)"
                fill="var(--color-completionPercentage)"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ChartContainer>
        );

      case 'bar':
        return (
          <ChartContainer config={chartConfig} className="h-80">
            <BarChart data={departmentTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="completedSections"
                fill="var(--color-completedSections)"
              />
              <Bar
                dataKey="totalSections"
                fill="var(--color-totalSections)"
                fillOpacity={0.3}
              />
            </BarChart>
          </ChartContainer>
        );

      case 'pie':
        return (
          <ChartContainer config={chartConfig} className="h-80">
            <PieChart>
              <Pie
                data={latestData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage.toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {latestData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <ChartTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background border border-border rounded-lg p-2 shadow-md">
                        <p className="font-medium">{data.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {data.value} / {data.total} sections ({data.percentage.toFixed(1)}%)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ChartContainer>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              {t('analytics.completionTrends')}
            </CardTitle>
            <CardDescription>
              {t('analytics.completionTrendsDescription')}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {onExportData && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExportData}
              >
                <Download className="w-4 h-4 mr-2" />
                {t('analytics.export')}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1">
              <Button
                variant={viewMode === 'line' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('line')}
              >
                <Activity className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'area' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('area')}
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'bar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('bar')}
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'pie' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('pie')}
              >
                <PieChartIcon className="w-4 h-4" />
              </Button>
            </div>

            {/* Period Selection */}
            <div className="flex items-center gap-1">
              <Button
                variant={selectedPeriod === '7d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('7d')}
              >
                7d
              </Button>
              <Button
                variant={selectedPeriod === '30d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('30d')}
              >
                30d
              </Button>
              <Button
                variant={selectedPeriod === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('all')}
              >
                All
              </Button>
            </div>

            {/* Department Toggle */}
            {viewMode === 'line' && (
              <Button
                variant={showDepartments ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowDepartments(!showDepartments)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Departments
              </Button>
            )}
          </div>

          {/* Chart */}
          <div className="w-full">
            {renderChart()}
          </div>

          {/* Department Legend for Line Chart */}
          {showDepartments && viewMode === 'line' && departments.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              {departments.map((dept, index) => (
                <Badge
                  key={dept.id}
                  variant="outline"
                  className="text-xs"
                  style={{
                    borderColor: DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length],
                    color: DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length],
                  }}
                >
                  {dept.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {trends.length > 0 ? trends[trends.length - 1].completionPercentage.toFixed(1) : 0}%
              </div>
              <div className="text-sm text-muted-foreground">
                {t('analytics.currentCompletion')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {trends.length > 0 ? trends[trends.length - 1].completedSections : 0}
              </div>
              <div className="text-sm text-muted-foreground">
                {t('analytics.sectionsCompleted')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {trends.length > 0 ? trends[trends.length - 1].totalSections : 0}
              </div>
              <div className="text-sm text-muted-foreground">
                {t('analytics.totalSections')}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompletionTrends;