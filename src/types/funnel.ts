export interface FunnelData {
  furnitureType: string;
  brand: string;
  timing: string;
  customDate?: string;
  budget?: string;
  completed: boolean;
}

export interface ChatMessage {
  id: string;
  type: 'bot' | 'user';
  content: string;
  timestamp: Date;
  options?: string[];
  trustPoint?: string;
}

export type FunnelStep = 
  | 'furniture-type'
  | 'brand'
  | 'timing'
  | 'budget'
  | 'summary'
  | 'login-redirect';

export const FURNITURE_TYPES = [
  'Wardrobe',
  'Chest of Drawers', 
  'Bedside Table',
  'Dining Table',
  'Other'
];

export const BRANDS = [
  'IKEA',
  'JYSK', 
  'Argos',
  'Other Brand'
];

export const TIMING_OPTIONS = [
  'ASAP',
  'This Weekend',
  'Next Week',
  'Choose Custom Date'
];

export const TRUST_POINTS = {
  verified: "🛡️ All taskers are manually verified",
  reviews: "⭐ Check reviews before choosing your tasker", 
  payment: "💰 You only pay after the task is completed"
};