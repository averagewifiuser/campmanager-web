// src/pages/CreateCampPage.tsx
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CampCreationForm } from '@/components/forms/CampCreationForm';

export const CreateCampPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = (campId: string) => {
    // Navigate to the camp dashboard with success message
    navigate('/dashboard', { 
      state: { 
        message: 'Camp created successfully!',
        newCampId: campId 
      } 
    });
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-6">
            <CampCreationForm
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};