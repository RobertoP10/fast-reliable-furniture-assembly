
import { Button } from "@/components/ui/button";

interface CTASectionProps {
  onShowRegister: () => void;
}

export const CTASection = ({ onShowRegister }: CTASectionProps) => {
  return (
    <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-center text-white">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold mb-6">Ready to get started?</h2>
        <p className="mb-8 text-lg">Join the MGSDEAL community today</p>
        <Button size="lg" variant="secondary" onClick={onShowRegister} className="bg-white text-blue-600 hover:bg-gray-100">
          Register Now
        </Button>
      </div>
    </section>
  );
};
