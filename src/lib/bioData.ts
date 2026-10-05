import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;
type LinkType = Tables<"links">;

export interface BioData {
  profile: Profile | null;
  links: LinkType[];
}

// Started by the inline script in index.html, before the JS bundle has even
// downloaded - see the comment there. Only present on a bio subdomain.
declare global {
  interface Window {
    __BIO_PREFETCH__?: { username: string; promise: Promise<BioData> };
  }
}

const CACHE_PREFIX = "vtrine-bio:";

/**
 * Last-seen profile/links for this username, so a repeat visit renders the
 * page instantly from the very first paint while the fresh copy loads.
 */
export function readCachedBio(username: string): BioData | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + username);
    return raw ? (JSON.parse(raw) as BioData) : null;
  } catch {
    return null;
  }
}

export function writeCachedBio(username: string, data: BioData | null): void {
  try {
    if (data?.profile) localStorage.setItem(CACHE_PREFIX + username, JSON.stringify(data));
    else localStorage.removeItem(CACHE_PREFIX + username);
  } catch {
    // Storage full/blocked - the cache is only a speed-up, nothing to do.
  }
}

async function fetchBioWithClient(username: string): Promise<BioData> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  if (error) throw error;
  if (!profile) return { profile: null, links: [] };

  const { data: links, error: linksError } = await supabase
    .from("links")
    .select("*")
    .eq("user_id", profile.user_id)
    .eq("is_active", true)
    .order("position", { ascending: true });

  if (linksError) throw linksError;
  return { profile, links: links || [] };
}

/**
 * Profile + active links for a bio page. Reuses index.html's early prefetch
 * when it was started for this same username, falling back to the regular
 * Supabase client if it wasn't (path-based /username in dev) or it failed.
 */
export async function fetchBio(username: string): Promise<BioData> {
  const prefetch = window.__BIO_PREFETCH__;
  if (prefetch && prefetch.username === username) {
    // One-shot: a later refetch (e.g. navigating back) should hit the network.
    window.__BIO_PREFETCH__ = undefined;
    try {
      return await prefetch.promise;
    } catch {
      // fall through to the client
    }
  }
  return fetchBioWithClient(username);
}
