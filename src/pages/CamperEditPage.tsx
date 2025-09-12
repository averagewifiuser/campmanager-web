import React, { useState, useEffect } from 'react';
import { useLocation, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { PublicRegistrationForm } from '../components/public/PublicRegistrationForm';
import { CamperData } from '../hooks/useOtpVerification';
import { useToast } from '../hooks/use-toast';
import { useCampRegistrationForm } from '../hooks/usePublicRegistration';
import api, { handleApiError } from '../lib/api';
import { ApiResponse } from '../lib/types';
import type { RegistrationFormData } from '../lib/types';
import { ArrowLeft } from 'lucide-react';

export const CamperEditPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { registrationId } = useParams<{ registrationId: string }>();
  const { toast } = useToast();
  const camperData = location.state?.camperData as CamperData;

  // Redirect if no camper data
  if (!camperData) {
    return <Navigate to="/camper-verification" replace />;
  }

  // Get registration data for the form
  const { data: registrationData, isLoading, error } = useCampRegistrationForm(camperData.camp_id);

  // Mutation for updating registration
  const updateRegistrationMutation = useMutation({
    mutationFn: async (data: RegistrationFormData) => {
      const response = await api.put<ApiResponse<any>>(
        `/register/registration/${camperData.id}`,
        { data }
      );
      return response.data;
    },
    onSuccess: async () => {
      try {
        // Fetch updated camper data
        const updatedDataResponse = await api.get<ApiResponse<CamperData>>(
          `/camps/registrations/${camperData.id}`
        );
        const updatedCamperData = updatedDataResponse.data.data;

        toast({
          title: 'Success',
          description: 'Your information has been updated successfully!',
        });

        // Navigate back to camper data page with updated data
        navigate('/camper-data', {
          state: { camperData: updatedCamperData },
          replace: true,
        });
      } catch (error) {
        // If fetching updated data fails, still navigate back but with original data
        console.error('Failed to fetch updated camper data:', error);
        toast({
          title: 'Success',
          description: 'Your information has been updated successfully!',
        });
        navigate('/camper-data', {
          state: { camperData },
          replace: true,
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Update Failed',
        description: handleApiError(error),
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = async (formData: RegistrationFormData) => {
    await updateRegistrationMutation.mutateAsync(formData);
  };

  const handleGoBack = () => {
    navigate('/camper-data', {
      state: { camperData },
      replace: false,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (error || !registrationData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p>Unable to load registration form. Please try again later.</p>
            <Button onClick={handleGoBack} variant="outline">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Button
            onClick={handleGoBack}
            variant="ghost"
            className="mb-4 flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Information</span>
          </Button>
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Registration Information</h1>
            <p className="text-gray-600 mt-2">
              Update your camp registration details below.
            </p>
          </div>
        </div>

        <PrefilledRegistrationForm
          registrationData={registrationData}
          camperData={camperData}
          onSubmit={handleSubmit}
          isSubmitting={updateRegistrationMutation.isPending}
          submitError={updateRegistrationMutation.error ? handleApiError(updateRegistrationMutation.error) : null}
        />
      </div>
    </div>
  );
};

// Component that wraps PublicRegistrationForm with pre-filled data
interface PrefilledRegistrationFormProps {
  registrationData: any;
  camperData: CamperData;
  onSubmit: (data: RegistrationFormData) => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
}

const PrefilledRegistrationForm: React.FC<PrefilledRegistrationFormProps> = ({
  registrationData,
  camperData,
  onSubmit,
  isSubmitting,
  submitError,
}) => {
  const [modifiedRegistrationData, setModifiedRegistrationData] = useState(registrationData);

  useEffect(() => {
    if (registrationData) {
      // Create a modified version of the PublicRegistrationForm that has pre-filled values
      // We'll need to modify the form's default values based on camperData
      const prefilledData = {
        ...registrationData,
        // Add prefilled values that will be used by the form
        prefilledValues: {
          surname: camperData.surname || '',
          middle_name: camperData.middle_name || '',
          last_name: camperData.last_name || '',
          sex: camperData.sex || '',
          age: camperData.age || 18,
          email: camperData.email || '',
          phone_number: camperData.phone_number || '',
          emergency_contact_name: camperData.emergency_contact_name || '',
          emergency_contact_phone: camperData.emergency_contact_phone || '',
          church_id: camperData.church_id || '',
          category_id: camperData.category_id || '',
          custom_field_responses: camperData.custom_field_responses || {},
        },
      };
      
      console.log('Setting prefilled data:', prefilledData.prefilledValues);
      setModifiedRegistrationData(prefilledData);
    }
  }, [registrationData, camperData]);

  return (
    <PublicRegistrationForm
      registrationData={modifiedRegistrationData}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitError={submitError}
    />
  );
};
