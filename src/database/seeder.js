require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import Models
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Clinic = require('../models/Clinic');
const Admin = require('../models/Admin');
const AuditLog = require('../models/AuditLog');
const Specialization = require('../models/Specialization');
const { generateUniqueSlug } = require('../utils/slug');
const { seedSpecializations } = require('./specializationSeeder');

// Connect to database
const connectDB = require('../config/database');

/**
 * Generate unique patient ID
 */
const generatePatientId = async () => {
  const year = new Date().getFullYear();
  const lastPatient = await Patient.findOne().sort({ createdAt: -1 });
  
  let sequence = '001';
  if (lastPatient && lastPatient.patientId) {
    const lastSequence = parseInt(lastPatient.patientId.slice(-3));
    sequence = String(lastSequence + 1).padStart(3, '0');
  }
  
  return `P${year}${sequence}`;
};

/**
 * Seed admin users
 */
const seedAdmins = async () => {
  console.log('🔹 إنشاء المديرين...');

  const adminData = {
    fullName: 'Fathi Mostafa',
    mobile: '01012345678',
    email: 'tetomostafa20141@gmail.com',
    password: '01029127590Ff',
    role: 'admin',
    gender: 'male',
    isVerified: true,
    isActive: true
  };

  // Check if admin already exists
  const existingAdmin = await User.findOne({ email: adminData.email });
  if (!existingAdmin) {
    const adminUser = new User(adminData);
    await adminUser.save();

    const adminProfile = new Admin({
      userId: adminUser._id,
      adminId: 'ADM001',
      workEmail: 'admin@3ayadty.com',
      position: 'مدير عام',
      department: 'IT',
      hireDate: new Date('2023-01-01'),
      permissions: ['full_access'],
      isSuperAdmin: true
    });
    await adminProfile.save();

    console.log(`✅ تم إنشاء المدير: ${adminData.fullName}`);
  } else {
    console.log(`⚠️ المدير موجود مسبقاً: ${adminData.fullName}`);
  }
};

/**
 * Seed doctors
 */
const seedDoctors = async () => {
  console.log('🔹 إنشاء الأطباء...');

  const doctorsData = [
    {
      user: {
        fullName: 'د. أحمد محمد الأحمد',
        mobile: '01023456789',
        email: 'ahmed.doctor@3ayadty.com',
        password: 'doctor123',
        role: 'doctor',
        gender: 'male',
        dateOfBirth: new Date('1980-05-15'),
        isVerified: true,
        isActive: true
      },
      doctor: {
        name: 'د. أحمد محمد الأحمد',
        specialization: 'قلب',
        subSpecialization: 'قسطرة القلب',
        biography: 'استشاري أمراض القلب والأوعية الدموية مع خبرة تزيد عن 15 عاماً في مجال طب القلب التداخلي',
        degrees: [
          {
            degree: 'بكالوريوس الطب والجراحة',
            institution: 'جامعة الملك سعود',
            year: 2003,
            country: 'السعودية'
          },
          {
            degree: 'ماجستير أمراض القلب',
            institution: 'جامعة الملك عبدالعزيز',
            year: 2008,
            country: 'السعودية'
          }
        ],
        consultationFee: 300,
        followupFee: 200,
        isPhoneVisible: true,
        availability: [
          {
            day: 'sunday',
            isAvailable: true,
            timeSlots: [
              { startTime: '09:00', endTime: '12:00' },
              { startTime: '16:00', endTime: '20:00' }
            ]
          },
          {
            day: 'monday',
            isAvailable: true,
            timeSlots: [
              { startTime: '09:00', endTime: '12:00' },
              { startTime: '16:00', endTime: '20:00' }
            ]
          },
          {
            day: 'tuesday',
            isAvailable: true,
            timeSlots: [
              { startTime: '09:00', endTime: '12:00' }
            ]
          }
        ],
        tags: ['قلب', 'قسطرة', 'ضغط', 'كوليسترول'],
        languages: ['العربية', 'الإنجليزية'],
        isVerified: true,
        isActive: true,
        isAcceptingPatients: true
      }
    },
    {
      user: {
        fullName: 'د. فاطمة علي الزهراني',
        mobile: '01034567890',
        email: 'fatima.doctor@3ayadty.com',
        password: 'doctor123',
        role: 'doctor',
        gender: 'female',
        dateOfBirth: new Date('1985-08-22'),
        isVerified: true,
        isActive: true
      },
      doctor: {
        name: 'د. فاطمة علي الزهراني',
        specialization: 'أطفال',
        subSpecialization: 'حديثي الولادة',
        biography: 'استشارية طب الأطفال وحديثي الولادة مع اهتمام خاص بالرعاية الصحية للأطفال والتطعيمات',
        degrees: [
          {
            degree: 'بكالوريوس الطب والجراحة',
            institution: 'جامعة الملك فيصل',
            year: 2007,
            country: 'السعودية'
          },
          {
            degree: 'البورد السعودي في طب الأطفال',
            institution: 'الهيئة السعودية للتخصصات الصحية',
            year: 2012,
            country: 'السعودية'
          }
        ],
        consultationFee: 250,
        followupFee: 150,
        isPhoneVisible: false,
        availability: [
          {
            day: 'sunday',
            isAvailable: true,
            timeSlots: [
              { startTime: '08:00', endTime: '14:00' }
            ]
          },
          {
            day: 'tuesday',
            isAvailable: true,
            timeSlots: [
              { startTime: '08:00', endTime: '14:00' }
            ]
          },
          {
            day: 'thursday',
            isAvailable: true,
            timeSlots: [
              { startTime: '08:00', endTime: '14:00' }
            ]
          }
        ],
        tags: ['أطفال', 'حديثي الولادة', 'تطعيمات', 'نمو'],
        languages: ['العربية', 'الإنجليزية'],
        isVerified: true,
        isActive: true,
        isAcceptingPatients: true
      }
    },
    {
      user: {
        fullName: 'د. خالد عبدالله المطيري',
        mobile: '01045678901',
        email: 'khalid.doctor@3ayadty.com',
        password: 'doctor123',
        role: 'doctor',
        gender: 'male',
        dateOfBirth: new Date('1978-12-10'),
        isVerified: true,
        isActive: true
      },
      doctor: {
        name: 'د. خالد عبدالله المطيري',
        specialization: 'عظام',
        subSpecialization: 'جراحة العمود الفقري',
        biography: 'استشاري جراحة العظام والعمود الفقري مع خبرة واسعة في علاج إصابات الملاعب وجراحات المناظير',
        degrees: [
          {
            degree: 'بكالوريوس الطب والجراحة',
            institution: 'جامعة أم القرى',
            year: 2001,
            country: 'السعودية'
          },
          {
            degree: 'البورد الأمريكي في جراحة العظام',
            institution: 'Mayo Clinic',
            year: 2007,
            country: 'أمريكا'
          }
        ],
        consultationFee: 400,
        followupFee: 250,
        isPhoneVisible: true,
        availability: [
          {
            day: 'monday',
            isAvailable: true,
            timeSlots: [
              { startTime: '10:00', endTime: '13:00' },
              { startTime: '17:00', endTime: '21:00' }
            ]
          },
          {
            day: 'wednesday',
            isAvailable: true,
            timeSlots: [
              { startTime: '10:00', endTime: '13:00' },
              { startTime: '17:00', endTime: '21:00' }
            ]
          }
        ],
        tags: ['عظام', 'عمود فقري', 'إصابات رياضية', 'مناظير'],
        languages: ['العربية', 'الإنجليزية'],
        isVerified: true,
        isActive: true,
        isAcceptingPatients: true
      }
    }
  ];

  for (const doctorData of doctorsData) {
    const existingUser = await User.findOne({ email: doctorData.user.email });
    
    if (!existingUser) {
      // Find specialization by name
      const specialization = await Specialization.findOne({ 
        name: doctorData.doctor.specialization 
      });
      
      if (!specialization) {
        console.log(`❌ التخصص غير موجود: ${doctorData.doctor.specialization}`);
        continue;
      }

      // Create user
      const doctorUser = new User(doctorData.user);
      await doctorUser.save();

      // Generate slug
      const slug = await generateUniqueSlug(
        `${doctorData.doctor.name} ${doctorData.doctor.specialization}`, 
        Doctor
      );

      // Create doctor profile
      const doctor = new Doctor({
        ...doctorData.doctor,
        specialization: specialization._id, // Use specialization ID instead of name
        userId: doctorUser._id,
        slug
      });
      await doctor.save();

      console.log(`✅ تم إنشاء الطبيب: ${doctorData.doctor.name}`);
    } else {
      console.log(`⚠️ الطبيب موجود مسبقاً: ${doctorData.doctor.name}`);
    }
  }
};

/**
 * Seed clinics
 */
const seedClinics = async () => {
  console.log('🔹 إنشاء العيادات...');

  const clinicsData = [
    {
      name: 'مجمع عيادات النور الطبي',
      description: 'مجمع طبي متكامل يقدم خدمات طبية متخصصة في جميع التخصصات الطبية',
      type: 'عيادة خاصة',
      phones: [
        { number: '0212345678', type: 'landline', isPrimary: true },
        { number: '01012345678', type: 'mobile', isPrimary: false }
      ],
      email: 'info@alnoor-medical.com',
      website: 'https://alnoor-medical.com',
      location: {
        coordinates: [46.6753, 24.7136], // Riyadh coordinates
        address: {
          street: 'شارع الملك فهد',
          city: 'الرياض',
          region: 'منطقة الرياض',
          postalCode: '12345',
          country: 'السعودية'
        },
        landmarks: ['مجمع الملك فهد التجاري', 'مستشفى الملك فيصل التخصصي'],
        directions: 'بجانب مجمع الملك فهد التجاري، المخرج الثامن'
      },
      workingHours: [
        {
          day: 'sunday',
          isOpen: true,
          shifts: [
            { name: 'صباحي', startTime: '08:00', endTime: '14:00' },
            { name: 'مسائي', startTime: '16:00', endTime: '22:00' }
          ]
        },
        {
          day: 'monday',
          isOpen: true,
          shifts: [
            { name: 'صباحي', startTime: '08:00', endTime: '14:00' },
            { name: 'مسائي', startTime: '16:00', endTime: '22:00' }
          ]
        },
        {
          day: 'tuesday',
          isOpen: true,
          shifts: [
            { name: 'صباحي', startTime: '08:00', endTime: '14:00' },
            { name: 'مسائي', startTime: '16:00', endTime: '22:00' }
          ]
        },
        {
          day: 'wednesday',
          isOpen: true,
          shifts: [
            { name: 'صباحي', startTime: '08:00', endTime: '14:00' },
            { name: 'مسائي', startTime: '16:00', endTime: '22:00' }
          ]
        },
        {
          day: 'thursday',
          isOpen: true,
          shifts: [
            { name: 'صباحي', startTime: '08:00', endTime: '14:00' },
            { name: 'مسائي', startTime: '16:00', endTime: '22:00' }
          ]
        },
        {
          day: 'friday',
          isOpen: false,
          shifts: []
        },
        {
          day: 'saturday',
          isOpen: true,
          shifts: [
            { name: 'صباحي', startTime: '08:00', endTime: '14:00' }
          ]
        }
      ],
      specializations: ['طب القلب', 'طب الأطفال', 'طب العظام', 'الطب الباطني', 'طب النساء والولادة'],
      services: [
        {
          name: 'فحص شامل',
          description: 'فحص طبي شامل لجميع أجهزة الجسم',
          category: 'تشخيص',
          isActive: true
        },
        {
          name: 'تخطيط القلب',
          description: 'فحص كهربائية القلب',
          category: 'تشخيص',
          isActive: true
        },
        {
          name: 'أشعة سينية',
          description: 'تصوير بالأشعة السينية',
          category: 'تشخيص',
          isActive: true
        }
      ],
      facilities: [
        {
          name: 'معمل تحاليل',
          description: 'معمل مجهز بأحدث الأجهزة',
          category: 'معدات طبية'
        },
        {
          name: 'صيدلية',
          description: 'صيدلية شاملة',
          category: 'خدمات عامة'
        },
        {
          name: 'مواقف سيارات',
          description: 'مواقف مجانية للمرضى',
          category: 'خدمات عامة'
        }
      ],
      paymentMethods: [
        { type: 'cash', isActive: true, notes: 'دفع نقدي في العيادة' },
        { type: 'card_in_clinic', isActive: true, notes: 'فيزا/ماستركارد في العيادة' },
        { type: 'installments', isActive: false, notes: 'تقسيط حسب الاتفاق' }
      ],
      owner: {
        name: 'د. محمد النور',
        mobile: '01056789012',
        email: 'owner@alnoor-medical.com'
      },
      tags: ['مجمع طبي', 'عيادات متخصصة', 'معمل', 'صيدلية'],
      isVerified: true,
      isActive: true
    },
    {
      name: 'عيادة الحياة للأطفال',
      description: 'عيادة متخصصة في طب الأطفال وحديثي الولادة',
      type: 'عيادة خاصة',
      phones: [
        { number: '0312345678', type: 'landline', isPrimary: true }
      ],
      email: 'info@alhayat-kids.com',
      location: {
        coordinates: [46.7219, 24.6877],
        address: {
          street: 'شارع العليا',
          city: 'الرياض',
          region: 'منطقة الرياض',
          postalCode: '12346',
          country: 'السعودية'
        },
        landmarks: ['مول العليا', 'مدرسة العليا الأهلية'],
        directions: 'مقابل مول العليا، الدور الثاني'
      },
      workingHours: [
        {
          day: 'sunday',
          isOpen: true,
          shifts: [{ name: 'صباحي', startTime: '08:00', endTime: '14:00' }]
        },
        {
          day: 'tuesday',
          isOpen: true,
          shifts: [{ name: 'صباحي', startTime: '08:00', endTime: '14:00' }]
        },
        {
          day: 'thursday',
          isOpen: true,
          shifts: [{ name: 'صباحي', startTime: '08:00', endTime: '14:00' }]
        }
      ],
      specializations: ['طب الأطفال'],
      services: [
        {
          name: 'فحص دوري للأطفال',
          description: 'متابعة نمو وتطور الطفل',
          category: 'فحص دوري',
          isActive: true
        },
        {
          name: 'تطعيمات',
          description: 'جميع التطعيمات الأساسية والإضافية',
          category: 'وقاية',
          isActive: true
        }
      ],
      facilities: [
        {
          name: 'غرفة ألعاب',
          description: 'منطقة ألعاب آمنة للأطفال',
          category: 'خدمات عامة'
        }
      ],
      paymentMethods: [
        { type: 'cash', isActive: true, notes: 'دفع نقدي في العيادة' },
        { type: 'card_in_clinic', isActive: true, notes: 'فيزا/ماستركارد في العيادة' },
        { type: 'installments', isActive: false, notes: 'تقسيط حسب الاتفاق' }
      ],
      tags: ['أطفال', 'تطعيمات', 'حديثي الولادة'],
      isVerified: true,
      isActive: true
    }
  ];

  for (const clinicData of clinicsData) {
    const existingClinic = await Clinic.findOne({ name: clinicData.name });
    
    if (!existingClinic) {
      // Generate slug
      const slug = await generateUniqueSlug(
        `${clinicData.name} ${clinicData.location.address.city}`, 
        Clinic
      );

      const clinic = new Clinic({
        ...clinicData,
        slug
      });
      await clinic.save();

      console.log(`✅ تم إنشاء العيادة: ${clinicData.name}`);
    } else {
      console.log(`⚠️ العيادة موجودة مسبقاً: ${clinicData.name}`);
    }
  }
};

/**
 * Seed patients (sample data)
 */
const seedPatients = async () => {
  console.log('🔹 إنشاء المرضى النموذجيين...');

  const patientsData = [
    {
      user: {
        fullName: 'سارة أحمد المحمد',
        mobile: '01067890123',
        email: 'sara.patient@example.com',
        password: 'patient123',
        role: 'patient',
        gender: 'female',
        dateOfBirth: new Date('1990-03-15'),
        isVerified: true,
        isActive: true
      },
      patient: {
        emergencyContact: {
          name: 'أحمد المحمد',
          relationship: 'زوج',
          mobile: '01067890123',
          email: 'ahmed@example.com'
        },
        medicalHistory: {
          bloodType: 'O+',
          weight: { value: 65, unit: 'kg', lastUpdated: new Date() },
          height: { value: 165, unit: 'cm', lastUpdated: new Date() },
          allergies: [
            {
              allergen: 'البنسلين',
              severity: 'moderate',
              reaction: 'طفح جلدي',
              notes: 'تجنب جميع مشتقات البنسلين'
            }
          ]
        },
        preferences: {
          language: 'ar',
          preferredDoctorGender: 'female',
          notificationSettings: {
            sms: true,
            email: false,
            appointmentReminders: true,
            healthTips: true
          }
        }
      }
    },
    {
      user: {
        fullName: 'محمد علي الغامدي',
        mobile: '01078901234',
        email: 'mohammed.patient@example.com',
        password: 'patient123',
        role: 'patient',
        gender: 'male',
        dateOfBirth: new Date('1985-07-20'),
        isVerified: true,
        isActive: true
      },
      patient: {
        emergencyContact: {
          name: 'فاطمة الغامدي',
          relationship: 'زوجة',
          mobile: '01078901234',
          email: 'fatima@example.com'
        },
        medicalHistory: {
          bloodType: 'A+',
          weight: { value: 80, unit: 'kg', lastUpdated: new Date() },
          height: { value: 175, unit: 'cm', lastUpdated: new Date() },
          chronicDiseases: [
            {
              disease: 'ارتفاع ضغط الدم',
              diagnosedDate: new Date('2020-01-15'),
              status: 'controlled',
              medications: ['كابتوبريل 25 مج'],
              notes: 'يتابع مع طبيب القلب كل 3 أشهر'
            }
          ],
          currentMedications: [
            {
              name: 'كابتوبريل',
              dosage: '25 مج',
              frequency: 'مرة يومياً',
              startDate: new Date('2020-01-15'),
              prescribedBy: 'د. أحمد محمد',
              notes: 'يؤخذ صباحاً قبل الإفطار'
            }
          ]
        },
        preferences: {
          language: 'ar',
          preferredDoctorGender: 'no_preference',
          notificationSettings: {
            sms: true,
            email: true,
            appointmentReminders: true,
            healthTips: false
          }
        }
      }
    }
  ];

  for (const patientData of patientsData) {
    const existingUser = await User.findOne({ email: patientData.user.email });
    
    if (!existingUser) {
      // Create user
      const patientUser = new User(patientData.user);
      await patientUser.save();

      // Generate patient ID
      const patientId = await generatePatientId();
      
      // Create patient profile
      const patient = new Patient({
        ...patientData.patient,
        userId: patientUser._id,
        patientId: patientId
      });
      await patient.save();

      console.log(`✅ تم إنشاء المريض: ${patientData.user.fullName}`);
    } else {
      console.log(`⚠️ المريض موجود مسبقاً: ${patientData.user.fullName}`);
    }
  }
};

/**
 * Link doctors to clinics
 */
const linkDoctorsToClinic = async () => {
  console.log('🔹 ربط الأطباء بالعيادات...');

  try {
    // Get the main clinic
    const mainClinic = await Clinic.findOne({ name: 'مجمع عيادات النور الطبي' });
    if (!mainClinic) {
      console.log('❌ لم يتم العثور على العيادة الرئيسية');
      return;
    }

    // Get all doctors
    const doctors = await Doctor.find({ isActive: true });

    for (const doctor of doctors) {
      // Check if doctor is already linked to this clinic
      const isLinked = mainClinic.doctors.some(d => 
        d.doctorId.toString() === doctor._id.toString()
      );

      if (!isLinked) {
        // Add doctor to clinic
        await mainClinic.addDoctor(doctor._id, {
          specialRole: 'استشاري',
          workingDays: [
            { day: 'sunday', startTime: '09:00', endTime: '12:00' },
            { day: 'monday', startTime: '09:00', endTime: '12:00' }
          ]
        });

        // Add clinic to doctor
        doctor.clinics.push({
          clinicId: mainClinic._id,
          isPrimary: true,
          workingHours: [
            { day: 'sunday', startTime: '09:00', endTime: '12:00' },
            { day: 'monday', startTime: '09:00', endTime: '12:00' }
          ]
        });
        await doctor.save();

        console.log(`✅ تم ربط الطبيب ${doctor.name} بالعيادة`);
      }
    }

  } catch (error) {
    console.error('❌ خطأ في ربط الأطباء بالعيادات:', error);
  }
};

/**
 * Main seeder function
 */
const runSeeder = async () => {
  try {
    console.log('🚀 بدء تشغيل البيانات الأولية...\n');

    // Connect to database
    await connectDB();

    // Run seeders
    await seedAdmins();
    await seedSpecializations();
    await seedDoctors();
    await seedClinics();
    await seedPatients();
    await linkDoctorsToClinic();

    console.log('\n✅ تم إنشاء جميع البيانات الأولية بنجاح!');
    console.log('\n📊 ملخص البيانات المنشأة:');
    
    const counts = {
      users: await User.countDocuments(),
      doctors: await Doctor.countDocuments(),
      patients: await Patient.countDocuments(),
      clinics: await Clinic.countDocuments(),
      admins: await Admin.countDocuments()
    };

    console.log(`👥 المستخدمين: ${counts.users}`);
    console.log(`👨‍⚕️ الأطباء: ${counts.doctors}`);
    console.log(`🏥 المرضى: ${counts.patients}`);
    console.log(`🏢 العيادات: ${counts.clinics}`);
    console.log(`👤 المديرين: ${counts.admins}`);

    console.log('\n🔑 بيانات تسجيل الدخول:');
    console.log('المدير:');
    console.log('  📧 البريد: tetomostafa20141@gmail.com');
    console.log('  📱 الجوال: 01012345678');
    console.log('  🔒 كلمة المرور: 01029127590Ff');
    console.log('\nطبيب:');
    console.log('  📧 البريد: ahmed.doctor@3ayadty.com');
    console.log('  🔒 كلمة المرور: doctor123');
    console.log('\nمريض:');
    console.log('  📧 البريد: sara.patient@example.com');
    console.log('  🔒 كلمة المرور: patient123');

  } catch (error) {
    console.error('❌ خطأ في تشغيل البيانات الأولية:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n🔴 تم إغلاق الاتصال مع قاعدة البيانات');
    process.exit(0);
  }
};

/**
 * Clear all data (for testing)
 */
const clearAllData = async () => {
  try {
    console.log('🗑️ حذف جميع البيانات...');
    
    await connectDB();
    
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await Patient.deleteMany({});
    await Clinic.deleteMany({});
    await Admin.deleteMany({});
    
    console.log('✅ تم حذف جميع البيانات بنجاح');
    
  } catch (error) {
    console.error('❌ خطأ في حذف البيانات:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

// Check command line arguments
const args = process.argv.slice(2);

if (args.includes('--clear')) {
  clearAllData();
} else {
  runSeeder();
}

module.exports = {
  runSeeder,
  clearAllData,
  seedAdmins,
  seedDoctors,
  seedClinics,
  seedPatients
}; 