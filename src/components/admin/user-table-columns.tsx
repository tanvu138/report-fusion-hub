import { ColumnDef } from '@tanstack/react-table';
import { Eye, Edit, Trash2, Key, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, UserRole } from '@/lib/api/userApiService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ROLE_BADGE_STYLES: Record<string, string> = {
  secretary: 'bg-blue-100 text-blue-700 border-blue-200',
  department: 'bg-green-100 text-green-700 border-green-200',
};

interface ColumnOptions {
  currentUserId?: string;
  t: (key: string) => string;
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onPasswordReset?: (user: User) => void;
}

export function getUserColumns({ currentUserId, t, onView, onEdit, onDelete, onPasswordReset }: ColumnOptions): ColumnDef<User>[] {
  return [
    {
      accessorKey: 'name',
      header: t('users.table.name'),
      cell: ({ row }) => (
        <div className="max-w-[220px]">
          <span className="font-medium line-clamp-1">{row.original.name}</span>
          <span className="block text-xs text-muted-foreground">@{row.original.username}</span>
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: t('users.table.role'),
      size: 120,
      cell: ({ getValue }) => {
        const role = getValue<string>();
        return (
          <Badge variant="outline" className={ROLE_BADGE_STYLES[role] || ''}>
            {t(`users.role.${role}`)}
          </Badge>
        );
      },
    },
    {
      id: 'department',
      header: t('users.table.department'),
      size: 160,
      accessorFn: (row) => row.department?.name || '',
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.department?.name || <span className="text-muted-foreground">—</span>}
        </span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: t('users.table.created'),
      size: 110,
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(getValue<string>()).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: 'actions',
      header: () => <span className="text-right block">{t('users.table.actions')}</span>,
      size: 80,
      enableSorting: false,
      cell: ({ row }) => {
        const user = row.original;
        const isCurrentUser = currentUserId === user.id;
        return (
          <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onView(user)}>
                  <Eye className="h-4 w-4 mr-2" />
                  {t('users.card.viewDetails')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(user)}>
                  <Edit className="h-4 w-4 mr-2" />
                  {t('users.card.editUser')}
                </DropdownMenuItem>
                {onPasswordReset && !isCurrentUser && (
                  <DropdownMenuItem onClick={() => onPasswordReset(user)}>
                    <Key className="h-4 w-4 mr-2" />
                    {t('users.card.resetPassword')}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => !isCurrentUser && onDelete(user)}
                  disabled={isCurrentUser}
                  className={isCurrentUser ? 'text-gray-400 cursor-not-allowed' : 'text-red-600'}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isCurrentUser ? t('users.card.cannotDeleteSelf') : t('users.card.deleteUser')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
