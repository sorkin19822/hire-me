export function getFaviconUrl(siteUrl: string | null | undefined): string | null {
  if (!siteUrl) return null
  try {
    const { hostname } = new URL(siteUrl)
    return `https://icons.duckduckgo.com/ip3/${hostname}.ico`
  } catch {
    return null
  }
}
