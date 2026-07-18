/**
 * Image Handling Utilities
 * 
 * Handles image upload, validation, and preparation for storage
 * Abstracted to allow easy integration with cloud storage later
 */

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

/**
 * Validate image file
 * 
 * @param {File} file - The image file to validate
 * @returns {Object} - { valid: boolean, error: string|null }
 */
export const validateImageFile = (file) => {
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.'
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'File size must be less than 2MB'
    };
  }

  return { valid: true, error: null };
};

/**
 * Process image file for upload
 * 
 * Currently converts to base64 for development.
 * In production, this would upload to cloud storage (S3, Cloudinary, etc.)
 * and return the public URL.
 * 
 * @param {File} file - The image file to process
 * @returns {Promise<string>} - The image URL (base64 for now, cloud URL in production)
 */
export const processImageUpload = (file) => {
  return new Promise((resolve, reject) => {
    // TODO: In production, replace this with cloud storage upload
    // Example for AWS S3:
    // const url = await uploadToS3(file);
    // return url;
    //
    // Example for Cloudinary:
    // const url = await uploadToCloudinary(file);
    // return url;
    
    // Development: Use base64 encoding
    const reader = new FileReader();
    
    reader.onloadend = () => {
      resolve(reader.result);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * Placeholder for cloud storage integration
 * 
 * @param {File} file - The image file
 * @returns {Promise<string>} - The cloud storage URL
 */
// export const uploadToS3 = async (file) => {
//   // Implementation for AWS S3
//   const formData = new FormData();
//   formData.append('file', file);
//   
//   const response = await fetch('/api/upload/s3', {
//     method: 'POST',
//     body: formData,
//   });
//   
//   const data = await response.json();
//   return data.url;
// };

/**
 * Placeholder for Cloudinary integration
 * 
 * @param {File} file - The image file
 * @returns {Promise<string>} - The Cloudinary URL
 */
// export const uploadToCloudinary = async (file) => {
//   // Implementation for Cloudinary
//   const formData = new FormData();
//   formData.append('file', file);
//   formData.append('upload_preset', process.env.REACT_APP_CLOUDINARY_PRESET);
//   
//   const response = await fetch(
//     `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/image/upload`,
//     {
//       method: 'POST',
//       body: formData,
//     }
//   );
//   
//   const data = await response.json();
//   return data.secure_url;
// };
