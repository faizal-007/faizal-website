/**
 * FuelFlow - Utility Formatters
 * Specialized for Indian Petrol Bunks:
 * - Indian Rupee formatting (Lakhs, Crores, Thousands)
 * - DD-MM-YYYY dates
 * - Asia/Kolkata timezone awareness
 */

/**
 * Format number as Indian Rupee (₹)
 * Example: 125430.5 => ₹1,25,430.50
 */
export function formatINR(val, includeSymbol = true) {
  if (val === null || val === undefined || isNaN(val)) {
    return includeSymbol ? '₹0.00' : '0.00';
  }
  const num = Number(val);
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);

  return includeSymbol ? `₹${formatted}` : formatted;
}

/**
 * Format quantity in litres with 2 decimal places
 * Example: 45.28 => 45.28 L
 */
export function formatLitres(litres, includeUnit = true) {
  if (litres === null || litres === undefined || isNaN(litres)) {
    return includeUnit ? '0.00 L' : '0.00';
  }
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(litres));

  return includeUnit ? `${formatted} L` : formatted;
}

/**
 * Converts YYYY-MM-DD or ISO string to DD-MM-YYYY
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  // Handle ISO string or YYYY-MM-DD
  const raw = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const parts = raw.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}-${m}-${y}`;
  }
  return dateStr;
}

/**
 * Converts DD-MM-YYYY back to YYYY-MM-DD for input elements
 */
export function toInputDate(dmyStr) {
  if (!dmyStr) return '';
  const parts = dmyStr.split('-');
  if (parts.length === 3 && parts[0].length === 2 && parts[2].length === 4) {
    const [d, m, y] = parts;
    return `${y}-${m}-${d}`;
  }
  return dmyStr;
}

/**
 * Get current date string in Asia/Kolkata timezone (YYYY-MM-DD for HTML input)
 */
export function getTodayDateStr() {
  try {
    const now = new Date();
    // Use Intl DateTimeFormat to resolve Asia/Kolkata local date
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(now); // en-CA gives YYYY-MM-DD
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Get current time string in Asia/Kolkata (HH:mm)
 */
export function getCurrentTimeStr() {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    return formatter.format(now);
  } catch {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
}

/**
 * Format ISO timestamp to readable Indian date & time: DD-MM-YYYY, hh:mm A
 */
export function formatDateTime(isoStr) {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(d);
  } catch {
    return isoStr;
  }
}

/**
 * Get date offset by N days in YYYY-MM-DD
 */
export function getRelativeDateStr(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

/**
 * Standardize vehicle registration number to uppercase (e.g. ka04mb1234 => KA-04-MB-1234 or uppercase)
 */
export function cleanVehicleNumber(val) {
  if (!val) return '';
  return val.trim().toUpperCase();
}

/**
 * Format Indian Rupee currency with optional decimals
 * Example: 5000 => ₹5,000
 */
export function formatINRCurrency(val, includeDecimals = false) {
  if (val === null || val === undefined || isNaN(val)) {
    return '₹0';
  }
  const num = Math.round(Number(val));
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  }).format(num);

  return `₹${formatted}`;
}

/**
 * Convert number to words in Indian numbering system
 * Example: 7000 => Seven Thousand Rupees Only
 */
export function numberToIndianWords(num) {
  const n = Math.floor(Math.abs(Number(num) || 0));
  if (n === 0) return 'Zero Rupees Only';

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertLessThanThousand = (val) => {
    let str = '';
    if (val >= 100) {
      str += a[Math.floor(val / 100)] + ' Hundred ';
      val %= 100;
    }
    if (val >= 20) {
      str += b[Math.floor(val / 10)] + ' ';
      val %= 10;
    }
    if (val > 0) {
      str += a[val] + ' ';
    }
    return str.trim();
  };

  let words = '';
  let rem = n;

  // Crores
  if (rem >= 10000000) {
    const crores = Math.floor(rem / 10000000);
    words += convertLessThanThousand(crores) + ' Crore ';
    rem %= 10000000;
  }
  // Lakhs
  if (rem >= 100000) {
    const lakhs = Math.floor(rem / 100000);
    words += convertLessThanThousand(lakhs) + ' Lakh ';
    rem %= 100000;
  }
  // Thousands
  if (rem >= 1000) {
    const thousands = Math.floor(rem / 1000);
    words += convertLessThanThousand(thousands) + ' Thousand ';
    rem %= 1000;
  }
  // Hundreds and remainder
  if (rem > 0) {
    words += convertLessThanThousand(rem) + ' ';
  }

  return `${words.trim()} Rupees Only`;
}
