// src/pages/CustomFieldsManagementPage.tsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus,
  Edit2,
  Trash2,
  Type,
  Hash,
  Calendar,
  CheckSquare,
  ChevronDown,
  GripVertical,
  Star
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useCamp } from '@/hooks/useCamps';
import { useCustomFields } from '@/hooks/useCustomFields';
import { formatDate } from '@/lib/utils';

interface CustomField {
  id: string;
  field_name: string;
  field_type: 'text' | 'number' | 'dropdown' | 'checkbox' | 'date';
  is_required: boolean;
  options: string[] | null;
  camp_id: string;
  order: number;
  created_at: string;
  updated_at: string;
}

interface CustomFieldFormData {
  field_name: string;
  field_type: 'text' | 'number' | 'dropdown' | 'checkbox' | 'date';
  is_required: boolean;
  options: string[];
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text Input', icon: Type, description: 'Single line text input' },
  { value: 'number', label: 'Number', icon: Hash, description: 'Numeric input with validation' },
  { value: 'dropdown', label: 'Dropdown', icon: ChevronDown, description: 'Select from predefined options' },
  { value: 'checkbox', label: 'Checkboxes', icon: CheckSquare, description: 'Multiple selection options' },
  { value: 'date', label: 'Date', icon: Calendar, description: 'Date picker input' }
];

export const CustomFieldsManagementPage: React.FC = () => {
  const { campId } = useParams<{ campId: string }>();
  const navigate = useNavigate();
  
  // State for dialogs
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<CustomField | null>(null);
  
  // Form states
  const [formData, setFormData] = useState<CustomFieldFormData>({
    field_name: '',
    field_type: 'text',
    is_required: false,
    options: ['']
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data fetching
  const { data: camp, isLoading: campLoading } = useCamp(campId!);
  const { 
    data: customFields = [], 
    isLoading: fieldsLoading,
    createField,
    updateField,
    deleteField,
    // @ts-ignore
    reorderFields
  } = useCustomFields(campId!);

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
      field_name: '',
      field_type: 'text',
      is_required: false,
      options: ['']
    });
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const removeOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const updateOption = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((option, i) => i === index ? value : option)
    }));
  };

  const getFieldTypeIcon = (type: string) => {
    const fieldType = FIELD_TYPES.find(ft => ft.value === type);
    return fieldType ? fieldType.icon : Type;
  };

  const handleCreateField = async () => {
    if (!formData.field_name.trim()) return;
    
    setIsSubmitting(true);
    try {
      const payload = {
        field_name: formData.field_name.trim(),
        field_type: formData.field_type,
        is_required: formData.is_required,
        order: customFields.length + 1,
        ...((['dropdown', 'checkbox'].includes(formData.field_type)) && {
          options: formData.options.filter(opt => opt.trim() !== '')
        })
      };
      
      await createField(payload);
      resetForm();
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create custom field:', error);
      // TODO: Show error toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditField = async () => {
    if (!selectedField || !formData.field_name.trim()) return;
    
    setIsSubmitting(true);
    try {
      const payload = {
        field_name: formData.field_name.trim(),
        field_type: formData.field_type,
        is_required: formData.is_required,
        ...((['dropdown', 'checkbox'].includes(formData.field_type)) && {
          options: formData.options.filter(opt => opt.trim() !== '')
        })
      };
      // @ts-ignore
      await updateField(selectedField.id, payload);
      resetForm();
      setSelectedField(null);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update custom field:', error);
      // TODO: Show error toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteField = async (field: CustomField) => {
    try {
      await deleteField(field.id);
      // TODO: Show success toast
    } catch (error) {
      console.error('Failed to delete custom field:', error);
      // TODO: Show error toast
    }
  };

  const openEditDialog = (field: CustomField) => {
    setSelectedField(field);
    setFormData({
      field_name: field.field_name,
      field_type: field.field_type,
      is_required: field.is_required,
      options: field.options || ['']
    });
    setIsEditDialogOpen(true);
  };

  const requiresOptions = ['dropdown', 'checkbox'].includes(formData.field_type);
  const validOptions = formData.options.filter(opt => opt.trim() !== '');

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
                <h1 className="text-xl font-semibold">Custom Fields</h1>
                <p className="text-sm text-muted-foreground">{camp.name}</p>
              </div>
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Field
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add Custom Field</DialogTitle>
                  <DialogDescription>
                    Create a custom field to collect additional information from participants.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="field-name">Field Name</Label>
                    <Input
                      id="field-name"
                      value={formData.field_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, field_name: e.target.value }))}
                      placeholder="e.g., T-Shirt Size, Dietary Restrictions"
                    />
                  </div>
                  
                  <div>
                    <Label>Field Type</Label>
                    <Select
                      value={formData.field_type}
                      onValueChange={(value: any) => setFormData(prev => ({ 
                        ...prev, 
                        field_type: value,
                        options: ['dropdown', 'checkbox'].includes(value) ? [''] : []
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_TYPES.map((type) => {
                          const Icon = type.icon;
                          return (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center space-x-2">
                                <Icon className="h-4 w-4" />
                                <div>
                                  <div className="font-medium">{type.label}</div>
                                  <div className="text-xs text-muted-foreground">{type.description}</div>
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {requiresOptions && (
                    <div>
                      <Label>Options</Label>
                      <div className="space-y-2">
                        {formData.options.map((option, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Input
                              value={option}
                              onChange={(e) => updateOption(index, e.target.value)}
                              placeholder={`Option ${index + 1}`}
                            />
                            {formData.options.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeOption(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addOption}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Option
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is-required"
                      checked={formData.is_required}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_required: !!checked }))}
                    />
                    <Label htmlFor="is-required">Required field</Label>
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
                    onClick={handleCreateField}
                    disabled={
                      !formData.field_name.trim() || 
                      (requiresOptions && validOptions.length === 0) || 
                      isSubmitting
                    }
                  >
                    {isSubmitting ? 'Creating...' : 'Create Field'}
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
          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Custom Fields Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {customFields.length}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Fields</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {customFields.filter(f => f.is_required).length}
                  </div>
                  <p className="text-sm text-muted-foreground">Required Fields</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {customFields.filter(f => ['dropdown', 'checkbox'].includes(f.field_type)).length}
                  </div>
                  <p className="text-sm text-muted-foreground">Option Fields</p>
                </div>
              </div>
              
              {customFields.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> These fields will appear in the registration form for participants. 
                    You can drag and drop to reorder them.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fields List */}
          <Card>
            <CardHeader>
              <CardTitle>Registration Form Fields</CardTitle>
            </CardHeader>
            <CardContent>
              {fieldsLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : customFields.length === 0 ? (
                <div className="text-center py-8">
                  <Type className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No custom fields created yet</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add custom fields to collect additional information like T-shirt sizes, 
                    dietary restrictions, or any other camp-specific details.
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Field
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {customFields
                    .sort((a, b) => a.order - b.order)
                    .map((field) => {
                      const Icon = getFieldTypeIcon(field.field_type);
                      
                      return (
                        <div
                          key={field.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                            <Icon className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="font-medium">{field.field_name}</h3>
                                {field.is_required && (
                                  <Star className="h-4 w-4 text-red-500" />
                                )}
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                <Badge variant="outline">
                                  {FIELD_TYPES.find(ft => ft.value === field.field_type)?.label}
                                </Badge>
                                <span>Order: {field.order}</span>
                                {field.options && field.options.length > 0 && (
                                  <span>{field.options.length} options</span>
                                )}
                                <span>Added {formatDate(field.created_at)}</span>
                              </div>
                              {field.options && field.options.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {field.options.slice(0, 3).map((option, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {option}
                                    </Badge>
                                  ))}
                                  {field.options.length > 3 && (
                                    <Badge variant="secondary" className="text-xs">
                                      +{field.options.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(field)}
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
                                  <AlertDialogTitle>Delete Custom Field</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{field.field_name}"? 
                                    This will remove the field from the registration form and 
                                    all existing responses will be lost. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteField(field)}
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
                                    Delete Field
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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
              <DialogTitle>Edit Custom Field</DialogTitle>
              <DialogDescription>
                Update the custom field settings and options.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-field-name">Field Name</Label>
                <Input
                  id="edit-field-name"
                  value={formData.field_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, field_name: e.target.value }))}
                  placeholder="e.g., T-Shirt Size, Dietary Restrictions"
                />
              </div>
              
              <div>
                <Label>Field Type</Label>
                <Select
                  value={formData.field_type}
                  onValueChange={(value: any) => setFormData(prev => ({ 
                    ...prev, 
                    field_type: value,
                    options: ['dropdown', 'checkbox'].includes(value) ? (prev.options.length > 0 ? prev.options : ['']) : []
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map((type) => {
                      const Icon = type.icon;
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center space-x-2">
                            <Icon className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-xs text-muted-foreground">{type.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {requiresOptions && (
                <div>
                  <Label>Options</Label>
                  <div className="space-y-2">
                    {formData.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                        />
                        {formData.options.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeOption(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addOption}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Option
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-is-required"
                  checked={formData.is_required}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_required: !!checked }))}
                />
                <Label htmlFor="edit-is-required">Required field</Label>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditDialogOpen(false);
                  resetForm();
                  setSelectedField(null);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleEditField}
                disabled={
                  !formData.field_name.trim() || 
                  (requiresOptions && validOptions.length === 0) || 
                  isSubmitting
                }
              >
                {isSubmitting ? 'Updating...' : 'Update Field'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};