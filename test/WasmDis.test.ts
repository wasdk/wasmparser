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

import { NameSectionReader, WasmDisassembler } from "../src/WasmDis";
import { DevToolsNameGenerator } from "../src/WasmDis";
import { BinaryReader } from "../src/WasmParser";

const wabtPromise = require("wabt")();

describe("DevToolsNameGenerator", () => {
  test("Wasm module with export names only for function, memory, global and table", async () => {
    const { parseWat } = await wabtPromise;
    const { buffer } = parseWat(
      `test.wat`,
      `(module
         (export "export.function" (func 0))
         (export "export.memory" (memory 0))
         (export "export.table" (table 0))
         (export "export.global" (global 0))
         (func)
         (memory 0)
         (table 1 funcref)
         (global i32 (i32.const 0)))`
    ).toBinary({ write_debug_names: true });
    const reader = new BinaryReader();
    reader.setData(buffer.buffer, 0, buffer.byteLength);
    const ng = new DevToolsNameGenerator();
    ng.read(reader);
    const nr = ng.getNameResolver();
    expect(nr.getFunctionName(0, false, true)).toBe("$export.function");
    expect(nr.getFunctionName(0, false, false)).toBe("$export.function (;0;)");
    expect(nr.getMemoryName(0, true)).toBe("$export.memory");
    expect(nr.getMemoryName(0, false)).toBe("$export.memory (;0;)");
    expect(nr.getTableName(0, true)).toBe("$export.table");
    expect(nr.getTableName(0, false)).toBe("$export.table (;0;)");
    expect(nr.getGlobalName(0, true)).toBe("$export.global");
    expect(nr.getGlobalName(0, false)).toBe("$export.global (;0;)");
  });

  test("Wasm module with import names only for function, memory, global and table", async () => {
    const { parseWat } = await wabtPromise;
    const { buffer } = parseWat(
      `test.wat`,
      `(module
         (import "import" "function" (func))
         (import "import" "memory" (memory 0))
         (import "import" "table" (table 1 funcref))
         (import "import" "global" (global i32)))`
    ).toBinary({ write_debug_names: true });
    const reader = new BinaryReader();
    reader.setData(buffer.buffer, 0, buffer.byteLength);
    const ng = new DevToolsNameGenerator();
    ng.read(reader);
    const nr = ng.getNameResolver();
    expect(nr.getTypeName(0, true)).toBe("$type0");
    expect(nr.getTypeName(0, false)).toBe("$type0");
    expect(nr.getFunctionName(0, true, true)).toBe("$import.function");
    expect(nr.getFunctionName(0, true, false)).toBe("$import.function (;0;)");
    expect(nr.getMemoryName(0, true)).toBe("$import.memory");
    expect(nr.getMemoryName(0, false)).toBe("$import.memory (;0;)");
    expect(nr.getTableName(0, true)).toBe("$import.table");
    expect(nr.getTableName(0, false)).toBe("$import.table (;0;)");
    expect(nr.getGlobalName(0, true)).toBe("$import.global");
    expect(nr.getGlobalName(0, false)).toBe("$import.global (;0;)");
  });

  test("Wasm module with function and export name", async () => {
    const { parseWat } = await wabtPromise;
    const { buffer } = parseWat(
      `test.wat`,
      `(module
         (export "export.function" (func $f))
         (func $f (result i32) i32.const 0))`
    ).toBinary({ write_debug_names: true });
    const reader = new BinaryReader();
    reader.setData(buffer.buffer, 0, buffer.byteLength);
    const ng = new DevToolsNameGenerator();
    ng.read(reader);
    const nr = ng.getNameResolver();
    expect(nr.getFunctionName(0, false, true)).toBe("$f");
    expect(nr.getFunctionName(0, false, false)).toBe("$f (;0;)");
  });

  test("Wasm module with import and export name", async () => {
    const { parseWat } = await wabtPromise;
    const { buffer } = parseWat(
      `test.wat`,
      `(module
         (import "import" "function" (func))
         (export "export.function" (func 0)))`
    ).toBinary({ write_debug_names: true });
    const reader = new BinaryReader();
    reader.setData(buffer.buffer, 0, buffer.byteLength);
    const ng = new DevToolsNameGenerator();
    ng.read(reader);
    const nr = ng.getNameResolver();
    expect(nr.getFunctionName(0, true, true)).toBe("$import.function");
    expect(nr.getFunctionName(0, true, false)).toBe("$import.function (;0;)");
  });

  test("Wasm module with no set names", async () => {
    const { parseWat } = await wabtPromise;
    const { buffer } = parseWat(
      `test.wat`,
      `(module
           (import "" "" (func))
           (export "" (func 0))
           (func)
           (memory 0)
           (table 1 funcref)
           (global i32 (i32.const 0)))`
    ).toBinary({ write_debug_names: true });
    const reader = new BinaryReader();
    reader.setData(buffer.buffer, 0, buffer.byteLength);
    const ng = new DevToolsNameGenerator();
    ng.read(reader);
    const nr = ng.getNameResolver();
    expect(nr.getFunctionName(0, true, true)).toBe("$.");
    expect(nr.getFunctionName(0, true, false)).toBe("$. (;0;)");
    expect(nr.getFunctionName(1, false, true)).toBe("$func1");
    expect(nr.getFunctionName(1, false, false)).toBe("$func1");
    expect(nr.getMemoryName(0, true)).toBe("$memory0");
    expect(nr.getMemoryName(0, false)).toBe("$memory0");
    expect(nr.getTableName(0, true)).toBe("$table0");
    expect(nr.getTableName(0, false)).toBe("$table0");
    expect(nr.getGlobalName(0, false)).toBe("$global0");
    expect(nr.getGlobalName(0, false)).toBe("$global0");
  });

  test("Wasm module with defined and undefined param names", async () => {
    const { parseWat } = await wabtPromise;
    const { buffer } = parseWat(
      `test.wat`,
      `(module
           (func (param i32) (param $x i32)))`
    ).toBinary({ write_debug_names: true });
    const reader = new BinaryReader();
    reader.setData(buffer.buffer, 0, buffer.byteLength);
    const ng = new DevToolsNameGenerator();
    ng.read(reader);
    const nr = ng.getNameResolver();
    expect(nr.getVariableName(0, 0, true)).toBe("$var0");
    expect(nr.getVariableName(0, 0, false)).toBe("$var0");
    expect(nr.getVariableName(0, 1, true)).toBe("$x");
    expect(nr.getVariableName(0, 1, false)).toBe("$x (;1;)");
  });

  test("Wasm module with defined and undefined local names", async () => {
    const { parseWat } = await wabtPromise;
    const { buffer } = parseWat(
      `test.wat`,
      `(module
           (func (local i32) (local $x i32)))`
    ).toBinary({ write_debug_names: true });
    const reader = new BinaryReader();
    reader.setData(buffer.buffer, 0, buffer.byteLength);
    const ng = new DevToolsNameGenerator();
    ng.read(reader);
    const nr = ng.getNameResolver();
    expect(nr.getVariableName(0, 0, true)).toBe("$var0");
    expect(nr.getVariableName(0, 0, false)).toBe("$var0");
    expect(nr.getVariableName(0, 1, true)).toBe("$x");
    expect(nr.getVariableName(0, 1, false)).toBe("$x (;1;)");
  });

  test("Wasm module with invalid export name", async () => {
    const { parseWat } = await wabtPromise;
    const { buffer } = parseWat(
      `test.wat`,
      `(module
         (export "{}" (func 0))
         (func))`
    ).toBinary({ write_debug_names: true });
    const reader = new BinaryReader();
    reader.setData(buffer.buffer, 0, buffer.byteLength);
    const ng = new DevToolsNameGenerator();
    ng.read(reader);
    const nr = ng.getNameResolver();
    expect(nr.getFunctionName(0, false, true)).toBe("$__");
    expect(nr.getFunctionName(0, false, false)).toBe("$__ (;0;)");
  });

  test("Wasm module with type names", () => {
    const data = new Uint8Array([
      // Wasm header
      0x00,
      0x61,
      0x73,
      0x6d,
      0x01,
      0x00,
      0x00,
      0x00,
      // name section
      0x00, // id
      0x0e, // size
      // 'name'
      0x04,
      0x6e,
      0x61,
      0x6d,
      0x65,
      // Type names
      0x04, // id
      0x07, // size
      0x02, // length
      // Type 0 "6"
      0x00,
      0x01,
      0x36,
      // Type 1 "8"
      0x01,
      0x01,
      0x38,
    ]);
    const reader = new BinaryReader();
    reader.setData(data.buffer, 0, data.byteLength);
    const ng = new DevToolsNameGenerator();
    expect(ng.read(reader)).toBe(true);
    const nr = ng.getNameResolver();
    expect(nr.getTypeName(0, true)).toBe("$6");
    expect(nr.getTypeName(0, false)).toBe("$6 (;0;)");
    expect(nr.getTypeName(1, true)).toBe("$8");
    expect(nr.getTypeName(1, false)).toBe("$8 (;1;)");
  });

  test("Wasm module with table names", () => {
    const data = new Uint8Array([
      // Wasm header
      0x00,
      0x61,
      0x73,
      0x6d,
      0x01,
      0x00,
      0x00,
      0x00,
      // name section
      0x00, // id
      0x0b, // size
      // 'name'
      0x04,
      0x6e,
      0x61,
      0x6d,
      0x65,
      // Table names
      0x05, // id
      0x04, // size
      0x01, // length
      // Table 5 "0"
      0x05,
      0x01,
      0x30,
    ]);
    const reader = new BinaryReader();
    reader.setData(data.buffer, 0, data.byteLength);
    const ng = new DevToolsNameGenerator();
    expect(ng.read(reader)).toBe(true);
    const nr = ng.getNameResolver();
    expect(nr.getTableName(5, true)).toBe("$0");
    expect(nr.getTableName(5, false)).toBe("$0 (;5;)");
  });

  test("Wasm module with memory names", () => {
    const data = new Uint8Array([
      // Wasm header
      0x00,
      0x61,
      0x73,
      0x6d,
      0x01,
      0x00,
      0x00,
      0x00,
      // name section
      0x00, // id
      0x11, // size
      // 'name'
      0x04,
      0x6e,
      0x61,
      0x6d,
      0x65,
      // Memory names
      0x06, // id
      0x0a, // size
      0x02, // length
      // Memory 0 "123"
      0x00,
      0x03,
      0x31,
      0x32,
      0x33,
      // Memory 1 "42"
      0x01,
      0x02,
      0x34,
      0x32,
    ]);
    const reader = new BinaryReader();
    reader.setData(data.buffer, 0, data.byteLength);
    const ng = new DevToolsNameGenerator();
    expect(ng.read(reader)).toBe(true);
    const nr = ng.getNameResolver();
    expect(nr.getMemoryName(0, true)).toBe("$123");
    expect(nr.getMemoryName(0, false)).toBe("$123 (;0;)");
    expect(nr.getMemoryName(1, true)).toBe("$42");
    expect(nr.getMemoryName(1, false)).toBe("$42 (;1;)");
    expect(nr.getMemoryName(2, true)).toBe("$memory2");
    expect(nr.getMemoryName(2, false)).toBe("$memory2");
  });

  test("Wasm module with global names", () => {
    const data = new Uint8Array([
      // Wasm header
      0x00,
      0x61,
      0x73,
      0x6d,
      0x01,
      0x00,
      0x00,
      0x00,
      // name section
      0x00, // id
      0x11, // size
      // 'name'
      0x04,
      0x6e,
      0x61,
      0x6d,
      0x65,
      // Global names
      0x07, // id
      0x0a, // size
      0x02, // length
      // Global 1 "123"
      0x01,
      0x03,
      0x31,
      0x32,
      0x33,
      // Global 2 "42"
      0x02,
      0x02,
      0x34,
      0x32,
    ]);
    const reader = new BinaryReader();
    reader.setData(data.buffer, 0, data.byteLength);
    const ng = new DevToolsNameGenerator();
    expect(ng.read(reader)).toBe(true);
    const nr = ng.getNameResolver();
    expect(nr.getGlobalName(0, true)).toBe("$global0");
    expect(nr.getGlobalName(0, false)).toBe("$global0");
    expect(nr.getGlobalName(1, true)).toBe("$123");
    expect(nr.getGlobalName(1, false)).toBe("$123 (;1;)");
    expect(nr.getGlobalName(2, true)).toBe("$42");
    expect(nr.getGlobalName(2, false)).toBe("$42 (;2;)");
  });

  test("Wasm module with event names", async () => {
    const { parseWat } = await wabtPromise;
    const { buffer } = parseWat(
      `test.wat`,
      `(module
        (event (type 1))
        (event (type 2))
        (export "ex" (event 0))
       )`,
      { exceptions: true }
    ).toBinary({ write_debug_names: true });
    const reader = new BinaryReader();
    reader.setData(buffer.buffer, 0, buffer.byteLength);
    const ng = new DevToolsNameGenerator();
    ng.read(reader);
    const nr = ng.getNameResolver();
    expect(nr.getEventName(0, true)).toBe("$ex");
    expect(nr.getEventName(0, false)).toBe("$ex (;0;)");
    expect(nr.getEventName(1, true)).toBe("$event1");
    expect(nr.getEventName(1, false)).toBe("$event1");
  });
});

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
      0x00,
    ]);
    const reader = new BinaryReader();
    reader.setData(data.buffer, 0, data.byteLength);
    const nsr = new NameSectionReader();
    expect(nsr.read(reader)).toBe(true);
    expect(nsr.hasValidNames()).toBe(false);
    expect(nsr.getNameResolver.bind(nsr)).toThrowError();
  });

  test("Wasm module with unsupported name subsection", () => {
    const data = new Uint8Array([
      // Wasm header
      0x00,
      0x61,
      0x73,
      0x6d,
      0x01,
      0x00,
      0x00,
      0x00,
      // name section
      0x00, // id
      0x09, // size
      // 'name'
      0x04,
      0x6e,
      0x61,
      0x6d,
      0x65,
      // Unsupported 255 name subsection
      0xff, // id
      0x02, // size
      0x42, // payload
      0x42,
    ]);
    const reader = new BinaryReader();
    reader.setData(data.buffer, 0, data.byteLength);
    const nsr = new NameSectionReader();
    expect(nsr.read(reader)).toBe(true);
    expect(nsr.hasValidNames()).toBe(false);
  });

  test("Wasm module with function name", async () => {
    const { parseWat } = await wabtPromise;
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

  test("Wasm module with parameter name", async () => {
    const { parseWat } = await wabtPromise;
    const { buffer } = parseWat(
      `test.wat`,
      `(module (func $foo (param $x i32) (result i32) local.get $x))`
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

  test("Wasm module with bad names", async () => {
    const { parseWat } = await wabtPromise;
    expect(() =>
      parseWat(
        `test.wat`,
        `(module
         (import "import" "function" (func $foo))
         (import "import" "function2" (func $foo))
         )`
      )
    ).toThrow('redefinition of function "$foo"');
  });

  test("Wasm module with local names", async () => {
    const { parseWat } = await wabtPromise;
    const { buffer } = parseWat(
      `test.wat`,
      `(module (func $foo (local $x i32) (local $y f32)
        local.get $x
        local.get $y))`
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

  test("Wasm module with type names", () => {
    const data = new Uint8Array([
      // Wasm header
      0x00,
      0x61,
      0x73,
      0x6d,
      0x01,
      0x00,
      0x00,
      0x00,
      // name section
      0x00, // id
      0x0e, // size
      // 'name'
      0x04,
      0x6e,
      0x61,
      0x6d,
      0x65,
      // Type names
      0x04, // id
      0x07, // size
      0x02, // length
      // Type 0 "0"
      0x00,
      0x01,
      0x30,
      // Type 1 "1"
      0x01,
      0x01,
      0x31,
    ]);
    const reader = new BinaryReader();
    reader.setData(data.buffer, 0, data.byteLength);
    const nsr = new NameSectionReader();
    expect(nsr.read(reader)).toBe(true);
    expect(nsr.hasValidNames()).toBe(true);
    const nr = nsr.getNameResolver();
    expect(nr.getTypeName(0, true)).toBe("$0");
    expect(nr.getTypeName(0, false)).toBe("$0 (;0;)");
    expect(nr.getTypeName(1, true)).toBe("$1");
    expect(nr.getTypeName(1, false)).toBe("$1 (;1;)");
  });

  test("Wasm module with table names", () => {
    const data = new Uint8Array([
      // Wasm header
      0x00,
      0x61,
      0x73,
      0x6d,
      0x01,
      0x00,
      0x00,
      0x00,
      // name section
      0x00, // id
      0x11, // size
      // 'name'
      0x04,
      0x6e,
      0x61,
      0x6d,
      0x65,
      // Table names
      0x05, // id
      0x0a, // size
      0x03, // length
      // Table 0 "5"
      0x00,
      0x01,
      0x35,
      // Table 5 "3"
      0x05,
      0x01,
      0x33,
      // Table 9 "1"
      0x09,
      0x01,
      0x31,
    ]);
    const reader = new BinaryReader();
    reader.setData(data.buffer, 0, data.byteLength);
    const nsr = new NameSectionReader();
    expect(nsr.read(reader)).toBe(true);
    expect(nsr.hasValidNames()).toBe(true);
    const nr = nsr.getNameResolver();
    expect(nr.getTableName(0, true)).toBe("$5");
    expect(nr.getTableName(0, false)).toBe("$5 (;0;)");
    expect(nr.getTableName(5, true)).toBe("$3");
    expect(nr.getTableName(5, false)).toBe("$3 (;5;)");
    expect(nr.getTableName(9, true)).toBe("$1");
    expect(nr.getTableName(9, false)).toBe("$1 (;9;)");
  });

  test("Wasm module with memory names", () => {
    const data = new Uint8Array([
      // Wasm header
      0x00,
      0x61,
      0x73,
      0x6d,
      0x01,
      0x00,
      0x00,
      0x00,
      // name section
      0x00, // id
      0x11, // size
      // 'name'
      0x04,
      0x6e,
      0x61,
      0x6d,
      0x65,
      // Memory names
      0x06, // id
      0x0a, // size
      0x02, // length
      // Memory 0 "123"
      0x00,
      0x03,
      0x31,
      0x32,
      0x33,
      // Memory 1 "42"
      0x01,
      0x02,
      0x34,
      0x32,
    ]);
    const reader = new BinaryReader();
    reader.setData(data.buffer, 0, data.byteLength);
    const nsr = new NameSectionReader();
    expect(nsr.read(reader)).toBe(true);
    expect(nsr.hasValidNames()).toBe(true);
    const nr = nsr.getNameResolver();
    expect(nr.getMemoryName(0, true)).toBe("$123");
    expect(nr.getMemoryName(0, false)).toBe("$123 (;0;)");
    expect(nr.getMemoryName(1, true)).toBe("$42");
    expect(nr.getMemoryName(1, false)).toBe("$42 (;1;)");
    expect(nr.getMemoryName(2, true)).toBe("$memory2");
    expect(nr.getMemoryName(2, false)).toBe("$memory2");
  });

  test("Wasm module with global names", () => {
    const data = new Uint8Array([
      // Wasm header
      0x00,
      0x61,
      0x73,
      0x6d,
      0x01,
      0x00,
      0x00,
      0x00,
      // name section
      0x00, // id
      0x11, // size
      // 'name'
      0x04,
      0x6e,
      0x61,
      0x6d,
      0x65,
      // Global names
      0x07, // id
      0x0a, // size
      0x02, // length
      // Global 1 "123"
      0x01,
      0x03,
      0x31,
      0x32,
      0x33,
      // Global 2 "42"
      0x02,
      0x02,
      0x34,
      0x32,
    ]);
    const reader = new BinaryReader();
    reader.setData(data.buffer, 0, data.byteLength);
    const nsr = new NameSectionReader();
    expect(nsr.read(reader)).toBe(true);
    expect(nsr.hasValidNames()).toBe(true);
    const nr = nsr.getNameResolver();
    expect(nr.getGlobalName(0, true)).toBe("$global0");
    expect(nr.getGlobalName(0, false)).toBe("$global0");
    expect(nr.getGlobalName(1, true)).toBe("$123");
    expect(nr.getGlobalName(1, false)).toBe("$123 (;1;)");
    expect(nr.getGlobalName(2, true)).toBe("$42");
    expect(nr.getGlobalName(2, false)).toBe("$42 (;2;)");
  });
});

describe("WasmDisassembler with export metadata", () => {
  async function parseAndDisassemble(lines: string[]) {
    const { parseWat } = await wabtPromise;
    const { buffer } = parseWat("functions.js", lines.join("\n")).toBinary({
      write_debug_names: true,
    });
    const parser = new BinaryReader();
    parser.setData(buffer.buffer, 0, buffer.byteLength);
    const ng = new DevToolsNameGenerator();
    ng.read(parser);
    parser.setData(buffer.buffer, 0, buffer.byteLength);
    const dis = new WasmDisassembler();
    dis.exportMetadata = ng.getExportMetadata();
    dis.disassembleChunk(parser);
    return dis.getResult().lines;
  }

  test("functions", async () => {
    const lines = [
      `(module`,
      `  (func $import0 (export "bar") (export "foo") (import "foo" "bar") (param i32 f32) (result i64))`,
      `  (func $func1 (export "baz") (param $var0 i32) (result i32)`,
      `    local.get $var0`,
      `  )`,
      `)`,
    ];
    expect(await parseAndDisassemble(lines)).toEqual(lines);
  });

  test("globals", async () => {
    const lines = [
      `(module`,
      `  (global $global0 (export "bar") (export "foo") (import "foo" "bar") i32)`,
      `  (global $global1 (export "baz") f32 (f32.const 42))`,
      `)`,
    ];
    expect(await parseAndDisassemble(lines)).toEqual(lines);
  });

  test("imported memory", async () => {
    const lines = [
      `(module`,
      `  (memory $memory0 (export "bar") (export "foo") (import "foo" "bar") 100)`,
      `)`,
    ];
    expect(await parseAndDisassemble(lines)).toEqual(lines);
  });

  test("memory", async () => {
    const lines = [
      `(module`,
      `  (memory $memory0 (export "bar") (export "foo") 100)`,
      `)`,
    ];
    expect(await parseAndDisassemble(lines)).toEqual(lines);
  });

  test("tables", async () => {
    const lines = [
      `(module`,
      `  (table $table0 (export "bar") (export "foo") (import "foo" "bar") 10 funcref)`,
      `  (table $table1 (export "baz") 5 20 funcref)`,
      `)`,
    ];
    expect(await parseAndDisassemble(lines)).toEqual(lines);
  });
});

describe("WasmDisassembler.getResult() with function code", () => {
  const watString = `(module
  (export "export.function" (func $f))
  (func $f (result i32)
  (local $x i32)
  i32.const 0)
  (func $f1 (result i32) i32.const 1))`;
  const fileName = `test.wat`;
  const expectedLines = [
    "(module",
    '  (export "export.function" (func $func0))',
    "  (func $func0 (result i32)",
    "    (local $var0 i32)",
    "    i32.const 0",
    "  )",
    "  (func $func1 (result i32)",
    "    i32.const 1",
    "  )",
    ")",
  ];

  test("addOffsets is true", async () => {
    const { parseWat } = await wabtPromise;
    const { buffer } = parseWat(fileName, watString).toBinary({
      write_debug_names: true,
    });
    const parser = new BinaryReader();
    parser.setData(buffer.buffer, 0, buffer.byteLength);
    const dis = new WasmDisassembler();
    dis.addOffsets = true;
    const offsetInModule = 0;
    dis.disassembleChunk(parser, offsetInModule);
    const result = dis.getResult();
    expect(result.done).toBe(true);
    expect(result.lines).toEqual(expectedLines);
    expect(result.offsets).toEqual([0, 22, 43, 43, 48, 50, 51, 53, 55, 83]);
    expect(result.functionBodyOffsets).toEqual([
      {
        start: 48,
        end: 51,
      },
      {
        start: 53,
        end: 56,
      },
    ]);
  });

  test("addOffsets is false", async () => {
    const { parseWat } = await wabtPromise;
    const { buffer } = parseWat(fileName, watString).toBinary({
      write_debug_names: true,
    });
    const parser = new BinaryReader();
    parser.setData(buffer.buffer, 0, buffer.byteLength);
    const dis = new WasmDisassembler();
    dis.addOffsets = false;
    const offsetInModule = 0;
    dis.disassembleChunk(parser, offsetInModule);
    const result = dis.getResult();
    expect(result.done).toBe(true);
    expect(result.lines).toEqual(expectedLines);
    expect(result.offsets).toBeUndefined();
    expect(result.functionBodyOffsets).toBeUndefined();
  });
});

describe("WasmDisassembler.getResult() without function code", () => {
  const fileName = `test.wat`;
  const expectedLines = [
    `(module`,
    `  (func $import0 (import "import" "function"))`,
    `  (export "export.function" (func $import0))`,
    `)`,
  ];
  const expectedLinesWithTypes = [
    `(module`,
    `  (type $type0 (func))`,
    `  (func $import0 (import "import" "function"))`,
    `  (export \"export.function\" (func $import0))`,
    `)`,
  ];
  const watString = expectedLines.join("\n");

  test("addOffsets is true", async () => {
    const { parseWat } = await wabtPromise;
    const { buffer } = parseWat(fileName, watString).toBinary({
      write_debug_names: true,
    });
    const parser = new BinaryReader();
    parser.setData(buffer.buffer, 0, buffer.byteLength);
    const dis = new WasmDisassembler();
    dis.addOffsets = true;
    const offsetInModule = 0;
    dis.disassembleChunk(parser, offsetInModule);
    const result = dis.getResult();
    expect(result.done).toBe(true);
    expect(result.lines).toEqual(expectedLines);
    expect(result.offsets).toEqual([0, 16, 37, 80]);
    expect(result.functionBodyOffsets).toEqual([]);
  });

  test("addOffsets is false", async () => {
    const { parseWat } = await wabtPromise;
    const { buffer } = parseWat(fileName, watString).toBinary({
      write_debug_names: true,
    });
    const parser = new BinaryReader();
    parser.setData(buffer.buffer, 0, buffer.byteLength);
    const dis = new WasmDisassembler();
    dis.addOffsets = false;
    const offsetInModule = 0;
    dis.disassembleChunk(parser, offsetInModule);
    const result = dis.getResult();
    expect(result.done).toBe(true);
    expect(result.lines).toEqual(expectedLines);
    expect(result.offsets).toBeUndefined();
    expect(result.functionBodyOffsets).toBeUndefined();
  });

  test("skipTypes is false", async () => {
    const { parseWat } = await wabtPromise;
    const { buffer } = parseWat(fileName, watString).toBinary({
      write_debug_names: true,
    });
    const parser = new BinaryReader();
    parser.setData(buffer.buffer, 0, buffer.byteLength);
    const dis = new WasmDisassembler();
    dis.skipTypes = false;
    dis.disassembleChunk(parser);
    const result = dis.getResult();
    expect(result.done).toBe(true);
    expect(result.lines).toEqual(expectedLinesWithTypes);
  });
});

describe("GC proposal support", () => {
  // At the time of writing this test, there is no readily available tool
  // to assemble the module from wat text, so we hard-code its binary
  // contents here.
  const module_bytes = [
    0x00,
    0x61,
    0x73,
    0x6d,
    1,
    0,
    0,
    0, // wasm magic

    0x01, // type section
    0x2c, // section length: 41
    0x08, // number of types
    // type  0:
    0x5f, // struct
    0x02, // field count
    0x7f,
    0x01, // mut i32
    0x7e,
    0x00, // i64
    // type  1:
    0x5f, // struct
    0x02, // field count
    0x7a,
    0x01, // mut i8
    0x79,
    0x00, // i16
    // type  2:
    0x5f, // struct
    0x02, // field count
    0x7d,
    0x01, // mut f32
    0x7c,
    0x00, // f64
    // type  3:
    0x5f, // struct
    0x02, // field count
    0x6c,
    0x00,
    0x01, // mut ref null 0
    0x6a,
    0x00, // i31ref
    // type  4:
    0x5f, // struct
    0x03, // field count
    0x6b,
    0x01,
    0x00, // ref 1
    0x6d,
    0x00, // eqref
    0x67,
    0x00, // dataref
    // type  5:
    0x5e, // array
    0x7f,
    0x01, // mut i32
    // type  6:
    0x5e, // array
    0x7a,
    0x01, // mut i8
    // type  7:
    0x60, // signature
    0x00, // number of params
    0x00, // number of results

    0x03, // function section
    0x07, // section length
    0x06, // number of functions
    0x07, // function 0: signature 7
    0x07, // function 1: signature 7
    0x07, // function 2: signature 7
    0x07, // function 3: signature 7
    0x07, // function 4: signature 7
    0x07, // function 5: signature 7

    /////////////////////////// CODE SECTION //////////////////////////
    0x0a, // code section
    0x85,
    0x02, // section length
    0x06, // number of functions

    0x53, // function 0: size
    0x02, // number of locals
    0x01,
    0x6c,
    0x00, // one local of type: optref 0
    0x01,
    0x6c,
    0x01, // one local of type: optref 1
    0x41,
    0x2a, // i32.const: 42
    0x42,
    0x2b, // i64.const: 43
    0xfb,
    0x30,
    0x00, // rtt.canon 0
    0xfb,
    0x01,
    0x00, // struct.new_with_rtt 0
    0x21,
    0x00, // local.set 0
    0x20,
    0x00, // local.get 0
    0xd3, // ref.as_non_null
    0x41,
    0x2c, // i32.const 44
    0xfb,
    0x06,
    0x00,
    0x00, // struct.set 0 0
    0x20,
    0x00, // local.get 0
    0xfb,
    0x30,
    0x00, // rtt.canon 0
    0xfb,
    0x41, // ref.cast
    0xfb,
    0x03,
    0x00,
    0x01, // struct.get 0 1
    0x1a, // drop
    // ---
    0xfb,
    0x30,
    0x01, // rtt.canon 1
    0xfb,
    0x31,
    0x01, // rtt.sub 1
    0xfb,
    0x32,
    0x01, // rtt.fresh_sub 1
    0xfb,
    0x02,
    0x01, // struct.new_default_with_rtt 1
    0x21,
    0x01, // local.set 1
    0x20,
    0x01, // local.get 1
    0xfb,
    0x04,
    0x01,
    0x00, // struct.get_s 1 0
    0x1a, // drop
    0x20,
    0x01, // local.get 1
    0xfb,
    0x05,
    0x01,
    0x01, // struct.get_u 1 1
    0x1a, // drop
    // ---
    0x20,
    0x01, // local.get 1
    0xd0,
    0x01, // ref.null 1
    0xd5, // ref.eq
    0x1a, // drop
    0xd0,
    0x6d, // ref.null eq
    0xfb,
    0x30,
    0x00, // rtt.canon 0
    0xfb,
    0x40, // ref.test
    0x1a, // drop
    0x0b, // end

    0x0d, // function 1: size
    0x00, // number of locals
    0x41,
    0x7f, // i32.const -1
    0xfb,
    0x20, // i31.new
    0xfb,
    0x21, // i31.get_s
    0xfb,
    0x20, // i31.new
    0xfb,
    0x22, // i31.get_u
    0x1a, // drop
    0x0b, // end

    0x0f, // function 2: size
    0x01, // number of locals
    0x01,
    0x6c,
    0x70, // one local of type: ref null func
    0xd2,
    0x01, // ref.func $func1
    0x21,
    0x00, // local.set 0
    0x20,
    0x00, // local.get 0
    0x14, // call_ref
    0x20,
    0x00, // local.get 0
    0x15, // return_call_ref
    0x0b, // end

    0x39, // function 3: size
    0x00, // number of locals
    0x02,
    0x40, // block <void>
    0xd0,
    0x6e, // ref.null any
    0xd4,
    0x00, // br_on_null 0
    0xd6,
    0x00, // br_on_non_null 0
    0xfb,
    0x30,
    0x00, // rtt.canon 0
    0xfb,
    0x42,
    0x00, // br_on_cast 0
    0xfb,
    0x43,
    0x00, // br_on_cast_fail 0
    0xfb,
    0x60,
    0x00, // br_on_func 0
    0xfb,
    0x63,
    0x00, // br_on_non_func 0
    0xfb,
    0x61,
    0x00, // br_on_data 0
    0xfb,
    0x64,
    0x00, // br_on_non_data 0
    0xfb,
    0x62,
    0x00, // br_on_i31 0
    0xfb,
    0x65,
    0x00, // br_on_non_i31 0
    0xfb,
    0x58, // ref.as_func
    0xfb,
    0x59, // ref.as_data
    0xfb,
    0x5a, // ref.as_i31
    0xfb,
    0x50, // ref.is_func
    0x1a, // drop
    0xd0,
    0x6e, // ref.null any
    0xfb,
    0x51, // ref.is_data
    0x1a, // drop
    0xd0,
    0x6e, // ref.null any
    0xfb,
    0x52, // ref.is_i31
    0x1a, // drop
    0x0b, // end (block)
    0x0b, // end

    0x44, // function 4: size
    0x02, // number of locals
    0x01,
    0x6c,
    0x05, // one local of type: optref 5
    0x01,
    0x6c,
    0x06, // one local of type: optref 6
    0x41,
    0x01, // i32.const 1 (default value)
    0x41,
    0x02, // i32.const 2 (length)
    0xfb,
    0x30,
    0x05, // rtt.canon 5
    0xfb,
    0x11,
    0x05, // array.new_with_rtt 5
    0x22,
    0x00, // local.tee 0
    0x20,
    0x00, // local.get 0
    0x41,
    0x01, // i32.const 1 (index)
    0xfb,
    0x13,
    0x05, // array.get 5 (reuse as index)
    0x41,
    0x02, // i32.const 2 (value)
    0xfb,
    0x16,
    0x05, // array.set 5
    0xfb,
    0x17,
    0x05, // array.len 5
    0xfb,
    0x30,
    0x06, // rtt.canon 6
    0xfb,
    0x12,
    0x06, // array.new_default_with_rtt 6
    0x22,
    0x01, // local.tee 1
    0x20,
    0x01, // local.get 1
    0x41,
    0x01, // i32.const 1 (index)
    0xfb,
    0x14,
    0x06, // array.get_s 6 (reuse as index)
    0xfb,
    0x15,
    0x06, // array.get_u 7
    0x1a, // drop
    0x20,
    0x00, // local.get 0
    0x41,
    0x00, // i32.const 0
    0x20,
    0x00, // local.get 0
    0x41,
    0x02, // i32.const 2
    0x41,
    0x01, // i32.const 1
    0xfb,
    0x18,
    0x05,
    0x05, // array.copy 5 5
    0x0b, // end

    0x12, // function 5: size
    0x00, // number of locals
    0xd0,
    0x01, // ref.null 1
    0xd0,
    0x01, // ref.null 1
    0x41,
    0x01, // i32.const 1
    0x41,
    0x00, // i32.const 0
    0x41,
    0x01, // i32.const 1
    0x1b, // select
    0x1c,
    0x01,
    0x6b,
    0x01, // select_with_type vec(ref(1))
    0x1a, // drop
    0x0b, // end

    /////////////////////////// NAME SECTION //////////////////////////
    0x00, // name section
    0x60, // section length
    0x04, // length of "name"
    0x6e,
    0x61,
    0x6d,
    0x65, // "name"

    0x04, // "type names" subsection
    0x3e, // length of subsection
    0x07, // number of entries
    0x00, // type index
    0x07, // name length
    0x73,
    0x74,
    0x72,
    0x75,
    0x63,
    0x74,
    0x41, // "structA"
    0x01, // type index
    0x07, // name length
    0x73,
    0x74,
    0x72,
    0x75,
    0x63,
    0x74,
    0x42, // "structB"
    0x02, // type index
    0x07, // name length
    0x73,
    0x74,
    0x72,
    0x75,
    0x63,
    0x74,
    0x43, // "structC"
    0x03, // type index
    0x07, // name length
    0x73,
    0x74,
    0x72,
    0x75,
    0x63,
    0x74,
    0x44, // "structD"
    0x04, // type index
    0x07, // name length
    0x73,
    0x74,
    0x72,
    0x75,
    0x63,
    0x74,
    0x45, // "structE"
    0x05, // type index
    0x06, // name length
    0x61,
    0x72,
    0x72,
    0x61,
    0x79,
    0x41, // "arrayA"
    0x06, // type index
    0x06, // name length
    0x61,
    0x72,
    0x72,
    0x61,
    0x79,
    0x42, // "arrayB"

    0x0a, // "field names" subsection
    0x19, // length of subsection
    0x02, // number of types
    0x00, // for type 0
    0x02, // number of entries for type 0
    0x00, // field index
    0x03, // length of "foo"
    0x66,
    0x6f,
    0x6f, // "foo"
    0x01, // field index
    0x03, // length of "bar"
    0x62,
    0x61,
    0x72, // "bar"
    0x01, // for type 1
    0x02, // number of entries for type 1
    0x00, // field index
    0x03, // length of "baz"
    0x62,
    0x61,
    0x7a, // "baz"
    0x01, // field index
    0x03, // length of "qux"
    0x71,
    0x75,
    0x78, // "qux"
  ];

  const expectedLines = [
    "(module",
    "  (type $structA (;0;) (struct (field $foo (;0;) (mut i32)) (field $bar (;1;) i64)))",
    "  (type $structB (;1;) (struct (field $baz (;0;) (mut i8)) (field $qux (;1;) i16)))",
    "  (type $structC (;2;) (struct (field $field0 (mut f32)) (field $field1 f64)))",
    "  (type $structD (;3;) (struct (field $field0 (mut (ref null $structA))) (field $field1 i31ref)))",
    "  (type $structE (;4;) (struct (field $field0 (ref $structB)) (field $field1 eqref) (field $field2 dataref)))",
    "  (type $arrayA (;5;) (array (field (mut i32)))",
    "  (type $arrayB (;6;) (array (field (mut i8)))",
    "  (type $type7 (func))",
    "  (func $unknown0",
    "    (local $var0 (ref null $structA)) (local $var1 (ref null $structB))",
    "    i32.const 42",
    "    i64.const 43",
    "    rtt.canon $structA",
    "    struct.new_with_rtt $structA",
    "    local.set $var0",
    "    local.get $var0",
    "    ref.as_non_null",
    "    i32.const 44",
    "    struct.set $structA $foo",
    "    local.get $var0",
    "    rtt.canon $structA",
    "    ref.cast",
    "    struct.get $structA $bar",
    "    drop",
    // ---
    "    rtt.canon $structB",
    "    rtt.sub $structB",
    "    rtt.fresh_sub $structB",
    "    struct.new_default_with_rtt $structB",
    "    local.set $var1",
    "    local.get $var1",
    "    struct.get_s $structB $baz",
    "    drop",
    "    local.get $var1",
    "    struct.get_u $structB $qux",
    "    drop",
    // ---
    "    local.get $var1",
    "    ref.null $structB",
    "    ref.eq",
    "    drop",
    "    ref.null eq",
    "    rtt.canon $structA",
    "    ref.test",
    "    drop",
    "  )",
    "  (func $unknown1",
    "    i32.const -1",
    "    i31.new",
    "    i31.get_s",
    "    i31.new",
    "    i31.get_u",
    "    drop",
    "  )",
    "  (func $unknown2",
    "    (local $var0 funcref)",
    "    ref.func $unknown1",
    "    local.set $var0",
    "    local.get $var0",
    "    call_ref",
    "    local.get $var0",
    "    return_call_ref",
    "  )",
    "  (func $unknown3",
    "    block $label0",
    "      ref.null any",
    "      br_on_null $label0",
    "      br_on_non_null $label0",
    "      rtt.canon $structA",
    "      br_on_cast $label0",
    "      br_on_cast_fail $label0",
    "      br_on_func $label0",
    "      br_on_non_func $label0",
    "      br_on_data $label0",
    "      br_on_non_data $label0",
    "      br_on_i31 $label0",
    "      br_on_non_i31 $label0",
    "      ref.as_func",
    "      ref.as_data",
    "      ref.as_i31",
    "      ref.is_func",
    "      drop",
    "      ref.null any",
    "      ref.is_data",
    "      drop",
    "      ref.null any",
    "      ref.is_i31",
    "      drop",
    "    end $label0",
    "  )",
    "  (func $unknown4",
    "    (local $var0 (ref null $arrayA)) (local $var1 (ref null $arrayB))",
    "    i32.const 1",
    "    i32.const 2",
    "    rtt.canon $arrayA",
    "    array.new_with_rtt $arrayA",
    "    local.tee $var0",
    "    local.get $var0",
    "    i32.const 1",
    "    array.get $arrayA",
    "    i32.const 2",
    "    array.set $arrayA",
    "    array.len $arrayA",
    "    rtt.canon $arrayB",
    "    array.new_default_with_rtt $arrayB",
    "    local.tee $var1",
    "    local.get $var1",
    "    i32.const 1",
    "    array.get_s $arrayB",
    "    array.get_u $arrayB",
    "    drop",
    "    local.get $var0",
    "    i32.const 0",
    "    local.get $var0",
    "    i32.const 2",
    "    i32.const 1",
    "    array.copy $arrayA $arrayA",
    "  )",
    "  (func $unknown5",
    "    ref.null $structB",
    "    ref.null $structB",
    "    i32.const 1",
    "    i32.const 0",
    "    i32.const 1",
    "    select",
    "    select (ref $structB)",
    "    drop",
    "  )",
    ")",
  ];

  test("GC disassembly", async () => {
    var data = new Uint8Array(module_bytes);

    var parser = new BinaryReader();
    parser.setData(data.buffer, 0, data.length);
    var namesReader = new NameSectionReader();
    namesReader.read(parser);

    var parser = new BinaryReader();
    parser.setData(data.buffer, 0, data.length);
    var dis = new WasmDisassembler();
    dis.skipTypes = false;

    if (namesReader.hasValidNames())
      dis.nameResolver = namesReader.getNameResolver();

    dis.disassembleChunk(parser);
    const result = dis.getResult();
    expect(result.lines).toEqual(expectedLines);
  });
});

describe("Exception handling support", () => {
  test("Exception handling disassembly", async () => {
    const { parseWat } = await wabtPromise;
    const { buffer } = parseWat(
      `test.wat`,
      `(module
        (type (func))
        (type (func (param i32)))
        (import "m" "ex" (event (type 0)))
        (event (type 1))
        (export "ex" (event 0))
        (func (param i32) (result i32)
         try (result i32)
          throw 0
         catch 0
          i32.const 0
         catch 1
         catch_all
          rethrow 0
         end
         try
          throw 0
         delegate 0
         try
          try
           throw 0
          delegate 0
         catch 0
         end
         try
          throw 0
         unwind
          nop
         end
        )
       )`,
      { exceptions: true }
    ).toBinary({ write_debug_names: true });
    const reader = new BinaryReader();
    reader.setData(buffer.buffer, 0, buffer.byteLength);

    const expectedLines = [
      "(module",
      '  (event $event0 (import "m" "ex"))',
      "  (event $event1 (param i32))",
      '  (export "ex" (event $event0))',
      "  (func $func0 (param $var0 i32) (result i32)",
      "    try $label0 (result i32)",
      "      throw $event0",
      "    catch $event0",
      "      i32.const 0",
      "    catch $event1",
      "    catch_all",
      "      rethrow $label0",
      "    end $label0",
      "    try",
      "      throw $event0",
      "    delegate 0",
      "    try $label1",
      "      try",
      "        throw $event0",
      "      delegate $label1",
      "    catch $event0",
      "    end",
      "    try",
      "      throw $event0",
      "    unwind",
      "      nop",
      "    end",
      "  )",
      ")",
    ];

    const dis = new WasmDisassembler();
    dis.disassembleChunk(reader);
    const result = dis.getResult();
    expect(result.lines).toEqual(expectedLines);
  });
});
