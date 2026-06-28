import { useState, useRef } from 'react';
import { firebaseClient } from '@/api/firebaseClient';
import { X, Image, DollarSign, Loader2, CheckSquare, Square } from 'lucide-react';
import MobileSelect from './MobileSelect';
import PhotoGrid from './PhotoGrid';
import { toast } from 'sonner';
import { BUSINESS_CATS } from '../hooks/useLang';



const AMENITIES_LIST = [
  { key: 'Wifi', label: 'Wifi', labelLo: 'ໄວໄຟ' },
  { key: 'Air Conditioning', label: 'AC', labelLo: 'ແອ' },
  { key: 'Kitchen', label: 'Kitchen', labelLo: 'ຫ້ອງຄົວ' },
  { key: 'Pool', label: 'Pool', labelLo: 'ສະລອຍນ້ຳ' },
  { key: 'Parking', label: 'Free Parking', labelLo: 'ບ່ອນຈອດລົດ' },
  { key: 'TV', label: 'TV', labelLo: 'ທີວີ' },
];

export default function CreateListing({ profile, currentUser, lang, t, onPosted, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen || false);
  const [title, setTitle] = useState('');
  const [titleLao, setTitleLao] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionLao, setDescriptionLao] = useState('');
  const [price, setPrice] = useState('');
  const [cleaningFee, setCleaningFee] = useState('0');
  const [serviceFee, setServiceFee] = useState('0');
  const [category, setCategory] = useState(BUSINESS_CATS[0]?.key || 'stay');
  const [city, setCity] = useState('');
  const [cityLao, setCityLao] = useState('');
  const [country, setCountry] = useState('Laos');
  const [guests, setGuests] = useState(2);
  const [beds, setBeds] = useState(1);
  const [baths, setBaths] = useState(1);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [posting, setPosting] = useState(false);
  const photoInputRef = useRef(null);

  const handlePhotos = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const total = photoFiles.length + files.length;
    if (total > 10) {
      toast.error(lang === 'lo' ? 'ສູງສຸດ 10 ຮູບ' : 'Maximum 10 photos');
      return;
    }
    setPhotoFiles(prev => [...prev, ...files]);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => setPhotoPreviews(prev => [...prev, ev.target.result]);
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index) => {
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const toggleAmenity = (amenity) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const handlePost = async () => {
    if (!title.trim() || !titleLao.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!city.trim() || !country.trim()) {
      toast.error('City and Country are required');
      return;
    }
    if (photoFiles.length === 0) {
      toast.error('At least one photo is required');
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    setPosting(true);
    try {
      const uploads = await Promise.all(photoFiles.map(f => firebaseClient.integrations.Core.UploadFile({ file: f })));
      const image_urls = uploads.map(u => u.file_url).filter(Boolean);
      const image_url = image_urls[0] || '';

      const cat = BUSINESS_CATS.find(c => c.key === category) || {};
      await firebaseClient.entities.Listing.create({
        title: title.trim(),
        title_lao: titleLao.trim() || title.trim(),
        description: description.trim(),
        description_lao: descriptionLao.trim() || description.trim(),
        image_url,
        image_urls,
        price: parseFloat(price) || 0,
        currency: 'USD' + (cat.priceUnit || '/night').toUpperCase(),
        cleaning_fee: parseFloat(cleaningFee) || 0,
        service_fee: parseFloat(serviceFee) || 0,
        category,
        city: city.trim() || 'Vientiane',
        city_lao: cityLao.trim() || city.trim() || 'ວຽງຈັນ',
        country: country.trim() || 'Laos',
        guests: parseInt(guests) || 1,
        beds: parseInt(beds) || 1,
        baths: parseInt(baths) || 1,
        amenities: selectedAmenities,
        host_email: currentUser.email,
        rating: 5.0,
        review_count: 0,
      });

      setTitle('');
      setTitleLao('');
      setDescription('');
      setDescriptionLao('');
      setPrice('');
      setCleaningFee('0');
      setServiceFee('0');
      setCategory(BUSINESS_CATS[0]?.key || 'stay');
      setCity('');
      setCityLao('');
      setSelectedAmenities([]);
      setPhotoFiles([]);
      setPhotoPreviews([]);
      setOpen(false);
      toast.success(lang === 'lo' ? 'ລົງລາຍການສຳເລັດ ✅' : 'Listing posted! ✅');
      onPosted?.();
    } catch (err) {
      toast.error(err.message || 'Failed to post listing');
    } finally {
      setPosting(false);
    }
  };

  if (!currentUser) return null;

  if (!open) {
    return (
      <div className="bg-card rounded-2xl p-4 shadow-sm border border-border flex items-center justify-between">
        <div className="flex gap-3 items-center">
          <img
            src={profile?.photo_url || profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.email}`}
            alt=""
            className="w-9 h-9 rounded-full object-cover flex-shrink-0"
          />
          <span className="text-sm font-semibold text-muted-foreground">
            {lang === 'lo' ? 'ຕ້ອງການລົງໂພສທີ່ພັກໃໝ່ບໍ?' : 'Want to post a new accommodation?'}
          </span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="bg-gradient-to-r from-tiffany to-deep-green text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
        >
          + {lang === 'lo' ? 'ລົງທີ່ພັກ' : 'Add Stay'}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl shadow-lg border border-primary/20 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-tiffany/5 to-deep-green/5">
        <h3 className="font-bold text-sm">{lang === 'lo' ? 'ສ້າງລາຍການທີ່ພັກ' : 'Create Accommodation Listing'}</h3>
        {!defaultOpen && (
          <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted">
            <X size={16} />
          </button>
        )}
      </div>

      <div className="p-4 space-y-4 text-sm">
        {/* Photos */}
        <div>
          <div className="flex items-center justify-between mb-2 border-b border-border pb-2">
             <label className="text-xs font-semibold text-muted-foreground uppercase">
               {lang === 'lo' ? 'ຮູບພາບທີ່ພັກ' : 'Listing Photos'}
             </label>
             <button type="button" onClick={() => photoInputRef.current?.click()} className="flex items-center gap-1.5 text-xs font-bold text-primary hover:bg-primary/10 px-2 py-1 rounded transition-colors">
               <Image size={14} /> {lang === 'lo' ? 'ເພີ່ມຮູບ' : 'Add Photos'}{photoFiles.length > 0 ? ` (${photoFiles.length})` : ''}
             </button>
          </div>
          {photoPreviews.length > 0 ? (
            <div className="mb-4 rounded-xl overflow-hidden border border-border relative">
              <PhotoGrid photos={photoPreviews} onRemove={removePhoto} />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="w-full h-28 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors mb-4 bg-muted/30"
            >
              <Image size={24} className="mb-1" />
              <span className="text-xs">{lang === 'lo' ? 'ອັບໂຫລດຮູບທີ່ພັກ' : 'Upload photos of the space'}</span>
            </button>
          )}
          <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotos} />
        </div>

        {/* Title & Description */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Title (EN)</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Cozy studio near city center" className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary bg-muted/30" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Title (Lao)</label>
            <input value={titleLao} onChange={e => setTitleLao(e.target.value)} placeholder="ຫ້ອງສະຕູດີໂອ ໃກ້ໃຈກາງເມືອງ" className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary bg-muted/30" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Description (EN)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Detailed description of the stay..." className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary bg-muted/30 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Description (Lao)</label>
            <textarea value={descriptionLao} onChange={e => setDescriptionLao(e.target.value)} rows={3} placeholder="ລາຍລະອຽດທີ່ພັກເປັນພາສາລາວ..." className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary bg-muted/30 resize-none" />
          </div>
        </div>

        {/* Category & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Category</label>
            <MobileSelect
              value={category}
              onChange={setCategory}
              options={BUSINESS_CATS.map(c => ({ value: c.key, label: lang === 'lo' ? c.lo : c.en }))}
              placeholder="Category"
              label="Select Category"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">City (EN)</label>
            <input value={city} onChange={e => setCity(e.target.value)} placeholder="Vientiane" className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary bg-muted/30" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">City (Lao)</label>
            <input value={cityLao} onChange={e => setCityLao(e.target.value)} placeholder="ນະຄອນຫຼວງວຽງຈັນ" className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary bg-muted/30" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Country</label>
            <input value={country} onChange={e => setCountry(e.target.value)} placeholder="Laos" className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary bg-muted/30" />
          </div>
        </div>

        {/* Guests, Beds, Baths */}
        {(() => {
          const cat = BUSINESS_CATS.find(c => c.key === category) || {};
          return (
            cat.hasGuests || cat.hasBeds || cat.hasBaths
          ) ? (
            <div className="grid grid-cols-3 gap-3">
              {cat.hasGuests && (
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Max Guests</label>
                  <input type="number" min="1" value={guests} onChange={e => setGuests(parseInt(e.target.value) || 1)} className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary bg-muted/30" />
                </div>
              )}
              {cat.hasBeds && (
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Beds</label>
                  <input type="number" min="1" value={beds} onChange={e => setBeds(parseInt(e.target.value) || 1)} className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary bg-muted/30" />
                </div>
              )}
              {cat.hasBaths && (
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Baths</label>
                  <input type="number" min="1" value={baths} onChange={e => setBaths(parseInt(e.target.value) || 1)} className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary bg-muted/30" />
                </div>
              )}
            </div>
          ) : null;
        })()}

        {/* Pricing */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
              <DollarSign size={11} /> 
              {(() => {
                const cat = BUSINESS_CATS.find(c => c.key === category);
                return `Price ${lang === 'lo' && cat?.priceUnitLo ? cat.priceUnitLo : (cat?.priceUnit || '/night')} (USD)`;
              })()}
            </label>
            <input type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary bg-muted/30" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Cleaning Fee (USD)</label>
            <input type="number" min="0" value={cleaningFee} onChange={e => setCleaningFee(e.target.value)} className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary bg-muted/30" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Service Fee (USD)</label>
            <input type="number" min="0" value={serviceFee} onChange={e => setServiceFee(e.target.value)} className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary bg-muted/30" />
          </div>
        </div>

        {/* Amenities Checklist */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase">
            Amenities
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {AMENITIES_LIST.map(a => {
              const checked = selectedAmenities.includes(a.key);
              return (
                <button
                  key={a.key}
                  type="button"
                  onClick={() => toggleAmenity(a.key)}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold transition-all ${
                    checked
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'border-border text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  {checked ? <CheckSquare size={13} /> : <Square size={13} />}
                  <span>{lang === 'lo' ? a.labelLo : a.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex gap-2 justify-end pt-3 border-t border-border">
          <button
            onClick={() => setOpen(false)}
            className="border border-border px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePost}
            disabled={posting}
            className="bg-gradient-to-r from-tiffany to-deep-green text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
          >
            {posting ? <Loader2 size={13} className="animate-spin" /> : null}
            {posting ? 'Saving...' : (lang === 'lo' ? 'ລົງທະບຽນ' : 'Publish Stay')}
          </button>
        </div>
      </div>
    </div>
  );
}
