// src/pages/ChurchesManagementPage.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus,
  Edit2,
  Trash2,
  Church,
  Users
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
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useCamp } from '@/hooks/useCamps';
import { useChurches } from '@/hooks/useChurches';
import { formatDate } from '@/lib/utils';

interface Church {
  id: string;
  name: string;
  camp_id: string;
  created_at: string;
  updated_at: string;
  // Additional fields that might come from stats
  registration_count?: number;
}

export const ChurchesManagementPage: React.FC = () => {
  const { campId } = useParams<{ campId: string }>();
  const navigate = useNavigate();
  
  // State for dialogs
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedChurch, setSelectedChurch] = useState<Church | null>(null);
  
  // Form states
  const [newChurchName, setNewChurchName] = useState('');
  const [editChurchName, setEditChurchName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data fetching
  const { data: camp, isLoading: campLoading } = useCamp(campId!);
  const { 
    data: churches = [], 
    isLoading: churchesLoading,
    createChurch,
    updateChurch,
    deleteChurch
  } = useChurches(campId!);

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

  const handleCreateChurch = async () => {
    if (!newChurchName.trim()) return;
    
    setIsSubmitting(true);
    try {
      await createChurch({ name: newChurchName.trim() });
      setNewChurchName('');
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create church:', error);
      // TODO: Show error toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditChurch = async () => {
    if (!selectedChurch || !editChurchName.trim()) return;
    
    setIsSubmitting(true);
    try {
      await updateChurch(selectedChurch.id, { name: editChurchName.trim() });
      setEditChurchName('');
      setSelectedChurch(null);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update church:', error);
      // TODO: Show error toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteChurch = async (church: Church) => {
    try {
      await deleteChurch(church.id);
      // TODO: Show success toast
    } catch (error) {
      console.error('Failed to delete church:', error);
      // TODO: Show error toast
    }
  };

  const openEditDialog = (church: Church) => {
    setSelectedChurch(church);
    setEditChurchName(church.name);
    setIsEditDialogOpen(true);
  };

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
                <h1 className="text-xl font-semibold">Manage Churches</h1>
                <p className="text-sm text-muted-foreground">{camp.name}</p>
              </div>
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Church
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Church</DialogTitle>
                  <DialogDescription>
                    Add a new church that participants can register under.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="church-name">Church Name</Label>
                    <Input
                      id="church-name"
                      value={newChurchName}
                      onChange={(e) => setNewChurchName(e.target.value)}
                      placeholder="Enter church name"
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateChurch()}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateChurch}
                    disabled={!newChurchName.trim() || isSubmitting}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Church'}
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
          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Church className="h-5 w-5 mr-2" />
                Churches Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {churches.length}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Churches</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {churches.filter(c => (c.registration_count || 0) > 0).length}
                  </div>
                  <p className="text-sm text-muted-foreground">With Registrations</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {churches.reduce((sum, c) => sum + (c.registration_count || 0), 0)}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Participants</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Churches List */}
          <Card>
            <CardHeader>
              <CardTitle>Churches List</CardTitle>
            </CardHeader>
            <CardContent>
              {churchesLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : churches.length === 0 ? (
                <div className="text-center py-8">
                  <Church className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No churches added yet</p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Church
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {churches.map((church) => (
                    <div
                      key={church.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Church className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <h3 className="font-medium">{church.name}</h3>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {church.registration_count || 0} participants
                            </span>
                            <span>Added {formatDate(church.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(church)}
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
                              <AlertDialogTitle>Delete Church</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{church.name}"? 
                                {church.registration_count && church.registration_count > 0 && (
                                  <span className="text-destructive">
                                    {" "}This church has {church.registration_count} registered participants.
                                  </span>
                                )}
                                {" "}This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteChurch(church)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Delete Church
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Church</DialogTitle>
              <DialogDescription>
                Update the church name.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-church-name">Church Name</Label>
                <Input
                  id="edit-church-name"
                  value={editChurchName}
                  onChange={(e) => setEditChurchName(e.target.value)}
                  placeholder="Enter church name"
                  onKeyDown={(e) => e.key === 'Enter' && handleEditChurch()}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleEditChurch}
                disabled={!editChurchName.trim() || isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Update Church'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};