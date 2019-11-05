(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined"
    ? factory()
    : typeof define === "function" && define.amd
    ? define(factory)
    : factory();
})(this, function() {
  "use strict";

  var makeEmitter = function makeEmitter(target) {
    var events = {};

    target.on = function(eventName, callback, context) {
      if (!callback || typeof callback !== "function") {
        throw new Error("[ON] Callback should be a function.");
      }

      if (!events.hasOwnProperty(eventName)) {
        events[eventName] = [];
      }

      var subscriptionIndex =
        events[eventName].push({
          callback: callback,
          context: context
        }) - 1;

      return function() {
        events[eventName].splice(subscriptionIndex, 1);

        if (!events[eventName].length) {
          delete events[eventName];
        }
      };
    };

    target.publish = function(eventName) {
      if (!events.hasOwnProperty(eventName)) {
        return;
      }
      var data = [].slice.call(arguments, 1);

      events[eventName].forEach(function(eventMetadata) {
        eventMetadata.callback.apply(eventMetadata.context, data);
      });
    };

    return target.publish;
  };

  const STATUS = {
    PENDING: "pending",
    CHANGED: "changed",
    COMPLETE: "complete"
  };

  // TODO Convert the values to objects to be able to be more
  // granular when choosing categories.
  // e.g: ANALYTICS: { name: "analytics", useEcid: false }
  const CATEGORIES = {
    AAM: "aam",
    ADCLOUD: "adcloud",
    ANALYTICS: "aa",
    CAMPAIGN: "campaign",
    ECID: "ecid",
    LIVEFYRE: "livefyre",
    TARGET: "target",
    VIDEO_ANALYTICS: "videoaa"
  };

  const VENDOR_IDS = {
    [CATEGORIES.AAM]: 565, // TODO: Get the final Vendor ID.
    [CATEGORIES.ECID]: 565 // NOTE: We are using the same ID for ECID because it follows the same buckets.
  };

  const CATEGORY_PURPOSES = {
    [CATEGORIES.AAM]: [1, 2, 5],
    [CATEGORIES.ECID]: [1, 2, 5] // TODO: Confirm this!
  };

  const CATEGORIES_VALUES = Object.values(CATEGORIES);

  function isObjectEmpty(obj) {
    return obj === Object(obj) && Object.keys(obj).length === 0;
  }

  function isCallbackValid(callback) {
    return (
      typeof callback === "function" ||
      (callback instanceof Array && callback.length)
    );
  }

  var callbackRegistryFactory = function callbackRegistryFactory() {
    var registry = {};
    registry.callbacks = Object.create(null);

    registry.add = function(key, callback) {
      if (!isCallbackValid(callback)) {
        throw new Error(
          "[callbackRegistryFactory] Make sure callback is a function or an array of functions."
        );
      }

      registry.callbacks[key] = registry.callbacks[key] || [];
      var index = registry.callbacks[key].push(callback) - 1;

      return function() {
        registry.callbacks[key].splice(index, 1);
      };
    };

    registry.execute = function(key, args) {
      if (registry.callbacks[key]) {
        args = typeof args === "undefined" ? [] : args;
        args = args instanceof Array ? args : [args];

        try {
          while (registry.callbacks[key].length) {
            var callback = registry.callbacks[key].shift();

            if (typeof callback === "function") {
              callback.apply(null, args);
            } else if (callback instanceof Array) {
              callback[1].apply(callback[0], args);
            }

            // TODO: Throw an error if the callback is neither, or don't add it in the first place.
          }

          delete registry.callbacks[key];
        } catch (ex) {
          // Fail gracefully and silently.
        }
      }
    };

    registry.executeAll = function(paramsMap, forceExecute) {
      if (!forceExecute && (!paramsMap || isObjectEmpty(paramsMap))) {
        return;
      }

      Object.keys(registry.callbacks).forEach(function(key) {
        var value = paramsMap[key] !== undefined ? paramsMap[key] : "";
        registry.execute(key, value);
      }, registry);
    };

    registry.hasCallbacks = function() {
      return Boolean(Object.keys(registry.callbacks).length);
    };

    return registry;
  };

  const is = (el, type) => typeof el === type;

  const toArray = (arg, fallback) => {
    if (arg instanceof Array) {
      return arg;
    } else if (is(arg, "string")) {
      return [arg];
    }

    return fallback || [];
  };

  const areAllValuesTrue = obj => {
    const keys = Object.keys(obj);
    return !keys.length
      ? false
      : keys.every(key => {
          return obj[key] === true;
        });
  };

  const areValidCategories = catKeys => {
    if (!catKeys || isEmptyArray(catKeys)) {
      return false;
    }
    // `every` will return `true` if empty array, so we guard against it in the previous exp.
    return toArray(catKeys).every(cat => {
      return CATEGORIES_VALUES.indexOf(cat) > -1;
    });
  };

  const toObject = (list, value) => {
    return list.reduce((result, item) => {
      result[item] = value;
      return result;
    }, {});
  };

  const clone = obj => JSON.parse(JSON.stringify(obj));

  const isEmptyArray = arg =>
    Object.prototype.toString.call(arg) === "[object Array]" && !arg.length;

  const parse = jsonString => {
    if (isObject(jsonString)) {
      return jsonString;
    }

    try {
      return JSON.parse(jsonString);
    } catch (ex) {
      return {};
    }
  };

  const areValidPermissions = str => {
    if (str === undefined) {
      // `existingPermissions` is an optional arg!
      return true;
    }

    return isObject(str)
      ? areValidCategories(Object.keys(str))
      : isStringifiedJsonCategories(str);
  };

  const isStringifiedJsonCategories = str => {
    try {
      const parsedStr = JSON.parse(str);
      return (
        !!str && is(str, "string") && areValidCategories(Object.keys(parsedStr))
      );
    } catch (ex) {
      return false;
    }
  };

  const isObject = arg => {
    return arg !== null && is(arg, "object") && Array.isArray(arg) === false;
  };

  const noop = () => {};

  const normalize = param => (is(param, "function") ? param() : param);

  const handleInvalidPermissions = (permissions, errorMsg) => {
    if (!areValidPermissions(permissions)) {
      // TODO Consider logging an error instead of throwing.
      throw new Error(`[OptIn] ${errorMsg}`);
    }
  };

  const getUniqueValues = obj => {
    return Object.values(obj).filter((v, i, arr) => arr.indexOf(v) === i);
  };

  function makeStorage({ isEnabled, cookieName } = {}, { cookies } = {}) {
    if (!isEnabled || !cookieName || !cookies) {
      return {
        get: noop,
        set: noop,
        remove: noop
      };
    }

    return {
      remove: function() {
        cookies.remove(cookieName);
      },
      get: function() {
        var cookieValue = cookies.get(cookieName);
        var approvalsObj = {};

        try {
          // TODO Validate cookie content.
          approvalsObj = JSON.parse(cookieValue);
        } catch (ex) {
          // Fail gracefully and silently.
          approvalsObj = {};
        }
        return approvalsObj;
      },
      set: function(value, config) {
        // Serialize approvals.
        config = config || {};

        cookies.set(cookieName, JSON.stringify(value), {
          domain: config.optInCookieDomain || "",
          cookieLifetime: config.optInStorageExpiry || 34190000, // Default is 13 months in seconds
          expires: true
        });
      }
    };
  }

  // options: { command, params ?, callback }
  // command: "pluginName.apiName"
  // We abstract the access to the plugins in case of API or design changes,
  // clients don't have to change their implementations, or update their Launch extensions.

  const makeCommand = plugins => ({
    command,
    params = {},
    callback = noop
  } = {}) => {
    if (!command || !command.includes(".")) {
      throw new Error("[OptIn.plugins] Please provide a valid command.");
    }

    try {
      const parts = command.split(".");
      const plugin = plugins[parts[0]];
      const apiName = parts[1];

      if (!plugin || typeof plugin[apiName] !== "function") {
        throw new Error(
          "[OptIn.plugins] Make sure the plugin and API name exist."
        );
      }

      const args = Object.assign(params, { callback });
      plugin[apiName].call(plugin, args);
    } catch (ex) {
      throw new Error("[OptIn.plugins] Something went wrong:" + ex.message);
    }
  };

  function TimeoutError(message) {
    this.name = this.constructor.name;
    this.message = message;

    // This will print TimeoutError in the stack, and not Error.
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error(message).stack;
    }
  }

  TimeoutError.prototype = Object.create(Error.prototype);
  TimeoutError.prototype.constructor = TimeoutError;

  const REGISTRY_KEY = "fetchPermissions";
  const REGISTER_ERROR = "[OptIn#registerPlugin] Plugin is invalid.";

  function OptIn(
    {
      doesOptInApply,
      previousPermissions,
      preOptInApprovals,
      isOptInStorageEnabled,
      optInCookieDomain,
      optInStorageExpiry,
      isIabContext
    } = {},
    { cookies } = {}
  ) {
    const previousPermissionsValue = normalize(previousPermissions);
    // TODO Rethink this whole validation then parsing. Maybe they should be one step.
    handleInvalidPermissions(
      previousPermissionsValue,
      "Invalid `previousPermissions`!"
    );
    handleInvalidPermissions(preOptInApprovals, "Invalid `preOptInApprovals`!");

    const storage = makeStorage(
      {
        isEnabled: !!isOptInStorageEnabled,
        cookieName: "adobeujs-optin"
      },
      {
        cookies: cookies
      }
    );

    const self = this;
    const publish = makeEmitter(self);
    const registry = callbackRegistryFactory();
    const previousPermissionsObj = parse(previousPermissionsValue);
    const preOptInApprovalsObj = parse(preOptInApprovals);
    const cookieApprovalsObj = storage.get();
    const plugins = {};

    let status = initializeStatus(previousPermissionsObj);

    // Format: { [category value]: boolean }
    let permissions = initializePermissions(
      preOptInApprovalsObj,
      previousPermissionsObj,
      cookieApprovalsObj
    );
    // preCompletePermissions: Used as intermediary permissions between pending and complete statuses.
    let preCompletePermissions = clone(permissions);

    const setStatus = newStatus => (status = newStatus);
    const setPermissions = newPermissions => (permissions = newPermissions);

    self.deny = updatePermissions(false);
    self.approve = updatePermissions(true);

    self.denyAll = self.deny.bind(self, CATEGORIES_VALUES);
    self.approveAll = self.approve.bind(self, CATEGORIES_VALUES);

    self.isApproved = function(categories) {
      return checkForApproval(categories, self.permissions);
    };

    self.isPreApproved = function(categories) {
      return checkForApproval(categories, preOptInApprovalsObj);
    };

    // Returns a function:
    // - 'shouldAutoSubscribe' = false: noop
    // - 'shouldAutoSubscribe' = true: optIn.off (To unsubscribe)
    self.fetchPermissions = function(callback, shouldAutoSubscribe = false) {
      const result = shouldAutoSubscribe
        ? self.on(STATUS.COMPLETE, callback)
        : noop;
      const hasPermissions =
        !doesOptInApply ||
        (doesOptInApply && self.isComplete) ||
        !!preOptInApprovals;
      // Call the callback if `preOptInApprovals`, even if status `pending`.
      if (hasPermissions) {
        callback(self.permissions);
      } else if (!shouldAutoSubscribe) {
        registry.add(REGISTRY_KEY, () => callback(self.permissions));
      }

      return result;
    };

    self.complete = function() {
      if (self.status === STATUS.CHANGED) {
        completeAndPublish();
      }
    };

    self.registerPlugin = plugin => {
      if (!plugin || !plugin.name || typeof plugin.onRegister !== "function") {
        throw new Error(REGISTER_ERROR);
      }

      if (plugins[plugin.name]) {
        return;
      }

      plugins[plugin.name] = plugin;
      plugin.onRegister.call(plugin, self);
    };

    self.execute = makeCommand(plugins);

    Object.defineProperties(self, {
      permissions: {
        get() {
          return permissions;
        }
      },
      status: {
        get() {
          return status;
        }
      },
      Categories: {
        get() {
          return CATEGORIES;
        }
      },
      doesOptInApply: {
        get() {
          return !!doesOptInApply;
        }
      },
      isPending: {
        get() {
          return self.status === STATUS.PENDING;
        }
      },
      isComplete: {
        get() {
          return self.status === STATUS.COMPLETE;
        }
      },
      __plugins: {
        get() {
          return Object.keys(plugins);
        }
      },
      isIabContext: {
        get() {
          return isIabContext;
        }
      }
    });

    function checkForApproval(categories, permissionsSource) {
      const categoryList = toArray(categories);
      return !categoryList.length
        ? areAllValuesTrue(permissionsSource)
        : categoryList.every(function(category) {
            return !!permissionsSource[category];
          });
    }

    function initializeStatus(previousPermissionsObj) {
      return areValidPermissions(previousPermissionsObj)
        ? STATUS.COMPLETE
        : STATUS.PENDING;
    }

    // NOTE: previousPermissions will overrwrite pre-opt in an default permissions.
    function initializePermissions(
      preOptInApprovalsObj,
      previousPermissionsObj,
      cookieApprovalsObj
    ) {
      // If `doesOptInApply` is true, default all permissions to false; otherwise default to true.
      let defaultPermissions = toObject(CATEGORIES_VALUES, !doesOptInApply);
      // If `doesOptInApply` is false, always return default permissions. Otherwise assign in priority order
      return !doesOptInApply
        ? defaultPermissions
        : Object.assign(
            {},
            defaultPermissions,
            preOptInApprovalsObj,
            previousPermissionsObj,
            cookieApprovalsObj
          );
    }

    function completeAndPublish() {
      setPermissions(preCompletePermissions);
      setStatus(STATUS.COMPLETE);
      publish(self.status, self.permissions); // TODO Consider publishing a `change` event always.
      storage.set(self.permissions, { optInCookieDomain, optInStorageExpiry });
      registry.execute(REGISTRY_KEY);
    }

    function updatePermissions(isApproved) {
      return function(categories, shouldWaitForComplete) {
        if (!areValidCategories(categories)) {
          throw new Error(
            "[OptIn] Invalid category(-ies). Please use the `OptIn.Categories` enum."
          );
        }

        setStatus(STATUS.CHANGED);
        Object.assign(
          preCompletePermissions,
          toObject(toArray(categories), isApproved)
        );

        if (!shouldWaitForComplete) {
          // Complete flow.
          completeAndPublish();
        }

        return self;
      };
    }
  }

  // TODO: Document this enum!
  OptIn.Categories = CATEGORIES;
  OptIn.TimeoutError = TimeoutError;

  function makeTimedCallback(originalCallback, timeout) {
    if (typeof timeout === "undefined") {
      return originalCallback;
    }

    let timer = setTimeout(onTimeout, timeout);

    function onTimeout() {
      timer = null;
      originalCallback.call(
        originalCallback,
        new TimeoutError("The call took longer than you wanted!")
      );
    }

    function callbackWithTimer() {
      if (timer) {
        clearTimeout(timer);
        originalCallback.apply(originalCallback, arguments);
      }
    }

    return callbackWithTimer;
  }

  const throwIfNoCmp = () => {
    throw new Error("[IAB Plugin] A __cmp is required.");
  };

  function IAB(__cmp = throwIfNoCmp()) {
    const self = this;
    self.name = "iabPlugin";
    self.version = "0.0.1";

    const state = {
      allConsentData: null // `doesGdprApply`-`purposesConsent`-`vendorConsents`-`consentString`.
    };

    const setState = (key, value = {}) => (state[key] = value);

    self.fetchConsentData = ({ callback, timeout }) => {
      const callbackWithTimer = makeTimedCallback(callback, timeout);
      fetchConsentData({ callback: callbackWithTimer });
    };

    self.isApproved = ({ callback, category, timeout }) => {
      if (state.allConsentData) {
        return callback(
          null,
          isApproved(
            category,
            state.allConsentData.vendorConsents,
            state.allConsentData.purposeConsents
          )
        );
      }

      const callbackWithTimer = makeTimedCallback(
        (error, { vendorConsents, purposeConsents } = {}) => {
          callback(
            error,
            isApproved(category, vendorConsents, purposeConsents)
          );
        },
        timeout
      );
      fetchConsentData({ category, callback: callbackWithTimer });
    };

    self.onRegister = optIn => {
      // On register, retrieve IAB vendor consents for all current vendors with IDs.
      // If consent was found, set that approval status for those vendors in OptIn.
      const allVendors = Object.keys(VENDOR_IDS);
      const callback = (
        error,
        { purposeConsents, gdprApplies, vendorConsents } = {}
      ) => {
        if (!error && gdprApplies && vendorConsents && purposeConsents) {
          allVendors.forEach(vendor => {
            const isVendorApproved = isApproved(
              vendor,
              vendorConsents,
              purposeConsents
            );
            const action = isVendorApproved ? "approve" : "deny";
            optIn[action](vendor, true);
          });
          optIn.complete();
        }
      };
      self.fetchConsentData({ callback });
    };

    // This function should fetch the following:
    // - `doesGdprApply`, `purposesConsent`, `vendorConsents`, `consentString` and `allConsentData`.
    // - It should call __cmp.getConsentData & __cmp.getVendorConsents, and aggregate the responses.
    const fetchConsentData = ({ callback }) => {
      if (state.allConsentData) {
        return callback(null, state.allConsentData);
      }

      let allConsentData = {};
      getVendorConsents(
        ({ purposeConsents, gdprApplies, vendorConsents } = {}, success) => {
          if (success) {
            allConsentData = { purposeConsents, gdprApplies, vendorConsents };
            setState("allConsentData", allConsentData);
          }
          getConsentData((data = {}, success) => {
            if (success) {
              allConsentData["consentString"] = data.consentData;
              setState("allConsentData", allConsentData);
            }
            callback(null, state.allConsentData);
          });
        }
      );
    };

    const getConsentData = callback => {
      // 'null' means get the latest version of the consent string.
      __cmp("getConsentData", null, callback);
    };

    const getVendorConsents = callback => {
      // NOTE: vendorID should be an array. For now, we are supporting one vendorId at a time.
      // FOR NOW, we are passing ALL the Adobe Vendor IDs.
      // TODO: Rethink filtering that by a category param.
      const vendorIds = getUniqueValues(VENDOR_IDS);
      __cmp("getVendorConsents", vendorIds, callback);
    };

    const isApproved = (
      category,
      vendorConsents = {},
      purposeConsents = {}
    ) => {
      const isVendorApproved = !!vendorConsents[VENDOR_IDS[category]];
      const arePurposesApproved = () =>
        CATEGORY_PURPOSES[category].every(purpose => purposeConsents[purpose]);
      return isVendorApproved && arePurposesApproved();
    };
  }

  window.OptIn = OptIn;
  window.IabPlugin = IAB;
});
