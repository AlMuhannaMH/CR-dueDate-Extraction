// Global variables
let currentLanguage = 'ar';
let extractedData = {};
let extractedText = '';

// Translations
const translations = {
    ar: {
        mainTitle: 'مستخرج النصوص من الصور',
        mainSubtitle: 'تقنية OCR متقدمة لاستخراج النصوص العربية والإنجليزية',
        uploadTitle: 'رفع الملف',
        uploadText: 'اسحب الملف هنا أو انقر للاختيار',
        uploadHint: 'يدعم الصور وملفات PDF',
        orText: 'أو',
        urlPlaceholder: 'أدخل رابط الصورة',
        ocrLangLabel: 'لغة النص المراد استخراجه',
        processBtnText: 'استخراج النص',
        extractedTitle: 'النص المستخرج',
        formDataTitle: 'البيانات المستخرجة',
        langText: 'English',
        processing: 'جاري المعالجة...',
        success: 'تم الاستخراج بنجاح',
        error: 'حدث خطأ',
        selectFile: 'الرجاء اختيار ملف أو إدخال رابط',
        processingPdf: 'جاري معالجة الصفحة',
        ocrError: 'فشل في استخراج النص'
    },
    en: {
        mainTitle: 'OCR Text Extractor',
        mainSubtitle: 'Advanced OCR technology for Arabic and English text extraction',
        uploadTitle: 'Upload File',
        uploadText: 'Drag and drop file here or click to select',
        uploadHint: 'Supports images and PDF files',
        orText: 'OR',
        urlPlaceholder: 'Enter image URL',
        ocrLangLabel: 'Text Language to Extract',
        processBtnText: 'Extract Text',
        extractedTitle: 'Extracted Text',
        formDataTitle: 'Extracted Data',
        langText: 'العربية',
        processing: 'Processing...',
        success: 'Extraction successful',
        error: 'An error occurred',
        selectFile: 'Please select a file or enter a URL',
        processingPdf: 'Processing page',
        ocrError: 'Failed to extract text'
    }
};

// Switch language
function switchLanguage() {
    currentLanguage = currentLanguage === 'ar' ? 'en' : 'ar';
    document.documentElement.lang = currentLanguage;
    document.documentElement.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';
    
    const t = translations[currentLanguage];
    document.getElementById('mainTitle').textContent = t.mainTitle;
    document.getElementById('mainSubtitle').textContent = t.mainSubtitle;
    document.getElementById('uploadTitle').textContent = t.uploadTitle;
    document.getElementById('uploadText').textContent = t.uploadText;
    document.getElementById('uploadHint').textContent = t.uploadHint;
    document.getElementById('orText').textContent = t.orText;
    document.getElementById('urlInput').placeholder = t.urlPlaceholder;
    document.getElementById('ocrLangLabel').innerHTML = `<i class="fas fa-globe"></i> ${t.ocrLangLabel}`;
    document.getElementById('processBtnText').textContent = t.processBtnText;
    document.getElementById('extractedTitle').textContent = t.extractedTitle;
    document.getElementById('formDataTitle').textContent = t.formDataTitle;
    document.getElementById('langText').textContent = t.langText;
}

// Show alert
function showAlert(message, type = 'info') {
    const container = document.getElementById('alertContainer');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    
    const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle';
    alert.innerHTML = `<i class="fas fa-${icon}"></i><span>${message}</span>`;
    
    container.appendChild(alert);
    
    setTimeout(() => {
        alert.style.animation = 'slideOut 0.3s ease-out forwards';
        setTimeout(() => alert.remove(), 300);
    }, 3000);
}

// Set loading state
function setLoading(isLoading) {
    const btn = document.getElementById('processBtn');
    if (isLoading) {
        btn.classList.add('loading');
        btn.disabled = true;
    } else {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
}

// File input handler
document.getElementById('fileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        document.getElementById('fileName').textContent = file.name;
    }
});

// Drag and drop handlers
const uploadArea = document.getElementById('uploadArea');

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'rgba(0, 180, 219, 0.8)';
    uploadArea.style.background = 'rgba(0, 180, 219, 0.1)';
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = '';
    uploadArea.style.background = '';
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '';
    uploadArea.style.background = '';
    
    const file = e.dataTransfer.files[0];
    if (file) {
        document.getElementById('fileInput').files = e.dataTransfer.files;
        document.getElementById('fileName').textContent = file.name;
    }
});

// Convert PDF page to image
async function convertPdfPageToImage(pdfDoc, pageNum) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2.0 });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    await page.render({
        canvasContext: context,
        viewport: viewport
    }).promise;
    
    return canvas.toDataURL('image/png');
}

// Process PDF file
async function processPdfFile(file) {
    const t = translations[currentLanguage];
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;
    
    let allText = '';
    
    for (let i = 1; i <= numPages; i++) {
        showAlert(`${t.processingPdf} ${i}/${numPages}`, 'info');
        const imageData = await convertPdfPageToImage(pdf, i);
        const text = await runOCROnImage(imageData);
        allText += text + '\n\n--- Page ' + i + ' ---\n\n';
    }
    
    return allText;
}

// Run OCR on image
async function runOCROnImage(imageData) {
    const language = document.getElementById('ocrLanguage').value;
    const apiKey = 'K87155442988957';
    
    const formData = new FormData();
    formData.append('base64Image', imageData);
    formData.append('language', language);
    formData.append('apikey', apiKey);
    formData.append('OCREngine', '2');
    
    try {
        const response = await fetch('https://api.ocr.space/parse/image', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.ParsedResults && result.ParsedResults[0]) {
            return result.ParsedResults[0].ParsedText || '';
        }
        return '';
    } catch (error) {
        console.error('OCR Error:', error);
        return '';
    }
}

// Main OCR function
async function runOCR() {
    const t = translations[currentLanguage];
    const fileInput = document.getElementById('fileInput');
    const urlInput = document.getElementById('urlInput');
    const file = fileInput.files[0];
    const url = urlInput.value.trim();
    
    if (!file && !url) {
        showAlert(t.selectFile, 'error');
        return;
    }
    
    setLoading(true);
    showAlert(t.processing, 'info');
    
    try {
        let text = '';
        
        if (file) {
            if (file.type === 'application/pdf') {
                text = await processPdfFile(file);
            } else {
                const reader = new FileReader();
                const imageData = await new Promise((resolve) => {
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsDataURL(file);
                });
                text = await runOCROnImage(imageData);
            }
        } else if (url) {
            const language = document.getElementById('ocrLanguage').value;
            const apiKey = 'K87155442988957';
            
            const formData = new FormData();
            formData.append('url', url);
            formData.append('language', language);
            formData.append('apikey', apiKey);
            formData.append('OCREngine', '2');
            
            const response = await fetch('https://api.ocr.space/parse/image', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.ParsedResults && result.ParsedResults[0]) {
                text = result.ParsedResults[0].ParsedText || '';
            }
        }
        
        if (text) {
            extractedText = text;
            document.getElementById('extractedText').value = text;
            document.getElementById('resultsSection').style.display = 'block';
            
            // Build dynamic JSON
            const jsonData = buildDynamicJson(text);
            if (Object.keys(jsonData).length > 0) {
                extractedData = jsonData;
                renderFormDisplay(jsonData);
                document.getElementById('formDataCard').style.display = 'block';
            } else {
                document.getElementById('formDataCard').style.display = 'none';
            }
            
            showAlert(t.success, 'success');
            
            // Smooth scroll to results
            document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            showAlert(t.ocrError, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert(t.error + ': ' + error.message, 'error');
    } finally {
        setLoading(false);
    }
}

// Normalize Arabic numbers
function normalizeArabicNumbers(text) {
    const arabicNums = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    let normalized = text;
    arabicNums.forEach((num, idx) => {
        normalized = normalized.replace(new RegExp(num, 'g'), idx.toString());
    });
    return normalized;
}

// Extract field
function extractField(text, patterns) {
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            return match[1].trim();
        }
    }
    return null;
}

// Extract dates
function extractDates(text) {
    const datePatterns = [
        /تاریخ[\s\S]*?(\d{4}[/-]\d{1,2}[/-]\d{1,2})/g,
        /date[\s\S]*?(\d{4}[/-]\d{1,2}[/-]\d{1,2})/gi,
        /(\d{1,2}[/-]\d{1,2}[/-]\d{4})/g,
        /(\d{4}[/-]\d{1,2}[/-]\d{1,2})/g
    ];
    
    const dates = [];
    datePatterns.forEach(pattern => {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
            dates.push(match[1]);
        }
    });
    
    return dates;
}

// Build dynamic JSON
function buildDynamicJson(text) {
    const normalized = normalizeArabicNumbers(text);
    const data = {};
    
    // Saudi Certificate specific extraction
    const nationalIdPatterns = [
        /رقم الهوية[:\s]*(\d{10})/,
        /National ID[:\s]*(\d{10})/i,
        /ID Number[:\s]*(\d{10})/i,
        /الرقم الوطني[:\s]*(\d{10})/,
        /(?:^|\s)(\d{10})(?:\s|$)/
    ];
    const nationalId = extractField(normalized, nationalIdPatterns);
    if (nationalId) data['National ID / رقم الهوية'] = nationalId;
    
    const namePatterns = [
        /الاسم[:\s]*([^\n]+)/,
        /Name[:\s]*([^\n]+)/i,
        /اسم[:\s]*([^\n]+)/
    ];
    const name = extractField(text, namePatterns);
    if (name) data['Name / الاسم'] = name;
    
    const birthDatePatterns = [
        /تاریخ المیلاد[:\s]*(\d{4}[/-]\d{1,2}[/-]\d{1,2})/,
        /Birth Date[:\s]*(\d{4}[/-]\d{1,2}[/-]\d{1,2})/i,
        /Date of Birth[:\s]*(\d{4}[/-]\d{1,2}[/-]\d{1,2})/i
    ];
    const birthDate = extractField(normalized, birthDatePatterns);
    if (birthDate) data['Birth Date / تاریخ المیلاد'] = birthDate;
    
    const expiryDatePatterns = [
        /تاریخ الانتهاء[:\s]*(\d{4}[/-]\d{1,2}[/-]\d{1,2})/,
        /Expiry Date[:\s]*(\d{4}[/-]\d{1,2}[/-]\d{1,2})/i,
        /انتهاء الصلاحیة[:\s]*(\d{4}[/-]\d{1,2}[/-]\d{1,2})/
    ];
    const expiryDate = extractField(normalized, expiryDatePatterns);
    if (expiryDate) data['Expiry Date / تاریخ الانتهاء'] = expiryDate;
    
    const genderPatterns = [
        /الجنس[:\s]*(ذكر|أنثى|Male|Female)/i,
        /Gender[:\s]*(ذكر|أنثى|Male|Female)/i,
        /Sex[:\s]*(M|F|ذ|أ)/i
    ];
    const gender = extractField(text, genderPatterns);
    if (gender) data['Gender / الجنس'] = gender;
    
    const nationalityPatterns = [
        /الجنسیة[:\s]*([^\n]+)/,
        /Nationality[:\s]*([^\n]+)/i
    ];
    const nationality = extractField(text, nationalityPatterns);
    if (nationality) data['Nationality / الجنسیة'] = nationality;
    
    // Extract all dates
    const dates = extractDates(normalized);
    if (dates.length > 0) {
        dates.forEach((date, idx) => {
            if (!Object.values(data).includes(date)) {
                data[`Date ${idx + 1} / تاریخ ${idx + 1}`] = date;
            }
        });
    }
    
    // Extract emails
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = text.match(emailPattern);
    if (emails) {
        emails.forEach((email, idx) => {
            data[`Email ${idx + 1} / البرید الإلكتروني ${idx + 1}`] = email;
        });
    }
    
    // Extract phone numbers
    const phonePattern = /(?:\+?966|0)?[\s-]?5[0-9]{8}|\+?[0-9]{10,15}/g;
    const phones = normalized.match(phonePattern);
    if (phones) {
        phones.forEach((phone, idx) => {
            data[`Phone ${idx + 1} / الهاتف ${idx + 1}`] = phone;
        });
    }
    
    return data;
}

// Render form display
function renderFormDisplay(data) {
    const container = document.getElementById('formDisplay');
    container.innerHTML = '';
    
    Object.entries(data).forEach(([key, value]) => {
        const row = document.createElement('div');
        row.className = 'form-row';
        row.innerHTML = `<strong>${key}:</strong><span>${value}</span>`;
        container.appendChild(row);
    });
}

// Copy text
function copyText() {
    const text = document.getElementById('extractedText').value;
    navigator.clipboard.writeText(text).then(() => {
        showAlert(currentLanguage === 'ar' ? 'تم النسخ بنجاح' : 'Copied successfully', 'success');
    });
}

// Download file
function downloadFile(type) {
    const timestamp = getTimestamp();
    let content, filename, mimeType;
    
    if (type === 'text') {
        content = extractedText;
        filename = `extracted_text_${timestamp}.txt`;
        mimeType = 'text/plain';
    } else if (type === 'json') {
        content = JSON.stringify(extractedData, null, 2);
        filename = `extracted_data_${timestamp}.json`;
        mimeType = 'application/json';
    } else if (type === 'csv') {
        content = convertToCSV(extractedData);
        filename = `extracted_data_${timestamp}.csv`;
        mimeType = 'text/csv';
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    showAlert(currentLanguage === 'ar' ? 'تم التحميل بنجاح' : 'Downloaded successfully', 'success');
}

// Get timestamp
function getTimestamp() {
    const now = new Date();
    return now.getFullYear() + 
           String(now.getMonth() + 1).padStart(2, '0') + 
           String(now.getDate()).padStart(2, '0') + '_' +
           String(now.getHours()).padStart(2, '0') + 
           String(now.getMinutes()).padStart(2, '0') + 
           String(now.getSeconds()).padStart(2, '0');
}

// Convert to CSV
function convertToCSV(data) {
    let csv = 'Field,Value\n';
    Object.entries(data).forEach(([key, value]) => {
        csv += `"${key}","${value}"\n`;
    });
    return csv;
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
});