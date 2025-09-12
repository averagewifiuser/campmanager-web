import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus, ShoppingCart, TrendingUp, Hash, DollarSign } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { purchasesApi } from "@/lib/api";
import { Purchase, CreatePurchaseRequest } from "@/lib/types";
import PurchasesTable from "@/components/purchases/PurchasesTable";
import PurchaseForm from "@/components/purchases/PurchaseForm";
import { useToast } from "@/hooks/use-toast";
import { FullPageLoader } from "@/components/ui/full-page-loader";

const PurchasesPage = () => {
  const { campId } = useParams();
  const { toast } = useToast();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [sideNavOpen, setSideNavOpen] = useState<boolean>(false);
  const [formLoading, setFormLoading] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [soldByFilter, setSoldByFilter] = useState<string>('all');

  // Filter purchases based on "Sold By" filter
  const filteredPurchases = purchases.filter(purchase => {
    return soldByFilter === 'all' || purchase.sold_by === soldByFilter;
  });

  // Get unique "Sold By" values for filter dropdown
  const uniqueSoldBy = [...new Set(purchases.map(p => p.sold_by).filter(Boolean))];

  // Calculate purchase statistics based on filtered data
  const purchaseStats = {
    totalPurchases: filteredPurchases.length,
    totalAmount: filteredPurchases.reduce((sum, purchase) => sum + purchase.amount, 0),
    averageAmount: filteredPurchases.length > 0 
      ? filteredPurchases.reduce((sum, purchase) => sum + purchase.amount, 0) / filteredPurchases.length 
      : 0,
    recentPurchases: filteredPurchases.filter(purchase => {
      const purchaseDate = new Date(purchase.purchase_date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return purchaseDate >= weekAgo;
    }).length,
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
    purchasesApi.getCampPurchases(campId)
      .then((purchaseData) => {
        setPurchases(purchaseData || []);
      })
      .catch((error) => {
        console.error('Error fetching purchases:', error);
        setPurchases([]);
      })
      .finally(() => setLoading(false));
  }, [campId]);

  const handlePurchaseSubmit = async (formData: CreatePurchaseRequest) => {
    if (!campId) return;
    setFormLoading(true);
    try {
      // Create new purchase
      await purchasesApi.createPurchase(campId, formData);
      
      // Refetch purchases after successful creation
      const updatedPurchases = await purchasesApi.getCampPurchases(campId);
      setPurchases(updatedPurchases || []);
      setSideNavOpen(false);
      toast({
        title: "Success",
        description: "Purchase has been recorded successfully.",
        variant: "default",
      });
    } catch (error: any) {
      console.error('Error saving purchase:', error);
      
      // Handle 500 errors specifically
      if (error?.response?.status === 500 || error?.status === 500) {
        toast({
          title: "Something went wrong",
          description: "We encountered an unexpected error while processing your purchase. Please try again later.",
          variant: "destructive",
        });
      } else {
        // Handle other errors
        const errorMessage = error?.response?.data?.message || error?.message || "Failed to create purchase";
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

  const handleCloseSideNav = () => {
    setSideNavOpen(false);
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
      {formLoading && <FullPageLoader message="Processing purchase..." />}
      
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Purchases Management</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Filter by Sold By:</span>
                <Select value={soldByFilter} onValueChange={setSoldByFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {uniqueSoldBy.map((person) => (
                      <SelectItem key={person} value={person}>
                        {person}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => setSideNavOpen(true)} variant="default">
                <Plus className="h-4 w-4 mr-2" />
                New Purchase
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
                    <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
                    <Hash className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {purchaseStats.totalPurchases}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      All time purchases
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(purchaseStats.totalAmount)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Average: {formatCurrency(purchaseStats.averageAmount)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Recent Purchases</CardTitle>
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {purchaseStats.recentPurchases}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Last 7 days
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Sales Activity</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {purchaseStats.recentPurchases > 0 ? 'Active' : 'Low'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Current activity level
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Purchases Table */}
              <PurchasesTable 
                purchases={filteredPurchases} 
                isLoading={loading}
                soldByFilter={soldByFilter}
                onSoldByFilterChange={setSoldByFilter}
              />
            </>
          )}
        </div>
      </main>

      {/* Side Navigation */}
      {sideNavOpen && (
        <div className="fixed right-0 top-0 h-full w-1/2 bg-white border-l shadow-lg z-50">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-semibold">New Purchase</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCloseSideNav}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-4 overflow-auto h-full pb-20">
            <PurchaseForm
              onSubmit={handlePurchaseSubmit}
              onCancel={handleCloseSideNav}
              loading={formLoading}
            />
          </div>
        </div>
      )}

      {/* Overlay */}
      {sideNavOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-30 z-40"
          onClick={handleCloseSideNav}
        />
      )}
    </div>
  );
};

export default PurchasesPage;
