// Estados de Venezuela con centroides aproximados (lat/lng) para
// ordenar el directorio según la cercanía del visitante.

export interface VenezuelaState {
  name: string;
  lat: number;
  lng: number;
}

export const VENEZUELA_STATES: VenezuelaState[] = [
  { name: "Amazonas", lat: 3.9, lng: -67.4 },
  { name: "Anzoátegui", lat: 9.3, lng: -64.3 },
  { name: "Apure", lat: 7.0, lng: -68.5 },
  { name: "Aragua", lat: 10.2, lng: -67.3 },
  { name: "Barinas", lat: 8.6, lng: -70.2 },
  { name: "Bolívar", lat: 6.5, lng: -63.0 },
  { name: "Carabobo", lat: 10.2, lng: -68.0 },
  { name: "Cojedes", lat: 9.4, lng: -68.6 },
  { name: "Delta Amacuro", lat: 8.6, lng: -61.0 },
  { name: "Distrito Capital", lat: 10.5, lng: -66.9 },
  { name: "Falcón", lat: 11.2, lng: -69.7 },
  { name: "Guárico", lat: 8.7, lng: -66.7 },
  { name: "La Guaira", lat: 10.6, lng: -66.9 },
  { name: "Lara", lat: 10.0, lng: -69.8 },
  { name: "Mérida", lat: 8.6, lng: -71.1 },
  { name: "Miranda", lat: 10.3, lng: -66.6 },
  { name: "Monagas", lat: 9.7, lng: -63.2 },
  { name: "Nueva Esparta", lat: 11.0, lng: -63.9 },
  { name: "Portuguesa", lat: 9.0, lng: -69.7 },
  { name: "Sucre", lat: 10.5, lng: -63.5 },
  { name: "Táchira", lat: 7.8, lng: -72.2 },
  { name: "Trujillo", lat: 9.3, lng: -70.4 },
  { name: "Yaracuy", lat: 10.3, lng: -68.7 },
  { name: "Zulia", lat: 10.0, lng: -71.7 },
  { name: "Dependencias Federales", lat: 11.7, lng: -66.5 },
];

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function nearestState(lat: number, lng: number): string {
  let best = VENEZUELA_STATES[0];
  let bestD = Infinity;
  for (const s of VENEZUELA_STATES) {
    const d = haversineKm({ lat, lng }, s);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return best.name;
}
