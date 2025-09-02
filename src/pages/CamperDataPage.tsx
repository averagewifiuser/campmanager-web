import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { CamperData } from '../hooks/useOtpVerification';

export const CamperDataPage: React.FC = () => {
  const location = useLocation();
  const camperData = location.state?.camperData as CamperData;

  // Redirect if no camper data
  if (!camperData) {
    return <Navigate to="/camper-verification" replace />;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'GHS', // Assuming Ghana Cedis based on the project context
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Camper Information</h1>
          <p className="text-gray-600 mt-2">
            Welcome back! Here's your camp registration information.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Personal Information
                <Badge variant={camperData.has_checked_in ? "default" : "secondary"}>
                  {camperData.has_checked_in ? "Checked In" : "Not Checked In"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Full Name</label>
                <p className="text-lg font-semibold">
                  {camperData.surname} {camperData.middle_name} {camperData.last_name}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Age</label>
                  <p className="text-lg">{camperData.age} years</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Gender</label>
                  <p className="text-lg capitalize">{camperData.sex}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Camper Code</label>
                <p className="text-lg font-mono bg-gray-100 px-2 py-1 rounded">
                  {camperData.camper_code}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-lg">{camperData.email || 'Not provided'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Phone Number</label>
                <p className="text-lg">{camperData.phone_number}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Church</label>
                <p className="text-lg">{camperData.church.name}</p>
                <p className="text-sm text-gray-500">{camperData.church.area}, {camperData.church.district}</p>
              </div>

              {/* <div>
                <label className="text-sm font-medium text-gray-500">Category ID</label>
                <p className="text-lg">{camperData.category_id}</p>
              </div> */}
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Emergency Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Contact Name</label>
                <p className="text-lg">{camperData.emergency_contact_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Contact Phone</label>
                <p className="text-lg">{camperData.emergency_contact_phone}</p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Payment Information
                <Badge variant={camperData.is_fully_paid ? "default" : "destructive"}>
                  {camperData.is_fully_paid ? "Fully Paid" : "Outstanding Balance"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <label className="text-sm font-medium text-blue-600">Total Amount</label>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatCurrency(parseFloat(camperData.total_amount))}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <label className="text-sm font-medium text-green-600">Total Payments</label>
                  <p className="text-2xl font-bold text-green-900">
                    {formatCurrency(camperData.total_payments)}
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${
                  camperData.outstanding_balance > 0 ? 'bg-red-50' : 'bg-gray-50'
                }`}>
                  <label className={`text-sm font-medium ${
                    camperData.outstanding_balance > 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    Outstanding Balance
                  </label>
                  <p className={`text-2xl font-bold ${
                    camperData.outstanding_balance > 0 ? 'text-red-900' : 'text-gray-900'
                  }`}>
                    {formatCurrency(camperData.outstanding_balance)}
                  </p>
                </div>
              </div>

              {/* Payment History */}
              {camperData.payments && camperData.payments.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Payment History</h3>
                  <div className="space-y-3">
                    {camperData.payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-4 bg-white border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              {formatCurrency(payment.amount)}
                            </span>
                            <Badge variant="outline">
                              {payment.payment_channel.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            Reference: {payment.payment_reference}
                          </p>
                          <p className="text-sm text-gray-600">
                            Recorded by: {payment.recorded_by}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {formatDate(payment.payment_date)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!camperData.payments || camperData.payments.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <p>No payments recorded yet.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Registration Details */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Registration Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Registration Date</label>
                <p className="text-lg">{formatDate(camperData.registration_date)}</p>
              </div>

              {/* Custom Fields */}
              {camperData.custom_field_responses && 
               Object.keys(camperData.custom_field_responses).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Additional Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(camperData.custom_field_responses).map(([key, value]) => (
                      <div key={key}>
                        <label className="text-sm font-medium text-gray-500 capitalize">
                          {key.replace('_', ' ')}
                        </label>
                        <p className="text-lg">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <Button
            onClick={() => window.location.href = '/camper-verification'}
            variant="outline"
          >
            Verify Another Camper
          </Button>
        </div>
      </div>
    </div>
  );
};
