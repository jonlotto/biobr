import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface ProfileHeaderProps {
  displayName: string;
  username: string;
  handle?: string;
  bio?: string;
  avatarUrl?: string;
  titleFont?: string;
  titleColor?: string | null;
  titleSize?: "small" | "large";
}

const ProfileHeader = ({
  displayName,
  username,
  handle,
  bio,
  avatarUrl,
  titleFont = "Inter",
  titleColor,
  titleSize = "large",
}: ProfileHeaderProps) => {
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col items-center gap-4 text-center animate-fade-in">
      <Avatar className="h-24 w-24 border-4 border-card">
        <AvatarImage src={avatarUrl} alt={displayName} />
        <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-display font-bold">
          {initials}
        </AvatarFallback>
      </Avatar>
      
      <div className="space-y-1">
        <h1 
          className={cn(
            "font-bold",
            titleSize === "small" ? "text-xl" : "text-2xl"
          )}
          style={{ 
            fontFamily: titleFont,
            color: titleColor || undefined 
          }}
        >
          {displayName}
        </h1>
        <p 
          style={{ 
            fontFamily: titleFont,
            color: titleColor || undefined,
            opacity: titleColor ? 0.7 : undefined
          }}
          className={!titleColor ? "text-muted-foreground" : undefined}
        >
          @{handle || username}
        </p>
      </div>
      
      {bio && (
        <p 
          className={cn(
            "max-w-xs text-sm leading-relaxed",
            !titleColor && "text-muted-foreground"
          )}
          style={{ 
            fontFamily: titleFont,
            color: titleColor || undefined,
            opacity: titleColor ? 0.8 : undefined
          }}
        >
          {bio}
        </p>
      )}
    </div>
  );
};

export default ProfileHeader;
