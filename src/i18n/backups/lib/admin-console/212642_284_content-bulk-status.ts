import {
  persistAdminFileTransaction
} from './admin-api';
import {
  createAdminContentBulkResult as createResult,
  type AdminContentBulkEntryInput,
  type AdminContentBulkResult
} from './content-bulk';
import {
  isAdminContentCollectionKey,
  isAdminContentDraftStatusCollectionKey
} from './content-collections';
import {
  AdminContentEntryResolutionError,
  loadAdminContentSourceState
} from './content-entry-source';
import { patchMarkdownFrontmatter } from './frontmatter';
import { withAdminContentWriteLock } from './content-write-lock';

class AdminContentBulkStatusConflictError extends Error {
  constructor() {
    super('Admin content draft status changed before write');
  }
}

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message ? error.message : fallback;

const patchOneAdminContentDraftStatus = async (
  entry: AdminContentBulkEntryInput,
  targetDraft: boolean
): Promise<AdminContentBulkResult> => {
  if (!isAdminContentCollectionKey(entry.collection)) {
    return createResult(entry, {
      status: 'skipped',
      errors: [`Not supported content collection：${entry.collection}`],
      errorCodes: ['unsupported_collection']
    });
  }

  if (!isAdminContentDraftStatusCollectionKey(entry.collection)) {
    return createResult(entry, {
      status: 'skipped',
      errors: [`current collection Batch publishing or draft modification is not currently supported.：${entry.collection}`],
      errorCodes: ['unsupported_collection']
    });
  }

  const collection = entry.collection;
  try {
    const state = await loadAdminContentSourceState(collection, entry.entryId);
    if (state.relativePath !== entry.expectedRelativePath) {
      return createResult(entry, {
        status: 'failed',
        relativePath: state.relativePath,
        errors: ['Content file path inconsistent with list detected，Please refresh and try again'],
        errorCodes: ['relative_path_mismatch']
      });
    }

    const currentDraft = state.rawFrontmatter.draft === true;
    if (currentDraft === targetDraft) {
      return createResult(entry, {
        status: 'unchanged',
        relativePath: state.relativePath
      });
    }

    const nextSourceText = patchMarkdownFrontmatter(state.sourceText, [
      { path: ['draft'], action: 'set', value: targetDraft }
    ]);

    await persistAdminFileTransaction([
      {
        id: 'entry',
        filePath: state.sourcePath,
        content: nextSourceText
      }
    ], {
      beforeWrite: async () => {
        const latestState = await loadAdminContentSourceState(collection, entry.entryId);
        if (latestState.revision !== state.revision || latestState.relativePath !== state.relativePath) {
          throw new AdminContentBulkStatusConflictError();
        }
      }
    });

    return createResult(entry, {
      status: 'succeeded',
      relativePath: state.relativePath,
      changedFields: ['draft']
    });
  } catch (error) {
    if (error instanceof AdminContentEntryResolutionError) {
      return createResult(entry, {
        status: 'failed',
        errors: [error.message],
        errorCodes: [error.code === 'source-not-found' ? 'source_not_found' : 'invalid_entry_id']
      });
    }

    return createResult(entry, {
      status: 'failed',
      errors: [
        error instanceof AdminContentBulkStatusConflictError
          ? 'Content file detected externally updated，This entry has been skipped，Please refresh and try again'
          : getErrorMessage(error, 'Failed to update content status，Please check local file permissions or logs')
      ],
      errorCodes: [
        error instanceof AdminContentBulkStatusConflictError
          ? 'revision_conflict'
          : 'update_failed'
      ]
    });
  }
};

export const patchAdminContentDraftStatusBulk = async (
  entries: readonly AdminContentBulkEntryInput[],
  targetDraft: boolean
): Promise<AdminContentBulkResult[]> =>
  withAdminContentWriteLock(async () => {
    const results: AdminContentBulkResult[] = [];
    for (const entry of entries) {
      results.push(await patchOneAdminContentDraftStatus(entry, targetDraft));
    }
    return results;
  });
