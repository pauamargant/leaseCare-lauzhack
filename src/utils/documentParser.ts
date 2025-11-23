import logger from './logger';
import * as pdfjsLib from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';

// Configure PDF.js worker - use local file from public directory
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

/**
 * Render PDF page to canvas
 */
async function renderPageToCanvas(page: any): Promise<HTMLCanvasElement> {
  const viewport = page.getViewport({ scale: 2.0 });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  
  await page.render({
    canvasContext: context,
    viewport: viewport
  }).promise;
  
  return canvas;
}

/**
 * Extract text from canvas using Tesseract.js
 */
async function extractTextFromCanvas(canvas: HTMLCanvasElement): Promise<string> {
  const worker = await createWorker('eng+fra+deu+ita');
  const { data } = await worker.recognize(canvas);
  await worker.terminate();
  return data.text;
}

/**
 * Extract text from PDF using pdfjs-dist + Tesseract.js
 */
async function extractTextFromPDF(file: File): Promise<string> {
  try {
    logger.info('📄 Loading PDF...');
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;
    
    logger.info(`📖 Processing ${numPages} pages with OCR...`);
    
    let fullText = '';
    
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      logger.info(`🔍 Page ${pageNum}/${numPages}...`);
      
      const page = await pdf.getPage(pageNum);
      const canvas = await renderPageToCanvas(page);
      const pageText = await extractTextFromCanvas(canvas);
      
      fullText += `\n\n=== PAGE ${pageNum} ===\n\n${pageText}`;
      
      console.log(`📄 Page ${pageNum} text:`, pageText.substring(0, 200) + '...');
    }
    
    console.log('='.repeat(80));
    console.log('📄 COMPLETE PDF TEXT:');
    console.log('='.repeat(80));
    console.log(fullText);
    console.log('='.repeat(80));
    console.log(`📊 Stats: ${fullText.length} characters, ${fullText.split(/\s+/).length} words`);
    console.log('='.repeat(80));
    
    logger.success('✅ PDF extracted', {
      pages: numPages,
      characters: fullText.length
    });
    
    return fullText.trim();
  } catch (error: any) {
    logger.error('❌ PDF extraction failed', error);
    throw new Error(`Failed to extract PDF: ${error.message}`);
  }
}

/**
 * Extract text from images using Tesseract.js
 */
async function extractTextFromImage(file: File): Promise<string> {
  try {
    logger.info('🖼️ Running OCR on image...');
    
    const worker = await createWorker('eng+fra+deu+ita');
    const { data } = await worker.recognize(file);
    await worker.terminate();
    
    const text = data.text;
    
    console.log('='.repeat(80));
    console.log('🖼️ IMAGE TEXT:');
    console.log('='.repeat(80));
    console.log(text);
    console.log('='.repeat(80));
    console.log(`📊 Confidence: ${data.confidence}%, Characters: ${text.length}`);
    console.log('='.repeat(80));
    
    logger.success('✅ Image extracted', {
      confidence: data.confidence,
      characters: text.length
    });
    
    return text.trim();
  } catch (error: any) {
    logger.error('❌ Image extraction failed', error);
    throw new Error(`Failed to extract image: ${error.message}`);
  }
}

/**
 * Main document parser - handles PDF, images, and text files
 */
export async function parseDocument(file: File): Promise<string> {
  logger.info('Parsing document', { 
    name: file.name, 
    type: file.type, 
    size: file.size 
  });
  
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();
  
  // PDF files
  if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
    return await extractTextFromPDF(file);
  }
  
  // Image files (JPG, PNG, etc.)
  if (fileType.startsWith('image/') || 
      fileName.endsWith('.jpg') || 
      fileName.endsWith('.jpeg') || 
      fileName.endsWith('.png')) {
    return await extractTextFromImage(file);
  }
  
  // Plain text files
  if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
    const text = await file.text();
    logger.success('Text file read', { length: text.length });
    return text;
  }
  
  throw new Error(`Unsupported file type: ${fileType || fileName}`);
}

/**
 * Validate if document has enough content
 */
export function validateDocumentText(text: string): boolean {
  const minLength = 100; // Minimum 100 characters
  const hasContent = text.trim().length >= minLength;
  
  if (!hasContent) {
    logger.warning('Document text too short', { length: text.length });
  }
  
  return hasContent;
}
