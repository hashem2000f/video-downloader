/**
 * ملف جافاسكريبت لإدارة عملية التحميل والتقدم
 */

// عرض وإخفاء مؤشرات التحميل
function showLoadingIndicator() {
    const progressContainer = document.querySelector('.progress-container');
    const loader = document.querySelector('.loader');
    const downloadStatus = document.getElementById('downloadStatus');
    const progressBar = document.querySelector('.progress-bar');
    
    progressContainer.style.display = 'block';
    loader.style.display = 'block';
    downloadStatus.textContent = 'جاري تحميل المحتوى...';
    progressBar.style.width = '10%';
    
    // محاكاة تقدم التحميل
    simulateProgress();
}

function hideLoadingIndicator() {
    const progressContainer = document.querySelector('.progress-container');
    const loader = document.querySelector('.loader');
    const progressBar = document.querySelector('.progress-bar');
    
    progressContainer.style.display = 'none';
    loader.style.display = 'none';
    progressBar.style.width = '0%';
}

function updateLoadingStatus(message, progress) {
    const downloadStatus = document.getElementById('downloadStatus');
    const progressBar = document.querySelector('.progress-bar');
    
    downloadStatus.textContent = message;
    progressBar.style.width = progress + '%';
}

// محاكاة تقدم التحميل
function simulateProgress() {
    const progressBar = document.querySelector('.progress-bar');
    let width = 10;
    
    const interval = setInterval(() => {
        if (width >= 60) {
            clearInterval(interval);
            return;
        }
        width += 5;
        progressBar.style.width = width + '%';
    }, 500);
}