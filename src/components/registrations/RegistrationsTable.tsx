// src/components/registrations/RegistrationsTable.tsx
import { useState } from 'react';
import { format } from 'date-fns';
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle,
  UserCheck,
  Phone,
  Mail,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatCurrency } from '@/lib/utils';
import { 
  useUpdatePaymentStatus, 
  useUpdateCheckinStatus, 
  useDeleteRegistration 
} from '@/hooks/useRegistrations';
import type { Registration } from '@/lib/types';

interface RegistrationsTableProps {
  registrations: Registration[];
  isLoading?: boolean;
  onEditRegistration?: (registration: Registration) => void;
}

export const RegistrationsTable: React.FC<RegistrationsTableProps> = ({ 
  registrations, 
  isLoading,
  onEditRegistration 
}) => {
  const [selectedRegistrations, setSelectedRegistrations] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [registrationToDelete, setRegistrationToDelete] = useState<Registration | null>(null);
  
  const updatePaymentMutation = useUpdatePaymentStatus();
  const updateCheckinMutation = useUpdateCheckinStatus();
  const deleteRegistrationMutation = useDeleteRegistration();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRegistrations(registrations.map(reg => reg.id));
    } else {
      setSelectedRegistrations([]);
    }
  };

  const handleSelectRegistration = (registrationId: string, checked: boolean) => {
    if (checked) {
      setSelectedRegistrations(prev => [...prev, registrationId]);
    } else {
      setSelectedRegistrations(prev => prev.filter(id => id !== registrationId));
    }
  };

  const handleCheckinToggle = async (registration: Registration) => {
    try {
      await updateCheckinMutation.mutateAsync({
        registrationId: registration.id,
        hasCheckedIn: !registration.has_checked_in
      });
    } catch (error) {
      console.error('Failed to update check-in status:', error);
    }
  };

  const handleDeleteClick = (registration: Registration) => {
    setRegistrationToDelete(registration);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!registrationToDelete) return;
    
    try {
      await deleteRegistrationMutation.mutateAsync(registrationToDelete.id);
      setDeleteDialogOpen(false);
      setRegistrationToDelete(null);
    } catch (error) {
      console.error('Failed to delete registration:', error);
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Name', 'Age', 'Email', 'Phone', 'Church', 'Category', 
      'Amount', 'Paid', 'Checked In', 'Registration Date'
    ];
    
    const csvData = registrations.map(reg => [
      `${reg.surname} ${reg.middle_name} ${reg.last_name}`.trim(),
      reg.age,
      reg.email || 'N/A',
      reg.phone_number,
      'Church Name', // You'd get this from church data
      'Category Name', // You'd get this from category data
      reg.total_amount,
      reg.has_paid ? 'Yes' : 'No',
      reg.has_checked_in ? 'Yes' : 'No',
      format(new Date(reg.registration_date), 'yyyy-MM-dd')
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `registrations-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (registrations.length === 0) {
    return (
      <div className="text-center py-12">
        <UserCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">No registrations yet</h3>
        <p className="text-muted-foreground">
          When people register for this camp, they'll appear here.
        </p>
      </div>
    );
  }

  const allSelected = selectedRegistrations.length === registrations.length;
  const someSelected = selectedRegistrations.length > 0;

  return (
    <>
      {/* Bulk Actions */}
      {someSelected && (
        <div className="mb-4 p-4 bg-muted rounded-lg flex items-center justify-between">
          <span className="text-sm font-medium">
            {selectedRegistrations.length} registration(s) selected
          </span>
          <div className="flex space-x-2">
            <Button size="sm" variant="outline">
              Mark as Paid
            </Button>
            <Button size="sm" variant="outline">
              Check In
            </Button>
            <Button size="sm" variant="outline">
              Export Selected
            </Button>
          </div>
        </div>
      )}

      {/* Export Button */}
      <div className="mb-4 flex justify-end">
        <Button variant="outline" size="sm" onClick={exportToCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export All
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Camper Code</TableHead>
              <TableHead>Participant</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Emergency Contact</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {registrations.map((registration) => (
              <TableRow key={registration.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedRegistrations.includes(registration.id)}
                    onCheckedChange={(checked) => 
                      handleSelectRegistration(registration.id, checked as boolean)
                    }
                  />
                </TableCell>
                <TableCell>{registration.camper_code}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">
                      {registration.surname} {registration.middle_name} {registration.last_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Age: {registration.age}
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="space-y-1">
                    {registration.email && (
                      <div className="flex items-center space-x-1 text-sm">
                        <Mail className="h-3 w-3" />
                        <span>{registration.email}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1 text-sm">
                      <Phone className="h-3 w-3" />
                      <span>{registration.phone_number}</span>
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">
                      {registration.emergency_contact_name}
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span>{registration.emergency_contact_phone}</span>
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="font-medium">
                    {formatCurrency(registration.total_amount)}
                  </div>
                </TableCell>
                
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={updatePaymentMutation.isPending}
                  >
                    {registration.has_paid ? (
                      <Badge variant="default" className="cursor-pointer">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Paid
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="cursor-pointer">
                        <XCircle className="h-3 w-3 mr-1" />
                        Unpaid
                      </Badge>
                    )}
                  </Button>
                </TableCell>
                
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCheckinToggle(registration)}
                    disabled={updateCheckinMutation.isPending}
                  >
                    {registration.has_checked_in ? (
                      <Badge variant="default" className="cursor-pointer">
                        <UserCheck className="h-3 w-3 mr-1" />
                        Checked In
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="cursor-pointer">
                        <XCircle className="h-3 w-3 mr-1" />
                        Not Checked In
                      </Badge>
                    )}
                  </Button>
                </TableCell>
                
                <TableCell>
                  <div className="text-sm">
                    {format(new Date(registration.registration_date), 'MMM dd, yyyy')}
                  </div>
                </TableCell>
                
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => onEditRegistration?.(registration)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleCheckinToggle(registration)}
                      >
                        <UserCheck className="mr-2 h-4 w-4" />
                        Toggle Check-in
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDeleteClick(registration)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Cancel Registration
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Registration?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently cancel the registration for "
              {registrationToDelete?.surname} {registrationToDelete?.middle_name} {registrationToDelete?.last_name}
              ". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Registration</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteRegistrationMutation.isPending}
            >
              {deleteRegistrationMutation.isPending ? 'Cancelling...' : 'Cancel Registration'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};