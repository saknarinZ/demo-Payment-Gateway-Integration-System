package com.payment.gateway.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * GlobalExceptionHandler - จัดการ Exception ทั้งหมดของ Application
 * 
 * ใช้ ProblemDetail (RFC 7807) สำหรับ Error Response
 * ทุก Error จะถูก Log และส่ง Response ในรูปแบบมาตรฐาน
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * จัดการ ResourceNotFoundException (404)
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ProblemDetail handleResourceNotFoundException(ResourceNotFoundException ex) {
        logger.warn("Resource not found: {}", ex.getMessage());
        
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
            HttpStatus.NOT_FOUND,
            ex.getMessage()
        );
        problemDetail.setTitle("Resource Not Found");
        problemDetail.setType(URI.create("https://api.payment-gateway.com/errors/not-found"));
        problemDetail.setProperty("errorCode", ex.getErrorCode());
        problemDetail.setProperty("timestamp", Instant.now());
        
        return problemDetail;
    }

    /**
     * จัดการ InvalidRequestException (400)
     */
    @ExceptionHandler(InvalidRequestException.class)
    public ProblemDetail handleInvalidRequestException(InvalidRequestException ex) {
        logger.warn("Invalid request: {}", ex.getMessage());
        
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
            HttpStatus.BAD_REQUEST,
            ex.getMessage()
        );
        problemDetail.setTitle("Invalid Request");
        problemDetail.setType(URI.create("https://api.payment-gateway.com/errors/invalid-request"));
        problemDetail.setProperty("errorCode", ex.getErrorCode());
        problemDetail.setProperty("timestamp", Instant.now());
        
        return problemDetail;
    }

    /**
     * จัดการ DuplicateResourceException (409)
     */
    @ExceptionHandler(DuplicateResourceException.class)
    public ProblemDetail handleDuplicateResourceException(DuplicateResourceException ex) {
        logger.warn("Duplicate resource: {}", ex.getMessage());
        
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
            HttpStatus.CONFLICT,
            ex.getMessage()
        );
        problemDetail.setTitle("Duplicate Resource");
        problemDetail.setType(URI.create("https://api.payment-gateway.com/errors/duplicate"));
        problemDetail.setProperty("errorCode", ex.getErrorCode());
        problemDetail.setProperty("timestamp", Instant.now());
        
        return problemDetail;
    }

    /**
     * จัดการ WebhookSignatureException (401)
     */
    @ExceptionHandler(WebhookSignatureException.class)
    public ProblemDetail handleWebhookSignatureException(WebhookSignatureException ex) {
        logger.error("Webhook signature verification failed: {}", ex.getMessage());
        
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
            HttpStatus.UNAUTHORIZED,
            ex.getMessage()
        );
        problemDetail.setTitle("Invalid Webhook Signature");
        problemDetail.setType(URI.create("https://api.payment-gateway.com/errors/invalid-signature"));
        problemDetail.setProperty("errorCode", ex.getErrorCode());
        problemDetail.setProperty("timestamp", Instant.now());
        
        return problemDetail;
    }

    /**
     * จัดการ PaymentException (400)
     */
    @ExceptionHandler(PaymentException.class)
    public ProblemDetail handlePaymentException(PaymentException ex) {
        logger.error("Payment error: {}", ex.getMessage());
        
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
            HttpStatus.BAD_REQUEST,
            ex.getMessage()
        );
        problemDetail.setTitle("Payment Error");
        problemDetail.setType(URI.create("https://api.payment-gateway.com/errors/payment-error"));
        problemDetail.setProperty("errorCode", ex.getErrorCode());
        problemDetail.setProperty("timestamp", Instant.now());
        
        return problemDetail;
    }

    /**
     * จัดการ Validation Errors (400)
     * เกิดจาก @Valid annotation
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidationException(MethodArgumentNotValidException ex) {
        logger.warn("Validation failed: {}", ex.getMessage());
        
        // รวบรวม Field Errors ทั้งหมด
        Map<String, String> errors = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            errors.put(error.getField(), error.getDefaultMessage());
        }
        
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
            HttpStatus.BAD_REQUEST,
            "Validation failed for one or more fields"
        );
        problemDetail.setTitle("Validation Error");
        problemDetail.setType(URI.create("https://api.payment-gateway.com/errors/validation"));
        problemDetail.setProperty("errorCode", "VALIDATION_ERROR");
        problemDetail.setProperty("errors", errors);
        problemDetail.setProperty("timestamp", Instant.now());
        
        return problemDetail;
    }

    /**
     * จัดการ IllegalArgumentException (400)
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ProblemDetail handleIllegalArgumentException(IllegalArgumentException ex) {
        logger.warn("Illegal argument: {}", ex.getMessage());
        
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
            HttpStatus.BAD_REQUEST,
            ex.getMessage()
        );
        problemDetail.setTitle("Invalid Argument");
        problemDetail.setType(URI.create("https://api.payment-gateway.com/errors/invalid-argument"));
        problemDetail.setProperty("errorCode", "INVALID_ARGUMENT");
        problemDetail.setProperty("timestamp", Instant.now());
        
        return problemDetail;
    }

    /**
     * จัดการ Exception ทั่วไป (500)
     * Catch-all สำหรับ Exception ที่ไม่ได้จัดการเฉพาะ
     */
    @ExceptionHandler(Exception.class)
    public ProblemDetail handleGenericException(Exception ex) {
        logger.error("Unexpected error occurred", ex);
        
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "An unexpected error occurred. Please try again later."
        );
        problemDetail.setTitle("Internal Server Error");
        problemDetail.setType(URI.create("https://api.payment-gateway.com/errors/internal"));
        problemDetail.setProperty("errorCode", "INTERNAL_ERROR");
        problemDetail.setProperty("timestamp", Instant.now());
        
        return problemDetail;
    }
}
