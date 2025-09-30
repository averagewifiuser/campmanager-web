import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Search, Download } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Purchase, InventoryItem } from "@/lib/types";
import { inventoryApi } from "@/lib/api";

interface PurchasesTableProps {
  purchases: Purchase[];
  isLoading: boolean;
  soldByFilter?: string;
  onSoldByFilterChange?: (value: string) => void;
  onEdit?: (purchase: Purchase) => void;
}

const PurchasesTable: React.FC<PurchasesTableProps> = ({
  purchases,
  isLoading,
  soldByFilter = 'all',
  onSoldByFilterChange,
  onEdit,
}) => {
  const { campId } = useParams();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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

  // Get unique "Sold By" values for filter dropdown
  const uniqueSoldBy = [...new Set(purchases.map(p => p.sold_by).filter(Boolean))];

  // Filter purchases
  const filteredPurchases = purchases.filter((purchase) => {
    const matchesSearch = searchTerm === '' || 
      purchase.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (purchase.sold_by || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      getItemNames(purchase).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSoldBy = soldByFilter === 'all' || purchase.sold_by === soldByFilter;
    
    return matchesSearch && matchesSoldBy;
  });

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filteredPurchases.length / rowsPerPage));
  const paginatedPurchases = filteredPurchases.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  };

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

  // Export to CSV function
  const exportToCSV = () => {
    const formatDateForFilename = () => {
      return new Date().toISOString().slice(0, 10);
    };

    const headers = [
      "Purchase ID",
      "Amount",
      "Items Count",
      "Supplied",
      "Item Names",
      "Purchase Date",
      "Sold By"
    ];
    const csvData = filteredPurchases.map((purchase) => [
      purchase.id,
      purchase.amount,
      purchase.items?.length || 0,
      purchase.is_item_supplied ? "Yes" : "No",
      getItemNames(purchase),
      formatDate(purchase.purchase_date),
      purchase.sold_by || 'N/A'
    ]);
    const csvContent = [headers, ...csvData]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `purchases-${formatDateForFilename()}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
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

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Manage Purchases</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              disabled={filteredPurchases.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ID, sold by, or items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Sold By Filter */}
            {onSoldByFilterChange && (
              <Select value={soldByFilter} onValueChange={onSoldByFilterChange}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Sold By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sellers</SelectItem>
                  {uniqueSoldBy.map((person) => (
                    <SelectItem key={person} value={person}>
                      {person}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Purchases Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Purchase ID</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Supplied</TableHead>
                <TableHead>Item Names</TableHead>
                <TableHead>Purchase Date</TableHead>
                <TableHead>Sold By</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPurchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {searchTerm || soldByFilter !== 'all' ? 'No purchases match your filters' : 'No purchases found'}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPurchases.map((purchase) => (
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
                    <TableCell>
                      {purchase.is_item_supplied ? 'Yes' : 'No'}
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
                    <TableCell>
                      {onEdit ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(purchase)}
                        >
                          Edit
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3 border-t bg-muted">
              <div className="flex items-center gap-2">
                <span className="text-sm">Rows per page:</span>
                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={rowsPerPage}
                  onChange={handleRowsPerPageChange}
                >
                  {[5, 10, 20, 50, 100].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                >
                  Prev
                </Button>
                <span className="text-sm">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchasesTable;
