import React from 'react';
import { format } from 'date-fns';
import { User as UserIcon, Shield, Building, Calendar, Mail, AtSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { User, UserRole } from '@/lib/api/userApiService';
import { useLanguage } from '@/contexts/LanguageContext';

interface UserViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  currentUserId?: string;
}

const UserViewModal: React.FC<UserViewModalProps> = ({
  open,
  onOpenChange,
  user,
  currentUserId,
}) => {
  const { t } = useLanguage();
  
  if (!user) {
    return null;
  }

  const isCurrentUser = currentUserId === user.id;

  const getUserInitials = (name: string, username: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return parts[0].substring(0, 2).toUpperCase();
    }
    return username.substring(0, 2).toUpperCase();
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.SECRETARY:
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case UserRole.DEPARTMENT:
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getRoleDescription = (role: UserRole) => {
    switch (role) {
      case UserRole.SECRETARY:
        return t('userView.role.secretary.description');
      case UserRole.DEPARTMENT:
        return t('userView.role.department.description');
      default:
        return t('userView.role.default.description');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserIcon className="h-5 w-5 text-blue-600" />
            <span>{t('userView.title')}</span>
            {isCurrentUser && (
              <Badge variant="outline" className="ml-2">
                {t('userView.currentUser')}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {t('userView.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Profile Section */}
          <div className="flex items-start space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-lg">
                {getUserInitials(user.name, user.username)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <h3 className="text-xl font-semibold">{user.name}</h3>
              <div className="flex items-center space-x-2 text-gray-600">
                <AtSign className="h-4 w-4" />
                <span>{user.username}</span>
              </div>
              {user.email && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Role and Permissions */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>{t('userView.rolePermissions')}</span>
            </h4>
            <div className="space-y-2">
              <Badge className={getRoleBadgeColor(user.role)}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </Badge>
              <p className="text-sm text-gray-600">
                {getRoleDescription(user.role)}
              </p>
            </div>
          </div>

          {/* Department Information */}
          {user.department && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium flex items-center space-x-2">
                  <Building className="h-4 w-4" />
                  <span>{t('userView.departmentAssignment')}</span>
                </h4>
                <div className="space-y-2">
                  <Badge variant="outline">
                    {user.department.name}
                  </Badge>
                  <p className="text-sm text-gray-600">
                    {t('userView.departmentDescription', { departmentName: user.department.name })}
                  </p>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Account Information */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>{t('userView.accountInformation')}</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">{t('userView.userId')}</span>
                <p className="text-gray-600 font-mono text-xs">{user.id}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">{t('userView.accountCreated')}</span>
                <p className="text-gray-600">{format(new Date(user.createdAt), 'PPP')}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">{t('userView.lastUpdated')}</span>
                <p className="text-gray-600">{format(new Date(user.updatedAt), 'PPP')}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">{t('userView.accountStatus')}</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {t('userView.active')}
                </Badge>
              </div>
            </div>
          </div>

          {/* Activity Information (Placeholder for future enhancement) */}
          <Separator />
          <div className="space-y-3">
            <h4 className="font-medium">{t('userView.recentActivity')}</h4>
            <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
              <p>{t('userView.activityPlaceholder1')}</p>
              <p className="mt-1">{t('userView.activityPlaceholder2')}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('userView.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserViewModal;