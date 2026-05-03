/**
 * Shop & receipt branding for 58mm thermal prints.
 * Set in `.env` with VITE_ prefix.
 */
export const receiptEnv = {
  shopName: import.meta.env.VITE_SHOP_NAME ?? 'Kappio Cafe®',
  /** Multi-line address for bill header */
  shopAddress:
    import.meta.env.VITE_SHOP_ADDRESS ??
    'near BGS Medical College, BEL Layout\nNagarur Colony, Bengaluru',
  shopPhone: import.meta.env.VITE_SHOP_PHONE ?? '',
  gstin: import.meta.env.VITE_SHOP_GSTIN ?? '',
  fssai: import.meta.env.VITE_SHOP_FSSAI ?? '21226008001309',
  /** Instagram or other handle */
  socials: import.meta.env.VITE_SHOP_SOCIALS ?? '',
  /** Google Maps review URL, WhatsApp, or any URL — encoded into QR on customer bill */
  reviewQrUrl: import.meta.env.VITE_REVIEW_QR_URL ?? '',
  /** Shown when no review URL is set */
  reviewPlaceholderNote:
    import.meta.env.VITE_RECEIPT_REVIEW_NOTE ??
    'Thank you for visiting Kappio Cafe®!',
  footerThanks:
    import.meta.env.VITE_RECEIPT_THANKS ??
    'Visit again!',
};
