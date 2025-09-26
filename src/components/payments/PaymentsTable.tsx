import React, { useState } from "react";
import { Download, Eye, Users, Search, Loader2, FileSpreadsheet } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

type Payment = {
  id: string;
  amount: number;
  payment_channel: string;
  payment_date: string;
  payment_reference: string;
  recorded_by: string;
  registrations: Array<{ 
    camper_code?: string; 
    camper_name?: string;
    id?: string;
    camp_id?: string;
  }>;
};

interface PaymentsTableProps {
  payments: Payment[];
  isLoading?: boolean;
}

const PaymentsTable: React.FC<PaymentsTableProps> = ({ payments, isLoading = false }) => {
  // State for filters and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Modal state for viewing campers
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showCampersModal, setShowCampersModal] = useState(false);

  // Selection state
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);

  // Export state
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<string>('');

  // Utility functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDateForFilename = () => {
    return new Date().toISOString().slice(0, 10);
  };

  const formatPaymentChannel = (channel: string) => {
    const channelMap: { [key: string]: string } = {
      momo: "Mobile Money",
      cheque: "Cheque",
      cash: "Cash",
      bank_transfer: "Bank Transfer"
    };
    return channelMap[channel] || channel;
  };

  const getChannelVariant = (channel: string) => {
    const variantMap: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      momo: "default",
      cash: "secondary",
      cheque: "outline",
      bank_transfer: "destructive"
    };
    return variantMap[channel] || "secondary";
  };

  // Filter payments
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch = searchTerm === '' || 
      payment.payment_reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.recorded_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.registrations.some(reg => 
        (reg.camper_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (reg.camper_code || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesChannel = channelFilter === 'all' || payment.payment_channel === channelFilter;
    
    return matchesSearch && matchesChannel;
  });

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / rowsPerPage));
  const paginatedPayments = filteredPayments.slice(
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
      setSelectedPayments(filteredPayments.map(payment => payment.id));
    } else {
      setSelectedPayments([]);
    }
  };

  const handleSelectPayment = (paymentId: string, checked: boolean) => {
    if (checked) {
      setSelectedPayments(prev => [...prev, paymentId]);
    } else {
      setSelectedPayments(prev => prev.filter(id => id !== paymentId));
    }
  };

  const allSelected = selectedPayments.length === filteredPayments.length && filteredPayments.length > 0;
  const someSelected = selectedPayments.length > 0;

  // Prepare payment data for export
  const preparePaymentData = (payment: Payment) => {
    const campersList = payment.registrations && payment.registrations.length > 0
      ? payment.registrations
          .map((reg) => reg.camper_name || reg.camper_code || "N/A")
          .join(", ")
      : "—";

    return {
      'Amount': payment.amount,
      'Payment Channel': formatPaymentChannel(payment.payment_channel),
      'Payment Date': formatDate(payment.payment_date),
      'Reference': payment.payment_reference,
      'Recorded By': payment.recorded_by,
      'Number of Campers': payment.registrations?.length || 0,
      'Campers': campersList,
      'Camper Codes': payment.registrations && payment.registrations.length > 0
        ? payment.registrations
            .map((reg) => reg.camper_code || "N/A")
            .join(", ")
        : "—",
    };
  };

  // Export filtered data
  const exportFilteredData = async () => {
    if (filteredPayments.length === 0) return;

    setIsExporting(true);
    setExportProgress('Preparing data for export...');

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      setExportProgress('Processing payment records...');
      
      const exportData = filteredPayments.map(preparePaymentData);

      setExportProgress('Creating Excel file...');
      await new Promise(resolve => setTimeout(resolve, 300));

      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Add main payments sheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Auto-size columns
      const colWidths = Object.keys(exportData[0] || {}).map(key => ({
        wch: Math.max(key.length, 15)
      }));
      ws['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(wb, ws, 'Payments');

      // Add detailed campers sheet
      const camperDetails: any[] = [];
      filteredPayments.forEach(payment => {
        if (payment.registrations && payment.registrations.length > 0) {
          payment.registrations.forEach(reg => {
            camperDetails.push({
              'Payment Reference': payment.payment_reference,
              'Payment Amount': payment.amount,
              'Payment Channel': formatPaymentChannel(payment.payment_channel),
              'Payment Date': formatDate(payment.payment_date),
              'Camper Name': reg.camper_name || 'N/A',
              'Camper Code': reg.camper_code || 'N/A',
              'Recorded By': payment.recorded_by,
            });
          });
        }
      });

      if (camperDetails.length > 0) {
        const camperWs = XLSX.utils.json_to_sheet(camperDetails);
        const camperColWidths = Object.keys(camperDetails[0] || {}).map(key => ({
          wch: Math.max(key.length, 15)
        }));
        camperWs['!cols'] = camperColWidths;
        XLSX.utils.book_append_sheet(wb, camperWs, 'Payment Details');
      }

      // Add summary sheet
      const summaryData = [
        { 'Metric': 'Total Payments', 'Value': filteredPayments.length },
        { 'Metric': 'Total Amount', 'Value': filteredPayments.reduce((sum, p) => sum + p.amount, 0) },
        { 'Metric': 'Total Campers', 'Value': filteredPayments.reduce((sum, p) => sum + (p.registrations?.length || 0), 0) },
        { 'Metric': '', 'Value': '' }, // Empty row
        { 'Metric': 'Channel Breakdown', 'Value': '' },
      ];

      // Add channel breakdown
      const channelBreakdown = filteredPayments.reduce((acc, p) => {
        const channel = formatPaymentChannel(p.payment_channel);
        if (!acc[channel]) acc[channel] = { count: 0, amount: 0 };
        acc[channel].count += 1;
        acc[channel].amount += p.amount;
        return acc;
      }, {} as Record<string, { count: number; amount: number }>);

      Object.entries(channelBreakdown).forEach(([channel, data]) => {
        summaryData.push({
          'Metric': `  ${channel} (Count)`,
          'Value': data.count
        });
        summaryData.push({
          'Metric': `  ${channel} (Amount)`,
          'Value': data.amount
        });
      });

      const summaryWs = XLSX.utils.json_to_sheet(summaryData);
      summaryWs['!cols'] = [{ wch: 25 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

      setExportProgress('Finalizing export...');
      await new Promise(resolve => setTimeout(resolve, 200));

      // Generate filename with filters info
      let filename = 'payments';
      const filterParts = [];
      
      if (channelFilter !== 'all') {
        filterParts.push(`channel-${channelFilter.replace(/[^a-zA-Z0-9]/g, '-')}`);
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
    if (selectedPayments.length === 0) return;

    setIsExporting(true);
    setExportProgress('Preparing selected payments for export...');

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const selectedRecords = filteredPayments.filter(payment => 
        selectedPayments.includes(payment.id)
      );

      setExportProgress('Processing selected payments...');
      
      const exportData = selectedRecords.map(preparePaymentData);

      setExportProgress('Creating Excel file...');
      await new Promise(resolve => setTimeout(resolve, 300));

      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Add selected payments sheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Auto-size columns
      const colWidths = Object.keys(exportData[0] || {}).map(key => ({
        wch: Math.max(key.length, 15)
      }));
      ws['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(wb, ws, 'Selected Payments');

      setExportProgress('Finalizing export...');
      await new Promise(resolve => setTimeout(resolve, 200));

      const filename = `payments-selected-${selectedPayments.length}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;

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
      "Amount",
      "Channel",
      "Date",
      "Reference",
      "Recorded By",
      "Campers"
    ];
    const csvData = filteredPayments.map((payment) => [
      payment.amount,
      formatPaymentChannel(payment.payment_channel),
      formatDate(payment.payment_date),
      payment.payment_reference,
      payment.recorded_by,
      payment.registrations && payment.registrations.length > 0
        ? payment.registrations
            .map((reg) => reg.camper_name || reg.camper_code || "N/A")
            .join(", ")
        : "—"
    ]);
    const csvContent = [headers, ...csvData]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `payments-${formatDateForFilename()}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleShowCampers = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowCampersModal(true);
  };

  const renderCampersCell = (payment: Payment) => {
    const registrations = payment.registrations || [];
    
    if (registrations.length === 0) {
      return <span className="text-muted-foreground">—</span>;
    }

    // If only one camper, show the name directly
    if (registrations.length === 1) {
      const camperName = registrations[0].camper_name || registrations[0].camper_code || "N/A";
      return <span className="text-sm">{camperName}</span>;
    }

    // If multiple campers, show count with button to view all
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {registrations.length} campers
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShowCampers(payment)}
          className="h-6 px-2"
        >
          <Eye className="h-3 w-3 mr-1" />
          View
        </Button>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <div>Loading payments...</div>
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
            <CardTitle>Manage Payments</CardTitle>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isExporting || filteredPayments.length === 0}
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
                    disabled={isExporting || filteredPayments.length === 0}
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Export Filtered Data (Excel)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={exportSelectedData}
                    disabled={isExporting || selectedPayments.length === 0}
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Export Selected ({selectedPayments.length})
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={exportToCSV}
                    disabled={isExporting || filteredPayments.length === 0}
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
                  placeholder="Search by reference, camper, or recorded by..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Channel Filter */}
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Payment channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="momo">Mobile Money</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
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
            {selectedPayments.length} payment(s) selected
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

      {/* Payments Table */}
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
                <TableHead>Amount</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Recorded By</TableHead>
                <TableHead>Campers</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {searchTerm || channelFilter !== 'all' ? 'No payments match your filters' : 'No payments found'}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedPayments.includes(payment.id)}
                        onCheckedChange={(checked) => 
                          handleSelectPayment(payment.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{formatCurrency(payment.amount)}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getChannelVariant(payment.payment_channel)}>
                        {formatPaymentChannel(payment.payment_channel)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(payment.payment_date)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-mono">{payment.payment_reference}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{payment.recorded_by}</span>
                    </TableCell>
                    <TableCell>
                      {renderCampersCell(payment)}
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

      {/* Modal for showing all campers */}
      <Dialog open={showCampersModal} onOpenChange={setShowCampersModal}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Campers for Payment {selectedPayment?.payment_reference}
            </DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div>
              <div className="max-h-64 overflow-y-auto">
                {selectedPayment.registrations && selectedPayment.registrations.length > 0 ? (
                  <ul className="space-y-2">
                    {selectedPayment.registrations.map((reg, idx) => (
                      <li key={reg.id || idx} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                        <span className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-medium">
                          {idx + 1}
                        </span>
                        <div className="flex-1">
                          <span className="font-medium">
                            {reg.camper_name || "N/A"}
                          </span>
                          {reg.camper_code && (
                            <span className="text-sm text-muted-foreground ml-2">
                              (Code: {reg.camper_code})
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No campers associated with this payment.</p>
                )}
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total campers:</span>
                  <span className="font-medium">{selectedPayment.registrations?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Payment amount:</span>
                  <span className="font-medium">{formatCurrency(selectedPayment.amount)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentsTable;
