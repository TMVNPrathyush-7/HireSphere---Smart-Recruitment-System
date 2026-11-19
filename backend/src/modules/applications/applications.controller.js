import { ApplicationsService } from './applications.service.js';

export class ApplicationsController {
  static async apply(req, res) {
    try {
      const { job_id } = req.body;
      if (!job_id) {
        return res.status(400).json({ error: 'job_id is required' });
      }
      const application = await ApplicationsService.applyToJob(job_id, req.user);
      return res.status(201).json({ message: 'Application submitted successfully', application });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  static getJobApplications(req, res) {
    try {
      const applications = ApplicationsService.getJobApplications(req.params.jobId, req.user);
      return res.status(200).json(applications);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  static getCandidateApplications(req, res) {
    try {
      const applications = ApplicationsService.getCandidateApplications(req.params.candidateId);
      return res.status(200).json(applications);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  static updateStatus(req, res) {
    try {
      const { status } = req.body;
      const application = ApplicationsService.updateApplicationStatus(req.params.id, status, req.user);
      return res.status(200).json({ message: 'Application status updated', application });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }
}
