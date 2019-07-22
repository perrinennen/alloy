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

import { defer } from "../../utils";
import processIdSyncs from "./processIdSyncs";
import createEvent from "../DataCollector/createEvent";
import createCustomerIDsHash from "./createCustomerIDsHash";

const ECID_NAMESPACE = "ECID";

const addIdsContext = (payload, ecid) => {
  // TODO: Add customer ids.
  payload.addIdentity(ECID_NAMESPACE, {
    id: ecid
  });
};

const createIdentity = ({ config, logger, cookie }) => {
  const getEcid = () => cookie.get(ECID_NAMESPACE);

  let ecid = getEcid();
  let responseRequested = false;
  let deferredForEcid;
  let network;
  let lifecycle;
  const customerIDs = {};
  const getCustomerIDs = () => customerIDs;
  const makeServerCall = event => {
    const payload = network.createPayload();
    payload.addEvent(event);
    const responsePromise = Promise.resolve()
      .then(() => {
        return lifecycle.onBeforeDataCollection(payload, responsePromise);
      })
      .then(() => {
        return network.sendRequest(payload, true);
      });

    return responsePromise;
  };
  const setCustomerIDs = options => {
    const event = createEvent();
    const isViewStart = options.type === "viewStart";
    Object.keys(options.customerIDs).forEach(key => {
      customerIDs[key] = options.customerIDs[key];
    });
    event.mergeMeta(options.customerIDs);
    const customerIDsHash = createCustomerIDsHash(customerIDs);
    const hasSynced = customerIDsHash === cookie.get("CIDH");
    event.mergeMeta({ hasSynced });
    if (!hasSynced) {
      cookie.set("CIDH", customerIDsHash);
    }
    return lifecycle
      .onBeforeEvent(event, options, isViewStart)
      .then(() => makeServerCall(event));
  };

  const onBeforeEvent = event => {
    if (!ecid && !responseRequested) {
      event.expectResponse();
      responseRequested = true;
    }
  };

  // TO-DOCUMENT: We wait for ECID before trigger any events.
  const onBeforeDataCollection = payload => {
    payload.mergeMeta({
      identity: {
        lastSyncTS: 1222,
        containerId: 1
      }
    });

    let promise;

    if (ecid) {
      addIdsContext(payload, ecid);
    } else if (deferredForEcid) {
      // We don't have an ECID, but the first request has gone out to
      // fetch it. We must wait for the response to come back with the
      // ECID before we can apply it to this payload.
      logger.log("Delaying request while retrieving ECID from server.");
      promise = deferredForEcid.promise.then(() => {
        logger.log("Resuming previously delayed request.");
        addIdsContext(payload, ecid);
      });
    } else {
      // We don't have an ECID and no request has gone out to fetch it.
      // We won't apply the ECID to this request, but we'll set up a
      // promise so that future requests can know when the ECID has returned.
      deferredForEcid = defer();
    }

    return promise;
  };

  const onResponse = response => {
    const ecidPayload = response.getPayloadByType("identity:persist");

    if (ecidPayload) {
      ecid = ecidPayload.id;
      cookie.set(ECID_NAMESPACE, ecid);

      if (deferredForEcid) {
        deferredForEcid.resolve();
      }
    }

    const idSyncs = response.getPayloadByType("identity:exchange") || [];

    processIdSyncs({
      destinations: idSyncs,
      config,
      logger
    });
  };

  return {
    lifecycle: {
      onComponentsRegistered(tools) {
        ({ lifecycle, network } = tools);
      },
      onBeforeEvent,
      onBeforeDataCollection,
      onResponse
    },
    commands: {
      getEcid,
      setCustomerIDs,
      getCustomerIDs
    }
  };
};

createIdentity.namespace = "Identity";

createIdentity.configValidators = {
  idSyncsEnabled: {
    defaultValue: true
  }
};

export default createIdentity;
