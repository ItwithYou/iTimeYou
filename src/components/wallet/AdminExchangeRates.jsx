import { useState, useEffect } from 'react';
import { firebaseClient } from '@/api/firebaseClient';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';
import moment from 'moment';

const RATE_FIELDS = [
  { code: 'USD', buyKey: 'usd_buy', sellKey: 'usd_sell', flag: 'ðŸ‡ºðŸ‡¸' },
  { code: 'USDT', buyKey: 'usdt_buy', sellKey: 'usdt_sell', flag: 'ðŸ’²' },
  { code: 'THB', buyKey: 'thb_buy', sellKey: 'thb_sell', flag: 'ðŸ‡¹ðŸ‡­' },
  { code: 'CNY', buyKey: 'cny_buy', sellKey: 'cny_sell', flag: 'ðŸ‡¨ðŸ‡³' },
  { code: 'VND', buyKey: 'vnd_buy', sellKey: 'vnd_sell', flag: 'ðŸ‡»ðŸ‡³' },
];

export default function AdminExchangeRates({ currentUser, lang }) {
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bcelTime, setBcelTime] = useState(null);

  const loadSettings = async () => {
    const items = await firebaseClient.entities.ExchangeRateSettings.list('-updated_date', 1);
    const item = items[0] || null;
    setSettings(item);
    if (item) {
      setForm({
        usd_buy: item.usd_buy || '',
        usd_sell: item.usd_sell || '',
        usdt_buy: item.usdt_buy || '',
        usdt_sell: item.usdt_sell || '',
        thb_buy: item.thb_buy || '',
        thb_sell: item.thb_sell || '',
        cny_buy: item.cny_buy || '',
        cny_sell: item.cny_sell || '',
        vnd_buy: item.vnd_buy || '',
        vnd_sell: item.vnd_sell || '',
        notes: item.notes || '',
      });
    } else {
      setForm({
        usd_buy: 22072, usd_sell: 22183,
        usdt_buy: 22072, usdt_sell: 22183,
        thb_buy: 640, thb_sell: 660,
        cny_buy: 3000, cny_sell: 3100,
        vnd_buy: 0.85, vnd_sell: 0.9,
        notes: '',
      });
    }
    setLoading(false);
  };

  useEffect(() => { loadSettings(); }, []);

  const fetchBcelRates = async () => {
    setFetching(true);
    try {
      const response = await firebaseClient.functions.invoke('fetchBcelRates', {});
      const data = response.data;
      if (data?.success && data.rates) {
        setForm(prev => ({
          ...prev,
          usd_buy: data.rates.usdBuy ?? prev.usd_buy,
          usd_sell: data.rates.usdSell ?? prev.usd_sell,
          usdt_buy: data.rates.usdtBuy ?? data.rates.usdBuy ?? prev.usdt_buy,
          usdt_sell: data.rates.usdtSell ?? data.rates.usdSell ?? prev.usdt_sell,
          thb_buy: data.rates.thbBuy ?? prev.thb_buy,
          thb_sell: data.rates.thbSell ?? prev.thb_sell,
          cny_buy: data.rates.cnyBuy ?? prev.cny_buy,
          cny_sell: data.rates.cnySell ?? prev.cny_sell,
          vnd_buy: data.rates.vndBuy ?? prev.vnd_buy,
          vnd_sell: data.rates.vndSell ?? prev.vnd_sell,
        }));
        setBcelTime(data.time || data.rates.time || new Date().toISOString());
        toast.success(lang === 'lo' ? 'àº”àº¶àº‡àº­àº±àº”àº•àº² BCEL àºªàº³à»€àº¥àº±àº”' : 'BCEL rates fetched');
      } else {
        toast.error(lang === 'lo' ? 'àºšà»à»ˆàºªàº²àº¡àº²àº”àº”àº¶àº‡àº­àº±àº”àº•àº²à»„àº”à»‰' : 'Failed to fetch rates');
      }
    } catch {
      toast.error(lang === 'lo' ? 'à»€àºàºµàº”àº‚à»à»‰àºœàº´àº”àºžàº²àº”' : 'Error fetching rates');
    }
    setFetching(false);
  };

  const handleSave = async () => {
    setSaving(true);

    if (!form.usd_buy || !form.usd_sell) {
      toast.error('USD buy and sell rates are required');
      setSaving(false);
      return;
    }

    const latestForm = { ...form };

    const payload = {
      usd_buy: Number(latestForm.usd_buy) || 0,
      usd_sell: Number(latestForm.usd_sell) || 0,
      usdt_buy: Number(latestForm.usdt_buy) || 0,
      usdt_sell: Number(latestForm.usdt_sell) || 0,
      thb_buy: Number(latestForm.thb_buy) || 0,
      thb_sell: Number(latestForm.thb_sell) || 0,
      cny_buy: Number(latestForm.cny_buy) || 0,
      cny_sell: Number(latestForm.cny_sell) || 0,
      vnd_buy: Number(latestForm.vnd_buy) || 0,
      vnd_sell: Number(latestForm.vnd_sell) || 0,
      updated_by: currentUser?.email || '',
      notes: latestForm.notes || '',
    };

    if (settings?.id) {
      await firebaseClient.entities.ExchangeRateSettings.update(settings.id, payload);
    } else {
      const created = await firebaseClient.entities.ExchangeRateSettings.create(payload);
      setSettings(created);
    }
    await loadSettings();
    setSaving(false);
    toast.success(lang === 'lo' ? 'àºšàº±àº™àº—àº¶àºàº­àº±àº”àº•àº²à»àº¥àºàº›à»ˆàº½àº™àºªàº³à»€àº¥àº±àº”' : 'Exchange rates saved');
  };

  const updateField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Fetch BCEL button */}
      <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base">{lang === 'lo' ? 'àº­àº±àº”àº•àº²à»àº¥àºàº›à»ˆàº½àº™' : 'Exchange Rates'}</h3>
            <p className="text-sm text-muted-foreground">{lang === 'lo' ? 'àº•àº±à»‰àº‡àº­àº±àº”àº•àº²à»àº¥àºàº›à»ˆàº½àº™àº—àºµà»ˆàºˆàº°àºªàº°à»àº”àº‡à»ƒàº«à»‰àºœàº¹à»‰à»ƒàºŠà»‰' : 'Set the rates shown to all users in their wallet'}</p>
          </div>
          <div className="flex items-center gap-2">
            <a 
              href="https://www.bcel.com.la/bcel/exchange-rate.html?lang=en" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-1 border border-primary text-primary px-3 py-2 rounded-xl text-xs font-bold hover:bg-primary/10 transition-colors"
            >
              {lang === 'lo' ? 'à»€àº§àº±àºš BCEL' : 'BCEL Web'} â†—
            </a>
            <button
              onClick={fetchBcelRates}
              disabled={fetching}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-colors"
            >
              <RefreshCw size={14} className={fetching ? 'animate-spin' : ''} />
              {fetching ? '...' : (lang === 'lo' ? 'àº”àº¶àº‡ BCEL' : 'Fetch BCEL')}
            </button>
          </div>
        </div>

        {settings?.updated_date && (
          <p className="text-xs text-muted-foreground mb-2">
            {lang === 'lo' ? 'àº­àº±àºšà»€àº”àº”àº¥à»ˆàº²àºªàº¸àº”à»ƒàº™àº¥àº°àºšàº»àºš' : 'Last saved in system'}: {moment(settings.updated_date).format('MMM D, YYYY h:mm A')}
            {settings.updated_by && ` Â· ${settings.updated_by}`}
          </p>
        )}
        
        {bcelTime && (
          <div className="mb-4">
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/50 border border-emerald-200 px-2 py-1 rounded-md">
              âœ… {lang === 'lo' ? 'àº”àº¶àº‡àº­àº±àº”àº•àº² BCEL à»€àº§àº¥àº²' : 'Fetched BCEL rates at'}: {moment(bcelTime).format('MMM D, YYYY h:mm A')}
            </span>
          </div>
        )}

        {/* Rate table */}
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
            <span>Currency</span>
            <span>Buy (LAK)</span>
            <span>Sell (LAK)</span>
          </div>

          {RATE_FIELDS.map(({ code, buyKey, sellKey, flag }) => (
            <div key={code} className="grid grid-cols-3 gap-3 items-center">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <span>{flag}</span>
                <span>{code}</span>
              </div>
              <input
                type="number"
                value={form[buyKey] || ''}
                onChange={(e) => updateField(buyKey, e.target.value)}
                placeholder="Buy"
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary bg-muted/30"
              />
              <input
                type="number"
                value={form[sellKey] || ''}
                onChange={(e) => updateField(sellKey, e.target.value)}
                placeholder="Sell"
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary bg-muted/30"
              />
            </div>
          ))}
        </div>

        {/* Notes */}
        <div className="mt-4">
          <label className="text-xs font-semibold text-muted-foreground">{lang === 'lo' ? 'à»àº²àºà»€àº«àº”' : 'Notes'}</label>
          <textarea
            value={form.notes || ''}
            onChange={(e) => updateField('notes', e.target.value)}
            placeholder={lang === 'lo' ? 'à»àº²àºà»€àº«àº” (à»€àº¥àº·àº­àºà»„àº”à»‰)' : 'Notes (optional)'}
            rows={2}
            className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary mt-1 resize-none"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 w-full bg-primary text-primary-foreground py-3 rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50"
        >
          {saving ? '...' : (lang === 'lo' ? 'ðŸ’¾ àºšàº±àº™àº—àº¶àºàº­àº±àº”àº•àº²' : 'ðŸ’¾ Save Rates')}
        </button>
      </div>
    </div>
  );
}