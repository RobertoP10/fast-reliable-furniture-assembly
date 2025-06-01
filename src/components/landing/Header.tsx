
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onShowLogin: () => void;
  onShowRegister: () => void;
}

const Header = ({ onShowLogin, onShowRegister }: HeaderProps) => {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/50093cff-7c1c-4e83-bc2c-9328a7d7e45c.png" 
              alt="MGS Deal Logo" 
              className="h-10 w-10 object-contain"
            />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              MGSDEAL
            </span>
          </div>
          <div className="space-x-3">
            <Button variant="outline" onClick={onShowLogin} className="hover:bg-blue-50">
              Login
            </Button>
            <Button onClick={onShowRegister} className="bg-blue-600 hover:bg-blue-700">
              Register
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
