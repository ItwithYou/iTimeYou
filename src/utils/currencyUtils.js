import { PERSONAL_CATS, BUSINESS_CATS } from '../hooks/useLang';

// The correct price unit for a category (flights -> /flight, hotels -> /night,
// talk -> /hour, ...). Always derived from the category so the unit is always
// sensible regardless of what the stored `currency` string says.
export const priceUnitFor = (category, lang) => {
  const all = [...PERSONAL_CATS, ...BUSINESS_CATS];
  const c = all.find((x) => x.key === category);
  if (!c) return lang === 'lo' ? '/ຄືນ' : '/night';
  return lang === 'lo' ? (c.priceUnitLo || c.priceUnit) : c.priceUnit;
};

// Shorten 7+ digit prices so they never overflow on phones:
// "2,675,400 LAK" -> "2.68M LAK". Values under 1M pass through unchanged.
export const compactPrice = (str) => {
  if (!str) return str;
  const m = String(str).match(/([\d][\d,]{6,})/);
  if (!m) return str;
  const num = parseFloat(m[1].replace(/,/g, ''));
  if (!isFinite(num) || num < 1000000) return str;
  const compact = (num / 1000000).toFixed(num >= 10000000 ? 1 : 2).replace(/\.?0+$/, '') + 'M';
  return String(str).replace(m[1], compact);
};

export const convertAndFormatPrice = (amount, originalCurrency, preferredCurrency, exchangeRates) => {
  if (!amount && amount !== 0) return '0';
  
  const rawCurrency = (originalCurrency || 'LAK').toUpperCase();
  const suffixMatch = rawCurrency.match(/(\/.*)$/);
  const suffix = suffixMatch ? suffixMatch[1] : '/NIGHT';
  const fromCurrency = rawCurrency.replace(/\/.*$/, '').trim();
  const toCurrency = (preferredCurrency || fromCurrency).toUpperCase();

  // Formatters
  const formatLak = (val) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(val));
  const formatUsd = (val) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

  if (fromCurrency === toCurrency) {
    if (toCurrency === 'LAK') return `${formatLak(amount)} LAK${suffix}`;
    if (toCurrency === 'USD') return `$${formatUsd(amount)}${suffix}`;
    if (toCurrency === 'THB') return `฿${formatLak(amount)}${suffix}`;
    if (toCurrency === 'CNY') return `¥${formatUsd(amount)}${suffix}`;
    return `${amount} ${toCurrency}${suffix}`;
  }

  // Base exchange rates against LAK (using Buy rates for display consistency)
  const usdToLak = exchangeRates?.usdBuy || 22072;
  const thbToLak = exchangeRates?.thbBuy || 640;
  const cnyToLak = exchangeRates?.cnyBuy || 3040;

  // 1. Convert FROM original currency TO LAK
  let amountInLak = amount;
  if (fromCurrency === 'USD') amountInLak = amount * usdToLak;
  else if (fromCurrency === 'THB') amountInLak = amount * thbToLak;
  else if (fromCurrency === 'CNY') amountInLak = amount * cnyToLak;
  else if (fromCurrency !== 'LAK') return `${amount} ${fromCurrency}`; // Unknown

  // 2. Convert FROM LAK TO preferred currency
  if (toCurrency === 'LAK') {
    return `${formatLak(amountInLak)} LAK${suffix}`;
  } else if (toCurrency === 'USD') {
    return `$${formatUsd(amountInLak / usdToLak)}${suffix}`;
  } else if (toCurrency === 'THB') {
    return `฿${formatLak(amountInLak / thbToLak)}${suffix}`;
  } else if (toCurrency === 'CNY') {
    return `¥${formatUsd(amountInLak / cnyToLak)}${suffix}`;
  }

  return `${amount} ${toCurrency}${suffix}`;
};
export const translateSuffix = (suffix, lang) => {
  if (lang !== 'lo' || !suffix) return suffix;
  const s = suffix.toUpperCase();
  if (s === 'NIGHT') return 'ຄືນ';
  if (s === 'HOUR') return 'ຊົ່ວໂມງ';
  if (s === 'DAY') return 'ມື້';
  if (s === 'MONTH') return 'ເດືອນ';
  if (s === 'SERVICE') return 'ບໍລິການ';
  if (s === 'PERSON' || s === 'PAX') return 'ຄົນ';
  if (s === 'FLIGHT') return 'ຖ້ຽວບິນ';
  if (s === 'TABLE') return 'ໂຕະ';
  if (s === 'TICKET') return 'ປີ້';
  return suffix;
};
