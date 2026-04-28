import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchReportTemplates, ReportTemplate, duplicateReportTemplate } from '@/reportTemplateApiService';
import { fetchDepartments } from '@/departmentApiService';
import { PlusCircle, Search, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { getTemplateColumns } from '@/components/admin/template-table-columns';
import TemplateCreateModal from '@/components/ui/TemplateCreateModal';
import TemplateEditModal from '@/components/ui/TemplateEditModal';
import ReportTemplateDeleteDialog from '@/components/ui/ReportTemplateDeleteDialog';
import ReportTemplatePreviewDialog from '@/components/ui/ReportTemplatePreviewDialog';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { formatError } from '@/utils/errorUtils';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

const ReportTemplateAdminPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ReportTemplate | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);

  const { data: templates, isLoading, isError, error } = useQuery({
    queryKey: ['reportTemplates'],
    queryFn: fetchReportTemplates,
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: fetchDepartments,
  });

  const filteredTemplates = useMemo(() => {
    if (!templates) return [];
    let filtered = [...templates];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(tpl =>
        tpl.name.toLowerCase().includes(q) ||
        (tpl.description && tpl.description.toLowerCase().includes(q))
      );
    }
    if (departmentFilter) {
      filtered = filtered.filter(tpl =>
        tpl.sections.some(s => s.departmentId === departmentFilter)
      );
    }
    return filtered;
  }, [templates, searchQuery, departmentFilter]);

  const handlePreview = (tpl: ReportTemplate) => { setSelectedTemplate(tpl); setIsPreviewDialogOpen(true); };
  const handleDelete = (tpl: ReportTemplate) => { setSelectedTemplate(tpl); setIsDeleteDialogOpen(true); };

  const duplicateMutation = useMutation({
    mutationFn: duplicateReportTemplate,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reportTemplates'] });
      toast({ title: t('toast.templateDuplicated'), description: `Created "${data.name}".` });
    },
    onError: (err: Error) => {
      toast({ title: t('toast.duplicationFailed'), description: err.message, variant: 'destructive' });
    },
  });

  const columns = useMemo(
    () => getTemplateColumns({
      t,
      onEdit: (tpl) => setEditingTemplate(tpl),
      onPreview: handlePreview,
      onDelete: handleDelete,
      onDuplicate: (tpl) => duplicateMutation.mutate(tpl.id),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handlers use stable state setters
    [t],
  );

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-9 w-44" />
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-9 w-36 ml-auto" />
        </div>
        <div className="rounded-md border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3 px-4 border-b last:border-0">
              <Skeleton className="h-4 w-[40%]" />
              <Skeleton className="h-5 w-12 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    const formattedError = formatError(error, 'Template Loading');
    return (
      <ErrorMessage
        title={formattedError.title}
        message={formattedError.message}
        variant="error"
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <>
      <div className="space-y-2">
        {/* Compact toolbar matching Dashboard layout */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <h1 className="text-xl font-semibold text-gray-900 shrink-0">{t('templates.title')}</h1>
          <Select value={departmentFilter || 'all'} onValueChange={(v) => setDepartmentFilter(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-auto min-w-[140px] max-w-[200px]">
              <SelectValue placeholder={t('templates.filters.allDepartments')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('templates.filters.allDepartments')}</SelectItem>
              {departments?.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('templates.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button variant="create" size="sm" onClick={() => setShowCreateModal(true)} className="shrink-0">
            <PlusCircle className="w-4 h-4 mr-1.5" />{t('templates.new')}
          </Button>
        </div>

        {/* Empty state or DataTable */}
        {templates && templates.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-10 w-10 mx-auto text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">{t('departments.notFound')}</h3>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-10 w-10 mx-auto text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">{t('departments.notFound')}</h3>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredTemplates}
            onRowClick={handlePreview}
            rowAriaLabel={(tpl) => `${t('actions.view')}: ${tpl.name}`}
            noResultsText={t('departments.notFound')}
          />
        )}
      </div>

      <TemplateCreateModal open={showCreateModal} onOpenChange={setShowCreateModal} />
      <TemplateEditModal
        open={!!editingTemplate}
        onOpenChange={(open) => !open && setEditingTemplate(null)}
        template={editingTemplate}
      />
      {selectedTemplate && isDeleteDialogOpen && (
        <ReportTemplateDeleteDialog
          open={isDeleteDialogOpen}
          onOpenChange={(open) => { setIsDeleteDialogOpen(open); if (!open) setSelectedTemplate(null); }}
          template={selectedTemplate}
        />
      )}
      {selectedTemplate?.id && isPreviewDialogOpen && (
        <ReportTemplatePreviewDialog
          open={isPreviewDialogOpen}
          onOpenChange={(open) => { setIsPreviewDialogOpen(open); if (!open) setSelectedTemplate(null); }}
          templateId={selectedTemplate.id}
        />
      )}
    </>
  );
};

export default ReportTemplateAdminPage;
