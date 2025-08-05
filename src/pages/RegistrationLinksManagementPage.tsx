// src/pages/RegistrationLinksManagementPage.tsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus,
  Edit2,
  Trash2,
  Link2,
  Copy,
  ExternalLink,
  Calendar,
  Eye,
  EyeOff
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
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useCamp } from '@/hooks/useCamps';
import { useCategories } from '@/hooks/useCategories';
import { useRegistrationLinks } from '@/hooks/useRegistrationLinks';
import { formatDate } from '@/lib/utils';

interface RegistrationLink {
  id: string;
  camp_id: string;
  link_token: string;
  name: string;
  allowed_categories: string[];
  is_active: boolean;
  expires_at: string | null;
  usage_limit: number | null;
  usage_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// @ts-ignore
interface Category {
  id: string;
  name: string;
  discount_percentage: string;
  discount_amount: string;
  is_default: boolean;
}

interface LinkFormData {
  name: string;
  allowed_categories: string[];
  expires_at: string;
  usage_limit: string;
}

export const RegistrationLinksManagementPage: React.FC = () => {
  const { campId } = useParams<{ campId: string }>();
  const navigate = useNavigate();
  
  // State for dialogs
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<RegistrationLink | null>(null);
  
  // Form states
  const [formData, setFormData] = useState<LinkFormData>({
    name: '',
    allowed_categories: [],
    expires_at: '',
    usage_limit: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data fetching
  const { data: camp, isLoading: campLoading } = useCamp(campId!);
  const { data: categories = [], isLoading: categoriesLoading } = useCategories(campId!);
  const { 
    data: links = [], 
    isLoading: linksLoading,
    createLink,
    updateLink,
    deleteLink,
    toggleLink
  } = useRegistrationLinks(campId!);

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

  if (campLoading || categoriesLoading) {
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
      allowed_categories: [],
      expires_at: '',
      usage_limit: ''
    });
  };

  const getRegistrationUrl = (linkToken: string) => {
    return `${window.location.origin}/register/${linkToken}`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // TODO: Show success toast
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // TODO: Show error toast
    }
  };

  const handleCreateLink = async () => {
    if (!formData.name.trim() || formData.allowed_categories.length === 0) return;
    
    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        allowed_categories: formData.allowed_categories,
        ...(formData.expires_at && { expires_at: new Date(formData.expires_at).toISOString() }),
        ...(formData.usage_limit && { usage_limit: parseInt(formData.usage_limit) })
      };
      
      await createLink(payload);
      resetForm();
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create registration link:', error);
      // TODO: Show error toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditLink = async () => {
    if (!selectedLink || !formData.name.trim() || formData.allowed_categories.length === 0) return;
    
    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        allowed_categories: formData.allowed_categories,
        ...(formData.expires_at && { expires_at: new Date(formData.expires_at).toISOString() }),
        ...(formData.usage_limit && { usage_limit: parseInt(formData.usage_limit) })
      };
      // @ts-ignore
      await updateLink(selectedLink.id, payload);
      resetForm();
      setSelectedLink(null);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update registration link:', error);
      // TODO: Show error toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLink = async (link: RegistrationLink) => {
    try {
      await deleteLink(link.id);
      // TODO: Show success toast
    } catch (error) {
      console.error('Failed to delete registration link:', error);
      // TODO: Show error toast
    }
  };

  const handleToggleLink = async (link: RegistrationLink) => {
    try {
      await toggleLink(link.id);
      // TODO: Show success toast
    } catch (error) {
      console.error('Failed to toggle registration link:', error);
      // TODO: Show error toast
    }
  };

  const openEditDialog = (link: RegistrationLink) => {
    setSelectedLink(link);
    setFormData({
      name: link.name,
      allowed_categories: link.allowed_categories,
      expires_at: link.expires_at ? new Date(link.expires_at).toISOString().slice(0, 16) : '',
      usage_limit: link.usage_limit ? link.usage_limit.toString() : ''
    });
    setIsEditDialogOpen(true);
  };

  const getLinkStatus = (link: RegistrationLink) => {
    if (!link.is_active) {
      return { label: 'Inactive', variant: 'secondary' as const };
    }
    
    const now = new Date();
    if (link.expires_at && new Date(link.expires_at) <= now) {
      return { label: 'Expired', variant: 'destructive' as const };
    }
    
    if (link.usage_limit && link.usage_count >= link.usage_limit) {
      return { label: 'Limit Reached', variant: 'destructive' as const };
    }
    
    return { label: 'Active', variant: 'default' as const };
  };

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
                <h1 className="text-xl font-semibold">Registration Links</h1>
                <p className="text-sm text-muted-foreground">{camp.name}</p>
              </div>
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Link
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create Registration Link</DialogTitle>
                  <DialogDescription>
                    Create a custom registration link with specific categories and limits.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="link-name">Link Name</Label>
                    <Input
                      id="link-name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Early Bird Registration, Student Portal"
                    />
                  </div>
                  
                  <div>
                    <Label>Allowed Categories</Label>
                    <div className="space-y-2 mt-2">
                      {categories.map((category) => (
                        <label key={category.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.allowed_categories.includes(category.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  allowed_categories: [...prev.allowed_categories, category.id]
                                }));
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  allowed_categories: prev.allowed_categories.filter(id => id !== category.id)
                                }));
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">{category.name}</span>
                          {category.is_default && (
                            <Badge variant="secondary" className="text-xs">Default</Badge>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="expires-at">Expires At (Optional)</Label>
                      <Input
                        id="expires-at"
                        type="datetime-local"
                        value={formData.expires_at}
                        onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="usage-limit">Usage Limit (Optional)</Label>
                      <Input
                        id="usage-limit"
                        type="number"
                        min="1"
                        value={formData.usage_limit}
                        onChange={(e) => setFormData(prev => ({ ...prev, usage_limit: e.target.value }))}
                        placeholder="Unlimited"
                      />
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
                    onClick={handleCreateLink}
                    disabled={!formData.name.trim() || formData.allowed_categories.length === 0 || isSubmitting}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Link'}
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
                <Link2 className="h-5 w-5 mr-2" />
                Links Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {links.length}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Links</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {links.filter(l => l.is_active).length}
                  </div>
                  <p className="text-sm text-muted-foreground">Active Links</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {links.reduce((sum, l) => sum + l.usage_count, 0)}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Uses</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {links.filter(l => {
                      const status = getLinkStatus(l);
                      return status.variant === 'destructive';
                    }).length}
                  </div>
                  <p className="text-sm text-muted-foreground">Expired/Full</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Links List */}
          <Card>
            <CardHeader>
              <CardTitle>Registration Links</CardTitle>
            </CardHeader>
            <CardContent>
              {linksLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : links.length === 0 ? (
                <div className="text-center py-8">
                  <Link2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No registration links created yet</p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Link
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {links.map((link) => {
                    const status = getLinkStatus(link);
                    const url = getRegistrationUrl(link.link_token);
                    
                    return (
                      <div
                        key={link.id}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Link2 className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <h3 className="font-medium">{link.name}</h3>
                              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                <Badge variant={status.variant}>
                                  {status.label}
                                </Badge>
                                <span>{link.usage_count} uses</span>
                                {link.usage_limit && (
                                  <span>/ {link.usage_limit} limit</span>
                                )}
                                {link.expires_at && (
                                  <span className="flex items-center">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    Expires {formatDate(link.expires_at)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleLink(link)}
                            >
                              {link.is_active ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(link)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Registration Link</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{link.name}"? 
                                    {link.usage_count > 0 && (
                                      <span className="text-destructive">
                                        {" "}This link has been used {link.usage_count} times.
                                      </span>
                                    )}
                                    {" "}This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteLink(link)}
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
                                    Delete Link
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>

                        {/* Categories */}
                        <div className="flex flex-wrap gap-2">
                          {link.allowed_categories.map((categoryId) => {
                            const category = categories.find(c => c.id === categoryId);
                            return category ? (
                              <Badge key={categoryId} variant="outline">
                                {category.name}
                              </Badge>
                            ) : null;
                          })}
                        </div>

                        {/* URL */}
                        <div className="bg-muted p-3 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 mr-3">
                              <div className="text-xs font-medium text-muted-foreground mb-1">
                                Registration URL
                              </div>
                              <div className="text-sm font-mono break-all">
                                {url}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(url)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(url, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
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
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Registration Link</DialogTitle>
              <DialogDescription>
                Update the registration link settings and restrictions.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-link-name">Link Name</Label>
                <Input
                  id="edit-link-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Early Bird Registration, Student Portal"
                />
              </div>
              
              <div>
                <Label>Allowed Categories</Label>
                <div className="space-y-2 mt-2">
                  {categories.map((category) => (
                    <label key={category.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.allowed_categories.includes(category.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              allowed_categories: [...prev.allowed_categories, category.id]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              allowed_categories: prev.allowed_categories.filter(id => id !== category.id)
                            }));
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{category.name}</span>
                      {category.is_default && (
                        <Badge variant="secondary" className="text-xs">Default</Badge>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-expires-at">Expires At (Optional)</Label>
                  <Input
                    id="edit-expires-at"
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-usage-limit">Usage Limit (Optional)</Label>
                  <Input
                    id="edit-usage-limit"
                    type="number"
                    min="1"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData(prev => ({ ...prev, usage_limit: e.target.value }))}
                    placeholder="Unlimited"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditDialogOpen(false);
                  resetForm();
                  setSelectedLink(null);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleEditLink}
                disabled={!formData.name.trim() || formData.allowed_categories.length === 0 || isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Update Link'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};