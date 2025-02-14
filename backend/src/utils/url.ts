function isValidURL(url: string): boolean {
  try {
    // First encode the URL to handle non-ASCII characters
    const encodedUrl = encodeURI(url);
    new URL(encodedUrl);
    return true;
  } catch (err) {
    return false;
  }
}

export { isValidURL };