import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ResumesController } from './resumes.controller.js';
import { authenticate, requireRole } from '../../common/middleware/auth.js';
import { config } from '../../config/index.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.docx', '.doc', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only .pdf, .docx, and .txt files are supported'));
    }
  }
});

const router = Router();

router.post('/upload', authenticate, requireRole(['candidate']), upload.single('resume'), ResumesController.upload);
router.post('/build', authenticate, requireRole(['candidate']), ResumesController.build);
router.get('/:candidateId/parsed', authenticate, ResumesController.getParsed);
router.get('/:candidateId/suggestions', authenticate, ResumesController.getSuggestions);
router.get('/:candidateId/skill-gap', authenticate, ResumesController.getSkillGap);

export default router;
