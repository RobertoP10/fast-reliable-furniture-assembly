
import { Button } from "@/components/ui/button";

interface CTASectionProps {
  onShowRegister: () => void;
}

const CTASection = ({ onShowRegister }: CTASectionProps) => {
  return (
    <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-indigo-600">
      <div className="container mx-auto text-center">
        <h2 className="text-3xl font-bold text-white mb-6">
          Ready to get started?
        </h2>
        <p className="text-blue-100 mb-8 text-lg">
          Join the MGSDEAL community today
        </p>
        <Button size="lg" variant="secondary" onClick={onShowRegister} className="bg-white text-blue-600 hover:bg-gray-100">
          Register Now
        </Button>
      </div>
    </section>
  );
};

export default CTASection;
