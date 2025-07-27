// User Roles - أدوار المستخدمين
const USER_ROLES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  RECEPTION: 'reception',
  PATIENT: 'patient',
  GUEST: 'guest'
};

// Appointment Status - حالة المواعيد
const APPOINTMENT_STATUS = {
  PENDING: 'pending',     // في الانتظار
  APPROVED: 'approved',   // مؤكد
  CANCELED: 'canceled',   // ملغي
  COMPLETED: 'completed', // مكتمل
  NO_SHOW: 'no_show'     // لم يحضر
};

// Medical Record Types - أنواع السجلات الطبية
const MEDICAL_RECORD_TYPES = {
  VISIT: 'visit',           // زيارة
  XRAY: 'xray',            // أشعة
  LAB_TEST: 'lab_test',    // تحليل
  PRESCRIPTION: 'prescription' // روشتة
};

// Payment Methods - طرق الدفع (في العيادة فقط - بدون تأمين)
const PAYMENT_METHODS = {
  CASH: 'cash',           // كاش في العيادة
  CARD_IN_CLINIC: 'card_in_clinic',  // فيزا في العيادة
  INSTALLMENTS: 'installments' // تقسيط مع العيادة
};

// File Upload Types - أنواع الملفات المسموحة
const ALLOWED_FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ALL: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
};

// Gender Options - خيارات الجنس
const GENDER_OPTIONS = {
  MALE: 'male',     // ذكر
  FEMALE: 'female'  // أنثى
};

// Days of Week - أيام الأسبوع
const DAYS_OF_WEEK = {
  SUNDAY: 'sunday',       // الأحد
  MONDAY: 'monday',       // الاثنين
  TUESDAY: 'tuesday',     // الثلاثاء
  WEDNESDAY: 'wednesday', // الأربعاء
  THURSDAY: 'thursday',   // الخميس
  FRIDAY: 'friday',       // الجمعة
  SATURDAY: 'saturday'    // السبت
};

// Egyptian Governorates - محافظات مصر
const EGYPTIAN_GOVERNORATES = {
  CAIRO: 'القاهرة',
  GIZA: 'الجيزة',
  ALEXANDRIA: 'الإسكندرية',
  DAKAHLIA: 'الدقهلية',
  RED_SEA: 'البحر الأحمر',
  BEHEIRA: 'البحيرة',
  FAYOUM: 'الفيوم',
  GHARBIYA: 'الغربية',
  ISMAILIA: 'الإسماعيلية',
  MENOFIA: 'المنوفية',
  MINYA: 'المنيا',
  QALIUBIYA: 'القليوبية',
  NEW_VALLEY: 'الوادي الجديد',
  SUEZ: 'السويس',
  ASWAN: 'أسوان',
  ASSIUT: 'أسيوط',
  BENI_SUEF: 'بني سويف',
  PORT_SAID: 'بورسعيد',
  DAMIETTA: 'دمياط',
  SHARKIA: 'الشرقية',
  SOUTH_SINAI: 'جنوب سيناء',
  KAFR_EL_SHEIKH: 'كفر الشيخ',
  MATROUH: 'مطروح',
  LUXOR: 'الأقصر',
  QENA: 'قنا',
  NORTH_SINAI: 'شمال سيناء',
  SOHAG: 'سوهاج'
};

// Egyptian Cities for Beheira - مدن محافظة البحيرة
const BEHEIRA_CITIES = {
  DAMANHUR: 'دمنهور',
  KOM_HAMADA: 'كوم حمادة',
  KAFR_EL_DAWAR: 'كفر الدوار',
  RASHID: 'رشيد',
  EDKO: 'إدكو',
  ABU_HUMMUS: 'أبو حمص',
  ABU_EL_MATAMER: 'أبو المطامير',
  HOUSH_EISA: 'حوش عيسى',
  SHUBRAKHIT: 'شبراخيت',
  ITAI_EL_BAROUD: 'إيتاي البارود',
  DELINGAT: 'دلنجات',
  BADR: 'بدر',
  WADI_EL_NATRUN: 'وادي النطرون',
  EL_MAHMOUDIA: 'المحمودية',
  EL_RAHMANIYA: 'الرحمانية'
};

// Clinic Types - أنواع العيادات
const CLINIC_TYPES = {
  PRIVATE: 'عيادة خاصة',
  HOSPITAL: 'مستشفى',
  CENTER: 'مركز طبي',
  POLYCLINIC: 'عيادات متعددة',
  GOVERNMENT: 'عيادة حكومية'
};

// Egyptian Success Messages - رسائل النجاح بالمصري
const SUCCESS_MESSAGES = {
  // Authentication
  REGISTER_SUCCESS: 'تم التسجيل بنجاح! مرحبا بيك في عياداتنا',
  LOGIN_SUCCESS: 'أهلا وسهلا! تم تسجيل الدخول بنجاح',
  LOGOUT_SUCCESS: 'تم تسجيل الخروج بنجاح، في أمان الله',
  OTP_SENT: 'تم إرسال كود التفعيل على موبايلك',
  OTP_VERIFIED: 'تم التأكد من الكود بنجاح',
  PASSWORD_CHANGED: 'تم تغيير كلمة السر بنجاح',
  PROFILE_UPDATED: 'تم تحديث البيانات بنجاح',
  
  // Appointments
  APPOINTMENT_BOOKED: 'تم حجز الموعد بنجاح! هنشوفك قريب (الدفع في العيادة)',
  APPOINTMENT_UPDATED: 'تم تعديل الموعد بنجاح',
  APPOINTMENT_CANCELED: 'تم إلغاء الموعد',
  APPOINTMENT_APPROVED: 'تم تأكيد الموعد',
  APPOINTMENT_COMPLETED: 'تم إنهاء الموعد بنجاح',
  
  // Payment
  PAYMENT_IN_CLINIC_ONLY: 'الدفع يتم في العيادة فقط (كاش، فيزا، أو تقسيط)',
  APPOINTMENT_PAYMENT_REMINDER: 'تذكير: الدفع عند الوصول للعيادة',
  
  // Doctors
  DOCTOR_CREATED: 'تم إضافة الدكتور بنجاح',
  DOCTOR_UPDATED: 'تم تحديث بيانات الدكتور',
  DOCTOR_DELETED: 'تم حذف الدكتور',
  DOCTOR_LINKED: 'تم ربط الدكتور بالعيادة',
  
  // Clinics
  CLINIC_CREATED: 'تم إضافة العيادة بنجاح',
  CLINIC_UPDATED: 'تم تحديث بيانات العيادة',
  CLINIC_DELETED: 'تم حذف العيادة',
  
  // Patients
  PATIENT_CREATED: 'تم إضافة بيانات المريض',
  PATIENT_UPDATED: 'تم تحديث بيانات المريض',
  PATIENT_DELETED: 'تم حذف بيانات المريض',
  
  // Medical Records
  MEDICAL_RECORD_CREATED: 'تم إضافة السجل الطبي',
  MEDICAL_RECORD_UPDATED: 'تم تحديث السجل الطبي',
  MEDICAL_RECORD_DELETED: 'تم حذف السجل الطبي',
  
  // Reviews
  REVIEW_CREATED: 'شكرا على تقييمك!',
  REVIEW_UPDATED: 'تم تحديث التقييم',
  REVIEW_DELETED: 'تم حذف التقييم',
  
  // File Uploads
  FILE_UPLOADED: 'تم رفع الملف بنجاح',
  FILE_DELETED: 'تم حذف الملف',
  
  // General
  DATA_RETRIEVED: 'تم جلب البيانات بنجاح',
  DATA_SAVED: 'تم حفظ البيانات بنجاح',
  OPERATION_SUCCESS: 'تمت العملية بنجاح'
};

// Egyptian Error Messages - رسائل الخطأ بالمصري
const ERROR_MESSAGES = {
  // Authentication
  INVALID_CREDENTIALS: 'الموبايل أو كلمة السر غلط',
  ACCOUNT_LOCKED: 'الحساب متوقف مؤقتا، حاول تاني بعدين',
  ACCOUNT_NOT_VERIFIED: 'الحساب مش مفعل',
  INVALID_OTP: 'كود التفعيل غلط',
  OTP_EXPIRED: 'كود التفعيل خلص وقته',
  OTP_ATTEMPTS_EXCEEDED: 'حاولت كتير، استنى شوية وارجع تاني',
  
  // Authorization
  UNAUTHORIZED: 'مش مسموح لك تدخل هنا',
  FORBIDDEN: 'مالكش صلاحية تعمل كده',
  TOKEN_EXPIRED: 'انتهت صلاحية الدخول، ادخل تاني',
  INVALID_TOKEN: 'بيانات الدخول غلط',
  
  // Validation
  VALIDATION_ERROR: 'في خطأ في البيانات اللي دخلتها',
  REQUIRED_FIELD: 'الحقل ده مطلوب',
  INVALID_EMAIL: 'الإيميل ده مش صحيح',
  INVALID_PHONE: 'رقم الموبايل ده مش صحيح',
  WEAK_PASSWORD: 'كلمة السر ضعيفة، خليها أقوى',
  PASSWORDS_NOT_MATCH: 'كلمة السر مش زي بعض',
  
  // Database
  USER_EXISTS: 'المستخدم ده موجود فعلا',
  USER_NOT_FOUND: 'مافيش حد بالبيانات دي',
  DOCTOR_EXISTS: 'الدكتور ده موجود فعلا',
  DOCTOR_NOT_FOUND: 'مالقيناش الدكتور ده',
  CLINIC_NOT_FOUND: 'مالقيناش العيادة دي',
  APPOINTMENT_NOT_FOUND: 'مالقيناش الموعد ده',
  PATIENT_NOT_FOUND: 'مالقيناش المريض ده',
  
  // Business Logic
  APPOINTMENT_CONFLICT: 'في موعد تاني في نفس الوقت ده',
  APPOINTMENT_PAST: 'مينفعش تحجز موعد في الماضي',
  DOCTOR_NOT_AVAILABLE: 'الدكتور مش متاح في الوقت ده',
  CLINIC_CLOSED: 'العيادة مقفولة في الوقت ده',
  
  // Payment
  NO_ONLINE_PAYMENT: 'مفيش دفع أونلاين، الدفع في العيادة بس',
  NO_INSURANCE_AVAILABLE: 'مفيش تأمين صحي متاح حالياً',
  PAYMENT_IN_CLINIC_REQUIRED: 'الدفع لازم يكون في العيادة (كاش، فيزا، أو تقسيط)',
  INVALID_PAYMENT_METHOD: 'طريقة الدفع دي مش متاحة، اختار من المتاح في العيادة',
  
  // File Upload
  FILE_TOO_LARGE: 'الملف كبير أوي، صغره شوية',
  INVALID_FILE_TYPE: 'نوع الملف ده مش مسموح',
  UPLOAD_FAILED: 'مقدرناش نرفع الملف',
  
  // Server
  SERVER_ERROR: 'في مشكلة في السيستم، حاول تاني',
  DATABASE_ERROR: 'في مشكلة في قاعدة البيانات',
  NETWORK_ERROR: 'في مشكلة في الشبكة',
  
  // Rate Limiting
  TOO_MANY_REQUESTS: 'حاولت كتير، استنى شوية',
  
  // General
  NOT_FOUND: 'مالقيناش اللي بتدور عليه',
  BAD_REQUEST: 'في حاجة غلط في الطلب',
  OPERATION_FAILED: 'العملية فشلت'
};

// Platform Information - معلومات المنصة
const PLATFORM_INFO = {
  NAME: 'عياداتنا',
  DESCRIPTION: 'منصة العيادات الطبية في كوم حمادة والبحيرة',
  VERSION: '1.0.0',
  CONTACT: {
    PHONE: '+20 45 123 4567',
    EMAIL: 'info@3ayadatna.com',
    ADDRESS: 'كوم حمادة، البحيرة، مصر'
  },
  COVERAGE_AREA: 'البحيرة - كوم حمادة',
  EXPANSION_READY: true
};

// Medical Specializations in Egyptian - التخصصات الطبية بالمصري
const MEDICAL_SPECIALIZATIONS = {
  INTERNAL: 'باطنة',
  PEDIATRICS: 'أطفال',
  GYNECOLOGY: 'نساء وتوليد',
  ORTHOPEDICS: 'عظام',
  CARDIOLOGY: 'قلب',
  DERMATOLOGY: 'جلدية',
  NEUROLOGY: 'مخ وأعصاب',
  PSYCHIATRY: 'نفسية',
  OPHTHALMOLOGY: 'عيون',
  ENT: 'أنف وأذن وحنجرة',
  DENTISTRY: 'أسنان',
  GENERAL_SURGERY: 'جراحة عامة',
  UROLOGY: 'مسالك بولية',
  EMERGENCY: 'طوارئ',
  FAMILY_MEDICINE: 'طب أسرة',
  CHEST: 'صدرية',
  ENDOCRINOLOGY: 'غدد صماء',
  NEPHROLOGY: 'كلى',
  GASTROENTEROLOGY: 'جهاز هضمي',
  RHEUMATOLOGY: 'روماتيزم'
};

module.exports = {
  USER_ROLES,
  APPOINTMENT_STATUS,
  MEDICAL_RECORD_TYPES,
  PAYMENT_METHODS,
  ALLOWED_FILE_TYPES,
  GENDER_OPTIONS,
  DAYS_OF_WEEK,
  EGYPTIAN_GOVERNORATES,
  BEHEIRA_CITIES,
  CLINIC_TYPES,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  PLATFORM_INFO,
  MEDICAL_SPECIALIZATIONS
}; 