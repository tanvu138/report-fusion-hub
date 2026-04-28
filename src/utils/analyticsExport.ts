/**
 * Analytics Export Utilities - Export analytics data in various formats
 * 
 * Provides utilities for exporting analytics data to CSV, JSON, and other formats
 * 
 * Created: 2025-07-09
 * Issue: #16 - Enhanced Analytics and Performance Insights Dashboard
 */

import type { 
  AnalyticsData, 
  AnalyticsExportData, 
  AnalyticsSummary,
  CompletionTrend,
  DepartmentPerformanceMetrics,
  BottleneckInsight
} from '@/types/reportManagement';
import type { ReportWithSections } from '@/lib/api/reports';

/**
 * Export analytics data to CSV format
 * @param data - Analytics data to export
 * @param reportInfo - Report information
 * @returns CSV string
 */
export const exportAnalyticsToCSV = (
  data: AnalyticsData,
  reportInfo: { id: string; title: string }
): string => {
  const csvRows: string[] = [];
  
  // Header
  csvRows.push('Report Analytics Export');
  csvRows.push(`Report: ${reportInfo.title}`);
  csvRows.push(`Export Date: ${new Date().toISOString()}`);
  csvRows.push('');
  
  // Completion Trends
  csvRows.push('Completion Trends');
  csvRows.push('Date,Total Sections,Completed Sections,Completion Percentage');
  data.completionTrends.forEach(trend => {
    csvRows.push(`${trend.date},${trend.totalSections},${trend.completedSections},${trend.completionPercentage.toFixed(2)}`);
  });
  csvRows.push('');
  
  // Department Performance
  csvRows.push('Department Performance');
  csvRows.push('Department,Avg Completion Time (days),On-Time Rate (%),Velocity (sections/day),Efficiency Score,Trend');
  data.departmentPerformance.forEach(dept => {
    csvRows.push(`${dept.departmentName},${dept.avgCompletionTime.toFixed(2)},${dept.onTimeCompletionRate.toFixed(2)},${dept.currentVelocity.toFixed(2)},${dept.efficiencyScore},${dept.trendDirection}`);
  });
  csvRows.push('');
  
  // Time Metrics
  csvRows.push('Time Metrics');
  csvRows.push('Metric,Value');
  csvRows.push(`Average Completion Time (days),${data.timeMetrics.averageCompletionTime.toFixed(2)}`);
  csvRows.push(`Median Completion Time (days),${data.timeMetrics.medianCompletionTime.toFixed(2)}`);
  csvRows.push(`Fastest Completion (days),${data.timeMetrics.fastestCompletion}`);
  csvRows.push(`Slowest Completion (days),${data.timeMetrics.slowestCompletion}`);
  csvRows.push(`On-Time Rate (%),${data.timeMetrics.onTimeRate.toFixed(2)}`);
  csvRows.push(`Overdue Rate (%),${data.timeMetrics.overdueRate.toFixed(2)}`);
  csvRows.push('');
  
  // Bottlenecks
  if (data.bottlenecks.length > 0) {
    csvRows.push('Bottlenecks');
    csvRows.push('Type,Name,Description,Impact Level,Affected Sections,Days Since Detection');
    data.bottlenecks.forEach(bottleneck => {
      csvRows.push(`${bottleneck.type},${bottleneck.name},"${bottleneck.description}",${bottleneck.impactLevel},${bottleneck.affectedSections},${bottleneck.timeSinceDetection}`);
    });
    csvRows.push('');
  }
  
  // Progress Prediction
  if (data.progressPrediction) {
    csvRows.push('Progress Prediction');
    csvRows.push('Metric,Value');
    csvRows.push(`Estimated Completion Date,${data.progressPrediction.estimatedCompletionDate.toISOString()}`);
    csvRows.push(`Confidence,${(data.progressPrediction.confidence * 100).toFixed(2)}%`);
    csvRows.push(`Remaining Work,${data.progressPrediction.remainingWork}`);
    csvRows.push(`Daily Velocity,${data.progressPrediction.dailyVelocity.toFixed(2)}`);
    csvRows.push(`Based on Trend,${data.progressPrediction.basedOnTrend ? 'Yes' : 'No'}`);
    csvRows.push('');
    
    if (data.progressPrediction.riskFactors.length > 0) {
      csvRows.push('Risk Factors');
      data.progressPrediction.riskFactors.forEach(risk => {
        csvRows.push(`"${risk}"`);
      });
      csvRows.push('');
    }
    
    if (data.progressPrediction.recommendations.length > 0) {
      csvRows.push('Recommendations');
      data.progressPrediction.recommendations.forEach(rec => {
        csvRows.push(`"${rec}"`);
      });
    }
  }
  
  return csvRows.join('\n');
};

/**
 * Export analytics data to JSON format
 * @param data - Analytics data to export
 * @param reportInfo - Report information
 * @returns JSON string
 */
export const exportAnalyticsToJSON = (
  data: AnalyticsData,
  reportInfo: { id: string; title: string }
): string => {
  const exportData: AnalyticsExportData = {
    reportId: reportInfo.id,
    reportTitle: reportInfo.title,
    exportDate: new Date(),
    analytics: data,
    summary: generateAnalyticsSummary(data),
  };
  
  return JSON.stringify(exportData, null, 2);
};

/**
 * Generate analytics summary
 * @param data - Analytics data
 * @returns Analytics summary
 */
export const generateAnalyticsSummary = (data: AnalyticsData): AnalyticsSummary => {
  const latestTrend = data.completionTrends[data.completionTrends.length - 1];
  const totalSections = latestTrend?.totalSections || 0;
  const completedSections = latestTrend?.completedSections || 0;
  const completionPercentage = latestTrend?.completionPercentage || 0;
  
  // Find top performing department
  const topPerforming = data.departmentPerformance.reduce((top, dept) => 
    dept.efficiencyScore > top.efficiencyScore ? dept : top,
    data.departmentPerformance[0] || { departmentName: 'None', efficiencyScore: 0 }
  );
  
  // Find department needing attention
  const needsAttention = data.departmentPerformance.reduce((lowest, dept) => 
    dept.efficiencyScore < lowest.efficiencyScore ? dept : lowest,
    data.departmentPerformance[0] || { departmentName: 'None', efficiencyScore: 100 }
  );
  
  // Count overdue sections from bottlenecks
  const overdueCount = data.bottlenecks.filter(b => b.type === 'section' || b.type === 'department').length;
  
  // Generate key insights
  const keyInsights: string[] = [];
  
  if (completionPercentage >= 80) {
    keyInsights.push('Report is nearing completion with strong progress');
  } else if (completionPercentage >= 50) {
    keyInsights.push('Report is at moderate completion level');
  } else {
    keyInsights.push('Report requires significant work to reach completion');
  }
  
  if (data.timeMetrics.onTimeRate >= 80) {
    keyInsights.push('Excellent on-time completion rate');
  } else if (data.timeMetrics.onTimeRate >= 60) {
    keyInsights.push('Moderate on-time completion rate');
  } else {
    keyInsights.push('Poor on-time completion rate needs attention');
  }
  
  if (data.bottlenecks.length > 0) {
    const highImpactBottlenecks = data.bottlenecks.filter(b => b.impactLevel === 'high').length;
    if (highImpactBottlenecks > 0) {
      keyInsights.push(`${highImpactBottlenecks} high-impact bottlenecks require immediate attention`);
    }
  }
  
  if (data.progressPrediction) {
    const daysToCompletion = Math.ceil(
      (data.progressPrediction.estimatedCompletionDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysToCompletion <= 7) {
      keyInsights.push('Report completion expected within a week');
    } else if (daysToCompletion <= 30) {
      keyInsights.push('Report completion expected within a month');
    } else {
      keyInsights.push('Report completion timeline is extended');
    }
  }
  
  return {
    totalSections,
    completedSections,
    completionPercentage,
    overdueCount,
    averageCompletionTime: data.timeMetrics.averageCompletionTime,
    topPerformingDepartment: topPerforming.departmentName,
    needsAttentionDepartment: needsAttention.departmentName,
    keyInsights,
  };
};

/**
 * Download analytics data as a file
 * @param data - Data to download
 * @param filename - Name of the file
 * @param type - File type (csv, json)
 */
export const downloadAnalyticsFile = (
  data: string,
  filename: string,
  type: 'csv' | 'json'
): void => {
  const mimeTypes = {
    csv: 'text/csv',
    json: 'application/json',
  };
  
  const blob = new Blob([data], { type: mimeTypes[type] });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export analytics data and trigger download
 * @param analytics - Analytics data
 * @param report - Report information
 * @param format - Export format
 */
export const exportAndDownloadAnalytics = (
  analytics: AnalyticsData,
  report: ReportWithSections,
  format: 'csv' | 'json' = 'csv'
): void => {
  const reportInfo = {
    id: report.id,
    title: report.title,
  };
  
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${report.title.replace(/[^a-zA-Z0-9]/g, '_')}_analytics_${timestamp}.${format}`;
  
  let data: string;
  
  switch (format) {
    case 'csv':
      data = exportAnalyticsToCSV(analytics, reportInfo);
      break;
    case 'json':
      data = exportAnalyticsToJSON(analytics, reportInfo);
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
  
  downloadAnalyticsFile(data, filename, format);
};

/**
 * Generate a shareable analytics summary
 * @param analytics - Analytics data
 * @param report - Report information
 * @returns Shareable summary object
 */
export const generateShareableAnalyticsSummary = (
  analytics: AnalyticsData,
  report: ReportWithSections
): object => {
  const summary = generateAnalyticsSummary(analytics);
  
  return {
    reportTitle: report.title,
    reportId: report.id,
    generatedAt: new Date().toISOString(),
    summary: {
      completion: {
        percentage: summary.completionPercentage,
        completed: summary.completedSections,
        total: summary.totalSections,
      },
      performance: {
        avgCompletionTime: summary.averageCompletionTime,
        onTimeRate: analytics.timeMetrics.onTimeRate,
        topPerformer: summary.topPerformingDepartment,
      },
      issues: {
        overdueCount: summary.overdueCount,
        bottlenecks: analytics.bottlenecks.length,
        needsAttention: summary.needsAttentionDepartment,
      },
      prediction: analytics.progressPrediction ? {
        estimatedCompletion: analytics.progressPrediction.estimatedCompletionDate,
        confidence: analytics.progressPrediction.confidence,
        remainingWork: analytics.progressPrediction.remainingWork,
      } : null,
    },
    insights: summary.keyInsights,
  };
};

/**
 * Create a text summary of analytics for notifications or emails
 * @param analytics - Analytics data
 * @param report - Report information
 * @returns Text summary
 */
export const generateTextAnalyticsSummary = (
  analytics: AnalyticsData,
  report: ReportWithSections
): string => {
  const summary = generateAnalyticsSummary(analytics);
  
  let text = `Analytics Summary for "${report.title}"\n`;
  text += `Generated: ${new Date().toLocaleString()}\n\n`;
  
  text += `COMPLETION STATUS:\n`;
  text += `• ${summary.completedSections} of ${summary.totalSections} sections completed (${summary.completionPercentage.toFixed(1)}%)\n`;
  text += `• Average completion time: ${summary.averageCompletionTime.toFixed(1)} days\n`;
  text += `• On-time completion rate: ${analytics.timeMetrics.onTimeRate.toFixed(1)}%\n\n`;
  
  text += `DEPARTMENT PERFORMANCE:\n`;
  text += `• Top performer: ${summary.topPerformingDepartment}\n`;
  text += `• Needs attention: ${summary.needsAttentionDepartment}\n\n`;
  
  if (analytics.bottlenecks.length > 0) {
    text += `ISSUES:\n`;
    text += `• ${analytics.bottlenecks.length} bottlenecks identified\n`;
    text += `• ${summary.overdueCount} overdue items\n\n`;
  }
  
  if (analytics.progressPrediction) {
    text += `PREDICTION:\n`;
    text += `• Estimated completion: ${analytics.progressPrediction.estimatedCompletionDate.toLocaleDateString()}\n`;
    text += `• Confidence: ${(analytics.progressPrediction.confidence * 100).toFixed(0)}%\n`;
    text += `• Remaining work: ${analytics.progressPrediction.remainingWork} sections\n\n`;
  }
  
  text += `KEY INSIGHTS:\n`;
  summary.keyInsights.forEach(insight => {
    text += `• ${insight}\n`;
  });
  
  return text;
};