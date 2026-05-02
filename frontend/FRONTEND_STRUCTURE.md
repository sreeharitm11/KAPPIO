# Frontend Structure Protocol

This frontend now follows a feature-first structure instead of a single shared `components` bucket.

## Rules

1. Put app bootstrap code in `src/app/`
2. Put domain or role-based code in `src/features/`
3. Put reusable presentational building blocks in `src/shared/`
4. Keep styles in `src/styles/`
5. Do not place page-level code directly in `shared/`
6. Do not mix admin, customer, and delivery screens in one folder

## Folder Layout

```text
frontend/
  src/
    app/
      App.tsx
      router/
        index.tsx
    features/
      admin/
        layouts/
        pages/
      customer/
        layouts/
        pages/
      delivery/
        layouts/
        pages/
      home/
        pages/
      orders/
        store/
    shared/
      components/
      ui/
    styles/
```

## Placement Protocol

Use `src/app/` for:

- router setup
- providers
- app shell bootstrapping

Use `src/features/<domain>/pages/` for:

- route screens
- page-specific orchestration
- screen-level state

Use `src/features/<domain>/layouts/` for:

- role layouts
- sidebars
- headers
- navigation wrappers

Use `src/features/<domain>/store/` for:

- local domain store logic
- client-side workflow state

Use `src/shared/ui/` for:

- generic buttons
- inputs
- table
- dialog
- reusable primitive UI

Use `src/shared/components/` for:

- reusable higher-level presentational pieces
- app-wide helper components that are not feature-owned

## Naming Protocol

- Route components: `SomethingPage.tsx`
- Layouts: `SomethingLayout.tsx`
- Stores: `somethingStore.ts`
- Reusable UI primitives: lowercase shadcn-style filenames are acceptable

## Next Recommended Step

After this folder cleanup, the next proper step is to introduce:

1. `features/*/api/` for API clients
2. `features/*/types/` for DTO/view models
3. `shared/lib/` for utilities
4. `shared/constants/` for app-wide constants

That will let the React app integrate cleanly with the NestJS backend without collapsing back into page-local mocks.
