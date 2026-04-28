import React, { useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import {
  updateReportTemplate,
  ReportTemplate,
  ReportTemplateSection,
  UpdateReportTemplatePayload,
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
import { Loader2, Edit3 } from 'lucide-react';

interface TemplateEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: ReportTemplate | null;
}

const TemplateEditModal: React.FC<TemplateEditModalProps> = ({
  open,
  onOpenChange,
  template,
}) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  // Form state
  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [sections, setSections] = useState<
    Omit<ReportTemplateSection, 'id' | 'templateId' | 'department'>[]
  >(
    template?.sections.map(s => ({
      sectionName: s.sectionName,
      departmentId: s.departmentId,
      instructions: s.instructions,
      displayOrder: s.displayOrder,
    })) || []
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Update form when template changes
  React.useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description || '');
      setSections(
        template.sections.map(s => ({
          sectionName: s.sectionName,
          departmentId: s.departmentId,
          instructions: s.instructions,
          displayOrder: s.displayOrder,
        }))
      );
      setIsDirty(false);
      setFormError(null);
    }
  }, [template]);

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
    staleTime: 300_000,
  });

  // Create mutation
  const mutation = useMutation({
    mutationFn: (payload: UpdateReportTemplatePayload) =>
      updateReportTemplate(template!.id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reportTemplates'] });
      queryClient.invalidateQueries({
        queryKey: ['reportTemplatePreview', data.id],
      });
      toast({
        title: t('toast.templateUpdated'),
        description: t('templates.edit.description'),
      });
      setIsDirty(false);
      onOpenChange(false);
    },
    onError: (err: Error) => {
      setFormError(err.message || t('errors.unexpectedError'));
      toast({
        title: t('toast.templateUpdateError'),
        description: err.message || t('errors.templateUpdateFailed'),
        variant: 'destructive',
      });
    },
  });

  // Handle form changes with dirty tracking
  const handleNameChange = useCallback((value: string) => {
    setName(value);
    setIsDirty(true);
  }, []);

  const handleDescriptionChange = useCallback((value: string) => {
    setDescription(value);
    setIsDirty(true);
  }, []);

  const handleSectionsChange = useCallback((newSections: typeof sections) => {
    setSections(newSections);
    setIsDirty(true);
  }, []);

  // Handle submit
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setFormError(null);

      if (!template) return;

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
        setFormError(t('templates.sections.eachSectionNeedsDepartment'));
        return;
      }

      const payload: UpdateReportTemplatePayload = {
        name: name.trim(),
        description: description.trim(),
        sections,
      };
      
      mutation.mutate(payload);
    },
    [template, name, description, sections, mutation]
  );

  // Handle close
  const handleClose = () => {
    if (!mutation.isPending) {
      onOpenChange(false);
    }
  };

  if (!template) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Edit3 className="h-5 w-5 text-blue-600" />
            <span>{t('templates.edit.title')}</span>
          </DialogTitle>
          <DialogDescription>
            {t('templates.edit.description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="template-name">
                    {t('templates.templateName')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="template-name"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder={t('forms.templateNamePlaceholder')}
                    required
                    disabled={mutation.isPending}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="template-created">{t('templates.createdBy')}</Label>
                  <Input
                    id="template-created"
                    value={`${template.createdBy?.name || 'Unknown'} on ${new Date(template.createdAt).toLocaleDateString()}`}
                    disabled
                    className="mt-1 bg-gray-50"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="template-description-full">{t('templates.description')}</Label>
                <Textarea
                  id="template-description-full"
                  value={description}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
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
                <span>{t('navigation.settings.loadingSettings')}</span>
              </div>
            ) : (
              <SectionBuilder
                sections={sections}
                onSectionsChange={handleSectionsChange}
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
            <div className="flex items-center justify-between w-full">
              <div className="text-sm text-gray-500">
                {isDirty && !mutation.isPending && (
                  <span className="text-amber-600">{t('templates.unsavedChanges')}</span>
                )}
              </div>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={mutation.isPending}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={mutation.isPending || !isDirty || isLoadingDepartments}
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {t('loading.saving')}
                    </>
                  ) : (
                    t('common.save')
                  )}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateEditModal;