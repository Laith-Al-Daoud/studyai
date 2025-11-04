/**
 * PPTX to PDF Conversion Utility
 * 
 * Converts PowerPoint files (.pptx, .ppt) to PDF format using LibreOffice
 */

import { promisify } from 'util';

// Type definitions for libreoffice-convert
type ConvertFunction = (
  buffer: Buffer,
  format: string,
  callback: (error: Error | null, result: Buffer) => void
) => void;

// Load libreoffice-convert using require (CommonJS module)
function getLibreOfficeConverter(): ConvertFunction {
  try {
    // Use require for CommonJS modules
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const convert = require('libreoffice-convert');
    
    // Verify we got a function
    if (typeof convert !== 'function') {
      throw new Error('Failed to load libreoffice-convert function');
    }
    
    return convert as ConvertFunction;
  } catch (error) {
    console.error('Failed to import libreoffice-convert:', error);
    throw new Error(
      'LibreOffice converter not available. Please ensure LibreOffice is installed on the server.'
    );
  }
}

/**
 * Convert a PPTX/PPT file buffer to PDF
 * 
 * @param fileBuffer - The buffer of the PPTX/PPT file
 * @param originalFileName - The original file name (for logging)
 * @returns Promise<Buffer> - The converted PDF buffer
 */
export async function convertPptxToPdf(
  fileBuffer: Buffer,
  originalFileName: string
): Promise<Buffer> {
  try {
    console.log(`Converting ${originalFileName} to PDF...`);

    // Get the converter function
    const converter = getLibreOfficeConverter();
    
    // Promisify the convert function
    const convertAsync = promisify(converter);

    // Convert to PDF format
    const pdfBuffer = await convertAsync(fileBuffer, '.pdf');

    console.log(`Successfully converted ${originalFileName} to PDF`);
    return pdfBuffer as Buffer;
  } catch (error) {
    console.error(`Error converting ${originalFileName} to PDF:`, error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('LibreOffice')) {
        throw new Error(
          'PowerPoint to PDF conversion is not available. LibreOffice must be installed on the server.'
        );
      }
      throw new Error(`Failed to convert PowerPoint file: ${error.message}`);
    }
    
    throw new Error('Failed to convert PowerPoint file to PDF');
  }
}

/**
 * Check if a file is a PowerPoint file based on MIME type
 * 
 * @param mimeType - The MIME type of the file
 * @returns boolean - True if the file is a PowerPoint file
 */
export function isPowerPointFile(mimeType: string): boolean {
  const powerPointMimeTypes = [
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    'application/vnd.ms-powerpoint' // .ppt
  ];
  
  return powerPointMimeTypes.includes(mimeType);
}

/**
 * Check if a file is a PowerPoint file based on file extension
 * 
 * @param fileName - The name of the file
 * @returns boolean - True if the file has a PowerPoint extension
 */
export function isPowerPointFileByName(fileName: string): boolean {
  const lowerCaseName = fileName.toLowerCase();
  return lowerCaseName.endsWith('.pptx') || lowerCaseName.endsWith('.ppt');
}

/**
 * Convert a File object to Buffer (for Node.js environments)
 * 
 * @param file - The File object
 * @returns Promise<Buffer> - The file contents as a Buffer
 */
export async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

