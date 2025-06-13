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
          <h1 className="text-4xl font-bold text-blue-900 mb-8 text-center">MGSDEAL Terms of Service</h1>
          <p className="text-gray-600 mb-8 text-center">Last updated: 12 June 2025</p>

          <div className="prose prose-lg max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-blue-800 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing and using MGSDEAL, you accept and agree to be bound by the terms and 
                provisions of this agreement. If you do not agree to abide by the terms, please do not use this 
                service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-blue-800 mb-4">2. Service Description</h2>
              <p className="text-gray-700 leading-relaxed">
                MGSDEAL is a UK-based marketplace platform that connects clients with taskers for furniture 
                assembly and related services. The platform facilitates this connection but is not involved in the 
                actual service delivery.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-blue-800 mb-4">3. User Responsibilities</h2>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-blue-700">Clients:</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Provide clear and accurate task details</li>
                  <li>Ensure safe and respectful working environments</li>
                  <li>Pay the agreed amount after task completion</li>
                </ul>

                <h3 className="text-lg font-medium text-blue-700 mt-6">Taskers:</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Deliver services professionally and reliably</li>
                  <li>Arrive on time and communicate delays</li>
                  <li>Comply with all relevant insurance and license requirements</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-blue-800 mb-4">4. Payments and Commission</h2>
              <p className="text-gray-700 leading-relaxed">
                Clients pay only upon task completion. Taskers are charged a 20% commission from the 
                accepted task value. All payments are processed securely. No hidden fees apply.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-blue-800 mb-4">5. Platform Guarantee</h2>
              <p className="text-gray-700 leading-relaxed">
                While Taskers are independent, MGSDEAL guarantees up to £10,000 in compensation for any 
                damage caused to Clients due to a Tasker's actions. The platform may permanently suspend 
                any Tasker violating terms or causing damages.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-blue-800 mb-4">6. Independent Contractor Clause</h2>
              <p className="text-gray-700 leading-relaxed">
                Taskers are not employees of MGSDEAL. They act as independent contractors and are fully 
                responsible for their taxes, insurances, and compliance. No employment relationship is 
                established through use of this platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-blue-800 mb-4">7. Disputes and Reviews</h2>
              <p className="text-gray-700 leading-relaxed">
                Any disputes should be reported immediately via platform support. Reviews are visible to both 
                parties after task completion and cannot be edited after submission.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-blue-800 mb-4">8. Data Protection and Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                MGSDEAL processes user data in accordance with the UK GDPR. Details can be found in our 
                Privacy Policy available at /privacy-policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-blue-800 mb-4">9. Account Termination</h2>
              <p className="text-gray-700 leading-relaxed">
                Users may terminate their account at any time. MGSDEAL reserves the right to suspend or 
                terminate accounts in breach of these terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-blue-800 mb-4">10. Changes to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                These terms may change from time to time. Users will be notified via email or platform banner. 
                Continued use implies acceptance of updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-blue-800 mb-4">11. Brand Disclaimer</h2>
              <p className="text-gray-700 leading-relaxed">
                MGSDEAL is an independent platform and is not affiliated with, endorsed by, or sponsored by IKEA.  
                Any use of the IKEA name or other brand names on this website is solely for identification purposes.  
                All trademarks and brand names are the property of their respective owners.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-blue-800 mb-4">12. Contact</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                For any questions regarding these Terms, contact:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>client@mgsdeal.com</li>
                <li>tasker@mgsdeal.com</li>
                <li>tehnic@mgsdeal.com</li>
              </ul>
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
