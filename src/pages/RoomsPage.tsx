import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus, Bed, Users, Home, AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { roomsApi } from "@/lib/api";
import RoomsTable from "@/components/rooms/RoomsTable";
import RoomForm from "@/components/rooms/RoomForm";
import { useToast } from "@/hooks/use-toast";
import { FullPageLoader } from "@/components/ui/full-page-loader";

const RoomsPage = () => {
  const { campId } = useParams();
  const { toast } = useToast();
  const [rooms, setRooms] = useState<any[]>([]);
  const [sideNavOpen, setSideNavOpen] = useState<boolean>(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [formLoading, setFormLoading] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter rooms based on gender and status
  const filteredRooms = rooms.filter(room => {
    const genderMatch = genderFilter === 'all' || room.room_gender === genderFilter;
    const statusMatch = statusFilter === 'all' || 
      (statusFilter === 'available' && !room.is_full && !room.is_damaged) ||
      (statusFilter === 'full' && room.is_full) ||
      (statusFilter === 'damaged' && room.is_damaged);
    
    return genderMatch && statusMatch;
  });

  // Calculate room statistics based on filtered data
  const roomStats = {
    totalRooms: filteredRooms.length,
    availableRooms: filteredRooms.filter(room => !room.is_full && !room.is_damaged).length,
    fullRooms: filteredRooms.filter(room => room.is_full).length,
    damagedRooms: filteredRooms.filter(room => room.is_damaged).length,
    totalCapacity: filteredRooms.reduce((sum, room) => sum + room.room_capacity + room.extra_beds, 0),
    currentOccupancy: filteredRooms.reduce((sum, room) => sum + room.current_occupancy, 0),
    occupancyRate: filteredRooms.length > 0 ? 
      (filteredRooms.reduce((sum, room) => sum + room.current_occupancy, 0) / 
       filteredRooms.reduce((sum, room) => sum + room.room_capacity + room.extra_beds, 0)) * 100 : 0
  };

  useEffect(() => {
    if (!campId) return;
    setLoading(true);
    roomsApi.getCampRooms(campId)
      .then((data) => {
        setRooms(data || []);
      })
      .catch((error) => {
        console.error('Error fetching rooms:', error);
        toast({
          title: "Error",
          description: "Failed to load rooms",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [campId, toast]);

  const handleRoomSubmit = async (formData: any) => {
    if (!campId) return;
    setFormLoading(true);
    try {
      if (editingRoom) {
        await roomsApi.updateRoom(editingRoom.id, formData);
        toast({
          title: "Success",
          description: "Room has been updated successfully.",
          variant: "default",
        });
      } else {
        await roomsApi.createRoom(campId, formData);
        toast({
          title: "Success",
          description: "Room has been created successfully.",
          variant: "default",
        });
      }
      
      // Refetch rooms after successful creation/update
      const updatedRooms = await roomsApi.getCampRooms(campId);
      setRooms(updatedRooms || []);
      setSideNavOpen(false);
      setEditingRoom(null);
    } catch (error: any) {
      console.error('Error saving room:', error);
      
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to save room";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditRoom = (room: any) => {
    setEditingRoom(room);
    setSideNavOpen(true);
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm("Are you sure you want to delete this room?")) return;
    
    try {
      await roomsApi.deleteRoom(roomId);
      const updatedRooms = await roomsApi.getCampRooms(campId!);
      setRooms(updatedRooms || []);
      toast({
        title: "Success",
        description: "Room has been deleted successfully.",
        variant: "default",
      });
    } catch (error: any) {
      console.error('Error deleting room:', error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to delete room";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleNewRoom = () => {
    setEditingRoom(null);
    setSideNavOpen(true);
  };

  const handleCloseSideNav = () => {
    setSideNavOpen(false);
    setEditingRoom(null);
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
      {formLoading && <FullPageLoader message="Processing room..." />}
      
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Rooms Management</h1>
            </div>
            <div className="flex items-center gap-4">
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
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="full">Full</SelectItem>
                    <SelectItem value="damaged">Damaged</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleNewRoom} variant="default">
                <Plus className="h-4 w-4 mr-2" />
                New Room
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
                    <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
                    <Home className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {roomStats.totalRooms}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Capacity: {roomStats.totalCapacity} beds
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Available Rooms</CardTitle>
                    <Bed className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {roomStats.availableRooms}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Ready for allocation
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
                    <Users className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {roomStats.occupancyRate.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {roomStats.currentOccupancy}/{roomStats.totalCapacity} occupied
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Issues</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {roomStats.damagedRooms}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Damaged rooms
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Rooms Table */}
              <RoomsTable 
                rooms={filteredRooms} 
                isLoading={loading}
                onEdit={handleEditRoom}
                onDelete={handleDeleteRoom}
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
              {editingRoom ? "Edit Room" : "New Room"}
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
            <RoomForm
              room={editingRoom}
              rooms={rooms}
              onSubmit={handleRoomSubmit}
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

export default RoomsPage;
