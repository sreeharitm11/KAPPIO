/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_SOCKET_URL?: string;
  readonly VITE_ADMIN_EMAIL?: string;
  readonly VITE_ADMIN_PASSWORD?: string;
  readonly VITE_DELIVERY_EMAIL?: string;
  readonly VITE_DELIVERY_PASSWORD?: string;
  /** 58mm thermal receipt branding */
  readonly VITE_SHOP_NAME?: string;
  readonly VITE_SHOP_ADDRESS?: string;
  readonly VITE_SHOP_PHONE?: string;
  readonly VITE_SHOP_GSTIN?: string;
  readonly VITE_REVIEW_QR_URL?: string;
  readonly VITE_RECEIPT_REVIEW_NOTE?: string;
  readonly VITE_RECEIPT_THANKS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
