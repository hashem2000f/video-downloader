from flask import Flask, request, jsonify, send_file, render_template
from yt_dlp import YoutubeDL
import os
import uuid

app = Flask(__name__)

# تحديد مسار مجلد التحميل
DOWNLOAD_FOLDER = os.path.join(os.getcwd(), 'downloads')
if not os.path.exists(DOWNLOAD_FOLDER):
    os.makedirs(DOWNLOAD_FOLDER)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/download', methods=['POST'])
def download():
    url = request.form.get('url')
    platform = request.form.get('platform')
    file_type = request.form.get('file_type')

    if not url or not platform:
        return jsonify({'error': 'URL and platform are required'}), 400
    
    # إنشاء معرف فريد للتحميل
    download_id = str(uuid.uuid4())
    download_path = os.path.join(DOWNLOAD_FOLDER, download_id)
    
    # التأكد من وجود المجلد
    if not os.path.exists(download_path):
        os.makedirs(download_path)

    # خيارات التحميل تعتمد على نوع الملف
    if file_type == 'audio':
        ydl_opts = {
            'format': 'bestaudio/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
            'outtmpl': os.path.join(download_path, '%(title)s.%(ext)s'),
        }
    else:  # فيديو
        ydl_opts = {
            'format': 'best',
            'outtmpl': os.path.join(download_path, '%(title)s.%(ext)s'),
        }

    try:
        with YoutubeDL(ydl_opts) as ydl:
            info_dict = ydl.extract_info(url, download=True)
            filename = ydl.prepare_filename(info_dict)
            
            # تعديل الامتداد للملفات الصوتية
            if file_type == 'audio':
                filename = os.path.splitext(filename)[0] + '.mp3'
            
            # الحصول على المسار الكامل للملف
            filepath = os.path.join(download_path, os.path.basename(filename))
            
            # التأكد من وجود الملف
            if not os.path.exists(filepath) and file_type == 'audio':
                # البحث عن ملف mp3 في المجلد
                for file in os.listdir(download_path):
                    if file.endswith('.mp3'):
                        filepath = os.path.join(download_path, file)
                        break
            
            if not os.path.exists(filepath):
                return jsonify({'error': 'File not found after download'}), 500

            # الحصول على اسم الملف الأصلي
            original_filename = os.path.basename(filepath)
            
            # إرسال الملف إلى المستخدم
            return send_file(filepath, 
                             as_attachment=True, 
                             download_name=original_filename)
    except Exception as e:
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500


@app.route('/status/<download_id>', methods=['GET'])
def download_status(download_id):
    """للتحقق من حالة التحميل"""
    download_path = os.path.join(DOWNLOAD_FOLDER, download_id)
    
    if not os.path.exists(download_path):
        return jsonify({'status': 'not_found'})
    
    files = os.listdir(download_path)
    if not files:
        return jsonify({'status': 'processing'})
    
    # التحميل اكتمل، يوجد ملف
    return jsonify({
        'status': 'completed',
        'files': files
    })


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)