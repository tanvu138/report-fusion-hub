import React, { useState, useEffect, FormEvent } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { userService, User, UserRole, UpdateUserDto } from '@/lib/api/userApiService';
import { fetchDepartments, Department } from '@/departmentApiService';

interface UserEditDialogProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedUser: User) => void;
}

const UserEditDialog: React.FC<UserEditDialogProps> = ({ user, isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.DEPARTMENT);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [departmentId, setDepartmentId] = useState<string | undefined>(undefined);
  const [initialDepartmentId, setInitialDepartmentId] = useState<string | undefined>(undefined);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [departmentsLoaded, setDepartmentsLoaded] = useState(false);

  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setRole(user.role);
      const userDeptId = user.departmentId || undefined;
      setDepartmentId(userDeptId);
      setInitialDepartmentId(userDeptId);
    }
  }, [user]);

  useEffect(() => {
    // Load departments when dialog opens and user has department role (including initially)
    if (isOpen && (role === UserRole.DEPARTMENT || (user && user.role === UserRole.DEPARTMENT)) && departments.length === 0 && !departmentsLoaded) {
      fetchDepartments()
        .then(response => {
          setDepartments(response);
          setDepartmentsLoaded(true);
        })
        .catch(err => {
          console.error('Failed to fetch departments:', err);
          toast({
            variant: 'destructive',
            title: t('common.error'),
            description: t('users.edit.departmentLoadError'),
          });
          setDepartmentsLoaded(true); // Mark loading as attempted
        });
    }
  }, [isOpen, role, user, toast, departments.length, departmentsLoaded]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    setError(null);

    // ---------------------------
    // Front-end validations
    // ---------------------------
    if (password || confirmPassword) {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setIsLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long');
        setIsLoading(false);
        return;
      }
    }

    if (role === UserRole.DEPARTMENT && !departmentId) {
      // Only require department selection if user doesn't already have one or if they're changing from secretary to department
      if (!initialDepartmentId || user.role !== UserRole.DEPARTMENT) {
        setError('Please select a department');
        setIsLoading(false);
        return;
      }
    }

    // ---------------------------
    // Build payload – only include changed fields
    // ---------------------------
    const updateData: UpdateUserDto = {};

    const trimmedName = name.trim();
    if (trimmedName && trimmedName !== user.name) {
      updateData.name = trimmedName;
    }

    const trimmedEmail = email.trim();
    if (trimmedEmail !== (user.email || '')) {
      updateData.email = trimmedEmail || undefined;
    }

    if (role !== user.role) {
      updateData.role = role;
    }

    if (role === UserRole.DEPARTMENT) {
      // Only send departmentId if it actually changed
      if (departmentId && departmentId !== initialDepartmentId) {
        updateData.departmentId = departmentId;
      }
    } else {
      // If changing from department user -> secretary, explicitly clear department
      if (user.role === UserRole.DEPARTMENT) {
        updateData.departmentId = null;
      }
    }

    if (password) {
      updateData.password = password;
    }

    // If nothing has changed, give feedback and exit early
    if (Object.keys(updateData).length === 0) {
      toast({ title: t('error.noChangesDetected') });
      setIsLoading(false);
      return;
    }

    try {
      const updatedUser = await userService.updateUser(user.id, updateData);
      onSuccess(updatedUser);
      toast({
        title: t('toast.userUpdated'),
        description: t('users.edit.userUpdatedSuccess', { username: updatedUser.username }),
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: t('users.edit.updateFailed'),
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
      setPassword('');
      setConfirmPassword('');
    }
  };
  
  // Reset form on close or user change
  useEffect(() => {
    if (!isOpen) {
      setDepartmentsLoaded(false); // Reset when dialog closes
        // Don't reset fields immediately if user prop changes while open, 
        // only reset on explicit close to avoid data loss during brief prop updates.
        // The main data sync is handled by the useEffect depending on [user]
        setError(null);
        setIsLoading(false);
    } else if (user) {
        // If dialog is open and user prop changes, re-initialize form
        setName(user.name || '');
        setEmail(user.email || '');
        setRole(user.role);
        const userDeptId = user.departmentId || undefined;
        setDepartmentId(userDeptId);
        setInitialDepartmentId(userDeptId);
        if (user.role !== UserRole.DEPARTMENT) {
          setDepartmentsLoaded(false); // Reset if role is not department
        } else {
          // If role IS department, the other useEffect will fetch and set departmentsLoaded
          // We might want to set it to false here initially if user changes TO department role
          // to ensure the key changes, but the existing fetch logic should handle it.
        }
        setError(null); // Clear previous errors
    }
  }, [isOpen, user]);

  if (!user) return null; // Or some loading/error state if user is unexpectedly null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[560px]">
        <DialogHeader>
          <DialogTitle>Edit User: {user.username}</DialogTitle>
          <DialogDescription>
            Update the details for this user. Username cannot be changed.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username-display" className="text-right">
              Username
            </Label>
            <Input id="username-display" value={user.username} className="col-span-3" readOnly disabled />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Full Name
            </Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">
              New Password
            </Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="col-span-3" placeholder={t('forms.passwordPlaceholder')} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="confirmPassword" className="text-right">
              Confirm Password
            </Label>
            <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="col-span-3" placeholder={t('forms.confirmPasswordPlaceholder')} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Role
            </Label>
            <Select value={role} onValueChange={(value) => setRole(value as UserRole)} >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder={t('forms.selectRole')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UserRole.DEPARTMENT}>{t('users.roles.department')}</SelectItem>
                <SelectItem value={UserRole.SECRETARY}>{t('users.roles.secretary')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {role === UserRole.DEPARTMENT && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department" className="text-right">
                Department
              </Label>
              <Select value={departmentId || ''} onValueChange={setDepartmentId} >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={
                    departments.length === 0 
                      ? (user?.department?.name ? `Current: ${user.department.name}` : "Loading departments...")
                      : "Select a department"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {departments.length === 0 ? (
                    <>
                      {user?.department && user.departmentId && (
                        <SelectItem value={user.departmentId} disabled>
                          {user.department.name} (Current)
                        </SelectItem>
                      )}
                      <SelectItem value="__loading__" disabled>Loading departments...</SelectItem>
                    </>
                  ) : (
                    departments.map(dept => (
                      <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
          {/* Reserve space for potential error message without shifting layout */}
          <div className="w-full min-h-[44px] flex items-center justify-center">
            {error && (
              <p className="text-sm text-red-600 bg-red-100 p-2 rounded-md text-center" role="alert">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserEditDialog;
