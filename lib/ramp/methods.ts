// Payment methods available per country for onramp / offramp
// Shown as contextual info before the user opens the Transak widget

export interface PaymentMethod {
    id:       string;
    label:    string;
    icon:     string;    // emoji
    instant:  boolean;   // near-instant vs 1-3 days
    limit?:   string;    // typical limit
}

export interface CountryMethods {
    currency:    string;
    onramp:      PaymentMethod[];
    offramp:     PaymentMethod[];
    minUsd:      number;
    maxUsd:      number;
}

export const PAYMENT_METHODS: Record<string, CountryMethods> = {
    NGN: {
        currency: 'NGN',
        onramp: [
            { id: 'bank_transfer', label: 'Bank Transfer', icon: '🏦', instant: false, limit: '₦5M / day' },
            { id: 'card',          label: 'Debit / Credit Card', icon: '💳', instant: true, limit: '₦1M / day' },
        ],
        offramp: [
            { id: 'bank_transfer', label: 'Bank Transfer (NGN)', icon: '🏦', instant: false, limit: '₦5M / day' },
        ],
        minUsd: 10,
        maxUsd: 5000,
    },
    KES: {
        currency: 'KES',
        onramp: [
            { id: 'mpesa',         label: 'M-Pesa', icon: '📱', instant: true, limit: 'KSh 150k / day' },
            { id: 'bank_transfer', label: 'Bank Transfer', icon: '🏦', instant: false },
        ],
        offramp: [
            { id: 'mpesa',         label: 'M-Pesa', icon: '📱', instant: true, limit: 'KSh 150k / day' },
            { id: 'bank_transfer', label: 'Bank Transfer', icon: '🏦', instant: false },
        ],
        minUsd: 5,
        maxUsd: 2000,
    },
    GHS: {
        currency: 'GHS',
        onramp: [
            { id: 'mobile_money',  label: 'MTN Mobile Money', icon: '📱', instant: true },
            { id: 'mobile_money',  label: 'Vodafone Cash', icon: '📱', instant: true },
            { id: 'bank_transfer', label: 'Bank Transfer', icon: '🏦', instant: false },
        ],
        offramp: [
            { id: 'mobile_money',  label: 'Mobile Money', icon: '📱', instant: true },
            { id: 'bank_transfer', label: 'Bank Transfer', icon: '🏦', instant: false },
        ],
        minUsd: 5,
        maxUsd: 2000,
    },
    ZAR: {
        currency: 'ZAR',
        onramp: [
            { id: 'instant_eft',   label: 'Instant EFT', icon: '⚡', instant: true, limit: 'R50k / day' },
            { id: 'bank_transfer', label: 'Bank Transfer (EFT)', icon: '🏦', instant: false },
            { id: 'card',          label: 'Debit / Credit Card', icon: '💳', instant: true },
        ],
        offramp: [
            { id: 'bank_transfer', label: 'Bank Transfer (EFT)', icon: '🏦', instant: false, limit: 'R50k / day' },
        ],
        minUsd: 10,
        maxUsd: 10000,
    },
    TZS: {
        currency: 'TZS',
        onramp: [
            { id: 'mobile_money',  label: 'M-Pesa Tanzania', icon: '📱', instant: true },
            { id: 'mobile_money',  label: 'Airtel Money', icon: '📱', instant: true },
        ],
        offramp: [
            { id: 'mobile_money',  label: 'Mobile Money', icon: '📱', instant: true },
        ],
        minUsd: 5,
        maxUsd: 1000,
    },
    EGP: {
        currency: 'EGP',
        onramp: [
            { id: 'bank_transfer', label: 'Bank Transfer', icon: '🏦', instant: false },
            { id: 'card',          label: 'Debit / Credit Card', icon: '💳', instant: true },
        ],
        offramp: [
            { id: 'bank_transfer', label: 'Bank Transfer', icon: '🏦', instant: false },
        ],
        minUsd: 10,
        maxUsd: 5000,
    },
    INR: {
        currency: 'INR',
        onramp: [
            { id: 'upi',           label: 'UPI', icon: '🔷', instant: true, limit: '₹2L / day' },
            { id: 'bank_transfer', label: 'NEFT / IMPS', icon: '🏦', instant: true },
            { id: 'card',          label: 'Debit / Credit Card', icon: '💳', instant: true },
        ],
        offramp: [
            { id: 'upi',           label: 'UPI', icon: '🔷', instant: true, limit: '₹2L / day' },
            { id: 'bank_transfer', label: 'IMPS Bank Transfer', icon: '🏦', instant: true },
        ],
        minUsd: 5,
        maxUsd: 10000,
    },
    IDR: {
        currency: 'IDR',
        onramp: [
            { id: 'bank_transfer', label: 'Bank Transfer (BCA, BNI, BRI, Mandiri)', icon: '🏦', instant: false },
            { id: 'wallet',        label: 'OVO / GoPay / DANA', icon: '📱', instant: true },
        ],
        offramp: [
            { id: 'bank_transfer', label: 'Bank Transfer', icon: '🏦', instant: false },
        ],
        minUsd: 10,
        maxUsd: 5000,
    },
    PHP: {
        currency: 'PHP',
        onramp: [
            { id: 'gcash',         label: 'GCash', icon: '📱', instant: true, limit: '₱100k / day' },
            { id: 'paymaya',       label: 'Maya (PayMaya)', icon: '📱', instant: true },
            { id: 'bank_transfer', label: 'PESONet / InstaPay', icon: '🏦', instant: true },
        ],
        offramp: [
            { id: 'gcash',         label: 'GCash', icon: '📱', instant: true },
            { id: 'bank_transfer', label: 'Bank Transfer', icon: '🏦', instant: false },
        ],
        minUsd: 5,
        maxUsd: 5000,
    },
    KRW: {
        currency: 'KRW',
        onramp: [
            { id: 'bank_transfer', label: 'Bank Transfer', icon: '🏦', instant: true, limit: '₩5M / day' },
            { id: 'card',          label: 'Credit / Debit Card', icon: '💳', instant: true },
        ],
        offramp: [
            { id: 'bank_transfer', label: 'Bank Transfer', icon: '🏦', instant: false },
        ],
        minUsd: 10,
        maxUsd: 10000,
    },
    JPY: {
        currency: 'JPY',
        onramp: [
            { id: 'bank_transfer', label: 'Furikomi (Bank Transfer)', icon: '🏦', instant: false },
            { id: 'card',          label: 'Credit / Debit Card', icon: '💳', instant: true },
            { id: 'convenience',   label: 'Convenience Store (コンビニ)', icon: '🏪', instant: false },
        ],
        offramp: [
            { id: 'bank_transfer', label: 'Bank Transfer (Furikomi)', icon: '🏦', instant: false },
        ],
        minUsd: 10,
        maxUsd: 10000,
    },
    CNY: {
        currency: 'CNY',
        onramp: [
            { id: 'alipay',        label: 'Alipay', icon: '💙', instant: true },
            { id: 'wechat_pay',    label: 'WeChat Pay', icon: '💚', instant: true },
        ],
        offramp: [
            { id: 'bank_transfer', label: 'Bank Transfer', icon: '🏦', instant: false },
        ],
        minUsd: 10,
        maxUsd: 5000,
    },
    MXN: {
        currency: 'MXN',
        onramp: [
            { id: 'spei',          label: 'SPEI (Instant Transfer)', icon: '⚡', instant: true, limit: 'No limit' },
            { id: 'oxxo',          label: 'OXXO Cash', icon: '🏪', instant: false },
            { id: 'card',          label: 'Debit / Credit Card', icon: '💳', instant: true },
        ],
        offramp: [
            { id: 'spei',          label: 'SPEI', icon: '⚡', instant: true },
            { id: 'bank_transfer', label: 'Bank Transfer', icon: '🏦', instant: false },
        ],
        minUsd: 10,
        maxUsd: 10000,
    },
    BRL: {
        currency: 'BRL',
        onramp: [
            { id: 'pix',           label: 'Pix', icon: '⚡', instant: true, limit: 'No limit' },
            { id: 'boleto',        label: 'Boleto Bancário', icon: '📄', instant: false },
            { id: 'card',          label: 'Debit / Credit Card', icon: '💳', instant: true },
        ],
        offramp: [
            { id: 'pix',           label: 'Pix', icon: '⚡', instant: true },
            { id: 'bank_transfer', label: 'TED / DOC', icon: '🏦', instant: false },
        ],
        minUsd: 5,
        maxUsd: 10000,
    },
    USD: {
        currency: 'USD',
        onramp: [
            { id: 'card',          label: 'Debit / Credit Card', icon: '💳', instant: true },
            { id: 'ach',           label: 'ACH Bank Transfer', icon: '🏦', instant: false, limit: '$25k / day' },
            { id: 'wire',          label: 'Wire Transfer', icon: '🏦', instant: false },
        ],
        offramp: [
            { id: 'ach',           label: 'ACH Bank Transfer', icon: '🏦', instant: false },
            { id: 'wire',          label: 'Wire Transfer', icon: '🏦', instant: false },
        ],
        minUsd: 10,
        maxUsd: 25000,
    },
    EUR: {
        currency: 'EUR',
        onramp: [
            { id: 'sepa',          label: 'SEPA Bank Transfer', icon: '🏦', instant: false, limit: '€25k / day' },
            { id: 'sepa_instant',  label: 'SEPA Instant', icon: '⚡', instant: true },
            { id: 'card',          label: 'Debit / Credit Card', icon: '💳', instant: true },
        ],
        offramp: [
            { id: 'sepa',          label: 'SEPA Transfer', icon: '🏦', instant: false },
            { id: 'sepa_instant',  label: 'SEPA Instant', icon: '⚡', instant: true },
        ],
        minUsd: 10,
        maxUsd: 25000,
    },
    GBP: {
        currency: 'GBP',
        onramp: [
            { id: 'faster_payments', label: 'Faster Payments', icon: '⚡', instant: true, limit: '£25k / day' },
            { id: 'card',            label: 'Debit / Credit Card', icon: '💳', instant: true },
        ],
        offramp: [
            { id: 'faster_payments', label: 'Faster Payments', icon: '⚡', instant: true },
            { id: 'bacs',            label: 'BACS Transfer', icon: '🏦', instant: false },
        ],
        minUsd: 10,
        maxUsd: 25000,
    },
    AUD: {
        currency: 'AUD',
        onramp: [
            { id: 'payid',         label: 'PayID / Osko', icon: '⚡', instant: true, limit: 'A$25k / day' },
            { id: 'bank_transfer', label: 'Bank Transfer (BSB)', icon: '🏦', instant: false },
            { id: 'card',          label: 'Debit / Credit Card', icon: '💳', instant: true },
        ],
        offramp: [
            { id: 'payid',         label: 'PayID', icon: '⚡', instant: true },
            { id: 'bank_transfer', label: 'Bank Transfer (BSB)', icon: '🏦', instant: false },
        ],
        minUsd: 10,
        maxUsd: 25000,
    },
};

export function getMethodsForCurrency(currencyCode: string): CountryMethods | null {
    return PAYMENT_METHODS[currencyCode] ?? null;
}

export function getInstantMethods(methods: PaymentMethod[]): PaymentMethod[] {
    return methods.filter(m => m.instant);
}
