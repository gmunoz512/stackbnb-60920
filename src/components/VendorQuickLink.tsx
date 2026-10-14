import { Star, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

interface VendorQuickLinkProps {
  id: number;
  name: string;
  rating: number;
  category: string;
  isHostRecommended?: boolean;
}

export function VendorQuickLink({ 
  id, 
  name, 
  rating, 
  category, 
  isHostRecommended 
}: VendorQuickLinkProps) {
  return (
    <Link
      to={`/experience/${id}`}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background border border-border hover:border-primary/50 hover:bg-accent/50 transition-all group"
    >
      {isHostRecommended && (
        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
          {name}
        </p>
        <p className="text-xs text-muted-foreground">
          {category} • ★{rating}
        </p>
      </div>
      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
    </Link>
  );
}
