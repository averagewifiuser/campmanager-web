// src/components/public/PublicRegistrationForm.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User,
  Phone,
  Users,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Calendar,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import {
  formatCurrency,
  formatDate,
  isValidGhanaPhone,
  formatGhanaPhone,
} from "@/lib/utils";
import type {
  PublicRegistrationData,
  RegistrationFormData,
  CustomField,
} from "@/lib/types";

// Create validation schema
const createRegistrationSchema = (customFields: CustomField[]) => {
  const customFieldsSchema: Record<string, z.ZodTypeAny> = {};

  customFields.forEach((field) => {
    let fieldSchema: z.ZodTypeAny;

    switch (field.field_type) {
      case "text":
        fieldSchema = z.string();
        break;
      case "number":
        fieldSchema = z
          .string()
          .refine((val) => !isNaN(Number(val)), "Must be a number");
        break;
      case "dropdown":
        fieldSchema = z.string();
        break;
      case "checkbox":
        fieldSchema = z.array(z.string());
        break;
      case "date":
        fieldSchema = z.string();
        break;
      default:
        fieldSchema = z.string();
    }

    if (field.is_required) {
      fieldSchema =
        field.field_type === "checkbox"
          ? (fieldSchema as z.ZodArray<any>).min(1, "This field is required")
          : (fieldSchema as z.ZodString).min(1, "This field is required");
    } else {
      fieldSchema = fieldSchema.optional();
    }

    customFieldsSchema[field.id] = fieldSchema;
  });

  return z.object({
    surname: z.string().min(2, "First name must be at least 2 characters"),
    middle_name: z.string().optional(),
    last_name: z.string().min(2, "Last name must be at least 2 characters"),
    sex: z.enum(["male", "female"]),
    age: z
      .number()
      .min(1, "Age must be at least 1")
      .max(120, "Age must be realistic"),
    email: z.string().email("Invalid email format"),
    phone_number: z
      .string()
      .min(10, "Phone number is required")
      .refine(isValidGhanaPhone, "Please enter a valid Ghana phone number"),
    emergency_contact_name: z
      .string()
      .min(2, "Emergency contact name is required"),
    emergency_contact_phone: z
      .string()
      .min(10, "Emergency contact phone is required")
      .refine(isValidGhanaPhone, "Please enter a valid Ghana phone number"),
    church_id: z.string().min(1, "Please select a church"),
    category_id: z.string().min(1, "Please select a category"),
    custom_field_responses: z.object(customFieldsSchema),
  });
};

interface PublicRegistrationFormProps {
  registrationData: PublicRegistrationData;
  onSubmit: (data: RegistrationFormData) => Promise<void>;
  isSubmitting?: boolean;
  submitError?: string | null;
}

export const PublicRegistrationForm: React.FC<PublicRegistrationFormProps> = ({
  registrationData,
  onSubmit,
  isSubmitting = false,
  submitError,
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [districtSearch, setDistrictSearch] = useState("");
  const [areaSearch, setAreaSearch] = useState("");
  const [churchSearch, setChurchSearch] = useState("");

  const { camp, churches, categories, custom_fields } = registrationData;

  // Get unique districts
  const districts = Array.from(
    new Set(churches.map((c) => c.district).filter(Boolean))
  );

  // Get unique areas for selected district
  const areas = Array.from(
    new Set(
      churches
        .filter((c) => c.district === selectedDistrict)
        .map((c) => c.area)
        .filter(Boolean)
    )
  );

  // Get churches for selected area
  const filteredChurches = churches.filter(
    (c) => c.district === selectedDistrict && c.area === selectedArea
  );

  const registrationSchema = createRegistrationSchema(custom_fields);
  type RegistrationFormValues = z.infer<typeof registrationSchema>;

  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      surname: "",
      middle_name: "",
      last_name: "",
      sex: undefined,
      age: 18,
      email: "",
      phone_number: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      church_id: "",
      category_id: "",
      custom_field_responses: {},
    },
  });

  // @ts-ignore
  const selectedCategory = categories.find(
    (cat) => cat.id === selectedCategoryId
  );

  const handleSubmit = async (data: RegistrationFormValues) => {
    try {
      // Format phone numbers
      // @ts-ignore
      const formattedData: RegistrationFormData = {
        ...data,
        phone_number: formatGhanaPhone(data.phone_number),
        emergency_contact_phone: formatGhanaPhone(data.emergency_contact_phone),
        email: data.email || undefined,
      };

      await onSubmit(formattedData);
    } catch (error) {
      console.error("Registration submission error:", error);
    }
  };

  const renderCustomField = (field: CustomField) => {
    const fieldName = `custom_field_responses.${field.id}` as const;

    switch (field.field_type) {
      case "text":
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={fieldName}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>
                  {field.field_name}
                  {field.is_required && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </FormLabel>
                <FormControl>
                  <Input {...(formField as any)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "number":
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={fieldName}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>
                  {field.field_name}
                  {field.is_required && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </FormLabel>
                <FormControl>
                  <Input type="number" {...(formField as any)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "dropdown":
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={fieldName}
            render={({ field: formField }) => {
              const [dropdownSearch, setDropdownSearch] = useState("");
              const filteredOptions = (field.options || []).filter(
                (option) =>
                  !dropdownSearch ||
                  option.toLowerCase().includes(dropdownSearch.toLowerCase())
              );
              return (
                <FormItem>
                  <FormLabel>
                    {field.field_name}
                    {field.is_required && (
                      <span className="text-destructive ml-1">*</span>
                    )}
                  </FormLabel>
                  <Select
                    onValueChange={formField.onChange}
                    value={formField.value as string}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={`Select ${field.field_name.toLowerCase()}`}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <div className="px-2 py-1">
                        <input
                          type="text"
                          placeholder={`Search ${field.field_name.toLowerCase()}...`}
                          className="w-full border rounded px-2 py-1 text-sm"
                          value={dropdownSearch}
                          onChange={(e) => setDropdownSearch(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      {filteredOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        );

      case "checkbox":
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={fieldName}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>
                  {field.field_name}
                  {field.is_required && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </FormLabel>
                <div className="space-y-2">
                  {field.options?.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        checked={((formField.value as string[]) || []).includes(
                          option
                        )}
                        onCheckedChange={(checked) => {
                          const currentValues =
                            (formField.value as string[]) || [];
                          if (checked) {
                            formField.onChange([...currentValues, option]);
                          } else {
                            formField.onChange(
                              currentValues.filter((val) => val !== option)
                            );
                          }
                        }}
                      />
                      <Label className="text-sm font-normal">{option}</Label>
                    </div>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "date":
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={fieldName}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>
                  {field.field_name}
                  {field.is_required && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </FormLabel>
                <FormControl>
                  <Input type="date" {...(formField as any)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Camp Information Header */}
      <Card>
        <CardHeader>
          <div className="text-center space-y-4">
            <CardTitle className="text-2xl font-bold">{registrationData.registration_link?.name || camp.name}</CardTitle>
            <div
              className="text-muted-foreground"
              dangerouslySetInnerHTML={{
                __html: registrationData.registration_link?.form_description?.trim()
                  ? registrationData.registration_link.form_description
                  : camp.description,
              }}
            />

            {/* Camp Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="flex items-center justify-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {formatDate(camp.start_date)} - {formatDate(camp.end_date)}
                </span>
              </div>

              <div className="flex items-center justify-center space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{camp.location}</span>
              </div>

              <div className="flex items-center justify-center space-x-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  From {formatCurrency(camp.base_fee)}
                </span>
              </div>
            </div>

            {/* Registration Deadline Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-amber-800">
                  Registration closes on{" "}
                  {formatDate(camp.registration_deadline)}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Registration Form */}
      <Card>
        <CardHeader>
          <CardTitle>Registration Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Personal Information</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="surname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
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
                          <Input placeholder="Michael" {...field} />
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
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sex"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sex *</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="block w-full border rounded px-3 py-2"
                          >
                            <option value="">Select</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 0)
                            }
                          />
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
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="john@example.com"
                            {...field}
                          />
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
                        <FormLabel>Phone Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="0241234567" {...field} />
                        </FormControl>
                        <FormDescription>
                          Ghana phone number (e.g., 0241234567)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center space-x-2">
                  <Phone className="h-5 w-5" />
                  <span>Emergency Contact</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="emergency_contact_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emergency Contact Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Jane Doe" {...field} />
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
                        <FormLabel>Emergency Contact Phone *</FormLabel>
                        <FormControl>
                          <Input placeholder="0241234567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Church and Category */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Registration Options</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* District Dropdown */}
                  <div>
                    <Label>District *</Label>
                    <Select
                      onValueChange={(value) => {
                        setSelectedDistrict(value);
                        setSelectedArea("");
                        form.setValue("church_id", "");
                      }}
                      value={selectedDistrict}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select district" />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="px-2 py-1">
                          <input
                            type="text"
                            placeholder="Search district..."
                            className="w-full border rounded px-2 py-1 text-sm"
                            value={districtSearch}
                            onChange={(e) => setDistrictSearch(e.target.value)}
                          />
                        </div>
                        {districts
                          .filter(
                            (d) =>
                              !districtSearch ||
                              d
                                .toLowerCase()
                                .includes(districtSearch.toLowerCase())
                          )
                          .map((district) => (
                            <SelectItem key={district} value={district}>
                              {district}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Area Dropdown */}
                  {selectedDistrict && (
                    <div>
                      <Label>Area *</Label>
                      <Select
                        onValueChange={(value) => {
                          setSelectedArea(value);
                          form.setValue("church_id", "");
                        }}
                        value={selectedArea}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select area" />
                        </SelectTrigger>
                        <SelectContent>
                          <div className="px-2 py-1">
                            <input
                              type="text"
                              placeholder="Search area..."
                              className="w-full border rounded px-2 py-1 text-sm"
                              value={areaSearch}
                              onChange={(e) => setAreaSearch(e.target.value)}
                            />
                          </div>
                          {areas
                            .filter(
                              (a) =>
                                !areaSearch ||
                                a
                                  .toLowerCase()
                                  .includes(areaSearch.toLowerCase())
                            )
                            .map((area) => (
                              <SelectItem key={area} value={area}>
                                {area}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Church Dropdown */}
                  {selectedDistrict && selectedArea && (
                    <FormField
                      control={form.control}
                      name="church_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Church *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your church" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <div className="px-2 py-1">
                                <input
                                  type="text"
                                  placeholder="Search church..."
                                  className="w-full border rounded px-2 py-1 text-sm"
                                  value={churchSearch}
                                  onChange={(e) =>
                                    setChurchSearch(e.target.value)
                                  }
                                />
                              </div>
                              {filteredChurches
                                .filter(
                                  (church) =>
                                    !churchSearch ||
                                    church.name
                                      .toLowerCase()
                                      .includes(churchSearch.toLowerCase())
                                )
                                .map((church) => (
                                  <SelectItem key={church.id} value={church.id}>
                                    {church.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => {
                      const [categorySearch, setCategorySearch] = useState("");
                      const filteredCategories = categories.filter(
                        (category) =>
                          !categorySearch ||
                          category.name
                            .toLowerCase()
                            .includes(categorySearch.toLowerCase())
                      );
                      return (
                        <FormItem>
                          <FormLabel>Registration Category *</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              setSelectedCategoryId(value);
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <div className="px-2 py-1">
                                <input
                                  type="text"
                                  placeholder="Search category..."
                                  className="w-full border rounded px-2 py-1 text-sm"
                                  value={categorySearch}
                                  onChange={(e) =>
                                    setCategorySearch(e.target.value)
                                  }
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                              {filteredCategories.map((category) => (
                                <SelectItem
                                  key={category.id}
                                  value={category.id}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <span>{category.name}</span>
                                    {/* <Badge variant="outline" className="ml-2">
                    {formatCurrency(category.calculated_fee)}
                  </Badge> */}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </div>

                {/* Show selected category fee
                {selectedCategory && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-green-800">{selectedCategory.name}</p>
                        <p className="text-sm text-green-600">
                          {selectedCategory.discount_percentage !== '0.00' && 
                            `${selectedCategory.discount_percentage}% discount applied`
                          }
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-800">
                          {formatCurrency(selectedCategory.calculated_fee)}
                        </p>
                        <p className="text-xs text-green-600">Registration fee</p>
                      </div>
                    </div>
                  </div> */}
                {/* )} */}
              </div>

              {/* Custom Fields */}
              {custom_fields.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">
                    Additional Information
                  </h3>
                  <p className="text-sm text-muted-foreground">
                  New branded T-shirts will be available on sale
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {custom_fields
                      .sort((a, b) => a.order - b.order)
                      .map(renderCustomField)}
                  </div>
                </div>
              )}

              {/* Error Display */}
              {submitError && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <p className="text-sm text-destructive font-medium">
                      Registration Failed
                    </p>
                  </div>
                  <p className="text-sm text-destructive mt-1">{submitError}</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-6">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Complete Registration
                      {/* {selectedCategory && (
                        <span className="ml-2">
                          - {formatCurrency(selectedCategory.calculated_fee)}
                        </span>
                      )} */}
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-2">
                  By registering, you confirm that all information provided is
                  accurate.
                </p>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};
