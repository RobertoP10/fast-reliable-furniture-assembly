import type { FunnelData } from '@/types/funnel';

export interface MappedFormData {
  category: string;
  subcategory: string;
  title: string;
  description: string;
  minBudget: string;
  maxBudget: string;
  requiredDate: string;
  requiredTime: string;
}

// Map furniture types to task categories
const FURNITURE_CATEGORY_MAP: Record<string, { category: string; subcategory: string }> = {
  'Wardrobe': { category: 'furniture_assembly', subcategory: 'wardrobe' },
  'Chest of Drawers': { category: 'furniture_assembly', subcategory: 'chest_of_drawers' },
  'Bedside Table': { category: 'furniture_assembly', subcategory: 'table' },
  'Dining Table': { category: 'furniture_assembly', subcategory: 'table' },
  'Other': { category: 'furniture_assembly', subcategory: 'other' },
};

const parseTimingToDate = (timing: string, customDate?: string): { date: string; time: string } => {
  const now = new Date();
  let targetDate = new Date();
  
  switch (timing) {
    case 'ASAP':
      // Tomorrow
      targetDate.setDate(now.getDate() + 1);
      break;
    case 'This Weekend':
      // Next Saturday
      const daysUntilSaturday = 6 - now.getDay();
      targetDate.setDate(now.getDate() + (daysUntilSaturday > 0 ? daysUntilSaturday : 7));
      break;
    case 'Next Week':
      // Next Monday
      const daysUntilNextMonday = 8 - now.getDay();
      targetDate.setDate(now.getDate() + daysUntilNextMonday);
      break;
    case 'Choose Custom Date':
      if (customDate) {
        targetDate = new Date(customDate);
      }
      break;
    default:
      targetDate.setDate(now.getDate() + 1);
  }
  
  return {
    date: targetDate.toISOString().split('T')[0],
    time: '10:00' // Default to 10 AM
  };
};

const parseBudget = (budget?: string): { min: string; max: string } => {
  if (!budget) return { min: '', max: '' };
  
  // Extract numbers from budget string
  const numbers = budget.match(/\d+/g);
  if (!numbers || numbers.length === 0) return { min: '', max: '' };
  
  if (numbers.length === 1) {
    // Single number, use as max with min being 70% of max
    const max = parseInt(numbers[0]);
    const min = Math.floor(max * 0.7);
    return { min: min.toString(), max: max.toString() };
  } else {
    // Multiple numbers, use first as min, last as max
    return { 
      min: numbers[0], 
      max: numbers[numbers.length - 1] 
    };
  }
};

export const mapFunnelDataToFormData = (funnelData: FunnelData): Partial<MappedFormData> => {
  const categoryMapping = FURNITURE_CATEGORY_MAP[funnelData.furnitureType] || 
                         FURNITURE_CATEGORY_MAP['Other'];
  
  const { date, time } = parseTimingToDate(funnelData.timing, funnelData.customDate);
  const { min, max } = parseBudget(funnelData.budget);
  
  // Generate title
  const title = `${funnelData.furnitureType} Assembly${funnelData.brand && funnelData.brand !== 'Other Brand' ? ` - ${funnelData.brand}` : ''}`;
  
  // Generate description
  let description = `${funnelData.furnitureType} assembly service needed.`;
  if (funnelData.brand && funnelData.brand !== 'Other Brand') {
    description += ` Brand: ${funnelData.brand}.`;
  }
  description += ' Please bring your own tools.';
  
  return {
    category: categoryMapping.category,
    subcategory: categoryMapping.subcategory,
    title,
    description,
    minBudget: min,
    maxBudget: max,
    requiredDate: date,
    requiredTime: time,
  };
};