import { Router } from 'express';
import { AiProxyController } from './ai_proxy.controller.js';
import { authenticate } from '../../common/middleware/auth.js';

const router = Router();

router.post('/parse-resume', authenticate, AiProxyController.parseResume);
router.post('/ats-score', authenticate, AiProxyController.atsScore);
router.post('/skill-match', authenticate, AiProxyController.skillMatch);
router.post('/rank-candidates', authenticate, AiProxyController.rankCandidates);
router.post('/resume-suggestions', authenticate, AiProxyController.resumeSuggestions);
router.post('/skill-gap', authenticate, AiProxyController.skillGap);
router.post('/mock-interview-questions', authenticate, AiProxyController.mockInterviewQuestions);
router.post('/evaluate-interview-answer', authenticate, AiProxyController.evaluateInterviewAnswer);
router.post('/interactive-interview-turn', authenticate, AiProxyController.interactiveInterviewTurn);

export default router;
