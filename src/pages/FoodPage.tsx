import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus, UtensilsCrossed, Package, Calendar, Truck } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { foodApi } from "@/lib/api";
import FoodTable from "@/components/food/FoodTable";
import FoodForm from "@/components/food/FoodForm";
import { useToast } from "@/hooks/use-toast";
import { FullPageLoader } from "@/components/ui/full-page-loader";

const FoodPage = () => {
  const { campId } = useParams();
  const { toast } = useToast();
  const [foods, setFoods] = useState<any[]>([]);
  const [sideNavOpen, setSideNavOpen] = useState<boolean>(false);
  const [editingFood, setEditingFood] = useState<any>(null);
  const [formLoading, setFormLoading] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Filter foods based on category and date
  const filteredFoods = foods.filter(food => {
    const categoryMatch = categoryFilter === 'all' || food.category === categoryFilter;
    
    let dateMatch = true;
    if (dateFilter !== 'all') {
      const foodDate = new Date(food.date);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      switch (dateFilter) {
        case 'today':
          dateMatch = foodDate.toDateString() === today.toDateString();
          break;
        case 'yesterday':
          dateMatch = foodDate.toDateString() === yesterday.toDateString();
          break;
        case 'tomorrow':
          dateMatch = foodDate.toDateString() === tomorrow.toDateString();
          break;
        case 'this_week':
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          dateMatch = foodDate >= weekStart && foodDate <= weekEnd;
          break;
      }
    }
    
    return categoryMatch && dateMatch;
  });

  // Calculate food statistics
  const foodStats = {
    totalItems: filteredFoods.length,
    totalQuantity: filteredFoods.reduce((sum, food) => sum + food.quantity, 0),
    uniqueVendors: [...new Set(filteredFoods.map(food => food.vendor))].length,
    categoryBreakdown: filteredFoods.reduce((acc, food) => {
      acc[food.category] = (acc[food.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    todayItems: foods.filter(food => {
      const foodDate = new Date(food.date);
      const today = new Date();
      return foodDate.toDateString() === today.toDateString();
    }).length,
  };

  //@ts-ignore
  const getMostPopularCategory = () => {
    const categories = Object.entries(foodStats.categoryBreakdown);
    if (categories.length === 0) return 'None';
    return categories.sort(([,a], [,b]) => (b as number) - (a as number))[0][0];
  };

  useEffect(() => {
    if (!campId) return;
    setLoading(true);
    foodApi.getCampFoods(campId)
      .then((data) => {
        setFoods(data || []);
      })
      .catch((error) => {
        console.error('Error fetching foods:', error);
        toast({
          title: "Error",
          description: "Failed to load food items",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [campId, toast]);

  const handleFoodSubmit = async (formData: any) => {
    if (!campId) return;
    setFormLoading(true);
    try {
      if (editingFood) {
        await foodApi.updateFood(editingFood.id, formData);
        toast({
          title: "Success",
          description: "Food item has been updated successfully.",
          variant: "default",
        });
      } else {
        await foodApi.createFood(campId, formData);
        toast({
          title: "Success",
          description: "Food item has been created successfully.",
          variant: "default",
        });
      }
      
      // Refetch foods after successful creation/update
      const updatedFoods = await foodApi.getCampFoods(campId);
      setFoods(updatedFoods || []);
      setSideNavOpen(false);
      setEditingFood(null);
    } catch (error: any) {
      console.error('Error saving food:', error);
      
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to save food item";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditFood = (food: any) => {
    setEditingFood(food);
    setSideNavOpen(true);
  };

  const handleDeleteFood = async (foodId: string) => {
    if (!confirm("Are you sure you want to delete this food item?")) return;
    
    try {
      await foodApi.deleteFood(foodId);
      const updatedFoods = await foodApi.getCampFoods(campId!);
      setFoods(updatedFoods || []);
      toast({
        title: "Success",
        description: "Food item has been deleted successfully.",
        variant: "default",
      });
    } catch (error: any) {
      console.error('Error deleting food:', error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to delete food item";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleNewFood = () => {
    setEditingFood(null);
    setSideNavOpen(true);
  };

  const handleCloseSideNav = () => {
    setSideNavOpen(false);
    setEditingFood(null);
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
      {/* Full Page Loader */}
      {formLoading && <FullPageLoader message="Processing food item..." />}
      
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Food Management</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Category:</span>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="breakfast">Breakfast</SelectItem>
                    <SelectItem value="lunch">Lunch</SelectItem>
                    <SelectItem value="supper">Supper</SelectItem>
                    <SelectItem value="snacks">Snacks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Date:</span>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="tomorrow">Tomorrow</SelectItem>
                    <SelectItem value="this_week">This Week</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleNewFood} variant="default">
                <Plus className="h-4 w-4 mr-2" />
                New Food Item
              </Button>
            </div>
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
                    <CardTitle className="text-sm font-medium">Total Food Items</CardTitle>
                    <UtensilsCrossed className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {foodStats.totalItems}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Food items planned
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
                    <Package className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {foodStats.totalQuantity}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total servings
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Today's Items</CardTitle>
                    <Calendar className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {foodStats.todayItems}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Scheduled for today
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Vendors</CardTitle>
                    <Truck className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {foodStats.uniqueVendors}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Unique vendors
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Food Table */}
              <FoodTable 
                foods={filteredFoods} 
                isLoading={loading}
                onEdit={handleEditFood}
                onDelete={handleDeleteFood}
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
              {editingFood ? "Edit Food Item" : "New Food Item"}
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
            <FoodForm
              food={editingFood}
              onSubmit={handleFoodSubmit}
              onCancel={handleCloseSideNav}
              loading={formLoading}
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

export default FoodPage;
