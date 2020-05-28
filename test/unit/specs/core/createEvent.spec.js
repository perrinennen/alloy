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

import createEvent from "../../../../src/core/createEvent";

describe("createEvent", () => {
  let event;

  beforeEach(() => {
    event = createEvent();
  });

  test("deeply merges XDM with user-provided XDM merged last", () => {
    event.setUserXdm({
      fruit: {
        type: "apple"
      },
      veggie: {
        type: "carrot"
      }
    });
    event.mergeXdm({
      fruit: {
        type: "strawberry"
      },
      sport: {
        type: "basketball"
      }
    });
    event.mergeXdm({
      sport: {
        type: "football"
      },
      game: {
        type: "clue"
      }
    });
    expect(event.toJSON()).toEqual({
      xdm: {
        fruit: {
          type: "apple"
        },
        veggie: {
          type: "carrot"
        },
        sport: {
          type: "football"
        },
        game: {
          type: "clue"
        }
      }
    });
  });

  test("does not modify the original user XDM object", () => {
    const dataLayer = {
      fruit: {
        type: "apple"
      },
      veggie: {
        type: "carrot"
      }
    };
    event.setUserXdm(dataLayer);
    event.mergeXdm({
      fruit: {
        type: "strawberry"
      },
      sport: {
        type: "basketball"
      }
    });
    expect(dataLayer).toEqual({
      fruit: {
        type: "apple"
      },
      veggie: {
        type: "carrot"
      }
    });
  });

  test("handles undefined user XDM", () => {
    event.setUserXdm(undefined);
    event.mergeXdm({
      fruit: "apple"
    });
    expect(event.toJSON()).toEqual({
      xdm: {
        fruit: "apple"
      }
    });
  });

  test("sets user data", () => {
    event.setUserData({ fruit: "apple" });
    event.setUserData({ veggie: "carrot" });
    expect(event.toJSON()).toEqual({
      data: {
        veggie: "carrot"
      }
    });
  });

  test("handles undefined user data", () => {
    event.setUserData(undefined);
    expect(event.toJSON()).toEqual({});
  });

  test("deeply merges meta", () => {
    event.mergeMeta({
      fruit: {
        type: "strawberry"
      },
      sport: {
        type: "basketball"
      }
    });
    event.mergeMeta({
      sport: {
        type: "football"
      },
      game: {
        type: "clue"
      }
    });
    expect(event.toJSON()).toEqual({
      meta: {
        fruit: {
          type: "strawberry"
        },
        sport: {
          type: "football"
        },
        game: {
          type: "clue"
        }
      }
    });
  });

  test("deeply merges query", () => {
    event.mergeQuery({
      fruit: {
        type: "strawberry"
      },
      sport: {
        type: "basketball"
      }
    });
    event.mergeQuery({
      sport: {
        type: "football"
      },
      game: {
        type: "clue"
      }
    });
    expect(event.toJSON()).toEqual({
      query: {
        fruit: {
          type: "strawberry"
        },
        sport: {
          type: "football"
        },
        game: {
          type: "clue"
        }
      }
    });
  });

  test("sets documentUnloading", () => {
    expect(event.getDocumentMayUnload()).toBe(false);
    event.documentMayUnload();
    expect(event.getDocumentMayUnload()).toBe(true);
  });

  test("reports whether the event is empty", () => {
    expect(event.isEmpty()).toBe(true);
    event.setUserData({ foo: "bar" });
    expect(event.isEmpty()).toBe(false);
  });

  describe("applyCallback", () => {
    test("can add fields to empty xdm", () => {
      const callback = ({ xdm, data }) => {
        xdm.a = "1";
        data.b = "2";
      };
      const subject = createEvent();
      subject.setLastChanceCallback(callback);
      expect(subject.toJSON()).toEqual({ xdm: { a: "1" }, data: { b: "2" } });
    });

    test("can add fields to an existing xdm", () => {
      const callback = ({ xdm, data }) => {
        xdm.b = "2";
        data.b = "2";
      };
      const subject = createEvent();
      subject.setUserData({ a: "1" });
      subject.setUserXdm({ a: "1" });
      subject.setLastChanceCallback(callback);
      expect(subject.toJSON()).toEqual({
        xdm: { a: "1", b: "2" },
        data: { a: "1", b: "2" }
      });
    });

    test("can remove fields", () => {
      const callback = ({ xdm, data }) => {
        delete xdm.a;
        delete data.a;
      };
      const subject = createEvent();
      subject.setUserXdm({ a: "1", b: "2" });
      subject.setUserData({ a: "1", b: "2" });
      subject.setLastChanceCallback(callback);
      expect(subject.toJSON()).toEqual({ xdm: { b: "2" }, data: { b: "2" } });
    });

    test("doesn't merge when there is an exception", () => {
      const callback = ({ xdm, data }) => {
        delete xdm.a;
        xdm.c = "3";
        delete data.a;
        data.c = "3";
        throw Error("Expected Error");
      };
      const subject = createEvent();
      subject.setUserXdm({ a: "1", b: "2" });
      subject.setUserData({ a: "1", b: "2" });
      subject.setLastChanceCallback(callback);
      expect(subject.toJSON()).toEqual({
        xdm: { a: "1", b: "2" },
        data: { a: "1", b: "2" }
      });
    });
  });
});
