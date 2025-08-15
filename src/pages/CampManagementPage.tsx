// src/pages/CampManagementPage.tsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Users, Tags, Link, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { ChurchForm } from '@/components/forms/ChurchForm';
import { CategoryForm } from '@/components/forms/CategoryForm';
import { CustomFieldForm } from '@/components/forms/CustomFieldForm';
import { RegistrationLinkForm } from '@/components/forms/RegistrationLinkForm';
import { useCamp } from '@/hooks/useCamps';
import { useChurches } from '@/hooks/useChurches';
import { useCategories } from '@/hooks/useCategories';
import { useCustomFields } from '@/hooks/useCustomFields';
import { useRegistrationLinks } from '@/hooks/useRegistrationLinks';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export const CampManagementPage: React.FC = () => {
  const { campId } = useParams<{ campId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Data fetching hooks
  const { data: camp, isLoading: campLoading, error: campError } = useCamp(campId!);
  const { 
    data: churches, 
    isLoading: churchesLoading, 
    // @ts-ignore
    createChurch, 
    // @ts-ignore
    updateChurch, 
    // @ts-ignore
    deleteChurch 
  } = useChurches(campId!);
  const { 
    data: categories, 
    isLoading: categoriesLoading, 
    // @ts-ignore
    createCategory, 
    // @ts-ignore
    updateCategory, 
    // @ts-ignore
    deleteCategory 
  } = useCategories(campId!);
  const { 
    data: customFields, 
    isLoading: customFieldsLoading, 
    // @ts-ignore
    createField, 
    // @ts-ignore
    updateField, 
    // @ts-ignore
    deleteField 
  } = useCustomFields(campId!);
  const { 
    data: registrationLinks, 
    isLoading: registrationLinksLoading, 
    // @ts-ignore
    createLink, 
    // @ts-ignore
    updateLink, 
    // @ts-ignore
    deleteLink,
    // @ts-ignore
    toggleLink 
  } = useRegistrationLinks(campId!);

  // --- Churches tab: search, pagination, filtering state ---
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const churchesPerPage = 15;
  // Filtered and paginated churches
  const filteredChurches = (churches || []).filter((church: any) =>
    (church.name?.toLowerCase() || "").includes(search.toLowerCase()) ||
    (church.area?.toLowerCase() || "").includes(search.toLowerCase()) ||
    (church.district?.toLowerCase() || "").includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filteredChurches.length / churchesPerPage) || 1;
  const paginatedChurches = filteredChurches.slice(
    (currentPage - 1) * churchesPerPage,
    currentPage * churchesPerPage
  );
  
  const [activeDialog, setActiveDialog] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ type: string; item: any } | null>(null);

  const isLoading = campLoading || churchesLoading || categoriesLoading || customFieldsLoading || registrationLinksLoading;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (campError || !camp) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-destructive mb-4">Failed to load camp details</p>
            <Button onClick={() => navigate('/camps')}>
              Back to Camps
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleEdit = (item: any, type: string) => {
    setEditingItem(item);
    setActiveDialog(`edit-${type}`);
  };

  const handleAdd = (type: string) => {
    setEditingItem(null);
    setActiveDialog(`add-${type}`);
  };

  const closeDialog = () => {
    setActiveDialog(null);
    setEditingItem(null);
  };

  const handleDelete = async (type: string, item: any) => {
    try {
      switch (type) {
        case 'church':
          await deleteChurch(item.id);
          toast({ title: 'Church deleted successfully' });
          break;
        case 'category':
          await deleteCategory(item.id);
          toast({ title: 'Category deleted successfully' });
          break;
        case 'custom-field':
          await deleteField(item.id);
          toast({ title: 'Custom field deleted successfully' });
          break;
        case 'registration-link':
          await deleteLink(item.id);
          toast({ title: 'Registration link deleted successfully' });
          break;
      }
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Failed to delete item',
        variant: 'destructive'
      });
    } finally {
      setDeleteDialog(null);
    }
  };

  const handleToggleLink = async (linkId: string) => {
    try {
      await toggleLink(linkId);
      toast({ title: 'Registration link status updated' });
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Failed to toggle link status',
        variant: 'destructive'
      });
    }
  };

  const calculateCategoryFee = (category: any) => {
    const baseFee = parseFloat(camp.base_fee);
    if (category.discount_amount && parseFloat(category.discount_amount) > 0) {
      return baseFee - parseFloat(category.discount_amount);
    }
    const discount = parseFloat(category.discount_percentage) / 100;
    return baseFee * (1 - discount);
  };

  // Pagination helper
  function getPaginationRange(current: number, total: number): (number | string)[] {
    const maxPages = 10;
    if (total <= maxPages) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const range: (number | string)[] = [];
    const showLeft = 3;
    const showRight = 3;
    const showAround = 1;

    // Always show first 3
    for (let i = 1; i <= showLeft; i++) range.push(i);

    let left = Math.max(current - showAround, showLeft + 1);
    let right = Math.min(current + showAround, total - showRight);

    if (left > showLeft + 1) range.push('...');
    for (let i = left; i <= right; i++) range.push(i);
    if (right < total - showRight) range.push('...');

    // Always show last 3
    for (let i = total - showRight + 1; i <= total; i++) range.push(i);

    // Remove duplicates and sort
    return Array.from(new Set(range)).filter(p => typeof p === 'string' || (p >= 1 && p <= total)).sort((a, b) => {
      if (a === '...') return -1;
      if (b === '...') return 1;
      return (a as number) - (b as number);
    });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/camps/${campId}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Camp Details
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Manage Camp</h1>
              <p className="text-sm text-muted-foreground">{camp.name}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="churches" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="churches">
              <Users className="h-4 w-4 mr-2" />
              Churches
            </TabsTrigger>
            <TabsTrigger value="categories">
              <Tags className="h-4 w-4 mr-2" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="custom-fields">
              <Settings className="h-4 w-4 mr-2" />
              Custom Fields
            </TabsTrigger>
            <TabsTrigger value="registration-links">
              <Link className="h-4 w-4 mr-2" />
              Registration Links
            </TabsTrigger>
          </TabsList>

          {/* Churches Tab - Enhanced with search, pagination, and stats */}
          <TabsContent value="churches" className="space-y-4">
            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Churches Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {churches.length}
                    </div>
                    <p className="text-sm text-muted-foreground">Total Churches</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {churches.filter((c: any) => (c.registration_count || 0) > 0).length}
                    </div>
                    <p className="text-sm text-muted-foreground">With Registrations</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {churches.reduce((sum: number, c: any) => sum + (c.registration_count || 0), 0)}
                    </div>
                    <p className="text-sm text-muted-foreground">Total Participants</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Churches List Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Churches List</CardTitle>
                  <Dialog open={activeDialog === 'add-church'} onOpenChange={(open) => !open && closeDialog()}>
                    <DialogTrigger asChild>
                      <Button onClick={() => handleAdd('church')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Church
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Church</DialogTitle>
                        <DialogDescription>
                          Add a church that can register participants for this camp.
                        </DialogDescription>
                      </DialogHeader>
                      <ChurchForm campId={campId!} onSuccess={closeDialog} onCancel={closeDialog} />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {/* Search input */}
                <div className="mb-4 flex items-center">
                  <input
                    type="text"
                    placeholder="Search by name, area, or district..."
                    value={search}
                    onChange={e => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="max-w-xs border rounded px-2 py-1"
                  />
                </div>
                {churchesLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : filteredChurches.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">No churches found</p>
                    <Button onClick={() => handleAdd('church')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Church
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {paginatedChurches.map((church: any) => (
                        <div
                          key={church.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <Users className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <h3 className="font-medium">{church.name}</h3>
                              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                <span>Area: {church.area}</span>
                                <span>District: {church.district}</span>
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                <span className="flex items-center">
                                  <Users className="h-4 w-4 mr-1" />
                                  {church.registration_count || 0} participants
                                </span>
                                <span>Added {formatDate(church.created_at)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(church, 'church')}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog open={deleteDialog?.type === 'church' && deleteDialog?.item?.id === church.id} onOpenChange={(open) => !open && setDeleteDialog(null)}>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setDeleteDialog({ type: 'church', item: church })}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Church</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{church.name}"?
                                    {church.registration_count && church.registration_count > 0 && (
                                      <span className="text-destructive">
                                        {" "}This church has {church.registration_count} registered participants.
                                      </span>
                                    )}
                                    {" "}This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete('church', church)}
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
                                    Delete Church
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Pagination controls */}
                    <div className="flex justify-center mt-6 space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p: number) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      {getPaginationRange(currentPage, totalPages).map((page, idx) =>
                        typeof page === 'number' ? (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Button>
                        ) : (
                          <span key={`ellipsis-${idx}`} className="px-2 py-1 text-muted-foreground select-none">...</span>
                        )
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p: number) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Tags className="h-5 w-5" />
                      <span>Registration Categories</span>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Set up different pricing tiers and discounts
                    </p>
                  </div>
                  <Dialog open={activeDialog === 'add-category'} onOpenChange={(open) => !open && closeDialog()}>
                    <DialogTrigger asChild>
                      <Button onClick={() => handleAdd('category')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Category
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Category</DialogTitle>
                        <DialogDescription>
                          Create a new registration category with pricing options.
                        </DialogDescription>
                      </DialogHeader>
                      <CategoryForm campId={campId!} onSuccess={closeDialog} onCancel={closeDialog} />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category Name</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Final Price</TableHead>
                      <TableHead>Default</TableHead>
                      <TableHead className="w-[70px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>
                          {category.discount_percentage !== '0.00' ? (
                            <Badge variant="secondary">
                              {category.discount_percentage}% off
                            </Badge>
                          ) : category.discount_amount !== '0.00' ? (
                            <Badge variant="secondary">
                              {formatCurrency(category.discount_amount)} off
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">No discount</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(calculateCategoryFee(category))}
                        </TableCell>
                        <TableCell>
                          {category.is_default && (
                            <Badge variant="default">Default</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleEdit(category, 'category')}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Category
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive" 
                                disabled={category.is_default}
                                onClick={() => setDeleteDialog({ type: 'category', item: category })}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Category
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Custom Fields Tab */}
          <TabsContent value="custom-fields" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Settings className="h-5 w-5" />
                      <span>Custom Fields</span>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Add custom form fields for registration
                    </p>
                  </div>
                  <Dialog open={activeDialog === 'add-custom-field'} onOpenChange={(open) => !open && closeDialog()}>
                    <DialogTrigger asChild>
                      <Button onClick={() => handleAdd('custom-field')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Field
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Custom Field</DialogTitle>
                        <DialogDescription>
                          Create a custom field for the registration form.
                        </DialogDescription>
                      </DialogHeader>
                      <CustomFieldForm campId={campId!} onSuccess={closeDialog} onCancel={closeDialog} />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Field Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Required</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Options</TableHead>
                      <TableHead className="w-[70px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customFields.map((field) => (
                      <TableRow key={field.id}>
                        <TableCell className="font-medium">{field.field_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {field.field_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {field.is_required ? (
                            <Badge variant="destructive">Required</Badge>
                          ) : (
                            <Badge variant="secondary">Optional</Badge>
                          )}
                        </TableCell>
                        <TableCell>{field.order}</TableCell>
                        <TableCell>
                          {field.options ? (
                            <div className="flex flex-wrap gap-1">
                              {field.options.slice(0, 2).map((option, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {option}
                                </Badge>
                              ))}
                              {field.options.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{field.options.length - 2} more
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">No options</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleEdit(field, 'custom-field')}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Field
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => setDeleteDialog({ type: 'custom-field', item: field })}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Field
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Registration Links Tab */}
          <TabsContent value="registration-links" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Link className="h-5 w-5" />
                      <span>Registration Links</span>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Create special registration links with category restrictions
                    </p>
                  </div>
                  <Dialog open={activeDialog === 'add-registration-link'} onOpenChange={(open) => !open && closeDialog()}>
                    <DialogTrigger asChild>
                      <Button onClick={() => handleAdd('registration-link')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Link
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create Registration Link</DialogTitle>
                        <DialogDescription>
                          Generate a special link that restricts access to specific categories.
                        </DialogDescription>
                      </DialogHeader>
                      <RegistrationLinkForm 
                        campId={campId!} 
                        categories={categories}
                        onSuccess={closeDialog} 
                        onCancel={closeDialog} 
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Link Name</TableHead>
                      <TableHead>Token</TableHead>
                      <TableHead>Categories</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead className="w-[70px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registrationLinks.map((link) => (
                      <TableRow key={link.id}>
                        <TableCell className="font-medium">{link.name}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {link.link_token}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {link.allowed_categories.map((catId) => {
                              const category = categories.find(c => c.id === catId);
                              return category ? (
                                <Badge key={catId} variant="outline" className="text-xs">
                                  {category.name}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{link.usage_count}</div>
                            <div className="text-muted-foreground">
                              / {link.usage_limit || '∞'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={link.is_active ? "default" : "secondary"}
                            className="cursor-pointer"
                            onClick={() => handleToggleLink(link.id)}
                          >
                            {link.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {link.expires_at ? (
                            <div className="text-sm">
                              {formatDate(link.expires_at)}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Never</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => {
                                  const url = `${window.location.origin}/register/${link.link_token}`;
                                  navigator.clipboard.writeText(url);
                                  toast({ title: 'Link copied to clipboard' });
                                }}
                              >
                                <Link className="mr-2 h-4 w-4" />
                                Copy Link
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(link, 'registration-link')}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Link
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => setDeleteDialog({ type: 'registration-link', item: link })}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Link
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Dialogs */}
        <Dialog open={activeDialog === 'edit-church'} onOpenChange={(open) => !open && closeDialog()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Church</DialogTitle>
              <DialogDescription>
                Update the church information.
              </DialogDescription>
            </DialogHeader>
            <ChurchForm 
              campId={campId!} 
              church={editingItem} 
              onSuccess={closeDialog} 
              onCancel={closeDialog} 
            />
          </DialogContent>
        </Dialog>

        <Dialog open={activeDialog === 'edit-category'} onOpenChange={(open) => !open && closeDialog()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
              <DialogDescription>
                Update the category information and pricing.
              </DialogDescription>
            </DialogHeader>
            <CategoryForm 
              campId={campId!} 
              category={editingItem} 
              onSuccess={closeDialog} 
              onCancel={closeDialog} 
            />
          </DialogContent>
        </Dialog>

        <Dialog open={activeDialog === 'edit-custom-field'} onOpenChange={(open) => !open && closeDialog()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Custom Field</DialogTitle>
              <DialogDescription>
                Update the custom field settings.
              </DialogDescription>
            </DialogHeader>
            <CustomFieldForm 
              campId={campId!} 
              customField={editingItem} 
              onSuccess={closeDialog} 
              onCancel={closeDialog} 
            />
          </DialogContent>
        </Dialog>

        <Dialog open={activeDialog === 'edit-registration-link'} onOpenChange={(open) => !open && closeDialog()}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Registration Link</DialogTitle>
              <DialogDescription>
                Update the registration link settings.
              </DialogDescription>
            </DialogHeader>
            <RegistrationLinkForm 
              campId={campId!} 
              categories={categories}
              registrationLink={editingItem}
              onSuccess={closeDialog} 
              onCancel={closeDialog} 
            />
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the{' '}
                {deleteDialog?.type.replace('-', ' ')} "{deleteDialog?.item?.name || deleteDialog?.item?.field_name}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteDialog && handleDelete(deleteDialog.type, deleteDialog.item)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};
