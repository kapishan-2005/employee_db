import { Building2, Upload, X, AlertCircle } from 'lucide-react';
import Input from '../common/Input';
import TextArea from '../common/TextArea';
import { validateImageFile, processImageUpload } from '../../utils/imageUtils';

/**
 * Company Basic Information Form
 * Reusable component for wizard and settings
 */
const CompanyBasicInfo = ({ data, onChange }) => {
  const readOnly = !onChange; // If onChange is undefined, form is read-only
  
  const handleChange = (e) => {
    if (onChange) {
      const { name, value } = e.target;
      
      // Special handling for industry change
      if (name === 'industry') {
        if (value === 'Other') {
          // Clear custom industry when switching to "Other"
          onChange({ ...data, industry: 'Other', custom_industry: '' });
        } else {
          // Clear custom industry when selecting predefined option
          onChange({ ...data, industry: value, custom_industry: '' });
        }
      } else {
        onChange({ ...data, [name]: value });
      }
    }
  };

  const handleLogoUpload = async (e) => {
    if (!onChange) return;
    
    const file = e.target.files[0];
    if (!file) return;

    // Validate the image file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      e.target.value = ''; // Clear the input
      return;
    }

    try {
      // Process the upload (currently base64, will be cloud storage in production)
      const imageUrl = await processImageUpload(file);
      onChange({ ...data, logo_url: imageUrl });
    } catch (error) {
      console.error('Logo upload failed:', error);
      alert('Failed to upload logo. Please try again.');
      e.target.value = ''; // Clear the input
    }
  };
  
  const handleLogoRemove = () => {
    if (onChange) {
      onChange({ ...data, logo_url: '' });
    }
  };
  
  // Determine which industry value to show in the dropdown
  const predefinedIndustries = [
    'Technology', 'Finance & Banking', 'Healthcare & Medical', 'Retail & E-commerce',
    'Manufacturing', 'Education & Training', 'Real Estate', 'Hospitality & Tourism',
    'Transportation & Logistics', 'Construction', 'Legal Services', 'Marketing & Advertising',
    'Consulting', 'Telecommunications', 'Energy & Utilities', 'Media & Entertainment',
    'Agriculture', 'Nonprofit & NGO', 'Government'
  ];
  
  const isCustomIndustry = data.industry && !predefinedIndustries.includes(data.industry) && data.industry !== 'Other';
  const industryDropdownValue = isCustomIndustry ? 'Other' : (data.industry || '');
  
  // Show custom industry field if "Other" is selected OR if we have a custom value loaded from DB
  const showCustomIndustry = industryDropdownValue === 'Other' || isCustomIndustry;

  return (
    <div className="space-y-6">
      {/* Company Logo */}
      <div>
        <label className="block text-xs font-medium text-white/50 mb-3 tracking-widest uppercase">
          Company Logo
        </label>
        
        <div className="flex items-center gap-6">
          {/* Logo Preview */}
          <div className="relative w-24 h-24 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center overflow-hidden group">
            {data.logo_url ? (
              <>
                <img
                  src={data.logo_url}
                  alt="Company Logo"
                  className="w-full h-full object-cover"
                />
                {/* Remove Button */}
                <button
                  type="button"
                  onClick={handleLogoRemove}
                  className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove logo"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </>
            ) : (
              <Building2 className="w-10 h-10 text-white/20" />
            )}
          </div>

          {/* Upload Button */}
          <div>
            {!readOnly && (
              <>
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white/8 hover:bg-white/12 text-white/70 rounded-lg transition-colors text-sm">
                  <Upload size={16} />
                  {data.logo_url ? 'Change Logo' : 'Upload Logo'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-white/40 mt-2">
                  PNG, JPG or WebP (max. 2MB)
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Company Name */}
      <Input
        label="Company Name"
        name="name"
        placeholder="Acme Corporation"
        value={data.name || ''}
        onChange={handleChange}
        required
        disabled={readOnly}
      />

      {/* Industry */}
      <div>
        <label className="block text-xs font-medium text-white/50 mb-1.5 tracking-widest uppercase">
          Industry
        </label>
        <select
          name="industry"
          value={industryDropdownValue}
          onChange={handleChange}
          disabled={readOnly}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ colorScheme: 'dark' }}
        >
          <option value="">Select Industry</option>
          <option value="Technology">Technology</option>
          <option value="Finance & Banking">Finance & Banking</option>
          <option value="Healthcare & Medical">Healthcare & Medical</option>
          <option value="Retail & E-commerce">Retail & E-commerce</option>
          <option value="Manufacturing">Manufacturing</option>
          <option value="Education & Training">Education & Training</option>
          <option value="Real Estate">Real Estate</option>
          <option value="Hospitality & Tourism">Hospitality & Tourism</option>
          <option value="Transportation & Logistics">Transportation & Logistics</option>
          <option value="Construction">Construction</option>
          <option value="Legal Services">Legal Services</option>
          <option value="Marketing & Advertising">Marketing & Advertising</option>
          <option value="Consulting">Consulting</option>
          <option value="Telecommunications">Telecommunications</option>
          <option value="Energy & Utilities">Energy & Utilities</option>
          <option value="Media & Entertainment">Media & Entertainment</option>
          <option value="Agriculture">Agriculture</option>
          <option value="Nonprofit & NGO">Nonprofit & NGO</option>
          <option value="Government">Government</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Custom Industry Field - shown when "Other" is selected */}
      {showCustomIndustry && (
        <Input
          label="Specify your industry"
          name="custom_industry"
          placeholder="Enter your industry"
          value={isCustomIndustry ? data.industry : (data.custom_industry || '')}
          onChange={(e) => {
            if (onChange) {
              onChange({ ...data, industry: 'Other', custom_industry: e.target.value });
            }
          }}
          required
          disabled={readOnly}
        />
      )}

      {/* Company Size */}
      <div>
        <label className="block text-xs font-medium text-white/50 mb-1.5 tracking-widest uppercase">
          Company Size
        </label>
        <select
          name="company_size"
          value={data.company_size || ''}
          onChange={handleChange}
          disabled={readOnly}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ colorScheme: 'dark' }}
        >
          <option value="">Select Size</option>
          <option value="1-10">1–10</option>
          <option value="11-50">11–50</option>
          <option value="51-200">51–200</option>
          <option value="201-500">201–500</option>
          <option value="501-1000">501–1000</option>
          <option value="1000+">1000+</option>
        </select>
      </div>

      {/* Company Description */}
      <TextArea
        label="Company Description (Optional)"
        name="description"
        placeholder="Tell us about your company..."
        value={data.description || ''}
        onChange={handleChange}
        rows={4}
        disabled={readOnly}
      />
    </div>
  );
};

export default CompanyBasicInfo;
