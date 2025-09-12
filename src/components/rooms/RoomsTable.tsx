import React, { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Users, Bed, Filter } from "lucide-react";

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

interface Room {
  id: string;
  hostel_name: string;
  block: string;
  room_number: string;
  room_capacity: number;
  is_special_room: boolean;
  extra_beds: number;
  room_gender: 'male' | 'female' | 'other';
  is_damaged: boolean;
  misc_info?: string;
  adjoining_to?: string;
  current_occupancy: number;
  available_capacity: number;
  is_full: boolean;
  created_at: string;
  updated_at: string;
}

interface RoomsTableProps {
  rooms: Room[];
  isLoading: boolean;
  onEdit?: (room: Room) => void;
  onDelete?: (roomId: string) => void;
}

const RoomsTable: React.FC<RoomsTableProps> = ({ 
  rooms, 
  isLoading, 
  onEdit, 
  onDelete 
}) => {
  const [selectedHostel, setSelectedHostel] = useState<string>("");

  // Get unique hostels from rooms data
  const availableHostels = useMemo(() => {
    const hostels = Array.from(new Set(rooms.map(room => room.hostel_name)));
    return hostels.sort();
  }, [rooms]);

  // Filter rooms based on selected hostel
  const filteredRooms = useMemo(() => {
    if (!selectedHostel) return rooms;
    return rooms.filter(room => room.hostel_name === selectedHostel);
  }, [rooms, selectedHostel]);
  const getGenderBadgeColor = (gender: string) => {
    switch (gender) {
      case 'male':
        return 'bg-blue-100 text-blue-800';
      case 'female':
        return 'bg-pink-100 text-pink-800';
      case 'other':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (room: Room) => {
    if (room.is_damaged) return 'bg-red-100 text-red-800';
    if (room.is_full) return 'bg-orange-100 text-orange-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (room: Room) => {
    if (room.is_damaged) return 'Damaged';
    if (room.is_full) return 'Full';
    return 'Available';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading rooms...</p>
        </div>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="text-center py-12">
        <Bed className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No rooms found</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating a new room.
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
              Showing {filteredRooms.length} of {rooms.length} rooms
            </span>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg border">
        <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Room Details</TableHead>
            <TableHead>Capacity</TableHead>
            <TableHead>Gender</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Occupancy</TableHead>
            <TableHead>Special</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
          <TableBody>
            {filteredRooms.map((room) => (
              <TableRow key={room.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {room.hostel_name} - {room.block}
                    </div>
                    <div className="text-sm text-gray-500">
                      Room {room.room_number}
                    </div>
                    {room.misc_info && (
                      <div className="text-xs text-gray-400 mt-1">
                        {room.misc_info}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>{room.room_capacity}</span>
                    {room.extra_beds > 0 && (
                      <span className="text-xs text-gray-500">
                        (+{room.extra_beds})
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getGenderBadgeColor(room.room_gender)}>
                    {room.room_gender.charAt(0).toUpperCase() + room.room_gender.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusBadgeColor(room)}>
                    {getStatusText(room)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{room.current_occupancy}/{room.room_capacity + room.extra_beds}</div>
                    <div className="text-xs text-gray-500">
                      {room.available_capacity} available
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {room.is_special_room && (
                    <Badge variant="outline" className="text-xs">
                      Special
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(room)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(room.id)}
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

export default RoomsTable;
