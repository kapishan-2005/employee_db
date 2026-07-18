import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, Clock } from 'lucide-react';
import { detectBrowserTimezone } from '../../utils/browserDetection';

const TIMEZONES = [
  { value: 'Pacific/Midway', label: '(GMT-11:00) Midway Island, American Samoa' },
  { value: 'Pacific/Honolulu', label: '(GMT-10:00) Hawaii' },
  { value: 'America/Anchorage', label: '(GMT-09:00) Alaska' },
  { value: 'America/Los_Angeles', label: '(GMT-08:00) Pacific Time (US & Canada)' },
  { value: 'America/Tijuana', label: '(GMT-08:00) Tijuana, Baja California' },
  { value: 'America/Phoenix', label: '(GMT-07:00) Arizona' },
  { value: 'America/Denver', label: '(GMT-07:00) Mountain Time (US & Canada)' },
  { value: 'America/Chihuahua', label: '(GMT-07:00) Chihuahua, La Paz, Mazatlan' },
  { value: 'America/Chicago', label: '(GMT-06:00) Central Time (US & Canada)' },
  { value: 'America/Mexico_City', label: '(GMT-06:00) Guadalajara, Mexico City, Monterrey' },
  { value: 'America/Regina', label: '(GMT-06:00) Saskatchewan' },
  { value: 'America/Bogota', label: '(GMT-05:00) Bogota, Lima, Quito' },
  { value: 'America/New_York', label: '(GMT-05:00) Eastern Time (US & Canada)' },
  { value: 'America/Indiana/Indianapolis', label: '(GMT-05:00) Indiana (East)' },
  { value: 'America/Caracas', label: '(GMT-04:30) Caracas' },
  { value: 'America/Halifax', label: '(GMT-04:00) Atlantic Time (Canada)' },
  { value: 'America/La_Paz', label: '(GMT-04:00) La Paz' },
  { value: 'America/Santiago', label: '(GMT-04:00) Santiago' },
  { value: 'America/St_Johns', label: '(GMT-03:30) Newfoundland' },
  { value: 'America/Sao_Paulo', label: '(GMT-03:00) Brasilia' },
  { value: 'America/Argentina/Buenos_Aires', label: '(GMT-03:00) Buenos Aires, Georgetown' },
  { value: 'America/Godthab', label: '(GMT-03:00) Greenland' },
  { value: 'Atlantic/South_Georgia', label: '(GMT-02:00) Mid-Atlantic' },
  { value: 'Atlantic/Azores', label: '(GMT-01:00) Azores' },
  { value: 'Atlantic/Cape_Verde', label: '(GMT-01:00) Cape Verde Islands' },
  { value: 'Europe/London', label: '(GMT+00:00) London, Edinburgh, Dublin, Lisbon' },
  { value: 'Africa/Casablanca', label: '(GMT+00:00) Casablanca, Monrovia' },
  { value: 'Atlantic/Reykjavik', label: '(GMT+00:00) Reykjavik' },
  { value: 'Europe/Paris', label: '(GMT+01:00) Paris, Brussels, Amsterdam, Madrid' },
  { value: 'Europe/Berlin', label: '(GMT+01:00) Berlin, Stockholm, Rome, Vienna' },
  { value: 'Africa/Lagos', label: '(GMT+01:00) West Central Africa' },
  { value: 'Europe/Athens', label: '(GMT+02:00) Athens, Bucharest, Istanbul' },
  { value: 'Africa/Cairo', label: '(GMT+02:00) Cairo' },
  { value: 'Africa/Johannesburg', label: '(GMT+02:00) Harare, Pretoria' },
  { value: 'Asia/Jerusalem', label: '(GMT+02:00) Jerusalem' },
  { value: 'Europe/Helsinki', label: '(GMT+02:00) Helsinki, Kyiv, Riga, Sofia, Vilnius' },
  { value: 'Europe/Moscow', label: '(GMT+03:00) Moscow, St. Petersburg, Volgograd' },
  { value: 'Asia/Kuwait', label: '(GMT+03:00) Kuwait, Riyadh' },
  { value: 'Africa/Nairobi', label: '(GMT+03:00) Nairobi' },
  { value: 'Asia/Baghdad', label: '(GMT+03:00) Baghdad' },
  { value: 'Asia/Tehran', label: '(GMT+03:30) Tehran' },
  { value: 'Asia/Dubai', label: '(GMT+04:00) Abu Dhabi, Muscat' },
  { value: 'Asia/Baku', label: '(GMT+04:00) Baku, Tbilisi, Yerevan' },
  { value: 'Asia/Kabul', label: '(GMT+04:30) Kabul' },
  { value: 'Asia/Karachi', label: '(GMT+05:00) Islamabad, Karachi, Tashkent' },
  { value: 'Asia/Kolkata', label: '(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi' },
  { value: 'Asia/Colombo', label: '(GMT+05:30) Sri Jayawardenepura' },
  { value: 'Asia/Kathmandu', label: '(GMT+05:45) Kathmandu' },
  { value: 'Asia/Dhaka', label: '(GMT+06:00) Astana, Dhaka' },
  { value: 'Asia/Almaty', label: '(GMT+06:00) Almaty, Novosibirsk' },
  { value: 'Asia/Yangon', label: '(GMT+06:30) Yangon (Rangoon)' },
  { value: 'Asia/Bangkok', label: '(GMT+07:00) Bangkok, Hanoi, Jakarta' },
  { value: 'Asia/Krasnoyarsk', label: '(GMT+07:00) Krasnoyarsk' },
  { value: 'Asia/Shanghai', label: '(GMT+08:00) Beijing, Chongqing, Hong Kong, Urumqi' },
  { value: 'Asia/Singapore', label: '(GMT+08:00) Kuala Lumpur, Singapore' },
  { value: 'Asia/Taipei', label: '(GMT+08:00) Taipei' },
  { value: 'Australia/Perth', label: '(GMT+08:00) Perth' },
  { value: 'Asia/Irkutsk', label: '(GMT+08:00) Irkutsk, Ulaan Bataar' },
  { value: 'Asia/Tokyo', label: '(GMT+09:00) Osaka, Sapporo, Tokyo' },
  { value: 'Asia/Seoul', label: '(GMT+09:00) Seoul' },
  { value: 'Australia/Adelaide', label: '(GMT+09:30) Adelaide' },
  { value: 'Australia/Darwin', label: '(GMT+09:30) Darwin' },
  { value: 'Australia/Brisbane', label: '(GMT+10:00) Brisbane' },
  { value: 'Australia/Sydney', label: '(GMT+10:00) Canberra, Melbourne, Sydney' },
  { value: 'Pacific/Guam', label: '(GMT+10:00) Guam, Port Moresby' },
  { value: 'Australia/Hobart', label: '(GMT+10:00) Hobart' },
  { value: 'Asia/Vladivostok', label: '(GMT+10:00) Vladivostok' },
  { value: 'Pacific/Noumea', label: '(GMT+11:00) Magadan, Solomon Islands, New Caledonia' },
  { value: 'Pacific/Auckland', label: '(GMT+12:00) Auckland, Wellington' },
  { value: 'Pacific/Fiji', label: '(GMT+12:00) Fiji, Kamchatka, Marshall Islands' },
  { value: 'Pacific/Tongatapu', label: "(GMT+13:00) Nuku'alofa" },
];

/**
 * Searchable Timezone Select Component
 * Auto-detects browser timezone on first render if no value is set
 */
const TimezoneSelect = ({ value, onChange, name = 'timezone', autoDetect = true }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const detectionAttempted = useRef(false);

  // Auto-detect browser timezone on mount if enabled and no value is set
  useEffect(() => {
    if (autoDetect && !value && !detectionAttempted.current) {
      detectionAttempted.current = true;
      const detectedTimezone = detectBrowserTimezone();
      if (detectedTimezone && TIMEZONES.some(tz => tz.value === detectedTimezone)) {
        onChange({ target: { name, value: detectedTimezone } });
      }
    }
  }, [autoDetect, value, onChange, name]);

  // Filter timezones based on search query
  const filteredTimezones = TIMEZONES.filter(tz =>
    tz.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tz.value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get display label for selected timezone
  const selectedLabel = TIMEZONES.find(tz => tz.value === value)?.label || value;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Focus search input when opening
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (timezone) => {
    onChange({ target: { name, value: timezone } });
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Selected Value Display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/30 transition flex items-center justify-between text-left"
      >
        <span className={value ? 'text-white text-sm' : 'text-white/40'}>
          {value ? selectedLabel : 'Select Timezone'}
        </span>
        <ChevronDown
          size={18}
          className={`text-white/40 transition-transform flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-[#1a1d25] border border-white/10 rounded-lg shadow-2xl overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search timezones..."
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-indigo-400"
              />
            </div>
          </div>

          {/* Timezone List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredTimezones.length > 0 ? (
              filteredTimezones.map((tz) => (
                <button
                  key={tz.value}
                  type="button"
                  onClick={() => handleSelect(tz.value)}
                  className="w-full px-4 py-2.5 text-left text-xs text-white hover:bg-white/5 transition-colors flex items-center justify-between group"
                >
                  <span>{tz.label}</span>
                  {value === tz.value && (
                    <Check size={16} className="text-indigo-400 flex-shrink-0 ml-2" />
                  )}
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-white/40 text-sm">
                No timezones found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimezoneSelect;
