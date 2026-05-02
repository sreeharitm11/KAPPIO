/**
 * Shop & receipt branding for 58mm thermal prints.
 * Set in `.env` with VITE_ prefix.
 */
export const receiptEnv = {
  shopName: import.meta.env.VITE_SHOP_NAME ?? 'Kappio Café',
  /** Multi-line address for bill header */
  shopAddress:
    import.meta.env.VITE_SHOP_ADDRESS ??
    'Your address line 1\nCity, State – PIN',
  shopPhone: import.meta.env.VITE_SHOP_PHONE ?? '',
  gstin: import.meta.env.VITE_SHOP_GSTIN ?? '',
  /** Google Maps review URL, WhatsApp, or any URL — encoded into QR on customer bill */
  reviewQrUrl: import.meta.env.VITE_REVIEW_QR_URL ?? '',
  /** Shown when no review URL is set */
  reviewPlaceholderNote:
    import.meta.env.VITE_RECEIPT_REVIEW_NOTE ??
    'Thank you — tell us how we did online!',
  footerThanks:
    import.meta.env.VITE_RECEIPT_THANKS ??
    'Thank you for ordering with us!',
};
