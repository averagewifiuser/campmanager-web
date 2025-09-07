import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus, Package, TrendingUp, Hash, DollarSign } from "lucide-react";
import { inventoryApi } from "@/lib/api";
import { InventoryItem, CreateInventoryRequest } from "@/lib/types";
import InventoryTable from "@/components/inventory/InventoryTable";
import InventoryForm from "@/components/inventory/InventoryForm";

const InventoryPage = () => {
  const { campId } = useParams();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [sideNavOpen, setSideNavOpen] = useState<boolean>(false);
  const [formLoading, setFormLoading] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingItem, setEditingItem] = useState<InventoryItem | undefined>(undefined);

  // Calculate inventory statistics
  const inventoryStats = {
    totalItems: inventory.reduce((sum, item) => sum + item.quantity, 0),
    totalValue: inventory.reduce((sum, item) => sum + (item.cost * item.quantity), 0),
    totalTypes: inventory.length,
    averageValue: inventory.length > 0 
      ? inventory.reduce((sum, item) => sum + (item.cost * item.quantity), 0) / inventory.length 
      : 0,
    typeBreakdown: inventory.reduce((acc, item) => {
      acc[item.inventory_type] = (acc[item.inventory_type] || 0) + item.quantity;
      return acc;
    }, {} as Record<string, number>),
    lowStockItems: inventory.filter(item => item.quantity <= 5).length,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2
    }).format(amount);
  };

  useEffect(() => {
    if (!campId) return;
    setLoading(true);
    inventoryApi.getCampInventory(campId)
      .then((inventoryData) => {
        setInventory(inventoryData || []);
      })
      .catch((error) => {
        console.error('Error fetching inventory:', error);
        setInventory([]);
      })
      .finally(() => setLoading(false));
  }, [campId]);

  const handleInventorySubmit = async (formData: CreateInventoryRequest) => {
    if (!campId) return;
    setFormLoading(true);
    try {
      if (editingItem) {
        // Update existing item
        await inventoryApi.updateInventoryItem(editingItem.id, formData);
      } else {
        // Create new item
        await inventoryApi.createInventoryItem(campId, formData);
      }
      
      // Refetch inventory after successful creation/update
      const updatedInventory = await inventoryApi.getCampInventory(campId);
      setInventory(updatedInventory || []);
      setSideNavOpen(false);
      setEditingItem(undefined);
    } catch (error) {
      console.error('Error saving inventory item:', error);
      // Optionally handle error (e.g., show toast)
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setSideNavOpen(true);
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this inventory item?')) {
      return;
    }

    try {
      await inventoryApi.deleteInventoryItem(itemId);
      // Refetch inventory after successful deletion
      if (campId) {
        const updatedInventory = await inventoryApi.getCampInventory(campId);
        setInventory(updatedInventory || []);
      }
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      // Optionally handle error (e.g., show toast)
    }
  };

  const handleCloseSideNav = () => {
    setSideNavOpen(false);
    setEditingItem(undefined);
  };

  if (!campId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-destructive">No camp selected.</p>
            <Button variant="outline" className="mt-4" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
            </div>
            <Button onClick={() => setSideNavOpen(true)} variant="default">
              <Plus className="h-4 w-4 mr-2" />
              New Inventory Item
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div>Loading...</div>
            </div>
          ) : (
            <>
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                    <Hash className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {inventoryStats.totalItems}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Across {inventoryStats.totalTypes} different items
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(inventoryStats.totalValue)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Average: {formatCurrency(inventoryStats.averageValue)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Item Types</CardTitle>
                    <Package className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {inventoryStats.totalTypes}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Different inventory items
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Low Stock Alert</CardTitle>
                    <TrendingUp className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${inventoryStats.lowStockItems > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      {inventoryStats.lowStockItems}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Items with ≤5 quantity
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Inventory Table */}
              <InventoryTable 
                inventory={inventory} 
                isLoading={loading}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </>
          )}
        </div>
      </main>

      {/* Side Navigation */}
      {sideNavOpen && (
        <div className="fixed right-0 top-0 h-full w-1/2 bg-white border-l shadow-lg z-50">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-semibold">
              {editingItem ? "Edit Inventory Item" : "New Inventory Item"}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCloseSideNav}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-4 overflow-auto h-full pb-20">
            <InventoryForm
              onSubmit={handleInventorySubmit}
              onCancel={handleCloseSideNav}
              loading={formLoading}
              initialData={editingItem}
            />
          </div>
        </div>
      )}

      {/* Overlay */}
      {sideNavOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-30 z-40"
          onClick={handleCloseSideNav}
        />
      )}
    </div>
  );
};

export default InventoryPage;
