# التخصصات الطبية الديناميكية

## نظرة عامة

تم إنشاء نظام التخصصات الطبية الديناميكية ليتيح للمدير إضافة وتعديل وحذف التخصصات الطبية حسب الحاجة، بدلاً من الاعتماد على قائمة ثابتة.

## المميزات

- ✅ **إدارة ديناميكية**: إضافة وتعديل وحذف التخصصات
- ✅ **ربط بالأطباء**: كل طبيب مرتبط بتخصص معين
- ✅ **إحصائيات تلقائية**: تحديث عدد الأطباء والمواعيد لكل تخصص
- ✅ **بحث متقدم**: البحث في التخصصات والأمراض الشائعة
- ✅ **حذف آمن**: لا يمكن حذف تخصص يستخدمه أطباء
- ✅ **SEO محسن**: روابط صديقة لمحركات البحث

## هيكل البيانات

### نموذج التخصص (Specialization)

```javascript
{
  name: "باطنة",                    // اسم التخصص
  code: "INTERNAL",                 // كود التخصص
  description: "وصف التخصص...",     // وصف مفصل
  commonConditions: ["ضغط", "سكري"], // الأمراض الشائعة
  icon: "🏥",                       // أيقونة التخصص
  isActive: true,                   // حالة التخصص
  isVerified: false,                // التحقق من التخصص
  slug: "باطنة",                    // رابط SEO
  stats: {                          // إحصائيات
    totalDoctors: 0,
    activeDoctors: 0,
    totalAppointments: 0,
    averageRating: 0,
    totalReviews: 0
  }
}
```

## API Endpoints

### للمدير (Admin)

#### جلب جميع التخصصات
```
GET /api/specializations?page=1&limit=10&search=باطنة&isActive=true
```

#### إنشاء تخصص جديد
```
POST /api/specializations
{
  "name": "تخصص جديد",
  "code": "NEW_SPEC",
  "description": "وصف التخصص",
  "commonConditions": ["مرض 1", "مرض 2"],
  "icon": "🏥"
}
```

#### تحديث تخصص
```
PUT /api/specializations/:id
{
  "name": "اسم محدث",
  "description": "وصف محدث"
}
```

#### حذف تخصص
```
DELETE /api/specializations/:id
```

#### استعادة تخصص محذوف
```
POST /api/specializations/:id/restore
```

#### التحقق من تخصص
```
POST /api/specializations/:id/verify
{
  "isVerified": true
}
```

#### تحديث إحصائيات التخصص
```
POST /api/specializations/:id/update-stats
```

### للجمهور (Public)

#### جلب التخصصات النشطة
```
GET /api/specializations/active
```

#### جلب التخصصات الشائعة
```
GET /api/specializations/popular?limit=10
```

#### البحث في التخصصات
```
GET /api/specializations/search?q=قلب
```

#### جلب تخصص محدد
```
GET /api/specializations/:id
```

## التخصصات الافتراضية

يتم إنشاء 10 تخصصات افتراضية:

1. **باطنة** (INTERNAL) - طب باطني وأمراض بالغين
2. **أطفال** (PEDIATRICS) - طب الأطفال وحديثي الولادة
3. **نساء وتوليد** (GYNECOLOGY) - أمراض النساء والولادة
4. **عظام** (ORTHOPEDICS) - جراحة العظام والمفاصل
5. **قلب** (CARDIOLOGY) - أمراض القلب والأوعية الدموية
6. **جلدية** (DERMATOLOGY) - الأمراض الجلدية والتناسلية
7. **عيون** (OPHTHALMOLOGY) - طب وجراحة العيون
8. **أنف وأذن وحنجرة** (ENT) - أمراض الأنف والأذن والحنجرة
9. **أسنان** (DENTISTRY) - طب وتجميل الأسنان
10. **مخ وأعصاب** (NEUROLOGY) - الأمراض العصبية والدماغ

## الربط مع الأطباء

كل طبيب مرتبط بتخصص واحد من خلال حقل `specialization` في نموذج `Doctor`:

```javascript
// في نموذج Doctor
{
  specialization: "باطنة",  // يجب أن يكون موجود في التخصصات
  // ... باقي البيانات
}
```

## الأمان والتحقق

- ✅ **صلاحيات المدير**: فقط المدير يمكنه إدارة التخصصات
- ✅ **حذف آمن**: لا يمكن حذف تخصص يستخدمه أطباء
- ✅ **تحقق من التكرار**: لا يمكن إنشاء تخصص بنفس الاسم أو الكود
- ✅ **حذف ناعم**: التخصصات المحذوفة لا تختفي نهائياً

## الإحصائيات التلقائية

يتم تحديث إحصائيات كل تخصص تلقائياً:

- عدد الأطباء الكلي
- عدد الأطباء النشطين
- إجمالي المواعيد
- متوسط التقييم
- عدد المراجعات

## الاستخدام

### تشغيل Seeder
```bash
node src/database/seeder.js
```

### إضافة تخصص جديد (Admin)
```javascript
// مثال لإضافة تخصص جديد
const newSpecialization = {
  name: "جراحة تجميلية",
  code: "PLASTIC_SURGERY",
  description: "جراحة تجميلية وإعادة بناء",
  commonConditions: ["حروق", "ندوب", "تشوهات خلقية"],
  icon: "🎭"
};
```

### البحث عن أطباء حسب التخصص
```javascript
// البحث عن أطباء في تخصص معين
const doctors = await Doctor.find({
  specialization: "باطنة",
  isActive: true
});
```

## الملفات المحدثة

- `src/models/Specialization.js` - نموذج التخصص
- `src/controllers/specializationController.js` - منطق التحكم
- `src/routes/specializationRoutes.js` - مسارات API
- `src/middlewares/validation.js` - التحقق من البيانات
- `src/database/specializationSeeder.js` - البيانات الأولية
- `src/app.js` - إضافة المسارات

## الفوائد

1. **مرونة**: إضافة تخصصات جديدة حسب الحاجة
2. **دقة**: كل طبيب مرتبط بتخصص محدد
3. **سهولة الإدارة**: واجهة إدارية شاملة
4. **أمان**: حماية من الحذف العرضي
5. **أداء**: إحصائيات محسنة للبحث والتصفية 