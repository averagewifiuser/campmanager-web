import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus, DollarSign, TrendingUp, TrendingDown, Calculator } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { financialsApi } from "@/lib/api";
import FinancialsTable from "@/components/financials/FinancialsTable";
import FinancialForm from "@/components/financials/FinancialForm";
import { useToast } from "@/hooks/use-toast";
import { FullPageLoader } from "@/components/ui/full-page-loader";

// Main Financials Page Component
const FinancialsPage = () => {
  const { campId } = useParams();
  const { toast } = useToast();
  const [financials, setFinancials] = useState<any[]>([]);
  const [sideNavOpen, setSideNavOpen] = useState<boolean>(false);
  const [formLoading, setFormLoading] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [recordedByFilter, setRecordedByFilter] = useState<string>('all');

  // Filter financials based on "Recorded By" filter
  const filteredFinancials = financials.filter(financial => {
    return recordedByFilter === 'all' || financial.recorded_by === recordedByFilter;
  });

  // Get unique "Recorded By" values for filter dropdown
  const uniqueRecordedBy = [...new Set(financials.map(f => f.recorded_by).filter(Boolean))];

  // Calculate financial statistics based on filtered data
  const financialStats = {
    totalIncome: filteredFinancials
      .filter(f => f.transaction_type === 'income')
      .reduce((sum, financial) => sum + parseFloat(financial.amount), 0),
    totalExpenses: filteredFinancials
      .filter(f => f.transaction_type === 'expense')
      .reduce((sum, financial) => sum + parseFloat(financial.amount), 0),
    totalTransactions: filteredFinancials.length,
    netBalance: filteredFinancials.reduce((sum, financial) => {
      return financial.transaction_type === 'income' 
        ? sum + parseFloat(financial.amount)
        : sum - parseFloat(financial.amount);
    }, 0),
    incomeTransactions: filteredFinancials.filter(f => f.transaction_type === 'income').length,
    expenseTransactions: filteredFinancials.filter(f => f.transaction_type === 'expense').length,
    recentTransactions: filteredFinancials.filter(financial => {
      const transactionDate = new Date(financial.date);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return transactionDate >= sevenDaysAgo;
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
    financialsApi.getCampFinancials(campId)
      .then((financialsData) => {
        setFinancials(financialsData || []);
      })
      .catch((error) => {
        console.error('Error fetching financials:', error);
        setFinancials([]);
      })
      .finally(() => setLoading(false));
  }, [campId]);

  const handleFinancialSubmit = async (formData: any) => {
    if (!campId) return;
    setFormLoading(true);
    try {
      await financialsApi.createFinancial(campId, formData);
      // Refetch financials after successful creation
      const updatedFinancials = await financialsApi.getCampFinancials(campId);
      setFinancials(updatedFinancials || []);
      setSideNavOpen(false);
      toast({
        title: "Success",
        description: "Financial record has been created successfully.",
        variant: "default",
      });
    } catch (error: any) {
      console.error('Error creating financial record:', error);
      
      // Handle 500 errors specifically
      if (error?.response?.status === 500 || error?.status === 500) {
        toast({
          title: "Something went wrong",
          description: "We encountered an unexpected error while processing your financial record. Please try again later.",
          variant: "destructive",
        });
      } else {
        // Handle other errors
        const errorMessage = error?.response?.data?.message || error?.message || "Failed to create financial record";
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
      {formLoading && <FullPageLoader message="Processing financial record..." />}
      
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Financials Management</h1>
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
                New Financial Record
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
                    <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(financialStats.totalIncome)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      From {financialStats.incomeTransactions} transactions
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(financialStats.totalExpenses)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      From {financialStats.expenseTransactions} transactions
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
                    <Calculator className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${financialStats.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(financialStats.netBalance)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Income - Expenses
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                    <DollarSign className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {financialStats.totalTransactions}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {financialStats.recentTransactions} in last 7 days
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Financials Table */}
              <FinancialsTable financials={filteredFinancials} isLoading={loading} />
            </>
          )}
        </div>
      </main>

      {/* Side Navigation */}
      {sideNavOpen && (
        <div className="fixed right-0 top-0 h-full w-full sm:w-3/4 md:w-1/2 bg-white border-l shadow-lg z-50">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-semibold">New Financial Record</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSideNavOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-4 overflow-auto h-full pb-20">
            <FinancialForm
              onSubmit={handleFinancialSubmit}
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

export default FinancialsPage;
