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

import createEventManager from "../../../../src/core/createEventManager";
import realCreateDataCollectionRequestPayload from "../../../../src/core/edgeNetwork/requestPayloads/createDataCollectionRequestPayload";
import realCreateEvent from "../../../../src/core/createEvent";
import createConfig from "../../../../src/core/config/createConfig";
import { defer } from "../../../../src/utils";
import flushPromiseChains from "../../helpers/flushPromiseChains";

describe("createEventManager", () => {
  let config;
  let logger;
  let lifecycle;
  let consent;
  let event;
  let requestPayload;
  let sendEdgeNetworkRequest;
  let eventManager;
  beforeEach(() => {
    config = createConfig({
      orgId: "ABC123",
      onBeforeEventSend: jest.fn(),
      debugEnabled: true
    });
    logger = {
      error: jest.fn(),
      warn: jest.fn()
    };
    lifecycle = {
      onBeforeEvent: jest.fn(() => Promise.resolve()),
      onBeforeDataCollectionRequest: jest.fn(() => Promise.resolve())
    };
    consent = {
      awaitConsent: jest.fn(() => Promise.resolve())
    };
    event = realCreateEvent();
    spyOnAllFunctions(event);
    const createEvent = () => {
      return event;
    };
    requestPayload = realCreateDataCollectionRequestPayload();
    spyOnAllFunctions(requestPayload);
    const createDataCollectionRequestPayload = () => {
      return requestPayload;
    };
    sendEdgeNetworkRequest = jest.fn(() => Promise.resolve());
    eventManager = createEventManager({
      config,
      logger,
      lifecycle,
      consent,
      createEvent,
      createDataCollectionRequestPayload,
      sendEdgeNetworkRequest
    });
  });

  describe("createEvent", () => {
    test("creates an event object", () => {
      expect(eventManager.createEvent()).toBe(event);
    });
  });

  describe("sendEvent", () => {
    test("creates the payload and adds event and meta", () => {
      return eventManager.sendEvent(event).then(() => {
        expect(requestPayload.addEvent).toHaveBeenCalledWith(event);
      });
    });

    test("allows other components to access event and pause the lifecycle", () => {
      const deferred = defer();
      const options = {
        renderDecisions: true
      };
      lifecycle.onBeforeEvent.mockReturnValue(deferred.promise);
      eventManager.sendEvent(event, options);
      return flushPromiseChains()
        .then(() => {
          expect(lifecycle.onBeforeEvent).toHaveBeenCalledWith({
            event,
            renderDecisions: true,
            decisionScopes: undefined,
            payload: requestPayload,
            onResponse: expect.any(Function),
            onRequestFailure: expect.any(Function)
          });
          expect(consent.awaitConsent).not.toHaveBeenCalled();
          deferred.resolve();
          return flushPromiseChains();
        })
        .then(() => {
          expect(sendEdgeNetworkRequest).toHaveBeenCalled();
        });
    });

    test("sets the lastChanceCallback, which wraps config.onBeforeEventSend, on the event", () => {
      let wrappedLastChanceCallback;
      event.setLastChanceCallback.mockImplementation(callback => {
        wrappedLastChanceCallback = callback;
      });
      return eventManager.sendEvent(event, {}).then(() => {
        wrappedLastChanceCallback();
        expect(config.onBeforeEventSend).toHaveBeenCalled();
      });
    });

    test("logs errors in the config.onBeforeEventSend callback", () => {
      const error = new Error("onBeforeEventSend error");
      config.onBeforeEventSendmockImplementation(() => {
        throw new Error(error);
      });

      let wrappedLastChanceCallback;
      event.setLastChanceCallback.mockImplementation(callback => {
        wrappedLastChanceCallback = callback;
      });

      return eventManager.sendEvent(event, {}).then(() => {
        expect(() => {
          wrappedLastChanceCallback();
        }).toThrowError("onBeforeEventSend error");
        expect(logger.error).toHaveBeenCalledWith(error);
      });
    });

    test("calls onBeforeEvent before consent and onBeforeDataCollectionRequest after", () => {
      const deferred = defer();
      consent.awaitConsent = () => deferred.promise;
      eventManager.sendEvent(event);
      return flushPromiseChains()
        .then(() => {
          expect(lifecycle.onBeforeEvent).toHaveBeenCalled();
          expect(
            lifecycle.onBeforeDataCollectionRequest
          ).not.toHaveBeenCalled();
          deferred.resolve();
          return flushPromiseChains();
        })
        .then(() => {
          expect(lifecycle.onBeforeDataCollectionRequest).toHaveBeenCalled();
        });
    });

    test("allows other components to access payload and pause the lifecycle", () => {
      const deferred = defer();
      lifecycle.onBeforeDataCollectionRequest.mockReturnValue(deferred.promise);
      eventManager.sendEvent(event);
      return flushPromiseChains()
        .then(() => {
          expect(lifecycle.onBeforeDataCollectionRequest).toHaveBeenCalled();
          expect(sendEdgeNetworkRequest).not.toHaveBeenCalled();
          deferred.resolve();
          return flushPromiseChains();
        })
        .then(() => {
          expect(sendEdgeNetworkRequest).toHaveBeenCalled();
        });
    });

    test("calls onResponse callbacks on response", () => {
      const onResponseForOnBeforeEvent = jest.fn();
      const onResponseForOnBeforeDataCollection = jest.fn();
      lifecycle.onBeforeEvent.mockImplementation(({ onResponse }) => {
        onResponse(onResponseForOnBeforeEvent);
        return Promise.resolve();
      });
      lifecycle.onBeforeDataCollectionRequest.mockImplementation(
        ({ onResponse }) => {
          onResponse(onResponseForOnBeforeDataCollection);
          return Promise.resolve();
        }
      );
      const response = { type: "response" };
      sendEdgeNetworkRequest.mockImplementation(
        ({ runOnResponseCallbacks }) => {
          runOnResponseCallbacks({ response });
          return Promise.resolve();
        }
      );
      return eventManager.sendEvent(event).then(() => {
        expect(onResponseForOnBeforeEvent).toHaveBeenCalledWith({ response });
        expect(onResponseForOnBeforeDataCollection).toHaveBeenCalledWith({
          response
        });
      });
    });

    test("calls onRequestFailure callbacks on request failure", () => {
      const onRequestFailureForOnBeforeEvent = jest.fn();
      const onRequestFailureForOnBeforeDataCollection = jest.fn();
      lifecycle.onBeforeEvent.mockImplementation(({ onRequestFailure }) => {
        onRequestFailure(onRequestFailureForOnBeforeEvent);
        return Promise.resolve();
      });
      lifecycle.onBeforeDataCollectionRequest.mockImplementation(
        ({ onRequestFailure }) => {
          onRequestFailure(onRequestFailureForOnBeforeDataCollection);
          return Promise.resolve();
        }
      );
      sendEdgeNetworkRequest.mockImplementation(
        ({ runOnRequestFailureCallbacks }) => {
          const error = new Error();
          runOnRequestFailureCallbacks({ error });
          throw error;
        }
      );
      return eventManager
        .sendEvent(event)
        .then(fail)
        .catch(e => {
          expect(onRequestFailureForOnBeforeEvent).toHaveBeenCalledWith({
            error: e
          });
          expect(
            onRequestFailureForOnBeforeDataCollection
          ).toHaveBeenCalledWith({
            error: e
          });
        });
    });

    test("sends request using interact endpoint if the document will not unload", () => {
      event.getDocumentMayUnload.mockReturnValue(false);
      return eventManager.sendEvent(event).then(() => {
        expect(sendEdgeNetworkRequest).toHaveBeenCalledWith({
          payload: requestPayload,
          action: "interact",
          runOnResponseCallbacks: expect.any(Function),
          runOnRequestFailureCallbacks: expect.any(Function)
        });
      });
    });

    test("sends request using collect endpoint if the document may unload", () => {
      event.getDocumentMayUnload.mockReturnValue(true);
      return eventManager.sendEvent(event).then(() => {
        expect(sendEdgeNetworkRequest).toHaveBeenCalledWith({
          payload: requestPayload,
          action: "collect",
          runOnResponseCallbacks: expect.any(Function),
          runOnRequestFailureCallbacks: expect.any(Function)
        });
      });
    });

    test.only("fails returned promise if request fails", () => {
      sendEdgeNetworkRequest.mockReturnValue(
        Promise.reject(new Error("no connection"))
      );
      return expect(eventManager.sendEvent(event)).rejects.toThrow(
        "no connection"
      );
    });
  });
});
