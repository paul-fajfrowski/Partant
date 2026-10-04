/** Release builds cannot be switched into fixtures or integration tools by URL. */
export function runtimeMode(production: boolean, platform: string, data?: string | null, configured?: string, tools?: string | null) {
  return {
    live: production || (data ?? configured ?? (platform === 'web' ? 'preview' : 'connected')) === 'connected',
    connectionTools: !production && platform === 'web' && tools === 'connections',
  };
}
