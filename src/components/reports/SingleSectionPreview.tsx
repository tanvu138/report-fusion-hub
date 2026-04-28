// /Users/luan/repos/report-fusion-hub/src/components/reports/SingleSectionPreview.tsx
import React from 'react';
import { ReportSection } from '@/types/report';
import SectionDisplay from './SectionDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit3, Send } from 'lucide-react'; // Example icons for actions
import { useLanguage } from '@/contexts/LanguageContext';

interface SingleSectionPreviewProps {
  section: ReportSection;
  reportTitle: string;
  reportCycle?: string;
  // Add user prop if actions depend on user roles/permissions
  // user: User | null;
  // onEdit?: (sectionId: string) => void; // Callback for edit action
  // onSubmit?: (sectionId: string) => void; // Callback for submit action
}

const SingleSectionPreview: React.FC<SingleSectionPreviewProps> = ({
  section,
  reportTitle,
  reportCycle,
  // user,
  // onEdit,
  // onSubmit,
}) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="bg-muted/30 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('reports.sectionOfReport')}
              </p>
              <CardTitle className="text-xl font-semibold tracking-tight">{reportTitle}</CardTitle>
            </div>
            {/* Placeholder for potential actions like Edit or Submit Section */}
            {/* These would require further implementation (callbacks, API calls, state management) */}
            {/* <div className="flex space-x-2 mt-2 sm:mt-0">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={() => onEdit(section.id)}>
                  <Edit3 className="mr-2 h-4 w-4" /> {t('actions.editSection')}
                </Button>
              )}
              {onSubmit && section.state === 'DRAFT' && (
                <Button variant="default" size="sm" onClick={() => onSubmit(section.id)}>
                  <Send className="mr-2 h-4 w-4" /> {t('actions.submitSection')}
                </Button>
              )}
            </div> */}
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <SectionDisplay section={section} reportCycle={reportCycle} />
        </CardContent>
      </Card>
    </div>
  );
};

export default SingleSectionPreview;
