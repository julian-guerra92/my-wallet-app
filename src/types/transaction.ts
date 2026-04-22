export const TransactionType = {
  INCOME: "INCOME",
  EXPENSE: "EXPENSE",
  TRANSFER: "TRANSFER",
} as const;

export type TransactionTypeValue = typeof TransactionType[keyof typeof TransactionType];

export interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  date: Date | string;
  accountId: string;
  isTransfer?: boolean;
  linkedAccountId?: string | null;
  groupId?: string | null;
}

export interface TransactionTemplate {
  id: string;
  name: string;
  amount: number;
  type: string;
  description: string;
  accountId: string;
  userId: string;
  account?: {
    name: string;
    icon: string | null;
    color: string | null;
  };
}

export interface TransaccionFormData {
  amount: number;
  type: TransactionTypeValue;
  description: string;
  date: string;
  accountId: string;
  destinationAccountId?: string;
  saveAsTemplate?: boolean;
  templateName?: string;
}
