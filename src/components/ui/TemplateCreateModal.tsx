import React, { useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import {
  createReportTemplate,
  CreateReportTemplatePayload,
  ReportTemplateSection,
  ReportTemplate,
} from '@/reportTemplateApiService';
import { fetchDepartments, Department } from '@/departmentApiService';
import { getCurrentUser, type User } from '@/lib/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import SectionBuilder from './SectionBuilder';
import { Loader2, FileText } from 'lucide-react';

interface TemplateCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TemplateCreateModal: React.FC<TemplateCreateModalProps> = ({
  open,
  onOpenChange,
}) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sections, setSections] = useState<
    Omit<ReportTemplateSection, 'id' | 'templateId' | 'department'>[]
  >([]);
  const [formError, setFormError] = useState<string | null>(null);

  // Get current user
  const { data: user } = useQuery<User>({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
  });

  // Fetch departments
  const {
    data: departments,
    isLoading: isLoadingDepartments,
  } = useQuery({
    queryKey: ['departments'],
    queryFn: fetchDepartments,
    enabled: user?.role === 'secretary',
  });

  // Reset form
  const resetForm = useCallback(() => {
    setName('');
    setDescription('');
    setSections([]);
    setFormError(null);
  }, []);

  // Handle success
  const handleSuccess = useCallback(
    (data: ReportTemplate) => {
      queryClient.invalidateQueries({ queryKey: ['reportTemplates'] });
      toast({
        title: t('toast.templateCreated'),
        description: t('toast.templateCreatedSuccess', { sectionCount: data.sections.length }),
      });
      resetForm();
      onOpenChange(false);
    },
    [queryClient, toast, resetForm, onOpenChange, t]
  );

  // Handle error
  const handleError = useCallback(
    (err: Error) => {
      setFormError(err.message || 'An unexpected error occurred.');
      toast({
        title: t('toast.templateCreateError'),
        description: err.message || t('toast.templateCreateErrorDescription'),
        variant: 'destructive',
      });
    },
    [toast, t]
  );

  // Create mutation
  const mutation = useMutation({
    mutationFn: createReportTemplate,
    onSuccess: handleSuccess,
    onError: handleError,
  });

  // Handle submit
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setFormError(null);

      // Validation
      if (!name.trim()) {
        setFormError(t('validation.templateNameRequired'));
        return;
      }
      if (sections.length === 0) {
        setFormError(t('validation.atLeastOneSection'));
        return;
      }
      
      // Check if all sections have required fields
      const missingSectionName = sections.some(s => !s.sectionName.trim());
      if (missingSectionName) {
        setFormError(t('validation.allSectionsMustHaveName'));
        return;
      }
      
      const missingDept = sections.some(s => !s.departmentId || s.departmentId === '');
      if (missingDept) {
        setFormError(t('validation.eachSectionMustHaveDepartment'));
        return;
      }

      const payload: CreateReportTemplatePayload = {
        name: name.trim(),
        description: description.trim() || undefined,
        sections: sections.map(s => ({ ...s })),
      };
      
      mutation.mutate(payload);
    },
    [name, description, sections, mutation]
  );

  // Handle close
  const handleClose = () => {
    if (!mutation.isPending) {
      resetForm();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <span>Create New Template</span>
          </DialogTitle>
          <DialogDescription>
            Create a new report template with sections that can be assigned to different departments.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="template-name">
                    Template Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="template-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('forms.templateNamePlaceholder')}
                    required
                    disabled={mutation.isPending}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="template-description">Description</Label>
                  <Input
                    id="template-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('forms.descriptionPlaceholder')}
                    disabled={mutation.isPending}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="template-description-full">Full Description</Label>
                <Textarea
                  id="template-description-full"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('forms.descriptionPlaceholder')}
                  disabled={mutation.isPending}
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>

            <Separator />

            {/* Sections */}
            {isLoadingDepartments ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>{t('loading.departments')}</span>
              </div>
            ) : (
              <SectionBuilder
                sections={sections}
                onSectionsChange={setSections}
                departments={departments || []}
                isDisabled={mutation.isPending}
              />
            )}

            {/* Error display */}
            {formError && (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter className="mt-6 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || isLoadingDepartments}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Create Template'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateCreateModal;