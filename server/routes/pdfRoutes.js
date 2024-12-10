import express from 'express';
import multer from 'multer';
import { PDFDocument } from 'pdf-lib';
import PDFParser from 'pdf2json';
import { Document, Paragraph, TextRun, Packer, AlignmentType } from 'docx';
import { fileURLToPath } from 'url';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10 // Maximum 10 files at once
  }
});

// Helper function to extract exact styling from PDF text
const getTextStyle = (item) => {
  const style = {
    isBold: false,
    isItalic: false,
    fontSize: 11,
    fontFamily: 'Arial',
    color: '000000',
    alignment: AlignmentType.LEFT
  };

  if (item.R && item.R[0]) {
    const textItem = item.R[0];
    
    // Extract exact font size (convert PDF points to Word points)
    if (textItem.TS) {
      style.fontSize = Math.round(textItem.TS[0] * 24); // PDF points to Word points
    }

    // Extract font style (bold, italic)
    if (textItem.TS && textItem.TS[2]) {
      style.isBold = (textItem.TS[2] & 2) !== 0;
      style.isItalic = (textItem.TS[2] & 1) !== 0;
    }

    // Extract font family if available
    if (textItem.T_F) {
      style.fontFamily = textItem.T_F;
    }

    // Extract color if available
    if (textItem.TS && textItem.TS[3]) {
      style.color = textItem.TS[3].toString(16).padStart(6, '0');
    }
  }

  return style;
};

// Helper function to parse PDF with exact formatting
const parsePDF = (buffer) => {
  return new Promise((resolve, reject) => {
    try {
      const pdfParser = new PDFParser(null, 1);
      
      pdfParser.on('pdfParser_dataReady', (pdfData) => {
        try {
          console.log('PDF parsing successful');
          
          // Extract text with exact formatting
          const pages = pdfData.Pages.map(page => {
            const elements = [];
            let currentY = -1;
            let currentParagraph = [];

            // Sort texts by Y position then X position for correct reading order
            const sortedTexts = [...page.Texts].sort((a, b) => {
              if (Math.abs(a.y - b.y) < 0.1) {
                return a.x - b.x;
              }
              return a.y - b.y;
            });

            sortedTexts.forEach(text => {
              try {
                const textContent = decodeURIComponent(text.R.map(r => r.T).join(''));
                const style = getTextStyle(text);
                const y = Math.round(text.y * 100); // More precise Y position

                // Check if this is a new line
                if (currentY !== -1 && Math.abs(y - currentY) > 1) {
                  if (currentParagraph.length > 0) {
                    elements.push({
                      type: 'paragraph',
                      content: currentParagraph,
                      y: currentY
                    });
                    currentParagraph = [];
                  }
                }

                currentY = y;
                currentParagraph.push({
                  text: textContent,
                  style: style,
                  x: text.x
                });

              } catch (e) {
                console.log('Error processing text item:', e);
              }
            });

            // Add any remaining paragraph
            if (currentParagraph.length > 0) {
              elements.push({
                type: 'paragraph',
                content: currentParagraph,
                y: currentY
              });
            }

            return elements;
          });

          resolve(pages);
        } catch (error) {
          console.error('Error processing PDF data:', error);
          reject(error);
        }
      });

      pdfParser.on('pdfParser_dataError', (error) => {
        console.error('PDF parsing error:', error);
        reject(error);
      });

      console.log('Starting PDF parsing...');
      pdfParser.parseBuffer(buffer);
    } catch (error) {
      console.error('Error initializing PDF parser:', error);
      reject(error);
    }
  });
};

// Convert PDF to Word
router.post('/to-word', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please provide a PDF file' });
    }

    console.log('Starting PDF to Word conversion...');
    console.log('File details:', {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    // Parse PDF content
    const pages = await parsePDF(req.file.buffer);
    
    if (!pages || pages.length === 0) {
      console.error('No content extracted from PDF');
      throw new Error('No content could be extracted from the PDF');
    }

    console.log('PDF content extracted successfully');

    // Create document sections
    const sections = [];
    
    // Process each page
    pages.forEach((page, pageIndex) => {
      const children = [];

      // Add page break for pages after the first one
      if (pageIndex > 0) {
        children.push(
          new Paragraph({
            children: [],
            pageBreakBefore: true
          })
        );
      }

      // Process each element on the page
      page.forEach(element => {
        if (element.type === 'paragraph') {
          // Sort text elements by X position for proper horizontal alignment
          const sortedContent = [...element.content].sort((a, b) => a.x - b.x);
          
          const runs = sortedContent.map(item => {
            return new TextRun({
              text: item.text,
              bold: item.style.isBold,
              italics: item.style.isItalic,
              size: item.style.fontSize,
              font: item.style.fontFamily,
              color: item.style.color
            });
          });

          children.push(
            new Paragraph({
              children: runs,
              spacing: {
                before: 0,
                after: 0,
                line: 240,
                lineRule: 'atLeast'
              },
              alignment: element.content[0].style.alignment
            })
          );
        }
      });

      sections.push({
        properties: {},
        children: children
      });
    });

    // Create the document with all sections
    const doc = new Document({
      sections: sections,
      styles: {
        paragraphStyles: [],
        default: {
          document: {
            run: {
              font: 'Arial',
              size: 24
            }
          }
        }
      }
    });

    console.log('Generating Word document...');
    const buffer = await Packer.toBuffer(doc);
    console.log('Word document generated successfully');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename=${req.file.originalname.replace('.pdf', '.docx')}`);
    res.send(buffer);

  } catch (error) {
    console.error('Error in PDF to Word conversion:', error);
    res.status(500).json({ 
      message: 'Failed to convert PDF to Word', 
      error: error.message,
      details: error.stack
    });
  }
});

// Merge PDFs route (unchanged)
router.post('/merge', upload.array('files'), async (req, res) => {
  try {
    if (!req.files || req.files.length < 2) {
      return res.status(400).json({ message: 'Please provide at least 2 PDF files' });
    }

    // Create a new PDF document
    const mergedPdf = await PDFDocument.create();

    // Loop through each uploaded file and merge it
    for (const file of req.files) {
      const pdfBytes = file.buffer;
      const pdf = await PDFDocument.load(pdfBytes);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    // Save the merged PDF
    const mergedPdfBytes = await mergedPdf.save();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=merged.pdf');
    res.send(Buffer.from(mergedPdfBytes));
  } catch (error) {
    console.error('Error merging PDFs:', error);
    res.status(500).json({ message: 'Failed to merge PDFs', error: error.message });
  }
});

// Compress PDF route (unchanged)
router.post('/compress', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please provide a PDF file' });
    }

    // Load the PDF
    const pdfDoc = await PDFDocument.load(req.file.buffer);
    
    // Basic compression by copying pages to a new document
    const compressedPdf = await PDFDocument.create();
    const pages = await compressedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
    pages.forEach((page) => compressedPdf.addPage(page));

    // Save with compression options
    const compressedBytes = await compressedPdf.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsStack: []
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=compressed_${req.file.originalname}`);
    res.send(Buffer.from(compressedBytes));
  } catch (error) {
    console.error('Error compressing PDF:', error);
    res.status(500).json({ message: 'Failed to compress PDF', error: error.message });
  }
});

export default router;
