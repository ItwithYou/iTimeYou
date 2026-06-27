import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Image, DollarSign, Loader2, CheckSquare, Square } from 'lucide-react';
import MobileSelect from './MobileSelect';
import { toast } from 'sonner';

const CATEGORIES = [
  { key: 'stay', label: 'Stay / Room', labelLo: 'ທີ່ພັກ' },
  { key: 'home', label: 'Home / Villa', labelLo: 'ເຮືອນ / ວິລ່າ' },
  { key: 'nature', label: 'Nature / Camp', labelLo: 'ທຳມະຊາດ' },
  { key: 'culture', label: 'Culture Place', labelLo: 'ວັດທະນະທຳ' },
];

const AMENITIES_LIST = [
  { key: 'Wifi', label: 'Wifi', labelLo: 'ໄວໄຟ' },
  { key: 'Air Conditioning', label: 'AC', labelLo: 'ແອ' },
  { key: 'Kitchen', label: 'Kitchen', labelLo: 'ຫ້ອງຄົວ' },
  { key: 'Pool', label: 'Pool', labelLo: 'ສະລອຍນ້ຳ' },
  { key: 'Parking', label: 'Free Parking', labelLo: 'ບ່ອນຈອດລົດ' },
  { key: 'TV', label: 'TV', labelLo: 'ທີວີ' },
];

export default function CreateListing({ profile, currentUser, lang, t, onPosted }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [titleLao, setTitleLao] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionLao, setDescriptionLao] = useState('');
  const [price, setPrice] = useState('');
  const [cleaningFee, setCleaningFee] = useState('0');
  const [serviceFee, setServiceFee] = useState('0');
  const [category, setCategory] = useState('stay');
  const [city, setCity] = useState('');
  const [cityLao, setCityLao] = useState('');
  const [country, setCountry] = useState('Laos');
  const [guests, setGuests] = useState(2);
  const [beds, setBeds] = useState(1);
  const [baths, setBaths] = useState(1);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [posting, setPosting] = useState(false);
  const photoInputRef = useRef(null);

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const toggleAmenity = (amenity) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const handlePost = async () => {
    if (!title.trim() || !description.trim() || !price) {
      toast.error(lang === 'lo' ? 'ກະລຸນາປ້ອນຂໍ້ມູນໃຫ້ຄົບ' : 'Please fill in required fields');
      return;
    }
    if (!photoFile) {
      toast.error(lang === 'lo' ? 'ກະລຸນາແນບຮູບພາບ' : 'Please attach a photo');
      return;
    }

    setPosting(true);
    try {
      const upload = await base44.integrations.Core.UploadFile({ file: photoFile });
      const image_url = upload.file_url;

      await base44.entities.Listing.create({
        title: title.trim(),
        title_lao: titleLao.trim() || title.trim(),
        description: description.trim(),
        description_lao: descriptionLao.trim() || description.trim(),
        image_url,
        price: parseFloat(price) || 0,
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
      setCategory('stay');
      setCity('');
      setCityLao('');
      setSelectedAmenities([]);
      setPhotoFile(null);
      setPhotoPreview(null);
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
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted">
          <X size={16} />
        </button>
      </div>

      <div className="p-4 space-y-4 text-sm">
        {/* Photos */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase">
            {lang === 'lo' ? 'ຮູບພາບທີ່ພັກ' : 'Listing Photo'}
          </label>
          {photoPreview ? (
            <div className="relative w-fit">
              <img src={photoPreview} alt="" className="h-32 w-48 rounded-xl border border-border object-cover" />
              <button
                onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                className="absolute -top-1.5 -right-1.5 bg-black/70 text-white rounded-full w-5 h-5 flex items-center justify-center"
              >
                <X size={10} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="h-28 w-44 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <Image size={24} className="mb-1" />
              <span className="text-xs">{lang === 'lo' ? 'ອັບໂຫລດຮູບ' : 'Upload Photo'}</span>
            </button>
          )}
          <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
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
              options={CATEGORIES.map(c => ({ value: c.key, label: lang === 'lo' ? c.labelLo : c.label }))}
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
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Max Guests</label>
            <input type="number" min="1" value={guests} onChange={e => setGuests(parseInt(e.target.value) || 1)} className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary bg-muted/30" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Beds</label>
            <input type="number" min="1" value={beds} onChange={e => setBeds(parseInt(e.target.value) || 1)} className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary bg-muted/30" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Baths</label>
            <input type="number" min="1" value={baths} onChange={e => setBaths(parseInt(e.target.value) || 1)} className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary bg-muted/30" />
          </div>
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
              <DollarSign size={11} /> Price per Night (USD)
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
