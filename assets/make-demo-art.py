"""Gera as artes abstratas do seed (public/demo) — sem fotos reais de ninguém."""
import math, random, pathlib

OUT = pathlib.Path(__file__).resolve().parent.parent / "public" / "demo"
OUT.mkdir(parents=True, exist_ok=True)

def rift_bg(w, h, c1, c2, seed, extra=""):
    rnd = random.Random(seed)
    shards = []
    for _ in range(14):
        x, y = rnd.uniform(0, w), rnd.uniform(0, h)
        s = rnd.uniform(w * 0.05, w * 0.22)
        a = rnd.uniform(0, math.tau)
        pts = " ".join(f"{x + s * math.cos(a + k * 2.1):.0f},{y + s * 0.7 * math.sin(a + k * 2.1):.0f}" for k in range(3))
        shards.append(f'<polygon points="{pts}" fill="url(#g2)" opacity="{rnd.uniform(.08,.32):.2f}"/>')
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">
<defs>
<radialGradient id="g1" cx="30%" cy="25%" r="90%"><stop offset="0" stop-color="{c1}"/><stop offset="1" stop-color="#0a0b14"/></radialGradient>
<linearGradient id="g2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="{c2}"/></linearGradient>
<linearGradient id="rift" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{c2}" stop-opacity="0"/><stop offset=".5" stop-color="{c2}"/><stop offset="1" stop-color="{c2}" stop-opacity="0"/></linearGradient>
<filter id="blur"><feGaussianBlur stdDeviation="{w*0.02:.0f}"/></filter>
</defs>
<rect width="{w}" height="{h}" fill="url(#g1)"/>
{''.join(shards)}
<path d="M{w*0.15:.0f},{h:.0f} L{w*0.45:.0f},{h*0.55:.0f} L{w*0.38:.0f},{h*0.48:.0f} L{w*0.85:.0f},0" stroke="url(#rift)" stroke-width="{w*0.035:.0f}" fill="none" filter="url(#blur)"/>
<path d="M{w*0.15:.0f},{h:.0f} L{w*0.45:.0f},{h*0.55:.0f} L{w*0.38:.0f},{h*0.48:.0f} L{w*0.85:.0f},0" stroke="#fff" stroke-opacity=".75" stroke-width="{w*0.004:.1f}" fill="none"/>
{extra}
</svg>'''

def silhouette(w, h, color):
    cx = w / 2
    return (f'<g opacity=".9"><circle cx="{cx:.0f}" cy="{h*0.42:.0f}" r="{w*0.16:.0f}" fill="{color}"/>'
            f'<path d="M{cx - w*0.36:.0f},{h:.0f} Q{cx - w*0.34:.0f},{h*0.62:.0f} {cx:.0f},{h*0.62:.0f} Q{cx + w*0.34:.0f},{h*0.62:.0f} {cx + w*0.36:.0f},{h:.0f} Z" fill="{color}"/></g>')

def trophy(w, h):
    x, y = w * 0.72, h * 0.2
    return (f'<g transform="translate({x:.0f},{y:.0f}) scale({w/900:.2f})" opacity=".9" fill="#f5c14b">'
            '<path d="M-60,0 h120 v40 a60,60 0 0 1 -120,0 z"/><rect x="-12" y="95" width="24" height="40"/><rect x="-45" y="135" width="90" height="16" rx="6"/>'
            '<path d="M-60,10 h-30 a30,30 0 0 0 30,45 M60,10 h30 a30,30 0 0 1 -30,45" stroke="#f5c14b" stroke-width="10" fill="none"/></g>')

def card(w, h, c1, c2, seed, title):
    frame = (f'<rect x="{w*0.05:.0f}" y="{h*0.04:.0f}" width="{w*0.9:.0f}" height="{h*0.92:.0f}" rx="{w*0.05:.0f}" fill="none" stroke="#f5c14b" stroke-width="{w*0.012:.0f}" opacity=".8"/>'
             f'<rect x="{w*0.1:.0f}" y="{h*0.72:.0f}" width="{w*0.8:.0f}" height="{h*0.14:.0f}" rx="{w*0.03:.0f}" fill="#0a0b14" opacity=".75"/>'
             f'<text x="{w/2:.0f}" y="{h*0.81:.0f}" fill="#eef0ff" font-family="sans-serif" font-weight="700" font-size="{w*0.07:.0f}" text-anchor="middle">{title}</text>')
    return rift_bg(w, h, c1, c2, seed, frame)

files = {
    "event-weekly.svg": rift_bg(1200, 675, "#3b2a8f", "#7b61ff", 1),
    "event-league.svg": rift_bg(1200, 675, "#0f5a63", "#36e2d3", 2),
    "champion-19.svg": rift_bg(1000, 1250, "#3b2a8f", "#f5c14b", 3, silhouette(1000, 1250, "#0a0b14") + trophy(1000, 1250)),
    "champion-20.svg": rift_bg(1000, 1250, "#4a1f6b", "#f5c14b", 4, silhouette(1000, 1250, "#0a0b14") + trophy(1000, 1250)),
    "champion-21.svg": rift_bg(1000, 1250, "#2a2370", "#f5c14b", 5, silhouette(1000, 1250, "#0a0b14") + trophy(1000, 1250)),
    "testing.svg": rift_bg(1200, 900, "#123c4a", "#36e2d3", 6),
    "card-kaisa.svg": card(600, 840, "#4a1f6b", "#c08cff", 7, "KAI'SA"),
    "card-jinx.svg": card(600, 840, "#2a2f8f", "#ff6bd5", 8, "JINX"),
    "card-generic.svg": card(600, 840, "#5a2a1f", "#ff9b54", 9, "ORIGINS"),
}
for name, (c1, c2, seed) in {"avatar-kaue": ("#3b2a8f", "#7b61ff", 11), "avatar-joao": ("#4a1f6b", "#c08cff", 12),
                             "avatar-rafael": ("#123c4a", "#36e2d3", 13), "avatar-bia": ("#5a2a1f", "#ff9b54", 14)}.items():
    files[f"{name}.svg"] = rift_bg(400, 400, c1, c2, seed, silhouette(400, 400, "#eef0ff"))

for name, svg in files.items():
    (OUT / name).write_text(svg)
print(f"{len(files)} artes em {OUT}")
