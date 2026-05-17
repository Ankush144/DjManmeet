# -*- coding: utf-8 -*-
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]
D = "div"

def el(tag, attrs="", inner=""):
    a = f' {attrs}' if attrs else ""
    if inner:
        return f"<{tag}{a}>{inner}</{tag}>"
    return f"<{tag}{a}></{tag}>"

def build_section():
    lines = []
    def L(s):
        lines.append(s)

    L('                    <div class="row">')
    L('                        <motion class="col-lg-12 mb-sm-30">')
    L('                            <div class="dj-embed-wrap wow fadeInUp">')
    L('                                <h5 class="mb-3 id-color">Spotify Playlist</h5>')
    L('                                <iframe id="dj-spotify-playlist-embed" title="Spotify" loading="lazy" allow="encrypted-media" src="https://open.spotify.com/embed/playlist/37i9dQZF1DX4dyzvuaRJ0n?utm_source=generator&theme=0"></iframe>')
    L('                            </div>')
    L('                        </div>')
    L('                    </div>')
    L('                    <div class="row">')
    L('                        <div class="col-lg-12">')
    L('                            <div id="section-dj-console" class="dj-console-section wow fadeInUp">')
    L('                                <p class="dj-console-section__title">Live DJ Console</p>')
    L('                                <p class="dj-console-section__sub">Pick a track below, load to Deck 1 or 2, and mix on the virtual DDJ-FLX4.</p>')
    L('                                <div class="dj-spotify-library">')
    L('                                    <div class="dj-spotify-library__head">')
    L('                                        <h5><i class="fa fa-spotify"></i> Track Library</h5>')
    L('                                        <span class="dj-spotify-library__hint">Select a track · LOAD 1 / LOAD 2 · CUE &amp; PLAY</span>')
    L('                                    </div>')
    L('                                    <ul id="dj-track-list" class="dj-track-list" aria-label="Spotify tracks"></ul>')
    L('                                </div>')
    L('                                <div class="dj-console-wrap">')
    L('                                    <motion id="dj-console" class="dj-console" role="application" aria-label="Virtual Pioneer DDJ-FLX4">')
    L('                                        <div class="dj-console__layout">')
    for deck, jog in [(1, 1), (2, 2)]:
        if deck == 2:
            L('                                            <div class="dj-mixer">')
            L('                                                <div class="dj-mixer__browse"><div class="dj-mixer__browse-knob"></motion><div class="dj-mixer__load"><button type="button" class="dj-btn-load dj-btn-load-deck" data-load-deck="1">LOAD 1</button><button type="button" class="dj-btn-load dj-btn-load-deck" data-load-deck="2">LOAD 2</button></div></div>')
            L('                                                <div class="dj-mixer__strips">')
            for vu in [1, 2]:
                L('                                                    <div class="dj-channel">')
                L('                                                        <div class="dj-knob"></div><span class="dj-knob-label">TRIM</span>')
                L('                                                        <div class="dj-knob"></div><span class="dj-knob-label">HI</span>')
                L('                                                        <div class="dj-knob"></div><span class="dj-knob-label">MID</span>')
                L('                                                        <div class="dj-knob"></div><span class="dj-knob-label">LOW</span>')
                L(f'                                                        <div class="dj-vu" data-vu-deck="{vu}"><span></span><span></span><span></span><span></span><span></span></div>')
                L('                                                        <button type="button" class="dj-btn-cue-ch">CUE</button>')
                L('                                                        <div class="dj-fader-wrap"><input type="range" min="0" max="100" value="80" orient="vertical"></div>')
                L('                                                    </div>')
            L('                                                </div>')
            L('                                                <div class="dj-mixer__master"><div><div class="dj-knob"></div><span class="dj-knob-label">MASTER</span></div><div class="dj-beatfx"><span class="dj-knob-label">BEAT FX</span><button type="button" class="dj-beatfx__on">ON</button></div></div>')
            L('                                                <div class="dj-crossfader-wrap"><label>CROSSFADER</label><input type="range" id="dj-crossfader" class="dj-crossfader" min="0" max="100" value="50"></div>')
            L('                                            </div>')
        L('                                            <div class="dj-deck">')
        L('                                                <div class="dj-deck__top"><button type="button" class="dj-btn-sm dj-btn-sync">SYNC</button><button type="button" class="dj-btn-sm">4</button><button type="button" class="dj-btn-sm">IN</button><button type="button" class="dj-btn-sm">OUT</button></div>')
        L('                                                <div class="dj-deck__main">')
        L('                                                    <div class="dj-jog-wrap">')
        L(f'                                                        <div class="dj-jog" data-jog-deck="{jog}"><div class="dj-jog__ring"></div><motion class="dj-jog__indicator"></div><div class="dj-jog__center">DECK {deck}</div></div>')
        L(f'                                                        <div class="dj-deck__display"><div id="deck-{deck}-spotify" class="dj-deck-embed"></div><p class="dj-deck__track-name" data-deck-label="{deck}">No track loaded</p></div>')
        L('                                                    </div>')
        L(f'                                                    <div class="dj-deck__transport"><button type="button" class="dj-btn-round dj-btn-cue" data-deck="{deck}">CUE</button><button type="button" class="dj-btn-round dj-btn-play" data-deck="{deck}">PLAY</button><button type="button" class="dj-btn-shift">SHIFT</button></div>')
        L('                                                </div>')
        L('                                                <div class="dj-pad-labels"><span>HOT CUE</span><span>PAD FX</span><span>BEAT</span><span>SAMPLE</span></div>')
        L('                                                <div class="dj-pads">' + ('<button type="button" class="dj-pad"></button>' * 8) + '</div>')
        L(f'                                                <div class="dj-tempo"><label>TEMPO</label><input type="range" min="0" max="100" value="50" data-tempo-deck="{deck}" orient="vertical"><span class="dj-bpm" data-bpm-deck="{deck}">128</span></motion>')
        L('                                            </div>')
    L('                                        </div>')
    L('                                        <p class="dj-console__brand">Pioneer DJ · DDJ-FLX4 Style · Virtual Console</p>')
    L('                                    </div>')
    L('                                </div>')
    L('                            </div>')
    L('                        </div>')
    L('                    </div>')
    s = "\n".join(lines)
    return s.replace("<motion ", "<" + D + " ").replace("</motion>", "</" + D + ">")

OLD = re.compile(
    r'                    <div class="row">\s*'
    r'<div class="col-lg-6 mb-sm-30">.*?'
    r'SoundCloud.*?</iframe>\s*'
    r'</div>\s*</div>\s*</div>',
    re.DOTALL,
)

def patch(path):
    text = path.read_text(encoding="utf-8")
    if 'id="dj-console"' in text:
        print("skip", path)
        return
    if "dj-console.css" not in text:
        text = text.replace(
            '<link href="css/dj-luxury.css" rel="stylesheet" type="text/css" />',
            '<link href="css/dj-luxury.css" rel="stylesheet" type="text/css" />\n'
            '    <link href="css/dj-console.css" rel="stylesheet" type="text/css" />',
        )
    if "dj-console.js" not in text:
        text = text.replace(
            '<script src="js/dj-portfolio.js"></script>',
            '<script src="js/dj-portfolio.js"></script>\n    <script src="js/dj-console.js"></script>',
        )
    m = OLD.search(text)
    if not m:
        print("no match", path)
        return
    text = text[: m.start()] + build_section() + text[m.end() :]
    path.write_text(text, encoding="utf-8")
    print("ok", path)

if __name__ == "__main__":
    patch(ROOT / "index.html")
    ui = ROOT / "UI"
    ui.mkdir(exist_ok=True)
    ui_path = ui / "index.html"
    if not ui_path.exists():
        t = (ROOT / "index.html").read_text(encoding="utf-8")
        for a, b in [
            ('href="css/', 'href="../css/'),
            ('href="images/', 'href="../images/'),
            ('src="images/', 'src="../images/'),
            ('src="js/', 'src="../js/'),
            ('action="src/', 'action="../src/'),
            ('url(images/', 'url(../images/'),
            ('href="index.html"', 'href="../index.html"'),
        ]:
            t = t.replace(a, b)
        ui_path.write_text(t, encoding="utf-8")
        print("ok", ui_path)
