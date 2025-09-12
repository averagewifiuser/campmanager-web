import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/use-toast';
import api from '../lib/api';
import QRScanner from '../components/food/QRScanner';

interface Food {
  id: string;
  name: string;
  quantity: number;
  vendor: string;
  date: string;
  category: string;
  camp_id: string;
}

interface CamperQRData {
  camper_id: string;
  camper_code: string;
  type: 'camper_identification';
}

type ScanMode = 'meal-selection' | 'qr-scanning';
type MealType = 'lunch' | 'supper';

const FoodAllocationsPage: React.FC = () => {
  const { campId } = useParams<{ campId: string }>();
  const { toast } = useToast();
  
  // State management
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [availableFoods, setAvailableFoods] = useState<Food[]>([]);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [scanMode, setScanMode] = useState<ScanMode>('meal-selection');
  //@ts-ignore
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCampers, setScannedCampers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Get today's date in UTC
  const today = new Date().toISOString().split('T')[0];

  // Fetch available foods for today and selected meal type
  const fetchTodaysFoods = async () => {
    if (!campId) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/camps/${campId}/foods`);
      const foods = response.data.data;
      
      // Filter foods for today and selected meal type
      const todaysFoods = foods.filter((food: Food) => {
        const foodDate = new Date(food.date).toISOString().split('T')[0];
        return foodDate === today && food.category === mealType;
      });
      
      setAvailableFoods(todaysFoods);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch today's foods",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle QR scan result
  const handleQRScan = (data: string) => {
    try {
      const camperData: CamperQRData = JSON.parse(data);
      
      if (camperData.type === 'camper_identification') {
        allocateFood(camperData);
      } else {
        toast({
          title: "Invalid QR Code",
          description: "This QR code is not for camper identification",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Invalid QR Code",
        description: "Could not read QR code data",
        variant: "destructive",
      });
    }
  };

  // Handle QR scan error
  const handleQRError = (error: string) => {
    toast({
      title: "Scanner Error",
      description: error,
      variant: "destructive",
    });
  };

  // Allocate food to camper
  const allocateFood = async (camperData: CamperQRData) => {
    if (!selectedFood || !campId) return;

    try {
      await api.post(`/camps/${campId}/food-allocations`, {
        data: {
          food_id: selectedFood.id,
          registration_id: camperData.camper_id,
        }
      });

      setScannedCampers(prev => [...prev, camperData.camper_code]);
      
      toast({
        title: "Success",
        description: `Food allocated to camper ${camperData.camper_code}`,
        variant: "default",
      });

      // Auto-switch back to meal selection after successful allocation
      setTimeout(() => {
        setScanMode('meal-selection');
        setSelectedFood(null);
      }, 1500);

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to allocate food",
        variant: "destructive",
      });
    }
  };

  // Simulate QR code scanning (fallback for testing)
  const simulateQRScan = () => {
    const mockCamperData: CamperQRData = {
      camper_id: `camper_${Date.now()}`,
      camper_code: `C${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      type: 'camper_identification'
    };
    
    handleQRScan(JSON.stringify(mockCamperData));
  };

  // Reset to meal selection
  const resetToMealSelection = () => {
    setScanMode('meal-selection');
    setSelectedFood(null);
    setIsScanning(false);
  };

  // Fetch foods when meal type changes
  useEffect(() => {
    fetchTodaysFoods();
  }, [mealType, campId]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Food Allocation
            </CardTitle>
            <p className="text-sm text-gray-600">
              {new Date().toLocaleDateString()} - {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
            </p>
          </CardHeader>
        </Card>

        {/* Meal Type Selection */}
        {scanMode === 'meal-selection' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Meal Type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={mealType} onValueChange={(value: MealType) => setMealType(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select meal type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lunch">Lunch</SelectItem>
                  <SelectItem value="supper">Supper</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Available Foods */}
        {scanMode === 'meal-selection' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Available Meals</CardTitle>
              <p className="text-sm text-gray-600">
                {availableFoods.length} meals available for {mealType}
              </p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Loading meals...</p>
                </div>
              ) : availableFoods.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No meals available for {mealType} today</p>
                  <Button 
                    onClick={fetchTodaysFoods} 
                    variant="outline" 
                    className="mt-4"
                  >
                    Refresh
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableFoods.map((food) => (
                    <div
                      key={food.id}
                      className="p-4 border rounded-lg cursor-pointer hover:bg-blue-50 transition-colors"
                      onClick={() => {
                        setSelectedFood(food);
                        setScanMode('qr-scanning');
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">{food.name}</h3>
                          <p className="text-sm text-gray-600">by {food.vendor}</p>
                        </div>
                        <Badge variant="secondary">
                          {food.quantity} available
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* QR Scanning Mode */}
        {scanMode === 'qr-scanning' && selectedFood && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Scan Camper QR Code</CardTitle>
              <p className="text-sm text-gray-600">
                Allocating: {selectedFood.name}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* QR Scanner */}
              <QRScanner
                onScan={handleQRScan}
                onError={handleQRError}
                isActive={scanMode === 'qr-scanning'}
              />

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button 
                  onClick={simulateQRScan}
                  variant="outline"
                  className="w-full h-12 text-lg"
                >
                  Simulate QR Scan (Testing)
                </Button>
                
                <Button 
                  onClick={resetToMealSelection}
                  variant="outline"
                  className="w-full"
                >
                  Back to Meal Selection
                </Button>
              </div>

              {/* Scanned Campers Count */}
              {scannedCampers.length > 0 && (
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    {scannedCampers.length} camper(s) allocated food today
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">{scannedCampers.length}</p>
                <p className="text-sm text-gray-600">Allocated Today</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{availableFoods.length}</p>
                <p className="text-sm text-gray-600">Available Meals</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FoodAllocationsPage;
