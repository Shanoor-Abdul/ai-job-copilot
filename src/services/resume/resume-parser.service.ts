import mammoth from 'mammoth'
// @ts-expect-error No type definitions available for pdf2json
import PDFParser from 'pdf2json'

async function extractPdfText(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, 1)
    pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError))
    pdfParser.on("pdfParser_dataReady", () => {
      resolve(pdfParser.getRawTextContent())
    })
    pdfParser.parseBuffer(buffer)
  })
}

/**
 * Extracts and normalizes text from a supported resume file buffer.
 */
export async function parseResumeBuffer(buffer: Buffer, fileType: string, fileName: string): Promise<string> {
  let extractedText = ""

  if (fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
    extractedText = await extractPdfText(buffer)
  } else if (
    fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
    fileType === 'application/msword' || 
    fileName.toLowerCase().endsWith('.docx')
  ) {
    if (fileName.toLowerCase().endsWith('.doc') && !fileType.includes('openxmlformats')) {
      throw new Error("Unsupported file type. Please upload a PDF or modern DOCX file.")
    }
    const result = await mammoth.extractRawText({ buffer })
    extractedText = result.value
  } else {
    throw new Error("Unsupported file type. Please upload: PDF or DOCX")
  }

  const normalized = normalizeText(extractedText)

  if (!normalized || normalized.trim().length < 50) {
    throw new Error("No readable text detected in the document. Ensure it's not a scanned image.")
  }

  // Large file protection
  if (normalized.length > 50000) {
    throw new Error("Resume is too large to process automatically. Please upload a shorter resume.")
  }

  return normalized
}

function normalizeText(text: string): string {
  if (!text) return ""
  
  return text
    // Replace multiple spaces with a single space
    .replace(/[^\S\r\n]+/g, ' ')
    // Replace 3+ consecutive newlines with exactly 2 newlines
    .replace(/\n{3,}/g, '\n\n')
    // Remove non-printable characters except newlines and tabs
    .replace(/[^\x20-\x7E\n\t]/g, '')
    .trim()
}
