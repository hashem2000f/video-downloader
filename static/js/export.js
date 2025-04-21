/**
 * ملف JavaScript المسؤول عن وظائف تصدير الإشارات المرجعية
 * يتعامل مع تصدير البيانات كصورة أو ملف PDF
 */

document.addEventListener('DOMContentLoaded', function() {
  // المتغيرات
  const exportModal = document.getElementById('exportModal');
  const exportImageBtn = document.getElementById('exportImage');
  const exportPDFBtn = document.getElementById('exportPDF');
  const exportPreviewContainer = document.getElementById('exportPreviewContainer');
  const exportPreview = document.getElementById('exportPreview');
  
  // إعداد مستمعي الأحداث
  if (exportModal) {
    exportModal.addEventListener('show.bs.modal', showExportPreview);
    
    if (exportImageBtn) {
      exportImageBtn.addEventListener('click', exportAsImage);
    }
    
    if (exportPDFBtn) {
      exportPDFBtn.addEventListener('click', exportAsPDF);
    }
  }
  
  /**
   * إنشاء هيكل جدول الإشارات المرجعية للتصدير
   * @returns {Promise<string>} كود HTML للجدول
   */
  async function createBookmarkTable() {
    try {
      // جلب بيانات الإشارات المرجعية من الخادم
      const response = await fetch('/api/bookmarks');
      if (!response.ok) {
        throw new Error('فشل في جلب بيانات الإشارات المرجعية');
      }
      
      const data = await response.json();
      if (!data.success || !data.bookmarks || data.bookmarks.length === 0) {
        return '<div class="alert alert-info">لا توجد إشارات مرجعية للتصدير.</div>';
      }
      
      // ترتيب الإشارات المرجعية حسب المفضلة ثم حسب الموضع
      const bookmarks = [...data.bookmarks];
      bookmarks.sort((a, b) => {
        if (a.favorite && !b.favorite) return -1;
        if (!a.favorite && b.favorite) return 1;
        return a.position - b.position;
      });
      
      // بناء الجدول
      let tableHtml = `
        <table class="export-preview-table">
          <thead>
            <tr>
              <th style="width: 40px;">#</th>
              <th style="width: 50px;">المفضلة</th>
              <th>اسم الموقع</th>
              <th>الوصف</th>
              <th>الرابط</th>
            </tr>
          </thead>
          <tbody>
      `;
      
      bookmarks.forEach((bookmark, index) => {
        const favoriteIcon = bookmark.favorite 
          ? '<i class="fas fa-star text-warning"></i>' 
          : '<i class="far fa-star text-muted"></i>';
        
        // اقتطاع الروابط الطويلة لجعلها أكثر قابلية للعرض
        let displayUrl = bookmark.url;
        if (displayUrl.length > 40) {
          displayUrl = displayUrl.substring(0, 37) + '...';
        }
        
        tableHtml += `
          <tr>
            <td>${index + 1}</td>
            <td class="text-center">${favoriteIcon}</td>
            <td>${bookmark.name}</td>
            <td>${bookmark.description || '-'}</td>
            <td><a href="${bookmark.url}" target="_blank">${displayUrl}</a></td>
          </tr>
        `;
      });
      
      tableHtml += `
          </tbody>
        </table>
      `;
      
      return tableHtml;
    } catch (error) {
      console.error('خطأ في إنشاء جدول الإشارات المرجعية:', error);
      return `<div class="alert alert-danger">حدث خطأ أثناء تحضير البيانات: ${error.message}</div>`;
    }
  }
  
  /**
   * تهيئة الموديال عند فتحه
   */
  function showExportPreview() {
    // لا نقوم بإظهار المعاينة
  }
  
  /**
   * تصدير الإشارات المرجعية كصورة
   */
  function exportAsImage() {
    showToast('معالجة', 'جاري تحضير الصورة...', 'info');
    
    // جلب بيانات الإشارات المرجعية
    fetch('/api/bookmarks')
      .then(response => {
        if (!response.ok) {
          throw new Error('فشل في جلب بيانات الإشارات المرجعية');
        }
        return response.json();
      })
      .then(data => {
        if (!data.success || !data.bookmarks || data.bookmarks.length === 0) {
          showToast('تنبيه', 'لا توجد إشارات مرجعية للتصدير', 'warning');
          return;
        }
        
        // ترتيب الإشارات المرجعية
        const bookmarks = [...data.bookmarks];
        bookmarks.sort((a, b) => {
          if (a.favorite && !b.favorite) return -1;
          if (!a.favorite && b.favorite) return 1;
          return a.position - b.position;
        });
        
        // إنشاء عنصر محتوى للتصدير
        const content = document.createElement('div');
        content.style.padding = '20px';
        content.style.background = 'white';
        content.style.width = '800px';
        content.style.color = 'black';
        
        // إنشاء جدول للتصدير
        let tableHtml = `
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="margin-bottom: 5px;">الإشارات المرجعية</h2>
            <p style="color: #666;">${new Date().toLocaleDateString('ar-SA')}</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr>
                <th style="border: 1px solid #dee2e6; padding: 8px; text-align: right; background-color: #f8f9fa; font-weight: bold;">#</th>
                <th style="border: 1px solid #dee2e6; padding: 8px; text-align: right; background-color: #f8f9fa; font-weight: bold;">المفضلة</th>
                <th style="border: 1px solid #dee2e6; padding: 8px; text-align: right; background-color: #f8f9fa; font-weight: bold;">اسم الموقع</th>
                <th style="border: 1px solid #dee2e6; padding: 8px; text-align: right; background-color: #f8f9fa; font-weight: bold;">الوصف</th>
                <th style="border: 1px solid #dee2e6; padding: 8px; text-align: right; background-color: #f8f9fa; font-weight: bold;">الرابط</th>
              </tr>
            </thead>
            <tbody>
        `;
        
        bookmarks.forEach((bookmark, index) => {
          const favoriteIcon = bookmark.favorite 
            ? '★' 
            : '-';
          
          let displayUrl = bookmark.url;
          if (displayUrl.length > 40) {
            displayUrl = displayUrl.substring(0, 37) + '...';
          }
          
          tableHtml += `
            <tr>
              <td style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">${index + 1}</td>
              <td style="border: 1px solid #dee2e6; padding: 8px; text-align: center;">${favoriteIcon}</td>
              <td style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">${bookmark.name}</td>
              <td style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">${bookmark.description || '-'}</td>
              <td style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">${displayUrl}</td>
            </tr>
          `;
        });
        
        tableHtml += `
            </tbody>
          </table>
        `;
        
        content.innerHTML = tableHtml;
        
        // إخفاء العنصر خارج العرض
        document.body.appendChild(content);
        content.style.position = 'absolute';
        content.style.top = '-9999px';
        
        // تصدير كصورة باستخدام html2canvas
        html2canvas(content, {
          scale: 2,
          backgroundColor: 'white'
        }).then(canvas => {
          // مسح العنصر المؤقت
          document.body.removeChild(content);
          
          // تحويل الكانفاس إلى صورة ثم تنزيلها
          const imageURL = canvas.toDataURL('image/png');
          const a = document.createElement('a');
          a.href = imageURL;
          a.download = `الإشارات-المرجعية-${new Date().toLocaleDateString('ar-SA').replace(/\//g, '-')}.png`;
          a.click();
          
          showToast('نجاح', 'تم تصدير الإشارات المرجعية كصورة بنجاح', 'success');
        }).catch(error => {
          console.error('خطأ في تصدير الصورة:', error);
          showToast('خطأ', `فشل في تصدير الصورة: ${error.message}`, 'danger');
        });
      })
      .catch(error => {
        console.error('خطأ في جلب البيانات للتصدير:', error);
        showToast('خطأ', `فشل في جلب البيانات للتصدير: ${error.message}`, 'danger');
      });
  }
  
  /**
   * تصدير الإشارات المرجعية كملف PDF
   */
  function exportAsPDF() {
    showToast('معالجة', 'جاري تحضير ملف PDF...', 'info');
    
    // جلب بيانات الإشارات المرجعية
    fetch('/api/bookmarks')
      .then(response => {
        if (!response.ok) {
          throw new Error('فشل في جلب بيانات الإشارات المرجعية');
        }
        return response.json();
      })
      .then(data => {
        if (!data.success || !data.bookmarks || data.bookmarks.length === 0) {
          showToast('تنبيه', 'لا توجد إشارات مرجعية للتصدير', 'warning');
          return;
        }
        
        // ترتيب الإشارات المرجعية
        const bookmarks = [...data.bookmarks];
        bookmarks.sort((a, b) => {
          if (a.favorite && !b.favorite) return -1;
          if (!a.favorite && b.favorite) return 1;
          return a.position - b.position;
        });
        
        // تحضير البيانات للجدول
        const tableData = [];
        
        // إضافة الصفوف
        bookmarks.forEach((bookmark, index) => {
          const favoriteIcon = bookmark.favorite ? '★' : '-';
          let displayUrl = bookmark.url;
          if (displayUrl.length > 40) {
            displayUrl = displayUrl.substring(0, 37) + '...';
          }
          
          tableData.push([
            (index + 1).toString(),
            favoriteIcon,
            bookmark.name,
            bookmark.description || '-',
            displayUrl
          ]);
        });
        
        // إنشاء ملف PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });
        
        // إضافة العنوان
        doc.setFont('times', 'bold');
        doc.setFontSize(18);
        doc.text('الإشارات المرجعية', doc.internal.pageSize.width - 20, 20, { align: 'right' });
        
        // إضافة التاريخ
        doc.setFont('times', 'normal');
        doc.setFontSize(12);
        doc.text(`تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}`, doc.internal.pageSize.width - 20, 30, { align: 'right' });
        
        // إضافة الجدول
        doc.autoTable({
          startY: 40,
          head: [['#', 'المفضلة', 'اسم الموقع', 'الوصف', 'الرابط']],
          body: tableData,
          theme: 'grid',
          styles: {
            font: 'times',
            fontSize: 10,
            textColor: [0, 0, 0],
            halign: 'right',
            rtl: true
          },
          headStyles: {
            fillColor: [52, 152, 219],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
          },
          alternateRowStyles: {
            fillColor: [240, 240, 240]
          },
          margin: { top: 40 }
        });
        
        // تنزيل الملف
        doc.save(`الإشارات-المرجعية-${new Date().toLocaleDateString('ar-SA').replace(/\//g, '-')}.pdf`);
        
        showToast('نجاح', 'تم تصدير الإشارات المرجعية كملف PDF بنجاح', 'success');
      })
      .catch(error => {
        console.error('خطأ في تصدير ملف PDF:', error);
        showToast('خطأ', `فشل في تصدير ملف PDF: ${error.message}`, 'danger');
      });
  }
  
  /**
   * عرض رسالة توست
   * @param {string} title عنوان الرسالة
   * @param {string} message نص الرسالة
   * @param {string} type نوع الرسالة (success, danger, info, warning)
   */
  function showToast(title, message, type = 'success') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;
    
    const toastId = Date.now();
    const toastHtml = `
      <div id="toast-${toastId}" class="toast align-items-center text-white bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
          <div class="toast-body">
            <strong>${title}</strong>
            <div>${message}</div>
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="إغلاق"></button>
        </div>
      </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    
    const toastElement = document.getElementById(`toast-${toastId}`);
    const toast = new bootstrap.Toast(toastElement, { delay: 5000 });
    toast.show();
    
    // إزالة التوست من DOM عند إخفائه
    toastElement.addEventListener('hidden.bs.toast', function() {
      this.remove();
    });
  }
});