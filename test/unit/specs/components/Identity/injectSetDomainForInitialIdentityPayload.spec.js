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

import injectSetDomainForInitialIdentityPayload from "../../../../../src/components/Identity/injectSetDomainForInitialIdentityPayload";

describe("Identity::injectSetDomainForInitialIdentityPayload", () => {
  let payload;
  let thirdPartyCookiesEnabled;
  let areThirdPartyCookiesSupportedByDefault;
  let setDomainForInitialIdentityPayload;

  const build = () => {
    setDomainForInitialIdentityPayload = injectSetDomainForInitialIdentityPayload(
      {
        thirdPartyCookiesEnabled,
        areThirdPartyCookiesSupportedByDefault
      }
    );
  };

  beforeEach(() => {
    payload = {
      useIdThirdPartyDomain: jest.fn()
    };
    areThirdPartyCookiesSupportedByDefault = jest.fn();
  });

  test("does not use third-party domain if third-party cookies are disabled", () => {
    thirdPartyCookiesEnabled = false;
    areThirdPartyCookiesSupportedByDefault.mockReturnValue(true);
    build();
    setDomainForInitialIdentityPayload(payload);
    expect(payload.useIdThirdPartyDomain).not.toHaveBeenCalled();
  });

  test("does not use third-party domain if third-party cookies are not supported by the browser by default", () => {
    thirdPartyCookiesEnabled = true;
    areThirdPartyCookiesSupportedByDefault.mockReturnValue(false);
    build();
    setDomainForInitialIdentityPayload(payload);
    expect(areThirdPartyCookiesSupportedByDefault).toHaveBeenCalledWith(
      expect.any(String)
    );
    expect(payload.useIdThirdPartyDomain).not.toHaveBeenCalled();
  });

  test("uses third-party domain if third-party cookies are enabled and supported by the browser by default", () => {
    thirdPartyCookiesEnabled = true;
    areThirdPartyCookiesSupportedByDefault.mockReturnValue(true);
    build();
    setDomainForInitialIdentityPayload(payload);
    expect(areThirdPartyCookiesSupportedByDefault).toHaveBeenCalledWith(
      expect.any(String)
    );
    expect(payload.useIdThirdPartyDomain).toHaveBeenCalled();
  });
});
