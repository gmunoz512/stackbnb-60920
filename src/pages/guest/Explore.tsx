import { VendorGoogleRating } from "@/components/VendorGoogleRating";
import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MapPin, ArrowLeft, User, Sparkles, LogIn, UserPlus, Star, Store, Plus, Check, Loader2, Settings, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import stackdLogo from "@/assets/stackd-logo-new.png";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { GoogleRating } from "@/components/GoogleRating";
import { resolveGoogleRating } from "@/lib/googleRating";
import { toast } from "@/hooks/use-toast";
import { useProfile } from "@/contexts/ProfileContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthContext } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface VendorProfile {
  id: string;
  name: string;
  category: string;
  description: string | null;
  photos: string[] | null;
  price_per_person: number | null;
  google_rating: number | null;
  google_place_id?: string | null;
  is_published: boolean | null;
  listing_type: string;
}

const experienceCategories = [
  { id: "all", name: "All", icon: "✨" },
  { id: "Water Sports", name: "Water", icon: "🌊" },
  { id: "Tours & Activities", name: "Tours", icon: "🗺️" },
  { id: "Transportation", name: "Transport", icon: "🚴" },
  { id: "Food & Dining", name: "Food", icon: "🍷" },
  { id: "Wellness", name: "Wellness", icon: "💆" },
  { id: "Photography", name: "Photo", icon: "📸" },
  { id: "Private Chef", name: "Chef", icon: "👨‍🍳" },
];

const restaurantCategories = [
  { id: "all", name: "All", icon: "✨" },
  { id: "Seafood", name: "Seafood", icon: "🦞" },
  { id: "Italian", name: "Italian", icon: "🍝" },
  { id: "Mexican", name: "Mexican", icon: "🌮" },
  { id: "Japanese", name: "Japanese", icon: "🍣" },
  { id: "American", name: "American", icon: "🍔" },
  { id: "Mediterranean", name: "Mediterranean", icon: "🥗" },
];

function ExploreVendorCard({
  vendor,
  isHostMode,
  isSaved,
  isLoading,
  onAdd,
  className,
}: {
  vendor: VendorProfile;
  isHostMode: boolean;
  isSaved: boolean;
  isLoading: boolean;
  onAdd: (e: React.MouseEvent) => void;
  className?: string;
}) {
  return (
    <Link
      to={`/vendor/${vendor.id}${isHostMode ? "?mode=host" : ""}`}
      className={cn("block", className)}
    >
      <div className="aspect-square rounded-xl overflow-hidden relative">
        {vendor.photos && vendor.photos.length > 0 ? (
          <img
            src={vendor.photos[0]}
            alt={vendor.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-brand/20 flex items-center justify-center">
            <Store className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />

        {isHostMode && (
          <button
            type="button"
            aria-label={isSaved ? `Remove ${vendor.name} from your vendor list` : `Save ${vendor.name} to your vendor list`}
            onClick={onAdd}
            disabled={isLoading}
            className={`absolute top-2 left-2 z-20 p-2 rounded-full shadow-lg transition-all duration-200 ${
 isSaved
 ? "bg-success text-paper"
 : "bg-primary text-primary-foreground hover:bg-primary/90 "
 }`}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isSaved ? (
              <Check className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </button>
        )}

        <div className="absolute bottom-2 left-2 right-2">
          <p className="text-paper text-xs font-medium line-clamp-1">{vendor.name}</p>
          <div className="flex items-center gap-1 text-paper/80 text-[10px]">
            <VendorGoogleRating
              vendor={vendor}
              showCount
              className="text-[10px] text-inherit"
              starClassName="h-2.5 w-2.5"
            />
            {vendor.price_per_person ? <><span className="text-white/60">·</span><span>${vendor.price_per_person}</span></> : null}
          </div>
        </div>
      </div>
      <div className="mt-1.5">
        <p className="text-[10px] text-muted-foreground line-clamp-1">{vendor.category}</p>
      </div>
    </Link>
  );
}

const Explore = () => {
  const [selectedExperienceCategory, setSelectedExperienceCategory] = useState("all");
  const [selectedRestaurantCategory, setSelectedRestaurantCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [vendorProfiles, setVendorProfiles] = useState<VendorProfile[]>([]);
  const [loadingVendors, setLoadingVendors] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, role, isLoading: authLoading } = useAuthContext();
  const { hasRecommendation, addRecommendation, removeRecommendation } = useProfile();
  
  // Check if we're in host mode (came from host vendors page)
  const isHostMode = searchParams.get('mode') === 'host' || (isAuthenticated && role === 'host');

  useEffect(() => {
    fetchVendorProfiles();
  }, []);

  const fetchVendorProfiles = async () => {
    try {
      // Use the public view to avoid exposing sensitive fields
      const { data, error } = await supabase
        .from('vendor_profiles_public')
        .select('id, name, category, description, photos, price_per_person, google_rating, google_place_id, is_published, listing_type')
        .eq('is_published', true);

      if (error) throw error;
      setVendorProfiles(data || []);
    } catch (error) {
      console.error('Error fetching vendor profiles:', error);
    }
  };

  const handleAddVendor = async (vendorId: string, vendorName: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast({
        title: 'Sign in required',
        description: 'Redirecting to sign in...',
      });
      const returnUrl = encodeURIComponent(window.location.pathname + '?mode=host');
      navigate(`/auth?role=host&returnTo=${returnUrl}`);
      return;
    }
    
    // Wait for role to be loaded
    if (authLoading) {
      toast({
        title: 'Loading...',
        description: 'Please wait while we load your account.',
      });
      return;
    }
    
    if (role !== 'host') {
      toast({
        title: 'Host account required',
        description: 'Only hosts can add vendors to their list.',
      });
      return;
    }
    
    setLoadingVendors(prev => ({ ...prev, [vendorId]: true }));
    try {
      const isSaved = hasRecommendation(vendorId, 'vendor');
      if (isSaved) {
        await removeRecommendation(vendorId, 'vendor');
        toast({
          title: 'Removed from Vendor List',
          description: `${vendorName} has been removed from your vendors.`,
        });
      } else {
        await addRecommendation({ id: vendorId, type: 'vendor' });
        toast({
          title: 'Added to Vendor List',
          description: `${vendorName} has been added to your vendors.`,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update your vendor list. Please try again.';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoadingVendors(prev => ({ ...prev, [vendorId]: false }));
    }
  };

  // Filter vendor profiles (experiences)
  const vendorExperiences = vendorProfiles.filter(v => v.listing_type === 'experience');
  const vendorRestaurants = vendorProfiles.filter(v => v.listing_type === 'restaurant');

  const filteredVendorExperiences = vendorExperiences.filter((vendor) => {
    const matchesCategory = selectedExperienceCategory === "all" || 
      vendor.category.toLowerCase().includes(selectedExperienceCategory.toLowerCase());
    const matchesSearch = searchQuery === "" || 
      vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (vendor.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    return matchesCategory && matchesSearch;
  });

  const filteredVendorRestaurants = vendorRestaurants.filter((vendor) => {
    const matchesCategory = selectedRestaurantCategory === "all" || 
      vendor.category.toLowerCase().includes(selectedRestaurantCategory.toLowerCase());
    const matchesSearch = searchQuery === "" || 
      vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (vendor.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    return matchesCategory && matchesSearch;
  });

  // Split vendors into two rows
  const experienceMidPoint = Math.ceil(filteredVendorExperiences.length / 2);
  const experiencesRow1 = filteredVendorExperiences.slice(0, experienceMidPoint);
  const experiencesRow2 = filteredVendorExperiences.slice(experienceMidPoint);

  const restaurantMidPoint = Math.ceil(filteredVendorRestaurants.length / 2);
  const restaurantsRow1 = filteredVendorRestaurants.slice(0, restaurantMidPoint);
  const restaurantsRow2 = filteredVendorRestaurants.slice(restaurantMidPoint);

  return (
    <div className="min-h-screen h-screen w-screen bg-background flex justify-center overflow-hidden lg:h-auto lg:min-h-screen lg:overflow-x-hidden">
      {/* Phone container on mobile; full-width website shell on md/lg+ */}
      <div className="w-full max-w-[430px] h-full flex flex-col bg-background overflow-hidden relative md:max-w-5xl lg:max-w-6xl lg:h-auto lg:min-h-screen lg:overflow-visible">
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden pb-20 lg:overflow-visible lg:pb-8">
          {/* Hero Section */}
          <div className="relative isolate overflow-hidden">
            <div className="caustics absolute inset-0 -z-10" aria-hidden />
            {/* Header */}
            <div className="relative z-10 flex items-center justify-between px-4 pt-4 pb-2 md:px-6">
              <div className="flex items-center gap-3">
                <button
                  aria-label="Go back"
                  onClick={() => isHostMode ? navigate('/host/vendors') : navigate(-1)}
                  className="p-2 rounded-full border border-white/15 text-foreground hover:bg-white/5 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <Link to="/" className="flex items-center gap-2">
                  <img src={stackdLogo} alt="" className="h-7 w-7" />
                  <span className="font-display text-lg text-foreground">stackd</span>
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden sm:block"><ThemeToggle /></div>
                <DropdownMenu>
                  <DropdownMenuTrigger className="p-2 rounded-full bg-background/80 border border-border text-foreground hover:bg-accent transition-colors">
                    <User className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 bg-background border border-border">
                    {isAuthenticated ? (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/host/dashboard" className="flex items-center gap-2 cursor-pointer">
                            <User className="h-4 w-4" />
                            Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/host/profile" className="flex items-center gap-2 cursor-pointer">
                            <Settings className="h-4 w-4" />
                            Settings
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={async () => {
                            const { signOut } = await import('@/integrations/supabase/client').then(m => ({ signOut: m.supabase.auth.signOut.bind(m.supabase.auth) }));
                            await signOut();
                            navigate('/explore');
                          }} 
                          className="flex items-center gap-2 cursor-pointer text-destructive"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/auth" className="flex items-center gap-2 cursor-pointer">
                            <LogIn className="h-4 w-4" />
                            Sign In
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/auth?signup=true" className="flex items-center gap-2 cursor-pointer">
                            <UserPlus className="h-4 w-4" />
                            Sign Up
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Link
                  to="/trip-planner"
                  className="whitespace-nowrap rounded-full bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground"
                >
                  Plan a trip
                </Link>
              </div>
            </div>

            {/* Hero Content */}
            <div className="relative z-10 px-4 pb-8 pt-8 md:px-6 lg:pt-14">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-secondary">
                {isHostMode ? "For hosts" : "Tulum"}
              </p>
              <h1 className="mt-2 max-w-2xl font-display text-3xl leading-tight text-foreground lg:text-5xl">
                {isHostMode ? "Pick the vendors you'd send your own friends to." : "Everything worth doing in Tulum, in one place."}
              </h1>
              <p className="mt-3 max-w-xl text-sm text-muted-foreground lg:text-base">
                {isHostMode ? "Tap + on a vendor to add it to your guest guide." : "Cenote dives, boat trips and tables, rated live from Google."}
              </p>

              <div className="mt-6 flex max-w-xl items-center gap-2 rounded-full border border-white/15 bg-card px-4 py-2.5 focus-within:border-primary">
                <Search className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <Input
                  placeholder={isHostMode ? "Search vendors" : "Search experiences and restaurants"}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-6 min-w-0 flex-1 border-0 bg-transparent px-0 text-sm shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
                />
              </div>
            </div>
            <div className="horizon-line relative z-10" />
          </div>

          {/* Tabs for Experiences and Restaurants */}
          <Tabs defaultValue="experiences" className="px-3 py-3 md:px-6">
            <TabsList className="w-full justify-start rounded-none bg-transparent h-10 p-0 border-b border-border mb-4">
              <TabsTrigger 
                value="experiences" 
                className="flex-1 rounded-none text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                Experiences
              </TabsTrigger>
              <TabsTrigger 
                value="restaurants" 
                className="flex-1 rounded-none text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                Restaurants
              </TabsTrigger>
            </TabsList>

            {/* Experiences Tab */}
            <TabsContent value="experiences" className="mt-0 space-y-4">
              {/* Category Filters */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {experienceCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedExperienceCategory(category.id)}
                    className={`
 flex items-center gap-1.5 px-3 py-1.5 rounded-full border whitespace-nowrap text-xs
 transition-all duration-300 
 ${selectedExperienceCategory === category.id 
 ? 'bg-primary text-primary-foreground border-transparent' 
 : 'bg-card hover:border-primary/50 border-border'
 }
 `}
                  >
                    
                    <span className="font-medium">{category.name}</span>
                  </button>
                ))}
              </div>

              {/* Mobile: two horizontal rows. md+: multi-column grid */}
              <div className="space-y-4 md:hidden">
                {experiencesRow1.length > 0 && (
                  <div className="overflow-x-auto scrollbar-hide -mx-3 px-3">
                    <div className="flex gap-3 w-max pb-2">
                      {experiencesRow1.map((vendor) => (
                        <ExploreVendorCard
                          key={vendor.id}
                          vendor={vendor}
                          isHostMode={isHostMode}
                          isSaved={hasRecommendation(vendor.id, "vendor")}
                          isLoading={!!loadingVendors[vendor.id]}
                          onAdd={(e) => handleAddVendor(vendor.id, vendor.name, e)}
                          className="flex-shrink-0 w-40"
                        />
                      ))}
                    </div>
                  </div>
                )}
                {experiencesRow2.length > 0 && (
                  <div className="overflow-x-auto scrollbar-hide -mx-3 px-3">
                    <div className="flex gap-3 w-max pb-2">
                      {experiencesRow2.map((vendor) => (
                        <ExploreVendorCard
                          key={vendor.id}
                          vendor={vendor}
                          isHostMode={isHostMode}
                          isSaved={hasRecommendation(vendor.id, "vendor")}
                          isLoading={!!loadingVendors[vendor.id]}
                          onAdd={(e) => handleAddVendor(vendor.id, vendor.name, e)}
                          className="flex-shrink-0 w-40"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {filteredVendorExperiences.length > 0 && (
                <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredVendorExperiences.map((vendor) => (
                    <ExploreVendorCard
                      key={vendor.id}
                      vendor={vendor}
                      isHostMode={isHostMode}
                      isSaved={hasRecommendation(vendor.id, "vendor")}
                      isLoading={!!loadingVendors[vendor.id]}
                      onAdd={(e) => handleAddVendor(vendor.id, vendor.name, e)}
                    />
                  ))}
                </div>
              )}

              {filteredVendorExperiences.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm">No experiences found</p>
                </div>
              )}
            </TabsContent>

            {/* Restaurants Tab */}
            <TabsContent value="restaurants" className="mt-0 space-y-4">
              {/* Category Filters */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {restaurantCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedRestaurantCategory(category.id)}
                    className={`
 flex items-center gap-1.5 px-3 py-1.5 rounded-full border whitespace-nowrap text-xs
 transition-all duration-300 
 ${selectedRestaurantCategory === category.id 
 ? 'bg-primary text-primary-foreground border-transparent' 
 : 'bg-card hover:border-primary/50 border-border'
 }
 `}
                  >
                    
                    <span className="font-medium">{category.name}</span>
                  </button>
                ))}
              </div>

              {/* Mobile: two horizontal rows. md+: multi-column grid */}
              <div className="space-y-4 md:hidden">
                {restaurantsRow1.length > 0 && (
                  <div className="overflow-x-auto scrollbar-hide -mx-3 px-3">
                    <div className="flex gap-3 w-max pb-2">
                      {restaurantsRow1.map((vendor) => (
                        <ExploreVendorCard
                          key={vendor.id}
                          vendor={vendor}
                          isHostMode={isHostMode}
                          isSaved={hasRecommendation(vendor.id, "vendor")}
                          isLoading={!!loadingVendors[vendor.id]}
                          onAdd={(e) => handleAddVendor(vendor.id, vendor.name, e)}
                          className="flex-shrink-0 w-40"
                        />
                      ))}
                    </div>
                  </div>
                )}
                {restaurantsRow2.length > 0 && (
                  <div className="overflow-x-auto scrollbar-hide -mx-3 px-3">
                    <div className="flex gap-3 w-max pb-2">
                      {restaurantsRow2.map((vendor) => (
                        <ExploreVendorCard
                          key={vendor.id}
                          vendor={vendor}
                          isHostMode={isHostMode}
                          isSaved={hasRecommendation(vendor.id, "vendor")}
                          isLoading={!!loadingVendors[vendor.id]}
                          onAdd={(e) => handleAddVendor(vendor.id, vendor.name, e)}
                          className="flex-shrink-0 w-40"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {filteredVendorRestaurants.length > 0 && (
                <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredVendorRestaurants.map((vendor) => (
                    <ExploreVendorCard
                      key={vendor.id}
                      vendor={vendor}
                      isHostMode={isHostMode}
                      isSaved={hasRecommendation(vendor.id, "vendor")}
                      isLoading={!!loadingVendors[vendor.id]}
                      onAdd={(e) => handleAddVendor(vendor.id, vendor.name, e)}
                    />
                  ))}
                </div>
              )}

              {filteredVendorRestaurants.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm">No restaurants found</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Explore;
