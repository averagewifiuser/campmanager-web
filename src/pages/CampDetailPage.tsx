// src/pages/CampDetailPage.tsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Users, 
  DollarSign, 
  Calendar,
  MapPin,
  UserCheck,
  Settings,

  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
import { RegistrationsTable } from '@/components/registrations/RegistrationsTable';
import { useCamp } from '@/hooks/useCamps';
import { useCampRegistrations, useCampStats } from '@/hooks/useRegistrations';
import { formatCurrency, formatDate } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { registrationsApi } from '@/lib/api';
import { RegistrationEditForm } from '@/components/forms/RegistrationEditForm';
import { useAuth } from '@/lib/auth-context';
import { canAccessRegistrations } from '@/lib/permissions.tsx';
import type { Registration } from '@/lib/types';

export const CampDetailPage: React.FC = () => {
  const { campId } = useParams<{ campId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Filter states
  // @ts-ignore
  const [searchTerm, setSearchTerm] = useState('');
  // @ts-ignore
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  // @ts-ignore
  const [checkinFilter, setCheckinFilter] = useState<string>('all');

  // Pagination state (must be before any conditional returns!)
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Data fetching
  const { data: camp, isLoading: campLoading, error: campError } = useCamp(campId!);
  // @ts-ignore
  const { data: registrations = [], isLoading: registrationsLoading, refetch: refetchRegistrations } = useCampRegistrations(campId!);
  const { data: stats, isLoading: statsLoading } = useCampStats(campId!);

  // Edit registration dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRegistration, setEditingRegistration] = useState<Registration | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEditRegistration = (registration: Registration) => {
    setEditingRegistration(registration);
    setEditDialogOpen(true);
  };

  const handleEditCancel = () => {
    setEditDialogOpen(false);
    setEditingRegistration(null);
  };

  const handleEditSubmit = async (data: any) => {
    if (!editingRegistration) return;
    setIsSubmitting(true);
    try {
      await registrationsApi.updateRegistration(editingRegistration.id, data);
      toast({ title: 'Registration updated', description: 'The registration was updated successfully.' });
      setEditDialogOpen(false);
      setEditingRegistration(null);
      await refetchRegistrations();
    } catch (error: any) {
      toast({ title: 'Update failed', description: error?.message || 'Failed to update registration', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Early returns for loading and error states
  if (!campId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-destructive">Invalid camp ID</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/camps')}>
              Back to Camps
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (campLoading || statsLoading) {
    return <LoadingSpinner />;
  }

  if (campError || !camp) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-destructive mb-4">Failed to load camp details</p>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => window.location.reload()}>
                Retry
              </Button>
              <Button onClick={() => navigate('/camps')}>
                Back to Camps
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Helper functions
  const getCampStatus = () => {
    const now = new Date();
    const startDate = new Date(camp.start_date);
    const endDate = new Date(camp.end_date);
    const registrationDeadline = new Date(camp.registration_deadline);

    if (!camp.is_active) {
      return { label: 'Inactive', variant: 'secondary' as const };
    }
    if (now > endDate) {
      return { label: 'Completed', variant: 'outline' as const };
    }
    if (now >= startDate) {
      return { label: 'In Progress', variant: 'default' as const };
    }
    if (now > registrationDeadline) {
      return { label: 'Registration Closed', variant: 'destructive' as const };
    }
    return { label: 'Open for Registration', variant: 'default' as const };
  };

  // Filter registrations
  const filteredRegistrations = registrations.filter((registration: Registration) => {
    const fullName = `${registration.surname} ${registration.middle_name} ${registration.last_name}`.toLowerCase();
    const email = registration.email?.toLowerCase() || '';
    const phone = registration.phone_number;
    
    const matchesSearch = searchTerm === '' || 
      fullName.includes(searchTerm.toLowerCase()) ||
      email.includes(searchTerm.toLowerCase()) ||
      phone.includes(searchTerm);
    
    const matchesPayment = paymentFilter === 'all' ||
      (paymentFilter === 'paid' && registration.has_paid) ||
      (paymentFilter === 'unpaid' && !registration.has_paid);
    
    const matchesCheckin = checkinFilter === 'all' ||
      (checkinFilter === 'checked-in' && registration.has_checked_in) ||
      (checkinFilter === 'not-checked-in' && !registration.has_checked_in);
    
    return matchesSearch && matchesPayment && matchesCheckin;
  });

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filteredRegistrations.length / rowsPerPage));
  // @ts-ignore
  const paginatedRegistrations = filteredRegistrations.slice(
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

  const status = getCampStatus();
  const capacityUsed = Math.round((registrations.length / camp.capacity) * 100);

  // Permission checks
  const hasRegistrationsAccess = canAccessRegistrations(user);
  const isCampManager = user?.role === 'camp_manager';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/camps')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Camps
              </Button>
              <div>
                <h1 className="text-xl font-semibold">{camp.name}</h1>
                <Badge variant={status.variant} className="mt-1">
                  {status.label}
                </Badge>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/camps/${campId}/edit`)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Edit Camp
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Camp Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Duration</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">
                  {formatDate(camp.start_date)}
                </div>
                <p className="text-xs text-muted-foreground">
                  to {formatDate(camp.end_date)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Location</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{camp.location}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Base Fee</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">
                  {formatCurrency(camp.base_fee)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Capacity</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">
                  {registrations.length} / {camp.capacity}
                </div>
                <p className="text-xs text-muted-foreground">
                  {capacityUsed}% full
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(stats.total_revenue)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Paid</CardTitle>
                  <UserCheck className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {stats.paid_registrations}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    of {stats.total_registrations}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Unpaid</CardTitle>
                  <DollarSign className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {stats.unpaid_registrations}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    need payment
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Checked In</CardTitle>
                  <UserCheck className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.checked_in_count}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    arrived at camp
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Utilization</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.capacity_utilization}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    of capacity
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Content Tabs */}
          {hasRegistrationsAccess ? (
            <Tabs defaultValue="registrations" className="space-y-4">
              <TabsList className={`grid w-full ${isCampManager ? 'grid-cols-3' : 'grid-cols-2'}`}>
                <TabsTrigger value="registrations">
                  Registrations ({filteredRegistrations.length})
                </TabsTrigger>
                <TabsTrigger value="analytics">
                  Analytics
                </TabsTrigger>
                {isCampManager && (
                  <TabsTrigger value="settings">
                    Settings
                  </TabsTrigger>
                )}
              </TabsList>

            {/* Registrations Tab */}
            <TabsContent value="registrations" className="space-y-4">
              {/* Search and Filters */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Manage Registrations</CardTitle>
                    {/* <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // CSV export functionality
                        const csvData = filteredRegistrations.map(reg => ({
                          name: `${reg.surname} ${reg.middle_name} ${reg.last_name}`.trim(),
                          age: reg.age,
                          email: reg.email || 'N/A',
                          phone: reg.phone_number,
                          amount: reg.total_amount,
                          paid: reg.has_paid ? 'Yes' : 'No',
                          checkedIn: reg.has_checked_in ? 'Yes' : 'No',
                          registrationDate: formatDate(reg.registration_date)
                        }));
                        
                        const headers = Object.keys(csvData[0] || {});
                        const csvContent = [
                          headers.join(','),
                          ...csvData.map(row => Object.values(row).map(field => `"${field}"`).join(','))
                        ].join('\n');
                        
                        const blob = new Blob([csvContent], { type: 'text/csv' });
                        const url = window.URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `${camp.name}-registrations.csv`;
                        link.click();
                        window.URL.revokeObjectURL(url);
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button> */}
                  </div>
                </CardHeader>
              </Card>

              {/* Registrations Table */}
              <Card>
                <CardContent className="p-0">
                  <RegistrationsTable 
                    campId={campId}
                    onEditRegistration={handleEditRegistration}
                  />
                  {/* Edit Registration Dialog */}
                  <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                    <DialogContent className="max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Edit Registration</DialogTitle>
                      </DialogHeader>
                      {editingRegistration && (
                        <RegistrationEditForm
                          registration={editingRegistration}
                          onSubmit={handleEditSubmit}
                          onCancel={handleEditCancel}
                          isSubmitting={isSubmitting}
                        />
                      )}
                    </DialogContent>
                  </Dialog>
                  {/* Pagination Controls */}
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
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-4">
              {stats && stats.registration_by_category && stats.registration_by_church ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Registrations by Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(stats.registration_by_category).map(([category, count]) => (
                          <div key={category} className="flex items-center justify-between">
                            <span className="text-sm font-medium">{category}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full" 
                                  style={{ 
                                    width: `${Math.round((count / stats.total_registrations) * 100)}%` 
                                  }}
                                />
                              </div>
                              <span className="text-sm font-bold w-8 text-right">{count}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Registrations by Church</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(stats.registration_by_church).map(([church, count]) => (
                          <div key={church} className="flex items-center justify-between">
                            <span className="text-sm font-medium">{church}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full" 
                                  style={{ 
                                    width: `${Math.round((count / stats.total_registrations) * 100)}%` 
                                  }}
                                />
                              </div>
                              <span className="text-sm font-bold w-8 text-right">{count}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-muted-foreground">No analytics data available</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Camp Management</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      className="w-full justify-start"
                      onClick={() => navigate(`/camps/${campId}/edit`)}
                    >
                      Edit Camp Details
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => navigate(`/camps/${campId}/manage`)}
                    >
                      Manage Churches & Categories
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Registration Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => navigate(`/camps/${campId}/manage`)}
                    >
                      Registration Links
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => navigate(`/camps/${campId}/manage`)}
                    >
                      Custom Fields
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      Email Templates
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            </Tabs>
          ) : (
            /* Fallback for users without registrations access */
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">Access Restricted</h3>
                    <p className="text-muted-foreground">
                      You don't have permission to view registrations for this camp.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Contact your camp manager if you need access to registration data.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};
