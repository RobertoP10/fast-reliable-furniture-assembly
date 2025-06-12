
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            <img
              src="/lovable-uploads/50093cff-7c1c-4e83-bc2c-9328a7d7e45c.png"
              alt="MGS Deal Logo"
              className="h-10 w-10 object-contain"
            />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              MGSDEAL
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold text-blue-900 mb-8 text-center">Terms of Service</h1>
          <p className="text-gray-600 mb-8 text-center">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose prose-lg max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-blue-800 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing and using MGSDEAL, you accept and agree to be bound by the terms and provision of this agreement. 
                If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-blue-800 mb-4">2. Service Description</h2>
              <p className="text-gray-700 leading-relaxed">
                MGSDEAL is a marketplace platform that connects clients who need furniture assembly services with verified taskers 
                who provide professional assembly services. We facilitate the connection but are not directly involved in the 
                actual service provision.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-blue-800 mb-4">3. User Responsibilities</h2>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-blue-700">For Clients:</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Provide accurate and complete task descriptions</li>
                  <li>Make payment as agreed upon task completion</li>
                  <li>Treat taskers with respect and professionalism</li>
                  <li>Ensure safe working conditions for taskers</li>
                </ul>

                <h3 className="text-lg font-medium text-blue-700 mt-6">For Taskers:</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Provide services professionally and to the best of your ability</li>
                  <li>Arrive on time and communicate any delays</li>
                  <li>Complete tasks as described and agreed upon</li>
                  <li>Maintain appropriate insurance and licenses where required</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-blue-800 mb-4">4. Payment and Fees</h2>
              <p className="text-gray-700 leading-relaxed">
                MGSDEAL charges a service fee for facilitating connections between clients and taskers. Payment terms 
                and fee structures are clearly displayed during the booking process. All payments are processed securely 
                through our platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-blue-800 mb-4">5. Account Approval</h2>
              <p className="text-gray-700 leading-relaxed">
                Tasker accounts require manual approval before services can be offered. This verification process helps 
                ensure service quality and platform safety. Client accounts are automatically approved upon registration.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-blue-800 mb-4">6. Privacy and Data Protection</h2>
              <p className="text-gray-700 leading-relaxed">
                We are committed to protecting your privacy. Personal information collected is used solely for platform 
                operations and improving our services. We do not sell or share personal data with third parties except 
                as required for service delivery.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-blue-800 mb-4">7. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed">
                MGSDEAL serves as a platform connecting clients and taskers. We are not liable for the quality of services 
                provided, damages that may occur during service delivery, or disputes between users. Users engage with each 
                other at their own risk.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-blue-800 mb-4">8. Termination</h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to terminate or suspend accounts that violate these terms or engage in inappropriate 
                behavior on the platform. Users may also terminate their accounts at any time by contacting support.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-blue-800 mb-4">9. Changes to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                These terms may be updated periodically. Users will be notified of significant changes via email or 
                platform notifications. Continued use of the platform after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-blue-800 mb-4">10. Contact Information</h2>
              <p className="text-gray-700 leading-relaxed">
                For questions about these Terms of Service, please contact us through our support channels available 
                on the platform.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 text-center">
            <Button onClick={() => navigate("/")} className="bg-blue-600 hover:bg-blue-700">
              Return to Home
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4 text-center mt-12">
        <div className="container mx-auto">
          <div className="flex justify-center items-center space-x-3 mb-4">
            <img
              src="/lovable-uploads/50093cff-7c1c-4e83-bc2c-9328a7d7e45c.png"
              alt="MGS Deal Logo"
              className="h-6 w-6 object-contain"
            />
            <span className="text-xl font-bold">MGSDEAL</span>
          </div>
          <p className="text-gray-400">© 2025 MGSDEAL. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default TermsOfService;
