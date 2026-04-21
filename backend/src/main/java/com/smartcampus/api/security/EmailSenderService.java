package com.smartcampus.api.security;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailSenderService {

    private static final Logger log = LoggerFactory.getLogger(EmailSenderService.class);
    private static final String BRAND_FULL_NAME = "National University of Smart Technologies";
    private static final String BRAND_TEAM_NAME = BRAND_FULL_NAME + " Team";
    private static final String LOGO_CID = "universityLogo";

    private final JavaMailSender mailSender;
    private final ClassPathResource logoResource = new ClassPathResource("static/universityImage.png");

    @Value("${app.mail.from:no-reply@nust.local}")
    private String fromAddress;

    public EmailSenderService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendEmailVerification(String toEmail, String fullName, String verificationUrl) {
        String displayName = (fullName == null || fullName.isBlank()) ? "there" : fullName;
        String subject = "Verify your " + BRAND_FULL_NAME + " account";
        String body = "Hi " + displayName + ",\n\n"
            + "Welcome to " + BRAND_FULL_NAME + ". Please verify your email address by clicking the link below:\n"
                + verificationUrl + "\n\n"
                + "If you did not create this account, you can ignore this email.\n\n"
            + BRAND_TEAM_NAME;

        String htmlBody = buildEmailHtml(
            displayName,
            "Verify your email address",
            "Welcome to " + escapeHtml(BRAND_FULL_NAME) + ". Please verify your email address using the button below:",
            "<a href=\"" + escapeHtml(verificationUrl) + "\" style=\"display:inline-block;background:#003366;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;\">Verify email</a>"
                + "<p style=\"margin:16px 0 0 0;color:#4b5563;\">If you did not create this account, you can ignore this email.</p>"
        );

        send(toEmail, subject, body, htmlBody);
    }

    public void sendEmailVerificationCode(String toEmail, String fullName, String verificationCode) {
        String displayName = (fullName == null || fullName.isBlank()) ? "there" : fullName;
        String subject = "Your " + BRAND_FULL_NAME + " verification code";
        String body = "Hi " + displayName + ",\n\n"
                + "Your verification code is: " + verificationCode + "\n\n"
                + "Enter this code in the app to verify your email address.\n"
                + "This code will expire in 24 hours.\n\n"
                + "If you did not request this, you can ignore this email.\n\n"
            + BRAND_TEAM_NAME;

        String htmlBody = buildEmailHtml(
            displayName,
            "Email verification code",
            "Use this verification code to complete your account setup:",
            formatCodeBlock(verificationCode)
                + "<p style=\"margin:16px 0 0 0;color:#4b5563;\">Enter this code in the app to verify your email address. This code expires in 24 hours.</p>"
                + "<p style=\"margin:12px 0 0 0;color:#4b5563;\">If you did not request this, you can ignore this email.</p>"
        );

        send(toEmail, subject, body, htmlBody);
    }

    public void sendPasswordReset(String toEmail, String fullName, String resetUrl) {
        String displayName = (fullName == null || fullName.isBlank()) ? "there" : fullName;
        String subject = "Reset your " + BRAND_FULL_NAME + " password";
        String body = "Hi " + displayName + ",\n\n"
                + "We received a request to reset your password. Use the link below:\n"
                + resetUrl + "\n\n"
                + "If you did not request this, you can ignore this email.\n\n"
            + BRAND_TEAM_NAME;

        String htmlBody = buildEmailHtml(
            displayName,
            "Reset your password",
            "We received a request to reset your password. Use the button below:",
            "<a href=\"" + escapeHtml(resetUrl) + "\" style=\"display:inline-block;background:#003366;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;\">Reset password</a>"
                + "<p style=\"margin:16px 0 0 0;color:#4b5563;\">If you did not request this, you can ignore this email.</p>"
        );

        send(toEmail, subject, body, htmlBody);
    }

    public void sendPasswordResetCode(String toEmail, String fullName, String resetCode) {
        String displayName = (fullName == null || fullName.isBlank()) ? "there" : fullName;
        String subject = "Your " + BRAND_FULL_NAME + " password reset code";
        String body = "Hi " + displayName + ",\n\n"
                + "Your password reset code is: " + resetCode + "\n\n"
                + "Enter this code in the app to reset your password.\n"
                + "This code will expire in 30 minutes.\n\n"
                + "If you did not request this, you can ignore this email.\n\n"
            + BRAND_TEAM_NAME;

        String htmlBody = buildEmailHtml(
            displayName,
            "Password reset code",
            "Use this code to reset your password:",
            formatCodeBlock(resetCode)
                + "<p style=\"margin:16px 0 0 0;color:#4b5563;\">Enter this code in the app to reset your password. This code expires in 30 minutes.</p>"
                + "<p style=\"margin:12px 0 0 0;color:#4b5563;\">If you did not request this, you can ignore this email.</p>"
        );

        send(toEmail, subject, body, htmlBody);
    }

    private void send(String toEmail, String subject, String plainBody, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                message,
                MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
                "UTF-8"
            );

            helper.setFrom(fromAddress);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(plainBody, htmlBody);

            if (logoResource.exists()) {
                helper.addInline(LOGO_CID, logoResource, "image/png");
            }

            mailSender.send(message);
        } catch (Exception ex) {
            log.error("Email sending failed to {}", toEmail, ex);
            throw new IllegalStateException("Failed to send email. Please try again.");
        }
    }

    private String buildEmailHtml(String displayName, String title, String introText, String contentHtml) {
        String logoHtml = logoResource.exists()
            ? "<img src=\"cid:" + LOGO_CID + "\" alt=\"" + escapeHtml(BRAND_FULL_NAME) + " logo\" style=\"width:120px;max-width:100%;height:auto;display:block;margin:0 auto 16px auto;\" />"
            : "<div style=\"font-size:20px;font-weight:700;color:#003366;text-align:center;margin-bottom:16px;\">" + escapeHtml(BRAND_FULL_NAME) + "</div>";

        return "<!doctype html>"
            + "<html><body style=\"margin:0;padding:24px;background:#f3f4f6;font-family:Segoe UI,Arial,sans-serif;color:#111827;\">"
            + "<table role=\"presentation\" style=\"max-width:640px;width:100%;margin:0 auto;border-collapse:collapse;\">"
            + "<tr><td style=\"background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;\">"
            + logoHtml
            + "<h2 style=\"margin:0 0 14px 0;color:#003366;font-size:22px;\">" + escapeHtml(title) + "</h2>"
            + "<p style=\"margin:0 0 12px 0;color:#111827;\">Hi " + escapeHtml(displayName) + ",</p>"
            + "<p style=\"margin:0 0 16px 0;color:#374151;\">" + introText + "</p>"
            + contentHtml
            + "<p style=\"margin:24px 0 0 0;color:#111827;\">" + escapeHtml(BRAND_TEAM_NAME) + "</p>"
            + "</td></tr>"
            + "</table>"
            + "</body></html>";
    }

    private String formatCodeBlock(String code) {
        return "<div style=\"margin:12px 0;padding:14px 16px;border:1px dashed #9ca3af;border-radius:10px;background:#f9fafb;font-size:28px;font-weight:700;letter-spacing:6px;color:#003366;text-align:center;\">"
            + escapeHtml(code)
            + "</div>";
    }

    private String escapeHtml(String value) {
        if (value == null) return "";
        return value
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&#39;");
    }
}
