import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FileText, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import {
  listWorkspaceReports,
  createWorkspaceReport,
  deleteWorkspaceReport,
  WorkspaceReport,
} from '@/lib/api/workspace';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';

const WorkspacePage = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [reports, setReports] = useState<WorkspaceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [creating, setCreating] = useState(false);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<WorkspaceReport | null>(null);

  const fetchReports = () => {
    setLoading(true);
    listWorkspaceReports()
      .then(setReports)
      .catch(() => toast({ title: t('workspace.loadError'), variant: 'destructive' }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReports(); }, []);

  const filtered = useMemo(
    () => reports.filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase())),
    [reports, searchQuery]
  );

  const handleCreate = async () => {
    if (!createTitle.trim()) return;
    setCreating(true);
    try {
      const report = await createWorkspaceReport({
        title: createTitle.trim(),
        description: createDesc.trim() || undefined,
      });
      toast({ title: t('workspace.createSuccess') });
      setCreateOpen(false);
      setCreateTitle('');
      setCreateDesc('');
      navigate(`/workspace/${report.id}`);
    } catch {
      toast({ title: t('workspace.createFailed'), variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteWorkspaceReport(deleteTarget.id);
      setReports(prev => prev.filter(r => r.id !== deleteTarget.id));
      toast({ title: t('workspace.deleteSuccess') });
    } catch {
      toast({ title: t('workspace.deleteFailed'), variant: 'destructive' });
    } finally {
      setDeleteTarget(null);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('workspace.title')}</h1>
        <Button variant="create" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('workspace.createReport')}
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('workspace.searchPlaceholder')}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-lg" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">
            {searchQuery ? t('workspace.noResults') : t('workspace.emptyState')}
          </p>
          {!searchQuery && (
            <Button variant="create" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('workspace.emptyStateAction')}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(report => (
            <Card
              key={report.id}
              className="cursor-pointer hover:shadow-md transition-shadow group"
              onClick={() => navigate(`/workspace/${report.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{report.title}</CardTitle>
                    {report.description && (
                      <CardDescription className="mt-1 line-clamp-2">{report.description}</CardDescription>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2"
                    onClick={e => { e.stopPropagation(); setDeleteTarget(report); }}
                    aria-label={t('workspace.deleteConfirm')}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {t('workspace.lastUpdated', { date: formatDate(report.updatedAt) })}
                </p>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('workspace.createReportTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t('workspace.titleLabel')}</Label>
              <Input
                name="title"
                placeholder={t('workspace.titlePlaceholder')}
                value={createTitle}
                onChange={e => setCreateTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>{t('workspace.descriptionLabel')}</Label>
              <Input
                placeholder={t('workspace.descriptionPlaceholder')}
                value={createDesc}
                onChange={e => setCreateDesc(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>{t('actions.cancel')}</Button>
            <Button
              variant="create"
              onClick={handleCreate}
              disabled={!createTitle.trim() || creating}
              data-testid="workspace-create-submit"
            >
              {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('workspace.createReport')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('workspace.deleteConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>{deleteTarget?.title}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {t('actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WorkspacePage;
