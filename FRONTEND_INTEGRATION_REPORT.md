# تقرير التكامل مع الفرونت إند - نظام التخصصات الديناميكية

## 📋 نظرة عامة

تم تطوير نظام التخصصات الطبية الديناميكية مع علاقة قوية بين الأطباء والتخصصات. هذا التقرير يوضح جميع الـ API endpoints والتغييرات المطلوبة في الفرونت إند.

---

## 🔄 التغييرات الأساسية

### 1. **التخصصات أصبحت ديناميكية**
- لا يوجد قائمة ثابتة للتخصصات
- يجب جلب التخصصات من API
- كل تخصص له ID فريد

### 2. **علاقة الطبيب بالتخصص**
- الطبيب مرتبط بـ ID التخصص وليس النص
- معلومات التخصص تأتي مع بيانات الطبيب

### 3. **أرقام الهواتف المصرية**
- تم تطبيق التحقق من أرقام الهواتف المصرية
- جميع الأرقام يجب أن تكون مصرية صالحة

---

## 🚀 API Endpoints الجديدة

### التخصصات (Specializations)

#### 1. جلب التخصصات النشطة (للجمهور)
```http
GET /api/specializations/active
```

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
      "commonConditions": ["ضغط الدم", "السكري", "الكوليسترول"],
      "icon": "🏥",
      "stats": {
        "totalDoctors": 15,
        "activeDoctors": 12,
        "averageRating": 4.5
      },
      "slug": "باطنة"
    }
  ]
}
```

#### 2. جلب التخصصات الشائعة
```http
GET /api/specializations/popular?limit=10
```

#### 3. البحث في التخصصات
```http
GET /api/specializations/search?q=قلب
```

#### 4. جلب تخصص محدد
```http
GET /api/specializations/:id
```

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

### الأطباء (Doctors) - المحدث

#### 1. جلب جميع الأطباء
```http
GET /api/doctors?page=1&limit=10&specialization=64f5a1b2c8d9e1f2a3b4c5d6
```

**Response المحدث:**
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
      "consultationFee": 300,
      "stats": {
        "averageRating": 4.8,
        "totalReviews": 120
      },
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
    "specialization": {
      "_id": "64f5a1b2c8d9e1f2a3b4c5d6",
      "name": "قلب",
      "code": "CARDIOLOGY",
      "description": "أمراض القلب والأوعية الدموية",
      "icon": "❤️"
    },
    "subSpecialization": "قسطرة القلب",
    "biography": "استشاري أمراض القلب...",
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
          }
        ]
      }
    ],
    "stats": {
      "averageRating": 4.8,
      "totalReviews": 120,
      "totalAppointments": 450
    }
  }
}
```

### Public Routes (محدث)

#### 1. الأطباء العامة
```http
GET /api/public/doctors?page=1&limit=12&specialization=64f5a1b2c8d9e1f2a3b4c5d6
```

#### 2. ملف الطبيب العام
```http
GET /api/public/doctor/:slug
```

---

## 📱 التحديثات المطلوبة في الفرونت إند

### 1. **صفحة التخصصات**

#### قبل التحديث:
```javascript
// قائمة ثابتة
const specializations = [
  { name: 'باطنة', value: 'internal' },
  { name: 'أطفال', value: 'pediatrics' }
];
```

#### بعد التحديث:
```javascript
// جلب ديناميكي
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

// عرض التخصصات
{specializations.map(spec => (
  <div key={spec._id} className="specialization-card">
    <span className="icon">{spec.icon}</span>
    <h3>{spec.name}</h3>
    <p>{spec.description}</p>
    <div className="stats">
      <span>{spec.stats.totalDoctors} طبيب</span>
      <span>⭐ {spec.stats.averageRating}</span>
    </div>
  </div>
))}
```

### 2. **صفحة الأطباء**

#### تحديث البحث حسب التخصص:
```javascript
// قبل التحديث
const searchDoctors = (specialization) => {
  return axios.get(`/api/doctors?specialization=${specialization}`);
};

// بعد التحديث
const searchDoctors = (specializationId) => {
  return axios.get(`/api/doctors?specialization=${specializationId}`);
};

// أو استخدام endpoint المخصص
const getDoctorsBySpecialization = (specializationId, page = 1) => {
  return axios.get(`/api/doctors/specialization/${specializationId}?page=${page}&limit=10`);
};
```

#### عرض معلومات التخصص:
```javascript
// عرض الطبيب مع معلومات التخصص
const DoctorCard = ({ doctor }) => (
  <div className="doctor-card">
    <img src={doctor.profilePicture?.url} alt={doctor.name} />
    <h3>{doctor.name}</h3>
    
    {/* معلومات التخصص */}
    <div className="specialization">
      <span className="icon">{doctor.specialization.icon}</span>
      <span className="name">{doctor.specialization.name}</span>
    </div>
    
    <p className="description">{doctor.specialization.description}</p>
    <div className="fee">سعر الكشف: {doctor.consultationFee} جنيه</div>
    <div className="rating">
      ⭐ {doctor.stats.averageRating} ({doctor.stats.totalReviews} تقييم)
    </div>
  </div>
);
```

### 3. **فلترة الأطباء**

```javascript
const DoctorFilter = () => {
  const [specializations, setSpecializations] = useState([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState('');

  useEffect(() => {
    // جلب التخصصات للفلتر
    axios.get('/api/specializations/active')
      .then(res => setSpecializations(res.data.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="filter-section">
      <select 
        value={selectedSpecialization} 
        onChange={(e) => setSelectedSpecialization(e.target.value)}
      >
        <option value="">جميع التخصصات</option>
        {specializations.map(spec => (
          <option key={spec._id} value={spec._id}>
            {spec.icon} {spec.name}
          </option>
        ))}
      </select>
    </div>
  );
};
```

### 4. **صفحة التخصص المحدد**

```javascript
const SpecializationPage = ({ specializationId }) => {
  const [specialization, setSpecialization] = useState(null);
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    const fetchSpecializationData = async () => {
      try {
        const response = await axios.get(`/api/specializations/${specializationId}`);
        setSpecialization(response.data.data.specialization);
        setDoctors(response.data.data.doctors.list);
      } catch (error) {
        console.error('Error fetching specialization:', error);
      }
    };

    fetchSpecializationData();
  }, [specializationId]);

  return (
    <div className="specialization-page">
      {specialization && (
        <>
          <div className="specialization-header">
            <span className="icon">{specialization.icon}</span>
            <h1>{specialization.name}</h1>
            <p>{specialization.description}</p>
          </div>

          <div className="specialization-stats">
            <div className="stat">
              <span className="number">{specialization.stats.totalDoctors}</span>
              <span className="label">طبيب</span>
            </div>
            <div className="stat">
              <span className="number">{specialization.stats.averageRating}</span>
              <span className="label">تقييم</span>
            </div>
          </div>

          <div className="common-conditions">
            <h3>الأمراض الشائعة:</h3>
            <div className="conditions-list">
              {specialization.commonConditions.map((condition, index) => (
                <span key={index} className="condition-tag">{condition}</span>
              ))}
            </div>
          </div>

          <div className="doctors-list">
            <h3>الأطباء المتخصصون:</h3>
            {doctors.map(doctor => (
              <DoctorCard key={doctor._id} doctor={doctor} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
```

---

## 🔧 إدارة التخصصات (للأدمن فقط)

### Admin API Endpoints

#### 1. جلب جميع التخصصات (Admin)
```http
GET /api/specializations?page=1&limit=10&search=قلب&isActive=true
Authorization: Bearer <admin_token>
```

#### 2. إنشاء تخصص جديد
```http
POST /api/specializations
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "جراحة تجميلية",
  "code": "PLASTIC_SURGERY",
  "description": "جراحة تجميلية وإعادة بناء",
  "commonConditions": ["حروق", "ندوب", "تشوهات خلقية"],
  "icon": "🎭"
}
```

#### 3. تحديث تخصص
```http
PUT /api/specializations/:id
Authorization: Bearer <admin_token>
```

#### 4. حذف تخصص
```http
DELETE /api/specializations/:id
Authorization: Bearer <admin_token>
```

#### 5. استعادة تخصص محذوف
```http
POST /api/specializations/:id/restore
Authorization: Bearer <admin_token>
```

#### 6. تحديث إحصائيات التخصص
```http
POST /api/specializations/:id/update-stats
Authorization: Bearer <admin_token>
```

### Admin Panel Component

```javascript
const SpecializationManagement = () => {
  const [specializations, setSpecializations] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // جلب التخصصات
  const fetchSpecializations = async () => {
    try {
      const response = await axios.get('/api/specializations', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setSpecializations(response.data.data.specializations);
    } catch (error) {
      console.error('Error fetching specializations:', error);
    }
  };

  // إنشاء تخصص جديد
  const createSpecialization = async (data) => {
    try {
      await axios.post('/api/specializations', data, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      fetchSpecializations(); // إعادة تحميل القائمة
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating specialization:', error);
    }
  };

  // حذف تخصص
  const deleteSpecialization = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا التخصص؟')) {
      try {
        await axios.delete(`/api/specializations/${id}`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        fetchSpecializations();
      } catch (error) {
        console.error('Error deleting specialization:', error);
        alert('لا يمكن حذف التخصص لوجود أطباء مرتبطين به');
      }
    }
  };

  return (
    <div className="specialization-management">
      <div className="header">
        <h2>إدارة التخصصات</h2>
        <button onClick={() => setShowCreateForm(true)}>
          إضافة تخصص جديد
        </button>
      </div>

      {showCreateForm && (
        <SpecializationForm 
          onSubmit={createSpecialization}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      <div className="specializations-table">
        <table>
          <thead>
            <tr>
              <th>الأيقونة</th>
              <th>الاسم</th>
              <th>الكود</th>
              <th>عدد الأطباء</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {specializations.map(spec => (
              <tr key={spec._id}>
                <td>{spec.icon}</td>
                <td>{spec.name}</td>
                <td>{spec.code}</td>
                <td>{spec.stats.totalDoctors}</td>
                <td>
                  <span className={`status ${spec.isActive ? 'active' : 'inactive'}`}>
                    {spec.isActive ? 'نشط' : 'غير نشط'}
                  </span>
                </td>
                <td>
                  <button onClick={() => editSpecialization(spec._id)}>
                    تعديل
                  </button>
                  <button onClick={() => deleteSpecialization(spec._id)}>
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
```

---

## 📞 التحقق من أرقام الهواتف المصرية

### قواعد الأرقام المصرية:

#### أرقام الموبايل:
- **فودافون**: 010, 011, 012, 015
- **اتصالات**: 010, 011, 012, 015  
- **أورانج**: 010, 011, 012, 015
- **وي**: 015

#### أرقام الأرضي:
- **القاهرة**: 02
- **الإسكندرية**: 03
- **باقي المحافظات**: 040-069, 082, 084, 086, 088, 092, 093, 095, 096, 097

### Frontend Validation:

```javascript
// دالة التحقق من الرقم المصري
const validateEgyptianPhone = (phone) => {
  // إزالة المسافات والرموز
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // أنماط الأرقام المصرية
  const mobilePatterns = [
    /^(\+2|002|2)?01[0125]\d{8}$/, // موبايل
  ];
  
  const landlinePatterns = [
    /^(\+2|002|2)?0[23]\d{7,8}$/, // القاهرة والإسكندرية
    /^(\+2|002|2)?0(4[0-9]|5[0-9]|6[0-9]|82|84|86|88|92|93|95|96|97)\d{6,7}$/ // باقي المحافظات
  ];
  
  const isMobile = mobilePatterns.some(pattern => pattern.test(cleanPhone));
  const isLandline = landlinePatterns.some(pattern => pattern.test(cleanPhone));
  
  return {
    isValid: isMobile || isLandline,
    type: isMobile ? 'mobile' : isLandline ? 'landline' : 'invalid',
    cleanNumber: cleanPhone
  };
};

// استخدام في النموذج
const PhoneInput = ({ value, onChange, error }) => {
  const [phoneError, setPhoneError] = useState('');
  
  const handlePhoneChange = (e) => {
    const phone = e.target.value;
    onChange(phone);
    
    if (phone) {
      const validation = validateEgyptianPhone(phone);
      if (!validation.isValid) {
        setPhoneError('رقم الهاتف غير صحيح - يجب أن يكون رقم مصري صالح');
      } else {
        setPhoneError('');
      }
    }
  };
  
  return (
    <div className="phone-input">
      <input
        type="tel"
        value={value}
        onChange={handlePhoneChange}
        placeholder="01xxxxxxxxx"
        className={phoneError ? 'error' : ''}
      />
      {phoneError && <span className="error-message">{phoneError}</span>}
    </div>
  );
};
```

---

## 🔄 Migration للبيانات الموجودة

إذا كان لديك بيانات موجودة، ستحتاج لتشغيل migration:

```javascript
// migration script
const migrateSpecializations = async () => {
  try {
    // 1. إنشاء التخصصات الجديدة
    await axios.post('/api/specializations/seed');
    
    // 2. جلب التخصصات الجديدة
    const specializations = await axios.get('/api/specializations/active');
    const specializationMap = {};
    
    specializations.data.data.forEach(spec => {
      specializationMap[spec.name] = spec._id;
    });
    
    // 3. تحديث الأطباء الموجودين
    const doctors = await axios.get('/api/doctors');
    
    for (const doctor of doctors.data.data) {
      if (typeof doctor.specialization === 'string') {
        const specializationId = specializationMap[doctor.specialization];
        if (specializationId) {
          await axios.put(`/api/doctors/${doctor._id}`, {
            specialization: specializationId
          });
        }
      }
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  }
};
```

---

## 📊 الإحصائيات والتقارير

### جلب إحصائيات التخصصات:
```javascript
const getSpecializationStats = async () => {
  try {
    const response = await axios.get('/api/specializations/active');
    const specializations = response.data.data;
    
    const stats = {
      totalSpecializations: specializations.length,
      totalDoctors: specializations.reduce((sum, spec) => sum + spec.stats.totalDoctors, 0),
      averageRating: specializations.reduce((sum, spec) => sum + spec.stats.averageRating, 0) / specializations.length,
      mostPopular: specializations.sort((a, b) => b.stats.totalDoctors - a.stats.totalDoctors)[0]
    };
    
    return stats;
  } catch (error) {
    console.error('Error fetching stats:', error);
  }
};
```

---

## ⚠️ ملاحظات مهمة

### 1. **Breaking Changes:**
- تغيير في structure الـ API responses
- الطبيب الآن يحتوي على object التخصص بدلاً من string
- تغيير في endpoints الأطباء حسب التخصص

### 2. **Security:**
- endpoints إدارة التخصصات تتطلب admin token
- التحقق من أرقام الهواتف المصرية إجباري

### 3. **Performance:**
- استخدام pagination في جميع القوائم
- Cache التخصصات في الفرونت إند
- استخدام lazy loading للصور

### 4. **Error Handling:**
```javascript
// مثال على معالجة الأخطاء
const handleApiError = (error) => {
  if (error.response?.status === 404) {
    return 'البيانات غير موجودة';
  } else if (error.response?.status === 403) {
    return 'غير مخول للوصول';
  } else if (error.response?.status === 400) {
    return error.response.data.message || 'خطأ في البيانات';
  } else {
    return 'حدث خطأ غير متوقع';
  }
};
```

---

## 🎯 الخطوات التالية للفرونت إند

1. **تحديث جلب التخصصات** من API بدلاً من القائمة الثابتة
2. **تحديث عرض معلومات الطبيب** لإظهار معلومات التخصص
3. **تحديث البحث والفلترة** لاستخدام IDs بدلاً من النصوص
4. **إضافة صفحات إدارة التخصصات** للأدمن
5. **تطبيق التحقق من أرقام الهواتف** المصرية
6. **تحديث أي مكونات موجودة** تستخدم التخصصات

---

## 📞 الدعم

في حالة وجود أي استفسارات أو مشاكل في التكامل، يرجى التواصل مع فريق الباك إند.

**تاريخ التقرير:** `date`  
**الإصدار:** 1.0  
**الحالة:** جاهز للتكامل ✅ 