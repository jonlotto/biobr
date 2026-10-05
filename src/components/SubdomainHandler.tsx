import { extractSubdomain, isMainDomain } from "@/utils/subdomain";
import { lazy } from "react";
import BioPage from "@/pages/BioPage";

// Lazy: the landing page is only ever shown on the main domain, so bio
// subdomains (the hot path) don't download it.
const Index = lazy(() => import("@/pages/Index"));

/**
 * Smart handler for root route (/)
 * - If accessed via subdomain (joao.vtrine.bio): renders BioPage
 * - If accessed via main domain (vtrine.bio): renders Index (landing page)
 */
const SubdomainHandler = () => {
  const subdomain = extractSubdomain();

  // If there's a valid subdomain, render the user's bio page
  if (subdomain) {
    return <BioPage />;
  }

  // If on main domain, render the landing page
  if (isMainDomain()) {
    return <Index />;
  }

  // Fallback: render landing page
  return <Index />;
};

export default SubdomainHandler;
