// src/components/forms/CustomFieldForm.tsx
import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCustomFields } from '@/hooks/useCustomFields';
import type { CustomField } from '@/lib/types';

const customFieldSchema = z.object({
  field_name: z.string().min(2, 'Field name must be at least 2 characters'),
  field_type: z.enum(['text', 'number', 'dropdown', 'checkbox', 'date']),
  is_required: z.boolean().default(false),
  order: z.number().min(1, 'Order must be at least 1'),
  options: z.array(z.string()).optional(),
});

type CustomFieldFormData = z.infer<typeof customFieldSchema>;

interface CustomFieldFormProps {
  campId: string;
  customField?: CustomField; // For editing existing field
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const CustomFieldForm: React.FC<CustomFieldFormProps> = ({
  campId,
  customField,
  onSuccess,
  onCancel
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { createField, updateField } = useCustomFields(campId);

  const form = useForm<CustomFieldFormData>({
    resolver: zodResolver(customFieldSchema),
    defaultValues: {
      field_name: customField?.field_name || '',
      field_type: customField?.field_type || 'text',
      is_required: customField?.is_required || false,
      order: customField?.order || 1,
      options: customField?.options || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'options',
  });

  const watchedFieldType = form.watch('field_type');
  const needsOptions = ['dropdown', 'checkbox'].includes(watchedFieldType);

  const onSubmit = async (data: CustomFieldFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Clean up options for field types that don't need them
      const cleanedData = {
        field_name: data.field_name,
        field_type: data.field_type,
        is_required: data.is_required,
        order: data.order,
        options: needsOptions ? data.options?.filter(opt => opt.trim() !== '') : undefined,
      };

      if (customField) {
        // Update existing custom field
        await updateField({
          id: customField.id,
          data: cleanedData
        });
      } else {
        // Create new custom field
        await createField(cleanedData);
      }
      
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save custom field');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="field_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Field Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. T-Shirt Size, Dietary Restrictions"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="field_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Field Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select field type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="text">Text Input</SelectItem>
                  <SelectItem value="number">Number Input</SelectItem>
                  <SelectItem value="dropdown">Dropdown Selection</SelectItem>
                  <SelectItem value="checkbox">Multiple Choice</SelectItem>
                  <SelectItem value="date">Date Picker</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="order"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display Order</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                  />
                </FormControl>
                <FormDescription>
                  Lower numbers appear first
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_required"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-8">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Required Field</FormLabel>
                  <FormDescription>
                    Users must fill this field
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>

        {/* Options for dropdown and checkbox fields */}
        {needsOptions && (
          <div className="space-y-3">
            <FormLabel>Options</FormLabel>
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center space-x-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={`Option ${index + 1}`}
                    {...form.register(`options.${index}` as const)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append('')}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Option
            </Button>
            
            <FormDescription>
              {watchedFieldType === 'dropdown' 
                ? 'Users can select one option from the dropdown'
                : 'Users can select multiple options'
              }
            </FormDescription>
          </div>
        )}

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {error}
          </div>
        )}

        <div className="flex justify-end space-x-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                {customField ? 'Updating...' : 'Adding...'}
              </>
            ) : (
              <>
                {customField ? <Save className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                {customField ? 'Update Field' : 'Add Field'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};