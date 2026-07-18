import { access } from 'node:fs/promises';
import type { APIRoute } from 'astro';
import {
  ADMIN_JSON_HEADERS,
  isAdminDryRunRequest,
  persistAdminFileTransaction,
  readAdminJsonRequestBody,
  validateAdminJsonWriteRequest
} from '../../../../lib/admin-console/admin-api';
import {
  ADMIN_CONTENT_COLLECTION_KEYS,
  isAdminContentCollectionKey,
  isAdminContentCreatableCollectionKey,
  type AdminContentCreatableCollectionKey
} from '../../../../lib/admin-console/content-collections';
import {
  buildAdminContentCreatePlan,
  ensureAdminContentCreateParentDirectory,
  readAdminContentCreatedEditorPayload
} from '../../../../lib/admin-console/content-create';
import type { AdminContentValidationIssue } from '../../../../lib/admin-console/content-entry-contract';
import {
  AdminContentEntryResolutionError
} from '../../../../lib/admin-console/content-entry-source';
import { withAdminContentWriteLock } from '../../../../lib/admin-console/content-write-lock';

type CreateInput = {
  collection?: AdminContentCreatableCollectionKey;
  entryId?: string;
  frontmatter?: unknown;
  errors: string[];
  issues: AdminContentValidationIssue[];
};

const JSON_HEADERS = ADMIN_JSON_HEADERS;
const DEV_ONLY_NOT_FOUND_RESPONSE = new Response('Not Found', { status: 404 });
const METHOD_NOT_ALLOWED_RESPONSE = new Response('Method Not Allowed', {
  status: 405,
  headers: {
    allow: 'POST',
    'cache-control': 'no-store'
  }
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasOwn = (value: Record<string, unknown>, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(value, key);

const createJsonErrorResponse = (
  status: number,
  errors: readonly string[],
  issues: readonly AdminContentValidationIssue[] = []
): Response =>
  new Response(
    JSON.stringify(
      {
        ok: false,
        errors,
        ...(issues.length > 0 ? { issues } : {})
      },
      null,
      2
    ),
    {
      status,
      headers: JSON_HEADERS
    }
  );

const extractCreateInput = (body: unknown): CreateInput => {
  if (!isRecord(body)) {
    return {
      errors: ['The request body must be JSON object'],
      issues: [{ path: 'body', message: 'The request body must be JSON object' }]
    };
  }

  const errors: string[] = [];
  const issues: AdminContentValidationIssue[] = [];
  const rawCollection = typeof body.collection === 'string' ? body.collection.trim() : '';
  const entryId = typeof body.entryId === 'string' ? body.entryId.trim() : undefined;
  const hasEntryId = hasOwn(body, 'entryId');
  const hasFrontmatter = hasOwn(body, 'frontmatter');
  let collection: AdminContentCreatableCollectionKey | undefined;

  if (!rawCollection) {
    const message = 'Request body missing collection';
    errors.push(message);
    issues.push({ path: 'collection', message });
  } else if (!isAdminContentCollectionKey(rawCollection)) {
    const message = `Not supported content collection：${rawCollection}；Only supports ${ADMIN_CONTENT_COLLECTION_KEYS.join(' / ')}`;
    errors.push(message);
    issues.push({ path: 'collection', message });
  } else if (!isAdminContentCreatableCollectionKey(rawCollection)) {
    const message = `current collection Currently does not support new additions：${rawCollection}`;
    errors.push(message);
    issues.push({ path: 'collection', message });
  } else {
    collection = rawCollection;
  }

  if (collection === 'essay' && !entryId) {
    const message = 'Request body missing entryId';
    errors.push(message);
    issues.push({ path: 'entryId', message });
  } else if (collection === 'bits' && hasEntryId) {
    const message = 'bits Added by date derived entryId，Do not accept manual entryId';
    errors.push(message);
    issues.push({ path: 'entryId', message });
  }

  if (!hasFrontmatter) {
    const message = 'Request body missing frontmatter Field';
    errors.push(message);
    issues.push({ path: 'frontmatter', message });
  } else if (!isRecord(body.frontmatter)) {
    const message = 'frontmatter Must be an object';
    errors.push(message);
    issues.push({ path: 'frontmatter', message });
  }

  return {
    ...(collection ? { collection } : {}),
    ...(entryId ? { entryId } : {}),
    ...(hasFrontmatter ? { frontmatter: body.frontmatter } : {}),
    errors,
    issues
  };
};

const createEntryResolutionErrorResponse = (error: unknown): Response | null => {
  if (!(error instanceof AdminContentEntryResolutionError)) return null;

  return createJsonErrorResponse(
    400,
    [error.message],
    [{ path: 'entryId', message: error.message }]
  );
};

const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
};

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

  const requestError = validateAdminJsonWriteRequest(request, url, 'Content Console create', 'New');
  if (requestError) {
    return createJsonErrorResponse(requestError.status, [requestError.error]);
  }

  const bodyResult = await readAdminJsonRequestBody(request, {
    emptyBodyError: 'The request body is empty，Please confirm it has been sent JSON string'
  });
  if (!bodyResult.ok) {
    return createJsonErrorResponse(bodyResult.status, [bodyResult.error]);
  }

  const { collection, entryId, frontmatter, errors, issues } = extractCreateInput(bodyResult.body);
  if (errors.length > 0 || !collection) {
    return createJsonErrorResponse(400, errors, issues);
  }

  const isDryRun = isAdminDryRunRequest(url);

  return withAdminContentWriteLock(async () => {
    let plan: Awaited<ReturnType<typeof buildAdminContentCreatePlan>>;
    try {
      plan = collection === 'essay'
        ? await buildAdminContentCreatePlan({ collection, entryId: entryId ?? '', frontmatter })
        : await buildAdminContentCreatePlan({ collection, frontmatter });
    } catch (error) {
      const errorResponse = createEntryResolutionErrorResponse(error);
      if (errorResponse) return errorResponse;
      throw error;
    }

    if (plan.issues.length > 0) {
      return createJsonErrorResponse(400, Array.from(new Set(plan.issues.map((issue) => issue.message))), plan.issues);
    }

    const result = {
      changed: true,
      written: false,
      changedFields: ['entry'],
      relativePath: plan.relativePath,
      editHref: plan.editHref
    };

    if (isDryRun) {
      return new Response(JSON.stringify({ ok: true, dryRun: true, result }, null, 2), {
        headers: JSON_HEADERS
      });
    }

    try {
      await persistAdminFileTransaction([
        {
          id: 'entry',
          filePath: plan.sourcePath,
          content: plan.sourceText
        }
      ], {
        beforeWrite: async () => {
          if (await fileExists(plan.sourcePath)) {
            throw new AdminContentEntryResolutionError('invalid-entry-id', `Source file already exists：${plan.relativePath}`);
          }
          await ensureAdminContentCreateParentDirectory(plan);
        }
      });
      const created = await readAdminContentCreatedEditorPayload(plan);

      return new Response(
        JSON.stringify(
          {
            ok: true,
            result: {
              ...result,
              written: true
            },
            payload: created.payload,
            editHref: created.editHref
          },
          null,
          2
        ),
        { headers: JSON_HEADERS }
      );
    } catch (error) {
      const errorResponse = createEntryResolutionErrorResponse(error);
      if (errorResponse) return errorResponse;

      console.error('[astro-whono] Failed to create admin content entry:', error);
      return createJsonErrorResponse(500, ['Failed to add content file，Please check local file permissions or logs']);
    }
  });
};
