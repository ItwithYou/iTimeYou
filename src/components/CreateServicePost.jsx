import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Image, Clock, Calendar, DollarSign, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const CURRENCIES = ['LAK', 'USD', 'USDT'];

const SERVICES = [
  {
    key: 'room',
    emoji: '🏠',
    en: 'Room / Stay',
    lo: 'ຫ້ອງພັກ',
    timeUnit: 'nights',
    timeLabel: 'Duration (nights)',
    timeLabelLo: 'ໄລຍະ (ຄືນ)',
    showWhen: true,
    whenLabel: 'Check-in Date',
    whenLabelLo: 'ວັນເຊັກອິນ',
    whenType: 'date',
    minTime: 1,
    maxTime: 30,
  },
  {
    key: 'food',
    emoji: '🍜',
    en: 'Food Service',
    lo: 'ບໍລິການອາຫານ',
    timeUnit: 'hours',
    timeLabel: 'Duration (hours)',
    timeLabelLo: 'ໄລຍະ (ຊົ່ວໂມງ)',
    showWhen: true,
    whenLabel: 'Date & Time',
    whenLabelLo: 'ວັນ & ເວລາ',
    whenType: 'datetime-local',
    minTime: 1,
    maxTime: 8,
  },
  {
    key: 'talking',
    emoji: '💬',
    en: 'Talking / Sharing Ideas',
    lo: 'ສົນທະນາ / ແລກປ່ຽນ',
    timeUnit: 'hours',
    timeLabel: 'Duration (hours)',
    timeLabelLo: 'ໄລຍະ (ຊົ່ວໂມງ)',
    showWhen: true,
    whenLabel: 'When',
    whenLabelLo: 'ເວລາໃດ',
    whenType: 'datetime-local',
    minTime: 0.5,
    maxTime: 6,
  },
  {
    key: 'experience',
    emoji: '🎭',
    en: 'Experience / Tour',
    lo: 'ປະສົບການ / ທ່ຽວ',
    timeUnit: 'hours',
    timeLabel: 'Duration (hours)',
    timeLabelLo: 'ໄລຍະ (ຊົ່ວໂມງ)',
    showWhen: true,
    whenLabel: 'Date & Time',
    whenLabelLo: 'ວັນ & ເວລາ',
    whenType: 'datetime-local',
    minTime: 1,
    maxTime: 12,
  },
  {
    key: 'culture',
    emoji: '🏛️',
    en: 'Cultural Service',
    lo: 'ບໍລິການວັດທະນະທຳ',
    timeUnit: 'hours',
    timeLabel: 'Duration (hours)',
    timeLabelLo: 'ໄລຍະ (ຊົ່ວໂມງ)',
    showWhen: true,
    whenLabel: 'Date & Time',
    whenLabelLo: 'ວັນ & ເວລາ',
    whenType: 'datetime-local',
    minTime: 1,
    maxTime: 8,
  },
  {
    key: 'nature',
    emoji: '🌿',
    en: 'Nature / Outdoor',
    lo: 'ທຳມະຊາດ / ກາງແຈ້ງ',
    timeUnit: 'days',
    timeLabel: 'Duration (days)',
    timeLabelLo: 'ໄລຍະ (ວັນ)',
    showWhen: true,
    whenLabel: 'Start Date',
    whenLabelLo: 'ວັນເລີ່ມ',
    whenType: 'date',
    minTime: 1,
    maxTime: 14,
  },
];

export default function CreateServicePost({ profile, currentUser, lang, t, onPosted }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [service, setService] = useState(SERVICES[0]);
  const [duration, setDuration] = useState(1);
  const [when, setWhen] = useState('');
  const [timeFrom, setTimeFrom] = useState('');
  const [timeTo, setTimeTo] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState(profile?.wallet_currency || 'USD');
  const [location, setLocation] = useState(profile?.location || '');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [posting, setPosting] = useState(false);

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const selectService = (svc) => {
    setService(svc);
    setDuration(svc.minTime);
    setWhen('');
    setTimeFrom('');
    setTimeTo('');
  };

  const handlePost = async () => {
    if (!text.trim() && !photoFile) return;
    setPosting(true);
    let photo_url = '';
    if (photoFile) {
      const res = await base44.integrations.Core.UploadFile({ file: photoFile });
      photo_url = res.file_url;
    }
    const serviceTimeSlot = service.timeUnit === 'hours' && timeFrom && timeTo ? `${timeFrom} - ${timeTo}` : '';
    await base44.entities.Post.create({
      author_email: currentUser.email,
      author_name: `${profile.first_name} ${profile.last_name}`,
      author_avatar: profile.photo_url || profile.avatar_url,
      text: `${text}`,
      category: service.key === 'talking' || service.key === 'culture' ? 'culture' : service.key === 'food' ? 'food' : service.key === 'room' ? 'stay' : service.key === 'experience' ? 'experience' : service.key === 'nature' ? 'nature' : 'home',
      photo_url,
      likes: [],
      like_count: 0,
      service_type: lang === 'lo' ? service.lo : service.en,
      service_type_emoji: service.emoji,
      service_price: price ? parseFloat(price) : 0,
      service_currency: currency,
      service_duration: duration,
      service_duration_unit: service.timeUnit,
      service_when: serviceTimeSlot ? `${when} · ${serviceTimeSlot}` : when,
      service_location: location,
    });
    setText('');
    setPhotoFile(null);
    setPhotoPreview(null);
    setDuration(service.minTime);
    setWhen('');
    setTimeFrom('');
    setTimeTo('');
    setPrice('');
    setCurrency(profile?.wallet_currency || 'USD');
    setOpen(false);
    setPosting(false);
    toast.success(lang === 'lo' ? 'ໂພສສຳເລັດ ✅' : 'Service posted! ✅');
    onPosted?.();
  };

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
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted">
          <X size={16} />
        </button>
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

        {/* Photo preview */}
        {photoPreview && (
          <div className="relative inline-block ml-12">
            <img src={photoPreview} alt="" className="max-h-44 rounded-xl border border-border object-cover" />
            <button
              onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
              className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Service selector */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            {lang === 'lo' ? 'ປະເພດບໍລິການ' : 'Service Type'}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SERVICES.map(svc => (
              <button
                key={svc.key}
                onClick={() => selectService(svc)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  service.key === svc.key
                    ? 'bg-gradient-to-r from-tiffany/15 to-deep-green/15 border-primary text-primary shadow-sm'
                    : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                }`}
              >
                <span className="text-base">{svc.emoji}</span>
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
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary bg-muted/50 transition-colors"
            >
              {CURRENCIES.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            {lang === 'lo' ? 'ສະຖານທີ່ບໍລິການ' : 'Service Location'}
          </label>
          <input
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder={lang === 'lo' ? 'ໃສ່ສະຖານທີ່' : 'Enter location'}
            className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary bg-muted/50 transition-colors"
          />
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
            {service.timeUnit === 'hours' && timeFrom && timeTo && (
              <span className="inline-flex items-center gap-1 bg-muted border border-border px-3 py-1 rounded-full text-xs font-semibold">
                <Calendar size={10} /> {timeFrom} - {timeTo}
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
          <label className="cursor-pointer flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm font-medium">
            <Image size={18} />
            <span className="text-xs">{lang === 'lo' ? 'ເພີ່ມຮູບ' : 'Add Photo'}</span>
            <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </label>
          <button
            onClick={handlePost}
            disabled={posting || (!text.trim() && !photoFile)}
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