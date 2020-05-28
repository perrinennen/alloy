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

import createComponent from "../../../../../src/components/Identity/createComponent";
import { defer } from "../../../../../src/utils";
import flushPromiseChains from "../../../helpers/flushPromiseChains";

describe("Identity::createComponent", () => {
  let addEcidQueryToEvent;
  let identityManager;
  let ensureRequestHasIdentity;
  let setLegacyEcid;
  let handleResponseForIdSyncs;
  let getEcidFromResponse;
  let component;
  let getIdentity;
  let consentDeferred;
  let consent;
  let getIdentityDeferred;
  let validateSyncIdentityOptions;

  beforeEach(() => {
    addEcidQueryToEvent = jest.fn();
    identityManager = {
      addToPayload: jest.fn(() => undefined),
      sync: jest.fn(() => Promise.resolve())
    };
    ensureRequestHasIdentity = jest.fn();
    setLegacyEcid = jest.fn();
    handleResponseForIdSyncs = jest.fn();
    getEcidFromResponse = jest.fn();
    getIdentityDeferred = defer();
    consentDeferred = defer();
    consent = {
      awaitConsent: jest.fn(() => consentDeferred.promise)
    };
    getIdentity = jest.fn(() => getIdentityDeferred.promise);
    validateSyncIdentityOptions = () => {};
    component = createComponent({
      addEcidQueryToEvent,
      identityManager,
      ensureRequestHasIdentity,
      setLegacyEcid,
      handleResponseForIdSyncs,
      getEcidFromResponse,
      getIdentity,
      consent,
      validateSyncIdentityOptions
    });
  });

  test("adds ECID query to event", () => {
    const event = { type: "event" };
    component.lifecycle.onBeforeEvent({ event });
    expect(addEcidQueryToEvent).toHaveBeenCalledWith(event);
  });

  test("adds identities to request payload", () => {
    const payload = { type: "payload" };
    const onResponse = jest.fn();
    component.lifecycle.onBeforeRequest({ payload, onResponse });
    expect(identityManager.addToPayload).toHaveBeenCalledWith(payload);
  });

  test("ensures request has identity", () => {
    const payload = { type: "payload" };
    const onResponse = jest.fn();
    const ensureRequestHasIdentityPromise = Promise.resolve();
    ensureRequestHasIdentity.mockReturnValue(ensureRequestHasIdentityPromise);
    const result = component.lifecycle.onBeforeRequest({ payload, onResponse });
    expect(ensureRequestHasIdentity).toHaveBeenCalledWith({
      payload,
      onResponse
    });
    expect(result).toBe(ensureRequestHasIdentityPromise);
  });

  test("does not create legacy identity cookie if response does not contain ECID", () => {
    const idSyncsPromise = Promise.resolve();
    handleResponseForIdSyncs.mockReturnValue(idSyncsPromise);
    const response = { type: "response" };
    component.lifecycle.onResponse({ response });
    expect(getEcidFromResponse).toHaveBeenCalledWith(response);
    expect(setLegacyEcid).not.toHaveBeenCalled();
  });

  test("creates legacy identity cookie if response contains ECID", () => {
    const idSyncsPromise = Promise.resolve();
    handleResponseForIdSyncs.mockReturnValue(idSyncsPromise);
    getEcidFromResponse.mockReturnValue("user@adobe");
    const response = { type: "response" };
    component.lifecycle.onResponse({ response });
    expect(getEcidFromResponse).toHaveBeenCalledWith(response);
    expect(setLegacyEcid).toHaveBeenCalledWith("user@adobe");

    component.lifecycle.onResponse({ response });
    expect(getEcidFromResponse).toHaveBeenCalledTimes(1);
    expect(setLegacyEcid).toHaveBeenCalledTimes(1);
  });

  test("handles ID syncs", () => {
    const idSyncsPromise = Promise.resolve();
    handleResponseForIdSyncs.mockReturnValue(idSyncsPromise);
    const response = { type: "response" };
    const result = component.lifecycle.onResponse({ response });
    expect(handleResponseForIdSyncs).toHaveBeenCalledWith(response);
    return expect(result).resolves.toBeUndefined();
  });

  test("exposes options validator for syncIdentity command", () => {
    expect(component.commands.syncIdentity.optionsValidator).toBe(
      validateSyncIdentityOptions
    );
  });

  test("syncIdentity syncs identities", () => {
    const identity = { type: "identity" };
    return component.commands.syncIdentity.run({ identity }).then(result => {
      expect(identityManager.sync).toHaveBeenCalledWith(identity);
      expect(result).toBeUndefined();
    });
  });

  test("getIdentity command should make a request when ecid is not available", () => {
    const idSyncsPromise = Promise.resolve();
    handleResponseForIdSyncs.mockReturnValue(idSyncsPromise);
    const onResolved = jest.fn();
    component.commands.getIdentity
      .run({ namespaces: ["ECID"] })
      .then(onResolved);

    return flushPromiseChains()
      .then(() => {
        expect(getIdentity).not.toHaveBeenCalled();
        expect(onResolved).not.toHaveBeenCalled();
        consentDeferred.resolve();
        return flushPromiseChains();
      })
      .then(() => {
        expect(getIdentity).toHaveBeenCalled();
        getEcidFromResponse.mockReturnValue("user@adobe");
        const response = { type: "response" };
        component.lifecycle.onResponse({ response });
        getIdentityDeferred.resolve();
        return flushPromiseChains();
      })
      .then(() => {
        expect(onResolved).toHaveBeenCalledWith({
          identity: {
            ECID: "user@adobe"
          }
        });
      });
  });

  test("getIdentity command should not make a request when ecid is available", () => {
    const idSyncsPromise = Promise.resolve();
    handleResponseForIdSyncs.mockReturnValue(idSyncsPromise);
    getEcidFromResponse.mockReturnValue("user@adobe");
    const response = { type: "response" };
    component.lifecycle.onResponse({ response });
    const onResolved = jest.fn();
    component.commands.getIdentity.run().then(onResolved);
    return flushPromiseChains()
      .then(() => {
        expect(getIdentity).not.toHaveBeenCalled();
        expect(onResolved).not.toHaveBeenCalled();
        consentDeferred.resolve();
        return flushPromiseChains();
      })
      .then(() => {
        expect(getIdentity).not.toHaveBeenCalled();
        expect(onResolved).toHaveBeenCalledWith({
          identity: {
            ECID: "user@adobe"
          }
        });
      });
  });
});
