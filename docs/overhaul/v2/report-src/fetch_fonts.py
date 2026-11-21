#!/usr/bin/env python3
"""Download the report fonts into ./fonts and write ./fonts.css (both git-ignored: the font files are not ours
to redistribute). Zodiak and General Sans: Fontshare (ITF Free Font License). JetBrains Mono: Google Fonts (OFL).
Run once in a report-src folder before build.py:  python3 fetch_fonts.py
"""
import os
import re
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
SOURCES = [
    'https://api.fontshare.com/v2/css?f[]=zodiak@400,700,800&f[]=general-sans@400,500,600,700&display=swap',
    'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400..800&display=swap',
]


NON_LATIN = re.compile(r'/\*\s*(latin-ext|cyrillic|cyrillic-ext|greek|greek-ext|vietnamese|math|symbols)\s*\*/')


def get(url: str) -> bytes:
    return urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=60).read()


def field(pattern: str, block: str) -> str:
    match = re.search(pattern, block)
    if not match:
        raise ValueError(f'font-face block without {pattern!r}: {block[:120]}')
    return match.group(1).strip()


def faces(css: str):
    """(family, weight, woff2 url) for every @font-face block except Google's non-latin subsets."""
    for comment, block in re.findall(r'(/\*[^*]*\*/)?\s*@font-face\s*{([^}]*)}', css):
        if NON_LATIN.match(comment or ''):
            continue
        family = field(r"font-family:\s*'([^']+)'", block)
        weight = field(r'font-weight:\s*([0-9 ]+);', block)
        url = field(r"url\('?([^')]+\.woff2)'?\)", block)
        yield family, weight, ('https:' + url if url.startswith('//') else url)


def main() -> None:
    os.makedirs(os.path.join(HERE, 'fonts'), exist_ok=True)
    rules, seen = [], set()
    for src in SOURCES:
        for family, weight, url in faces(get(src).decode()):
            if (family, weight) in seen:
                continue
            seen.add((family, weight))
            name = f"{family.lower().replace(' ', '-')}-{weight.replace(' ', '-')}.woff2"
            path = os.path.join(HERE, 'fonts', name)
            if not os.path.exists(path):
                open(path, 'wb').write(get(url))
            rules.append(f"@font-face {{ font-family: '{family}'; src: url('fonts/{name}') format('woff2'); "
                         f"font-weight: {weight}; font-style: normal; font-display: block; }}")
    open(os.path.join(HERE, 'fonts.css'), 'w').write('\n'.join(rules) + '\n')
    print('\n'.join(sorted(f'{f} {w}' for f, w in seen)))


if __name__ == '__main__':
    main()
