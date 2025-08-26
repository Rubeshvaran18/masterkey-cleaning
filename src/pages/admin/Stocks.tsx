
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Package, AlertTriangle, Trash2 } from "lucide-react";
import { AddStockModal } from "@/components/modals/AddStockModal";
import { EditStockModal } from "@/components/modals/EditStockModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StockItem {
  id: string;
  item_name: string;
  category: string;
  quantity: number;
  minimum_stock: number;
  cost_per_unit: number;
  total_value: number;
  unit: string;
  supplier: string;
  last_updated: string;
}

const Stocks = () => {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStockItems();
  }, []);

  const fetchStockItems = async () => {
    try {
      const { data, error } = await supabase
        .from('stocks')
        .select('*')
        .order('item_name');

      if (error) throw error;
      setStockItems(data || []);
    } catch (error) {
      console.error('Error fetching stock items:', error);
      toast.error('Failed to fetch stock items');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStock = async (id: string) => {
    try {
      const { error } = await supabase
        .from('stocks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Stock item deleted successfully');
      fetchStockItems();
    } catch (error) {
      console.error('Error deleting stock item:', error);
      toast.error('Failed to delete stock item');
    }
  };

  const stats = [
    { label: "Total Items", value: stockItems.length.toString(), icon: Package, color: "text-blue-600" },
    { 
      label: "Low Stock Alerts", 
      value: stockItems.filter(item => item.quantity <= item.minimum_stock).length.toString(), 
      icon: AlertTriangle, 
      color: "text-red-600" 
    },
    { 
      label: "Total Stock Value", 
      value: `₹${stockItems.reduce((sum, item) => sum + (item.total_value || 0), 0).toLocaleString()}`, 
      icon: Package, 
      color: "text-green-600" 
    }
  ];

  const lowStockItems = stockItems.filter(item => item.quantity <= item.minimum_stock);

  if (loading) {
    return <div className="space-y-6"><div className="p-6">Loading...</div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Stock Management</h1>
        <AddStockModal onStockAdded={fetchStockItems} />
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Low Stock Alerts</strong>
            <div className="mt-2">
              {lowStockItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-red-100 rounded mt-2">
                  <span className="font-medium">{item.item_name}</span>
                  <Badge variant="destructive" className="text-xs">
                    {item.quantity} {item.unit} (Min: {item.minimum_stock})
                  </Badge>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Stock Items */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Stock Items</h2>
        
        <div className="space-y-4">
          {stockItems.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold">{item.item_name}</h3>
                      <Badge variant="secondary">{item.category}</Badge>
                      <Badge variant={item.quantity <= item.minimum_stock ? "destructive" : "default"}>
                        {item.quantity <= item.minimum_stock ? "Low Stock" : "In Stock"}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Quantity</p>
                        <p className="font-medium">{item.quantity} {item.unit}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Min Stock</p>
                        <p className="font-medium">{item.minimum_stock}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Cost/Unit</p>
                        <p className="font-medium">₹{item.cost_per_unit}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Value</p>
                        <p className="font-medium">₹{item.total_value?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Supplier</p>
                        <p className="font-medium">{item.supplier || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <EditStockModal
                      stock={item}
                      onStockUpdated={fetchStockItems}
                    />
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteStock(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {stockItems.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">No stock items found</p>
                <p className="text-sm text-muted-foreground mt-2">Add your first stock item to get started</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Stocks;
