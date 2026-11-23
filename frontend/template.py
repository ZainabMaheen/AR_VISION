"""
template.py
-----------
Scaffolds the AR Stone Vision frontend folder structure.

Usage (from the frontend root, next to package.json):
    python template.py

Safe to re-run: existing files are never overwritten.
"""

from pathlib import Path

# Always build relative to this file's location (the frontend root)
ROOT = Path(__file__).resolve().parent

# Empty folders: a .gitkeep is added so git tracks them
EMPTY_DIRS = [
    "public/textures/marble",
    "public/textures/granite",
    "public/textures/tiles",
    "public/images",
    "public/models",
    "src/assets/images",
    "src/assets/icons",
    "src/assets/fonts",
]

# Files to create (parent folders are created automatically)
FILES = [
    # ---------- public ----------
    "public/favicon.svg",

    # ---------- src root ----------
    "src/main.tsx",
    "src/App.tsx",
    "src/index.css",
    "src/vite-env.d.ts",

    # ---------- app ----------
    "src/app/router.tsx",
    "src/app/providers.tsx",
    "src/app/layouts/DashboardLayout.tsx",
    "src/app/layouts/ARLayout.tsx",
    "src/app/layouts/AuthLayout.tsx",

    # ---------- pages ----------
    "src/pages/DashboardPage.tsx",
    "src/pages/ARRoomPreviewPage.tsx",
    "src/pages/MaterialCataloguePage.tsx",
    "src/pages/MaterialDetailPage.tsx",
    "src/pages/ComparePage.tsx",
    "src/pages/FavouritesPage.tsx",
    "src/pages/ProjectsPage.tsx",
    "src/pages/ProjectDetailPage.tsx",
    "src/pages/ScanHistoryPage.tsx",
    "src/pages/SettingsPage.tsx",
    "src/pages/CartPage.tsx",
    "src/pages/CheckoutPage.tsx",
    "src/pages/OrderSuccessPage.tsx",
    "src/pages/LoginPage.tsx",
    "src/pages/NotFoundPage.tsx",

    # ---------- features/dashboard ----------
    "src/features/dashboard/components/HeroSection.tsx",
    "src/features/dashboard/components/SavedCounter.tsx",
    "src/features/dashboard/components/ARPromoBanner.tsx",

    # ---------- features/ar ----------
    "src/features/ar/components/CameraCapture.tsx",
    "src/features/ar/components/PhotoUpload.tsx",
    "src/features/ar/components/SurfaceSelector.tsx",
    "src/features/ar/components/StoneOverlay.tsx",
    "src/features/ar/components/MaterialPicker.tsx",
    "src/features/ar/components/ARToolbar.tsx",
    "src/features/ar/components/BeforeAfterSlider.tsx",
    "src/features/ar/components/SaveVisualisationModal.tsx",
    "src/features/ar/hooks/useCamera.ts",
    "src/features/ar/hooks/useSurfaceMask.ts",
    "src/features/ar/hooks/useTextureRender.ts",
    "src/features/ar/utils/canvasRenderer.ts",
    "src/features/ar/utils/perspectiveTransform.ts",
    "src/features/ar/utils/imageProcessing.ts",
    "src/features/ar/store.ts",
    "src/features/ar/types.ts",

    # ---------- features/catalogue ----------
    "src/features/catalogue/components/StoneCard.tsx",
    "src/features/catalogue/components/StoneGrid.tsx",
    "src/features/catalogue/components/FilterSidebar.tsx",
    "src/features/catalogue/components/SortDropdown.tsx",
    "src/features/catalogue/components/StoneSpecs.tsx",
    "src/features/catalogue/hooks/useStones.ts",
    "src/features/catalogue/api.ts",
    "src/features/catalogue/types.ts",

    # ---------- features/compare ----------
    "src/features/compare/components/CompareTable.tsx",
    "src/features/compare/components/CompareButton.tsx",
    "src/features/compare/store.ts",
    "src/features/compare/types.ts",

    # ---------- features/favourites ----------
    "src/features/favourites/components/FavouriteButton.tsx",
    "src/features/favourites/components/FavouritesList.tsx",
    "src/features/favourites/store.ts",
    "src/features/favourites/types.ts",

    # ---------- features/projects ----------
    "src/features/projects/components/ProjectCard.tsx",
    "src/features/projects/components/ProjectForm.tsx",
    "src/features/projects/components/ProjectVisualisations.tsx",
    "src/features/projects/hooks/useProjects.ts",
    "src/features/projects/api.ts",
    "src/features/projects/types.ts",

    # ---------- features/scans ----------
    "src/features/scans/components/ScanHistoryList.tsx",
    "src/features/scans/components/ScanThumbnail.tsx",
    "src/features/scans/api.ts",
    "src/features/scans/types.ts",

    # ---------- features/cart ----------
    "src/features/cart/components/CartItem.tsx",
    "src/features/cart/components/CartSummary.tsx",
    "src/features/cart/store.ts",
    "src/features/cart/types.ts",

    # ---------- features/checkout ----------
    "src/features/checkout/components/AreaCalculator.tsx",
    "src/features/checkout/components/AddressForm.tsx",
    "src/features/checkout/components/PaymentSection.tsx",
    "src/features/checkout/api.ts",
    "src/features/checkout/types.ts",

    # ---------- features/auth ----------
    "src/features/auth/components/LoginForm.tsx",
    "src/features/auth/components/ProtectedRoute.tsx",
    "src/features/auth/hooks/useAuth.ts",
    "src/features/auth/store.ts",
    "src/features/auth/api.ts",

    # ---------- features/settings ----------
    "src/features/settings/components/ProfileForm.tsx",
    "src/features/settings/components/WorkspaceSettings.tsx",
    "src/features/settings/components/PreferencesForm.tsx",

    # ---------- components/layout ----------
    "src/components/layout/Sidebar.tsx",
    "src/components/layout/SidebarNavItem.tsx",
    "src/components/layout/WorkspaceSwitcher.tsx",
    "src/components/layout/HelpCard.tsx",
    "src/components/layout/UserMenu.tsx",
    "src/components/layout/Topbar.tsx",
    "src/components/layout/GlobalSearch.tsx",
    "src/components/layout/MobileNav.tsx",

    # ---------- components/ui ----------
    "src/components/ui/Button.tsx",
    "src/components/ui/Input.tsx",
    "src/components/ui/Modal.tsx",
    "src/components/ui/Badge.tsx",
    "src/components/ui/Spinner.tsx",
    "src/components/ui/Tabs.tsx",
    "src/components/ui/Toast.tsx",
    "src/components/ui/EmptyState.tsx",

    # ---------- components/common ----------
    "src/components/common/Loader.tsx",
    "src/components/common/ErrorBoundary.tsx",
    "src/components/common/PageHeader.tsx",

    # ---------- global hooks ----------
    "src/hooks/useDebounce.ts",
    "src/hooks/useMediaQuery.ts",
    "src/hooks/useLocalStorage.ts",

    # ---------- services ----------
    "src/services/apiClient.ts",
    "src/services/endpoints.ts",

    # ---------- lib ----------
    "src/lib/nav.ts",
    "src/lib/cn.ts",
    "src/lib/constants.ts",
    "src/lib/formatters.ts",
    "src/lib/utils.ts",

    # ---------- shared types ----------
    "src/types/stone.ts",
    "src/types/user.ts",
    "src/types/project.ts",
    "src/types/index.ts",

    # ---------- root config files ----------
    ".env",
    ".env.example",
    ".gitignore",
    "index.html",
    "package.json",
    "tsconfig.json",
    "tsconfig.app.json",
    "tsconfig.node.json",
    "vite.config.ts",
    "eslint.config.js",
]


def create_empty_dirs() -> tuple[int, int]:
    created = skipped = 0
    for d in EMPTY_DIRS:
        folder = ROOT / d
        folder.mkdir(parents=True, exist_ok=True)
        keep = folder / ".gitkeep"
        if keep.exists():
            skipped += 1
        else:
            keep.touch()
            created += 1
    return created, skipped


def create_files() -> tuple[int, int]:
    created = skipped = 0
    for f in FILES:
        path = ROOT / f
        path.parent.mkdir(parents=True, exist_ok=True)
        if path.exists():
            # Never overwrite files Vite (or you) already created
            skipped += 1
            print(f"  skipped (exists): {f}")
        else:
            path.touch()
            created += 1
            print(f"  created:          {f}")
    return created, skipped


def main() -> None:
    print(f"Scaffolding frontend structure in: {ROOT}\n")

    d_created, d_skipped = create_empty_dirs()
    f_created, f_skipped = create_files()

    print("\n----------------------------------------")
    print(f"Files created:   {f_created}")
    print(f"Files skipped:   {f_skipped} (already existed, left untouched)")
    print(f"Empty folders:   {d_created} new, {d_skipped} already set up")
    print("Done.")


if __name__ == "__main__":
    main()