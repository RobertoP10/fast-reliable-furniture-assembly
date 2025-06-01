
const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-8 px-4">
      <div className="container mx-auto text-center">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <img 
            src="/lovable-uploads/50093cff-7c1c-4e83-bc2c-9328a7d7e45c.png" 
            alt="MGS Deal Logo" 
            className="h-6 w-6 object-contain"
          />
          <span className="text-xl font-bold">MGSDEAL</span>
        </div>
        <p className="text-gray-400">
          © 2025 MGSDEAL. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
