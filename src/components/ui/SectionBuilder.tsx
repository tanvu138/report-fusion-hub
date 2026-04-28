import React, { useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GripVertical, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ReportTemplateSection } from '@/reportTemplateApiService';
import { Department } from '@/departmentApiService';

interface SectionBuilderProps {
  sections: Omit<ReportTemplateSection, 'id' | 'templateId' | 'department'>[];
  onSectionsChange: (sections: Omit<ReportTemplateSection, 'id' | 'templateId' | 'department'>[]) => void;
  departments: Department[];
  isDisabled?: boolean;
}

const SectionBuilder: React.FC<SectionBuilderProps> = ({
  sections,
  onSectionsChange,
  departments,
  isDisabled = false,
}) => {
  const { t } = useLanguage();

  const addSection = useCallback(() => {
    const newSection = {
      sectionName: '',
      departmentId: null as any, // Temporarily null, will be set to string when selected
      instructions: '',
      displayOrder: sections.length,
    };
    onSectionsChange([...sections, newSection]);
  }, [sections, onSectionsChange]);

  const removeSection = useCallback((index: number) => {
    const updatedSections = [...sections];
    updatedSections.splice(index, 1);
    // Reorder the remaining sections
    updatedSections.forEach((section, idx) => {
      section.displayOrder = idx;
    });
    onSectionsChange(updatedSections);
  }, [sections, onSectionsChange]);

  const updateSection = useCallback(
    (
      index: number,
      field: keyof Omit<ReportTemplateSection, 'id' | 'templateId' | 'department'>,
      value: string
    ) => {
      const updatedSections = [...sections];
      // @ts-expect-error - dynamic field update
      updatedSections[index][field] = value;
      onSectionsChange(updatedSections);
    },
    [sections, onSectionsChange]
  );

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;
      
      const reorderedSections = [...sections];
      const [removed] = reorderedSections.splice(result.source.index, 1);
      reorderedSections.splice(result.destination.index, 0, removed);
      
      // Update display order
      reorderedSections.forEach((section, index) => {
        section.displayOrder = index;
      });
      
      onSectionsChange(reorderedSections);
    },
    [sections, onSectionsChange]
  );

  const getDepartmentName = (departmentId: string) => {
    return departments.find(dept => dept.id === departmentId)?.name || 'Select Department';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">Template Sections</h3>
          <p className="text-sm text-gray-600">
            Define the sections for this template. Each section will be assigned to a department.
          </p>
        </div>
        <Button
          type="button"
          onClick={addSection}
          disabled={isDisabled}
          className="shrink-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Section
        </Button>
      </div>

      {sections.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-2">
              <div className="text-gray-400">
                <Plus className="h-12 w-12 mx-auto mb-4" />
              </div>
              <h4 className="text-lg font-medium text-gray-900">No sections yet</h4>
              <p className="text-gray-600 max-w-sm">
                Add your first section to get started. Each section can have its own instructions and assigned department.
              </p>
              <Button onClick={addSection} disabled={isDisabled} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add First Section
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="sections">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="space-y-3"
              >
                {sections.map((section, index) => (
                  <Draggable
                    key={index}
                    draggableId={`section-${index}`}
                    index={index}
                    isDragDisabled={isDisabled}
                  >
                    {(dragProvided, snapshot) => (
                      <SectionCard
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        section={section}
                        index={index}
                        departments={departments}
                        onUpdate={updateSection}
                        onRemove={removeSection}
                        dragHandleProps={dragProvided.dragHandleProps}
                        isDragging={snapshot.isDragging}
                        isDisabled={isDisabled}
                        getDepartmentName={getDepartmentName}
                      />
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {sections.length > 0 && (
        <div className="text-sm text-gray-600 bg-blue-50 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <div className="text-blue-600 mt-0.5">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-blue-900">Section Tips</p>
              <ul className="mt-1 space-y-1 text-blue-800">
                <li>• Drag sections to reorder them</li>
                <li>• Each section must be assigned to a department</li>
                <li>• Instructions help departments understand what content to provide</li>
                <li>• Sections can be collapsed to save space while editing</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface SectionCardProps {
  section: Omit<ReportTemplateSection, 'id' | 'templateId' | 'department'>;
  index: number;
  departments: Department[];
  onUpdate: (index: number, field: string, value: string) => void;
  onRemove: (index: number) => void;
  dragHandleProps: any;
  isDragging: boolean;
  isDisabled: boolean;
  getDepartmentName: (departmentId: string) => string;
}

const SectionCard = React.forwardRef<HTMLDivElement, SectionCardProps & any>(
  ({
    section,
    index,
    departments,
    onUpdate,
    onRemove,
    dragHandleProps,
    isDragging,
    isDisabled,
    getDepartmentName,
    ...props
  }, ref) => {
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = React.useState(true);

    return (
      <Card
        ref={ref}
        {...props}
        className={`transition-all duration-200 ${
          isDragging ? 'shadow-lg rotate-2' : 'shadow-sm hover:shadow-md'
        } ${isDisabled ? 'opacity-50' : ''}`}
      >
        <CardContent className="p-4">
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1">
                <div
                  {...dragHandleProps}
                  className={`cursor-grab text-gray-400 ${isDisabled ? 'cursor-not-allowed' : ''}`}
                >
                  <GripVertical className="h-5 w-5" />
                </div>
                
                <CollapsibleTrigger className="flex items-center space-x-2 flex-1 text-left">
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">
                        {section.sectionName || `Section ${index + 1}`}
                      </span>
                      {section.departmentId && (
                        <Badge variant="outline" className="text-xs">
                          {getDepartmentName(section.departmentId)}
                        </Badge>
                      )}
                    </div>
                    {!isOpen && section.instructions && (
                      <p className="text-sm text-gray-600 truncate mt-1">
                        {section.instructions}
                      </p>
                    )}
                  </div>
                </CollapsibleTrigger>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemove(index)}
                disabled={isDisabled}
                className="text-red-600 hover:text-red-700 ml-2"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <CollapsibleContent className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-8">
                <div>
                  <Label htmlFor={`section-name-${index}`}>
                    Section Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`section-name-${index}`}
                    value={section.sectionName}
                    onChange={(e) => onUpdate(index, 'sectionName', e.target.value)}
                    placeholder={t('forms.sectionNamePlaceholder')}
                    disabled={isDisabled}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor={`section-dept-${index}`}>
                    Assigned Department <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={section.departmentId || undefined}
                    onValueChange={(value) => onUpdate(index, 'departmentId', value)}
                    disabled={isDisabled}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={t('forms.selectDepartmentSection')} />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor={`section-instructions-${index}`}>
                    Instructions for Department
                  </Label>
                  <Textarea
                    id={`section-instructions-${index}`}
                    value={section.instructions || ''}
                    onChange={(e) => onUpdate(index, 'instructions', e.target.value)}
                    placeholder={t('forms.sectionInstructionsPlaceholder')}
                    disabled={isDisabled}
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    );
  }
);

SectionCard.displayName = 'SectionCard';

export default SectionBuilder;