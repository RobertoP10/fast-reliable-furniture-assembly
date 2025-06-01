
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const CreateTaskForm = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    subcategory: "",
    minBudget: "",
    maxBudget: "",
    location: "",
    paymentMethod: "cash"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuthContext();

  const categories = {
    "wardrobe": ["PAX", "HEMNES", "BRIMNES", "MALM", "Other"],
    "desk": ["LINNMON", "BEKANT", "GALANT", "MICKE", "Other"],
    "bed": ["MALM", "HEMNES", "BRIMNES", "TARVA", "Other"],
    "chest": ["HEMNES", "MALM", "RAST", "KOPPANG", "Other"],
    "table": ["INGATORP", "BJURSTA", "LERHAMN", "MÖRBYLÅNGA", "Other"],
    "shelf": ["BILLY", "HEMNES", "FJÄLKINGE", "IVAR", "Other"]
  };

  const locations = [
    "Birmingham, West Midlands",
    "Telford, Shropshire", 
    "Wolverhampton, West Midlands",
    "Stoke on Trent, Staffordshire",
    "Shrewsbury, Shropshire"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a task.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.category || !formData.subcategory) {
      toast({
        title: "Error",
        description: "Please select category and subcategory.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const priceRange = `£${formData.minBudget} - £${formData.maxBudget}`;
      
      const { data, error } = await supabase
        .from('task_requests')
        .insert({
          client_id: user.id,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          subcategory: formData.subcategory,
          price_range: priceRange,
          location: formData.location,
          payment_method: formData.paymentMethod,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating task:', error);
        toast({
          title: "Error",
          description: "Failed to create task. Please try again.",
          variant: "destructive",
        });
        return;
      }

      console.log("Task created successfully:", data);
      toast({
        title: "Task created successfully!",
        description: "Your task has been posted and will be visible to taskers.",
      });

      // Reset form
      setFormData({
        title: "",
        description: "",
        category: "",
        subcategory: "",
        minBudget: "",
        maxBudget: "",
        location: "",
        paymentMethod: "cash"
      });

    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-blue-900">Create a New Task</CardTitle>
        <CardDescription>
          Describe what you need assembled and receive offers from taskers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              placeholder="e.g. IKEA PAX Wardrobe Assembly"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description">Detailed Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what needs to be assembled, dimensions, special requirements..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              className="mt-1 min-h-[100px]"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value, subcategory: "" })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wardrobe">Wardrobe</SelectItem>
                  <SelectItem value="desk">Desk</SelectItem>
                  <SelectItem value="bed">Bed</SelectItem>
                  <SelectItem value="chest">Chest of Drawers</SelectItem>
                  <SelectItem value="table">Table</SelectItem>
                  <SelectItem value="shelf">Shelf</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Subcategory / Model</Label>
              <Select 
                value={formData.subcategory} 
                onValueChange={(value) => setFormData({ ...formData, subcategory: value })}
                disabled={!formData.category}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {formData.category && categories[formData.category as keyof typeof categories]?.map((sub) => (
                    <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minBudget">Minimum Budget (£)</Label>
              <Input
                id="minBudget"
                type="number"
                placeholder="50"
                value={formData.minBudget}
                onChange={(e) => setFormData({ ...formData, minBudget: e.target.value })}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="maxBudget">Maximum Budget (£)</Label>
              <Input
                id="maxBudget"
                type="number"
                placeholder="120"
                value={formData.maxBudget}
                onChange={(e) => setFormData({ ...formData, maxBudget: e.target.value })}
                required
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label>Location</Label>
            <Select value={formData.location} onValueChange={(value) => setFormData({ ...formData, location: value })}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select your location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>{location}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Payment Method</Label>
            <RadioGroup 
              value={formData.paymentMethod} 
              onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cash" id="cash" />
                <Label htmlFor="cash">Cash</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bank" id="bank" />
                <Label htmlFor="bank">Bank Transfer</Label>
              </div>
            </RadioGroup>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Posting Task..." : "Post Task"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateTaskForm;
