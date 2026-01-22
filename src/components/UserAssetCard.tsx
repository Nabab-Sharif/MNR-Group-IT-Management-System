import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { 
  Network, 
  Eye, 
  Monitor, 
  Phone, 
  Mail,
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
    ultraview_id?: string;
    mobile?: string;
    phone_no?: string;
    ip_phone?: string;
    email?: string;
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
      className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 animate-scale-in"
      style={{ 
        transform: `perspective(1000px) rotateY(${rotation}deg) rotateX(2deg)`,
        transformStyle: 'preserve-3d',
        animationDelay: `${index * 50}ms`
      }}
    >
      {/* Gradient Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-95 group-hover:opacity-100 transition-opacity`} />
      
      {/* Shine Effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 transform -skew-x-12" />

      <div className="relative p-5 text-white">
        {/* Header - Avatar & Name */}
        <div className="flex items-start gap-4 mb-4">
          <Avatar className="w-14 h-14 rounded-2xl shadow-lg border-2 border-white/30 group-hover:scale-110 transition-transform duration-300">
            <AvatarImage src={asset.photo} alt={asset.employee_name} />
            <AvatarFallback className="bg-white/20 backdrop-blur-sm text-white text-xl font-bold rounded-2xl">
              {asset.employee_name?.charAt(0)?.toUpperCase() || <User className="h-6 w-6" />}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg leading-tight truncate group-hover:text-yellow-200 transition-colors">
              {asset.employee_name || 'Unknown User'}
            </h3>
            <p className="text-sm opacity-80 truncate">{asset.designation || 'N/A'}</p>
            {asset.division && (
              <Badge variant="secondary" className="mt-1 bg-white/20 text-white text-[10px] border-0">
                {asset.division}
              </Badge>
            )}
          </div>
        </div>

        {/* Quick Actions - IP, AnyDesk, Ultraview */}
        <div className="space-y-2 mb-4">
          {/* IP Address - Primary Action */}
          {asset.ip_no && (
            <button
              onClick={() => handleCopyAndOpen('ip', asset.ip_no!)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 transition-all duration-300 group/btn"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/30 flex items-center justify-center">
                  <Network className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] opacity-70 uppercase tracking-wide">IP Address</p>
                  <p className="font-mono font-semibold text-sm">{asset.ip_no}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover/btn:opacity-100 transition-opacity">
                <Copy className="h-3.5 w-3.5" />
                <ExternalLink className="h-3.5 w-3.5" />
              </div>
            </button>
          )}

          {/* Remote Access Tools Row */}
          <div className="flex gap-2">
            {/* AnyDesk */}
            {asset.anydesk_id && (
              <button
                onClick={() => handleCopyAndOpen('anydesk', asset.anydesk_id!)}
                className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/30 hover:bg-red-500/50 backdrop-blur-sm border border-red-300/30 transition-all duration-300"
              >
                <Monitor className="h-4 w-4" />
                <div className="text-left min-w-0">
                  <p className="text-[9px] opacity-70 uppercase">AnyDesk</p>
                  <p className="font-mono text-xs font-semibold truncate">{asset.anydesk_id}</p>
                </div>
              </button>
            )}

            {/* Ultraview */}
            {asset.ultraview_id && (
              <button
                onClick={() => handleCopyAndOpen('ultraview', asset.ultraview_id!)}
                className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-500/30 hover:bg-purple-500/50 backdrop-blur-sm border border-purple-300/30 transition-all duration-300"
              >
                <Eye className="h-4 w-4" />
                <div className="text-left min-w-0">
                  <p className="text-[9px] opacity-70 uppercase">Ultraview</p>
                  <p className="font-mono text-xs font-semibold truncate">{asset.ultraview_id}</p>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Contact Info - Click to copy, then action */}
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
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs transition-all border border-white/20 group/phone"
            >
              <Phone className="h-3.5 w-3.5" />
              <span>{asset.mobile || asset.phone_no}</span>
              <Copy className="h-3 w-3 opacity-0 group-hover/phone:opacity-100 transition-opacity" />
            </button>
          )}
          
          {asset.ip_phone && (
            <button
              onClick={() => handleCopy(asset.ip_phone!, 'IP Phone')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs transition-all border border-white/20 group/ipphone"
            >
              <Phone className="h-3.5 w-3.5" />
              <span>IP: {asset.ip_phone}</span>
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
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs transition-all border border-white/20 max-w-full group/email"
            >
              <Mail className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{asset.email}</span>
              <Copy className="h-3 w-3 opacity-0 group-hover/email:opacity-100 transition-opacity flex-shrink-0" />
            </button>
          )}
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-3 right-3 w-20 h-20 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute bottom-3 left-3 w-16 h-16 rounded-full bg-black/10 blur-xl" />
      </div>
    </Card>
  );
};

export default UserAssetCard;
