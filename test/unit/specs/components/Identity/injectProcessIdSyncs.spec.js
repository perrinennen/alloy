import injectProcessIdSyncs from "../../../../../src/components/Identity/injectProcessIdSyncs";

describe("Identity::injectProcessIdSyncs", () => {
  let fireReferrerHideableImage;
  let logger;
  let processIdSyncs;

  beforeEach(() => {
    fireReferrerHideableImage = jest.fn(() => Promise.resolve());
    logger = {
      log: jest.fn(),
      error: jest.fn()
    };
    processIdSyncs = injectProcessIdSyncs({
      fireReferrerHideableImage,
      logger
    });
  });

  test("handles no ID syncs", () => {
    return processIdSyncs([]).then(() => {
      expect(fireReferrerHideableImage).not.toHaveBeenCalled();
    });
  });

  test("calls fireReferrerHideableImage for all ID syncs of type URL, and logs results", () => {
    fireReferrerHideableImage.mockImplementation(({ url }) => {
      return url === "http://test.zyx" ? Promise.resolve() : Promise.reject();
    });

    const identities = [
      {
        type: "url",
        id: 2097728,
        spec: {
          url: "http://test.abc",
          hideReferrer: true
        }
      },
      {
        type: "cookie",
        spec: {
          name: "testCookieIdSync",
          value: "id\u003ds2",
          domain: "",
          ttl: 30
        }
      },
      {
        type: "url",
        id: 2097729,
        spec: {
          url: "http://test.zyx",
          hideReferrer: false
        }
      }
    ];

    return processIdSyncs(identities).then(() => {
      expect(fireReferrerHideableImage).toHaveBeenCalledWith({
        url: "http://test.abc",
        hideReferrer: true
      });
      expect(fireReferrerHideableImage).toHaveBeenCalledWith({
        url: "http://test.zyx",
        hideReferrer: false
      });
      expect(logger.log).toHaveBeenCalledWith(
        "ID sync succeeded: http://test.zyx"
      );
      expect(logger.error).toHaveBeenCalledWith(
        "ID sync failed: http://test.abc"
      );
    });
  });
});
