export interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  date: Date | string;
  accountId: string;
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
  type: "INCOME" | "EXPENSE";
  description: string;
  date: string;
  accountId: string;
  saveAsTemplate?: boolean;
  templateName?: string;
}
