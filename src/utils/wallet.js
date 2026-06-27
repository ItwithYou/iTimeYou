export const DEFAULT_EXCHANGE_RATES = {
  usdBuy: 22072,
  usdSell: 22183,
  thbBuy: 640,
  thbSell: 645,
  cnyBuy: 3040,
  cnySell: 3060,
};

export function getTotalLakBalance(profile, exchangeRates = DEFAULT_EXCHANGE_RATES) {
  const lak = Number(profile?.wallet_balance_lak) || 0;
  const usd = Number(profile?.wallet_balance_usd) || 0;
  const thb = Number(profile?.wallet_balance_thb) || 0;
  const cny = Number(profile?.wallet_balance_cny) || 0;
  
  const usdRate = exchangeRates?.usdBuy || DEFAULT_EXCHANGE_RATES.usdBuy;
  const thbRate = exchangeRates?.thbBuy || DEFAULT_EXCHANGE_RATES.thbBuy;
  const cnyRate = exchangeRates?.cnyBuy || DEFAULT_EXCHANGE_RATES.cnyBuy;

  return lak + (usd * usdRate) + (thb * thbRate) + (cny * cnyRate);
}

export function convertToLak(amount, currency, exchangeRates = DEFAULT_EXCHANGE_RATES) {
  if (currency === 'LAK') return amount;
  if (currency === 'THB') return amount * (exchangeRates?.thbBuy || DEFAULT_EXCHANGE_RATES.thbBuy);
  if (currency === 'CNY') return amount * (exchangeRates?.cnyBuy || DEFAULT_EXCHANGE_RATES.cnyBuy);
  return amount * (exchangeRates?.usdBuy || DEFAULT_EXCHANGE_RATES.usdBuy);
}

export function convertFromLak(amountLak, currency, exchangeRates = DEFAULT_EXCHANGE_RATES) {
  if (currency === 'LAK') return amountLak;
  if (currency === 'THB') return amountLak / (exchangeRates?.thbBuy || DEFAULT_EXCHANGE_RATES.thbBuy);
  if (currency === 'CNY') return amountLak / (exchangeRates?.cnyBuy || DEFAULT_EXCHANGE_RATES.cnyBuy);
  return amountLak / (exchangeRates?.usdBuy || DEFAULT_EXCHANGE_RATES.usdBuy);
}

export function deductCrossCurrencyBalance(profile, amount, currency, exchangeRates = DEFAULT_EXCHANGE_RATES) {
  const amountLak = convertToLak(amount, currency, exchangeRates);
  const totalLak = getTotalLakBalance(profile, exchangeRates);

  if (totalLak < amountLak) return null;

  let remainingLak = amountLak;
  let nextLak = Number(profile?.wallet_balance_lak) || 0;
  let nextUsd = Number(profile?.wallet_balance_usd) || 0;
  let nextThb = Number(profile?.wallet_balance_thb) || 0;
  let nextCny = Number(profile?.wallet_balance_cny) || 0;

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
    const thbLakValue = nextThb * (exchangeRates?.thbBuy || DEFAULT_EXCHANGE_RATES.thbBuy);
    const takeThbLak = Math.min(thbLakValue, remainingLak);
    nextThb -= convertFromLak(takeThbLak, 'THB', exchangeRates);
    remainingLak -= takeThbLak;
  }

  if (remainingLak > 0) {
    const cnyLakValue = nextCny * (exchangeRates?.cnyBuy || DEFAULT_EXCHANGE_RATES.cnyBuy);
    const takeCnyLak = Math.min(cnyLakValue, remainingLak);
    nextCny -= convertFromLak(takeCnyLak, 'CNY', exchangeRates);
    remainingLak -= takeCnyLak;
  }

  return {
    wallet_balance_lak: Math.max(0, Number(nextLak.toFixed(2))),
    wallet_balance_usd: Math.max(0, Number(nextUsd.toFixed(2))),
    wallet_balance_thb: Math.max(0, Number(nextThb.toFixed(2))),
    wallet_balance_cny: Math.max(0, Number(nextCny.toFixed(2))),
    charged_amount_lak: Number(amountLak.toFixed(2)),
  };
}

export function exchangeWalletBalance(profile, fromCurrency, toCurrency, amount, exchangeRates = DEFAULT_EXCHANGE_RATES) {
  if (fromCurrency === toCurrency) return null;

  const getField = (curr) => curr === 'LAK' ? 'wallet_balance_lak' : curr === 'THB' ? 'wallet_balance_thb' : curr === 'CNY' ? 'wallet_balance_cny' : 'wallet_balance_usd';

  const fromField = getField(fromCurrency);
  const toField = getField(toCurrency);
  const currentFromBalance = Number(profile?.[fromField]) || 0;

  if (!amount || amount <= 0 || currentFromBalance < amount) return null;

  const amountLak = convertToLak(amount, fromCurrency, exchangeRates);
  const convertedAmount = convertFromLak(amountLak, toCurrency, exchangeRates);

  const nextLak = toField === 'wallet_balance_lak' ? (Number(profile?.wallet_balance_lak) || 0) + convertedAmount : fromField === 'wallet_balance_lak' ? currentFromBalance - amount : (Number(profile?.wallet_balance_lak) || 0);
  const nextUsd = toField === 'wallet_balance_usd' ? (Number(profile?.wallet_balance_usd) || 0) + convertedAmount : fromField === 'wallet_balance_usd' ? currentFromBalance - amount : (Number(profile?.wallet_balance_usd) || 0);
  const nextThb = toField === 'wallet_balance_thb' ? (Number(profile?.wallet_balance_thb) || 0) + convertedAmount : fromField === 'wallet_balance_thb' ? currentFromBalance - amount : (Number(profile?.wallet_balance_thb) || 0);
  const nextCny = toField === 'wallet_balance_cny' ? (Number(profile?.wallet_balance_cny) || 0) + convertedAmount : fromField === 'wallet_balance_cny' ? currentFromBalance - amount : (Number(profile?.wallet_balance_cny) || 0);

  return {
    wallet_balance_lak: Number(nextLak.toFixed(6)),
    wallet_balance_usd: Number(nextUsd.toFixed(6)),
    wallet_balance_thb: Number(nextThb.toFixed(6)),
    wallet_balance_cny: Number(nextCny.toFixed(6)),
    convertedAmount: Number(convertedAmount.toFixed(6)),
    amountLak: Number(amountLak.toFixed(2)),
  };
}