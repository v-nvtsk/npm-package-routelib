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

    it("should handle string routes", () => {
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
      const mockedBeforeEnter = jest.fn().mockImplementation(() => {});
      const mockedEnter = jest.fn().mockImplementation(() => {});
      const mockedLeave = jest.fn().mockImplementation(() => {});

      router.addRoute({
        path: "/test",
        onBeforeEnter: (params) => {
          mockedBeforeEnter("onBeforeEnter: ", params);
        },
        onEnter: (params) => {
          mockedEnter("onEnter: ", params);
        },
        onLeave: (params) => {
          mockedLeave("onLeave: ", params);
        },
      });

      jest.useFakeTimers();
      router.navigate("/test?a=1&b=2");
      await Promise.resolve();
      expect(mockedBeforeEnter).toHaveBeenCalledWith("onBeforeEnter: ", { a: "1", b: "2" });
      expect(mockedEnter).toHaveBeenCalledWith("onEnter: ", { a: "1", b: "2" });
      router.navigate("/");
      await Promise.resolve();
      expect(mockedLeave).toHaveBeenCalled();
      expect(mockedLeave).toHaveBeenCalledWith("onLeave: ", {});
    });

    it("should be able to go back and forth", async () => {
      jest.resetAllMocks();
      const mockClickHandler = jest.fn();
      document.addEventListener("hashchange", mockClickHandler);

      const testEl = document.createElement("div");
      document.body.append(testEl);

      const sequence = ["/test1", "/test2", "/test3", "/test4"];
      const result: string[] = [];

      content.innerHTML = "";
      const links = sequence.map((path) => {
        const el = document.createElement("a");
        el.innerHTML = path;
        el.href = path;
        testEl.append(el);
        return el;
      });

      sequence.forEach(async (path) => {
        router.addRoute({
          path,
          onEnter: () => {
            result.push(path);
          },
        });
      });

      links.forEach(async (link, index) => {
        link.click();

        // await Promise.resolve();
        const newURL = link.href;
        const oldURL = index - 1 < 0 ? "/" : links[index - 1].href;
        window.dispatchEvent(new HashChangeEvent("hashchange", { newURL, oldURL }));
      });
      await Promise.resolve();

      expect(result).toEqual(sequence);

      result.splice(0, 4);
      expect(result.length).toEqual(0);

      if (mode === "history") {
        const revSequence = sequence.reverse().slice(1);
        revSequence.forEach((el) => {
          window.dispatchEvent(new PopStateEvent("popstate", { state: { path: el } }));
        });
        await Promise.resolve();
        expect(revSequence).toEqual(result);
      }
    });
    it("should handle external links", () => {
      const link = document.createElement("a");
      link.href = "https://ya.ru";
      document.body.append(link);
      jest.spyOn(window, "open").mockImplementation(() => null);
      link.click();
      expect(window.open).toHaveBeenCalled();
    });

    it("should do nothing on clicks out of anchor", () => {
      const link = document.createElement("a");
      link.href = "https://ya.ru";
      link.target = "_blank";
      document.body.append(link);
      jest.spyOn(window, "open").mockImplementation(() => null);
      document.body.click();
      expect(window.open).not.toHaveBeenCalled();
    });
  });
});
