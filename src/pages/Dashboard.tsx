import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, FileText, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getReports, Report, PaginatedResponse } from '@/lib/api/reports';
import ReportDeleteDialog from '@/components/ui/ReportDeleteDialog';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable } from '@/components/ui/data-table';
import { getReportColumns } from '@/components/reports/report-table-columns';
import DepartmentWelcomeCard from '@/components/reports/department-welcome-card';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { formatError } from '@/utils/errorUtils';

interface ReportsState {
  reports: Report[];
  loading: boolean;
  error: string | null;
  pagination: PaginatedResponse['pagination'] | null;
}

const Dashboard = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading } = useAuth();

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'DRAFT' | 'PUBLISHED' | 'FINAL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null);
  const [reportsState, setReportsState] = useState<ReportsState>({
    reports: [], loading: true, error: null, pagination: null,
  });

  const isSecretary = user?.role === 'secretary';

  const fetchReports = () => {
    if (!user) return;
    setReportsState(prev => ({ ...prev, loading: true, error: null }));
    getReports({ page: 1, limit: 50 })
      .then(response => setReportsState({
        reports: response.reports, loading: false, error: null, pagination: response.pagination,
      }))
      .catch(error => {
        const formatted = formatError(error, 'Reports Loading');
        setReportsState(prev => ({ ...prev, loading: false, error: formatted.message }));
      });
  };

  useEffect(() => { fetchReports(); }, [user]);

  const filteredReports = reportsState.reports.filter(report => {
    const matchesFilter = activeFilter === 'ALL' || report.state === activeFilter;
    const matchesSearch = !searchQuery || report.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleReportDeleted = (reportId: string) => {
    setReportsState(prev => ({ ...prev, reports: prev.reports.filter(r => r.id !== reportId) }));
  };

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-muted-foreground">{t('dashboard.loginRequired')}</p>
      </div>
    );
  }

  // Empty/error/loading states
  const renderEmptyState = () => {
    if (reportsState.loading) {
      return (
        <div className="rounded-md border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3 px-4 border-b last:border-0">
              <Skeleton className="h-4 w-[40%]" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-1.5 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </div>
      );
    }

    if (reportsState.error) {
      if (reportsState.error.includes('No reports exist')) {
        return (
          <div className="text-center py-12">
            <FileText className="h-10 w-10 mx-auto text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {t(isSecretary ? 'dashboard.noReportsInDatabase' : 'dashboard.noReportsAvailable.title')}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {t(isSecretary ? 'dashboard.noReportsInDatabaseDesc' : 'dashboard.noReportsAvailable.description')}
            </p>
          </div>
        );
      }
      return <ErrorMessage title={t('dashboard.loadError')} message={reportsState.error} variant="error" onRetry={fetchReports} />;
    }

    if (reportsState.reports.length === 0) {
      return (
        <div className="text-center py-12">
          <FileText className="h-10 w-10 mx-auto text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {t(isSecretary ? 'dashboard.noReports' : 'dashboard.noReportsAssigned.title')}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {t(isSecretary ? 'dashboard.getStarted' : 'dashboard.noReportsAssigned.description')}
          </p>
        </div>
      );
    }

    if (filteredReports.length === 0) {
      return (
        <div className="text-center py-12">
          <FileText className="h-10 w-10 mx-auto text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">{t('dashboard.noFilterResults')}</h3>
        </div>
      );
    }

    return null;
  };

  const emptyState = renderEmptyState();

  const columns = useMemo(() => getReportColumns({
    isSecretary,
    departmentId: user.departmentId,
    t,
    onNavigate: (id) => navigate(`/reports/${id}`),
    onDelete: (r) => { setReportToDelete(r); setIsDeleteDialogOpen(true); },
    onSettings: (id) => navigate(`/reports/${id}?tab=settings`),
  }), [isSecretary, user.departmentId, t, navigate]);

  return (
    <>
      <div className="space-y-2">
        {!isSecretary && <DepartmentWelcomeCard />}

        {/* Compact toolbar: title + filters + search + create */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <h1 className="text-xl font-semibold text-gray-900 shrink-0">{t('dashboard.reportsTitle')}</h1>
          {isSecretary && (
            <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as typeof activeFilter)} className="w-auto">
              <TabsList>
                <TabsTrigger value="ALL">{t('dashboard.filter.all')}</TabsTrigger>
                <TabsTrigger value="DRAFT">{t('dashboard.filter.draft')}</TabsTrigger>
                <TabsTrigger value="PUBLISHED">{t('dashboard.filter.published')}</TabsTrigger>
                <TabsTrigger value="FINAL">{t('dashboard.filter.final')}</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t('dashboard.search.placeholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8" />
          </div>
          {isSecretary && (
            <Button variant="create" size="sm" onClick={() => navigate('/reports/create')} className="shrink-0">
              <PlusCircle className="w-4 h-4 mr-1.5" />{t('nav.newReport')}
            </Button>
          )}
        </div>

        {emptyState || (
          <DataTable
            columns={columns}
            data={filteredReports}
            onRowClick={(report) => navigate(`/reports/${report.id}`)}
            rowAriaLabel={(report) => `${t('dashboard.viewReport')}: ${report.title}`}
            noResultsText={t('dashboard.noResults')}
          />
        )}
      </div>

      <ReportDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => { setIsDeleteDialogOpen(open); if (!open) setReportToDelete(null); }}
        report={reportToDelete}
        onReportDeleted={handleReportDeleted}
      />
    </>
  );
};

export default Dashboard;
