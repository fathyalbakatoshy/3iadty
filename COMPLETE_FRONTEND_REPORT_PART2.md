# تقرير شامل للفرونت إند - الجزء الثاني

## 🛡️ إدارة التخصصات للأدمن {#admin-management}

### 1. صفحة إدارة التخصصات

```javascript
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const AdminSpecializationsPage = () => {
  const { user, token } = useAuth();
  const [specializations, setSpecializations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSpecialization, setEditingSpecialization] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    isActive: '',
    sortBy: 'name',
    sortOrder: 'asc'
  });

  // التحقق من صلاحيات الأدمن
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      // إعادة توجيه أو عرض رسالة خطأ
      return;
    }
  }, [user]);

  // جلب التخصصات
  const fetchSpecializations = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...filters
      });

      const response = await axios.get(`/api/specializations?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSpecializations(response.data.data.specializations);
      setPagination(prev => ({
        ...prev,
        totalItems: response.data.pagination.totalItems,
        totalPages: response.data.pagination.totalPages
      }));

    } catch (error) {
      console.error('Error fetching specializations:', error);
      alert('حدث خطأ في جلب التخصصات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchSpecializations();
    }
  }, [user, token, pagination.page, filters]);

  // إنشاء تخصص جديد
  const handleCreateSpecialization = async (data) => {
    try {
      await axios.post('/api/specializations', data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('تم إنشاء التخصص بنجاح');
      setShowCreateForm(false);
      fetchSpecializations();
    } catch (error) {
      console.error('Error creating specialization:', error);
      alert(error.response?.data?.message || 'حدث خطأ في إنشاء التخصص');
    }
  };

  // تحديث تخصص
  const handleUpdateSpecialization = async (id, data) => {
    try {
      await axios.put(`/api/specializations/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('تم تحديث التخصص بنجاح');
      setEditingSpecialization(null);
      fetchSpecializations();
    } catch (error) {
      console.error('Error updating specialization:', error);
      alert(error.response?.data?.message || 'حدث خطأ في تحديث التخصص');
    }
  };

  // حذف تخصص
  const handleDeleteSpecialization = async (id, name) => {
    if (!window.confirm(`هل أنت متأكد من حذف تخصص "${name}"؟`)) {
      return;
    }

    try {
      await axios.delete(`/api/specializations/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('تم حذف التخصص بنجاح');
      fetchSpecializations();
    } catch (error) {
      console.error('Error deleting specialization:', error);
      
      if (error.response?.status === 400) {
        alert('لا يمكن حذف التخصص لوجود أطباء مرتبطين به');
      } else {
        alert('حدث خطأ في حذف التخصص');
      }
    }
  };

  // استعادة تخصص محذوف
  const handleRestoreSpecialization = async (id, name) => {
    if (!window.confirm(`هل تريد استعادة تخصص "${name}"؟`)) {
      return;
    }

    try {
      await axios.post(`/api/specializations/${id}/restore`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('تم استعادة التخصص بنجاح');
      fetchSpecializations();
    } catch (error) {
      console.error('Error restoring specialization:', error);
      alert('حدث خطأ في استعادة التخصص');
    }
  };

  // تحديث إحصائيات التخصص
  const handleUpdateStats = async (id, name) => {
    try {
      await axios.post(`/api/specializations/${id}/update-stats`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert(`تم تحديث إحصائيات تخصص "${name}" بنجاح`);
      fetchSpecializations();
    } catch (error) {
      console.error('Error updating stats:', error);
      alert('حدث خطأ في تحديث الإحصائيات');
    }
  };

  // التحقق من التخصص
  const handleVerifySpecialization = async (id, name, isVerified) => {
    try {
      await axios.post(`/api/specializations/${id}/verify`, 
        { isVerified: !isVerified }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert(`تم ${!isVerified ? 'التحقق من' : 'إلغاء التحقق من'} تخصص "${name}"`);
      fetchSpecializations();
    } catch (error) {
      console.error('Error verifying specialization:', error);
      alert('حدث خطأ في عملية التحقق');
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="access-denied">
        <h2>غير مخول</h2>
        <p>ليس لديك صلاحية للوصول لهذه الصفحة</p>
      </div>
    );
  }

  return (
    <div className="admin-specializations-page">
      <div className="page-header">
        <h1>إدارة التخصصات الطبية</h1>
        <button 
          className="create-btn"
          onClick={() => setShowCreateForm(true)}
        >
          + إضافة تخصص جديد
        </button>
      </div>

      {/* فلاتر البحث */}
      <div className="admin-filters">
        <div className="filters-row">
          <input
            type="text"
            placeholder="البحث في التخصصات..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="search-input"
          />
          
          <select
            value={filters.isActive}
            onChange={(e) => setFilters(prev => ({ ...prev, isActive: e.target.value }))}
            className="filter-select"
          >
            <option value="">جميع التخصصات</option>
            <option value="true">النشطة فقط</option>
            <option value="false">غير النشطة فقط</option>
          </select>

          <select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              setFilters(prev => ({ ...prev, sortBy, sortOrder }));
            }}
            className="filter-select"
          >
            <option value="name-asc">الاسم (أ-ي)</option>
            <option value="name-desc">الاسم (ي-أ)</option>
            <option value="stats.totalDoctors-desc">الأكثر أطباء</option>
            <option value="createdAt-desc">الأحدث</option>
          </select>
        </div>
      </div>

      {/* جدول التخصصات */}
      <div className="specializations-table-container">
        {loading ? (
          <div className="loading">جاري التحميل...</div>
        ) : (
          <table className="specializations-table">
            <thead>
              <tr>
                <th>الأيقونة</th>
                <th>الاسم</th>
                <th>الكود</th>
                <th>عدد الأطباء</th>
                <th>التقييم</th>
                <th>الحالة</th>
                <th>التحقق</th>
                <th>تاريخ الإنشاء</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {specializations.map(spec => (
                <tr key={spec._id} className={spec.isDeleted ? 'deleted-row' : ''}>
                  <td>
                    <span className="specialization-icon">{spec.icon}</span>
                  </td>
                  <td>
                    <div className="name-cell">
                      <strong>{spec.name}</strong>
                      {spec.isDeleted && (
                        <span className="deleted-badge">محذوف</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <code className="code-badge">{spec.code}</code>
                  </td>
                  <td>
                    <div className="doctors-stats">
                      <span className="total-doctors">{spec.stats.totalDoctors}</span>
                      <small>({spec.stats.activeDoctors} نشط)</small>
                    </div>
                  </td>
                  <td>
                    <div className="rating-cell">
                      <span>⭐ {spec.stats.averageRating.toFixed(1)}</span>
                      <small>({spec.stats.totalReviews})</small>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${spec.isActive ? 'active' : 'inactive'}`}>
                      {spec.isActive ? 'نشط' : 'غير نشط'}
                    </span>
                  </td>
                  <td>
                    <span className={`verification-badge ${spec.isVerified ? 'verified' : 'unverified'}`}>
                      {spec.isVerified ? '✅ محقق' : '❌ غير محقق'}
                    </span>
                  </td>
                  <td>
                    <small>{new Date(spec.createdAt).toLocaleDateString('ar-EG')}</small>
                  </td>
                  <td>
                    <div className="actions-cell">
                      {spec.isDeleted ? (
                        <button
                          onClick={() => handleRestoreSpecialization(spec._id, spec.name)}
                          className="restore-btn"
                          title="استعادة"
                        >
                          ↶
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingSpecialization(spec)}
                            className="edit-btn"
                            title="تعديل"
                          >
                            ✏️
                          </button>
                          
                          <button
                            onClick={() => handleVerifySpecialization(spec._id, spec.name, spec.isVerified)}
                            className={`verify-btn ${spec.isVerified ? 'verified' : 'unverified'}`}
                            title={spec.isVerified ? 'إلغاء التحقق' : 'تحقق'}
                          >
                            {spec.isVerified ? '❌' : '✅'}
                          </button>

                          <button
                            onClick={() => handleUpdateStats(spec._id, spec.name)}
                            className="stats-btn"
                            title="تحديث الإحصائيات"
                          >
                            📊
                          </button>

                          <button
                            onClick={() => handleDeleteSpecialization(spec._id, spec.name)}
                            className="delete-btn"
                            title="حذف"
                            disabled={spec.stats.totalDoctors > 0}
                          >
                            🗑️
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* الصفحات */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            disabled={pagination.page === 1}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
          >
            السابق
          </button>
          
          <span>
            صفحة {pagination.page} من {pagination.totalPages}
          </span>
          
          <button
            disabled={pagination.page === pagination.totalPages}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
          >
            التالي
          </button>
        </div>
      )}

      {/* نموذج إنشاء/تعديل التخصص */}
      {(showCreateForm || editingSpecialization) && (
        <SpecializationFormModal
          specialization={editingSpecialization}
          onSubmit={editingSpecialization ? 
            (data) => handleUpdateSpecialization(editingSpecialization._id, data) :
            handleCreateSpecialization
          }
          onClose={() => {
            setShowCreateForm(false);
            setEditingSpecialization(null);
          }}
        />
      )}
    </div>
  );
};

export default AdminSpecializationsPage;
```

### 2. نموذج إنشاء/تعديل التخصص

```javascript
import React, { useState, useEffect } from 'react';

const SpecializationFormModal = ({ specialization, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    commonConditions: [],
    icon: '🏥'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // تعبئة النموذج في حالة التعديل
  useEffect(() => {
    if (specialization) {
      setFormData({
        name: specialization.name || '',
        code: specialization.code || '',
        description: specialization.description || '',
        commonConditions: specialization.commonConditions || [],
        icon: specialization.icon || '🏥'
      });
    }
  }, [specialization]);

  // التحقق من صحة البيانات
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'اسم التخصص مطلوب';
    } else if (formData.name.length < 2 || formData.name.length > 100) {
      newErrors.name = 'اسم التخصص يجب أن يكون بين 2 و 100 حرف';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'كود التخصص مطلوب';
    } else if (!/^[A-Z0-9_]+$/.test(formData.code)) {
      newErrors.code = 'كود التخصص يجب أن يحتوي على أحرف كبيرة وأرقام وشرطة سفلية فقط';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'وصف التخصص مطلوب';
    } else if (formData.description.length < 10 || formData.description.length > 500) {
      newErrors.description = 'وصف التخصص يجب أن يكون بين 10 و 500 حرف';
    }

    if (formData.commonConditions.length === 0) {
      newErrors.commonConditions = 'يجب إضافة حالة واحدة على الأقل';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // إرسال النموذج
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  // إضافة حالة جديدة
  const addCondition = () => {
    setFormData(prev => ({
      ...prev,
      commonConditions: [...prev.commonConditions, '']
    }));
  };

  // تحديث حالة
  const updateCondition = (index, value) => {
    const newConditions = [...formData.commonConditions];
    newConditions[index] = value;
    setFormData(prev => ({
      ...prev,
      commonConditions: newConditions
    }));
  };

  // حذف حالة
  const removeCondition = (index) => {
    const newConditions = formData.commonConditions.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      commonConditions: newConditions
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>
            {specialization ? 'تعديل التخصص' : 'إضافة تخصص جديد'}
          </h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="specialization-form">
          {/* اسم التخصص */}
          <div className="form-group">
            <label htmlFor="name">اسم التخصص *</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={errors.name ? 'error' : ''}
              placeholder="مثال: طب القلب"
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          {/* كود التخصص */}
          <div className="form-group">
            <label htmlFor="code">كود التخصص *</label>
            <input
              type="text"
              id="code"
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
              className={errors.code ? 'error' : ''}
              placeholder="مثال: CARDIOLOGY"
            />
            {errors.code && <span className="error-message">{errors.code}</span>}
          </div>

          {/* الأيقونة */}
          <div className="form-group">
            <label htmlFor="icon">الأيقونة</label>
            <div className="icon-selector">
              <input
                type="text"
                id="icon"
                value={formData.icon}
                onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                className="icon-input"
                placeholder="🏥"
              />
              <div className="icon-preview">
                <span className="preview-icon">{formData.icon}</span>
              </div>
            </div>
            <small>يمكنك استخدام emoji أو نص</small>
          </div>

          {/* وصف التخصص */}
          <div className="form-group">
            <label htmlFor="description">وصف التخصص *</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className={errors.description ? 'error' : ''}
              placeholder="وصف مفصل عن التخصص وما يشمله..."
              rows="4"
            />
            {errors.description && <span className="error-message">{errors.description}</span>}
          </div>

          {/* الأمراض الشائعة */}
          <div className="form-group">
            <label>الأمراض والحالات الشائعة *</label>
            <div className="conditions-list">
              {formData.commonConditions.map((condition, index) => (
                <div key={index} className="condition-item">
                  <input
                    type="text"
                    value={condition}
                    onChange={(e) => updateCondition(index, e.target.value)}
                    placeholder="مثال: ضغط الدم"
                    className="condition-input"
                  />
                  <button
                    type="button"
                    onClick={() => removeCondition(index)}
                    className="remove-condition-btn"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addCondition}
                className="add-condition-btn"
              >
                + إضافة حالة
              </button>
            </div>
            {errors.commonConditions && (
              <span className="error-message">{errors.commonConditions}</span>
            )}
          </div>

          {/* أزرار الإجراءات */}
          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="cancel-btn"
              disabled={loading}
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? 'جاري الحفظ...' : (specialization ? 'تحديث' : 'إنشاء')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SpecializationFormModal;
```

## 📱 التحقق من أرقام الهواتف المصرية {#phone-validation}

### 1. دالة التحقق الشاملة

```javascript
// utils/phoneValidation.js

/**
 * التحقق من صحة أرقام الهواتف المصرية
 */
export const validateEgyptianPhone = (phone, type = 'any') => {
  if (!phone) {
    return {
      isValid: false,
      error: 'رقم الهاتف مطلوب',
      type: null,
      cleanNumber: null,
      formattedNumber: null
    };
  }

  // إزالة المسافات والرموز غير المرغوب فيها
  const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');

  // أنماط أرقام الموبايل المصرية
  const mobilePatterns = [
    /^(2)?01[0125]\d{8}$/, // بدون رمز الدولة أو مع 2
    /^(002)?01[0125]\d{8}$/, // مع 002
  ];

  // أنماط أرقام الأرضي المصرية
  const landlinePatterns = [
    /^(2)?0[23]\d{7,8}$/, // القاهرة والإسكندرية
    /^(002)?0[23]\d{7,8}$/, // مع 002
    /^(2)?0(4[0-9]|5[0-9]|6[0-9]|82|84|86|88|92|93|95|96|97)\d{6,7}$/, // باقي المحافظات
    /^(002)?0(4[0-9]|5[0-9]|6[0-9]|82|84|86|88|92|93|95|96|97)\d{6,7}$/ // مع 002
  ];

  // فحص نوع الرقم
  const isMobile = mobilePatterns.some(pattern => pattern.test(cleanPhone));
  const isLandline = landlinePatterns.some(pattern => pattern.test(cleanPhone));

  // تحديد النوع المطلوب
  let isValidType = false;
  let detectedType = null;

  if (isMobile) {
    detectedType = 'mobile';
    isValidType = type === 'any' || type === 'mobile';
  } else if (isLandline) {
    detectedType = 'landline';
    isValidType = type === 'any' || type === 'landline';
  }

  // تنسيق الرقم
  let formattedNumber = null;
  let cleanNumber = null;

  if (isMobile || isLandline) {
    // إزالة رمز الدولة للتخزين
    cleanNumber = cleanPhone.replace(/^(002|2)/, '');
    
    // تنسيق للعرض
    if (isMobile) {
      // تنسيق رقم الموبايل: 01X XXXX XXXX
      formattedNumber = cleanNumber.replace(/^(\d{3})(\d{4})(\d{4})$/, '$1 $2 $3');
    } else {
      // تنسيق رقم الأرضي حسب المدينة
      if (cleanNumber.startsWith('02')) {
        // القاهرة: 02 XXXX XXXX
        formattedNumber = cleanNumber.replace(/^(\d{2})(\d{4})(\d{4})$/, '$1 $2 $3');
      } else if (cleanNumber.startsWith('03')) {
        // الإسكندرية: 03 XXX XXXX
        formattedNumber = cleanNumber.replace(/^(\d{2})(\d{3})(\d{4})$/, '$1 $2 $3');
      } else {
        // باقي المحافظات
        formattedNumber = cleanNumber.replace(/^(\d{3})(\d{3})(\d{3,4})$/, '$1 $2 $3');
      }
    }
  }

  // رسائل الخطأ
  let error = null;
  if (!isMobile && !isLandline) {
    error = 'رقم الهاتف غير صحيح - يجب أن يكون رقم هاتف مصري صالح';
  } else if (!isValidType) {
    if (type === 'mobile') {
      error = 'يجب أن يكون رقم هاتف محمول مصري';
    } else if (type === 'landline') {
      error = 'يجب أن يكون رقم هاتف أرضي مصري';
    }
  }

  return {
    isValid: isValidType && (isMobile || isLandline),
    error,
    type: detectedType,
    cleanNumber,
    formattedNumber,
    originalNumber: phone
  };
};

/**
 * تحويل الرقم للصيغة الدولية
 */
export const toInternationalFormat = (phone) => {
  const validation = validateEgyptianPhone(phone);
  if (!validation.isValid) {
    return null;
  }
  
  return `+2${validation.cleanNumber}`;
};

/**
 * الحصول على معلومات الشبكة (للموبايل فقط)
 */
export const getNetworkInfo = (phone) => {
  const validation = validateEgyptianPhone(phone, 'mobile');
  if (!validation.isValid) {
    return null;
  }

  const prefix = validation.cleanNumber.substring(0, 3);
  
  const networks = {
    '010': { name: 'فودافون', color: '#E60000' },
    '011': { name: 'اتصالات', color: '#00B04F' },
    '012': { name: 'أورانج', color: '#FF6600' },
    '015': { name: 'وي', color: '#8E4EC6' }
  };

  return networks[prefix] || { name: 'غير معروف', color: '#666666' };
};
```

### 2. مكون إدخال الهاتف المحسن

```javascript
import React, { useState, useEffect } from 'react';
import { validateEgyptianPhone, getNetworkInfo } from '../utils/phoneValidation';

const PhoneInput = ({ 
  value, 
  onChange, 
  type = 'any', // 'any', 'mobile', 'landline'
  label = 'رقم الهاتف',
  required = false,
  placeholder = 'أدخل رقم الهاتف',
  showNetworkInfo = true,
  className = ''
}) => {
  const [validation, setValidation] = useState({
    isValid: true,
    error: null,
    type: null,
    formattedNumber: null
  });
  const [isFocused, setIsFocused] = useState(false);

  // التحقق من الرقم عند تغييره
  useEffect(() => {
    if (value) {
      const result = validateEgyptianPhone(value, type);
      setValidation(result);
      
      // إرسال النتيجة للمكون الأب
      if (onChange) {
        onChange(value, result);
      }
    } else {
      setValidation({
        isValid: !required,
        error: required ? 'رقم الهاتف مطلوب' : null,
        type: null,
        formattedNumber: null
      });
    }
  }, [value, type, required]);

  // معالجة تغيير القيمة
  const handleChange = (e) => {
    const newValue = e.target.value;
    
    if (onChange) {
      onChange(newValue);
    }
  };

  // معالجة التركيز
  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  // الحصول على معلومات الشبكة
  const networkInfo = showNetworkInfo && validation.type === 'mobile' && validation.isValid 
    ? getNetworkInfo(value) 
    : null;

  return (
    <div className={`phone-input-container ${className}`}>
      {/* التسمية */}
      <label className="phone-input-label">
        {label}
        {required && <span className="required-asterisk">*</span>}
      </label>

      {/* حقل الإدخال */}
      <div className={`phone-input-wrapper ${validation.error ? 'error' : ''} ${isFocused ? 'focused' : ''}`}>
        <div className="country-code">🇪🇬 +2</div>
        
        <input
          type="tel"
          value={value || ''}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="phone-input-field"
          dir="ltr"
        />

        {/* أيقونة الحالة */}
        <div className="validation-icon">
          {value && (
            validation.isValid ? (
              <span className="success-icon">✅</span>
            ) : (
              <span className="error-icon">❌</span>
            )
          )}
        </div>
      </div>

      {/* معلومات إضافية */}
      <div className="phone-input-info">
        {/* الرقم المنسق */}
        {validation.formattedNumber && (
          <div className="formatted-number">
            <span className="info-label">الرقم المنسق:</span>
            <span className="formatted-value">{validation.formattedNumber}</span>
          </div>
        )}

        {/* معلومات الشبكة */}
        {networkInfo && (
          <div className="network-info">
            <span 
              className="network-badge"
              style={{ backgroundColor: networkInfo.color }}
            >
              {networkInfo.name}
            </span>
          </div>
        )}

        {/* نوع الرقم */}
        {validation.type && (
          <div className="phone-type">
            <span className="type-badge">
              {validation.type === 'mobile' ? '📱 محمول' : '☎️ أرضي'}
            </span>
          </div>
        )}
      </div>

      {/* رسالة الخطأ */}
      {validation.error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{validation.error}</span>
        </div>
      )}

      {/* نصائح الاستخدام */}
      {isFocused && !value && (
        <div className="input-hints">
          <div className="hint">
            <strong>أمثلة صحيحة:</strong>
          </div>
          <div className="hint-examples">
            <div className="hint-example">📱 01012345678 (موبايل)</div>
            <div className="hint-example">☎️ 0233334444 (أرضي)</div>
            <div className="hint-example">🌍 +201012345678 (دولي)</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhoneInput;
```

### 3. استخدام مكون الهاتف في النماذج

```javascript
import React, { useState } from 'react';
import PhoneInput from './PhoneInput';

const UserRegistrationForm = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    emergencyContact: ''
  });
  const [phoneValidations, setPhoneValidations] = useState({
    mobile: { isValid: false },
    emergencyContact: { isValid: false }
  });

  // معالجة تغيير رقم الهاتف
  const handlePhoneChange = (field) => (value, validation) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    setPhoneValidations(prev => ({
      ...prev,
      [field]: validation
    }));
  };

  // التحقق من صحة النموذج
  const isFormValid = () => {
    return formData.fullName.trim() &&
           phoneValidations.mobile.isValid &&
           phoneValidations.emergencyContact.isValid;
  };

  // إرسال النموذج
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      alert('يرجى التأكد من صحة جميع البيانات');
      return;
    }

    try {
      const submitData = {
        fullName: formData.fullName,
        mobile: phoneValidations.mobile.cleanNumber,
        emergencyContact: phoneValidations.emergencyContact.cleanNumber
      };

      // إرسال البيانات
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        alert('تم التسجيل بنجاح');
      } else {
        const error = await response.json();
        alert(error.message || 'حدث خطأ في التسجيل');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('حدث خطأ في الاتصال');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="registration-form">
      <h2>إنشاء حساب جديد</h2>

      {/* الاسم الكامل */}
      <div className="form-group">
        <label>الاسم الكامل *</label>
        <input
          type="text"
          value={formData.fullName}
          onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
          placeholder="أدخل اسمك الكامل"
          required
        />
      </div>

      {/* رقم الهاتف المحمول */}
      <PhoneInput
        value={formData.mobile}
        onChange={handlePhoneChange('mobile')}
        type="mobile"
        label="رقم الهاتف المحمول"
        required={true}
        placeholder="01xxxxxxxxx"
        showNetworkInfo={true}
      />

      {/* رقم الطوارئ */}
      <PhoneInput
        value={formData.emergencyContact}
        onChange={handlePhoneChange('emergencyContact')}
        type="any"
        label="رقم الطوارئ"
        required={true}
        placeholder="رقم هاتف للطوارئ"
        showNetworkInfo={false}
      />

      {/* زر الإرسال */}
      <button
        type="submit"
        className="submit-btn"
        disabled={!isFormValid()}
      >
        إنشاء الحساب
      </button>

      {/* معلومات إضافية */}
      <div className="form-info">
        <p><strong>ملاحظة:</strong> يجب أن تكون أرقام الهواتف مصرية صالحة</p>
        <ul>
          <li>أرقام الموبايل: تبدأ بـ 010, 011, 012, أو 015</li>
          <li>أرقام الأرضي: تبدأ بكود المحافظة (02 للقاهرة، 03 للإسكندرية، إلخ)</li>
        </ul>
      </div>
    </form>
  );
};

export default UserRegistrationForm;
```

يتبع في الجزء الثالث... 