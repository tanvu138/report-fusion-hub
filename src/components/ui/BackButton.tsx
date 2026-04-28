import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

interface BackButtonProps {
  to?: string;
  label?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ 
  to, 
  label, 
  variant = 'ghost', 
  size = 'sm',
  className = ''
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleBack = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleBack}
      className={`flex items-center gap-2 ${className}`}
      aria-label={label || t('common.back')}
      title={label || t('common.back')}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {label || t('common.back')}
    </Button>
  );
};

export default BackButton;