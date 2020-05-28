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

import executeActions from "../../../../../../src/components/Personalization/dom-actions/executeActions";

describe("Personalization::executeActions", () => {
  test("should execute actions", () => {
    const actionSpy = jest.fn(() => Promise.resolve(1));
    const logger = {
      error: jest.fn(),
      log: jest.fn()
    };
    logger.enabled = true;
    const actions = [{ type: "foo" }];
    const modules = {
      foo: actionSpy
    };

    return executeActions(actions, modules, logger).then(result => {
      expect(result).toEqual([1]);
      expect(actionSpy).toHaveBeenCalled();
      expect(logger.log.mock.calls.length).toEqual(1);
      expect(logger.error).not.toHaveBeenCalled();
    });
  });

  test("should not invoke logger.log when logger is not enabled", () => {
    const actionSpy = jest.fn(() => Promise.resolve(1));
    const logger = {
      error: jest.fn(),
      log: jest.fn()
    };
    logger.enabled = false;
    const actions = [{ type: "foo" }];
    const modules = {
      foo: actionSpy
    };
    return executeActions(actions, modules, logger).then(result => {
      expect(result).toEqual([1]);
      expect(actionSpy).toHaveBeenCalled();
      expect(logger.log.mock.calls.length).toEqual(0);
      expect(logger.error).not.toHaveBeenCalled();
    });
  });

  test("should throw error when execute actions fails", () => {
    const logger = {
      error: jest.fn(),
      log: jest.fn()
    };
    logger.enabled = true;
    const actions = [{ type: "foo" }];
    const modules = {
      foo: jest.fn(() => {
        throw new Error("foo's error");
      })
    };

    expect(() => executeActions(actions, modules, logger)).toThrowError();
  });

  test("should log nothing when there are no actions", () => {
    const logger = {
      error: jest.fn(),
      log: jest.fn()
    };
    const actions = [];
    const modules = {};

    return executeActions(actions, modules, logger).then(result => {
      expect(result).toEqual([]);
      expect(logger.log).not.toHaveBeenCalled();
      expect(logger.error).not.toHaveBeenCalled();
    });
  });

  test("should throw error when there are no actions types", () => {
    const logger = {
      error: jest.fn(),
      log: jest.fn()
    };
    logger.enabled = true;
    const actions = [{ type: "foo1" }];
    const modules = {
      foo: () => {}
    };
    expect(() => executeActions(actions, modules, logger)).toThrowError();
  });
});
