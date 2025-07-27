# تقرير شامل للفرونت إند - نظام التخصصات الديناميكية والتحقق من الهواتف المصرية

## 📋 فهرس التقرير

1. [نظرة عامة على التحديثات](#overview)
2. [التغييرات الأساسية](#breaking-changes)
3. [API Endpoints الجديدة والمحدثة](#api-endpoints)
4. [نماذج البيانات الجديدة](#data-models)
5. [أمثلة كود شاملة](#code-examples)
6. [إدارة التخصصات للأدمن](#admin-management)
7. [التحقق من أرقام الهواتف المصرية](#phone-validation)
8. [معالجة الأخطاء](#error-handling)
9. [الأمان والتوثيق](#security)
10. [الأداء والتحسينات](#performance)
11. [Migration للبيانات الموجودة](#migration)
12. [اختبار التكامل](#testing)

---

## 📊 نظرة عامة على التحديثات {#overview}

### ما تم تطويره:

1. **نظام التخصصات الديناميكية**
   - إنشاء نموذج `Specialization` جديد
   - علاقة قوية بين الطبيب والتخصص
   - إدارة كاملة للتخصصات من لوحة الأدمن

2. **التحقق من أرقام الهواتف المصرية**
   - نظام شامل للتحقق من الأرقام المصرية
   - دعم أرقام الموبايل والأرضي
   - رسائل خطأ باللغة العربية

3. **تحسينات API**
   - endpoints جديدة للتخصصات
   - تحديث responses الأطباء
   - إضافة populate للعلاقات

### الفوائد للمستخدم النهائي:

- ✅ تخصصات محدثة ودقيقة
- ✅ معلومات شاملة عن كل تخصص
- ✅ بحث وفلترة محسنة
- ✅ أرقام هواتف صحيحة ومصرية
- ✅ واجهة أكثر تفاعلية

---

## 🚨 التغييرات الأساسية {#breaking-changes}

### 1. هيكل بيانات التخصص

#### قبل التحديث:
```javascript
// الطبيب كان يحتوي على نص بسيط للتخصص
{
  "_id": "doctorId",
  "name": "د. أحمد محمد",
  "specialization": "قلب", // نص بسيط
  "consultationFee": 300
}
```

#### بعد التحديث:
```javascript
// الطبيب الآن يحتوي على object كامل للتخصص
{
  "_id": "doctorId",
  "name": "د. أحمد محمد",
  "specialization": {
    "_id": "64f5a1b2c8d9e1f2a3b4c5d6",
    "name": "قلب",
    "code": "CARDIOLOGY",
    "description": "أمراض القلب والأوعية الدموية - تشخيص وعلاج أمراض القلب",
    "commonConditions": ["ضغط الدم", "الجلطات", "عدم انتظام ضربات القلب"],
    "icon": "❤️",
    "slug": "قلب",
    "stats": {
      "totalDoctors": 25,
      "activeDoctors": 20,
      "averageRating": 4.7,
      "totalReviews": 450
    }
  },
  "consultationFee": 300
}
```

### 2. تغيير في endpoints البحث

#### قبل التحديث:
```http
GET /api/doctors/specialization/قلب
GET /api/doctors?specialization=قلب
```

#### بعد التحديث:
```http
GET /api/doctors/specialization/64f5a1b2c8d9e1f2a3b4c5d6
GET /api/doctors?specialization=64f5a1b2c8d9e1f2a3b4c5d6
```

### 3. جلب التخصصات

#### قبل التحديث:
```javascript
// قائمة ثابتة في الكود
const specializations = [
  { name: 'باطنة', value: 'internal' },
  { name: 'أطفال', value: 'pediatrics' },
  // ...
];
```

#### بعد التحديث:
```javascript
// جلب ديناميكي من API
const [specializations, setSpecializations] = useState([]);

useEffect(() => {
  const fetchSpecializations = async () => {
    try {
      const response = await axios.get('/api/specializations/active');
      setSpecializations(response.data.data);
    } catch (error) {
      console.error('Error fetching specializations:', error);
    }
  };
  
  fetchSpecializations();
}, []);
```

---

## 🚀 API Endpoints الجديدة والمحدثة {#api-endpoints}

### التخصصات (Specializations) - جديد

#### 1. جلب التخصصات النشطة (عام)
```http
GET /api/specializations/active
```

**الاستخدام:** صفحة التخصصات الرئيسية، فلاتر البحث

**Response:**
```json
{
  "success": true,
  "message": "تم جلب البيانات بنجاح",
  "data": [
    {
      "_id": "64f5a1b2c8d9e1f2a3b4c5d6",
      "name": "باطنة",
      "code": "INTERNAL",
      "description": "طب باطني وأمراض بالغين - تشخيص وعلاج الأمراض الداخلية",
      "commonConditions": [
        "ضغط الدم",
        "السكري", 
        "الكوليسترول",
        "الأنيميا",
        "أمراض الجهاز الهضمي"
      ],
      "icon": "🏥",
      "slug": "باطنة",
      "stats": {
        "totalDoctors": 15,
        "activeDoctors": 12,
        "totalAppointments": 450,
        "averageRating": 4.5,
        "totalReviews": 120
      },
      "isActive": true,
      "isVerified": true,
      "createdAt": "2023-09-01T10:00:00.000Z",
      "updatedAt": "2023-09-15T14:30:00.000Z"
    }
  ]
}
```

#### 2. جلب التخصصات الشائعة
```http
GET /api/specializations/popular?limit=10
```

**الاستخدام:** الصفحة الرئيسية، قسم "التخصصات الأكثر طلباً"

**Parameters:**
- `limit` (optional): عدد التخصصات المطلوبة (افتراضي: 10)

**Response:** نفس structure السابق مرتب حسب عدد الأطباء والمواعيد

#### 3. البحث في التخصصات
```http
GET /api/specializations/search?q=قلب
```

**الاستخدام:** البحث في صفحة التخصصات

**Parameters:**
- `q` (required): كلمة البحث
- `category` (optional): فلتر حسب الفئة

**Response:** نفس structure السابق مع النتائج المطابقة

#### 4. جلب تخصص محدد مع الأطباء
```http
GET /api/specializations/:id
```

**الاستخدام:** صفحة التخصص المحددة

**Response:**
```json
{
  "success": true,
  "data": {
    "specialization": {
      "_id": "64f5a1b2c8d9e1f2a3b4c5d6",
      "name": "باطنة", 
      "code": "INTERNAL",
      "description": "طب باطني وأمراض بالغين",
      "commonConditions": ["ضغط الدم", "السكري"],
      "icon": "🏥",
      "stats": {
        "totalDoctors": 15,
        "activeDoctors": 12
      }
    },
    "doctors": {
      "count": 12,
      "list": [
        {
          "_id": "64f5a1b2c8d9e1f2a3b4c5d7",
          "name": "د. أحمد محمد",
          "consultationFee": 200,
          "stats": {
            "averageRating": 4.8,
            "totalReviews": 45
          }
        }
      ]
    }
  }
}
```

### الأطباء (Doctors) - محدث

#### 1. جلب جميع الأطباء مع فلتر التخصص
```http
GET /api/doctors?page=1&limit=10&specialization=64f5a1b2c8d9e1f2a3b4c5d6&city=القاهرة&minRating=4&maxPrice=500
```

**Parameters:**
- `page`: رقم الصفحة (افتراضي: 1)
- `limit`: عدد النتائج (افتراضي: 10)
- `specialization`: ID التخصص
- `city`: المدينة
- `minRating`: أقل تقييم
- `maxPrice`: أعلى سعر
- `search`: البحث في الاسم أو التاجز
- `sortBy`: ترتيب حسب (createdAt, consultationFee, stats.averageRating)
- `sortOrder`: اتجاه الترتيب (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f5a1b2c8d9e1f2a3b4c5d7",
      "name": "د. أحمد محمد الأحمد",
      "slug": "د-أحمد-محمد-الأحمد-قلب",
      "specialization": {
        "_id": "64f5a1b2c8d9e1f2a3b4c5d6",
        "name": "قلب",
        "code": "CARDIOLOGY", 
        "description": "أمراض القلب والأوعية الدموية",
        "icon": "❤️"
      },
      "subSpecialization": "قسطرة القلب",
      "consultationFee": 300,
      "followupFee": 200,
      "stats": {
        "averageRating": 4.8,
        "totalReviews": 120,
        "totalAppointments": 450,
        "completedAppointments": 430
      },
      "profilePicture": {
        "url": "https://example.com/profile.jpg",
        "filename": "profile.jpg"
      },
      "location": {
        "address": {
          "city": "القاهرة",
          "area": "المعادي"
        }
      },
      "isAcceptingPatients": true,
      "isPhoneVisible": true,
      "userId": {
        "fullName": "د. أحمد محمد الأحمد",
        "mobile": "01023456789",
        "email": "ahmed.doctor@3ayadty.com"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalItems": 25,
    "totalPages": 3
  }
}
```

#### 2. جلب الأطباء حسب التخصص (محدث)
```http
GET /api/doctors/specialization/:specializationId?page=1&limit=10
```

**مثال:**
```http
GET /api/doctors/specialization/64f5a1b2c8d9e1f2a3b4c5d6?page=1&limit=10
```

**Response:** نفس structure السابق

#### 3. جلب طبيب محدد
```http
GET /api/doctors/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "64f5a1b2c8d9e1f2a3b4c5d7",
    "name": "د. أحمد محمد الأحمد",
    "slug": "د-أحمد-محمد-الأحمد-قلب",
    "specialization": {
      "_id": "64f5a1b2c8d9e1f2a3b4c5d6",
      "name": "قلب",
      "code": "CARDIOLOGY",
      "description": "أمراض القلب والأوعية الدموية",
      "icon": "❤️"
    },
    "subSpecialization": "قسطرة القلب",
    "biography": "استشاري أمراض القلب والأوعية الدموية مع خبرة تزيد عن 15 عاماً في مجال طب القلب التداخلي",
    "degrees": [
      {
        "degree": "بكالوريوس الطب والجراحة",
        "institution": "جامعة الملك سعود",
        "year": 2003,
        "country": "السعودية"
      }
    ],
    "consultationFee": 300,
    "followupFee": 200,
    "availability": [
      {
        "day": "sunday",
        "isAvailable": true,
        "timeSlots": [
          {
            "startTime": "09:00",
            "endTime": "12:00"
          },
          {
            "startTime": "16:00", 
            "endTime": "20:00"
          }
        ]
      }
    ],
    "stats": {
      "averageRating": 4.8,
      "totalReviews": 120,
      "totalAppointments": 450,
      "completedAppointments": 430,
      "canceledAppointments": 20
    },
    "tags": ["قلب", "قسطرة", "ضغط", "كوليسترول"],
    "languages": ["العربية", "الإنجليزية"]
  }
}
```

### Public Routes (محدث)

#### 1. الأطباء العامة (SEO friendly)
```http
GET /api/public/doctors?page=1&limit=12&specialization=64f5a1b2c8d9e1f2a3b4c5d6&city=القاهرة
```

**الاستخدام:** الصفحات العامة، محركات البحث

**Response:** مبسط للأداء
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f5a1b2c8d9e1f2a3b4c5d7",
      "name": "د. أحمد محمد الأحمد",
      "slug": "د-أحمد-محمد-الأحمد-قلب",
      "specialization": {
        "name": "قلب",
        "icon": "❤️"
      },
      "consultationFee": 300,
      "stats": {
        "averageRating": 4.8,
        "totalReviews": 120
      },
      "location": {
        "address": {
          "city": "القاهرة"
        }
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalItems": 25,
    "itemsPerPage": 12
  }
}
```

#### 2. ملف الطبيب العام (SEO friendly)
```http
GET /api/public/doctor/:slug
```

**مثال:**
```http
GET /api/public/doctor/د-أحمد-محمد-الأحمد-قلب
```

**Response:** ملف كامل للطبيب مع معلومات التخصص

### Admin Endpoints (للأدمن فقط)

#### 1. جلب جميع التخصصات (Admin)
```http
GET /api/specializations?page=1&limit=10&search=قلب&isActive=true
Authorization: Bearer <admin_token>
```

**Parameters:**
- `page`: رقم الصفحة
- `limit`: عدد النتائج
- `search`: البحث في الاسم أو الكود
- `isActive`: فلتر حسب الحالة (true/false)
- `sortBy`: ترتيب حسب (name, createdAt, stats.totalDoctors)
- `sortOrder`: اتجاه الترتيب

**Response:**
```json
{
  "success": true,
  "data": {
    "specializations": [
      {
        "_id": "64f5a1b2c8d9e1f2a3b4c5d6",
        "name": "باطنة",
        "code": "INTERNAL",
        "description": "طب باطني وأمراض بالغين",
        "commonConditions": ["ضغط الدم", "السكري"],
        "icon": "🏥",
        "isActive": true,
        "isVerified": true,
        "stats": {
          "totalDoctors": 15,
          "activeDoctors": 12
        },
        "createdBy": {
          "fullName": "Admin User"
        },
        "createdAt": "2023-09-01T10:00:00.000Z"
      }
    ],
    "statistics": {
      "total": 10,
      "active": 8,
      "verified": 6
    }
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalItems": 10,
    "totalPages": 1
  }
}
```

#### 2. إنشاء تخصص جديد
```http
POST /api/specializations
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "جراحة تجميلية",
  "code": "PLASTIC_SURGERY", 
  "description": "جراحة تجميلية وإعادة بناء للوجه والجسم",
  "commonConditions": [
    "حروق",
    "ندوب", 
    "تشوهات خلقية",
    "عمليات تجميل"
  ],
  "icon": "🎭"
}
```

**Response:**
```json
{
  "success": true,
  "message": "تم إنشاء التخصص بنجاح",
  "data": {
    "_id": "64f5a1b2c8d9e1f2a3b4c5d8",
    "name": "جراحة تجميلية",
    "code": "PLASTIC_SURGERY",
    "description": "جراحة تجميلية وإعادة بناء للوجه والجسم",
    "commonConditions": ["حروق", "ندوب", "تشوهات خلقية"],
    "icon": "🎭",
    "slug": "جراحة-تجميلية",
    "isActive": true,
    "isVerified": false,
    "stats": {
      "totalDoctors": 0,
      "activeDoctors": 0,
      "totalAppointments": 0,
      "averageRating": 0,
      "totalReviews": 0
    },
    "createdAt": "2023-09-20T10:00:00.000Z"
  }
}
```

#### 3. تحديث تخصص
```http
PUT /api/specializations/:id
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:** نفس بيانات الإنشاء (جميع الحقول اختيارية)

#### 4. حذف تخصص (Soft Delete)
```http
DELETE /api/specializations/:id
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "message": "تم حذف التخصص بنجاح"
}
```

**أو في حالة وجود أطباء:**
```json
{
  "success": false,
  "message": "لا يمكن حذف التخصص لوجود 5 طبيب يستخدمونه",
  "statusCode": 400
}
```

#### 5. استعادة تخصص محذوف
```http
POST /api/specializations/:id/restore
Authorization: Bearer <admin_token>
```

#### 6. التحقق من تخصص
```http
POST /api/specializations/:id/verify
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "isVerified": true
}
```

#### 7. تحديث إحصائيات التخصص
```http
POST /api/specializations/:id/update-stats
Authorization: Bearer <admin_token>
```

**الاستخدام:** تحديث الإحصائيات يدوياً (تتم تلقائياً عادة)

---

## 📊 نماذج البيانات الجديدة {#data-models}

### نموذج التخصص (Specialization)

```typescript
interface Specialization {
  _id: string;
  name: string;                    // اسم التخصص
  code: string;                    // كود التخصص (INTERNAL, CARDIOLOGY, etc.)
  description: string;             // وصف مفصل
  commonConditions: string[];      // الأمراض الشائعة
  icon: string;                    // أيقونة emoji
  slug: string;                    // للـ SEO
  isActive: boolean;               // حالة التخصص
  isVerified: boolean;             // تم التحقق منه
  stats: {
    totalDoctors: number;          // إجمالي الأطباء
    activeDoctors: number;         // الأطباء النشطين
    totalAppointments: number;     // إجمالي المواعيد
    averageRating: number;         // متوسط التقييم
    totalReviews: number;          // إجمالي المراجعات
  };
  createdBy: string;               // ID المنشئ
  updatedBy?: string;              // ID المحدث
  isDeleted: boolean;              // حذف ناعم
  deletedAt?: Date;                // تاريخ الحذف
  deletedBy?: string;              // من حذفه
  createdAt: Date;
  updatedAt: Date;
}
```

### نموذج الطبيب المحدث

```typescript
interface Doctor {
  _id: string;
  name: string;
  slug: string;
  specialization: Specialization;  // Object بدلاً من string
  subSpecialization?: string;
  biography?: string;
  degrees: Degree[];
  consultationFee: number;
  followupFee: number;
  availability: Availability[];
  stats: DoctorStats;
  tags: string[];
  languages: string[];
  profilePicture?: {
    url: string;
    filename: string;
  };
  location: {
    address: {
      city: string;
      area?: string;
    };
  };
  isActive: boolean;
  isAcceptingPatients: boolean;
  isPhoneVisible: boolean;
  userId: {
    fullName: string;
    mobile: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### نماذج مساعدة

```typescript
interface DoctorStats {
  averageRating: number;
  totalReviews: number;
  totalAppointments: number;
  completedAppointments: number;
  canceledAppointments: number;
}

interface Availability {
  day: 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
  isAvailable: boolean;
  timeSlots: TimeSlot[];
}

interface TimeSlot {
  startTime: string; // "09:00"
  endTime: string;   // "12:00"
}

interface Degree {
  degree: string;
  institution: string;
  year: number;
  country: string;
}
```

---

## 💻 أمثلة كود شاملة {#code-examples}

### 1. صفحة التخصصات الرئيسية

```javascript
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const SpecializationsPage = () => {
  const [specializations, setSpecializations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // جلب التخصصات
  useEffect(() => {
    const fetchSpecializations = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/specializations/active');
        setSpecializations(response.data.data);
      } catch (err) {
        setError('حدث خطأ في جلب التخصصات');
        console.error('Error fetching specializations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSpecializations();
  }, []);

  // البحث في التخصصات
  const handleSearch = async (term) => {
    if (!term.trim()) {
      // إعادة جلب جميع التخصصات
      const response = await axios.get('/api/specializations/active');
      setSpecializations(response.data.data);
      return;
    }

    try {
      const response = await axios.get(`/api/specializations/search?q=${term}`);
      setSpecializations(response.data.data);
    } catch (err) {
      console.error('Error searching specializations:', err);
    }
  };

  // معالجة تغيير البحث
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // البحث مع تأخير لتحسين الأداء
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      handleSearch(value);
    }, 500);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>جاري تحميل التخصصات...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button onClick={() => window.location.reload()}>
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div className="specializations-page">
      <div className="page-header">
        <h1>التخصصات الطبية</h1>
        <p>اختر التخصص المناسب لحالتك الصحية</p>
      </div>

      {/* شريط البحث */}
      <div className="search-section">
        <div className="search-input-container">
          <input
            type="text"
            placeholder="ابحث عن تخصص..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
          <div className="search-icon">🔍</div>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="quick-stats">
        <div className="stat-card">
          <span className="stat-number">{specializations.length}</span>
          <span className="stat-label">تخصص متاح</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">
            {specializations.reduce((sum, spec) => sum + spec.stats.totalDoctors, 0)}
          </span>
          <span className="stat-label">طبيب</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">
            {(specializations.reduce((sum, spec) => sum + spec.stats.averageRating, 0) / specializations.length).toFixed(1)}
          </span>
          <span className="stat-label">متوسط التقييم</span>
        </div>
      </div>

      {/* قائمة التخصصات */}
      <div className="specializations-grid">
        {specializations.length === 0 ? (
          <div className="no-results">
            <p>لا توجد تخصصات تطابق بحثك</p>
          </div>
        ) : (
          specializations.map(specialization => (
            <SpecializationCard 
              key={specialization._id} 
              specialization={specialization} 
            />
          ))
        )}
      </div>
    </div>
  );
};

// مكون كارت التخصص
const SpecializationCard = ({ specialization }) => {
  return (
    <Link 
      to={`/specializations/${specialization._id}`}
      className="specialization-card"
    >
      <div className="card-header">
        <span className="specialization-icon">{specialization.icon}</span>
        <h3 className="specialization-name">{specialization.name}</h3>
        <span className="specialization-code">{specialization.code}</span>
      </div>

      <div className="card-body">
        <p className="specialization-description">
          {specialization.description}
        </p>

        <div className="common-conditions">
          <h4>الأمراض الشائعة:</h4>
          <div className="conditions-list">
            {specialization.commonConditions.slice(0, 3).map((condition, index) => (
              <span key={index} className="condition-tag">
                {condition}
              </span>
            ))}
            {specialization.commonConditions.length > 3 && (
              <span className="more-conditions">
                +{specialization.commonConditions.length - 3} أخرى
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="card-footer">
        <div className="stats-row">
          <div className="stat">
            <span className="stat-icon">👨‍⚕️</span>
            <span className="stat-text">{specialization.stats.totalDoctors} طبيب</span>
          </div>
          <div className="stat">
            <span className="stat-icon">⭐</span>
            <span className="stat-text">{specialization.stats.averageRating}</span>
          </div>
          <div className="stat">
            <span className="stat-icon">📅</span>
            <span className="stat-text">{specialization.stats.totalAppointments} موعد</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default SpecializationsPage;
```

### 2. صفحة التخصص المحدد

```javascript
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const SpecializationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [specialization, setSpecialization] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSpecializationData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/specializations/${id}`);
        setSpecialization(response.data.data.specialization);
        setDoctors(response.data.data.doctors.list);
      } catch (err) {
        if (err.response?.status === 404) {
          setError('التخصص غير موجود');
        } else {
          setError('حدث خطأ في جلب بيانات التخصص');
        }
        console.error('Error fetching specialization:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchSpecializationData();
    }
  }, [id]);

  if (loading) {
    return <div className="loading">جاري التحميل...</div>;
  }

  if (error) {
    return (
      <div className="error-page">
        <h2>خطأ</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/specializations')}>
          العودة للتخصصات
        </button>
      </div>
    );
  }

  if (!specialization) {
    return <div>التخصص غير موجود</div>;
  }

  return (
    <div className="specialization-detail-page">
      {/* Header التخصص */}
      <div className="specialization-header">
        <div className="header-content">
          <div className="specialization-info">
            <span className="specialization-icon">{specialization.icon}</span>
            <div className="text-content">
              <h1 className="specialization-name">{specialization.name}</h1>
              <span className="specialization-code">{specialization.code}</span>
              <p className="specialization-description">
                {specialization.description}
              </p>
            </div>
          </div>

          {/* إحصائيات التخصص */}
          <div className="specialization-stats">
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-number">{specialization.stats.totalDoctors}</span>
                <span className="stat-label">طبيب متخصص</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{specialization.stats.activeDoctors}</span>
                <span className="stat-label">طبيب نشط</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{specialization.stats.averageRating}</span>
                <span className="stat-label">متوسط التقييم</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{specialization.stats.totalReviews}</span>
                <span className="stat-label">تقييم</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* الأمراض الشائعة */}
      <div className="common-conditions-section">
        <h2>الأمراض والحالات الشائعة</h2>
        <div className="conditions-grid">
          {specialization.commonConditions.map((condition, index) => (
            <div key={index} className="condition-card">
              <span className="condition-name">{condition}</span>
            </div>
          ))}
        </div>
      </div>

      {/* قائمة الأطباء */}
      <div className="doctors-section">
        <div className="section-header">
          <h2>الأطباء المتخصصون ({doctors.length})</h2>
          <button 
            className="view-all-btn"
            onClick={() => navigate(`/doctors?specialization=${specialization._id}`)}
          >
            عرض جميع الأطباء
          </button>
        </div>

        {doctors.length === 0 ? (
          <div className="no-doctors">
            <p>لا يوجد أطباء متاحون في هذا التخصص حالياً</p>
          </div>
        ) : (
          <div className="doctors-grid">
            {doctors.map(doctor => (
              <DoctorCard key={doctor._id} doctor={doctor} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SpecializationDetailPage;
```

### 3. مكون فلترة الأطباء

```javascript
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DoctorFilters = ({ onFiltersChange, initialFilters = {} }) => {
  const [specializations, setSpecializations] = useState([]);
  const [cities, setCities] = useState([]);
  const [filters, setFilters] = useState({
    specialization: '',
    city: '',
    minRating: '',
    maxPrice: '',
    sortBy: 'stats.averageRating',
    sortOrder: 'desc',
    ...initialFilters
  });

  // جلب التخصصات للفلتر
  useEffect(() => {
    const fetchSpecializations = async () => {
      try {
        const response = await axios.get('/api/specializations/active');
        setSpecializations(response.data.data);
      } catch (error) {
        console.error('Error fetching specializations:', error);
      }
    };

    fetchSpecializations();
  }, []);

  // جلب المدن (يمكن أن تكون من API منفصل)
  useEffect(() => {
    const fetchCities = async () => {
      try {
        // يمكن إضافة endpoint للمدن أو استخدام قائمة ثابتة
        const egyptianCities = [
          'القاهرة', 'الجيزة', 'الإسكندرية', 'الشرقية', 'المنوفية',
          'القليوبية', 'البحيرة', 'كفر الشيخ', 'الغربية', 'الدقهلية'
        ];
        setCities(egyptianCities);
      } catch (error) {
        console.error('Error fetching cities:', error);
      }
    };

    fetchCities();
  }, []);

  // تحديث الفلاتر
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  // إعادة تعيين الفلاتر
  const resetFilters = () => {
    const defaultFilters = {
      specialization: '',
      city: '',
      minRating: '',
      maxPrice: '',
      sortBy: 'stats.averageRating',
      sortOrder: 'desc'
    };
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  return (
    <div className="doctor-filters">
      <div className="filters-header">
        <h3>تصفية النتائج</h3>
        <button onClick={resetFilters} className="reset-btn">
          إعادة تعيين
        </button>
      </div>

      <div className="filters-grid">
        {/* فلتر التخصص */}
        <div className="filter-group">
          <label htmlFor="specialization">التخصص</label>
          <select
            id="specialization"
            value={filters.specialization}
            onChange={(e) => handleFilterChange('specialization', e.target.value)}
            className="filter-select"
          >
            <option value="">جميع التخصصات</option>
            {specializations.map(spec => (
              <option key={spec._id} value={spec._id}>
                {spec.icon} {spec.name}
              </option>
            ))}
          </select>
        </div>

        {/* فلتر المدينة */}
        <div className="filter-group">
          <label htmlFor="city">المدينة</label>
          <select
            id="city"
            value={filters.city}
            onChange={(e) => handleFilterChange('city', e.target.value)}
            className="filter-select"
          >
            <option value="">جميع المدن</option>
            {cities.map(city => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        {/* فلتر التقييم */}
        <div className="filter-group">
          <label htmlFor="minRating">أقل تقييم</label>
          <select
            id="minRating"
            value={filters.minRating}
            onChange={(e) => handleFilterChange('minRating', e.target.value)}
            className="filter-select"
          >
            <option value="">أي تقييم</option>
            <option value="4">4 نجوم فأكثر ⭐⭐⭐⭐</option>
            <option value="4.5">4.5 نجوم فأكثر ⭐⭐⭐⭐⭐</option>
          </select>
        </div>

        {/* فلتر السعر */}
        <div className="filter-group">
          <label htmlFor="maxPrice">أقصى سعر كشف</label>
          <select
            id="maxPrice"
            value={filters.maxPrice}
            onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
            className="filter-select"
          >
            <option value="">أي سعر</option>
            <option value="200">أقل من 200 جنيه</option>
            <option value="300">أقل من 300 جنيه</option>
            <option value="500">أقل من 500 جنيه</option>
            <option value="1000">أقل من 1000 جنيه</option>
          </select>
        </div>

        {/* ترتيب النتائج */}
        <div className="filter-group">
          <label htmlFor="sortBy">ترتيب حسب</label>
          <select
            id="sortBy"
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              handleFilterChange('sortBy', sortBy);
              handleFilterChange('sortOrder', sortOrder);
            }}
            className="filter-select"
          >
            <option value="stats.averageRating-desc">الأعلى تقييماً</option>
            <option value="consultationFee-asc">الأقل سعراً</option>
            <option value="consultationFee-desc">الأعلى سعراً</option>
            <option value="createdAt-desc">الأحدث إضافة</option>
            <option value="stats.totalReviews-desc">الأكثر تقييماً</option>
          </select>
        </div>
      </div>

      {/* عرض الفلاتر النشطة */}
      <div className="active-filters">
        {Object.entries(filters).map(([key, value]) => {
          if (!value || key === 'sortBy' || key === 'sortOrder') return null;
          
          let displayValue = value;
          if (key === 'specialization') {
            const spec = specializations.find(s => s._id === value);
            displayValue = spec ? `${spec.icon} ${spec.name}` : value;
          }

          return (
            <span key={key} className="active-filter">
              {displayValue}
              <button 
                onClick={() => handleFilterChange(key, '')}
                className="remove-filter"
              >
                ×
              </button>
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default DoctorFilters;
```

### 4. مكون كارت الطبيب المحدث

```javascript
import React from 'react';
import { Link } from 'react-router-dom';

const DoctorCard = ({ doctor }) => {
  // تنسيق الأسعار
  const formatPrice = (price) => {
    return new Intl.NumberFormat('ar-EG').format(price);
  };

  // تنسيق التقييم
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="star full">⭐</span>);
    }

    if (hasHalfStar) {
      stars.push(<span key="half" className="star half">⭐</span>);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="star empty">☆</span>);
    }

    return stars;
  };

  return (
    <div className="doctor-card">
      <Link to={`/doctors/${doctor._id}`} className="doctor-link">
        {/* صورة الطبيب */}
        <div className="doctor-image">
          {doctor.profilePicture?.url ? (
            <img 
              src={doctor.profilePicture.url} 
              alt={doctor.name}
              className="profile-picture"
            />
          ) : (
            <div className="default-avatar">
              👨‍⚕️
            </div>
          )}
        </div>

        {/* معلومات الطبيب */}
        <div className="doctor-info">
          <h3 className="doctor-name">{doctor.name}</h3>
          
          {/* معلومات التخصص */}
          <div className="specialization-info">
            <span className="specialization-icon">
              {doctor.specialization.icon}
            </span>
            <div className="specialization-text">
              <span className="specialization-name">
                {doctor.specialization.name}
              </span>
              {doctor.subSpecialization && (
                <span className="sub-specialization">
                  {doctor.subSpecialization}
                </span>
              )}
            </div>
          </div>

          {/* الموقع */}
          {doctor.location?.address?.city && (
            <div className="location">
              <span className="location-icon">📍</span>
              <span className="location-text">
                {doctor.location.address.city}
                {doctor.location.address.area && `, ${doctor.location.address.area}`}
              </span>
            </div>
          )}

          {/* التقييم والمراجعات */}
          <div className="rating-section">
            <div className="stars">
              {renderStars(doctor.stats.averageRating)}
            </div>
            <span className="rating-text">
              {doctor.stats.averageRating.toFixed(1)}
            </span>
            <span className="reviews-count">
              ({doctor.stats.totalReviews} تقييم)
            </span>
          </div>

          {/* الأسعار */}
          <div className="pricing">
            <div className="price-item">
              <span className="price-label">سعر الكشف:</span>
              <span className="price-value">
                {formatPrice(doctor.consultationFee)} جنيه
              </span>
            </div>
            {doctor.followupFee && (
              <div className="price-item">
                <span className="price-label">سعر المتابعة:</span>
                <span className="price-value">
                  {formatPrice(doctor.followupFee)} جنيه
                </span>
              </div>
            )}
          </div>

          {/* معلومات إضافية */}
          <div className="additional-info">
            {/* حالة قبول المرضى */}
            <div className={`availability-status ${doctor.isAcceptingPatients ? 'accepting' : 'not-accepting'}`}>
              <span className="status-icon">
                {doctor.isAcceptingPatients ? '✅' : '❌'}
              </span>
              <span className="status-text">
                {doctor.isAcceptingPatients ? 'يقبل مرضى جدد' : 'لا يقبل مرضى جدد'}
              </span>
            </div>

            {/* عرض رقم الهاتف */}
            {doctor.isPhoneVisible && doctor.userId?.mobile && (
              <div className="phone-info">
                <span className="phone-icon">📞</span>
                <span className="phone-number">{doctor.userId.mobile}</span>
              </div>
            )}

            {/* اللغات */}
            {doctor.languages && doctor.languages.length > 0 && (
              <div className="languages">
                <span className="languages-label">اللغات:</span>
                <span className="languages-list">
                  {doctor.languages.join(', ')}
                </span>
              </div>
            )}
          </div>

          {/* التاجز */}
          {doctor.tags && doctor.tags.length > 0 && (
            <div className="tags">
              {doctor.tags.slice(0, 3).map((tag, index) => (
                <span key={index} className="tag">
                  {tag}
                </span>
              ))}
              {doctor.tags.length > 3 && (
                <span className="more-tags">
                  +{doctor.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* أزرار العمل */}
        <div className="card-actions">
          <button className="primary-btn">
            عرض الملف الشخصي
          </button>
          {doctor.isAcceptingPatients && (
            <button className="secondary-btn">
              حجز موعد
            </button>
          )}
        </div>
      </Link>
    </div>
  );
};

export default DoctorCard;
```

### 5. صفحة الأطباء مع الفلترة

```javascript
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import DoctorCard from './DoctorCard';
import DoctorFilters from './DoctorFilters';
import Pagination from './Pagination';

const DoctorsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    totalItems: 0,
    totalPages: 0
  });

  // استخراج الفلاتر من URL
  const getFiltersFromURL = () => {
    return {
      specialization: searchParams.get('specialization') || '',
      city: searchParams.get('city') || '',
      minRating: searchParams.get('minRating') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      search: searchParams.get('search') || '',
      sortBy: searchParams.get('sortBy') || 'stats.averageRating',
      sortOrder: searchParams.get('sortOrder') || 'desc',
      page: parseInt(searchParams.get('page')) || 1
    };
  };

  const [filters, setFilters] = useState(getFiltersFromURL());

  // جلب الأطباء
  const fetchDoctors = async (currentFilters) => {
    try {
      setLoading(true);
      
      // بناء query parameters
      const params = new URLSearchParams();
      
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value);
        }
      });

      params.append('limit', pagination.limit.toString());

      const response = await axios.get(`/api/doctors?${params.toString()}`);
      
      setDoctors(response.data.data);
      setPagination({
        ...pagination,
        page: response.data.pagination.page,
        totalItems: response.data.pagination.totalItems,
        totalPages: response.data.pagination.totalPages
      });

    } catch (err) {
      setError('حدث خطأ في جلب الأطباء');
      console.error('Error fetching doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  // تحديث URL عند تغيير الفلاتر
  const updateURL = (newFilters) => {
    const params = new URLSearchParams();
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    setSearchParams(params);
  };

  // معالجة تغيير الفلاتر
  const handleFiltersChange = (newFilters) => {
    const updatedFilters = { ...newFilters, page: 1 }; // إعادة تعيين الصفحة
    setFilters(updatedFilters);
    updateURL(updatedFilters);
  };

  // معالجة تغيير الصفحة
  const handlePageChange = (newPage) => {
    const updatedFilters = { ...filters, page: newPage };
    setFilters(updatedFilters);
    updateURL(updatedFilters);
  };

  // جلب البيانات عند تغيير الفلاتر
  useEffect(() => {
    fetchDoctors(filters);
  }, [filters]);

  // تحديث الفلاتر عند تغيير URL
  useEffect(() => {
    const urlFilters = getFiltersFromURL();
    setFilters(urlFilters);
  }, [searchParams]);

  return (
    <div className="doctors-page">
      <div className="page-header">
        <h1>الأطباء</h1>
        <p>ابحث عن أفضل الأطباء في تخصصك</p>
      </div>

      <div className="page-content">
        {/* الفلاتر */}
        <aside className="filters-sidebar">
          <DoctorFilters 
            onFiltersChange={handleFiltersChange}
            initialFilters={filters}
          />
        </aside>

        {/* النتائج */}
        <main className="results-section">
          {/* معلومات النتائج */}
          <div className="results-header">
            <div className="results-info">
              {loading ? (
                <span>جاري البحث...</span>
              ) : (
                <span>
                  تم العثور على {pagination.totalItems} طبيب
                  {filters.specialization && ' في التخصص المحدد'}
                </span>
              )}
            </div>
          </div>

          {/* حالة التحميل */}
          {loading && (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>جاري تحميل الأطباء...</p>
            </div>
          )}

          {/* حالة الخطأ */}
          {error && (
            <div className="error-container">
              <p className="error-message">{error}</p>
              <button onClick={() => fetchDoctors(filters)}>
                إعادة المحاولة
              </button>
            </div>
          )}

          {/* النتائج */}
          {!loading && !error && (
            <>
              {doctors.length === 0 ? (
                <div className="no-results">
                  <div className="no-results-icon">🔍</div>
                  <h3>لا توجد نتائج</h3>
                  <p>لم نجد أطباء يطابقون معايير البحث الخاصة بك</p>
                  <button onClick={() => handleFiltersChange({})}>
                    إعادة تعيين الفلاتر
                  </button>
                </div>
              ) : (
                <>
                  <div className="doctors-grid">
                    {doctors.map(doctor => (
                      <DoctorCard key={doctor._id} doctor={doctor} />
                    ))}
                  </div>

                  {/* الصفحات */}
                  {pagination.totalPages > 1 && (
                    <Pagination
                      currentPage={pagination.page}
                      totalPages={pagination.totalPages}
                      onPageChange={handlePageChange}
                    />
                  )}
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default DoctorsPage;
```

يتبع في التعليق التالي... 