const Specialization = require('../models/Specialization');
const User = require('../models/User');

/**
 * Seed medical specializations
 */
const seedSpecializations = async () => {
  console.log('🔹 إنشاء التخصصات الطبية...');

  // Get admin user for createdBy field
  const adminUser = await User.findOne({ role: 'admin' });
  if (!adminUser) {
    console.log('❌ لم يتم العثور على مستخدم admin لإنشاء التخصصات');
    return;
  }

  const specializationsData = [
    {
      name: 'باطنة',
      code: 'INTERNAL',
      description: 'طب باطني وأمراض بالغين - تشخيص وعلاج الأمراض الداخلية',
      commonConditions: ['ضغط الدم', 'السكري', 'الكوليسترول', 'الأنيميا', 'أمراض الجهاز الهضمي'],
      icon: '🏥',
      createdBy: adminUser._id
    },
    {
      name: 'أطفال',
      code: 'PEDIATRICS',
      description: 'طب الأطفال وحديثي الولادة - رعاية الأطفال من الولادة حتى 18 سنة',
      commonConditions: ['حمى الأطفال', 'نزلات البرد', 'التطعيمات', 'مشاكل النمو', 'أمراض الجهاز التنفسي'],
      icon: '👶',
      createdBy: adminUser._id
    },
    {
      name: 'نساء وتوليد',
      code: 'GYNECOLOGY',
      description: 'أمراض النساء والولادة - رعاية المرأة في جميع مراحل حياتها',
      commonConditions: ['متابعة الحمل', 'الولادة', 'الكشف الدوري', 'تأخر الإنجاب', 'أمراض النساء'],
      icon: '👩‍⚕️',
      createdBy: adminUser._id
    },
    {
      name: 'عظام',
      code: 'ORTHOPEDICS',
      description: 'جراحة العظام والمفاصل - علاج إصابات وأمراض الجهاز العضلي الهيكلي',
      commonConditions: ['كسور', 'خشونة مفاصل', 'انزلاق غضروفي', 'التهاب أوتار', 'آلام الظهر'],
      icon: '🦴',
      createdBy: adminUser._id
    },
    {
      name: 'قلب',
      code: 'CARDIOLOGY',
      description: 'أمراض القلب والأوعية الدموية - تشخيص وعلاج أمراض القلب',
      commonConditions: ['ضغط الدم', 'الجلطات', 'عدم انتظام ضربات القلب', 'قصور الشرايين', 'أمراض القلب الخلقية'],
      icon: '❤️',
      createdBy: adminUser._id
    },
    {
      name: 'جلدية',
      code: 'DERMATOLOGY',
      description: 'الأمراض الجلدية والتناسلية - علاج جميع مشاكل الجلد والشعر والأظافر',
      commonConditions: ['الحساسية الجلدية', 'الأكزيما', 'الصدفية', 'حبوب الشباب', 'الأمراض الفطرية'],
      icon: '🩺',
      createdBy: adminUser._id
    },
    {
      name: 'عيون',
      code: 'OPHTHALMOLOGY',
      description: 'طب وجراحة العيون - تشخيص وعلاج جميع أمراض العين',
      commonConditions: ['ضعف النظر', 'المياه البيضاء', 'المياه الزرقاء', 'أمراض الشبكية', 'التهاب العين'],
      icon: '👁️',
      createdBy: adminUser._id
    },
    {
      name: 'أنف وأذن وحنجرة',
      code: 'ENT',
      description: 'أمراض الأنف والأذن والحنجرة - علاج مشاكل الجهاز التنفسي العلوي',
      commonConditions: ['احتقان الجيوب الأنفية', 'التهاب الأذن', 'حساسية الأنف', 'التهاب اللوزتين', 'مشاكل السمع'],
      icon: '👂',
      createdBy: adminUser._id
    },
    {
      name: 'أسنان',
      code: 'DENTISTRY',
      description: 'طب وتجميل الأسنان - علاج جميع مشاكل الأسنان واللثة',
      commonConditions: ['تسوس الأسنان', 'التهاب اللثة', 'تقويم الأسنان', 'حشو وتركيبات', 'جراحة الأسنان'],
      icon: '🦷',
      createdBy: adminUser._id
    },
    {
      name: 'مخ وأعصاب',
      code: 'NEUROLOGY',
      description: 'الأمراض العصبية والدماغ - تشخيص وعلاج أمراض الجهاز العصبي',
      commonConditions: ['الصداع النصفي', 'الصرع', 'الجلطة الدماغية', 'ضعف الأعصاب', 'مرض باركنسون'],
      icon: '🧠',
      createdBy: adminUser._id
    }
  ];

  try {
    // Clear existing specializations
    await Specialization.deleteMany({});
    console.log('🗑️ تم حذف التخصصات الموجودة');

    // Create new specializations
    const specializations = await Specialization.insertMany(specializationsData);
    console.log(`✅ تم إنشاء ${specializations.length} تخصص طبي`);

    // Update stats for each specialization
    for (const specialization of specializations) {
      await specialization.updateStats();
    }
    console.log('📊 تم تحديث إحصائيات التخصصات');

    return specializations;

  } catch (error) {
    console.error('❌ خطأ في إنشاء التخصصات:', error);
    throw error;
  }
};

module.exports = { seedSpecializations }; 