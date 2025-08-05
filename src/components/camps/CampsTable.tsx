// src/components/camps/CampsTable.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye, 
  Users, 
  Calendar,
  MapPin,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { formatCurrency, formatDate } from '@/lib/utils';
import { useDeleteCamp } from '@/hooks/useCamps';
import type { Camp } from '@/lib/types';

interface CampsTableProps {
  camps: Camp[];
  isLoading?: boolean;
}

export const CampsTable: React.FC<CampsTableProps> = ({ camps, isLoading }) => {
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campToDelete, setCampToDelete] = useState<Camp | null>(null);
  
  const deleteCampMutation = useDeleteCamp();

  const getCampStatus = (camp: Camp) => {
    const now = new Date();
    const startDate = new Date(camp.start_date);
    const endDate = new Date(camp.end_date);
    const registrationDeadline = new Date(camp.registration_deadline);

    if (!camp.is_active) {
      return { label: 'Inactive', variant: 'secondary' as const };
    }
    
    if (now > endDate) {
      return { label: 'Completed', variant: 'outline' as const };
    }
    
    if (now >= startDate) {
      return { label: 'In Progress', variant: 'default' as const };
    }
    
    if (now > registrationDeadline) {
      return { label: 'Registration Closed', variant: 'destructive' as const };
    }
    
    return { label: 'Open for Registration', variant: 'default' as const };
  };

  const handleDeleteClick = (camp: Camp) => {
    setCampToDelete(camp);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!campToDelete) return;
    
    try {
      await deleteCampMutation.mutateAsync(campToDelete.id);
      setDeleteDialogOpen(false);
      setCampToDelete(null);
    } catch (error) {
      console.error('Failed to delete camp:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (camps.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">No camps yet</h3>
        <p className="text-muted-foreground mb-4">
          Create your first camp to get started managing registrations.
        </p>
        <Button onClick={() => navigate('/camps/create')}>
          Create Your First Camp
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Camp</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Fee</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {camps.map((camp) => {
              const status = getCampStatus(camp);
              
              return (
                <TableRow 
                  key={camp.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/camps/${camp.id}`)}
                >
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{camp.name}</div>
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {camp.description}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">
                        {formatDate(camp.start_date)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        to {formatDate(camp.end_date)}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{camp.location}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant={status.variant}>
                      {status.label}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{camp.capacity}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {formatCurrency(camp.base_fee)}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="h-8 w-8 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/camps/${camp.id}`);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/camps/${camp.id}/edit`);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Camp
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(camp);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Camp
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{campToDelete?.name}" and all associated 
              registrations. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteCampMutation.isPending}
            >
              {deleteCampMutation.isPending ? 'Deleting...' : 'Delete Camp'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};