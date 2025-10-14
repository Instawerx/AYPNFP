# 🤝 Contributing to ADOPT A YOUNG PARENT

Thank you for your interest in contributing to our nonprofit platform!

---

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please be respectful and professional in all interactions.

---

## Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/adopt-a-young-parent.git
   cd adopt-a-young-parent
   ```
3. **Install dependencies**
   ```bash
   npm install
   cd apps/web && npm install
   cd ../../firebase/functions && npm install
   ```
4. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

---

## Development Workflow

### 1. Make Your Changes

- Follow existing code style
- Write clear, descriptive commit messages
- Add tests for new features
- Update documentation as needed

### 2. Test Your Changes

```bash
# Run linter
npm run lint

# Run tests
npm test

# Test locally
npm run dev
```

### 3. Commit Your Changes

We use conventional commits:

```bash
git commit -m "feat: add donor export feature"
git commit -m "fix: resolve receipt generation bug"
git commit -m "docs: update setup guide"
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code restructuring
- `test:` Adding tests
- `chore:` Maintenance

### 4. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

---

## Code Style

### TypeScript

- Use TypeScript strict mode
- Avoid `any` types when possible
- Document complex functions with JSDoc

```typescript
/**
 * Generate IRS-compliant receipt
 * @param donationId - Donation document ID
 * @returns Receipt document
 */
async function generateReceipt(donationId: string): Promise<Receipt> {
  // ...
}
```

### React/Next.js

- Use functional components
- Prefer hooks over class components
- Use `"use client"` directive when needed
- Keep components focused and small

```tsx
"use client";

import { useState } from "react";

export default function MyComponent() {
  const [state, setState] = useState(false);
  
  return (
    <div className="container">
      {/* Component content */}
    </div>
  );
}
```

### Tailwind CSS

- Use utility classes
- Follow mobile-first approach
- Use custom classes sparingly

```tsx
<div className="flex flex-col gap-4 md:flex-row md:gap-6">
  <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
    Click Me
  </button>
</div>
```

---

## Security Guidelines

### Never Commit

- ❌ API keys or secrets
- ❌ Service account keys
- ❌ `.env` files
- ❌ Personal data
- ❌ Passwords

### Always

- ✅ Use environment variables
- ✅ Validate user input
- ✅ Sanitize data before storage
- ✅ Follow principle of least privilege
- ✅ Test security rules

---

## Testing

### Unit Tests

```typescript
import { describe, it, expect } from "vitest";
import { formatCurrency } from "@/lib/utils";

describe("formatCurrency", () => {
  it("formats USD correctly", () => {
    expect(formatCurrency(100, "USD")).toBe("$100.00");
  });
});
```

### E2E Tests

```typescript
import { test, expect } from "@playwright/test";

test("donation flow completes successfully", async ({ page }) => {
  await page.goto("/donate");
  // ... test steps
  await expect(page.locator(".success-message")).toBeVisible();
});
```

---

## Accessibility

All contributions must meet WCAG 2.2 AA standards:

- ✅ Semantic HTML
- ✅ ARIA labels where needed
- ✅ Keyboard navigation
- ✅ Focus indicators
- ✅ Color contrast (4.5:1 minimum)
- ✅ Alt text for images
- ✅ Screen reader testing

```tsx
<button
  aria-label="Close dialog"
  className="focus-visible-ring"
  onClick={handleClose}
>
  <X className="h-5 w-5" />
</button>
```

---

## Documentation

Update documentation when you:

- Add new features
- Change APIs
- Modify configuration
- Fix bugs (if not obvious)

---

## Pull Request Process

1. **Ensure all checks pass**
   - Linting
   - Tests
   - Build

2. **Update documentation**
   - README if needed
   - Code comments
   - CHANGELOG

3. **Request review**
   - Tag relevant reviewers
   - Respond to feedback
   - Make requested changes

4. **Merge**
   - Squash commits if needed
   - Delete branch after merge

---

## Project Structure

```
adopt-a-young-parent/
├── apps/web/              # Next.js frontend
│   ├── app/              # App router pages
│   ├── components/       # React components
│   └── lib/              # Utilities
├── firebase/
│   ├── functions/        # Cloud Functions
│   ├── firestore.rules   # Security rules
│   └── storage.rules     # Storage rules
└── infra/                # Infrastructure
```

---

## Common Tasks

### Add a new portal page

1. Create page in `apps/web/app/portal/[role]/page.tsx`
2. Add route protection
3. Update navigation
4. Add tests

### Add a new Cloud Function

1. Create function in `firebase/functions/src/`
2. Export from `index.ts`
3. Add tests
4. Update documentation

### Update Firestore Rules

1. Edit `firebase/firestore.rules`
2. Test with emulator
3. Deploy to staging first
4. Deploy to production

---

## Questions?

- **Documentation:** Check existing docs first
- **Issues:** Search existing issues
- **Discussion:** Open a GitHub Discussion
- **Email:** dev@adoptayoungparent.org

---

## Recognition

Contributors will be recognized in:
- README.md
- Release notes
- Annual report (if significant contribution)

Thank you for helping us support young families! 💙
