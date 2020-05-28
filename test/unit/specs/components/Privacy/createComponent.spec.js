/*
Copyright 2020 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import createComponent from "../../../../../src/components/Privacy/createComponent";
import { createTaskQueue, defer } from "../../../../../src/utils";
import flushPromiseChains from "../../../helpers/flushPromiseChains";

const createConsent = generalConsent => ({
  consent: [
    {
      standard: "Adobe",
      version: "1.0",
      value: {
        general: generalConsent
      }
    }
  ]
});
const CONSENT_IN = createConsent("in");
const CONSENT_OUT = createConsent("out");

describe("privacy:createComponent", () => {
  let readStoredConsent;
  let taskQueue;
  let defaultConsent;
  let consent;
  let sendSetConsentRequest;
  let validateSetConsentOptions;
  let component;

  beforeEach(() => {
    readStoredConsent = jest.fn();
    taskQueue = createTaskQueue();
    defaultConsent = "in";
    consent = {
      setConsent: jest.fn(),
      suspend: jest.fn()
    };
    sendSetConsentRequest = jest.fn();
    validateSetConsentOptions = jest.fn(options => options);
  });

  const build = () => {
    component = createComponent({
      readStoredConsent,
      taskQueue,
      defaultConsent,
      consent,
      sendSetConsentRequest,
      validateSetConsentOptions
    });
  };

  test("uses the default consent", () => {
    defaultConsent = "pending";
    readStoredConsent.mockReturnValue({});
    build();
    expect(consent.setConsent).toHaveBeenCalledWith({ general: "pending" });
  });

  test("uses the stored consent", () => {
    readStoredConsent.mockReturnValue({ general: "out" });
    build();
    expect(consent.setConsent).toHaveBeenCalledWith({ general: "out" });
  });

  test("handles the setConsent command", () => {
    defaultConsent = "pending";
    readStoredConsent
      .mockReturnValueOnce({})
      .mockReturnValueOnce({ general: "in" });
    build();
    sendSetConsentRequest.mockReturnValue(Promise.resolve());
    const onResolved = jest.fn();
    component.commands.setConsent.run(CONSENT_IN).then(onResolved);
    expect(consent.suspend).toHaveBeenCalled();
    return flushPromiseChains().then(() => {
      expect(sendSetConsentRequest).toHaveBeenCalledWith(CONSENT_IN.consent);
      expect(consent.setConsent).toHaveBeenCalledWith({ general: "in" });
      expect(onResolved).toHaveBeenCalledWith(undefined);
    });
  });

  test("updates the consent object even after a request failure", () => {
    defaultConsent = "pending";
    readStoredConsent
      .mockReturnValueOnce({})
      .mockReturnValueOnce({ general: "in" });
    build();
    sendSetConsentRequest.mockReturnValue(Promise.reject());
    component.commands.setConsent.run(CONSENT_IN);
    return flushPromiseChains().then(() => {
      expect(consent.setConsent).toHaveBeenCalledWith({ general: "in" });
    });
  });

  test("only updates the consent object after the response returns", () => {
    defaultConsent = "pending";
    readStoredConsent
      .mockReturnValueOnce({})
      .mockReturnValueOnce({ general: "in" });
    build();
    const deferredConsentRequest = defer();
    sendSetConsentRequest.mockReturnValue(deferredConsentRequest.promise);
    component.commands.setConsent.run(CONSENT_IN);
    return flushPromiseChains()
      .then(() => {
        expect(sendSetConsentRequest).toHaveBeenCalledWith(CONSENT_IN.consent);
        expect(consent.setConsent).not.toHaveBeenCalledWith({ general: "in" });
        deferredConsentRequest.resolve();
        return flushPromiseChains();
      })
      .then(() => {
        expect(consent.setConsent).toHaveBeenCalledWith({ general: "in" });
      });
  });

  test("only calls setConsent once with multiple consent requests", () => {
    defaultConsent = "pending";
    readStoredConsent
      .mockReturnValueOnce({})
      .mockReturnValueOnce({ general: "out" });
    build();
    const deferredConsentRequest1 = defer();
    const deferredConsentRequest2 = defer();
    sendSetConsentRequest
      .mockReturnValueOnce(deferredConsentRequest1.promise)
      .mockReturnValueOnce(deferredConsentRequest2.promise);
    component.commands.setConsent.run(CONSENT_IN);
    return flushPromiseChains()
      .then(() => {
        expect(sendSetConsentRequest).toHaveBeenCalledWith(CONSENT_IN.consent);
        component.commands.setConsent.run(CONSENT_OUT);
        deferredConsentRequest1.resolve();
        return flushPromiseChains();
      })
      .then(() => {
        expect(sendSetConsentRequest).toHaveBeenCalledWith(CONSENT_OUT.consent);
        deferredConsentRequest2.resolve();
        return flushPromiseChains();
      })
      .then(() => {
        expect(consent.setConsent).not.toHaveBeenCalledWith({ general: "in" });
        // one time to "pending", one time to "out"
        expect(consent.setConsent).toHaveBeenCalledTimes(2);
        expect(consent.setConsent).toHaveBeenCalledWith({ general: "out" });
      });
  });

  test("checks the cookie after an event", () => {
    readStoredConsent
      .mockReturnValueOnce({})
      .mockReturnValueOnce({ general: "out" });
    build();
    component.lifecycle.onResponse();
    expect(consent.setConsent).toHaveBeenCalledWith({ general: "out" });
  });

  test("checks the cookie after an error response", () => {
    readStoredConsent
      .mockReturnValueOnce({})
      .mockReturnValueOnce({ general: "out" });
    build();
    component.lifecycle.onRequestFailure();
    expect(consent.setConsent).toHaveBeenCalledWith({ general: "out" });
  });
});
