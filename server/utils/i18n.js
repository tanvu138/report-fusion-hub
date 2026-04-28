/**
 * Backend Internationalization Utility
 * Provides translation functions for API error messages
 */

const translations = {
  en: {
    // Authentication & Authorization errors
    'auth.required': 'Authentication required',
    'auth.noToken': 'Authentication required. No token provided.',
    'auth.tokenExpired': 'Token expired',
    'auth.invalidToken': 'Invalid token',
    'auth.userNotFound': 'User not found',
    'auth.insufficientPermissions': 'Insufficient permissions',
    'auth.sectionNotFound': 'Section not found',
    'auth.departmentAccessOnly': 'You can only edit sections for your department',
    'auth.logoutSuccessful': 'Logout successful',
    
    // User Management errors
    'user.usernameRequired': 'Username is required and must be a non-empty string.',
    'user.nameRequired': 'Name is required and must be a non-empty string.',
    'user.passwordRequired': 'Password is required.',
    'user.passwordTooShort': 'Password must be at least 6 characters long.',
    'user.roleRequired': 'Role is required.',
    'user.departmentRequired': 'Department is required for department role.',
    'user.invalidRole': 'Invalid role specified.',
    'user.notFound': 'User not found.',
    'user.createFailed': 'Failed to create user.',
    'user.updateFailed': 'Failed to update user.',
    'user.deleteFailed': 'Failed to delete user.',
    'user.usernameExists': 'Username already exists.',
    'user.invalidCredentials': 'Invalid username or password.',
    'user.cannotDeleteSelf': 'You cannot delete your own account.',
    'user.cannotModifyAdmin': 'You cannot modify admin users.',
    
    // Department Management errors
    'department.nameRequired': 'Department name is required.',
    'department.codeRequired': 'Department code is required.',
    'department.notFound': 'Department not found.',
    'department.createFailed': 'Failed to create department.',
    'department.updateFailed': 'Failed to update department.',
    'department.retrieveFailed': 'Failed to retrieve departments.',
    'department.deleteFailed': 'Failed to delete department.',
    'department.codeExists': 'Department code already exists.',
    'department.hasUsers': 'Cannot delete department with existing users.',
    'department.hasReports': 'Cannot delete department with existing reports.',
    
    // Report Management errors
    'report.templateNotFound': 'Template not found',
    'report.templateInactive': 'Template is not active',
    'report.duplicateExists': 'A report with similar details already exists',
    'report.notFound': 'Report not found',
    'report.cannotAddSections': 'Cannot add sections to finalized report',
    'report.accessDenied': 'You do not have access to this report',
    'report.titleRequired': 'Report title is required.',
    'report.periodRequired': 'Report period is required.',
    'report.invalidStatus': 'Invalid report status.',
    'report.cannotModifyPublished': 'Cannot modify published report.',
    'report.cannotDeletePublished': 'Cannot delete published report.',
    'report.sectionsRequired': 'Report must have at least one section.',
    'report.invalidTransition': 'Invalid status transition.',
    'report.submissionRequired': 'Report must be submitted before finalizing.',
    
    // Report Section errors
    'section.titleRequired': 'Section title is required.',
    'section.contentRequired': 'Section content is required.',
    'section.notFound': 'Section not found.',
    'section.createFailed': 'Failed to create section.',
    'section.updateFailed': 'Failed to update section.',
    'section.retrieveFailed': 'Failed to retrieve sections.',
    'section.updateSuccessful': 'Section updated successfully.',
    'section.deleteFailed': 'Failed to delete section.',
    'section.cannotModifyFinalized': 'Cannot modify finalized section.',
    'section.invalidOrder': 'Invalid section order.',
    
    // Template Management errors  
    'template.nameRequired': 'Template name is required.',
    'template.notFound': 'Template not found.',
    'template.createFailed': 'Failed to create template.',
    'template.updateFailed': 'Failed to update template.',
    'template.updateSuccessful': 'Template updated successfully.',
    'template.deleteFailed': 'Failed to delete template.',
    'template.nameExists': 'Template name already exists.',
    'template.inUse': 'Template is currently in use and cannot be deleted.',
    'template.sectionsRequired': 'Template must have at least one section.',
    
    // Template Pack errors
    'templatePack.nameRequired': 'Template pack name is required.',
    'templatePack.notFound': 'Template pack not found.',
    'templatePack.createFailed': 'Failed to create template pack.',
    'templatePack.updateFailed': 'Failed to update template pack.',
    'templatePack.deleteFailed': 'Failed to delete template pack.',
    'templatePack.nameExists': 'Template pack name already exists.',
    'templatePack.templatesRequired': 'Template pack must contain at least one template.',
    
    // File Upload errors
    'file.tooLarge': 'File too large. Maximum size is 5MB.',
    'file.typeNotAllowed': 'File type not allowed. Only images are permitted.',
    'file.uploadFailed': 'File upload failed.',
    'file.imageNotFound': 'Image not found.',
    'file.invalidFilename': 'Invalid filename.',
    'file.accessDenied': 'Access denied to this resource.',
    'file.deleteFailed': 'Failed to delete file.',
    'file.encryptionFailed': 'File encryption failed.',
    'file.decryptionFailed': 'File decryption failed.',
    'file.noFileProvided': 'No file provided.',
    'file.invalidImageId': 'Invalid image ID.',
    
    // Validation errors
    'validation.invalidInput': 'Invalid input provided.',
    'validation.requiredField': 'This field is required.',
    'validation.invalidEmail': 'Invalid email format.',
    'validation.invalidDate': 'Invalid date format.',
    'validation.invalidNumber': 'Invalid number format.',
    'validation.stringTooLong': 'Text is too long. Maximum {maxLength} characters.',
    'validation.stringTooShort': 'Text is too short. Minimum {minLength} characters.',
    
    // Export errors
    'export.reportNotFound': 'Report not found for export.',
    'export.accessDenied': 'Access denied to export this report.',
    'export.generationFailed': 'PDF generation failed.',
    'export.templateError': 'PDF template error.',
    'export.imageProcessingFailed': 'Image processing failed during export.',
    
    // Shared Report errors
    'sharedReport.notFound': 'Shared report not found.',
    'sharedReport.expired': 'Shared report link has expired.',
    'sharedReport.invalidCode': 'Invalid shared report code.',
    'sharedReport.createFailed': 'Failed to create shared report link.',
    'sharedReport.accessDenied': 'Access denied to shared report.',
    
    // Workspace errors
    'workspace.reportNotFound': 'Personal report not found',
    'workspace.notPersonalReport': 'This is not a personal report',
    'workspace.accessDenied': 'You can only access your own personal reports',
    'workspace.sectionNotFound': 'Section not found',

    // General errors
    'general.serverError': 'Internal server error occurred.',
    'general.notFound': 'Resource not found.',
    'general.badRequest': 'Bad request.',
    'general.unauthorized': 'Unauthorized access.',
    'general.forbidden': 'Access forbidden.',
    'general.methodNotAllowed': 'Method not allowed.',
    'general.conflict': 'Resource conflict.',
    'general.rateLimitExceeded': 'Rate limit exceeded. Please try again later.'
  },
  vi: {
    // Authentication & Authorization errors (Vietnamese)
    'auth.required': 'Yêu cầu xác thực',
    'auth.noToken': 'Yêu cầu xác thực. Không có token được cung cấp.',
    'auth.tokenExpired': 'Token đã hết hạn',
    'auth.invalidToken': 'Token không hợp lệ',
    'auth.userNotFound': 'Không tìm thấy người dùng',
    'auth.insufficientPermissions': 'Không đủ quyền truy cập',
    'auth.sectionNotFound': 'Không tìm thấy phần',
    'auth.departmentAccessOnly': 'Bạn chỉ có thể chỉnh sửa các phần cho phòng ban của mình',
    'auth.logoutSuccessful': 'Đăng xuất thành công',
    
    // User Management errors (Vietnamese)
    'user.usernameRequired': 'Tên đăng nhập là bắt buộc và phải là chuỗi không rỗng.',
    'user.nameRequired': 'Tên là bắt buộc và phải là chuỗi không rỗng.',
    'user.passwordRequired': 'Mật khẩu là bắt buộc.',
    'user.passwordTooShort': 'Mật khẩu phải có ít nhất 6 ký tự.',
    'user.roleRequired': 'Vai trò là bắt buộc.',
    'user.departmentRequired': 'Phòng ban là bắt buộc đối với vai trò phòng ban.',
    'user.invalidRole': 'Vai trò được chỉ định không hợp lệ.',
    'user.notFound': 'Không tìm thấy người dùng.',
    'user.createFailed': 'Tạo người dùng thất bại.',
    'user.updateFailed': 'Cập nhật người dùng thất bại.',
    'user.deleteFailed': 'Xóa người dùng thất bại.',
    'user.usernameExists': 'Tên đăng nhập đã tồn tại.',
    'user.invalidCredentials': 'Tên đăng nhập hoặc mật khẩu không hợp lệ.',
    'user.cannotDeleteSelf': 'Bạn không thể xóa tài khoản của chính mình.',
    'user.cannotModifyAdmin': 'Bạn không thể sửa đổi người dùng quản trị.',
    
    // Department Management errors (Vietnamese)
    'department.nameRequired': 'Tên phòng ban là bắt buộc.',
    'department.codeRequired': 'Mã phòng ban là bắt buộc.',
    'department.notFound': 'Không tìm thấy phòng ban.',
    'department.createFailed': 'Tạo phòng ban thất bại.',
    'department.updateFailed': 'Cập nhật phòng ban thất bại.',
    'department.retrieveFailed': 'Truy xuất phòng ban thất bại.',
    'department.deleteFailed': 'Xóa phòng ban thất bại.',
    'department.codeExists': 'Mã phòng ban đã tồn tại.',
    'department.hasUsers': 'Không thể xóa phòng ban có người dùng hiện tại.',
    'department.hasReports': 'Không thể xóa phòng ban có báo cáo hiện tại.',
    
    // Report Management errors (Vietnamese)
    'report.templateNotFound': 'Không tìm thấy mẫu',
    'report.templateInactive': 'Mẫu không hoạt động',
    'report.duplicateExists': 'Đã tồn tại báo cáo với thông tin tương tự',
    'report.notFound': 'Không tìm thấy báo cáo',
    'report.cannotAddSections': 'Không thể thêm phần vào báo cáo đã hoàn thiện',
    'report.accessDenied': 'Bạn không có quyền truy cập báo cáo này',
    'report.titleRequired': 'Tiêu đề báo cáo là bắt buộc.',
    'report.periodRequired': 'Kỳ báo cáo là bắt buộc.',
    'report.invalidStatus': 'Trạng thái báo cáo không hợp lệ.',
    'report.cannotModifyPublished': 'Không thể sửa đổi báo cáo đã xuất bản.',
    'report.cannotDeletePublished': 'Không thể xóa báo cáo đã xuất bản.',
    'report.sectionsRequired': 'Báo cáo phải có ít nhất một phần.',
    'report.invalidTransition': 'Chuyển đổi trạng thái không hợp lệ.',
    'report.submissionRequired': 'Báo cáo phải được nộp trước khi hoàn thiện.',
    
    // Report Section errors (Vietnamese)
    'section.titleRequired': 'Tiêu đề phần là bắt buộc.',
    'section.contentRequired': 'Nội dung phần là bắt buộc.',
    'section.notFound': 'Không tìm thấy phần.',
    'section.createFailed': 'Tạo phần thất bại.',
    'section.updateFailed': 'Cập nhật phần thất bại.',
    'section.retrieveFailed': 'Truy xuất phần thất bại.',
    'section.updateSuccessful': 'Cập nhật phần thành công.',
    'section.deleteFailed': 'Xóa phần thất bại.',
    'section.cannotModifyFinalized': 'Không thể sửa đổi phần đã hoàn thiện.',
    'section.invalidOrder': 'Thứ tự phần không hợp lệ.',
    
    // Template Management errors (Vietnamese)
    'template.nameRequired': 'Tên mẫu là bắt buộc.',
    'template.notFound': 'Không tìm thấy mẫu.',
    'template.createFailed': 'Tạo mẫu thất bại.',
    'template.updateFailed': 'Cập nhật mẫu thất bại.',
    'template.updateSuccessful': 'Cập nhật mẫu thành công.',
    'template.deleteFailed': 'Xóa mẫu thất bại.',
    'template.nameExists': 'Tên mẫu đã tồn tại.',
    'template.inUse': 'Mẫu hiện đang được sử dụng và không thể xóa.',
    'template.sectionsRequired': 'Mẫu phải có ít nhất một phần.',
    
    // Template Pack errors (Vietnamese)
    'templatePack.nameRequired': 'Tên gói mẫu là bắt buộc.',
    'templatePack.notFound': 'Không tìm thấy gói mẫu.',
    'templatePack.createFailed': 'Tạo gói mẫu thất bại.',
    'templatePack.updateFailed': 'Cập nhật gói mẫu thất bại.',
    'templatePack.deleteFailed': 'Xóa gói mẫu thất bại.',
    'templatePack.nameExists': 'Tên gói mẫu đã tồn tại.',
    'templatePack.templatesRequired': 'Gói mẫu phải chứa ít nhất một mẫu.',
    
    // File Upload errors (Vietnamese)
    'file.tooLarge': 'File quá lớn. Kích thước tối đa là 5MB.',
    'file.typeNotAllowed': 'Loại file không được phép. Chỉ cho phép hình ảnh.',
    'file.uploadFailed': 'Tải lên file thất bại.',
    'file.imageNotFound': 'Không tìm thấy hình ảnh.',
    'file.invalidFilename': 'Tên file không hợp lệ.',
    'file.accessDenied': 'Từ chối truy cập tài nguyên này.',
    'file.deleteFailed': 'Xóa file thất bại.',
    'file.encryptionFailed': 'Mã hóa file thất bại.',
    'file.decryptionFailed': 'Giải mã file thất bại.',
    'file.noFileProvided': 'Không có file được cung cấp.',
    'file.invalidImageId': 'ID hình ảnh không hợp lệ.',
    
    // Validation errors (Vietnamese)
    'validation.invalidInput': 'Dữ liệu đầu vào không hợp lệ.',
    'validation.requiredField': 'Trường này là bắt buộc.',
    'validation.invalidEmail': 'Định dạng email không hợp lệ.',
    'validation.invalidDate': 'Định dạng ngày không hợp lệ.',
    'validation.invalidNumber': 'Định dạng số không hợp lệ.',
    'validation.stringTooLong': 'Văn bản quá dài. Tối đa {maxLength} ký tự.',
    'validation.stringTooShort': 'Văn bản quá ngắn. Tối thiểu {minLength} ký tự.',
    
    // Export errors (Vietnamese)
    'export.reportNotFound': 'Không tìm thấy báo cáo để xuất.',
    'export.accessDenied': 'Từ chối truy cập để xuất báo cáo này.',
    'export.generationFailed': 'Tạo PDF thất bại.',
    'export.templateError': 'Lỗi mẫu PDF.',
    'export.imageProcessingFailed': 'Xử lý hình ảnh thất bại trong quá trình xuất.',
    
    // Shared Report errors (Vietnamese)
    'sharedReport.notFound': 'Không tìm thấy báo cáo được chia sẻ.',
    'sharedReport.expired': 'Liên kết báo cáo được chia sẻ đã hết hạn.',
    'sharedReport.invalidCode': 'Mã báo cáo được chia sẻ không hợp lệ.',
    'sharedReport.createFailed': 'Tạo liên kết báo cáo được chia sẻ thất bại.',
    'sharedReport.accessDenied': 'Từ chối truy cập báo cáo được chia sẻ.',
    
    // Workspace errors (Vietnamese)
    'workspace.reportNotFound': 'Không tìm thấy ghi chú cá nhân',
    'workspace.notPersonalReport': 'Đây không phải ghi chú cá nhân',
    'workspace.accessDenied': 'Bạn chỉ có thể truy cập ghi chú cá nhân của mình',
    'workspace.sectionNotFound': 'Không tìm thấy nội dung',

    // General errors (Vietnamese)
    'general.serverError': 'Đã xảy ra lỗi máy chủ nội bộ.',
    'general.notFound': 'Không tìm thấy tài nguyên.',
    'general.badRequest': 'Yêu cầu không hợp lệ.',
    'general.unauthorized': 'Truy cập không được phép.',
    'general.forbidden': 'Truy cập bị cấm.',
    'general.methodNotAllowed': 'Phương thức không được phép.',
    'general.conflict': 'Xung đột tài nguyên.',
    'general.rateLimitExceeded': 'Đã vượt quá giới hạn tốc độ. Vui lòng thử lại sau.'
  }
};

/**
 * Translation function with variable substitution support
 * @param {string} key - Translation key (e.g., 'auth.required')
 * @param {string} language - Language code ('en' or 'vi')
 * @param {Object} variables - Variables for substitution (e.g., {maxLength: 100})
 * @returns {string} Translated text
 */
function t(key, language = 'en', variables = {}) {
  // Get translation text, fallback to English, then to key itself
  let text = translations[language]?.[key] || translations.en[key] || key;
  
  // Variable substitution using {variableName} pattern
  if (variables && typeof variables === 'object') {
    Object.entries(variables).forEach(([varKey, value]) => {
      const regex = new RegExp(`\\{${varKey}\\}`, 'g');
      text = text.replace(regex, String(value));
    });
  }
  
  return text;
}

/**
 * Get all available translations for a specific language
 * @param {string} language - Language code ('en' or 'vi')
 * @returns {Object} All translations for the language
 */
function getTranslations(language = 'en') {
  return translations[language] || translations.en;
}

/**
 * Check if a translation key exists
 * @param {string} key - Translation key
 * @param {string} language - Language code ('en' or 'vi')
 * @returns {boolean} True if key exists
 */
function hasTranslation(key, language = 'en') {
  return !!(translations[language]?.[key] || translations.en[key]);
}

/**
 * Get supported languages
 * @returns {Array} Array of supported language codes
 */
function getSupportedLanguages() {
  return Object.keys(translations);
}

module.exports = {
  t,
  getTranslations,
  hasTranslation,
  getSupportedLanguages
};