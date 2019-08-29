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

import createEvent from "./createEvent";
import { clone } from "../../utils";
import createClickActivityCollector from "./activity/click";
import { required, validDomain } from "../../utils/configValidators";

const createDataCollector = ({ config, logger }) => {
  const { imsOrgId } = config;
  let lifecycle;
  let network;
  let optIn;

  const makeServerCall = (event, documentUnloading) => {
    const payload = network.createPayload();
    payload.addEvent(event);
    payload.mergeMeta({
      gateway: {
        imsOrgId
      },
      collect: {
        imsToken:
          "eyJhbGciOiJSUzI1NiJ9.ew0KICAgICJleHAiOiAxNTY3MjY4Mjg3LA0KICAgICJpc3MiOiAiNTNBMTZBQ0I1Q0MxRDM3NjBBNDk1Qzk5QEFkb2JlT3JnIiwNCiAgICAic3ViIjogIjVEQkUxMzk3NUQ2N0Q0OUUwQTQ5NUU2NkB0ZWNoYWNjdC5hZG9iZS5jb20iLA0KICAgICJodHRwczovL2ltcy1uYTEuYWRvYmVsb2dpbi5jb20vcy9lbnRfZGF0YXNlcnZpY2VzX3NkayI6IHRydWUsDQogICAgImF1ZCI6ICJodHRwczovL2ltcy1uYTEuYWRvYmVsb2dpbi5jb20vYy9jY2I5OGI5YjNiYTk0MjI4YWNkY2M4YTE1MTAyZmI4NSINCn0.EQm6vX8ILNLliOEFM6KDS_3ploMbiKlk5plI1JT6iCrCnKArymBYgf9oWtlln_9oEmrfdpqtYsBDz0i66-D1rGpLGyvqj3ibpD3Tx6TANNrZTtnE4QqxWMimdwmsl749K9hhzAU1dK7mdHcVEZyOFbQsoSVz4nknQsf6GBuDI5LhUH7R44qxe8U1ZPrUZQAldmAVTL9IBUrDl7WGrF4krmGhhXMf26nBOHMADhEg6CLlTWQCRB_0Up9MwNq1BLuItFDtBGHEiJqMvJ7q3kE4J_4UmHQhqhAYpGj-l8iTmnwXxkfehZKME2L3tB6s2aRkRD448HEPHr8rfeAM4gVL8w",
        inletUrl:
          "https://dcs.adobedc.net/collection/b58b430c896bc3272c557e3a8a5f4b6f99b3cf06053a2aa51d8a8af2b0b816f4",
        datasetId: "5d4bef1132fd4a144e56f4f4",
        schemaId:
          "https://ns.adobe.com/atag/schemas/8e930c6afcecfc24e6758278178e8680",
        synchronousValidation: true
      }
    });

    return lifecycle
      .onBeforeDataCollection(payload)
      .then(() => {
        return network.sendRequest(
          payload,
          payload.expectsResponse,
          documentUnloading
        );
      })
      .then(response => {
        const data = {
          requestBody: clone(payload)
        };

        if (response) {
          data.responseBody = clone(response);
        }

        return data;
      });
  };

  const createEventHandler = options => {
    const event = createEvent();
    const {
      viewStart = false,
      documentUnloading = false,
      data,
      meta
    } = options;

    event.mergeData(data);
    event.mergeMeta(meta);

    return lifecycle
      .onBeforeEvent(event, options, viewStart, documentUnloading)
      .then(() => optIn.whenOptedIn())
      .then(() => makeServerCall(event, documentUnloading));
  };

  createClickActivityCollector(config, logger, createEventHandler);

  return {
    lifecycle: {
      onComponentsRegistered(tools) {
        ({ lifecycle, network, optIn } = tools);
      }
    },
    commands: {
      event: createEventHandler
    }
  };
};

createDataCollector.namespace = "DataCollector";
createDataCollector.abbreviation = "DC";
createDataCollector.configValidators = {
  propertyId: {
    validate: required
  },
  edgeDomain: {
    validate: validDomain,
    defaultValue: "alpha.konductor.adobedc.net"
  },
  imsOrgId: {
    validate: required
  },
  clickCollectionEnabled: {
    defaultValue: true
  }
};

export default createDataCollector;
