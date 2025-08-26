import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookingModal } from '@/components/BookingModal';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Star, MessageSquare, Award, Sparkles, TrendingUp, Gift } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FeedbackForm } from '@/components/customer/FeedbackForm';
import { ServicesGrid } from '@/components/customer/ServicesGrid';
import { ProfileSection } from '@/components/customer/ProfileSection';
import { useUserProfile } from '@/hooks/useUserProfile';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const CustomerDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const { data: profile } = useUserProfile();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Successfully signed out!');
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  const { data: bookings = [], isLoading, refetch } = useQuery({
    queryKey: ['customer-bookings', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: pointsData } = useQuery({
    queryKey: ['customer-points', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('customer_points')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const completedBookings = bookings.filter(b => b.status === 'Completed').length;
  const totalSpent = bookings.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);
  const nextLevelPoints = Math.ceil((pointsData?.total_points || 0) / 100) * 100;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-500 hover:bg-green-600';
      case 'In Progress':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'Cancelled':
        return 'bg-red-500 hover:bg-red-600';
      default:
        return 'bg-yellow-500 hover:bg-yellow-600';
    }
  };

  const getDisplayName = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    if (profile?.first_name) {
      return profile.first_name;
    }
    return user?.email?.split('@')[0] || 'there';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/10">
      {/* Enhanced Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <img
    src="/master-key-logo.png"
    alt="MasterKey Logo"
    className="w-12 h-12 sm:w-40 sm:h-40 object-contain rounded"
  />
            <div className="space-y-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Welcome Back, {getDisplayName()}! 
              </h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                {user?.email}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                onClick={() => setShowBookingModal(true)}
                className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Quick Book
              </Button>
              <Button 
                variant="outline" 
                onClick={handleSignOut}
                className="hover:bg-destructive hover:text-destructive-foreground transition-colors"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 hover:shadow-lg transition-all duration-300 group">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-yellow-700">
                <Star className="h-5 w-5 text-yellow-500 group-hover:animate-pulse" />
                Reward Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600 mb-2">
                {pointsData?.total_points || 0}
              </div>
              <div className="w-full bg-yellow-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-gradient-to-r from-yellow-400 to-orange-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${((pointsData?.total_points || 0) % 100)}%` }}
                ></div>
              </div>
              <p className="text-sm text-yellow-600">
                {100 - ((pointsData?.total_points || 0) % 100)} points to next level
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Award className="h-5 w-5 text-green-500" />
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {completedBookings}
              </div>
              <p className="text-sm text-green-600">Services completed</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                Total Spent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                ₹{totalSpent.toLocaleString()}
              </div>
              <p className="text-sm text-blue-600">Lifetime spending</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-purple-700">
                <Gift className="h-5 w-5 text-purple-500" />
                Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-purple-600 mb-1">
                {completedBookings >= 10 ? 'VIP' : completedBookings >= 5 ? 'Gold' : 'Silver'}
              </div>
              <p className="text-sm text-purple-600">Customer tier</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="services" className="space-y-6">
          <TabsList className="bg-white/50 backdrop-blur-sm border border-border/50">
            <TabsTrigger value="services" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Book Services
            </TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              My Profile
            </TabsTrigger>
            <TabsTrigger value="bookings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              My Bookings ({bookings.length})
            </TabsTrigger>
            <TabsTrigger value="feedback" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Give Feedback
            </TabsTrigger>
          </TabsList>

          <TabsContent value="services">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Available Services</h2>
                <p className="text-muted-foreground">Choose from our premium cleaning services</p>
              </div>
              <ServicesGrid />
            </div>
          </TabsContent>

          <TabsContent value="profile">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">My Profile</h2>
                <p className="text-muted-foreground">Manage your personal information</p>
              </div>
              <ProfileSection />
            </div>
          </TabsContent>

          <TabsContent value="bookings">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">My Bookings</h2>
                {bookings.length > 0 && (
                  <p className="text-muted-foreground">{bookings.length} total bookings</p>
                )}
              </div>

              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading your bookings...</p>
                </div>
              ) : bookings.length > 0 ? (
                <div className="grid gap-6">
                  {bookings.map((booking) => (
                    <Card key={booking.id} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary/20 hover:border-l-primary">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold mb-2">{booking.service_name}</h3>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {new Date(booking.booking_date).toLocaleDateString()}
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {booking.booking_time}
                              </div>
                            </div>
                          </div>
                          <Badge className={`${getStatusColor(booking.status || 'Pending')} text-white transition-colors`}>
                            {booking.status || 'Pending'}
                          </Badge>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-start">
                            <MapPin className="h-4 w-4 mr-2 mt-1 text-muted-foreground" />
                            <span className="text-sm">{booking.address}</span>
                          </div>
                          
                          {booking.notes && (
                            <div className="flex items-start">
                              <MessageSquare className="h-4 w-4 mr-2 mt-1 text-muted-foreground" />
                              <span className="text-sm">{booking.notes}</span>
                            </div>
                          )}
                          
                          <div className="pt-3 border-t flex justify-between items-center">
                            <span className="text-2xl font-bold text-primary">₹{booking.total_amount}</span>
                            {booking.status === 'Completed' && (
                              <div className="flex items-center text-green-600">
                                <Star className="h-4 w-4 mr-1" />
                                <span className="text-sm">+{Math.floor(Number(booking.total_amount) / 10)} points earned</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
                  <CardContent className="text-center py-16">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">No bookings yet</h3>
                    <p className="text-muted-foreground mb-6">Start your cleaning journey with us today!</p>
                    <Button 
                      onClick={() => setShowBookingModal(true)}
                      className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Book Your First Service
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="feedback">
            <FeedbackForm />
          </TabsContent>
        </Tabs>
      </div>

      <BookingModal 
        open={showBookingModal} 
        onClose={() => setShowBookingModal(false)}
        onBookingComplete={() => {
          refetch();
          setShowBookingModal(false);
        }}
        userProfile={profile}
      />
    </div>
  );
};

export default CustomerDashboard;
