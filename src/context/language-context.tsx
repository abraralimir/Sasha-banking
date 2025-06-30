'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

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
    initialMessage: "Hello! I'm Sasha, your expert financial advisor. How can I assist you with your banking needs, loan analysis, or financial statements today?",
    placeholder: "Message Sasha...",
    uploadCsvTooltip: "Upload Loan CSV",
    uploadPdfTooltip: "Upload Financial PDF",
    micTooltip: "Use Microphone",
    sendSr: "Send",
    analyzingFile: "Analyzing: {{fileName}}",
    clearPdfTooltip: "Clear PDF from session",
    pdfClearedTitle: "PDF Cleared",
    pdfClearedDesc: "The document has been removed from the session.",
    clearedPdfMessage: "I have cleared the previous document. How can I assist you now?",
    csvUploadTitle: "CSV File Uploaded",
    csvUploadDesc: "{{fileName}} is ready for loan analysis.",
    pdfUploadTitle: "PDF File Uploaded",
    pdfUploadDesc: "{{fileName}} is ready. Starting analysis...",
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
    downloadPdf: "Download PDF",
    english: 'English',
    arabic: 'Arabic'
  },
  ar: {
    pageTitle: 'ساشا المصرفية',
    initialMessage: "مرحباً! أنا ساشا، مستشارك المالي الخبير. كيف يمكنني مساعدتك في احتياجاتك المصرفية، تحليل القروض، أو البيانات المالية اليوم؟",
    placeholder: "راسل ساشا...",
    uploadCsvTooltip: "تحميل ملف CSV للقروض",
    uploadPdfTooltip: "تحميل ملف PDF مالي",
    micTooltip: "استخدام الميكروفون",
    sendSr: "إرسال",
    analyzingFile: "يتم تحليل: {{fileName}}",
    clearPdfTooltip: "مسح ملف PDF من الجلسة",
    pdfClearedTitle: "تم مسح PDF",
    pdfClearedDesc: "تمت إزالة المستند من الجلسة.",
    clearedPdfMessage: "لقد قمت بمسح المستند السابق. كيف يمكنني مساعدتك الآن؟",
    csvUploadTitle: "تم تحميل ملف CSV",
    csvUploadDesc: "{{fileName}} جاهز لتحليل القرض.",
    pdfUploadTitle: "تم تحميل ملف PDF",
    pdfUploadDesc: "{{fileName}} جاهز. جاري بدء التحليل...",
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
    downloadPdf: "تحميل PDF",
    english: 'الإنجليزية',
    arabic: 'العربية'
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const dir = language === 'ar' ? 'rtl' : 'ltr';

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
