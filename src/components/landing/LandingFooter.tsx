
import { useNavigate } from "react-router-dom";

export const LandingFooter = () => {
  const navigate = useNavigate();

  return (
    <footer className="bg-gray-900 text-white py-8 px-4 text-center">
      <div className="container mx-auto">
        <div className="flex justify-center items-center space-x-3 mb-4">
          <img
            src="/lovable-uploads/50093cff-7c1c-4e83-bc2c-9328a7d7e45c.png"
            alt="MGS Deal Logo"
            className="h-6 w-6 object-contain"
          />
          <span className="text-xl font-bold">MGSDEAL</span>
        </div>
        <div className="flex justify-center space-x-6 mb-4">
          <button
            onClick={() => navigate("/terms-of-service")}
            className="text-gray-400 hover:text-white transition-colors"
          >
            Terms of Service
          </button>
          <button
            onClick={() => navigate("/privacy-policy")}
            className="text-gray-400 hover:text-white transition-colors"
          >
            Privacy Policy
          </button>
          <button
            onClick={() => navigate("/contact")}
            className="text-gray-400 hover:text-white transition-colors"
          >
            Contact
          </button>
        </div>
        <p className="text-gray-400">© 2025 MGSDEAL. All rights reserved.</p>
      </div>
    </footer>
  );
};
