import injectSendSetConsentRequest from "../../../../../src/components/Privacy/injectSendSetConsentRequest";

describe("Privacy:injectSendSetConsentRequest", () => {
  let createConsentRequestPayload;
  let sendEdgeNetworkRequest;
  let payload;
  let sendSetConsentRequest;

  beforeEach(() => {
    createConsentRequestPayload = jest.fn();
    sendEdgeNetworkRequest = jest.fn();
    payload = {
      setConsent: jest.fn()
    };
    createConsentRequestPayload.mockReturnValue(payload);
    sendSetConsentRequest = injectSendSetConsentRequest({
      createConsentRequestPayload,
      sendEdgeNetworkRequest
    });
  });

  test("sets consent level and on payload and sends the request", () => {
    sendEdgeNetworkRequest.mockReturnValue(Promise.resolve());
    return sendSetConsentRequest("anything").then(resolvedValue => {
      expect(payload.setConsent).toHaveBeenCalledWith("anything");
      expect(sendEdgeNetworkRequest).toHaveBeenCalledWith({
        payload,
        action: "privacy/set-consent"
      });
      expect(resolvedValue).toBeUndefined();
    });
  });
});
