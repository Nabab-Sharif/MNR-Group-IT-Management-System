import { useRef, forwardRef } from "react";
import { useToast } from "@/hooks/use-toast";

interface WifiPrintCardProps {
  wifiName: string;
  wifiPassword: string;
  wifiArea?: string;
  qrCode: string;
}

const WifiPrintCard = forwardRef<HTMLDivElement, WifiPrintCardProps>(
  ({ wifiName, wifiPassword, wifiArea, qrCode }, ref) => {
    const { toast } = useToast();

    const copyToClipboard = (text: string, label: string) => {
      navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
    };

    return (
      <div ref={ref} className="wifi-print-card p-8 bg-gradient-to-br from-white to-primary/5 border-4 border-primary rounded-2xl text-center max-w-md mx-auto shadow-2xl cursor-pointer">
        {/* Logo */}
        <div className="wifi-print-logo mb-6">
          <img 
            src="/logo/logo_1.png" 
            alt="MNR Group Logo" 
            className="h-20 mx-auto"
          />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-primary mb-2">WiFi Network</h2>
        
        {/* WiFi Area */}
        {wifiArea && (
          <div className="text-sm text-muted-foreground mb-2">
            Area: {wifiArea}
          </div>
        )}

        {/* WiFi Name */}
        <div 
          className="wifi-print-name text-3xl font-bold text-foreground mb-4 hover:bg-primary/10 p-2 rounded transition-colors"
          onClick={() => copyToClipboard(wifiName, "WiFi Name")}
          title="Click to copy WiFi name"
        >
          {wifiName}
        </div>

        {/* QR Code */}
        <div className="wifi-print-qr w-48 h-48 mx-auto mb-4 p-3 bg-white rounded-xl border-4 border-primary shadow-lg">
          <img 
            src={qrCode} 
            alt="WiFi QR Code" 
            className="w-full h-full object-contain"
          />
        </div>

        {/* Scan Instruction */}
        <p className="text-muted-foreground text-sm mb-4">Scan QR Code to connect</p>

        {/* Password */}
        <div 
          className="wifi-print-password bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-4 px-6 rounded-xl hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => copyToClipboard(wifiPassword, "WiFi Password")}
          title="Click to copy password"
        >
          <p className="text-xs uppercase tracking-wider mb-1 opacity-80">Password</p>
          <p className="text-xl font-bold tracking-widest">{wifiPassword}</p>
        </div>

        {/* Footer */}
        <div className="wifi-print-footer mt-6 pt-4 border-t-2 border-border">
          <p className="text-sm text-muted-foreground">MNR Group - IT Department</p>
          <p className="text-xs text-muted-foreground mt-1">Contact IT for assistance</p>
        </div>
      </div>
    );
  }
);

WifiPrintCard.displayName = "WifiPrintCard";

export default WifiPrintCard;
