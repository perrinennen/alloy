/*
Copyright 2019 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import injectSendEdgeNetworkRequest from "../../../../../src/core/edgeNetwork/injectSendEdgeNetworkRequest";
import createConfig from "../../../../../src/core/config/createConfig";
import { defer } from "../../../../../src/utils";
import flushPromiseChains from "../../../helpers/flushPromiseChains";
import assertFunctionCallOrder from "../../../helpers/assertFunctionCallOrder";

describe("injectSendEdgeNetworkRequest", () => {
  const config = createConfig({
    edgeDomain: "edge.example.com",
    edgeBasePath: "ee",
    edgeConfigId: "myconfigId"
  });
  let logger;
  let lifecycle;
  let cookieTransfer;
  let networkResult;
  let sendNetworkRequest;
  let response;
  let createResponse;
  let processWarningsAndErrors;
  let validateNetworkResponseIsWellFormed;
  let sendEdgeNetworkRequest;
  const payload = {
    getUseIdThirdPartyDomain() {
      return false;
    }
  };
  const action = "test-action";

  /**
   * Helper for testing handling of network request failures, particularly
   * their interplay with lifecycle hooks.
   */
  const testRequestFailureHandling = ({
    runOnRequestFailureCallbacks,
    assertLifecycleCall
  }) => {
    const error = new Error("no connection");
    sendNetworkRequest.mockReturnValue(Promise.reject(error));
    const errorHandler = jest.fn();
    sendEdgeNetworkRequest({ payload, action, runOnRequestFailureCallbacks })
      .then(fail)
      .catch(errorHandler);
    return flushPromiseChains()
      .then(() => {
        expect(errorHandler).not.toHaveBeenCalled();
        assertLifecycleCall(error);
        return flushPromiseChains();
      })
      .then(() => {
        expect(errorHandler).toHaveBeenCalledWith(error);
      });
  };

  /**
   * Helper for testing handling of malformed network responses, particularly
   * their interplay with lifecycle hooks.
   */
  const testMalformedResponseHandling = ({
    runOnRequestFailureCallbacks,
    assertLifecycleCall
  }) => {
    const error = new Error("Unexpected response.");
    validateNetworkResponseIsWellFormed.mockImplementation(() => {
      throw error;
    });
    const errorHandler = jest.fn();
    sendEdgeNetworkRequest({ payload, action, runOnRequestFailureCallbacks })
      .then(fail)
      .catch(errorHandler);
    return flushPromiseChains()
      .then(() => {
        expect(errorHandler).not.toHaveBeenCalled();
        assertLifecycleCall(error);
        return flushPromiseChains();
      })
      .then(() => {
        expect(errorHandler).toHaveBeenCalledWith(error);
      });
  };

  /**
   * Helper for testing handling of well-formed network responses, particularly
   * their interplay with lifecycle hooks.
   */
  const testWellFormedResponseHandling = ({
    runOnResponseCallbacks,
    assertLifecycleCall
  }) => {
    const successHandler = jest.fn();
    sendEdgeNetworkRequest({ payload, action, runOnResponseCallbacks }).then(
      successHandler
    );
    return flushPromiseChains()
      .then(() => {
        expect(successHandler).not.toHaveBeenCalled();
        assertLifecycleCall();
        expect(lifecycle.onResponse).toHaveBeenCalledWith({ response });
        return flushPromiseChains();
      })
      .then(() => {
        expect(successHandler).toHaveBeenCalled();
      });
  };

  beforeEach(() => {
    logger = {
      log: jest.fn()
    };
    lifecycle = {
      onBeforeRequest: jest.fn(() => Promise.resolve()),
      onRequestFailure: jest.fn(() => Promise.resolve()),
      onResponse: jest.fn(() => Promise.resolve())
    };
    cookieTransfer = {
      cookiesToPayload: jest.fn(),
      responseToCookies: jest.fn()
    };
    networkResult = {
      parsedBody: {}
    };
    sendNetworkRequest = jest.fn(() => Promise.resolve(networkResult));
    response = { type: "response" };
    createResponse = jest.fn(() => response);
    processWarningsAndErrors = jest.fn();
    validateNetworkResponseIsWellFormed = jest.fn();
    sendEdgeNetworkRequest = injectSendEdgeNetworkRequest({
      config,
      logger,
      lifecycle,
      cookieTransfer,
      sendNetworkRequest,
      createResponse,
      processWarningsAndErrors,
      validateNetworkResponseIsWellFormed
    });
  });

  test("transfers cookies to payload when sending to first-party domain", () => {
    payload.getUseIdThirdPartyDomain = () => false;
    return sendEdgeNetworkRequest({ payload, action }).then(() => {
      expect(cookieTransfer.cookiesToPayload).toHaveBeenCalledWith(
        payload,
        "edge.example.com"
      );
    });
  });

  test("transfers cookies to payload when sending to third-party domain", () => {
    payload.getUseIdThirdPartyDomain = () => false;
    // Ensure that sendEdgeNetworkRequest waits until after
    // lifecycle.onBeforeRequest to determine the endpoint domain.
    lifecycle.onBeforeRequest.mockImplementation(() => {
      payload.getUseIdThirdPartyDomain = () => true;
      return Promise.resolve();
    });
    return sendEdgeNetworkRequest({ payload, action }).then(() => {
      expect(cookieTransfer.cookiesToPayload).toHaveBeenCalledWith(
        payload,
        "adobedc.demdex.net"
      );
    });
  });

  test("sends request to first-party domain", () => {
    payload.getUseIdThirdPartyDomain = () => false;
    return sendEdgeNetworkRequest({ payload, action }).then(() => {
      expect(sendNetworkRequest).toHaveBeenCalledWith({
        payload,
        url: expect.stringMatching(
          /https:\/\/edge\.example\.com\/ee\/v1\/test-action\?configId=myconfigId&requestId=[0-9a-f-]+/
        ),
        requestId: expect.stringMatching(/^[0-9a-f-]+$/)
      });
    });
  });

  test("sends request to third-party domain", () => {
    payload.getUseIdThirdPartyDomain = () => false;
    // Ensure that sendEdgeNetworkRequest waits until after
    // lifecycle.onBeforeRequest to determine the endpoint domain.
    lifecycle.onBeforeRequest.mockImplementation(() => {
      payload.getUseIdThirdPartyDomain = () => true;
      return Promise.resolve();
    });
    return sendEdgeNetworkRequest({ payload, action }).then(() => {
      expect(sendNetworkRequest).toHaveBeenCalledWith({
        payload,
        url: expect.stringMatching(
          /https:\/\/adobedc\.demdex\.net\/ee\/v1\/test-action\?configId=myconfigId&requestId=[0-9a-f-]+/
        ),
        requestId: expect.stringMatching(/^[0-9a-f-]+$/)
      });
    });
  });

  test("calls lifecycle.onBeforeRequest and waits for it to complete before sending request", () => {
    const deferred = defer();
    lifecycle.onBeforeRequest.mockReturnValue(deferred.promise);
    const successHandler = jest.fn();
    sendEdgeNetworkRequest({ payload, action }).then(successHandler);
    return flushPromiseChains()
      .then(() => {
        expect(lifecycle.onBeforeRequest).toHaveBeenCalledWith({
          payload,
          onResponse: expect.any(Function),
          onRequestFailure: expect.any(Function)
        });
        expect(sendNetworkRequest).not.toHaveBeenCalled();
        deferred.resolve();
        return flushPromiseChains();
      })
      .then(() => {
        expect(successHandler).toHaveBeenCalled();
      });
  });

  test("when network request fails, calls lifecycle.onRequestFailure, waits for it to complete, then rejects promise", () => {
    const deferred = defer();
    lifecycle.onRequestFailure.mockReturnValue(deferred.promise);
    return testRequestFailureHandling({
      assertLifecycleCall(error) {
        expect(lifecycle.onRequestFailure).toHaveBeenCalledWith({ error });
        // We reject this deferred to simulate a component throwing an error
        // during the lifecycle.onRequestFailure hook. This tests that the
        // promise from sendEdgeNetworkRequest is still rejected with the
        // network error rather than the error coming from a component.
        deferred.reject();
      }
    });
  });

  test("when network request fails, calls lifecycle.onBeforeRequest's onRequestFailure callback, waits for it to complete, then rejects promise", () => {
    const deferred = defer();
    const requestFailureCallback = jest.fn(() => deferred.promise);
    lifecycle.onBeforeRequest.mockImplementation(({ onRequestFailure }) => {
      onRequestFailure(requestFailureCallback);
      return Promise.resolve();
    });
    return testRequestFailureHandling({
      assertLifecycleCall(error) {
        expect(requestFailureCallback).toHaveBeenCalledWith({ error });
        // We reject this deferred to simulate a component throwing an error
        // during the lifecycle.onBeforeRequest's onRequestFailure callback.
        // This tests that the promise from sendEdgeNetworkRequest is still
        // rejected with the network error rather than the error coming from
        // a component.
        deferred.reject();
      }
    });
  });

  test("when network request fails, calls onRequestFailureCallbacks, waits for it to complete, then rejects promise", () => {
    const deferred = defer();
    const runOnRequestFailureCallbacks = jest.fn(() => deferred.promise);
    return testRequestFailureHandling({
      runOnRequestFailureCallbacks,
      assertLifecycleCall(error) {
        expect(runOnRequestFailureCallbacks).toHaveBeenCalledWith({ error });
        // We reject this deferred to simulate a component throwing an error
        // during the runOnRequestFailureCallbacks call. This tests that the
        // promise from sendEdgeNetworkRequest is still rejected with the
        // network error rather than the error coming from a component.
        deferred.reject();
      }
    });
  });

  test("when network response is malformed, calls lifecycle.onRequestFailure, waits for it to complete, then rejects promise", () => {
    const deferred = defer();
    lifecycle.onRequestFailure.mockReturnValue(deferred.promise);

    return testMalformedResponseHandling({
      assertLifecycleCall(error) {
        expect(lifecycle.onRequestFailure).toHaveBeenCalledWith({ error });
        // We reject this deferred to simulate a component throwing an error
        // during the lifecycle.onRequestFailure hook. This tests that the
        // promise from sendEdgeNetworkRequest is still rejected with the
        // network error rather than the error coming from a component.
        deferred.reject();
      }
    });
  });

  test("when network response is malformed, calls lifecycle.onBeforeRequest's onRequestFailure callback, waits for it to complete, then rejects promise", () => {
    const deferred = defer();
    const requestFailureCallback = jest.fn(() => deferred.promise);
    lifecycle.onBeforeRequest.mockImplementation(({ onRequestFailure }) => {
      onRequestFailure(requestFailureCallback);
      return Promise.resolve();
    });
    return testMalformedResponseHandling({
      assertLifecycleCall(error) {
        expect(requestFailureCallback).toHaveBeenCalledWith({ error });
        // We reject this deferred to simulate a component throwing an error
        // during the lifecycle.onBeforeRequest's onRequestFailure callback.
        // This tests that the promise from sendEdgeNetworkRequest is still
        // rejected with the network error rather than the error coming from
        // a component.
        deferred.reject();
      }
    });
  });

  test("when network response is malformed, calls runOnRequestFailureCallbacks, waits for it to complete, then rejects promise", () => {
    const deferred = defer();
    const runOnRequestFailureCallbacks = jest.fn(() => deferred.promise);
    return testMalformedResponseHandling({
      runOnRequestFailureCallbacks,
      assertLifecycleCall(error) {
        expect(runOnRequestFailureCallbacks).toHaveBeenCalledWith({ error });
        // We reject this deferred to simulate a component throwing an error
        // during the runOnRequestFailureCallbacks call. This tests that the
        // promise from sendEdgeNetworkRequest is still rejected with the
        // network error rather than the error coming from a component.
        deferred.reject();
      }
    });
  });

  test("when network response is well-formed, calls lifecycle.onResponse, waits for it to complete, then resolves promise", () => {
    const deferred = defer();
    lifecycle.onResponse.mockReturnValue(deferred.promise);
    return testWellFormedResponseHandling({
      assertLifecycleCall() {
        expect(lifecycle.onResponse).toHaveBeenCalledWith({ response });
        deferred.resolve();
      }
    });
  });

  test("when network response is well-formed, calls lifecycle.onBeforeRequest's responseCallback callback, waits for it to complete, then resolves promise", () => {
    const deferred = defer();
    const responseCallback = jest.fn(() => deferred.promise);
    lifecycle.onBeforeRequest.mockImplementation(({ onResponse }) => {
      onResponse(responseCallback);
      return Promise.resolve();
    });
    return testWellFormedResponseHandling({
      assertLifecycleCall() {
        expect(responseCallback).toHaveBeenCalledWith({ response });
        deferred.resolve();
      }
    });
  });

  test("when network response is well-formed, calls runOnResponseCallbacks, waits for it to complete, then resolves promise", () => {
    const deferred = defer();
    const runOnResponseCallbacks = jest.fn(() => deferred.promise);
    return testWellFormedResponseHandling({
      runOnResponseCallbacks,
      assertLifecycleCall() {
        expect(runOnResponseCallbacks).toHaveBeenCalledWith({ response });
        deferred.resolve();
      }
    });
  });

  test("transfers cookies from response before lifecycle.onResponse", () => {
    return sendEdgeNetworkRequest({ payload, action }).then(() => {
      expect(cookieTransfer.responseToCookies).toHaveBeenCalledWith(response);
      assertFunctionCallOrder([
        cookieTransfer.responseToCookies,
        lifecycle.onResponse
      ]);
    });
  });

  test("processes warnings and errors", () => {
    return sendEdgeNetworkRequest({ payload, action }).then(() => {
      expect(processWarningsAndErrors).toHaveBeenCalled();
    });
  });

  test("rejects the promise if error is thrown while processing warnings and errors", () => {
    processWarningsAndErrors.mockImplementation(() => {
      throw new Error(new Error("Invalid XDM"));
    });
    return expect(sendEdgeNetworkRequest({ payload, action })).rejects.toThrow(
      "Invalid XDM"
    );
  });

  test("returns the merged object from lifecycle::onResponse and runOnResponseCallbacks", () => {
    const runOnResponseCallbacks = jest.fn(() =>
      Promise.resolve([{ c: 2 }, { h: 9 }, undefined])
    );

    lifecycle.onResponse.mockReturnValue(
      Promise.resolve([{ a: 2 }, { b: 8 }, undefined])
    );

    return expect(
      sendEdgeNetworkRequest({ payload, action, runOnResponseCallbacks })
    ).resolves.toEqual({ c: 2, h: 9, a: 2, b: 8 });
  });

  test("returns the merged object from lifecycle::onBeforeRequest & lifecycle::onResponse", () => {
    lifecycle.onBeforeRequest.mockImplementation(({ onResponse }) => {
      onResponse(() => ({ a: 1 }));
      onResponse(() => ({ b: 1 }));
      onResponse(() => undefined);
      return Promise.resolve();
    });
    lifecycle.onResponse.mockReturnValue(Promise.resolve([{ c: 2 }]));
    return expect(sendEdgeNetworkRequest({ payload, action })).resolves.toEqual(
      { a: 1, b: 1, c: 2 }
    );
  });
});
