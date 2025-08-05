// src/pages/CampsPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CampsTable } from '@/components/camps/CampsTable';
import { useCamps } from '@/hooks/useCamps';
import { useAuth } from '@/lib/auth-context';
import type { Camp } from '@/lib/types';

export const CampsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: camps = [], isLoading, error } = useCamps();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter camps based on search and status
  const filteredCamps = camps.filter((camp: Camp) => {
    const matchesSearch = camp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         camp.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (statusFilter === 'all') return true;
    
    const now = new Date();
    const startDate = new Date(camp.start_date);
    const endDate = new Date(camp.end_date);
    const registrationDeadline = new Date(camp.registration_deadline);
    
    switch (statusFilter) {
      case 'active':
        return camp.is_active;
      case 'inactive':
        return !camp.is_active;
      case 'upcoming':
        return camp.is_active && now < startDate;
      case 'in-progress':
        return camp.is_active && now >= startDate && now <= endDate;
      case 'completed':
        return now > endDate;
      case 'registration-open':
        return camp.is_active && now <= registrationDeadline;
      default:
        return true;
    }
  });

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-destructive">
                <p>Failed to load camps. Please try again.</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">CM</span>
            </div>
            <h1 className="text-xl font-semibold">CampManager</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user?.full_name}
            </span>
            <Button
              onClick={() => navigate('/camps/create')}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Camp
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">My Camps</h2>
              <p className="text-muted-foreground">
                Manage and monitor all your camps in one place.
              </p>
            </div>
            
            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
            >
              Back to Dashboard
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Camps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{camps.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Camps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {camps.filter(camp => camp.is_active).length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {camps.filter(camp => {
                    const now = new Date();
                    const startDate = new Date(camp.start_date);
                    return camp.is_active && now < startDate;
                  }).length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {camps.filter(camp => {
                    const now = new Date();
                    const endDate = new Date(camp.end_date);
                    return now > endDate;
                  }).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search camps by name or location..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="w-full sm:w-48">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Camps</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="registration-open">Registration Open</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Camps Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                Camps ({filteredCamps.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CampsTable camps={filteredCamps} isLoading={isLoading} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};