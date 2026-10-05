import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EditorLink, EditorProfile } from "@/hooks/useEditorState";
import type { SocialPlatform } from "@/layouts/AdminLayout";
import { Camera, Copy, Check, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { buildSubdomainUrl } from "@/utils/subdomain";

interface ProfileHeaderCardProps {
  profile: EditorProfile;
  onUpdateUsername: (username: string) => void;
  onUpdateHandle?: (handle: string) => void;
  /** Avatar and bio are edited in Design -> Cabeçalho; both jump there. */
  onEditHeader: () => void;
  /** Social-icon links (linkType "social"), in their saved order. */
  socials: EditorLink[];
  platforms: SocialPlatform[];
  /** Opens SocialAddModal for `platform` - edit mode when `existingSocial` is given. */
  onSelectPlatform: (platform: SocialPlatform, existingSocial?: EditorLink) => void;
  onDeleteSocial: (linkId: string) => void;
}

// Which platform a saved social link belongs to - same matching the old
// SocialIconsSection used (icon value, platform id inside it, or title), so
// rows saved by older versions still resolve.
function findPlatform(social: EditorLink, platforms: SocialPlatform[]) {
  return platforms.find(
    (p) => social.icon === p.icon || social.icon?.includes(p.id) || social.title?.toLowerCase() === p.name.toLowerCase(),
  );
}

export function ProfileHeaderCard({
  profile,
  onUpdateUsername,
  onUpdateHandle,
  onEditHeader,
  socials,
  platforms,
  onSelectPlatform,
  onDeleteSocial,
}: ProfileHeaderCardProps) {
  const [copied, setCopied] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingHandle, setIsEditingHandle] = useState(false);
  const [usernameValue, setUsernameValue] = useState(profile.username || "");
  const [handleValue, setHandleValue] = useState(profile.handle || profile.username || "");
  const usernameInputRef = useRef<HTMLInputElement>(null);
  const handleInputRef = useRef<HTMLInputElement>(null);

  // Sync values when profile changes - only when NOT editing
  useEffect(() => {
    if (!isEditingUsername) {
      setUsernameValue(profile.username || "");
    }
    if (!isEditingHandle) {
      setHandleValue(profile.handle || profile.username || "");
    }
  }, [profile.username, profile.handle, isEditingUsername, isEditingHandle]);

  // Focus inputs when editing starts
  useEffect(() => {
    if (isEditingUsername && usernameInputRef.current) {
      usernameInputRef.current.focus();
      usernameInputRef.current.select();
    }
  }, [isEditingUsername]);

  useEffect(() => {
    if (isEditingHandle && handleInputRef.current) {
      handleInputRef.current.focus();
      handleInputRef.current.select();
    }
  }, [isEditingHandle]);

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = buildSubdomainUrl(profile.username || "");
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveUsername = () => {
    const trimmedValue = usernameValue.trim();
    if (trimmedValue && trimmedValue !== profile.username) {
      onUpdateUsername(trimmedValue);
      toast.success("Username atualizado!");
    } else {
      setUsernameValue(profile.username || "");
    }
    setIsEditingUsername(false);
  };

  const handleSaveHandle = () => {
    const trimmedValue = handleValue.trim();
    const currentHandle = profile.handle || profile.username;
    if (trimmedValue && trimmedValue !== currentHandle) {
      if (onUpdateHandle) {
        onUpdateHandle(trimmedValue);
        toast.success("@ atualizado!");
      } else {
        toast.error("Não foi possível salvar o @");
        setHandleValue(currentHandle || "");
      }
    } else {
      setHandleValue(currentHandle || "");
    }
    setIsEditingHandle(false);
  };

  const handleUsernameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveUsername();
    } else if (e.key === 'Escape') {
      setUsernameValue(profile.username || "");
      setIsEditingUsername(false);
    }
  };

  const handleHandleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveHandle();
    } else if (e.key === 'Escape') {
      setHandleValue(profile.handle || profile.username || "");
      setIsEditingHandle(false);
    }
  };

  const handleRemoveSocial = (social: EditorLink) => {
    onDeleteSocial(social.id);
    toast.success("Rede removida");
  };

  // Saved socials in their public-page order, each with its platform (rows
  // whose platform can't be resolved have no icon to show and are skipped).
  const addedSocials = [...socials]
    .sort((a, b) => a.order - b.order)
    .map((social) => ({ social, platform: findPlatform(social, platforms) }))
    .filter((entry): entry is { social: EditorLink; platform: SocialPlatform } => !!entry.platform);
  const addedPlatformIds = new Set(addedSocials.map((entry) => entry.platform.id));
  const missingPlatforms = platforms.filter((p) => !addedPlatformIds.has(p.id));

  const handleText = profile.handle || profile.username || "usuario";
  const bio = profile.bio?.trim();

  const subdomainChip = isEditingUsername ? (
    <div className="flex h-10 min-w-0 max-w-full items-center px-4 bg-primary/10 rounded-full ring-2 ring-primary/50 transition-all">
      <input
        ref={usernameInputRef}
        type="text"
        value={usernameValue}
        onChange={(e) => setUsernameValue(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
        onBlur={handleSaveUsername}
        onKeyDown={handleUsernameKeyDown}
        className="min-w-0 w-28 bg-transparent border-none outline-none text-sm font-medium text-foreground focus:ring-0 text-right"
        maxLength={30}
      />
      <span className="shrink-0 text-sm font-medium text-primary">.vtrine.bio</span>
    </div>
  ) : (
    // Only the name truncates - ".vtrine.bio" and the buttons never do, so a
    // long subdomain can't push the card wider than the screen.
    <div className="flex h-10 min-w-0 max-w-full items-center pl-4 bg-muted/50 rounded-full">
      <span
        className="min-w-0 truncate text-sm font-medium text-foreground cursor-pointer hover:underline"
        onClick={() => setIsEditingUsername(true)}
      >
        {profile.username || "usuario"}
      </span>
      <span className="shrink-0 text-sm text-muted-foreground">.vtrine.bio</span>
      <button
        onClick={() => setIsEditingUsername(true)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-muted transition-colors"
        title="Editar username"
      >
        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      <button
        onClick={handleCopyLink}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-muted transition-colors"
        title="Copiar link"
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
    </div>
  );

  return (
    <div className="flex items-start gap-4 p-4 bg-card rounded-2xl border border-border mb-6">
      {/* Avatar - jumps to Design -> Cabeçalho, where the photo is changed */}
      <button
        type="button"
        onClick={onEditHeader}
        className="group relative shrink-0 rounded-full"
        title="Trocar foto"
      >
        <Avatar className="h-14 w-14 md:h-16 md:w-16">
          <AvatarImage src={profile.avatarUrl || undefined} />
          <AvatarFallback className="text-xl font-bold bg-primary text-primary-foreground">
            {profile.displayName?.charAt(0) || profile.username?.charAt(0) || "?"}
          </AvatarFallback>
        </Avatar>
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <Camera className="h-5 w-5 text-white" />
        </span>
      </button>

      <div className="min-w-0 flex-1 space-y-2">
        {/* Row 1: @handle + subdomain chip (the chip drops to its own row on mobile) */}
        <div className="flex flex-col items-start gap-2 md:flex-row md:items-center md:justify-between">
          {isEditingHandle ? (
            <div className="flex h-8 max-w-full items-center px-2 bg-primary/10 rounded-lg ring-2 ring-primary/50 transition-all">
              <span className="text-primary text-sm font-semibold">@</span>
              <input
                ref={handleInputRef}
                type="text"
                value={handleValue}
                onChange={(e) => setHandleValue(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                onBlur={handleSaveHandle}
                onKeyDown={handleHandleKeyDown}
                className="min-w-0 w-28 bg-transparent border-none outline-none text-sm font-semibold text-foreground focus:ring-0"
                maxLength={30}
              />
            </div>
          ) : (
            <div className="flex min-w-0 max-w-full items-center">
              <span
                className="min-w-0 truncate text-sm font-semibold text-foreground cursor-pointer hover:underline"
                onClick={() => setIsEditingHandle(true)}
              >
                @{handleText}
              </span>
              <button
                onClick={() => setIsEditingHandle(true)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-muted transition-colors"
                title="Editar @"
              >
                <Pencil className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
          )}
          {subdomainChip}
        </div>

        {/* Row 2: bio - edited in Design -> Cabeçalho */}
        <button
          type="button"
          onClick={onEditHeader}
          className="block w-full text-left text-sm"
          title="Editar bio"
        >
          {bio ? (
            <span className="line-clamp-2 text-muted-foreground transition-colors hover:text-foreground">{bio}</span>
          ) : (
            <span className="text-muted-foreground/60 transition-colors hover:text-muted-foreground">Adicionar algo sobre você</span>
          )}
        </button>

        {/* Row 3: social icons - click one to edit/remove it, "+" adds a missing
            platform. Menus are non-modal: "Editar"/a platform open
            SocialAddModal, and a modal menu closing while a dialog opens can
            leave <body> stuck with pointer-events: none. */}
        <div className="flex flex-wrap items-center gap-2">
          {addedSocials.map(({ social, platform }) => {
            const Icon = platform.Icon;
            return (
              <DropdownMenu key={social.id} modal={false}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground transition-colors hover:bg-muted/70"
                    title={platform.name}
                    aria-label={platform.name}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => onSelectPlatform(platform, social)} className="cursor-pointer">
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleRemoveSocial(social)}
                    className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remover
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })}

          {missingPlatforms.length > 0 && (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground transition-colors hover:text-foreground"
                  title="Adicionar rede social"
                  aria-label="Adicionar rede social"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {missingPlatforms.map((platform) => {
                  const Icon = platform.Icon;
                  return (
                    <DropdownMenuItem key={platform.id} onClick={() => onSelectPlatform(platform)} className="cursor-pointer">
                      <Icon className="mr-2 h-4 w-4" />
                      {platform.name}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
}
