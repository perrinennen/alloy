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

import injectExecuteCommand from "../../../../src/core/injectExecuteCommand";
import flushPromiseChains from "../../helpers/flushPromiseChains";

describe("injectExecuteCommand", () => {
  let logger;
  let handleError;

  beforeEach(() => {
    logger = {
      log: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };
    handleError = jest.fn(error => {
      throw error;
    });
  });

  test("rejects promise if configure is not the first command executed", () => {
    const executeCommand = injectExecuteCommand({
      logger,
      handleError
    });

    return executeCommand("event")
      .then(fail)
      .catch(error => {
        expect(error.message).toContain("The library must be configured first");
        expect(handleError).toHaveBeenCalledWith(error, "event");
      });
  });

  test("rejects promise if configure command is executed twice", () => {
    const configureCommand = () => Promise.resolve();
    const executeCommand = injectExecuteCommand({
      logger,
      configureCommand,
      handleError
    });

    executeCommand("configure");
    return executeCommand("configure")
      .then(fail)
      .catch(error => {
        expect(error.message).toContain(
          "The library has already been configured"
        );
        expect(handleError).toHaveBeenCalledWith(error, "configure");
      });
  });

  test("rejects promise if command doesn't exist", () => {
    const componentRegistry = {
      getCommand() {},
      getCommandNames() {
        return ["genuine"];
      }
    };
    const configureCommand = () => Promise.resolve(componentRegistry);
    const executeCommand = injectExecuteCommand({
      logger,
      configureCommand,
      handleError
    });
    executeCommand("configure");
    return executeCommand("bogus")
      .then(fail)
      .catch(error => {
        expect(error.message).toBe(
          "The bogus command does not exist. List of available commands: configure, setDebug, genuine."
        );
        expect(handleError).toHaveBeenCalledWith(error, "bogus");
      });
  });

  test("never resolves/rejects promise to any other command after configure fails", () => {
    const configureCommand = () => Promise.reject();
    const executeCommand = injectExecuteCommand({
      logger,
      configureCommand,
      handleError
    });

    executeCommand("configure");
    const thenSpy = jest.fn();
    const catchSpy = jest.fn();
    executeCommand("event")
      .then(thenSpy)
      .catch(catchSpy);
    return flushPromiseChains().then(() => {
      expect(logger.warn).toHaveBeenCalledWith(
        "An error during configuration is preventing the event command from executing."
      );
      expect(thenSpy).not.toHaveBeenCalled();
      expect(catchSpy).not.toHaveBeenCalled();
    });
  });

  test("reject promise if component command throws error", () => {
    const runCommandSpy = jest.fn(() => {
      throw new Error("Unexpected error");
    });
    const testCommand = {
      run: runCommandSpy
    };
    const componentRegistry = {
      getCommand: () => testCommand,
      getCommandNames() {
        return ["test"];
      }
    };
    const configureCommand = () => Promise.resolve(componentRegistry);
    const executeCommand = injectExecuteCommand({
      logger,
      configureCommand,
      handleError,
      validateCommandOptions: options => options
    });
    executeCommand("configure");
    return executeCommand("test", {}).catch(() => {
      expect(handleError).toHaveBeenCalledWith(
        new Error("Unexpected error"),
        "test"
      );
    });
  });

  test("executes component commands", () => {
    const validateCommandOptionsSpy = jest
      .fn()
      .mockReturnValueOnce("with-result-post-validation-options")
      .mockReturnValueOnce("without-result-post-validation-options");
    const testCommandWithResult = {
      run: jest.fn(() => ({ foo: "bar" }))
    };
    const testCommandWithoutResult = {
      run: jest.fn()
    };
    const componentRegistry = {
      getCommand: jest
        .fn()
        .mockReturnValueOnce(testCommandWithResult)
        .mockReturnValueOnce(testCommandWithoutResult),
      getCommandNames() {
        return ["testCommandWithResult", "testCommandWithoutResult"];
      }
    };
    const configureCommand = () => Promise.resolve(componentRegistry);
    const executeCommand = injectExecuteCommand({
      logger,
      configureCommand,
      handleError,
      validateCommandOptions: validateCommandOptionsSpy
    });
    executeCommand("configure");
    return Promise.all([
      executeCommand(
        "testCommandWithResult",
        "with-result-pre-validation-options"
      ),
      executeCommand(
        "testCommandWithoutResult",
        "without-result-pre-validation-options"
      )
    ]).then(results => {
      expect(results[0]).toEqual({ foo: "bar" });
      expect(results[1]).toEqual({});
      expect(validateCommandOptionsSpy).toHaveBeenCalledWith({
        command: testCommandWithResult,
        options: "with-result-pre-validation-options"
      });
      expect(validateCommandOptionsSpy).toHaveBeenCalledWith({
        command: testCommandWithoutResult,
        options: "without-result-pre-validation-options"
      });
      expect(testCommandWithResult.run).toHaveBeenCalledWith(
        "with-result-post-validation-options"
      );
      expect(testCommandWithoutResult.run).toHaveBeenCalledWith(
        "without-result-post-validation-options"
      );
    });
  });

  test("executes the core commands", () => {
    const configureCommand = jest.fn(() => Promise.resolve("configureResult"));
    const setDebugCommand = jest.fn();
    const executeCommand = injectExecuteCommand({
      logger,
      configureCommand,
      setDebugCommand,
      handleError
    });

    return Promise.all([
      executeCommand("configure", { foo: "bar" }),
      executeCommand("setDebug", { baz: "qux" })
    ]).then(([configureResult, setDebugResult]) => {
      expect(configureCommand).toHaveBeenCalledWith({ foo: "bar" });
      expect(setDebugCommand).toHaveBeenCalledWith({ baz: "qux" });
      expect(configureResult).toEqual({});
      expect(setDebugResult).toEqual({});
    });
  });
});
