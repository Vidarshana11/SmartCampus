package com.smartcampus.api.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailSenderService {

    private static final Logger log = LoggerFactory.getLogger(EmailSenderService.class);

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:no-reply@smartcampus.local}")
    private String fromAddress;

    public EmailSenderService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendEmailVerification(String toEmail, String fullName, String verificationUrl) {
        String displayName = (fullName == null || fullName.isBlank()) ? "there" : fullName;
        String subject = "Verify your SmartCampus account";
        String body = "Hi " + displayName + ",\n\n"
                + "Welcome to SmartCampus. Please verify your email address by clicking the link below:\n"
                + verificationUrl + "\n\n"
                + "If you did not create this account, you can ignore this email.\n\n"
                + "SmartCampus Team";
        send(toEmail, subject, body);
    }

    public void sendPasswordReset(String toEmail, String fullName, String resetUrl) {
        String displayName = (fullName == null || fullName.isBlank()) ? "there" : fullName;
        String subject = "Reset your SmartCampus password";
        String body = "Hi " + displayName + ",\n\n"
                + "We received a request to reset your password. Use the link below:\n"
                + resetUrl + "\n\n"
                + "If you did not request this, you can ignore this email.\n\n"
                + "SmartCampus Team";
        send(toEmail, subject, body);
    }

    private void send(String toEmail, String subject, String body) {
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
}
