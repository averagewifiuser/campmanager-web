import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus, DollarSign, Users, TrendingUp, Calendar } from "lucide-react";
import { pledgesApi, registrationsApi } from "@/lib/api";
import PledgesTable from "@/components/pledges/PledgesTable";
import PledgeForm from "@/components/pledges/PledgeForm";
import { Pledge } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { FullPageLoader } from "@/components/ui/full-page-loader";

const PledgesPage = () => {
  const { campId } = useParams();
  const { toast } = useToast();
  const [pledges, setPledges] = useState<Pledge[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [sideNavOpen, setSideNavOpen] = useState<boolean>(false);
  const [formLoading, setFormLoading] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [registrationsLoaded, setRegistrationsLoaded] = useState<boolean>(false);
  const [registrationsFetching, setRegistrationsFetching] = useState<boolean>(false);

  // Calculate pledge statistics
  const pledgeStats = {
    totalAmount: pledges.reduce((sum, pledge) => {
      const amount = typeof pledge.amount === 'number' ? pledge.amount : parseFloat(pledge.amount) || 0;
      return sum + amount;
    }, 0),
    totalFulfilled: pledges.reduce((sum, pledge) => {
      const fulfilled = typeof pledge.fulfilled_amount === 'number' 
        ? pledge.fulfilled_amount 
        : parseFloat(pledge.fulfilled_amount) || 0;
      return sum + fulfilled;
    }, 0),
    totalOutstanding: pledges.reduce((sum, pledge) => {
      const amount = typeof pledge.amount === 'number' ? pledge.amount : parseFloat(pledge.amount) || 0;
      const fulfilled = typeof pledge.fulfilled_amount === 'number' 
        ? pledge.fulfilled_amount 
        : parseFloat(pledge.fulfilled_amount) || 0;
      
      // Use outstanding_balance if available, otherwise calculate it
      let outstanding;
      if (pledge.outstanding_balance !== undefined && pledge.outstanding_balance !== null) {
        outstanding = typeof pledge.outstanding_balance === 'number' 
          ? pledge.outstanding_balance 
          : parseFloat(pledge.outstanding_balance) || 0;
      } else {
        outstanding = amount - fulfilled;
      }
      return sum + Math.max(0, outstanding); // Ensure non-negative values
    }, 0),
    totalPledges: pledges.length,
    fulfilledPledges: pledges.filter(p => p.status === 'fulfilled' || p.is_fully_fulfilled).length,
    partiallyFulfilledPledges: pledges.filter(p => {
      const fulfilled = typeof p.fulfilled_amount === 'number' 
        ? p.fulfilled_amount 
        : parseFloat(p.fulfilled_amount) || 0;
      return p.status === 'pending' && fulfilled > 0;
    }).length,
    pendingPledges: pledges.filter(p => {
      const fulfilled = typeof p.fulfilled_amount === 'number' 
        ? p.fulfilled_amount 
        : parseFloat(p.fulfilled_amount) || 0;
      return p.status === 'pending' && fulfilled === 0;
    }).length,
    cancelledPledges: pledges.filter(p => p.status === 'cancelled').length,
    averageFulfillmentRate: pledges.length > 0 
      ? pledges.reduce((sum, pledge) => {
          const rate = typeof pledge.fulfillment_percentage === 'number' 
            ? pledge.fulfillment_percentage 
            : parseFloat(pledge.fulfillment_percentage) || 0;
          return sum + rate;
        }, 0) / pledges.length 
      : 0,
    recentPledges: pledges.filter(pledge => {
      const pledgeDate = new Date(pledge.created_at);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return pledgeDate >= sevenDaysAgo;
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
    pledgesApi.getCampPledges(campId)
      .then((pledgesData) => {
        setPledges(pledgesData || []);
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

  const handlePledgeSubmit = async (formData: any) => {
    if (!campId) return;
    setFormLoading(true);
    try {
      await pledgesApi.createPledge(campId, formData);
      // Refetch pledges after successful creation
      const updatedPledges = await pledgesApi.getCampPledges(campId);
      setPledges(updatedPledges || []);
      setSideNavOpen(false);
      toast({
        title: "Success",
        description: "Pledge has been created successfully.",
        variant: "default",
      });
    } catch (error: any) {
      console.error('Error creating pledge:', error);
      
      // Handle 500 errors specifically
      if (error?.response?.status === 500 || error?.status === 500) {
        toast({
          title: "Something went wrong",
          description: "We encountered an unexpected error while processing your pledge. Please try again later.",
          variant: "destructive",
        });
      } else {
        // Handle other errors
        const errorMessage = error?.response?.data?.message || error?.message || "Failed to create pledge";
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

  const handleStatusUpdate = async (pledgeId: string, status: 'pending' | 'fulfilled' | 'cancelled') => {
    if (!campId) return;
    try {
      await pledgesApi.updatePledgeStatus(pledgeId, status, campId);
      // Refetch pledges after successful status update
      const updatedPledges = await pledgesApi.getCampPledges(campId);
      setPledges(updatedPledges || []);
    } catch (error) {
      // Optionally handle error (e.g., show toast)
      console.error('Error updating pledge status:', error);
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
      {formLoading && <FullPageLoader message="Processing pledge..." />}
      
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-2 sm:px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Pledges Management</h1>
            </div>
            <Button onClick={() => setSideNavOpen(true)} variant="default">
              <Plus className="h-4 w-4 mr-2" />
              New Pledge
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-2 sm:px-4 py-6">
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
                    <CardTitle className="text-sm font-medium">Total Pledges</CardTitle>
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(pledgeStats.totalAmount)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      From {pledgeStats.totalPledges} pledges
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Fulfilled</CardTitle>
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(pledgeStats.totalFulfilled)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {Math.round(pledgeStats.averageFulfillmentRate)}% average rate
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Recent Pledges</CardTitle>
                    <Calendar className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {pledgeStats.recentPledges}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Last 7 days
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                    <Users className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {formatCurrency(pledgeStats.totalOutstanding)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {pledgeStats.pendingPledges + pledgeStats.partiallyFulfilledPledges} pending
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Pledges Table */}
              <PledgesTable 
                pledges={pledges} 
                isLoading={loading} 
                onStatusUpdate={handleStatusUpdate}
                onPledgeUpdate={async () => {
                  // Refetch pledges after fulfillment changes
                  const updatedPledges = await pledgesApi.getCampPledges(campId!);
                  setPledges(updatedPledges || []);
                }}
                campId={campId}
              />
            </>
          )}
        </div>
      </main>

      {/* Side Navigation */}
      {sideNavOpen && (
        <div className="fixed right-0 top-0 h-full w-full sm:w-3/4 md:w-1/2 bg-white border-l shadow-lg z-50">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-semibold">New Pledge</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSideNavOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-4 overflow-auto h-full pb-20">
            <PledgeForm
              registrations={registrations}
              onSubmit={handlePledgeSubmit}
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

export default PledgesPage;
