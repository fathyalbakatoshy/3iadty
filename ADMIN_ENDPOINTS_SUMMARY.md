# جميع Endpoints الخاصة بالمدير (Admin)
# All Admin Endpoints

## نظرة عامة
هذا الملف يحتوي على جميع endpoints المتاحة للمديرين في منصة عياداتي الطبية.

## 🔐 Authentication & Authorization
جميع endpoints تتطلب تسجيل دخول كمدير (`isAuth` + `isAdmin`)

---

## 📊 لوحة التحكم والإحصائيات

### 1. إحصائيات لوحة التحكم
```
GET /api/admin/dashboard/stats
```
**الوصف**: جلب إحصائيات شاملة للوحة التحكم
**البيانات المُرجعة**:
- إجمالي المستخدمين والمرضى والأطباء والعيادات
- إحصائيات المواعيد (اليوم، الأسبوع، الشهر)
- المواعيد المعلقة والمؤكدة
- الإيرادات والإحصائيات المالية

### 2. إدارة المستخدمين
```
GET /api/admin/users
```
**الوصف**: جلب قائمة المستخدمين مع التصفية والترقيم
**المعاملات**:
- `page`: رقم الصفحة
- `limit`: عدد العناصر في الصفحة
- `role`: نوع المستخدم (admin, doctor, patient)
- `search`: البحث في الاسم أو الجوال أو البريد
- `sortBy`: ترتيب حسب (createdAt, fullName, role)
- `sortOrder`: اتجاه الترتيب (asc, desc)

### 3. تحديث حالة المستخدم
```
PUT /api/admin/users/:userId/status
```
**الوصف**: تفعيل/إلغاء تفعيل المستخدم
**البيانات المطلوبة**:
```json
{
  "isActive": true/false,
  "reason": "سبب التغيير"
}
```

### 4. حذف المستخدم
```
DELETE /api/admin/users/:userId
```
**الوصف**: حذف مستخدم نهائياً من النظام

---

## 🏥 إدارة الأطباء

### 5. إضافة طبيب جديد
```
POST /api/doctors
```
**الوصف**: إضافة طبيب جديد للنظام
**البيانات المطلوبة**:
```json
{
  "fullName": "اسم الطبيب",
  "mobile": "رقم الجوال",
  "email": "البريد الإلكتروني",
  "specialization": "التخصص",
  "consultationFee": 300,
  "biography": "السيرة الذاتية"
}
```

### 6. تحديث بيانات الطبيب
```
PUT /api/doctors/:doctorId
```
**الوصف**: تحديث بيانات الطبيب

### 7. حذف الطبيب
```
DELETE /api/doctors/:doctorId
```
**الوصف**: حذف طبيب من النظام

### 8. التحقق من الطبيب
```
POST /api/admin/doctors/:doctorId/verify
```
**الوصف**: التحقق من صحة بيانات الطبيب وترخيصه
**البيانات المطلوبة**:
```json
{
  "isVerified": true,
  "verificationNotes": "ملاحظات التحقق",
  "licenseNumber": "رقم الترخيص",
  "expiryDate": "تاريخ انتهاء الترخيص"
}
```

---

## 🏢 إدارة العيادات

### 9. التحقق من العيادة
```
POST /api/admin/clinics/:clinicId/verify
```
**الوصف**: التحقق من صحة بيانات العيادة وترخيصها
**البيانات المطلوبة**:
```json
{
  "isVerified": true,
  "verificationNotes": "ملاحظات التحقق",
  "licenseNumber": "رقم الترخيص",
  "expiryDate": "تاريخ انتهاء الترخيص"
}
```

---

## 📅 إدارة المواعيد

### 10. إدارة المواعيد
```
GET /api/admin/appointments
```
**الوصف**: جلب جميع المواعيد مع التصفية
**المعاملات**:
- `page`: رقم الصفحة
- `limit`: عدد العناصر
- `status`: حالة الموعد (pending, confirmed, completed, cancelled)
- `doctorId`: معرف الطبيب
- `clinicId`: معرف العيادة
- `dateFrom`: تاريخ البداية
- `dateTo`: تاريخ النهاية

### 11. إلغاء موعد
```
PUT /api/admin/appointments/:appointmentId/cancel
```
**الوصف**: إلغاء موعد من قبل المدير
**البيانات المطلوبة**:
```json
{
  "reason": "سبب الإلغاء",
  "notes": "ملاحظات إضافية"
}
```

---

## ⭐ إدارة التقييمات

### 12. مراجعة التقييمات
```
GET /api/admin/reviews/moderation
```
**الوصف**: جلب التقييمات التي تحتاج مراجعة
**المعاملات**:
- `page`: رقم الصفحة
- `limit`: عدد العناصر
- `status`: حالة المراجعة (pending, approved, rejected)

### 13. الموافقة على التقييم
```
PUT /api/admin/reviews/:reviewId/approve
```
**الوصف**: الموافقة على تقييم

### 14. رفض التقييم
```
PUT /api/admin/reviews/:reviewId/reject
```
**الوصف**: رفض تقييم
**البيانات المطلوبة**:
```json
{
  "reason": "سبب الرفض"
}
```

---

## 📈 التقارير والإحصائيات

### 15. تقارير النظام
```
GET /api/admin/reports
```
**الوصف**: جلب تقارير شاملة للنظام
**المعاملات**:
- `type`: نوع التقرير (overview, appointments, revenue, users, doctors)
- `period`: الفترة الزمنية (day, week, month, year)

### 16. تصدير البيانات
```
GET /api/admin/export/:dataType
```
**الوصف**: تصدير البيانات بصيغة CSV/Excel
**أنواع البيانات**:
- `users`: المستخدمين
- `doctors`: الأطباء
- `patients`: المرضى
- `appointments`: المواعيد
- `reviews`: التقييمات

---

## 🔍 سجلات التدقيق (Audit Logs)

### 17. سجلات التدقيق العامة
```
GET /api/audit-logs
```
**الوصف**: جلب جميع سجلات التدقيق
**المعاملات**:
- `page`: رقم الصفحة
- `limit`: عدد العناصر
- `action`: نوع العملية (CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT)
- `modelName`: نوع النموذج (User, Doctor, Patient, Clinic, Appointment)
- `category`: الفئة (AUTHENTICATION, SECURITY, MEDICAL, SYSTEM)
- `severity`: مستوى الأهمية (LOW, MEDIUM, HIGH, CRITICAL)

### 18. سجلات التدقيق الحساسة
```
GET /api/audit-logs/admin/sensitive
```
**الوصف**: جلب السجلات الحساسة فقط (HIGH, CRITICAL)

### 19. سجلات الأمان
```
GET /api/audit-logs/admin/security
```
**الوصف**: جلب سجلات الأمان والاختراقات

### 20. سجلات المصادقة
```
GET /api/audit-logs/admin/authentication
```
**الوصف**: جلب سجلات تسجيل الدخول والخروج

### 21. إحصائيات سجلات التدقيق
```
GET /api/audit-logs/stats/overview
```
**الوصف**: إحصائيات شاملة لسجلات التدقيق
**المعاملات**:
- `timeframe`: الفترة الزمنية (1h, 24h, 7d, 30d)

---

## ⚡ الوقت الفعلي (Real-time)

### 22. المستخدمين المتصلين
```
GET /api/realtime/connected-users
```
**الوصف**: جلب المستخدمين المتصلين حالياً

### 23. إحصائيات الوقت الفعلي
```
GET /api/realtime/stats
```
**الوصف**: إحصائيات النظام في الوقت الفعلي

### 24. إرسال إشعار لمستخدم
```
POST /api/realtime/notify-user
```
**الوصف**: إرسال إشعار لمستخدم محدد
**البيانات المطلوبة**:
```json
{
  "userId": "معرف المستخدم",
  "message": "نص الإشعار",
  "type": "info|warning|success|error",
  "priority": "low|medium|high|urgent"
}
```

### 25. إرسال إشعار لدور محدد
```
POST /api/realtime/notify-role
```
**الوصف**: إرسال إشعار لجميع المستخدمين بدور محدد
**البيانات المطلوبة**:
```json
{
  "role": "admin|doctor|patient|reception",
  "message": "نص الإشعار",
  "type": "info|warning|success|error"
}
```

### 26. إشعار الصيانة
```
POST /api/realtime/maintenance
```
**الوصف**: إرسال إشعار صيانة لجميع المستخدمين
**البيانات المطلوبة**:
```json
{
  "message": "رسالة الصيانة",
  "duration": "مدة الصيانة",
  "startTime": "وقت بداية الصيانة"
}
```

### 27. إشعار الطوارئ
```
POST /api/realtime/emergency
```
**الوصف**: إرسال إشعار طوارئ لجميع المستخدمين
**البيانات المطلوبة**:
```json
{
  "message": "رسالة الطوارئ",
  "severity": "low|medium|high|critical"
}
```

### 28. حالة النظام
```
GET /api/realtime/system-status
```
**الوصف**: جلب حالة النظام المباشرة

---

## 👥 إدارة المديرين

### 29. إنشاء مدير جديد
```
POST /api/admin/create
```
**الوصف**: إنشاء مدير جديد
**البيانات المطلوبة**:
```json
{
  "fullName": "اسم المدير",
  "mobile": "رقم الجوال",
  "email": "البريد الإلكتروني",
  "workEmail": "البريد الإلكتروني للعمل",
  "position": "المنصب",
  "department": "القسم",
  "adminLevel": "super_admin|system_admin|content_admin|support_admin",
  "permissions": {
    "canManageUsers": true,
    "canManageDoctors": true,
    "canManageClinics": true,
    "canAccessAnalytics": true
  }
}
```

---

## 🔧 الإعدادات والنظام

### 30. إعدادات النظام
```
GET /api/admin/settings
```
**الوصف**: جلب إعدادات النظام

### 31. تحديث إعدادات النظام
```
PUT /api/admin/settings
```
**الوصف**: تحديث إعدادات النظام

### 32. نسخ احتياطية
```
POST /api/admin/backup
```
**الوصف**: إنشاء نسخة احتياطية من قاعدة البيانات

### 33. استعادة نسخة احتياطية
```
POST /api/admin/restore
```
**الوصف**: استعادة نسخة احتياطية

---

## 📋 ملخص الصلاحيات

### المدير العام (Super Admin)
- ✅ جميع الصلاحيات
- ✅ إدارة المديرين الآخرين
- ✅ إعدادات النظام
- ✅ النسخ الاحتياطية

### مدير النظام (System Admin)
- ✅ إدارة المستخدمين والأطباء والعيادات
- ✅ التقارير والإحصائيات
- ✅ سجلات التدقيق
- ✅ إدارة المواعيد والتقييمات

### مدير المحتوى (Content Admin)
- ✅ مراجعة التقييمات
- ✅ إدارة المحتوى
- ✅ التقارير الأساسية

### مدير الدعم (Support Admin)
- ✅ عرض المواعيد
- ✅ مراجعة التقييمات
- ✅ إحصائيات أساسية

---

## 🔒 الأمان

جميع endpoints تتطلب:
1. **Authentication**: تسجيل دخول صحيح
2. **Authorization**: صلاحيات مدير
3. **Rate Limiting**: حماية من الاستخدام المفرط
4. **Audit Logging**: تسجيل جميع العمليات
5. **Input Validation**: التحقق من صحة البيانات

---

## 📝 ملاحظات مهمة

- جميع التواريخ بصيغة ISO 8601
- جميع المعرفات بصيغة MongoDB ObjectId
- الرسائل باللغة العربية
- الاستجابة بصيغة JSON موحدة
- رمز الاستجابة HTTP مناسب لكل عملية 