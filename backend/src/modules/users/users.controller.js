import { UsersService } from './users.service.js';

export class UsersController {
  static getCandidate(req, res) {
    try {
      const profile = UsersService.getCandidateProfile(req.params.id);
      return res.status(200).json(profile);
    } catch (err) {
      return res.status(404).json({ error: err.message });
    }
  }

  static updateCandidate(req, res) {
    try {
      const profile = UsersService.updateCandidateProfile(req.params.id, req.body, req.user);
      return res.status(200).json({ message: 'Candidate profile updated', profile });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  static getRecruiter(req, res) {
    try {
      const profile = UsersService.getRecruiterProfile(req.params.id);
      return res.status(200).json(profile);
    } catch (err) {
      return res.status(404).json({ error: err.message });
    }
  }

  static updateRecruiter(req, res) {
    try {
      const profile = UsersService.updateRecruiterProfile(req.params.id, req.body, req.user);
      return res.status(200).json({ message: 'Recruiter profile updated', profile });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }
}
