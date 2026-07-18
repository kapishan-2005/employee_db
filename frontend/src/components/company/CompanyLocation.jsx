import Input from '../common/Input';
import CountrySelect from '../common/CountrySelect';
import TimezoneSelect from '../common/TimezoneSelect';

/**
 * Company Location Form
 * Reusable component for wizard and settings
 */
const CompanyLocation = ({ data, onChange }) => {
  const readOnly = !onChange; // If onChange is undefined, form is read-only
  
  const handleChange = (e) => {
    if (onChange) {
      const { name, value } = e.target;
      onChange({ ...data, [name]: value });
    }
  };

  return (
    <div className="space-y-6">
      {/* Address */}
      <Input
        label="Street Address"
        name="address"
        placeholder="123 Main Street"
        value={data.address || ''}
        onChange={handleChange}
        disabled={readOnly}
      />

      {/* City & State */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="City"
          name="city"
          placeholder="San Francisco"
          value={data.city || ''}
          onChange={handleChange}
          disabled={readOnly}
        />

        <Input
          label="State/Province"
          name="state"
          placeholder="California"
          value={data.state || ''}
          onChange={handleChange}
          disabled={readOnly}
        />
      </div>

      {/* Country & Postal Code */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5 tracking-widest uppercase">
            Country
          </label>
          {readOnly ? (
            <div className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white/60">
              {data.country || 'Not set'}
            </div>
          ) : (
            <CountrySelect
              name="country"
              value={data.country || ''}
              onChange={handleChange}
            />
          )}
        </div>

        <Input
          label="Postal Code"
          name="postal_code"
          placeholder="94102"
          value={data.postal_code || ''}
          onChange={handleChange}
          disabled={readOnly}
        />
      </div>

      {/* Timezone */}
      <div>
        <label className="block text-xs font-medium text-white/50 mb-1.5 tracking-widest uppercase">
          Timezone
        </label>
        {readOnly ? (
          <div className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white/60 text-sm">
            {data.timezone || 'Not set'}
          </div>
        ) : (
          <TimezoneSelect
            name="timezone"
            value={data.timezone || 'America/New_York'}
            onChange={handleChange}
          />
        )}
      </div>
    </div>
  );
};

export default CompanyLocation;
