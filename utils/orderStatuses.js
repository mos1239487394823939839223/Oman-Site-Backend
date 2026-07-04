const ORDER_STATUSES = [
    { value: 'pending', labelEn: 'Pending', labelAr: 'قيد الانتظار' },
    { value: 'confirmed', labelEn: 'Confirmed', labelAr: 'مؤكد' },
    { value: 'processing', labelEn: 'Processing', labelAr: 'جاري التجهيز' },
    { value: 'shipped', labelEn: 'Shipped', labelAr: 'تم الشحن' },
    { value: 'delivered', labelEn: 'Delivered', labelAr: 'تم التسليم' },
    { value: 'cancelled', labelEn: 'Cancelled', labelAr: 'ملغي' },
];

const ORDER_STATUS_VALUES = ORDER_STATUSES.map((s) => s.value);

module.exports = { ORDER_STATUSES, ORDER_STATUS_VALUES };
