export type Currency = 'PEN' | 'USD';

/** Visual tone consumed by the shared StatusBadge component. */
export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export type AttachmentKind = 'image' | 'pdf' | 'document';

export interface Attachment {
  id: string;
  name: string;
  kind: AttachmentKind;
  uploadedBy: string;
  uploadedAt: string;
}

export interface HistoryEvent {
  date: string;
  user: string;
  action: string;
  detail?: string;
}

export interface Signature {
  signedBy: string;
  role: string;
  signedAt: string;
}
