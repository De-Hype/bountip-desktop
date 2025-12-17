export interface BankAccount {
  bankName: string;
  accountNumber: string;
  accountName: string;
  iban: string;
  swiftCode: string;
  sortCode: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  category: string;
  isAvailable: boolean;
  stock: number;
}

export type BusinessOperation = {
  delivery: boolean;
  pickup: boolean;
};

export interface Section {
  id: string;
  name: string;
  step: number;
}
