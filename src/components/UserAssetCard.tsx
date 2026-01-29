import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { 
  Network, 
  Eye, 
  EyeOff,
  Monitor, 
  Phone, 
  Mail,
  Lock,
  Shield,
  User,
  Copy,
  ExternalLink
} from "lucide-react";

interface UserAssetCardProps {
  asset: {
    id: string;
    employee_name?: string;
    designation?: string;
    ip_no?: string;
    anydesk_id?: string;
    anydesk_password?: string;
    ultraview_id?: string;
    mobile?: string;
    phone_no?: string;
    ip_phone?: string;
    email?: string;
    email_password?: string;
    device_type?: string;
    division?: string;
    photo?: string;
    antivirus_code?: string;
    antivirus_validity?: string;
  };
  index?: number;
  showAntivirus?: boolean;
}

const UserAssetCard = ({ asset, index = 0 }: UserAssetCardProps) => {
  const { toast } = useToast();
  const [showAnyDeskPassword, setShowAnyDeskPassword] = useState(false);

  const handleCopy = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    toast({ title: "Copied!", description: `${label}: ${value}` });
  };

  const handleCopyAndOpen = (type: string, value: string) => {
    navigator.clipboard.writeText(value);
    
    switch (type) {
      case 'ip':
        window.open(`tightvnc://${value}`, '_blank');
        toast({ title: "IP Copied", description: `${value} - TightVNC opening...` });
        break;
      case 'anydesk':
        window.open(`anydesk:${value}`, '_blank');
        toast({ title: "AnyDesk", description: `ID ${value} copied & opening...` });
        break;
      case 'ultraview':
        window.open(`ultraviewer://connect?id=${value}`, '_blank');
        toast({ title: "Ultraview", description: `ID ${value} copied & opening...` });
        break;
      default:
        toast({ title: "Copied", description: value });
    }
  };

  // Different gradient colors based on index
  const gradients = [
    'from-sky-500 via-blue-500 to-indigo-600',
    'from-violet-500 via-purple-500 to-fuchsia-600',
    'from-emerald-500 via-teal-500 to-cyan-600',
    'from-orange-500 via-amber-500 to-yellow-600',
    'from-rose-500 via-pink-500 to-red-600',
    'from-indigo-500 via-blue-500 to-sky-600',
  ];

  const gradient = gradients[index % gradients.length];
  const rotation = ((index % 5) - 2) * 1.5; // -3 to 3 degrees

  return (
    <Card 
      className="group relative overflow-hidden border-0 shadow-2xl hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] transition-all duration-700 animate-scale-in"
      style={{ 
        transform: `perspective(1000px) rotateY(${rotation}deg) rotateX(2deg)`,
        transformStyle: 'preserve-3d',
        animationDelay: `${index * 50}ms`
      }}
    >
      {/* Animated Gradient Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-90 group-hover:opacity-100 transition-all duration-700`} />
      
      {/* Floating Blur Elements */}
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-3xl group-hover:blur-2xl transition-all duration-700" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-black/10 blur-3xl group-hover:blur-2xl transition-all duration-700" />
      
      {/* Premium Shine Effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 transform -skew-x-12" />
      
      {/* Top Border Accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-white/0 via-white/30 to-white/0 group-hover:via-white/50 transition-all duration-700" />

      <div className="relative p-6 text-white space-y-4">
        {/* Header - Avatar & Name */}
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-white/20 rounded-2xl blur-lg group-hover:blur-xl group-hover:bg-white/30 transition-all duration-500" />
            <Avatar className="w-16 h-16 rounded-2xl shadow-lg border-2 border-white/40 group-hover:border-white/60 group-hover:scale-110 transition-all duration-500 relative">
              <AvatarImage src={asset.photo} alt={asset.employee_name} />
              <AvatarFallback className="bg-white/20 backdrop-blur-sm text-white text-xl font-bold rounded-2xl">
                {asset.employee_name?.charAt(0)?.toUpperCase() || <User className="h-6 w-6" />}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 min-w-0 mt-1">
            <h3 className="font-bold text-lg leading-tight truncate group-hover:text-yellow-100 transition-colors duration-300">
              {asset.employee_name || 'Unknown User'}
            </h3>
            <p className="text-sm opacity-80 truncate group-hover:opacity-100 transition-opacity">{asset.designation || 'N/A'}</p>
            {asset.division && (
              <Badge variant="secondary" className="mt-2 bg-white/25 text-white text-[10px] border-white/30 hover:bg-white/35 transition-all">
                {asset.division}
              </Badge>
            )}
          </div>
        </div>

        {/* Quick Actions - IP, AnyDesk, Ultraview */}
        <div className="space-y-3">
          {/* IP Address - Primary Action */}
          {asset.ip_no && (
            <button
              onClick={() => handleCopyAndOpen('ip', asset.ip_no!)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 hover:border-white/50 transition-all duration-300 group/btn hover:shadow-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400/30 to-emerald-600/30 flex items-center justify-center border border-emerald-400/50 group-hover/btn:border-emerald-300 transition-all">
                  <Network className="h-5 w-5 text-emerald-100" />
                </div>
                <div className="text-left">
                  <p className="text-[11px] opacity-70 uppercase tracking-wider font-semibold">IP Address</p>
                  <p className="font-mono font-bold text-sm text-white">{asset.ip_no}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover/btn:opacity-100 transition-all duration-300">
                <Copy className="h-4 w-4 text-white/60" />
                <ExternalLink className="h-4 w-4 text-white/60" />
              </div>
            </button>
          )}

          {/* Remote Access Tools Row */}
          <div className="flex gap-2">
            {/* AnyDesk */}
            {asset.anydesk_id && (
              <button
                onClick={() => handleCopyAndOpen('anydesk', asset.anydesk_id!)}
                className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 backdrop-blur-md border border-red-400/40 hover:border-red-300/60 transition-all duration-300 hover:shadow-lg group/anydesk"
              >
                <div className="w-8 h-8 rounded-lg bg-red-500/30 flex items-center justify-center border border-red-400/50 group-hover/anydesk:border-red-300 transition-all">
                  <Monitor className="h-4 w-4 text-red-100" />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-[9px] opacity-70 uppercase font-semibold">AnyDesk</p>
                  <p className="font-mono text-xs font-bold truncate">{asset.anydesk_id}</p>
                </div>
              </button>
            )}

            {/* AnyDesk Password */}
            {asset.anydesk_password && (
              <button
                onClick={() => handleCopy(asset.anydesk_password!, 'AnyDesk Password')}
                className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 backdrop-blur-md border border-red-400/40 hover:border-red-300/60 transition-all duration-300 hover:shadow-lg group/anydesk-pwd"
              >
                <div className="w-8 h-8 rounded-lg bg-red-500/30 flex items-center justify-center border border-red-400/50 group-hover/anydesk-pwd:border-red-300 transition-all">
                  <Lock className="h-4 w-4 text-red-100" />
                </div>
                <div className="text-left min-w-0 flex-1">
                  <p className="text-[9px] opacity-70 uppercase font-semibold">AnyDesk Pwd</p>
                  <p className="font-mono text-xs font-bold truncate">
                    {showAnyDeskPassword ? asset.anydesk_password : '••••••••'}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAnyDeskPassword(!showAnyDeskPassword);
                  }}
                  className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-all"
                  title={showAnyDeskPassword ? 'Hide password' : 'Show password'}
                >
                  {showAnyDeskPassword ? (
                    <EyeOff className="h-3.5 w-3.5 text-red-100" />
                  ) : (
                    <Eye className="h-3.5 w-3.5 text-red-100" />
                  )}
                </button>
              </button>
            )}

            {/* Ultraview */}
            {asset.ultraview_id && (
              <button
                onClick={() => handleCopyAndOpen('ultraview', asset.ultraview_id!)}
                className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 backdrop-blur-md border border-purple-400/40 hover:border-purple-300/60 transition-all duration-300 hover:shadow-lg group/ultraview"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-500/30 flex items-center justify-center border border-purple-400/50 group-hover/ultraview:border-purple-300 transition-all">
                  <Eye className="h-4 w-4 text-purple-100" />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-[9px] opacity-70 uppercase font-semibold">Ultraview</p>
                  <p className="font-mono text-xs font-bold truncate">{asset.ultraview_id}</p>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Contact Info Section */}
        <div className="space-y-2">
          <p className="text-[10px] opacity-60 uppercase tracking-wider font-semibold pl-1">Contact & Credentials</p>
          <div className="flex flex-wrap gap-2">
            {(asset.mobile || asset.phone_no) && (
              <button
                onClick={() => {
                  const phone = asset.mobile || asset.phone_no;
                  handleCopy(phone!, 'Phone');
                  setTimeout(() => {
                    window.location.href = `tel:${phone}`;
                  }, 300);
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/12 hover:bg-white/20 text-xs transition-all border border-white/25 hover:border-white/40 group/phone backdrop-blur-sm hover:shadow-md"
              >
                <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="font-semibold">{asset.mobile || asset.phone_no}</span>
                <Copy className="h-3 w-3 opacity-0 group-hover/phone:opacity-100 transition-opacity" />
              </button>
            )}
            
            {asset.ip_phone && (
              <button
                onClick={() => handleCopy(asset.ip_phone!, 'IP Phone')}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/12 hover:bg-white/20 text-xs transition-all border border-white/25 hover:border-white/40 group/ipphone backdrop-blur-sm hover:shadow-md"
              >
                <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="font-semibold">IP: {asset.ip_phone}</span>
                <Copy className="h-3 w-3 opacity-0 group-hover/ipphone:opacity-100 transition-opacity" />
              </button>
            )}
            
            {asset.email && (
              <button
                onClick={() => {
                  handleCopy(asset.email!, 'Email');
                  setTimeout(() => {
                    const emailUrl = asset.email?.includes('gmail') 
                      ? `https://mail.google.com/mail/?view=cm&to=${asset.email}` 
                      : `mailto:${asset.email}`;
                    window.open(emailUrl, '_blank');
                  }, 300);
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/12 hover:bg-white/20 text-xs transition-all border border-white/25 hover:border-white/40 max-w-full group/email backdrop-blur-sm hover:shadow-md"
              >
                <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate font-semibold">{asset.email}</span>
                <Copy className="h-3 w-3 opacity-0 group-hover/email:opacity-100 transition-opacity flex-shrink-0" />
              </button>
            )}
            
            {asset.email_password && (
              <button
                onClick={() => handleCopy(asset.email_password!, 'Email Password')}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/12 hover:bg-white/20 text-xs transition-all border border-white/25 hover:border-white/40 max-w-full group/password backdrop-blur-sm hover:shadow-md"
              >
                <Lock className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate font-mono font-semibold">{asset.email_password}</span>
                <Copy className="h-3 w-3 opacity-0 group-hover/password:opacity-100 transition-opacity flex-shrink-0" />
              </button>
            )}
            
            {asset.antivirus_code && (
              <button
                onClick={() => handleCopy(asset.antivirus_code!, 'Antivirus Key')}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/12 hover:bg-white/20 text-xs transition-all border border-white/25 hover:border-white/40 max-w-full group/antivirus backdrop-blur-sm hover:shadow-md"
              >
                <Shield className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate font-mono font-semibold">{asset.antivirus_code}</span>
                {asset.antivirus_validity && (
                  <span className="text-[9px] opacity-70 flex-shrink-0">({new Date(asset.antivirus_validity).toLocaleDateString()})</span>
                )}
                <Copy className="h-3 w-3 opacity-0 group-hover/antivirus:opacity-100 transition-opacity flex-shrink-0" />
              </button>
            )}
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-4 right-4 w-24 h-24 rounded-full bg-white/5 blur-3xl group-hover:blur-2xl group-hover:bg-white/10 transition-all duration-500" />
        <div className="absolute bottom-4 left-4 w-20 h-20 rounded-full bg-black/5 blur-3xl group-hover:blur-2xl transition-all duration-500" />
        
        {/* Bottom Accent Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-white/0 via-white/30 to-white/0 opacity-50 group-hover:opacity-100 group-hover:via-white/50 transition-all duration-700" />
      </div>
    </Card>
  );
};

export default UserAssetCard;
