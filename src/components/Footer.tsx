
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="bg-muted border-t border-border mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center space-x-6 text-sm text-muted-foreground">
          <Link to="/terms-of-service" className="hover:text-foreground">
            Terms of Service
          </Link>
          <Link to="/contact" className="hover:text-foreground">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
};
