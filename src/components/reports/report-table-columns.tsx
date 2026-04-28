import { ColumnDef } from '@tanstack/react-table';
import { Eye, Edit, Trash2, CheckCircle, Clock, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Report } from '@/lib/api/reports';
import ExportDropdown from '@/components/reports/ExportDropdown';

const STATE_BADGE_STYLES: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 border-gray-300',
  SUBMITTED: 'bg-blue-100 text-blue-700 border-blue-300',
  FINAL: 'bg-amber-100 text-amber-700 border-amber-300',
  PUBLISHED: 'bg-green-100 text-green-700 border-green-300',
};

interface ColumnOptions {
  isSecretary: boolean;
  departmentId?: string;
  t: (key: string, params?: Record<string, string>) => string;
  onNavigate: (id: string) => void;
  onDelete: (report: Report) => void;
  onSettings?: (id: string) => void;
}

export function getReportColumns({ isSecretary, departmentId, t, onNavigate, onDelete, onSettings }: ColumnOptions): ColumnDef<Report>[] {
  return [
    {
      accessorKey: 'title',
      header: t('dashboard.table.title'),
      cell: ({ row }) => (
        <div className="max-w-[300px]">
          <span className="font-medium line-clamp-1">{row.original.title}</span>
          {row.original.description && (
            <span className="block text-xs text-muted-foreground line-clamp-1 mt-0.5">{row.original.description}</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'cycle',
      header: t('dashboard.table.cycle'),
      size: 90,
      cell: ({ getValue }) => <span className="text-sm">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'state',
      header: t('dashboard.table.state'),
      size: 100,
      cell: ({ getValue }) => {
        const state = getValue<string>();
        return <Badge variant="outline" className={STATE_BADGE_STYLES[state] || ''}>{state}</Badge>;
      },
    },
    {
      id: 'progress',
      header: isSecretary ? t('dashboard.table.progress') : t('dashboard.table.sections'),
      size: 140,
      enableSorting: false,
      cell: ({ row }) => {
        const report = row.original;
        if (isSecretary) {
          const progress = report._progress;
          if (!progress || progress.total === 0) return <span className="text-xs text-gray-400">—</span>;
          const pct = Math.round((progress.submitted / progress.total) * 100);
          return (
            <div className="space-y-1">
              <Progress value={pct} className={`h-1.5 w-20 ${pct === 100 ? '[&>div]:bg-green-500' : pct > 0 ? '[&>div]:bg-amber-500' : ''}`} />
              <span className={`text-xs ${pct === 100 ? 'text-green-600' : pct > 0 ? 'text-amber-600' : 'text-gray-500'}`}>
                {pct === 100
                  ? t('dashboard.progress.complete')
                  : t('dashboard.progress.submitted', { submitted: String(progress.submitted), total: String(progress.total) })}
              </span>
            </div>
          );
        }
        const deptSections = report.sections?.filter(s => departmentId && s.departmentId === departmentId) || [];
        const completed = deptSections.filter(s => s.contentMarkdown?.trim());
        if (deptSections.length === 0) return <span className="text-xs text-gray-400">—</span>;
        return (
          <div className="flex items-center gap-1.5">
            {completed.length === deptSections.length
              ? <CheckCircle className="w-3.5 h-3.5 text-green-600" />
              : <Clock className="w-3.5 h-3.5 text-amber-500" />}
            <span className="text-xs">
              {t('dashboard.yourSections', { completed: completed.length.toString(), total: deptSections.length.toString() })}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: t('dashboard.table.created'),
      size: 100,
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">{new Date(getValue<string>()).toLocaleDateString()}</span>
      ),
    },
    {
      id: 'actions',
      header: () => <span className="text-right block">{t('dashboard.table.actions')}</span>,
      size: 120,
      enableSorting: false,
      cell: ({ row }) => {
        const report = row.original;
        return (
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onNavigate(report.id)} title={t('dashboard.viewReport')}>
              <Eye className="w-4 h-4" />
            </Button>
            {!isSecretary && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onNavigate(report.id)} title={t('dashboard.edit')}>
                <Edit className="w-4 h-4" />
              </Button>
            )}
            {isSecretary && (
              <>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onSettings?.(report.id)} title={t('reports.navigation.settings')} aria-label={t('reports.navigation.settings')}>
                  <Settings className="w-4 h-4" />
                </Button>
                <ExportDropdown reportId={report.id} reportTitle={report.title} />
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(report)} title={t('dashboard.delete')}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];
}
