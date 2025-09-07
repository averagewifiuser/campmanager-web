import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2, Package } from "lucide-react";
import { InventoryItem } from "@/lib/types";

interface InventoryTableProps {
  inventory: InventoryItem[];
  isLoading: boolean;
  onEdit?: (item: InventoryItem) => void;
  onDelete?: (itemId: string) => void;
}

const InventoryTable: React.FC<InventoryTableProps> = ({
  inventory,
  isLoading,
  onEdit,
  onDelete,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getInventoryTypeColor = (type: string) => {
    const colors = {
      shirts: 'bg-blue-100 text-blue-800',
      books: 'bg-green-100 text-green-800',
      food: 'bg-orange-100 text-orange-800',
      equipment: 'bg-purple-100 text-purple-800',
      supplies: 'bg-yellow-100 text-yellow-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[type as keyof typeof colors] || colors.other;
  };

  const getInventoryTypeLabel = (type: string) => {
    const labels = {
      shirts: 'Shirts',
      books: 'Books',
      food: 'Food',
      equipment: 'Equipment',
      supplies: 'Supplies',
      other: 'Other',
    };
    return labels[type as keyof typeof labels] || 'Other';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventory Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Loading inventory...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (inventory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventory Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No inventory items found</h3>
            <p className="text-sm text-muted-foreground">
              Start by adding your first inventory item to track camp supplies and equipment.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Inventory Items ({inventory.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Unit Cost</TableHead>
                <TableHead className="text-right">Total Value</TableHead>
                <TableHead>Date Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Badge className={getInventoryTypeColor(item.inventory_type)}>
                      {getInventoryTypeLabel(item.inventory_type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate" title={item.description}>
                    {item.description}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {item.quantity}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(item.cost)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold">
                    {formatCurrency(item.cost * item.quantity)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(item)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(item.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
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
      </CardContent>
    </Card>
  );
};

export default InventoryTable;
