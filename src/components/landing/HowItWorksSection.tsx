
import { MessageSquare, CheckCircle } from "lucide-react";

export const HowItWorksSection = () => {
  const steps = [
    { step: "1", title: "Post Task", desc: "Describe what you need assembled" },
    { step: "2", title: "Get Offers", desc: "Taskers in your area send you offers" },
    { step: <MessageSquare className="h-8 w-8 text-blue-600" />, title: "Communicate", desc: "Direct chat with chosen tasker" },
    { step: <CheckCircle className="h-8 w-8 text-green-600" />, title: "Complete", desc: "Payment and review after completion" },
  ];

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto grid md:grid-cols-4 gap-8 text-center">
        {steps.map(({ step, title, desc }, i) => (
          <div key={i}>
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-blue-600">{step}</span>
            </div>
            <h3 className="font-semibold mb-2 text-blue-900">{title}</h3>
            <p className="text-gray-600 text-sm">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
