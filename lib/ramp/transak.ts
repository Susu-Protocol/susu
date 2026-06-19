export type RampMode = 'BUY' | 'SELL';

export type TransakEventName =
    | 'TRANSAK_WIDGET_INITIALISED'
    | 'TRANSAK_WIDGET_OPEN'
    | 'TRANSAK_ORDER_CREATED'
    | 'TRANSAK_ORDER_PAYMENT_VERIFYING'
    | 'TRANSAK_ORDER_SUCCESSFUL'
    | 'TRANSAK_ORDER_CANCELLED'
    | 'TRANSAK_ORDER_FAILED'
    | 'TRANSAK_WIDGET_CLOSE'
    | 'TRANSAK_SELL_ORDER_CREATED'
    | 'TRANSAK_SELL_ORDER_CRYPTO_PAYMENT_DONE'
    | 'TRANSAK_SELL_ORDER_FAILED';

export interface TransakOrderStatus {
    id:                 string;
    status:             string;
    fiatCurrency:       string;
    fiatAmount:         number;
    cryptoCurrency:     string;
    cryptoAmount:       number;
    walletAddress:      string;
    transactionHash?:   string;
    network?:           string;
    partnerOrderId?:    string;
    fromWalletAddress?: string;   // SELL: deposit address to send crypto to
}

export interface TransakEvent {
    eventName: TransakEventName;
    status:    TransakOrderStatus;
}

/**
 * Listens for postMessage events from the Transak iframe.
 * The widget has shipped both `eventName` and `event_id` as the event-type
 * field across versions, so we accept either.
 */
export function listenTransak(cb: (event: TransakEvent) => void): () => void {
    const handler = (e: MessageEvent) => {
        if (typeof e.data !== 'object' || e.data === null) return;
        const name = e.data.eventName ?? e.data.event_id;
        if (typeof name !== 'string' || !name.startsWith('TRANSAK_')) return;
        cb({ eventName: name, status: e.data.data ?? e.data.status } as TransakEvent);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
}

// Classify event as terminal success/fail/pending for the iframe
export function classifyEvent(name: TransakEventName): 'success' | 'failed' | 'pending' | null {
    if (name === 'TRANSAK_ORDER_SUCCESSFUL' || name === 'TRANSAK_SELL_ORDER_CRYPTO_PAYMENT_DONE') return 'success';
    if (name === 'TRANSAK_ORDER_FAILED' || name === 'TRANSAK_SELL_ORDER_FAILED' || name === 'TRANSAK_ORDER_CANCELLED') return 'failed';
    if (name === 'TRANSAK_ORDER_CREATED' || name === 'TRANSAK_ORDER_PAYMENT_VERIFYING') return 'pending';
    return null;
}
