// src/components/forms/RegistrationLinkForm.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Plus, Calendar, Link2, Copy } from 'lucide-react';
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
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useRegistrationLinks } from '@/hooks/useRegistrationLinks';
import type { RegistrationLink, Category } from '@/lib/types';

const registrationLinkSchema = z.object({
  name: z.string().min(3, 'Link name must be at least 3 characters'),
  allowed_categories: z.array(z.string()).min(1, 'Select at least one category'),
  expires_at: z.date().optional(),
  usage_limit: z.string().optional(),
});

type RegistrationLinkFormData = z.infer<typeof registrationLinkSchema>;

interface RegistrationLinkFormProps {
  campId: string;
  categories: Category[];
  registrationLink?: RegistrationLink; // For editing existing link
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const RegistrationLinkForm: React.FC<RegistrationLinkFormProps> = ({
  campId,
  categories,
  registrationLink,
  onSuccess,
  onCancel
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { createLink, updateLink } = useRegistrationLinks(campId);

  const form = useForm<RegistrationLinkFormData>({
    resolver: zodResolver(registrationLinkSchema),
    defaultValues: {
      name: registrationLink?.name || '',
      allowed_categories: registrationLink?.allowed_categories || [],
      expires_at: registrationLink?.expires_at ? new Date(registrationLink.expires_at) : undefined,
      usage_limit: registrationLink?.usage_limit?.toString() || '',
    },
  });

  const onSubmit = async (data: RegistrationLinkFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const submitData = {
        name: data.name,
        allowed_categories: data.allowed_categories,
        usage_limit: data.usage_limit ? parseInt(data.usage_limit) : undefined,
        expires_at: data.expires_at?.toISOString(),
      };

      if (registrationLink) {
        // Update existing registration link
        await updateLink({
          id: registrationLink.id,
          data: submitData
        });
      } else {
        // Create new registration link
        await createLink(submitData);
      }
      
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save registration link');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Early Bird Registration, VIP Access"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                A descriptive name for this registration link
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="allowed_categories"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Allowed Categories</FormLabel>
                <FormDescription>
                  Select which categories can be accessed through this link
                </FormDescription>
              </div>
              <div className="space-y-2">
                {categories.map((category) => (
                  <FormField
                    key={category.id}
                    control={form.control}
                    name="allowed_categories"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={category.id}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(category.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, category.id])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== category.id
                                      )
                                    )
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            <div className="flex items-center justify-between w-full">
                              <span>{category.name}</span>
                              <span className="text-sm text-muted-foreground ml-2">
                                {category.discount_percentage !== '0.00' && 
                                  `${category.discount_percentage}% off`
                                }
                              </span>
                            </div>
                          </FormLabel>
                        </FormItem>
                      )
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="expires_at"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Expiration Date (Optional)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>No expiration</span>
                        )}
                        <Calendar className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                    <div className="p-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => field.onChange(undefined)}
                        className="w-full"
                      >
                        Clear Date
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  Leave empty for no expiration
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="usage_limit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Usage Limit (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    placeholder="No limit"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Maximum number of registrations through this link
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Generated Link Preview */}
        {registrationLink?.link_token && (
          <div className="bg-muted p-4 rounded-lg">
            <FormLabel className="text-sm font-medium mb-2 block">
              Registration Link
            </FormLabel>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-background p-2 rounded border font-mono text-sm">
                {window.location.origin}/register/{registrationLink.link_token}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(`${window.location.origin}/register/${registrationLink.link_token}`)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
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
                {registrationLink ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                {registrationLink ? <Save className="h-4 w-4 mr-2" /> : <Link2 className="h-4 w-4 mr-2" />}
                {registrationLink ? 'Update Link' : 'Create Link'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};