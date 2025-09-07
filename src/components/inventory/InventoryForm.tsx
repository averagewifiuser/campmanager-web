import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateInventoryRequest, InventoryItem } from "@/lib/types";

interface InventoryFormProps {
  onSubmit: (data: CreateInventoryRequest) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  initialData?: InventoryItem;
}

const InventoryForm: React.FC<InventoryFormProps> = ({
  onSubmit,
  onCancel,
  loading = false,
  initialData,
}) => {
  const [formData, setFormData] = useState<CreateInventoryRequest>({
    name: "",
    description: "",
    inventory_type: "other",
    quantity: 0,
    cost: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description,
        inventory_type: initialData.inventory_type,
        quantity: initialData.quantity,
        cost: initialData.cost,
      });
    }
  }, [initialData]);

  const inventoryTypes = [
    { value: "shirts", label: "Shirts" },
    { value: "books", label: "Books" },
    { value: "food", label: "Food" },
    { value: "equipment", label: "Equipment" },
    { value: "supplies", label: "Supplies" },
    { value: "other", label: "Other" },
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Item name is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (formData.quantity <= 0) {
      newErrors.quantity = "Quantity must be greater than 0";
    }

    if (formData.cost < 0) {
      newErrors.cost = "Cost cannot be negative";
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
      console.error("Error submitting inventory form:", error);
    }
  };

  const handleInputChange = (field: keyof CreateInventoryRequest, value: string | number) => {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {initialData ? "Edit Inventory Item" : "Add New Inventory Item"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Item Name *</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter item name"
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="inventory_type">Item Type *</Label>
            <Select
              value={formData.inventory_type}
              onValueChange={(value) => handleInputChange("inventory_type", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select item type" />
              </SelectTrigger>
              <SelectContent>
                {inventoryTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Enter item description"
              rows={3}
              className={errors.description ? "border-destructive" : ""}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => handleInputChange("quantity", parseInt(e.target.value) || 0)}
                placeholder="0"
                className={errors.quantity ? "border-destructive" : ""}
              />
              {errors.quantity && (
                <p className="text-sm text-destructive">{errors.quantity}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost">Unit Cost (GHS) *</Label>
              <Input
                id="cost"
                type="number"
                min="0"
                step="0.01"
                value={formData.cost}
                onChange={(e) => handleInputChange("cost", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className={errors.cost ? "border-destructive" : ""}
              />
              {errors.cost && (
                <p className="text-sm text-destructive">{errors.cost}</p>
              )}
            </div>
          </div>

          {formData.quantity > 0 && formData.cost > 0 && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">
                Total Value: {new Intl.NumberFormat('en-GH', {
                  style: 'currency',
                  currency: 'GHS',
                  minimumFractionDigits: 2
                }).format(formData.quantity * formData.cost)}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Saving..." : (initialData ? "Update Item" : "Add Item")}
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

export default InventoryForm;
