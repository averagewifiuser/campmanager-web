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

  // Calculate pledge statistics
  const pledgeStats = {
    totalAmount: pledges.reduce((sum, pledge) => sum + pledge.amount, 0),
    totalPledges: pledges.length,
    averagePledge: pledges.length > 0 ? pledges.reduce((sum, pledge) => sum + pledge.amount, 0) / pledges.length : 0,
    pledgesByStatus: pledges.reduce((acc, pledge) => {
      const status = pledge.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
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
    Promise.all([
      pledgesApi.getCampPledges(campId),
      registrationsApi.getCampRegistrations(campId)
    ])
      .then(([pledgesData, registrationsData]) => {
        setPledges(pledgesData || []);
        setRegistrations(registrationsData || []);
      })
      .finally(() => setLoading(false));
  }, [campId]);

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
        <div className="container mx-auto px-4 py-4">
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
                    <CardTitle className="text-sm font-medium">Average Pledge</CardTitle>
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(pledgeStats.averagePledge)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Per pledge
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
                    <CardTitle className="text-sm font-medium">Pending Pledges</CardTitle>
                    <Users className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {pledgeStats.pledgesByStatus.pending || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Awaiting fulfillment
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Pledges Table */}
              <PledgesTable 
                pledges={pledges} 
                isLoading={loading} 
                onStatusUpdate={handleStatusUpdate}
                campId={campId}
              />
            </>
          )}
        </div>
      </main>

      {/* Side Navigation */}
      {sideNavOpen && (
        <div className="fixed right-0 top-0 h-full w-1/2 bg-white border-l shadow-lg z-50">
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
