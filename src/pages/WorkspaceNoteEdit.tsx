import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  getWorkspaceReport,
  updateWorkspaceReport,
  updateWorkspaceContent,
  WorkspaceReport,
} from '@/lib/api/workspace';
import SectionDisplay from '@/components/reports/SectionDisplay';
import type { ReportSection } from '@/types/report';
import { Skeleton } from '@/components/ui/skeleton';
import { UnsavedChangesDialog } from '@/components/reports/UnsavedChangesDialog';

type SaveStatus = 'saved' | 'saving' | 'unsaved';

const SaveStatusBadge = ({ status, t }: { status: SaveStatus; t: (key: string) => string }) => {
  const config = {
    saved: { icon: <Check className="h-3 w-3" />, text: t('workspace.saved'), cls: 'text-green-600' },
    saving: { icon: <Loader2 className="h-3 w-3 animate-spin" />, text: t('workspace.saving'), cls: 'text-muted-foreground' },
    unsaved: { icon: <AlertCircle className="h-3 w-3" />, text: t('workspace.unsaved'), cls: 'text-orange-500' },
  };
  const c = config[status];
  return (
    <span className={`flex items-center gap-1 text-xs ${c.cls}`}>
      {c.icon} {c.text}
    </span>
  );
};

const WorkspaceNoteEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();

  const [report, setReport] = useState<WorkspaceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingContentRef = useRef<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getWorkspaceReport(id)
      .then(r => { setReport(r); setTitle(r.title); })
      .catch(() => { toast({ title: t('workspace.loadError'), variant: 'destructive' }); navigate('/workspace'); })
      .finally(() => setLoading(false));
  }, [id]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, []);

  const flushSave = useCallback(async (): Promise<boolean> => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    if (!id || pendingContentRef.current === null) return true;
    setSaveStatus('saving');
    try {
      await updateWorkspaceContent(id, { contentMarkdown: pendingContentRef.current });
      pendingContentRef.current = null;
      setSaveStatus('saved');
      return true;
    } catch {
      setSaveStatus('unsaved');
      toast({ title: t('workspace.saveFailed'), variant: 'destructive' });
      return false;
    }
  }, [id, t, toast]);

  const handleContentChange = useCallback((markdown: string) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    pendingContentRef.current = markdown;
    setSaveStatus('unsaved');
    saveTimerRef.current = setTimeout(async () => {
      if (!id || pendingContentRef.current === null) return;
      setSaveStatus('saving');
      try {
        await updateWorkspaceContent(id, { contentMarkdown: pendingContentRef.current });
        pendingContentRef.current = null;
        setSaveStatus('saved');
      } catch {
        setSaveStatus('unsaved');
        toast({ title: t('workspace.saveFailed'), variant: 'destructive' });
      }
    }, 10000);
  }, [id, t, toast]);

  const handleBack = () => {
    if (saveStatus === 'unsaved') {
      setShowUnsavedDialog(true);
    } else {
      navigate('/workspace');
    }
  };

  const handleTitleBlur = async () => {
    if (!id || !title.trim() || title === report?.title) return;
    try {
      await updateWorkspaceReport(id, { title: title.trim() });
      setReport(prev => prev ? { ...prev, title: title.trim() } : prev);
    } catch {
      toast({ title: t('workspace.saveFailed'), variant: 'destructive' });
    }
  };

  const section = report?.sections?.[0];

  // Build a section object satisfying SectionDisplay's ReportSection interface
  const sectionForDisplay: ReportSection | null = section ? {
    id: section.id,
    isActive: section.isActive,
    contentMarkdown: section.contentMarkdown,
    sectionName: section.sectionName,
    displayOrder: section.displayOrder,
    report: { id: report!.id, state: 'DRAFT' },
    createdAt: report!.createdAt,
    updatedAt: section.updatedAt,
  } : null;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full max-w-lg" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={handleBack} aria-label="Back to workspace">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            className="text-lg font-semibold border-none shadow-none px-0 focus-visible:ring-0 h-auto"
            placeholder={t('workspace.untitled')}
            aria-label={t('workspace.editTitle')}
          />
        </div>
        <SaveStatusBadge status={saveStatus} t={t} />
      </div>

      {/* Editor */}
      {sectionForDisplay && (
        <SectionDisplay
          section={sectionForDisplay}
          currentUser={user ? { id: user.id, name: user.name, role: user.role as 'secretary' | 'department' } : null}
          reportId={id}
          editable={true}
          onContentChange={handleContentChange}
          showEditButton={false}
        />
      )}

      <UnsavedChangesDialog
        isOpen={showUnsavedDialog}
        onClose={() => setShowUnsavedDialog(false)}
        onSaveAndContinue={async () => { if (await flushSave()) navigate('/workspace'); }}
        onDiscardAndContinue={() => navigate('/workspace')}
      />
    </div>
  );
};

export default WorkspaceNoteEdit;
