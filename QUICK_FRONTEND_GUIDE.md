# دليل سريع للفرونت إند - التخصصات الديناميكية

## 🚨 التغييرات الهامة

### 1. **التخصصات أصبحت ديناميكية**
```javascript
// ❌ القديم - قائمة ثابتة
const specializations = ['باطنة', 'أطفال', 'قلب'];

// ✅ الجديد - جلب من API
const [specializations, setSpecializations] = useState([]);
useEffect(() => {
  axios.get('/api/specializations/active')
    .then(res => setSpecializations(res.data.data));
}, []);
```

### 2. **الطبيب مع معلومات التخصص**
```javascript
// ✅ الجديد - الطبيب يحتوي على object التخصص
{
  "_id": "doctorId",
  "name": "د. أحمد محمد",
  "specialization": {
    "_id": "specializationId",
    "name": "قلب",
    "code": "CARDIOLOGY",
    "icon": "❤️",
    "description": "أمراض القلب والأوعية الدموية"
  },
  "consultationFee": 300
}
```

### 3. **البحث حسب التخصص**
```javascript
// ❌ القديم
GET /api/doctors/specialization/قلب

// ✅ الجديد
GET /api/doctors/specialization/64f5a1b2c8d9e1f2a3b4c5d6
```

---

## 🔥 API Endpoints الأساسية

### التخصصات
```http
GET /api/specializations/active          # جلب التخصصات النشطة
GET /api/specializations/popular         # التخصصات الشائعة
GET /api/specializations/search?q=قلب    # البحث في التخصصات
GET /api/specializations/:id             # تخصص محدد مع الأطباء
```

### الأطباء (محدث)
```http
GET /api/doctors?specialization=:id      # الأطباء مع فلتر التخصص
GET /api/doctors/specialization/:id      # الأطباء حسب التخصص
GET /api/doctors/:id                     # طبيب محدد مع التخصص
```

### للأدمن فقط
```http
GET /api/specializations                 # جميع التخصصات (Admin)
POST /api/specializations                # إنشاء تخصص جديد
PUT /api/specializations/:id             # تحديث تخصص
DELETE /api/specializations/:id          # حذف تخصص
```

---

## 💻 أمثلة كود سريعة

### جلب وعرض التخصصات
```javascript
const SpecializationsList = () => {
  const [specializations, setSpecializations] = useState([]);

  useEffect(() => {
    axios.get('/api/specializations/active')
      .then(res => setSpecializations(res.data.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="specializations-grid">
      {specializations.map(spec => (
        <div key={spec._id} className="spec-card">
          <span className="icon">{spec.icon}</span>
          <h3>{spec.name}</h3>
          <p>{spec.description}</p>
          <small>{spec.stats.totalDoctors} طبيب</small>
        </div>
      ))}
    </div>
  );
};
```

### عرض الطبيب مع التخصص
```javascript
const DoctorCard = ({ doctor }) => (
  <div className="doctor-card">
    <h3>{doctor.name}</h3>
    <div className="specialization">
      {doctor.specialization.icon} {doctor.specialization.name}
    </div>
    <p>{doctor.specialization.description}</p>
    <div className="fee">{doctor.consultationFee} جنيه</div>
  </div>
);
```

### فلتر الأطباء حسب التخصص
```javascript
const DoctorFilter = ({ onFilterChange }) => {
  const [specializations, setSpecializations] = useState([]);

  useEffect(() => {
    axios.get('/api/specializations/active')
      .then(res => setSpecializations(res.data.data));
  }, []);

  return (
    <select onChange={(e) => onFilterChange(e.target.value)}>
      <option value="">جميع التخصصات</option>
      {specializations.map(spec => (
        <option key={spec._id} value={spec._id}>
          {spec.icon} {spec.name}
        </option>
      ))}
    </select>
  );
};
```

### البحث عن أطباء
```javascript
const searchDoctors = async (specializationId, page = 1) => {
  try {
    const response = await axios.get(
      `/api/doctors/specialization/${specializationId}?page=${page}&limit=10`
    );
    return response.data;
  } catch (error) {
    console.error('Error searching doctors:', error);
  }
};
```

---

## 📱 التحقق من أرقام الهواتف المصرية

```javascript
const validateEgyptianPhone = (phone) => {
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  const mobilePattern = /^(\+2|002|2)?01[0125]\d{8}$/;
  const landlinePattern = /^(\+2|002|2)?0[23]\d{7,8}$/;
  
  return mobilePattern.test(cleanPhone) || landlinePattern.test(cleanPhone);
};

// استخدام في النموذج
const PhoneInput = ({ value, onChange }) => {
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const phone = e.target.value;
    onChange(phone);
    
    if (phone && !validateEgyptianPhone(phone)) {
      setError('رقم الهاتف غير صحيح - يجب أن يكون رقم مصري صالح');
    } else {
      setError('');
    }
  };

  return (
    <div>
      <input
        type="tel"
        value={value}
        onChange={handleChange}
        placeholder="01xxxxxxxxx"
      />
      {error && <span className="error">{error}</span>}
    </div>
  );
};
```

---

## 🛡️ إدارة التخصصات (Admin Panel)

```javascript
const AdminSpecializations = () => {
  const [specializations, setSpecializations] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const fetchSpecializations = async () => {
    const response = await axios.get('/api/specializations', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    setSpecializations(response.data.data.specializations);
  };

  const createSpecialization = async (data) => {
    await axios.post('/api/specializations', data, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    fetchSpecializations();
    setShowForm(false);
  };

  const deleteSpecialization = async (id) => {
    if (confirm('هل أنت متأكد؟')) {
      try {
        await axios.delete(`/api/specializations/${id}`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        fetchSpecializations();
      } catch (error) {
        alert('لا يمكن حذف التخصص لوجود أطباء مرتبطين به');
      }
    }
  };

  return (
    <div>
      <button onClick={() => setShowForm(true)}>
        إضافة تخصص جديد
      </button>
      
      <table>
        <thead>
          <tr>
            <th>الأيقونة</th>
            <th>الاسم</th>
            <th>عدد الأطباء</th>
            <th>الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {specializations.map(spec => (
            <tr key={spec._id}>
              <td>{spec.icon}</td>
              <td>{spec.name}</td>
              <td>{spec.stats.totalDoctors}</td>
              <td>
                <button onClick={() => deleteSpecialization(spec._id)}>
                  حذف
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

---

## ⚠️ ملاحظات مهمة

1. **Breaking Changes**: تغيير في structure الـ responses
2. **Authentication**: endpoints الأدمن تحتاج token
3. **Validation**: أرقام الهواتف يجب أن تكون مصرية
4. **Performance**: استخدم pagination وcaching
5. **Error Handling**: تعامل مع الأخطاء بشكل صحيح

---

## 🚀 خطوات التطبيق

1. ✅ **تحديث جلب التخصصات** من API
2. ✅ **تحديث عرض الأطباء** مع معلومات التخصص
3. ✅ **تحديث البحث والفلترة** لاستخدام IDs
4. ✅ **إضافة لوحة إدارة التخصصات** للأدمن
5. ✅ **تطبيق التحقق من الهواتف** المصرية

---

**الحالة:** جاهز للتطبيق ✅  
**الأولوية:** عالية 🔥  
**المدة المتوقعة:** 2-3 أيام عمل 