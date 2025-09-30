// src/components/registrations/RegistrationsTable.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import {
  MoreHorizontal, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle,
  UserCheck,
  Phone,
  Mail,
  Filter,
  X,
  Search,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Download,
  FileSpreadsheet,
  Loader2,
  QrCode,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { formatCurrency } from '@/lib/utils';
import { 
  useUpdatePaymentStatus, 
  useUpdateCheckinStatus, 
  useDeleteRegistration,
  useCampRegistrations
} from '@/hooks/useRegistrations';
import { useChurches } from '@/hooks/useChurches';
import { useCategories } from '@/hooks/useCategories';
import { useCustomFields } from '@/hooks/useCustomFields';
import { useQrTools } from '@/hooks/useQrTools';
import { useToast } from '@/hooks/use-toast';
import type { Registration, CustomField } from '@/lib/types';
import { paymentsApi } from '@/lib/api';

interface RegistrationsTableProps {
  campId: string;
  onEditRegistration?: (registration: Registration) => void;
  enabled?: boolean;
}

export const RegistrationsTable: React.FC<RegistrationsTableProps> = ({ 
  campId,
  onEditRegistration,
  enabled = true
}) => {
  const [selectedRegistrations, setSelectedRegistrations] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [registrationToDelete, setRegistrationToDelete] = useState<Registration | null>(null);
  
  // Filter state
  const [churchFilter, setChurchFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [customFieldFilters, setCustomFieldFilters] = useState<Record<string, string>>({});
  const [regionFilter, setRegionFilter] = useState<string>('all');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // View state
  const [showAllDetails, setShowAllDetails] = useState<boolean>(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Groupings row expansion state (fieldId::option)
  const [expandedGroupRows, setExpandedGroupRows] = useState<Set<string>>(new Set());

  // Export state
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<string>('');

  const toggleGroupRow = (fieldId: string, option: string) => {
    const key = `${fieldId}::${option}`;
    setExpandedGroupRows((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  
  // Fetch data with filters
  const { data: allRegistrations = [], isLoading } = useCampRegistrations(campId, {
    church_id: churchFilter !== 'all' ? churchFilter : undefined,
    category_id: categoryFilter !== 'all' ? categoryFilter : undefined,
  }, { enabled });
  
    
  const registrations = allRegistrations;

  // Track registrations that have at least one payment recorded
  const [registrationsWithPayments, setRegistrationsWithPayments] = useState<Set<string>>(new Set());

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const payments = await paymentsApi.getCampPayments(campId);
        if (!mounted) return;
        const set = new Set<string>();
        (payments || []).forEach((p: any) => {
          (p.registrations || []).forEach((reg: any) => {
            if (reg?.id) set.add(reg.id);
          });
        });
        setRegistrationsWithPayments(set);
      } catch {
        // ignore fetch errors for payments in this view
      }
    };
    if (campId) {
      load();
    }
    return () => {
      mounted = false;
    };
  }, [campId]);
  
  // Fetch filter options
  const { data: churches = [] } = useChurches(campId);
  const { data: categories = [] } = useCategories(campId);
  const { data: customFields = [] } = useCustomFields(campId);
  const regionOptions = useMemo(() => {
    const set = new Set<string>();
    churches.forEach((c) => {
      if (c.region && c.region.trim() !== '') {
        set.add(c.region.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [churches]);
  
  const updatePaymentMutation = useUpdatePaymentStatus();
  const updateCheckinMutation = useUpdateCheckinStatus();
  const deleteRegistrationMutation = useDeleteRegistration();

  // QR Tools
  const {
    generatePdf,
    isGeneratingPdf,
    pdfProgress,
    sendEmails,
    isEmailLoading,
    //@ts-ignore
    estimatePdfPages
  } = useQrTools();
  
  const { toast } = useToast();

  // QR Action Handlers
  const handleGenerateQrPdf = async () => {
    if (selectedRegistrations.length === 0) {
      toast({
        title: "No selections",
        description: "Please select registrations to generate QR codes.",
        variant: "destructive"
      });
      return;
    }

    const selectedRegs = finalRegistrations.filter(reg => 
      selectedRegistrations.includes(reg.id)
    );

    try {
      await generatePdf(selectedRegs);
      toast({
        title: "QR PDF Generated",
        description: `Successfully generated QR codes for ${selectedRegs.length} camper(s).`,
      });
    } catch (error) {
      toast({
        title: "PDF Generation Failed",
        description: error instanceof Error ? error.message : "An error occurred while generating the PDF.",
        variant: "destructive"
      });
    }
  };

  const handleSendQrEmails = async () => {
    if (selectedRegistrations.length === 0) {
      toast({
        title: "No selections",
        description: "Please select registrations to send QR emails.",
        variant: "destructive"
      });
      return;
    }

    const selectedRegs = finalRegistrations.filter(reg => 
      selectedRegistrations.includes(reg.id)
    );

    const regsWithEmail = selectedRegs.filter(reg => reg.email && reg.email.trim() !== '');

    if (regsWithEmail.length === 0) {
      toast({
        title: "No email addresses",
        description: "None of the selected registrations have valid email addresses.",
        variant: "destructive"
      });
      return;
    }

    try {
      const results = await sendEmails(selectedRegs);
      
      if (results.success > 0) {
        toast({
          title: "QR Emails Sent",
          description: `Successfully sent QR codes to ${results.success} camper(s)${results.failed > 0 ? `. ${results.failed} email(s) failed to send.` : '.'}`,
          variant: results.failed > 0 ? "default" : "default"
        });
      }

      if (results.failed > 0 && results.success === 0) {
        toast({
          title: "Email sending failed",
          description: "Failed to send any QR code emails. Please check your email configuration.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Email sending failed",
        description: error instanceof Error ? error.message : "An error occurred while sending emails.",
        variant: "destructive"
      });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRegistrations(registrations.map(reg => reg.id));
    } else {
      setSelectedRegistrations([]);
    }
  };

  const handleSelectRegistration = (registrationId: string, checked: boolean) => {
    if (checked) {
      setSelectedRegistrations(prev => [...prev, registrationId]);
    } else {
      setSelectedRegistrations(prev => prev.filter(id => id !== registrationId));
    }
  };

  const handleCheckinToggle = async (registration: Registration) => {
    try {
      await updateCheckinMutation.mutateAsync({
        registrationId: registration.id,
        hasCheckedIn: !registration.has_checked_in
      });
    } catch (error) {
      console.error('Failed to update check-in status:', error);
    }
  };

  const handleDeleteClick = (registration: Registration) => {
    setRegistrationToDelete(registration);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!registrationToDelete) return;
    
    try {
      await deleteRegistrationMutation.mutateAsync(registrationToDelete.id);
      setDeleteDialogOpen(false);
      setRegistrationToDelete(null);
    } catch (error) {
      console.error('Failed to delete registration:', error);
    }
  };

  //@ts-ignore
  // const exportToCSV = () => {
  //   const headers = [
  //     'Name', 'Age', 'Email', 'Phone', 'Church', 'Category', 
  //     'Amount', 'Paid', 'Checked In', 'Registration Date'
  //   ];
    
  //   const csvData = registrations.map(reg => [
  //     `${reg.surname} ${reg.middle_name} ${reg.last_name}`.trim(),
  //     reg.age,
  //     reg.email || 'N/A',
  //     reg.phone_number,
  //     'Church Name', // You'd get this from church data
  //     'Category Name', // You'd get this from category data
  //     reg.total_amount,
  //     reg.has_paid ? 'Yes' : 'No',
  //     reg.has_checked_in ? 'Yes' : 'No',
  //     format(new Date(reg.registration_date), 'yyyy-MM-dd')
  //   ]);

  //   const csvContent = [headers, ...csvData]
  //     .map(row => row.map(field => `"${field}"`).join(','))
  //     .join('\n');

  //   const blob = new Blob([csvContent], { type: 'text/csv' });
  //   const url = window.URL.createObjectURL(blob);
  //   const link = document.createElement('a');
  //   link.href = url;
  //   link.download = `registrations-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  //   link.click();
  //   window.URL.revokeObjectURL(url);
  // };

  const allSelected = selectedRegistrations.length === registrations.length;
  const someSelected = selectedRegistrations.length > 0;

  const clearFilters = () => {
    setChurchFilter('all');
    setCategoryFilter('all');
    setRegionFilter('all');
    setCustomFieldFilters({});
    setSearchQuery('');
  };

  const hasActiveFilters = churchFilter !== 'all' || categoryFilter !== 'all' || regionFilter !== 'all' ||
    Object.keys(customFieldFilters).length > 0 || searchQuery.trim() !== '';
  
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
  };

  const getRegistrationDisplayName = (reg: Registration) => {
    return `${reg.surname || ""} ${reg.middle_name || ""} ${reg.last_name || ""}`.trim();
  };

  // Determine human-friendly payment status for a registration
  const getPaymentStatus = (reg: Registration) => {
    if (reg.has_paid) {
      return { label: 'Paid', variant: 'default' as const, className: '' };
    }
    if (registrationsWithPayments.has(reg.id)) {
      return { label: 'Partly Paid', variant: 'secondary' as const, className: 'bg-amber-500 text-white hover:bg-amber-600 border-transparent' };
    }
    return { label: 'Unpaid', variant: 'destructive' as const, className: '' };
  };

  // Helper function to get custom field name by ID
  //@ts-ignore
  const getCustomFieldName = (fieldId: string): string => {
    const field = customFields.find(f => f.id === fieldId);
    return field?.field_name || fieldId;
  };

  // Helper function to format custom field response
  const formatCustomFieldResponse = (field: CustomField, value: any): string => {
    if (value === null || value === undefined || value === '') return 'N/A';
    
    if (field.field_type === 'checkbox') {
      return value ? 'Yes' : 'No';
    }
    
    if (field.field_type === 'dropdown' && field.options) {
      // For dropdown fields, show the actual option value
      return String(value);
    }
    
    if (field.field_type === 'date') {
      try {
        return format(new Date(value), 'MMM dd, yyyy');
      } catch {
        return String(value);
      }
    }
    
    return String(value);
  };

  // Group registrations by region
  const groupedByRegion = useMemo(() => {
    const grouped: Record<string, Registration[]> = {};
    registrations.forEach((reg) => {
      const church = churches.find((c) => c.id === reg.church_id);
      const region = (church?.region?.trim() || '');
      const key = region === '' ? 'No region' : region;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(reg);
    });
    return grouped;
  }, [registrations, churches]);

  // Group custom field responses by field with options
  //@ts-ignore
  const groupedCustomFieldResponses = useMemo(() => {
    const grouped: Record<string, Record<string, Registration[]>> = {};
    
    customFields.forEach(field => {
      if (field.options && field.options.length > 0) {
        grouped[field.id] = {};
        
        // Initialize groups for each option
        field.options.forEach(option => {
          grouped[field.id][option] = [];
        });
        
        // Add "Other" group for any responses not in options
        grouped[field.id]['Other'] = [];
        
        // Group registrations by their response to this field
        registrations.forEach(reg => {
          const response = reg.custom_field_responses[field.id];
          if (response !== null && response !== undefined && response !== '') {
            const responseStr = String(response);
            if (field.options!.includes(responseStr)) {
              grouped[field.id][responseStr].push(reg);
            } else {
              grouped[field.id]['Other'].push(reg);
            }
          }
        });
      }
    });
    
    return grouped;
  }, [customFields, registrations]);

  // Filter registrations by church region
  const filteredByRegion = useMemo(() => {
    if (regionFilter === 'all') return registrations;
    return registrations.filter((reg) => {
      const church = churches.find((c) => c.id === reg.church_id);
      const value = (church?.region || '').trim();
      if (regionFilter === 'empty') {
        return value === '';
      }
      return value.toLowerCase() === regionFilter.toLowerCase();
    });
  }, [registrations, churches, regionFilter]);

  // Filter registrations by custom fields
  const filteredByCustomFields = useMemo(() => {
    if (Object.keys(customFieldFilters).length === 0) return filteredByRegion;
    
    return filteredByRegion.filter(reg => {
      return Object.entries(customFieldFilters).every(([fieldId, filterValue]) => {
        if (filterValue === 'all') return true;
        
        const response = reg.custom_field_responses[fieldId];
        if (response === null || response === undefined || response === '') {
          return filterValue === 'empty';
        }
        
        return String(response) === filterValue;
      });
    });
  }, [filteredByRegion, customFieldFilters]);

  // Update the final registrations list to use custom field filtering
  const finalRegistrations = searchQuery.trim() 
    ? filteredByCustomFields.filter((reg) => {
        const query = searchQuery.toLowerCase();
        const camperCode = reg.camper_code?.toLowerCase() || "";
        const fullName = `${reg.surname || ""} ${reg.middle_name || ""} ${reg.last_name || ""}`.toLowerCase();
        const email = reg.email?.toLowerCase() || "";
        const phone = reg.phone_number?.toLowerCase() || "";
        return camperCode.includes(query) || fullName.includes(query) || email.includes(query) || phone.includes(query);
      })
    : filteredByCustomFields;

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(finalRegistrations.length / rowsPerPage));
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const displayStart = finalRegistrations.length === 0 ? 0 : startIndex + 1;
  const displayEnd = finalRegistrations.length === 0 ? 0 : Math.min(endIndex, finalRegistrations.length);
  const paginatedRegistrations = finalRegistrations.slice(startIndex, endIndex);

  // Reset to first page when filters change
  const resetPagination = () => {
    setCurrentPage(1);
  };

  // Handle pagination changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRowsPerPageChange = (value: string) => {
    setRowsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  // Reset pagination when filters change
  useMemo(() => {
    resetPagination();
  }, [churchFilter, categoryFilter, regionFilter, customFieldFilters, searchQuery]);

  const toggleRowExpansion = (registrationId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(registrationId)) {
      newExpanded.delete(registrationId);
    } else {
      newExpanded.add(registrationId);
    }
    setExpandedRows(newExpanded);
  };

  const handleCustomFieldFilterChange = (fieldId: string, value: string) => {
    setCustomFieldFilters(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  // Export functions
  const prepareRegistrationData = (registration: Registration) => {
    const church = churches.find(c => c.id === registration.church_id);
    const category = categories.find(c => c.id === registration.category_id);
    
    const baseData = {
      'Camper Code': registration.camper_code || 'N/A',
      'Surname': registration.surname || '',
      'Middle Name': registration.middle_name || '',
      'Last Name': registration.last_name || '',
      'Full Name': getRegistrationDisplayName(registration),
      'Age': registration.age,
      'Email': registration.email || 'N/A',
      'Phone': registration.phone_number || 'N/A',
      'Emergency Contact Name': registration.emergency_contact_name || 'N/A',
      'Emergency Contact Phone': registration.emergency_contact_phone || 'N/A',
      'Church': church?.name || 'N/A',
      'Church Area': church?.area || 'N/A',
      'Church District': church?.district || 'N/A',
      'Church Region': church?.region || 'N/A',
      'Category': category?.name || 'N/A',
      'Total Amount': registration.total_amount,
      'Payment Status': getPaymentStatus(registration).label,
      'Check-in Status': registration.has_checked_in ? 'Checked In' : 'Not Checked In',
      'Registration Date': format(new Date(registration.registration_date), 'yyyy-MM-dd HH:mm:ss'),
    };

    // Add custom field responses
    const customFieldData: Record<string, any> = {};
    Object.entries(registration.custom_field_responses).forEach(([fieldId, value]) => {
      const field = customFields.find(f => f.id === fieldId);
      if (field) {
        customFieldData[field.field_name] = formatCustomFieldResponse(field, value);
      }
    });

    return { ...baseData, ...customFieldData };
  };

  const exportFilteredData = async () => {
    if (finalRegistrations.length === 0) return;

    setIsExporting(true);
    setExportProgress('Preparing data for export...');

    try {
      // Simulate processing time for better UX
      await new Promise(resolve => setTimeout(resolve, 500));

      setExportProgress('Processing registrations...');
      
      const exportData = finalRegistrations.map(prepareRegistrationData);

      setExportProgress('Creating Excel file...');
      await new Promise(resolve => setTimeout(resolve, 300));

      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Add main registrations sheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Auto-size columns
      const colWidths = Object.keys(exportData[0] || {}).map(key => ({
        wch: Math.max(key.length, 15)
      }));
      ws['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(wb, ws, 'Registrations');

      setExportProgress('Finalizing export...');
      await new Promise(resolve => setTimeout(resolve, 200));

      // Generate filename with filters info
      let filename = 'registrations';
      const filterParts = [];
      
      if (churchFilter !== 'all') {
        const church = churches.find(c => c.id === churchFilter);
        if (church) filterParts.push(`church-${church.name.replace(/[^a-zA-Z0-9]/g, '-')}`);
      }
      
      if (categoryFilter !== 'all') {
        const category = categories.find(c => c.id === categoryFilter);
        if (category) filterParts.push(`category-${category.name.replace(/[^a-zA-Z0-9]/g, '-')}`);
      }
      
      if (regionFilter !== 'all') {
        filterParts.push(`region-${regionFilter.replace(/[^a-zA-Z0-9]/g, '-')}`);
      }
      
      if (searchQuery.trim()) {
        filterParts.push(`search-${searchQuery.trim().replace(/[^a-zA-Z0-9]/g, '-')}`);
      }
      
      if (filterParts.length > 0) {
        filename += `-${filterParts.join('-')}`;
      }
      
      filename += `-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;

      // Download file
      XLSX.writeFile(wb, filename);

      setExportProgress('Export completed!');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error('Export failed:', error);
      setExportProgress('Export failed. Please try again.');
      await new Promise(resolve => setTimeout(resolve, 2000));
    } finally {
      setIsExporting(false);
      setExportProgress('');
    }
  };

  const exportGroupedData = async () => {
    if (finalRegistrations.length === 0) return;

    setIsExporting(true);
    setExportProgress('Preparing grouped data for export...');

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      // Create workbook
      const wb = XLSX.utils.book_new();

      setExportProgress('Processing regional groupings...');
      await new Promise(resolve => setTimeout(resolve, 300));

      // Add regions sheet
      const regionData: any[] = [];
      Object.entries(groupedByRegion).forEach(([region, regs]) => {
        regs.forEach(reg => {
          regionData.push({
            'Region': region,
            ...prepareRegistrationData(reg)
          });
        });
      });

      if (regionData.length > 0) {
        const regionWs = XLSX.utils.json_to_sheet(regionData);
        const colWidths = Object.keys(regionData[0] || {}).map(key => ({
          wch: Math.max(key.length, 15)
        }));
        regionWs['!cols'] = colWidths;
        XLSX.utils.book_append_sheet(wb, regionWs, 'By Region');
      }

      setExportProgress('Processing custom field groupings...');
      await new Promise(resolve => setTimeout(resolve, 300));

      // Add custom field groupings sheets
      let sheetIndex = 0;
      for (const [fieldId, groups] of Object.entries(groupedCustomFieldResponses)) {
        const field = customFields.find(f => f.id === fieldId);
        if (!field) continue;

        const fieldData: any[] = [];
        Object.entries(groups).forEach(([option, regs]) => {
          regs.forEach(reg => {
            fieldData.push({
              [field.field_name]: option,
              ...prepareRegistrationData(reg)
            });
          });
        });

        if (fieldData.length > 0) {
          const fieldWs = XLSX.utils.json_to_sheet(fieldData);
          const colWidths = Object.keys(fieldData[0] || {}).map(key => ({
            wch: Math.max(key.length, 15)
          }));
          fieldWs['!cols'] = colWidths;
          
          // Truncate sheet name if too long (Excel limit is 31 characters)
          let sheetName = `By ${field.field_name}`;
          if (sheetName.length > 31) {
            sheetName = sheetName.substring(0, 28) + '...';
          }
          
          XLSX.utils.book_append_sheet(wb, fieldWs, sheetName);
          sheetIndex++;
        }
      }

      setExportProgress('Creating summary sheet...');
      await new Promise(resolve => setTimeout(resolve, 200));

      // Add summary sheet
      const summaryData = [
        { 'Metric': 'Total Registrations', 'Count': finalRegistrations.length },
        { 'Metric': 'Paid Registrations', 'Count': finalRegistrations.filter(r => r.has_paid).length },
        { 'Metric': 'Unpaid Registrations', 'Count': finalRegistrations.filter(r => !r.has_paid).length },
        { 'Metric': 'Checked In', 'Count': finalRegistrations.filter(r => r.has_checked_in).length },
        { 'Metric': 'Not Checked In', 'Count': finalRegistrations.filter(r => !r.has_checked_in).length },
        { 'Metric': '', 'Count': '' }, // Empty row
        { 'Metric': 'Regional Breakdown', 'Count': '' },
        ...Object.entries(groupedByRegion).map(([region, regs]) => ({
          'Metric': `  ${region}`,
          'Count': regs.length
        }))
      ];

      const summaryWs = XLSX.utils.json_to_sheet(summaryData);
      summaryWs['!cols'] = [{ wch: 25 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

      setExportProgress('Finalizing grouped export...');
      await new Promise(resolve => setTimeout(resolve, 200));

      // Generate filename
      const filename = `registrations-grouped-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;

      // Download file
      XLSX.writeFile(wb, filename);

      setExportProgress('Grouped export completed!');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error('Grouped export failed:', error);
      setExportProgress('Grouped export failed. Please try again.');
      await new Promise(resolve => setTimeout(resolve, 2000));
    } finally {
      setIsExporting(false);
      setExportProgress('');
    }
  };

  const exportSelectedData = async () => {
    if (selectedRegistrations.length === 0) return;

    setIsExporting(true);
    setExportProgress('Preparing selected registrations for export...');

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const selectedRegs = finalRegistrations.filter(reg => 
        selectedRegistrations.includes(reg.id)
      );

      setExportProgress('Processing selected registrations...');
      
      const exportData = selectedRegs.map(prepareRegistrationData);

      setExportProgress('Creating Excel file...');
      await new Promise(resolve => setTimeout(resolve, 300));

      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Add selected registrations sheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Auto-size columns
      const colWidths = Object.keys(exportData[0] || {}).map(key => ({
        wch: Math.max(key.length, 15)
      }));
      ws['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(wb, ws, 'Selected Registrations');

      setExportProgress('Finalizing export...');
      await new Promise(resolve => setTimeout(resolve, 200));

      const filename = `registrations-selected-${selectedRegistrations.length}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;

      // Download file
      XLSX.writeFile(wb, filename);

      setExportProgress('Selected export completed!');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error('Selected export failed:', error);
      setExportProgress('Selected export failed. Please try again.');
      await new Promise(resolve => setTimeout(resolve, 2000));
    } finally {
      setIsExporting(false);
      setExportProgress('');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <>
        {/* Filters - Always visible */}
        <div className="mb-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Church:</label>
              <Select value={churchFilter} onValueChange={setChurchFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All churches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All churches</SelectItem>
                  {churches.map((church) => (
                    <SelectItem key={church.id} value={church.id}>
                      {church.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Category:</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Region:</label>
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All regions</SelectItem>
                  <SelectItem value="empty">No region</SelectItem>
                  {regionOptions.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom Field Filters */}
            {customFields.map((field) => (
              <div key={field.id} className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">{field.field_name}:</label>
                <Select 
                  value={customFieldFilters[field.id] || 'all'} 
                  onValueChange={(value) => handleCustomFieldFilterChange(field.id, value)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder={`All ${field.field_name.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All {field.field_name.toLowerCase()}</SelectItem>
                    <SelectItem value="empty">No response</SelectItem>
                    {field.options && field.options.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                    {!field.options && (
                      <SelectItem value="has_value">Has response</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            ))}

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Clear filters
              </Button>
            )}
          </div>
        </div>

        {/* Loading skeleton */}
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 animate-pulse rounded" />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      {/* Search and Filters - Always visible */}
      <div className="mb-4 p-4 bg-muted/50 rounded-lg space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Search Registrations:</span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              value={searchQuery}
              onChange={handleSearchInputChange}
              placeholder="Search by camper code, name, email, or phone..."
              className="pl-10"
            />
          </div>
          
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Church:</label>
            <Select value={churchFilter} onValueChange={setChurchFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All churches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All churches</SelectItem>
                {churches.map((church) => (
                  <SelectItem key={church.id} value={church.id}>
                    {church.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Category:</label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Region:</label>
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All regions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All regions</SelectItem>
                <SelectItem value="empty">No region</SelectItem>
                {regionOptions.map((region) => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Field Filters */}
          {customFields.map((field) => (
            <div key={field.id} className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">{field.field_name}:</label>
              <Select 
                value={customFieldFilters[field.id] || 'all'} 
                onValueChange={(value) => handleCustomFieldFilterChange(field.id, value)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder={`All ${field.field_name.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All {field.field_name.toLowerCase()}</SelectItem>
                  <SelectItem value="empty">No response</SelectItem>
                  {field.options && field.options.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                  {!field.options && (
                    <SelectItem value="has_value">Has response</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          ))}

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Clear all
            </Button>
          )}
        </div>
        
        {hasActiveFilters && (
          <div className="mt-2 text-sm text-muted-foreground">
            {searchQuery.trim() && (
              <span>Search: "{searchQuery}" • </span>
            )}
            Showing {finalRegistrations.length} registration(s) 
            {(churchFilter !== 'all' || categoryFilter !== 'all' || regionFilter !== 'all' || Object.keys(customFieldFilters).length > 0) && ' with active filters'}
          </div>
        )}
      </div>


      {/* Tabs Container */}
      <Tabs defaultValue="registrations" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="registrations">Registrations</TabsTrigger>
          <TabsTrigger value="groupings">Groupings</TabsTrigger>
        </TabsList>

        {/* Registrations Tab */}
        <TabsContent value="registrations" className="space-y-4">
          {/* Empty state */}
          {finalRegistrations.length === 0 && (
            <div className="text-center py-12">
              <UserCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">
                {hasActiveFilters ? 'No registrations match your filters' : 'No registrations yet'}
              </h3>
              <p className="text-muted-foreground">
                {hasActiveFilters 
                  ? 'Try adjusting your filter criteria or clear all filters to see all registrations.'
                  : 'When people register for this camp, they\'ll appear here.'
                }
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="mt-4"
                >
                  Clear all filters
                </Button>
              )}
            </div>
          )}

          {/* View Options and Export */}
          {finalRegistrations.length > 0 && (
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllDetails(!showAllDetails)}
                >
                  {showAllDetails ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                  {showAllDetails ? 'Hide Details' : 'Show All Details'}
                </Button>
                
                {showAllDetails && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedRows(new Set(finalRegistrations.map(r => r.id)))}
                    >
                      Expand All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedRows(new Set())}
                    >
                      Collapse All
                    </Button>
                  </div>
                )}
              </div>

              {/* Export Options */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportFilteredData}
                  disabled={isExporting || finalRegistrations.length === 0}
                >
                  {isExporting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Export Filtered Data
                </Button>
              </div>
            </div>
          )}

          {/* Export Progress Indicator */}
          {isExporting && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                <div>
                  <div className="text-sm font-medium text-blue-900">Exporting Data</div>
                  <div className="text-sm text-blue-700">{exportProgress}</div>
                </div>
              </div>
            </div>
          )}

          {/* Table and related UI - Only show when there are registrations */}
          {finalRegistrations.length > 0 && (
            <>
              {/* Bulk Actions */}
              {someSelected && (
                <div className="mb-4 p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">
                      {selectedRegistrations.length} registration(s) selected
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {/* Basic Actions */}
                    <Button size="sm" variant="outline">
                      Mark as Paid
                    </Button>
                    <Button size="sm" variant="outline">
                      Check In
                    </Button>
                    
                    {/* QR Code Actions */}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={handleGenerateQrPdf}
                      disabled={isGeneratingPdf}
                    >
                      {isGeneratingPdf ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <QrCode className="h-4 w-4 mr-2" />
                      )}
                      Generate QR PDF
                    </Button>
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={handleSendQrEmails}
                      disabled={isEmailLoading}
                    >
                      {isEmailLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Email QR Codes
                    </Button>
                    
                    {/* Export Actions */}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={exportSelectedData}
                      disabled={isExporting}
                    >
                      {isExporting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      Export Selected
                    </Button>
                  </div>
                </div>
              )}

              {/* QR Progress Indicator */}
              {(isGeneratingPdf && pdfProgress) && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 text-green-600 animate-spin" />
                    <div>
                      <div className="text-sm font-medium text-green-900">Generating QR PDF</div>
                      <div className="text-sm text-green-700">{pdfProgress}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      {showAllDetails && <TableHead className="w-[30px]"></TableHead>}
                      <TableHead>Camper Code</TableHead>
                      <TableHead>Participant</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Emergency Contact</TableHead>
                      {showAllDetails && <TableHead>Church</TableHead>}
                      {showAllDetails && <TableHead>Category</TableHead>}
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead className="w-[70px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRegistrations.map((registration) => {
                      const isExpanded = expandedRows.has(registration.id);
                      const church = churches.find(c => c.id === registration.church_id);
                      const category = categories.find(c => c.id === registration.category_id);
                      
                      return (
                        <>
                          <TableRow key={registration.id} id={`registration-${registration.id}`}>
                            <TableCell>
                              <Checkbox
                                checked={selectedRegistrations.includes(registration.id)}
                                onCheckedChange={(checked) => 
                                  handleSelectRegistration(registration.id, checked as boolean)
                                }
                              />
                            </TableCell>
                            
                            {showAllDetails && (
                              <TableCell>
                                {Object.keys(registration.custom_field_responses).length > 0 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleRowExpansion(registration.id)}
                                    className="p-0 h-6 w-6"
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                  </Button>
                                )}
                              </TableCell>
                            )}
                            
                            <TableCell>{registration.camper_code}</TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium">
                                  {registration.surname} {registration.middle_name} {registration.last_name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Age: {registration.age}
                                </div>
                              </div>
                            </TableCell>
                            
                            <TableCell>
                              <div className="space-y-1">
                                {registration.email && (
                                  <div className="flex items-center space-x-1 text-sm">
                                    <Mail className="h-3 w-3" />
                                    <span>{registration.email}</span>
                                  </div>
                                )}
                                <div className="flex items-center space-x-1 text-sm">
                                  <Phone className="h-3 w-3" />
                                  <span>{registration.phone_number}</span>
                                </div>
                              </div>
                            </TableCell>
                            
                            <TableCell>
                              <div className="space-y-1">
                                <div className="text-sm font-medium">
                                  {registration.emergency_contact_name}
                                </div>
                                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  <span>{registration.emergency_contact_phone}</span>
                                </div>
                              </div>
                            </TableCell>
                            
                            {showAllDetails && (
                              <TableCell>
                                <div className="text-sm">
                                  {church?.name || 'N/A'}
                                </div>
                              </TableCell>
                            )}
                            
                            {showAllDetails && (
                              <TableCell>
                                <div className="text-sm">
                                  {category?.name || 'N/A'}
                                </div>
                              </TableCell>
                            )}
                            
                            <TableCell>
                              <div className="font-medium">
                                {formatCurrency(registration.total_amount)}
                              </div>
                            </TableCell>
                            
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={updatePaymentMutation.isPending}
                              >
                                {(() => {
                                  const status = getPaymentStatus(registration);
                                  return (
                                    <Badge variant={status.variant} className={`cursor-pointer ${status.className}`}>
                                      {status.label === 'Unpaid' ? (
                                        <XCircle className="h-3 w-3 mr-1" />
                                      ) : (
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                      )}
                                      {status.label}
                                    </Badge>
                                  );
                                })()}
                              </Button>
                            </TableCell>
                            
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCheckinToggle(registration)}
                                disabled={updateCheckinMutation.isPending}
                              >
                                {registration.has_checked_in ? (
                                  <Badge variant="default" className="cursor-pointer">
                                    <UserCheck className="h-3 w-3 mr-1" />
                                    Checked In
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="cursor-pointer">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Not Checked In
                                  </Badge>
                                )}
                              </Button>
                            </TableCell>
                            
                            <TableCell>
                              <div className="text-sm">
                                {format(new Date(registration.registration_date), 'MMM dd, yyyy')}
                              </div>
                            </TableCell>
                            
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem
                                    onClick={() => onEditRegistration?.(registration)}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleCheckinToggle(registration)}
                                  >
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    Toggle Check-in
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleDeleteClick(registration)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Cancel Registration
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                          
                          {/* Expanded row for custom field details */}
                          {showAllDetails && isExpanded && Object.keys(registration.custom_field_responses).length > 0 && (
                            <TableRow>
                              <TableCell colSpan={showAllDetails ? 12 : 10} className="bg-muted/20">
                                <div className="p-4">
                                  <h4 className="font-medium mb-3">Custom Field Responses</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {Object.entries(registration.custom_field_responses).map(([fieldId, value]) => {
                                      const field = customFields.find(f => f.id === fieldId);
                                      if (!field) return null;
                                      
                                      return (
                                        <div key={fieldId} className="space-y-1">
                                          <div className="text-sm font-medium text-muted-foreground">
                                            {field.field_name}
                                          </div>
                                          <div className="text-sm">
                                            {formatCustomFieldResponse(field, value)}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              {true && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Rows per page:</span>
                    <Select value={rowsPerPage.toString()} onValueChange={handleRowsPerPageChange}>
                      <SelectTrigger className="w-[70px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                        <SelectItem value="200">500</SelectItem>
                        <SelectItem value="500">1000</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Showing {displayStart} to {displayEnd} of {finalRegistrations.length} entries
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className="w-8"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Groupings Tab */}
        <TabsContent value="groupings" className="space-y-4">
          {/* Groupings Header with Export */}
          {finalRegistrations.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium">Registration Groupings</h3>
                <p className="text-sm text-muted-foreground">
                  View registrations organized by regions and custom field responses
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={exportGroupedData}
                disabled={isExporting || finalRegistrations.length === 0}
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                )}
                Export Groupings
              </Button>
            </div>
          )}

          {/* Export Progress Indicator for Groupings */}
          {isExporting && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                <div>
                  <div className="text-sm font-medium text-blue-900">Exporting Grouped Data</div>
                  <div className="text-sm text-blue-700">{exportProgress}</div>
                </div>
              </div>
            </div>
          )}

          {/* Empty state for groupings */}
          {finalRegistrations.length === 0 && (
            <div className="text-center py-12">
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No data to group</h3>
              <p className="text-muted-foreground">
                {hasActiveFilters 
                  ? 'No registrations match your current filters to create groupings.'
                  : 'When registrations are available, you\'ll see them grouped by regions and custom fields here.'
                }
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Accordion type="multiple" className="w-full">
              {/* Group by Regions */}
              <AccordionItem key="regions" value="regions" className="border rounded-md px-4 mb-2">
                <AccordionTrigger className="py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold">Regions</span>
                    <Badge variant="secondary" className="text-xs">
                      {Object.values(groupedByRegion).reduce((acc, regs) => acc + regs.length, 0)} total
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Region</TableHead>
                          <TableHead className="w-[120px] text-right">Count</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(groupedByRegion).map(([region, regs]) => {
                          const key = `regions::${region}`;
                          const isOpen = expandedGroupRows.has(key);
                          return (
                            <React.Fragment key={region}>
                              <TableRow
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => toggleGroupRow('regions', region)}
                              >
                                <TableCell className="font-medium">{region}</TableCell>
                                <TableCell className="text-right">
                                  <Badge variant="outline" className="text-xs">
                                    {regs.length}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                              {isOpen && (
                                <TableRow>
                                  <TableCell colSpan={2} className="bg-muted/20">
                                    {regs.length > 0 ? (
                                      <div className="space-y-2 max-h-64 overflow-y-auto p-2">
                                        {regs.map((reg) => (
                                          <div key={reg.id} className="text-xs p-2 bg-background rounded border">
                                            <div className="font-medium">
                                              {getRegistrationDisplayName(reg)}
                                            </div>
                                            <div className="text-muted-foreground">{reg.camper_code}</div>
                                            <div className="flex items-center gap-2 mt-1">
                                              {(() => {
                                                const status = getPaymentStatus(reg);
                                                return (
                                                  <Badge
                                                    variant={status.variant}
                                                    className={`text-xs px-1 py-0 ${status.className}`}
                                                  >
                                                    {status.label}
                                                  </Badge>
                                                );
                                              })()}
                                              <Badge
                                                variant={reg.has_checked_in ? "default" : "secondary"}
                                                className="text-xs px-1 py-0"
                                              >
                                                {reg.has_checked_in ? "In" : "Out"}
                                              </Badge>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-xs text-muted-foreground text-center py-4">
                                        No registrations
                                      </div>
                                    )}
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {Object.entries(groupedCustomFieldResponses).map(([fieldId, groups]) => {
                const field = customFields.find((f) => f.id === fieldId);
                if (!field) return null;
                const totalResponses = Object.values(groups).reduce((total, regs) => total + regs.length, 0);

                return (
                  <AccordionItem key={fieldId} value={fieldId} className="border rounded-md px-4">
                    <AccordionTrigger className="py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-semibold">{field.field_name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {totalResponses} total responses
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Option</TableHead>
                              <TableHead className="w-[120px] text-right">Count</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {Object.entries(groups).map(([option, regs]) => {
                              const key = `${fieldId}::${option}`;
                              const isOpen = expandedGroupRows.has(key);
                              return (
                                <React.Fragment key={option}>
                                  <TableRow
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => toggleGroupRow(fieldId, option)}
                                  >
                                    <TableCell className="font-medium">{option}</TableCell>
                                    <TableCell className="text-right">
                                      <Badge variant="outline" className="text-xs">
                                        {regs.length}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                  {isOpen && (
                                    <TableRow>
                                      <TableCell colSpan={2} className="bg-muted/20">
                                        {regs.length > 0 ? (
                                          <div className="space-y-2 max-h-64 overflow-y-auto p-2">
                                            {regs.map((reg) => (
                                              <div key={reg.id} className="text-xs p-2 bg-background rounded border">
                                                <div className="font-medium">
                                                  {getRegistrationDisplayName(reg)}
                                                </div>
                                                <div className="text-muted-foreground">{reg.camper_code}</div>
                                                <div className="flex items-center gap-2 mt-1">
                                                  {(() => {
                                                    const status = getPaymentStatus(reg);
                                                    return (
                                                      <Badge
                                                        variant={status.variant}
                                                        className={`text-xs px-1 py-0 ${status.className}`}
                                                      >
                                                        {status.label}
                                                      </Badge>
                                                    );
                                                  })()}
                                                  <Badge
                                                    variant={reg.has_checked_in ? "default" : "secondary"}
                                                    className="text-xs px-1 py-0"
                                                  >
                                                    {reg.has_checked_in ? "In" : "Out"}
                                                  </Badge>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <div className="text-xs text-muted-foreground text-center py-4">
                                            No registrations
                                          </div>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Registration?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently cancel the registration for "
              {registrationToDelete?.surname} {registrationToDelete?.middle_name} {registrationToDelete?.last_name}
              ". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Registration</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteRegistrationMutation.isPending}
            >
              {deleteRegistrationMutation.isPending ? 'Cancelling...' : 'Cancel Registration'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
