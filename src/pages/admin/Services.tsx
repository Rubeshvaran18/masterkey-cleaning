
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { AddServiceModal } from "@/components/modals/AddServiceModal";
import { EditServiceModal } from "@/components/modals/EditServiceModal";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration_hours: number;
  status: string;
  created_at: string;
  updated_at: string;
}

const Services = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Failed to fetch services');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (id: string, name: string) => {
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setServices(services.filter(service => service.id !== id));
      toast.success(`Service "${name}" has been deleted`);
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Failed to delete service');
    }
  };

  const toggleServiceStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
      
      const { error } = await supabase
        .from('services')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setServices(services.map(service => 
        service.id === id ? { ...service, status: newStatus } : service
      ));
      
      toast.success(`Service status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating service status:', error);
      toast.error('Failed to update service status');
    }
  };

  if (loading) {
    return <div className="space-y-6"><div className="p-6">Loading services...</div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Cleaning Services</h1>
        <AddServiceModal onServiceAdded={fetchServices} />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Available Services</h2>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Card key={service.id}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold">{service.name}</h3>
                        <Badge 
                          variant={service.status === "Active" ? "default" : "secondary"}
                          className="cursor-pointer"
                          onClick={() => toggleServiceStatus(service.id, service.status)}
                        >
                          {service.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{service.description}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Price:</span>
                      <span className="font-semibold text-lg">₹{service.price}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Duration:</span>
                      <span className="text-sm">{service.duration_hours} hours</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => toggleServiceStatus(service.id, service.status)}
                    >
                      {service.status === "Active" ? "Deactivate" : "Activate"}
                    </Button>
                    <div className="flex items-center space-x-2">
                      <EditServiceModal 
                        service={service}
                        onServiceUpdated={fetchServices}
                      />
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Service</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{service.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteService(service.id, service.name)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {services.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No services added yet.</p>
              <div className="mt-4">
                <AddServiceModal onServiceAdded={fetchServices} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Services;
