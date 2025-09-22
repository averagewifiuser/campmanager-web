// src/components/forms/ChurchForm.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useChurches } from '@/hooks/useChurches';
import type { Church } from '@/lib/types';

const churchSchema = z.object({
  name: z.string().min(3, 'Church name must be at least 3 characters'),
  area: z.string().min(2, 'Area must be at least 2 characters'),
  district: z.string().min(2, 'District must be at least 2 characters'),
  region: z.string().max(100, 'Region must be at most 100 characters').nullable().optional(),
});

type ChurchFormData = z.infer<typeof churchSchema>;

interface ChurchFormProps {
  campId: string;
  church?: Church; // For editing existing church
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ChurchForm: React.FC<ChurchFormProps> = ({
  campId,
  church,
  onSuccess,
  onCancel
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { createChurch, updateChurch } = useChurches(campId);

  const form = useForm<ChurchFormData>({
    resolver: zodResolver(churchSchema),
    defaultValues: {
      name: church?.name || '',
      area: church?.area || '',
      district: church?.district || '',
      region: church?.region ?? '',
    },
  });

  const onSubmit = async (data: ChurchFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Ensure area and district are never null or undefined
      const safeData = {
        name: data.name,
        area: data.area ?? '',
        district: data.district ?? '',
        region: data.region && data.region.trim() !== '' ? data.region.trim() : null
      };

      if (church) {
        // Update existing church
        await updateChurch({
          id: church.id,
          data: safeData
        });
      } else {
        // Create new church
        await createChurch(safeData);
      }
      
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save church');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Church Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Central Baptist Church"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="area"
          render={({ field }) => (
            <FormItem>
<FormLabel>Area <span className="text-destructive">*</span></FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. North Kaneshie"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="district"
          render={({ field }) => (
            <FormItem>
<FormLabel>District <span className="text-destructive">*</span></FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Accra West"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="region"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Region (optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Greater Accra"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
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
                {church ? 'Updating...' : 'Adding...'}
              </>
            ) : (
              <>
                {church ? <Save className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                {church ? 'Update Church' : 'Add Church'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};
