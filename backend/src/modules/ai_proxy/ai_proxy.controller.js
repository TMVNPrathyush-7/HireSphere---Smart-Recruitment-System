import { AiProxyService } from './ai_proxy.service.js';

export class AiProxyController {
  static async parseResume(req, res) {
    try {
      const { file_url, file_name, text } = req.body;
      const result = await AiProxyService.parseResume(file_url, file_name, text);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async atsScore(req, res) {
    try {
      const { candidate, job } = req.body;
      const result = await AiProxyService.calculateAtsScore(candidate, job);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async skillMatch(req, res) {
    try {
      const { candidate_skills, required_skills } = req.body;
      const result = await AiProxyService.calculateSkillMatch(candidate_skills, required_skills);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async rankCandidates(req, res) {
    try {
      const { applications } = req.body;
      const result = await AiProxyService.rankCandidates(applications);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async resumeSuggestions(req, res) {
    try {
      const { candidate, job } = req.body;
      const result = await AiProxyService.generateResumeSuggestions(candidate, job);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async skillGap(req, res) {
    try {
      const { candidate_skills, required_skills } = req.body;
      const result = await AiProxyService.analyzeSkillGap(candidate_skills, required_skills);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async mockInterviewQuestions(req, res) {
    try {
      const { role, skills } = req.body;
      const result = await AiProxyService.generateMockInterview(role, skills);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async evaluateInterviewAnswer(req, res) {
    try {
      const result = await AiProxyService.evaluateInterviewAnswer(req.body);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async interactiveInterviewTurn(req, res) {
    try {
      const result = await AiProxyService.interactiveInterviewTurn(req.body);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
}

