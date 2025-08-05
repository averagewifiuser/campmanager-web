// src/pages/LoginPage.tsx
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '@/components/forms/LoginForm';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
            <span className="text-primary-foreground font-bold text-xl">CM</span>
          </div>
        </CardHeader>
        <CardContent>
          <LoginForm onSuccess={handleLoginSuccess} />
        </CardContent>
      </Card>
    </div>
  );
};