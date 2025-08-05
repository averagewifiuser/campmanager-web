// src/pages/DashboardPage.tsx
import { useAuth } from '@/lib/auth-context';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Plus, Users, Calendar, DollarSign } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Handle success messages from navigation state
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the message after showing it
      setTimeout(() => setSuccessMessage(null), 5000);
      // Clear the navigation state
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate, location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

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
              variant="outline"
              size="sm"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md">
              {successMessage}
            </div>
          )}

          {/* Welcome Section */}
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Dashboard</h2>
            <p className="text-muted-foreground">
              Manage your camps and registrations from here.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Registrations</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  Total registrations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">GH₵0</div>
                <p className="text-xs text-muted-foreground">
                  Total revenue collected
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Checked In</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  Participants checked in
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button 
                  className="h-20 flex flex-col space-y-2"
                  onClick={() => navigate('/camps/create')}
                >
                  <Plus className="h-6 w-6" />
                  <span>Create New Camp</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col space-y-2"
                  onClick={() => navigate('/camps')}
                >
                  <Users className="h-6 w-6" />
                  <span>Manage Camps</span>
                </Button>
                
                <Button variant="outline" className="h-20 flex flex-col space-y-2">
                  <Calendar className="h-6 w-6" />
                  <span>Manage Events</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Camps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No camps created yet</p>
                <p className="text-sm">Create your first camp to get started!</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};