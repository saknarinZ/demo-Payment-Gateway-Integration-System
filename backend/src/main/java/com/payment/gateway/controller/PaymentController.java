package com.payment.gateway.controller;

import com.payment.gateway.dto.*;
import com.payment.gateway.entity.PaymentStatus;
import com.payment.gateway.service.PaymentService;
import com.payment.gateway.service.TransactionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * PaymentController - REST Controller สำหรับจัดการ Payment
 * 
 * Endpoints:
 * - POST /api/v1/payments - สร้าง Payment ใหม่
 * - GET /api/v1/payments - ดึงรายการ Payment ทั้งหมด
 * - GET /api/v1/payments/{referenceId} - ดึง Payment ตาม Reference ID
 * - POST /api/v1/payments/{referenceId}/complete - ยืนยันการชำระเงิน
 * - POST /api/v1/payments/{referenceId}/cancel - ยกเลิก Payment
 * - POST /api/v1/payments/refund - คืนเงิน
 * - GET /api/v1/payments/{id}/transactions - ดึงรายการ Transaction
 */
@RestController
@RequestMapping("/api/v1/payments")
@CrossOrigin(origins = "*") // ในระบบจริงควรกำหนด Origins ที่ชัดเจน
@Tag(name = "Payments", description = "🛒 จัดการ Payment Transactions - สร้าง, ดู, ยกเลิก, คืนเงิน")
@SecurityRequirement(name = "X-API-Key")
public class PaymentController {

    private final PaymentService paymentService;
    private final TransactionService transactionService;

    public PaymentController(PaymentService paymentService, TransactionService transactionService) {
        this.paymentService = paymentService;
        this.transactionService = transactionService;
    }

    /**
     * สร้าง Payment ใหม่
     * 
     * @param request CreatePaymentRequest
     * @param apiKey API Key จาก Header
     * @return PaymentResponse
     */
    @PostMapping
    @Operation(
        summary = "สร้าง Payment ใหม่",
        description = "สร้าง Payment Transaction ใหม่ พร้อม Reference ID สำหรับติดตามสถานะ"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "201",
            description = "สร้าง Payment สำเร็จ",
            content = @Content(schema = @Schema(implementation = PaymentResponse.class))
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Request ไม่ถูกต้อง หรือ Order ID ซ้ำ",
            content = @Content(schema = @Schema(implementation = ProblemDetail.class))
        ),
        @ApiResponse(
            responseCode = "401",
            description = "API Key ไม่ถูกต้อง",
            content = @Content(schema = @Schema(implementation = ProblemDetail.class))
        )
    })
    public ResponseEntity<PaymentResponse> createPayment(
            @Valid @RequestBody CreatePaymentRequest request,
            @Parameter(description = "API Key ของ Merchant")
            @RequestHeader(value = "X-API-Key", defaultValue = "pk_live_demo_key_for_testing") String apiKey) {
        
        PaymentResponse response = paymentService.createPayment(request, apiKey);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * ดึงรายการ Payment ทั้งหมด (พร้อม Pagination)
     * 
     * @param page หน้าที่ต้องการ (default: 0)
     * @param size จำนวนต่อหน้า (default: 20)
     * @param status กรอง Status (optional)
     * @return Page ของ PaymentSummary
     */
    @GetMapping
    @Operation(
        summary = "ดึงรายการ Payment ทั้งหมด",
        description = "ดึงรายการ Payment พร้อม Pagination และ Filter ตามสถานะ"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "สำเร็จ"
        )
    })
    public ResponseEntity<PageResponse<PaymentSummary>> getAllPayments(
            @Parameter(description = "หน้าที่ต้องการ (เริ่มจาก 0)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "จำนวน items ต่อหน้า")
            @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "กรองตามสถานะ")
            @RequestParam(required = false) PaymentStatus status) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        
        PageResponse<PaymentSummary> response;
        if (status != null) {
            response = paymentService.getPaymentsByStatus(status, pageable);
        } else {
            response = paymentService.getAllPayments(pageable);
        }
        
        return ResponseEntity.ok(response);
    }

    /**
     * ดึง Payment ตาม Reference ID
     * 
     * @param referenceId Reference ID
     * @return PaymentResponse
     */
    @GetMapping("/{referenceId}")
    @Operation(
        summary = "ดึง Payment ตาม Reference ID",
        description = "ดึงรายละเอียด Payment จาก Reference ID"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "สำเร็จ",
            content = @Content(schema = @Schema(implementation = PaymentResponse.class))
        ),
        @ApiResponse(
            responseCode = "404",
            description = "ไม่พบ Payment",
            content = @Content(schema = @Schema(implementation = ProblemDetail.class))
        )
    })
    public ResponseEntity<PaymentResponse> getPaymentByReferenceId(
            @Parameter(description = "Reference ID ของ Payment (เช่น PAY-XXXXXXXX)")
            @PathVariable String referenceId) {
        PaymentResponse response = paymentService.getPaymentByReferenceId(referenceId);
        return ResponseEntity.ok(response);
    }

    /**
     * ยืนยันการชำระเงินสำเร็จ (จำลอง)
     * 
     * @param referenceId Reference ID
     * @return PaymentResponse
     */
    @PostMapping("/{referenceId}/complete")
    @Operation(
        summary = "ยืนยันการชำระเงินสำเร็จ",
        description = "อัพเดทสถานะ Payment เป็น COMPLETED (ใช้สำหรับทดสอบ)"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "สำเร็จ",
            content = @Content(schema = @Schema(implementation = PaymentResponse.class))
        ),
        @ApiResponse(
            responseCode = "400",
            description = "ไม่สามารถ Complete ได้ (เช่น หมดอายุ, สถานะไม่ถูกต้อง)",
            content = @Content(schema = @Schema(implementation = ProblemDetail.class))
        ),
        @ApiResponse(
            responseCode = "404",
            description = "ไม่พบ Payment",
            content = @Content(schema = @Schema(implementation = ProblemDetail.class))
        )
    })
    public ResponseEntity<PaymentResponse> completePayment(
            @Parameter(description = "Reference ID ของ Payment")
            @PathVariable String referenceId) {
        PaymentResponse response = paymentService.completePayment(referenceId);
        return ResponseEntity.ok(response);
    }

    /**
     * ยกเลิก Payment
     * 
     * @param referenceId Reference ID
     * @param reason เหตุผล (optional)
     * @return PaymentResponse
     */
    @PostMapping("/{referenceId}/cancel")
    @Operation(
        summary = "ยกเลิก Payment",
        description = "ยกเลิก Payment ที่ยังไม่ถูก Complete (สถานะ PENDING/PROCESSING)"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "สำเร็จ",
            content = @Content(schema = @Schema(implementation = PaymentResponse.class))
        ),
        @ApiResponse(
            responseCode = "400",
            description = "ไม่สามารถยกเลิกได้ (เช่น ชำระเงินแล้ว)",
            content = @Content(schema = @Schema(implementation = ProblemDetail.class))
        )
    })
    public ResponseEntity<PaymentResponse> cancelPayment(
            @Parameter(description = "Reference ID ของ Payment")
            @PathVariable String referenceId,
            @Parameter(description = "เหตุผลในการยกเลิก")
            @RequestParam(defaultValue = "Cancelled by user") String reason) {
        
        PaymentResponse response = paymentService.cancelPayment(referenceId, reason);
        return ResponseEntity.ok(response);
    }

    /**
     * คืนเงิน (Refund)
     * 
     * @param request RefundRequest
     * @return PaymentResponse
     */
    @PostMapping("/refund")
    @Operation(
        summary = "คืนเงิน (Refund)",
        description = "คืนเงินทั้งหมดหรือบางส่วน สำหรับ Payment ที่ COMPLETED แล้ว"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "สำเร็จ",
            content = @Content(schema = @Schema(implementation = PaymentResponse.class))
        ),
        @ApiResponse(
            responseCode = "400",
            description = "ไม่สามารถคืนเงินได้ (เช่น ยอดเกินกว่าที่ชำระ)",
            content = @Content(schema = @Schema(implementation = ProblemDetail.class))
        )
    })
    public ResponseEntity<PaymentResponse> refundPayment(
            @Valid @RequestBody RefundRequest request) {
        PaymentResponse response = paymentService.refundPayment(request);
        return ResponseEntity.ok(response);
    }

    /**
     * ดึงรายการ Transaction ของ Payment
     * 
     * @param id Payment ID
     * @return รายการ TransactionResponse
     */
    @GetMapping("/{id}/transactions")
    @Operation(
        summary = "ดึงรายการ Transaction",
        description = "ดึงรายการ Transaction ทั้งหมดของ Payment"
    )
    public ResponseEntity<List<TransactionResponse>> getPaymentTransactions(
            @Parameter(description = "Payment ID")
            @PathVariable Long id) {
        List<TransactionResponse> response = transactionService.getTransactionsByPaymentId(id);
        return ResponseEntity.ok(response);
    }

    /**
     * ดึงสถิติสำหรับ Dashboard
     * 
     * @return DashboardStats
     */
    @GetMapping("/stats")
    @Tag(name = "Dashboard")
    @Operation(
        summary = "ดึงสถิติ Dashboard",
        description = "ดึงข้อมูลสถิติสำหรับแสดงบน Dashboard (ยอดรวม, จำนวน, สถานะต่างๆ)"
    )
    public ResponseEntity<DashboardStats> getDashboardStats() {
        DashboardStats stats = paymentService.getDashboardStats();
        return ResponseEntity.ok(stats);
    }
}
