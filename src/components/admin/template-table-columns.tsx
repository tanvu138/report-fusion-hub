import { ColumnDef } from '@tanstack/react-table';
import { Eye, Edit, Trash2, Copy, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ReportTemplate } from '@/reportTemplateApiService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ColumnOptions {
  t: (key: string) => string;
  onEdit: (template: ReportTemplate) => void;
  onPreview: (template: ReportTemplate) => void;
  onDelete: (template: ReportTemplate) => void;
  onDuplicate: (template: ReportTemplate) => void;
}

export function getTemplateColumns({ t, onEdit, onPreview, onDelete, onDuplicate }: ColumnOptions): ColumnDef<ReportTemplate>[] {
  return [
    {
      accessorKey: 'name',
      header: t('templates.table.name'),
      cell: ({ row }) => (
        <div className="max-w-[280px]">
          <span className="font-medium line-clamp-1">{row.original.name}</span>
          {row.original.description && (
            <span className="block text-xs text-muted-foreground line-clamp-1 mt-0.5">{row.original.description}</span>
          )}
        </div>
      ),
    },
    {
      id: 'sections',
      header: t('templates.table.sections'),
      size: 100,
      accessorFn: (row) => row.sections.length,
      cell: ({ row }) => {
        const count = row.original.sections.length;
        return <Badge variant="secondary">{count}</Badge>;
      },
    },
    {
      accessorKey: 'updatedAt',
      header: t('templates.table.created'),
      size: 120,
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(getValue<string>()).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: 'actions',
      header: () => <span className="text-right block">{t('templates.table.actions')}</span>,
      size: 80,
      enableSorting: false,
      cell: ({ row }) => {
        const template = row.original;
        return (
          <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onPreview(template)}>
                  <Eye className="h-4 w-4 mr-2" />
                  {t('actions.view')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(template)}>
                  <Edit className="h-4 w-4 mr-2" />
                  {t('actions.edit')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(template)}>
                  <Copy className="h-4 w-4 mr-2" />
                  {t('actions.duplicate')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(template)} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('actions.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
