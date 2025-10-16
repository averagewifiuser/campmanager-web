import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  // DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CheckCircle, Clock, XCircle, Phone, Eye, MoreHorizontal, Percent, DollarSign, Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { Pledge, PledgeFulfillment, CreatePledgeFulfillmentRequest } from "@/lib/types";
import { pledgesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import PledgeFulfillmentForm from "./PledgeFulfillmentForm";
import PledgeFulfillmentTable from "./PledgeFulfillmentTable";
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

interface PledgesTableProps {
  pledges: Pledge[];
  isLoading: boolean;
  onStatusUpdate?: (pledgeId: string, status: 'pending' | 'fulfilled' | 'cancelled') => void;
  onPledgeUpdate?: () => void;
  campId?: string;
}

const PledgesTable: React.FC<PledgesTableProps> = ({ 
  pledges, 
  isLoading, 
  onStatusUpdate, 
  onPledgeUpdate, 
  campId 
}) => {
  const { toast } = useToast();
  const [selectedPledge, setSelectedPledge] = useState<Pledge | null>(null);
  const [fulfillments, setFulfillments] = useState<PledgeFulfillment[]>([]);
  const [fulfillmentsLoading, setFulfillmentsLoading] = useState(false);
  const [fulfillmentFormOpen, setFulfillmentFormOpen] = useState(false);
  const [fulfillmentSubmitting, setFulfillmentSubmitting] = useState(false);

  // Selection and export state
  const [selectedPledges, setSelectedPledges] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<string>('');

  const formatCurrency = (amount: number | string | undefined | null) => {
    // Convert to number and handle edge cases
    let numAmount = 0;
    if (typeof amount === 'number') {
      numAmount = amount;
    } else if (typeof amount === 'string' && amount.trim() !== '') {
      numAmount = parseFloat(amount) || 0;
    }
    
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2
    }).format(numAmount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (pledge: Pledge) => {
    if (pledge.status === 'cancelled') {
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Cancelled
        </Badge>
      );
    }

    if (pledge.status === 'fulfilled' || pledge.is_fully_fulfilled) {
      return (
        <Badge variant="default">
          <CheckCircle className="h-3 w-3 mr-1" />
          Fulfilled
        </Badge>
      );
    }

    // Show partial fulfillment for pending pledges
    if (pledge.fulfilled_amount > 0) {
      return (
        <Badge variant="secondary">
          <Percent className="h-3 w-3 mr-1" />
          {Math.round(pledge.fulfillment_percentage)}% Paid
        </Badge>
      );
    }

    return (
      <Badge variant="secondary">
        <Clock className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    );
  };

  const loadFulfillments = async (pledge: Pledge) => {
    if (!campId) return;

    setSelectedPledge(pledge);
    setFulfillmentsLoading(true);
    try {
      const data = await pledgesApi.getPledgeFulfillments(pledge.id, campId);
      setFulfillments(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to load fulfillments",
        variant: "destructive",
      });
      setFulfillments([]);
    } finally {
      setFulfillmentsLoading(false);
    }
  };

  const handleAddFulfillment = async (fulfillmentData: CreatePledgeFulfillmentRequest) => {
    if (!selectedPledge || !campId) return;

    setFulfillmentSubmitting(true);
    try {
      await pledgesApi.addPledgeFulfillment(selectedPledge.id, campId, fulfillmentData);
      
      // Reload fulfillments and pledges
      await loadFulfillments(selectedPledge);
      onPledgeUpdate?.();
      
      setFulfillmentFormOpen(false);
      toast({
        title: "Success",
        description: "Fulfillment added successfully.",
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to add fulfillment",
        variant: "destructive",
      });
    } finally {
      setFulfillmentSubmitting(false);
    }
  };

  const handleDeleteFulfillment = async (fulfillmentId: string) => {
    if (!campId || !selectedPledge) return;

    try {
      await pledgesApi.deletePledgeFulfillment(fulfillmentId, campId);
      
      // Reload fulfillments and pledges
      await loadFulfillments(selectedPledge);
      onPledgeUpdate?.();
    } catch (error: any) {
      throw error; // Let the table component handle the error display
    }
  };

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPledges(pledges.map(pledge => pledge.id));
    } else {
      setSelectedPledges([]);
    }
  };

  const handleSelectPledge = (pledgeId: string, checked: boolean) => {
    if (checked) {
      setSelectedPledges(prev => [...prev, pledgeId]);
    } else {
      setSelectedPledges(prev => prev.filter(id => id !== pledgeId));
    }
  };

  const allSelected = selectedPledges.length === pledges.length && pledges.length > 0;
  const someSelected = selectedPledges.length > 0;

  // Prepare pledge data for export
  const preparePledgeData = (pledge: Pledge) => {
    const statusText = pledge.status === 'cancelled' ? 'Cancelled' :
                      pledge.status === 'fulfilled' || pledge.is_fully_fulfilled ? 'Fulfilled' :
                      pledge.fulfilled_amount > 0 ? `${Math.round(pledge.fulfillment_percentage)}% Paid` : 'Pending';

    return {
      'Camper Name': pledge.camper_name,
      'Camper Code': pledge.camper_code,
      'Phone Number': pledge.camper_phone_number || 'N/A',
      'Pledge Amount': pledge.amount,
      'Fulfilled Amount': pledge.fulfilled_amount,
      'Outstanding Balance': pledge.outstanding_balance,
      'Fulfillment Percentage': Math.round(pledge.fulfillment_percentage),
      'Status': statusText,
      'Pledge Date': formatDate(pledge.pledge_date),
      'Is Fully Fulfilled': pledge.is_fully_fulfilled ? 'Yes' : 'No',
      'Created At': formatDate(pledge.created_at),
      'Notes': pledge.notes || 'N/A'
    };
  };

  // Export all pledges
  const exportAllPledges = async () => {
    if (pledges.length === 0) return;

    setIsExporting(true);
    setExportProgress('Preparing pledges data for export...');

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      setExportProgress('Processing pledge records...');
      
      const exportData = pledges.map(preparePledgeData);

      setExportProgress('Creating Excel file...');
      await new Promise(resolve => setTimeout(resolve, 300));

      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Add main pledges sheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Auto-size columns
      const colWidths = Object.keys(exportData[0] || {}).map(key => ({
        wch: Math.max(key.length, 15)
      }));
      ws['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(wb, ws, 'Pledges');

      // Add summary sheet
      const totalPledged = pledges.reduce((sum, p) => sum + p.amount, 0);
      const totalFulfilled = pledges.reduce((sum, p) => sum + p.fulfilled_amount, 0);
      const totalOutstanding = pledges.reduce((sum, p) => sum + p.outstanding_balance, 0);
      const fulfilledCount = pledges.filter(p => p.status === 'fulfilled' || p.is_fully_fulfilled).length;
      const pendingCount = pledges.filter(p => p.status === 'pending').length;
      const cancelledCount = pledges.filter(p => p.status === 'cancelled').length;
      const partiallyFulfilledCount = pledges.filter(p => p.status === 'pending' && p.fulfilled_amount > 0).length;
      const avgFulfillmentRate = pledges.length > 0 
        ? pledges.reduce((sum, p) => sum + p.fulfillment_percentage, 0) / pledges.length 
        : 0;

      const summaryData = [
        { 'Metric': 'Total Pledges', 'Value': pledges.length },
        { 'Metric': 'Total Pledged Amount', 'Value': totalPledged },
        { 'Metric': 'Total Fulfilled Amount', 'Value': totalFulfilled },
        { 'Metric': 'Total Outstanding Amount', 'Value': totalOutstanding },
        { 'Metric': 'Average Fulfillment Rate (%)', 'Value': Math.round(avgFulfillmentRate) },
        { 'Metric': '', 'Value': '' }, // Empty row
        { 'Metric': 'Status Breakdown', 'Value': '' },
        { 'Metric': '  Fulfilled Pledges', 'Value': fulfilledCount },
        { 'Metric': '  Pending Pledges', 'Value': pendingCount },
        { 'Metric': '  Partially Fulfilled Pledges', 'Value': partiallyFulfilledCount },
        { 'Metric': '  Cancelled Pledges', 'Value': cancelledCount },
      ];

      const summaryWs = XLSX.utils.json_to_sheet(summaryData);
      summaryWs['!cols'] = [{ wch: 30 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

      setExportProgress('Finalizing export...');
      await new Promise(resolve => setTimeout(resolve, 200));

      const filename = `pledges-all-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;

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

  // Export selected pledges
  const exportSelectedPledges = async () => {
    if (selectedPledges.length === 0) return;

    setIsExporting(true);
    setExportProgress('Preparing selected pledges for export...');

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const selectedRecords = pledges.filter(pledge => 
        selectedPledges.includes(pledge.id)
      );

      setExportProgress('Processing selected pledges...');
      
      const exportData = selectedRecords.map(preparePledgeData);

      setExportProgress('Creating Excel file...');
      await new Promise(resolve => setTimeout(resolve, 300));

      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Add selected pledges sheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Auto-size columns
      const colWidths = Object.keys(exportData[0] || {}).map(key => ({
        wch: Math.max(key.length, 15)
      }));
      ws['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(wb, ws, 'Selected Pledges');

      setExportProgress('Finalizing export...');
      await new Promise(resolve => setTimeout(resolve, 200));

      const filename = `pledges-selected-${selectedPledges.length}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;

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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pledges</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Loading pledges...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Manage Pledges</CardTitle>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isExporting || pledges.length === 0}
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
                    onClick={exportAllPledges}
                    disabled={isExporting || pledges.length === 0}
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Export All Pledges (Excel)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={exportSelectedPledges}
                    disabled={isExporting || selectedPledges.length === 0}
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Export Selected ({selectedPledges.length})
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Total: {pledges.length} pledges
          </div>
        </CardContent>
      </Card>

      {/* Export Progress Indicator */}
      {isExporting && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
            <div>
              <div className="text-sm font-medium text-blue-900">Exporting Pledges Data</div>
              <div className="text-sm text-blue-700">{exportProgress}</div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {someSelected && (
        <div className="p-4 bg-muted rounded-lg flex items-center justify-between">
          <span className="text-sm font-medium">
            {selectedPledges.length} pledge(s) selected
          </span>
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={exportSelectedPledges}
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

      {/* Pledges Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pledges ({pledges.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {pledges.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No pledges found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Camper</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Pledge Amount</TableHead>
                    <TableHead>Fulfilled</TableHead>
                    <TableHead>Outstanding</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pledges.map((pledge) => (
                    <TableRow key={pledge.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedPledges.includes(pledge.id)}
                          onCheckedChange={(checked) => 
                            handleSelectPledge(pledge.id, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{pledge.camper_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {pledge.camper_code}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {pledge.camper_phone_number || 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-600">
                            {formatCurrency(pledge.amount)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-blue-600">
                            {formatCurrency(pledge.fulfilled_amount)}
                          </div>
                          {pledge.fulfillment_percentage > 0 && (
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-blue-600 h-1.5 rounded-full" 
                                style={{ width: `${Math.min(pledge.fulfillment_percentage, 100)}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${pledge.outstanding_balance > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                          {formatCurrency(pledge.outstanding_balance)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(pledge)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {formatDate(pledge.pledge_date)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {/* View/Manage Fulfillments Dialog */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => loadFulfillments(pledge)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>
                                  Pledge Details - {pledge.camper_name} ({pledge.camper_code})
                                </DialogTitle>
                              </DialogHeader>
                              
                              {/* Pledge Summary */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                  <div className="text-sm text-gray-600">Total Pledge</div>
                                  <div className="text-lg font-semibold text-green-600">
                                    {formatCurrency(pledge.amount)}
                                  </div>
                                </div>
                                <div className="bg-blue-50 p-4 rounded-lg">
                                  <div className="text-sm text-gray-600">Fulfilled</div>
                                  <div className="text-lg font-semibold text-blue-600">
                                    {formatCurrency(pledge.fulfilled_amount)}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {Math.round(pledge.fulfillment_percentage)}% Complete
                                  </div>
                                </div>
                                <div className="bg-red-50 p-4 rounded-lg">
                                  <div className="text-sm text-gray-600">Outstanding</div>
                                  <div className="text-lg font-semibold text-red-600">
                                    {formatCurrency(pledge.outstanding_balance)}
                                  </div>
                                </div>
                              </div>

                              {/* Fulfillment Management */}
                              {pledge.status !== 'cancelled' && (
                                <div className="space-y-4">
                                  {fulfillmentFormOpen ? (
                                    <div className="border rounded-lg p-4 bg-gray-50">
                                      <h4 className="text-lg font-semibold mb-4">Add New Fulfillment</h4>
                                      <PledgeFulfillmentForm
                                        pledgeAmount={pledge.amount}
                                        outstandingBalance={pledge.outstanding_balance}
                                        onSubmit={handleAddFulfillment}
                                        onCancel={() => setFulfillmentFormOpen(false)}
                                        loading={fulfillmentSubmitting}
                                      />
                                    </div>
                                  ) : (
                                    <PledgeFulfillmentTable
                                      fulfillments={fulfillments}
                                      isLoading={fulfillmentsLoading}
                                      onDeleteFulfillment={handleDeleteFulfillment}
                                      onAddFulfillment={() => setFulfillmentFormOpen(true)}
                                      showAddButton={pledge.outstanding_balance > 0}
                                    />
                                  )}
                                </div>
                              )}

                              {pledge.status === 'cancelled' && (
                                <div className="text-center py-8 text-muted-foreground">
                                  This pledge has been cancelled. No fulfillments can be added.
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          {/* Status Update Dropdown */}
                          {onStatusUpdate && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => onStatusUpdate(pledge.id, 'pending')}
                                  disabled={pledge.status === 'pending'}
                                >
                                  <Clock className="h-4 w-4 mr-2" />
                                  Mark as Pending
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => onStatusUpdate(pledge.id, 'fulfilled')}
                                  disabled={pledge.status === 'fulfilled'}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Mark as Fulfilled
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => onStatusUpdate(pledge.id, 'cancelled')}
                                  disabled={pledge.status === 'cancelled'}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Mark as Cancelled
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PledgesTable;
