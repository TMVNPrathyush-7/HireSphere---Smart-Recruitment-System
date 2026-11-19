import { ResumesService } from './resumes.service.js';

export class ResumesController {
  static async upload(req, res) {
    try {
      const result = await ResumesService.handleResumeUpload(req.file, req.user);
      return res.status(200).json({ message: 'Resume uploaded and parsed successfully', ...result });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async build(req, res) {
    try {
      const result = await ResumesService.buildStructuredResume(req.body, req.user);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  static getParsed(req, res) {
    try {
      const result = ResumesService.getParsedResume(req.params.candidateId);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(404).json({ error: err.message });
    }
  }

  static async getSuggestions(req, res) {
    try {
      const suggestions = await ResumesService.getResumeSuggestions(req.params.candidateId, req.query.jobId);
      return res.status(200).json(suggestions);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async getSkillGap(req, res) {
    try {
      const analysis = await ResumesService.getSkillGap(req.params.candidateId, req.query.jobId);
      return res.status(200).json(analysis);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }
}
