# Phase 1: Foundation & Data - Research

**Researched:** 2026-01-22
**Domain:** Local data persistence, image storage, and file handling
**Confidence:** HIGH

## Summary

This phase establishes local storage infrastructure for test cases and images in a Python/FastAPI application. The standard approach uses Python's built-in JSON module for structured data persistence with one file per test case, Pillow for image processing (compression/resizing), and SHA-256 hashing for content-addressed deduplication. FastAPI's UploadFile handles async file uploads efficiently.

The user has decided on a `.festival-tests` folder structure with git-committable data, flat list organization, and one JSON file per test case. Images will be optimized on upload and deduplicated using content hashing.

**Primary recommendation:** Use Python's standard library (json, hashlib, pathlib) for data persistence, Pillow for image optimization, and FastAPI's UploadFile for async file handling. All recommended libraries are mature, well-documented, and appropriate for this local-storage use case.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| json (stdlib) | Built-in | JSON serialization/deserialization | Python standard library, zero dependencies, sufficient for small datasets |
| hashlib (stdlib) | Built-in | File hashing (SHA-256) | Python standard library with HACL* cryptographic backing (2025+ updates) |
| pathlib (stdlib) | Built-in | File system operations | Modern Python standard for path manipulation, cleaner than os.path |
| Pillow | 10.x+ | Image processing, resize, compression | Most popular Python image library, actively maintained fork of PIL |
| FastAPI UploadFile | Built-in | Async file upload handling | FastAPI's native async file handling with memory-efficient spooled files |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| python-multipart | Latest | Form/file upload parsing | Required dependency for FastAPI file uploads |
| python-magic | 0.4.x | File type validation (magic numbers) | Optional - for security-critical validation beyond MIME types |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Pillow | Pillow-SIMD | 6x faster processing but harder to install, overkill for test data workload |
| SHA-256 | xxHash or imohash | Faster but non-cryptographic; SHA-256 offers better collision resistance |
| JSON files | SQLite | More complex for this use case; overkill for handful of festivals |
| hashlib | blake2 | Marginally faster, but SHA-256 is more universally understood |

**Installation:**
```bash
pip install pillow python-multipart
```

## Architecture Patterns

### Recommended Project Structure
```
.festival-tests/
├── data/
│   ├── 001-coachella.json         # One JSON file per test case
│   ├── 002-burning-man.json
│   └── ...
├── images/
│   ├── <hash>.jpg                 # Content-addressed images (SHA-256 hash as filename)
│   ├── <hash>.jpg
│   └── ...
└── .gitignore                      # Optional: ignore large images if needed

backend/
├── storage/
│   ├── __init__.py
│   ├── test_cases.py              # Test case persistence logic
│   ├── images.py                  # Image storage and deduplication
│   └── models.py                  # Pydantic models for test cases
```

### Pattern 1: Content-Addressed Image Storage

**What:** Store images using their content hash (SHA-256) as the filename to enable automatic deduplication.

**When to use:** When multiple test cases might reference identical images, or when you want immutable storage where identical content maps to the same file.

**Example:**
```python
# Source: Python hashlib official docs + verified best practices
import hashlib
from pathlib import Path

def hash_image(image_bytes: bytes) -> str:
    """Generate SHA-256 hash of image content."""
    return hashlib.sha256(image_bytes).hexdigest()

def save_image_deduplicated(image_bytes: bytes, storage_dir: Path) -> str:
    """Save image with content-addressed filename. Returns hash."""
    image_hash = hash_image(image_bytes)
    image_path = storage_dir / f"{image_hash}.jpg"

    # Only write if doesn't exist (automatic deduplication)
    if not image_path.exists():
        image_path.write_bytes(image_bytes)

    return image_hash
```

### Pattern 2: Atomic JSON Write with Context Manager

**What:** Use context manager pattern with temporary file + rename for atomic writes, preventing corruption during write failures.

**When to use:** Always, for any JSON file persistence where data integrity matters.

**Example:**
```python
# Source: Python json module docs + corruption prevention best practices
import json
import tempfile
from pathlib import Path

def save_test_case_atomic(data: dict, file_path: Path) -> None:
    """Atomically save JSON data to prevent corruption."""
    # Write to temporary file first
    with tempfile.NamedTemporaryFile(
        mode='w',
        dir=file_path.parent,
        delete=False,
        encoding='utf-8'
    ) as tmp:
        json.dump(data, tmp, indent=2, ensure_ascii=False)
        tmp_path = Path(tmp.name)

    # Atomic rename (overwrites target on most systems)
    tmp_path.replace(file_path)
```

### Pattern 3: FastAPI Async File Upload with Validation

**What:** Use FastAPI's UploadFile with validation checks before processing.

**When to use:** All file upload endpoints where security and memory efficiency matter.

**Example:**
```python
# Source: FastAPI official documentation
from fastapi import FastAPI, UploadFile, HTTPException, File
from typing import Annotated

ALLOWED_TYPES = {"image/jpeg", "image/png"}
MAX_SIZE = 10 * 1024 * 1024  # 10MB

@app.post("/upload-image/")
async def upload_festival_image(
    file: Annotated[UploadFile, File(description="Festival poster image")]
):
    # Validate content type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, "Only JPEG/PNG images allowed")

    # Read file content
    contents = await file.read()

    # Validate size after reading
    if len(contents) > MAX_SIZE:
        raise HTTPException(413, "Image too large")

    # Process and save...
    return {"filename": file.filename, "size": len(contents)}
```

### Pattern 4: Pillow Image Optimization

**What:** Resize and compress images on upload to reduce storage while maintaining acceptable quality.

**When to use:** When storing user-uploaded images locally where storage space is limited.

**Example:**
```python
# Source: Pillow official documentation
from PIL import Image
from io import BytesIO

def optimize_image(image_bytes: bytes, max_width: int = 1200) -> bytes:
    """Resize and compress image. Returns optimized JPEG bytes."""
    img = Image.open(BytesIO(image_bytes))

    # Convert to RGB if necessary (handles PNG with transparency)
    if img.mode in ('RGBA', 'LA', 'P'):
        img = img.convert('RGB')

    # Resize if too large (maintaining aspect ratio)
    if img.width > max_width:
        ratio = max_width / img.width
        new_height = int(img.height * ratio)
        img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)

    # Save with optimization
    output = BytesIO()
    img.save(output, format='JPEG', quality=85, optimize=True)
    return output.getvalue()
```

### Anti-Patterns to Avoid

- **Loading entire JSON file to append**: Always use read-modify-write pattern; don't try in-place seek+write edits
- **Trusting client-provided filenames**: Always sanitize or generate your own filenames to prevent path traversal attacks
- **Not using context managers**: Always use `with open()` to ensure files close properly
- **Ignoring image mode conversion**: Convert RGBA/LA to RGB before saving as JPEG to avoid errors
- **Memory loading large files**: Use chunked reading for large files, though not critical for test image scale
- **Hardcoding file paths**: Use pathlib for cross-platform compatibility

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File hashing | Custom hash algorithm or manual chunking | `hashlib.sha256()` with `.update()` | Standard library handles edge cases, formally verified crypto (HACL*) |
| Image resizing | Manual pixel manipulation | `Pillow Image.resize()` | Complex interpolation algorithms (LANCZOS, BICUBIC) already implemented |
| Atomic file writes | Direct write to target file | Temp file + rename pattern | OS-level atomic operations prevent corruption on crash |
| JSON serialization | String concatenation | `json.dump()` | Handles escaping, encoding, nested structures correctly |
| File uploads | Reading request body manually | `FastAPI UploadFile` | Memory-efficient spooled files, async support, metadata access |
| Image format detection | Checking file extension | `python-magic` or Pillow | Extensions can be spoofed; magic numbers are authoritative |
| Path manipulation | String concatenation | `pathlib.Path` | Handles platform differences, prevents path traversal bugs |

**Key insight:** Python's standard library and Pillow solve 95% of this phase's problems. Don't reinvent unless you have specific performance requirements (e.g., processing thousands of images).

## Common Pitfalls

### Pitfall 1: JSON Corruption from Direct Overwrites

**What goes wrong:** Writing directly to existing JSON files can corrupt data if the write fails mid-operation (power loss, disk full, process killed).

**Why it happens:** Python's `open(file, 'w')` truncates the file immediately before writing, so any failure leaves an empty or partial file.

**How to avoid:** Use atomic writes: write to temporary file, then rename to target. POSIX rename is atomic at OS level.

**Warning signs:** Occasional empty JSON files, "invalid JSON" errors after crashes, data loss during server restarts.

### Pitfall 2: Pillow RGBA to JPEG Conversion Errors

**What goes wrong:** Attempting to save PNG images with transparency (RGBA mode) as JPEG fails with cryptic errors like "cannot write mode RGBA as JPEG".

**Why it happens:** JPEG doesn't support transparency, but Pillow doesn't auto-convert on save.

**How to avoid:** Always check image mode and convert to RGB before saving as JPEG: `img.convert('RGB')`.

**Warning signs:** Errors only on certain images (PNGs with transparency), "cannot write mode" exceptions.

### Pitfall 3: Trusting Client Content-Type Headers

**What goes wrong:** Malicious users can upload executable files with spoofed MIME types (e.g., claiming `image/jpeg` for a .exe file).

**Why it happens:** HTTP Content-Type is client-controlled and trivially spoofed.

**How to avoid:** For high-security scenarios, validate file magic numbers using `python-magic`. For moderate security, also validate with Pillow by attempting to open the image.

**Warning signs:** Users uploading non-image files that pass content-type validation, security vulnerabilities in file serving.

### Pitfall 4: Image Memory Exhaustion

**What goes wrong:** Opening and processing very large images can consume excessive memory, potentially crashing the application.

**Why it happens:** Pillow decompresses images into raw pixel data in memory. A 50MB JPEG might decompress to 500MB+ in memory.

**How to avoid:** Set maximum image dimensions and validate before processing. Close images explicitly with `img.close()` when done, or use context managers.

**Warning signs:** Out of memory errors when processing certain images, slow response times, memory leaks.

### Pitfall 5: Path Traversal via Filename Injection

**What goes wrong:** Using user-supplied filenames directly can allow path traversal attacks like `../../etc/passwd`.

**Why it happens:** Unsanitized input in file paths allows directory traversal characters.

**How to avoid:** Never use `file.filename` directly in paths. Generate your own filenames (UUIDs, hashes, sequential IDs). If you must preserve names, use `os.path.basename()` and validate against allowlist.

**Warning signs:** Files appearing in unexpected directories, security audit findings, penetration test failures.

### Pitfall 6: JSON Encoding Issues with Non-ASCII Characters

**What goes wrong:** Special characters (emojis, international characters) in test case names appear as unicode escapes like `\u1234` or fail to save.

**Why it happens:** Default JSON encoding uses ASCII-only mode which escapes non-ASCII characters.

**How to avoid:** Always use `ensure_ascii=False` with UTF-8 encoding: `json.dump(data, f, ensure_ascii=False)`.

**Warning signs:** Festival names with international characters look garbled, emojis appear as escape sequences.

### Pitfall 7: Race Conditions in Concurrent File Access

**What goes wrong:** Multiple requests modifying test cases simultaneously can lead to lost updates or corrupted data.

**Why it happens:** Read-modify-write operations aren't atomic. Two requests read the same data, both modify, both write - last write wins, first update lost.

**How to avoid:** For this phase's small scale, FastAPI runs single-threaded by default so not an issue. Document for future phases that file-based storage has concurrency limits.

**Warning signs:** Occasional lost updates, test cases reverting to old data, inconsistent state after concurrent requests.

## Code Examples

Verified patterns from official sources:

### Loading All Test Cases
```python
# Source: Python json + pathlib standard docs
from pathlib import Path
import json
from typing import List, Dict

def load_all_test_cases(data_dir: Path) -> List[Dict]:
    """Load all JSON test case files from data directory."""
    test_cases = []

    for json_file in data_dir.glob("*.json"):
        with json_file.open('r', encoding='utf-8') as f:
            try:
                data = json.load(f)
                test_cases.append(data)
            except json.JSONDecodeError as e:
                # Log error but continue loading other files
                print(f"Skipping corrupted file {json_file}: {e}")
                continue

    return test_cases
```

### Complete Image Upload + Optimization + Deduplication
```python
# Source: FastAPI + Pillow + hashlib official docs
from fastapi import FastAPI, UploadFile, HTTPException
from PIL import Image
from io import BytesIO
from pathlib import Path
import hashlib

IMAGES_DIR = Path(".festival-tests/images")
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_WIDTH = 1200

async def process_uploaded_image(file: UploadFile) -> str:
    """
    Process uploaded image: validate, optimize, deduplicate.
    Returns content hash (filename without extension).
    """
    # Validate content type
    if file.content_type not in {"image/jpeg", "image/png"}:
        raise HTTPException(400, "Only JPEG/PNG allowed")

    # Read content
    contents = await file.read()

    # Validate size
    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(413, "Image too large (max 10MB)")

    # Open and validate it's actually an image
    try:
        img = Image.open(BytesIO(contents))
        img.verify()  # Verify it's not corrupted
        img = Image.open(BytesIO(contents))  # Reopen after verify
    except Exception as e:
        raise HTTPException(400, f"Invalid image: {e}")

    # Convert to RGB if needed
    if img.mode in ('RGBA', 'LA', 'P'):
        img = img.convert('RGB')

    # Resize if too large
    if img.width > MAX_WIDTH:
        ratio = MAX_WIDTH / img.width
        new_height = int(img.height * ratio)
        img = img.resize((MAX_WIDTH, new_height), Image.Resampling.LANCZOS)

    # Compress to JPEG
    output = BytesIO()
    img.save(output, format='JPEG', quality=85, optimize=True)
    optimized_bytes = output.getvalue()

    # Generate content hash
    image_hash = hashlib.sha256(optimized_bytes).hexdigest()

    # Save with content-addressed filename (automatic deduplication)
    image_path = IMAGES_DIR / f"{image_hash}.jpg"
    if not image_path.exists():
        IMAGES_DIR.mkdir(parents=True, exist_ok=True)
        image_path.write_bytes(optimized_bytes)

    return image_hash
```

### Test Case Model with Pydantic
```python
# Source: Pydantic + FastAPI best practices
from pydantic import BaseModel, Field
from typing import List

class TestCase(BaseModel):
    """Model for a festival test case."""
    name: str = Field(..., description="Festival name")
    image_hash: str = Field(..., description="Content hash of festival image")
    lineup: List[str] = Field(..., description="List of artist names")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Coachella 2024",
                "image_hash": "a1b2c3d4...",
                "lineup": ["The Weeknd", "Daft Punk", "Billie Eilish"]
            }
        }

def save_test_case(test_case: TestCase, test_case_id: str, data_dir: Path):
    """Save test case to JSON file atomically."""
    file_path = data_dir / f"{test_case_id}.json"

    # Write to temp file first
    import tempfile
    with tempfile.NamedTemporaryFile(
        mode='w',
        dir=data_dir,
        delete=False,
        encoding='utf-8'
    ) as tmp:
        tmp.write(test_case.model_dump_json(indent=2))
        tmp_path = Path(tmp.name)

    # Atomic rename
    tmp_path.replace(file_path)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| PIL (Python Imaging Library) | Pillow (PIL fork) | 2009 (Pillow created) | Pillow adds Python 3 support, active maintenance, modern features |
| Manual file chunking for hashing | `hashlib.file_digest()` | Python 3.11 (2022) | Simpler API, may use OS-level file descriptor for efficiency |
| MD5 for deduplication | SHA-256 | ~2015 (MD5 collisions proven) | Better collision resistance, still fast enough for this use case |
| `os.path` for paths | `pathlib.Path` | Python 3.4 (2014) | Object-oriented API, cleaner code, better type hints |
| JSON encoding with ASCII escaping | `ensure_ascii=False` | Always available, now best practice | Human-readable international text in JSON files |
| HACL* cryptographic library | Built into hashlib | Python 3.13+ (2024) | Formally verified cryptography, stronger security guarantees |

**Deprecated/outdated:**
- **PIL (Python Imaging Library)**: Abandoned in 2009, replaced by Pillow
- **MD5 for content deduplication**: While faster, SHA-256 is now standard due to collision resistance
- **Manual temp file patterns**: Python 3.11+ `hashlib.file_digest()` simplifies file hashing (though temp+rename pattern still needed for atomic writes)

## Open Questions

Things that couldn't be fully resolved:

1. **Optimal target image size for festival posters**
   - What we know: 1200px width is common for web images, balances quality and size
   - What's unclear: User's actual display requirements and quality tolerance
   - Recommendation: Start with 1200px width, JPEG quality 85. Adjust based on user feedback in Phase 3 (UI testing)

2. **Handling corrupted JSON files**
   - What we know: Atomic writes prevent new corruption, but existing files might be corrupt
   - What's unclear: Should we attempt repair, skip, or fail loudly?
   - Recommendation: Skip corrupted files with logging (don't crash app). Can add repair later if needed.

3. **Git LFS consideration for images**
   - What we know: User wants git-committable data, images will be optimized/small
   - What's unclear: Total image storage size, whether it exceeds git's comfort zone
   - Recommendation: Proceed without Git LFS initially (handful of festivals = ~10MB max). Document for future if dataset grows.

## Sources

### Primary (HIGH confidence)
- [Python hashlib official documentation](https://docs.python.org/3/library/hashlib.html) - File hashing API, algorithms, security guidance
- [Python json official documentation](https://docs.python.org/3/library/json.html) - JSON serialization, formatting parameters
- [Pillow Image module documentation](https://pillow.readthedocs.io/en/stable/reference/Image.html) - Resize methods, resampling filters
- [Pillow image format documentation](https://pillow.readthedocs.io/en/stable/handbook/image-file-formats.html) - JPEG/PNG compression parameters
- [FastAPI Request Files tutorial](https://fastapi.tiangolo.com/tutorial/request-files/) - UploadFile API, async handling

### Secondary (MEDIUM confidence)
- [Better Stack: FastAPI File Uploads](https://betterstack.com/community/guides/scaling-python/uploading-files-using-fastapi/) - Security best practices, validation patterns
- [Medium: FastAPI File Upload Validation](https://medium.com/@jayhawk24/upload-files-in-fastapi-with-file-validation-787bd1a57658) - Content-type validation, magic number checking
- [Uploadcare: Python Image Optimization](https://uploadcare.com/blog/image-optimization-python/) - Pillow vs alternatives, performance comparison
- [CodeRivers: SHA256 in Python](https://coderivers.org/blog/sha256-python/) - File hashing patterns, chunk sizes
- [Real Python: Working with JSON](https://realpython.com/python-json/) - JSON file handling patterns

### Tertiary (LOW confidence - marked for validation)
- [DEV.to: FastAPI Image Optimization](https://medium.com/@sizanmahmud08/fastapi-image-optimization-a-complete-guide-to-faster-and-smarter-file-handling-38705e5a7b3c) - Recent patterns (2025), but single source
- Various GitHub gists and discussions on file hashing chunk sizes - Consistent 4096-byte default, but not formally specified

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All recommendations from official docs, mature libraries with 5+ years stability
- Architecture: HIGH - Patterns verified in official documentation and widely used in production
- Pitfalls: HIGH - Documented issues from official troubleshooting guides and security best practices

**Research date:** 2026-01-22
**Valid until:** 2026-06-22 (6 months - stable domain, Python/Pillow changes slowly)

**Notes:**
- Python 3.11+ recommended for `hashlib.file_digest()` (though manual chunking works on older versions)
- All proposed libraries are in Python stdlib or single `pip install` - no complex dependencies
- User's decisions (CONTEXT.md) align perfectly with standard practices for local-storage applications
- No exotic requirements that would require non-standard approaches
