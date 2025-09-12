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

interface Food {
  id: string;
  name: string;
  quantity: number;
  vendor: string;
  date: string;
  category: 'lunch' | 'supper' | 'snacks' | 'breakfast';
}

interface FoodFormProps {
  food?: Food;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading: boolean;
}

const FoodForm: React.FC<FoodFormProps> = ({ 
  food, 
  onSubmit, 
  onCancel, 
  loading 
}) => {
  const [name, setName] = useState(food?.name || "");
  const [quantity, setQuantity] = useState(food?.quantity || 1);
  const [vendor, setVendor] = useState(food?.vendor || "");
  const [date, setDate] = useState(() => {
    if (food?.date) {
      // Convert ISO string to datetime-local format
      return new Date(food.date).toISOString().slice(0, 16);
    }
    // Default to current date and time
    return new Date().toISOString().slice(0, 16);
  });
  const [category, setCategory] = useState<'lunch' | 'supper' | 'snacks' | 'breakfast'>(
    food?.category || 'lunch'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = {
      name: name.trim(),
      quantity: quantity,
      vendor: vendor.trim(),
      date: new Date(date).toISOString(),
      category: category,
    };

    onSubmit(formData);
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'breakfast':
        return '🌅';
      case 'lunch':
        return '🍽️';
      case 'supper':
        return '🌙';
      case 'snacks':
        return '🍿';
      default:
        return '🍴';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="name">Food Item Name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter food item name (e.g., Rice and Chicken)"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="quantity">Quantity *</Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            placeholder="Enter quantity"
            required
          />
        </div>

        <div>
          <Label htmlFor="category">Category *</Label>
          <MockSelect 
            value={category} 
            onValueChange={(value) => setCategory(value as 'lunch' | 'supper' | 'snacks' | 'breakfast')}
          >
            <MockSelectItem value="breakfast">
              {getCategoryIcon('breakfast')} Breakfast
            </MockSelectItem>
            <MockSelectItem value="lunch">
              {getCategoryIcon('lunch')} Lunch
            </MockSelectItem>
            <MockSelectItem value="supper">
              {getCategoryIcon('supper')} Supper
            </MockSelectItem>
            <MockSelectItem value="snacks">
              {getCategoryIcon('snacks')} Snacks
            </MockSelectItem>
          </MockSelect>
        </div>
      </div>

      <div>
        <Label htmlFor="vendor">Vendor *</Label>
        <Input
          id="vendor"
          value={vendor}
          onChange={(e) => setVendor(e.target.value)}
          placeholder="Enter vendor name (e.g., Catering Services Ltd)"
          required
        />
      </div>

      <div>
        <Label htmlFor="date">Date & Time *</Label>
        <Input
          id="date"
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Select the date and time when this food will be served
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !name.trim() || !vendor.trim()}>
          {loading ? "Saving..." : food ? "Update Food Item" : "Create Food Item"}
        </Button>
      </div>
    </form>
  );
};

export default FoodForm;
