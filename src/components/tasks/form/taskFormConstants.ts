export const categories = {
  wardrobe: ['PAX Wardrobe', 'KLEPPSTAD Wardrobe', 'BRIMNES Wardrobe', 'HEMNES Wardrobe'],
  desk: ['BEKANT Desk', 'LINNMON Desk', 'GALANT Desk', 'ALEX Desk'],
  bed: ['HEMNES Bed Frame', 'MALM Bed Frame', 'BRIMNES Bed Frame', 'TARVA Bed Frame'],
  chest: ['HEMNES Chest', 'MALM Chest', 'RAST Chest', 'KOPPANG Chest'],
  table: ['INGATORP Table', 'BJURSTA Table', 'NORDEN Table', 'LERHAMN Table'],
  shelf: ['BILLY Bookcase', 'HEMNES Bookcase', 'IVAR Shelf', 'KALLAX Shelf'],
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
