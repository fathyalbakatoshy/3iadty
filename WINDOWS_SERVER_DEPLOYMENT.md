# Windows Server Deployment Guide
# دليل نشر المشروع على Windows Server

## المتطلبات الأساسية
### Prerequisites

1. **Windows Server** (2016 أو أحدث)
2. **IIS** (Internet Information Services)
3. **Node.js** (الإصدار 16 أو أحدث)
4. **iisnode** (لتشغيل Node.js على IIS)
5. **MongoDB** (محلي أو MongoDB Atlas)
6. **URL Rewrite Module** (لـ IIS)

## خطوات التثبيت
### Installation Steps

### 1. تثبيت Node.js
```powershell
# تحميل وتثبيت Node.js من الموقع الرسمي
# https://nodejs.org/en/download/
```

### 2. تثبيت iisnode
```powershell
# تحميل iisnode من GitHub
# https://github.com/Azure/iisnode/releases
# تثبيت الملف .msi
```

### 3. تثبيت URL Rewrite Module
```powershell
# تحميل من Microsoft
# https://www.iis.net/downloads/microsoft/url-rewrite
```

### 4. إعداد IIS
1. فتح **Internet Information Services (IIS) Manager**
2. إنشاء **Application Pool** جديد:
   - **Name**: 3ayadatna
   - **.NET CLR Version**: "No Managed Code"
   - **Managed Pipeline Mode**: Integrated
   - **Identity**: ApplicationPoolIdentity

### 5. إنشاء Website/Application
1. في IIS Manager، إنشاء **Website** جديد أو **Application**
2. **Physical Path**: `C:\inetpub\wwwroot\3iadty`
3. **Application Pool**: 3ayadatna

### 6. إعداد المشروع
```powershell
# نسخ الملفات إلى المجلد
Copy-Item -Path "C:\path\to\your\project\*" -Destination "C:\inetpub\wwwroot\3iadty" -Recurse

# تثبيت التبعيات
cd C:\inetpub\wwwroot\3iadty
npm install --production

# نسخ ملف البيئة
Copy-Item env-template.txt .env
# تعديل ملف .env حسب الإعدادات
```

### 7. إعداد قاعدة البيانات
```powershell
# تثبيت MongoDB محلي أو استخدام MongoDB Atlas
# تحديث MONGODB_URI في ملف .env
```

### 8. إعداد الأذونات
```powershell
# منح الأذونات لمجلد uploads
icacls "C:\inetpub\wwwroot\3iadty\uploads" /grant "IIS_IUSRS:(OI)(CI)F"
icacls "C:\inetpub\wwwroot\3iadty\uploads" /grant "NETWORK SERVICE:(OI)(CI)F"

# منح الأذونات لمجلد iisnode (سيتم إنشاؤه تلقائياً)
icacls "C:\inetpub\wwwroot\3iadty\iisnode" /grant "IIS_IUSRS:(OI)(CI)F"
```

## ملفات التكوين
### Configuration Files

### web.config
- موجود في مجلد المشروع الرئيسي
- يوجه جميع الطلبات إلى `src/server.js`
- يحمي الملفات الحساسة

### .env
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://localhost:27017/3ayadatna
JWT_SECRET=your-secret-key
# ... باقي المتغيرات
```

## اختبار النشر
### Testing Deployment

1. **Health Check**: `http://yourdomain.com/health`
2. **API Test**: `http://yourdomain.com/api/auth/register`
3. **Static Files**: `http://yourdomain.com/uploads/`

## استكشاف الأخطاء
### Troubleshooting

### مشاكل شائعة:
1. **خطأ 500**: تحقق من سجلات iisnode في مجلد `iisnode`
2. **خطأ في قاعدة البيانات**: تحقق من اتصال MongoDB
3. **مشاكل في الأذونات**: تحقق من أذونات المجلدات
4. **خطأ في web.config**: تحقق من صحة XML

### سجلات الأخطاء:
```powershell
# سجلات iisnode
C:\inetpub\wwwroot\3iadty\iisnode\

# سجلات IIS
C:\inetpub\logs\LogFiles\
```

## الأمان
### Security

1. **تحديث JWT_SECRET** في ملف .env
2. **إعداد HTTPS** باستخدام شهادة SSL
3. **تحديث ALLOWED_ORIGINS** في ملف .env
4. **إعداد Firewall** لفتح المنافذ المطلوبة

## الصيانة
### Maintenance

1. **تحديث Node.js** دورياً
2. **مراقبة سجلات الأخطاء**
3. **نسخ احتياطي لقاعدة البيانات**
4. **تحديث التبعيات**: `npm update`

## الدعم
### Support

- **GitHub Issues**: https://github.com/3ayadatna/backend/issues
- **Documentation**: https://3ayadatna.com/docs
- **Email**: support@3ayadatna.com 