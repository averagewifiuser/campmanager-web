import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { OtpInput } from '../components/ui/otp-input';
import { useOtpRequest, useOtpVerify } from '../hooks/useOtpVerification';
import { useToast } from '../hooks/use-toast';

type VerificationStep = 'camper-code' | 'otp-verification';

export const CamperVerificationPage: React.FC = () => {
  const [step, setStep] = useState<VerificationStep>('camper-code');
  const [camperCode, setCamperCode] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const otpRequestMutation = useOtpRequest();
  const otpVerifyMutation = useOtpVerify();

  const handleCamperCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!camperCode.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter your camper code.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await otpRequestMutation.mutateAsync({ camper_code: camperCode.trim() });
      setStep('otp-verification');
      toast({
        title: 'OTP Sent',
        description: 'A 6-digit verification code has been sent to your registered phone number.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send OTP. Please check your camper code and try again.',
        variant: 'destructive',
      });
    }
  };

  const handleOtpComplete = async (otp: string) => {
    try {
      const camperData = await otpVerifyMutation.mutateAsync({
        camper_code: camperCode,
        otp_code: otp,
      });

      toast({
        title: 'Verification Successful',
        description: 'Welcome! Redirecting to your information...',
      });

      // Navigate to camper data page with the retrieved data
      navigate('/camper-data', {
        state: { camperData },
        replace: true,
      });
    } catch (error) {
      toast({
        title: 'Verification Failed',
        description: error instanceof Error ? error.message : 'Invalid OTP. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleBackToCamperCode = () => {
    setStep('camper-code');
    setCamperCode('');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Camper Verification
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {step === 'camper-code' 
              ? 'Enter your camper code to get started'
              : 'Enter the 6-digit code sent to your phone'
            }
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {step === 'camper-code' ? 'Enter Camper Code' : 'Verify OTP'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {step === 'camper-code' ? (
              <form onSubmit={handleCamperCodeSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="camper-code">Camper Code</Label>
                  <Input
                    id="camper-code"
                    type="text"
                    value={camperCode}
                    onChange={(e) => setCamperCode(e.target.value.toUpperCase())}
                    placeholder="Enter your camper code"
                    className="mt-1"
                    disabled={otpRequestMutation.isPending}
                    autoFocus
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Your camper code was provided during registration
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={otpRequestMutation.isPending || !camperCode.trim()}
                >
                  {otpRequestMutation.isPending ? (
                    <>
                      <LoadingSpinner className="mr-2 h-4 w-4" />
                      Sending OTP...
                    </>
                  ) : (
                    'Send Verification Code'
                  )}
                </Button>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    We've sent a 6-digit verification code to your registered phone number.
                  </p>
                  <p className="text-xs text-gray-500 mb-6">
                    Camper Code: <span className="font-mono font-semibold">{camperCode}</span>
                  </p>
                </div>

                <div>
                  <Label className="block text-center mb-4">Enter Verification Code</Label>
                  <OtpInput
                    length={6}
                    onComplete={handleOtpComplete}
                    disabled={otpVerifyMutation.isPending}
                    className="mb-4"
                  />
                  {otpVerifyMutation.isPending && (
                    <div className="flex items-center justify-center mt-4">
                      <LoadingSpinner className="mr-2 h-4 w-4" />
                      <span className="text-sm text-gray-600">Verifying...</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBackToCamperCode}
                    disabled={otpVerifyMutation.isPending}
                    className="w-full"
                  >
                    Back to Camper Code
                  </Button>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      otpRequestMutation.mutate({ camper_code: camperCode });
                      toast({
                        title: 'OTP Resent',
                        description: 'A new verification code has been sent to your phone.',
                      });
                    }}
                    disabled={otpRequestMutation.isPending || otpVerifyMutation.isPending}
                    className="w-full text-sm"
                  >
                    Resend Code
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Having trouble? Contact the camp organizers for assistance.
          </p>
        </div>
      </div>
    </div>
  );
};
