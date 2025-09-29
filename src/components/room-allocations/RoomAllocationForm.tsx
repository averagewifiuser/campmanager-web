import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X, Search, Plus } from "lucide-react";

// Mock UI Components
type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { className?: string };
const Input = ({ className = "", ...props }: InputProps) => (
  <input
    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
    {...props}
  />
);

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { className?: string };
const Textarea = ({ className = "", ...props }: TextareaProps) => (
  <textarea
    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
    {...props}
  />
);

type MockSelectProps = {
  children: React.ReactNode;
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
};
const MockSelect = ({ children, value, onValueChange, className = "" }: MockSelectProps) => (
  <select
    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
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

type CheckboxProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
};
const Checkbox = ({ checked, onCheckedChange, className = "" }: CheckboxProps) => (
  <input
    type="checkbox"
    checked={checked}
    onChange={(e) => onCheckedChange(e.target.checked)}
    className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${className}`}
  />
);

interface Room {
  id: string;
  hostel_name: string;
  block: string;
  room_number: string;
  room_capacity: number;
  room_gender: string;
  current_occupancy: number;
  available_capacity: number;
  is_full: boolean;
  is_damaged: boolean;
}

interface Registration {
  id: string;
  surname: string;
  middle_name: string;
  last_name: string;
  camper_code: string;
  sex: string;
}

interface RoomAllocation {
  id: string;
  room_id: string;
  registration_id: string;
  is_active: boolean;
  notes?: string;
}

interface RoomAllocationFormProps {
  allocation?: RoomAllocation;
  rooms: Room[];
  registrations: Registration[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading: boolean;
}

const RoomAllocationForm: React.FC<RoomAllocationFormProps> = ({ 
  allocation, 
  rooms,
  registrations,
  onSubmit, 
  onCancel, 
  loading 
}) => {
  const [selectedRoomId, setSelectedRoomId] = useState(allocation?.room_id || "");
  const [selectedRegistrationIds, setSelectedRegistrationIds] = useState<string[]>(
    allocation ? [allocation.registration_id] : []
  );
  const [isActive, setIsActive] = useState(allocation?.is_active ?? true);
  const [notes, setNotes] = useState(allocation?.notes || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Filter available rooms (not full, not damaged, and matching gender if campers selected; rooms with 'other' gender accept any)
  const getAvailableRooms = () => {
    if (selectedRegistrationIds.length === 0) {
      return rooms.filter(room => !room.is_full && !room.is_damaged);
    }
    
    // Get gender of selected campers (assuming all same gender for room allocation)
    const selectedRegistration = registrations.find(r => selectedRegistrationIds.includes(r.id));
    const requiredGender = selectedRegistration?.sex;
    
    return rooms.filter(room => 
      !room.is_full && 
      !room.is_damaged && 
      (room.room_gender === requiredGender || room.room_gender === 'other') &&
      room.available_capacity >= selectedRegistrationIds.length
    );
  };

  // Filter registrations for search
  const filteredRegistrations = searchQuery.trim() 
    ? registrations.filter((reg) => {
        const query = searchQuery.toLowerCase();
        const camperCode = reg.camper_code?.toLowerCase() || "";
        const fullName = `${reg.surname || ""} ${reg.middle_name || ""} ${reg.last_name || ""}`.toLowerCase();
        return (camperCode.includes(query) || fullName.includes(query)) && 
               !selectedRegistrationIds.includes(reg.id);
      })
    : [];

  const selectedRegistrations = registrations.filter((reg) =>
    selectedRegistrationIds.includes(reg.id)
  );

  const handleAddRegistration = (registration: Registration) => {
    // Check if adding this camper would exceed room capacity
    const selectedRoom = rooms.find(r => r.id === selectedRoomId);
    if (selectedRoom && selectedRegistrationIds.length >= selectedRoom.available_capacity) {
      return; // Don't add if it would exceed capacity
    }

    // Check gender compatibility
    if (selectedRegistrationIds.length > 0) {
      const firstSelectedReg = registrations.find(r => selectedRegistrationIds.includes(r.id));
      if (firstSelectedReg && firstSelectedReg.sex !== registration.sex) {
        return; // Don't add if gender doesn't match
      }
    }

    setSelectedRegistrationIds(prev => [...prev, registration.id]);
    setSearchQuery("");
    setShowSearchResults(false);
  };

  const handleRemoveRegistration = (registrationId: string) => {
    setSelectedRegistrationIds(prev => prev.filter(id => id !== registrationId));
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSearchResults(value.trim().length > 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRoomId || selectedRegistrationIds.length === 0) {
      return;
    }

    const formData = {
      room_id: selectedRoomId,
      registration_ids: selectedRegistrationIds,
      is_active: isActive,
      notes: notes || undefined,
    };

    onSubmit(formData);
  };

  const getRegistrationDisplayName = (reg: Registration) => {
    return `${reg.surname || ""} ${reg.middle_name || ""} ${reg.last_name || ""}`.trim();
  };

  const getRoomDisplayName = (room: Room) => {
    return `${room.hostel_name} - ${room.block} - Room ${room.room_number} (${room.available_capacity} available)`;
  };

  const availableRooms = getAvailableRooms();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!allocation && (
        <>
          <div>
            <Label>Search and Add Campers *</Label>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  placeholder="Search by camper code or name..."
                  className="pl-10"
                  onFocus={() => setShowSearchResults(searchQuery.trim().length > 0)}
                />
              </div>
              
              {showSearchResults && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {filteredRegistrations.length === 0 ? (
                    <div className="px-3 py-2 text-gray-500 text-sm">
                      No campers found matching "{searchQuery}"
                    </div>
                  ) : (
                    filteredRegistrations.map((reg) => (
                      <div
                        key={reg.id}
                        className="px-3 py-2 cursor-pointer hover:bg-gray-100 flex items-center justify-between"
                        onClick={() => handleAddRegistration(reg)}
                      >
                        <div>
                          <div className="font-medium">{getRegistrationDisplayName(reg)}</div>
                          <div className="text-sm text-gray-500">
                            Code: {reg.camper_code} | Gender: {reg.sex}
                          </div>
                        </div>
                        <Plus className="h-4 w-4 text-blue-500" />
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <Label>Selected Campers ({selectedRegistrations.length}) *</Label>
            <div className="border rounded-md p-3 min-h-[80px] max-h-40 overflow-y-auto">
              {selectedRegistrations.length === 0 ? (
                <div className="text-gray-500 text-sm">No campers selected</div>
              ) : (
                <div className="space-y-2">
                  {selectedRegistrations.map((reg) => (
                    <div
                      key={reg.id}
                      className="flex items-center justify-between bg-blue-50 p-2 rounded"
                    >
                      <div>
                        <div className="font-medium">{getRegistrationDisplayName(reg)}</div>
                        <div className="text-sm text-gray-600">
                          Code: {reg.camper_code} | Gender: {reg.sex}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveRegistration(reg.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <div>
        <Label htmlFor="room">Select Room *</Label>
        <MockSelect 
          value={selectedRoomId} 
          onValueChange={setSelectedRoomId}
        >
          <MockSelectItem value="">Select a room</MockSelectItem>
          {availableRooms.map((room) => (
            <MockSelectItem key={room.id} value={room.id}>
              {getRoomDisplayName(room)}
            </MockSelectItem>
          ))}
        </MockSelect>
        {selectedRegistrationIds.length > 0 && availableRooms.length === 0 && (
          <p className="text-sm text-red-600 mt-1">
            No available rooms found for the selected campers. Check room capacity and gender compatibility.
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Enter any additional notes about this allocation"
          rows={3}
        />
      </div>

      {allocation && (
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={isActive}
            onCheckedChange={setIsActive}
          />
          <Label htmlFor="isActive">Active Allocation</Label>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={loading || !selectedRoomId || selectedRegistrationIds.length === 0}
        >
          {loading ? "Saving..." : allocation ? "Update Allocation" : "Allocate Room"}
        </Button>
      </div>
    </form>
  );
};

export default RoomAllocationForm;
