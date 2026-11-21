"""Crea un unico file HTML del sito da mandare al team: si apre con doppio clic, anche senza internet.
Dentro ci sono stili, script, logo 3D (three.js), caratteri, icone e immagini.
Uso: npm run export  (oppure python3 -I tools/export.py [file di uscita])
I file scaricati (caratteri, icone) restano in .cache/ così la seconda volta non serve la rete.
"""
import base64, hashlib, mimetypes, pathlib, re, subprocess, sys, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path.home() / 'Desktop' / 'Factanza sito.html'
CACHE = ROOT / '.cache'
UA = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'}
PHOSPHOR = 'https://unpkg.com/@phosphor-icons/web@2.1.1/src/'


def get(url):
    f = CACHE / hashlib.sha1(url.encode()).hexdigest()
    if not f.exists():
        CACHE.mkdir(exist_ok=True)
        f.write_bytes(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30).read())
    return f.read_bytes()


def data_uri(raw, name):
    mime = mimetypes.guess_type(name)[0] or ('font/woff2' if name.endswith('woff2') else 'application/octet-stream')
    return f'data:{mime};base64,{base64.b64encode(raw).decode()}'


def inline_css_urls(css, base):
    """url(...) dentro un CSS scaricato -> data URI (solo woff2: basta a tutti i browser recenti)."""
    def rep(m):
        u = m.group(1).strip('\'"')
        if u.startswith('data:'):
            return m.group(0)
        u = urllib.parse.urljoin(base, u)
        return f'url({data_uri(get(u), u.split("?")[0])})'
    css = re.sub(r',\s*url\([^)]*\.(?:woff|ttf|svg)[^)]*\)\s*format\("[^"]+"\)', '', css)  # tiene solo il woff2
    return re.sub(r'url\(([^)]+)\)', rep, css)


import urllib.parse  # noqa: E402  (usato in inline_css_urls)


def fonts():
    g = get('https://fonts.googleapis.com/css2?family=Anton&display=swap').decode()
    g = '\n'.join(b for b in re.findall(r'/\* [\w-]+ \*/\s*@font-face\s*\{[^}]+\}', g) if '/* latin */' in b)  # solo alfabeto latino
    f = get('https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap').decode()
    return inline_css_urls(g, 'https://fonts.googleapis.com/') + '\n' + inline_css_urls(f, 'https://api.fontshare.com/')


def icons(html):
    """Solo le icone usate nella pagina, dalle famiglie bold e fill di Phosphor."""
    out = []
    for fam in ('bold', 'fill'):
        css = get(PHOSPHOR + f'{fam}/style.css').decode()
        used = set(re.findall(rf'ph-{fam} (ph-[\w-]+)', html)) | set(re.findall(rf'ph-{fam} (ph-[\w-]+)', (ROOT / 'i18n.js').read_text()))
        head = css[:css.index('.ph-' + fam + '.ph-')] if ('.ph-' + fam + '.ph-') in css else css
        rules = [m.group(0) for m in re.finditer(rf'\.ph-{fam}\.(ph-[\w-]+):before\s*\{{[^}}]*\}}', css) if m.group(1) in used]
        assert len(rules) == len(used), f'icone {fam} non trovate: {used}'
        out.append(inline_css_urls(head, PHOSPHOR + f'{fam}/') + '\n'.join(rules))
    return '\n'.join(out)


def logo_js():
    r = subprocess.run(['npx', 'esbuild', 'logo3d.js', '--bundle', '--minify', '--format=iife', '--log-level=warning'],
                       cwd=ROOT, capture_output=True, text=True, check=True)
    return r.stdout


def script(js):
    assert '</script' not in js.lower(), 'uno script contiene </script>'
    return '<script>' + js + '</script>'


def main():
    h = (ROOT / 'index.html').read_text()
    n = {}

    def sub(pattern, repl, flags=0, key=None):
        nonlocal h
        h, c = re.subn(pattern, repl, h, flags=flags)
        n[key or pattern[:30]] = c

    sub(r'<link rel="preconnect"[^>]*>\n', '', key='preconnect')
    sub(r'<link rel="stylesheet" href="https://fonts\.googleapis[^>]*>\n', '', key='google')
    sub(r'<link rel="stylesheet" href="https://api\.fontshare[^>]*>\n', '', key='fontshare')
    sub(r'<script src="https://unpkg\.com/@phosphor-icons[^>]*></script>\n', lambda m: '<style>' + icons(h) + '</style>\n', key='icone')
    sub(r'<script type="importmap">.*?</script>\n', '', flags=re.S, key='importmap')
    css = fonts() + '\n' + (ROOT / 'tokens.css').read_text() + '\n' + (ROOT / 'site.css').read_text()
    sub(r'<link rel="stylesheet" href="tokens\.css">\n<link rel="stylesheet" href="site\.css">', lambda m: '<style>\n' + css + '</style>', key='css')
    for name in ('vendor/qrcode.js', 'i18n.js', 'site.js'):
        sub(rf'<script src="{re.escape(name)}"></script>', lambda m, name=name: script((ROOT / name).read_text()), key=name)
    sub(r'<script type="module" src="logo3d\.js"></script>', lambda m: script(logo_js()), key='logo')
    img = data_uri((ROOT / 'assets/factanza-f.png').read_bytes(), 'f.png')
    sub(r'(src|href)="assets/factanza-f\.png"', lambda m: f'{m.group(1)}="{img}"', key='immagini')

    missing = [k for k, c in n.items() if not c]
    assert not missing, f'non trovato in index.html: {missing}'
    rest = re.sub(r'(?s)<script>.*?</script>|<style>.*?</style>', '', h)
    left = re.findall(r'(?:src|href)="(?!data:|#)[^"]+"', rest)
    assert not left, f'restano file esterni: {left}'
    OUT.write_text(h)
    print(f'{OUT}  {len(h) // 1024} KB  · sostituzioni: {n}')


main()
