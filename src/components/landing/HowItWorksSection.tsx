
import { CheckCircle, MessageSquare } from "lucide-react";

const HowItWorksSection = () => {
  return (
    <section className="py-16 px-4">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
          How does it work?
        </h2>
        <div className="grid md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-blue-600">1</span>
            </div>
            <h3 className="font-semibold mb-2 text-blue-900">Post Task</h3>
            <p className="text-gray-600 text-sm">Describe what you need assembled</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-blue-600">2</span>
            </div>
            <h3 className="font-semibold mb-2 text-blue-900">Get Offers</h3>
            <p className="text-gray-600 text-sm">Taskers in your area send you offers</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-2 text-blue-900">Communicate</h3>
            <p className="text-gray-600 text-sm">Direct chat with chosen tasker</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="font-semibold mb-2 text-blue-900">Complete</h3>
            <p className="text-gray-600 text-sm">Payment and review after completion</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
