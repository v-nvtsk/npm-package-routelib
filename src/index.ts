type HookParams = {
  [key: string]: string;
};

type RouteConfig = {
  path: string | RegExp | Function; // Path as string or RegExp for pattern matching
  onBeforeEnter?: (params?: HookParams) => Promise<void> | void;
  onEnter: (params?: HookParams) => Promise<void> | void;
  onLeave?: (params?: HookParams) => Promise<void> | void;
};

export class Router {
  private routes: RouteConfig[] = [];

  private currentRoute: RouteConfig | null = null;

  constructor(private mode: "hash" | "history" = "hash") {
    this.addListeners();
    if (this.mode === "history") {
      window.history.replaceState(null, document.title, window.location.href);
    } else {
      window.location.hash = window.location.hash || "/";
    }
  }

  addRoute(routeConfig: RouteConfig): void {
    this.routes.push(routeConfig);
  }

  removeRoute(path: string): void {
    this.routes = this.routes.filter((route) => route.path !== path);
  }

  setNotFoundRoute(routeConfig: Omit<RouteConfig, "path">): void {
    this.addRoute({
      ...routeConfig,
      path: /.*/,
    });
  }

  navigate(path: string, update = true): void {
    const url = new URL(path, window.location.href);
    const params = Object.fromEntries(new URLSearchParams(url.searchParams));
    const resourcePath = url.pathname;

    const route = this.matchRoute(resourcePath);
    if (route) this.renderhooks(route, resourcePath, url, params, update);
  }

  private async renderhooks(
    route: RouteConfig,
    resourcePath: string,
    url: string | URL,
    params: HookParams | undefined,
    update: boolean,
  ) {
    if (this.currentRoute && this.currentRoute.onLeave) {
      await this.currentRoute.onLeave(params);
    }

    if (route.onBeforeEnter) await route.onBeforeEnter(params);

    if (update) this.updateURL(resourcePath + url.search);

    if (route.onEnter) await route.onEnter(params);
  }

  private matchRoute(path: string): RouteConfig | undefined {
    return this.routes.find((route) => {
      if (typeof route.path === "string") {
        return route.path === path;
      }
      if (route.path instanceof RegExp) {
        return route.path.test(path);
      }
      return route.path(path) === path;
    });
  }

  private updateURL(path: string): void {
    if (this.mode === "history") {
      window.history.pushState({ path }, document.title, path);
    }
  }

  private addListeners(): void {
    document.addEventListener("click", this.clickListener);
    if (this.mode === "history") {
      window.addEventListener("popstate", this.handlePopstate);
    } else {
      window.addEventListener("hashchange", this.handleHashchange);
    }
  }

  clickListener = (event: MouseEvent): void => {
    event.preventDefault();
    const target = event.target as HTMLAnchorElement;
    if (target.matches("a[href^='/']")) {
      if (this.mode === "history") {
        this.navigate(target.getAttribute("href")!);
      } else {
        const path = target.getAttribute("href");
        window.location.href = `/#${path}`;
      }
    } else {
      window.open(target.getAttribute("href")!, "_blank");
    }
  };

  handlePopstate = (event: PopStateEvent): void => {
    event.preventDefault();
    if (event.state !== null) {
      this.navigate(event.state.path, false);
    }
  };

  handleHashchange = (event: HashChangeEvent): void => {
    event.preventDefault();
    const { hash } = window.location;
    this.navigate(`${hash.substring(1)}`);
    return undefined;
  };
}
