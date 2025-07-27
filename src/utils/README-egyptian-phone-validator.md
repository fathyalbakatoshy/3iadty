# Egyptian Phone Number Validator
# محقق أرقام الهواتف المصرية

## نظرة عامة
محقق شامل لأرقام الهواتف المصرية يدعم جميع الأنماط المعروفة مع رسائل خطأ واضحة باللغة العربية.

## الميزات
- ✅ دعم الهواتف المحمولة (010, 011, 012, 015)
- ✅ دعم الهواتف الأرضية (02, 03, 04, 07, 08, 09)
- ✅ دعم أرقام الخدمات (15, 19)
- ✅ دعم أرقام الطوارئ (10, 11, 12, 13, 14)
- ✅ تنظيف تلقائي من المسافات والرموز
- ✅ تنسيق الأرقام
- ✅ تحويل إلى التنسيق الدولي
- ✅ رسائل خطأ واضحة بالعربية

## الاستخدام

### التحقق الأساسي
```javascript
const { validateEgyptianPhone } = require('./utils/egyptianPhoneValidator');

// التحقق من رقم محمول
const result = validateEgyptianPhone('01012345678', 'mobile');
console.log(result);
// {
//   isValid: true,
//   type: 'mobile',
//   cleanNumber: '01012345678',
//   formattedNumber: '010-1234-5678'
// }
```

### التحقق من أي نوع
```javascript
const result = validateEgyptianPhone('0212345678');
console.log(result);
// {
//   isValid: true,
//   type: 'landline',
//   cleanNumber: '0212345678',
//   formattedNumber: '02-1234-5678'
// }
```

### التنسيق
```javascript
const { formatEgyptianPhone } = require('./utils/egyptianPhoneValidator');

const formatted = formatEgyptianPhone('01012345678', 'mobile');
console.log(formatted); // "010-1234-5678"
```

### التحويل الدولي
```javascript
const { toInternationalFormat, fromInternationalFormat } = require('./utils/egyptianPhoneValidator');

const international = toInternationalFormat('01012345678');
console.log(international); // "+201012345678"

const local = fromInternationalFormat('+201012345678');
console.log(local); // "01012345678"
```

## الأنماط المدعومة

### الهواتف المحمولة
- **النمط**: `01[0-2,5][0-9]{8}`
- **الأمثلة**: `01012345678`, `01112345678`, `01212345678`, `01512345678`

### الهواتف الأرضية
- **النمط**: `0[2-4,7-9][0-9]{8}`
- **الأمثلة**: `0212345678`, `0312345678`, `0412345678`, `0712345678`, `0812345678`, `0912345678`

### أرقام الخدمات
- **النمط**: `1[59][0-9]{7}`
- **الأمثلة**: `151234567`, `191234567`

### أرقام الطوارئ
- **النمط**: `1[0-4][0-9]{6}`
- **الأمثلة**: `101234567`, `111234567`, `121234567`, `131234567`, `141234567`

## الدوال المتاحة

### `validateEgyptianPhone(phoneNumber, type)`
التحقق من صحة رقم الهاتف المصري.

**المعاملات:**
- `phoneNumber` (string): رقم الهاتف للتحقق منه
- `type` (string, optional): نوع الهاتف المطلوب (`mobile`, `landline`, `service`, `emergency`, `any`)

**القيمة المُرجعة:**
```javascript
{
  isValid: boolean,
  type: string | null,
  cleanNumber: string | null,
  formattedNumber: string | null,
  error: string | null,
  expectedFormat: string | null
}
```

### `formatEgyptianPhone(phoneNumber, type)`
تنسيق رقم الهاتف المصري.

### `getPhoneType(phoneNumber)`
استخراج نوع الهاتف من الرقم.

### `isEgyptianMobile(phoneNumber)`
التحقق من أن الرقم هاتف محمول مصري.

### `isEgyptianLandline(phoneNumber)`
التحقق من أن الرقم هاتف أرضي مصري.

### `generateRandomEgyptianPhone(type)`
إنشاء رقم هاتف مصري عشوائي للاختبار.

### `toInternationalFormat(phoneNumber)`
تحويل رقم الهاتف إلى التنسيق الدولي.

### `fromInternationalFormat(internationalNumber)`
تحويل الرقم الدولي إلى التنسيق المحلي.

## التكامل مع Express Validator

```javascript
const { body } = require('express-validator');
const { validateEgyptianPhone } = require('./utils/egyptianPhoneValidator');

const validateMobile = [
  body('mobile')
    .trim()
    .notEmpty()
    .withMessage('رقم الجوال مطلوب')
    .custom((value) => {
      const validation = validateEgyptianPhone(value, 'mobile');
      if (!validation.isValid) {
        throw new Error(validation.error);
      }
      return true;
    })
];
```

## التكامل مع Mongoose

```javascript
const mongoose = require('mongoose');
const { validateEgyptianPhone } = require('./utils/egyptianPhoneValidator');

const userSchema = new mongoose.Schema({
  mobile: {
    type: String,
    required: [true, 'رقم الجوال مطلوب'],
    unique: true,
    trim: true,
    validate: {
      validator: function(value) {
        return validateEgyptianPhone(value, 'mobile').isValid;
      },
      message: 'رقم الجوال غير صحيح - يجب أن يكون رقم هاتف محمول مصري صالح'
    }
  }
});
```

## الاختبار

لتشغيل الاختبارات:
```bash
node src/utils/testEgyptianPhoneValidator.js
```

## التحديثات المطلوبة في المشروع

تم تحديث الملفات التالية لاستخدام المحقق الجديد:

1. **Validators:**
   - `src/validators/authValidator.js`
   - `src/validators/appointmentValidator.js`
   - `src/middlewares/validation.js`

2. **Models:**
   - `src/models/User.js`
   - `src/models/Patient.js`
   - `src/models/Visitor.js`
   - `src/models/Clinic.js`
   - `src/models/Admin.js`

## المزايا

- **دقة عالية**: يدعم جميع أنماط أرقام الهواتف المصرية المعروفة
- **مرونة**: يمكن التحقق من نوع محدد أو أي نوع
- **سهولة الاستخدام**: واجهة بسيطة وواضحة
- **رسائل خطأ واضحة**: رسائل خطأ باللغة العربية
- **تنظيف تلقائي**: إزالة المسافات والرموز الزائدة
- **تنسيق**: تنسيق الأرقام بشكل جميل
- **دعم دولي**: تحويل إلى/من التنسيق الدولي

## المساهمة

لإضافة أنماط جديدة أو تحسين المحقق، يرجى:
1. تحديث `EGYPTIAN_PHONE_PATTERNS`
2. إضافة اختبارات جديدة
3. تحديث هذا الملف 