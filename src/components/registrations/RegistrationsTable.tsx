// src/components/registrations/RegistrationsTable.tsx
import { useState, useMemo } from 'react';
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
  Search,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/utils';
import { 
  useUpdatePaymentStatus, 
  useUpdateCheckinStatus, 
  useDeleteRegistration,
  useCampRegistrations
} from '@/hooks/useRegistrations';
import { useChurches } from '@/hooks/useChurches';
import { useCategories } from '@/hooks/useCategories';
import { useCustomFields } from '@/hooks/useCustomFields';
import type { Registration, CustomField } from '@/lib/types';

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
  const [customFieldFilters, setCustomFieldFilters] = useState<Record<string, string>>({});
  
  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  
  // View state
  const [showAllDetails, setShowAllDetails] = useState<boolean>(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  
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
  const { data: customFields = [] } = useCustomFields(campId);
  
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
    setCustomFieldFilters({});
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const hasActiveFilters = churchFilter !== 'all' || categoryFilter !== 'all' || 
    Object.keys(customFieldFilters).length > 0 || searchQuery.trim() !== '';
  
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSearchResults(value.trim().length > 0);
  };

  const getRegistrationDisplayName = (reg: Registration) => {
    return `${reg.surname || ""} ${reg.middle_name || ""} ${reg.last_name || ""}`.trim();
  };

  // Helper function to get custom field name by ID
  //@ts-ignore
  const getCustomFieldName = (fieldId: string): string => {
    const field = customFields.find(f => f.id === fieldId);
    return field?.field_name || fieldId;
  };

  // Helper function to format custom field response
  const formatCustomFieldResponse = (field: CustomField, value: any): string => {
    if (value === null || value === undefined || value === '') return 'N/A';
    
    if (field.field_type === 'checkbox') {
      return value ? 'Yes' : 'No';
    }
    
    if (field.field_type === 'dropdown' && field.options) {
      // For dropdown fields, show the actual option value
      return String(value);
    }
    
    if (field.field_type === 'date') {
      try {
        return format(new Date(value), 'MMM dd, yyyy');
      } catch {
        return String(value);
      }
    }
    
    return String(value);
  };

  // Group custom field responses by field with options
  //@ts-ignore
  const groupedCustomFieldResponses = useMemo(() => {
    const grouped: Record<string, Record<string, Registration[]>> = {};
    
    customFields.forEach(field => {
      if (field.options && field.options.length > 0) {
        grouped[field.id] = {};
        
        // Initialize groups for each option
        field.options.forEach(option => {
          grouped[field.id][option] = [];
        });
        
        // Add "Other" group for any responses not in options
        grouped[field.id]['Other'] = [];
        
        // Group registrations by their response to this field
        registrations.forEach(reg => {
          const response = reg.custom_field_responses[field.id];
          if (response !== null && response !== undefined && response !== '') {
            const responseStr = String(response);
            if (field.options!.includes(responseStr)) {
              grouped[field.id][responseStr].push(reg);
            } else {
              grouped[field.id]['Other'].push(reg);
            }
          }
        });
      }
    });
    
    return grouped;
  }, [customFields, registrations]);

  // Filter registrations by custom fields
  const filteredByCustomFields = useMemo(() => {
    if (Object.keys(customFieldFilters).length === 0) return registrations;
    
    return registrations.filter(reg => {
      return Object.entries(customFieldFilters).every(([fieldId, filterValue]) => {
        if (filterValue === 'all') return true;
        
        const response = reg.custom_field_responses[fieldId];
        if (response === null || response === undefined || response === '') {
          return filterValue === 'empty';
        }
        
        return String(response) === filterValue;
      });
    });
  }, [registrations, customFieldFilters]);

  // Update the final registrations list to use custom field filtering
  const finalRegistrations = searchQuery.trim() 
    ? filteredByCustomFields.filter((reg) => {
        const query = searchQuery.toLowerCase();
        const camperCode = reg.camper_code?.toLowerCase() || "";
        const fullName = `${reg.surname || ""} ${reg.middle_name || ""} ${reg.last_name || ""}`.toLowerCase();
        const email = reg.email?.toLowerCase() || "";
        const phone = reg.phone_number?.toLowerCase() || "";
        return camperCode.includes(query) || fullName.includes(query) || email.includes(query) || phone.includes(query);
      })
    : filteredByCustomFields;

  // Pagination calculations
  const totalPages = Math.ceil(finalRegistrations.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedRegistrations = finalRegistrations.slice(startIndex, endIndex);

  // Reset to first page when filters change
  const resetPagination = () => {
    setCurrentPage(1);
  };

  // Handle pagination changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRowsPerPageChange = (value: string) => {
    setRowsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  // Reset pagination when filters change
  useMemo(() => {
    resetPagination();
  }, [churchFilter, categoryFilter, customFieldFilters, searchQuery]);

  const toggleRowExpansion = (registrationId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(registrationId)) {
      newExpanded.delete(registrationId);
    } else {
      newExpanded.add(registrationId);
    }
    setExpandedRows(newExpanded);
  };

  const handleCustomFieldFilterChange = (fieldId: string, value: string) => {
    setCustomFieldFilters(prev => ({
      ...prev,
      [fieldId]: value
    }));
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

            {/* Custom Field Filters */}
            {customFields.map((field) => (
              <div key={field.id} className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">{field.field_name}:</label>
                <Select 
                  value={customFieldFilters[field.id] || 'all'} 
                  onValueChange={(value) => handleCustomFieldFilterChange(field.id, value)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder={`All ${field.field_name.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All {field.field_name.toLowerCase()}</SelectItem>
                    <SelectItem value="empty">No response</SelectItem>
                    {field.options && field.options.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                    {!field.options && (
                      <SelectItem value="has_value">Has response</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            ))}

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

          {/* Custom Field Filters */}
          {customFields.map((field) => (
            <div key={field.id} className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">{field.field_name}:</label>
              <Select 
                value={customFieldFilters[field.id] || 'all'} 
                onValueChange={(value) => handleCustomFieldFilterChange(field.id, value)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder={`All ${field.field_name.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All {field.field_name.toLowerCase()}</SelectItem>
                  <SelectItem value="empty">No response</SelectItem>
                  {field.options && field.options.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                  {!field.options && (
                    <SelectItem value="has_value">Has response</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          ))}

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
            Showing {finalRegistrations.length} registration(s) 
            {(churchFilter !== 'all' || categoryFilter !== 'all' || Object.keys(customFieldFilters).length > 0) && ' with active filters'}
          </div>
        )}
      </div>


      {/* Tabs Container */}
      <Tabs defaultValue="registrations" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="registrations">Registrations</TabsTrigger>
          <TabsTrigger value="groupings">Groupings</TabsTrigger>
        </TabsList>

        {/* Registrations Tab */}
        <TabsContent value="registrations" className="space-y-4">
          {/* Empty state */}
          {finalRegistrations.length === 0 && (
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

          {/* View Options */}
          {finalRegistrations.length > 0 && (
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllDetails(!showAllDetails)}
                >
                  {showAllDetails ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                  {showAllDetails ? 'Hide Details' : 'Show All Details'}
                </Button>
                
                {showAllDetails && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedRows(new Set(finalRegistrations.map(r => r.id)))}
                    >
                      Expand All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedRows(new Set())}
                    >
                      Collapse All
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Table and related UI - Only show when there are registrations */}
          {finalRegistrations.length > 0 && (
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
                      {showAllDetails && <TableHead className="w-[30px]"></TableHead>}
                      <TableHead>Camper Code</TableHead>
                      <TableHead>Participant</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Emergency Contact</TableHead>
                      {showAllDetails && <TableHead>Church</TableHead>}
                      {showAllDetails && <TableHead>Category</TableHead>}
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead className="w-[70px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRegistrations.map((registration) => {
                      const isExpanded = expandedRows.has(registration.id);
                      const church = churches.find(c => c.id === registration.church_id);
                      const category = categories.find(c => c.id === registration.category_id);
                      
                      return (
                        <>
                          <TableRow key={registration.id} id={`registration-${registration.id}`}>
                            <TableCell>
                              <Checkbox
                                checked={selectedRegistrations.includes(registration.id)}
                                onCheckedChange={(checked) => 
                                  handleSelectRegistration(registration.id, checked as boolean)
                                }
                              />
                            </TableCell>
                            
                            {showAllDetails && (
                              <TableCell>
                                {Object.keys(registration.custom_field_responses).length > 0 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleRowExpansion(registration.id)}
                                    className="p-0 h-6 w-6"
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                  </Button>
                                )}
                              </TableCell>
                            )}
                            
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
                            
                            {showAllDetails && (
                              <TableCell>
                                <div className="text-sm">
                                  {church?.name || 'N/A'}
                                </div>
                              </TableCell>
                            )}
                            
                            {showAllDetails && (
                              <TableCell>
                                <div className="text-sm">
                                  {category?.name || 'N/A'}
                                </div>
                              </TableCell>
                            )}
                            
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
                          
                          {/* Expanded row for custom field details */}
                          {showAllDetails && isExpanded && Object.keys(registration.custom_field_responses).length > 0 && (
                            <TableRow>
                              <TableCell colSpan={showAllDetails ? 12 : 10} className="bg-muted/20">
                                <div className="p-4">
                                  <h4 className="font-medium mb-3">Custom Field Responses</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {Object.entries(registration.custom_field_responses).map(([fieldId, value]) => {
                                      const field = customFields.find(f => f.id === fieldId);
                                      if (!field) return null;
                                      
                                      return (
                                        <div key={fieldId} className="space-y-1">
                                          <div className="text-sm font-medium text-muted-foreground">
                                            {field.field_name}
                                          </div>
                                          <div className="text-sm">
                                            {formatCustomFieldResponse(field, value)}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Rows per page:</span>
                    <Select value={rowsPerPage.toString()} onValueChange={handleRowsPerPageChange}>
                      <SelectTrigger className="w-[70px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Showing {startIndex + 1} to {Math.min(endIndex, finalRegistrations.length)} of {finalRegistrations.length} entries
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className="w-8"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Groupings Tab */}
        <TabsContent value="groupings" className="space-y-4">
          {Object.keys(groupedCustomFieldResponses).length === 0 ? (
            <div className="text-center py-12">
              <Filter className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No Custom Fields with Options</h3>
              <p className="text-muted-foreground">
                Groupings will appear here when you have custom fields with dropdown options.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedCustomFieldResponses).map(([fieldId, groups]) => {
                const field = customFields.find(f => f.id === fieldId);
                if (!field) return null;

                return (
                  <div key={fieldId} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{field.field_name}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {Object.values(groups).reduce((total, regs) => total + regs.length, 0)} total responses
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {Object.entries(groups).map(([option, registrations]) => (
                        <div key={option} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm">{option}</h4>
                            <Badge variant="outline" className="text-xs">
                              {registrations.length}
                            </Badge>
                          </div>
                          
                          {registrations.length > 0 ? (
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {registrations.map((reg) => (
                                <div key={reg.id} className="text-xs p-2 bg-muted/50 rounded">
                                  <div className="font-medium">
                                    {getRegistrationDisplayName(reg)}
                                  </div>
                                  <div className="text-muted-foreground">
                                    {reg.camper_code}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge 
                                      variant={reg.has_paid ? "default" : "destructive"} 
                                      className="text-xs px-1 py-0"
                                    >
                                      {reg.has_paid ? "Paid" : "Unpaid"}
                                    </Badge>
                                    <Badge 
                                      variant={reg.has_checked_in ? "default" : "secondary"} 
                                      className="text-xs px-1 py-0"
                                    >
                                      {reg.has_checked_in ? "In" : "Out"}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground text-center py-4">
                              No registrations
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

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
