
import { Loader2 } from "lucide-react";

const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
        <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        <p className="mt-2 text-sm text-gray-500">Please wait while we verify your session</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
