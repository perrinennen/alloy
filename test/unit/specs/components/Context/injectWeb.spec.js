import injectWeb from "../../../../../src/components/Context/injectWeb";

describe("Context::injectWeb", () => {
  const window = {
    location: { href: "http://mylocation.com" },
    top: {
      document: {
        referrer: "http://myreferrer.com"
      }
    }
  };

  test("works", () => {
    const xdm = {};
    injectWeb(window)(xdm);
    expect(xdm).toEqual({
      web: {
        webPageDetails: {
          URL: "http://mylocation.com"
        },
        webReferrer: {
          URL: "http://myreferrer.com"
        }
      }
    });
  });
});
