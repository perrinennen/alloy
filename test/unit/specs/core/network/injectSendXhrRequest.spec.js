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

import injectSendXhrRequest from "../../../../../src/core/network/injectSendXhrRequest";

describe("sendXhrRequest", () => {
  const url = "https://example.com/endpoint";
  let request;
  let XMLHttpRequest;
  let sendXhrRequest;
  let body;

  beforeEach(() => {
    request = {
      open: jest.fn(),
      setRequestHeader: jest.fn(),
      send: jest.fn(),
      onloadstart: jest.fn()
    };
    XMLHttpRequest = () => {
      return request;
    };
    sendXhrRequest = injectSendXhrRequest(XMLHttpRequest);
    body = { a: "b" };
  });

  test("sets the response type during onloadstart", () => {
    sendXhrRequest(url, body);
    expect(request.responseType).toBeUndefined();
    request.onloadstart();
    expect(request.responseType).toBe("text");
  });

  test("opens a POST", () => {
    sendXhrRequest(url, body);
    expect(request.open).toHaveBeenCalledWith("POST", url, true);
  });

  test("sets content type", () => {
    sendXhrRequest(url, body);
    expect(request.setRequestHeader).toHaveBeenCalledWith(
      "Content-Type",
      "text/plain; charset=UTF-8"
    );
  });

  test("disables credentials", () => {
    sendXhrRequest(url, body);
    expect(request.withCredentials).toBe(true);
  });

  test("rejects promise upon error", () => {
    const xhrPromise = sendXhrRequest(url, body);
    request.onerror(new Error("bad thing happened"));
    return xhrPromise.then(fail).catch(error => {
      expect(error.message).toBe("bad thing happened");
    });
  });

  test("rejects promise upon abort", () => {
    const xhrPromise = sendXhrRequest(url, body);
    request.onabort(new Error("bad thing happened"));
    return xhrPromise.then(fail).catch(error => {
      expect(error.message).toBe("bad thing happened");
    });
  });

  test("sends body", () => {
    sendXhrRequest(url, body);
    expect(request.send).toHaveBeenCalledWith(body);
  });

  test("resolves returned promise upon network success", () => {
    const xhrPromise = sendXhrRequest("https://example.com/endpoint", body);
    request.readyState = 4;
    request.responseText = "response text";
    request.status = 999;
    request.onreadystatechange();
    return xhrPromise.then(result => {
      expect(result).toEqual({
        status: 999,
        body: "response text"
      });
    });
  });
});
