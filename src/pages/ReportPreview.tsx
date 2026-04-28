import React, { useState, useEffect } from 'react';
import type { User } from '@/lib/api/auth';
import { getReportById } from '@/lib/api/reports'; // Removed exportReportToDocx
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileOutput, Edit } from 'lucide-react'; // Added Edit
import { Button } from '@/components/ui/button';
import BackButton from '@/components/ui/BackButton';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import FullReportPreview from '@/components/reports/FullReportPreview';
import SingleSectionPreview from '@/components/reports/SingleSectionPreview';
import type { Report } from '@/types/report';

const ReportPreview = () => {
  const { id, sectionId } = useParams<{ id: string; sectionId?: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [reportLoading, setReportLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const [user, setUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const fetchedUser = await import('@/lib/api/auth').then(m => m.getCurrentUser());
        setUser(fetchedUser);
      } catch (err) {
        setUser(null);
      } finally {
        setUserLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!id) return;
    setReportLoading(true);
    (async () => {
      try {
        const reportData = await getReportById(id);
        // Assuming getReportById returns data compatible with the Report interface
        // If not, a transformation/validation step might be needed here
        setReport(reportData as unknown as Report); // Changed to 'as unknown as Report' to resolve lint error
      } catch (err: any) {
        toast({
          title: t('preview.notFound'),
          description: err.message || `No report found with ID: ${id}`,
          variant: "destructive"
        });
        setTimeout(() => navigate('/dashboard'), 2000);
      } finally {
        setReportLoading(false);
      }
    })();
  }, [id, navigate, toast, t]);

  return (
    <>
      {userLoading && <p className="text-muted-foreground">{t('loading.user')}</p>}
      {reportLoading && <p className="text-muted-foreground">{t('loading.reports')}</p>}
      {!userLoading && !reportLoading && user && report && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <BackButton />
              <h1 className="text-2xl font-bold tracking-tight">{report.title}</h1>
            </div>
            <div className="flex items-center space-x-2">
              {/* Add other action buttons here if needed, e.g., Export */}
              {user?.role === 'secretary' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/reports/${id}/edit-full`)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  {t('actions.edit')}
                </Button>
              )}
            </div>
            </div>
          {/* The premature closing div that was here has been removed */}
          <Separator />
          {sectionId ? (
            (() => {
              const foundSection = report.sections?.find(sec => sec.id === sectionId);
              if (foundSection) {
                return <SingleSectionPreview section={foundSection} reportTitle={report.title} reportCycle={report.cycle} />;
              } else {
                // Optionally, provide a more specific error message or redirect
                // If you need to display the sectionId, ensure your 'preview.sectionNotFound' key supports interpolation,
                // e.g., by defining it as "Section with ID {{id}} not found" and calling t('preview.sectionNotFound', { id: sectionId })
                // For now, fixing the lint error by using only the key.
                return <p className="text-red-500">{t('preview.sectionNotFound')}</p>;
              }
            })()
          ) : (
            <FullReportPreview report={report} user={user} />
          )}
        </div>
      )}
    </>
  );
};

export default ReportPreview;
