export interface PlacedSignature {
  id: number; // The original ID of the signature type
  instanceId: number; // A unique ID for this specific placed instance
  src: string;
  x: number;
  y: number;
  page: number;
  width: number;
  height: number;
}

export interface SignatureFormData {
  file: File | null;
  password: string;
}

export interface SigningState {
  pdfFile: File | null;
  placedSignatures: PlacedSignature[];
  selectedSignatureId: number | null;
  numPages: number | null;
  isSigning: boolean;
}

export interface PasswordMap {
  [signatureId: number]: string;
}

export interface SignatureImageMap {
  [signatureId: number]: Uint8Array;
}
