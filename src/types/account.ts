export interface Account {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  balance: number;
  isGoal: boolean;
  targetAmount: number | null;
  isArchived: boolean;
  isThirdParty: boolean;
  userId: string;
}

export interface CreateCajaBody {
  name: string;
  icon?: string;
  color?: string;
  balance: number;
  isGoal?: boolean;
  targetAmount?: number;
  isThirdParty?: boolean;
}

export interface UpdateCajaBody {
  name?: string;
  icon?: string;
  color?: string;
  balance?: number;
  isGoal?: boolean;
  targetAmount?: number;
  isThirdParty?: boolean;
}
