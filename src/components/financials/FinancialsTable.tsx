import React, { useState } from "react";
import { Download, Search, Loader2, FileSpreadsheet } from "lucide-react";
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

type Financial = {
  id: string;
  amount: number;
  approved_by: string;
  created_at: string;
  date: string;
  description: string;
  payment_method: string;
  received_by: string;
  recorded_by: string;
  reference_number: string;
  transaction_category: string;
  transaction_type: string;
  updated_at: string;
};

interface FinancialsTableProps {
  financials: Financial[];
  isLoading?: boolean;
}

const FinancialsTable: React.FC<FinancialsTableProps> = ({ financials, isLoading = false }) => {
  // State for filters and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Selection state
  const [selectedFinancials, setSelectedFinancials] = useState<string[]>([]);

  // Export state
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<string>('');

  // Utility functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateForFilename = () => {
    return new Date().toISOString().slice(0, 10);
  };

  const formatPaymentMethod = (method: string) => {
    const methodMap: { [key: string]: string } = {
      cash: "Cash",
      check: "Check",
      momo: "Mobile Money",
      bank_transfer: "Bank Transfer",
      card: "Card"
    };
    return methodMap[method] || method;
  };

  const formatTransactionCategory = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      offering: "Offering",
      sales: "Sales",
      donation: "Donation",
      camp_payment: "Camp Payment",
      camp_expense: "Camp Expense",
      pledge: "Pledge",
      other: "Other"
    };
    return categoryMap[category] || category;
  };

  const getTypeVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    return type === 'income' ? "default" : "destructive";
  };

  const getCategoryVariant = (category: string): "default" | "secondary" | "destructive" | "outline" => {
    const variantMap: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      offering: "default",
      sales: "secondary",
      donation: "outline",
      camp_payment: "default",
      camp_expense: "destructive",
      pledge: "secondary",
      other: "secondary"
    };
    return variantMap[category] || "secondary";
  };

  // Filter financials
  const filteredFinancials = financials.filter((financial) => {
    const matchesSearch = searchTerm === '' || 
      financial.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      financial.reference_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      financial.approved_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
      financial.received_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
      financial.recorded_by.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || financial.transaction_type === typeFilter;
    const matchesCategory = categoryFilter === 'all' || financial.transaction_category === categoryFilter;
    
    return matchesSearch && matchesType && matchesCategory;
  });

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filteredFinancials.length / rowsPerPage));
  const paginatedFinancials = filteredFinancials.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  };

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFinancials(filteredFinancials.map(financial => financial.id));
    } else {
      setSelectedFinancials([]);
    }
  };

  const handleSelectFinancial = (financialId: string, checked: boolean) => {
    if (checked) {
      setSelectedFinancials(prev => [...prev, financialId]);
    } else {
      setSelectedFinancials(prev => prev.filter(id => id !== financialId));
    }
  };

  const allSelected = selectedFinancials.length === filteredFinancials.length && filteredFinancials.length > 0;
  const someSelected = selectedFinancials.length > 0;

  // Prepare financial data for export
  const prepareFinancialData = (financial: Financial) => {
    const safeFormatDate = (dateString: string) => {
      try {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';
        return format(date, 'yyyy-MM-dd HH:mm:ss');
      } catch {
        return 'N/A';
      }
    };

    return {
      'Date': formatDate(financial.date),
      'Type': financial.transaction_type.charAt(0).toUpperCase() + financial.transaction_type.slice(1),
      'Category': formatTransactionCategory(financial.transaction_category),
      'Amount': financial.amount,
      'Description': financial.description,
      'Payment Method': formatPaymentMethod(financial.payment_method),
      'Reference Number': financial.reference_number,
      'Received By': financial.received_by,
      'Recorded By': financial.recorded_by,
      'Approved By': financial.approved_by,
      'Created At': safeFormatDate(financial.created_at),
      'Updated At': safeFormatDate(financial.updated_at),
    };
  };

  // Export filtered data
  const exportFilteredData = async () => {
    if (filteredFinancials.length === 0) return;

    setIsExporting(true);
    setExportProgress('Preparing data for export...');

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      setExportProgress('Processing financial records...');
      
      const exportData = filteredFinancials.map(prepareFinancialData);

      setExportProgress('Creating Excel file...');
      await new Promise(resolve => setTimeout(resolve, 300));

      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Add main financials sheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Auto-size columns
      const colWidths = Object.keys(exportData[0] || {}).map(key => ({
        wch: Math.max(key.length, 15)
      }));
      ws['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(wb, ws, 'Financials');

      // Add summary sheet
      const summaryData = [
        { 'Metric': 'Total Records', 'Value': filteredFinancials.length },
        { 'Metric': 'Total Income', 'Value': filteredFinancials.filter(f => f.transaction_type === 'income').reduce((sum, f) => sum + f.amount, 0) },
        { 'Metric': 'Total Expenses', 'Value': filteredFinancials.filter(f => f.transaction_type === 'expense').reduce((sum, f) => sum + f.amount, 0) },
        { 'Metric': 'Net Amount', 'Value': filteredFinancials.reduce((sum, f) => sum + (f.transaction_type === 'income' ? f.amount : -f.amount), 0) },
        { 'Metric': '', 'Value': '' }, // Empty row
        { 'Metric': 'Category Breakdown', 'Value': '' },
      ];

      // Add category breakdown
      const categoryBreakdown = filteredFinancials.reduce((acc, f) => {
        const category = formatTransactionCategory(f.transaction_category);
        if (!acc[category]) acc[category] = 0;
        acc[category] += f.transaction_type === 'income' ? f.amount : -f.amount;
        return acc;
      }, {} as Record<string, number>);

      Object.entries(categoryBreakdown).forEach(([category, amount]) => {
        summaryData.push({
          'Metric': `  ${category}`,
          'Value': amount
        });
      });

      const summaryWs = XLSX.utils.json_to_sheet(summaryData);
      summaryWs['!cols'] = [{ wch: 25 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

      setExportProgress('Finalizing export...');
      await new Promise(resolve => setTimeout(resolve, 200));

      // Generate filename with filters info
      let filename = 'financials';
      const filterParts = [];
      
      if (typeFilter !== 'all') {
        filterParts.push(`type-${typeFilter}`);
      }
      
      if (categoryFilter !== 'all') {
        filterParts.push(`category-${categoryFilter.replace(/[^a-zA-Z0-9]/g, '-')}`);
      }
      
      if (searchTerm.trim()) {
        filterParts.push(`search-${searchTerm.trim().replace(/[^a-zA-Z0-9]/g, '-')}`);
      }
      
      if (filterParts.length > 0) {
        filename += `-${filterParts.join('-')}`;
      }
      
      filename += `-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;

      // Download file
      XLSX.writeFile(wb, filename);

      setExportProgress('Export completed!');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error('Export failed:', error);
      setExportProgress('Export failed. Please try again.');
      await new Promise(resolve => setTimeout(resolve, 2000));
    } finally {
      setIsExporting(false);
      setExportProgress('');
    }
  };

  // Export selected data
  const exportSelectedData = async () => {
    if (selectedFinancials.length === 0) return;

    setIsExporting(true);
    setExportProgress('Preparing selected records for export...');

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const selectedRecords = filteredFinancials.filter(financial => 
        selectedFinancials.includes(financial.id)
      );

      setExportProgress('Processing selected records...');
      
      const exportData = selectedRecords.map(prepareFinancialData);

      setExportProgress('Creating Excel file...');
      await new Promise(resolve => setTimeout(resolve, 300));

      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Add selected financials sheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Auto-size columns
      const colWidths = Object.keys(exportData[0] || {}).map(key => ({
        wch: Math.max(key.length, 15)
      }));
      ws['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(wb, ws, 'Selected Financials');

      setExportProgress('Finalizing export...');
      await new Promise(resolve => setTimeout(resolve, 200));

      const filename = `financials-selected-${selectedFinancials.length}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;

      // Download file
      XLSX.writeFile(wb, filename);

      setExportProgress('Selected export completed!');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error('Selected export failed:', error);
      setExportProgress('Selected export failed. Please try again.');
      await new Promise(resolve => setTimeout(resolve, 2000));
    } finally {
      setIsExporting(false);
      setExportProgress('');
    }
  };

  // Legacy CSV export function (kept for compatibility)
  const exportToCSV = () => {
    const headers = [
      "Date",
      "Type",
      "Category",
      "Amount",
      "Description",
      "Payment Method",
      "Reference Number",
      "Received By",
      "Recorded By",
      "Approved By"
    ];
    const csvData = filteredFinancials.map((financial) => [
      formatDate(financial.date),
      financial.transaction_type,
      formatTransactionCategory(financial.transaction_category),
      financial.amount,
      financial.description,
      formatPaymentMethod(financial.payment_method),
      financial.reference_number,
      financial.received_by,
      financial.recorded_by,
      financial.approved_by
    ]);
    const csvContent = [headers, ...csvData]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `financials-${formatDateForFilename()}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <div>Loading financials...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Manage Financials</CardTitle>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isExporting || filteredFinancials.length === 0}
                  >
                    {isExporting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={exportFilteredData}
                    disabled={isExporting || filteredFinancials.length === 0}
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Export Filtered Data (Excel)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={exportSelectedData}
                    disabled={isExporting || selectedFinancials.length === 0}
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Export Selected ({selectedFinancials.length})
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={exportToCSV}
                    disabled={isExporting || filteredFinancials.length === 0}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export as CSV (Legacy)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by description, reference, or person..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="offering">Offering</SelectItem>
                <SelectItem value="pledge">Pledge</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="donation">Donation</SelectItem>
                <SelectItem value="camp_payment">Camp Payment</SelectItem>
                <SelectItem value="camp_expense">Camp Expense</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Export Progress Indicator */}
      {isExporting && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
            <div>
              <div className="text-sm font-medium text-blue-900">Exporting Data</div>
              <div className="text-sm text-blue-700">{exportProgress}</div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {someSelected && (
        <div className="p-4 bg-muted rounded-lg flex items-center justify-between">
          <span className="text-sm font-medium">
            {selectedFinancials.length} record(s) selected
          </span>
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={exportSelectedData}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export Selected
            </Button>
          </div>
        </div>
      )}

      {/* Financials Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Received By</TableHead>
                <TableHead>Recorded By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedFinancials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    {searchTerm || typeFilter !== 'all' || categoryFilter !== 'all' ? 'No financials match your filters' : 'No financial records found'}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedFinancials.map((financial) => (
                  <TableRow key={financial.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedFinancials.includes(financial.id)}
                        onCheckedChange={(checked) => 
                          handleSelectFinancial(financial.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(financial.date)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTypeVariant(financial.transaction_type)}>
                        {financial.transaction_type.charAt(0).toUpperCase() + financial.transaction_type.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getCategoryVariant(financial.transaction_category)}>
                        {formatTransactionCategory(financial.transaction_category)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${financial.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {financial.transaction_type === 'expense' ? '-' : '+'}{formatCurrency(financial.amount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{financial.description}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{formatPaymentMethod(financial.payment_method)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-mono">{financial.reference_number}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{financial.received_by}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{financial.recorded_by}</span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3 border-t bg-muted">
              <div className="flex items-center gap-2">
                <span className="text-sm">Rows per page:</span>
                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={rowsPerPage}
                  onChange={handleRowsPerPageChange}
                >
                  {[5, 10, 20, 50, 100].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                >
                  Prev
                </Button>
                <span className="text-sm">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialsTable;
