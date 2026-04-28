import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createShareLink,
  listShareLinks,
  revokeShareLink,
  regenerateShareCode,
  SharedLink,
} from '@/services/sharedReportApiService';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import {
  Copy,
  Link2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';
import { format, isAfter } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';

interface ShareLinksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportId: string;
}

export default function ShareLinksDialog({
  open,
  onOpenChange,
  reportId,
}: ShareLinksDialogProps) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [accessLevel, setAccessLevel] = useState<'VIEW' | 'COMMENT'>('VIEW');
  const [expiry, setExpiry] = useState<string>('');
  const [visibleCodes, setVisibleCodes] = useState<Set<string>>(new Set());
  const [regeneratingCodes, setRegeneratingCodes] = useState<Set<string>>(new Set());

  // Set default expiry to 2 weeks when dialog opens
  useEffect(() => {
    if (open && !expiry) {
      const twoWeeksFromNow = new Date();
      twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
      const formattedDate = twoWeeksFromNow.toISOString().slice(0, 16);
      setExpiry(formattedDate);
    }
  }, [open, expiry]);

  const { data: links, isLoading } = useQuery<SharedLink[]>({
    queryKey: ['share-links', reportId],
    queryFn: () => listShareLinks(reportId),
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createShareLink(
        reportId,
        accessLevel,
        expiry ? new Date(expiry) : undefined,
      ),
    onSuccess: (data) => {
      navigator.clipboard.writeText(data.url).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['share-links', reportId] });
      setExpiry('');
      // Auto-show the new link's code for a brief moment
      setVisibleCodes(prev => new Set([...prev, data.shareId]));
      toast.success(t('shareDialog.linkCreated'));
    },
    onError: (err) => {
      const errorMessage =
        err instanceof Error ? err.message : t('shareDialog.createError');
      toast.error(errorMessage);
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (shareId: string) => revokeShareLink(shareId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['share-links', reportId] });
      toast.success(t('shareDialog.linkRevoked'));
    },
    onError: (err) => {
      const errorMessage =
        err instanceof Error ? err.message : t('shareDialog.revokeError');
      toast.error(errorMessage);
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: (shareId: string) => regenerateShareCode(shareId),
    onSuccess: (data, shareId) => {
      queryClient.invalidateQueries({ queryKey: ['share-links', reportId] });
      setRegeneratingCodes(prev => {
        const newSet = new Set(prev);
        newSet.delete(shareId);
        return newSet;
      });
      // Auto-show the regenerated code
      setVisibleCodes(prev => new Set([...prev, shareId]));
      toast.success(t('shareDialog.codeRegenerated'));
    },
    onError: (err, shareId) => {
      setRegeneratingCodes(prev => {
        const newSet = new Set(prev);
        newSet.delete(shareId);
        return newSet;
      });
      const errorMessage =
        err instanceof Error ? err.message : t('shareDialog.regenerateError');
      toast.error(errorMessage);
    },
  });

  const handleCopy = (url: string) => {
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success(t('shareDialog.copySuccess')));
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard
      .writeText(code)
      .then(() => toast.success(t('shareDialog.copyCodeSuccess')));
  };

  const toggleCodeVisibility = (shareId: string) => {
    setVisibleCodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(shareId)) {
        newSet.delete(shareId);
      } else {
        newSet.add(shareId);
      }
      return newSet;
    });
  };

  const handleRegenerateCode = (shareId: string) => {
    setRegeneratingCodes(prev => new Set([...prev, shareId]));
    regenerateMutation.mutate(shareId);
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return isAfter(new Date(), new Date(expiresAt));
  };

  const getStatusIcon = (link: SharedLink) => {
    if (isExpired(link.expiresAt)) {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
    if (link.expiresAt) {
      return <Clock className="w-4 h-4 text-yellow-500" />;
    }
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const getStatusText = (link: SharedLink) => {
    if (isExpired(link.expiresAt)) {
      return t('shareDialog.expired');
    }
    if (link.expiresAt) {
      return t('shareDialog.expires', { date: format(new Date(link.expiresAt), 'PPpp') });
    }
    return t('shareDialog.active');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl w-full">
        <DialogHeader>
          <DialogTitle>{t('shareDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('shareDialog.description')}
          </DialogDescription>
        </DialogHeader>

        {/* List existing links */}
        <div className="space-y-4 max-h-[60vh] overflow-auto">
          {isLoading && <p>{t('shareDialog.loading')}</p>}
          {links && links.length === 0 && <p>{t('shareDialog.noActiveLinks')}</p>}
          {links?.map((l) => {
            const url = `${window.location.origin}/share/${l.id}`;
            const expired = isExpired(l.expiresAt);
            const isCodeVisible = visibleCodes.has(l.id);
            const isRegenerating = regeneratingCodes.has(l.id);
            
            return (
              <div
                key={l.id}
                className={`border rounded-lg p-4 space-y-3 ${
                  expired ? 'opacity-60 bg-red-50 border-red-200' : 'hover:bg-muted/30'
                }`}
              >
                {/* Header with status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link2 className="w-4 h-4" />
                    <span className="font-medium">{l.accessLevel}</span>
                    {getStatusIcon(l)}
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        expired
                          ? 'bg-red-100 text-red-700'
                          : l.expiresAt
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {getStatusText(l)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {t('shareDialog.created')} {format(new Date(l.createdAt), 'MMM d, yyyy')}
                    </span>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={revokeMutation.isPending}
                          className="text-red-600 hover:text-red-700"
                          title={t('shareDialog.revokeButton')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('shareDialog.revokeTitle')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('shareDialog.revokeDescription')}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => revokeMutation.mutate(l.id)} className="bg-red-600 hover:bg-red-700">
                            {t('shareDialog.revokeLink')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                {/* Share details */}
                <div className="flex flex-col sm:flex-row sm:gap-4">
                  {/* Share URL */}
                  <div className="space-y-1 sm:flex-1">
                    <label className="text-xs font-medium text-muted-foreground">{t('shareDialog.shareUrl')}</label>
                    <div className="flex items-center gap-2 bg-muted/50 rounded-md p-2">
                      <span className="text-xs font-mono flex-1 truncate max-w-[200px]">{`/share/${l.id}`}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopy(url)}
                        disabled={expired}
                        title={t('shareDialog.copyUrl')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Access Code */}
                  <div className="space-y-1 sm:flex-1">
                    <label className="text-xs font-medium text-muted-foreground">{t('shareDialog.accessCode')}</label>
                    <div className="flex items-center gap-2 bg-muted/50 rounded-md p-2">
                      <code className="text-lg font-mono font-bold tracking-widest flex-1">
                        {isCodeVisible ? l.code : '••••••'}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleCodeVisibility(l.id)}
                        title={isCodeVisible ? t('shareDialog.hideCode') : t('shareDialog.showCode')}
                      >
                        {isCodeVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopyCode(l.code)}
                        disabled={expired}
                        title={t('shareDialog.copyCode')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRegenerateCode(l.id)}
                        disabled={expired || isRegenerating}
                        title={t('shareDialog.generateNewCode')}
                      >
                        <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* Create new link form */}
        <div className="mt-6 border-t pt-4 space-y-4">
          <h4 className="font-medium">{t('shareDialog.createNewLink')}</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>{t('shareDialog.accessLevel')}</Label>
              <Select
                value={accessLevel}
                onValueChange={(v) => setAccessLevel(v as 'VIEW' | 'COMMENT')}
              >
                <SelectTrigger>
                  <SelectValue>{accessLevel}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIEW">{t('shareDialog.view')}</SelectItem>
                  <SelectItem value="COMMENT">{t('shareDialog.comment')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t('shareDialog.expiresAt')}</Label>
              <Input
                type="datetime-local"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? t('shareDialog.creating') : t('shareDialog.createLink')}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
