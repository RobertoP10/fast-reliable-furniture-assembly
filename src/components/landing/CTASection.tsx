
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface CTASectionProps {
  onShowRegister: () => void;
}

export const CTASection = ({ onShowRegister }: CTASectionProps) => {
  const navigate = useNavigate();
  return (
    <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-center text-white">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold mb-6">Ready to get started?</h2>
        <p className="mb-8 text-lg">Join the MGSDEAL community today</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" variant="secondary" onClick={() => navigate('/funnel')} className="bg-white text-blue-600 hover:bg-gray-100">
            Start Your Request
          </Button>
          <Button size="lg" variant="outline" onClick={onShowRegister} className="bg-transparent border-white text-white hover:bg-white hover:text-blue-600">
            Register Now
          </Button>
        </div>
      </div>
    </section>
  );
};
