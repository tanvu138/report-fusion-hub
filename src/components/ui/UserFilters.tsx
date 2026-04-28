import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { UserRole } from '@/lib/api/userApiService';
import type { Department } from '@/departmentApiService';

export interface UserFilterState {
  search: string;
  role: string;
  department: string;
  sortBy: 'name' | 'username' | 'role' | 'department' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}

interface UserFiltersProps {
  filters: UserFilterState;
  onFiltersChange: (filters: UserFilterState) => void;
  departments: Department[];
  totalResults: number;
}

const UserFilters: React.FC<UserFiltersProps> = ({
  filters,
  onFiltersChange,
  departments,
  totalResults,
}) => {
  const { t } = useLanguage();
  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleRoleChange = (value: string) => {
    onFiltersChange({ ...filters, role: value === 'all' ? '' : value });
  };

  const handleDepartmentChange = (value: string) => {
    onFiltersChange({ ...filters, department: value === 'all' ? '' : value });
  };

  const handleSortChange = (field: 'sortBy' | 'sortOrder', value: string) => {
    onFiltersChange({ ...filters, [field]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      role: '',
      department: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  };

  const hasActiveFilters = filters.search || filters.role || filters.department;

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.role) count++;
    if (filters.department) count++;
    return count;
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case UserRole.SECRETARY:
        return t('users.roles.secretary');
      case UserRole.DEPARTMENT:
        return t('users.roles.department');
      default:
        return role;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and main controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={t('userFilters.searchPlaceholder')}
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Role filter */}
        <Select value={filters.role || undefined} onValueChange={handleRoleChange}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder={t('userFilters.allRoles')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('userFilters.allRoles')}</SelectItem>
            <SelectItem value={UserRole.SECRETARY}>{t('users.roles.secretary')}</SelectItem>
            <SelectItem value={UserRole.DEPARTMENT}>{t('users.roles.department')}</SelectItem>
          </SelectContent>
        </Select>

        {/* Department filter */}
        <Select value={filters.department || undefined} onValueChange={handleDepartmentChange}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder={t('userFilters.allDepartments')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('userFilters.allDepartments')}</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept.id} value={dept.id}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort controls in popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              <Filter className="h-4 w-4 mr-2" />
              {t('templates.filters.sortAndFilter')}
              {getActiveFilterCount() > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                  {getActiveFilterCount()}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="font-medium">{t('userFilters.sortOptions')}</div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    {t('userFilters.sortBy')}
                  </label>
                  <Select 
                    value={filters.sortBy} 
                    onValueChange={(value) => handleSortChange('sortBy', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">{t('userFilters.sortBy.name')}</SelectItem>
                      <SelectItem value="username">{t('userFilters.sortBy.username')}</SelectItem>
                      <SelectItem value="role">{t('userFilters.sortBy.role')}</SelectItem>
                      <SelectItem value="department">{t('userFilters.sortBy.department')}</SelectItem>
                      <SelectItem value="createdAt">{t('userFilters.sortBy.dateCreated')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    {t('userFilters.sortOrder')}
                  </label>
                  <Select 
                    value={filters.sortOrder} 
                    onValueChange={(value) => handleSortChange('sortOrder', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">{t('templateFilters.sortOrder.ascending')}</SelectItem>
                      <SelectItem value="desc">{t('templateFilters.sortOrder.descending')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="w-full"
                >
                  <X className="h-4 w-4 mr-2" />
                  {t('userFilters.clearFilters')}
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active filters display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600">{t('userFilters.activeFilters')}</span>
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              {t('userFilters.search')} "{filters.search}"
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleSearchChange('')}
              />
            </Badge>
          )}
          {filters.role && (
            <Badge variant="secondary" className="gap-1">
              {t('userFilters.role')} {getRoleName(filters.role)}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleRoleChange('all')}
              />
            </Badge>
          )}
          {filters.department && (
            <Badge variant="secondary" className="gap-1">
              {t('userFilters.department')} {departments.find(d => d.id === filters.department)?.name}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleDepartmentChange('all')}
              />
            </Badge>
          )}
        </div>
      )}

      {/* Results count */}
      <div className="text-sm text-gray-600">
        {totalResults === 1 ? t('userFilters.oneUser') : `${totalResults} ${t('userFilters.users')}`}
        {hasActiveFilters && ` ${t('userFilters.found')}`}
      </div>
    </div>
  );
};

export default UserFilters;