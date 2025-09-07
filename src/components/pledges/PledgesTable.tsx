import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import { Pledge } from "@/lib/types";

interface PledgesTableProps {
  pledges: Pledge[];
  isLoading: boolean;
  onStatusUpdate?: (pledgeId: string, status: 'pending' | 'fulfilled' | 'cancelled') => void;
  campId?: string;
}

const PledgesTable: React.FC<PledgesTableProps> = ({ pledges, isLoading, onStatusUpdate, campId }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, label: "Pending" },
      fulfilled: { variant: "default" as const, label: "Fulfilled" },
      cancelled: { variant: "destructive" as const, label: "Cancelled" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
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
                  <TableHead>Camper</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pledge Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pledges.map((pledge) => (
                  <TableRow key={pledge.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{pledge.camper_code} - {pledge.camper_name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-green-600">
                        {formatCurrency(pledge.amount)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {onStatusUpdate ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-auto p-0">
                              {pledge.status === 'pending' && (
                                <Badge variant="secondary" className="cursor-pointer">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Pending
                                </Badge>
                              )}
                              {pledge.status === 'fulfilled' && (
                                <Badge variant="default" className="cursor-pointer">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Fulfilled
                                </Badge>
                              )}
                              {pledge.status === 'cancelled' && (
                                <Badge variant="destructive" className="cursor-pointer">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Cancelled
                                </Badge>
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
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
                      ) : (
                        getStatusBadge(pledge.status)
                      )}
                    </TableCell>
                    <TableCell>
                      {formatDate(pledge.pledge_date)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PledgesTable;
