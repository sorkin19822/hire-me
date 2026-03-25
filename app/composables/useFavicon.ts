export function getFaviconUrl(siteUrl: string | null | undefined): string | null {
  if (!siteUrl) return null
  try {
    const { hostname } = new URL(siteUrl)
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`
  } catch {
    return null
  }
}
