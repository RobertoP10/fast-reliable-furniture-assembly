
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Shield, Star } from "lucide-react";

export const FeaturesSection = () => {
  const features = [
    { 
      Icon: Users, 
      title: "Verified Taskers", 
      desc: "All taskers are manually verified to ensure service quality." 
    },
    { 
      Icon: Shield, 
      title: "Security & Privacy", 
      desc: "Personal data is protected. Communication is done through our platform." 
    },
    { 
      Icon: Star, 
      title: "Review System", 
      desc: "Bidirectional reviews to ensure trust between users." 
    },
  ];

  return (
    <section className="py-16 px-4 bg-white/50">
      <div className="container mx-auto grid md:grid-cols-3 gap-8">
        {features.map(({ Icon, title, desc }, i) => (
          <Card key={i} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="text-center">
              <Icon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle className="text-blue-900">{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-gray-600">{desc}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};
