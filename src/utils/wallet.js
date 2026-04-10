export const DEFAULT_EXCHANGE_RATES = {
  usdBuy: 22072,
  usdSell: 22183,
  usdtBuy: 22072,
  usdtSell: 22183,
};

export function getTotalLakBalance(profile, exchangeRates = DEFAULT_EXCHANGE_RATES) {
  const lak = profile?.wallet_balance_lak || 0;
  const usd = profile?.wallet_balance_usd || 0;
  const usdt = profile?.wallet_balance_usdt || 0;
  const usdRate = exchangeRates?.usdBuy || DEFAULT_EXCHANGE_RATES.usdBuy;
  const usdtRate = exchangeRates?.usdtBuy || usdRate;

  return lak + (usd * usdRate) + (usdt * usdtRate);
}

export function convertToLak(amount, currency, exchangeRates = DEFAULT_EXCHANGE_RATES) {
  if (currency === 'LAK') return amount;
  if (currency === 'USDT') return amount * (exchangeRates?.usdtBuy || exchangeRates?.usdBuy || DEFAULT_EXCHANGE_RATES.usdtBuy);
  return amount * (exchangeRates?.usdBuy || DEFAULT_EXCHANGE_RATES.usdBuy);
}

export function convertFromLak(amountLak, currency, exchangeRates = DEFAULT_EXCHANGE_RATES) {
  if (currency === 'LAK') return amountLak;
  if (currency === 'USDT') return amountLak / (exchangeRates?.usdtBuy || exchangeRates?.usdBuy || DEFAULT_EXCHANGE_RATES.usdtBuy);
  return amountLak / (exchangeRates?.usdBuy || DEFAULT_EXCHANGE_RATES.usdBuy);
}

export function deductCrossCurrencyBalance(profile, amount, currency, exchangeRates = DEFAULT_EXCHANGE_RATES) {
  const amountLak = convertToLak(amount, currency, exchangeRates);
  const totalLak = getTotalLakBalance(profile, exchangeRates);

  if (totalLak < amountLak) return null;

  let remainingLak = amountLak;
  let nextLak = profile?.wallet_balance_lak || 0;
  let nextUsd = profile?.wallet_balance_usd || 0;
  let nextUsdt = profile?.wallet_balance_usdt || 0;

  const takeLak = Math.min(nextLak, remainingLak);
  nextLak -= takeLak;
  remainingLak -= takeLak;

  if (remainingLak > 0) {
    const usdLakValue = nextUsd * (exchangeRates?.usdBuy || DEFAULT_EXCHANGE_RATES.usdBuy);
    const takeUsdLak = Math.min(usdLakValue, remainingLak);
    nextUsd -= convertFromLak(takeUsdLak, 'USD', exchangeRates);
    remainingLak -= takeUsdLak;
  }

  if (remainingLak > 0) {
    const usdtLakValue = nextUsdt * (exchangeRates?.usdtBuy || exchangeRates?.usdBuy || DEFAULT_EXCHANGE_RATES.usdtBuy);
    const takeUsdtLak = Math.min(usdtLakValue, remainingLak);
    nextUsdt -= convertFromLak(takeUsdtLak, 'USDT', exchangeRates);
    remainingLak -= takeUsdtLak;
  }

  return {
    wallet_balance_lak: Math.max(0, Number(nextLak.toFixed(2))),
    wallet_balance_usd: Math.max(0, Number(nextUsd.toFixed(2))),
    wallet_balance_usdt: Math.max(0, Number(nextUsdt.toFixed(2))),
    charged_amount_lak: Number(amountLak.toFixed(2)),
  };
}

export function exchangeWalletBalance(profile, fromCurrency, toCurrency, amount, exchangeRates = DEFAULT_EXCHANGE_RATES) {
  if (fromCurrency === toCurrency) return null;

  const fromField = fromCurrency === 'LAK' ? 'wallet_balance_lak' : fromCurrency === 'USDT' ? 'wallet_balance_usdt' : 'wallet_balance_usd';
  const toField = toCurrency === 'LAK' ? 'wallet_balance_lak' : toCurrency === 'USDT' ? 'wallet_balance_usdt' : 'wallet_balance_usd';
  const currentFromBalance = profile?.[fromField] || 0;

  if (!amount || amount <= 0 || currentFromBalance < amount) return null;

  const amountLak = convertToLak(amount, fromCurrency, exchangeRates);
  const convertedAmount = convertFromLak(amountLak, toCurrency, exchangeRates);

  const nextLak = toField === 'wallet_balance_lak'
    ? (profile?.wallet_balance_lak || 0) + convertedAmount
    : fromField === 'wallet_balance_lak'
    ? currentFromBalance - amount
    : (profile?.wallet_balance_lak || 0);

  const nextUsd = toField === 'wallet_balance_usd'
    ? (profile?.wallet_balance_usd || 0) + convertedAmount
    : fromField === 'wallet_balance_usd'
    ? currentFromBalance - amount
    : (profile?.wallet_balance_usd || 0);

  const nextUsdt = toField === 'wallet_balance_usdt'
    ? (profile?.wallet_balance_usdt || 0) + convertedAmount
    : fromField === 'wallet_balance_usdt'
    ? currentFromBalance - amount
    : (profile?.wallet_balance_usdt || 0);

  return {
    wallet_balance_lak: Number(nextLak.toFixed(6)),
    wallet_balance_usd: Number(nextUsd.toFixed(6)),
    wallet_balance_usdt: Number(nextUsdt.toFixed(6)),
    convertedAmount: Number(convertedAmount.toFixed(6)),
    amountLak: Number(amountLak.toFixed(2)),
  };
}