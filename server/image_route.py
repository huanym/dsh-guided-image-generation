"""OpenAI-compatible image generation route with ordered model fallback."""
from __future__ import annotations

import argparse
import base64
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Callable, Any

DEFAULT_BASE_URL = "https://api.openai.com/v1"
MODELS = ("gpt-image-2.5-flare", "gpt-image-2")


class ImageGenerationError(RuntimeError):
    pass


def _request_json(opener: Callable[..., Any], url: str, headers: dict[str, str], body: bytes | None = None) -> dict:
    request = urllib.request.Request(url, data=body, headers=headers, method="POST" if body is not None else "GET")
    with opener(request, timeout=300) as response:
        raw = response.read()
    parsed = json.loads(raw.decode("utf-8"))
    if not isinstance(parsed, dict):
        raise ValueError("API returned a non-object JSON response")
    return parsed


def generate_image(
    prompt: str,
    output: str | Path,
    *,
    size: str = "1024x1024",
    quality: str = "high",
    api_key: str | None = None,
    base_url: str = DEFAULT_BASE_URL,
    models: tuple[str, ...] | list[str] | None = None,
    opener: Callable[..., Any] = urllib.request.urlopen,
) -> Path:
    key = api_key or os.environ.get("OPENAI_API_KEY")
    if not key:
        raise ImageGenerationError("Set OPENAI_API_KEY before generating an image")
    if not prompt.strip():
        raise ValueError("prompt must not be empty")

    chain = tuple(models) if models else MODELS
    endpoint = base_url.rstrip("/") + "/images/generations"
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    failures: list[str] = []
    for model in chain:
        payload = json.dumps({"model": model, "prompt": prompt, "size": size, "quality": quality}).encode("utf-8")
        try:
            result = _request_json(opener, endpoint, headers, payload)
            data = result.get("data")
            if not isinstance(data, list) or not data or not isinstance(data[0], dict):
                raise ValueError("API response has no data[0] image")
            image = data[0]
            if image.get("b64_json"):
                content = base64.b64decode(image["b64_json"], validate=True)
            elif image.get("url"):
                image_url = urllib.parse.urlparse(image["url"])
                if image_url.scheme != "https" or not image_url.netloc:
                    raise ValueError("API returned a non-HTTPS image URL")
                with opener(urllib.request.Request(image["url"]), timeout=300) as response:
                    content = response.read()
            else:
                raise ValueError("API image contains neither b64_json nor url")
            if not content:
                raise ValueError("API returned an empty image")
            destination = Path(output).expanduser()
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_bytes(content)
            return destination
        except Exception as exc:
            status = getattr(exc, "code", None)
            if status:
                detail = f"HTTP {status}"
                try:
                    body = exc.read().decode("utf-8", "replace").strip()
                except Exception:
                    body = ""
                if body:
                    detail += f": {body[:400]}"
            else:
                detail = str(exc)
            failures.append(f"{model}: {detail}")
    raise ImageGenerationError("All image models failed: " + "; ".join(failures))


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Generate an image through an OpenAI-compatible API")
    parser.add_argument("--prompt", required=True, help="Image prompt")
    parser.add_argument("--size", default="1024x1024", help="Requested image size, e.g. 1536x1024")
    parser.add_argument("--quality", default="high", help="Requested image quality")
    parser.add_argument("--output", required=True, help="Destination image path")
    parser.add_argument("--base-url", default=os.environ.get("OPENAI_BASE_URL", DEFAULT_BASE_URL))
    args = parser.parse_args(argv)
    try:
        path = generate_image(args.prompt, args.output, size=args.size, quality=args.quality, base_url=args.base_url)
    except Exception as exc:
        print(f"Image generation failed: {exc}", file=sys.stderr)
        return 1
    print(path.resolve())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
