import React, { useState, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { createReportTemplate, CreateReportTemplatePayload, ReportTemplateSection, ReportTemplate } from '@/reportTemplateApiService';
import { fetchDepartments, Department } from '@/departmentApiService';
import { getCurrentUser, type User } from '@/lib/api/auth';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, GripVertical, Plus } from 'lucide-react';

interface ReportTemplateCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ReportTemplateCreateDialog: React.FC<ReportTemplateCreateDialogProps> = ({ open, onOpenChange }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();
  
  // Template form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sections, setSections] = useState<Omit<ReportTemplateSection, 'id' | 'templateId' | 'department'>[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  // Get current user
  const { data: user } = useQuery<User>({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
  });

  // Fetch departments for section assignment (only for secretaries)
  const { data: departments, isLoading: isLoadingDepartments } = useQuery({
    queryKey: ['departments'],
    queryFn: fetchDepartments,
    enabled: open && user?.role === 'secretary',
  });

  // Reset form state
  const resetForm = useCallback(() => {
    setName('');
    setDescription('');
    setSections([]);
    setFormError(null);
  }, [setName, setDescription, setSections, setFormError]);

  // Create mutation
  const handleMutationSuccess = useCallback((data: ReportTemplate) => {
    queryClient.invalidateQueries({ queryKey: ['reportTemplates'] });
    toast({
      title: t('toast.templateCreated'),
      description: t('toast.templateCreatedSuccess', { sectionCount: data.sections.length }),
    });
    onOpenChange(false);
    resetForm();
  }, [queryClient, toast, onOpenChange, resetForm]);

  const handleMutationError = useCallback((err: Error) => {
    setFormError(err.message || t('errors.unexpectedError'));
    toast({
      title: t('toast.templateCreateError'),
      description: err.message || t('toast.templateCreateErrorDescription'),
      variant: "destructive",
    });
  }, [setFormError, toast]);

  const mutation = useMutation({
    mutationFn: createReportTemplate,
    onSuccess: handleMutationSuccess,
    onError: handleMutationError,
  });

  // Add a new empty section
  const addSection = useCallback(() => {
    setSections(prevSections => [
      ...prevSections,
      {
        sectionName: '',
        departmentId: '', // Will be selected by user
        instructions: '',
        displayOrder: prevSections.length,
      }
    ]);
  }, [setSections]);

  // Remove a section by index
  const removeSection = useCallback((index: number) => {
    setSections(prevSections => {
      const newSections = [...prevSections];
      newSections.splice(index, 1);
      // Update display order
      newSections.forEach((section, idx) => {
        section.displayOrder = idx;
      });
      return newSections;
    });
  }, [setSections]);

  // Update a section field
  const updateSection = useCallback((index: number, field: keyof Omit<ReportTemplateSection, 'id' | 'templateId' | 'department'>, value: string) => {
    setSections(prevSections => {
      const newSections = [...prevSections];
      newSections[index] = {
        ...newSections[index],
        [field]: value,
      };
      return newSections;
    });
  }, [setSections]);

  // Handle drag end for reordering sections
  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    
    setSections(prevSections => {
      const items = Array.from(prevSections);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);
      
      // Update display order
      items.forEach((section, idx) => {
        section.displayOrder = idx;
      });
      return items;
    });
  }, [setSections]);

  // Form submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setFormError(t('validation.templateNameRequired'));
      return;
    }
    
    if (sections.length === 0) {
      setFormError(t('validation.atLeastOneSection'));
      return;
    }
    
    // Validate all sections
    const invalidSections = sections.filter(
      section => !section.sectionName.trim() || !section.departmentId
    );
    
    if (invalidSections.length > 0) {
      setFormError(t('validation.allSectionsMustHaveNameAndDepartment'));
      return;
    }
    
    setFormError(null);
    mutation.mutate({ name, description, sections });
  }, [name, description, sections, setFormError, mutation.mutate]);

  // Effect to reset form when dialog is closed externally
  useEffect(() => {
    if (!open) {
      resetForm();
      if (mutation.reset) mutation.reset(); // Ensure mutation.reset is callable
    } else if (open && sections.length === 0) {
      // Add an initial empty section when dialog opens
      addSection();
    }
  }, [open, resetForm, addSection, mutation.reset, sections.length]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{t('template.create.title')}</DialogTitle>
          <DialogDescription>
            {t('template.create.description')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">{t('template.form.templateName')}<span className="text-red-500">*</span></Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1"
                required
                disabled={mutation.isPending}
              />
            </div>
            
            <div>
              <Label htmlFor="description">{t('template.form.description')}</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1"
                placeholder={t('forms.descriptionPlaceholder')}
                disabled={mutation.isPending}
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>{t('template.form.sections')}<span className="text-red-500">*</span></Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={addSection}
                  disabled={mutation.isPending}
                >
                  <Plus className="h-4 w-4 mr-1" /> {t('template.form.addSection')}
                </Button>
              </div>
              
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="sections">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-3"
                    >
                      {sections.map((section, index) => (
                        <Draggable key={index} draggableId={`section-${index}`} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="border p-3 rounded-md bg-gray-50"
                            >
                              <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center">
                                  <div {...provided.dragHandleProps} className="cursor-grab mr-2">
                                    <GripVertical className="h-5 w-5 text-gray-400" />
                                  </div>
                                  <span className="font-medium">{t('template.form.sectionNumber', { number: index + 1 })}</span>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeSection(index)}
                                  disabled={mutation.isPending || sections.length <= 1}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor={`section-name-${index}`}>{t('template.form.sectionName')}<span className="text-red-500">*</span></Label>
                                  <Input
                                    id={`section-name-${index}`}
                                    value={section.sectionName}
                                    onChange={(e) => updateSection(index, 'sectionName', e.target.value)}
                                    className="mt-1"
                                    required
                                    disabled={mutation.isPending}
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor={`section-department-${index}`}>{t('template.form.assignedDepartment')}<span className="text-red-500">*</span></Label>
                                  <Select
                                    value={section.departmentId}
                                    onValueChange={(value) => updateSection(index, 'departmentId', value)}
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
                                
                                <div className="md:col-span-2">
                                  <Label htmlFor={`section-instructions-${index}`}>{t('template.form.instructions')}</Label>
                                  <Textarea
                                    id={`section-instructions-${index}`}
                                    value={section.instructions || ''}
                                    onChange={(e) => updateSection(index, 'instructions', e.target.value)}
                                    className="mt-1"
                                    placeholder={t('forms.instructionsPlaceholder')}
                                    disabled={mutation.isPending}
                                  />
                                </div>
                              </div>
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
                  {t('template.form.noSectionsMessage')}
                </div>
              )}
            </div>
          </div>
          
          {formError && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">{formError}</p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              disabled={mutation.isPending}
            >
              {t('template.form.cancel')}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? t('template.form.creating') : t('template.form.createTemplate')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReportTemplateCreateDialog;
