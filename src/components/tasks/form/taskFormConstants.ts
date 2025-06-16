
export const categories = {
  wardrobe: ['PAX Wardrobe', 'KLEPPSTAD Wardrobe', 'BRIMNES Wardrobe', 'HEMNES Wardrobe', 'Other (not listed)'],
  desk: ['BEKANT Desk', 'LINNMON Desk', 'GALANT Desk', 'ALEX Desk', 'Other (not listed)'],
  bed: ['HEMNES Bed Frame', 'MALM Bed Frame', 'BRIMNES Bed Frame', 'TARVA Bed Frame', 'Other (not listed)'],
  chest: ['HEMNES Chest', 'MALM Chest', 'RAST Chest', 'KOPPANG Chest', 'Other (not listed)'],
  table: ['INGATORP Table', 'BJURSTA Table', 'NORDEN Table', 'LERHAMN Table', 'Other (not listed)'],
  shelf: ['BILLY Bookcase', 'HEMNES Bookcase', 'IVAR Shelf', 'KALLAX Shelf', 'Other (not listed)'],
  other: ['Other (not listed)']
};

export const locations = [
  'Birmingham',
  'Dudley',
  'Wolverhampton',
  'Walsall',
  'West Bromwich',
  'Solihull',
  'Sutton Coldfield',
  'Tamworth',
  'Lichfield',
  'Redditch',
  'Shrewsbury',
  'Stoke-on-Trent',
  'Cannock',
  'Telford',
  'Kidderminster',
  'Nuneaton',
  'Halesowen',
  'Tipton',
  'Oldbury',
  'Smethwick',
  'Brierley Hill',
  'Bilston',
  'Brownhills',
  'Wednesbury',
  'Sedgley',
  'Kingswinford',
  'Stourbridge',
  'Willenhall',
  'Other (not listed)'
];

export const paymentMethods = [
  'cash',
  'card',
  'bank_transfer'
];

export const initialFormData = {
  title: '',
  description: '',
  category: '',
  subcategory: '',
  minBudget: '',
  maxBudget: '',
  address: '',
  requiredDate: '',
  requiredTime: '',
  paymentMethod: 'cash' as 'cash' | 'card' | 'bank_transfer'
};
