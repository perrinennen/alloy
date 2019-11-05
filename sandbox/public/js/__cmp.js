/*
    This is a mock __cmp object. Supported APIs:

    - getVendorConsents:
        - arg: vendorIds
        - callback(VendorConsents) -> View Types below

    - getConsentData:
        - arg: consentStringVersion (null for latest)
        - callback(VendorConsentData) -> View Types below

    Supported Methods:

    - configure({ timeout, vendorConsents, consentData })
        - timeout: how long do you want the APIs to wait, in ms. Defaults to 50.
        - vendorConsents: to replace the mock.
        - consentData: to replace the mock.


    Types:

    VendorConsents:
    --------------
    This object contains the global purposes, and vendors, consented to by the user:

    {
        metadata: [base64url-encoded] string (header data from the vendor consent format),
        gdprApplies: *Boolean*,
        hasGlobalScope: *Boolean,
        purposeConsents: {
            *purposeId*: *consentBoolean*,
            ?
        },
        vendorConsents: { // NOTE: If vendorIDs was provided, those are the IDs you will see in this object.
            *vendorId* : *consentBoolean*,
            ?
        }
    }

    VendorConsentData:
    ------------------
    This object contains the entire base64url-encoded string of the vendor consent data:

    {
        consentData:  [base64url-encoded] encoded string,
        gdprApplies:  *Boolean*,
        hasGlobalScope: *Boolean
    }
*/

(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined"
    ? (module.exports = factory())
    : typeof define === "function" && define.amd
    ? define(factory)
    : (global.__cmp = factory());
})(this, function() {
  "use strict";

  var mockVendorConsents = {
    metadata: "BOJObISOJObISAABAAENAA4AAAAAoAAA",
    gdprApplies: true,
    hasGlobalScope: true,
    purposeConsents: {
      1: true,
      2: true,
      3: false,
      4: true,
      5: true
    },
    vendorConsents: {
      14: true,
      78: false,
      42: false,
      255: true,
      264: true,
      565: true
    }
  };

  // BOWgbk8OWgbk8ABABAENBq-AAAAht7_______9______9uz_Gv_v_f__33e8__9v_l_7_-___u_-33d4-_1vX99yfm1-7ftr3tp_86ues2_Xur_959_-njE
  var mockVendorConsentData = {
    version1: {
      consentData:
        "BOWgbk8OWgbk8ABABAENBq-AAAAht7_______9______9uz_Gv_v_f__33e8__9v_l_7_-___u_-33d4-_1vX99yfm1-7ftr3tp_86ues2_Xur_959_-njE",
      gdprApplies: true,
      hasGlobalScope: false
    }
  };

  var timeout = 50;
  var waitForPingToResolve = false;
  var vendorConsents = mockVendorConsents;
  var consentData = mockVendorConsentData;
  var consentsInterval;
  var dataInterval;

  function __cmp(apiName, args, callback) {
    // args: array.
    if (apiName) {
      if (apiName === "getVendorConsents") {
        if (waitForPingToResolve) {
          if (!consentsInterval) {
            consentsInterval = setInterval(function() {
              __cmp("getVendorConsents", args, callback);
            }, 50);
          }
          return;
        }

        clearInterval(consentsInterval);
        consentsInterval = null;
        setTimeout(function() {
          // Filter `vendorConsents.vendorConsents` to include the IDs in args only.
          if (Array.isArray(args) && args.length) {
            vendorConsents.vendorConsents = args.reduce(function(
              allVendors,
              id
            ) {
              allVendors[id] = vendorConsents.vendorConsents[id];
              return allVendors;
            },
            {});
          }
          callback(vendorConsents, true);
        }, timeout);
      }

      if (apiName === "getConsentData") {
        if (waitForPingToResolve) {
          if (!dataInterval) {
            dataInterval = setInterval(function() {
              __cmp("getConsentData", args, callback);
            }, 50);
          }
          return;
        }

        clearInterval(dataInterval);
        dataInterval = null;
        setTimeout(function() {
          callback(consentData[args || "version1"], true);
        }, timeout);
      }
    }
  }

  __cmp.configure = function(options) {
    timeout = options.timeout || timeout;
    vendorConsents = options.vendorConsents || vendorConsents;
    consentData = options.consentData || consentData;
    waitForPingToResolve =
      typeof options.waitForPingToResolve !== "undefined"
        ? options.waitForPingToResolve
        : waitForPingToResolve;
  };

  __cmp.reset = function() {
    __cmp.configure({
      timeout: 50,
      waitForPingToResolve: false,
      vendorConsents: mockVendorConsents,
      consentData: mockVendorConsentData
    });
  };

  window.__cmp = __cmp;

  return __cmp;
});
