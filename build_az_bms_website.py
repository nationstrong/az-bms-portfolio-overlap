from __future__ import annotations
import json, zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data" / "portfolio_data.json"
JS = ROOT / "assets" / "data.js"

def main():
    data = json.loads(DATA.read_text(encoding="utf-8"))
    required = ["plot","overlapUnits","programs","fitCollisionAxes","fitCollisionMatrix"]
    missing = [k for k in required if k not in data]
    if missing:
        raise SystemExit(f"Missing data sections: {missing}")
    JS.write_text("window.PORTFOLIO_DATA = "+json.dumps(data,ensure_ascii=False,separators=(",",":"))+";\n",encoding="utf-8")
    out = ROOT.parent / "AZ_BMS_Portfolio_Fit_Collision_GitHub_Pages.zip"
    with zipfile.ZipFile(out,"w",zipfile.ZIP_DEFLATED) as z:
        for path in sorted(ROOT.rglob("*")):
            if path.is_file() and path != Path(__file__) and path.name != out.name:
                z.write(path,path.relative_to(ROOT))
        z.write(Path(__file__),Path(__file__).name)
    print(f"Validated {len(data['programs'])} programs and {len(data['fitCollisionMatrix'])} populated matrix cells")
    print(out)

if __name__ == "__main__": main()
