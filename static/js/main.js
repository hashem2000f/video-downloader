/**
 * ملف JavaScript الرئيسي
 * التعامل مع واجهة المستخدم وطلبات التحميل
 */

document.addEventListener('DOMContentLoaded', function() {
    // العناصر المستخدمة عبر التطبيق
    const platformButtons = document.querySelectorAll('.platform-btn');
    const platformInput = document.getElementById('platform');
    const downloadForm = document.getElementById('downloadForm');
    const urlInput = document.getElementById('url');
    
    // إعداد الأحداث للصفحة
    setupEvents();
    
    // إعداد أحداث الصفحة
    function setupEvents() {
        // أحداث أزرار المنصات
        platformButtons.forEach(button => {
            button.addEventListener('click', handlePlatformSelection);
        });
        
        // حدث إرسال النموذج
        downloadForm.addEventListener('submit', handleFormSubmit);
    }
    
    // معالجة اختيار المنصة
    function handlePlatformSelection() {
        // إزالة الفئة النشطة من جميع الأزرار
        platformButtons.forEach(btn => btn.classList.remove('active'));
        // إضافة الفئة النشطة للزر المحدد
        this.classList.add('active');
        // تحديث قيمة المنصة المخفية
        platformInput.value = this.getAttribute('data-platform');
        
        // تحديث نص الرابط حسب المنصة
        updatePlaceholder(platformInput.value);
    }
    
    // تحديث النص الإرشادي حسب المنصة
    function updatePlaceholder(platform) {
        switch(platform) {
            case 'youtube':
                urlInput.placeholder = "https://www.youtube.com/watch?v=...";
                break;
            case 'facebook':
                urlInput.placeholder = "https://www.facebook.com/watch?v=...";
                break;
            case 'instagram':
                urlInput.placeholder = "https://www.instagram.com/p/...";
                break;
            case 'tiktok':
                urlInput.placeholder = "https://www.tiktok.com/@user/video/...";
                break;
        }
    }
    
    // معالجة إرسال النموذج
    function handleFormSubmit(e) {
        e.preventDefault();
        
        // التحقق من صحة الرابط
        if (!validateUrl(urlInput.value)) {
            showToast('خطأ', 'يرجى إدخال رابط صحيح', 'danger');
            return;
        }
        
        // إظهار حالة التحميل
        showLoadingIndicator();
        
        // إنشاء كائن FormData
        const formData = new FormData(downloadForm);
        
        // إرسال الطلب
        fetch('/download', {
            method: 'POST',
            body: formData
        })
        .then(handleResponse)
        .then(downloadFile)
        .catch(handleError);
    }
    
    // التحقق من صحة الرابط
    function validateUrl(url) {
        if (!url) return false;
        
        try {
            new URL(url);
            return true;
        } catch (e) {
            return false;
        }
    }
    
    // معالجة الاستجابة من الخادم
    function handleResponse(response) {
        updateLoadingStatus('جاري معالجة الملف...', 60);
        
        if (response.ok) {
            // للملفات القابلة للتنزيل
            if (response.headers.get('Content-Type') === 'application/json') {
                // في حالة استجابة JSON (خطأ)
                return response.json().then(data => {
                    throw new Error(data.error || 'حدث خطأ أثناء التحميل');
                });
            }
            
            // تنزيل الملف مباشرة
            updateLoadingStatus('جاري تنزيل الملف...', 80);
            return response.blob();
        } else {
            // معالجة الخطأ
            return response.json().then(data => {
                throw new Error(data.error || 'حدث خطأ أثناء التحميل');
            });
        }
    }
    
    // تنزيل الملف
    function downloadFile(blob) {
        // إنشاء رابط للتنزيل
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        // تحديد اسم الملف
        let filename = 'downloaded_file';
        const contentType = blob.type;
        
        // تحديد امتداد الملف بناءً على نوع المحتوى
        if (contentType.includes('video')) {
            filename += '.mp4';
        } else if (contentType.includes('audio')) {
            filename += '.mp3';
        }
        
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        
        // إخفاء حالة التحميل وعرض رسالة النجاح
        hideLoadingIndicator();
        
        showToast('تم التحميل بنجاح', 'تم تنزيل الملف بنجاح', 'success');
    }
    
    // معالجة الأخطاء
    function handleError(error) {
        console.error('Error:', error);
        hideLoadingIndicator();
        
        showToast('خطأ', error.message, 'danger');
    }
});