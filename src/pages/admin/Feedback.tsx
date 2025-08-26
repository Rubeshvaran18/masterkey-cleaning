
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, TrendingUp, MessageSquare, Users, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Feedback = () => {
  // Fetch feedback data from the database
  const { data: feedbackData = [], isLoading } = useQuery({
    queryKey: ['admin-feedback'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Calculate statistics
  const totalReviews = feedbackData.length;
  const averageRating = totalReviews > 0 
    ? (feedbackData.reduce((sum, f) => sum + f.rating, 0) / totalReviews).toFixed(1)
    : '0.0';
  const fiveStarReviews = feedbackData.filter(f => f.rating === 5).length;
  const fourPlusStarReviews = feedbackData.filter(f => f.rating >= 4).length;
  const withComments = feedbackData.filter(f => f.comment && f.comment.trim()).length;

  const stats = [
    { 
      label: "Average Rating", 
      value: averageRating,
      icon: Star,
      color: "text-yellow-600 bg-yellow-50"
    },
    { 
      label: "5-Star Reviews", 
      value: fiveStarReviews.toString(),
      icon: TrendingUp,
      color: "text-green-600 bg-green-50"
    },
    { 
      label: "4+ Star Reviews", 
      value: fourPlusStarReviews.toString(),
      icon: Users,
      color: "text-blue-600 bg-blue-50"
    },
    { 
      label: "With Comments", 
      value: withComments.toString(),
      icon: MessageSquare,
      color: "text-purple-600 bg-purple-50"
    }
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < rating
            ? "fill-yellow-400 text-yellow-400"
            : "text-gray-300"
        }`}
      />
    ));
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "text-green-600";
    if (rating >= 3) return "text-yellow-600";
    return "text-red-600";
  };

  const getServiceBadgeColor = (service: string) => {
    const colors = [
      "bg-blue-100 text-blue-800",
      "bg-green-100 text-green-800",
      "bg-purple-100 text-purple-800",
      "bg-orange-100 text-orange-800",
      "bg-pink-100 text-pink-800"
    ];
    const hash = service.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Customer Feedback</h1>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading feedback...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Feedback</h1>
          <p className="text-muted-foreground mt-1">Monitor customer satisfaction and reviews</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Total Reviews</p>
          <p className="text-3xl font-bold text-primary">{totalReviews}</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.color}`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Feedback */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Recent Feedback
          </h2>
          {totalReviews > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {averageRating} average
            </Badge>
          )}
        </div>
        
        {feedbackData.length > 0 ? (
          <div className="space-y-4">
            {feedbackData.map((feedback) => (
              <Card key={feedback.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">{feedback.customer_name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {feedback.customer_email}
                          </Badge>
                        </div>
                        {feedback.service_name && (
                          <Badge className={getServiceBadgeColor(feedback.service_name)}>
                            {feedback.service_name}
                          </Badge>
                        )}
                      </div>
                      <div className="text-right space-y-2">
                        <div className="flex items-center space-x-1">
                          {renderStars(feedback.rating)}
                        </div>
                        <p className={`text-sm font-semibold ${getRatingColor(feedback.rating)}`}>
                          {feedback.rating}/5 Stars
                        </p>
                      </div>
                    </div>
                    
                    {feedback.comment && (
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm leading-relaxed">{feedback.comment}</p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(feedback.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-16">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No feedback yet</h3>
              <p className="text-muted-foreground">Customer reviews will appear here once they start submitting feedback</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Feedback;
