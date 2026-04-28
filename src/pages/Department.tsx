import React, { useState, useEffect } from 'react';
import type { User } from '@/lib/api/auth';
import { getReports, type ReportWithSections } from '@/lib/api/reports';
import { FileText, Save, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import MainLayout from '@/components/layout/MainLayout';

const Department = () => {
  const [reports, setReports] = useState<ReportWithSections[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');
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

  // Find the active report and section
  const activeReport = reports.find(r => r.id === activeReportId) || reports[0];
  const activeSection = activeReport?.sections?.find(s => s.id === activeSectionId) ?? null;

  // Initialize edited content when section changes
  useEffect(() => {
    if (activeSection && activeSection.contentMarkdown !== undefined) {
      setEditedContent(activeSection.contentMarkdown);
    }
  }, [activeReportId, activeSectionId, activeSection?.contentMarkdown]);

  const handleSave = () => {
    // Update the reports state with the new content
    setReports(prevReports => 
      prevReports.map(report => {
        if (report.id === activeReportId) {
          return {
            ...report,
            sections: report.sections.map(section => {
              if (section.id === activeSectionId) {
                return {
                  ...section,
                  contentMarkdown: editedContent
                };
              }
              return section;
            })
          };
        }
        return report;
      })
    );

    // Show success toast
    toast({
      title: t('toast.contentSaved'),
      description: t('toast.contentSavedDescription'),
    });
  };

  const handleReportChange = (reportId: string) => {
    setActiveReportId(reportId);
    const report = reports.find(r => r.id === reportId);
    if (report) {
      setActiveSectionId(report.sections[0].id);
    }
  };

  const handleSectionChange = (sectionId: string) => {
    setActiveSectionId(sectionId);
  };

  useEffect(() => {
    if (!user || !user.departmentId) return;
    setReportsLoading(true);
    (async () => {
      try {
        const response = await getReports({}); // Optionally filter by department if API supports it
        // Filter reports by departmentId if not handled by API
        const deptReports = response.reports.filter((r: ReportWithSections) => 
          r.sections.some(s => s.template.departmentId === user.departmentId)
        ) as ReportWithSections[];
        setReports(deptReports);
        if (deptReports.length > 0) {
          setActiveReportId(deptReports[0].id);
          setActiveSectionId(deptReports[0].sections[0]?.id || null);
        }
      } catch (err) {
        setReports([]);
      } finally {
        setReportsLoading(false);
      }
    })();
  }, [user]);

  return (
    <MainLayout user={user || undefined}>
      {userLoading && <p className="text-muted-foreground">{t('loading.user')}</p>}
      {reportsLoading && <p className="text-muted-foreground">{t('loading.reports')}</p>}
      {!userLoading && !reportsLoading && user && reports && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight">{user.department?.name || ''} Department Portal</h1>
          </div>
          <Separator />
          <h2 className="text-xl font-semibold tracking-tight">{t('department.openReports')}</h2>
          <p className="text-muted-foreground mb-4">
            Reports that require your department's input.
          </p>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <Card key={report.id} className={activeReportId === report.id ? 'border-primary' : ''}>
              <CardHeader className="space-y-1">
                <CardTitle className="line-clamp-1">{report.title}</CardTitle>
                <CardDescription className="flex items-center space-x-2">
                  <CalendarDays className="h-4 w-4" />
                  <span>{report.cycle.charAt(0) + report.cycle.slice(1).toLowerCase()}</span>
                  <span>•</span>
                  <span>{report.state}</span>
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button 
                  variant={activeReportId === report.id ? "default" : "outline"} 
                  className="w-full"
                  onClick={() => handleReportChange(report.id)}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {activeReportId === report.id ? t('department.currentlyEditing') : t('department.editSections')}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        {activeReport && (
          <>
            <Separator className="my-6" />
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold tracking-tight">
                  Editing: {activeReport.title}
                </h2>
                <Button onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
              
              <Tabs defaultValue={activeSection.id} onValueChange={handleSectionChange}>
                <TabsList className="w-full justify-start">
                  {activeReport.sections.map((section) => (
                    <TabsTrigger key={section.id} value={section.id}>
                      {section.template.displayName}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {activeReport.sections.map((section) => (
                  <TabsContent key={section.id} value={section.id} className="space-y-4 pt-4">
                    <h3 className="text-lg font-medium">{section.template.displayName}</h3>
                    <p className="text-sm text-muted-foreground">
                      Enter the content for this section using Markdown formatting.
                    </p>
                    <Textarea
                      className="min-h-[400px] font-mono"
                      value={section.id === activeSectionId ? editedContent : section.contentMarkdown}
                      onChange={(e) => section.id === activeSectionId && setEditedContent(e.target.value)}
                      placeholder={t('forms.markdownContentPlaceholder')}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </>
        )}
      </div>
      )}
    </MainLayout>
  );
};

export default Department;
