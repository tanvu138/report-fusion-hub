import React, { useState } from 'react';
import { FileOutput, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface ExportDropdownProps {
  reportId: string;
  reportTitle: string;
  className?: string;
}

const ExportDropdown: React.FC<ExportDropdownProps> = ({
  reportId,
  reportTitle,
  className
}) => {
  const { t } = useLanguage();
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const { toast } = useToast();

  const handleExport = async () => {
    setIsExporting('pdf');

    try {
      await api.download(`/api/reports/${reportId}/export/pdf`, `${reportTitle}.pdf`);
      toast({
        title: t('reports.export.success'),
        description: t('reports.export.successMessage', { filename: `${reportTitle}.pdf` }),
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: t('reports.export.failed'),
        description: t('reports.export.failedMessage', { format: 'PDF' }),
        variant: 'destructive',
      });
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isExporting !== null}
      onClick={handleExport}
      className={className}
    >
      {isExporting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {t('reports.export.exporting')}
        </>
      ) : (
        <>
          <FileOutput className="mr-2 h-4 w-4" />
          {t('reports.export.button')}
        </>
      )}
    </Button>
  );
};

export default ExportDropdown;