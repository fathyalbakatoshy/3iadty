# العلاقة بين الطبيب والتخصص

## نظرة عامة

تم إنشاء علاقة حقيقية بين نموذج `Doctor` ونموذج `Specialization` باستخدام MongoDB References بدلاً من النص العادي.

## التغييرات المنجزة

### 1. نموذج الطبيب (Doctor Model)

#### قبل التحديث:
```javascript
specialization: {
  type: String,
  required: [true, 'التخصص مطلوب'],
  trim: true
}
```

#### بعد التحديث:
```javascript
specialization: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Specialization',
  required: [true, 'التخصص مطلوب']
}
```

### 2. Controller الأطباء

تم تحديث جميع الدوال لاستخدام `populate` مع التخصص:

```javascript
// مثال على populate التخصص
const doctors = await Doctor.find(query)
  .populate('userId', 'fullName mobile email')
  .populate('specialization', 'name code description icon')
  .populate('clinics.clinicId', 'name location.address')
  .sort(sortObj)
  .skip(skip)
  .limit(limitNum)
  .lean();
```

### 3. Routes الأطباء

تم تحديث route جلب الأطباء حسب التخصص:

```javascript
// قبل التحديث
router.get('/specialization/:specialization', ...)

// بعد التحديث
router.get('/specialization/:specializationId', validateObjectId('specializationId'), ...)
```

### 4. Public Routes

تم تحديث public routes لاستخدام populate:

```javascript
const doctors = await Doctor.find(query)
  .populate('userId', 'fullName')
  .populate('specialization', 'name code description icon')
  .select('name slug specialization consultationFee stats.averageRating stats.totalReviews profilePicture location.address.city isPhoneVisible')
  .sort({ 'stats.averageRating': -1, createdAt: -1 })
  .skip(skip)
  .limit(parseInt(limit))
  .lean();
```

### 5. Seeder الأطباء

تم تحديث seeder لاستخدام أسماء التخصصات الصحيحة:

```javascript
// قبل التحديث
specialization: 'طب القلب'

// بعد التحديث
specialization: 'قلب'
```

وتم إضافة منطق للبحث عن التخصص:

```javascript
// Find specialization by name
const specialization = await Specialization.findOne({ 
  name: doctorData.doctor.specialization 
});

if (!specialization) {
  console.log(`❌ التخصص غير موجود: ${doctorData.doctor.specialization}`);
  continue;
}

// Create doctor profile
const doctor = new Doctor({
  ...doctorData.doctor,
  specialization: specialization._id, // Use specialization ID instead of name
  userId: doctorUser._id,
  slug
});
```

### 6. نموذج التخصص

تم تحديث دالة `updateStats` لاستخدام ID بدلاً من الاسم:

```javascript
// Method to update statistics
specializationSchema.methods.updateStats = function() {
  const Doctor = require('./Doctor');
  
  return Doctor.aggregate([
    {
      $match: {
        specialization: this._id, // استخدام ID بدلاً من الاسم
        isActive: true
      }
    },
    // ... باقي الكود
  ]);
};
```

### 7. Pre-save Middleware

تم تحديث middleware إنشاء slug للتعامل مع العلاقة الجديدة:

```javascript
// Pre-save middleware to generate slug
doctorSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('name') || this.isModified('specialization')) {
    const { generateUniqueSlug } = require('../utils/slug');
    // Get specialization name for slug
    let specializationName = '';
    if (this.specialization) {
      if (typeof this.specialization === 'string') {
        specializationName = this.specialization;
      } else {
        const Specialization = require('./Specialization');
        const specialization = await Specialization.findById(this.specialization);
        specializationName = specialization ? specialization.name : '';
      }
    }
    const slugText = `${this.name} ${specializationName}`;
    this.slug = await generateUniqueSlug(slugText, this.constructor, 'slug', this._id);
  }
  next();
});
```

## الفوائد من التحديث

### 1. **أداء محسن**
- استخدام MongoDB References بدلاً من النص العادي
- إمكانية استخدام Indexes على حقل التخصص
- تقليل حجم البيانات المخزنة

### 2. **اتساق البيانات**
- ضمان أن كل طبيب مرتبط بتخصص موجود فعلاً
- منع الأخطاء الإملائية في أسماء التخصصات
- سهولة تحديث اسم التخصص في مكان واحد

### 3. **مرونة أكبر**
- إمكانية إضافة معلومات إضافية للتخصص
- سهولة البحث والتصفية
- إمكانية استخدام populate للحصول على معلومات التخصص

### 4. **أمان البيانات**
- التحقق من وجود التخصص قبل ربط الطبيب به
- منع ربط الأطباء بتخصصات غير موجودة
- حماية من الحذف العرضي للتخصصات المستخدمة

## كيفية الاستخدام

### إنشاء طبيب جديد
```javascript
const doctor = new Doctor({
  name: 'د. أحمد محمد',
  specialization: specializationId, // استخدام ID التخصص
  consultationFee: 200,
  // ... باقي البيانات
});
```

### البحث عن أطباء حسب التخصص
```javascript
// باستخدام ID التخصص
const doctors = await Doctor.find({
  specialization: specializationId,
  isActive: true
}).populate('specialization', 'name code description icon');
```

### جلب معلومات التخصص مع الطبيب
```javascript
const doctor = await Doctor.findById(doctorId)
  .populate('specialization', 'name code description icon')
  .populate('userId', 'fullName');
```

## API Endpoints المحدثة

### جلب الأطباء حسب التخصص
```
GET /api/doctors/specialization/:specializationId
```

### جلب جميع الأطباء (مع populate التخصص)
```
GET /api/doctors?specialization=:specializationId
```

### جلب طبيب محدد (مع populate التخصص)
```
GET /api/doctors/:id
```

## ملاحظات مهمة

1. **تحديث البيانات الموجودة**: يجب تشغيل migration لتحديث البيانات الموجودة
2. **التحقق من التخصص**: يتم التحقق من وجود التخصص قبل إنشاء الطبيب
3. **الحذف الآمن**: لا يمكن حذف تخصص يستخدمه أطباء
4. **الأداء**: استخدام populate قد يؤثر على الأداء مع البيانات الكبيرة

## الملفات المحدثة

- `src/models/Doctor.js` - تحديث نموذج الطبيب
- `src/controllers/doctorController.js` - تحديث جميع الدوال
- `src/routes/doctorRoutes.js` - تحديث المسارات
- `src/routes/publicRoutes.js` - تحديث المسارات العامة
- `src/database/seeder.js` - تحديث البيانات الأولية
- `src/models/Specialization.js` - تحديث دالة updateStats 