/**
 * Browser Detection Utilities
 * 
 * Detects user's timezone and locale from browser settings
 */

/**
 * Detect user's timezone from browser
 * 
 * @returns {string} - IANA timezone string (e.g., 'America/New_York')
 */
export const detectBrowserTimezone = () => {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return timezone || 'America/New_York'; // Fallback to Eastern Time
  } catch (error) {
    console.warn('Failed to detect browser timezone:', error);
    return 'America/New_York'; // Safe fallback
  }
};

/**
 * Detect user's country from browser locale
 * 
 * Note: This is a best-effort approach. It may not always be accurate
 * as browser locale doesn't always match physical location.
 * 
 * @returns {string|null} - Country name or null if can't be determined
 */
export const detectBrowserCountry = () => {
  try {
    const locale = navigator.language || navigator.userLanguage;
    
    // Extract country code from locale (e.g., 'en-US' -> 'US')
    const countryCode = locale.split('-')[1]?.toUpperCase();
    
    if (!countryCode) {
      return null;
    }
    
    // Map common country codes to full names
    const countryMap = {
      'US': 'United States',
      'GB': 'United Kingdom',
      'CA': 'Canada',
      'AU': 'Australia',
      'NZ': 'New Zealand',
      'IE': 'Ireland',
      'IN': 'India',
      'SG': 'Singapore',
      'MY': 'Malaysia',
      'PH': 'Philippines',
      'ZA': 'South Africa',
      'DE': 'Germany',
      'FR': 'France',
      'ES': 'Spain',
      'IT': 'Italy',
      'NL': 'Netherlands',
      'BE': 'Belgium',
      'CH': 'Switzerland',
      'AT': 'Austria',
      'SE': 'Sweden',
      'NO': 'Norway',
      'DK': 'Denmark',
      'FI': 'Finland',
      'PL': 'Poland',
      'CZ': 'Czech Republic',
      'PT': 'Portugal',
      'GR': 'Greece',
      'HU': 'Hungary',
      'RO': 'Romania',
      'BR': 'Brazil',
      'MX': 'Mexico',
      'AR': 'Argentina',
      'CL': 'Chile',
      'CO': 'Colombia',
      'PE': 'Peru',
      'VE': 'Venezuela',
      'JP': 'Japan',
      'CN': 'China',
      'KR': 'South Korea',
      'TH': 'Thailand',
      'ID': 'Indonesia',
      'VN': 'Vietnam',
      'TW': 'Taiwan',
      'HK': 'China', // Hong Kong
      'AE': 'United Arab Emirates',
      'SA': 'Saudi Arabia',
      'IL': 'Israel',
      'TR': 'Turkey',
      'EG': 'Egypt',
      'NG': 'Nigeria',
      'KE': 'Kenya',
      'GH': 'Ghana',
      'RU': 'Russia',
      'UA': 'Ukraine',
      'PK': 'Pakistan',
      'BD': 'Bangladesh',
      'LK': 'Sri Lanka',
    };
    
    return countryMap[countryCode] || null;
  } catch (error) {
    console.warn('Failed to detect browser country:', error);
    return null;
  }
};
