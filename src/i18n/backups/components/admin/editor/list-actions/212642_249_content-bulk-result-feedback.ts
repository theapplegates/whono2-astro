import {
  isAdminContentBulkSummary,
  type AdminContentBulkSummary
} from '../../../../lib/admin-console/content-bulk';
import { isRecord } from '../../../../scripts/admin-content/entry-transport';

// After successful batch writing，The result prompt will be restored after the content list is refreshed.。
// Snapshot retained until user closes prompt，Avoid result loss caused by continuous refresh；Expired snapshots are automatically ignored。

export type ContentBulkResultDialogKind = 'status' | 'delete' | 'export';

export type ContentBulkResultDialogDetail = {
  title: string;
  message: string;
};

export type ContentBulkResultDialog = {
  kind: ContentBulkResultDialogKind;
  title: string;
  summary: AdminContentBulkSummary;
  details: ContentBulkResultDialogDetail[];
  extraDetailCount: number;
  note?: string;
  truncated?: boolean;
};

type StoredContentBulkResultDialog = {
  createdAt: number;
  dialog: ContentBulkResultDialog;
};

const CONTENT_BULK_RESULT_DIALOG_STORAGE_KEY = 'astro-whono:admin-content:bulk-result-dialog';
const CONTENT_BULK_RESULT_DIALOG_STORAGE_TTL_MS = 30_000;

const isDialogKind = (value: unknown): value is ContentBulkResultDialogKind =>
  value === 'status' || value === 'delete' || value === 'export';

const isDialogDetail = (value: unknown): value is ContentBulkResultDialogDetail =>
  isRecord(value) && typeof value.title === 'string' && typeof value.message === 'string';

const isDialog = (value: unknown): value is ContentBulkResultDialog =>
  isRecord(value)
  && isDialogKind(value.kind)
  && typeof value.title === 'string'
  && isAdminContentBulkSummary(value.summary)
  && Array.isArray(value.details)
  && value.details.every(isDialogDetail)
  && typeof value.extraDetailCount === 'number'
  && (value.note === undefined || typeof value.note === 'string')
  && (value.truncated === undefined || typeof value.truncated === 'boolean');

const readStoredDialog = (value: unknown): ContentBulkResultDialog | null => {
  if (!isRecord(value) || typeof value.createdAt !== 'number') return null;
  if (Date.now() - value.createdAt > CONTENT_BULK_RESULT_DIALOG_STORAGE_TTL_MS) return null;
  return isDialog(value.dialog) ? value.dialog : null;
};

export const clearContentBulkResultDialog = (): void => {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(CONTENT_BULK_RESULT_DIALOG_STORAGE_KEY);
  } catch {
    // When storage is unavailable, only the result prompt after refresh is affected.。
  }
};

export const readContentBulkResultDialog = (): ContentBulkResultDialog | null => {
  if (typeof window === 'undefined') return null;
  try {
    const rawDialog = window.sessionStorage.getItem(CONTENT_BULK_RESULT_DIALOG_STORAGE_KEY);
    if (!rawDialog) return null;

    const dialog = readStoredDialog(JSON.parse(rawDialog) as unknown);
    if (!dialog) clearContentBulkResultDialog();
    return dialog;
  } catch {
    clearContentBulkResultDialog();
    return null;
  }
};

export const storeContentBulkResultDialog = (dialog: ContentBulkResultDialog): void => {
  if (typeof window === 'undefined') return;
  try {
    const storedDialog: StoredContentBulkResultDialog = {
      createdAt: Date.now(),
      dialog
    };
    window.sessionStorage.setItem(
      CONTENT_BULK_RESULT_DIALOG_STORAGE_KEY,
      JSON.stringify(storedDialog)
    );
  } catch {
    // Storage failure only affects the result prompt after refreshing，Does not affect completed batch writes。
  }
};
