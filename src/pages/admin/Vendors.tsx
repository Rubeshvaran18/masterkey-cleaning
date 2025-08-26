import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Users, UserCheck, Trash2, Phone, Mail, MapPin, Download, FileText } from "lucide-react";
import { AddVendorModal } from "@/components/modals/AddVendorModal";
import { EditVendorModal } from "@/components/modals/EditVendorModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useExportData } from '@/hooks/useExportData';

interface Vendor {
  id: string;
  name: string;
  contact_person: string;
  phone_number: string;
  email: string;
  address: string;
  services_provided: string[];
  rating: number;
  status: string;
  created_at: string;
}

const Vendors = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const { exportVendorsToExcel, exportVendorsToPDF } = useExportData();

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('name');

      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast.error('Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVendor = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Vendor deleted successfully');
      fetchVendors();
    } catch (error) {
      console.error('Error deleting vendor:', error);
      toast.error('Failed to delete vendor');
    }
  };

  const activeVendors = vendors.filter(vendor => vendor.status === 'Active');
  const averageRating = vendors.length > 0 
    ? (vendors.reduce((sum, vendor) => sum + vendor.rating, 0) / vendors.length).toFixed(1)
    : "0.0";

  const stats = [
    { label: "Total Vendors", value: vendors.length.toString(), icon: Users, color: "text-blue-600" },
    { label: "Active Vendors", value: activeVendors.length.toString(), icon: UserCheck, color: "text-green-600" },
    { label: "Average Rating", value: averageRating, icon: Star, color: "text-yellow-600" }
  ];

  if (loading) {
    return <div className="space-y-6"><div className="p-6">Loading...</div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Vendors Management</h1>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => exportVendorsToExcel(vendors)}
            className="flex items-center gap-2 border-green-600 text-green-600 hover:bg-green-50"
          >
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
          <Button 
            variant="outline" 
            onClick={() => exportVendorsToPDF(vendors)}
            className="flex items-center gap-2 border-green-600 text-green-600 hover:bg-green-50"
          >
            <FileText className="h-4 w-4" />
            Export PDF
          </Button>
          <AddVendorModal onVendorAdded={fetchVendors} />
        </div>
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

      {/* Vendors List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Vendors</h2>
        
        {vendors.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No vendors found</p>
              <p className="text-sm text-muted-foreground mt-2">Add your first vendor to get started</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {vendors.map((vendor) => (
              <Card key={vendor.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold">{vendor.name}</h3>
                        <Badge variant={vendor.status === 'Active' ? "default" : "secondary"}>
                          {vendor.status}
                        </Badge>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="text-sm font-medium">{vendor.rating}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          {vendor.contact_person && (
                            <div className="flex items-center space-x-2 text-sm">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span>{vendor.contact_person}</span>
                            </div>
                          )}
                          {vendor.phone_number && (
                            <div className="flex items-center space-x-2 text-sm">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span>{vendor.phone_number}</span>
                            </div>
                          )}
                          {vendor.email && (
                            <div className="flex items-center space-x-2 text-sm">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span>{vendor.email}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          {vendor.address && (
                            <div className="flex items-start space-x-2 text-sm">
                              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <span className="flex-1">{vendor.address}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {vendor.services_provided && vendor.services_provided.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">Services:</p>
                          <div className="flex flex-wrap gap-2">
                            {vendor.services_provided.map((service, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {service}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <EditVendorModal
                        vendor={vendor}
                        onVendorUpdated={fetchVendors}
                      />
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteVendor(vendor.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Vendors;
