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
  ITableType, IMemoryType, IGlobalType, IResizableLimits, IDataSegmentBody
} from './WasmParser';
function binToString(b: Uint8Array) : string {
  // FIXME utf-8
  return String.fromCharCode.apply(null, b);
}
function typeToString(type: number) : string {
  switch (type) {
    case Type.i32: return 'i32';
    case Type.i64: return 'i64';
    case Type.f32: return 'f32';
    case Type.f64: return 'f64';
    case Type.anyfunc: return 'anyfunc';
    default: throw new Error('Unexpected type');
  }
}
function memoryAddressToString(address: IMemoryAddress, code: OperatorCode) : string {
  var defaultAlignFlags;
  switch (code) {
    case OperatorCode.i64_load:
    case OperatorCode.i64_store:
      defaultAlignFlags = 3;
      break;
    case OperatorCode.i32_load:
    case OperatorCode.i64_load32_s:
    case OperatorCode.i64_load32_u:
    case OperatorCode.i32_store:
    case OperatorCode.i64_store32:
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
    return `offset=${address.offset}`;
  if (!address.offset) // hide default offset
    return `align=${1 << address.flags}`;
  return `offset=${address.offset} align=${1 << address.flags}`;
}
function limitsToString(limits: IResizableLimits) : string {
  return limits.initial + (limits.maximum !== undefined ? ' ' + limits.maximum : '');
}
const IndentIncrement: string = '  ';
export class WasmDisassembler {
  private _buffer: Array<string>;
  private _types: Array<IFunctionType>;
  private _funcIndex: number;
  private _funcTypes: Array<number>;
  private _importCount: number;
  private _indent: string;
  private _indentLevel: number;
  constructor() {
    this._buffer = [];
    this._types = [];
    this._funcIndex = 0;
    this._funcTypes = [];
    this._importCount = 0;
    this._indent = null;
    this._indentLevel = 0;
  }
  private printType(typeIndex: number) : string {
    var type = this._types[typeIndex];
    if (type.form !== Type.func)
      throw new Error('NYI other function form');
    return `(func${this.printFuncType(type, false)})`;
  }
  private printFuncType(type: IFunctionType, printVars: boolean) : string {
    var result = [];
    if (printVars) {
      for (var i = 0; i < type.params.length; i++)
        result.push(` (param $var${i} ${typeToString(type.params[i])})`);
    } else if (type.params.length > 0) {
      result.push(' (param');
      for (var i = 0; i < type.params.length; i++)
        result.push(' ', typeToString(type.params[i]));
      result.push(')');
    }
    for (var i = 0; i < type.returns.length; i++) {
      result.push(` (result ${typeToString(type.returns[i])})`);
    }
    return result.join('');
  }
  private increaseIndent() : void {
    this._indent += IndentIncrement;
    this._indentLevel++;
  }
  private decreaseIndent() : void {
    this._indent = this._indent.slice(0, -IndentIncrement.length);
    this._indentLevel--;
  }
  public disassemble(reader: BinaryReader) : string {
    while (true) {
      if (!reader.read())
        return null;
      switch (reader.state) {
        case BinaryReaderState.END_WASM:
          this._buffer.push(')\n');
          if (!reader.hasMoreBytes()) {
            let result = this._buffer.join('');
            this._buffer.length = 0;
            return result;
          }
          break;
        case BinaryReaderState.ERROR:
          throw reader.error;
        case BinaryReaderState.BEGIN_WASM:
          this._buffer.push('(module\n');
          break;
        case BinaryReaderState.END_SECTION:
          break;
        case BinaryReaderState.BEGIN_SECTION:
          switch (reader.currentSection.id) {
            case SectionCode.Type:
            case SectionCode.Import:
            case SectionCode.Export:
            case SectionCode.Function:
            case SectionCode.Code:
            case SectionCode.Memory:
            case SectionCode.Data:
              break; // reading known section;
            default:
              reader.skipSection();
              break;
          }
          break;
        case BinaryReaderState.MEMORY_SECTION_ENTRY:
          var memoryInfo = <IMemoryType>reader.result;
          this._buffer.push(`  (memory ${memoryInfo.limits.initial}`);
          if (memoryInfo.limits.maximum !== undefined) {
            this._buffer.push(` ${memoryInfo.limits.maximum}`);
          }
          this._buffer.push(')\n');
          break;
        case BinaryReaderState.EXPORT_SECTION_ENTRY:
          var exportInfo = <IExportEntry>reader.result;
          switch (exportInfo.kind) {
            case ExternalKind.Function:
              this._buffer.push(`  (export "${binToString(exportInfo.field)}" $func${exportInfo.index})\n`);
              break;
            case ExternalKind.Table:
              this._buffer.push(`  (table)\n`);
              break;
            case ExternalKind.Memory:
              this._buffer.push(`  (export "memory" memory)\n`);
              break;
            case ExternalKind.Global:
              this._buffer.push(`  (global)\n`);
              break;
            default:
              throw new Error(`Unsupported export ${exportInfo.kind}`);
          }
          break;
        case BinaryReaderState.IMPORT_SECTION_ENTRY:
          var importInfo = <IImportEntry>reader.result;
          this._buffer.push(`  (import $func${this._importCount} "${binToString(importInfo.module)}" "${binToString(importInfo.field)}"`);
          switch (importInfo.kind) {
            case ExternalKind.Function:
              this._importCount++;
              this._buffer.push(` ${this.printType(importInfo.funcTypeIndex)}`);
              break;
            case ExternalKind.Table:
              var tableImportInfo = <ITableType>importInfo.type;
              this._buffer.push(` (table ${limitsToString(tableImportInfo.limits)} ${typeToString(tableImportInfo.elementType)})`);
              break;
            case ExternalKind.Memory:
              var memoryImportInfo = <IMemoryType>importInfo.type;
              this._buffer.push(` (memory ${limitsToString(memoryImportInfo.limits)})`);
              break;
            case ExternalKind.Global:
              var globalImportInfo = <IGlobalType>importInfo.type;
              this._buffer.push(` (global ${typeToString(globalImportInfo.contentType)})`);
              break;
            default:
              throw new Error(`NYI other import types: ${importInfo.kind}`);
          }
          this._buffer.push(')\n');
          break;
        case BinaryReaderState.TYPE_SECTION_ENTRY:
          var funcType = <IFunctionType>reader.result;
          var typeIndex = this._types.length;
          this._types.push(funcType);
          this._buffer.push(`  (type $type${typeIndex} ${this.printType(typeIndex)})\n`);
          break;
        case BinaryReaderState.BEGIN_DATA_SECTION_ENTRY:
          this._buffer.push(`  (data\n`);
          break;
        case BinaryReaderState.DATA_SECTION_ENTRY_BODY:
          var body = <IDataSegmentBody>reader.result;
          this._buffer.push(`    "${binToString(body.data)}"\n`);
          break;
        case BinaryReaderState.END_DATA_SECTION_ENTRY:
          this._buffer.push(`  )\n`);
          break;
        case BinaryReaderState.BEGIN_INIT_EXPRESSION_BODY:
          this._indent = '      ';
          this._indentLevel = 0;
          this._buffer.push('    (\n');
          break;
        case BinaryReaderState.END_INIT_EXPRESSION_BODY:
          this._buffer.push('    )\n');
          break;
        case BinaryReaderState.FUNCTION_SECTION_ENTRY:
          this._funcTypes.push((<IFunctionEntry>reader.result).typeIndex);
          break;
        case BinaryReaderState.BEGIN_FUNCTION_BODY:
          var func = reader.currentFunction;
          var type = this._types[this._funcTypes[this._funcIndex]];
          var printIndex = this._funcIndex + this._importCount;
          this._buffer.push(`  (func $func${printIndex}${this.printFuncType(type, true)}\n`);
          var localIndex = type.params.length;
          for (var l of func.locals) {
            for (var i = 0; i < l.count; i++) {
              this._buffer.push(`    (local $var${localIndex++} ${typeToString(l.type)})\n`);
            }
          }
          this._funcIndex++;
          this._indent = '    ';
          this._indentLevel = 0;
          break;
        case BinaryReaderState.INIT_EXPRESSION_OPERATOR:
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
          var str = OperatorCodeNames[operator.code].replace(/^([if](32|64))_/, "$1.").replace(/_([if](32|64))$/, "\/$1");
          if (operator.blockType !== undefined &&
              operator.blockType !== Type.empty_block_type) {
            str += ' ' + typeToString(operator.blockType);
          }
          this._buffer.push(this._indent, str);
          if (operator.localIndex !== undefined) {
            this._buffer.push(` $var${operator.localIndex}`);
          }
          if (operator.funcIndex !== undefined) {
            this._buffer.push(` $func${operator.funcIndex}`);
          }
          if (operator.typeIndex !== undefined) {
            this._buffer.push(` $type${operator.typeIndex}`);
          }
          if (operator.literal !== undefined) {
            switch (operator.code) {
              case OperatorCode.i32_const:
              case OperatorCode.f32_const:
              case OperatorCode.f64_const:
                this._buffer.push(` ${(<number>operator.literal).toString()}`);
                break;
              case OperatorCode.i64_const:
                this._buffer.push(` ${(<Int64>operator.literal).toDouble()}`);
                break;
            }
          }
          if (operator.memoryAddress !== undefined) {
            this._buffer.push(` ${memoryAddressToString(operator.memoryAddress, operator.code)}`);
          }
          if (operator.brDepth !== undefined) {
            this._buffer.push(` ${operator.brDepth}`);
          }
          if (operator.brTable !== undefined) {
            for (var i = 0; i < operator.brTable.length; i++)
              this._buffer.push(` ${operator.brTable[i]}`);
          }
          // TODO globalIndex
          this._buffer.push('\n');
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
          this._buffer.push(`  )\n`);
          break;
        default:
          throw new Error(`Expectected state: ${reader.state}`);
      }
    }
  }
}
