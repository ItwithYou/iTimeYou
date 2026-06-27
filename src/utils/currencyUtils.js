export const convertAndFormatPrice = (amount, originalCurrency, preferredCurrency, exchangeRates) => {
  if (!amount && amount !== 0) return '0';
  
  const rawCurrency = (originalCurrency || 'LAK').toUpperCase();
  const suffixMatch = rawCurrency.match(/(\/.*)$/);
  const suffix = suffixMatch ? suffixMatch[1] : '';
  const fromCurrency = rawCurrency.replace(/\/.*$/, '').trim();
  const toCurrency = (preferredCurrency || fromCurrency).toUpperCase();

  // Handle LAK formatting (no decimals, commas)
  const formatLak = (val) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(val));
  // Handle USD/USDT formatting (decimals allowed)
  const formatUsd = (val) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

  // If the target currency matches the original, just format it
  if (fromCurrency === toCurrency) {
    if (toCurrency === 'LAK') return `${formatLak(amount)} LAK${suffix}`;
    if (toCurrency === 'USD') return `$${formatUsd(amount)}${suffix}`;
    if (toCurrency === 'USDT') return `₮${formatUsd(amount)}${suffix}`;
    if (toCurrency === 'THB') return `฿${formatLak(amount)}${suffix}`;
    if (toCurrency === 'CNY') return `¥${formatUsd(amount)}${suffix}`;
    return `${amount} ${toCurrency}${suffix}`;
  }

  // Base exchange rates against USD
  const lakToUsdRate = exchangeRates?.usdBuy || 22000;
  const usdtToUsdRate = 1; // Assuming 1 USDT = 1 USD for display

  let amountInUsd = amount;

  // Convert FROM original currency TO USD
  if (fromCurrency === 'LAK') {
    amountInUsd = amount / lakToUsdRate;
  } else if (fromCurrency === 'USDT') {
    amountInUsd = amount * usdtToUsdRate;
  } else if (fromCurrency === 'THB') {
    amountInUsd = amount / (exchangeRates?.thbBuy || 35);
  } else if (fromCurrency === 'CNY') {
    amountInUsd = amount / (exchangeRates?.cnyBuy || 7.2);
  } else if (fromCurrency !== 'USD') {
    // If unknown currency, just return raw
    return `${amount} ${fromCurrency}`;
  }

  // Convert FROM USD to preferred currency
  if (toCurrency === 'LAK') {
    return `${formatLak(amountInUsd * lakToUsdRate)} LAK${suffix}`;
  } else if (toCurrency === 'USDT') {
    return `₮${formatUsd(amountInUsd / usdtToUsdRate)}${suffix}`;
  } else if (toCurrency === 'THB') {
    return `฿${formatLak(amountInUsd * (exchangeRates?.thbBuy || 35))}${suffix}`;
  } else if (toCurrency === 'CNY') {
    return `¥${formatUsd(amountInUsd * (exchangeRates?.cnyBuy || 7.2))}${suffix}`;
  } else if (toCurrency === 'USD') {
    return `$${formatUsd(amountInUsd)}${suffix}`;
  }

  return `${amount} ${toCurrency}${suffix}`;
};
