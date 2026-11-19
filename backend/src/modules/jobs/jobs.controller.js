import { JobsService } from './jobs.service.js';

export class JobsController {
  static create(req, res) {
    try {
      const job = JobsService.createJob(req.body, req.user);
      return res.status(201).json({ message: 'Job posted successfully', job });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  static getAll(req, res) {
    try {
      const jobs = JobsService.getJobs(req.query);
      return res.status(200).json(jobs);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  static getById(req, res) {
    try {
      const job = JobsService.getJobById(req.params.id);
      return res.status(200).json(job);
    } catch (err) {
      return res.status(404).json({ error: err.message });
    }
  }

  static update(req, res) {
    try {
      const job = JobsService.updateJob(req.params.id, req.body, req.user);
      return res.status(200).json({ message: 'Job updated successfully', job });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  static delete(req, res) {
    try {
      const result = JobsService.deleteJob(req.params.id, req.user);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  static getRecruiterJobs(req, res) {
    try {
      const jobs = JobsService.getRecruiterJobs(req.params.recruiterId);
      return res.status(200).json(jobs);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
}
