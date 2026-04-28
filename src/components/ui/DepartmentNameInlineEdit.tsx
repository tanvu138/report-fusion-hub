import React, { useState, useRef, useEffect } from 'react';
import { Pencil, X, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateDepartmentApi, Department } from '@/departmentApiService';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface DepartmentNameInlineEditProps {
  department: Department;
}

const DepartmentNameInlineEdit: React.FC<DepartmentNameInlineEditProps> = ({ department }) => {
  const { t } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(department.name);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);

  const mutation = useMutation({
    mutationFn: (newName: string) => updateDepartmentApi(department.id, { name: newName }),
    onSuccess: (updatedDepartment) => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setEditing(false);
      setError(null);
      toast({
        title: t('common.success'),
        description: t('departments.toast.updateSuccess', { name: updatedDepartment.name }),
      });
    },
    onError: (err: Error) => {
      setError(err.message || t('departments.toast.updateError'));
      toast({
        title: t('common.error'),
        description: err.message || t('departments.toast.updateError'),
        variant: 'destructive',
      });
    },
  });

  const handleEdit = () => {
    setEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setEditing(false);
    setName(department.name);
    setError(null);
  };

  const handleSave = () => {
    if (!name.trim()) {
      setError(t('departments.create.nameLabel') + ' ' + t('common.required'));
      return;
    }
    if (name.trim() === department.name.trim()) {
      setEditing(false);
      setError(null);
      return;
    }
    mutation.mutate(name.trim());
  };

  useEffect(() => {
    if (editing) {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          handleCancel();
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [editing]);


  return (
    <div ref={containerRef} className="relative">
      {/* Non-editing view (also acts as a placeholder to keep column width) */}
      <div 
        className="flex items-center gap-2 group"
        style={{ visibility: editing ? 'hidden' : 'visible' }}
      >
        <span>{department.name}</span>
        <Button
          size="icon"
          variant="ghost"
          className="opacity-60 group-hover:opacity-100"
          onClick={handleEdit}
          aria-label={t('common.edit')}
        >
          <Pencil className="w-4 h-4" />
        </Button>
      </div>

      {/* Editing view (absolutely positioned) */}
      {editing && (
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-max max-w-sm p-1 rounded-md bg-white shadow-lg border z-10 flex items-center gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-grow"
            style={{ minWidth: '250px' }}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
            disabled={mutation.isPending}
          />
          <Button size="icon" variant="ghost" onClick={handleSave} disabled={mutation.isPending} aria-label={t('common.save')}>
            <Check className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={handleCancel} disabled={mutation.isPending} aria-label={t('common.cancel')}>
            <X className="w-4 h-4" />
          </Button>
          {error && <span className="absolute top-full left-0 mt-1 text-xs text-red-500">{error}</span>}
        </div>
      )}
    </div>
  );
};

export default DepartmentNameInlineEdit;
