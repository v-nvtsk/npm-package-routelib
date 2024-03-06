---
created: 2024-03-06T17:13:46 (UTC +03:00)
source: https://otus.ru/learning/233931/#/
---

- [x] роутер поддерживает роуты из строк - 1 балл
- [x] роутер поддерживает роуты из регулярных выражений - 1 балл
- [x] роутер поддерживает роуты из функций - 1 балл
- [x] роутер поддерживает асинхронные хуки - 1 балл
- [x] роутер поддерживает onLeave, on Enter, onBeforeEnter - 2 балла
- [x] роутер поддерживает переключение api - 1 балл
- [x] пакет опубликован - 1 балл
      [routelib](https://www.npmjs.com/package/routelib)
- [ ] сделано ревью 2 проектов - 1 балл
- [x] роутер поддерживает проброс параметров в хуки - 2 балла  
       Статус принято ставится от 8 баллов

# Client side browser Router lib

Router supports routes of types:

- strings
- regular expressions
- functions

Router supports asynchronous hooks:

- onBeforeEnter: called before page loading
- onEnter: called on page loading
- onLeave: called on page leaving

Router supports hash API and History API. Can be chosen on router instance creation.

On init Router sets the listener on document click and check if target is anchor. If anchor href is relative and starts from "/" it will be processed as route link. Any other links will be opened in a new window.

## Installing

```bash
npm install routelib
```

Once the package is installed, you can import the library using import or require approach:

```js
import { Router } from "routelib";
```

## Router API public methods

### addRoute

Adds new route

```js
  addRoute(routeConfig: RouteConfig): void {
```

Where RouteConfig is an object that describe route path and callbacks (hooks) to process on navigation to this route (or out of it: onLeave):

```js
type RouteConfig = {
  path: string | RegExp | Function; // Path as string or RegExp for pattern matching
  onBeforeEnter?: (params?: HookParams) => Promise<void> | void;
  onEnter: (params?: HookParams) => Promise<void> | void;
  onLeave?: (params?: HookParams) => Promise<void> | void;
};
```

and HookParams is an object with data:

```js
type HookParams = {
  [key: string]: string;
};
```

### removeRoute

If you don't need route any more - it could be removed

```js
  removeRoute(path: string):void
```

### setNotFoundRoute

To handle route errors you can add handler for not found routes.

```js
  setNotFoundRoute(routeConfig: Omit<RouteConfig, "path">): void;
```

**To handle error 404 your server should redirect any call to index.html!**
In webpack you can achive this by adding parameter `historyApiFallback`

```js
module.exports = (env) => ({
  ...
  devServer: {
    ...
    historyApiFallback: true,
  },
```

### navigate

You can navigate to any route by calling `navigate` method.
Optional parameter `update` allows only change href without render. It's more internal option.

```js
  navigate(path: string, update = true): void;

```

## Example

```js
import { Router } from "../src/RouterLib";

// Create initial markup
const nav = document.createElement("nav");
nav.id = "nav";
nav.innerHTML = `
  <ul>
    <li><a href="/">Home</a></li>
    <li><a href="/about">About</a></li>
    <li><a href="/year">Year view</a></li>
    <li><a href="/month">Month view</a></li>
    <li><a href="/month?filter=true&month=1&text=task1&tag=tag1">Month with params view</a></li>
    <li><a href="/day">Day view</a></li>
    <li><a href="/list">List view</a></li>
    <li><a href="/function">Function view</a></li>
    <li><a href="/asd123">Regular expression</a></li>
    <li><a href="/any">Any unknown page</a></li>
    <li><a href="/removed">This path is added and removed</a></li>
    <li><a href="https://google.com">External link - google.com</a></li>

  </ul>
`;

// append body with element
document.body.append(nav);

// create element to which will print information
const info = document.createElement("div");
info.id = "info";
document.body.append(info);

// creating router with modern History API
const router = new Router("history");

// creating router with hash API
// const router = new Router("hash");


// helper with onEnter hook, that will output information about
// selected route
const callback = (path: string | RegExp | Function) => ({
  path,
  onEnter: () => {
    console.log("Entered", path);
    if (typeof path === "string") {
      document.title = path.slice(1);
      const el = document.createElement("div");
      el.innerHTML = path;
      info.append(el);
    }
  },
});

// add Root route
router.addRoute(callback("/"));

// add About route demonstrating onBeforeEnter, onEnter
// and onLeave hooks with timer API
router.addRoute({
  path: "/about",
  onBeforeEnter: async () => {
    console.log("Before entering about page - wait 3 seconds...");
    let el = document.createElement("div");
    el.innerHTML = "Before entering about page - wait for 3...";
    info.append(el);
    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
    el = document.createElement("div");
    el.innerHTML = "Before entering about page - wait for 2...";
    info.append(el);
    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
    el = document.createElement("div");
    el.innerHTML = "Before entering about page - wait for 1...";
    info.append(el);
    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
  },
  onEnter: () => {
    console.log("Entered about page");
    document.title = "About";
    const el = document.createElement("div");
    el.innerHTML = "About";
    info.append(el);
  },
  onLeave: async () => {
    console.log("Leaving about page");
    const el = document.createElement("div");
    el.innerHTML = "Leaving about page - wait 3 seconds...";
    info.append(el);
    await new Promise((resolve) => {
      setTimeout(resolve, 3000);
    });
  },
});

// add route supporting with regular expression
router.addRoute({
  path: /[\S]{1,3}123/,
  onEnter: () => {
    console.log("Entered RegExp page");
    info.innerHTML = "RegExp";
    document.title = info.innerHTML;
  },
});

// add route supporting function as route
router.addRoute({
  path: () => "/function",
  onEnter: () => {
    console.log("Entered /function page");
    info.innerHTML = "Function";
    document.title = info.innerHTML;
  },
});

// add route with helper `callback`
router.addRoute(callback("/year"));
router.addRoute(callback("/month"));
router.addRoute(callback("/day"));
router.addRoute(callback("/list"));
router.addRoute(callback("/removed"));
router.removeRoute("/removed");

// add default route for any not found page
// 404 page route
router.setNotFoundRoute({
  onEnter: () => {
    console.log("404 - Page not found");
    info.innerHTML = "404 - Page not found";
    document.title = "404 - Page not found";
  },
});

// start navigation from Root
router.navigate("/");

```
