
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface HeroSectionProps {
  onShowRegister: () => void;
}

const HeroSection = ({ onShowRegister }: HeroSectionProps) => {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto text-center">
        <Badge className="mb-6 bg-blue-100 text-blue-700 hover:bg-blue-200">
          Marketplace for Assembly Services
        </Badge>
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
          IKEA & Furniture Assembly
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Connecting customers with furniture assembly experts. Simple, fast and professional.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" onClick={onShowRegister} className="bg-blue-600 hover:bg-blue-700">
            Post a Task
          </Button>
          <Button size="lg" variant="outline" onClick={onShowRegister} className="hover:bg-blue-50">
            Become a Tasker
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
