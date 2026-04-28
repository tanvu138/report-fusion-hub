import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchSharedSnapshot } from '@/services/sharedReportApiService';
import { Report } from '@/types/report';
import FullReportPreview from '@/components/reports/FullReportPreview';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Lock, FileText, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ShareSnapshotPage() {
  const { t } = useLanguage();
  const { shareId } = useParams<{ shareId: string }>();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<Report | null>(null);

  // Create session storage key for this specific share
  const storageKey = `shared-report-${shareId}`;

  // Load saved code and snapshot from sessionStorage on mount
  useEffect(() => {
    if (!shareId) return;
    
    try {
      const savedCode = sessionStorage.getItem(`${storageKey}-code`);
      const savedSnapshot = sessionStorage.getItem(`${storageKey}-snapshot`);
      
      if (savedCode && savedSnapshot) {
        setCode(savedCode);
        setSnapshot(JSON.parse(savedSnapshot));
      }
    } catch (err) {
      console.warn('Failed to load saved shared report data:', err);
      // Clear corrupted data
      sessionStorage.removeItem(`${storageKey}-code`);
      sessionStorage.removeItem(`${storageKey}-snapshot`);
    }
  }, [shareId, storageKey]);

  const handleSubmit = async () => {
    if (!shareId || !code.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const data = await fetchSharedSnapshot(shareId, code.trim());
      setSnapshot(data);
      
      // Save to sessionStorage for persistence across page refreshes
      sessionStorage.setItem(`${storageKey}-code`, code.trim());
      sessionStorage.setItem(`${storageKey}-snapshot`, JSON.stringify(data));
      
      toast.success(t('share.reportLoadedSuccess'));
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || t('share.failedToLoadReport');
      setError(errorMessage);
      toast.error(errorMessage);
      
      // Clear any stale data on error
      sessionStorage.removeItem(`${storageKey}-code`);
      sessionStorage.removeItem(`${storageKey}-snapshot`);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  if (snapshot) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FileText className="w-4 h-4" />
            <span>{t('share.sharedReport')}</span>
            <span className="text-gray-400">•</span>
            <span>{t('share.readOnly')}</span>
          </div>
        </div>
        <FullReportPreview report={snapshot} user={null} shareId={shareId} shareCode={code} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle>{t('share.accessProtectedReport')}</CardTitle>
          <CardDescription>
            {t('share.enterAccessCode')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              placeholder={t('share.enterCodePlaceholder')}
              className="text-center text-lg font-mono tracking-widest"
              maxLength={6}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            className="w-full"
            disabled={loading || !code.trim() || code.length !== 6}
          >
            {loading ? t('share.loading') : t('share.accessReport')}
          </Button>

          <div className="text-xs text-gray-500 text-center">
            {t('share.noAccessCode')}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
