// src/pages/EditCampPage.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CampEditForm } from '@/components/forms/CampEditForm';
import { useCamp } from '@/hooks/useCamps';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export const EditCampPage: React.FC = () => {
  const { campId } = useParams<{ campId: string }>();
  const navigate = useNavigate();
  
  const { data: camp, isLoading, error } = useCamp(campId!);

  const handleSuccess = () => {
    navigate(`/camps/${campId}`, {
      state: { message: 'Camp updated successfully!' }
    });
  };

  const handleCancel = () => {
    navigate(`/camps/${campId}`);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !camp) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-destructive mb-4">Failed to load camp details</p>
            <Button onClick={() => navigate('/camps')}>
              Back to Camps
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/camps/${campId}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Camp Details
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Edit Camp</h1>
              <p className="text-sm text-muted-foreground">{camp.name}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Update Camp Details</CardTitle>
          </CardHeader>
          <CardContent>
            <CampEditForm
              camp={camp}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};