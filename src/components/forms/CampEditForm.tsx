// src/components/forms/CampEditForm.tsx
import { useState, useRef, useEffect } from 'react';
import 'quill/dist/quill.snow.css';
import Quill from 'quill';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { CalendarIcon, MapPin, Users, DollarSign, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useUpdateCamp } from '@/hooks/useCamps';
import { handleApiError } from '@/lib/api';
import type { Camp, CreateCampRequest } from '@/lib/types';

// Validation schema (same as create camp)
const campEditSchema = z.object({
  name: z.string().min(3, 'Camp name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  location: z.string().min(5, 'Location must be at least 5 characters'),
  start_date: z.date({
    // @ts-ignore
    required_error: 'Start date is required',
  }),
  end_date: z.date({
    // @ts-ignore
    required_error: 'End date is required',
  }),
  registration_deadline: z.date({
    // @ts-ignore
    required_error: 'Registration deadline is required',
  }),
  base_fee: z.string()
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Base fee must be a positive number'),
  capacity: z.string()
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Capacity must be a positive number'),
}).refine((data) => data.end_date > data.start_date, {
  message: "End date must be after start date",
  path: ["end_date"],
}).refine((data) => data.registration_deadline <= data.start_date, {
  message: "Registration deadline must be before or on start date",
  path: ["registration_deadline"],
});

type CampEditFormData = z.infer<typeof campEditSchema>;

interface CampEditFormProps {
  camp: Camp;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const CampEditForm: React.FC<CampEditFormProps> = ({ 
  camp, 
  onSuccess, 
  onCancel 
}) => {
  const [error, setError] = useState<string | null>(null);
  const updateCampMutation = useUpdateCamp();

  const quillRef = useRef<HTMLDivElement>(null);
  const form = useForm<CampEditFormData>({
    resolver: zodResolver(campEditSchema),
    defaultValues: {
      name: camp.name,
      description: camp.description,
      location: camp.location,
      start_date: parseISO(camp.start_date),
      end_date: parseISO(camp.end_date),
      registration_deadline: parseISO(camp.registration_deadline),
      base_fee: camp.base_fee,
      capacity: camp.capacity.toString(),
    },
  });

  // Initialize Quill editor
  useEffect(() => {
    if (!quillRef.current) return;
    const quill = new Quill(quillRef.current, {
      theme: 'snow',
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline'],
          ['link', 'image'],
          [{ list: 'ordered' }, { list: 'bullet' }],
        ],
      },
    });

    quill.on('text-change', () => {
      const content = quill.root.innerHTML;
      form.setValue('description', content, { shouldValidate: true });
    });

    // Set initial value
    quill.root.innerHTML = form.getValues('description') || '';

    // Cleanup
    return () => {
      quill.off('text-change');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (data: CampEditFormData) => {
    try {
      setError(null);

      // Convert form data to API format
      const updateData: Partial<CreateCampRequest> = {
        name: data.name,
        description: data.description,
        location: data.location,
        start_date: format(data.start_date, 'yyyy-MM-dd'),
        end_date: format(data.end_date, 'yyyy-MM-dd'),
        registration_deadline: data.registration_deadline.toISOString(),
        base_fee: data.base_fee,
        capacity: parseInt(data.capacity),
      };

      await updateCampMutation.mutateAsync({ id: camp.id, data: updateData });
      onSuccess?.();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Camp Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              // @ts-ignore
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <div className="min-h-[180px]">
                      <div
                        ref={quillRef}
                        style={{
                          minHeight: 120,
                          background: "#fff",
                          borderRadius: 6,
                          border: "1px solid #d1d5db",
                          fontSize: 16,
                        }}
                        className="quill-editor"
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    This will be shown to potential participants.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-10" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Dates */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Dates</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
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
                              <span>Pick start date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
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
                              <span>Pick end date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="registration_deadline"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Registration Deadline</FormLabel>
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
                            <span>Pick registration deadline</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Last date for participants to register.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Pricing & Capacity */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Pricing & Capacity</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="base_fee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Fee (GH₵)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Base registration fee before any discounts.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Capacity</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          min="1"
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Maximum number of participants.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={updateCampMutation.isPending}
              >
                Cancel
              </Button>
            )}
            
            <Button
              type="submit"
              disabled={updateCampMutation.isPending}
            >
              {updateCampMutation.isPending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                  Updating Camp...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Camp
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
