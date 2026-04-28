import { ColumnDef } from '@tanstack/react-table';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Department } from '@/departmentApiService';
import DepartmentNameInlineEdit from '@/components/ui/DepartmentNameInlineEdit';

interface ColumnOptions {
  t: (key: string) => string;
  onDelete: (dept: Department) => void;
}

export function getDepartmentColumns({ t, onDelete }: ColumnOptions): ColumnDef<Department>[] {
  return [
    {
      accessorKey: 'name',
      header: t('departments.table.name'),
      cell: ({ row }) => <DepartmentNameInlineEdit department={row.original} />,
    },
    {
      accessorKey: 'createdAt',
      header: t('departments.table.createdAt'),
      size: 130,
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(getValue<string>()).toLocaleDateString()}
        </span>
      ),
    },
    {
      accessorKey: 'updatedAt',
      header: t('departments.table.lastUpdated'),
      size: 130,
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(getValue<string>()).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: 'actions',
      header: () => <span className="text-right block">{t('departments.table.actions')}</span>,
      size: 80,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(row.original)}
            title={t('departments.delete')}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];
}
