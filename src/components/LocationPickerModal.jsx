import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, X, Navigation, Search, Check } from 'lucide-react';
import toast from 'react-hot-toast';

// Fix for default marker icon in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// A component that handles clicking on the map to set a marker
function MapEvents({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng);
    },
  });
  return null;
}

export default function LocationPickerModal({ isOpen, onClose, onSelectLocation, lang }) {
  const [position, setPosition] = useState(null); // {lat, lng}
  const [locationName, setLocationName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Default to Vientiane, Laos if no position
  const defaultCenter = [17.9757, 102.6331];

  // Reverse geocode to get city name
  const fetchLocationName = async (lat, lng) => {
    setIsLoading(true);
    try {
      // Use Nominatim OSM API
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`);
      if (!res.ok) throw new Error('Geocoding failed');
      const data = await res.json();
      
      const city = data.address.city || data.address.town || data.address.village || data.address.state || 'Unknown Location';
      setLocationName(city);
    } catch (err) {
      console.error(err);
      toast.error(lang === 'lo' ? 'ບໍ່ສາມາດດຶງຊື່ສະຖານທີ່ໄດ້' : 'Failed to fetch location name');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMapClick = (latlng) => {
    setPosition(latlng);
    fetchLocationName(latlng.lat, latlng.lng);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error(lang === 'lo' ? 'ບຣາວເຊີຂອງທ່ານບໍ່ຮອງຮັບສະຖານທີ່' : 'Geolocation is not supported by your browser');
      return;
    }
    
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const newPos = { lat: latitude, lng: longitude };
        setPosition(newPos);
        fetchLocationName(latitude, longitude);
      },
      (err) => {
        setIsLoading(false);
        toast.error(lang === 'lo' ? 'ບໍ່ສາມາດເຂົ້າເຖິງສະຖານທີ່ໄດ້' : 'Unable to retrieve your location');
      }
    );
  };

  const handleConfirm = () => {
    if (locationName) {
      onSelectLocation(locationName);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-card w-full max-w-xl rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col h-[80vh] max-h-[600px] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MapPin className="text-primary" size={20} />
            {lang === 'lo' ? 'ເລືອກສະຖານທີ່' : 'Select Location'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Map Area */}
        <div className="flex-1 relative bg-muted/20">
          <MapContainer 
            center={position || defaultCenter} 
            zoom={13} 
            style={{ height: '100%', width: '100%', zIndex: 10 }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {position && (
              <Marker position={position} />
            )}
            <MapEvents onLocationSelect={handleMapClick} />
          </MapContainer>
          
          {/* Floating 'Use My Location' Button */}
          <div className="absolute bottom-4 right-4 z-[20]">
            <button
              onClick={handleUseMyLocation}
              disabled={isLoading}
              className="bg-card text-foreground shadow-lg px-4 py-2 rounded-full font-medium text-sm flex items-center gap-2 hover:bg-muted transition-colors disabled:opacity-50 border border-border"
            >
              <Navigation size={16} className={isLoading ? "animate-pulse text-primary" : "text-primary"} />
              {lang === 'lo' ? 'ສະຖານທີ່ປະຈຸບັນ' : 'Use My Location'}
            </button>
          </div>
        </div>

        {/* Footer / Confirm Area */}
        <div className="p-4 border-t border-border/50 bg-card flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-muted px-4 py-2.5 rounded-xl border border-border/50">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">
                {lang === 'lo' ? 'ສະຖານທີ່ທີ່ເລືອກ:' : 'Selected Location:'}
              </p>
              <p className="font-semibold text-foreground truncate min-h-[24px]">
                {isLoading ? (lang === 'lo' ? 'ກຳລັງຊອກຫາ...' : 'Loading...') : (locationName || (lang === 'lo' ? 'ກະລຸນາເລືອກໃນແຜນທີ່' : 'Please select on map'))}
              </p>
            </div>
            
            <button
              onClick={handleConfirm}
              disabled={!locationName || isLoading}
              className="bg-primary text-primary-foreground h-full px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              <Check size={18} />
              {lang === 'lo' ? 'ຢືນຢັນ' : 'Confirm'}
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}
