import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2, Plus, Calendar, CreditCard, FileText } from "lucide-react";
import { PledgeFulfillment } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface PledgeFulfillmentTableProps {
  fulfillments: PledgeFulfillment[];
  isLoading?: boolean;
  onDeleteFulfillment?: (fulfillmentId: string) => Promise<void>;
  onAddFulfillment?: () => void;
  showAddButton?: boolean;
}

const PledgeFulfillmentTable = ({
  fulfillments,
  isLoading = false,
  onDeleteFulfillment,
  onAddFulfillment,
  showAddButton = true,
}: PledgeFulfillmentTableProps) => {
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentMethodBadge = (method: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      cash: "default",
      momo: "secondary",
      bank_transfer: "outline",
      cheque: "secondary",
      card: "outline"
    };

    const labels: Record<string, string> = {
      cash: "Cash",
      momo: "Mobile Money",
      bank_transfer: "Bank Transfer",
      cheque: "Cheque",
      card: "Card"
    };

    return (
      <Badge variant={variants[method] || "default"}>
        {labels[method] || method}
      </Badge>
    );
  };

  const handleDeleteFulfillment = async (fulfillmentId: string) => {
    if (!onDeleteFulfillment) return;

    setDeletingId(fulfillmentId);
    try {
      await onDeleteFulfillment(fulfillmentId);
      toast({
        title: "Success",
        description: "Fulfillment has been removed successfully.",
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to remove fulfillment",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-muted-foreground">Loading fulfillments...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Fulfillment History</h3>
        {showAddButton && onAddFulfillment && (
          <Button onClick={onAddFulfillment} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Fulfillment
          </Button>
        )}
      </div>

      {/* Fulfillments Table */}
      {fulfillments.length === 0 ? (
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center space-x-2 text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>
              No fulfillments recorded yet. {showAddButton && "Add the first fulfillment to track payments."}
            </span>
          </div>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Recorded By</TableHead>
                <TableHead>Notes</TableHead>
                {onDeleteFulfillment && <TableHead className="w-20">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {fulfillments.map((fulfillment) => (
                <TableRow key={fulfillment.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {formatDate(fulfillment.fulfillment_date)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(fulfillment.amount)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      {getPaymentMethodBadge(fulfillment.payment_method)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {fulfillment.reference_number || '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {fulfillment.recorded_by}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {fulfillment.notes || '-'}
                    </span>
                  </TableCell>
                  {onDeleteFulfillment && (
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={deletingId === fulfillment.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Fulfillment</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this fulfillment of {formatCurrency(fulfillment.amount)}? 
                              This will adjust the pledge balance and cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteFulfillment(fulfillment.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {deletingId === fulfillment.id ? 'Deleting...' : 'Delete'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Summary */}
      {fulfillments.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">Total Fulfilled:</span>
            <span className="text-lg font-semibold text-green-600">
              {formatCurrency(fulfillments.reduce((sum, f) => sum + f.amount, 0))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PledgeFulfillmentTable;
