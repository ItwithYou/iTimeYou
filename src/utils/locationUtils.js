export const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; 
  const dLat = (lat2-lat1) * (Math.PI/180);
  const dLon = (lon2-lon1) * (Math.PI/180); 
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * (Math.PI/180)) * Math.cos(lat2 * (Math.PI/180)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; 
};

export const extractLatLng = (locStr) => {
  if (!locStr) return null;
  const match = locStr.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
  const coordsMatch = locStr.match(/^(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)$/);
  if (coordsMatch) return { lat: parseFloat(coordsMatch[1]), lng: parseFloat(coordsMatch[2]) };
  
  const s = locStr.toLowerCase();
  if (s.includes('vientiane') || s.includes('ວຽງຈັນ')) return { lat: 17.9757, lng: 102.6331 };
  if (s.includes('luang prabang') || s.includes('ຫຼວງພະບາງ')) return { lat: 19.8833, lng: 102.1333 };
  if (s.includes('vang vieng') || s.includes('ວັງວຽງ')) return { lat: 18.9220, lng: 102.4430 };
  if (s.includes('pakse') || s.includes('ປາກເຊ')) return { lat: 15.1167, lng: 105.7833 };
  if (s.includes('savannakhet') || s.includes('ສະຫວັນນະເຂດ')) return { lat: 16.5500, lng: 104.7500 };
  
  return null;
};
