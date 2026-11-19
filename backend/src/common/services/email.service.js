import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config/index.js';
import { db } from '../database/index.js';

export class EmailService {
  static getTransporter() {
    if (config.smtp.user && config.smtp.pass) {
      return nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass
        }
      });
    }
    return null;
  }

  static wrapTemplate({ title, preheader, bodyHtml }) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; }
    .content { padding: 32px 28px; line-height: 1.6; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .btn { display: inline-block; background: #4f46e5; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 700; font-size: 14px; text-align: center; margin-top: 16px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25); }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .badge-success { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
    .footer { padding: 20px 24px; background: #f1f5f9; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>HireSphere</h1>
      <p>Automated Recruitment & AI Interview Platform</p>
    </div>
    <div class="content">
      ${bodyHtml}
    </div>
    <div class="footer">
      <p>This is an automated notification from HireSphere regarding your recruitment status.</p>
      <p>&copy; ${new Date().getFullYear()} HireSphere Systems. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  static async sendMail({ to, subject, templateType, html }) {
    if (!to) {
      console.warn('[EmailService] Missing recipient email address. Skipping dispatch.');
      return { success: false, reason: 'missing_recipient' };
    }

    const logId = uuidv4();
    const now = new Date().toISOString();
    let sentStatus = 'simulated';

    try {
      if (config.resendApiKey) {
        // Send via Resend REST API (No Google 2FA or App Passwords needed)
        const fromAddress = config.resendFrom || 'HireSphere <onboarding@resend.dev>';
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: fromAddress,
            to: Array.isArray(to) ? to : [to],
            subject,
            html
          })
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.message || `Resend API rejected request with status ${res.status}`);
        }

        sentStatus = 'delivered';
        console.log(`[EmailService] 🚀 Email DELIVERED via Resend to ${to} | ID: ${data.id} | Subject: "${subject}"`);
      } else {
        const transporter = this.getTransporter();

        if (transporter) {
          await transporter.sendMail({
            from: config.smtp.from,
            to,
            subject,
            html
          });
          sentStatus = 'delivered';
          console.log(`[EmailService] ✅ Email DELIVERED to ${to} | Subject: "${subject}"`);
        } else {
          // Simulated mode for local development/demo
          sentStatus = 'simulated';
          console.log(`[EmailService] 📨 [SIMULATED EMAIL DISPATCH] To: ${to}`);
          console.log(`[EmailService] ✉️  Subject: "${subject}"`);
          console.log(`[EmailService] 💡 (Set RESEND_API_KEY in .env to deliver real emails to actual inboxes)`);
        }
      }

      // Record to database email_logs
      try {
        db.prepare(`
          INSERT INTO email_logs (id, to_email, subject, template_type, html_content, sent_status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(logId, to, subject, templateType, html, sentStatus, now);
      } catch (dbErr) {
        console.warn('[EmailService] Failed to record in email_logs:', dbErr.message);
      }

      return { success: true, status: sentStatus, logId };
    } catch (err) {
      console.error(`[EmailService] ❌ Dispatch to ${to} failed:`, err.message);

      try {
        db.prepare(`
          INSERT INTO email_logs (id, to_email, subject, template_type, html_content, sent_status, created_at)
          VALUES (?, ?, ?, ?, ?, 'failed', ?)
        `).run(logId, to, subject, templateType, html, now);
      } catch (e) {}

      return { success: false, error: err.message };
    }
  }

  // 1. Application Submitted Confirmation (To Candidate)
  static async sendApplicationConfirmation({ toEmail, candidateName, jobTitle, companyName, atsScore, skillMatchScore }) {
    const title = `Application Confirmed: ${jobTitle} at ${companyName}`;
    const dashboardLink = `${config.frontendUrl}/candidate/dashboard`;

    const bodyHtml = `
      <h2 style="margin-top: 0; color: #0f172a; font-size: 20px;">Application Successfully Submitted!</h2>
      <p>Hi <strong>${candidateName || 'Candidate'}</strong>,</p>
      <p>Your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been received and verified by our AI hiring pipeline.</p>

      <div class="card">
        <h3 style="margin-top: 0; font-size: 14px; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Initial Screening Snapshot</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Position:</td>
            <td style="padding: 6px 0; font-weight: 700; color: #0f172a; font-size: 13px; text-align: right;">${jobTitle}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Company:</td>
            <td style="padding: 6px 0; font-weight: 700; color: #0f172a; font-size: 13px; text-align: right;">${companyName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">ATS Compatibility:</td>
            <td style="padding: 6px 0; font-weight: 800; color: #047857; font-size: 13px; text-align: right;">${atsScore || 95}% (High)</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Semantic Skill Match:</td>
            <td style="padding: 6px 0; font-weight: 800; color: #4f46e5; font-size: 13px; text-align: right;">${skillMatchScore || 80}%</td>
          </tr>
        </table>
      </div>

      <p style="font-size: 13px; color: #475569;">
        The recruitment team has been notified. You can track your 4-stage hiring pipeline progress (Applied &rarr; Screening &rarr; Interview &rarr; Decision) at any time.
      </p>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${dashboardLink}" class="btn">View Application Progress &rarr;</a>
      </div>
    `;

    const html = this.wrapTemplate({ title, bodyHtml });
    return this.sendMail({
      to: toEmail,
      subject: `Application Received: ${jobTitle} at ${companyName}`,
      templateType: 'application_submitted',
      html
    });
  }

  // 2. Interview Invitation / Proposed Slots (To Candidate)
  static async sendInterviewProposedEmail({ toEmail, candidateName, jobTitle, companyName, proposedSlots }) {
    const title = `Interview Invitation: ${jobTitle} at ${companyName}`;
    const dashboardLink = `${config.frontendUrl}/candidate/dashboard`;

    let slotsList = '';
    if (Array.isArray(proposedSlots)) {
      slotsList = proposedSlots
        .map((s) => `<li style="padding: 6px 0; font-size: 13px; color: #334155;"><strong>${new Date(s).toLocaleString()}</strong></li>`)
        .join('');
    }

    const bodyHtml = `
      <h2 style="margin-top: 0; color: #0f172a; font-size: 20px;">Interview Times Proposed! 📅</h2>
      <p>Hi <strong>${candidateName || 'Candidate'}</strong>,</p>
      <p>Great news! The hiring team at <strong>${companyName}</strong> has reviewed your credentials for <strong>${jobTitle}</strong> and would like to invite you to an interview.</p>

      <div class="card">
        <h3 style="margin-top: 0; font-size: 14px; color: #475569; text-transform: uppercase;">Proposed Time Slots</h3>
        <ul style="margin: 0; padding-left: 20px;">
          ${slotsList || '<li>Check your dashboard for available time slots</li>'}
        </ul>
      </div>

      <p style="font-size: 13px; color: #475569;">
        Please log in to your candidate portal to select your preferred time slot and confirm the interview.
      </p>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${dashboardLink}" class="btn">Select Interview Slot &rarr;</a>
      </div>
    `;

    const html = this.wrapTemplate({ title, bodyHtml });
    return this.sendMail({
      to: toEmail,
      subject: `Interview Invitation: ${jobTitle} at ${companyName}`,
      templateType: 'interview_proposed',
      html
    });
  }

  // 3. Interview Confirmed with Direct "Click to Join" (To Candidate & Recruiter)
  static async sendInterviewConfirmedEmail({ toEmail, candidateName, jobTitle, companyName, confirmedSlot, meetingLink, interviewMode }) {
    const title = `Confirmed: Interview for ${jobTitle} at ${companyName}`;
    const formattedSlot = confirmedSlot ? new Date(confirmedSlot).toLocaleString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : 'Scheduled Slot';

    const joinLink = meetingLink || `${config.frontendUrl}/candidate/dashboard`;

    const bodyHtml = `
      <div style="text-align: center; margin-bottom: 20px;">
        <span class="badge badge-success">✓ Interview Confirmed</span>
      </div>
      <h2 style="margin-top: 0; color: #0f172a; font-size: 22px; text-align: center;">Your Technical Interview is Scheduled!</h2>
      <p>Hi <strong>${candidateName || 'Candidate'}</strong>,</p>
      <p>Your technical screening interview with <strong>${companyName}</strong> has been confirmed. Below are your meeting coordinates:</p>

      <div class="card" style="border-left: 4px solid #4f46e5;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Role:</td>
            <td style="padding: 6px 0; font-weight: 700; color: #0f172a; font-size: 13px; text-align: right;">${jobTitle}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Company:</td>
            <td style="padding: 6px 0; font-weight: 700; color: #0f172a; font-size: 13px; text-align: right;">${companyName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Confirmed Time:</td>
            <td style="padding: 6px 0; font-weight: 800; color: #4f46e5; font-size: 13px; text-align: right;">${formattedSlot}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Format:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #334155; font-size: 13px; text-align: right;">${interviewMode === 'online' ? '📹 Online Video Conference' : '🏢 In-Person'}</td>
          </tr>
        </table>
      </div>

      <div style="background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 12px; padding: 16px; margin: 20px 0; text-align: center;">
        <p style="margin: 0 0 12px; font-size: 13px; font-weight: 600; color: #3730a3;">
          Click the link below when it is time for your interview:
        </p>
        <a href="${joinLink}" class="btn" style="background: #4338ca; font-size: 15px; padding: 14px 32px;">
          📹 Click to Join Meeting Room
        </a>
      </div>

      <div style="font-size: 12px; color: #64748b; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
        <p style="margin: 4px 0;"><strong>Preparation Checklist:</strong></p>
        <ul style="margin: 0; padding-left: 20px; line-height: 1.5;">
          <li>Join 5 minutes early to test your camera and microphone.</li>
          <li>Ensure you are in a quiet room with stable Wi-Fi.</li>
          <li>Have your resume and project links accessible.</li>
        </ul>
      </div>
    `;

    const html = this.wrapTemplate({ title, bodyHtml });
    return this.sendMail({
      to: toEmail,
      subject: `Confirmed: Interview for ${jobTitle} on ${formattedSlot}`,
      templateType: 'interview_confirmed',
      html
    });
  }

  // 4. Application Status Update (Shortlisted / Offer / Rejected)
  static async sendStatusUpdateEmail({ toEmail, candidateName, jobTitle, companyName, status }) {
    const statusTitles = {
      shortlisted: 'You have been Shortlisted! 🎉',
      hired: 'Congratulations! Job Offer Extended! 🏆',
      under_review: 'Application Under Review',
      rejected: 'Application Status Update'
    };

    const readableStatus = statusTitles[status] || `Status updated to ${status}`;
    const dashboardLink = `${config.frontendUrl}/candidate/dashboard`;

    let customMessage = '';
    if (status === 'shortlisted') {
      customMessage = `<p>Congratulations! After evaluating applicant qualifications, the engineering leadership team at <strong>${companyName}</strong> has shortlisted your profile for the next stage of technical evaluation.</p>`;
    } else if (status === 'hired') {
      customMessage = `<p>We are thrilled to inform you that <strong>${companyName}</strong> has selected you for the <strong>${jobTitle}</strong> position! An official offer package is being prepared.</p>`;
    } else if (status === 'rejected') {
      customMessage = `<p>Thank you for taking the time to interview and apply for the <strong>${jobTitle}</strong> role at <strong>${companyName}</strong>. Although the team was impressed by your skills, they have decided to move forward with other candidates whose experience more closely matches current needs.</p>`;
    } else {
      customMessage = `<p>Your application status for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been updated to: <strong>${readableStatus}</strong>.</p>`;
    }

    const bodyHtml = `
      <h2 style="margin-top: 0; color: #0f172a; font-size: 20px;">${readableStatus}</h2>
      <p>Hi <strong>${candidateName || 'Candidate'}</strong>,</p>
      ${customMessage}

      <div style="text-align: center; margin: 28px 0;">
        <a href="${dashboardLink}" class="btn">View Candidate Portal &rarr;</a>
      </div>
    `;

    const html = this.wrapTemplate({ title: readableStatus, bodyHtml });
    return this.sendMail({
      to: toEmail,
      subject: `${readableStatus} - ${jobTitle} at ${companyName}`,
      templateType: `status_${status}`,
      html
    });
  }

  // 5. Recruiter Alert: New Applicant Applied
  static async sendRecruiterNewApplicantAlert({ toEmail, recruiterName, candidateName, jobTitle, atsScore, skillMatchScore }) {
    const title = `New Applicant: ${candidateName} applied for ${jobTitle}`;
    const recruiterLink = `${config.frontendUrl}/recruiter/dashboard`;

    const bodyHtml = `
      <h2 style="margin-top: 0; color: #0f172a; font-size: 20px;">New Candidate Applied</h2>
      <p>Hi <strong>${recruiterName || 'Hiring Team'}</strong>,</p>
      <p>A new applicant has submitted their profile for your <strong>${jobTitle}</strong> opening.</p>

      <div class="card">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Candidate:</td>
            <td style="padding: 6px 0; font-weight: 700; color: #0f172a; font-size: 13px; text-align: right;">${candidateName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Role:</td>
            <td style="padding: 6px 0; font-weight: 700; color: #0f172a; font-size: 13px; text-align: right;">${jobTitle}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">ATS Score:</td>
            <td style="padding: 6px 0; font-weight: 800; color: #047857; font-size: 13px; text-align: right;">${atsScore || 95}%</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Semantic Skill Match:</td>
            <td style="padding: 6px 0; font-weight: 800; color: #4f46e5; font-size: 13px; text-align: right;">${skillMatchScore || 80}%</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${recruiterLink}" class="btn">Review Applicant in Pipeline &rarr;</a>
      </div>
    `;

    const html = this.wrapTemplate({ title, bodyHtml });
    return this.sendMail({
      to: toEmail,
      subject: `New Application: ${candidateName} for ${jobTitle}`,
      templateType: 'recruiter_applicant_alert',
      html
    });
  }

  // Helper to query recent logs
  static getRecentLogs(limit = 20) {
    try {
      return db.prepare('SELECT * FROM email_logs ORDER BY created_at DESC LIMIT ?').all(limit);
    } catch (e) {
      return [];
    }
  }
}

