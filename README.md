# 🏥 عياداتنا - منصة العيادات الطبية

منصة عياداتنا الطبية - كوم حمادة، البحيرة، مصر  
Backend API مكتوب بـ Node.js و Express.js و MongoDB مع Real-time Audit Logging

## 🌟 المميزات

### 🏥 **للمنطقة المصرية - البحيرة**
- **📍 تركيز محلي**: كوم حمادة والمدن المجاورة في البحيرة
- **🇪🇬 نصوص مصرية**: جميع الرسائل باللهجة المصرية
- **🏥 توسع ديناميكي**: إضافة أطباء وعيادات حسب النمو
- **📱 أرقام مصرية**: دعم أرقام الموبايل المصرية

### 🔐 **الأمان والمراقبة**
- **🔴 مراقبة مباشرة**: Real-time Audit Logging
- **⚡ إشعارات فورية**: WebSocket للأحداث المهمة
- **🛡️ تتبع أمني**: مراقبة جميع العمليات والتغييرات
- **📊 إحصائيات مباشرة**: dashboard للمديرين

### 🏥 **الوظائف الطبية**
- **👥 إدارة الأدوار**: مدير، طبيب، استقبال، مريض، زائر
- **🏥 إدارة العيادات**: عيادات متعددة مع ربط الأطباء
- **📅 نظام حجز المواعيد**: للمرضى المسجلين والزوار
- **📋 السجلات الطبية**: رفع وإدارة الملفات الطبية
- **⭐ نظام التقييمات**: تقييم الأطباء والعيادات
- **📍 البحث الجغرافي**: البحث عن أطباء قريبين في البحيرة

## 🛠️ التقنيات المستخدمة

- **Node.js** - منصة تشغيل JavaScript
- **Express.js** - إطار عمل الويب
- **MongoDB** - قاعدة البيانات
- **Mongoose** - ODM لـ MongoDB
- **JWT** - المصادقة
- **bcryptjs** - تشفير كلمات المرور
- **Multer** - رفع الملفات
- **Morgan** - سجلات HTTP
- **Helmet** - أمان Express
- **CORS** - مشاركة الموارد

## 📁 هيكل المشروع

```
3ayadty-backend/
├── src/
│   ├── config/          # إعدادات قاعدة البيانات والثوابت
│   ├── controllers/     # المتحكمات
│   ├── middlewares/     # الوسطاء
│   ├── models/          # نماذج قاعدة البيانات
│   ├── routes/          # المسارات
│   ├── services/        # الخدمات
│   ├── utils/           # الأدوات المساعدة
│   ├── validators/      # التحقق من البيانات
│   └── app.js          # ملف التطبيق الرئيسي
├── uploads/            # مجلد الملفات المرفوعة
├── .env.example        # متغيرات البيئة النموذجية
├── package.json        # تبعيات Node.js
└── README.md          # هذا الملف
```

## 🚀 البدء السريع

### المتطلبات

- Node.js (>= 16.0.0)
- MongoDB (محلي أو Atlas)
- npm أو yarn

### التثبيت

1. **استنساخ المشروع**
```bash
git clone <repository-url>
cd 3ayadty-backend
```

2. **تثبيت التبعيات**
```bash
npm install
```

3. **إعداد متغيرات البيئة**
```bash
cp .env.example .env
```

4. **تحرير ملف .env وإضافة البيانات المطلوبة**
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/3ayadty

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Other configurations...
```

5. **تشغيل التطبيق**
```bash
# للتطوير
npm run dev

# للإنتاج
npm start
```

## 📚 API Documentation

### الـ Endpoints الأساسية

#### 🔐 المصادقة (`/api/auth`)

| Method | Endpoint | الوصف |
|--------|----------|--------|
| POST | `/register` | تسجيل مريض جديد |
| POST | `/login` | تسجيل الدخول |
| POST | `/visitor/request-otp` | طلب رمز تحقق للزائر |
| POST | `/visitor/verify-otp` | التحقق من رمز OTP |
| GET | `/profile` | جلب الملف الشخصي |
| PUT | `/profile` | تحديث الملف الشخصي |
| PUT | `/change-password` | تغيير كلمة المرور |
| POST | `/logout` | تسجيل الخروج |

#### 👨‍⚕️ الأطباء (`/api/doctors`)

| Method | Endpoint | الوصف |
|--------|----------|--------|
| GET | `/` | جلب جميع الأطباء |
| GET | `/search` | البحث في الأطباء |
| GET | `/nearby` | الأطباء القريبين |
| GET | `/specialization/:spec` | الأطباء حسب التخصص |
| POST | `/` | إضافة طبيب جديد |
| GET | `/:id` | جلب طبيب بالمعرف |
| PUT | `/:id` | تحديث بيانات الطبيب |
| DELETE | `/:id` | حذف الطبيب |

#### 🌐 العام (`/api/public`)

| Method | Endpoint | الوصف |
|--------|----------|--------|
| GET | `/doctors` | قائمة الأطباء العامة |
| GET | `/doctor/:slug` | ملف الطبيب العام |
| GET | `/clinics` | قائمة العيادات |
| GET | `/specializations` | التخصصات المتاحة |
| GET | `/cities` | المدن المتاحة |
| GET | `/search` | البحث العام |
| GET | `/stats` | إحصائيات المنصة |

### أمثلة الطلبات

#### تسجيل مريض جديد
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "أحمد محمد علي",
    "mobile": "0501234567",
    "email": "ahmed@example.com",
    "password": "123456",
    "gender": "male",
    "dateOfBirth": "1990-01-01",
    "emergencyContact": {
      "name": "فاطمة علي",
      "relationship": "زوجة",
      "mobile": "0509876543"
    }
  }'
```

#### تسجيل الدخول
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "mobile": "0501234567",
    "password": "123456"
  }'
```

#### جلب الأطباء مع التصفح
```bash
curl "http://localhost:5000/api/doctors?page=1&limit=10&specialization=أطفال&city=الرياض"
```

#### البحث عن الأطباء
```bash
curl "http://localhost:5000/api/doctors/search?q=قلب"
```

## 🔒 المصادقة والتخويل

يستخدم API نظام JWT للمصادقة. يجب إرسال الرمز في الـ header:

```bash
Authorization: Bearer <your-jwt-token>
```

### الأدوار المتاحة:
- **admin**: مدير النظام
- **doctor**: طبيب
- **reception**: موظف استقبال
- **patient**: مريض
- **guest**: زائر (غير مسجل)

## 📁 رفع الملفات

يدعم API رفع الملفات التالية:
- **الصور**: JPEG, PNG, GIF, WebP
- **المستندات**: PDF, DOC, DOCX

### مجلدات الرفع:
- `uploads/profiles/` - الصور الشخصية
- `uploads/clinics/` - صور العيادات
- `uploads/medical-records/` - الملفات الطبية
- `uploads/documents/` - مستندات عامة

## 🌍 متغيرات البيئة

```env
# إعدادات الخادم
PORT=5000
NODE_ENV=development

# قاعدة البيانات
MONGODB_URI=mongodb://localhost:27017/3ayadty

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# OTP
OTP_EXPIRES_IN=300000

# رفع الملفات
MAX_FILE_SIZE=5242880
UPLOAD_PATH=uploads/

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

## 📊 قاعدة البيانات

### المجموعات الرئيسية:
- **users** - المستخدمون الأساسيون
- **doctors** - ملفات الأطباء
- **patients** - ملفات المرضى
- **visitors** - الزوار (غير المسجلين)
- **clinics** - العيادات
- **appointments** - المواعيد
- **medicalrecords** - السجلات الطبية
- **reviews** - التقييمات
- **admins** - المديرون

## 🧪 الاختبار

```bash
# تشغيل الاختبارات
npm test

# اختبارات مع تغطية الكود
npm run test:coverage
```

## 📝 إضافة بيانات تجريبية

```bash
# تشغيل الـ seeder
npm run seed
```

## 🐛 استكشاف الأخطاء

### مشاكل شائعة:

1. **خطأ اتصال قاعدة البيانات**
   - تأكد من تشغيل MongoDB
   - تحقق من `MONGODB_URI` في `.env`

2. **خطأ رفع الملفات**
   - تأكد من وجود مجلد `uploads/`
   - تحقق من صلاحيات الكتابة

3. **خطأ JWT**
   - تأكد من وجود `JWT_SECRET` في `.env`
   - تحقق من صحة الرمز المرسل

## 🚀 النشر

### على Heroku:
```bash
heroku create 3ayadty-backend
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=<your-mongodb-atlas-uri>
heroku config:set JWT_SECRET=<your-jwt-secret>
git push heroku main
```

### على VPS:
```bash
# استخدم PM2 لإدارة العملية
npm install -g pm2
pm2 start src/app.js --name "3ayadty-backend"
pm2 startup
pm2 save
```

## 🤝 المساهمة

1. Fork المشروع
2. إنشاء feature branch (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push للـ branch (`git push origin feature/amazing-feature`)
5. فتح Pull Request

## 📄 الترخيص

هذا المشروع مرخص تحت رخصة MIT - راجع ملف [LICENSE](LICENSE) للتفاصيل.

## 📞 التواصل

- **الإيميل**: support@3ayadty.com
- **الموقع**: https://3ayadty.com
- **التوثيق**: https://docs.3ayadty.com

---

**مرحباً بك في منصة عياداتي الطبية! 🏥💚** 