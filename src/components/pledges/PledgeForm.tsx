import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Search, Plus } from "lucide-react";
import { Registration } from "@/lib/types";

// Mock UI Components (same as in PaymentsPage)
type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { className?: string };
const Input = ({ className = "", ...props }: InputProps) => (
  <input
    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
    {...props}
  />
);

type LabelProps = { children: React.ReactNode; className?: string };
const Label = ({ children, className = "" }: LabelProps) => (
  <label className={`block text-sm font-medium text-gray-700 mb-1 ${className}`}>
    {children}
  </label>
);

type PledgeFormProps = {
  registrations: Registration[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading: boolean;
};

const PledgeForm: React.FC<PledgeFormProps> = ({ registrations, onSubmit, onCancel, loading }) => {
  const [amount, setAmount] = useState<number>(0);
  const [selectedCamperId, setSelectedCamperId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);

  const filteredRegistrations = searchQuery.trim() 
    ? registrations.filter((reg) => {
        const query = searchQuery.toLowerCase();
        const camperCode = reg.camper_code?.toLowerCase() || "";
        const fullName = `${reg.surname || ""} ${reg.middle_name || ""} ${reg.last_name || ""}`.toLowerCase();
        return camperCode.includes(query) || fullName.includes(query);
      })
    : [];

  const selectedRegistration = registrations.find((reg) => reg.id === selectedCamperId);

  const handleAddRegistration = (registration: Registration) => {
    setSelectedCamperId(registration.id);
    setSearchQuery("");
    setShowSearchResults(false);
  };

  const handleRemoveRegistration = () => {
    setSelectedCamperId("");
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSearchResults(value.trim().length > 0);
  };

  const handleSubmit = () => {
    onSubmit({
      amount: amount.toString(),
      camper_id: selectedCamperId,
      status: "pending"
    });
    
    // Reset form
    setAmount(0);
    setSelectedCamperId("");
    setSearchQuery("");
  };

  const getRegistrationDisplayName = (reg: Registration) => {
    return `${reg.surname || ""} ${reg.middle_name || ""} ${reg.last_name || ""}`.trim();
  };

  return (
    <div className="space-y-6">
      <div>
        <Label>Amount</Label>
        <Input
          type="number"
          min={0}
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          placeholder="Enter pledge amount"
          required
        />
      </div>

      <div>
        <Label>Search and Select Camper</Label>
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
                      <div className="text-sm text-gray-500">Code: {reg.camper_code}</div>
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
        <Label>Selected Camper</Label>
        <div className="border rounded-md p-3 min-h-[80px]">
          {!selectedRegistration ? (
            <div className="text-gray-500 text-sm">No camper selected</div>
          ) : (
            <div className="bg-blue-50 p-2 rounded flex items-center justify-between">
              <div>
                <div className="font-medium">{getRegistrationDisplayName(selectedRegistration)}</div>
                <div className="text-sm text-gray-600">Code: {selectedRegistration.camper_code}</div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveRegistration}
                className="text-red-500 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button 
          type="button" 
          variant="default" 
          disabled={loading || !selectedRegistration || amount <= 0}
          onClick={handleSubmit}
        >
          {loading ? "Saving..." : "Save Pledge"}
        </Button>
      </div>
    </div>
  );
};

export default PledgeForm;
