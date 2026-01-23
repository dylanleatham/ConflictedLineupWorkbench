# Phase 2: Test Management & Configuration - Research

**Researched:** 2026-01-23
**Domain:** React CRUD operations with file uploads, FastAPI multipart form handling
**Confidence:** HIGH

## Summary

Phase 2 focuses on building CRUD functionality for test cases with file uploads, and configuration management for prompt strategies. The research covers React form handling patterns, FastAPI file upload handling, responsive layouts, and state persistence.

The standard approach combines React Hook Form for validation, React Router for navigation, FastAPI's UploadFile for backend processing, and CSS Grid with auto-fit/minmax for responsive card layouts. Form state should be uncontrolled initially with validation on submit, file previews use URL.createObjectURL with cleanup, and configuration persists via localStorage using a custom hook pattern.

Key technical requirements include proper MIME type validation (beyond just checking the Content-Type header), memory cleanup for blob URLs, and atomic file operations (already established in Phase 1). The card-based UI uses CSS Grid's auto-fit pattern to eliminate media queries while maintaining responsive behavior.

**Primary recommendation:** Use React Hook Form with validation functions for file uploads, FastAPI's UploadFile class for backend processing, CSS Grid with `repeat(auto-fit, minmax(300px, 1fr))` for responsive cards, and a custom useStickyState hook for localStorage persistence.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React Hook Form | 7.x | Form validation and file upload handling | Minimal re-renders, built-in validation, handles FileList objects |
| React Router | 7.x | Navigation and routing | Official React routing solution, data loading, programmatic navigation |
| FastAPI python-multipart | Latest | Multipart form data parsing | Required dependency for file uploads in FastAPI |
| CSS Grid | Native | Responsive card layouts | Built into browsers, no dependencies, auto-fit/minmax eliminates media queries |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Zod | 3.x | Schema validation for forms | Type-safe validation with React Hook Form integration |
| FastAPI StaticFiles | Built-in | Serving uploaded images | Mounting static directories for image access |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| React Hook Form | Formik | Formik has more re-renders, React Hook Form is more performant |
| CSS Grid | Material-UI Grid | MUI adds bundle size, CSS Grid is native and sufficient |
| localStorage | React Context only | Context doesn't persist between sessions |

**Installation:**
```bash
# Frontend
npm install react-hook-form react-router-dom

# Optional: Type-safe validation
npm install zod @hookform/resolvers

# Backend
pip install python-multipart
```

## Architecture Patterns

### Recommended Project Structure
```
frontend/src/
├── pages/
│   ├── TestCaseList.jsx       # Card grid view
│   ├── TestCaseCreate.jsx     # Dedicated creation page
│   ├── TestCaseDetail.jsx     # View/edit/delete
│   └── TestCaseEdit.jsx       # Optional: separate edit page
├── components/
│   ├── TestCaseCard.jsx       # Individual card component
│   ├── PromptConfig.jsx       # Sidebar/panel component
│   └── ImagePreview.jsx       # Reusable image preview
├── hooks/
│   ├── useStickyState.js      # localStorage persistence
│   └── useImagePreview.js     # Blob URL management with cleanup
└── api/
    └── testCases.js           # API client functions

backend/
├── routers/
│   ├── test_cases.py          # CRUD endpoints
│   └── config.py              # Config endpoints
├── services/
│   ├── test_case_service.py   # Business logic
│   └── image_service.py       # Image handling
└── storage/
    ├── test_cases/            # JSON files
    └── images/                # Uploaded images (mounted as static)
```

### Pattern 1: File Upload with Preview and Cleanup
**What:** Handle file uploads with preview before submission, proper memory cleanup
**When to use:** Any image upload scenario
**Example:**
```javascript
// Source: MDN Web Docs - URL.createObjectURL
// https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static
import { useState, useEffect } from 'react';

function useImagePreview(file) {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }

    // Create blob URL for preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    // Cleanup function to prevent memory leak
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  return preview;
}

// Usage in component
function TestCaseCreate() {
  const [selectedFile, setSelectedFile] = useState(null);
  const preview = useImagePreview(selectedFile);

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setSelectedFile(e.target.files[0])}
      />
      {preview && <img src={preview} alt="Preview" />}
    </div>
  );
}
```

### Pattern 2: Form Validation with File Type and Size
**What:** Client-side validation for file uploads using React Hook Form
**When to use:** All file upload forms requiring validation
**Example:**
```javascript
// Source: React Hook Form GitHub Discussions
// https://github.com/orgs/react-hook-form/discussions/1946
import { useForm } from 'react-hook-form';

function TestCaseForm() {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    const formData = new FormData();
    formData.append('festival_name', data.festival_name);
    formData.append('image', data.image[0]);
    formData.append('ground_truth', data.ground_truth);

    await fetch('/api/test-cases', {
      method: 'POST',
      body: formData
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        type="file"
        accept="image/*"
        {...register('image', {
          required: 'Image is required',
          validate: {
            fileSize: (files) =>
              files[0]?.size < 10000000 || 'Max file size is 10MB',
            fileType: (files) =>
              ['image/jpeg', 'image/png', 'image/webp'].includes(files[0]?.type)
              || 'Only JPEG, PNG, and WebP images are allowed'
          }
        })}
      />
      {errors.image && <p>{errors.image.message}</p>}

      <textarea
        {...register('ground_truth', { required: true })}
        placeholder="Enter artist names (one per line)"
        rows={10}
      />

      <button type="submit">Create Test Case</button>
    </form>
  );
}
```

### Pattern 3: FastAPI File Upload with Form Data
**What:** Backend endpoint handling multipart form data with files
**When to use:** All test case creation/update endpoints
**Example:**
```python
# Source: FastAPI Official Documentation
# https://fastapi.tiangolo.com/tutorial/request-forms-and-files/
from fastapi import FastAPI, File, Form, UploadFile
from typing import Annotated

app = FastAPI()

@app.post("/api/test-cases")
async def create_test_case(
    festival_name: Annotated[str, Form()],
    ground_truth: Annotated[str, Form()],
    image: UploadFile = File(...)
):
    # Validate file type (don't trust Content-Type alone)
    contents = await image.read()
    # Check magic bytes for actual file type

    # Save image with content-addressed filename
    image_hash = hash_bytes(contents)
    image_path = f"storage/images/{image_hash}.jpg"

    # Atomic write pattern from Phase 1
    with open(image_path + ".tmp", "wb") as f:
        f.write(contents)
    os.rename(image_path + ".tmp", image_path)

    # Create test case JSON
    test_case = {
        "id": generate_id(festival_name),
        "festival_name": festival_name,
        "image_hash": image_hash,
        "ground_truth": normalize_ground_truth(ground_truth)
    }

    # Save JSON atomically
    save_test_case(test_case)

    return test_case
```

### Pattern 4: Responsive Card Grid with CSS Grid
**What:** Auto-responsive card layout without media queries
**When to use:** Test case list view, any card-based listing
**Example:**
```css
/* Source: CSS-Tricks - Auto-Sizing Columns in CSS Grid
   https://css-tricks.com/auto-sizing-columns-css-grid-auto-fill-vs-auto-fit/ */

.test-case-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  padding: 1rem;
}

.test-case-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.test-case-card img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.test-case-card-content {
  padding: 1rem;
  flex: 1;
}
```

**Why auto-fit:** Collapses empty columns and stretches existing cards to fill available space, creating a fluid responsive layout. Use `auto-fill` if you want to maintain empty grid columns for alignment.

### Pattern 5: localStorage State Persistence
**What:** Persist configuration (prompt, model) between sessions
**When to use:** User preferences, configuration that should survive page refresh
**Example:**
```javascript
// Source: Josh Comeau - Persisting React State in localStorage
// https://www.joshwcomeau.com/react/persisting-react-state-in-localstorage/

function useStickyState(defaultValue, key) {
  const [value, setValue] = useState(() => {
    // Lazy initialization - only runs once
    const stickyValue = window.localStorage.getItem(key);
    return stickyValue !== null
      ? JSON.parse(stickyValue)
      : defaultValue;
  });

  useEffect(() => {
    // Sync to localStorage on every change
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

// Usage for prompt configuration
function PromptConfig() {
  const [systemPrompt, setSystemPrompt] = useStickyState(
    'You are a helpful assistant.',
    'system-prompt'
  );
  const [selectedModel, setSelectedModel] = useStickyState(
    'claude-3-5-sonnet-20241022',
    'claude-model'
  );

  return (
    <div>
      <textarea
        value={systemPrompt}
        onChange={(e) => setSystemPrompt(e.target.value)}
        rows={8}
      />
      <select
        value={selectedModel}
        onChange={(e) => setSelectedModel(e.target.value)}
      >
        <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
        <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</option>
        <option value="claude-opus-4-20250514">Claude Opus 4</option>
      </select>
    </div>
  );
}
```

### Pattern 6: Navigation After Form Success
**What:** Navigate to detail page after creating test case
**When to use:** Create/edit forms that should redirect after success
**Example:**
```javascript
// Source: React Router Official Documentation
// https://reactrouter.com/start/framework/navigating
import { useNavigate } from 'react-router-dom';

function TestCaseCreate() {
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm();

  const onSubmit = async (data) => {
    try {
      const response = await createTestCase(data);
      // Navigate to the newly created test case detail page
      navigate(`/test-cases/${response.id}`);
    } catch (error) {
      // Handle error, show message
      console.error('Failed to create test case:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* form fields */}
    </form>
  );
}
```

### Pattern 7: Ground Truth Normalization
**What:** Clean up user input for ground truth artist list
**When to use:** Processing ground truth from textarea or file import
**Example:**
```javascript
function normalizeGroundTruth(text) {
  return text
    .split('\n')                    // Split by newlines
    .map(line => line.trim())       // Trim whitespace
    .filter(line => line.length > 0) // Remove empty lines
    .map(line => line.toLowerCase()); // Normalize case for comparison
}

// Display as bulleted list
function GroundTruthDisplay({ artists }) {
  return (
    <ul>
      {artists.map((artist, index) => (
        <li key={index}>{artist}</li>
      ))}
    </ul>
  );
}
```

### Pattern 8: Serving Static Images
**What:** Serve uploaded images via FastAPI static files
**When to use:** Accessing images from frontend
**Example:**
```python
# Source: FastAPI Official Documentation
# https://fastapi.tiangolo.com/tutorial/static-files/
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

app = FastAPI()

# Mount images directory as static files
app.mount("/images", StaticFiles(directory="storage/images"), name="images")

# Images accessible at: http://localhost:8000/images/{image_hash}.jpg
```

### Anti-Patterns to Avoid
- **Don't use controlled components for file inputs**: File inputs cannot be controlled (security restriction). Use uncontrolled with `register()`.
- **Don't trust MIME type alone**: Always validate actual file content with magic bytes inspection, not just the Content-Type header.
- **Don't forget URL.revokeObjectURL**: Memory leaks accumulate quickly with multiple image previews.
- **Don't use auto-fill for cards**: Use `auto-fit` so cards expand to fill space rather than leaving empty columns.
- **Don't put navigation state in URL params**: Use React Router's `state` option in navigate() for temporary messages.
- **Don't update localStorage on every keystroke**: For rapidly changing values (like typing), debounce localStorage writes.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation | Custom validation functions for every field | React Hook Form with validate option | Handles FileList, arrays, nested validation, error messages automatically |
| File type detection | Checking file extension or Content-Type header | Magic byte inspection (server-side) | Extensions and MIME types are easily spoofed, magic bytes are reliable |
| Responsive grid with breakpoints | Multiple media queries for different screen sizes | CSS Grid `repeat(auto-fit, minmax(300px, 1fr))` | Automatically responsive without media queries, maintains proper spacing |
| localStorage sync | Manual localStorage.setItem in multiple places | Custom useStickyState hook | Centralized logic, handles JSON serialization, lazy initialization |
| Image thumbnails | Canvas API to resize images client-side | CSS object-fit: cover with fixed dimensions | Browser-native, performant, works with any image size |
| State after navigation | Trying to pass data via URL params | React Router location state | Cleaner URLs, doesn't persist in history, typed |

**Key insight:** File upload security is deceptively complex. The client-side checks (file size, MIME type) are for UX only. Server-side validation must inspect actual file content (magic bytes) because all client-provided data (filename, Content-Type, extension) can be spoofed. OWASP recommends defense-in-depth: multiple validation layers.

## Common Pitfalls

### Pitfall 1: Memory Leaks from Blob URLs
**What goes wrong:** Creating blob URLs with `URL.createObjectURL()` without calling `URL.revokeObjectURL()` causes memory to accumulate, eventually crashing the browser with large files or many previews.
**Why it happens:** The blob URL keeps the file in memory even after the component unmounts or the file is deselected.
**How to avoid:** Always use a `useEffect` cleanup function to revoke blob URLs when the component unmounts or the file changes.
**Warning signs:** Browser memory usage grows continuously, especially when selecting multiple files or navigating between pages.

### Pitfall 2: Trusting Client-Side File Validation
**What goes wrong:** Relying only on `accept` attribute, file extension, or Content-Type header allows malicious files to be uploaded.
**Why it happens:** All client-side data is user-controlled and easily manipulated. Attackers can rename executables to `.jpg`, modify Content-Type headers, or use polyglot files.
**How to avoid:** Implement server-side validation that inspects file magic bytes (first few bytes that identify file type). Use libraries like `python-magic` or check magic bytes manually.
**Warning signs:** Security audit flags file upload, files with wrong extensions work when they shouldn't, executable files getting uploaded.

### Pitfall 3: Using Controlled Components for File Inputs
**What goes wrong:** Trying to use `value={fileState}` on file inputs causes React warnings and breaks functionality.
**Why it happens:** File inputs are uncontrolled by web security design - you cannot programmatically set file input values.
**How to avoid:** Use uncontrolled pattern with React Hook Form's `register()` or `useRef()`. Access files via `event.target.files` or form `ref.current`.
**Warning signs:** React warning about "A component is changing an uncontrolled input", file picker doesn't work after first selection.

### Pitfall 4: Auto-fill vs Auto-fit Confusion
**What goes wrong:** Using `auto-fill` in CSS Grid creates empty grid columns that look like layout bugs.
**Why it happens:** `auto-fill` maintains the grid structure even when there aren't enough items, while `auto-fit` collapses empty columns.
**How to avoid:** Use `auto-fit` for card layouts where you want items to expand to fill space: `repeat(auto-fit, minmax(300px, 1fr))`.
**Warning signs:** Large gaps on the right side of the grid when there are fewer items, cards don't expand to fill available space.

### Pitfall 5: Textarea Value Synchronization
**What goes wrong:** Using `defaultValue` on textarea with controlled state causes the textarea to not update when state changes.
**Why it happens:** `defaultValue` only sets the initial value, doesn't react to state changes. Mixing controlled and uncontrolled patterns.
**How to avoid:** Use `value` prop for controlled textarea (syncs with state), or use `defaultValue` for uncontrolled with `onChange` manually managing state.
**Warning signs:** Textarea doesn't update when you programmatically change state, importing from file doesn't populate textarea.

### Pitfall 6: Not Normalizing Ground Truth Input
**What goes wrong:** Artist names with inconsistent whitespace, casing, or empty lines cause comparison failures later.
**Why it happens:** Users paste from different sources (PDFs, websites) with varying formatting.
**How to avoid:** Normalize on input: trim whitespace, remove empty lines, consider case normalization. Store normalized version, display as entered for UX.
**Warning signs:** Tests fail when artist names look identical visually, comparison logic has many special cases.

### Pitfall 7: localStorage Synchronous Performance
**What goes wrong:** Updating localStorage on every keystroke in a textarea causes UI lag.
**Why it happens:** localStorage is synchronous and blocks the main thread. Large values take time to serialize to JSON.
**How to avoid:** Debounce localStorage writes for rapidly-changing values. Update state immediately, persist to localStorage after 500ms of no changes.
**Warning signs:** Typing feels sluggish, React DevTools shows slow renders, CPU spikes when typing.

### Pitfall 8: Form Submission During Navigation
**What goes wrong:** User clicks submit, then immediately clicks back/close before request completes. Request continues in background, creating partial data.
**Why it happens:** No loading state or submit button doesn't disable during submission.
**How to avoid:** Disable submit button and show loading state during async submission. Consider adding "unsaved changes" warning for navigation.
**Warning signs:** Duplicate entries, partial data in storage, users report "created twice".

### Pitfall 9: Static File Mounting Path Confusion
**What goes wrong:** Images uploaded to `/storage/images/` aren't accessible at expected URLs.
**Why it happens:** FastAPI's `mount()` path and directory parameter are independent. Mounting `/static` doesn't automatically map to `/static/` on disk.
**How to avoid:** Understand that mount path is URL prefix, directory is filesystem location. Store full image URL or compute it consistently: `{mount_path}/{filename}`.
**Warning signs:** 404 errors for images, images work locally but not in production, path construction logic scattered across codebase.

### Pitfall 10: Image Display Without Dimensions
**What goes wrong:** Card layouts shift and jump as images load because height is unknown initially.
**Why it happens:** Browser doesn't know image dimensions until loaded, causing layout reflow.
**How to avoid:** Set explicit `height` on image elements in cards, use `object-fit: cover` to maintain aspect ratio. Alternatively, use aspect-ratio CSS property.
**Warning signs:** Cards jump around during loading, Cumulative Layout Shift (CLS) warnings in Chrome DevTools.

## Code Examples

Verified patterns from official sources:

### Multipart Form Submission
```javascript
// Source: React Hook Form + FastAPI pattern
async function submitTestCase(data) {
  const formData = new FormData();
  formData.append('festival_name', data.festival_name);
  formData.append('image', data.image[0]); // FileList -> File
  formData.append('ground_truth', data.ground_truth);

  const response = await fetch('/api/test-cases', {
    method: 'POST',
    body: formData
    // Don't set Content-Type header - browser sets it with boundary
  });

  if (!response.ok) {
    throw new Error('Failed to create test case');
  }

  return response.json();
}
```

### Ground Truth File Import
```javascript
// Allow importing ground truth from .txt file
function GroundTruthInput({ value, onChange }) {
  const handleFileImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const normalized = normalizeGroundTruth(text);
      onChange(normalized.join('\n'));
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="One artist per line"
        rows={10}
      />
      <input
        type="file"
        accept=".txt"
        onChange={handleFileImport}
      />
    </div>
  );
}
```

### React Router Navigation with State
```javascript
// Navigate to detail page after creation
const navigate = useNavigate();

const onSubmit = async (data) => {
  const testCase = await createTestCase(data);
  navigate(`/test-cases/${testCase.id}`, {
    state: { message: 'Test case created successfully!' }
  });
};

// In detail page, read the message
function TestCaseDetail() {
  const location = useLocation();
  const message = location.state?.message;

  return (
    <div>
      {message && <div className="success-message">{message}</div>}
      {/* test case details */}
    </div>
  );
}
```

### FastAPI Server-Side File Type Validation
```python
# Source: OWASP File Upload Cheat Sheet recommendations
# https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html
import imghdr

@app.post("/api/test-cases")
async def create_test_case(
    festival_name: Annotated[str, Form()],
    ground_truth: Annotated[str, Form()],
    image: UploadFile = File(...)
):
    # Read file contents
    contents = await image.read()

    # Validate actual file type by magic bytes (don't trust Content-Type)
    file_type = imghdr.what(None, h=contents)
    if file_type not in ['jpeg', 'png', 'webp']:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid image format. Got {file_type}, expected jpeg/png/webp"
        )

    # Validate file size
    if len(contents) > 10_000_000:  # 10MB
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    # Process valid image...
    image_hash = hashlib.sha256(contents).hexdigest()[:16]
    image_path = f"storage/images/{image_hash}.{file_type}"

    # Atomic write (from Phase 1 pattern)
    temp_path = image_path + ".tmp"
    with open(temp_path, "wb") as f:
        f.write(contents)
    os.rename(temp_path, image_path)

    return {"image_path": f"/images/{image_hash}.{file_type}"}
```

### Delete with Confirmation
```javascript
function TestCaseDetail({ testCase }) {
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    await fetch(`/api/test-cases/${testCase.id}`, {
      method: 'DELETE'
    });
    navigate('/test-cases', {
      state: { message: 'Test case deleted' }
    });
  };

  return (
    <div>
      {/* test case details */}
      <button onClick={() => setShowConfirm(true)}>Delete</button>

      {showConfirm && (
        <div className="confirm-dialog">
          <p>Are you sure you want to delete "{testCase.festival_name}"?</p>
          <button onClick={handleDelete}>Confirm Delete</button>
          <button onClick={() => setShowConfirm(false)}>Cancel</button>
        </div>
      )}
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Formik for forms | React Hook Form | ~2020 | Better performance (fewer re-renders), simpler API |
| Media queries for responsive grids | CSS Grid auto-fit/minmax | 2019-2020 | Eliminates media queries for simple responsive layouts |
| Class components with lifecycle methods | Hooks (useState, useEffect) | 2019 | Simpler code, better reusability, composition |
| Checking file extensions | Magic byte validation | Always critical | Extensions trivially spoofed, magic bytes reliable |
| React Router v5 (useHistory) | React Router v6/v7 (useNavigate) | 2021 | Simpler API, better TypeScript support |
| Redux for all state | useState + localStorage | 2020+ | Simpler for config/preferences, Redux overkill for small state |

**Deprecated/outdated:**
- **componentWillMount for data loading**: Use useEffect with empty dependency array
- **React Router `<Redirect>` component**: Use `navigate()` function from useNavigate
- **defaultProps**: Use default parameters in function components
- **Checking MIME type for security**: Always validate file contents server-side

## Open Questions

Things that couldn't be fully resolved:

1. **Image compression strategy**
   - What we know: User uploads may be very large (tens of MB), could slow down UI
   - What's unclear: Should compression happen client-side (before upload) or server-side (after upload)? What quality/size tradeoffs?
   - Recommendation: Start without compression. If performance issues arise, add server-side compression with Pillow/PIL to maintain quality control. Client-side compression adds complexity and bundle size.

2. **Edit vs separate create/edit pages**
   - What we know: Context specifies "dedicated page for creating", doesn't specify edit
   - What's unclear: Should editing happen on detail page (in-place) or separate edit page?
   - Recommendation: Start with editing on detail page using the same form components. If edit flow becomes complex, extract to separate page. Follow REST convention: GET detail loads data, PUT updates.

3. **Real-time validation vs submit validation**
   - What we know: React Hook Form supports both `mode: 'onChange'` (real-time) and `mode: 'onSubmit'` (validate on submit)
   - What's unclear: What provides better UX for this use case?
   - Recommendation: Use `mode: 'onBlur'` - validates when user leaves field. Good balance between immediate feedback and not overwhelming user while typing.

4. **Model list freshness**
   - What we know: Claude model IDs and names change over time
   - What's unclear: Should model list be hardcoded, fetched from API, or configured?
   - Recommendation: Start with hardcoded list of current models. If model updates are frequent, add backend endpoint that fetches available models from Anthropic API.

## Sources

### Primary (HIGH confidence)
- FastAPI Official Docs - Request Files: https://fastapi.tiangolo.com/tutorial/request-files/
- FastAPI Official Docs - Request Forms and Files: https://fastapi.tiangolo.com/tutorial/request-forms-and-files/
- FastAPI Official Docs - Static Files: https://fastapi.tiangolo.com/tutorial/static-files/
- React Router Official Docs - Navigating: https://reactrouter.com/start/framework/navigating
- MDN Web Docs - URL.createObjectURL(): https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static
- Josh Comeau - Persisting React State in localStorage: https://www.joshwcomeau.com/react/persisting-react-state-in-localstorage/

### Secondary (MEDIUM confidence)
- OWASP File Upload Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html (verified security best practices)
- CSS-Tricks - Auto-Sizing Columns in CSS Grid: https://css-tricks.com/auto-sizing-columns-css-grid-auto-fill-vs-auto-fit/ (verified with MDN)
- React Hook Form GitHub Discussions - File validation: https://github.com/orgs/react-hook-form/discussions/1946 (community patterns, verified with docs)

### Tertiary (LOW confidence - flagged for validation)
- WebSearch results for "React file upload best practices 2026" - general patterns, needs verification in implementation
- WebSearch results for "image thumbnail generation best practices 2026" - mostly YouTube-specific, apply general principles

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - FastAPI and React Router docs are authoritative, React Hook Form widely adopted
- Architecture: HIGH - Patterns verified against official documentation and OWASP guidelines
- Pitfalls: HIGH - Security issues verified with OWASP, React pitfalls from official docs and MDN

**Research date:** 2026-01-23
**Valid until:** 2026-02-23 (30 days - stable ecosystem, FastAPI and React Router change slowly)

**Note:** User decisions from CONTEXT.md constrain implementation:
- Card-based layout (not table) ✓
- Dedicated creation page (not modal) ✓
- Simple file picker (not drag-drop) ✓
- Single active prompt (not library) ✓
- Multi-line textarea for ground truth ✓
- Config in sidebar/panel ✓

Research focused on implementing these decisions well, not exploring alternatives.
