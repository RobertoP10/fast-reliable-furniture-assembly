
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
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
          <h1 className="text-4xl font-bold text-blue-900 mb-8 text-center">MGSDEAL Privacy Policy</h1>
          <p className="text-gray-600 mb-8 text-center">Last updated: 12 June 2025</p>

          <div className="prose prose-lg max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-blue-800 mb-4">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                This Privacy Policy explains how MGSDEAL ("we", "our", "us") collects, uses, shares and 
                protects your personal information when you access and use our platform, services and 
                website. This policy applies to all users including Clients and Taskers in the United Kingdom.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-blue-800 mb-4">2. What Personal Data We Collect</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                We may collect and process the following categories of personal data:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Identity data: full name, profile photo</li>
                <li>Contact data: email address, phone number</li>
                <li>Location data: address, postcode, task location</li>
                <li>Authentication data: email/password, login history</li>
                <li>Usage data: task activity, offers submitted, messages sent, ratings, reviews</li>
                <li>Technical data: IP address, browser type, cookies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-blue-800 mb-4">3. How We Collect Data</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                We collect data directly from:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Registration forms</li>
                <li>Task creation and offer forms</li>
                <li>Messaging/chat features</li>
                <li>Cookies and analytics tools</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-blue-800 mb-4">4. Why We Collect and Use Your Data</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                We process your data for the following purposes:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>To create and manage your account</li>
                <li>To match Clients with Taskers</li>
                <li>To enable communication and task fulfilment</li>
                <li>To process payments and generate invoices</li>
                <li>To improve platform functionality and user experience</li>
                <li>To comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-blue-800 mb-4">5. Legal Basis for Processing (UK GDPR)</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                We only process your personal data when we have a legal basis to do so:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Contractual necessity – to provide the platform services</li>
                <li>Consent – where required (e.g. marketing emails)</li>
                <li>Legitimate interest – fraud prevention, platform improvement</li>
                <li>Legal obligation – tax, accounting or legal compliance</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-blue-800 mb-4">6. Who We Share Your Data With</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                We may share limited personal data with:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Other users (e.g. Client ↔ Tasker)</li>
                <li>Platform administrators and support staff</li>
                <li>Payment service providers</li>
                <li>Cloud hosting and analytics providers (with safeguards)</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                We do not sell your data to third parties.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-blue-800 mb-4">7. Data Retention</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                We retain personal data only as long as necessary:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>While you have an active account</li>
                <li>As required by legal, tax, or contractual obligations</li>
                <li>You may request deletion of your account and associated data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-blue-800 mb-4">8. Your Rights Under UK GDPR</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Access the data we hold about you</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion ("right to be forgotten")</li>
                <li>Object to or restrict processing</li>
                <li>Withdraw consent at any time (where applicable)</li>
                <li>Data portability (receive your data in structured format)</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                To exercise these rights, contact us at tehnic@mgsdeal.com.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-blue-800 mb-4">9. Data Security</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                We use industry-standard measures to protect your data:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Encrypted storage and secure access control</li>
                <li>Regular platform monitoring and backups</li>
                <li>Strict access limitations for admin users</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-blue-800 mb-4">10. Cookies</h2>
              <p className="text-gray-700 leading-relaxed">
                We use cookies for basic functionality and analytics. By using the platform, you consent 
                to the use of cookies. You may disable them in your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-blue-800 mb-4">11. Children's Data</h2>
              <p className="text-gray-700 leading-relaxed">
                MGSDEAL is not intended for users under 18. We do not knowingly collect data from minors. 
                If discovered, such accounts will be removed.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-blue-800 mb-4">12. Changes to This Privacy Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this policy from time to time. Changes will be posted on this page with a 
                new "last updated" date. If changes are significant, you may be notified by email or 
                platform alert.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-blue-800 mb-4">13. Contact</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                For questions, concerns or to exercise your data rights, contact us at:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>client@mgsdeal.com</li>
                <li>tasker@mgsdeal.com</li>
                <li>tehnic@mgsdeal.com</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                Thank you for trusting MGSDEAL with your information.
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

export default PrivacyPolicy;
