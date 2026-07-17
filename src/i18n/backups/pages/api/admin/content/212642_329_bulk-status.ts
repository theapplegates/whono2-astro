import type { APIRoute } from 'astro';
import {
  ADMIN_JSON_HEADERS,
  createAdminJsonErrorResponse,
  readAdminJsonRequestBody,
  validateAdminJsonWriteRequest
} from '../../../../lib/admin-console/admin-api';
import {
  createAdminContentBulkSummary,
  readAdminContentBulkEntriesInput
} from '../../../../lib/admin-console/content-bulk';
import { patchAdminContentDraftStatusBulk } from '../../../../lib/admin-console/content-bulk-status';
import { isRecord } from '../../../../lib/admin-console/content-entry-utils';

const JSON_HEADERS = ADMIN_JSON_HEADERS;
const DEV_ONLY_NOT_FOUND_RESPONSE = new Response('Not Found', { status: 404 });
const METHOD_NOT_ALLOWED_RESPONSE = new Response('Method Not Allowed', {
  status: 405,
  headers: {
    allow: 'POST',
    'cache-control': 'no-store'
  }
});

export const GET: APIRoute = async () => {
  if (!import.meta.env.DEV && !process.env.VITEST) {
    return DEV_ONLY_NOT_FOUND_RESPONSE.clone();
  }

  return METHOD_NOT_ALLOWED_RESPONSE.clone();
};

export const POST: APIRoute = async ({ request, url }) => {
  if (!import.meta.env.DEV && !process.env.VITEST) {
    return DEV_ONLY_NOT_FOUND_RESPONSE.clone();
  }

  const requestError = validateAdminJsonWriteRequest(request, url, 'Content Console bulk status', 'Batch update');
  if (requestError) {
    return createAdminJsonErrorResponse(requestError.status, [requestError.error]);
  }

  const bodyResult = await readAdminJsonRequestBody(request, {
    emptyBodyError: 'The request body is empty，Please confirm it has been sent JSON string'
  });
  if (!bodyResult.ok) {
    return createAdminJsonErrorResponse(bodyResult.status, [bodyResult.error]);
  }

  if (!isRecord(bodyResult.body) || typeof bodyResult.body.targetDraft !== 'boolean') {
    return createAdminJsonErrorResponse(400, ['Request body missing targetDraft Boolean value'], [
      { path: 'targetDraft', message: 'Request body missing targetDraft Boolean value' }
    ]);
  }

  const entriesResult = readAdminContentBulkEntriesInput(bodyResult.body);
  if (!entriesResult.ok) {
    return createAdminJsonErrorResponse(400, entriesResult.errors, entriesResult.issues);
  }

  const results = await patchAdminContentDraftStatusBulk(entriesResult.entries, bodyResult.body.targetDraft);
  return new Response(
    JSON.stringify(
      {
        ok: true,
        summary: createAdminContentBulkSummary(entriesResult.requested, results),
        results
      },
      null,
      2
    ),
    { headers: JSON_HEADERS }
  );
};
