import injectDevice from "../../../../../src/components/Context/injectDevice";

describe("Context::injectDevice", () => {
  let window;

  beforeEach(() => {
    window = {
      screen: {
        width: 600,
        height: 800
      }
    };
  });

  const run = () => {
    const xdm = {};
    injectDevice(window)(xdm);
    return xdm;
  };

  test("handles the happy path", () => {
    window.screen.orientation = { type: "landscape-primary" };
    expect(run()).toEqual({
      device: {
        screenHeight: 800,
        screenWidth: 600,
        screenOrientation: "landscape"
      }
    });
  });

  test("handles portrait orientation type", () => {
    window.screen.orientation = { type: "portrait-secondary" };
    expect(run()).toEqual({
      device: {
        screenHeight: 800,
        screenWidth: 600,
        screenOrientation: "portrait"
      }
    });
  });

  test("handles matchMedia queries: portrait", () => {
    window.matchMedia = query => ({
      matches: query === "(orientation: portrait)"
    });
    expect(run()).toEqual({
      device: {
        screenHeight: 800,
        screenWidth: 600,
        screenOrientation: "portrait"
      }
    });
  });

  test("handles matchMedia queries: landscape", () => {
    window.matchMedia = query => ({
      matches: query === "(orientation: landscape)"
    });
    expect(run()).toEqual({
      device: {
        screenHeight: 800,
        screenWidth: 600,
        screenOrientation: "landscape"
      }
    });
  });

  [
    undefined,
    null,
    {},
    { type: "foo" },
    { type: "a-b" },
    { type: null }
  ].forEach(orientation => {
    test(`handles a bad screen orientation: ${JSON.stringify(
      orientation
    )}`, () => {
      if (orientation !== undefined) {
        window.screen.orientation = orientation;
      }
      window.matchMedia = () => ({ matches: false });
      expect(run()).toEqual({
        device: {
          screenHeight: 800,
          screenWidth: 600
        }
      });
    });
  });
});
