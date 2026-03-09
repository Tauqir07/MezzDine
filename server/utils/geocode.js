export async function geocodeAddress(address) {
  try {
    const query    = encodeURIComponent(address);
    const url      = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;

    const response = await fetch(url, {
      headers: {
        // Nominatim requires a descriptive User-Agent
        "User-Agent": "MeZzDiNe-App/1.0"
      }
    });

    const data = await response.json();

    if (!data || data.length === 0) return null;

    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    };
  } catch (err) {
    console.error("Geocoding failed:", err.message);
    return null;
  }
}