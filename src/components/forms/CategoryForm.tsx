// src/components/forms/CategoryForm.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Plus } from 'lucide-react';
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
import { useCategories } from '@/hooks/useCategories';
import type { Category } from '@/lib/types';

const categorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters'),
  discount_percentage: z.string()
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100, 
      'Discount must be between 0 and 100'),
  is_default: z.boolean().default(false),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  campId: string;
  category?: Category; // For editing existing category
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
  campId,
  category,
  onSuccess,
  onCancel
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { createCategory, updateCategory } = useCategories(campId);

  const form = useForm<CategoryFormData>({
    // @ts-ignore
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name || '',
      discount_percentage: category?.discount_percentage || '0',
      is_default: category?.is_default || false,
    },
  });

  const watchedDiscount = form.watch('discount_percentage');

  const onSubmit = async (data: CategoryFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (category) {
        // Update existing category
        await updateCategory({
          id: category.id,
          data: {
            name: data.name,
            discount_percentage: data.discount_percentage,
            is_default: data.is_default,
          }
        });
      } else {
        // Create new category
        await createCategory({
          name: data.name,
          discount_percentage: data.discount_percentage,
          is_default: data.is_default,
        });
      }
      
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4">
        <FormField
          // @ts-ignore
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Early Bird, Student, VIP"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          // @ts-ignore
          control={form.control}
          name="discount_percentage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Discount Percentage</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="0"
                    {...field}
                  />
                  <div className="absolute right-3 top-3 text-sm text-muted-foreground">
                    %
                  </div>
                </div>
              </FormControl>
              <FormDescription>
                {watchedDiscount && Number(watchedDiscount) > 0 ? (
                  <span className="text-green-600">
                    {watchedDiscount}% discount will be applied to the base fee
                  </span>
                ) : (
                  'Enter 0 for no discount'
                )}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          // @ts-ignore
          control={form.control}
          name="is_default"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Make this the default category
                </FormLabel>
                <FormDescription>
                  This category will be pre-selected in registration forms
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

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
                {category ? 'Updating...' : 'Adding...'}
              </>
            ) : (
              <>
                {category ? <Save className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                {category ? 'Update Category' : 'Add Category'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};