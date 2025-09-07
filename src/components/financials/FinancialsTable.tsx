import React, { useState } from "react";
import { Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
      financial.received_by.toLowerCase().includes(searchTerm.toLowerCase());
    
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

  // Export to CSV function
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
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              disabled={filteredFinancials.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
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

      {/* Financials Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Received By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedFinancials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {searchTerm || typeFilter !== 'all' || categoryFilter !== 'all' ? 'No financials match your filters' : 'No financial records found'}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedFinancials.map((financial) => (
                  <TableRow key={financial.id}>
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
