import { initDomActionsModules } from "../../../../../../src/components/Personalization/dom-actions";

describe("Personalization::actions::click", () => {
  test("should set click tracking attribute", () => {
    const store = jest.fn();
    const modules = initDomActionsModules(store);
    const { click } = modules;
    const selector = "#click";
    const meta = { a: 1 };
    const settings = { selector, meta };

    click(settings, store);

    expect(store).toHaveBeenCalledWith({ selector, meta });
  });
});
