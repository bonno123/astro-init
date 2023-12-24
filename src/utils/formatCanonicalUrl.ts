/**
 * Enforce some standard canonical URL formatting across the site.
*/
export function formatCanonicalURL(url: string | URL) {
    const path = url.toString()
    const hasQueryParams = path.includes("?")
  
    if (hasQueryParams) {
      // If there are query params, make sure the URL has no trailing slash
      path.replace(/\/?$/, "")
    }
  
    // otherwise, canonical URL always has a trailing slash
    return path.replace(/\/?$/, hasQueryParams ? "" : "/")
  }