import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import stackdLogo from "@/assets/stackd-logo-new.png";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ChevronRight,
  Store,
  CreditCard,
  Receipt,
  UserPen,
  Lock,
  HelpCircle,
  LogOut,
  BookMarked,
  Copy,
  Check,
  Share2,
  MessageCircle,
  Settings,
  Handshake,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SubpageShell, AsideBlock } from "@/components/dashboard/Subpage";
import HostBottomNav from "@/components/HostBottomNav";
import { useSignup } from "@/contexts/SignupContext";
import { useProfile } from "@/contexts/ProfileContext";
import { useAuthContext } from "@/contexts/AuthContext";
import { useEnsureProfileName } from "@/hooks/useEnsureProfileName";
import { toast } from "@/hooks/use-toast";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FaWhatsapp } from "react-icons/fa";

const HostProfile = () => {
  const navigate = useNavigate();
  const { hostSignupData, propertyData } = useSignup();
  const { profile } = useProfile();
  const { user } = useAuthContext();
  const [copied, setCopied] = useState(false);

  // Check if user is admin
  const { data: isAdmin } = useQuery({
    queryKey: ['isAdminHostProfile', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();
      return !!data;
    },
    enabled: !!user,
  });

  // Prefer backend profile name, fall back to signup/session data.
  const displayFullName = useMemo(() => {
    const fromDb = profile?.full_name?.trim();
    if (fromDb) return fromDb;
    const fromSession = `${(hostSignupData.firstName || "").trim()} ${(hostSignupData.lastName || "").trim()}`.trim();
    return fromSession;
  }, [profile?.full_name, hostSignupData.firstName, hostSignupData.lastName]);

  const firstName = displayFullName.split(" ")[0] || "";
  const lastName = displayFullName.split(" ").slice(1).join(" ");
  const propertyName = propertyData.propertyName || "";

  const initials = (() => {
    const a = firstName.charAt(0);
    const b = lastName.charAt(0);
    const combined = `${a}${b}`.trim();
    return combined ? combined.toUpperCase() : "H";
  })();

  // Ensure the public guest guide can display a name (it reads from profiles.full_name)
  useEnsureProfileName({
    firstName: hostSignupData.firstName,
    lastName: hostSignupData.lastName,
  });

  const guideUrl = user ? `${window.location.origin}/guide/${user.id}` : "";

  const handleCopyGuideLink = async () => {
    if (!guideUrl) return;
    
    try {
      await navigator.clipboard.writeText(guideUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Share this link with your guests",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  };

  const shareMessage = `Check out my curated guest guide with local recommendations: ${guideUrl}`;

  const handleShareSMS = () => {
    if (!guideUrl) return;
    window.open(`sms:?body=${encodeURIComponent(shareMessage)}`, "_blank");
  };

  const handleShareWhatsApp = () => {
    if (!guideUrl) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, "_blank");
  };

  const menuItems = [
    { 
      label: "Guest Guide Link", 
      icon: BookMarked, 
      action: "share-guide",
      gradient: true,
      description: "Share with guests"
    },
  { 
    label: "Your Storefront Link", 
    icon: Store, 
    action: "storefront-link",
    gradient: false
  },
    { 
      label: "My Vendors", 
      icon: Handshake, 
      action: "/host/vendors/manage",
      gradient: false,
      description: "Manage commission partnerships"
    },
    { 
      label: "Payment Settings", 
      icon: CreditCard, 
      action: "/host/payment-settings",
      gradient: false
    },
    { 
      label: "Payout History", 
      icon: Receipt, 
      action: "/host/payout-history",
      gradient: false
    },
    { 
      label: "Edit Profile", 
      icon: UserPen, 
      action: "/host/edit-profile",
      gradient: false
    },
    { 
      label: "Change Password", 
      icon: Lock, 
      action: "/host/change-password",
      gradient: false
    },
    { 
      label: "Help & Support", 
      icon: HelpCircle, 
      action: "/host/help-support",
      gradient: false
    },
    { 
      label: "Log Out", 
      icon: LogOut, 
      action: "/signout",
      gradient: false
    },
  ];

  // Add admin settings if user is admin
  const allMenuItems = useMemo(() => {
    if (isAdmin) {
      return [
        ...menuItems.slice(0, -1), // All items except Log Out
        { 
          label: "Platform Settings", 
          icon: Settings, 
          action: "/admin/settings",
          gradient: false,
          isAdmin: true
        },
        menuItems[menuItems.length - 1] // Log Out last
      ];
    }
    return menuItems;
  }, [isAdmin]);

  const handleMenuClick = (action: string) => {
    if (action === "share-guide") {
      // Handled by dropdown, do nothing here
      return;
    }
    if (action === "storefront-link") {
      if (user) {
        navigate(`/storefront/${user.id}`);
      }
      return;
    }
    navigate(action);
  };

  const listItems = allMenuItems.filter((item) => item.action !== "share-guide" && item.action !== "/signout");

  return (
    <>
      <SubpageShell
        backLabel="Back to dashboard"
        onBack={() => navigate('/host/dashboard')}
        eyebrow="Account"
        title={displayFullName || "Your profile"}
        subtitle={propertyName ? `Host at ${propertyName}` : "Add your property to finish setup."}
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate('/signout')} className="gap-2 whitespace-nowrap">
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        }
        aside={
          <>
            <AsideBlock title="Share your guest guide">
              <p className="text-muted-foreground">Send guests the page with every experience you recommend. They book directly and you earn on each booking.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" onClick={handleCopyGuideLink} className="gap-2">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy link"}
                </Button>
                <Button size="sm" variant="outline" onClick={handleShareSMS} className="gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Text
                </Button>
                <Button size="sm" variant="outline" onClick={handleShareWhatsApp} className="gap-2">
                  <FaWhatsapp className="h-4 w-4" />
                  WhatsApp
                </Button>
              </div>
            </AsideBlock>
          </>
        }
      >
        <nav className="grid border-t border-white/10 sm:grid-cols-2 sm:gap-x-10 mt-8">
          {listItems.map((item, index) => (
            item.action === "share-guide" ? (
              <DropdownMenu key={item.label}>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`
 w-full flex items-center justify-between p-4 
 hover:bg-muted/30 active:bg-muted/50 transition-all
 ${'border-b border-white/10'}
 bg-brand/5 `}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-5 w-5 flex-shrink-0 text-primary" />
                      <div className="text-left">
                        <span className="font-medium text-sm block text-primary">
                          {item.label}
                        </span>
                        {'description' in item && item.description && (
                          <span className="text-xs text-muted-foreground">{item.description}</span>
                        )}
                      </div>
                    </div>
                    <Share2 className="h-5 w-5 text-primary flex-shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleCopyGuideLink} className="cursor-pointer">
                    {copied ? (
                      <Check className="h-4 w-4 mr-2 text-success" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    Copy Link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShareSMS} className="cursor-pointer">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Share via Text
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShareWhatsApp} className="cursor-pointer">
                    <FaWhatsapp className="h-4 w-4 mr-2 text-success" />
                    Share via WhatsApp
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button
                key={item.label}
                onClick={() => handleMenuClick(item.action)}
                className={`
 w-full flex items-center justify-between p-4 
 hover:bg-muted/30 active:bg-muted/50 transition-all
 ${'border-b border-white/10'}
 
 `}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`h-5 w-5 flex-shrink-0 ${'isAdmin' in item && item.isAdmin ? 'text-secondary' : 'text-muted-foreground'}`} />
                  <div className="text-left">
                    <span className="font-medium text-sm block">
                      {item.label}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              </button>
            )
          ))}
        </nav>
      </SubpageShell>
      <HostBottomNav />
    </>
  );
};

export default HostProfile;
