import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { extractLatLng } from '../../utils/locationUtils';

// Fix for default marker icons in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function MapHistoryView({ bookings, lang, currentUser }) {
  const mapCenter = [17.9757, 102.6331]; // Default to Vientiane

  const markers = bookings.map(booking => {
    const coords = extractLatLng(booking.service_location || booking.city);
    if (!coords) return null;
    return { ...booking, lat: coords.lat, lng: coords.lng };
  }).filter(Boolean);

  if (markers.length === 0) {
    return (
      <div className="bg-card rounded-[24px] border border-border p-10 text-center text-muted-foreground flex flex-col items-center justify-center h-[500px]">
        <div className="text-4xl mb-3">🗺️</div>
        <p>{lang === 'lo' ? 'ບໍ່ມີຂໍ້ມູນສະຖານທີ່ສໍາລັບທຸລະກໍາຂອງທ່ານ.' : 'No location data available for your transactions.'}</p>
      </div>
    );
  }

  // Calculate bounds if we have multiple markers
  const lats = markers.map(m => m.lat);
  const lngs = markers.map(m => m.lng);
  const bounds = [
    [Math.min(...lats) - 0.1, Math.min(...lngs) - 0.1],
    [Math.max(...lats) + 0.1, Math.max(...lngs) + 0.1]
  ];

  return (
    <div className="bg-card rounded-[24px] shadow-sm overflow-hidden h-[600px] relative border border-border/50">
      <div className="absolute top-4 left-4 z-[400] bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-md border border-black/5 flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
        <span className="text-sm font-semibold text-black/80">
          {lang === 'lo' ? 'ແຜນທີ່ທຸລະກໍາ' : 'Transaction History Map'}
        </span>
      </div>
      
      <MapContainer 
        bounds={bounds}
        center={mapCenter} 
        zoom={6} 
        style={{ height: '100%', width: '100%', zIndex: 10 }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        {markers.map((marker, idx) => {
          const statusColors = {
            pending: 'text-amber-600 bg-amber-50',
            confirmed: 'text-emerald-600 bg-emerald-50',
            completed: 'text-blue-600 bg-blue-50',
            cancelled: 'text-red-600 bg-red-50'
          };
          const badgeClass = statusColors[marker.status] || statusColors.pending;

          return (
            <Marker key={idx} position={[marker.lat, marker.lng]}>
              <Popup className="custom-popup rounded-2xl overflow-hidden shadow-xl border-0">
                <div className="min-w-[200px] pb-1">
                  {marker.image && (
                    <img src={marker.image} className="w-full h-24 object-cover -mt-4 -mx-5 mb-3 rounded-t-[10px]" alt="Location" />
                  )}
                  <h3 className="font-bold text-base leading-tight mb-1 font-sans">{marker.service_type}</h3>
                  <div className="text-xs text-muted-foreground mb-3">{marker.service_location}</div>
                  
                  <div className="flex justify-between items-center border-t border-border/50 pt-2 mt-2">
                    <span className="font-semibold text-primary">{marker.price?.toLocaleString()} LAK</span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${badgeClass}`}>
                      {marker.status}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  );
}
