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

import attachClickActivityCollector from "../../../../../src/components/ActivityCollector/attachClickActivityCollector";

describe("ActivityCollector::attachClickActivityCollector", () => {
  const cfg = {};
  let eventManager;
  let lifecycle;
  let clickHandler;
  beforeEach(() => {
    cfg.clickCollectionEnabled = true;
    eventManager = {
      createEvent: () => {
        return {
          isEmpty: () => true
        };
      },
      sendEvent: () => {
        return Promise.resolve();
      }
    };
    lifecycle = {
      onClick: jest.fn(() => Promise.resolve())
    };
    // eslint-disable-next-line no-unused-vars
    jest
      .spyOn(document, "addEventListener")
      .mockImplementation((name, handler, type) => {
        clickHandler = handler;
      });
  });

  test("Attaches click handler if clickCollectionEnabled is set to true", () => {
    attachClickActivityCollector(cfg, eventManager, lifecycle);
    expect(document.addEventListener).toHaveBeenCalled();
  });

  test("Does not attach click handler if clickCollectionEnabled is set to false", () => {
    cfg.clickCollectionEnabled = false;
    attachClickActivityCollector(cfg, eventManager, lifecycle);
    expect(document.addEventListener).not.toHaveBeenCalled();
  });

  test("Publishes onClick lifecycle events at clicks when clickCollectionEnabled is set to true", () => {
    attachClickActivityCollector(cfg, eventManager, lifecycle);
    clickHandler({});
    expect(lifecycle.onClick).toHaveBeenCalled();
  });

  test("Augments error that occurs inside onClick lifecycle", () => {
    lifecycle.onClick.mockReturnValueOnce(
      Promise.reject(new Error("Bad thing happened."))
    );
    attachClickActivityCollector(cfg, eventManager, lifecycle);
    return expect(clickHandler({})).rejects.toThrow(
      "Failed to track click\nCaused by: Bad thing happened."
    );
  });

  test("Sends populated events", () => {
    eventManager.createEvent = () => {
      return {
        isEmpty: () => false
      };
    };
    jest.spyOn(eventManager, "sendEvent");
    attachClickActivityCollector(cfg, eventManager, lifecycle);
    return clickHandler({}).then(() => {
      expect(eventManager.sendEvent).toHaveBeenCalled();
    });
  });

  test("Does not send empty events", () => {
    jest.spyOn(eventManager, "sendEvent");
    attachClickActivityCollector(cfg, eventManager, lifecycle);
    return clickHandler({}).then(() => {
      expect(eventManager.sendEvent).not.toHaveBeenCalled();
    });
  });

  test("returns undefined", () => {
    eventManager.createEvent = () => {
      return {
        isEmpty: () => false
      };
    };
    attachClickActivityCollector(cfg, eventManager, lifecycle);
    return clickHandler({}).then(result => {
      expect(result).toBe(undefined);
    });
  });
});
