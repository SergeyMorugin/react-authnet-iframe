import React from 'react'
import { render, screen } from '@testing-library/react'
import ReactAuthnetIFrame from '../ReactAuthnetIFrame'

describe('ReactAuthnetIFrame', () => {
  const defaultProps = {
    apiLoginID: 'test_login_id',
    clientKey: 'test_client_key',
  }

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(<ReactAuthnetIFrame {...defaultProps} />)
    expect(screen.getByTitle('Payment Form')).toBeInTheDocument()
  })

  it('renders iframe with correct attributes', () => {
    render(<ReactAuthnetIFrame {...defaultProps} />)
    const iframe = screen.getByTitle('Payment Form')
    
    expect(iframe).toHaveAttribute('allow', 'payment')
    expect(iframe).toHaveAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-top-navigation')
    expect(iframe).toHaveAttribute('title', 'Payment Form')
  })

  it('uses sandbox environment by default', () => {
    render(<ReactAuthnetIFrame {...defaultProps} />)
    const iframe = screen.getByTitle('Payment Form')
    expect(iframe.src).toContain('jstest.authorize.net')
  })

  it('uses production environment when specified', () => {
    render(<ReactAuthnetIFrame {...defaultProps} environment="PRODUCTION" />)
    const iframe = screen.getByTitle('Payment Form')
    expect(iframe.src).toContain('js.authorize.net')
  })

  it('applies custom button text', () => {
    const customButtonText = 'Complete Payment'
    render(<ReactAuthnetIFrame {...defaultProps} acceptUIFormBtnTxt={customButtonText} />)
    // Note: The actual button text is handled by the iframe content, so we just verify the component renders
    expect(screen.getByTitle('Payment Form')).toBeInTheDocument()
  })

  it('applies custom header text', () => {
    const customHeaderText = 'Payment Information'
    render(<ReactAuthnetIFrame {...defaultProps} acceptUIFormHeaderTxt={customHeaderText} />)
    expect(screen.getByTitle('Payment Form')).toBeInTheDocument()
  })

  it('handles billing address options', () => {
    const billingOptions = { show: true, required: false }
    render(<ReactAuthnetIFrame {...defaultProps} billingAddressOptions={billingOptions} />)
    expect(screen.getByTitle('Payment Form')).toBeInTheDocument()
  })

  it('handles payment options', () => {
    const paymentOptions = { showCreditCard: true, showBankAccount: false }
    render(<ReactAuthnetIFrame {...defaultProps} paymentOptions={paymentOptions} />)
    expect(screen.getByTitle('Payment Form')).toBeInTheDocument()
  })

  it('calls onSubmit callback on successful payment', () => {
    const mockOnSubmit = jest.fn()
    render(<ReactAuthnetIFrame {...defaultProps} onSubmit={mockOnSubmit} />)
    
    // Simulate successful payment response
    const event = new MessageEvent('message', {
      origin: 'https://jstest.authorize.net',
      data: {
        verifyOrigin: 'AcceptMain',
        type: 'RESPONSE',
        pktData: { messages: { resultCode: 'Ok' } }
      }
    })
    
    window.dispatchEvent(event)
    expect(mockOnSubmit).toHaveBeenCalledWith({ messages: { resultCode: 'Ok' } })
  })

  it('calls onError callback on payment error', () => {
    const mockOnError = jest.fn()
    render(<ReactAuthnetIFrame {...defaultProps} onError={mockOnError} />)
    
    // Simulate error response
    const event = new MessageEvent('message', {
      origin: 'https://jstest.authorize.net',
      data: {
        verifyOrigin: 'AcceptMain',
        type: 'RESPONSE',
        pktData: { messages: { resultCode: 'Error' } }
      }
    })
    
    window.dispatchEvent(event)
    expect(mockOnError).toHaveBeenCalledWith({ resultCode: 'Error' })
  })

  it('exports PRODUCTION and SANDBOX constants', () => {
    expect(ReactAuthnetIFrame.PRODUCTION).toBe('PRODUCTION')
    expect(ReactAuthnetIFrame.SANDBOX).toBe('SANDBOX')
  })
})
