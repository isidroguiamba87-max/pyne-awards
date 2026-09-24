// Links de mapa dos locais do programa. Chave = campo "venue" do programa.json.
// Locais sem link oficial usam uma pesquisa no Google Maps.
const MAPS: Record<string, string> = {
  'Polana Serena Hotel': 'https://maps.app.goo.gl/bb5DqXSrK19mZ2W28',
}

export function venueMapUrl(venue: string) {
  const q = /maputo/i.test(venue) ? `${venue}, Moçambique` : `${venue}, Maputo, Moçambique`
  return MAPS[venue] ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
}
