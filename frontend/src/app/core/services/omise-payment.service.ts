/**
 * OmisePaymentService - Service สำหรับจัดการ Payment ผ่าน Omise
 * 
 * ใช้ Angular Signals สำหรับ State Management
 * ไม่ใช้ RxJS BehaviorSubject
 * 
 * ขั้นตอนการทำงาน:
 * 1. โหลด Omise.js จาก CDN
 * 2. ดึง Public Key จาก Backend
 * 3. Tokenize ข้อมูลบัตร
 * 4. ส่ง Token ไป Backend เพื่อสร้าง Charge
 */

import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// ============================================================================
// Types & Interfaces
// ============================================================================

/** ข้อมูลบัตรเครดิต/เดบิต */
export interface CardInfo {
  name: string;          // ชื่อบนบัตร
  number: string;        // เลขบัตร
  expirationMonth: string;  // เดือนหมดอายุ (01-12)
  expirationYear: string;   // ปีหมดอายุ (4 หลัก)
  securityCode: string;     // CVV/CVC
}

/** Request สำหรับสร้าง Charge */
export interface ChargeRequest {
  token: string;
  amount: number;        // หน่วย: สตางค์
  currency: string;
  description?: string;
  returnUri?: string;
  orderId?: string;
  customerEmail?: string;
  customerName?: string;
}

/** Response จาก Omise */
export interface ChargeResponse {
  id: string;
  status: string;
  amount: number;
  currency: string;
  paid: boolean;
  authorizeUri?: string;
  returnUri?: string;
  failureCode?: string;
  failureMessage?: string;
  transactionId?: string;
  cardLastDigits?: string;
  cardBrand?: string;
  createdAt?: string;
}

/** Configuration จาก Backend */
export interface OmiseConfig {
  publicKey: string;
  testMode: string;
}

/** สถานะการชำระเงิน */
export type PaymentState = 'idle' | 'loading' | 'tokenizing' | 'charging' | 'success' | 'failed' | 'requires_auth';

// ============================================================================
// Declare Omise.js Global
// ============================================================================
declare global {
  interface Window {
    Omise: {
      setPublicKey: (key: string) => void;
      createToken: (
        type: string,
        data: object,
        callback: (statusCode: number, response: any) => void
      ) => void;
    };
    OmiseCard: any;
  }
}

// ============================================================================
// Service
// ============================================================================

@Injectable({
  providedIn: 'root'
})
export class OmisePaymentService {

  private readonly http = inject(HttpClient);
  private readonly API_URL = '/api/v1/omise';

  // =========================================================================
  // State (Signals)
  // =========================================================================

  /** สถานะปัจจุบัน */
  private readonly _state = signal<PaymentState>('idle');
  readonly state = this._state.asReadonly();

  /** Error message */
  private readonly _error = signal<string | null>(null);
  readonly error = this._error.asReadonly();

  /** Charge Response */
  private readonly _chargeResponse = signal<ChargeResponse | null>(null);
  readonly chargeResponse = this._chargeResponse.asReadonly();

  /** Public Key จาก Backend */
  private readonly _publicKey = signal<string>('');
  readonly publicKey = this._publicKey.asReadonly();

  /** Test Mode? */
  private readonly _isTestMode = signal<boolean>(true);
  readonly isTestMode = this._isTestMode.asReadonly();

  /** Omise.js Loaded? */
  private readonly _omiseLoaded = signal<boolean>(false);
  readonly omiseLoaded = this._omiseLoaded.asReadonly();

  // =========================================================================
  // Computed
  // =========================================================================

  /** กำลังโหลดอยู่? */
  readonly isLoading = computed(() => {
    const s = this._state();
    return s === 'loading' || s === 'tokenizing' || s === 'charging';
  });

  /** สำเร็จ? */
  readonly isSuccess = computed(() => this._state() === 'success');

  /** ล้มเหลว? */
  readonly isFailed = computed(() => this._state() === 'failed');

  /** ต้อง Redirect ไป 3D Secure? */
  readonly requiresAuth = computed(() => this._state() === 'requires_auth');

  /** URL สำหรับ 3D Secure */
  readonly authorizeUri = computed(() => this._chargeResponse()?.authorizeUri);

  // =========================================================================
  // Initialization
  // =========================================================================

  constructor() {
    // โหลด Omise.js และ Config เมื่อ Service ถูกสร้าง
    this.initialize();
  }

  /**
   * เริ่มต้น Service
   */
  private async initialize(): Promise<void> {
    try {
      // 1. โหลด Omise.js
      await this.loadOmiseScript();
      
      // 2. ดึง Config จาก Backend
      await this.loadConfig();
      
    } catch (err) {
      console.error('Failed to initialize Omise:', err);
      this._error.set('Failed to initialize payment system');
    }
  }

  /**
   * โหลด Omise.js จาก CDN
   */
  private loadOmiseScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      // ถ้าโหลดแล้ว ไม่ต้องโหลดซ้ำ
      if (window.Omise) {
        this._omiseLoaded.set(true);
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.omise.co/omise.js';
      script.async = true;
      
      script.onload = () => {
        console.log('Omise.js loaded successfully');
        this._omiseLoaded.set(true);
        resolve();
      };
      
      script.onerror = () => {
        console.error('Failed to load Omise.js');
        reject(new Error('Failed to load Omise.js'));
      };
      
      document.head.appendChild(script);
    });
  }

  /**
   * ดึง Config (Public Key) จาก Backend
   */
  private async loadConfig(): Promise<void> {
    try {
      const config = await this.http.get<OmiseConfig>(`${this.API_URL}/config`).toPromise();
      
      if (config) {
        this._publicKey.set(config.publicKey);
        this._isTestMode.set(config.testMode === 'true');
        
        // ตั้งค่า Public Key ให้ Omise.js
        if (window.Omise) {
          window.Omise.setPublicKey(config.publicKey);
          console.log('Omise configured with public key');
        }
      }
    } catch (err) {
      console.error('Failed to load Omise config:', err);
      throw err;
    }
  }

  // =========================================================================
  // Public Methods
  // =========================================================================

  /**
   * Tokenize ข้อมูลบัตร
   * 
   * @param card ข้อมูลบัตร
   * @returns Token string
   */
  createToken(card: CardInfo): Promise<string> {
    return new Promise((resolve, reject) => {
      this._state.set('tokenizing');
      this._error.set(null);

      if (!window.Omise) {
        this._state.set('failed');
        this._error.set('Omise.js is not loaded');
        reject(new Error('Omise.js is not loaded'));
        return;
      }

      // เรียก Omise.js createToken
      window.Omise.createToken('card', {
        name: card.name,
        number: card.number.replace(/\s/g, ''),  // ลบ spaces
        expiration_month: parseInt(card.expirationMonth),
        expiration_year: parseInt(card.expirationYear),
        security_code: card.securityCode
      }, (statusCode, response) => {
        if (statusCode === 200 && response.id) {
          console.log('Token created:', response.id);
          resolve(response.id);
        } else {
          const errorMessage = response.message || 'Failed to create token';
          console.error('Token creation failed:', errorMessage);
          this._state.set('failed');
          this._error.set(errorMessage);
          reject(new Error(errorMessage));
        }
      });
    });
  }

  /**
   * สร้าง Charge
   * 
   * @param request ChargeRequest
   * @returns ChargeResponse
   */
  async createCharge(request: ChargeRequest): Promise<ChargeResponse> {
    this._state.set('charging');
    this._error.set(null);
    this._chargeResponse.set(null);

    try {
      const response = await this.http.post<ChargeResponse>(
        `${this.API_URL}/charges`,
        request
      ).toPromise();

      if (!response) {
        throw new Error('Empty response from server');
      }

      this._chargeResponse.set(response);

      // ตรวจสอบสถานะ
      if (response.paid) {
        this._state.set('success');
      } else if (response.authorizeUri) {
        this._state.set('requires_auth');
      } else if (response.failureCode) {
        this._state.set('failed');
        this._error.set(response.failureMessage || 'Payment failed');
      } else {
        this._state.set('success');  // pending ก็ถือว่าสำเร็จเบื้องต้น
      }

      return response;

    } catch (err: any) {
      console.error('Charge failed:', err);
      this._state.set('failed');
      this._error.set(err.error?.failureMessage || err.message || 'Payment failed');
      throw err;
    }
  }

  /**
   * Pay with Card (ครบ Flow: Tokenize + Charge)
   * 
   * @param card ข้อมูลบัตร
   * @param amount จำนวนเงิน (บาท)
   * @param description คำอธิบาย
   * @returns ChargeResponse
   */
  async payWithCard(
    card: CardInfo,
    amount: number,
    description?: string,
    options?: {
      returnUri?: string;
      orderId?: string;
      customerEmail?: string;
      customerName?: string;
    }
  ): Promise<ChargeResponse> {
    // 1. Tokenize
    const token = await this.createToken(card);

    // 2. Charge
    return this.createCharge({
      token,
      amount: Math.round(amount * 100),  // แปลงเป็นสตางค์
      currency: 'THB',
      description,
      ...options
    });
  }

  /**
   * ดึงข้อมูล Charge
   */
  async getCharge(chargeId: string): Promise<ChargeResponse> {
    const response = await this.http.get<ChargeResponse>(
      `${this.API_URL}/charges/${chargeId}`
    ).toPromise();
    
    if (response) {
      this._chargeResponse.set(response);
    }
    
    return response!;
  }

  /**
   * Reset State
   */
  reset(): void {
    this._state.set('idle');
    this._error.set(null);
    this._chargeResponse.set(null);
  }

  /**
   * Redirect ไป 3D Secure
   */
  redirectToAuthorize(): void {
    const uri = this._chargeResponse()?.authorizeUri;
    if (uri) {
      window.location.href = uri;
    }
  }
}
