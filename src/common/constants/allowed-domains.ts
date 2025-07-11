import { PreferencesState } from "../types";

/**
 * Default allowed domains for the itch.io client
 */
const DEFAULT_ALLOWED_DOMAINS = ["itch.io", ".itch.io"];

/**
 * Parse domains from environment variable or config string
 * Format: "domain1.com,.domain2.com,domain3.net"
 */
function parseDomainsFromString(domainsString: string): string[] {
  if (!domainsString || domainsString.trim() === "") {
    return [];
  }

  return (
    domainsString
      .split(",")
      .map((domain) => domain.trim())
      .filter((domain) => domain.length > 0)
      // Normalize domains to ensure they start with . for subdomain matching
      .map((domain) => {
        if (domain.startsWith(".")) {
          return domain;
        }
        // For exact domain matches, we store both forms
        return domain;
      })
  );
}

/**
 * Get allowed domains from multiple sources in priority order:
 * 1. User preferences (if showAdvanced is enabled)
 * 2. Environment variable ITCH_ALLOWED_DOMAINS
 * 3. Default itch.io domains
 */
export function getAllowedDomains(preferences?: PreferencesState): string[] {
  // Priority 1: User preferences (if allowedDomains is set)
  if (preferences?.allowedDomains) {
    const userDomains = parseDomainsFromString(preferences.allowedDomains);
    if (userDomains.length > 0) {
      return userDomains;
    }
  }

  // Priority 2: Environment variable
  const envDomains = process.env.ITCH_ALLOWED_DOMAINS;
  if (envDomains) {
    const envParsedDomains = parseDomainsFromString(envDomains);
    if (envParsedDomains.length > 0) {
      return envParsedDomains;
    }
  }

  // Priority 3: Default domains
  return DEFAULT_ALLOWED_DOMAINS;
}

/**
 * Check if a URL origin is allowed based on configured domains
 */
export function isOriginAllowed(
  origin: string,
  preferences?: PreferencesState
): boolean {
  const allowedDomains = getAllowedDomains(preferences);

  for (const allowedDomain of allowedDomains) {
    if (allowedDomain.startsWith(".")) {
      // Subdomain match (e.g., ".itch.io" matches "https://mysite.itch.io")
      const domainPart = allowedDomain; // Keep the leading dot
      if (origin.includes(domainPart)) {
        return true;
      }
    } else {
      // Exact domain match - check if origin contains the domain
      if (
        origin.includes(`://${allowedDomain}`) ||
        origin.includes(`//${allowedDomain}`)
      ) {
        return true;
      }
      // Also check without protocol for cases like "localhost:8080"
      if (origin.includes(allowedDomain)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check if a URL is allowed (convenience function that parses the URL)
 */
export function isUrlAllowed(
  url: string,
  preferences?: PreferencesState
): boolean {
  try {
    const parsedUrl = new URL(url);
    return isOriginAllowed(parsedUrl.origin, preferences);
  } catch {
    // Invalid URL
    return false;
  }
}

/**
 * Legacy compatibility: check if URL matches itch.io patterns
 * This maintains the original hardcoded behavior for fallback
 */
export function isItchIoUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return (
      parsedUrl.origin.endsWith(".itch.io") ||
      parsedUrl.origin.endsWith("/itch.io")
    );
  } catch {
    return false;
  }
}
