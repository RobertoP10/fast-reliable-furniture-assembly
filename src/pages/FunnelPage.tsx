import { ConversationalFunnel } from "@/components/funnel/ConversationalFunnel";
import { useNavigate } from "react-router-dom";

const FunnelPage = () => {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate("/");
  };

  const handleComplete = (data: any, onLogin: () => void, onRegister: () => void) => {
    // Store the funnel data and redirect to register
    sessionStorage.setItem('funnelData', JSON.stringify(data));
    navigate("/?showRegister=true");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EEF4FF] to-white">
      <div className="container mx-auto px-4 py-8 h-screen flex flex-col">
        <ConversationalFunnel 
          onClose={handleClose}
          onComplete={handleComplete}
          isFullPage={true}
        />
      </div>
    </div>
  );
};

export default FunnelPage;