export interface ReactiveMicrocapDetails {
  whaleId: string;
  exposure: number;
  createdDay: number;
  expiresDay: number;
  marketCap: number;
  description: string;
  targetSector: string;
  lastInfluenceGain: number;
}

export interface ReactiveMicrocapPosition {
  shares: number;
  totalCost: number;
}
