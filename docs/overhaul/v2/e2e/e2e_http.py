"""Shared HTTP settings for the e2e specs.

Cloudflare's browser integrity check answers Python's default urllib user agent with 403 "error code: 1010",
so every spec identifies itself explicitly when it runs against a deployed preview.
"""
USER_AGENT = 'InfraHub-v2-e2e/1.0 (+docs/overhaul/v2/e2e)'
