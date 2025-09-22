import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Search, Plus, DollarSign, Users, TrendingUp, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { paymentsApi, registrationsApi } from "@/lib/api";
import PaymentsTable from "@/components/payments/PaymentsTable"; // Updated import
import { useToast } from "@/hooks/use-toast";
import { FullPageLoader } from "@/components/ui/full-page-loader";

// Mock UI Components (keep your existing mock components)
type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { className?: string };
const Input = ({ className = "", ...props }: InputProps) => (
  <input
    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
    {...props}
  />
);

type LabelProps = { children: React.ReactNode; className?: string };
const Label = ({ children, className = "" }: LabelProps) => (
  <label className={`block text-sm font-medium text-gray-700 mb-1 ${className}`}>
    {children}
  </label>
);

type MockSelectProps = {
  children: React.ReactNode;
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
};
const MockSelect = ({ children, value, onValueChange, className = "" }: MockSelectProps) => (
  <select
    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
    value={value}
    onChange={(e) => onValueChange(e.target.value)}
  >
    {children}
  </select>
);

type MockSelectItemProps = { value: string; children: React.ReactNode };
const MockSelectItem = ({ value, children }: MockSelectItemProps) => (
  <option value={value}>{children}</option>
);

const paymentChannelFields = {
  momo: [
    { label: "Mobile Number", name: "mobile_number" },
    { label: "Network", name: "network" },
    { label: "Payment Reference", name: "payment_reference" },
  ],
  cheque: [
    { label: "Cheque Number", name: "cheque_number" },
    { label: "Bank", name: "bank" },
  ],
  cash: [
    { label: "Received By", name: "received_by" },
  ],
  bank_transfer: [
    { label: "Bank Name", name: "bank_name" },
    { label: "Account Number", name: "account_number" },
    { label: "Transaction ID", name: "transaction_id" },
  ],
};

type PaymentFormProps = {
  registrations: any[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading: boolean;
};

// Payment Form Component (keep your existing PaymentForm component as is)
const PaymentForm = ({ registrations, onSubmit, onCancel, loading }: PaymentFormProps) => {
  const [amount, setAmount] = useState<number>(0);
  const [paymentChannel, setPaymentChannel] = useState<string>("momo");
  // const [paymentReference, setPaymentReference] = useState<string>("");
  const [selectedRegistrationIds, setSelectedRegistrationIds] = useState<string[]>([]);
  const [metadata, setMetadata] = useState<{ [key: string]: any }>({});
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);

  const filteredRegistrations = searchQuery.trim() 
    ? registrations.filter((reg) => {
        const query = searchQuery.toLowerCase();
        const camperCode = reg.camper_code?.toLowerCase() || "";
        const fullName = `${reg.surname || ""} ${reg.middle_name || ""} ${reg.last_name || ""}`.toLowerCase();
        return camperCode.includes(query) || fullName.includes(query);
      })
    : [];

  const selectedRegistrations = registrations.filter((reg) =>
    selectedRegistrationIds.includes(reg.id)
  );

  const handleMetadataChange = (name: any, value: any) => {
    setMetadata((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddRegistration = (registration: any) => {
    if (!selectedRegistrationIds.includes(registration.id)) {
      setSelectedRegistrationIds((prev) => [...prev, registration.id]);
    }
    setSearchQuery("");
    setShowSearchResults(false);
  };

  const handleRemoveRegistration = (registrationId: any) => {
    setSelectedRegistrationIds((prev) => prev.filter((id) => id !== registrationId));
  };

  const handleSearchInputChange = (e: any) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSearchResults(value.trim().length > 0);
  };

  const handleSubmit = () => {
    onSubmit({
      amount,
      payment_channel: paymentChannel,
      // payment_reference: paymentReference,
      payment_metadata: metadata,
      registration_ids: selectedRegistrationIds,
    });
    
    // Reset form
    setAmount(0);
    setPaymentChannel("momo");
    // setPaymentReference("");
    setSelectedRegistrationIds([]);
    setMetadata({});
    setSearchQuery("");
  };

  const channelFields = paymentChannel ? (paymentChannelFields as any)[paymentChannel] || [] : [];

  const getRegistrationDisplayName = (reg: any) => {
    return `${reg.surname || ""} ${reg.middle_name || ""} ${reg.last_name || ""}`.trim();
  };

  return (
    <div className="space-y-6">
      <div>
        <Label>Amount</Label>
        <Input
          type="number"
          min={0}
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          placeholder="Enter amount"
          required
        />
      </div>

      <div>
        <Label>Payment Channel</Label>
        <MockSelect value={paymentChannel} onValueChange={setPaymentChannel}>
          <MockSelectItem value="momo">Mobile Money</MockSelectItem>
          <MockSelectItem value="cheque">Cheque</MockSelectItem>
          <MockSelectItem value="cash">Cash</MockSelectItem>
          <MockSelectItem value="bank_transfer">Bank Transfer</MockSelectItem>
        </MockSelect>
      </div>

      {/* <div>
        <Label>Payment Reference</Label>
        <Input
          value={paymentReference}
          onChange={(e) => setPaymentReference(e.target.value)}
          placeholder="Enter payment reference"
          required
        />
      </div> */}

      <div>
        <Label>Search and Add Campers</Label>
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              value={searchQuery}
              onChange={handleSearchInputChange}
              placeholder="Search by camper code or name..."
              className="pl-10"
              onFocus={() => setShowSearchResults(searchQuery.trim().length > 0)}
            />
          </div>
          
          {showSearchResults && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
              {filteredRegistrations.length === 0 ? (
                <div className="px-3 py-2 text-gray-500 text-sm">
                  No campers found matching "{searchQuery}"
                </div>
              ) : (
                filteredRegistrations.map((reg) => (
                  <div
                    key={reg.id}
                    className="px-3 py-2 cursor-pointer hover:bg-gray-100 flex items-center justify-between"
                    onClick={() => handleAddRegistration(reg)}
                  >
                    <div>
                      <div className="font-medium">{getRegistrationDisplayName(reg)}</div>
                      <div className="text-sm text-gray-500">Code: {reg.camper_code}</div>
                    </div>
                    <Plus className="h-4 w-4 text-blue-500" />
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div>
        <Label>Selected Campers ({selectedRegistrations.length})</Label>
        <div className="border rounded-md p-3 min-h-[80px] max-h-40 overflow-y-auto">
          {selectedRegistrations.length === 0 ? (
            <div className="text-gray-500 text-sm">No campers selected</div>
          ) : (
            <div className="space-y-2">
              {selectedRegistrations.map((reg) => (
                <div
                  key={reg.id}
                  className="flex items-center justify-between bg-blue-50 p-2 rounded"
                >
                  <div>
                    <div className="font-medium">{getRegistrationDisplayName(reg)}</div>
                    <div className="text-sm text-gray-600">Code: {reg.camper_code}</div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveRegistration(reg.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {channelFields.length > 0 && (
        <div>
          <Label>Payment Details</Label>
          <div className="space-y-3">
            {channelFields.map((field: any) => (
              <div key={field.name}>
                <Label>{field.label}</Label>
                <Input
                  value={metadata[field.name] || ""}
                  onChange={(e) => handleMetadataChange(field.name, e.target.value)}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  required
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button 
          type="button" 
          variant="default" 
          disabled={loading || selectedRegistrations.length === 0}
          onClick={handleSubmit}
        >
          {loading ? "Saving..." : "Save Payment"}
        </Button>
      </div>
    </div>
  );
};

// Main Payments Page Component
const PaymentsPage = () => {
  const { campId } = useParams();
  const { toast } = useToast();
  const [payments, setPayments] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [sideNavOpen, setSideNavOpen] = useState<boolean>(false);
  const [formLoading, setFormLoading] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [recordedByFilter, setRecordedByFilter] = useState<string>('all');
  const [registrationsLoaded, setRegistrationsLoaded] = useState<boolean>(false);
  const [registrationsFetching, setRegistrationsFetching] = useState<boolean>(false);

  // Filter payments based on "Recorded By" filter
  const filteredPayments = payments.filter(payment => {
    return recordedByFilter === 'all' || payment.recorded_by === recordedByFilter;
  });

  // Get unique "Recorded By" values for filter dropdown
  const uniqueRecordedBy = [...new Set(payments.map(p => p.recorded_by).filter(Boolean))];

  // Calculate payment statistics based on filtered data
  const paymentStats = {
    totalAmount: filteredPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0),
    totalPayments: filteredPayments.length,
    averagePayment: filteredPayments.length > 0 ? filteredPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0) / filteredPayments.length : 0,
    paymentsByChannel: filteredPayments.reduce((acc, payment) => {
      const channel = payment.payment_channel;
      acc[channel] = (acc[channel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    recentPayments: filteredPayments.filter(payment => {
      const paymentDate = new Date(payment.payment_date);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return paymentDate >= sevenDaysAgo;
    }).length
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2
    }).format(amount);
  };

  useEffect(() => {
    if (!campId) return;
    setLoading(true);
    // Reset registrations and lazy-load them only when the side panel opens
    setRegistrations([]);
    setRegistrationsLoaded(false);
    paymentsApi.getCampPayments(campId)
      .then((paymentsData) => {
        setPayments(paymentsData || []);
      })
      .finally(() => setLoading(false));
  }, [campId]);

  // Lazy-load registrations only when needed (when side panel opens)
  useEffect(() => {
    if (!campId) return;
    if (sideNavOpen && !registrationsLoaded && !registrationsFetching) {
      setRegistrationsFetching(true);
      registrationsApi.getCampRegistrations(campId)
        .then((data) => setRegistrations(data || []))
        .finally(() => {
          setRegistrationsLoaded(true);
          setRegistrationsFetching(false);
        });
    }
  }, [sideNavOpen, campId, registrationsLoaded, registrationsFetching]);

  const handlePaymentSubmit = async (formData: any) => {
    if (!campId) return;
    setFormLoading(true);
    try {
      await paymentsApi.createPayment(campId, formData);
      // Refetch payments after successful creation
      const updatedPayments = await paymentsApi.getCampPayments(campId);
      setPayments(updatedPayments || []);
      setSideNavOpen(false);
      toast({
        title: "Success",
        description: "Payment has been recorded successfully.",
        variant: "default",
      });
    } catch (error: any) {
      console.error('Error creating payment:', error);
      
      // Handle 500 errors specifically
      if (error?.response?.status === 500 || error?.status === 500) {
        toast({
          title: "Something went wrong",
          description: "We encountered an unexpected error while processing your payment. Please try again later.",
          variant: "destructive",
        });
      } else {
        // Handle other errors
        const errorMessage = error?.response?.data?.message || error?.message || "Failed to create payment";
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setFormLoading(false);
    }
  };

  if (!campId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-destructive">No camp selected.</p>
            <Button variant="outline" className="mt-4" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Full Page Loader */}
      {formLoading && <FullPageLoader message="Processing payment..." />}
      
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Payments Management</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Filter by Recorded By:</span>
                <Select value={recordedByFilter} onValueChange={setRecordedByFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {uniqueRecordedBy.map((person) => (
                      <SelectItem key={person} value={person}>
                        {person}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => setSideNavOpen(true)} variant="default">
                <Plus className="h-4 w-4 mr-2" />
                New Payment
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div>Loading...</div>
            </div>
          ) : (
            <>
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(paymentStats.totalAmount)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      From {paymentStats.totalPayments} payments
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Payment</CardTitle>
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(paymentStats.averagePayment)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Per transaction
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Recent Payments</CardTitle>
                    <Calendar className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {paymentStats.recentPayments}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Last 7 days
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Most Used Channel</CardTitle>
                    <Users className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold text-orange-600">
                      {Object.keys(paymentStats.paymentsByChannel).length > 0 
                        ? Object.entries(paymentStats.paymentsByChannel)
                        // @ts-ignore
                            .sort(([,a], [,b]) => b - a)[0]?.[0]?.toUpperCase() || 'N/A'
                        : 'N/A'
                      }
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {Object.keys(paymentStats.paymentsByChannel).length > 0 
                        ? `${Object.entries(paymentStats.paymentsByChannel)
                        // @ts-ignore
                            .sort(([,a], [,b]) => b - a)[0]?.[1] || 0} payments`
                        : 'No payments yet'
                      }
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Payments Table */}
              <PaymentsTable payments={filteredPayments} isLoading={loading} />
            </>
          )}
        </div>
      </main>

      {/* Side Navigation */}
      {sideNavOpen && (
        <div className="fixed right-0 top-0 h-full w-full sm:w-3/4 md:w-1/2 bg-white border-l shadow-lg z-50">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-semibold">New Payment</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSideNavOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-4 overflow-auto h-full pb-20">
            <PaymentForm
              registrations={registrations}
              onSubmit={handlePaymentSubmit}
              onCancel={() => setSideNavOpen(false)}
              loading={formLoading}
            />
          </div>
        </div>
      )}

      {/* Overlay */}
      {sideNavOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-30 z-40"
          onClick={() => setSideNavOpen(false)}
        />
      )}
    </div>
  );
};

export default PaymentsPage;
