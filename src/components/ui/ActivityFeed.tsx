/**
 * ActivityFeed Component - Recent activity feed for transparency
 * 
 * Displays recent updates, submissions, and changes in the report
 * with proper formatting and i18n support
 * 
 * Created: 2025-07-09
 * Feature: Issue #15 - Recent Activity Feed
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  FileText, 
  Send, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  User,
  MoreHorizontal
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ActivityFeedProps, ActivityItem } from '@/types/reportManagement';
import { cn } from '@/lib/utils';

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  loading = false,
  maxItems = 10,
  onLoadMore,
  hasMore = false
}) => {
  const { t, language } = useLanguage();

  // Format relative time
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return t('activity.timeAgo.justNow');
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return t('activity.timeAgo.minutesAgo', { minutes: diffInMinutes });
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return t('activity.timeAgo.hoursAgo', { hours: diffInHours });
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return t('activity.timeAgo.daysAgo', { days: diffInDays });
    }
    
    // For older items, show formatted date
    return new Date(date).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: diffInDays > 365 ? 'numeric' : undefined
    });
  };

  // Get activity icon based on type
  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'section_update':
        return <FileText className="w-4 h-4" />;
      case 'section_submit':
        return <CheckCircle className="w-4 h-4" />;
      case 'report_update':
        return <Activity className="w-4 h-4" />;
      case 'reminder_sent':
        return <Send className="w-4 h-4" />;
      case 'status_change':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  // Get activity color based on type
  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'section_update':
        return 'text-blue-600 bg-blue-50';
      case 'section_submit':
        return 'text-green-600 bg-green-50';
      case 'report_update':
        return 'text-purple-600 bg-purple-50';
      case 'reminder_sent':
        return 'text-orange-600 bg-orange-50';
      case 'status_change':
        return 'text-amber-600 bg-amber-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // Get activity type label
  const getActivityTypeLabel = (type: ActivityItem['type']) => {
    switch (type) {
      case 'section_update':
        return t('activity.types.sectionUpdate');
      case 'section_submit':
        return t('activity.types.sectionSubmit');
      case 'report_update':
        return t('activity.types.reportUpdate');
      case 'reminder_sent':
        return t('activity.types.reminderSent');
      case 'status_change':
        return t('activity.types.statusChange');
      default:
        return t('activity.types.unknown');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            {t('activity.title')}
          </CardTitle>
          <CardDescription>
            {t('activity.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full skeleton-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded skeleton-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-2/3 skeleton-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayedActivities = activities.slice(0, maxItems);
  const remainingCount = activities.length - displayedActivities.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              {t('activity.title')}
            </CardTitle>
            <CardDescription>
              {t('activity.description')}
            </CardDescription>
          </div>
          {activities.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activities.length} {t('activity.items')}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {displayedActivities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">{t('activity.noActivity')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedActivities.map((activity, index) => (
              <div
                key={activity.id}
                className={cn(
                  "flex items-start space-x-3 p-3 rounded-lg transition-colors",
                  "hover:bg-gray-50 group",
                  index === 0 && "bg-blue-50/50" // Highlight most recent
                )}
              >
                {/* Activity Icon */}
                <div className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                  getActivityColor(activity.type)
                )}>
                  {getActivityIcon(activity.type)}
                </div>

                {/* Activity Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant="outline"
                        className="text-xs"
                      >
                        {getActivityTypeLabel(activity.type)}
                      </Badge>
                      {activity.departmentName && (
                        <Badge variant="secondary" className="text-xs">
                          {activity.departmentName}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(activity.timestamp)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-900 mb-1">
                    {activity.description}
                  </p>

                  {activity.sectionName && (
                    <p className="text-xs text-muted-foreground mb-1">
                      {t('activity.section')}: {activity.sectionName}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                      <User className="w-3 h-3" />
                      <span>{activity.userName}</span>
                    </div>
                    
                    {activity.metadata?.wordCount && (
                      <span className="text-xs text-muted-foreground">
                        {t('activity.wordCount', { count: activity.metadata.wordCount })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Load More / Show More */}
            {(remainingCount > 0 || hasMore) && (
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  {remainingCount > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {t('activity.showingRecent', { count: displayedActivities.length, total: activities.length })}
                    </p>
                  )}
                  {onLoadMore && hasMore && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onLoadMore}
                      className="touch-target"
                    >
                      <MoreHorizontal className="w-4 h-4 mr-2" />
                      {t('activity.loadMore')}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;