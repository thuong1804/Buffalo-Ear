export function securityHeaders(nonce: string, secure: boolean) {
    return {
        "Content-Security-Policy": [
            "default-src 'self'",
            `script-src 'self' 'nonce-${nonce}'`,
            "script-src-attr 'none'",
            `style-src 'self' 'nonce-${nonce}'`,
            "style-src-attr 'unsafe-inline'",
            "img-src 'self' data: https:",
            "font-src 'self'",
            "connect-src 'self'",
            "media-src 'self' blob:",
            "object-src 'none'",
            "base-uri 'none'",
            "frame-ancestors 'none'",
            "form-action 'self'",
            ...(secure ? ["upgrade-insecure-requests"] : []),
        ].join("; "),
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
        "Cache-Control": "private, no-store",
        "CDN-Cache-Control": "no-store",
        "Vercel-CDN-Cache-Control": "no-store",
        ...(secure ? { "Strict-Transport-Security": "max-age=31536000" } : {}),
    };
}
