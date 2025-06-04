import { cookies, draftMode } from 'next/headers';
import { redirect } from 'next/navigation';
import { type NextRequest } from 'next/server';

import {
  IN_CONTEXT_EDITOR_PLAYGROUND_QUERY_STRING_PARAM,
  IN_CONTEXT_EDITOR_QUERY_STRING_PARAM,
  isAllowedReferrer,
  SECRET_QUERY_STRING_PARAM,
} from '@uniformdev/canvas';
import { createPreviewPOSTRouteHandler, createPreviewOPTIONSRouteHandler } from '@uniformdev/canvas-next-rsc/handler';

export const POST = createPreviewPOSTRouteHandler();
export const OPTIONS = createPreviewOPTIONSRouteHandler();

const BASE_URL_EXAMPLE = 'https://example.com';

export type ResolveFullPath = (options: {
  /** The ID of the composition */
  id?: string;
  /** The slug of the composition */
  slug?: string;
  /** The path of the project map node attached to the composition, if there is one */
  path?: string;
  /** The preview locale selected in Visual Canvas, available only if Localization is set up */
  locale?: string;
}) => string | undefined;

const getQueryParam = (req: NextRequest, paramName: string) => {
  const value = req.nextUrl.searchParams.get(paramName);
  if (typeof value === 'undefined') {
    return undefined;
  }

  return Array.isArray(value) ? value[0] : value;
};

const contextualEditingQueryParams = [
  IN_CONTEXT_EDITOR_QUERY_STRING_PARAM,
  IN_CONTEXT_EDITOR_PLAYGROUND_QUERY_STRING_PARAM,
];

export type CreatePreviewGETRouteHandlerOptions = {
  resolveFullPath?: ResolveFullPath;
  playgroundPath?: string;
};

const customCreatePreviewGETRouteHandler = (options?: CreatePreviewGETRouteHandlerOptions) => {
  return async (request: NextRequest) => {
    const isConfigCheck = getQueryParam(request, 'is_config_check') === 'true';

    if (isConfigCheck) {
      return Response.json(
        {
          hasPlayground: Boolean(options?.playgroundPath),
          isUsingCustomFullPathResolver: false,
        },
        {
          headers: {
            'Access-Control-Allow-Origin': process.env.UNIFORM_CLI_BASE_URL || 'https://uniform.app',
          },
        }
      );
    }

    // If this is a no-cors request (send my the Canvas editor to check if the preview URL is valid), we return immediately.
    if (request.headers.get('sec-fetch-mode') === 'no-cors') {
      return new Response(null, { status: 204 });
    }

    if (!process.env.UNIFORM_PREVIEW_SECRET) {
      return new Response('No preview secret is configured', { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const isPlayground = searchParams.get(IN_CONTEXT_EDITOR_PLAYGROUND_QUERY_STRING_PARAM) === 'true';

    let pathToRedirectTo: undefined | string;

    if (isPlayground) {
      if (!options?.playgroundPath) {
        return new Response('No playground path is configured', { status: 401 });
      }
      pathToRedirectTo = options.playgroundPath;
    }

    const id = getQueryParam(request, compositionQueryParam.id);
    const path = getQueryParam(request, compositionQueryParam.path);
    const slug = getQueryParam(request, compositionQueryParam.slug);
    const locale = getQueryParam(request, compositionQueryParam.locale);
    const disable = getQueryParam(request, 'disable');
    const secret = getQueryParam(request, SECRET_QUERY_STRING_PARAM);
    const referer = request.headers.get('referer');
    const isUniformContextualEditing =
      getQueryParam(request, IN_CONTEXT_EDITOR_QUERY_STRING_PARAM) === 'true' &&
      isAllowedReferrer(referer || undefined);
    const releaseId = getQueryParam(request, 'releaseId');

    if (typeof pathToRedirectTo === 'undefined') {
      const resolveFullPath = options?.resolveFullPath || resolveFullPathDefault;
      pathToRedirectTo = resolveFullPath({ id, slug, path, locale });
    }

    validateLocalRedirectUrl(pathToRedirectTo);

    if (!pathToRedirectTo) {
      return new Response('Could not resolve the full path of the preview page', { status: 400 });
    }

    if (disable) {
      (await draftMode()).disable();
      redirect(pathToRedirectTo);
      return;
    }

    if (secret !== process.env.UNIFORM_PREVIEW_SECRET) {
      return new Response('Invalid preview secret', { status: 401 });
    }

    (await draftMode()).enable();
    const cookieStore = await cookies();

    // Get the draft mode cookie that was just set
    const draftCookie = cookieStore.get('__prerender_bypass');

    // If we have the cookie, update it with cross-origin iframe support
    if (draftCookie?.value) {
      cookieStore.set({
        name: '__prerender_bypass',
        value: draftCookie.value,
        httpOnly: true,
        path: '/',
        secure: true,
        sameSite: 'none',
        partitioned: true,
      });
    }

    const vercelCookie = cookieStore.get('_vercel_jwt');

    // If we have the cookie, update it with cross-origin iframe support
    if (vercelCookie?.value) {
      cookieStore.set({
        name: '_vercel_jwt',
        value: vercelCookie.value,
        httpOnly: true,
        path: '/',
        secure: true,
        sameSite: 'none',
        partitioned: true,
      });
    }

    const redirectionUrl = new URL(pathToRedirectTo, BASE_URL_EXAMPLE);
    assignRequestQueryToSearchParams(redirectionUrl.searchParams, searchParams);

    // append the composition ID to the playground path if explicitly requested or if the playground path is the same as the path to redirect to
    if (isPlayground || (options?.playgroundPath && pathToRedirectTo === options.playgroundPath)) {
      // Playground required composition ID to be passed as a query parameter
      redirectionUrl.searchParams.set('id', searchParams.get('id') || '');
    }

    if (releaseId) {
      redirectionUrl.searchParams.set('releaseId', releaseId);
    }

    if (!isUniformContextualEditing) {
      contextualEditingQueryParams.forEach(param => {
        redirectionUrl.searchParams.delete(param);
      });
    }

    const fullPathToRedirectTo = redirectionUrl.href.replace(BASE_URL_EXAMPLE, '');

    redirect(fullPathToRedirectTo);
  };
};

function validateLocalRedirectUrl(pathToRedirectTo: string | undefined) {
  // prevent open redirection to any complete URL with a protocol (nnn://whatever)
  if (pathToRedirectTo?.match(/^[a-z]+:\/\//g)) {
    throw new Error('Tried to redirect to absolute URL with protocol. Disallowing open redirect.');
  }
}

const resolveFullPathDefault: ResolveFullPath = ({ slug, path }) => {
  return path || slug;
};

const compositionQueryParam = {
  id: 'id',
  slug: 'slug',
  path: 'path',
  locale: 'locale',
};

const assignRequestQueryToSearchParams = (searchParams: URLSearchParams, query: URLSearchParams) => {
  const compositionQueryParamNames = Object.values(compositionQueryParam);

  for (const [name, value] of query.entries()) {
    if (name === SECRET_QUERY_STRING_PARAM) {
      continue;
    }

    if (compositionQueryParamNames.includes(name)) {
      continue;
    }

    if (typeof value === 'undefined') {
      continue;
    }

    searchParams.append(name, value);
  }
};

export const GET = customCreatePreviewGETRouteHandler({
  playgroundPath: '/playground',
  resolveFullPath: ({ path }) => (path ? path : '/playground'),
});
