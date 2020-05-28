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

import injectAwaitIdentityCookie from "../../../../../src/components/Identity/injectAwaitIdentityCookie";

describe("Identity::injectAwaitIdentityCookie", () => {
  let identityCookieExists;
  let awaitIdentityCookie;
  let runOnResponseCallbacks;
  let onResponse;

  beforeEach(() => {
    identityCookieExists = true;
    const onResponseCallbacks = [];
    runOnResponseCallbacks = () => {
      onResponseCallbacks.forEach(callback => {
        callback();
      });
    };
    onResponse = callback => onResponseCallbacks.push(callback);
    awaitIdentityCookie = injectAwaitIdentityCookie({
      orgId: "org@adobe",
      doesIdentityCookieExist: () => identityCookieExists
    });
  });

  test("resolves promise if identity cookie exists after response", () => {
    const promise = awaitIdentityCookie(onResponse);
    runOnResponseCallbacks();
    return promise;
  });

  test("rejects promise if identity cookie does not exist after response", () => {
    identityCookieExists = false;
    const promise = awaitIdentityCookie(onResponse);
    const errorRegex = /verify that the org ID org@adobe configured/;
    expect(() => {
      runOnResponseCallbacks();
    }).toThrowError(errorRegex);
    return expect(promise).rejects.toThrow(errorRegex);
  });
});
