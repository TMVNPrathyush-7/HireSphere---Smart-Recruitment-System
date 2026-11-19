import { AuthService } from './auth.service.js';

export class AuthController {
  static register(req, res) {
    try {
      const result = AuthService.register(req.body);
      return res.status(201).json({
        message: 'Registration successful',
        ...result
      });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  static login(req, res) {
    try {
      const result = AuthService.login(req.body);
      return res.status(200).json({
        message: 'Login successful',
        ...result
      });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  static getMe(req, res) {
    try {
      const result = AuthService.getMe(req.user.id);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }
}
