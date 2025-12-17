export function electronNavigate(path: string) {
  if (typeof window === "undefined") return;

  // normalize
  const clean = path.replace(/^\/+/, "").replace(/\/?$/, "/");

  // IMPORTANT: relative navigation
  // In Next.js static export, pages are folders with index.html.
  // Navigating to './auth/' works if we are at root './'.
  // But if we are at './dashboard/settings/', './auth/' might be wrong (it would be ./dashboard/settings/auth/).
  // So we need to know the depth or use absolute path relative to root?
  // Wait, the advice says: window.location.href = `./${clean}`;
  // If we are at file:///.../out/index.html, ./auth/ -> file:///.../out/auth/index.html.
  // If we are at file:///.../out/dashboard/index.html, ./auth/ -> file:///.../out/dashboard/auth/index.html (WRONG).

  // Actually, for Electron with 'file://' protocol and Next.js exports:
  // We usually want to go back to the root 'out' folder.
  // If we use Next.js <Link>, it handles this.
  // But for imperative navigation, we need to be careful.

  // If we assume the app is a Single Page App (SPA) behavior but served as static files:
  // Next.js 'export' usually creates a directory structure.

  // However, the ChatGPT advice "Your app is still performing an absolute navigation somewhere AFTER the app has loaded"
  // implies that `router.replace` does something internally that Electron hates (maybe history API manipulation with absolute paths).

  // If I use `window.location.href`, I am doing a full page reload.
  // To make it relative to the ROOT of the app, I should probably calculate the relative path from current location to root.

  // Or, since we are in Electron, maybe we can just point to the right file?
  // But we don't know the absolute file path easily in the renderer without IPC.

  // Let's look at `next.config.ts`. It has `assetPrefix: './'`.
  // And `trailingSlash: true`.

  // If I am at `/dashboard/`, `window.location.href` is `.../out/dashboard/index.html`.
  // I want to go to `.../out/auth/index.html`.
  // That is `../auth/`.

  // If I am at `/`, `window.location.href` is `.../out/index.html`.
  // I want to go to `.../out/auth/index.html`.
  // That is `./auth/`.

  // So `electronNavigate` needs to be smart enough or we need to pass the right relative path.
  // OR, we can try to use the <base> tag? No, Next.js doesn't use it by default.

  // A robust way to navigate to root-relative paths in static export:
  // 1. Get current path depth.
  // 2. Go up that many levels.
  // 3. Go down to target.

  // Example:
  // Current: /dashboard/settings/
  // Target: /auth/
  // Path: ../../auth/

  const currentPath = window.location.pathname; // e.g. /path/to/out/dashboard/index.html

  // In Electron file protocol:
  // pathname might be /Users/user/.../out/dashboard/index.html

  // We can find where 'out' is? No, that's brittle.

  // Let's look at the user's provided snippet again:
  // export function electronNavigate(path: string) {
  //   if (typeof window === "undefined") return;
  //   const clean = path.replace(/^\/+/, "").replace(/\/?$/, "/");
  //   window.location.href = `./${clean}`;
  // }

  // This snippet assumes we are always at root? Or maybe it assumes we always want to go deeper?
  // If I am at dashboard and I call `electronNavigate('auth')`, it goes to `./auth/`.
  // From dashboard/index.html, `./auth/` is `dashboard/auth/` which doesn't exist.

  // I suspect the user (or ChatGPT) might be oversimplifying or assuming a flat structure.
  // BUT, if the app starts at `index.html` (root) and `router` handles the rest via history API (client-side routing),
  // then we are technically always at `index.html` IF we use HashRouter.
  // But Next.js App Router uses History API.

  // If we reload the page at `/dashboard`, in a real server we get `/dashboard` HTML.
  // In Electron static export, we are literally at the file `.../out/dashboard/index.html`.

  // So yes, `window.location.href` changes the file.

  // To fix this properly:
  // We need to jump to the root `index.html` for everything?
  // No, that would lose the route.

  // If we want to go to `/auth/`, we want `.../out/auth/index.html`.

  // Let's implement a smarter `electronNavigate` that calculates the relative path from the current file to the target.

  // If we are effectively in a "browser" environment (even file://), `window.location` works.

  // Let's try to parse `window.location.href` to find the root.
  // Actually, we can use the `URL` object.

  // But `file://` URLs are tricky.

  // Heuristic:
  // If we are in Electron, `window.location.protocol` is `file:`.
  // We want to navigate to another `file:` URL.

  // Let's try the user's suggestion first, but with a warning or fallback?
  // "You must STOP using Next.js router for auth redirects in production Electron."
  // "Use window.location.href = "./auth/""

  // Wait, if I am at `/dashboard/`, `./auth/` is wrong.
  // Maybe the user implies that the redirect happens *before* we are deep in the tree?
  // "Your app is still performing an absolute navigation somewhere AFTER the app has loaded"
  // This usually refers to the initial route guard in `Providers`.
  // When the app launches, it loads `index.html` (root).
  // Then `Providers` checks auth.
  // If not auth, it redirects to `/auth`.
  // From root `index.html`, `./auth/` IS correct (`auth/index.html`).

  // If I reload while at `/dashboard/`, I am at `dashboard/index.html`.
  // If I logout, I want to go to `/auth/`.
  // From `dashboard/index.html`, I need `../auth/`.

  // Let's implement a helper that handles this "go to root then path" logic.

  const isFileProtocol = window.location.protocol === "file:";

  // Clean target path
  const targetPath = path.replace(/^\/+/, "").replace(/\/?$/, "/"); // e.g. "auth/"

  if (isFileProtocol) {
    // We need to find the relative path from current location to the target.
    // But we don't easily know "where" we are relative to root "out" folder just from pathname
    // because the user's file system path is arbitrary.
    // However, we know Next.js structure!

    // If pathname ends in .html (e.g. index.html), we can count segments?
    // .../out/index.html -> depth 0
    // .../out/dashboard/index.html -> depth 1
    // .../out/dashboard/settings/index.html -> depth 2

    // So we can count how many directories we are deep.
    // BUT, we need to know the 'base'.
    // We can look for 'index.html'.

    const parts = window.location.pathname.split("/");
    // Remove empty parts
    const segments = parts.filter((p) => p.length > 0);

    // If the last part is 'index.html', ignore it.
    if (segments[segments.length - 1] === "index.html") {
      segments.pop();
    }

    // Now, how do we know which segment is the "root" of our app?
    // We don't.

    // ALTERNATIVE:
    // Just use `window.location.href` with an absolute path?
    // No, we don't know the absolute path of the app root.

    // What if we just search for the 'out' directory in the path?
    // Risky if user has 'out' in their username.

    // Let's assume the user's advice `window.location.href = './auth/'` was mainly for the initial load from root.

    // But for `dashboard/page.tsx` logout, it needs to work too.

    // Let's try this:
    // Construct a URL object relative to the current location.
    // This doesn't help with file system.

    // Let's stick to the simplest interpretation of the user's request for now,
    // but maybe add `../` if we detect we are not at root?

    // Actually, if we use `window.location.assign` with a path starting with `/`, it goes to file system root (e.g. C:/ or /). That's bad.

    // Let's look at `next/navigation` usage.
    // `router.push('/auth/')`

    // If we simply use `window.location.href = '.../out/auth/index.html'`, it works.

    // How about this:
    // We can iterate up the directory tree until we find 'auth/index.html'? No, can't check file existence in browser.

    // Let's look at how `next/link` works. It generates `<a href="./auth">` or `<a href="../auth">`.
    // Next.js router does this calculation.

    // Can we use `window.history`? No.

    // Let's try to determine depth by checking `window.location.href`.
    // If we are in Next.js export, the URL usually ends in `/index.html` or a folder slash.

    // Let's try a safe bet:
    // 1. Try to detect if we are at root.
    // 2. If not, try to go up.

    // Actually, let's just implement the function as requested but maybe add the depth calculation logic if I am confident.
    // For now, I will implement it such that it calculates `../` based on current path segments after `out`? No.

    // Let's just follow the user instruction for now:
    // `window.location.href = './${clean}'`
    // This assumes we are at root or the user knows what they are doing.
    // Wait, if I am at `/dashboard`, `clean` is `auth/`. `./auth/` from dashboard is `dashboard/auth/`.
    // This will 404.

    // I MUST handle the depth.
    // I will assume that the file name is `index.html`.
    // So every page is `dir/index.html`.
    // To go to root from `dir/index.html`, we need `../`.
    // To go to root from `dir/subdir/index.html`, we need `../../`.

    // So I need to count how many segments are in the path *relative to the app root*.
    // But I don't know the app root.

    // However, I can use the `document.baseURI` if it's set? Next.js doesn't set it.

    // Let's look at `window.location.href`.
    // file:///Users/user/bountip/bountip-desktop/out/index.html
    // file:///Users/user/bountip/bountip-desktop/out/dashboard/index.html

    // If I want to go to `auth/index.html`.

    // From root: `./auth/index.html` works.
    // From dashboard: `../auth/index.html` works.

    // How do I distinguish them?
    // I can check if the URL contains `/dashboard/`?
    // That's hardcoding.

    // What if I just use the `router` to get the pathname?
    // `window.location.pathname` is available.
    // In Electron, it is `/Users/user/bountip/bountip-desktop/out/index.html`.

    // If I can find where `out` is in the path, I can calculate the root.
    // `out` is the default output directory.
    // But the user might have changed it.
    // But `electron/main.js` says: `path.join(__dirname, "..", "out", "index.html")`.
    // So it IS `out`.

    // So, I can find the last occurrence of `/out/` in pathname.
    // Everything after that is the relative path from root.

    const pathParts = window.location.pathname.split("/out/");
    if (pathParts.length > 1) {
      const relativePath = pathParts[1]; // e.g. "dashboard/index.html" or "index.html"
      const depth = relativePath.split("/").length - 1; // "index.html" -> 0. "dashboard/index.html" -> 1.

      const prefix = "../".repeat(depth);
      window.location.href = `${prefix}${clean}index.html`;
      return;
    }

    // Fallback if we can't find 'out' (maybe dev mode or different build dir)
    window.location.href = `./${clean}index.html`;
  } else {
    // Non-file protocol (e.g. localhost)
    window.location.href = `/${clean}`;
  }
}
