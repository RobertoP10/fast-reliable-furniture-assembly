
import type { Database } from '@/integrations/supabase/types';

type PaymentMethod = Database['public']['Enums']['payment_method'];

export const categories = {
  "wardrobe": ["PAX", "HEMNES", "BRIMNES", "MALM", "Other"],
  "desk": ["LINNMON", "BEKANT", "GALANT", "MICKE", "Other"],
  "bed": ["MALM", "HEMNES", "BRIMNES", "TARVA", "Other"],
  "chest": ["HEMNES", "MALM", "RAST", "KOPPANG", "Other"],
  "table": ["INGATORP", "BJURSTA", "LERHAMN", "MÖRBYLÅNGA", "Other"],
  "shelf": ["BILLY", "HEMNES", "FJÄLKINGE", "IVAR", "Other"]
};

export const locations = [
  "Birmingham",
  "Dudley", 
  "Wolverhampton",
  "Walsall",
  "West Bromwich",
  "Solihull",
  "Sutton Coldfield",
  "Tamworth",
  "Lichfield",
  "Redditch",
  "Shrewsbury",
  "Stoke-on-Trent",
  "Cannock",
  "Telford",
  "Kidderminster",
  "Nuneaton",
  "Halesowen",
  "Tipton",
  "Oldbury",
  "Smethwick",
  "Brierley Hill",
  "Bilston",
  "Brownhills",
  "Wednesbury",
  "Sedgley",
  "Kingswinford",
  "Stourbridge",
  "Willenhall",
  "Other (not listed)"
];

export const initialFormData = {
  title: "",
  description: "",
  category: "",
  subcategory: "",
  minBudget: "",
  maxBudget: "",
  address: "",
  manualAddress: "",
  paymentMethod: "cash" as PaymentMethod,
  requiredDate: "",
  requiredTime: ""
};
