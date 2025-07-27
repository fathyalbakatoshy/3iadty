const { PAYMENT_METHODS, SUCCESS_MESSAGES, ERROR_MESSAGES } = require('../config/constants');

/**
 * Generate payment reminder message
 */
const generatePaymentReminder = (appointmentData) => {
  const { paymentMethod, doctorName, clinicName, consultationFee } = appointmentData;
  
  let methodMessage = '';
  switch (paymentMethod) {
    case PAYMENT_METHODS.CASH:
      methodMessage = 'احضر المبلغ كاش معك';
      break;
    case PAYMENT_METHODS.CARD_IN_CLINIC:
      methodMessage = 'يمكن الدفع بالفيزا في العيادة';
      break;
    case PAYMENT_METHODS.INSTALLMENTS:
      methodMessage = 'تذكر موضوع التقسيط المتفق عليه';
      break;
    default:
      methodMessage = 'الدفع في العيادة';
  }

  return {
    reminder: `تذكير: ${methodMessage}`,
    details: {
      doctor: doctorName,
      clinic: clinicName,
      fee: consultationFee ? `${consultationFee} جنيه` : 'حسب العيادة',
      method: methodMessage,
      location: 'في العيادة فقط'
    }
  };
};

/**
 * Validate payment method for clinic
 */
const validatePaymentMethodForClinic = (paymentMethod, clinicPaymentMethods = []) => {
  // Check if payment method is valid
  if (!Object.values(PAYMENT_METHODS).includes(paymentMethod)) {
    return {
      valid: false,
      message: ERROR_MESSAGES.INVALID_PAYMENT_METHOD
    };
  }

  // Check if clinic accepts this payment method
  const clinicAccepts = clinicPaymentMethods.find(
    method => method.type === paymentMethod && method.isActive
  );

  if (!clinicAccepts) {
    return {
      valid: false,
      message: `العيادة دي مش بتقبل ${getPaymentMethodName(paymentMethod)}`
    };
  }

  return {
    valid: true,
    message: SUCCESS_MESSAGES.PAYMENT_IN_CLINIC_ONLY
  };
};

/**
 * Get payment method display name
 */
const getPaymentMethodName = (paymentMethod) => {
  const methodNames = {
    [PAYMENT_METHODS.CASH]: 'الكاش',
    [PAYMENT_METHODS.CARD_IN_CLINIC]: 'الفيزا',
    [PAYMENT_METHODS.INSTALLMENTS]: 'التقسيط'
  };

  return methodNames[paymentMethod] || 'طريقة دفع غير معروفة';
};

/**
 * Get available payment methods for display
 */
const getAvailablePaymentMethods = () => {
  return [
    {
      value: PAYMENT_METHODS.CASH,
      label: 'كاش في العيادة',
      icon: '💵',
      description: 'دفع نقدي مباشرة في العيادة',
      popular: true
    },
    {
      value: PAYMENT_METHODS.CARD_IN_CLINIC,
      label: 'فيزا/ماستركارد في العيادة',
      icon: '💳',
      description: 'دفع بالبطاقة البنكية في ماكينة العيادة',
      popular: true
    },
    {
      value: PAYMENT_METHODS.INSTALLMENTS,
      label: 'تقسيط مع العيادة',
      icon: '📊',
      description: 'تقسيط حسب اتفاق مع العيادة',
      popular: false
    }
  ];
};

/**
 * Check if payment method requires special preparation
 */
const getPaymentPreparationNotes = (paymentMethod) => {
  const notes = {
    [PAYMENT_METHODS.CASH]: [
      'احضر المبلغ المطلوب نقداً',
      'المبلغ كما هو محدد بدون زيادة أو نقصان',
      'في حالة عدم توفر باقي، اتفق مع العيادة مسبقاً'
    ],
    [PAYMENT_METHODS.CARD_IN_CLINIC]: [
      'تأكد من وجود رصيد كافي في البطاقة',
      'احضر بطاقتك البنكية (فيزا/ماستركارد)',
      'تأكد من تفعيل البطاقة للاستخدام المحلي'
    ],
    [PAYMENT_METHODS.INSTALLMENTS]: [
      'تواصل مع العيادة مسبقاً لترتيب التقسيط',
      'احضر الأوراق المطلوبة للتقسيط',
      'ادفع القسط الأول عند الزيارة'
    ]
  };

  return notes[paymentMethod] || ['الدفع في العيادة فقط'];
};

/**
 * Generate payment summary for appointment
 */
const generatePaymentSummary = (appointmentData) => {
  const { paymentMethod, consultationFee, doctorName, clinicName } = appointmentData;
  
  return {
    paymentMethod: getPaymentMethodName(paymentMethod),
    amount: consultationFee ? `${consultationFee} جنيه` : 'حسب العيادة',
    location: 'في العيادة',
    preparationNotes: getPaymentPreparationNotes(paymentMethod),
    reminder: `تذكير: ${getPaymentMethodName(paymentMethod)} في ${clinicName}`,
    contactInfo: 'للاستفسار عن الدفع، تواصل مع العيادة مباشرة'
  };
};

module.exports = {
  generatePaymentReminder,
  validatePaymentMethodForClinic,
  getPaymentMethodName,
  getAvailablePaymentMethods,
  getPaymentPreparationNotes,
  generatePaymentSummary
}; 