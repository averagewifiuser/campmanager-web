import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X, Search } from "lucide-react";
import { CreatePurchaseRequest, InventoryItem } from "@/lib/types";
import { inventoryApi } from "@/lib/api";

interface InventorySelectorProps {
  inventory: InventoryItem[];
  selectedItems: string[];
  onSelectionChange: (items: string[]) => void;
}

const InventorySelector: React.FC<InventorySelectorProps> = ({
  inventory,
  selectedItems,
  onSelectionChange,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.inventory_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedInventoryItems = inventory.filter(item => 
    selectedItems.includes(item.id)
  );

  const handleItemSelect = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      onSelectionChange(selectedItems.filter(id => id !== itemId));
    } else {
      onSelectionChange([...selectedItems, itemId]);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    onSelectionChange(selectedItems.filter(id => id !== itemId));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="space-y-2">
      {/* Selected Items Display */}
      {selectedInventoryItems.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-muted/50">
          {selectedInventoryItems.map((item) => (
            <Badge key={item.id} variant="secondary" className="flex items-center gap-1">
              <span className="text-xs">
                {item.name} - {formatCurrency(item.cost)}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveItem(item.id)}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search inventory items..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            className="pl-10"
          />
        </div>

        {/* Dropdown */}
        {isDropdownOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
            {filteredInventory.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground text-center">
                No inventory items found
              </div>
            ) : (
              filteredInventory.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 cursor-pointer hover:bg-muted/50 border-b last:border-b-0 ${
                    selectedItems.includes(item.id) ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                  onClick={() => handleItemSelect(item.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                          selectedItems.includes(item.id) 
                            ? 'bg-blue-500 border-blue-500' 
                            : 'border-gray-300'
                        }`}>
                          {selectedItems.includes(item.id) && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{item.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.description}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <div>Qty: {item.quantity}</div>
                      <div className="font-medium">{formatCurrency(item.cost)}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
};

interface PurchaseFormProps {
  onSubmit: (data: CreatePurchaseRequest) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const PurchaseForm: React.FC<PurchaseFormProps> = ({
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const { campId } = useParams();
  const [formData, setFormData] = useState<CreatePurchaseRequest>({
    amount: "",
    inventory_ids: "",
    items: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
  const [inventoryLoading, setInventoryLoading] = useState(true);

  // Fetch inventory items when component mounts
  useEffect(() => {
    if (!campId) return;
    
    const fetchInventory = async () => {
      try {
        setInventoryLoading(true);
        const inventoryData = await inventoryApi.getCampInventory(campId);
        setInventory(inventoryData || []);
      } catch (error) {
        console.error('Error fetching inventory:', error);
        setInventory([]);
      } finally {
        setInventoryLoading(false);
      }
    };

    fetchInventory();
  }, [campId]);

  // Update inventory_ids and items when selected items change
  useEffect(() => {
    const selectedItemsText = selectedItems
      .map(itemId => {
        const item = inventory.find(inv => inv.id === itemId);
        return item ? `${item.name} (${item.id})` : itemId;
      })
      .join(', ');
    
    const items = selectedItems.map(itemId => ({
      inventory_id: itemId,
      quantity: itemQuantities[itemId] || 1
    }));
    
    setFormData(prev => ({
      ...prev,
      inventory_ids: selectedItemsText,
      items: items,
    }));
  }, [selectedItems, inventory, itemQuantities]);

  // Initialize quantity when item is selected
  useEffect(() => {
    selectedItems.forEach(itemId => {
      if (!(itemId in itemQuantities)) {
        setItemQuantities(prev => ({
          ...prev,
          [itemId]: 1
        }));
      }
    });
    
    // Remove quantities for unselected items
    const newQuantities = { ...itemQuantities };
    Object.keys(newQuantities).forEach(itemId => {
      if (!selectedItems.includes(itemId)) {
        delete newQuantities[itemId];
      }
    });
    setItemQuantities(newQuantities);
  }, [selectedItems]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount.trim()) {
      newErrors.amount = "Amount is required";
    } else {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = "Amount must be a valid positive number";
      }
    }

    if (!formData.inventory_ids.trim()) {
      newErrors.inventory_ids = "Inventory items are required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Error submitting purchase form:", error);
    }
  };

  const handleInputChange = (field: keyof CreatePurchaseRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const formatCurrency = (amount: string) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return "";
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2
    }).format(numAmount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record New Purchase</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (GHS) *</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={(e) => handleInputChange("amount", e.target.value)}
              placeholder="0.00"
              className={errors.amount ? "border-destructive" : ""}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount}</p>
            )}
            {formData.amount && !errors.amount && (
              <p className="text-sm text-muted-foreground">
                {formatCurrency(formData.amount)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Inventory Items *</Label>
            {inventoryLoading ? (
              <div className="p-4 text-center text-muted-foreground">
                Loading inventory items...
              </div>
            ) : inventory.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No inventory items available
              </div>
            ) : (
              <InventorySelector
                inventory={inventory}
                selectedItems={selectedItems}
                onSelectionChange={setSelectedItems}
              />
            )}
            {errors.inventory_ids && (
              <p className="text-sm text-destructive">{errors.inventory_ids}</p>
            )}
            {selectedItems.length > 0 && (
              <div className="text-xs text-muted-foreground">
                Selected {selectedItems.length} item(s)
              </div>
            )}
          </div>

          {/* Quantity inputs for selected items */}
          {selectedItems.length > 0 && (
            <div className="space-y-2">
              <Label>Item Quantities</Label>
              <div className="space-y-3 p-3 border rounded-md bg-muted/20">
                {selectedItems.map(itemId => {
                  const item = inventory.find(inv => inv.id === itemId);
                  if (!item) return null;
                  
                  return (
                    <div key={itemId} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Available: {item.quantity} | Cost: {new Intl.NumberFormat('en-GH', {
                            style: 'currency',
                            currency: 'GHS',
                            minimumFractionDigits: 2
                          }).format(item.cost)} each
                        </div>
                      </div>
                      <div className="w-20">
                        <Input
                          type="number"
                          min="1"
                          max={item.quantity}
                          value={itemQuantities[itemId] || 1}
                          onChange={(e) => {
                            const quantity = parseInt(e.target.value) || 1;
                            setItemQuantities(prev => ({
                              ...prev,
                              [itemId]: Math.min(Math.max(1, quantity), item.quantity)
                            }));
                          }}
                          className="text-center"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}


          {formData.amount && !errors.amount && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">
                Purchase Summary: {formatCurrency(formData.amount)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                This purchase will be recorded with the current date and time.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Recording..." : "Record Purchase"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default PurchaseForm;
