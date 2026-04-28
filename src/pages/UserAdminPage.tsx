import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { PlusCircle, Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { getUserColumns } from '@/components/admin/user-table-columns';
import { userService, User, UserRole, GetUsersParams } from '@/lib/api/userApiService';
import { fetchDepartments } from '@/departmentApiService';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import UserCreateDialog from '@/components/ui/UserCreateDialog';
import UserEditDialog from '@/components/ui/UserEditDialog';
import UserDeleteDialog from '@/components/ui/UserDeleteDialog';
import UserViewModal from '@/components/ui/UserViewModal';
import PasswordResetDialog from '@/components/ui/PasswordResetDialog';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { formatError } from '@/utils/errorUtils';

const UserAdminPage: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  // Data state
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('');

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [isPasswordResetOpen, setIsPasswordResetOpen] = useState(false);

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: fetchDepartments,
  });

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: GetUsersParams = { limit: 1000 };
      const response = await userService.getUsers(params);
      setUsers(response.users);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('admin.userManagement.failedToFetch');
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    let filtered = [...users];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q))
      );
    }
    if (roleFilter !== 'ALL') {
      filtered = filtered.filter(u => u.role === roleFilter);
    }
    if (departmentFilter) {
      filtered = filtered.filter(u => u.departmentId === departmentFilter);
    }
    return filtered;
  }, [users, searchQuery, roleFilter, departmentFilter]);

  const handleView = (user: User) => { setViewingUser(user); setIsViewDialogOpen(true); };
  const handleEdit = (user: User) => { setEditingUser(user); setIsEditDialogOpen(true); };
  const handleDelete = (user: User) => {
    if (currentUser && user.id === currentUser.id) {
      toast({ title: t('admin.userManagement.cannotDeleteSelf'), description: t('admin.userManagement.cannotDeleteSelfDesc'), variant: 'destructive' });
      return;
    }
    setDeletingUser(user);
    setIsDeleteDialogOpen(true);
  };
  const handlePasswordResetClick = (user: User) => { setResetPasswordUser(user); setIsPasswordResetOpen(true); };

  const handlePasswordReset = async (userId: string): Promise<{ newPassword: string }> => {
    const newPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    return Promise.resolve({ newPassword });
  };

  const handleCreateUserSuccess = (newUser: User, initialPassword?: string) => {
    setIsCreateDialogOpen(false);
    fetchUsers();
    toast({
      title: t('admin.userManagement.userCreated'),
      description: t('admin.userManagement.userCreatedDesc', { username: newUser.username }) +
        (initialPassword ? t('admin.userManagement.initialPassword', { password: initialPassword }) : ''),
      duration: initialPassword ? 10000 : 5000,
    });
  };

  const handleDeleteUserSuccess = () => {
    setIsDeleteDialogOpen(false);
    setDeletingUser(null);
    fetchUsers();
    toast({ title: t('admin.userManagement.userDeleted'), description: t('admin.userManagement.userDeletedDesc') });
  };

  const handleEditUserSuccess = (editedUser: User) => {
    setIsEditDialogOpen(false);
    setEditingUser(null);
    fetchUsers();
    toast({ title: t('admin.userManagement.userUpdated'), description: t('admin.userManagement.userUpdatedDesc', { username: editedUser.username }) });
  };

  const columns = useMemo(
    () => getUserColumns({
      currentUserId: currentUser?.id,
      t,
      onView: handleView,
      onEdit: handleEdit,
      onDelete: handleDelete,
      onPasswordReset: handlePasswordResetClick,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handlers use stable state setters; currentUser?.id covers the only varying ref
    [currentUser?.id, t],
  );

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-9 w-36 ml-auto" />
        </div>
        <div className="rounded-md border">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3 px-4 border-b last:border-0">
              <Skeleton className="h-4 w-[30%]" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-8 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    const formattedError = formatError(new Error(error), t('admin.userManagement.errorFetching'));
    return (
      <ErrorMessage
        title={formattedError.title}
        message={formattedError.message}
        variant="error"
        onRetry={fetchUsers}
      />
    );
  }

  return (
    <>
      <div className="space-y-2">
        {/* Compact toolbar matching Dashboard layout */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <h1 className="text-xl font-semibold text-gray-900 shrink-0">{t('admin.userManagement.title')}</h1>
          <Tabs value={roleFilter} onValueChange={(v) => setRoleFilter(v as typeof roleFilter)} className="w-auto">
            <TabsList>
              <TabsTrigger value="ALL">{t('userFilters.allRoles')}</TabsTrigger>
              <TabsTrigger value={UserRole.SECRETARY}>{t('users.role.secretary')}</TabsTrigger>
              <TabsTrigger value={UserRole.DEPARTMENT}>{t('users.role.department')}</TabsTrigger>
            </TabsList>
          </Tabs>
          <Select value={departmentFilter || 'all'} onValueChange={(v) => setDepartmentFilter(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-auto min-w-[140px] max-w-[200px]">
              <SelectValue placeholder={t('userFilters.allDepartments')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('userFilters.allDepartments')}</SelectItem>
              {departments?.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('userFilters.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button variant="create" size="sm" onClick={() => setIsCreateDialogOpen(true)} className="shrink-0">
            <PlusCircle className="w-4 h-4 mr-1.5" />{t('admin.userManagement.createUser')}
          </Button>
        </div>

        {/* Empty state or DataTable */}
        {users.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-10 w-10 mx-auto text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">{t('admin.userManagement.noUsersYet')}</h3>
            <p className="mt-1 text-sm text-gray-500">{t('admin.userManagement.noUsersYetDesc')}</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-10 w-10 mx-auto text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">{t('departments.notFound')}</h3>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredUsers}
            onRowClick={handleView}
            rowAriaLabel={(user) => `${t('users.card.viewDetails')}: ${user.name}`}
            noResultsText={t('departments.notFound')}
          />
        )}
      </div>

      {/* Dialogs */}
      {isCreateDialogOpen && (
        <UserCreateDialog
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          onSuccess={handleCreateUserSuccess}
        />
      )}
      {editingUser && isEditDialogOpen && (
        <UserEditDialog
          user={editingUser}
          isOpen={isEditDialogOpen}
          onClose={() => { setIsEditDialogOpen(false); setEditingUser(null); }}
          onSuccess={handleEditUserSuccess}
        />
      )}
      {deletingUser && isDeleteDialogOpen && (
        <UserDeleteDialog
          user={deletingUser}
          isOpen={isDeleteDialogOpen}
          onClose={() => { setIsDeleteDialogOpen(false); setDeletingUser(null); }}
          onSuccess={handleDeleteUserSuccess}
        />
      )}
      {viewingUser && (
        <UserViewModal
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
          user={viewingUser}
          currentUserId={currentUser?.id}
        />
      )}
      {resetPasswordUser && (
        <PasswordResetDialog
          open={isPasswordResetOpen}
          onOpenChange={setIsPasswordResetOpen}
          user={resetPasswordUser}
          onPasswordReset={handlePasswordReset}
        />
      )}
    </>
  );
};

export default UserAdminPage;
