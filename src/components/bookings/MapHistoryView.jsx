import React, { useRef, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { extractLatLng } from '../../utils/locationUtils';
import { Share2, Download } from 'lucide-react';
import html2canvas from 'html2canvas';

// Custom icons for the track
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px ${color}80;"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

const startIcon = createCustomIcon('#0ABAB5'); // teal for start
const midIcon = createCustomIcon('#F59E0B'); // amber for mid points
const endIcon = createCustomIcon('#EF4444'); // red for end

// Component to handle bounds and map invalidation when sharing
const MapController = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
};

export default function MapHistoryView({ bookings, lang, currentUser }) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Sort bookings chronologically (oldest first) to draw a logical path
  const sortedBookings = [...bookings].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

  const markers = sortedBookings.map(booking => {
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

  const polylinePositions = markers.map(m => [m.lat, m.lng]);
  
  // Calculate bounds
  const lats = markers.map(m => m.lat);
  const lngs = markers.map(m => m.lng);
  const bounds = [
    [Math.min(...lats) - 0.1, Math.min(...lngs) - 0.1],
    [Math.max(...lats) + 0.1, Math.max(...lngs) + 0.1]
  ];

  const handleShare = async () => {
    if (!containerRef.current) return;
    setIsCapturing(true);
    
    try {
      // Small delay to ensure UI updates before capture (hide popup/buttons)
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const canvas = await html2canvas(containerRef.current, {
        useCORS: true, // Allow cross-origin images (map tiles)
        allowTaint: true,
        scale: 2, // High resolution
        backgroundColor: '#1a1a1a', // match dark map
      });
      
      const imageBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const file = new File([imageBlob], 'itimeyou-journey.png', { type: 'image/png' });
      
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'My iTimeYou Journey',
          text: 'Check out my travel roadmap on iTimeYou! 🌍✈️',
          files: [file],
        });
      } else {
        // Fallback to download if Web Share API is not supported (desktop/unsupported browsers)
        const url = URL.createObjectURL(imageBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'itimeyou-journey.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Failed to share map:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="relative group mt-2">
      {/* Share Button Overlay */}
      {!isCapturing && (
        <button 
          onClick={handleShare}
          className="absolute top-4 right-4 z-[500] bg-primary text-primary-foreground px-4 py-2.5 rounded-full shadow-lg shadow-primary/30 flex items-center gap-2 font-bold hover:scale-105 transition-transform"
        >
          <Share2 size={16} />
          {lang === 'lo' ? 'ແຊຣ໌ການເດີນທາງ' : 'Share Journey'}
        </button>
      )}

      {/* Map Container for Capture */}
      <div 
        ref={containerRef}
        className="bg-[#1a1a1a] rounded-[24px] shadow-lg overflow-hidden h-[600px] relative border-[4px] border-card"
      >
        <div className="absolute top-4 left-4 z-[400] bg-black/60 backdrop-blur-md px-4 py-2.5 rounded-full shadow-md border border-white/10 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0ABAB5] animate-pulse shadow-[0_0_8px_#0ABAB5]"></span>
          <span className="text-sm font-bold text-white tracking-wide font-sans">
            {lang === 'lo' ? 'ແຜນທີ່ການເດີນທາງ iTimeYou' : 'iTimeYou Travel Map'}
          </span>
        </div>
        
        {/* Branding watermark for the shared image */}
        {isCapturing && (
          <div className="absolute bottom-6 right-6 z-[400] text-white/50 text-4xl drop-shadow-lg brand-logo">
            iTimeYou
          </div>
        )}

        <MapContainer 
          ref={mapRef}
          bounds={bounds}
          zoomControl={!isCapturing}
          attributionControl={!isCapturing}
          style={{ height: '100%', width: '100%', zIndex: 10, backgroundColor: '#1a1a1a' }}
        >
          <MapController bounds={bounds} />
          
          {/* Dark Matter tiles for premium glowing tracking look */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; CARTO'
            crossOrigin="anonymous" 
          />
          
          {/* The glowing track line */}
          {polylinePositions.length > 1 && (
            <>
              {/* Outer glow */}
              <Polyline 
                positions={polylinePositions} 
                color="#0ABAB5" 
                weight={8} 
                opacity={0.3} 
                lineCap="round" 
                lineJoin="round" 
              />
              {/* Inner core dashed line */}
              <Polyline 
                positions={polylinePositions} 
                color="#12E2DC" 
                weight={3} 
                opacity={0.9} 
                dashArray="10, 15"
                lineCap="round" 
                lineJoin="round" 
              />
            </>
          )}

          {markers.map((marker, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === markers.length - 1;
            const icon = markers.length === 1 ? startIcon : (isLast ? endIcon : (isFirst ? startIcon : midIcon));

            const statusColors = {
              pending: 'text-amber-600 bg-amber-50',
              confirmed: 'text-emerald-600 bg-emerald-50',
              completed: 'text-blue-600 bg-blue-50',
              cancelled: 'text-red-600 bg-red-50'
            };
            const badgeClass = statusColors[marker.status] || statusColors.pending;

            return (
              <Marker key={idx} position={[marker.lat, marker.lng]} icon={icon}>
                {!isCapturing && (
                  <Popup className="custom-popup rounded-2xl overflow-hidden shadow-xl border-0">
                    <div className="min-w-[200px] pb-1">
                      {marker.image && (
                        <img src={marker.image} className="w-full h-24 object-cover -mt-4 -mx-5 mb-3 rounded-t-[10px]" alt="Location" />
                      )}
                      <h3 className="font-bold text-base leading-tight mb-1 font-sans text-black">{marker.service_type}</h3>
                      <div className="text-xs text-muted-foreground mb-3">{marker.service_location}</div>
                      
                      <div className="flex justify-between items-center border-t border-border/50 pt-2 mt-2">
                        <span className="font-semibold text-primary">{marker.price?.toLocaleString()} LAK</span>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${badgeClass}`}>
                          {marker.status}
                        </span>
                      </div>
                    </div>
                  </Popup>
                )}
              </Marker>
            )
          })}
        </MapContainer>
      </div>
    </div>
  );
}
