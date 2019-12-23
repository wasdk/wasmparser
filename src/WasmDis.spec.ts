/* Copyright 2016 Mozilla Foundation
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { NameSectionReader } from "./WasmDis";
import { BinaryReader } from "./WasmParser";

const { parseWat } = require("wabt")();

describe("NameSectionReader", () => {
  test("Empty Wasm module", () => {
    const data = new Uint8Array([
      // Wasm header
      0x00,
      0x61,
      0x73,
      0x6d,
      0x01,
      0x00,
      0x00,
      0x00
    ]);
    const reader = new BinaryReader();
    reader.setData(data.buffer, 0, data.byteLength);
    const nsr = new NameSectionReader();
    nsr.read(reader);
    expect(nsr.hasValidNames()).toBe(false);
    expect(nsr.getNameResolver.bind(nsr)).toThrowError();
  });

  test("Wasm module with function name", () => {
    const { buffer } = parseWat(
      `test.wat`,
      `(module (func $foo (result i32) i32.const 0))`
    ).toBinary({ write_debug_names: true });
    const reader = new BinaryReader();
    reader.setData(buffer.buffer, 0, buffer.byteLength);
    const nsr = new NameSectionReader();
    nsr.read(reader);
    expect(nsr.hasValidNames()).toBe(true);
    const nr = nsr.getNameResolver();
    expect(nr.getFunctionName(0, false, true)).toBe("$foo");
    expect(nr.getFunctionName(0, false, false)).toBe("$foo (;0;)");
    expect(nr.getFunctionName(1, false, true)).toBe("$unknown1");
    expect(nr.getFunctionName(1, false, false)).toBe("$unknown1");
    expect(nr.getVariableName(0, 0, true)).toBe("$var0");
    expect(nr.getVariableName(0, 0, false)).toBe("$var0");
    expect(nr.getVariableName(0, 1, true)).toBe("$var1");
    expect(nr.getVariableName(0, 1, false)).toBe("$var1");
  });

  test("Wasm module with parameter name", () => {
    const { buffer } = parseWat(
      `test.wat`,
      `(module (func $foo (param $x i32) (result i32) get_local $x))`
    ).toBinary({ write_debug_names: true });
    const reader = new BinaryReader();
    reader.setData(buffer.buffer, 0, buffer.byteLength);
    const nsr = new NameSectionReader();
    nsr.read(reader);
    expect(nsr.hasValidNames()).toBe(true);
    const nr = nsr.getNameResolver();
    expect(nr.getFunctionName(0, false, true)).toBe("$foo");
    expect(nr.getFunctionName(0, false, false)).toBe("$foo (;0;)");
    expect(nr.getFunctionName(1, false, true)).toBe("$unknown1");
    expect(nr.getFunctionName(1, false, false)).toBe("$unknown1");
    expect(nr.getVariableName(0, 0, true)).toBe("$x");
    expect(nr.getVariableName(0, 0, false)).toBe("$x (;0;)");
    expect(nr.getVariableName(0, 1, true)).toBe("$var1");
    expect(nr.getVariableName(0, 1, false)).toBe("$var1");
  });

  test("Wasm module with local names", () => {
    const { buffer } = parseWat(
      `test.wat`,
      `(module (func $foo (local $x i32) (local $y f32)
        get_local $x
        get_local $y))`
    ).toBinary({ write_debug_names: true });
    const reader = new BinaryReader();
    reader.setData(buffer.buffer, 0, buffer.byteLength);
    const nsr = new NameSectionReader();
    nsr.read(reader);
    expect(nsr.hasValidNames()).toBe(true);
    const nr = nsr.getNameResolver();
    expect(nr.getFunctionName(0, false, true)).toBe("$foo");
    expect(nr.getFunctionName(0, false, false)).toBe("$foo (;0;)");
    expect(nr.getFunctionName(1, false, true)).toBe("$unknown1");
    expect(nr.getFunctionName(1, false, false)).toBe("$unknown1");
    expect(nr.getVariableName(0, 0, true)).toBe("$x");
    expect(nr.getVariableName(0, 0, false)).toBe("$x (;0;)");
    expect(nr.getVariableName(0, 1, true)).toBe("$y");
    expect(nr.getVariableName(0, 1, false)).toBe("$y (;1;)");
  });
});
