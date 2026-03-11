/* Google Analytics 4 tracking helpers.
 * Wraps window.gtag in null-checks so the app never crashes
 * if GA isn't loaded (local dev, ad-blockers, etc.). */

declare global {
    interface Window {
        gtag?: (...args: unknown[]) => void;
    }
}

function gtag(...args: unknown[]) {
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag(...args);
    }
}

export function trackPageView(page: string) {
    gtag('event', 'page_view', { page_path: page });
}

export function trackEventView(eventId: string, eventName: string) {
    gtag('event', 'view_event', { event_id: eventId, event_name: eventName });
}

export function trackRegistrationStart(eventId: string) {
    gtag('event', 'begin_registration', { event_id: eventId });
}

export function trackPaymentComplete(eventId: string, amount: number, registrationCode: string) {
    gtag('event', 'purchase', {
        event_id: eventId,
        value: amount,
        currency: 'INR',
        transaction_id: registrationCode,
    });
}
