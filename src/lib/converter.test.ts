import { test, expect } from "vitest";
import { convertSrc } from "./converter";
import optionsApi from "../assets/template/composition-api.txt?raw";

test("converter", () => {
  const output = convertSrc(optionsApi);
  expect(output).toMatchSnapshot();
});
