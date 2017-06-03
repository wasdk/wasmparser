/* Copyright 2016 Mozilla Foundation
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
// See https://github.com/WebAssembly/design/blob/master/BinaryEncoding.md
const WASM_MAGIC_NUMBER = 0x6d736100;
const WASM_SUPPORTED_EXPERIMENTAL_VERSION = 0xd;
const WASM_SUPPORTED_VERSION = 0x1;
export const enum SectionCode {
  Unknown = -1,
  Custom = 0,
  Type = 1, // Function signature declarations
  Import = 2, // Import declarations
  Function = 3, // Function declarations
  Table = 4, // Indirect function table and other tables
  Memory = 5, // Memory attributes
  Global = 6, // Global declarations
  Export = 7, //Exports
  Start = 8, // Start function declaration
  Element = 9, // Elements section
  Code = 10, // Function bodies (code)
  Data = 11, // Data segments
}
export const enum OperatorCode {
  unreachable = 0x00,
  nop = 0x01,
  block = 0x02,
  loop = 0x03,
  if = 0x04,
  else = 0x05,
  end = 0x0b,
  br = 0x0c,
  br_if = 0x0d,
  br_table = 0x0e,
  return = 0x0f,
  call = 0x10,
  call_indirect = 0x11,
  drop = 0x1a,
  select = 0x1b,
  get_local = 0x20,
  set_local = 0x21,
  tee_local = 0x22,
  get_global = 0x23,
  set_global = 0x24,
  i32_load = 0x28,
  i64_load = 0x29,
  f32_load = 0x2a,
  f64_load = 0x2b,
  i32_load8_s = 0x2c,
  i32_load8_u = 0x2d,
  i32_load16_s = 0x2e,
  i32_load16_u = 0x2f,
  i64_load8_s = 0x30,
  i64_load8_u = 0x31,
  i64_load16_s = 0x32,
  i64_load16_u = 0x33,
  i64_load32_s = 0x34,
  i64_load32_u = 0x35,
  i32_store = 0x36,
  i64_store = 0x37,
  f32_store = 0x38,
  f64_store = 0x39,
  i32_store8 = 0x3a,
  i32_store16 = 0x3b,
  i64_store8 = 0x3c,
  i64_store16 = 0x3d,
  i64_store32 = 0x3e,
  current_memory = 0x3f,
  grow_memory = 0x40,
  i32_const = 0x41,
  i64_const = 0x42,
  f32_const = 0x43,
  f64_const = 0x44,
  i32_eqz = 0x45,
  i32_eq = 0x46,
  i32_ne = 0x47,
  i32_lt_s = 0x48,
  i32_lt_u = 0x49,
  i32_gt_s = 0x4a,
  i32_gt_u = 0x4b,
  i32_le_s = 0x4c,
  i32_le_u = 0x4d,
  i32_ge_s = 0x4e,
  i32_ge_u = 0x4f,
  i64_eqz = 0x50,
  i64_eq = 0x51,
  i64_ne = 0x52,
  i64_lt_s = 0x53,
  i64_lt_u = 0x54,
  i64_gt_s = 0x55,
  i64_gt_u = 0x56,
  i64_le_s = 0x57,
  i64_le_u = 0x58,
  i64_ge_s = 0x59,
  i64_ge_u = 0x5a,
  f32_eq = 0x5b,
  f32_ne = 0x5c,
  f32_lt = 0x5d,
  f32_gt = 0x5e,
  f32_le = 0x5f,
  f32_ge = 0x60,
  f64_eq = 0x61,
  f64_ne = 0x62,
  f64_lt = 0x63,
  f64_gt = 0x64,
  f64_le = 0x65,
  f64_ge = 0x66,
  i32_clz = 0x67,
  i32_ctz = 0x68,
  i32_popcnt = 0x69,
  i32_add = 0x6a,
  i32_sub = 0x6b,
  i32_mul = 0x6c,
  i32_div_s = 0x6d,
  i32_div_u = 0x6e,
  i32_rem_s = 0x6f,
  i32_rem_u = 0x70,
  i32_and = 0x71,
  i32_or = 0x72,
  i32_xor = 0x73,
  i32_shl = 0x74,
  i32_shr_s = 0x75,
  i32_shr_u = 0x76,
  i32_rotl = 0x77,
  i32_rotr = 0x78,
  i64_clz = 0x79,
  i64_ctz = 0x7a,
  i64_popcnt = 0x7b,
  i64_add = 0x7c,
  i64_sub = 0x7d,
  i64_mul = 0x7e,
  i64_div_s = 0x7f,
  i64_div_u = 0x80,
  i64_rem_s = 0x81,
  i64_rem_u = 0x82,
  i64_and = 0x83,
  i64_or = 0x84,
  i64_xor = 0x85,
  i64_shl = 0x86,
  i64_shr_s = 0x87,
  i64_shr_u = 0x88,
  i64_rotl = 0x89,
  i64_rotr = 0x8a,
  f32_abs = 0x8b,
  f32_neg = 0x8c,
  f32_ceil = 0x8d,
  f32_floor = 0x8e,
  f32_trunc = 0x8f,
  f32_nearest = 0x90,
  f32_sqrt = 0x91,
  f32_add = 0x92,
  f32_sub = 0x93,
  f32_mul = 0x94,
  f32_div = 0x95,
  f32_min = 0x96,
  f32_max = 0x97,
  f32_copysign = 0x98,
  f64_abs = 0x99,
  f64_neg = 0x9a,
  f64_ceil = 0x9b,
  f64_floor = 0x9c,
  f64_trunc = 0x9d,
  f64_nearest = 0x9e,
  f64_sqrt = 0x9f,
  f64_add = 0xa0,
  f64_sub = 0xa1,
  f64_mul = 0xa2,
  f64_div = 0xa3,
  f64_min = 0xa4,
  f64_max = 0xa5,
  f64_copysign = 0xa6,
  i32_wrap_i64 = 0xa7,
  i32_trunc_s_f32 = 0xa8,
  i32_trunc_u_f32 = 0xa9,
  i32_trunc_s_f64 = 0xaa,
  i32_trunc_u_f64 = 0xab,
  i64_extend_s_i32 = 0xac,
  i64_extend_u_i32 = 0xad,
  i64_trunc_s_f32 = 0xae,
  i64_trunc_u_f32 = 0xaf,
  i64_trunc_s_f64 = 0xb0,
  i64_trunc_u_f64 = 0xb1,
  f32_convert_s_i32 = 0xb2,
  f32_convert_u_i32 = 0xb3,
  f32_convert_s_i64 = 0xb4,
  f32_convert_u_i64 = 0xb5,
  f32_demote_f64 = 0xb6,
  f64_convert_s_i32 = 0xb7,
  f64_convert_u_i32 = 0xb8,
  f64_convert_s_i64 = 0xb9,
  f64_convert_u_i64 = 0xba,
  f64_promote_f32 = 0xbb,
  i32_reinterpret_f32 = 0xbc,
  i64_reinterpret_f64 = 0xbd,
  f32_reinterpret_i32 = 0xbe,
  f64_reinterpret_i64 = 0xbf,
};

export const OperatorCodeNames = [
  "unreachable", "nop", "block", "loop", "if", "else", undefined, undefined, undefined, undefined, undefined, "end", "br", "br_if", "br_table", "return", "call", "call_indirect", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, "drop", "select", undefined, undefined, undefined, undefined, "get_local", "set_local", "tee_local", "get_global", "set_global", undefined, undefined, undefined, "i32.load", "i64.load", "f32.load", "f64.load", "i32.load8_s", "i32.load8_u", "i32.load16_s", "i32.load16_u", "i64.load8_s", "i64.load8_u", "i64.load16_s", "i64.load16_u", "i64.load32_s", "i64.load32_u", "i32.store", "i64.store", "f32.store", "f64.store", "i32.store8", "i32.store16", "i64.store8", "i64.store16", "i64.store32", "current_memory", "grow_memory", "i32.const", "i64.const", "f32.const", "f64.const", "i32.eqz", "i32.eq", "i32.ne", "i32.lt_s", "i32.lt_u", "i32.gt_s", "i32.gt_u", "i32.le_s", "i32.le_u", "i32.ge_s", "i32.ge_u", "i64.eqz", "i64.eq", "i64.ne", "i64.lt_s", "i64.lt_u", "i64.gt_s", "i64.gt_u", "i64.le_s", "i64.le_u", "i64.ge_s", "i64.ge_u", "f32.eq", "f32.ne", "f32.lt", "f32.gt", "f32.le", "f32.ge", "f64.eq", "f64.ne", "f64.lt", "f64.gt", "f64.le", "f64.ge", "i32.clz", "i32.ctz", "i32.popcnt", "i32.add", "i32.sub", "i32.mul", "i32.div_s", "i32.div_u", "i32.rem_s", "i32.rem_u", "i32.and", "i32.or", "i32.xor", "i32.shl", "i32.shr_s", "i32.shr_u", "i32.rotl", "i32.rotr", "i64.clz", "i64.ctz", "i64.popcnt", "i64.add", "i64.sub", "i64.mul", "i64.div_s", "i64.div_u", "i64.rem_s", "i64.rem_u", "i64.and", "i64.or", "i64.xor", "i64.shl", "i64.shr_s", "i64.shr_u", "i64.rotl", "i64.rotr", "f32.abs", "f32.neg", "f32.ceil", "f32.floor", "f32.trunc", "f32.nearest", "f32.sqrt", "f32.add", "f32.sub", "f32.mul", "f32.div", "f32.min", "f32.max", "f32.copysign", "f64.abs", "f64.neg", "f64.ceil", "f64.floor", "f64.trunc", "f64.nearest", "f64.sqrt", "f64.add", "f64.sub", "f64.mul", "f64.div", "f64.min", "f64.max", "f64.copysign", "i32.wrap/i64", "i32.trunc_s/f32", "i32.trunc_u/f32", "i32.trunc_s/f64", "i32.trunc_u/f64", "i64.extend_s/i32", "i64.extend_u/i32", "i64.trunc_s/f32", "i64.trunc_u/f32", "i64.trunc_s/f64", "i64.trunc_u/f64", "f32.convert_s/i32", "f32.convert_u/i32", "f32.convert_s/i64", "f32.convert_u/i64", "f32.demote/f64", "f64.convert_s/i32", "f64.convert_u/i32", "f64.convert_s/i64", "f64.convert_u/i64", "f64.promote/f32", "i32.reinterpret/f32", "i64.reinterpret/f64", "f32.reinterpret/i32", "f64.reinterpret/i64", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined
];

export const enum ExternalKind {
  Function = 0,
  Table = 1,
  Memory = 2,
  Global = 3,
}
export const enum Type {
  i32 = -0x01,
  i64 = -0x02,
  f32 = -0x03,
  f64 = -0x04,
  anyfunc = -0x10,
  func = -0x20,
  empty_block_type = -0x40,
}
export const enum RelocType {
  FunctionIndex_LEB = 0,
  TableIndex_SLEB = 1,
  TableIndex_I32 = 2,
  GlobalAddr_LEB = 3,
  GlobalAddr_SLEB = 4,
  GlobalAddr_I32 = 5,
  TypeIndex_LEB = 6,
  GlobalIndex_LEB = 7,
}
export const enum LinkingType {
  StackPointer = 1,
}
export const enum NameType {
  Module = 0,
  Function = 1,
  Local = 2,
}
export const enum BinaryReaderState {
  ERROR = -1,
  INITIAL = 0,
  BEGIN_WASM = 1,
  END_WASM = 2,
  BEGIN_SECTION = 3,
  END_SECTION = 4,
  SKIPPING_SECTION = 5,
  READING_SECTION_RAW_DATA = 6,
  SECTION_RAW_DATA = 7,

  TYPE_SECTION_ENTRY = 11,
  IMPORT_SECTION_ENTRY = 12,
  FUNCTION_SECTION_ENTRY = 13,
  TABLE_SECTION_ENTRY = 14,
  MEMORY_SECTION_ENTRY = 15,
  GLOBAL_SECTION_ENTRY = 16,
  EXPORT_SECTION_ENTRY = 17,
  DATA_SECTION_ENTRY = 18,
  NAME_SECTION_ENTRY = 19,
  ELEMENT_SECTION_ENTRY = 20,
  LINKING_SECTION_ENTRY = 21,

  BEGIN_INIT_EXPRESSION_BODY = 25,
  INIT_EXPRESSION_OPERATOR = 26,
  END_INIT_EXPRESSION_BODY = 27,

  BEGIN_FUNCTION_BODY = 28,
  READING_FUNCTION_HEADER = 29,
  CODE_OPERATOR = 30,
  END_FUNCTION_BODY = 31,
  SKIPPING_FUNCTION_BODY = 32,

  BEGIN_ELEMENT_SECTION_ENTRY = 33,
  ELEMENT_SECTION_ENTRY_BODY = 34,
  END_ELEMENT_SECTION_ENTRY = 35,

  BEGIN_DATA_SECTION_ENTRY = 36,
  DATA_SECTION_ENTRY_BODY = 37,
  END_DATA_SECTION_ENTRY = 38,

  BEGIN_GLOBAL_SECTION_ENTRY = 39,
  END_GLOBAL_SECTION_ENTRY = 40,

  RELOC_SECTION_HEADER = 41,
  RELOC_SECTION_ENTRY = 42,

  SOURCE_MAPPING_URL = 43,
}
class DataRange {
  start: number;
  end: number;
  constructor(start: number, end: number) {
    this.start = start;
    this.end = end;
  }
  offset(delta: number) {
    this.start += delta;
    this.end += delta;
  }
}
export interface IModuleHeader {
  magicNumber: number;
  version: number;
}
export interface IResizableLimits {
  flags: number;
  initial: number;
  maximum?: number;
}
export interface ITableType {
  elementType: number;
  limits: IResizableLimits;
}
export interface IMemoryType {
  limits: IResizableLimits;
}
export interface IGlobalType {
  contentType: number;
  mutability: number;
}
export interface IGlobalVariable {
  type: IGlobalType;
}
export interface IElementSegment {
  index: number;
}
export interface IElementSegmentBody {
  elements: Uint32Array;
}
export interface IDataSegment {
  index: number;
}
export interface IDataSegmentBody {
  data: Uint8Array;
}
export type ImportEntryType = ITableType | IMemoryType | IGlobalType;
export interface IImportEntry {
  module: Uint8Array;
  field: Uint8Array;
  kind: ExternalKind;
  funcTypeIndex?: number;
  type?: ImportEntryType;
}
export interface IExportEntry {
   field: Uint8Array;
   kind: ExternalKind;
   index: number;
}
export interface INameEntry {
   type: NameType;
}
export interface INaming {
  index: number;
  name: Uint8Array;
}
export interface IModuleNameEntry extends INameEntry {
  moduleName: Uint8Array;
}
export interface IFunctionNameEntry extends INameEntry {
  names: INaming[];
}
export interface ILocalName {
  index: number;
  locals: INaming[];
}
export interface ILocalNameEntry extends INameEntry {
  funcs: ILocalName[];
}
export interface ILinkingEntry {
  type: LinkingType;
  index?: number;
}
export interface IRelocHeader {
  id: SectionCode;
  name: Uint8Array;
}
export interface IRelocEntry {
  type: RelocType;
  offset: number;
  index: number;
  addend?: number;
}
export interface ISourceMappingURL {
  url: Uint8Array;
}
export interface IFunctionEntry {
  typeIndex: number;
}
export interface IFunctionType {
  form: number;
  params: Int8Array;
  returns: Int8Array;
}
export interface ISectionInformation {
  id: SectionCode;
  name: Uint8Array;
}
export interface ILocals {
  count: number;
  type: number;
}
export interface IFunctionInformation {
  locals: Array<ILocals>;
}
export interface IMemoryAddress {
  flags: number;
  offset: number;
}
export interface IOperatorInformation {
  code: OperatorCode;
  blockType?: number;
  brDepth?: number;
  brTable?: Array<number>;
  funcIndex?: number;
  typeIndex?: number;
  localIndex?: number;
  globalIndex?: number;
  memoryAddress?: IMemoryAddress;
  literal?: number | Int64;
}
export class Int64 {
  private _data: Uint8Array;
  constructor (data) {
    this._data = data || new Uint8Array(8);
  }
  public toInt32(): number {
    return this._data[0] | (this._data[1] << 8) | (this._data[2] << 16) | (this._data[3] << 24);
  }
  public toDouble(): number {
    var power = 1;
    var sum;
    if (this._data[7] & 0x80) {
      sum = -1;
      for (var i = 0; i < 8; i++, power *= 256)
        sum -= power * (0xFF ^ this._data[i]);
    } else {
      sum = 0;
      for (var i = 0; i < 8; i++, power *= 256)
        sum += power * this._data[i];
    }
    return sum;
  }
  public get data(): Uint8Array {
    return this._data;
  }
}
export type BinaryReaderResult =
  IImportEntry | IExportEntry | IFunctionEntry | IFunctionType | IModuleHeader |
  IOperatorInformation | IMemoryType | ITableType | IGlobalVariable | INameEntry |
  IElementSegment | IElementSegmentBody | IDataSegment | IDataSegmentBody |
  ISectionInformation | IFunctionInformation | ISectionInformation |
  IFunctionInformation | IRelocHeader | IRelocEntry | ILinkingEntry |
  ISourceMappingURL | IModuleNameEntry | Uint8Array;
export class BinaryReader {
  private _data: Uint8Array;
  private _pos: number;
  private _length: number;
  private _eof: boolean;
  public state: BinaryReaderState;
  public result: BinaryReaderResult;
  public error: Error;
  public get currentSection(): ISectionInformation {
    return <ISectionInformation>this.result; // TODO remove currentSection()
  }
  public get currentFunction(): IFunctionInformation {
    return <IFunctionInformation>this.result; // TODO remove currentFunction()
  }
  private _sectionEntriesLeft: number;
  private _sectionId: SectionCode;
  private _sectionRange: DataRange;
  private _functionRange: DataRange;
  public get data(): Uint8Array {
    return this._data;
  }
  public get position(): number {
    return this._pos;
  }
  public get length(): number {
    return this._length;
  }
  constructor() {
    this._data = null;
    this._pos = 0;
    this._length = 0;
    this._eof = false;
    this.state = BinaryReaderState.INITIAL;
    this.result = null;
    this.error = null;
    this._sectionEntriesLeft = 0;
    this._sectionId = SectionCode.Unknown;
    this._sectionRange = null;
    this._functionRange = null;
  }
  public setData(buffer: ArrayBuffer, pos: number, length: number, eof?: boolean): void {
    var posDelta = pos - this._pos;
    this._data = new Uint8Array(buffer);
    this._pos = pos;
    this._length = length;
    this._eof = eof === undefined ? true : eof;
    if (this._sectionRange)
      this._sectionRange.offset(posDelta);
    if (this._functionRange)
      this._functionRange.offset(posDelta);
  }
  private hasBytes(n: number): boolean {
    return this._pos + n <= this._length;
  }
  public hasMoreBytes() {
    return this.hasBytes(1);
  }
  private readUint8(): number {
    return this._data[this._pos++];
  }
  private readUint16(): number {
    var b1 = this._data[this._pos++];
    var b2 = this._data[this._pos++];
    return b1 | (b2 << 8);
  }
  private readInt32(): number {
    var b1 = this._data[this._pos++];
    var b2 = this._data[this._pos++];
    var b3 = this._data[this._pos++];
    var b4 = this._data[this._pos++];
    return b1 | (b2 << 8) | (b3 << 16) | (b4 << 24);
  }
  private readUint32(): number {
    return this.readInt32();
  }
  private peekInt32(): number {
    var b1 = this._data[this._pos];
    var b2 = this._data[this._pos + 1];
    var b3 = this._data[this._pos + 2];
    var b4 = this._data[this._pos + 3];
    return b1 | (b2 << 8) | (b3 << 16) | (b4 << 24);
  }
  private peekUint32(): number {
    return this.peekInt32();
  }
  private hasVarIntBytes(): boolean {
    var pos = this._pos;
    while (pos < this._length) {
      if ((this._data[pos++] & 0x80) == 0)
        return true;
    }
    return false;
  }
  private readVarUint1(): number {
    return this.readUint8();
  }
  private readVarInt7(): number {
    return (this.readUint8() << 25) >> 25;
  }
  private readVarUint7(): number {
    return this.readUint8();
  }
  private readVarInt32(): number {
    var result = 0;
    var shift = 0;
    while (true) {
      var byte = this.readUint8();
      result |= (byte & 0x7F) << shift;
      shift += 7;
      if ((byte & 0x80) === 0)
        break;
    }
    if (shift >= 32)
      return result;
    var ashift = (32 - shift);
    return (result << ashift) >> ashift;
  }
  private readVarUint32(): number {
    var result = 0;
    var shift = 0;
    while (true) {
      var byte = this.readUint8();
      result |= (byte & 0x7F) << shift;
      shift += 7;
      if ((byte & 0x80) === 0)
        break;
    }
    return result;
  }
  private readVarInt64(): Int64 {
    var result = new Uint8Array(8);
    var i = 0;
    var c = 0;
    var shift = 0;
    while (true) {
      var byte = this.readUint8();
      c |= (byte & 0x7F) << shift;
      shift += 7;
      if (shift > 8) {
        result[i++] = c & 0xFF;
        c >>= 8;
        shift -= 8;
      }
      if ((byte & 0x80) === 0)
        break;
    }
    var ashift = (32 - shift);
    c = (c << ashift) >> ashift;
    while (i < 8) {
      result[i++] = c & 0xFF;
      c >>= 8;
    }
    return new Int64(result);
  }
  private readStringBytes(): Uint8Array {
    var length = this.readVarUint32() >>> 0;
    return this.readBytes(length);
  }
  private readBytes(length: number): Uint8Array {
    var result = this._data.subarray(this._pos, this._pos + length);
    this._pos += length;
    return new Uint8Array(result); // making a clone of the data
  }
  private hasStringBytes(): boolean {
    if (!this.hasVarIntBytes())
      return false;
    var pos = this._pos;
    var length = this.readVarUint32() >>> 0;
    var result = this.hasBytes(length);
    this._pos = pos;
    return result;
  }
  private hasSectionPayload(): boolean {
    return this.hasBytes(this._sectionRange.end - this._pos);
  }
  private readFuncType(): IFunctionType {
    var form = this.readVarInt7();
    var paramCount = this.readVarUint32() >>> 0;
    var paramTypes = new Int8Array(paramCount);
    for (var i = 0; i < paramCount; i++)
      paramTypes[i] = this.readVarInt7();
    var returnCount = this.readVarUint1();
    var returnTypes = new Int8Array(returnCount);
    for (var i = 0; i < returnCount; i++)
      returnTypes[i] = this.readVarInt7();
    return {
      form: form,
      params: paramTypes,
      returns: returnTypes
    };
  }
  private readResizableLimits(): IResizableLimits {
    var flags = this.readVarUint32() >>> 0;
    var initial = this.readVarUint32() >>> 0;
    var maximum;
    if (flags & 0x1) {
      maximum = this.readVarUint32() >>> 0;
    }
    return { flags: flags, initial: initial, maximum: maximum };
  }
  private readTableType() : ITableType{
    var elementType = this.readVarInt7();
    var limits = this.readResizableLimits();
    return { elementType: elementType, limits: limits };
  }
  private readMemoryType(): IMemoryType {
    return { limits: this.readResizableLimits() };
  }
  private readGlobalType(): IGlobalType {
    if (!this.hasVarIntBytes()) {
      return null;
    }
    var pos = this._pos;
    var contentType = this.readVarInt7();
    if (!this.hasVarIntBytes()) {
      this._pos = pos;
      return null;
    }
    var mutability = this.readVarUint1();
    return { contentType: contentType, mutability: mutability };
  }
  private readTypeEntry() {
    if (this._sectionEntriesLeft === 0) {
      this.skipSection();
      return this.read();
    }
    this.state = BinaryReaderState.TYPE_SECTION_ENTRY;
    this.result = this.readFuncType();
    this._sectionEntriesLeft--;
    return true;
  }
  private readImportEntry() {
    if (this._sectionEntriesLeft === 0) {
      this.skipSection();
      return this.read();
    }
    this.state = BinaryReaderState.IMPORT_SECTION_ENTRY;
    var module = this.readStringBytes();
    var field = this.readStringBytes();
    var kind = this.readUint8();
    var funcTypeIndex: number;
    var type: (ITableType|IMemoryType|IGlobalType);
    switch (kind) {
      case ExternalKind.Function:
        funcTypeIndex = this.readVarUint32() >>> 0;
        break;
      case ExternalKind.Table:
        type = this.readTableType();
        break;
      case ExternalKind.Memory:
        type = this.readMemoryType();
        break;
      case ExternalKind.Global:
        type = this.readGlobalType();
        break;
    }
    this.result = {
      module: module,
      field: field,
      kind: kind,
      funcTypeIndex: funcTypeIndex,
      type: type
    };
    this._sectionEntriesLeft--;
    return true;
  }
  private readExportEntry(): boolean {
    if (this._sectionEntriesLeft === 0) {
      this.skipSection();
      return this.read();
    }
    var field = this.readStringBytes();
    var kind = this.readUint8();
    var index = this.readVarUint32() >>> 0;
    this.state = BinaryReaderState.EXPORT_SECTION_ENTRY;
    this.result = { field: field, kind: kind, index: index };
    this._sectionEntriesLeft--;
    return true;
  }
  private readFunctionEntry(): boolean {
    if (this._sectionEntriesLeft === 0) {
      this.skipSection();
      return this.read();
    }
    var typeIndex = this.readVarUint32() >>> 0;
    this.state = BinaryReaderState.FUNCTION_SECTION_ENTRY;
    this.result = {typeIndex: typeIndex};
    this._sectionEntriesLeft--;
    return true;
  }
  private readTableEntry(): boolean {
    if (this._sectionEntriesLeft === 0) {
      this.skipSection();
      return this.read();
    }
    this.state = BinaryReaderState.TABLE_SECTION_ENTRY;
    this.result = this.readTableType();
    this._sectionEntriesLeft--;
    return true;
  }
  private readMemoryEntry(): boolean {
    if (this._sectionEntriesLeft === 0) {
      this.skipSection();
      return this.read();
    }
    this.state = BinaryReaderState.MEMORY_SECTION_ENTRY;
    this.result = this.readMemoryType();
    this._sectionEntriesLeft--;
    return true;
  }
  private readGlobalEntry(): boolean {
    if (this._sectionEntriesLeft === 0) {
      this.skipSection();
      return this.read();
    }
    var globalType = this.readGlobalType();
    if (!globalType) {
      this.state = BinaryReaderState.GLOBAL_SECTION_ENTRY;
      return false;
    }
    this.state = BinaryReaderState.BEGIN_GLOBAL_SECTION_ENTRY;
    this.result = {
      type: globalType
    };
    this._sectionEntriesLeft--;
    return true;
  }
  private readElementEntry(): boolean {
    if (this._sectionEntriesLeft === 0) {
      this.skipSection();
      return this.read();
    }
    if (!this.hasVarIntBytes()) {
      this.state = BinaryReaderState.ELEMENT_SECTION_ENTRY;
      return false;
    }
    var tableIndex = this.readVarUint32();
    this.state = BinaryReaderState.BEGIN_ELEMENT_SECTION_ENTRY;
    this.result = { index: tableIndex };
    this._sectionEntriesLeft--;
    return true;
  }
  private readElementEntryBody(): boolean {
    if (!this.hasVarIntBytes())
      return false;
    var pos = this._pos;
    var numElemements = this.readVarUint32();
    if (!this.hasBytes(numElemements)) {
      // Shall have at least the numElemements amount of bytes.
      this._pos = pos;
      return false;
    }
    var elements = new Uint32Array(numElemements);
    for (var i = 0; i < numElemements; i++) {
      if (!this.hasVarIntBytes()) {
        this._pos = pos;
        return false;
      }
      elements[i] = this.readVarUint32();
    }
    this.state = BinaryReaderState.ELEMENT_SECTION_ENTRY_BODY;
    this.result = { elements: elements };
    return true;
  }
  private readDataEntry(): boolean {
    if (this._sectionEntriesLeft === 0) {
      this.skipSection();
      return this.read();
    }
    if (!this.hasVarIntBytes()) {
       return false;
    }
    this.state = BinaryReaderState.BEGIN_DATA_SECTION_ENTRY;
    this.result = {
      index: this.readVarUint32()
    };
    this._sectionEntriesLeft--;
    return true;
  }
  private readDataEntryBody(): boolean {
    if (!this.hasStringBytes()) {
      return false;
    }
    this.state = BinaryReaderState.DATA_SECTION_ENTRY_BODY;
    this.result = {
      data: this.readStringBytes()
    };
    return true;
  }
  private readInitExpressionBody(): boolean {
    this.state = BinaryReaderState.BEGIN_INIT_EXPRESSION_BODY;
    this.result = null;
    return true;
  }
  private readMemoryImmediate(): IMemoryAddress {
    var flags = this.readVarUint32() >>> 0;
    var offset = this.readVarUint32() >>> 0;
    return { flags: flags, offset: offset };
  }
  private readNameMap(): INaming[] {
    var count = this.readVarUint32();
    var result: INaming[] = [];
    for (var i = 0; i < count; i++) {
      var index = this.readVarUint32();
      var name = this.readStringBytes();
      result.push({index: index, name: name});
    }
    return result;
  }
  private readNameEntry(): boolean {
    var pos = this._pos;
    if (pos >= this._sectionRange.end) {
      this.skipSection();
      return this.read();
    }
    if (!this.hasVarIntBytes())
      return false;
    var type: NameType = this.readVarUint7();
    if (!this.hasVarIntBytes()) {
      this._pos = pos;
      return false;
    }
    var payloadLength = this.readVarUint32();
    if (!this.hasBytes(payloadLength)) {
      this._pos = pos;
      return false;
    }
    var result: (IModuleNameEntry|IFunctionNameEntry|ILocalNameEntry);
    switch (type) {
      case NameType.Module:
        result = {
          type: type,
          moduleName: this.readStringBytes()
        };
        break;
      case NameType.Function:
        result = {
          type: type,
          names: this.readNameMap()
        };
        break;
      case NameType.Local:
        var funcsLength = this.readVarUint32();
        var funcs: ILocalName[] = [];
        for (var i = 0; i < funcsLength; i++) {
          var funcIndex = this.readVarUint32();
          funcs.push({
            index: funcIndex,
            locals: this.readNameMap()
          });
        }
        result = {
          type: type,
          funcs: funcs
        };
        break;
      default:
        this.error = new Error(`Bad name entry type: ${type}`);
        this.state = BinaryReaderState.ERROR;
        return true;
    }
    this.state = BinaryReaderState.NAME_SECTION_ENTRY;
    this.result = result;
    return true;
  }
  private readRelocHeader(): boolean {
    // See https://github.com/WebAssembly/tool-conventions/blob/master/Linking.md
    if (!this.hasVarIntBytes()) {
      return false;
    }
    var pos = this._pos;
    var sectionId: SectionCode = this.readVarUint7();
    var sectionName;
    if (sectionId === SectionCode.Custom) {
      if (!this.hasStringBytes()) {
        this._pos = pos;
        return false;
      }
      sectionName = this.readStringBytes();
    }
    this.state = BinaryReaderState.RELOC_SECTION_HEADER;
    this.result = {
      id: sectionId,
      name: sectionName,
    };
    return true;
  }
  private readLinkingEntry(): boolean {
    if (this._sectionEntriesLeft === 0) {
      this.skipSection();
      return this.read();
    }
    if (!this.hasVarIntBytes())
      return false;
    var pos = this._pos;
    var type: LinkingType = this.readVarUint32() >>> 0;
    var index;
    switch (type) {
      case LinkingType.StackPointer:
        if (!this.hasVarIntBytes()) {
          this._pos = pos;
          return false;
        }
        index = this.readVarUint32();
        break;
      default:
        this.error = new Error(`Bad linking type: ${type}`);
        this.state = BinaryReaderState.ERROR;
        return true;
    }
    this.state = BinaryReaderState.LINKING_SECTION_ENTRY;
    this.result = {type: type, index: index};
    this._sectionEntriesLeft--;
    return true;
  }
  private readSourceMappingURL(): boolean {
    if (!this.hasStringBytes())
      return false;
    var url = this.readStringBytes();
    this.state = BinaryReaderState.SOURCE_MAPPING_URL;
    this.result = {url: url};
    return true;
  }
  private readRelocEntry(): boolean {
    if (this._sectionEntriesLeft === 0) {
      this.skipSection();
      return this.read();
    }
    if (!this.hasVarIntBytes())
      return false;
    var pos = this._pos;
    var type: RelocType = this.readVarUint7();
    if (!this.hasVarIntBytes()) {
      this._pos = pos;
      return false;
    }
    var offset = this.readVarUint32();
    if (!this.hasVarIntBytes()) {
      this._pos = pos;
      return false;
    }
    var index = this.readVarUint32();
    var addend;
    switch (type) {
      case RelocType.FunctionIndex_LEB:
      case RelocType.TableIndex_SLEB:
      case RelocType.TableIndex_I32:
      case RelocType.TypeIndex_LEB:
      case RelocType.GlobalIndex_LEB:
        break;
      case RelocType.GlobalAddr_LEB:
      case RelocType.GlobalAddr_SLEB:
      case RelocType.GlobalAddr_I32:
        if (!this.hasVarIntBytes()) {
          this._pos = pos;
          return false;
        }
        addend = this.readVarUint32();
        break;
      default:
        this.error = new Error(`Bad relocation type: ${type}`);
        this.state = BinaryReaderState.ERROR;
        return true;
    }
    this.state = BinaryReaderState.RELOC_SECTION_ENTRY;
    this.result = {
      type: type,
      offset: offset,
      index: index,
      addend: addend
    };
    this._sectionEntriesLeft--;
    return true;
  }
  private readCodeOperator(): boolean {
    if (this.state === BinaryReaderState.CODE_OPERATOR &&
        this._pos >= this._functionRange.end) {
      this.skipFunctionBody();
      return this.read();
    } else if (this.state === BinaryReaderState.INIT_EXPRESSION_OPERATOR &&
               this.result &&
               (<IOperatorInformation>this.result).code === OperatorCode.end) {
      this.state = BinaryReaderState.END_INIT_EXPRESSION_BODY;
      this.result = null;
      return true;
    }
    const MAX_CODE_OPERATOR_SIZE = 11; // i64.const or load/store
    var pos = this._pos;
    if (!this._eof && pos + MAX_CODE_OPERATOR_SIZE > this._length) {
      return false;
    }
    var code = this._data[this._pos++];
    var blockType, brDepth, brTable, funcIndex, typeIndex,
        localIndex, globalIndex, memoryAddress, literal, reserved;
    switch (code) {
      case OperatorCode.block:
      case OperatorCode.loop:
      case OperatorCode.if:
        blockType = this.readVarInt7();
        break;
      case OperatorCode.br:
      case OperatorCode.br_if:
        brDepth = this.readVarUint32() >>> 0;
        break;
      case OperatorCode.br_table:
        var tableCount = this.readVarUint32() >>> 0;
        if (!this.hasBytes(tableCount + 1)) {
          // We need at least (tableCount + 1) bytes
          this._pos = pos;
          return false;
        }
        brTable = [];
        for (var i = 0; i <= tableCount; i++) { // including default
          if (!this.hasVarIntBytes()) {
            this._pos = pos;
            return false;
          }
          brTable.push(this.readVarUint32() >>> 0);
        }
        break;
      case OperatorCode.call:
        funcIndex = this.readVarUint32() >>> 0;
        break;
      case OperatorCode.call_indirect:
        typeIndex = this.readVarUint32() >>> 0;
        reserved = this.readVarUint1();
        break;
      case OperatorCode.get_local:
      case OperatorCode.set_local:
      case OperatorCode.tee_local:
        localIndex = this.readVarUint32() >>> 0;
        break;
      case OperatorCode.get_global:
      case OperatorCode.set_global:
        globalIndex = this.readVarUint32() >>> 0;
        break;
      case OperatorCode.i32_load:
      case OperatorCode.i64_load:
      case OperatorCode.f32_load:
      case OperatorCode.f64_load:
      case OperatorCode.i32_load8_s:
      case OperatorCode.i32_load8_u:
      case OperatorCode.i32_load16_s:
      case OperatorCode.i32_load16_u:
      case OperatorCode.i64_load8_s:
      case OperatorCode.i64_load8_u:
      case OperatorCode.i64_load16_s:
      case OperatorCode.i64_load16_u:
      case OperatorCode.i64_load32_s:
      case OperatorCode.i64_load32_u:
      case OperatorCode.i32_store:
      case OperatorCode.i64_store:
      case OperatorCode.f32_store:
      case OperatorCode.f64_store:
      case OperatorCode.i32_store8:
      case OperatorCode.i32_store16:
      case OperatorCode.i64_store8:
      case OperatorCode.i64_store16:
      case OperatorCode.i64_store32:
        memoryAddress = this.readMemoryImmediate();
        break;
      case OperatorCode.current_memory:
      case OperatorCode.grow_memory:
        reserved = this.readVarUint1();
        break;
      case OperatorCode.i32_const:
        literal = this.readVarInt32();
        break;
      case OperatorCode.i64_const:
        literal = this.readVarInt64();
        break;
      case OperatorCode.f32_const:
        literal = new DataView(this._data.buffer, this._data.byteOffset).getFloat32(this._pos, true);
        this._pos += 4;
        break;
      case OperatorCode.f64_const:
        literal = new DataView(this._data.buffer, this._data.byteOffset).getFloat64(this._pos, true);
        this._pos += 8;
        break;
    }
    this.result = { code: code,
      blockType: blockType, brDepth: brDepth, brTable: brTable,
      funcIndex: funcIndex, typeIndex: typeIndex, localIndex: localIndex,
      globalIndex: globalIndex, memoryAddress: memoryAddress, literal: literal};
    return true;
  }
  private readFunctionBody(): boolean {
    if (this._sectionEntriesLeft === 0) {
      this.skipSection();
      return this.read();
    }
    if (!this.hasVarIntBytes())
      return false;
    var pos = this._pos;
    var size = this.readVarUint32() >>> 0;
    var bodyEnd = this._pos + size;
    if (!this.hasVarIntBytes()) {
      this._pos = pos;
      return false;
    }
    var localCount = this.readVarUint32() >>> 0;
    var locals: Array<ILocals> = [];
    for (var i = 0; i < localCount; i++) {
      if (!this.hasVarIntBytes()) {
        this._pos = pos;
        return false;
      }
      var count = this.readVarUint32() >>> 0;
      if (!this.hasVarIntBytes()) {
        this._pos = pos;
        return false;
      }
      var type = this.readVarInt7();
      locals.push({count: count, type: type});
    }
    var bodyStart = this._pos;
    this.state = BinaryReaderState.BEGIN_FUNCTION_BODY;
    this.result = {
      locals: locals
    };
    this._functionRange = new DataRange(bodyStart, bodyEnd);
    this._sectionEntriesLeft--;
    return true;
  }
  private readSectionHeader(): boolean {
    if (this._pos >= this._length && this._eof) {
      this._sectionId = SectionCode.Unknown;
      this._sectionRange = null;
      this.result = null;
      this.state = BinaryReaderState.END_WASM;
      return true;
    }
    // TODO: Handle _eof.
    if (this._pos < this._length - 4) {
      var magicNumber = this.peekInt32();
      if (magicNumber === WASM_MAGIC_NUMBER) {
        this._sectionId = SectionCode.Unknown;
        this._sectionRange = null;
        this.result = null;
        this.state = BinaryReaderState.END_WASM;
        return true;
      }
    }
    if (!this.hasVarIntBytes())
      return false;
    var sectionStart = this._pos;
    var id = this.readVarUint7();
    if (!this.hasVarIntBytes()) {
      this._pos = sectionStart;
      return false;
    }
    var payloadLength = this.readVarUint32() >>> 0;
    var name = null;
    var payloadEnd = this._pos + payloadLength;
    if (id == 0) {
      if (!this.hasStringBytes()) {
        this._pos = sectionStart;
        return false;
      }
      name = this.readStringBytes();
    }
    this.result = {id: id, name: name};
    this._sectionId = id;
    this._sectionRange = new DataRange(this._pos, payloadEnd);
    this.state = BinaryReaderState.BEGIN_SECTION;
    return true;
  }
  private readSectionRawData(): boolean {
    var payloadLength = this._sectionRange.end - this._sectionRange.start;
    if (!this.hasBytes(payloadLength)) {
      return false;
    }
    this.state = BinaryReaderState.SECTION_RAW_DATA;
    this.result = this.readBytes(payloadLength);
    return true;
  }
  private readSectionBody(): boolean {
    if (this._pos >= this._sectionRange.end) {
      this.result = null;
      this.state = BinaryReaderState.END_SECTION;
      this._sectionId = SectionCode.Unknown;
      this._sectionRange = null;
      return true;
    }
    var currentSection = <ISectionInformation>this.result;
    switch (currentSection.id) {
      case SectionCode.Type:
        if (!this.hasSectionPayload())
          return false;
        this._sectionEntriesLeft = this.readVarUint32() >>> 0;
        return this.readTypeEntry();
      case SectionCode.Import:
        if (!this.hasSectionPayload())
          return false;
        this._sectionEntriesLeft = this.readVarUint32() >>> 0;
        return this.readImportEntry();
      case SectionCode.Export:
        if (!this.hasSectionPayload())
          return false;
        this._sectionEntriesLeft = this.readVarUint32() >>> 0;
        return this.readExportEntry();
      case SectionCode.Function:
        if (!this.hasSectionPayload())
          return false;
        this._sectionEntriesLeft = this.readVarUint32() >>> 0;
        return this.readFunctionEntry();
      case SectionCode.Table:
        if (!this.hasSectionPayload())
          return false;
        this._sectionEntriesLeft = this.readVarUint32() >>> 0;
        return this.readTableEntry();
      case SectionCode.Memory:
        if (!this.hasSectionPayload())
          return false;
        this._sectionEntriesLeft = this.readVarUint32() >>> 0;
        return this.readMemoryEntry();
      case SectionCode.Global:
        if (!this.hasVarIntBytes())
          return false;
        this._sectionEntriesLeft = this.readVarUint32() >>> 0;
        return this.readGlobalEntry();
      case SectionCode.Code:
        if (!this.hasVarIntBytes())
          return false;
        this._sectionEntriesLeft = this.readVarUint32() >>> 0;
        this.state = BinaryReaderState.READING_FUNCTION_HEADER;
        return this.readFunctionBody();
      case SectionCode.Element:
        if (!this.hasVarIntBytes())
          return false;
        this._sectionEntriesLeft = this.readVarUint32() >>> 0;
        return this.readElementEntry();
      case SectionCode.Data:
        if (!this.hasVarIntBytes())
          return false;
        this._sectionEntriesLeft = this.readVarUint32() >>> 0;
        this.state = BinaryReaderState.DATA_SECTION_ENTRY;
        return this.readDataEntry();
      case SectionCode.Custom:
        var customSectionName = bytesToString(currentSection.name);
        if (customSectionName === 'name') {
          return this.readNameEntry();
        }
        if (customSectionName.indexOf('reloc.') === 0) {
          return this.readRelocHeader();
        }
        if (customSectionName === 'linking') {
          if (!this.hasVarIntBytes())
            return false;
          this._sectionEntriesLeft = this.readVarUint32() >>> 0;
          return this.readLinkingEntry();
        }
        if (customSectionName === 'sourceMappingURL') {
          return this.readSourceMappingURL();
        }
        return this.readSectionRawData();
      default:
        this.error = new Error(`Unsupported section: ${this._sectionId}`);
        this.state = BinaryReaderState.ERROR;
        return true;
    }
  }
  public read(): boolean {
    switch (this.state) {
      case BinaryReaderState.INITIAL:
        if (!this.hasBytes(8))
          return false;
        var magicNumber = this.readUint32();
        if (magicNumber != WASM_MAGIC_NUMBER) {
          this.error = new Error('Bad magic number');
          this.state = BinaryReaderState.ERROR;
          return true;
        }
        var version = this.readUint32();
        if (version != WASM_SUPPORTED_VERSION &&
            version != WASM_SUPPORTED_EXPERIMENTAL_VERSION) {
          this.error = new Error(`Bad version number ${version}`);
          this.state = BinaryReaderState.ERROR;
          return true;
        }
        this.result = {magicNumber: magicNumber, version: version};
        this.state = BinaryReaderState.BEGIN_WASM;
        return true;
      case BinaryReaderState.END_WASM:
        this.result = null;
        this.state = BinaryReaderState.BEGIN_WASM;
        if (this.hasMoreBytes()) {
          this.state = BinaryReaderState.INITIAL;
          return this.read();
        }
        return false;
      case BinaryReaderState.ERROR:
        return true;
      case BinaryReaderState.BEGIN_WASM:
      case BinaryReaderState.END_SECTION:
         return this.readSectionHeader();
      case BinaryReaderState.BEGIN_SECTION:
        return this.readSectionBody();
      case BinaryReaderState.SKIPPING_SECTION:
        if (!this.hasSectionPayload()) {
          return false;
        }
        this.state = BinaryReaderState.END_SECTION;
        this._pos = this._sectionRange.end;
        this._sectionId = SectionCode.Unknown;
        this._sectionRange = null;
        this.result = null;
        return true;
      case BinaryReaderState.SKIPPING_FUNCTION_BODY:
        this.state = BinaryReaderState.END_FUNCTION_BODY;
        this._pos = this._functionRange.end;
        this._functionRange = null;
        this.result = null;
        return true;
      case BinaryReaderState.TYPE_SECTION_ENTRY:
        return this.readTypeEntry();
      case BinaryReaderState.IMPORT_SECTION_ENTRY:
        return this.readImportEntry();
      case BinaryReaderState.EXPORT_SECTION_ENTRY:
        return this.readExportEntry();
      case BinaryReaderState.FUNCTION_SECTION_ENTRY:
        return this.readFunctionEntry();
      case BinaryReaderState.TABLE_SECTION_ENTRY:
        return this.readTableEntry();
      case BinaryReaderState.MEMORY_SECTION_ENTRY:
        return this.readMemoryEntry();
      case BinaryReaderState.GLOBAL_SECTION_ENTRY:
      case BinaryReaderState.END_GLOBAL_SECTION_ENTRY:
        return this.readGlobalEntry();
      case BinaryReaderState.BEGIN_GLOBAL_SECTION_ENTRY:
        return this.readInitExpressionBody();
      case BinaryReaderState.ELEMENT_SECTION_ENTRY:
      case BinaryReaderState.END_ELEMENT_SECTION_ENTRY:
        return this.readElementEntry();
      case BinaryReaderState.BEGIN_ELEMENT_SECTION_ENTRY:
        return this.readInitExpressionBody();
      case BinaryReaderState.ELEMENT_SECTION_ENTRY_BODY:
        this.state = BinaryReaderState.END_ELEMENT_SECTION_ENTRY;
        this.result = null;
        return true;
      case BinaryReaderState.DATA_SECTION_ENTRY:
      case BinaryReaderState.END_DATA_SECTION_ENTRY:
        return this.readDataEntry();
      case BinaryReaderState.BEGIN_DATA_SECTION_ENTRY:
        return this.readInitExpressionBody();
      case BinaryReaderState.DATA_SECTION_ENTRY_BODY:
        this.state = BinaryReaderState.END_DATA_SECTION_ENTRY;
        this.result = null;
        return true;
      case BinaryReaderState.END_INIT_EXPRESSION_BODY:
        switch (this._sectionId) {
          case SectionCode.Global:
            this.state = BinaryReaderState.END_GLOBAL_SECTION_ENTRY;
            return true;
          case SectionCode.Data:
            return this.readDataEntryBody();
          case SectionCode.Element:
            return this.readElementEntryBody();
        }
        this.error = new Error(`Unexpected section type: ${this._sectionId}`);
        this.state = BinaryReaderState.ERROR;
        return true;
      case BinaryReaderState.NAME_SECTION_ENTRY:
        return this.readNameEntry();
      case BinaryReaderState.RELOC_SECTION_HEADER:
        if (!this.hasVarIntBytes())
          return false;
        this._sectionEntriesLeft = this.readVarUint32() >>> 0;
        return this.readRelocEntry();
      case BinaryReaderState.LINKING_SECTION_ENTRY:
        return this.readLinkingEntry();
      case BinaryReaderState.SOURCE_MAPPING_URL:
        this.state = BinaryReaderState.END_SECTION;
        this.result = null;
        return true;
      case BinaryReaderState.RELOC_SECTION_ENTRY:
        return this.readRelocEntry();
      case BinaryReaderState.READING_FUNCTION_HEADER:
      case BinaryReaderState.END_FUNCTION_BODY:
        return this.readFunctionBody();
      case BinaryReaderState.BEGIN_FUNCTION_BODY:
        this.state = BinaryReaderState.CODE_OPERATOR;
        return this.readCodeOperator();
      case BinaryReaderState.BEGIN_INIT_EXPRESSION_BODY:
        this.state = BinaryReaderState.INIT_EXPRESSION_OPERATOR;
        return this.readCodeOperator();
      case BinaryReaderState.CODE_OPERATOR:
      case BinaryReaderState.INIT_EXPRESSION_OPERATOR:
        return this.readCodeOperator();
      case BinaryReaderState.READING_SECTION_RAW_DATA:
        return this.readSectionRawData();
      case BinaryReaderState.SECTION_RAW_DATA:
        this.state = BinaryReaderState.END_SECTION;
        this.result = null;
        return true;
      default:
        this.error = new Error(`Unsupported state: ${this.state}`);
        this.state = BinaryReaderState.ERROR;
        return true;
    }
  }
  public skipSection(): void {
    if (this.state === BinaryReaderState.ERROR ||
        this.state === BinaryReaderState.INITIAL ||
        this.state === BinaryReaderState.END_SECTION ||
        this.state === BinaryReaderState.BEGIN_WASM ||
        this.state === BinaryReaderState.END_WASM)
      return;
    this.state = BinaryReaderState.SKIPPING_SECTION;
  }
  public skipFunctionBody(): void {
    if (this.state !== BinaryReaderState.BEGIN_FUNCTION_BODY &&
        this.state !== BinaryReaderState.CODE_OPERATOR)
      return;
    this.state = BinaryReaderState.SKIPPING_FUNCTION_BODY;
  }
  public skipInitExpression(): void {
    while (this.state === BinaryReaderState.INIT_EXPRESSION_OPERATOR)
      this.readCodeOperator();
  }
  public fetchSectionRawData(): void {
    if (this.state !== BinaryReaderState.BEGIN_SECTION) {
      this.error = new Error(`Unsupported state: ${this.state}`);
      this.state = BinaryReaderState.ERROR;
      return;
    }
    this.state = BinaryReaderState.READING_SECTION_RAW_DATA;
  }
}

declare var escape: (string) => string;
declare class TextDecoder {
  public constructor(encoding: string);
  public decode(bytes: Uint8Array): string;
}

export var bytesToString: (Uint8Array) => string;
if (typeof TextDecoder !== 'undefined') {
  try {
    bytesToString = function () {
      var utf8Decoder = new TextDecoder('utf-8');
      utf8Decoder.decode(new Uint8Array([97, 208, 144]));
      return b => utf8Decoder.decode(b);
    }();
  } catch (_) { /* ignore */ }
}
if (!bytesToString) {
  bytesToString = b => {
    var str = String.fromCharCode.apply(null, b);
    return decodeURIComponent(escape(str));
  };
}

export interface IBinaryReaderData {
  state: BinaryReaderState;
  result?: BinaryReaderResult;
}
