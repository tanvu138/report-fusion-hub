import React from 'react';
import { FileText, Plus, Search, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

interface EmptyStateProps {
  type: 'no-templates' | 'no-search-results' | 'loading-error';
  onCreateNew?: () => void;
  onClearFilters?: () => void;
  searchQuery?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  onCreateNew,
  onClearFilters,
  searchQuery,
}) => {
  const { t } = useLanguage();
  const renderNoTemplates = () => (
    <Card className="border-dashed border-2">
      <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
          <FileText className="h-12 w-12 text-blue-500" />
        </div>
        
        <h3 className="text-2xl font-semibold text-gray-900 mb-2">
          {t('emptyState.noTemplatesYet.title')}
        </h3>
        
        <p className="text-gray-600 mb-8 max-w-md">
          {t('emptyState.noTemplatesYet.description')}
        </p>

        <div className="space-y-4">
          {onCreateNew && (
            <Button onClick={onCreateNew} size="lg" className="min-w-48">
              <Plus className="h-5 w-5 mr-2" />
              {t('emptyState.noTemplatesYet.action')}
            </Button>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 text-sm">
            <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
              <Layers className="h-8 w-8 text-blue-600 mb-2" />
              <h4 className="font-medium mb-1">{t('emptyState.noTemplatesYet.features.organize')}</h4>
              <p className="text-gray-600 text-center">
                Break down reports into manageable sections
              </p>
            </div>
            
            <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
              <FileText className="h-8 w-8 text-blue-600 mb-2" />
              <h4 className="font-medium mb-1">{t('emptyState.noTemplatesYet.features.assign')}</h4>
              <p className="text-gray-600 text-center">
                Each section can be assigned to different teams
              </p>
            </div>
            
            <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
              <Plus className="h-8 w-8 text-blue-600 mb-2" />
              <h4 className="font-medium mb-1">{t('emptyState.noTemplatesYet.features.reuse')}</h4>
              <p className="text-gray-600 text-center">
                Create consistent reports from templates
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderNoSearchResults = () => (
    <Card className="border-dashed border-2">
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
          <Search className="h-10 w-10 text-gray-400" />
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {t('emptyState.noTemplatesFound.title')}
        </h3>
        
        <p className="text-gray-600 mb-6 max-w-sm">
          {t('emptyState.noTemplatesFound.description')}
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          {onClearFilters && (
            <Button variant="outline" onClick={onClearFilters}>
              {t('emptyState.noTemplatesFound.action')}
            </Button>
          )}
          {onCreateNew && (
            <Button onClick={onCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              {t('emptyState.createNewTemplate')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderLoadingError = () => (
    <Card className="border-dashed border-2 border-red-200">
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <svg className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {t('emptyState.unableToLoad.title')}
        </h3>
        
        <p className="text-gray-600 mb-6 max-w-sm">
          {t('emptyState.unableToLoad.description')}
        </p>

        <Button onClick={() => window.location.reload()} variant="outline">
          {t('emptyState.unableToLoad.action')}
        </Button>
      </CardContent>
    </Card>
  );

  switch (type) {
    case 'no-templates':
      return renderNoTemplates();
    case 'no-search-results':
      return renderNoSearchResults();
    case 'loading-error':
      return renderLoadingError();
    default:
      return null;
  }
};

export default EmptyState;