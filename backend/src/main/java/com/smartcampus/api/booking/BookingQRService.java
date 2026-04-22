package com.smartcampus.api.booking;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;

@Service
@RequiredArgsConstructor
public class BookingQRService {

    private final BookingRepository bookingRepository;

    public byte[] generateQRCode(Long bookingId) throws WriterException, IOException {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getStatus() != BookingStatus.APPROVED) {
            throw new RuntimeException("QR code only available for APPROVED bookings");
        }

        String qrContent = String.format(
            "SMARTCAMPUS-BOOKING\nID: %d\nResource: %s\nUser: %s\nStart: %s\nEnd: %s\nStatus: %s",
            booking.getId(),
            booking.getResource().getName(),
            booking.getUser().getName(),
            booking.getStartTime().toString(),
            booking.getEndTime().toString(),
            booking.getStatus().toString()
        );

        QRCodeWriter qrCodeWriter = new QRCodeWriter();
        BitMatrix bitMatrix = qrCodeWriter.encode(qrContent, BarcodeFormat.QR_CODE, 300, 300);

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);
        return outputStream.toByteArray();
    }

    public String generateQRCodeBase64(Long bookingId) throws WriterException, IOException {
        byte[] qrBytes = generateQRCode(bookingId);
        return Base64.getEncoder().encodeToString(qrBytes);
    }

    public BookingVerificationDTO verifyBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        return BookingVerificationDTO.builder()
                .bookingId(booking.getId())
                .resourceName(booking.getResource().getName())
                .userName(booking.getUser().getName())
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .status(booking.getStatus())
                .isValid(booking.getStatus() == BookingStatus.APPROVED)
                .build();
    }
}