// src/pages/PublicRegistrationPage.tsx
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PublicRegistrationForm } from '@/components/public/PublicRegistrationForm';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  useCampRegistrationForm, 
  useRegistrationFormByLink,
  useSubmitRegistration,
  useSubmitRegistrationByLink 
} from '@/hooks/usePublicRegistration';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { RegistrationFormData, Registration } from '@/lib/types';

export const PublicRegistrationPage: React.FC = () => {
  const { campId, linkToken } = useParams<{ campId?: string; linkToken?: string }>();
  const [registrationResult, setRegistrationResult] = useState<Registration | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Determine which data to fetch based on route
  const isLinkRegistration = !!linkToken;
  
  // Fetch registration form data
  const { 
    data: campFormData, 
    isLoading: campFormLoading, 
    error: campFormError 
  } = useCampRegistrationForm(campId || '');
  
  const { 
    data: linkFormData, 
    isLoading: linkFormLoading, 
    error: linkFormError 
  } = useRegistrationFormByLink(linkToken || '');

  // Submit mutations
  const submitRegistrationMutation = useSubmitRegistration();
  const submitRegistrationByLinkMutation = useSubmitRegistrationByLink();

  // Determine which data to use
  const registrationData = isLinkRegistration ? linkFormData : campFormData;
  const isLoading = isLinkRegistration ? linkFormLoading : campFormLoading;
  const error = isLinkRegistration ? linkFormError : campFormError;
  const isSubmitting = submitRegistrationMutation.isPending || submitRegistrationByLinkMutation.isPending;

  // Handle form submission
  const handleSubmit = async (data: RegistrationFormData) => {
    try {
      setSubmitError(null);
      
      let result: Registration;
      
      if (isLinkRegistration && linkToken) {
        result = await submitRegistrationByLinkMutation.mutateAsync({
          linkToken,
          data
        });
      } else if (campId) {
        result = await submitRegistrationMutation.mutateAsync({
          campId,
          data
        });
      } else {
        throw new Error('Invalid registration parameters');
      }
      
      setRegistrationResult(result);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Error state
  if (error || !registrationData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Registration Unavailable</h2>
            <p className="text-muted-foreground mb-4">
              {error instanceof Error ? error.message : 'This registration form is not available.'}
            </p>
            <p className="text-sm text-muted-foreground">
              Please contact the camp organizers for assistance.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (registrationResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-2xl">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-6" />
            
            <h1 className="text-2xl font-bold text-green-800 mb-2">
              Registration Successful! 🎉
            </h1>
            
            <p className="text-muted-foreground mb-6">
              Thank you for registering for {registrationData.camp.name}!
            </p>

            {/* Registration Details */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6 text-left">
              <h3 className="font-semibold text-green-800 mb-4">Registration Details</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-green-700">Participant:</span>
                  <span className="text-sm font-medium">
                    {registrationResult.surname} {registrationResult.middle_name} {registrationResult.last_name}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-green-700">Camper Code:</span>
                  <span className="text-sm font-medium">
                    {registrationResult.camper_code}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-green-700">Registration Fee:</span>
                  <span className="text-sm font-medium">
                    {formatCurrency(registrationResult.total_amount)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-green-700">Payment Status:</span>
                  <Badge variant={registrationResult.has_paid ? "default" : "destructive"}>
                    {registrationResult.has_paid ? "Paid" : "Payment Pending"}
                  </Badge>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-green-700">Registration Date:</span>
                  <span className="text-sm font-medium">
                    {formatDate(registrationResult.registration_date)}
                  </span>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 text-left">
              <h3 className="font-semibold text-blue-800 mb-3">What's Next?</h3>
              <div className="space-y-2 text-sm text-blue-700">
                {!registrationResult.has_paid && (
                  <p>• Complete your payment to secure your spot</p>
                )}
                <p>• You'll receive a confirmation email with camp details</p>
                <p>• Bring your confirmation on the day of the camp</p>
                <p>• Contact us if you have any questions</p>
              </div>
            </div>

            {/* Camp Information */}
            <div className="border rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold mb-3">{registrationData.camp.name}</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>📅 {formatDate(registrationData.camp.start_date)} - {formatDate(registrationData.camp.end_date)}</p>
                <p>📍 {registrationData.camp.location}</p>
                <p>⏰ Registration Deadline: {formatDate(registrationData.camp.registration_deadline)}</p>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Need help? Contact the camp organizers.
              </p>
              
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="mr-2"
              >
                Print Confirmation
              </Button>
              
              <Button
                onClick={() => window.location.href = '/'}
              >
                Done
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Registration form state
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">CM</span>
              </div>
              <h1 className="text-xl font-semibold">Camp Registration</h1>
            </div>
            
            {/* Link Info */}
            {registrationData.link_info && (
              <Badge variant="outline">
                {registrationData.link_info.name}
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <PublicRegistrationForm
          registrationData={registrationData}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitError={submitError}
        />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            Powered by CampManager - Making camp registration simple
          </p>
        </div>
      </footer>
    </div>
  );
};