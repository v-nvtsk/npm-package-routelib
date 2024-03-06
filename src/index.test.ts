/* eslint-disable no-console */
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Router } from "./index";

["history", "hash"].forEach((mode) => {
  describe(`Router in mode: ${mode}`, () => {
    let router: Router;
    let content: HTMLElement;

    beforeEach(() => {
      content = document.createElement("div");
      document.body.append(content);

      router = new Router(mode as "history" | "hash");
      router.addRoute({
        path: "/",
        onEnter: () => {
          content.innerHTML = "/";
        },
      });
      router.navigate("/");
    });

    afterEach(() => {
      content.innerHTML = "";
      jest.restoreAllMocks();
    });

    it("should be an instance of Router", () => {
      expect(router).toBeInstanceOf(Router);
    });

    it.only("should handle string routes", () => {
      router.navigate("/");
      expect(content.innerHTML).toEqual("/");

      const testpaths = ["/testpath", "/1", "/2", "/3"];
      testpaths.forEach((testpath) => {
        router.addRoute({
          path: testpath,
          onEnter: () => {
            content.innerHTML = testpath.slice(1);
          },
        });
      });

      testpaths.forEach((testpath) => {
        router.navigate(testpath);
        expect(content.innerHTML).toEqual(testpath.slice(1));
      });
    });

    it("should handle RegExp routes", () => {
      const testpaths = ["/test1[0-9]", "/test2[a-z]"];
      const regexpPaths = testpaths.map((testpath) => new RegExp(testpath));
      testpaths.forEach((testpath, index) => {
        router.addRoute({
          path: regexpPaths[index],
          onEnter: () => {
            content.innerHTML = testpath;
          },
        });
      });

      router.navigate("/test15");
      expect(content.innerHTML).toEqual(testpaths[0]);

      router.navigate("/test2a");
      expect(content.innerHTML).toEqual(testpaths[1]);
    });

    it("should handle Function routes", () => {
      const testPath = "/callback";
      router.addRoute({
        path: () => testPath,
        onEnter: () => {
          content.innerHTML = testPath;
        },
      });

      router.navigate(testPath);
      expect(content.innerHTML).toEqual(testPath);
    });

    it("should remove routes", () => {
      expect(router.removeRoute).toBeInstanceOf(Function);

      const testpaths = ["/testpath", "/1", "/2", "/3"];
      testpaths.forEach((testpath) => {
        router.addRoute({
          path: testpath,
          onEnter: () => {
            content.innerHTML = testpath.slice(1);
          },
        });
      });

      router.setNotFoundRoute({
        onEnter: () => {
          content.innerHTML = "404";
        },
      });

      const pathToRemove = testpaths[1];
      router.removeRoute(pathToRemove);
      router.navigate(pathToRemove);
      expect(content.innerHTML).toEqual("404");
    });

    it("should handle onBeforeEnter,onEnter,onLeave hooks", async () => {
      const mockedFn = jest.fn().mockImplementation(() => {});

      router.addRoute({
        path: "/test",
        onBeforeEnter: (params) => {
          mockedFn("onBeforeEnter: ", params);
        },
        onEnter: (params) => {
          mockedFn("onEnter: ", params);
        },
        onLeave: (params) => {
          mockedFn("onLeave: ", params);
        },
      });

      await router.navigate("/test?a=1&b=2");
      expect(mockedFn).toHaveBeenNthCalledWith(1, "onBeforeEnter: ", { a: "1", b: "2" });
      expect(mockedFn).toHaveBeenNthCalledWith(2, "onEnter: ", { a: "1", b: "2" });
      await router.navigate("/?exit=true");
      expect(mockedFn).toHaveBeenNthCalledWith(3, "onLeave: ", { exit: "true" });
    });

    it("should be able to go back and forth", async () => {
      jest.resetAllMocks();

      const testEl = document.createElement("div");
      document.body.append(testEl);

      const sequence = ["/test", "/test2", "/test3", "/test"];
      const result: string[] = [];

      content.innerHTML = "";
      const links = sequence.map((path) => {
        const el = document.createElement("a");
        el.innerHTML = path;
        el.href = path;
        testEl.append(el);
        return el;
      });

      sequence.forEach((path) => {
        router.addRoute({
          path,
          onEnter: () => {
            result.push(path);
          },
        });
      });

      links.forEach((link) => {
        link.click();
      });
      expect(result).toEqual(sequence);

      result.splice(0, 4);
      expect(result.length).toEqual(0);

      const revSequence = sequence.reverse().slice(1);
      revSequence.forEach((el) => {
        if (mode === "history") {
          window.dispatchEvent(new PopStateEvent("popstate", { state: { path: el } }));
        } else {
          console.log("el: ", el);
          window.dispatchEvent(new HashChangeEvent("hashchange", { newURL: el, oldURL: el }));
        }
      });
      console.log("revSequence: ", revSequence);
      console.log("result: ", result);
      expect(revSequence).toEqual(result);
    });
  });
});
