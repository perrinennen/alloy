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

import injectSendNetworkRequest from "../../../../../src/core/network/injectSendNetworkRequest";

describe("injectSendNetworkRequest", () => {
  const url = "https://example.com";
  const payload = { a: "b" };
  const payloadJson = JSON.stringify(payload);
  const requestId = "RID123";

  let logger;

  const responseBody = { requestId: "myrequestid", handle: [] };
  const responseBodyJson = JSON.stringify(responseBody);

  let sendNetworkRequest;
  let networkStrategy;
  let isRetryableHttpStatusCode;

  beforeEach(() => {
    logger = {
      log: jest.fn()
    };
    logger.enabled = true;
    networkStrategy = jest.fn(() =>
      Promise.resolve({
        status: 200,
        body: responseBodyJson
      })
    );
    isRetryableHttpStatusCode = jest.fn(() => false);

    sendNetworkRequest = injectSendNetworkRequest({
      logger,
      networkStrategy,
      isRetryableHttpStatusCode
    });
  });

  test("sends the request", () => {
    return sendNetworkRequest({
      payload,
      url,
      requestId
    }).then(() => {
      expect(logger.log).toHaveBeenCalledWith(
        expect.stringMatching(/^Request .+: Sending request.$/),
        payload
      );
      expect(networkStrategy).toHaveBeenCalledWith(url, payloadJson);
    });
  });

  test("handles a response with a JSON body", () => {
    return sendNetworkRequest({
      payload,
      url,
      requestId
    }).then(response => {
      expect(logger.log).toHaveBeenCalledWith(
        expect.stringMatching(
          /^Request .+: Received response with status code 200 and response body:$/
        ),
        responseBody
      );
      expect(response).toEqual({
        statusCode: 200,
        body: responseBodyJson,
        parsedBody: responseBody
      });
    });
  });

  test("handles a response with a non-JSON body", () => {
    networkStrategy.mockReturnValue(
      Promise.resolve({
        status: 200,
        body: "non-JSON body"
      })
    );
    return sendNetworkRequest({
      payload,
      url,
      requestId
    }).then(response => {
      expect(logger.log).toHaveBeenCalledWith(
        expect.stringMatching(
          /^Request .+: Received response with status code 200 and response body:$/
        ),
        "non-JSON body"
      );
      expect(response).toEqual({
        statusCode: 200,
        body: "non-JSON body",
        parsedBody: undefined
      });
    });
  });

  test("handles a response with an empty body", () => {
    networkStrategy.mockReturnValue(
      Promise.resolve({
        status: 200,
        body: ""
      })
    );
    return sendNetworkRequest({
      payload,
      url,
      requestId
    }).then(response => {
      expect(logger.log).toHaveBeenCalledWith(
        expect.stringMatching(
          /^Request .+: Received response with status code 200 and no response body\.$/
        ),
        ""
      );
      expect(response).toEqual({
        statusCode: 200,
        body: "",
        parsedBody: undefined
      });
    });
  });

  test("rejects the promise when a network error occurs", () => {
    networkStrategy.mockReturnValue(Promise.reject(new Error("networkerror")));
    return sendNetworkRequest({
      payload,
      url,
      requestId
    })
      .then(fail)
      .catch(error => {
        expect(error.message).toEqual(
          "Network request failed.\nCaused by: networkerror"
        );
      });
  });

  test("resolves the promise for successful status and valid json", () => {
    return sendNetworkRequest({
      payload,
      url,
      requestId
    }).then(response => {
      expect(response).toEqual({
        statusCode: 200,
        body: responseBodyJson,
        parsedBody: responseBody
      });
    });
  });

  test(`retries certain status codes until success`, () => {
    isRetryableHttpStatusCode
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);
    return sendNetworkRequest({
      payload,
      url,
      requestId
    }).then(response => {
      expect(response).toEqual({
        statusCode: 200,
        body: responseBodyJson,
        parsedBody: responseBody
      });
      expect(networkStrategy).toHaveBeenCalledTimes(3);
    });
  });

  test(`retries certain status codes until max retries met`, () => {
    isRetryableHttpStatusCode
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true);
    return sendNetworkRequest({
      payload,
      url,
      requestId
    }).then(response => {
      expect(response).toEqual({
        statusCode: 200,
        body: responseBodyJson,
        parsedBody: responseBody
      });
      expect(networkStrategy).toHaveBeenCalledTimes(4);
    });
  });
});
