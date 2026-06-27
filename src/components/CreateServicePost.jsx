import { useState, useRef } from 'react';
import { firebaseClient } from '@/api/firebaseClient';
import { X, Image, Clock, Calendar, DollarSign, Loader2, MapPin, LocateFixed } from 'lucide-react';
import MobileSelect from './MobileSelect';
import PhotoGrid from './PhotoGrid';
import { toast } from 'sonner';
import { getTodayISO, getNowDatetimeLocal, isDateInPast, isDateTimeInPast, formatDateDMY, formatDateTimeDMY } from '../utils/dateUtils';
import { PERSONAL_CATS } from '../hooks/useLang';

const CURRENCIES = ['LAK', 'USD', 'USDT'];


export default function CreateServicePost({ profile, currentUser, lang, t, onPosted, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen || false);

  const getGoogleMapsUrl = (value) => {
    const input = value?.trim();
    if (!input) return '';
    if (input.startsWith('http://') || input.startsWith('https://')) return input;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(input)}`;
  };
  const [text, setText] = useState('');
  const [service, setService] = useState(PERSONAL_CATS.filter(s => s.key !== 'all')[0]);
  const [postType, setPostType] = useState('offer');
  const [duration, setDuration] = useState(1);
  const [when, setWhen] = useState('');
  const [timeFrom, setTimeFrom] = useState('');
  const [timeTo, setTimeTo] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState(profile?.wallet_currency || 'USD');
  const [location, setLocation] = useState(profile?.location || '');
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

  const selectService = (svc) => {
    setService(svc);
    setDuration(1);
    setWhen('');
    setTimeFrom('');
    setTimeTo('');
  };

  const handlePost = async () => {
    if (!text.trim() && photoFiles.length === 0) return;
    // Validate date is not in the past
    if (when) {
      if (isDateTimeInPast(when)) {
        toast.error(lang === 'lo' ? 'ບໍ່ສາມາດເລືອກວັນເວລາທີ່ຜ່ານມາແລ້ວ' : 'Cannot select a past date/time');
        return;
      }
    }
    // Validate end time is after start time
    if (timeFrom && timeTo && timeTo <= timeFrom) {
      toast.error(lang === 'lo' ? 'ເວລາສິ້ນສຸດຕ້ອງຫຼັງເວລາເລີ່ມ' : 'End time must be after start time');
      return;
    }
    setPosting(true);
    try {
      let photo_url = '';
      let photo_urls = [];
      if (photoFiles.length > 0) {
        const uploads = await Promise.all(photoFiles.map(f => firebaseClient.integrations.Core.UploadFile({ file: f })));
        photo_urls = uploads.map(u => u.file_url).filter(Boolean);
        photo_url = photo_urls[0] || '';
      }
      const serviceTimeSlot = timeFrom && timeTo ? `${timeFrom} - ${timeTo}` : '';
      const serviceLocationMapUrl = getGoogleMapsUrl(location);
      await firebaseClient.entities.Post.create({
        author_email: currentUser.email,
        author_name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || (currentUser.full_name || 'User'),
        author_avatar: profile?.photo_url || profile?.avatar_url || '',
        text: `${text}`,
        text_lo: lang === 'lo' ? text : '',
        text_en: lang === 'en' ? text : '',
        category: service.key,
        post_type: postType,
        photo_url,
        photo_urls,
        likes: [],
        like_count: 0,
        service_type: lang === 'lo' ? service.lo : service.en,
        service_type_emoji: service.icon,
        service_price: price ? parseFloat(price) : 0,
        service_currency: currency,
        service_duration: duration,
        service_duration_unit: 'hours',
        service_when: serviceTimeSlot ? `${when} · ${serviceTimeSlot}` : when,
        service_location: location,
        service_location_map_url: serviceLocationMapUrl,
      });
      setText('');
      setPhotoFiles([]);
      setPhotoPreviews([]);
      setPostType('offer');
      setDuration(1);
      setWhen('');
      setTimeFrom('');
      setTimeTo('');
      setPrice('');
      setCurrency(profile?.wallet_currency || 'USD');
      setOpen(false);
      toast.success(lang === 'lo' ? 'ໂພສສຳເລັດ ✅' : 'Service posted! ✅');
      onPosted?.();
    } catch (err) {
      console.error('Post failed:', err);
      toast.error(lang === 'lo' ? 'ໂພສບໍ່ສຳເລັດ ລອງໃໝ່' : 'Could not post. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  // Guests can read the feed but must log in to post a service.
  if (!currentUser) {
    return (
      <div className="bg-card rounded-2xl p-4 shadow-sm border border-border flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">
          {lang === 'lo' ? 'ເຂົ້າສູ່ລະບົບເພື່ອແບ່ງປັນບໍລິການຂອງທ່ານ' : 'Log in to share your own service'}
        </span>
        <button
          onClick={() => window.dispatchEvent(new Event('open-login'))}
          className="flex-shrink-0 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
        >
          {lang === 'lo' ? 'ເຂົ້າສູ່ລະບົບ' : 'Login'}
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
        <div className="flex gap-3 items-center">
          <img
            src={profile?.photo_url || profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.email}`}
            alt=""
            className="w-9 h-9 rounded-full object-cover flex-shrink-0"
          />
          <button
            onClick={() => setOpen(true)}
            className="flex-1 text-left bg-muted/50 border border-border rounded-2xl px-4 py-2.5 text-sm text-muted-foreground hover:border-primary transition-colors"
          >
            {lang === 'lo' ? 'ສ້າງໂພສບໍລິການ...' : 'Create a service post...'}
          </button>
          <button
            onClick={() => setOpen(true)}
            className="flex-shrink-0 bg-gradient-to-r from-tiffany to-deep-green text-white px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
          >
            + {lang === 'lo' ? 'ບໍລິການ' : 'Service'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl shadow-lg border border-primary/20 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-tiffany/5 to-deep-green/5">
        <h3 className="font-bold text-sm">{lang === 'lo' ? 'ສ້າງໂພສບໍລິການ' : 'Create Service Post'}</h3>
        {!defaultOpen && (
          <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted">
            <X size={16} />
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Author row */}
        <div className="flex gap-3">
          <img
            src={profile?.photo_url || profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.email}`}
            alt=""
            className="w-9 h-9 rounded-full object-cover flex-shrink-0"
          />
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={lang === 'lo' ? 'ອະທິບາຍການບໍລິການຂອງທ່ານ...' : 'Describe your service...'}
            rows={2}
            className="flex-1 bg-muted/50 border border-border rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-primary resize-none transition-colors"
          />
        </div>

        {/* Offer vs Request Toggle */}
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setPostType('offer')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
              postType === 'offer' ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/50'
            }`}
          >
            {lang === 'lo' ? 'ຂ້ອຍໃຫ້ບໍລິການ (Offer)' : 'I am Offering'}
          </button>
          <button
            onClick={() => setPostType('request')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
              postType === 'request' ? 'bg-amber-500 text-white border-amber-500 shadow-sm' : 'bg-muted/50 text-muted-foreground border-border hover:border-amber-500/50'
            }`}
          >
            {lang === 'lo' ? 'ຂ້ອຍຕ້ອງການບໍລິການ (Request)' : 'I am Looking for'}
          </button>
        </div>

        {/* Photo previews - Facebook style grid */}
        {photoPreviews.length > 0 && (
          <div className="mx-4 mb-4 rounded-xl overflow-hidden border border-border">
            <PhotoGrid photos={photoPreviews} onRemove={removePhoto} />
          </div>
        )}

        {/* Service selector */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            {lang === 'lo' ? 'ປະເພດບໍລິການ' : 'Service Type'}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PERSONAL_CATS.filter(s => s.key !== 'all').map(svc => (
              <button
                key={svc.key}
                onClick={() => selectService(svc)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  service.key === svc.key
                    ? 'bg-gradient-to-r from-tiffany/15 to-deep-green/15 border-primary text-primary shadow-sm'
                    : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                }`}
              >
                <span className="text-base">{svc.icon}</span>
                <span className="truncate">{lang === 'lo' ? svc.lo : svc.en}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Time + When + Price */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Duration */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
              <Clock size={11} />
              {lang === 'lo' ? service.timeLabelLo : service.timeLabel}
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDuration(d => Math.max(service.minTime, d - (service.minTime === 0.5 ? 0.5 : 1)))}
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-sm font-bold hover:bg-muted transition-colors"
              >−</button>
              <span className="flex-1 text-center font-bold text-sm bg-muted/50 rounded-lg py-1.5 border border-border">
                {duration} <span className="text-xs font-normal text-muted-foreground">{service.timeUnit}</span>
              </span>
              <button
                onClick={() => setDuration(d => Math.min(service.maxTime, d + (service.minTime === 0.5 ? 0.5 : 1)))}
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-sm font-bold hover:bg-muted transition-colors"
              >+</button>
            </div>
          </div>

          {/* When */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
              <Calendar size={11} />
              {lang === 'lo' ? service.whenLabelLo : service.whenLabel}
            </label>
            <input
              type={service.whenType}
              value={when}
              onChange={e => setWhen(e.target.value)}
              min={service.whenType === 'date' ? getTodayISO() : getNowDatetimeLocal()}
              className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary bg-muted/50 transition-colors"
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
              <DollarSign size={11} />
              {lang === 'lo' ? 'ລາຄາ' : 'Price'}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">{currency === 'LAK' ? '₭' : '$'}</span>
              <input
                type="number"
                min="0"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full border border-border rounded-xl pl-7 pr-3 py-2 text-sm outline-none focus:border-primary bg-muted/50 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              {lang === 'lo' ? 'ສະກຸນເງິນ' : 'Currency'}
            </label>
            <MobileSelect
              value={currency}
              onChange={setCurrency}
              options={CURRENCIES}
              placeholder={lang === 'lo' ? 'ສະກຸນເງິນ' : 'Currency'}
              label={lang === 'lo' ? 'ເລືອກສະກຸນເງິນ' : 'Select Currency'}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            {lang === 'lo' ? 'ສະຖານທີ່ບໍລິການ' : 'Service Location'}
          </label>
          <div className="flex gap-2">
            <input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder={lang === 'lo' ? 'ວາງ Google Maps link ຫຼື ໃສ່ຊື່ສະຖານທີ່' : 'Paste Google Maps link or enter place name'}
              className="flex-1 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary bg-muted/50 transition-colors"
            />
            <button
              type="button"
              onClick={() => {
                if (!navigator.geolocation) {
                  toast.error(lang === 'lo' ? 'ບຣາວເຊີບໍ່ຮອງຮັບ GPS' : 'Browser does not support GPS');
                  return;
                }
                toast.info(lang === 'lo' ? 'ກຳລັງຊອກຫາຕຳແໜ່ງ...' : 'Getting location...');
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    const { latitude, longitude } = pos.coords;
                    const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
                    setLocation(mapUrl);
                    toast.success(lang === 'lo' ? 'ໄດ້ຕຳແໜ່ງແລ້ວ ✅' : 'Location set ✅');
                  },
                  () => {
                    toast.error(lang === 'lo' ? 'ບໍ່ສາມາດເຂົ້າເຖິງຕຳແໜ່ງໄດ້' : 'Could not access location');
                  },
                  { enableHighAccuracy: true, timeout: 10000 }
                );
              }}
              className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-xl text-xs font-semibold text-primary hover:bg-primary/5 active:bg-primary/10 transition-colors flex-shrink-0 min-h-[40px]"
            >
              <LocateFixed size={14} />
              <span className="hidden sm:inline">{lang === 'lo' ? 'ຕຳແໜ່ງປັດຈຸບັນ' : 'My Location'}</span>
              <span className="sm:hidden">📍</span>
            </button>
          </div>
          <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin size={11} />
            {lang === 'lo' ? 'ໃສ່ຊື່ສະຖານທີ່, ວາງ Google Maps link, ຫຼື ກົດ GPS ເພື່ອແຊຣ໌ຕຳແໜ່ງປັດຈຸບັນ' : 'Enter a place name, paste a Google Maps link, or tap GPS to share your current location'}
          </p>
        </div>

        {service.timeUnit === 'hours' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                {lang === 'lo' ? 'ເວລາເລີ່ມ' : 'Start Time'}
              </label>
              <input
                type="time"
                value={timeFrom}
                onChange={e => setTimeFrom(e.target.value)}
                className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary bg-muted/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                {lang === 'lo' ? 'ເວລາສິ້ນສຸດ' : 'End Time'}
              </label>
              <input
                type="time"
                value={timeTo}
                onChange={e => setTimeTo(e.target.value)}
                className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary bg-muted/50 transition-colors"
              />
            </div>
          </div>
        )}

        {/* Summary pill */}
        {(price || when) && (
          <div className="flex flex-wrap gap-2">
            {service && (
              <span className="inline-flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs font-semibold">
                {service.emoji} {lang === 'lo' ? service.lo : service.en}
              </span>
            )}
            {duration && (
              <span className="inline-flex items-center gap-1 bg-muted border border-border px-3 py-1 rounded-full text-xs font-semibold">
                <Clock size={10} /> {duration} {service.timeUnit}
              </span>
            )}
            {when && (
              <span className="inline-flex items-center gap-1 bg-muted border border-border px-3 py-1 rounded-full text-xs font-semibold">
                <Calendar size={10} /> {service.whenType === 'date' ? formatDateDMY(when) : formatDateTimeDMY(when)}
              </span>
            )}
            {service.timeUnit === 'hours' && timeFrom && timeTo && (
              <span className="inline-flex items-center gap-1 bg-muted border border-border px-3 py-1 rounded-full text-xs font-semibold">
                <Clock size={10} /> {timeFrom} - {timeTo}
              </span>
            )}
            {location && (
              <span className="inline-flex items-center gap-1 bg-muted border border-border px-3 py-1 rounded-full text-xs font-semibold">
                {location}
              </span>
            )}
            {price && (
              <span className="inline-flex items-center gap-1 bg-success/10 text-success border border-success/20 px-3 py-1 rounded-full text-xs font-semibold">
                <DollarSign size={10} /> {price} {currency}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-1 border-t border-border">
          <button type="button" onClick={() => photoInputRef.current?.click()} className="flex items-center gap-2 text-muted-foreground active:text-primary transition-colors text-sm font-medium min-h-[44px] px-2">
            <Image size={18} />
            <span className="text-xs">{lang === 'lo' ? 'ເພີ່ມຮູບ' : 'Add Photos'}{photoFiles.length > 0 ? ` (${photoFiles.length})` : ''}</span>
          </button>
          <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotos} />
          <button
            onClick={handlePost}
            disabled={posting || (!text.trim() && photoFiles.length === 0)}
            className="bg-gradient-to-r from-tiffany to-deep-green text-white px-6 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center gap-2"
          >
            {posting ? <Loader2 size={14} className="animate-spin" /> : null}
            {posting ? '...' : (lang === 'lo' ? 'ໂພສ' : 'Post Service')}
          </button>
        </div>
      </div>
    </div>
  );
}