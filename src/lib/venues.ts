// Link de mapa para um local do programa. `maps` vem do registo do evento (src/events);
// locais sem link oficial usam uma pesquisa no Google Maps.
export function venueMapUrl(venue: string, maps: Record<string, string> = {}) {
  const q = /maputo/i.test(venue) ? `${venue}, Moçambique` : `${venue}, Maputo, Moçambique`
  return maps[venue] ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
}
