import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShoppingCart } from "lucide-react";
import { Purchase, InventoryItem } from "@/lib/types";
import { inventoryApi } from "@/lib/api";

interface PurchasesTableProps {
  purchases: Purchase[];
  isLoading: boolean;
}

const PurchasesTable: React.FC<PurchasesTableProps> = ({
  purchases,
  isLoading,
}) => {
  const { campId } = useParams();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  // Fetch inventory to resolve item names
  useEffect(() => {
    if (!campId) return;
    
    const fetchInventory = async () => {
      try {
        const inventoryData = await inventoryApi.getCampInventory(campId);
        setInventory(inventoryData || []);
      } catch (error) {
        console.error('Error fetching inventory for table:', error);
        setInventory([]);
      }
    };

    fetchInventory();
  }, [campId]);

  const getItemNames = (purchase: Purchase): string => {
    if (!purchase.items || purchase.items.length === 0) {
      return purchase.inventory_ids || 'No items';
    }

    return purchase.items
      .map(item => {
        const inventoryItem = inventory.find(inv => inv.id === item.inventory_id);
        const name = inventoryItem?.name || `Item ${item.inventory_id.slice(0, 8)}`;
        return `${name} (${item.quantity})`;
      })
      .join(', ');
  };
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Purchases
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Loading purchases...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (purchases.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Purchases
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No purchases found</h3>
            <p className="text-sm text-muted-foreground">
              Start by recording your first purchase to track camp sales and inventory movement.
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
          <ShoppingCart className="h-5 w-5" />
          Purchases ({purchases.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Purchase ID</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Item Names</TableHead>
                <TableHead>Purchase Date</TableHead>
                <TableHead>Sold By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell className="font-mono text-sm">
                    {purchase.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold">
                    {formatCurrency(purchase.amount)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {purchase.items?.length || 0} item(s)
                  </TableCell>
                  <TableCell className="max-w-xs truncate" title={getItemNames(purchase)}>
                    {getItemNames(purchase)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(purchase.purchase_date)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {purchase.sold_by || 'N/A'}
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

export default PurchasesTable;
