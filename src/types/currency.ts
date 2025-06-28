export interface Currency {
  code: string;
  name: string;
  symbol: string;
  position: 'before' | 'after';
  decimals: number;
  thousandsSeparator: string;
  decimalSeparator: string;
}

export const CURRENCIES: Currency[] = [
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    position: 'after',
    decimals: 2,
    thousandsSeparator: ' ',
    decimalSeparator: ','
  },
  {
    code: 'USD',
    name: 'Dollar américain',
    symbol: '$',
    position: 'before',
    decimals: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.'
  },
  {
    code: 'XAF',
    name: 'Franc CFA',
    symbol: 'FCFA',
    position: 'after',
    decimals: 0,
    thousandsSeparator: ' ',
    decimalSeparator: ','
  },
  {
    code: 'GBP',
    name: 'Livre sterling',
    symbol: '£',
    position: 'before',
    decimals: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.'
  },
  {
    code: 'CHF',
    name: 'Franc suisse',
    symbol: 'CHF',
    position: 'after',
    decimals: 2,
    thousandsSeparator: ' ',
    decimalSeparator: '.'
  },
  {
    code: 'CAD',
    name: 'Dollar canadien',
    symbol: 'CAD',
    position: 'before',
    decimals: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.'
  },
  {
    code: 'JPY',
    name: 'Yen japonais',
    symbol: '¥',
    position: 'before',
    decimals: 0,
    thousandsSeparator: ',',
    decimalSeparator: '.'
  },
  {
    code: 'CNY',
    name: 'Yuan chinois',
    symbol: '¥',
    position: 'before',
    decimals: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.'
  },
  {
    code: 'MAD',
    name: 'Dirham marocain',
    symbol: 'MAD',
    position: 'after',
    decimals: 2,
    thousandsSeparator: ' ',
    decimalSeparator: ','
  },
  {
    code: 'TND',
    name: 'Dinar tunisien',
    symbol: 'TND',
    position: 'after',
    decimals: 3,
    thousandsSeparator: ' ',
    decimalSeparator: ','
  }
];

export const formatCurrency = (amount: number, currencyCode: string): string => {
  const currency = CURRENCIES.find(c => c.code === currencyCode);
  if (!currency) return `${amount}`;

  // Format the number with proper decimals
  const formattedNumber = amount.toFixed(currency.decimals);
  
  // Split into integer and decimal parts
  const [integerPart, decimalPart] = formattedNumber.split('.');
  
  // Add thousands separator
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, currency.thousandsSeparator);
  
  // Combine with decimal part if needed
  let finalNumber = formattedInteger;
  if (currency.decimals > 0 && decimalPart) {
    finalNumber += currency.decimalSeparator + decimalPart;
  }
  
  // Position the symbol
  if (currency.position === 'before') {
    return `${currency.symbol}${finalNumber}`;
  } else {
    return `${finalNumber} ${currency.symbol}`;
  }
};

export const getCurrencyByCode = (code: string): Currency | undefined => {
  return CURRENCIES.find(c => c.code === code);
};