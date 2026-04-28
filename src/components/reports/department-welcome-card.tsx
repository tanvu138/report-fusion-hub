import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DISMISS_KEY = 'department-welcome-dismissed';

const DepartmentWelcomeCard = () => {
  const { t } = useLanguage();
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(DISMISS_KEY) === '1'; }
    catch { return false; }
  });

  if (dismissed) return null;

  const handleDismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* restricted storage */ }
    setDismissed(true);
  };

  return (
    <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm text-blue-800">
      <Info className="w-4 h-4 shrink-0 text-blue-600" />
      <span className="flex-1 truncate">{t('dashboard.welcome.subtitle')}</span>
      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-blue-600 hover:text-blue-800 hover:bg-blue-100" onClick={handleDismiss} aria-label={t('dashboard.dismiss')}>
        <X className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
};

export default DepartmentWelcomeCard;
