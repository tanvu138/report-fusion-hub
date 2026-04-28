import React from 'react';
import { User } from '@/lib/api/userApiService';
import UserCard from './UserCard';

interface UserGridViewProps {
  users: User[];
  currentUserId?: string;
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onPasswordReset?: (user: User) => void;
  isLoading?: boolean;
}

const UserGridView: React.FC<UserGridViewProps> = ({
  users,
  currentUserId,
  onView,
  onEdit,
  onDelete,
  onPasswordReset,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, index) => (
          <div
            key={index}
            className="bg-white rounded-lg border h-64 animate-pulse"
          >
            <div className="p-6 space-y-4">
              {/* Avatar and header */}
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
              
              {/* Badges */}
              <div className="flex space-x-2">
                <div className="h-6 bg-gray-200 rounded w-20"></div>
                <div className="h-6 bg-gray-200 rounded w-24"></div>
              </div>
              
              {/* Footer info */}
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
            
            {/* Footer buttons */}
            <div className="px-6 pb-6">
              <div className="flex space-x-2">
                <div className="h-8 bg-gray-200 rounded flex-1"></div>
                <div className="h-8 bg-gray-200 rounded flex-1"></div>
                <div className="h-8 bg-gray-200 rounded w-10"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return null; // EmptyState will be handled by parent
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {users.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          currentUserId={currentUserId}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onPasswordReset={onPasswordReset}
        />
      ))}
    </div>
  );
};

export default UserGridView;