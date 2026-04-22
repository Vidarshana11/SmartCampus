package com.smartcampus.api.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Service
public class EmailSenderService {

    private static final Logger log = LoggerFactory.getLogger(EmailSenderService.class);
    private static final String UNIVERSITY_NAME = "National University of Smart Technologies";
    private static final String UNIVERSITY_TEAM_SIGNATURE = "National University of Smart Technologies Team";
    private static final String UNIVERSITY_LOGO_RESOURCE = "static/universityImage.png";
    private static final String UNIVERSITY_LOGO_CID = "university-logo";

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:no-reply@nust.local}")
    private String fromAddress;

    @Value("${spring.mail.username:}")
    private String smtpUsername;

    @Value("${spring.mail.password:}")
    private String smtpPassword;

    public EmailSenderService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendEmailVerification(String toEmail, String fullName, String verificationUrl) {
        String displayName = (fullName == null || fullName.isBlank()) ? "there" : fullName;
        String subject = "Verify your " + UNIVERSITY_NAME + " account";
        String body = "Hi " + displayName + ",\n\n"
            + "Welcome to " + UNIVERSITY_NAME + ". Please verify your email address by clicking the link below:\n"
                + verificationUrl + "\n\n"
                + "If you did not create this account, you can ignore this email.\n\n"
            + UNIVERSITY_TEAM_SIGNATURE;
        send(toEmail, subject, body);
    }

    public void sendEmailVerificationCode(String toEmail, String fullName, String verificationCode) {
        String displayName = (fullName == null || fullName.isBlank()) ? "there" : fullName;
        String subject = "Your " + UNIVERSITY_NAME + " verification code";
        String body = "Hi " + displayName + ",\n\n"
                + "Your verification code is: " + verificationCode + "\n\n"
                + "Enter this code in the app to verify your email address.\n"
                + "This code will expire in 24 hours.\n\n"
                + "If you did not request this, you can ignore this email.\n\n"
            + UNIVERSITY_TEAM_SIGNATURE;

        String htmlBody = buildOtpHtmlEmail(
            displayName,
            "Email Verification Code",
            "Use this one-time code to complete your " + UNIVERSITY_NAME + " account setup.",
            verificationCode,
            "This code will expire in 24 hours.",
            "If you did not create an account, you can safely ignore this message."
        );

        sendHtml(toEmail, subject, body, htmlBody);
    }

    public void sendPasswordReset(String toEmail, String fullName, String resetUrl) {
        String displayName = (fullName == null || fullName.isBlank()) ? "there" : fullName;
        String subject = "Reset your " + UNIVERSITY_NAME + " password";
        String body = "Hi " + displayName + ",\n\n"
                + "We received a request to reset your password. Use the link below:\n"
                + resetUrl + "\n\n"
                + "If you did not request this, you can ignore this email.\n\n"
            + UNIVERSITY_TEAM_SIGNATURE;
        send(toEmail, subject, body);
    }

    public void sendPasswordResetCode(String toEmail, String fullName, String resetCode) {
        String displayName = (fullName == null || fullName.isBlank()) ? "there" : fullName;
        String subject = "Your " + UNIVERSITY_NAME + " password reset code";
        String body = "Hi " + displayName + ",\n\n"
                + "Your password reset code is: " + resetCode + "\n\n"
                + "Enter this code in the app to reset your password.\n"
                + "This code will expire in 30 minutes.\n\n"
                + "If you did not request this, you can ignore this email.\n\n"
            + UNIVERSITY_TEAM_SIGNATURE;

        String htmlBody = buildOtpHtmlEmail(
            displayName,
            "Password Reset Code",
            "Use this one-time code to reset your " + UNIVERSITY_NAME + " password securely.",
            resetCode,
            "This code will expire in 30 minutes.",
            "If you did not request a password reset, no further action is needed."
        );

        sendHtml(toEmail, subject, body, htmlBody);
    }

    private void send(String toEmail, String subject, String body) {
        if (!isSmtpConfigured()) {
            log.warn("SMTP not configured; skipping email send. to={}, subject={}", toEmail, subject);
            log.info("Email body (dev fallback): {}", body);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
        } catch (Exception ex) {
            log.error("Email sending failed to {}", toEmail, ex);
            throw new IllegalStateException("Failed to send email. Please try again.");
        }
    }

        private void sendHtml(String toEmail, String subject, String plainTextBody, String htmlBody) {
                if (!isSmtpConfigured()) {
                        log.warn("SMTP not configured; skipping email send. to={}, subject={}", toEmail, subject);
                        log.info("Email body (dev fallback): {}", plainTextBody);
                        return;
                }

                try {
                        var message = mailSender.createMimeMessage();
                        var helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
                        helper.setFrom(fromAddress);
                        helper.setTo(toEmail);
                        helper.setSubject(subject);
                        helper.setText(plainTextBody, htmlBody);
                        helper.addInline(UNIVERSITY_LOGO_CID, new ClassPathResource(UNIVERSITY_LOGO_RESOURCE));
                        mailSender.send(message);
                } catch (Exception ex) {
                        log.error("HTML email sending failed to {}", toEmail, ex);
                        throw new IllegalStateException("Failed to send email. Please try again.");
                }
        }

        private String buildOtpHtmlEmail(
                        String displayName,
                        String title,
                        String intro,
                        String code,
                        String expiryLine,
                        String safetyNote
        ) {
                String safeDisplayName = escapeHtml(displayName);
                String safeTitle = escapeHtml(title);
                String safeIntro = escapeHtml(intro);
                String safeCode = escapeHtml(code);
                String safeExpiryLine = escapeHtml(expiryLine);
                String safeSafetyNote = escapeHtml(safetyNote);

                return """
                                <!doctype html>
                                <html lang="en">
                                <head>
                                    <meta charset="UTF-8" />
                                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                                    <title>{{TITLE}}</title>
                                </head>
                                <body style="margin:0;padding:0;background:#eaf2f7;font-family:Arial,Helvetica,sans-serif;color:#1e293b;">
                                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eaf2f7;padding:28px 12px;">
                                        <tr>
                                            <td align="center">
                                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #cbd5e1;box-shadow:0 10px 28px rgba(15,23,42,0.10);">
                                                    <tr>
                                                        <td style="background:linear-gradient(125deg,#0b3f6e,#0d5a8c,#0f766e);padding:26px 28px;text-align:center;">
                                                            <img src="cid:{{LOGO_CID}}" alt="University logo" width="88" style="display:block;margin:0 auto 14px auto;border-radius:10px;background:#ffffff;padding:8px;" />
                                                            <h1 style="margin:0;color:#ffffff;font-size:22px;line-height:1.2;font-weight:700;">National University of Smart Technologies Operations Hub</h1>
                                                            <p style="margin:10px 0 0 0;color:#dbeafe;font-size:13px;">University digital services and campus coordination</p>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding:28px;">
                                                            <h2 style="margin:0 0 12px 0;font-size:20px;color:#0f172a;">{{TITLE}}</h2>
                                                            <p style="margin:0 0 14px 0;font-size:15px;color:#334155;">Hello {{NAME}},</p>
                                                            <p style="margin:0 0 20px 0;font-size:15px;color:#475569;line-height:1.6;">{{INTRO}}</p>

                                                            <div style="margin:0 auto 20px auto;max-width:320px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:14px 18px;text-align:center;">
                                                                <p style="margin:0 0 8px 0;font-size:12px;color:#1d4ed8;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">One-Time Verification Code</p>
                                                                <p style="margin:0;font-size:34px;font-weight:800;letter-spacing:0.28em;color:#0b3f6e;">{{CODE}}</p>
                                                            </div>

                                                            <p style="margin:0 0 8px 0;font-size:14px;color:#334155;">{{EXPIRY}}</p>
                                                            <p style="margin:0 0 22px 0;font-size:14px;color:#64748b;">{{SAFETY_NOTE}}</p>

                                                            <p style="margin:0;font-size:13px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:16px;">
                                                                Need help? Contact the campus IT help desk at National University of Smart Technologies support channels.
                                                            </p>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                </body>
                                </html>
                                """
                                .replace("{{TITLE}}", safeTitle)
                                .replace("{{NAME}}", safeDisplayName)
                                .replace("{{INTRO}}", safeIntro)
                                .replace("{{CODE}}", safeCode)
                                .replace("{{EXPIRY}}", safeExpiryLine)
                                .replace("{{SAFETY_NOTE}}", safeSafetyNote)
                                .replace("{{LOGO_CID}}", UNIVERSITY_LOGO_CID);
        }

        private String escapeHtml(String value) {
                if (value == null) {
                        return "";
                }

                return value
                                .replace("&", "&amp;")
                                .replace("<", "&lt;")
                                .replace(">", "&gt;")
                                .replace("\"", "&quot;")
                                .replace("'", "&#39;");
        }

    private boolean isSmtpConfigured() {
        if (isPlaceholder(smtpUsername) || isPlaceholder(smtpPassword) || isPlaceholder(fromAddress)) {
            return false;
        }
        return !smtpUsername.isBlank() && !smtpPassword.isBlank() && !fromAddress.isBlank();
    }

    private boolean isPlaceholder(String value) {
        return value == null || value.contains("YOUR_");
    }
}
