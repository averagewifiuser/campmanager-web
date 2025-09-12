import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

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
  is_special_room: boolean;
  extra_beds: number;
  room_gender: 'male' | 'female' | 'other';
  is_damaged: boolean;
  misc_info?: string;
  adjoining_to?: string;
}

interface RoomFormProps {
  room?: Room;
  rooms: Room[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading: boolean;
}

const RoomForm: React.FC<RoomFormProps> = ({ 
  room, 
  rooms,
  onSubmit, 
  onCancel, 
  loading 
}) => {
  const [hostelName, setHostelName] = useState(room?.hostel_name || "");
  const [block, setBlock] = useState(room?.block || "");

  // Get available blocks based on selected hostel
  const getAvailableBlocks = (hostel: string) => {
    switch (hostel) {
      case "Girls' Hostel":
        return ["A", "B", "C", "D"];
      case "Pronto Hostel":
        return ["1", "2", "3", "4", "5", "6"];
      case "Boys' Hostel":
        return ["1", "2", "3", "4"];
      default:
        return [];
    }
  };

  // Reset block when hostel changes
  const handleHostelChange = (value: string) => {
    setHostelName(value);
    setBlock(""); // Reset block when hostel changes
  };
  const [roomNumber, setRoomNumber] = useState(room?.room_number || "");
  const [roomCapacity, setRoomCapacity] = useState(room?.room_capacity || 4);
  const [isSpecialRoom, setIsSpecialRoom] = useState(room?.is_special_room || false);
  const [extraBeds, setExtraBeds] = useState(room?.extra_beds || 0);
  const [roomGender, setRoomGender] = useState<'male' | 'female'>(room?.room_gender as 'male' | 'female' || 'male');
  const [isDamaged, setIsDamaged] = useState(room?.is_damaged || false);
  const [miscInfo, setMiscInfo] = useState(room?.misc_info || "");
  const [adjoiningTo, setAdjoiningTo] = useState(room?.adjoining_to || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = {
      hostel_name: hostelName,
      block: block,
      room_number: roomNumber,
      room_capacity: roomCapacity,
      is_special_room: isSpecialRoom,
      extra_beds: extraBeds,
      room_gender: roomGender,
      is_damaged: isDamaged,
      misc_info: miscInfo || undefined,
      adjoining_to: adjoiningTo || undefined,
    };

    onSubmit(formData);
  };

  // Filter out current room from adjoining options
  const availableRooms = rooms.filter(r => r.id !== room?.id);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="hostelName">Hostel Name *</Label>
          <MockSelect value={hostelName} onValueChange={handleHostelChange}>
            <MockSelectItem value="">Select a hostel</MockSelectItem>
            <MockSelectItem value="Girls' Hostel">Girls' Hostel</MockSelectItem>
            <MockSelectItem value="Pronto Hostel">Pronto Hostel</MockSelectItem>
            <MockSelectItem value="Boys' Hostel">Boys' Hostel</MockSelectItem>
          </MockSelect>
        </div>

        <div>
          <Label htmlFor="block">Block *</Label>
          <MockSelect value={block} onValueChange={setBlock}>
            <MockSelectItem value="">Select a block</MockSelectItem>
            {getAvailableBlocks(hostelName).map((blockOption) => (
              <MockSelectItem key={blockOption} value={blockOption}>
                Block {blockOption}
              </MockSelectItem>
            ))}
          </MockSelect>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="roomNumber">Room Number *</Label>
          <Input
            id="roomNumber"
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            placeholder="Enter room number"
            required
          />
        </div>

        <div>
          <Label htmlFor="roomCapacity">Room Capacity *</Label>
          <Input
            id="roomCapacity"
            type="number"
            min="1"
            max="20"
            value={roomCapacity}
            onChange={(e) => setRoomCapacity(Number(e.target.value))}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="roomGender">Room Gender *</Label>
          <MockSelect value={roomGender} onValueChange={(value) => setRoomGender(value as 'male' | 'female')}>
            <MockSelectItem value="male">Male</MockSelectItem>
            <MockSelectItem value="female">Female</MockSelectItem>
          </MockSelect>
        </div>

        <div>
          <Label htmlFor="extraBeds">Extra Beds</Label>
          <Input
            id="extraBeds"
            type="number"
            min="0"
            max="10"
            value={extraBeds}
            onChange={(e) => setExtraBeds(Number(e.target.value))}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="adjoiningTo">Adjoining Room</Label>
        <MockSelect value={adjoiningTo} onValueChange={setAdjoiningTo}>
          <MockSelectItem value="">None</MockSelectItem>
          {availableRooms.map((r) => (
            <MockSelectItem key={r.id} value={r.id}>
              {r.hostel_name} - {r.block} - Room {r.room_number}
            </MockSelectItem>
          ))}
        </MockSelect>
      </div>

      <div>
        <Label htmlFor="miscInfo">Additional Information</Label>
        <Textarea
          id="miscInfo"
          value={miscInfo}
          onChange={(e) => setMiscInfo(e.target.value)}
          placeholder="Enter any additional information about the room"
          rows={3}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={isSpecialRoom}
            onCheckedChange={setIsSpecialRoom}
          />
          <Label htmlFor="isSpecialRoom">Special Room</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            checked={isDamaged}
            onCheckedChange={setIsDamaged}
          />
          <Label htmlFor="isDamaged">Room is Damaged</Label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : room ? "Update Room" : "Create Room"}
        </Button>
      </div>
    </form>
  );
};

export default RoomForm;
