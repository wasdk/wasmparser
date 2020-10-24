/* Copyright 2020 Google LLC
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

import {
  BinaryReader,
  BinaryReaderState,
  IModuleHeader,
} from "../src/WasmParser";

describe("BinaryReader", () => {
  test("can parse empty Wasm module", () => {
    const buffer = new Uint8Array([
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
    reader.setData(buffer.buffer, 0, buffer.byteLength);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_WASM);
    expect((<IModuleHeader>reader.result).version).toBe(1);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_WASM);
    expect(reader.read()).toBe(false);
  });
});
