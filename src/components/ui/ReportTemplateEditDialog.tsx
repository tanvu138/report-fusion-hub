import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { 
  updateReportTemplate, 
  ReportTemplate,
  ReportTemplateSection,
  UpdateReportTemplatePayload 
} from '@/reportTemplateApiService';
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
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, GripVertical, Plus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ReportTemplateEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: ReportTemplate | null;
}

const ReportTemplateEditDialog: React.FC<ReportTemplateEditDialogProps> = ({ 
  open, 
  onOpenChange, 
  template 
}) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();
  
  // Template form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sections, setSections] = useState<Omit<ReportTemplateSection, 'id' | 'templateId' | 'department'>[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isFormDirty, setIsFormDirty] = useState(false);

  // Get current user
  const { data: user } = useQuery<User>({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
  });

  // Fetch departments for section assignment (only for secretaries)
  const { data: departments, isLoading: isLoadingDepartments } = useQuery({
    queryKey: ['departments'],
    queryFn: fetchDepartments,
    staleTime: 300000, // 5 minutes
    enabled: open && user?.role === 'secretary',
  });

  // Set initial form state from template
  useEffect(() => {
    if (template && open) {
      setName(template.name);
      setDescription(template.description || '');
      
      // Map sections from template to form state
      const mappedSections = template.sections.map(section => ({
        sectionName: section.sectionName,
        departmentId: section.departmentId,
        instructions: section.instructions,
        displayOrder: section.displayOrder,
      }));
      
      setSections(mappedSections);
      setIsFormDirty(false); // Reset dirty state when loading new template
    }
  }, [template, open]);

  // Update mutation
  const mutation = useMutation({
    mutationFn: (data: {id: string, payload: UpdateReportTemplatePayload}) => 
      updateReportTemplate(data.id, data.payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reportTemplates'] });
      queryClient.invalidateQueries({ queryKey: ['reportTemplatePreview', data.id] });
      toast({
        title: t('toast.templateUpdated'),
        description: t('toast.templateUpdatedSuccess', { name: data.name }),
      });
      onOpenChange(false);
      setIsFormDirty(false);
    },
    onError: (err: Error) => {
      setFormError(err.message || t('errors.unexpectedError'));
      toast({
        title: t('toast.templateUpdateError'),
        description: err.message || t('errors.templateUpdateFailed'),
        variant: "destructive",
      });
    },
  });

  // Add a new empty section
  const addSection = () => {
    setSections([
      ...sections,
      {
        sectionName: '',
        departmentId: '', // Will be selected by user
        instructions: '',
        displayOrder: sections.length,
      }
    ]);
    setIsFormDirty(true);
  };

  // Remove a section by index
  const removeSection = (index: number) => {
    const newSections = [...sections];
    newSections.splice(index, 1);
    // Update display order
    newSections.forEach((section, idx) => {
      section.displayOrder = idx;
    });
    setSections(newSections);
    setIsFormDirty(true);
  };

  // Update a section field
  const updateSection = (index: number, field: keyof Omit<ReportTemplateSection, 'id' | 'templateId' | 'department'>, value: string) => {
    const newSections = [...sections];
    newSections[index] = {
      ...newSections[index],
      [field]: value,
    };
    setSections(newSections);
    setIsFormDirty(true);
  };

  // Handle drag end for reordering sections
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update display order
    items.forEach((section, idx) => {
      section.displayOrder = idx;
    });
    
    setSections(items);
    setIsFormDirty(true);
  };

  // Form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!template) {
      setFormError(t('template.validation.noTemplateSelected'));
      return;
    }
    
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
    
    // Check if anything changed
    if (!isFormDirty) {
      toast({
        title: t('toast.noChanges'),
        description: t('template.form.noChangesDescription'),
      });
      onOpenChange(false);
      return;
    }
    
    setFormError(null);
    mutation.mutate({
      id: template.id,
      payload: { name, description, sections }
    });
  };
  
  // Reset form when dialog is closed
  useEffect(() => {
    if (!open) {
      setFormError(null);
      mutation.reset();
    }
  }, [open]);

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{t('template.edit.title')}</DialogTitle>
          <DialogDescription>
            {t('template.edit.description', { templateName: template.name })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">{t('template.form.templateName')}<span className="text-red-500">*</span></Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setIsFormDirty(true);
                }}
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
                onChange={(e) => {
                  setDescription(e.target.value);
                  setIsFormDirty(true);
                }}
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
                      className="space-y-3 overflow-y-auto max-h-[400px]"
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
            <Button 
              type="submit" 
              disabled={mutation.isPending || !isFormDirty}
            >
              {mutation.isPending ? t('loading.saving') : t('template.form.saveChanges')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReportTemplateEditDialog;
