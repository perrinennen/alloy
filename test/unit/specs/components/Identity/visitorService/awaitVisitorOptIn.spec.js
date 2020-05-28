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

import awaitVisitorOptIn from "../../../../../../src/components/Identity/visitorService/awaitVisitorOptIn";

const logger = {
  log() {}
};

describe("awaitVisitorOptIn", () => {
  beforeEach(() => {
    window.adobe = undefined;
  });

  afterAll(() => {
    window.adobe = undefined;
  });

  describe("No legacy opt in object is present", () => {
    test("should return promise resolved with undefined", () => {
      return expect(awaitVisitorOptIn({ logger })).resolves.toBeUndefined();
    });
  });

  describe("Legacy opt in object is present and gives approval", () => {
    test("should return promise resolved with undefined", () => {
      window.adobe = {
        optIn: {
          fetchPermissions(callback) {
            setTimeout(callback, 0);
          },
          isApproved() {
            return true;
          },
          Categories: {
            ECID: "ecid"
          }
        }
      };

      return expect(awaitVisitorOptIn({ logger })).resolves.toBeUndefined();
    });
  });

  describe("Legacy opt in object is present and gives denial", () => {
    test('should return promise rejected with new Error("Legacy opt-in was declined.")', () => {
      window.adobe = {
        optIn: {
          fetchPermissions(callback) {
            setTimeout(callback, 0);
          },
          isApproved() {
            return false;
          },
          Categories: {
            ECID: "ecid"
          }
        }
      };

      return expect(awaitVisitorOptIn({ logger })).rejects.toThrow(
        "Legacy opt-in was declined."
      );
    });
  });
});
