
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/layout/MainLayout';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

const Login = () => {
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user, isLoading: authLoading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    setIsLoading(true);

    try {
      await login(username, password);
      
      toast({
        title: t('login.success'),
        description: t('login.successMessage'),
      });
      
      // The useEffect will handle the navigation
    } catch (error) {
      console.error('Login error:', error);
      
      const errorMessage = error instanceof Error ? error.message : t('login.invalidCredentials');
      toast({
        title: t('login.error'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const demoAccounts = [
    { username: 'admin', email: 'admin@tpg.test', password: 'admin123', role: t('login.roles.secretary') },
    { username: 'department', email: 'department@tpg.test', password: 'dept123', role: t('login.roles.department') },
    { username: 'lead', email: 'lead@example.com', password: '123123', role: t('login.roles.leadership') },
    { username: 'finance', email: 'finance@example.com', password: '123123', role: t('login.roles.finance') },
    { username: 'hr', email: 'hr@example.com', password: '123123', role: t('login.roles.hr') },
    { username: 'ops', email: 'ops@example.com', password: '123123', role: t('login.roles.operations') }
  ];

  const setDemoAccount = (username: string, password: string) => {
    setUsername(username);
    setPassword(password);
  };

  return (
    <MainLayout>
      <div className="flex justify-center items-center min-h-[calc(100vh-12rem)]">
        <div className="w-full max-w-3xl">
          <Alert className="mb-6">
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>{t('login.demoModeTitle')}</AlertTitle>
            <AlertDescription>
              {t('login.demoModeDesc')}
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="w-full">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold">{t('login.title')}</CardTitle>
                <CardDescription>
                  {t('login.description')}
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">{t('login.username')}</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder={t('login.usernamePlaceholder')}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">{t('login.password')}</Label>
                      <a
                        href="#"
                        className="text-sm text-primary hover:underline"
                        onClick={(e) => {
                          e.preventDefault();
                          toast({
                            description: t('login.passwordResetNotImplemented'),
                          });
                        }}
                      >
                        {t('login.forgotPassword')}
                      </a>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? t('login.signingIn') : t('login.signIn')}
                  </Button>
                </CardFooter>
              </form>
            </Card>
            
            <Card className="w-full">
              <CardHeader className="space-y-1">
                <CardTitle className="text-xl font-bold">{t('login.demoAccountsTitle')}</CardTitle>
                <CardDescription>
                  {t('login.demoAccountsDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {demoAccounts.map((account, index) => (
                    <React.Fragment key={account.username}>
                      <div 
                        className="p-3 rounded-md hover:bg-muted cursor-pointer transition-colors"
                        onClick={() => setDemoAccount(account.username, account.password)}
                      >
                        <div className="font-medium">{account.role}</div>
                        <div className="text-sm text-muted-foreground">{t('login.usernameLabelDemo')} {account.username}</div>
                        {account.email && <div className="text-sm text-muted-foreground">{t('login.emailLabelDemo')} {account.email}</div>}
                        <div className="text-sm text-muted-foreground">{t('login.passwordLabelDemo')} {account.password}</div>
                      </div>
                      {index < demoAccounts.length - 1 && <Separator />}
                    </React.Fragment>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Login;
