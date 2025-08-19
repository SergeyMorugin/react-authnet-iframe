import React, { useCallback, useEffect, useRef, useState } from 'react'

// CSS styles as objects to replace styled-components
const containerStyles: React.CSSProperties = {
  width: '100%',
}

const acceptUIContainerStyles: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  maxWidth: '600px',
  margin: '20px auto',
  overflow: 'hidden',
  backgroundColor: '#ffffff',
  transition: 'height 0.3s ease-in-out',
}

const iframeStyles: React.CSSProperties = {
  width: '100%',
  height: '100%',
  border: 'none',
  overflow: 'hidden',
}

const closeButtonHiderStyles: React.CSSProperties = {
  width: '40px',
  height: '40px',
  position: 'absolute',
  backgroundColor: 'white',
  right: '0px',
  top: '0px',
}

export const PRODUCTION = 'PRODUCTION'
export const SANDBOX = 'SANDBOX'

interface BillingAddressOptions {
  show: boolean
  required: boolean
}

interface PaymentOptions {
  showCreditCard: boolean
  showBankAccount: boolean
}

interface AuthnetFrameProps {
  billingAddressOptions?: BillingAddressOptions
  paymentOptions?: PaymentOptions
  apiLoginID: string
  clientKey: string
  acceptUIFormBtnTxt?: string
  acceptUIFormHeaderTxt?: string
  onSubmit?: (response: any) => void
  onError?: (error: any) => void
  onClose?: () => void
  environment?: 'PRODUCTION' | 'SANDBOX'
}

const AuthnetFrame: React.FC<AuthnetFrameProps> = ({
  billingAddressOptions = { show: false, required: true },
  paymentOptions = { showCreditCard: true, showBankAccount: false },
  apiLoginID,
  clientKey,
  acceptUIFormBtnTxt = 'Pay Now',
  acceptUIFormHeaderTxt = 'Payment',
  onSubmit = (r: any) => console.log('AuthnetIFrame response:', r),
  onError = (e: any) => console.error('AuthnetIFrame error:', e),
  onClose = () => console.log('AuthnetIFrame onClose'),
  environment = SANDBOX,
}) => {
  const IFRAME_HEIGHT = 400
  const CONTAINER_ID = 'AcceptUIContainer'
  const IFRAME_BASE_URL = environment === PRODUCTION
    ? 'https://js.authorize.net/'
    : 'https://jstest.authorize.net'

  const [iframeHeight, setIframeHeight] = useState(IFRAME_HEIGHT)

  const containerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const resizeHandlerRef = useRef<(() => void) | null>(null)

  const isMobileDevice = useCallback(() => {
    const ua = navigator.userAgent
    return !!(
      ua.match(/Android/i) ||
      ua.match(/BlackBerry/i) ||
      ua.match(/iPhone|iPad|iPod/i) ||
      ua.match(/Opera Mini/i) ||
      ua.match(/IEMobile/i)
    )
  }, [])

  const updateContainerLayout = useCallback(() => {
    if (!containerRef.current) return

    const container = containerRef.current

    container.style.height = `${iframeHeight}px`
    if (isMobileDevice()) {
      container.style.maxWidth = '100%'
      container.style.margin = '20px 0'
    }
  }, [iframeHeight, isMobileDevice])

  const createThrottledResize = useCallback(() => {
    let timeout: NodeJS.Timeout
    return () => {
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(updateContainerLayout, 30)
    }
  }, [updateContainerLayout])

  const responseHandler = useCallback((response: any) => {
    if (response?.messages?.resultCode === 'Error') {
      onError(response.messages)
    } else {
      onSubmit(response)
    }
  }, [onSubmit, onError])

  const sendMessageToIframe = useCallback((data: any, messageType: string) => {
    if (!iframeRef.current) return

    const message = {
      verifyOrigin: 'AcceptUI',
      type: messageType,
      pktData: data,
    }

    try {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(message, IFRAME_BASE_URL)
      }
    } catch (error) {
      console.error('Error sending message to iframe:', error)
    }
  }, [IFRAME_BASE_URL])

  const handlePostMessage = useCallback((event: MessageEvent) => {
    if (
      event.origin !== IFRAME_BASE_URL ||
      !event.data ||
      typeof event.data !== 'object' ||
      !event.data.verifyOrigin ||
      event.data.verifyOrigin !== 'AcceptMain'
    ) {
      return
    }

    switch (event.data.type) {
      case 'ACK': {
        const configData = {
          billingAddressOptions,
          paymentOptions,
          apiLoginID,
          clientKey,
          acceptUIFormBtnTxt,
          acceptUIFormHeaderTxt,
          parentUrl: window.location.href,
        }
        sendMessageToIframe(configData, 'INIT')
        break
      }

      case 'FIT_WINDOW':
        if (event.data.pktData && event.data.pktData.height) {
          setIframeHeight(event.data.pktData.height)
        }
        break

      case 'RESPONSE':
        responseHandler(event.data.pktData)
        break

      case 'CLOSE_IFRAME':
        onClose()
        break

      default:
        break
    }
  }, [
    billingAddressOptions,
    paymentOptions,
    apiLoginID,
    clientKey,
    acceptUIFormBtnTxt,
    acceptUIFormHeaderTxt,
    responseHandler,
    sendMessageToIframe,
    IFRAME_BASE_URL,
    onClose,
  ])

  const getIframeUrl = useCallback(() => {
    const messageData = {
      verifyOrigin: 'AcceptUI',
      type: 'SYNC',
      pktData: window.location.origin,
    }

    return `${IFRAME_BASE_URL}/v3/acceptMain/acceptMain.html#${encodeURIComponent(
      JSON.stringify(messageData))}`
  }, [IFRAME_BASE_URL])

  useEffect(() => {
    window.addEventListener('message', handlePostMessage)
    return () => window.removeEventListener('message', handlePostMessage)
  }, [handlePostMessage])

  useEffect(() => {
    const throttledResize = createThrottledResize()
    resizeHandlerRef.current = throttledResize
    window.addEventListener('resize', throttledResize)
    updateContainerLayout()

    return () => {
      window.removeEventListener('resize', throttledResize)
    }
  }, [createThrottledResize, updateContainerLayout])

  useEffect(() => {
    updateContainerLayout()
  }, [iframeHeight, updateContainerLayout])

  const dynamicContainerStyles: React.CSSProperties = {
    ...acceptUIContainerStyles,
    height: `${iframeHeight}px`,
  }

  return (
    <div style={containerStyles}>
      <div
        ref={containerRef}
        id={CONTAINER_ID}
        style={dynamicContainerStyles}
      >
        <iframe
          id="react-authnet-iframe"
          ref={iframeRef}
          src={getIframeUrl()}
          title="Payment Form"
          allow="payment"
          sandbox="allow-scripts allow-same-origin allow-forms allow-top-navigation"
          style={iframeStyles}
        />
        <div style={closeButtonHiderStyles}></div>
      </div>
    </div>
  )
}

export default Object.assign(AuthnetFrame, {
  PRODUCTION,
  SANDBOX
})