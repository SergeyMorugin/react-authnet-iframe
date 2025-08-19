import React from 'react'

export interface BillingAddressOptions {
  show: boolean
  required: boolean
}

export interface PaymentOptions {
  showCreditCard: boolean
  showBankAccount: boolean
}

export interface AuthnetFrameProps {
  billingAddressOptions?: BillingAddressOptions
  paymentOptions?: PaymentOptions
  apiLoginID: string
  clientKey: string
  acceptUIFormBtnTxt?: string
  acceptUIFormHeaderTxt?: string
  onSubmit?: (response: any) => void
  onError?: (error: any) => void
  environment?: 'PRODUCTION' | 'SANDBOX'
}

export declare const ReactAuthnetIFrame: React.FC<AuthnetFrameProps>
export declare const PRODUCTION: 'PRODUCTION'
export declare const SANDBOX: 'SANDBOX'
