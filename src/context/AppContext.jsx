import React from 'react'
import { demoData } from '../data/demoData';
export const DataContext = React.createContext();

export const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
];

export function AppContext({ children }) {
  // const [transactions, setTransactions] = React.useState(
  //   JSON.parse(localStorage.getItem('transactions')) || []
  // );

  const [transactions, setTransactions] = React.useState(() => {

  const savedTransactions =
    localStorage.getItem('transactions');

  if (savedTransactions) {
    return JSON.parse(savedTransactions);
  }

  localStorage.setItem(
    'transactions',
    JSON.stringify(demoData)
  );

  return demoData;
});
  const [currency, setCurrency] = React.useState(
    JSON.parse(localStorage.getItem('currency')) || CURRENCIES[0]
  );

  const updateCurrency = (selectedCurrency) => {
    setCurrency(selectedCurrency);
    localStorage.setItem('currency', JSON.stringify(selectedCurrency));
  };

  return (
    <DataContext.Provider value={{ transactions, setTransactions, currency, updateCurrency }}>
      {children}
    </DataContext.Provider>
  );
}