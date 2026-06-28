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
