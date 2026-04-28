import React from 'react';
import { format } from 'date-fns';
import { User as UserIcon, Edit, Trash2, Eye, Key, MoreHorizontal, Shield, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, UserRole } from '@/lib/api/userApiService';
import { useLanguage } from '@/contexts/LanguageContext';

interface UserCardProps {
  user: User;
  currentUserId?: string;
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onPasswordReset?: (user: User) => void;
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  currentUserId,
  onView,
  onEdit,
  onDelete,
  onPasswordReset,
}) => {
  const { t } = useLanguage();
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

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    onView(user);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(user);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isCurrentUser) {
      onDelete(user);
    }
  };

  const handlePasswordReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPasswordReset && !isCurrentUser) {
      onPasswordReset(user);
    }
  };

  return (
    <Card className="group hover:shadow-md transition-all duration-200 cursor-pointer border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                {getUserInitials(user.name, user.username)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg leading-tight">{user.name}</h3>
              <p className="text-sm text-gray-600">@{user.username}</p>
              {user.email && (
                <p className="text-sm text-gray-500 truncate">{user.email}</p>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleView}>
                <Eye className="h-4 w-4 mr-2" />
                {t('users.card.viewDetails')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                {t('users.card.editUser')}
              </DropdownMenuItem>
              {onPasswordReset && !isCurrentUser && (
                <DropdownMenuItem onClick={handlePasswordReset}>
                  <Key className="h-4 w-4 mr-2" />
                  {t('users.card.resetPassword')}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleDelete} 
                disabled={isCurrentUser}
                className={isCurrentUser ? "text-gray-400 cursor-not-allowed" : "text-red-600"}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isCurrentUser ? t('users.card.cannotDeleteSelf') : t('users.card.deleteUser')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="py-2">
        <div className="space-y-3">
          {/* Role and Department */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={getRoleBadgeColor(user.role)}>
              <Shield className="h-3 w-3 mr-1" />
              {t(`users.role.${user.role}`)}
            </Badge>
            {user.department && (
              <Badge variant="outline" className="text-xs">
                <Building className="h-3 w-3 mr-1" />
                {user.department.name}
              </Badge>
            )}
          </div>

          {/* User Status Indicators */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div>
              {isCurrentUser && (
                <span className="text-blue-600 font-medium">{t('users.card.currentUser')}</span>
              )}
            </div>
            <div>
              {t('users.card.created')}: {format(new Date(user.createdAt), 'MMM d, yyyy')}
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-2">
        <div className="flex space-x-2 w-full">
          <Button variant="outline" size="sm" onClick={handleView} className="flex-1">
            <Eye className="h-4 w-4 mr-1" />
            {t('actions.view')}
          </Button>
          <Button variant="outline" size="sm" onClick={handleEdit} className="flex-1">
            <Edit className="h-4 w-4 mr-1" />
            {t('actions.edit')}
          </Button>
          {onPasswordReset && !isCurrentUser && (
            <Button variant="outline" size="sm" onClick={handlePasswordReset}>
              <Key className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default UserCard;