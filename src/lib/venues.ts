// Links de mapa dos locais do programa. Chave = campo "venue" do programa.json.
// Locais sem link oficial usam uma pesquisa no Google Maps.
const MAPS: Record<string, string> = {
  'Polana Serena Hotel': 'https://maps.app.goo.gl/bb5DqXSrK19mZ2W28',
  'Hotel Cardoso':
    'https://www.google.com/maps/place/Hotel+Cardoso+Maputo/@-25.9781775,32.5859374,17z/data=!4m9!3m8!1s0x1ee69ba1079afda7:0x1446007a51f5f550!5m2!4m1!1i2!8m2!3d-25.9781775!4d32.5859374!16s%2Fg%2F1xc60jv_!5m1!1e1?entry=ttu&g_ep=EgoyMDI2MDkyMS4wIKXMDSoASAFQAw%3D%3D',
}

export function venueMapUrl(venue: string) {
  const q = /maputo/i.test(venue) ? `${venue}, Moçambique` : `${venue}, Maputo, Moçambique`
  return MAPS[venue] ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
}
