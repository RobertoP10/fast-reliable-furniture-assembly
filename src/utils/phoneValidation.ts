
export const validatePhoneNumber = (phone: string): boolean => {
  // Remove all spaces, dashes, and parentheses
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");
  
  // UK phone number patterns:
  // - Mobile: 07xxxxxxxxx (11 digits total)
  // - International mobile: +447xxxxxxxxx or 447xxxxxxxxx
  // - Landline: 01xxxxxxxxx, 02xxxxxxxxx, 03xxxxxxxxx (11 digits total)
  // - International landline: +441xxxxxxxxx, +442xxxxxxxxx, +443xxxxxxxxx
  
  const ukPatterns = [
    /^07\d{9}$/, // UK mobile (07xxxxxxxxx)
    /^\+447\d{9}$/, // International UK mobile (+447xxxxxxxxx)
    /^447\d{9}$/, // International UK mobile without + (447xxxxxxxxx)
    /^0[123]\d{9}$/, // UK landline (01/02/03xxxxxxxxx)
    /^\+44[123]\d{9}$/, // International UK landline (+441/2/3xxxxxxxxx)
    /^44[123]\d{9}$/, // International UK landline without + (441/2/3xxxxxxxxx)
  ];
  
  // Also accept other international formats (basic validation)
  const internationalPattern = /^\+\d{7,15}$/; // International format with country code
  
  return ukPatterns.some(pattern => pattern.test(cleanPhone)) || 
         internationalPattern.test(cleanPhone);
};
