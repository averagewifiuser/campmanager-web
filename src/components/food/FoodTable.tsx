import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, UtensilsCrossed, Calendar, Package } from "lucide-react";

interface Food {
  id: string;
  name: string;
  quantity: number;
  vendor: string;
  date: string;
  category: 'lunch' | 'supper' | 'snacks' | 'breakfast';
  camp_id: string;
  created_at: string;
  updated_at: string;
}

interface FoodTableProps {
  foods: Food[];
  isLoading: boolean;
  onEdit?: (food: Food) => void;
  onDelete?: (foodId: string) => void;
}

const FoodTable: React.FC<FoodTableProps> = ({ 
  foods, 
  isLoading, 
  onEdit, 
  onDelete 
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'breakfast':
        return 'bg-yellow-100 text-yellow-800';
      case 'lunch':
        return 'bg-green-100 text-green-800';
      case 'supper':
        return 'bg-blue-100 text-blue-800';
      case 'snacks':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading food items...</p>
        </div>
      </div>
    );
  }

  if (foods.length === 0) {
    return (
      <div className="text-center py-12">
        <UtensilsCrossed className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No food items found</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by adding a new food item.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Food Item</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Date & Time</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {foods.map((food) => (
            <TableRow key={food.id}>
              <TableCell>
                <div className="font-medium">
                  {food.name}
                </div>
              </TableCell>
              <TableCell>
                <Badge className={getCategoryBadgeColor(food.category)}>
                  <span className="mr-1">{getCategoryIcon(food.category)}</span>
                  {food.category.charAt(0).toUpperCase() + food.category.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Package className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{food.quantity}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {food.vendor}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {formatDate(food.date)}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(food)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(food.id)}
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
  );
};

export default FoodTable;
