export declare type HookParams = {
  [key: string]: string;
};

export declare type RouteConfig = {
  path: string | RegExp | Function; // Path as string or RegExp for pattern matching
  onBeforeEnter?: (params?: HookParams) => Promise<void> | void;
  onEnter: (params?: HookParams) => Promise<void> | void;
  onLeave?: (params?: HookParams) => Promise<void> | void;
};
