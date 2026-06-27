export const convertAndFormatPrice = (amount, originalCurrency, preferredCurrency, exchangeRates) => {
  if (!amount && amount !== 0) return '0';
  
  const fromCurrency = (originalCurrency || 'LAK').toUpperCase();
  const toCurrency = (preferredCurrency || fromCurrency).toUpperCase();

  // Handle LAK formatting (no decimals, commas)
  const formatLak = (val) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(val));
  // Handle USD/USDT formatting (decimals allowed)
  const formatUsd = (val) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

  // If the target currency matches the original, just format it
  if (fromCurrency === toCurrency) {
    if (toCurrency === 'LAK') return `${formatLak(amount)} LAK`;
    if (toCurrency === 'USD') return `$${formatUsd(amount)}`;
    if (toCurrency === 'USDT') return `₮${formatUsd(amount)}`;
    return `${amount} ${toCurrency}`;
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
  } else if (fromCurrency !== 'USD') {
    // If unknown currency, just return raw
    return `${amount} ${fromCurrency}`;
  }

  // Convert FROM USD TO target currency
  let finalAmount = amountInUsd;
  if (toCurrency === 'LAK') {
    finalAmount = amountInUsd * lakToUsdRate;
    return `${formatLak(finalAmount)} LAK`;
  } else if (toCurrency === 'USDT') {
    finalAmount = amountInUsd / usdtToUsdRate;
    return `₮${formatUsd(finalAmount)}`;
  } else if (toCurrency === 'USD') {
    return `$${formatUsd(finalAmount)}`;
  }

  return `${amount} ${toCurrency}`;
};
