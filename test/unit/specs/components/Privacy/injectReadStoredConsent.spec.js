import injectReadStoredConsent from "../../../../../src/components/Privacy/injectReadStoredConsent";

describe("Privacy:injectReadStoredConsent", () => {
  let parseConsentCookie;
  const orgId = "myorgid@mycompany";
  let cookieJar;
  let readStoredConsent;

  beforeEach(() => {
    parseConsentCookie = jest.fn();
    cookieJar = {
      get: jest.fn()
    };
    readStoredConsent = injectReadStoredConsent({
      parseConsentCookie,
      orgId,
      cookieJar
    });
  });

  test("gets the cookie", () => {
    cookieJar.get.mockReturnValue("cookieValue");
    parseConsentCookie.mockReturnValue("parsedConsentValue");
    expect(readStoredConsent()).toEqual("parsedConsentValue");
    expect(parseConsentCookie).toHaveBeenCalledWith("cookieValue");
  });

  test("returns undefined if the cookie is not there", () => {
    cookieJar.get.mockReturnValue(undefined);
    expect(readStoredConsent()).toEqual(undefined);
    expect(parseConsentCookie).not.toHaveBeenCalled();
  });

  test("uses the correct cookie name", () => {
    readStoredConsent();
    expect(cookieJar.get).toHaveBeenCalledWith(
      "kndctr_myorgid_mycompany_consent"
    );
  });
});
