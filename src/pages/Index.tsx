
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Users, Calendar, FileOutput } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const Index = () => {
  const { t } = useLanguage();
  
  return (
    <>
      <div className="min-h-screen bg-neutral-light">
      {/* The rest of the home page content is wrapped below the header */}
      <main className="container mx-auto px-4 py-12">
        <div className="space-y-16">
          <section className="space-y-4 text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-tpg-blue">
              {t('index.hero.title')}
            </h1>
            <p className="mx-auto max-w-[700px] text-neutral-dark">
              {t('index.hero.subtitle')}
            </p>
            <div className="flex justify-center gap-4">
              <Button asChild size="lg" className="bg-tpg-red text-white hover:bg-tpg-red/90">
                <a href="/login">{t('index.cta.getStarted')}</a>
              </Button>
              <Button variant="outline" asChild size="lg" className="border-tpg-blue text-tpg-blue hover:bg-tpg-blue/10 hover:text-tpg-blue">
                <a href="/login">{t('index.cta.liveDemo')}</a>
              </Button>
            </div>
          </section>

        <section className="space-y-8 py-8">
          <h2 className="text-3xl font-bold tracking-tight text-center text-tpg-blue">
            {t('index.features.title')}
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="space-y-1">
                <div className="flex justify-center">
                  <FileText className="h-8 w-8 text-tpg-blue" />
                </div>
                <CardTitle className="text-center">{t('index.features.collaborative.title')}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p>{t('index.features.collaborative.description')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="space-y-1">
                <div className="flex justify-center">
                  <Users className="h-8 w-8 text-tpg-blue" />
                </div>
                <CardTitle className="text-center">{t('index.features.roleBasedAccess.title')}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p>{t('index.features.roleBasedAccess.description')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="space-y-1">
                <div className="flex justify-center">
                  <Calendar className="h-8 w-8 text-tpg-blue" />
                </div>
                <CardTitle className="text-center">{t('index.features.customizableCycles.title')}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p>{t('index.features.customizableCycles.description')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="space-y-1">
                <div className="flex justify-center">
                  <FileOutput className="h-8 w-8 text-tpg-blue" />
                </div>
                <CardTitle className="text-center">{t('index.features.exportDocx.title')}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p>{t('index.features.exportDocx.description')}</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-8 py-8">
          <div className="grid gap-6 md:grid-cols-2 items-center">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tight text-tpg-blue">
                {t('index.leadership.title')}
              </h2>
              <p className="text-neutral-dark">
                {t('index.leadership.description')}
              </p>
              <Button asChild className="bg-tpg-red text-white hover:bg-tpg-red/90">
                <a href="/login">{t('index.leadership.tryButton')}</a>
              </Button>
            </div>
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-tpg-blue" />
                  <span>{t('index.leadership.features.createReports')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-tpg-blue" />
                  <span>{t('index.leadership.features.toggleSections')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-tpg-blue" />
                  <span>{t('index.leadership.features.previewReports')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-tpg-blue" />
                  <span>{t('index.leadership.features.exportReports')}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 items-center">
            <div className="order-2 md:order-1 rounded-lg border bg-card text-card-foreground shadow-sm p-6">
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-tpg-blue" />
                  <span>{t('index.departments.features.seeReports')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-tpg-blue" />
                  <span>{t('index.departments.features.editMarkdown')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-tpg-blue" />
                  <span>{t('index.departments.features.addContent')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-tpg-blue" />
                  <span>{t('index.departments.features.saveUpdates')}</span>
                </li>
              </ul>
            </div>
            <div className="order-1 md:order-2 space-y-4">
              <h2 className="text-3xl font-bold tracking-tight text-tpg-blue">
                {t('index.departments.title')}
              </h2>
              <p className="text-neutral-dark">
                {t('index.departments.description')}
              </p>
              <Button asChild className="bg-tpg-red text-white hover:bg-tpg-red/90">
                <a href="/login">{t('index.departments.tryButton')}</a>
              </Button>
            </div>
          </div>
        </section>
        </div>
      </main>
    </div>
  </>);
};

export default Index;
