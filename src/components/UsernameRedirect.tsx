import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { buildSubdomainUrl, isDevelopment, isReservedPath } from "@/utils/subdomain";
import BioPage from "@/pages/BioPage";

/**
 * Handles redirect from /username path to username.vtrine.bio subdomain
 * In development, renders BioPage directly
 */
const UsernameRedirect = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!username) {
      navigate("/");
      return;
    }

    // Don't redirect reserved paths
    if (isReservedPath(username)) {
      return;
    }

    // In development/preview, don't redirect - just show the page
    if (isDevelopment()) {
      return;
    }

    // In production, redirect to subdomain
    const subdomainUrl = buildSubdomainUrl(username);
    
    // Use replace to perform a 301-like redirect
    window.location.replace(subdomainUrl);
  }, [username, navigate]);

  // In development or while redirecting, show BioPage
  if (isDevelopment() || !username) {
    return <BioPage />;
  }

  // Show loading while redirecting in production
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="relative flex items-center justify-center mb-4">
          <div className="absolute w-8 h-8 bg-primary/30 rounded-full animate-ping" />
          <div className="w-6 h-6 bg-primary rounded-full" />
        </div>
        <p className="text-white/60 text-sm">Redirecionando...</p>
      </div>
    </div>
  );
};

export default UsernameRedirect;
