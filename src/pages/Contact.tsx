
import { Mail } from "lucide-react";
import { Footer } from "@/components/Footer";

const Contact = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-foreground mb-8">Contact Us</h1>
          
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6 text-left">
              <div className="flex items-center space-x-3 mb-2">
                <Mail className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">📩 Client Support</h2>
              </div>
              <p className="text-muted-foreground">For questions about posting tasks and managing your requests</p>
              <a 
                href="mailto:client@mgsdeal.com" 
                className="text-primary hover:underline font-medium"
              >
                client@mgsdeal.com
              </a>
            </div>

            <div className="bg-card border border-border rounded-lg p-6 text-left">
              <div className="flex items-center space-x-3 mb-2">
                <Mail className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">🧰 Tasker Support</h2>
              </div>
              <p className="text-muted-foreground">For help with completing tasks and managing your offers</p>
              <a 
                href="mailto:tasker@mgsdeal.com" 
                className="text-primary hover:underline font-medium"
              >
                tasker@mgsdeal.com
              </a>
            </div>

            <div className="bg-card border border-border rounded-lg p-6 text-left">
              <div className="flex items-center space-x-3 mb-2">
                <Mail className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">🛠️ Technical Support</h2>
              </div>
              <p className="text-muted-foreground">For technical issues and platform-related problems</p>
              <a 
                href="mailto:tehnic@mgsdeal.com" 
                className="text-primary hover:underline font-medium"
              >
                tehnic@mgsdeal.com
              </a>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Contact;
