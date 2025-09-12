import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus, Users, UserCheck, UserX, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { roomAllocationsApi, roomsApi, registrationsApi } from "@/lib/api";
import RoomAllocationsTable from "@/components/room-allocations/RoomAllocationsTable";
import RoomAllocationForm from "@/components/room-allocations/RoomAllocationForm";
import { useToast } from "@/hooks/use-toast";
import { FullPageLoader } from "@/components/ui/full-page-loader";

const RoomAllocationsPage = () => {
  const { campId } = useParams();
  const { toast } = useToast();
  const [allocations, setAllocations] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [sideNavOpen, setSideNavOpen] = useState<boolean>(false);
  const [editingAllocation, setEditingAllocation] = useState<any>(null);
  const [formLoading, setFormLoading] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');

  // Filter allocations based on status and gender
  const filteredAllocations = allocations.filter(allocation => {
    const statusMatch = statusFilter === 'all' || 
      (statusFilter === 'active' && allocation.is_active) ||
      (statusFilter === 'inactive' && !allocation.is_active);
    
    const genderMatch = genderFilter === 'all' || 
      allocation.registration?.gender === genderFilter;
    
    return statusMatch && genderMatch;
  });

  // Calculate allocation statistics
  const allocationStats = {
    totalAllocations: filteredAllocations.length,
    activeAllocations: filteredAllocations.filter(a => a.is_active).length,
    inactiveAllocations: filteredAllocations.filter(a => !a.is_active).length,
    recentAllocations: filteredAllocations.filter(allocation => {
      const allocationDate = new Date(allocation.allocation_date);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return allocationDate >= sevenDaysAgo;
    }).length,
    maleAllocations: filteredAllocations.filter(a => a.registration?.gender === 'male').length,
    femaleAllocations: filteredAllocations.filter(a => a.registration?.gender === 'female').length,
  };

  useEffect(() => {
    if (!campId) return;
    setLoading(true);
    
    Promise.all([
      roomAllocationsApi.getCampRoomAllocations(campId),
      roomsApi.getCampRooms(campId),
      registrationsApi.getCampRegistrations(campId)
    ])
      .then(([allocationsData, roomsData, registrationsData]) => {
        setAllocations(allocationsData || []);
        setRooms(roomsData || []);
        setRegistrations(registrationsData || []);
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load room allocations",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [campId, toast]);

  const handleAllocationSubmit = async (formData: any) => {
    if (!campId) return;
    setFormLoading(true);
    try {
      if (editingAllocation) {
        await roomAllocationsApi.updateRoomAllocation(editingAllocation.id, {
          is_active: formData.is_active,
          notes: formData.notes,
        });
        toast({
          title: "Success",
          description: "Room allocation has been updated successfully.",
          variant: "default",
        });
      } else {
        await roomAllocationsApi.allocateRoom(campId, formData);
        toast({
          title: "Success",
          description: "Room has been allocated successfully.",
          variant: "default",
        });
      }
      
      // Refetch data after successful operation
      const [updatedAllocations, updatedRooms] = await Promise.all([
        roomAllocationsApi.getCampRoomAllocations(campId),
        roomsApi.getCampRooms(campId)
      ]);
      setAllocations(updatedAllocations || []);
      setRooms(updatedRooms || []);
      setSideNavOpen(false);
      setEditingAllocation(null);
    } catch (error: any) {
      console.error('Error saving allocation:', error);
      
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to save allocation";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditAllocation = (allocation: any) => {
    setEditingAllocation(allocation);
    setSideNavOpen(true);
  };

  const handleDeleteAllocation = async (allocationId: string) => {
    if (!confirm("Are you sure you want to remove this room allocation?")) return;
    
    try {
      await roomAllocationsApi.deallocateRoom(allocationId);
      
      // Refetch data after successful deletion
      const [updatedAllocations, updatedRooms] = await Promise.all([
        roomAllocationsApi.getCampRoomAllocations(campId!),
        roomsApi.getCampRooms(campId!)
      ]);
      setAllocations(updatedAllocations || []);
      setRooms(updatedRooms || []);
      
      toast({
        title: "Success",
        description: "Room allocation has been removed successfully.",
        variant: "default",
      });
    } catch (error: any) {
      console.error('Error deleting allocation:', error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to remove allocation";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleNewAllocation = () => {
    setEditingAllocation(null);
    setSideNavOpen(true);
  };

  const handleCloseSideNav = () => {
    setSideNavOpen(false);
    setEditingAllocation(null);
  };

  if (!campId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-destructive">No camp selected.</p>
            <Button variant="outline" className="mt-4" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Full Page Loader */}
      {formLoading && <FullPageLoader message="Processing allocation..." />}
      
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Room Allocations</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Gender:</span>
                <Select value={genderFilter} onValueChange={setGenderFilter}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleNewAllocation} variant="default">
                <Plus className="h-4 w-4 mr-2" />
                New Allocation
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div>Loading...</div>
            </div>
          ) : (
            <>
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Allocations</CardTitle>
                    <Users className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {allocationStats.totalAllocations}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Room assignments
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Allocations</CardTitle>
                    <UserCheck className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {allocationStats.activeAllocations}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Currently active
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Recent Allocations</CardTitle>
                    <Calendar className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {allocationStats.recentAllocations}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Last 7 days
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Gender Split</CardTitle>
                    <UserX className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold text-orange-600">
                      {allocationStats.maleAllocations}M / {allocationStats.femaleAllocations}F
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Male / Female
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Allocations Table */}
              <RoomAllocationsTable 
                allocations={filteredAllocations} 
                isLoading={loading}
                onEdit={handleEditAllocation}
                onDelete={handleDeleteAllocation}
              />
            </>
          )}
        </div>
      </main>

      {/* Side Navigation */}
      {sideNavOpen && (
        <div className="fixed right-0 top-0 h-full w-1/2 bg-white border-l shadow-lg z-50">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-semibold">
              {editingAllocation ? "Edit Allocation" : "New Room Allocation"}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCloseSideNav}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-4 overflow-auto h-full pb-20">
            <RoomAllocationForm
              allocation={editingAllocation}
              rooms={rooms}
              registrations={registrations}
              onSubmit={handleAllocationSubmit}
              onCancel={handleCloseSideNav}
              loading={formLoading}
            />
          </div>
        </div>
      )}

      {/* Overlay */}
      {sideNavOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-30 z-40"
          onClick={handleCloseSideNav}
        />
      )}
    </div>
  );
};

export default RoomAllocationsPage;
