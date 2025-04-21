/**
 * ملف جافاسكريبت لإدارة نظام الإشعارات (توست)
 */

// دالة إظهار الإشعارات
function showToast(title, message, type = 'success') {
    const toastContainer = document.querySelector('.toast-container');
    
    // إنشاء عنصر التوست
    const toastElement = document.createElement('div');
    toastElement.className = `toast align-items-center text-white bg-${type} border-0 mb-3`;
    toastElement.setAttribute('role', 'alert');
    toastElement.setAttribute('aria-live', 'assertive');
    toastElement.setAttribute('aria-atomic', 'true');
    
    // محتوى التوست
    toastElement.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <strong>${title}</strong>: ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    // إضافة التوست إلى الحاوية
    toastContainer.appendChild(toastElement);
    
    // تهيئة كائن التوست باستخدام Bootstrap
    const toast = new bootstrap.Toast(toastElement, {
        autohide: true,
        delay: 5000
    });
    
    // عرض التوست
    toast.show();
    
    // حذف التوست من DOM بعد الإخفاء
    toastElement.addEventListener('hidden.bs.toast', function() {
        toastElement.remove();
    });
}