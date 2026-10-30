"""Local HTTP bridge for the guided image-generation client plugin."""
from __future__ import annotations

import json
import mimetypes
import os
import subprocess
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from image_route import generate_image

PORT = int(os.environ.get("DSH_IMAGE_PORT", "8769"))
ROOT = Path(os.environ.get("DSH_IMAGE_ROOT", Path.cwd()))


def pick_directory() -> str:
    """Open a native folder picker; PowerShell only if tkinter is unusable."""
    try:
        import tkinter
        from tkinter import filedialog

        root = tkinter.Tk()
        root.withdraw()
        root.attributes("-topmost", True)
        root.update()
        chosen = filedialog.askdirectory(parent=root, title="选择图片输出文件夹", mustexist=True)
        root.destroy()
        return chosen or ""
    except Exception:
        pass

    script = (
        "Add-Type -AssemblyName System.Windows.Forms;"
        "$o=New-Object System.Windows.Forms.Form;"
        "$o.TopMost=$true;$o.ShowInTaskbar=$false;"
        "$o.WindowState='Minimized';$o.Show();"
        "$d=New-Object System.Windows.Forms.FolderBrowserDialog;"
        "$d.Description='选择图片输出文件夹';"
        "$r=$d.ShowDialog($o);$o.Close();"
        "if($r -eq 'OK'){Write-Output $d.SelectedPath}"
    )
    completed = subprocess.run(
        ["powershell", "-NoProfile", "-STA", "-Command", script],
        capture_output=True, text=True, timeout=300,
    )
    return completed.stdout.strip()


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_args):
        return

    def _send(self, code, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/models":
            query = parse_qs(parsed.query)
            base = (query.get("base", [""])[0] or "https://api.openai.com/v1").rstrip("/")
            key = query.get("key", [""])[0] or os.environ.get("OPENAI_API_KEY", "")
            try:
                request = urllib.request.Request(base + "/models", headers={"Authorization": f"Bearer {key}"})
                with urllib.request.urlopen(request, timeout=20) as response:
                    payload = json.loads(response.read().decode("utf-8", "replace"))
                items = payload.get("data") if isinstance(payload, dict) else None
                ids = [item.get("id") for item in items or [] if isinstance(item, dict) and item.get("id")]
                self._send(200, {"ok": True, "models": ids})
            except Exception as exc:
                self._send(200, {"ok": False, "error": str(exc)[:300], "models": []})
            return
        if parsed.path == "/pickdir":
            try:
                self._send(200, {"ok": True, "path": pick_directory()})
            except Exception as exc:
                self._send(200, {"ok": False, "error": str(exc)[:300]})
            return
        if parsed.path == "/check":
            query = parse_qs(parsed.query)
            base = (query.get("base", [""])[0] or "https://api.openai.com/v1").rstrip("/")
            key = query.get("key", [""])[0] or os.environ.get("OPENAI_API_KEY", "")
            url = base + "/models"
            try:
                request = urllib.request.Request(url, headers={"Authorization": f"Bearer {key}"})
                with urllib.request.urlopen(request, timeout=20) as response:
                    text = response.read(2000).decode("utf-8", "replace")
                self._send(200, {"ok": True, "status": response.status, "sample": text[:600]})
            except Exception as exc:
                status = getattr(exc, "code", None)
                body = ""
                try:
                    body = exc.read().decode("utf-8", "replace")[:400]
                except Exception:
                    pass
                self._send(200, {"ok": False, "status": status, "error": str(exc)[:300], "body": body})
            return
        if parsed.path == "/open":
            target = Path(parse_qs(parsed.query).get("path", [""])[0])
            if not target.is_absolute():
                target = ROOT / target
            try:
                resolved = target.resolve()
                os.startfile(str(resolved if resolved.is_dir() else resolved.parent))
                self._send(200, {"ok": True, "opened": str(resolved)})
            except Exception as exc:
                self._send(500, {"error": str(exc)})
            return
        if parsed.path == "/ping":
            stage = parse_qs(parsed.query).get("stage", ["unknown"])[0]
            try:
                log = ROOT / "output" / "client-diag.log"
                log.parent.mkdir(parents=True, exist_ok=True)
                with log.open("a", encoding="utf-8") as handle:
                    handle.write(parsed.query + "\n")
            except Exception:
                pass
            self._send(200, {"ok": True, "stage": stage})
            return
        if parsed.path != "/image":
            self._send(404, {"error": "Not found"})
            return
        path = Path(parse_qs(parsed.query).get("path", [""])[0])
        if not path.is_absolute():
            path = ROOT / path
        try:
            resolved = path.resolve()
            if resolved.suffix.lower() not in {".png", ".jpg", ".jpeg", ".webp", ".gif"}:
                raise ValueError("only image files can be previewed")
            content = resolved.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", mimetypes.guess_type(str(resolved))[0] or "application/octet-stream")
            self.send_header("Content-Length", str(len(content)))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(content)
        except Exception as exc:
            self._send(404, {"error": str(exc)})

    def do_POST(self):
        if self.path != "/generate":
            self._send(404, {"error": "Not found"})
            return
        try:
            size = int(self.headers.get("Content-Length", "0"))
            request = json.loads(self.rfile.read(size))
            output = Path(request.get("output") or "output/generated-image.png")
            if not output.is_absolute():
                output = ROOT / output
            result = generate_image(
                request.get("prompt", ""),
                output,
                size=request.get("size", "1024x1024"),
                quality=request.get("quality", "high"),
                api_key=request.get("api_key") or None,
                base_url=request.get("base_url") or os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1"),
                models=request.get("models") or None,
            )
            self._send(200, {"path": str(result.resolve())})
        except Exception as exc:
            self._send(500, {"error": str(exc)})


if __name__ == "__main__":
    try:
        ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
    except OSError:
        # Another instance already owns the port; that one serves the client.
        raise SystemExit(0)
