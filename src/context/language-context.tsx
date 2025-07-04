'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
  dir: 'ltr' | 'rtl';
}

const translations: { [key in Language]: { [key: string]: string } } = {
  en: {
    pageTitle: 'Sasha Banking',
    initialMessage: "Hello! I'm Sasha, your financial advisor. How can I help you today?",
    placeholder: "Message Sasha...",
    uploadCsvTooltip: "Upload Loan CSV",
    uploadPdfTooltip: "Upload Financial PDF",
    micTooltip: "Use Microphone",
    sendSr: "Send",
    analyzingFile: "Context: {{fileName}}",
    clearPdfTooltip: "Clear PDF from session",
    pdfClearedTitle: "PDF Cleared",
    pdfClearedDesc: "The document has been removed from the session.",
    clearedPdfMessage: "I have cleared the previous document. How can I assist you now?",
    csvUploadTitle: "CSV File Uploaded",
    csvUploadDesc: "{{fileName}} is ready for loan analysis.",
    pdfUploadTitle: "PDF File Uploaded",
    pdfUploadDesc: "{{fileName}} is ready for chat.",
    pdfLoadedForChat: "I've loaded {{fileName}}. Feel free to ask me any questions about it.",
    analyzingPdfMessage: "Analyzing the financial statement: {{fileName}}...",
    analysisFailedTitle: "Analysis Failed",
    analysisFailedDesc: "Sasha could not analyze the financial statement. Please try again.",
    unableToAnalyzeMessage: 'Sorry, I was unable to analyze that document.',
    loanAnalysisHeader: "Here is the analysis for Loan ID **{{loanId}}**:",
    financialAnalysisHeader: "Here is the analysis of the financial statement:",
    uploadCsvFirst: 'Please upload a CSV file first.',
    invalidPdfTitle: 'Invalid File Type',
    invalidPdfDesc: 'Please upload a PDF file.',
    sessionSaveErrorTitle: 'Could not save session',
    sessionSaveErrorDesc: 'Your browser may be out of space or in private mode.',
    documentLoadedTitle: 'Document Loaded',
    documentLoadedDesc: "Continuing session with {{fileName}}.",
    genericErrorTitle: 'Oh no! Something went wrong.',
    genericErrorDesc: 'Failed to get a response from Sasha. Please try again.',
    loanAnalysisReportTitle: "Loan Analysis Report",
    financialAnalysisReportTitle: "Financial Statement Analysis",
    summary: "Summary",
    prediction: "Prediction",
    eligibility: "Eligibility",
    creditScoreAssessment: "Credit Score Assessment",
    downloadPdf: "Download PDF",
    english: 'English',
    arabic: 'Arabic',
    choosePdfLanguageTitle: "Choose PDF Language",
    choosePdfLanguageDesc: "In which language would you like to download the report?",
    cancel: "Cancel",
    clearCsvTooltip: "Clear CSV from session",
    csvClearedTitle: "CSV Cleared",
    csvClearedDesc: "The CSV data has been cleared from the session.",
    clearedCsvMessage: "I have cleared the CSV data. How can I help you now?",
    translationErrorTitle: 'Translation Error',
    translationErrorDesc: 'Failed to generate the report in {{lang}}. Please try again.',
    generatingTranslatedPdf: 'Generating translated PDF...',
    trendsAndGraphsTitle: "Trends & Visualizations",
    identifiedFlawsTitle: "Identified Flaws & Risks",
    financialPerformanceTitle: "Financial Performance",
    revenue: "Revenue",
    netIncome: "Net Income",
    pdfGenerationError: "Could not generate the PDF report.",
    maintenanceMessage: "Services are undergoing maintenance and major upgrades. Time remaining: {{time}}",
    imageDialogTitle: "AI Image Generation",
    imageDialogDesc: "Describe the image you want Sasha to create. Be as descriptive as you like.",
    promptLabel: "Prompt",
    promptPlaceholder: "e.g., A futuristic city skyline at sunset",
    generateButton: "Generate",
    generatingMessage: "Sasha is creating your image...",
    generateAnotherButton: "Generate Another",
    downloadButton: "Download",
    addToChatButton: "Add to Chat",
    imageGenSuccess: "Here is the image I created based on your prompt: \"{{prompt}}\"",
    imageGenFailedTitle: "Image Generation Failed",
    imageGenFailedDesc: "Sorry, I couldn't create an image at this time. Please try again later.",
    pollinationsDisclaimer: "Powered by Pollinations.ai. Images are public domain.",

    // Spreadsheet Page
    spreadsheetTitle: 'Spreadsheet',
    chatWithSasha: "Chat with Sasha",
    closeChat: "Close chat",
    sashaSpreadsheetHello: "Hello! I'm Sasha. I can help you create, format, and analyze this spreadsheet. Just tell me what you need.",
    spreadsheetPlaceholder: "e.g., Make row 1 bold and blue",
    send: "Send",
    showChat: "Show Chat",
    hideChat: "Hide Chat",
    importSuccessTitle: "Import Successful",
    importSuccessDesc: "Successfully imported \"{{fileName}}\".",
    importFailedTitle: "Import Failed",
    importFailedDesc: "There was an error processing your Excel file.",
    sashaSpreadsheetFileLoaded: "I've loaded \"{{fileName}}\" into the spreadsheet. How can I help you with it?",
    sashaSpreadsheetError: "Sorry, I ran into an issue. Please try that again.",
    toolbarFile: "File",
    toolbarHome: "Home",
    toolbarInsert: "Insert",
    toolbarFormulas: "Formulas",
    toolbarData: "Data",
    toolbarReview: "Review",
    toolbarView: "View",
    toolbarFullscreen: "Fullscreen",
    toolbarExitFullscreen: "Exit Fullscreen",
    toolbarDownload: "Download",
    toolbarImport: "Import",
    tooltipPaste: "Paste (Use Ctrl/Cmd+V)",
    tooltipCut: "Cut",
    tooltipCopy: "Copy",
    tooltipFormatPainter: "Format Painter (Coming Soon)",
    tooltipBold: "Bold",
    tooltipItalic: "Italic",
    tooltipUnderline: "Underline",
    tooltipFontColor: "Font Color (Coming Soon)",
    tooltipAlignLeft: "Align Left",
    tooltipCenter: "Center",
    tooltipAlignRight: "Align Right",
    tooltipWrapText: "Wrap Text",
    tooltipMergeCenter: "Merge & Center",
    tooltipAutoSum: "AutoSum (Coming Soon)",
    tooltipSortFilter: "Sort & Filter (Coming Soon)",
    tooltipFindSelect: "Find & Select (Coming Soon)",
  },
  ar: {
    pageTitle: 'ساشا المصرفية',
    initialMessage: "مرحباً! أنا ساشا، مستشاركتك المالية. كيف يمكنني مساعدتك اليوم؟",
    placeholder: "راسل ساشا...",
    uploadCsvTooltip: "تحميل ملف CSV للقروض",
    uploadPdfTooltip: "تحميل ملف PDF مالي",
    micTooltip: "استخدام الميكروفون",
    sendSr: "إرسال",
    analyzingFile: "السياق: {{fileName}}",
    clearPdfTooltip: "مسح ملف PDF من الجلسة",
    pdfClearedTitle: "تم مسح PDF",
    pdfClearedDesc: "تمت إزالة المستند من الجلسة.",
    clearedPdfMessage: "لقد قمت بمسح المستند السابق. كيف يمكنني مساعدتك الآن؟",
    csvUploadTitle: "تم تحميل ملف CSV",
    csvUploadDesc: "{{fileName}} جاهز لتحليل القرض.",
    pdfUploadTitle: "تم تحميل ملف PDF",
    pdfUploadDesc: "{{fileName}} جاهز للمحادثة.",
    pdfLoadedForChat: "لقد قمت بتحميل {{fileName}}. لا تتردد في طرح أي أسئلة حوله.",
    analyzingPdfMessage: "جاري تحليل البيان المالي: {{fileName}}...",
    analysisFailedTitle: "فشل التحليل",
    analysisFailedDesc: "لم تتمكن ساشا من تحليل البيان المالي. يرجى المحاولة مرة أخرى.",
    unableToAnalyzeMessage: 'عذراً، لم أتمكن من تحليل ذلك المستند.',
    loanAnalysisHeader: "إليك تحليل معرف القرض **{{loanId}}**:",
    financialAnalysisHeader: "إليك تحليل البيان المالي:",
    uploadCsvFirst: 'يرجى تحميل ملف CSV أولاً.',
    invalidPdfTitle: 'نوع ملف غير صالح',
    invalidPdfDesc: 'يرجى تحميل ملف PDF.',
    sessionSaveErrorTitle: 'تعذر حفظ الجلسة',
    sessionSaveErrorDesc: 'قد تكون مساحة متصفحك ممتلئة أو في وضع التصفح الخاص.',
    documentLoadedTitle: 'تم تحميل المستند',
    documentLoadedDesc: "متابعة الجلسة مع {{fileName}}.",
    genericErrorTitle: 'عفوًا! حدث خطأ ما.',
    genericErrorDesc: 'فشل الحصول على رد من ساشا. يرجى المحاولة مرة أخرى.',
    loanAnalysisReportTitle: "تقرير تحليل القرض",
    financialAnalysisReportTitle: "تحليل البيان المالي",
    summary: "ملخص",
    prediction: "توقع",
    eligibility: "الأهلية",
    creditScoreAssessment: "تقييم الجدارة الائتمانية",
    downloadPdf: "تحميل PDF",
    english: 'الإنجليزية',
    arabic: 'العربية',
    choosePdfLanguageTitle: "اختر لغة التقرير",
    choosePdfLanguageDesc: "بأي لغة تود تحميل التقرير؟",
    cancel: "إلغاء",
    clearCsvTooltip: "مسح ملف CSV من الجلسة",
    csvClearedTitle: "تم مسح CSV",
    csvClearedDesc: "تمت إزالة بيانات CSV من الجلسة.",
    clearedCsvMessage: "لقد قمت بمسح بيانات CSV. كيف يمكنني مساعدتك الآن؟",
    translationErrorTitle: 'خطأ في الترجمة',
    translationErrorDesc: 'فشل إنشاء التقرير باللغة {{lang}}. يرجى المحاولة مرة أخرى.',
    generatingTranslatedPdf: 'جاري إنشاء ملف PDF مترجم...',
    trendsAndGraphsTitle: "الاتجاهات والتصورات",
    identifiedFlawsTitle: "العيوب والمخاطر المحددة",
    financialPerformanceTitle: "الأداء المالي",
    revenue: "الإيرادات",
    netIncome: "صافي الدخل",
    pdfGenerationError: "تعذر إنشاء تقرير PDF.",
    maintenanceMessage: "تخضع الخدمات للصيانة والتحديثات الرئيسية. الوقت المتبقي: {{time}}",
    imageDialogTitle: "إنشاء صورة بالذكاء الاصطناعي",
    imageDialogDesc: "صف الصورة التي تريد أن تنشئها ساشا. كن وصفيًا كما تريد.",
    promptLabel: "الموجه",
    promptPlaceholder: "مثال: أفق مدينة مستقبلية عند غروب الشمس",
    generateButton: "إنشاء",
    generatingMessage: "ساشا تنشئ صورتك...",
    generateAnotherButton: "إنشاء واحدة أخرى",
    downloadButton: "تنزيل",
    addToChatButton: "إضافة إلى الدردشة",
    imageGenSuccess: "هذه هي الصورة التي أنشأتها بناءً على موجهك: \"{{prompt}}\"",
    imageGenFailedTitle: "فشل إنشاء الصورة",
    imageGenFailedDesc: "عذرًا، لم أتمكن من إنشاء صورة في هذا الوقت. يرجى المحاولة مرة أخرى لاحقًا.",
    pollinationsDisclaimer: "مدعوم من Pollinations.ai. الصور في الملكية العامة.",

    // Spreadsheet Page
    spreadsheetTitle: 'جدول البيانات',
    chatWithSasha: "الدردشة مع ساشا",
    closeChat: "إغلاق الدردشة",
    sashaSpreadsheetHello: "مرحباً! أنا ساشا. يمكنني مساعدتك في إنشاء وتنسيق وتحليل جدول البيانات هذا. فقط أخبرني بما تحتاجه.",
    spreadsheetPlaceholder: "مثال: اجعل الصف الأول عريضًا وأزرق",
    send: "إرسال",
    showChat: "إظهار الدردشة",
    hideChat: "إخفاء الدردشة",
    importSuccessTitle: "تم الاستيراد بنجاح",
    importSuccessDesc: "تم استيراد \"{{fileName}}\" بنجاح.",
    importFailedTitle: "فشل الاستيراد",
    importFailedDesc: "حدث خطأ أثناء معالجة ملف Excel الخاص بك.",
    sashaSpreadsheetFileLoaded: "لقد قمت بتحميل \"{{fileName}}\" في جدول البيانات. كيف يمكنني مساعدتك به؟",
    sashaSpreadsheetError: "عذراً، واجهتني مشكلة. يرجى المحاولة مرة أخرى.",
    toolbarFile: "ملف",
    toolbarHome: "الرئيسية",
    toolbarInsert: "إدراج",
    toolbarFormulas: "صيغ",
    toolbarData: "بيانات",
    toolbarReview: "مراجعة",
    toolbarView: "عرض",
    toolbarFullscreen: "ملء الشاشة",
    toolbarExitFullscreen: "الخروج من ملء الشاشة",
    toolbarDownload: "تنزيل",
    toolbarImport: "استيراد",
    tooltipPaste: "لصق (استخدم Ctrl/Cmd+V)",
    tooltipCut: "قص",
    tooltipCopy: "نسخ",
    tooltipFormatPainter: "نسخ التنسيق (قريباً)",
    tooltipBold: "عريض",
    tooltipItalic: "مائل",
    tooltipUnderline: "تسطير",
    tooltipFontColor: "لون الخط (قريباً)",
    tooltipAlignLeft: "محاذاة لليسار",
    tooltipCenter: "توسيط",
    tooltipAlignRight: "محاذاة لليمين",
    tooltipWrapText: "التفاف النص",
    tooltipMergeCenter: "دمج وتوسيط",
    tooltipAutoSum: "جمع تلقائي (قريباً)",
    tooltipSortFilter: "فرز وتصفية (قريباً)",
    tooltipFindSelect: "بحث وتحديد (قريباً)",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const dir = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
  }, [language, dir]);

  const t = (key: string, replacements?: { [key: string]: string | number }) => {
    let translation = translations[language][key] || key;
    if (replacements) {
        Object.keys(replacements).forEach(rKey => {
            translation = translation.replace(`{{${rKey}}}`, String(replacements[rKey]));
        });
    }
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
