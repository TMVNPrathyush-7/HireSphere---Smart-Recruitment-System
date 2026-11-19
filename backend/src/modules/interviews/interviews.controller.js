import { InterviewsService } from './interviews.service.js';

export class InterviewsController {
  static propose(req, res) {
    try {
      const interview = InterviewsService.proposeInterview(req.body, req.user);
      return res.status(201).json({ message: 'Interview slot proposed successfully', interview });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  static confirm(req, res) {
    try {
      const interview = InterviewsService.confirmSlot(req.params.id, req.body, req.user);
      return res.status(200).json({ message: 'Interview slot confirmed', interview });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  static getCandidateInterviews(req, res) {
    try {
      const interviews = InterviewsService.getCandidateInterviews(req.params.candidateId);
      return res.status(200).json(interviews);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  static getRecruiterInterviews(req, res) {
    try {
      const interviews = InterviewsService.getRecruiterInterviews(req.params.recruiterId);
      return res.status(200).json(interviews);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
}
