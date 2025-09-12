import React, { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Users, Calendar, Filter } from "lucide-react";

// Mock Select Components
type MockSelectProps = {
  children: React.ReactNode;
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
};
const MockSelect = ({ children, value, onValueChange, className = "" }: MockSelectProps) => (
  <select
    className={`px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
    value={value}
    onChange={(e) => onValueChange(e.target.value)}
  >
    {children}
  </select>
);

type MockSelectItemProps = { value: string; children: React.ReactNode };
const MockSelectItem = ({ value, children }: MockSelectItemProps) => (
  <option value={value}>{children}</option>
);

interface RoomAllocation {
  id: string;
  room_id: string;
  registration_id: string;
  camp_id: string;
  allocated_by: string;
  allocator_name: string;
  allocation_date: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Extended data from joins
  room?: {
    hostel_name: string;
    block: string;
    room_number: string;
    room_gender: string;
  };
  registration?: {
    surname: string;
    middle_name: string;
    last_name: string;
    camper_code: string;
    gender: string;
  };
}

interface RoomAllocationsTableProps {
  allocations: RoomAllocation[];
  isLoading: boolean;
  onEdit?: (allocation: RoomAllocation) => void;
  onDelete?: (allocationId: string) => void;
}

const RoomAllocationsTable: React.FC<RoomAllocationsTableProps> = ({ 
  allocations, 
  isLoading, 
  onEdit, 
  onDelete 
}) => {
  const [selectedHostel, setSelectedHostel] = useState<string>("");

  // Get unique hostels from allocations data
  const availableHostels = useMemo(() => {
    const hostels = Array.from(new Set(
      allocations
        .filter(allocation => allocation.room?.hostel_name)
        .map(allocation => allocation.room!.hostel_name)
    ));
    return hostels.sort();
  }, [allocations]);

  // Filter allocations based on selected hostel
  const filteredAllocations = useMemo(() => {
    if (!selectedHostel) return allocations;
    return allocations.filter(allocation => 
      allocation.room?.hostel_name === selectedHostel
    );
  }, [allocations, selectedHostel]);
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  const getRegistrationDisplayName = (registration: any) => {
    if (!registration) return 'Unknown Camper';
    return `${registration.surname || ""} ${registration.middle_name || ""} ${registration.last_name || ""}`.trim();
  };

  const getRoomDisplayName = (room: any) => {
    if (!room) return 'Unknown Room';
    return `${room.hostel_name} - ${room.block} - Room ${room.room_number}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading room allocations...</p>
        </div>
      </div>
    );
  }

  if (allocations.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No room allocations found</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by allocating rooms to campers.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Section */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter by Hostel:</span>
          </div>
          <MockSelect 
            value={selectedHostel} 
            onValueChange={setSelectedHostel}
            className="min-w-[200px]"
          >
            <MockSelectItem value="">All Hostels</MockSelectItem>
            {availableHostels.map((hostel) => (
              <MockSelectItem key={hostel} value={hostel}>
                {hostel}
              </MockSelectItem>
            ))}
          </MockSelect>
          {selectedHostel && (
            <span className="text-sm text-gray-500">
              Showing {filteredAllocations.length} of {allocations.length} allocations
            </span>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg border">
        <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Camper</TableHead>
            <TableHead>Room</TableHead>
            <TableHead>Allocated By</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
          <TableBody>
            {filteredAllocations.map((allocation) => (
              <TableRow key={allocation.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {getRegistrationDisplayName(allocation.registration)}
                    </div>
                    {allocation.registration?.camper_code && (
                      <div className="text-sm text-gray-500">
                        Code: {allocation.registration.camper_code}
                      </div>
                    )}
                    {allocation.registration?.gender && (
                      <Badge 
                        variant="outline" 
                        className="text-xs mt-1"
                      >
                        {allocation.registration.gender}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {getRoomDisplayName(allocation.room)}
                    </div>
                    {allocation.room?.room_gender && (
                      <div className="text-sm text-gray-500">
                        {allocation.room.room_gender} room
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {allocation.allocator_name}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      {formatDate(allocation.allocation_date)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusBadgeColor(allocation.is_active)}>
                    {allocation.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {allocation.notes && (
                    <div className="text-sm text-gray-600 max-w-xs truncate">
                      {allocation.notes}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(allocation)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(allocation.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default RoomAllocationsTable;
