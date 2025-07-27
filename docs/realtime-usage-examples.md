# 🔴 استخدام نظام التتبع المباشر - Real-time Audit Logging

## 📱 **للعملاء (Frontend/Mobile Apps)**

### 🔌 **الاتصال بالنظام المباشر**

```javascript
// استعمال Socket.IO في React/Vue/Angular
import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    token: localStorage.getItem('token') // JWT token
  }
});

// الاستماع للاتصال
socket.on('audit:connected', (data) => {
  console.log('اتصلت بنجاح:', data.message);
  console.log('دورك:', data.userRole);
});

// استقبال سجلات جديدة مباشرة
socket.on('audit:new_log', (logData) => {
  console.log('سجل جديد:', logData);
  
  // عرض إشعار للمستخدم
  showNotification({
    type: logData.severity,
    message: `${logData.userName} عمل ${logData.action} في ${logData.modelName}`,
    timestamp: logData.formattedTimestamp
  });
});

// استقبال تنبيهات الأمان
socket.on('audit:security_alert', (alert) => {
  showSecurityAlert({
    level: alert.alertLevel,
    message: alert.data.message,
    action: alert.data.action
  });
});
```

### 🎯 **للمديرين - Dashboard مباشر**

```javascript
// الاشتراك في كل أنواع السجلات
socket.emit('audit:subscribe', {
  categories: ['MEDICAL', 'SECURITY', 'AUTHENTICATION', 'SYSTEM'],
  severity: ['HIGH', 'CRITICAL'],
  modelTypes: ['Patient', 'Doctor', 'Appointment', 'MedicalRecord']
});

// طلب الإحصائيات المباشرة
socket.emit('audit:get_stats');

socket.on('audit:stats', (stats) => {
  updateDashboard({
    totalLogs: stats.totalLogs,
    successRate: stats.successRate,
    connectedUsers: stats.connectedUsers,
    criticalEvents: stats.criticalEvents
  });
});

// مراقبة محاولات الدخول الفاشلة
socket.on('audit:security_alert', (alert) => {
  if (alert.data.alertType === 'FAILED_LOGIN') {
    addSecurityEvent({
      type: 'محاولة دخول فاشلة',
      ip: alert.data.metadata?.ipAddress,
      user: alert.data.userName,
      time: alert.timestamp
    });
  }
});
```

### 👨‍⚕️ **للأطباء - مراقبة مرضاهم**

```javascript
// الاشتراك في السجلات الطبية فقط
socket.emit('audit:subscribe', {
  categories: ['MEDICAL'],
  modelTypes: ['Patient', 'Appointment', 'MedicalRecord']
});

// استقبال تحديثات خاصة بمرضى الطبيب
socket.on('audit:new_log', (logData) => {
  if (logData.category === 'MEDICAL') {
    updatePatientActivity({
      patient: logData.recordId,
      action: logData.action,
      time: logData.timestamp,
      changes: logData.changes
    });
  }
});
```

---

## 🛠️ **للمطورين - APIs**

### 📊 **جلب المستخدمين المتصلين**

```bash
GET /api/realtime/connected-users
Authorization: Bearer <admin-token>

# الاستجابة
{
  "success": true,
  "message": "تم جلب المستخدمين المتصلين بنجاح",
  "data": {
    "total": 15,
    "admins": 2,
    "doctors": 8,
    "byRole": {
      "admin": 2,
      "doctor": 8,
      "other": 5
    },
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### 📈 **إحصائيات مباشرة**

```bash
GET /api/realtime/stats
Authorization: Bearer <admin-token>

# الاستجابة
{
  "success": true,
  "data": {
    "totalLogs": 1250,
    "successfulOps": 1180,
    "failedOps": 70,
    "criticalEvents": 5,
    "securityEvents": 15,
    "uniqueUsers": 45,
    "successRate": 94.4,
    "connectedUsers": 15,
    "connectedAdmins": 2,
    "connectedDoctors": 8,
    "timeframe": "آخر ساعة",
    "lastUpdate": "2024-01-15T10:30:00Z"
  }
}
```

### 📨 **إرسال إشعار لمستخدم محدد**

```bash
POST /api/realtime/notify-user
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "userId": "64a1b2c3d4e5f6789012345",
  "message": "تم تحديث بياناتك بنجاح",
  "type": "success",
  "priority": "medium"
}

# الاستجابة
{
  "success": true,
  "message": "تم إرسال الإشعار بنجاح"
}
```

### 📢 **إشعار لجميع الأطباء**

```bash
POST /api/realtime/notify-role
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "role": "doctor",
  "message": "تحديث جديد متاح في النظام",
  "type": "info"
}

# الاستجابة
{
  "success": true,
  "message": "تم إرسال الإشعار لجميع الأطباء بنجاح"
}
```

### 🔧 **إشعار صيانة**

```bash
POST /api/realtime/maintenance
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "message": "صيانة دورية للنظام هتبدأ الساعة 2 بليل",
  "duration": 120,
  "startTime": "2024-01-15T02:00:00Z",
  "endTime": "2024-01-15T04:00:00Z"
}

# الاستجابة
{
  "success": true,
  "message": "تم إرسال إشعار الصيانة لجميع المستخدمين"
}
```

### 🚨 **إنذار طوارئ**

```bash
POST /api/realtime/emergency
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "message": "انقطاع في خدمة الانترنت، العمل يدوي حالياً",
  "level": "critical",
  "requiresAction": true
}

# الاستجابة
{
  "success": true,
  "message": "تم إرسال إشعار الطوارئ لجميع المستخدمين"
}
```

---

## 🎭 **سيناريوهات الاستخدام العملية**

### 🏥 **سيناريو 1: مراقبة العيادة**

```javascript
// المدير يراقب النشاط في العيادة
socket.on('audit:new_log', (log) => {
  if (log.modelName === 'Appointment' && log.action === 'CREATE') {
    updateClinicDashboard({
      newAppointment: {
        doctor: log.changes?.doctorId?.new,
        patient: log.changes?.patientId?.new,
        time: log.timestamp
      }
    });
    
    // إشعار في الواجهة
    showNotification(`موعد جديد تم حجزه مع ${log.userName}`);
  }
});
```

### 🔒 **سيناريو 2: مراقبة الأمان**

```javascript
// المدير يراقب محاولات الاختراق
socket.on('audit:security_alert', (alert) => {
  if (alert.data.severity === 'CRITICAL') {
    // إنذار فوري
    triggerSecurityAlarm({
      message: alert.data.message,
      ip: alert.data.metadata?.ipAddress,
      time: alert.timestamp
    });
    
    // إرسال بريد إلكتروني للمدير
    sendSecurityEmail(alert);
  }
});
```

### 👨‍⚕️ **سيناريو 3: تنبيه الطبيب بتحديث المريض**

```javascript
// الطبيب يستقبل تنبيه لما مريضه يحدث بياناته
socket.on('audit:new_log', (log) => {
  if (log.modelName === 'Patient' && log.action === 'UPDATE') {
    // التحقق إن المريض ده تابع للطبيب
    if (isDoctorPatient(log.recordId)) {
      showPatientUpdate({
        patientId: log.recordId,
        changes: log.changes,
        updatedBy: log.userName,
        time: log.formattedTimestamp
      });
    }
  }
});
```

---

## 📱 **أمثلة للموبايل (React Native)**

### 🔌 **إعداد الاتصال**

```javascript
import io from 'socket.io-client';

const useRealtimeAudit = (userToken) => {
  const [socket, setSocket] = useState(null);
  const [logs, setLogs] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (userToken) {
      const newSocket = io('http://localhost:5000', {
        auth: { token: userToken }
      });

      newSocket.on('audit:connected', () => {
        setIsConnected(true);
      });

      newSocket.on('audit:new_log', (log) => {
        setLogs(prev => [log, ...prev].slice(0, 100)); // آخر 100 سجل
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [userToken]);

  return { socket, logs, isConnected };
};
```

### 📊 **واجهة Dashboard**

```javascript
const AdminDashboard = () => {
  const { socket, logs, isConnected } = useRealtimeAudit(userToken);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (socket && isConnected) {
      // طلب الإحصائيات كل 30 ثانية
      const interval = setInterval(() => {
        socket.emit('audit:get_stats');
      }, 30000);

      socket.on('audit:stats', setStats);

      return () => {
        clearInterval(interval);
        socket.off('audit:stats');
      };
    }
  }, [socket, isConnected]);

  return (
    <View style={styles.dashboard}>
      <Text>الاتصال: {isConnected ? '🟢 متصل' : '🔴 منقطع'}</Text>
      
      {stats && (
        <View style={styles.statsContainer}>
          <Text>إجمالي العمليات: {stats.totalLogs}</Text>
          <Text>معدل النجاح: {stats.successRate}%</Text>
          <Text>المستخدمين المتصلين: {stats.connectedUsers}</Text>
        </View>
      )}
      
      <FlatList
        data={logs}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <LogItem log={item} />
        )}
      />
    </View>
  );
};
```

---

## 🔧 **إعدادات النظام**

### 📄 **ملف .env**

```env
# Real-time Audit Configuration
AUDIT_LOG_ENABLED=true
AUDIT_LOG_RETENTION_DAYS=365
AUDIT_LOG_SENSITIVE_DATA=false
AUDIT_LOG_EXCLUDE_PATHS=/health,/favicon.ico

# Socket.IO Configuration  
SOCKETIO_CORS_ORIGINS=http://localhost:3000,https://3ayadatna.com
SOCKETIO_MAX_CONNECTIONS=1000

# Real-time Notifications
REALTIME_NOTIFICATIONS_ENABLED=true
REALTIME_SECURITY_ALERTS=true
REALTIME_EMERGENCY_BROADCAST=true
```

### 🎛️ **تخصيص الفلاتر**

```javascript
// اشتراك مخصص للمدير
socket.emit('audit:subscribe', {
  categories: ['SECURITY', 'MEDICAL'],    // الفئات المهمة
  severity: ['HIGH', 'CRITICAL'],         // الأهمية العالية فقط
  modelTypes: ['User', 'Appointment'],    // نماذج محددة
  excludeActions: ['READ'],               // استبعاد القراءة
  includeFailedOnly: true                 // العمليات الفاشلة فقط
});
```

---

## 🎯 **نصائح للأداء الأمثل**

### ⚡ **تحسين الأداء**

1. **فلترة ذكية**: اشترك فقط في السجلات اللي محتاجها
2. **حد الذاكرة**: احتفظ بآخر 100 سجل في المتصفح
3. **إلغاء الاشتراك**: ألغي الاشتراك لما تسيب الصفحة
4. **Reconnection**: استعمل auto-reconnect للثبات

### 🔧 **أفضل الممارسات**

```javascript
// تنظيف الذاكرة
useEffect(() => {
  return () => {
    if (socket) {
      socket.emit('audit:unsubscribe', 'all');
      socket.disconnect();
    }
  };
}, []);

// معالجة الأخطاء
socket.on('audit:error', (error) => {
  console.error('خطأ في النظام المباشر:', error.message);
  showErrorNotification(error.message);
});

// إعادة الاتصال التلقائي
socket.on('connect', () => {
  console.log('تم إعادة الاتصال بنجاح');
  // إعادة الاشتراك في الفلاتر
  resubscribeToFilters();
});
```

هذا النظام يوفر مراقبة شاملة ومباشرة لجميع العمليات في منصة عياداتنا الطبية! 🚀 