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
  Filter,
  X,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  useDeleteRegistration,
  useCampRegistrations
} from '@/hooks/useRegistrations';
import { useChurches } from '@/hooks/useChurches';
import { useCategories } from '@/hooks/useCategories';
import type { Registration } from '@/lib/types';

interface RegistrationsTableProps {
  campId: string;
  onEditRegistration?: (registration: Registration) => void;
}

export const RegistrationsTable: React.FC<RegistrationsTableProps> = ({ 
  campId,
  onEditRegistration 
}) => {
  const [selectedRegistrations, setSelectedRegistrations] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [registrationToDelete, setRegistrationToDelete] = useState<Registration | null>(null);
  
  // Filter state
  const [churchFilter, setChurchFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  
  // Fetch data with filters
  const { data: allRegistrations = [], isLoading } = useCampRegistrations(campId, {
    church_id: churchFilter !== 'all' ? churchFilter : undefined,
    category_id: categoryFilter !== 'all' ? categoryFilter : undefined,
  });
  
  // Filter registrations based on search query
  const filteredRegistrations = searchQuery.trim() 
    ? allRegistrations.filter((reg) => {
        const query = searchQuery.toLowerCase();
        const camperCode = reg.camper_code?.toLowerCase() || "";
        const fullName = `${reg.surname || ""} ${reg.middle_name || ""} ${reg.last_name || ""}`.toLowerCase();
        const email = reg.email?.toLowerCase() || "";
        const phone = reg.phone_number?.toLowerCase() || "";
        return camperCode.includes(query) || fullName.includes(query) || email.includes(query) || phone.includes(query);
      })
    : [];
    
  const registrations = allRegistrations;
  
  // Fetch filter options
  const { data: churches = [] } = useChurches(campId);
  const { data: categories = [] } = useCategories(campId);
  
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

  //@ts-ignore
  // const exportToCSV = () => {
  //   const headers = [
  //     'Name', 'Age', 'Email', 'Phone', 'Church', 'Category', 
  //     'Amount', 'Paid', 'Checked In', 'Registration Date'
  //   ];
    
  //   const csvData = registrations.map(reg => [
  //     `${reg.surname} ${reg.middle_name} ${reg.last_name}`.trim(),
  //     reg.age,
  //     reg.email || 'N/A',
  //     reg.phone_number,
  //     'Church Name', // You'd get this from church data
  //     'Category Name', // You'd get this from category data
  //     reg.total_amount,
  //     reg.has_paid ? 'Yes' : 'No',
  //     reg.has_checked_in ? 'Yes' : 'No',
  //     format(new Date(reg.registration_date), 'yyyy-MM-dd')
  //   ]);

  //   const csvContent = [headers, ...csvData]
  //     .map(row => row.map(field => `"${field}"`).join(','))
  //     .join('\n');

  //   const blob = new Blob([csvContent], { type: 'text/csv' });
  //   const url = window.URL.createObjectURL(blob);
  //   const link = document.createElement('a');
  //   link.href = url;
  //   link.download = `registrations-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  //   link.click();
  //   window.URL.revokeObjectURL(url);
  // };

  const allSelected = selectedRegistrations.length === registrations.length;
  const someSelected = selectedRegistrations.length > 0;

  const clearFilters = () => {
    setChurchFilter('all');
    setCategoryFilter('all');
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const hasActiveFilters = churchFilter !== 'all' || categoryFilter !== 'all' || searchQuery.trim() !== '';
  
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSearchResults(value.trim().length > 0);
  };

  const getRegistrationDisplayName = (reg: Registration) => {
    return `${reg.surname || ""} ${reg.middle_name || ""} ${reg.last_name || ""}`.trim();
  };

  // Loading state
  if (isLoading) {
    return (
      <>
        {/* Filters - Always visible */}
        <div className="mb-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Church:</label>
              <Select value={churchFilter} onValueChange={setChurchFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All churches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All churches</SelectItem>
                  {churches.map((church) => (
                    <SelectItem key={church.id} value={church.id}>
                      {church.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Category:</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Clear filters
              </Button>
            )}
          </div>
        </div>

        {/* Loading skeleton */}
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 animate-pulse rounded" />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      {/* Search and Filters - Always visible */}
      <div className="mb-4 p-4 bg-muted/50 rounded-lg space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Search Registrations:</span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              value={searchQuery}
              onChange={handleSearchInputChange}
              placeholder="Search by camper code, name, email, or phone..."
              className="pl-10"
              onFocus={() => setShowSearchResults(searchQuery.trim().length > 0)}
              onBlur={() => {
                // Delay hiding results to allow for clicks
                setTimeout(() => setShowSearchResults(false), 200);
              }}
            />
          </div>
          
          {showSearchResults && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {filteredRegistrations.length === 0 ? (
                <div className="px-3 py-2 text-gray-500 text-sm">
                  No registrations found matching "{searchQuery}"
                </div>
              ) : (
                <>
                  <div className="px-3 py-2 text-xs text-gray-500 border-b bg-gray-50">
                    {filteredRegistrations.length} registration(s) found
                  </div>
                  {filteredRegistrations.slice(0, 10).map((reg) => (
                    <div
                      key={reg.id}
                      className="px-3 py-2 cursor-pointer hover:bg-gray-100 border-b last:border-b-0"
                      onClick={() => {
                        // Scroll to the registration in the table if it's visible
                        const element = document.getElementById(`registration-${reg.id}`);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          element.classList.add('bg-yellow-100');
                          setTimeout(() => element.classList.remove('bg-yellow-100'), 2000);
                        }
                        setSearchQuery('');
                        setShowSearchResults(false);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{getRegistrationDisplayName(reg)}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-4">
                            <span>Code: {reg.camper_code}</span>
                            {reg.email && <span>Email: {reg.email}</span>}
                            <span>Phone: {reg.phone_number}</span>
                          </div>
                          <div className="text-xs text-gray-400 flex items-center gap-2">
                            <Badge variant={reg.has_paid ? "default" : "destructive"} className="text-xs">
                              {reg.has_paid ? "Paid" : "Unpaid"}
                            </Badge>
                            <Badge variant={reg.has_checked_in ? "default" : "secondary"} className="text-xs">
                              {reg.has_checked_in ? "Checked In" : "Not Checked In"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredRegistrations.length > 10 && (
                    <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50">
                      Showing first 10 results. Refine your search to see more specific results.
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Church:</label>
            <Select value={churchFilter} onValueChange={setChurchFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All churches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All churches</SelectItem>
                {churches.map((church) => (
                  <SelectItem key={church.id} value={church.id}>
                    {church.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Category:</label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Clear all
            </Button>
          )}
        </div>
        
        {hasActiveFilters && (
          <div className="mt-2 text-sm text-muted-foreground">
            {searchQuery.trim() && (
              <span>Search: "{searchQuery}" • </span>
            )}
            Showing {registrations.length} registration(s) 
            {(churchFilter !== 'all' || categoryFilter !== 'all') && ' with active filters'}
          </div>
        )}
      </div>

      {/* Empty state */}
      {registrations.length === 0 && (
        <div className="text-center py-12">
          <UserCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">
            {hasActiveFilters ? 'No registrations match your filters' : 'No registrations yet'}
          </h3>
          <p className="text-muted-foreground">
            {hasActiveFilters 
              ? 'Try adjusting your filter criteria or clear all filters to see all registrations.'
              : 'When people register for this camp, they\'ll appear here.'
            }
          </p>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="mt-4"
            >
              Clear all filters
            </Button>
          )}
        </div>
      )}

      {/* Table and related UI - Only show when there are registrations */}
      {registrations.length > 0 && (
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
          {/* <div className="mb-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export All
            </Button>
          </div> */}

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
                  <TableRow key={registration.id} id={`registration-${registration.id}`}>
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
        </>
      )}

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
