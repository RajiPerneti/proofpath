const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Memory-only storage with 5MB cap
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/pdf', 'text/plain'];
    const isAllowedExt = file.originalname.match(/\.(pdf|txt)$/i);

    if (allowedMimes.includes(file.mimetype) || isAllowedExt) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and TXT documents are supported.'), false);
    }
  }
});

async function parsePdfBuffer(buffer) {
  // Support pdf-parse v2 (exports PDFParse class)
  if (pdfParse && typeof pdfParse.PDFParse === 'function') {
    const parser = new pdfParse.PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      if (result && Array.isArray(result.pages) && result.pages.length > 0) {
        return result.pages.map((p) => (p && p.text ? p.text : '')).join('\n\n');
      }
      return result && result.text ? result.text.replace(/-- \d+ of \d+ --/g, '').trim() : '';
    } finally {
      if (typeof parser.destroy === 'function') {
        try {
          await parser.destroy();
        } catch (_) {
          // ignore cleanup errors
        }
      }
    }
  }

  // Fallback for pdf-parse v1 (callable function)
  if (typeof pdfParse === 'function') {
    const parsed = await pdfParse(buffer);
    return (parsed && parsed.text) || '';
  }

  throw new Error('No compatible PDF parser available');
}

// POST /api/resumes/parse - Upload and parse resume text in memory
router.post('/parse', requireAuth, (req, res) => {
  upload.single('resume')(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: 'Resume file exceeds the 5MB size limit. Please upload a smaller document.'
        });
      }
      return res.status(400).json({ error: err.message || 'File upload failed' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No resume file was uploaded.' });
    }

    try {
      let extractedText = '';
      const isPdf =
        req.file.mimetype === 'application/pdf' ||
        req.file.originalname.toLowerCase().endsWith('.pdf');

      if (isPdf) {
        extractedText = await parsePdfBuffer(req.file.buffer);
      } else {
        // Plain text
        extractedText = req.file.buffer.toString('utf-8');
      }

      // Sanitize extracted text
      const cleanText = extractedText
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      if (!cleanText) {
        return res.status(422).json({
          error: 'The uploaded file appears to be empty or contains no readable text.'
        });
      }

      const wordCount = cleanText.split(/\s+/).filter(Boolean).length;

      res.json({
        success: true,
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
        wordCount,
        text: cleanText
      });
    } catch (parseErr) {
      console.error('[Resume Parse Error]:', parseErr.message);
      res.status(422).json({
        error:
          'Unable to parse resume document. Please verify the file is not corrupted or password-protected.'
      });
    }
  });
});

module.exports = router;
