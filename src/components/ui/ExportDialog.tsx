import React, { useState } from 'react';
import { FileOutput, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ProgressWithStatus from '@/components/ui/ProgressWithStatus';
import useDownload from '@/hooks/useDownload';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string;
  reportTitle: string;
}

const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  reportId,
  reportTitle
}) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isExporting, setIsExporting] = useState(false);

  const { downloadState, downloadFile, reset } = useDownload({
    onSuccess: () => {
      toast({
        title: t('toast.exportComplete'),
        description: t('reports.export.downloadSuccess', { title: reportTitle }),
      });
      setTimeout(() => {
        handleClose();
      }, 2000);
    },
    onError: (error) => {
      toast({
        title: t('toast.exportFailed'),
        description: error,
        variant: 'destructive',
      });
      setIsExporting(false);
    }
  });

  const handleExport = async () => {
    setIsExporting(true);
    await downloadFile(`/api/reports/${reportId}/export/pdf`, `${reportTitle}.pdf`);
    setIsExporting(false);
  };

  const handleClose = () => {
    reset();
    setIsExporting(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileOutput className="h-5 w-5" />
            {t('reports.export.title')}
          </DialogTitle>
          <DialogDescription>
            {t('reports.export.description', { title: reportTitle })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {(isExporting || downloadState.status !== 'idle') && (
            <ProgressWithStatus
              progress={downloadState.progress}
              status={downloadState.status}
              filename={`${reportTitle}.pdf`}
              error={downloadState.error}
            />
          )}

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isExporting}
            >
              <X className="h-4 w-4 mr-2" />
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting || downloadState.status === 'downloading'}
            >
              <FileOutput className="h-4 w-4 mr-2" />
              {isExporting ? t('reports.export.exporting') : t('reports.export.button')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;