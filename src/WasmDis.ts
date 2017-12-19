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
import {
  BinaryReader, BinaryReaderState, SectionCode, IExportEntry, IMemoryAddress,
  ExternalKind, IFunctionType, IFunctionEntry, IFunctionInformation,
  IImportEntry, IOperatorInformation, Type, OperatorCode, OperatorCodeNames, Int64,
  ITableType, IMemoryType, IGlobalType, IResizableLimits, IDataSegmentBody,
  IGlobalVariable, IElementSegment, IElementSegmentBody, ISectionInformation,
  IStartEntry
} from './WasmParser';
function typeToString(type: number): string {
  switch (type) {
    case Type.i32: return 'i32';
    case Type.i64: return 'i64';
    case Type.f32: return 'f32';
    case Type.f64: return 'f64';
    case Type.anyfunc: return 'anyfunc';
    default: throw new Error('Unexpected type');
  }
}
function formatFloat32(n: number): string {
  if (n === 0)
    return (1 / n) < 0 ? '-0.0' : '0.0';
  if (isFinite(n))
    return n.toString();
  if (!isNaN(n))
    return n < 0 ? '-infinity' : 'infinity';
  var view = new DataView(new ArrayBuffer(8));
  view.setFloat32(0, n, true);
  var data = view.getInt32(0, true);
  var payload = data & 0x7FFFFF;
  const canonicalBits = 4194304; // 0x800..0
  if (data > 0 && payload === canonicalBits)
    return 'nan'; // canonical NaN;
  else if (payload === canonicalBits)
    return '-nan';
  return (data < 0 ? '-' : '+') + 'nan:0x' + payload.toString(16);
}

function formatFloat64(n: number): string {
  if (n === 0)
    return (1 / n) < 0 ? '-0.0' : '0.0';
  if (isFinite(n))
    return n.toString();
  if (!isNaN(n))
    return n < 0 ? '-infinity' : 'infinity';
  var view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, n, true);
  var data1 = view.getUint32(0, true);
  var data2 = view.getInt32(4, true);
  var payload = data1 + (data2 & 0xFFFFF) * 4294967296;
  const canonicalBits = 524288 * 4294967296; // 0x800..0
  if (data2 > 0 && payload === canonicalBits)
    return 'nan'; // canonical NaN;
  else if (payload === canonicalBits)
    return '-nan';
  return (data2 < 0 ? '-' : '+') + 'nan:0x' + payload.toString(16);
}

function memoryAddressToString(address: IMemoryAddress, code: OperatorCode): string {
  var defaultAlignFlags;
  switch (code) {
    case OperatorCode.i64_load:
    case OperatorCode.i64_store:
    case OperatorCode.f64_load:
    case OperatorCode.f64_store:
      defaultAlignFlags = 3;
      break;
    case OperatorCode.i32_load:
    case OperatorCode.i64_load32_s:
    case OperatorCode.i64_load32_u:
    case OperatorCode.i32_store:
    case OperatorCode.i64_store32:
    case OperatorCode.f32_load:
    case OperatorCode.f32_store:
      defaultAlignFlags = 2;
      break;
    case OperatorCode.i32_load16_s:
    case OperatorCode.i32_load16_u:
    case OperatorCode.i64_load16_s:
    case OperatorCode.i64_load16_u:
    case OperatorCode.i32_store16:
    case OperatorCode.i64_store16:
      defaultAlignFlags = 1;
      break;
    case OperatorCode.i32_load8_s:
    case OperatorCode.i32_load8_u:
    case OperatorCode.i64_load8_s:
    case OperatorCode.i64_load8_u:
    case OperatorCode.i32_store8:
    case OperatorCode.i64_store8:
      defaultAlignFlags = 0;
      break;
  }
  if (address.flags == defaultAlignFlags) // hide default flags
    return !address.offset ? null : `offset=${address.offset}`;
  if (!address.offset) // hide default offset
    return `align=${1 << address.flags}`;
  return `offset=${address.offset | 0} align=${1 << address.flags}`;
}
function globalTypeToString(type: IGlobalType): string {
  if (!type.mutability)
    return typeToString(type.contentType)
  return `(mut ${typeToString(type.contentType)})`;
}
function limitsToString(limits: IResizableLimits): string {
  return limits.initial + (limits.maximum !== undefined ? ' ' + limits.maximum : '');
}
var paddingCache = ['0', '00', '000'];
function formatHex(n: number, width?: number): string {
  var s = n.toString(16).toUpperCase();
  if (width === undefined || s.length >= width)
    return s;
  var paddingIndex = width - s.length - 1;
  while (paddingIndex >= paddingCache.length)
    paddingCache.push(paddingCache[paddingCache.length - 1] + '0');
  return paddingCache[paddingIndex] + s;
}
const IndentIncrement: string = '  ';
var operatorCodeNamesCache = null;
function getOperatorName(code: OperatorCode): string {
  if (!operatorCodeNamesCache) {
    operatorCodeNamesCache = Object.create(null);
    Object.keys(OperatorCodeNames).forEach((key) => {
      let value = OperatorCodeNames[key];
      if (typeof value !== 'string')
        return;
      operatorCodeNamesCache[key] = value.replace(/^([if](32|64))_/, "$1.").replace(/_([if](32|64))$/, "\/$1");
    })
  }
  return operatorCodeNamesCache[code];
}

export interface INameResolver {
  getTypeName(index: number, isRef: boolean): string;
  getTableName(index: number, isRef: boolean): string;
  getMemoryName(index: number, isRef: boolean): string;
  getGlobalName(index: number, isRef: boolean): string;
  getFunctionName(index: number, isImport: boolean, isRef: boolean): string;
  getVariableName(funcIndex: number, index: number, isRef: boolean): string;
  getLabel(index: number): string;
}
export class DefaultNameResolver implements INameResolver {
  public getTypeName(index: number, isRef: boolean): string {
    return '$type' + index;
  }
  public getTableName(index: number, isRef: boolean): string {
    return '$table' + index;
  }
  public getMemoryName(index: number, isRef: boolean): string {
    // TODO '$memory' + index;
    return isRef ? '' + index : `(;${index};)`;
  }
  public getGlobalName(index: number, isRef: boolean): string {
    return '$global' + index;
  }
  public getFunctionName(index: number, isImport: boolean, isRef: boolean): string {
    return (isImport ? '$import' : '$func') + index;
  }
  public getVariableName(funcIndex: number, index: number, isRef: boolean): string {
    return '$var' + index;
  }
  public getLabel(index: number): string {
    return '$label' + index;
  }
}
export class NumericNameResolver implements INameResolver {
  public getTypeName(index: number, isRef: boolean): string {
    return isRef ? '' + index : `(;${index};)`;
  }
  public getTableName(index: number, isRef: boolean): string {
    return isRef ? '' + index : `(;${index};)`;
  }
  public getMemoryName(index: number, isRef: boolean): string {
    return isRef ? '' + index : `(;${index};)`;
  }
  public getGlobalName(index: number, isRef: boolean): string {
    return isRef ? '' + index : `(;${index};)`;
  }
  public getFunctionName(index: number, isImport: boolean, isRef: boolean): string {
    return isRef ? '' + index : `(;${index};)`;
  }
  public getVariableName(funcIndex: number, index: number, isRef: boolean): string {
    return isRef ? '' + index : `(;${index};)`;
  }
  public getLabel(index: number): string {
    return null;
  }
}

class LineBuffer {
  private _firstPart: string;
  private _secondPart: string;
  private _thirdPart: string;
  private _count: number;

  constructor() {
    this._firstPart = '';
    this._secondPart = '';
    this._thirdPart = '';
    this._count = 0;
  }

  public get length(): number {
    switch (this._count) {
      case 0:
        return 0;
      case 1:
        return this._firstPart.length;
      case 2:
        return this._firstPart.length + this._secondPart.length;
      default:
        return this._firstPart.length +
          this._secondPart.length +
          this._thirdPart.length;
    }
  }

  public append(part: string): void {
    switch (this._count) {
      case 0:
        this._firstPart = part;
        this._count = 1;
        break;
      case 1:
        this._secondPart = part;
        this._count = 2;
        break;
      case 2:
        this._thirdPart = part;
        this._count = 3;
        break;
      default:
        this._count = 1;
        this._firstPart = this._firstPart + this._secondPart +
          this._thirdPart + part;
        break;
    }
  }

  public finalize(): string {
    switch (this._count) {
      case 0:
        return '';
      case 1:
        this._count = 0;
        return this._firstPart;
      case 2:
        this._count = 0;
        return this._firstPart + this._secondPart;
      default:
        this._count = 0;
        return this._firstPart + this._secondPart + this._thirdPart;
    }
  }
}

export enum LabelMode {
  Depth,
  WhenUsed,
  Always,
}

export interface IDisassemblerResult {
  lines: Array<string>;
  offsets?: Array<number>
  done: boolean;
}
export class WasmDisassembler {
  private _lines: Array<string>;
  private _offsets: Array<number>;
  private _buffer: LineBuffer;
  private _types: Array<IFunctionType>;
  private _funcIndex: number;
  private _funcTypes: Array<number>;
  private _importCount: number;
  private _globalCount: number;
  private _memoryCount: number;
  private _tableCount: number;
  private _initExpression: Array<IOperatorInformation>;
  private _backrefLabels: Array<{line:number;position:number;useLabel:boolean;label:string}>;
  private _labelIndex: number;
  private _indent: string;
  private _indentLevel: number;
  private _addOffsets: boolean;
  private _nextLineToAddOffset: number;
  private _done: boolean;
  private _currentPosition: number;
  private _nameResolver: INameResolver;
  private _labelMode: LabelMode;
  constructor() {
    this._lines = [];
    this._offsets = [];
    this._buffer = new LineBuffer();
    this._indent = null;
    this._indentLevel = 0;
    this._addOffsets = false;
    this._done = false;
    this._currentPosition = 0;
    this._nameResolver = new DefaultNameResolver();
    this._labelMode = LabelMode.WhenUsed;

    this._reset();
  }
  private _reset(): void {
    this._types = [];
    this._funcIndex = 0;
    this._funcTypes = [];
    this._importCount = 0;
    this._globalCount = 0;
    this._memoryCount = 0;
    this._tableCount = 0;
    this._initExpression = [];
    this._backrefLabels = null;
    this._labelIndex = 0;
  }
  public get addOffsets() {
    return this._addOffsets;
  }
  public set addOffsets(value: boolean) {
    if (this._currentPosition)
      throw new Error('Cannot switch addOffsets during processing.');
    this._addOffsets = value;
  }
  public get labelMode() {
    return this._labelMode;
  }
  public set labelMode(value: LabelMode) {
    if (this._currentPosition)
      throw new Error('Cannot switch labelMode during processing.');
    this._labelMode = value;
  }
  public get nameResolver() {
    return this._nameResolver;
  }
  public set nameResolver(resolver: INameResolver) {
    if (this._currentPosition)
      throw new Error('Cannot switch nameResolver during processing.');
    this._nameResolver = resolver;
  }
  private appendBuffer(s: string) {
    this._buffer.append(s);
  }
  private newLine() {
    if (this.addOffsets)
      this._offsets.push(this._currentPosition);
    this._lines.push(this._buffer.finalize());
  }
  private printFuncType(typeIndex: number): void {
    var type = this._types[typeIndex];
    if (type.form !== Type.func)
      throw new Error('NYI other function form');
    if (type.params.length > 0) {
      this.appendBuffer(' (param');
      for (var i = 0; i < type.params.length; i++) {
        this.appendBuffer(' ');
        this.appendBuffer(typeToString(type.params[i]));
      }
      this.appendBuffer(')');
    }
    if (type.returns.length > 0) {
      this.appendBuffer(' (result');
      for (var i = 0; i < type.returns.length; i++) {
        this.appendBuffer(' ');
        this.appendBuffer(typeToString(type.returns[i]));
      }
      this.appendBuffer(')');
    }
  }
  private printString(b: Uint8Array): void {
    this.appendBuffer('\"');
    for (var i = 0; i < b.length; i++) {
      var byte = b[i];
      if (byte < 0x20 || byte >= 0x7F ||
          byte == /* " */ 0x22 || byte == /* \ */ 0x5c) {
        this.appendBuffer('\\' + (byte >> 4).toString(16) + (byte & 15).toString(16));
      } else {
        this.appendBuffer(String.fromCharCode(byte));
      }
    }
    this.appendBuffer('\"');
  }
  private useLabel(depth: number): string {
    if (!this._backrefLabels) {
      return '' + depth;
    }
    var i = this._backrefLabels.length - depth - 1;
    if (i < 0) {
      return '' + depth;
    }
    var backrefLabel = this._backrefLabels[i];
    if (!backrefLabel.useLabel) {
      backrefLabel.useLabel = true;
      backrefLabel.label = this._nameResolver.getLabel(this._labelIndex);
      var line = this._lines[backrefLabel.line];
      this._lines[backrefLabel.line] = line.substring(0, backrefLabel.position) +
        ' ' + backrefLabel.label + line.substring(backrefLabel.position);
      this._labelIndex++;
    }
    return backrefLabel.label || '' + depth;
  }
  private printOperator(operator: IOperatorInformation): void {
    this.appendBuffer(getOperatorName(operator.code));
    if (operator.blockType !== undefined) {
      if (this._labelMode !== LabelMode.Depth) {
        let backrefLabel = {
          line: this._lines.length,
          position: this._buffer.length,
          useLabel: false,
          label: null,
        };
        if (this._labelMode === LabelMode.Always) {
          backrefLabel.useLabel = true;
          backrefLabel.label = this._nameResolver.getLabel(this._labelIndex++);
          if (backrefLabel.label) {
            this.appendBuffer(' ');
            this.appendBuffer(backrefLabel.label);
          }
        }
        this._backrefLabels.push(backrefLabel);
      }
      if (operator.blockType !== Type.empty_block_type) {
        this.appendBuffer(' (result ');
        this.appendBuffer(typeToString(operator.blockType));
        this.appendBuffer(')');
      }
    }
    if (operator.code === OperatorCode.end && this._labelMode !== LabelMode.Depth) {
      let backrefLabel = this._backrefLabels.pop();
      if (backrefLabel.label) {
        this.appendBuffer(' ');
        this.appendBuffer(backrefLabel.label);
      }
    }
    if (operator.localIndex !== undefined) {
      var paramName = this._nameResolver.getVariableName(this._funcIndex, operator.localIndex, true);
      this.appendBuffer(` ${paramName}`);
    }
    if (operator.funcIndex !== undefined) {
      var funcName = this._nameResolver.getFunctionName(operator.funcIndex, operator.funcIndex < this._importCount, true);
      this.appendBuffer(` ${funcName}`);
    }
    if (operator.typeIndex !== undefined) {
      var typeName = this._nameResolver.getTypeName(operator.typeIndex, true);
      this.appendBuffer(` ${typeName}`);
    }
    if (operator.literal !== undefined) {
      switch (operator.code) {
        case OperatorCode.i32_const:
          this.appendBuffer(` ${(<number>operator.literal).toString()}`);
          break;
        case OperatorCode.f32_const:
          this.appendBuffer(` ${formatFloat32(<number>operator.literal)}`);
          break;
        case OperatorCode.f64_const:
          this.appendBuffer(` ${formatFloat64(<number>operator.literal)}`);
          break;
        case OperatorCode.i64_const:
          this.appendBuffer(` ${(<Int64>operator.literal).toDouble()}`);
          break;
      }
    }
    if (operator.memoryAddress !== undefined) {
      var memoryAddress = memoryAddressToString(operator.memoryAddress, operator.code);
      if (memoryAddress !== null) {
        this.appendBuffer(' ');
        this.appendBuffer(memoryAddress);
      }
    }
    if (operator.brDepth !== undefined) {
      this.appendBuffer(' ');
      this.appendBuffer(this.useLabel(operator.brDepth));
    }
    if (operator.brTable !== undefined) {
      for (var i = 0; i < operator.brTable.length; i++) {
        this.appendBuffer(' ');
        this.appendBuffer(this.useLabel(operator.brTable[i]));
      }
    }
    if (operator.globalIndex !== undefined) {
      var globalName = this._nameResolver.getGlobalName(operator.globalIndex, true);
      this.appendBuffer(` ${globalName}`);
    }
  }
  private printImportSource(info: IImportEntry): void {
    this.printString(info.module);
    this.appendBuffer(' ');
    this.printString(info.field);
  }
  private increaseIndent(): void {
    this._indent += IndentIncrement;
    this._indentLevel++;
  }
  private decreaseIndent(): void {
    this._indent = this._indent.slice(0, -IndentIncrement.length);
    this._indentLevel--;
  }
  public disassemble(reader: BinaryReader): string {
    let done = this.disassembleChunk(reader);
    if (!done)
      return null;
    let lines = this._lines;
    if (this._addOffsets) {
      lines = lines.map((line, index) => {
        var position = formatHex(this._offsets[index], 4);
        return line + ' ;; @' + position;
      });
    }
    lines.push(''); // we need '\n' after last line
    let result = lines.join('\n');
    this._lines.length = 0;
    this._offsets.length = 0;
    return result;
  }
  public getResult(): IDisassemblerResult {
    let linesReady = this._lines.length;
    if (this._backrefLabels && this._labelMode === LabelMode.WhenUsed) {
      this._backrefLabels.some((backrefLabel) => {
        if (backrefLabel.useLabel)
          return false;
        linesReady = backrefLabel.line;
        return true;
      });
    }
    if (linesReady === 0) {
      return {
        lines: [],
        offsets: this._addOffsets ? [] : undefined,
        done: this._done,
      }
    }
    if (linesReady === this._lines.length) {
      let result = {
        lines: this._lines,
        offsets: this._addOffsets ? this._offsets : undefined,
        done: this._done,
      };
      this._lines = [];
      if (this._addOffsets)
        this._offsets = [];
      return result;
    }
    let result = {
      lines: this._lines.splice(0, linesReady),
      offsets: this._addOffsets ? this._offsets.splice(0, linesReady) : undefined,
      done: false,
    };
    if (this._backrefLabels) {
      this._backrefLabels.forEach((backrefLabel) => {
        backrefLabel.line -= linesReady;
      });
    }
    return result;
  }
  public disassembleChunk(reader: BinaryReader, offsetInModule: number = 0): boolean {
    if (this._done)
      throw new Error('Invalid state: disassembly process was already finished.')
    while (true) {
      this._currentPosition = reader.position + offsetInModule;
      if (!reader.read())
        return false;
      switch (reader.state) {
        case BinaryReaderState.END_WASM:
          this.appendBuffer(')');
          this.newLine();
          this._reset();
          if (!reader.hasMoreBytes()) {
            this._done = true;
            return true;
          }
          break;
        case BinaryReaderState.ERROR:
          throw reader.error;
        case BinaryReaderState.BEGIN_WASM:
          this.appendBuffer('(module');
          this.newLine();
          break;
        case BinaryReaderState.END_SECTION:
          break;
        case BinaryReaderState.BEGIN_SECTION:
          var sectionInfo = <ISectionInformation>reader.result;
          switch (sectionInfo.id) {
            case SectionCode.Type:
            case SectionCode.Import:
            case SectionCode.Export:
            case SectionCode.Global:
            case SectionCode.Function:
            case SectionCode.Start:
            case SectionCode.Code:
            case SectionCode.Memory:
            case SectionCode.Data:
            case SectionCode.Table:
            case SectionCode.Element:
              break; // reading known section;
            default:
              reader.skipSection();
              break;
          }
          break;
        case BinaryReaderState.MEMORY_SECTION_ENTRY:
          var memoryInfo = <IMemoryType>reader.result;
          var memoryName = this._nameResolver.getMemoryName(this._memoryCount++, false);
          this.appendBuffer(`  (memory ${memoryName} ${memoryInfo.limits.initial}`);
          if (memoryInfo.limits.maximum !== undefined) {
            this.appendBuffer(` ${memoryInfo.limits.maximum}`);
          }
          this.appendBuffer(')');
          this.newLine();
          break;
        case BinaryReaderState.TABLE_SECTION_ENTRY:
          var tableInfo = <ITableType>reader.result;
          var tableName = this._nameResolver.getTableName(this._tableCount++, false);
          this.appendBuffer(`  (table ${tableName} ${limitsToString(tableInfo.limits)} ${typeToString(tableInfo.elementType)})`);
          this.newLine();
          break;
        case BinaryReaderState.EXPORT_SECTION_ENTRY:
          var exportInfo = <IExportEntry>reader.result;
          this.appendBuffer('  (export ');
          this.printString(exportInfo.field);
          this.appendBuffer(' ');
          switch (exportInfo.kind) {
            case ExternalKind.Function:
              var funcName = this._nameResolver.getFunctionName(exportInfo.index, exportInfo.index < this._importCount, true);
              this.appendBuffer(`(func ${funcName})`);
              break;
            case ExternalKind.Table:
              var tableName = this._nameResolver.getTableName(exportInfo.index, true);
              this.appendBuffer(`(table ${tableName})`);
              break;
            case ExternalKind.Memory:
              var memoryName = this._nameResolver.getMemoryName(exportInfo.index, true);
              this.appendBuffer(`(memory ${memoryName})`);
              break;
            case ExternalKind.Global:
              var globalName = this._nameResolver.getGlobalName(exportInfo.index, true);
              this.appendBuffer(`(global ${globalName})`);
              break;
            default:
              throw new Error(`Unsupported export ${exportInfo.kind}`);
          }
          this.appendBuffer(')');
          this.newLine();
          break;
        case BinaryReaderState.IMPORT_SECTION_ENTRY:
          var importInfo = <IImportEntry>reader.result;
          this.appendBuffer('  (import ');
          this.printImportSource(importInfo);
          switch (importInfo.kind) {
            case ExternalKind.Function:
              this._importCount++;
              var funcName = this._nameResolver.getFunctionName(this._funcIndex++, true, false);
              this.appendBuffer(` (func ${funcName}`);
              this.printFuncType(importInfo.funcTypeIndex);
              this.appendBuffer(')');
              break;
            case ExternalKind.Table:
              var tableImportInfo = <ITableType>importInfo.type;
              var tableName = this._nameResolver.getTableName(this._tableCount++, false);
              this.appendBuffer(` (table ${tableName} ${limitsToString(tableImportInfo.limits)} ${typeToString(tableImportInfo.elementType)})`);
              break;
            case ExternalKind.Memory:
              var memoryImportInfo = <IMemoryType>importInfo.type;
              var memoryName = this._nameResolver.getMemoryName(this._memoryCount++, false);
              this.appendBuffer(` (memory ${memoryName} ${limitsToString(memoryImportInfo.limits)})`);
              break;
            case ExternalKind.Global:
              var globalImportInfo = <IGlobalType>importInfo.type;
              var globalName = this._nameResolver.getGlobalName(this._globalCount++, false);
              this.appendBuffer(` (global ${globalName} ${globalTypeToString(globalImportInfo)})`);
              break;
            default:
              throw new Error(`NYI other import types: ${importInfo.kind}`);
          }
          this.appendBuffer(')');
          this.newLine();
          break;
        case BinaryReaderState.BEGIN_ELEMENT_SECTION_ENTRY:
          var elementSegmentInfo = <IElementSegment>reader.result;
          this.appendBuffer('  (elem ');
          break;
        case BinaryReaderState.END_ELEMENT_SECTION_ENTRY:
          this.appendBuffer(')');
          this.newLine();
          break;
        case BinaryReaderState.ELEMENT_SECTION_ENTRY_BODY:
          var elementSegmentBody = <IElementSegmentBody>reader.result;
          elementSegmentBody.elements.forEach(funcIndex => {
            var funcName = this._nameResolver.getFunctionName(funcIndex, funcIndex < this._importCount, true);
            this.appendBuffer(` ${funcName}`);
          });
          break;
        case BinaryReaderState.BEGIN_GLOBAL_SECTION_ENTRY:
          var globalInfo = <IGlobalVariable>reader.result;
          var globalName = this._nameResolver.getGlobalName(this._globalCount++, false);
          this.appendBuffer(`  (global ${globalName} ${globalTypeToString(globalInfo.type)} `);
          break;
        case BinaryReaderState.END_GLOBAL_SECTION_ENTRY:
          this.appendBuffer(')');
          this.newLine();
          break;
        case BinaryReaderState.TYPE_SECTION_ENTRY:
          var funcType = <IFunctionType>reader.result;
          var typeIndex = this._types.length;
          this._types.push(funcType);
          var typeName = this._nameResolver.getTypeName(typeIndex, false);
          this.appendBuffer(`  (type ${typeName} (func`);
          this.printFuncType(typeIndex);
          this.appendBuffer('))');
          this.newLine();
          break;
        case BinaryReaderState.START_SECTION_ENTRY:
          var startEntry = <IStartEntry>reader.result;
          var funcName = this._nameResolver.getFunctionName(startEntry.index, startEntry.index < this._importCount, true);
          this.appendBuffer(`  (start ${funcName})`);
          this.newLine();
          break;          
        case BinaryReaderState.BEGIN_DATA_SECTION_ENTRY:
          this.appendBuffer('  (data ');
          break;
        case BinaryReaderState.DATA_SECTION_ENTRY_BODY:
          var body = <IDataSegmentBody>reader.result;
          this.newLine();
          this.appendBuffer('    ');
          this.printString(body.data);
          this.newLine();
          break;
        case BinaryReaderState.END_DATA_SECTION_ENTRY:
          this.appendBuffer('  )');
          this.newLine();
          break;
        case BinaryReaderState.BEGIN_INIT_EXPRESSION_BODY:
          break;
        case BinaryReaderState.INIT_EXPRESSION_OPERATOR:
           this._initExpression.push(<IOperatorInformation>reader.result);
           break;
        case BinaryReaderState.END_INIT_EXPRESSION_BODY:
          this.appendBuffer('(');
          // TODO fix printing when more that one operator is used.
          this._initExpression.forEach((op, index) => {
            if (op.code === OperatorCode.end) {
              return; // do not print end
            }
            if (index > 0) {
              this.appendBuffer(' ');
            }
            this.printOperator(op);
          });
          this.appendBuffer(')');
          this._initExpression.length = 0;
          break;
        case BinaryReaderState.FUNCTION_SECTION_ENTRY:
          this._funcTypes.push((<IFunctionEntry>reader.result).typeIndex);
          break;
        case BinaryReaderState.BEGIN_FUNCTION_BODY:
          var func = <IFunctionInformation>reader.result;
          var type = this._types[this._funcTypes[this._funcIndex - this._importCount]];
          this.appendBuffer('  (func ');
          this.appendBuffer(this._nameResolver.getFunctionName(this._funcIndex, false, false));
          for (var i = 0; i < type.params.length; i++) {
            var paramName = this._nameResolver.getVariableName(this._funcIndex, i, false);
            this.appendBuffer(` (param ${paramName} ${typeToString(type.params[i])})`);
          }
          for (var i = 0; i < type.returns.length; i++) {
            this.appendBuffer(` (result ${typeToString(type.returns[i])})`);
          }
          this.newLine();
          var localIndex = type.params.length;
          if (func.locals.length > 0) {
            this.appendBuffer('   ');
            for (var l of func.locals) {
              for (var i = 0; i < l.count; i++) {
                var paramName = this._nameResolver.getVariableName(this._funcIndex, localIndex++, false);
                this.appendBuffer(` (local ${paramName} ${typeToString(l.type)})`);
              }
            }
            this.newLine();
          }
          this._indent = '    ';
          this._indentLevel = 0;
          this._labelIndex = 0;
          this._backrefLabels = this._labelMode === LabelMode.Depth ? null : [];
          break;
        case BinaryReaderState.CODE_OPERATOR:
          var operator = <IOperatorInformation>reader.result;
          if (operator.code == OperatorCode.end && this._indentLevel == 0) {
            // reached of the function, skipping the operator
            break;
          }
          switch (operator.code) {
            case OperatorCode.end:
            case OperatorCode.else:
              this.decreaseIndent();
              break;
          }
          this.appendBuffer(this._indent);
          this.printOperator(operator);
          this.newLine();
          switch (operator.code) {
            case OperatorCode.if:
            case OperatorCode.block:
            case OperatorCode.loop:
            case OperatorCode.else:
              this.increaseIndent();
              break;
          }
          break;
        case BinaryReaderState.END_FUNCTION_BODY:
          this._funcIndex++;
          this._backrefLabels = null;
          this.appendBuffer(`  )`);
          this.newLine();
          break;
        default:
          throw new Error(`Expectected state: ${reader.state}`);
      }
    }
  }
}
