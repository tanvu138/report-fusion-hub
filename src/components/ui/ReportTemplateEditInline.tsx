import React, { useState, useCallback } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import {
  updateReportTemplate,
  ReportTemplate,
  ReportTemplateSection,
  UpdateReportTemplatePayload,
} from '@/reportTemplateApiService';
import { fetchDepartments, Department } from '@/departmentApiService';
import { getCurrentUser, type User } from '@/lib/api/auth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, GripVertical, Plus, X } from 'lucide-react';

interface ReportTemplateEditInlineProps {
  template: ReportTemplate;
  onClose: () => void;
}

/**
 * Inline (in-page) editor for an existing report template.
 * Renders a form pre-filled with `template` data and allows updating it.
 * After successful update, it invalidates related queries and calls `onClose`.
 */
const ReportTemplateEditInline: React.FC<ReportTemplateEditInlineProps> = ({
  template,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  // Form state
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description || '');
  const [sections, setSections] = useState<
    Omit<ReportTemplateSection, 'id' | 'templateId' | 'department'>[]
  >(
    template.sections.map((s) => ({
      sectionName: s.sectionName,
      departmentId: s.departmentId,
      instructions: s.instructions,
      displayOrder: s.displayOrder,
    })),
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Current user & departments
  const { data: user } = useQuery<User>({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
  });

  const { data: departments, isLoading: isLoadingDepartments } = useQuery({
    queryKey: ['departments'],
    queryFn: fetchDepartments,
    staleTime: 300_000,
    enabled: user?.role === 'secretary',
  });

  // Mutation to save changes
  const mutation = useMutation({
    mutationFn: (payload: UpdateReportTemplatePayload) =>
      updateReportTemplate(template.id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reportTemplates'] });
      queryClient.invalidateQueries({
        queryKey: ['reportTemplatePreview', data.id],
      });
      toast({
        title: t('toast.templateUpdated'),
        description: t('templates.edit.description'),
      });
      onClose();
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

  /* ---------- Helpers ---------- */
  const addSection = useCallback(() => {
    setSections((prev) => [
      ...prev,
      {
        sectionName: '',
        departmentId: '',
        instructions: '',
        displayOrder: prev.length,
      },
    ]);
    setIsDirty(true);
  }, []);

  const removeSection = useCallback((index: number) => {
    setSections((prev) => {
      const copy = [...prev];
      copy.splice(index, 1);
      copy.forEach((s, idx) => (s.displayOrder = idx));
      return copy;
    });
    setIsDirty(true);
  }, []);

  const updateSection = useCallback(
    (
      index: number,
      field: keyof Omit<ReportTemplateSection, 'id' | 'templateId' | 'department'>,
      value: string,
    ) => {
      setSections((prev) => {
        const copy = [...prev];
        // @ts-expect-error — dynamic assignment
        copy[index][field] = value;
        return copy;
      });
      setIsDirty(true);
    },
    [],
  );

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;
      const items = Array.from(sections);
      const [moved] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, moved);
      items.forEach((s, idx) => (s.displayOrder = idx));
      setSections(items);
      setIsDirty(true);
    },
    [sections],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setFormError(t('validation.templateNameRequired'));
      return;
    }
    if (sections.length === 0) {
      setFormError(t('validation.atLeastOneSection'));
      return;
    }

    setFormError(null);
    const payload: UpdateReportTemplatePayload = {
      name,
      description,
      sections,
    };
    mutation.mutate(payload);
  };

  /* ---------- JSX ---------- */
  return (
    <div className="bg-white shadow rounded-lg p-6 mt-8">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-semibold">
          {t('templates.edit.title')} &ldquo;{template.name}&rdquo;
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          disabled={mutation.isPending}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General info */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="template-name">
              {t('templates.templateName')}<span className="text-red-500">*</span>
            </Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setIsDirty(true);
              }}
              required
              disabled={mutation.isPending}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="template-description">{t('templates.description')}</Label>
            <Textarea
              id="template-description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setIsDirty(true);
              }}
              disabled={mutation.isPending}
              className="mt-1"
            />
          </div>
        </div>

        {/* Sections */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">{t('templates.sections.title')}</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addSection}
              disabled={mutation.isPending}
            >
              <Plus className="h-4 w-4 mr-1" /> {t('templates.sections.addSection')}
            </Button>
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="sections">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="space-y-4"
                >
                  {sections.map((section, index) => (
                    <Draggable
                      key={index}
                      draggableId={`section-${index}`}
                      index={index}
                    >
                      {(providedDrag) => (
                        <div
                          ref={providedDrag.innerRef}
                          {...providedDrag.draggableProps}
                          className="relative border rounded-md p-4"
                        >
                          <div
                            {...providedDrag.dragHandleProps}
                            className="absolute -left-3 top-4 cursor-grab text-gray-400"
                          >
                            <GripVertical className="h-4 w-4" />
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            {/* Section name */}
                            <div>
                              <Label htmlFor={`section-name-${index}`}>
                                {t('templates.sections.sectionName')}<span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id={`section-name-${index}`}
                                value={section.sectionName}
                                onChange={(e) =>
                                  updateSection(index, 'sectionName', e.target.value)
                                }
                                required
                                disabled={mutation.isPending}
                                className="mt-1"
                              />
                            </div>

                            {/* Department select */}
                            <div>
                              <Label htmlFor={`section-dept-${index}`}>
                                {t('templates.sections.assignedDepartment')}<span className="text-red-500">*</span>
                              </Label>
                              <Select
                                value={section.departmentId}
                                onValueChange={(val) =>
                                  updateSection(index, 'departmentId', val)
                                }
                                disabled={isLoadingDepartments || mutation.isPending}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder={t('forms.selectDepartment')} />
                                </SelectTrigger>
                                <SelectContent>
                                  {departments?.map((dept: Department) => (
                                    <SelectItem key={dept.id} value={dept.id}>
                                      {dept.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Instructions */}
                            <div className="md:col-span-2">
                              <Label htmlFor={`section-instr-${index}`}>{t('templates.sections.instructions')}</Label>
                              <Textarea
                                id={`section-instr-${index}`}
                                value={section.instructions || ''}
                                onChange={(e) =>
                                  updateSection(index, 'instructions', e.target.value)
                                }
                                disabled={mutation.isPending}
                                className="mt-1"
                                placeholder={t('forms.instructionsPlaceholder')}
                              />
                            </div>
                          </div>

                          {/* Remove section */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-2 text-red-600 hover:text-red-700"
                            onClick={() => removeSection(index)}
                            disabled={mutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {sections.length === 0 && (
            <div className="border border-dashed p-4 rounded-md text-center text-gray-500">
              {t('templates.sections.noSections')}
            </div>
          )}
        </div>

        {/* Error message */}
        {formError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded text-sm text-red-700">
            {formError}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={mutation.isPending || !isDirty}>
            {mutation.isPending ? t('loading.saving') : t('common.save')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ReportTemplateEditInline;
