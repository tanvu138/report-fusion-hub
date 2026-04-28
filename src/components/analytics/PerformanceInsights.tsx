/**
 * PerformanceInsights Component - Performance metrics and insights display
 * 
 * Displays department performance metrics, bottlenecks, and actionable insights
 * 
 * Created: 2025-07-09
 * Issue: #16 - Enhanced Analytics and Performance Insights Dashboard
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle,
  Clock,
  Target,
  Zap,
  ChevronDown,
  ChevronUp,
  Activity,
  Users,
  BarChart3,
  Download
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { 
  DepartmentPerformanceMetrics,
  BottleneckInsight,
  TimeMetrics,
  ProgressPrediction
} from '@/types/reportManagement';
import { cn } from '@/lib/utils';

interface PerformanceInsightsProps {
  departmentPerformance: DepartmentPerformanceMetrics[];
  bottlenecks: BottleneckInsight[];
  timeMetrics: TimeMetrics;
  progressPrediction: ProgressPrediction | null;
  onExportData?: () => void;
  loading?: boolean;
}

export const PerformanceInsights: React.FC<PerformanceInsightsProps> = ({
  departmentPerformance,
  bottlenecks,
  timeMetrics,
  progressPrediction,
  onExportData,
  loading = false
}) => {
  const { t } = useLanguage();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getTrendIcon = (direction: 'improving' | 'stable' | 'declining') => {
    switch (direction) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getEfficiencyColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getImpactColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'high':
        return 'border-red-300 bg-red-50';
      case 'medium':
        return 'border-yellow-300 bg-yellow-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  const getImpactBadgeVariant = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'high':
        return 'destructive' as const;
      case 'medium':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-gray-200 h-32 rounded-lg" />
        <div className="animate-pulse bg-gray-200 h-48 rounded-lg" />
        <div className="animate-pulse bg-gray-200 h-32 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                {t('analytics.performanceOverview')}
              </CardTitle>
              <CardDescription>
                {t('analytics.performanceOverviewDescription')}
              </CardDescription>
            </div>
            {onExportData && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExportData}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {t('analytics.exportData')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {timeMetrics.averageCompletionTime.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">
                {t('analytics.avgCompletionDays')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {timeMetrics.onTimeRate.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">
                {t('analytics.onTimeRate')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">
                {timeMetrics.overdueRate.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">
                {t('analytics.overdueRate')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {departmentPerformance.length}
              </div>
              <div className="text-sm text-muted-foreground">
                {t('analytics.activeDepartments')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Department Performance */}
      <Card>
        <CardHeader>
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between p-0 h-auto"
                onClick={() => toggleSection('departments')}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <div>
                    <CardTitle>{t('analytics.departmentPerformance')}</CardTitle>
                    <CardDescription>
                      {t('analytics.departmentPerformanceDescription')}
                    </CardDescription>
                  </div>
                </div>
                {expandedSections.has('departments') ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  {departmentPerformance.map((dept) => (
                    <div
                      key={dept.departmentId}
                      className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium">{dept.departmentName}</h4>
                          {getTrendIcon(dept.trendDirection)}
                        </div>
                        <Badge
                          variant={dept.efficiencyScore >= 80 ? 'default' : 'secondary'}
                          className={cn(
                            'text-sm',
                            getEfficiencyColor(dept.efficiencyScore)
                          )}
                        >
                          {dept.efficiencyScore}/100
                        </Badge>
                      </div>
                      
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>{t('analytics.efficiencyScore')}</span>
                          <span>{dept.efficiencyScore}%</span>
                        </div>
                        <Progress value={dept.efficiencyScore} className="h-2" />
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span>{dept.avgCompletionTime.toFixed(1)}d avg</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-gray-500" />
                          <span>{dept.onTimeCompletionRate.toFixed(1)}% on-time</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-gray-500" />
                          <span>{dept.currentVelocity.toFixed(1)} sections/day</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-gray-500" />
                          <span>
                            {dept.lastActivity 
                              ? new Date(dept.lastActivity).toLocaleDateString()
                              : t('analytics.noActivity')
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </CardHeader>
      </Card>

      {/* Bottlenecks */}
      {bottlenecks.length > 0 && (
        <Card>
          <CardHeader>
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-0 h-auto"
                  onClick={() => toggleSection('bottlenecks')}
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <div>
                      <CardTitle>{t('analytics.bottlenecks')}</CardTitle>
                      <CardDescription>
                        {t('analytics.bottlenecksDescription')}
                      </CardDescription>
                    </div>
                  </div>
                  {expandedSections.has('bottlenecks') ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    {bottlenecks.map((bottleneck) => (
                      <div
                        key={bottleneck.identifier}
                        className={cn(
                          'p-4 border rounded-lg',
                          getImpactColor(bottleneck.impactLevel)
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant={getImpactBadgeVariant(bottleneck.impactLevel)}
                                className="text-xs"
                              >
                                {bottleneck.impactLevel.toUpperCase()}
                              </Badge>
                              <span className="font-medium">{bottleneck.name}</span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {bottleneck.description}
                            </p>
                            <div className="text-xs text-gray-500">
                              {t('analytics.affectedSections', { count: bottleneck.affectedSections })} •{' '}
                              {t('analytics.detectedDaysAgo', { days: bottleneck.timeSinceDetection })}
                            </div>
                          </div>
                        </div>
                        
                        {bottleneck.suggestedActions.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium mb-2">
                              {t('analytics.suggestedActions')}:
                            </p>
                            <ul className="text-sm space-y-1">
                              {bottleneck.suggestedActions.map((action, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <span className="text-gray-400">•</span>
                                  <span>{action}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </CardHeader>
        </Card>
      )}

      {/* Progress Prediction */}
      {progressPrediction && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              {t('analytics.progressPrediction')}
            </CardTitle>
            <CardDescription>
              {t('analytics.progressPredictionDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">
                    {progressPrediction.estimatedCompletionDate.toLocaleDateString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t('analytics.estimatedCompletion')}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">
                    {(progressPrediction.confidence * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t('analytics.confidence')}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-purple-600">
                    {progressPrediction.remainingWork}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t('analytics.remainingSections')}
                  </div>
                </div>
              </div>
              
              {progressPrediction.riskFactors.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <h5 className="font-medium text-amber-800 mb-2">
                    {t('analytics.riskFactors')}:
                  </h5>
                  <ul className="text-sm text-amber-700 space-y-1">
                    {progressPrediction.riskFactors.map((risk, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-amber-500">•</span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {progressPrediction.recommendations.length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h5 className="font-medium text-blue-800 mb-2">
                    {t('analytics.recommendations')}:
                  </h5>
                  <ul className="text-sm text-blue-700 space-y-1">
                    {progressPrediction.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-500">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PerformanceInsights;