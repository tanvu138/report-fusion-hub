import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { fetchDepartments, Department } from '@/departmentApiService';
import { PlusCircle, Search, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable } from '@/components/ui/data-table';
import { getDepartmentColumns } from '@/components/admin/department-table-columns';
import DepartmentCreateDialog from '@/components/ui/DepartmentCreateDialog';
import DepartmentDeleteDialog from '@/components/ui/DepartmentDeleteDialog';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { formatError } from '@/utils/errorUtils';

const DepartmentAdminPage: React.FC = () => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  const { data: departments, isLoading, isError, error } = useQuery<Department[], Error>({
    queryKey: ['departments'],
    queryFn: fetchDepartments,
  });

  const filteredDepartments = useMemo(() => {
    if (!departments) return [];
    if (!searchQuery) return departments;
    const q = searchQuery.toLowerCase();
    return departments.filter(d => d.name.toLowerCase().includes(q));
  }, [departments, searchQuery]);

  const columns = useMemo(() => getDepartmentColumns({
    t,
    onDelete: (dept) => { setSelectedDepartment(dept); setIsDeleteDialogOpen(true); },
  }), [t]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-9 w-36 ml-auto" />
        </div>
        <div className="rounded-md border">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3 px-4 border-b last:border-0">
              <Skeleton className="h-4 w-[40%]" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    const formattedError = formatError(error, t('admin.departments.departmentLoading'));
    return (
      <ErrorMessage
        title={formattedError.title}
        message={formattedError.message}
        variant="error"
        onRetry={() => window.location.reload()}
        retryLabel={t('admin.departments.reloadPage')}
      />
    );
  }

  return (
    <>
      <div className="space-y-2">
        {/* Compact toolbar matching Dashboard layout */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <h1 className="text-xl font-semibold text-gray-900 shrink-0">{t('departments.title')}</h1>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('departments.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button variant="create" size="sm" onClick={() => setIsCreateDialogOpen(true)} className="shrink-0">
            <PlusCircle className="w-4 h-4 mr-1.5" />{t('departments.new')}
          </Button>
        </div>

        {/* Empty state or DataTable */}
        {departments && departments.length === 0 ? (
          <div className="text-center py-12">
            <Building className="h-10 w-10 mx-auto text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">{t('departments.notFound')}</h3>
            <p className="mt-1 text-sm text-gray-500">{t('departments.startCreating')}</p>
          </div>
        ) : filteredDepartments.length === 0 ? (
          <div className="text-center py-12">
            <Building className="h-10 w-10 mx-auto text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">{t('departments.notFound')}</h3>
          </div>
        ) : (
          <DataTable columns={columns} data={filteredDepartments} noResultsText={t('departments.notFound')} />
        )}
      </div>

      <DepartmentCreateDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
      <DepartmentDeleteDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} department={selectedDepartment} />
    </>
  );
};

export default DepartmentAdminPage;
