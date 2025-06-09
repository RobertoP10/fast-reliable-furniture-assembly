
export const categories = {
  "wardrobe": ["PAX", "HEMNES", "BRIMNES", "MALM", "Other"],
  "desk": ["LINNMON", "BEKANT", "GALANT", "MICKE", "Other"],
  "bed": ["MALM", "HEMNES", "BRIMNES", "TARVA", "Other"],
  "chest": ["HEMNES", "MALM", "RAST", "KOPPANG", "Other"],
  "table": ["INGATORP", "BJURSTA", "LERHAMN", "MÖRBYLÅNGA", "Other"],
  "shelf": ["BILLY", "HEMNES", "FJÄLKINGE", "IVAR", "Other"]
};

export const locations = [
  "Birmingham, West Midlands",
  "Telford, Shropshire", 
  "Wolverhampton, West Midlands",
  "Stoke on Trent, Staffordshire",
  "Shrewsbury, Shropshire"
];

export const initialFormData = {
  title: "",
  description: "",
  category: "",
  subcategory: "",
  minBudget: "",
  maxBudget: "",
  address: "",
  paymentMethod: "cash" as const,
  requiredDate: "",
  requiredTime: ""
};
