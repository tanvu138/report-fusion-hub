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
import { userService, CreateUserDto, UserRole, User } from '@/lib/api/userApiService';
import { fetchDepartments, Department } from '@/departmentApiService';

interface UserCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newUser: User, initialPassword?: string) => void;
}

const UserCreateDialog: React.FC<UserCreateDialogProps> = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.DEPARTMENT);
  const [departmentId, setDepartmentId] = useState<string | undefined>(undefined);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && role === UserRole.DEPARTMENT) {
      fetchDepartments() // Fetch all departments for dropdown, assuming it takes no args or defaults for all
        .then(response => setDepartments(response))
        .catch(err => {
          console.error('Failed to fetch departments:', err);
          toast({
            variant: 'destructive',
            title: t('error.title'),
            description: t('users.create.departmentLoadError'),
          });
        });
    }
  }, [isOpen, role, toast]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!username.trim() || !name.trim()) {
        setError(t('users.create.validationError'));
        setIsLoading(false);
        return;
    }

    const userData: CreateUserDto = {
      username,
      name,
      email: email.trim() || undefined,
      password: password.trim() || undefined,
      role,
      departmentId: role === UserRole.DEPARTMENT ? departmentId : undefined,
    };

    try {
      const response = await userService.createUser(userData);
      onSuccess(response.user, response.initialPassword);
      toast({
        title: t('users.create.userCreated'),
        description: response.initialPassword 
          ? t('users.create.userCreatedMessage', { username: response.user.username, password: response.initialPassword })
          : t('users.create.userCreatedMessageNoPassword', { username: response.user.username }),
      });
      onClose(); // Close dialog on success
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: t('users.create.createUserFailed'),
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form on close
  useEffect(() => {
    if (!isOpen) {
      setUsername('');
      setName('');
      setEmail('');
      setPassword('');
      setRole(UserRole.DEPARTMENT);
      setDepartmentId(undefined);
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{t('users.create.title')}</DialogTitle>
          <DialogDescription>
            {t('users.create.description')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              {t('users.create.username')}
            </Label>
            <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              {t('users.create.fullName')}
            </Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              {t('users.create.email')}
            </Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">
              {t('users.create.password')}
            </Label>
            <Input id="password" type="text" value={password} onChange={(e) => setPassword(e.target.value)} className="col-span-3" placeholder={t('users.create.passwordPlaceholder')} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              {t('users.create.role')}
            </Label>
            <Select value={role} onValueChange={(value) => setRole(value as UserRole)} >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder={t('users.create.selectRole')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UserRole.DEPARTMENT}>Department</SelectItem>
                <SelectItem value={UserRole.SECRETARY}>Secretary</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {role === UserRole.DEPARTMENT && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department" className="text-right">
                {t('users.create.department')}
              </Label>
              <Select value={departmentId} onValueChange={setDepartmentId} >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={t('users.create.selectDepartment')} />
                </SelectTrigger>
                <SelectContent>
                  {departments.length === 0 && <SelectItem value="loading" disabled>{t('users.create.loadingDepartments')}</SelectItem>}
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {error && (
            <p className="col-span-4 text-sm text-red-600 bg-red-100 p-2 rounded-md">{error}</p>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={onClose}>{t('users.create.cancel')}</Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t('users.create.creating') : t('users.create.createUser')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserCreateDialog;
