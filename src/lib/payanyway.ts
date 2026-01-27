import { md5 } from './md5'

// PayAnyWay configuration
const PAW_CONFIG = {
  MNT_ID: '74730556',
  MNT_INTEGRITY_CODE: 'amx50100',
  MNT_TEST_MODE: '0', // 0 = боевой режим
  MNT_CURRENCY_CODE: 'RUB',
  AMOUNT: '10.00', // Сумма консультации
  BASE_URL: 'https://super-booking-production.up.railway.app',
}

interface PaymentParams {
  appointmentId: string
  clientEmail: string
  clientName: string
  lawyerName: string
  date?: string
  time?: string
}

// Generate MD5 signature for payment form
function generateSignature(params: {
  mntId: string
  transactionId: string
  amount: string
  currencyCode: string
  subscriberId: string
  testMode: string
  integrityCode: string
}): string {
  const signatureString = 
    params.mntId +
    params.transactionId +
    params.amount +
    params.currencyCode +
    params.subscriberId +
    params.testMode +
    params.integrityCode
  
  return md5(signatureString)
}

// Generate payment URL for PayAnyWay
export function generatePaymentUrl(params: PaymentParams): string {
  const transactionId = `${params.appointmentId}|${Date.now()}`
  const description = `Консультация юриста: ${params.lawyerName}`
  
  const signature = generateSignature({
    mntId: PAW_CONFIG.MNT_ID,
    transactionId,
    amount: PAW_CONFIG.AMOUNT,
    currencyCode: PAW_CONFIG.MNT_CURRENCY_CODE,
    subscriberId: params.clientEmail,
    testMode: PAW_CONFIG.MNT_TEST_MODE,
    integrityCode: PAW_CONFIG.MNT_INTEGRITY_CODE,
  })

  const successUrl = `${PAW_CONFIG.BASE_URL}/payment/success?appointmentId=${params.appointmentId}`
  const failUrl = `${PAW_CONFIG.BASE_URL}/payment/fail?appointmentId=${params.appointmentId}`

  const urlParams = new URLSearchParams({
    MNT_ID: PAW_CONFIG.MNT_ID,
    MNT_AMOUNT: PAW_CONFIG.AMOUNT,
    MNT_TRANSACTION_ID: transactionId,
    MNT_CURRENCY_CODE: PAW_CONFIG.MNT_CURRENCY_CODE,
    MNT_TEST_MODE: PAW_CONFIG.MNT_TEST_MODE,
    MNT_DESCRIPTION: description,
    MNT_SUBSCRIBER_ID: params.clientEmail,
    MNT_SUCCESS_URL: successUrl,
    MNT_FAIL_URL: failUrl,
    MNT_SIGNATURE: signature,
  })

  return `https://payanyway.ru/assistant.htm?${urlParams.toString()}`
}

export function getPaymentAmount(): string {
  return PAW_CONFIG.AMOUNT
}
