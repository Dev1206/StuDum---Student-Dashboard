import express from 'express';
import multer from 'multer';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import File from '../models/File.js';
import Course from '../models/Course.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mammoth from 'mammoth';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the root .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

const router = express.Router();

// Configure S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Only allow 1 file per request
  }
});

// Convert DOCX to HTML
router.post('/convert-docx', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const result = await mammoth.convertToHtml({ buffer: req.file.buffer });
    res.json({ html: result.value });
  } catch (error) {
    console.error('Error converting file:', error);
    res.status(500).json({ message: 'Error converting file', error: error.message });
  }
});

// Upload file
router.post('/:courseId/upload', upload.single('file'), async (req, res) => {
  console.log('File upload request received');
  
  try {
    // Check if file exists
    if (!req.file) {
      console.error('No file uploaded');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { courseId } = req.params;
    const { userId } = req.body;
    const file = req.file;

    console.log('File details:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      courseId,
      userId
    });

    // Verify course exists and belongs to user
    const course = await Course.findOne({ _id: courseId, userId });
    if (!course) {
      console.error('Course not found or unauthorized:', { courseId, userId });
      return res.status(404).json({ message: 'Course not found or unauthorized' });
    }

    // Generate unique file name
    const fileExtension = file.originalname.split('.').pop();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const s3Key = `courses/${courseId}/files/${uniqueFileName}`;

    // Prepare S3 upload parameters
    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: s3Key,
      Body: file.buffer,
      ContentType: file.mimetype
    };

    console.log('Attempting S3 upload with params:', {
      Bucket: uploadParams.Bucket,
      Key: uploadParams.Key,
      ContentType: uploadParams.ContentType,
      Size: file.buffer.length
    });

    // Upload to S3
    try {
      const s3Response = await s3Client.send(new PutObjectCommand(uploadParams));
      console.log('S3 upload successful:', s3Response);
    } catch (s3Error) {
      console.error('S3 upload error:', {
        code: s3Error.code,
        message: s3Error.message,
        region: process.env.AWS_REGION,
        bucket: process.env.AWS_S3_BUCKET
      });
      return res.status(500).json({ 
        message: 'Failed to upload file to S3',
        error: s3Error.message
      });
    }

    // Create file record in database
    const fileUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
    const fileDoc = new File({
      courseId,
      userId,
      fileName: file.originalname,
      fileUrl,
      fileSize: file.size,
      fileType: file.mimetype
    });

    await fileDoc.save();
    console.log('File record created in database:', fileDoc);

    // Return success response
    res.status(201).json({
      message: 'File uploaded successfully',
      file: fileDoc
    });

  } catch (error) {
    console.error('Error in file upload process:', error);
    res.status(500).json({
      message: 'Error uploading file',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get course files
router.get('/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { userId } = req.query;

    // Verify course exists and belongs to user
    const course = await Course.findOne({ _id: courseId, userId });
    if (!course) {
      return res.status(404).json({ message: 'Course not found or unauthorized' });
    }

    const files = await File.find({ courseId }).sort({ uploadDate: -1 });
    res.json(files);
  } catch (error) {
    console.error('Error getting files:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete file
router.delete('/:courseId/:fileId', async (req, res) => {
  try {
    const { courseId, fileId } = req.params;
    const { userId } = req.query;

    // Verify course exists and belongs to user
    const course = await Course.findOne({ _id: courseId, userId });
    if (!course) {
      return res.status(404).json({ message: 'Course not found or unauthorized' });
    }

    const file = await File.findOne({ _id: fileId, courseId });
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Delete from S3
    const s3Key = file.fileUrl.split('.com/')[1];
    const deleteParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: s3Key
    };

    try {
      await s3Client.send(new DeleteObjectCommand(deleteParams));
    } catch (s3Error) {
      console.error('S3 delete error:', s3Error);
      return res.status(500).json({ 
        message: 'Failed to delete file from S3',
        error: s3Error.message 
      });
    }

    // Delete from database
    await file.deleteOne();

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router; 