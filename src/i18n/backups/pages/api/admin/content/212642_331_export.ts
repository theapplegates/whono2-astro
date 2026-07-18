import type { APIRoute } from 'astro';
import { ADMIN_JSON_HEADERS } from '../../../../lib/admin-console/admin-api';
import {
  ADMIN_CONTENT_COLLECTION_KEYS,
  getAdminContentCollectionCapability,
  isAdminContentCollectionKey,
  isAdminContentExportableCollectionKey
} from '../../../../lib/admin-console/content-collections';
import {
  AdminContentEntryResolutionError
} from '../../../../lib/admin-console/content-entry-source';
import {
  createAdminContentSourceDownloadHeaders,
  readAdminContentSourceDownload
} from '../../../../lib/admin-console/content-export';

const DEV_ONLY_NOT_FOUND_RESPONSE = new Response('Not Found', { status: 404 });

const createJsonErrorResponse = (status: number, errors: readonly string[]): Response =>
  new Response(
    JSON.stringify({ ok: false, errors }, null, 2),
    {
      status,
      headers: ADMIN_JSON_HEADERS
    }
  );

const createEntryResolutionErrorResponse = (error: unknown): Response | null => {
  if (!(error instanceof AdminContentEntryResolutionError)) return null;

  return createJsonErrorResponse(
    error.code === 'source-not-found' ? 404 : 400,
    [error.message]
  );
};

export const GET: APIRoute = async ({ url }) => {
  if (!import.meta.env.DEV && !process.env.VITEST) {
    return DEV_ONLY_NOT_FOUND_RESPONSE.clone();
  }

  const collection = url.searchParams.get('collection')?.trim() ?? '';
  const entryId = url.searchParams.get('entryId')?.trim() ?? '';

  if (!collection) {
    return createJsonErrorResponse(400, ['Query parameters are missing collection']);
  }

  if (!isAdminContentCollectionKey(collection)) {
    return createJsonErrorResponse(
      400,
      [`Not supported content collection：${collection}；Only supports ${ADMIN_CONTENT_COLLECTION_KEYS.join(' / ')}`]
    );
  }

  if (!isAdminContentExportableCollectionKey(collection)) {
    return createJsonErrorResponse(
      400,
      [getAdminContentCollectionCapability(collection).readonlyReason ?? `current collection Export is not supported yet：${collection}`]
    );
  }

  if (!entryId) {
    return createJsonErrorResponse(400, ['Query parameters are missing entryId']);
  }

  try {
    const download = await readAdminContentSourceDownload(collection, entryId);
    return new Response(download.sourceText, {
      headers: createAdminContentSourceDownloadHeaders(download.fileName, download.contentType)
    });
  } catch (error) {
    const errorResponse = createEntryResolutionErrorResponse(error);
    if (errorResponse) return errorResponse;
    throw error;
  }
};
