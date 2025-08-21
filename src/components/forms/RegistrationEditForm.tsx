import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import type { Registration } from '@/lib/types';

const registrationEditSchema = z.object({
  surname: z.string().min(1, 'Required'),
  middle_name: z.string().optional(),
  last_name: z.string().min(1, 'Required'),
  age: z.number().min(0, 'Invalid age'),
  email: z.string().email().optional().or(z.literal('')),
  phone_number: z.string().min(1, 'Required'),
  emergency_contact_name: z.string().min(1, 'Required'),
  emergency_contact_phone: z.string().min(1, 'Required'),
  // Add more fields as needed
});

type RegistrationEditFormData = z.infer<typeof registrationEditSchema>;

interface RegistrationEditFormProps {
  registration: Registration;
  onSubmit: (data: RegistrationEditFormData) => Promise<void> | void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const RegistrationEditForm: React.FC<RegistrationEditFormProps> = ({
  registration,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const form = useForm<RegistrationEditFormData>({
    resolver: zodResolver(registrationEditSchema),
    defaultValues: {
      surname: registration.surname,
      middle_name: registration.middle_name || '',
      last_name: registration.last_name,
      age: registration.age,
      email: registration.email || '',
      phone_number: registration.phone_number,
      emergency_contact_name: registration.emergency_contact_name,
      emergency_contact_phone: registration.emergency_contact_phone,
    },
  });

  const handleSubmit = async (values: RegistrationEditFormData) => {
    await onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="surname"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Surname</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="middle_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Middle Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="last_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="age"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Age</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="emergency_contact_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Emergency Contact Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="emergency_contact_phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Emergency Contact Phone</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default RegistrationEditForm;
