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
  DataMode,
  ElementMode,
  IModuleHeader,
  ISectionInformation,
  OperatorCode,
  SectionCode,
  Type,
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

  test("can parse Wasm module with empty Element section", () => {
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
      // Element section
      0x09, // id
      0x01, // size
      0x00, // length
    ]);
    const reader = new BinaryReader();
    reader.setData(buffer.buffer, 0, buffer.byteLength);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_WASM);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_SECTION);
    expect((<ISectionInformation>reader.result).id).toBe(SectionCode.Element);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_SECTION);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_WASM);
    expect(reader.read()).toBe(false);
  });

  test("can parse Wasm module with legacy active, funcref externval element segment", () => {
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
      // Element section
      0x09, // id
      0x0d, // size
      0x02, // length
      // legacy active, funcref externval
      0x00,
      // offset
      0x41, // i32.const 1
      0x01,
      0x0b, // end
      // function indices
      0x02, // length
      0x42,
      0x24,
      // legacy active, funcref externval
      0x00,
      // offset
      0x23, // global.get 4
      0x04,
      0x0b, // end
      // function indices
      0x00, // length
    ]);
    const reader = new BinaryReader();
    reader.setData(buffer.buffer, 0, buffer.byteLength);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_WASM);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_SECTION);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_ELEMENT_SECTION_ENTRY);
    expect(reader.result).toMatchObject({
      mode: ElementMode.Active,
      tableIndex: 0,
    });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_OFFSET_EXPRESSION_BODY);
    expect(reader.result).toBe(null);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.OFFSET_EXPRESSION_OPERATOR);
    expect(reader.result).toMatchObject({
      code: OperatorCode.i32_const,
      literal: 1,
    });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.OFFSET_EXPRESSION_OPERATOR);
    expect(reader.result).toMatchObject({ code: OperatorCode.end });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_OFFSET_EXPRESSION_BODY);
    expect(reader.result).toBe(null);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.ELEMENT_SECTION_ENTRY_BODY);
    expect(reader.result).toMatchObject({ elementType: Type.funcref });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_INIT_EXPRESSION_BODY);
    expect(reader.result).toBe(null);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.INIT_EXPRESSION_OPERATOR);
    expect(reader.result).toMatchObject({
      code: OperatorCode.ref_func,
      funcIndex: 0x42,
    });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.INIT_EXPRESSION_OPERATOR);
    expect(reader.result).toMatchObject({ code: OperatorCode.end });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_INIT_EXPRESSION_BODY);
    expect(reader.result).toBe(null);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_INIT_EXPRESSION_BODY);
    expect(reader.result).toBe(null);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.INIT_EXPRESSION_OPERATOR);
    expect(reader.result).toMatchObject({
      code: OperatorCode.ref_func,
      funcIndex: 0x24,
    });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.INIT_EXPRESSION_OPERATOR);
    expect(reader.result).toMatchObject({ code: OperatorCode.end });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_INIT_EXPRESSION_BODY);
    expect(reader.result).toBe(null);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_ELEMENT_SECTION_ENTRY);
    expect(reader.result).toBe(null);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_ELEMENT_SECTION_ENTRY);
    expect(reader.result).toMatchObject({
      mode: ElementMode.Active,
      tableIndex: 0,
    });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_OFFSET_EXPRESSION_BODY);
    expect(reader.result).toBe(null);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.OFFSET_EXPRESSION_OPERATOR);
    expect(reader.result).toMatchObject({
      code: OperatorCode.global_get,
      globalIndex: 4,
    });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.OFFSET_EXPRESSION_OPERATOR);
    expect(reader.result).toMatchObject({ code: OperatorCode.end });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_OFFSET_EXPRESSION_BODY);
    expect(reader.result).toBe(null);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.ELEMENT_SECTION_ENTRY_BODY);
    expect(reader.result).toMatchObject({ elementType: Type.funcref });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_ELEMENT_SECTION_ENTRY);
    expect(reader.result).toBe(null);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_SECTION);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_WASM);
    expect(reader.read()).toBe(false);
  });

  test("can parse Wasm module with passive, externval element segment", () => {
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
      // Element section
      0x09, // id
      0x05, // size
      0x01, // length
      // passive, externval
      0x01,
      // elementkind
      0x00,
      // function indices
      0x01, // length
      0x33,
    ]);
    const reader = new BinaryReader();
    reader.setData(buffer.buffer, 0, buffer.byteLength);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_WASM);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_SECTION);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_ELEMENT_SECTION_ENTRY);
    expect(reader.result).toMatchObject({ mode: ElementMode.Passive });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.ELEMENT_SECTION_ENTRY_BODY);
    expect(reader.result).toMatchObject({ elementType: Type.funcref });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_INIT_EXPRESSION_BODY);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.INIT_EXPRESSION_OPERATOR);
    expect(reader.result).toMatchObject({
      code: OperatorCode.ref_func,
      funcIndex: 0x33,
    });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.INIT_EXPRESSION_OPERATOR);
    expect(reader.result).toMatchObject({ code: OperatorCode.end });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_INIT_EXPRESSION_BODY);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_ELEMENT_SECTION_ENTRY);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_SECTION);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_WASM);
    expect(reader.read()).toBe(false);
  });

  test("can parse Wasm module with active, externval element segment", () => {
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
      // Element section
      0x09, // id
      0x0b, // size
      0x01, // length
      // passive, externval
      0x02,
      // tableidx
      0x09,
      // offset
      0x41, // i32.const 5
      0x05,
      0x0b, // end
      // elementkind
      0x00,
      // function indices
      0x03, // length
      0x11,
      0x22,
      0x33,
    ]);
    const reader = new BinaryReader();
    reader.setData(buffer.buffer, 0, buffer.byteLength);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_WASM);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_SECTION);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_ELEMENT_SECTION_ENTRY);
    expect(reader.result).toMatchObject({ mode: ElementMode.Active });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_OFFSET_EXPRESSION_BODY);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.OFFSET_EXPRESSION_OPERATOR);
    expect(reader.result).toMatchObject({
      code: OperatorCode.i32_const,
      literal: 5,
    });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.OFFSET_EXPRESSION_OPERATOR);
    expect(reader.result).toMatchObject({ code: OperatorCode.end });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_OFFSET_EXPRESSION_BODY);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.ELEMENT_SECTION_ENTRY_BODY);
    expect(reader.result).toMatchObject({ elementType: Type.funcref });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_INIT_EXPRESSION_BODY);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.INIT_EXPRESSION_OPERATOR);
    expect(reader.result).toMatchObject({
      code: OperatorCode.ref_func,
      funcIndex: 0x11,
    });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.INIT_EXPRESSION_OPERATOR);
    expect(reader.result).toMatchObject({ code: OperatorCode.end });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_INIT_EXPRESSION_BODY);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_INIT_EXPRESSION_BODY);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.INIT_EXPRESSION_OPERATOR);
    expect(reader.result).toMatchObject({
      code: OperatorCode.ref_func,
      funcIndex: 0x22,
    });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.INIT_EXPRESSION_OPERATOR);
    expect(reader.result).toMatchObject({ code: OperatorCode.end });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_INIT_EXPRESSION_BODY);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_INIT_EXPRESSION_BODY);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.INIT_EXPRESSION_OPERATOR);
    expect(reader.result).toMatchObject({
      code: OperatorCode.ref_func,
      funcIndex: 0x33,
    });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.INIT_EXPRESSION_OPERATOR);
    expect(reader.result).toMatchObject({ code: OperatorCode.end });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_INIT_EXPRESSION_BODY);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_ELEMENT_SECTION_ENTRY);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_SECTION);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_WASM);
    expect(reader.read()).toBe(false);
  });

  test("can parse Wasm module with declared, externval element segment", () => {
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
      // Element section
      0x09, // id
      0x05, // size
      0x01, // length
      // declared, externval
      0x03,
      // elementkind
      0x00,
      // function indices
      0x01, // length
      0x07,
    ]);
    const reader = new BinaryReader();
    reader.setData(buffer.buffer, 0, buffer.byteLength);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_WASM);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_SECTION);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_ELEMENT_SECTION_ENTRY);
    expect(reader.result).toMatchObject({ mode: ElementMode.Declarative });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.ELEMENT_SECTION_ENTRY_BODY);
    expect(reader.result).toMatchObject({ elementType: Type.funcref });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_INIT_EXPRESSION_BODY);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.INIT_EXPRESSION_OPERATOR);
    expect(reader.result).toMatchObject({
      code: OperatorCode.ref_func,
      funcIndex: 0x07,
    });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.INIT_EXPRESSION_OPERATOR);
    expect(reader.result).toMatchObject({ code: OperatorCode.end });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_INIT_EXPRESSION_BODY);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_ELEMENT_SECTION_ENTRY);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_SECTION);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_WASM);
    expect(reader.read()).toBe(false);
  });

  test("can parse Wasm module with legacy active, funcref elemexpr element segment", () => {
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
      // Element section
      0x09, // id
      0x0c, // size
      0x01, // length
      // legacy active, funcref elemexpr
      0x04,
      // offset
      0x41, // i32.const 7
      0x07,
      0x0b, // end
      // expressions
      0x02, // length
      0x23, // global.get 8
      0x08,
      0x0b, // end
      0xd0, // ref.null func
      0x70,
      0x0b, // end
    ]);
    const reader = new BinaryReader();
    reader.setData(buffer.buffer, 0, buffer.byteLength);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_WASM);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_SECTION);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_ELEMENT_SECTION_ENTRY);
    expect(reader.result).toMatchObject({
      mode: ElementMode.Active,
      tableIndex: 0,
    });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_OFFSET_EXPRESSION_BODY);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.OFFSET_EXPRESSION_OPERATOR);
    expect(reader.result).toMatchObject({
      code: OperatorCode.i32_const,
      literal: 7,
    });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.OFFSET_EXPRESSION_OPERATOR);
    expect(reader.result).toMatchObject({ code: OperatorCode.end });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_OFFSET_EXPRESSION_BODY);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.ELEMENT_SECTION_ENTRY_BODY);
    expect(reader.result).toMatchObject({ elementType: Type.funcref });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_INIT_EXPRESSION_BODY);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.INIT_EXPRESSION_OPERATOR);
    expect(reader.result).toMatchObject({
      code: OperatorCode.global_get,
      globalIndex: 8,
    });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.INIT_EXPRESSION_OPERATOR);
    expect(reader.result).toMatchObject({ code: OperatorCode.end });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_INIT_EXPRESSION_BODY);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_INIT_EXPRESSION_BODY);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.INIT_EXPRESSION_OPERATOR);
    expect(reader.result).toMatchObject({
      code: OperatorCode.ref_null,
      refType: Type.funcref,
    });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.INIT_EXPRESSION_OPERATOR);
    expect(reader.result).toMatchObject({ code: OperatorCode.end });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_INIT_EXPRESSION_BODY);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_ELEMENT_SECTION_ENTRY);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_SECTION);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_WASM);
    expect(reader.read()).toBe(false);
  });

  test("can parse Wasm module with passive, elemexpr element segment", () => {
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
      // Element section
      0x09, // id
      0x0d, // size
      0x01, // length
      // passive, elemexpr
      0x05,
      // reftype
      0x6f, // externref
      // expressions
      0x03, // length
      0xd0, // ref.null extern
      0x6f,
      0x0b, // end
      0xd0, // ref.null extern
      0x6f,
      0x0b, // end
      0xd0, // ref.null extern
      0x6f,
      0x0b, // end
    ]);
    const reader = new BinaryReader();
    reader.setData(buffer.buffer, 0, buffer.byteLength);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_WASM);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_SECTION);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_ELEMENT_SECTION_ENTRY);
    expect(reader.result).toMatchObject({ mode: ElementMode.Passive });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.ELEMENT_SECTION_ENTRY_BODY);
    expect(reader.result).toMatchObject({ elementType: Type.externref });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_INIT_EXPRESSION_BODY);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.INIT_EXPRESSION_OPERATOR);
    expect(reader.result).toMatchObject({
      code: OperatorCode.ref_null,
      refType: Type.externref,
    });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.INIT_EXPRESSION_OPERATOR);
    expect(reader.result).toMatchObject({ code: OperatorCode.end });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_INIT_EXPRESSION_BODY);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_INIT_EXPRESSION_BODY);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.INIT_EXPRESSION_OPERATOR);
    expect(reader.result).toMatchObject({
      code: OperatorCode.ref_null,
      refType: Type.externref,
    });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.INIT_EXPRESSION_OPERATOR);
    expect(reader.result).toMatchObject({ code: OperatorCode.end });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_INIT_EXPRESSION_BODY);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_INIT_EXPRESSION_BODY);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.INIT_EXPRESSION_OPERATOR);
    expect(reader.result).toMatchObject({
      code: OperatorCode.ref_null,
      refType: Type.externref,
    });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.INIT_EXPRESSION_OPERATOR);
    expect(reader.result).toMatchObject({ code: OperatorCode.end });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_INIT_EXPRESSION_BODY);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_ELEMENT_SECTION_ENTRY);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_SECTION);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_WASM);
    expect(reader.read()).toBe(false);
  });

  test("can parse Wasm module with active, elemexpr element segment", () => {
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
      // Element section
      0x09, // id
      0x12, // size
      0x02, // length
      // active, elemexpr
      0x06,
      // tableidx
      0x09,
      // offset
      0x41, // i32.const 3
      0x03,
      0x0b, // end
      // reftype
      0x6f, // externref
      // expressions
      0x01, // length
      0x23, // global.get 8
      0x08,
      0x0b, // end
      // active, elemexpr
      0x06,
      // tableidx
      0x01,
      // offset
      0x41, // i32.const 0
      0x00,
      0x0b, // end
      // reftype
      0x6f, // externref
      // expressions
      0x00, // length
    ]);
    const reader = new BinaryReader();
    reader.setData(buffer.buffer, 0, buffer.byteLength);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_WASM);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_SECTION);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_ELEMENT_SECTION_ENTRY);
    expect(reader.result).toMatchObject({
      mode: ElementMode.Active,
      tableIndex: 9,
    });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_OFFSET_EXPRESSION_BODY);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.OFFSET_EXPRESSION_OPERATOR);
    expect(reader.result).toMatchObject({
      code: OperatorCode.i32_const,
      literal: 3,
    });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.OFFSET_EXPRESSION_OPERATOR);
    expect(reader.result).toMatchObject({ code: OperatorCode.end });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_OFFSET_EXPRESSION_BODY);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.ELEMENT_SECTION_ENTRY_BODY);
    expect(reader.result).toMatchObject({ elementType: Type.externref });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_INIT_EXPRESSION_BODY);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.INIT_EXPRESSION_OPERATOR);
    expect(reader.result).toMatchObject({
      code: OperatorCode.global_get,
      globalIndex: 8,
    });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.INIT_EXPRESSION_OPERATOR);
    expect(reader.result).toMatchObject({ code: OperatorCode.end });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_INIT_EXPRESSION_BODY);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_ELEMENT_SECTION_ENTRY);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_ELEMENT_SECTION_ENTRY);
    expect(reader.result).toMatchObject({
      mode: ElementMode.Active,
      tableIndex: 1,
    });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_OFFSET_EXPRESSION_BODY);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.OFFSET_EXPRESSION_OPERATOR);
    expect(reader.result).toMatchObject({
      code: OperatorCode.i32_const,
      literal: 0,
    });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.OFFSET_EXPRESSION_OPERATOR);
    expect(reader.result).toMatchObject({ code: OperatorCode.end });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_OFFSET_EXPRESSION_BODY);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.ELEMENT_SECTION_ENTRY_BODY);
    expect(reader.result).toMatchObject({ elementType: Type.externref });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_ELEMENT_SECTION_ENTRY);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_SECTION);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_WASM);
    expect(reader.read()).toBe(false);
  });

  test("can parse Wasm module with declared, elemexpr element segment", () => {
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
      // Element section
      0x09, // id
      0x04, // size
      0x01, // length
      // declared, elemexpr
      0x07,
      // reftype
      0x6f, // externref
      // expressions
      0x00, // length
    ]);
    const reader = new BinaryReader();
    reader.setData(buffer.buffer, 0, buffer.byteLength);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_WASM);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_SECTION);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_ELEMENT_SECTION_ENTRY);
    expect(reader.result).toMatchObject({ mode: ElementMode.Declarative });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.ELEMENT_SECTION_ENTRY_BODY);
    expect(reader.result).toMatchObject({ elementType: Type.externref });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_ELEMENT_SECTION_ENTRY);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_SECTION);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_WASM);
    expect(reader.read()).toBe(false);
  });

  test("can parse Wasm module with empty Data section", () => {
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
      // Data section
      0x0b, // id
      0x01, // size
      0x00, // length
    ]);
    const reader = new BinaryReader();
    reader.setData(buffer.buffer, 0, buffer.byteLength);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_WASM);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_SECTION);
    expect((<ISectionInformation>reader.result).id).toBe(SectionCode.Data);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_SECTION);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_WASM);
    expect(reader.read()).toBe(false);
  });

  test("can parse Wasm module with active data segment", () => {
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
      // Data section
      0x0b, // id
      0x09, // size
      0x01, // length
      // Active
      0x00,
      // offset
      0x41, // i32.const 1
      0x01,
      0x0b,
      // init
      0x03, // length
      0x01,
      0x02,
      0x03,
    ]);
    const reader = new BinaryReader();
    reader.setData(buffer.buffer, 0, buffer.byteLength);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_WASM);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_SECTION);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_DATA_SECTION_ENTRY);
    expect(reader.result).toMatchObject({
      mode: DataMode.Active,
      memoryIndex: 0,
    });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_OFFSET_EXPRESSION_BODY);
    expect(reader.result).toBe(null);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.OFFSET_EXPRESSION_OPERATOR);
    expect(reader.result).toMatchObject({
      code: OperatorCode.i32_const,
      literal: 1,
    });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.OFFSET_EXPRESSION_OPERATOR);
    expect(reader.result).toMatchObject({ code: OperatorCode.end });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_OFFSET_EXPRESSION_BODY);
    expect(reader.result).toBe(null);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.DATA_SECTION_ENTRY_BODY);
    expect(reader.result).toMatchObject({ data: new Uint8Array([1, 2, 3]) });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_DATA_SECTION_ENTRY);
    expect(reader.result).toBe(null);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_SECTION);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_WASM);
    expect(reader.read()).toBe(false);
  });

  test("can parse Wasm module with passive data segment", () => {
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
      // Data section
      0x0b, // id
      0x05, // size
      0x01, // length
      // Passive
      0x01,
      // init
      0x02, // length
      0x42,
      0x42,
    ]);
    const reader = new BinaryReader();
    reader.setData(buffer.buffer, 0, buffer.byteLength);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_WASM);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_SECTION);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_DATA_SECTION_ENTRY);
    expect(reader.result).toMatchObject({ mode: DataMode.Passive });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.DATA_SECTION_ENTRY_BODY);
    expect(reader.result).toMatchObject({ data: new Uint8Array([0x42, 0x42]) });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_DATA_SECTION_ENTRY);
    expect(reader.result).toBe(null);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_SECTION);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_WASM);
    expect(reader.read()).toBe(false);
  });

  test("can parse Wasm module with active with memory index data segment", () => {
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
      // Data section
      0x0b, // id
      0x0e, // size
      0x02, // length
      // Active with memory index
      0x02,
      // memory index
      0x08,
      // offset
      0x41, // i32.const 0
      0x00,
      0x0b, // end
      // init
      0x01, // length
      0x03,
      // Active with memory index
      0x02,
      // memory index
      0x01,
      // offset
      0x23, // global.get 8
      0x08,
      0x0b, // end
      // init
      0x00, // length
    ]);
    const reader = new BinaryReader();
    reader.setData(buffer.buffer, 0, buffer.byteLength);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_WASM);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_SECTION);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_DATA_SECTION_ENTRY);
    expect(reader.result).toMatchObject({
      mode: DataMode.Active,
      memoryIndex: 8,
    });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_OFFSET_EXPRESSION_BODY);
    expect(reader.result).toBe(null);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.OFFSET_EXPRESSION_OPERATOR);
    expect(reader.result).toMatchObject({
      code: OperatorCode.i32_const,
      literal: 0,
    });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.OFFSET_EXPRESSION_OPERATOR);
    expect(reader.result).toMatchObject({ code: OperatorCode.end });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_OFFSET_EXPRESSION_BODY);
    expect(reader.result).toBe(null);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.DATA_SECTION_ENTRY_BODY);
    expect(reader.result).toMatchObject({ data: new Uint8Array([3]) });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_DATA_SECTION_ENTRY);
    expect(reader.result).toBe(null);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_DATA_SECTION_ENTRY);
    expect(reader.result).toMatchObject({
      mode: DataMode.Active,
      memoryIndex: 1,
    });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.BEGIN_OFFSET_EXPRESSION_BODY);
    expect(reader.result).toBe(null);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.OFFSET_EXPRESSION_OPERATOR);
    expect(reader.result).toMatchObject({
      code: OperatorCode.global_get,
      globalIndex: 8,
    });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.OFFSET_EXPRESSION_OPERATOR);
    expect(reader.result).toMatchObject({ code: OperatorCode.end });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_OFFSET_EXPRESSION_BODY);
    expect(reader.result).toBe(null);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.DATA_SECTION_ENTRY_BODY);
    expect(reader.result).toMatchObject({ data: new Uint8Array() });
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_DATA_SECTION_ENTRY);
    expect(reader.result).toBe(null);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_SECTION);
    expect(reader.read()).toBe(true);
    expect(reader.state).toBe(BinaryReaderState.END_WASM);
    expect(reader.read()).toBe(false);
  });
});
