
import React from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';

const NotFound = () => {
  const location = useLocation();
  const { t } = useLanguage();

  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center py-20">
        <h1 className="text-6xl font-bold text-gray-900">{t('notFound.title')}</h1>
        <p className="mt-4 text-xl text-gray-600">{t('notFound.pageNotFound')}</p>
        <p className="mt-2 text-gray-500">
          {t('notFound.description')}
        </p>
        <Button asChild className="mt-8">
          <a href="/">{t('notFound.goHome')}</a>
        </Button>
      </div>
    </MainLayout>
  );
};

export default NotFound;
