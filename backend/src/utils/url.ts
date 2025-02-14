/**
 * Validates and encodes a URL, handling non-ASCII characters
 * @param url The URL to validate
 * @returns boolean indicating if the URL is valid
 */
function isValidURL(url: string): boolean {
  try {
    // Handle potential undefined or null
    if (!url) return false;
    
    // Split URL into base and path
    const [base, ...pathParts] = url.split('/files/');
    
    if (pathParts.length === 0) return false;
    
    // Encode only the filename part
    const encodedPath = pathParts.join('/files/').split('/')
      .map(part => encodeURIComponent(part))
      .join('/');
    
    const fullUrl = `${base}/files/${encodedPath}`;
    new URL(fullUrl);
    
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Encodes a URL with proper handling of Cyrillic characters
 * @param url The URL to encode
 * @returns The encoded URL string
 */
function encodeURL(url: string): string {
  const [base, ...pathParts] = url.split('/files/');
  const encodedPath = pathParts.join('/files/').split('/')
    .map(part => encodeURIComponent(part))
    .join('/');
  
  return `${base}/files/${encodedPath}`;
}

export { isValidURL, encodeURL };