/**
 * مدير الإشارات المرجعية - ملف JavaScript الرئيسي
 * يتعامل مع جميع وظائف واجهة المستخدم المتعلقة بالإشارات المرجعية
 */

document.addEventListener('DOMContentLoaded', function() {
  // المتغيرات العامة
  const bookmarkForm = document.getElementById('bookmarkForm');
  const bookmarkItems = document.getElementById('bookmarkItems');
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearch');
  const filterButtons = document.querySelectorAll('[data-filter]');
  const toastContainer = document.getElementById('toastContainer');
  
  // تهيئة واجهة المستخدم
  initUI();
  
  // تحميل الإشارات المرجعية
  loadBookmarks();
  
  /**
   * تهيئة واجهة المستخدم وإعداد مستمعي الأحداث
   */
  function initUI() {
    // إعداد نموذج إضافة إشارة مرجعية
    bookmarkForm.addEventListener('submit', handleFormSubmit);
    
    // إعداد مستمع البحث
    searchInput.addEventListener('input', handleSearch);
    clearSearchBtn.addEventListener('click', clearSearch);
    
    // إعداد أزرار الفلترة
    filterButtons.forEach(button => {
      button.addEventListener('click', handleFilter);
    });
  }
  
  /**
   * تحميل الإشارات المرجعية من الخادم
   */
  function loadBookmarks() {
    showLoading();
    
    fetch('/api/bookmarks')
      .then(response => {
        if (!response.ok) {
          throw new Error('فشل في تحميل الإشارات المرجعية');
        }
        return response.json();
      })
      .then(data => {
        if (data.success) {
          renderBookmarks(data.bookmarks);
          initDragAndDrop();
        } else {
          showToast('خطأ', 'فشل في تحميل الإشارات المرجعية', 'danger');
        }
      })
      .catch(error => {
        showToast('خطأ', error.message, 'danger');
        console.error('Error loading bookmarks:', error);
      })
      .finally(() => {
        hideLoading();
      });
  }
  
  /**
   * معالجة نموذج إضافة إشارة مرجعية
   * @param {Event} event 
   */
  function handleFormSubmit(event) {
    event.preventDefault();
    
    const siteName = document.getElementById('siteName').value.trim();
    const siteURL = document.getElementById('siteURL').value.trim();
    const siteDesc = document.getElementById('siteDesc').value.trim();
    
    // التحقق من صحة المدخلات
    if (!siteName || !siteURL) {
      showToast('تنبيه', 'الرجاء إدخال اسم الموقع والرابط', 'warning');
      return;
    }
    
    // إضافة بروتوكول للرابط إذا لم يكن موجودًا
    let url = siteURL;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    // تحضير بيانات الإشارة المرجعية
    const bookmark = {
      name: siteName,
      url: url,
      description: siteDesc,
      favorite: false
    };
    
    // إرسال البيانات إلى الخادم
    saveBookmark(bookmark);
  }
  
  /**
   * حفظ إشارة مرجعية جديدة على الخادم
   * @param {Object} bookmark 
   */
  function saveBookmark(bookmark) {
    const submitButton = document.getElementById('submitButton');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> جاري الحفظ...';
    
    fetch('/api/bookmarks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bookmark)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('فشل في حفظ الإشارة المرجعية');
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        // إضافة الإشارة المرجعية الجديدة إلى القائمة
        const newBookmarkHtml = createBookmarkItem(data.bookmark);
        bookmarkItems.insertAdjacentHTML('afterbegin', newBookmarkHtml);
        
        // تحديث الإشارة المرجعية الجديدة للتحريك والسحب
        const newItem = bookmarkItems.querySelector(`[data-id="${data.bookmark.id}"]`);
        if (newItem) {
          newItem.classList.add('new-item');
          setupBookmarkItem(newItem);
        }
        
        // إعادة تهيئة ميزة السحب والإفلات
        initDragAndDrop();
        
        // إفراغ النموذج
        bookmarkForm.reset();
        
        showToast('نجاح', 'تم إضافة الإشارة المرجعية بنجاح', 'success');
      } else {
        showToast('خطأ', 'فشل في حفظ الإشارة المرجعية', 'danger');
      }
    })
    .catch(error => {
      showToast('خطأ', error.message, 'danger');
      console.error('Error saving bookmark:', error);
    })
    .finally(() => {
      submitButton.disabled = false;
      submitButton.innerHTML = '<i class="fas fa-save me-2"></i> أضف الإشارة المرجعية';
    });
  }
  
  /**
   * عرض الإشارات المرجعية في واجهة المستخدم
   * @param {Array} bookmarks 
   */
  function renderBookmarks(bookmarks) {
    if (!bookmarks || bookmarks.length === 0) {
      bookmarkItems.innerHTML = '<div class="text-center p-4 text-muted">لا توجد إشارات مرجعية. أضف الإشارات المرجعية الخاصة بك باستخدام النموذج أعلاه.</div>';
      return;
    }
    
    // ترتيب الإشارات المرجعية حسب الموضع
    bookmarks.sort((a, b) => a.position - b.position);
    
    let html = '';
    bookmarks.forEach(bookmark => {
      html += createBookmarkItem(bookmark);
    });
    
    bookmarkItems.innerHTML = html;
    
    // إعداد مستمعي الأحداث لكل عنصر
    const items = bookmarkItems.querySelectorAll('.list-group-item');
    items.forEach(item => {
      setupBookmarkItem(item);
    });
  }
  
  /**
   * إنشاء عنصر HTML لإشارة مرجعية
   * @param {Object} bookmark 
   * @returns {String}
   */
  function createBookmarkItem(bookmark) {
    const description = bookmark.description 
      ? `<div class="note"><i class="fas fa-info-circle me-1"></i>${bookmark.description}</div>` 
      : '';
      
    return `
      <li class="list-group-item ${bookmark.favorite ? 'favorite-item' : ''}" data-id="${bookmark.id}">
        <div class="bookmark-content">
          <i class="fas fa-grip-lines drag-handle"></i>
          <div class="bookmark-text">
            <a href="${bookmark.url}" target="_blank" class="bookmark-link">
              ${bookmark.name}
            </a>
            ${description}
          </div>
        </div>
        <div class="bookmark-actions">
          <button class="star-btn ${bookmark.favorite ? 'active' : ''}" title="${bookmark.favorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}">
            <i class="fas fa-star"></i>
          </button>
          <button class="btn btn-sm btn-outline-secondary edit-btn" title="تعديل">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger delete-btn" title="حذف">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </li>
    `;
  }
  
  /**
   * إعداد مستمعي الأحداث لعنصر إشارة مرجعية
   * @param {HTMLElement} item 
   */
  function setupBookmarkItem(item) {
    const id = parseInt(item.dataset.id);
    
    // زر النجمة (المفضلة)
    const starBtn = item.querySelector('.star-btn');
    if (starBtn) {
      starBtn.addEventListener('click', () => toggleFavorite(id, starBtn, item));
    }
    
    // زر التعديل
    const editBtn = item.querySelector('.edit-btn');
    if (editBtn) {
      editBtn.addEventListener('click', () => editBookmark(id));
    }
    
    // زر الحذف
    const deleteBtn = item.querySelector('.delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => confirmDelete(id, item));
    }
  }
  
  /**
   * تأكيد حذف إشارة مرجعية
   * @param {Number} id 
   * @param {HTMLElement} item 
   */
  function confirmDelete(id, item) {
    // إنشاء نافذة تأكيد منبثقة
    const modalHtml = `
      <div class="modal fade" id="deleteConfirmModal" tabindex="-1" aria-labelledby="deleteConfirmModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header bg-danger text-white">
              <h5 class="modal-title" id="deleteConfirmModalLabel">تأكيد الحذف</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="إغلاق"></button>
            </div>
            <div class="modal-body">
              <p>هل أنت متأكد من أنك تريد حذف هذه الإشارة المرجعية؟</p>
              <p class="text-muted small">لا يمكن التراجع عن هذا الإجراء.</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
              <button type="button" class="btn btn-danger" id="confirmDeleteBtn">
                <i class="fas fa-trash me-1"></i> نعم، احذف
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // إضافة النافذة المنبثقة إلى المستند
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // إظهار النافذة المنبثقة
    const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    modal.show();
    
    // معالجة حدث التأكيد
    document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
      deleteBookmark(id, item);
      modal.hide();
    });
    
    // التنظيف بعد إغلاق النافذة
    document.getElementById('deleteConfirmModal').addEventListener('hidden.bs.modal', function() {
      this.remove();
    });
  }
  
  /**
   * تبديل حالة المفضلة لإشارة مرجعية
   * @param {Number} id 
   * @param {HTMLElement} starBtn 
   * @param {HTMLElement} item 
   */
  function toggleFavorite(id, starBtn, item) {
    fetch(`/api/bookmarks/favorite/${id}`, {
      method: 'POST'
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('فشل في تحديث حالة المفضلة');
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        // تحديث واجهة المستخدم
        const isFavorite = data.bookmark.favorite;
        starBtn.classList.toggle('active', isFavorite);
        starBtn.title = isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة';
        item.classList.toggle('favorite-item', isFavorite);
        
        showToast('نجاح', 
          isFavorite 
            ? 'تمت إضافة الإشارة المرجعية إلى المفضلة' 
            : 'تمت إزالة الإشارة المرجعية من المفضلة', 
          'success');
      } else {
        showToast('خطأ', 'فشل في تحديث حالة المفضلة', 'danger');
      }
    })
    .catch(error => {
      showToast('خطأ', error.message, 'danger');
      console.error('Error toggling favorite:', error);
    });
  }
  
  /**
   * تعديل إشارة مرجعية
   * @param {Number} id 
   */
  function editBookmark(id) {
    // الحصول على بيانات الإشارة المرجعية
    fetch(`/api/bookmarks/${id}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('فشل في جلب بيانات الإشارة المرجعية');
        }
        return response.json();
      })
      .then(data => {
        if (data.success) {
          const bookmark = data.bookmark;
          
          // إنشاء مودال التعديل
          const modalHtml = `
            <div class="modal fade" id="editModal" tabindex="-1" aria-labelledby="editModalLabel" aria-hidden="true">
              <div class="modal-dialog">
                <div class="modal-content">
                  <div class="modal-header bg-primary text-white">
                    <h5 class="modal-title" id="editModalLabel">تعديل الإشارة المرجعية</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="إغلاق"></button>
                  </div>
                  <div class="modal-body">
                    <form id="editForm">
                      <div class="mb-3">
                        <label for="editName" class="form-label">اسم الموقع</label>
                        <input type="text" class="form-control" id="editName" value="${bookmark.name}" required>
                      </div>
                      <div class="mb-3">
                        <label for="editURL" class="form-label">رابط الموقع</label>
                        <input type="text" class="form-control" id="editURL" value="${bookmark.url}" required>
                      </div>
                      <div class="mb-3">
                        <label for="editDescription" class="form-label">وصف الموقع</label>
                        <textarea class="form-control" id="editDescription" rows="2">${bookmark.description || ''}</textarea>
                      </div>
                      <div class="form-check mb-3">
                        <input class="form-check-input" type="checkbox" id="editFavorite" ${bookmark.favorite ? 'checked' : ''}>
                        <label class="form-check-label" for="editFavorite">
                          إضافة إلى المفضلة
                        </label>
                      </div>
                    </form>
                  </div>
                  <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
                    <button type="button" class="btn btn-primary" id="saveEditBtn">
                      <i class="fas fa-save me-1"></i> حفظ التغييرات
                    </button>
                  </div>
                </div>
              </div>
            </div>
          `;
          
          // إضافة المودال إلى الصفحة
          document.body.insertAdjacentHTML('beforeend', modalHtml);
          
          // إظهار المودال
          const modal = new bootstrap.Modal(document.getElementById('editModal'));
          modal.show();
          
          // معالجة حدث الحفظ
          document.getElementById('saveEditBtn').addEventListener('click', () => {
            const updatedBookmark = {
              name: document.getElementById('editName').value.trim(),
              url: document.getElementById('editURL').value.trim(),
              description: document.getElementById('editDescription').value.trim(),
              favorite: document.getElementById('editFavorite').checked
            };
            
            // تحديث الإشارة المرجعية
            updateBookmark(id, updatedBookmark, modal);
          });
          
          // إزالة المودال من DOM عند إغلاقه
          const editModal = document.getElementById('editModal');
          editModal.addEventListener('hidden.bs.modal', () => {
            editModal.remove();
          });
        } else {
          showToast('خطأ', 'فشل في جلب بيانات الإشارة المرجعية', 'danger');
        }
      })
      .catch(error => {
        showToast('خطأ', error.message, 'danger');
        console.error('Error getting bookmark details:', error);
      });
  }
  
  /**
   * تحديث إشارة مرجعية
   * @param {Number} id 
   * @param {Object} bookmark 
   * @param {Object} modal 
   */
  function updateBookmark(id, bookmark, modal) {
    fetch(`/api/bookmarks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bookmark)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('فشل في تحديث الإشارة المرجعية');
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        // تحديث عنصر القائمة
        const item = document.querySelector(`.list-group-item[data-id="${id}"]`);
        if (item) {
          const updatedHtml = createBookmarkItem(data.bookmark);
          item.outerHTML = updatedHtml;
          
          // إعادة إعداد مستمعي الأحداث
          const newItem = document.querySelector(`.list-group-item[data-id="${id}"]`);
          if (newItem) {
            setupBookmarkItem(newItem);
            newItem.classList.add('new-item');
          }
        }
        
        // إغلاق المودال
        modal.hide();
        
        showToast('نجاح', 'تم تحديث الإشارة المرجعية بنجاح', 'success');
      } else {
        showToast('خطأ', 'فشل في تحديث الإشارة المرجعية', 'danger');
      }
    })
    .catch(error => {
      showToast('خطأ', error.message, 'danger');
      console.error('Error updating bookmark:', error);
    });
  }
  
  /**
   * حذف إشارة مرجعية
   * @param {Number} id 
   * @param {HTMLElement} item 
   */
  function deleteBookmark(id, item) {
    fetch(`/api/bookmarks/${id}`, {
      method: 'DELETE'
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('فشل في حذف الإشارة المرجعية');
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        // إزالة العنصر من واجهة المستخدم مع تأثير
        item.style.transition = 'all 0.3s ease';
        item.style.height = `${item.offsetHeight}px`;
        item.style.opacity = '1';
        
        setTimeout(() => {
          item.style.height = '0';
          item.style.opacity = '0';
          item.style.padding = '0';
          item.style.margin = '0';
          item.style.overflow = 'hidden';
          
          setTimeout(() => {
            item.remove();
            
            // تحديث القائمة إذا كانت فارغة
            if (bookmarkItems.children.length === 0) {
              bookmarkItems.innerHTML = '<div class="text-center p-4 text-muted">لا توجد إشارات مرجعية. أضف الإشارات المرجعية الخاصة بك باستخدام النموذج أعلاه.</div>';
            }
          }, 300);
        }, 10);
        
        showToast('نجاح', 'تم حذف الإشارة المرجعية بنجاح', 'success');
      } else {
        showToast('خطأ', 'فشل في حذف الإشارة المرجعية', 'danger');
      }
    })
    .catch(error => {
      showToast('خطأ', error.message, 'danger');
      console.error('Error deleting bookmark:', error);
    });
  }
  
  /**
   * تهيئة ميزة السحب والإفلات
   */
  function initDragAndDrop() {
    const items = bookmarkItems.querySelectorAll('.list-group-item');
    
    // إزالة مستمعي الأحداث السابقة وإعادة تهيئة للعناصر
    items.forEach(item => {
      // إلغاء خاصية السحب السابقة
      item.draggable = false;
      
      // إزالة مستمعات الأحداث السابقة
      item.removeEventListener('dragstart', handleDragStart);
      item.removeEventListener('dragover', handleDragOver);
      item.removeEventListener('dragenter', handleDragEnter);
      item.removeEventListener('dragleave', handleDragLeave);
      item.removeEventListener('drop', handleDrop);
      item.removeEventListener('dragend', handleDragEnd);
    });
    
    // إذا لم تكن هناك عناصر، لا داعي للاستمرار
    if (items.length <= 1) return;
    
    // إعداد العناصر للسحب والإفلات
    items.forEach(item => {
      const dragHandle = item.querySelector('.drag-handle');
      if (dragHandle) {
        item.setAttribute('draggable', 'true');
        
        // إعداد مستمعي أحداث الماوس واللمس
        dragHandle.addEventListener('mousedown', function() {
          item.draggable = true;
        });
        dragHandle.addEventListener('touchstart', function() {
          item.draggable = true;
        });
        
        dragHandle.addEventListener('mouseup', function() {
          item.draggable = false;
        });
        dragHandle.addEventListener('touchend', function() {
          item.draggable = false;
        });
      }
      
      // مستمعي أحداث السحب والإفلات
      item.addEventListener('dragstart', handleDragStart);
      item.addEventListener('dragover', handleDragOver);
      item.addEventListener('dragenter', handleDragEnter);
      item.addEventListener('dragleave', handleDragLeave);
      item.addEventListener('drop', handleDrop);
      item.addEventListener('dragend', handleDragEnd);
    });
  }
  
  /**
   * معالجة بدء السحب
   * @param {DragEvent} e 
   */
  function handleDragStart(e) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.getAttribute('data-id'));
    
    // إضافة صنف للعنصر أثناء السحب
    this.classList.add('dragging');
    
    // حفظ مرجع للعنصر المسحوب
    window.draggedItem = this;
  }
  
  /**
   * معالجة الإفلات فوق عنصر
   * @param {DragEvent} e 
   */
  function handleDragOver(e) {
    if (e.preventDefault) {
      e.preventDefault(); // السماح بالإفلات
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
  }
  
  /**
   * معالجة دخول منطقة الإفلات
   * @param {DragEvent} e 
   */
  function handleDragEnter(e) {
    this.classList.add('drag-over');
  }
  
  /**
   * معالجة مغادرة منطقة الإفلات
   */
  function handleDragLeave() {
    this.classList.remove('drag-over');
  }
  
  /**
   * معالجة الإفلات
   * @param {DragEvent} e 
   */
  function handleDrop(e) {
    e.stopPropagation();
    e.preventDefault();
    
    // إزالة صنف الإفلات
    this.classList.remove('drag-over');
    
    // الحصول على معرف العنصر المسحوب
    const draggedId = e.dataTransfer.getData('text/plain');
    const draggedItem = window.draggedItem;
    
    // إذا كان العنصر المسحوب هو نفسه العنصر الذي تم الإفلات عليه، فلا داعي لفعل أي شيء
    if (draggedItem === this) return false;
    
    // إعادة ترتيب العناصر في DOM
    const list = bookmarkItems;
    
    // تحديد نقطة الإدراج (قبل أو بعد العنصر المستهدف)
    const dropTargetRect = this.getBoundingClientRect();
    const dropY = e.clientY;
    const isAfter = dropY > (dropTargetRect.top + dropTargetRect.height / 2);
    
    // عملية الإدراج مع تأثير مرئي
    draggedItem.classList.add('drag-transition');
    this.classList.add('drag-transition');
    
    if (isAfter) {
      list.insertBefore(draggedItem, this.nextSibling);
    } else {
      list.insertBefore(draggedItem, this);
    }
    
    // إظهار تأثير بصري للإفلات
    setTimeout(() => {
      draggedItem.classList.add('drag-success');
      
      setTimeout(() => {
        draggedItem.classList.remove('drag-success');
        draggedItem.classList.remove('drag-transition');
        this.classList.remove('drag-transition');
      }, 500);
    }, 10);
    
    // تحديث الترتيب على الخادم
    updateBookmarkOrder();
    
    return false;
  }
  
  /**
   * معالجة نهاية السحب
   */
  function handleDragEnd() {
    // إزالة صنف السحب
    this.classList.remove('dragging');
    
    // إلغاء المرجع العالمي
    window.draggedItem = null;
    
    // إزالة صنف الإفلات من جميع العناصر
    const items = bookmarkItems.querySelectorAll('.list-group-item');
    items.forEach(item => {
      item.classList.remove('drag-over');
    });
  }
  
  /**
   * تحديث ترتيب الإشارات المرجعية على الخادم
   */
  function updateBookmarkOrder() {
    const items = bookmarkItems.querySelectorAll('.list-group-item');
    const order = Array.from(items).map(item => parseInt(item.getAttribute('data-id')));
    
    // إرسال الترتيب الجديد إلى الخادم
    fetch('/api/bookmarks/reorder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ order: order })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('فشل في تحديث ترتيب الإشارات المرجعية');
      }
      return response.json();
    })
    .then(data => {
      if (!data.success) {
        showToast('خطأ', 'فشل في تحديث ترتيب الإشارات المرجعية', 'danger');
      }
    })
    .catch(error => {
      console.error('Error updating order:', error);
      showToast('خطأ', error.message, 'danger');
    });
  }
  
  /**
   * معالجة البحث في الإشارات المرجعية
   */
  function handleSearch() {
    const searchText = searchInput.value.trim().toLowerCase();
    const items = bookmarkItems.querySelectorAll('.list-group-item');
    let foundItems = 0;
    
    // عرض زر المسح إذا كان هناك نص في حقل البحث
    if (searchText) {
      clearSearchBtn.style.visibility = 'visible';
    } else {
      clearSearchBtn.style.visibility = 'hidden';
    }
    
    // فلترة العناصر حسب النص
    items.forEach(item => {
      const name = item.querySelector('.bookmark-link').textContent.toLowerCase();
      const description = item.querySelector('.note') ? item.querySelector('.note').textContent.toLowerCase() : '';
      
      if (name.includes(searchText) || description.includes(searchText)) {
        item.style.display = '';
        foundItems++;
      } else {
        item.style.display = 'none';
      }
    });
    
    // عرض رسالة إذا لم يتم العثور على نتائج
    if (foundItems === 0 && searchText) {
      const noResults = document.querySelector('.no-results');
      if (!noResults) {
        bookmarkItems.insertAdjacentHTML('beforeend', `
          <div class="text-center p-4 text-muted no-results">
            <i class="fas fa-search fa-2x mb-2"></i>
            <p>لم يتم العثور على نتائج تطابق "${searchText}"</p>
          </div>
        `);
      }
    } else {
      const noResults = document.querySelector('.no-results');
      if (noResults) {
        noResults.remove();
      }
    }
  }
  
  /**
   * مسح البحث وإعادة عرض جميع الإشارات المرجعية
   */
  function clearSearch() {
    searchInput.value = '';
    clearSearchBtn.style.visibility = 'hidden';
    
    const items = bookmarkItems.querySelectorAll('.list-group-item');
    items.forEach(item => {
      item.style.display = '';
    });
    
    const noResults = document.querySelector('.no-results');
    if (noResults) {
      noResults.remove();
    }
  }
  
  /**
   * معالجة فلترة الإشارات المرجعية (الكل/المفضلة)
   * @param {Event} event 
   */
  function handleFilter(event) {
    const filterType = event.target.getAttribute('data-filter');
    
    // تحديث حالة الأزرار
    filterButtons.forEach(btn => {
      btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // فلترة العناصر
    const items = bookmarkItems.querySelectorAll('.list-group-item');
    items.forEach(item => {
      if (filterType === 'all') {
        item.style.display = '';
      } else if (filterType === 'favorites') {
        if (item.classList.contains('favorite-item')) {
          item.style.display = '';
        } else {
          item.style.display = 'none';
        }
      }
    });
    
    // عرض رسالة إذا لم يكن هناك عناصر مطابقة للفلتر
    const visibleItems = Array.from(items).filter(item => item.style.display !== 'none');
    if (visibleItems.length === 0) {
      const noFavorites = document.querySelector('.no-favorites');
      if (!noFavorites) {
        bookmarkItems.insertAdjacentHTML('beforeend', `
          <div class="text-center p-4 text-muted no-favorites">
            <i class="fas fa-star fa-2x mb-2"></i>
            <p>لا توجد إشارات مرجعية في المفضلة.</p>
          </div>
        `);
      }
    } else {
      const noFavorites = document.querySelector('.no-favorites');
      if (noFavorites) {
        noFavorites.remove();
      }
    }
  }
  
  /**
   * إظهار مؤشر التحميل
   */
  function showLoading() {
    bookmarkItems.innerHTML = `
      <div class="text-center p-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">جاري التحميل...</span>
        </div>
        <p class="mt-2">جاري تحميل الإشارات المرجعية...</p>
      </div>
    `;
  }
  
  /**
   * إخفاء مؤشر التحميل
   */
  function hideLoading() {
    // سيتم استبدال هذا تلقائيًا من خلال renderBookmarks
  }
  
  /**
   * عرض رسالة توست للمستخدم
   * @param {String} title 
   * @param {String} message 
   * @param {String} type 
   */
  function showToast(title, message, type = 'success') {
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
    const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
    toast.show();
    
    // إزالة التوست من DOM عند إخفائه
    toastElement.addEventListener('hidden.bs.toast', function() {
      this.remove();
    });
  }
});