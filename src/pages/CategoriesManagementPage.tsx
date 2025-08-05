// src/pages/CategoriesManagementPage.tsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus,
  Edit2,
  Trash2,
  Tag,
  Users, 
  Percent,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useCamp } from '@/hooks/useCamps';
import { useCategories } from '@/hooks/useCategories';
import { formatCurrency } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  discount_percentage: string;
  discount_amount: string;
  camp_id: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  // Additional fields that might come from stats
  registration_count?: number;
  calculated_fee?: string;
}

interface CategoryFormData {
  name: string;
  discount_percentage: string;
  discount_amount: string;
  is_default: boolean;
}

export const CategoriesManagementPage: React.FC = () => {
  const { campId } = useParams<{ campId: string }>();
  const navigate = useNavigate();
  
  // State for dialogs
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  
  // Form states
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    discount_percentage: '',
    discount_amount: '',
    is_default: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data fetching
  const { data: camp, isLoading: campLoading } = useCamp(campId!);
  const { 
    data: categories = [], 
    isLoading: categoriesLoading,
    createCategory,
    updateCategory,
    deleteCategory
  } = useCategories(campId!);

  if (!campId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-destructive">Invalid camp ID</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/camps')}>
              Back to Camps
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (campLoading) {
    return <LoadingSpinner />;
  }

  if (!camp) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-destructive mb-4">Camp not found</p>
            <Button onClick={() => navigate('/camps')}>
              Back to Camps
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const resetForm = () => {
    setFormData({
      name: '',
      discount_percentage: '',
      discount_amount: '',
      is_default: false
    });
  };

  const calculateFee = (baseFee: number, discountPercentage: string, discountAmount: string) => {
    let fee = baseFee;
    
    if (discountPercentage && parseFloat(discountPercentage) > 0) {
      fee = fee * (1 - parseFloat(discountPercentage) / 100);
    }
    
    if (discountAmount && parseFloat(discountAmount) > 0) {
      fee = fee - parseFloat(discountAmount);
    }
    
    return Math.max(0, fee);
  };

  const handleCreateCategory = async () => {
    if (!formData.name.trim()) return;
    
    setIsSubmitting(true);
    try {
      await createCategory(formData);
      resetForm();
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create category:', error);
      // TODO: Show error toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCategory = async () => {
    if (!selectedCategory || !formData.name.trim()) return;
    
    setIsSubmitting(true);
    try {
      // @ts-ignore
      await updateCategory(selectedCategory.id, formData);
      resetForm();
      setSelectedCategory(null);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update category:', error);
      // TODO: Show error toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    try {
      await deleteCategory(category.id);
      // TODO: Show success toast
    } catch (error) {
      console.error('Failed to delete category:', error);
      // TODO: Show error toast
    }
  };

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      discount_percentage: category.discount_percentage,
      discount_amount: category.discount_amount,
      is_default: category.is_default
    });
    setIsEditDialogOpen(true);
  };

  const baseFee = parseFloat(camp.base_fee);
  const previewFee = calculateFee(baseFee, formData.discount_percentage, formData.discount_amount);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/camps/${campId}`)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Camp
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Manage Categories</h1>
                <p className="text-sm text-muted-foreground">{camp.name}</p>
              </div>
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Category</DialogTitle>
                  <DialogDescription>
                    Create a new registration category with pricing options.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="category-name">Category Name</Label>
                    <Input
                      id="category-name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Early Bird, Student, Regular"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="discount-percentage">Discount %</Label>
                      <Input
                        id="discount-percentage"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={formData.discount_percentage}
                        onChange={(e) => setFormData(prev => ({ ...prev, discount_percentage: e.target.value }))}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="discount-amount">Discount Amount</Label>
                      <Input
                        id="discount-amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.discount_amount}
                        onChange={(e) => setFormData(prev => ({ ...prev, discount_amount: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is-default"
                      checked={formData.is_default}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default: !!checked }))}
                    />
                    <Label htmlFor="is-default">Set as default category</Label>
                  </div>

                  {/* Fee Preview */}
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="text-sm font-medium mb-1">Fee Preview</div>
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(previewFee)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Base fee: {formatCurrency(baseFee)}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      resetForm();
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateCategory}
                    disabled={!formData.name.trim() || isSubmitting}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Category'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Tag className="h-5 w-5 mr-2" />
                Categories Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {categories.length}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Categories</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    
                    {categories.filter((c: Category) => (c.registration_count || 0) > 0).length}
                  </div>
                  <p className="text-sm text-muted-foreground">Active Categories</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {categories.reduce((sum, c: Category) => sum + (c.registration_count || 0), 0)}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Registrations</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(baseFee)}
                  </div>
                  <p className="text-sm text-muted-foreground">Base Fee</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Categories List */}
          <Card>
            <CardHeader>
              <CardTitle>Categories List</CardTitle>
            </CardHeader>
            <CardContent>
              {categoriesLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-8">
                  <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No categories created yet</p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Category
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {categories.map((category: Category) => {
                    const calculatedFee = calculateFee(
                      baseFee, 
                      category.discount_percentage, 
                      category.discount_amount
                    );
                    
                    return (
                      <div
                        key={category.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <Tag className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-medium">{category.name}</h3>
                              {category.is_default && (
                                <Badge variant="secondary">Default</Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span className="flex items-center">
                                <Users className="h-4 w-4 mr-1" />
                                {category.registration_count || 0} registrations
                              </span>
                              <span className="flex items-center font-medium text-green-600">
                                <DollarSign className="h-4 w-4 mr-1" />
                                {formatCurrency(calculatedFee)}
                              </span>
                              {(parseFloat(category.discount_percentage) > 0 || parseFloat(category.discount_amount) > 0) && (
                                <span className="flex items-center text-orange-600">
                                  <Percent className="h-4 w-4 mr-1" />
                                  {parseFloat(category.discount_percentage) > 0 && `${category.discount_percentage}% off`}
                                  {parseFloat(category.discount_amount) > 0 && ` -${formatCurrency(parseFloat(category.discount_amount))}`}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(category)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          
                          {!category.is_default && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Category</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{category.name}"? 
                                    {category.registration_count && category.registration_count > 0 && (
                                      <span className="text-destructive">
                                        {" "}This category has {category.registration_count} registered participants.
                                      </span>
                                    )}
                                    {" "}This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteCategory(category)}
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
                                    Delete Category
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
              <DialogDescription>
                Update the category details and pricing.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-category-name">Category Name</Label>
                <Input
                  id="edit-category-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Early Bird, Student, Regular"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-discount-percentage">Discount %</Label>
                  <Input
                    id="edit-discount-percentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData(prev => ({ ...prev, discount_percentage: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-discount-amount">Discount Amount</Label>
                  <Input
                    id="edit-discount-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.discount_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, discount_amount: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-is-default"
                  checked={formData.is_default}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default: !!checked }))}
                />
                <Label htmlFor="edit-is-default">Set as default category</Label>
              </div>

              {/* Fee Preview */}
              <div className="bg-muted p-3 rounded-lg">
                <div className="text-sm font-medium mb-1">Fee Preview</div>
                <div className="text-lg font-bold text-green-600">
                  {formatCurrency(previewFee)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Base fee: {formatCurrency(baseFee)}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditDialogOpen(false);
                  resetForm();
                  setSelectedCategory(null);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleEditCategory}
                disabled={!formData.name.trim() || isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Update Category'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};