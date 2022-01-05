// Zolidity Grammar:
// https://docs.soliditylang.org/en/v0.8.11/grammar.html

export module zolidity {

    export interface Context {
        text: string;
        index: number;
    }

    export class Snapshot {
        start: number;

        constructor(public context: Context) {
            this.start = context.index;
        }

        length(): number {
            return this.context.index - this.start;
        }

        commit(): string {
            return this.context.text.substring(this.start, this.context.index);
        }

        revert(): string {
            this.context.index = this.start;
            return '';
        }
    }

    function repeat(ctx: Context, n: number, func: () => string): string {
        const state = new Snapshot(ctx);
        for (let i = 0; i < n; i++) {
            if (!func()) {
                return state.revert();
            }
        }
        return state.commit();
    }

    function atomic(ctx: Context, func: () => string): string {
        return repeat(ctx, 1, func);
    }

    export function parseLetter(ctx: Context): string {
        if (ctx.index < ctx.text.length) {
            const ch = ctx.text[ctx.index];
            if (ch >= 'a' && ch <= 'z' || ch >= 'A' && ch <= 'Z') {
                ctx.index++;
                return ch;
            }
        }
        return '';
    }

    export function parseDecimalDigit(ctx: Context): string {
        if (ctx.index < ctx.text.length) {
            const ch = ctx.text[ctx.index];
            if (ch >= '0' && ch <= '9') {
                ctx.index++;
                return ch;
            }
        }
        return '';
    }

    export function parseHexDigit(ctx: Context): string {
        if (ctx.index < ctx.text.length) {
            const ch = ctx.text[ctx.index];
            if (ch >= '0' && ch <= '9' || ch >= 'a' && ch <= 'f' || ch >= 'A' && ch <= 'F') {
                ctx.index++;
                return ch;
            }
        }
        return '';
    }

    export function parseChar(ctx: Context, char: string): string {
        if (ctx.index < ctx.text.length && (char === ctx.text[ctx.index])) {
            return ctx.text[ctx.index++];
        }
        return '';
    }

    export function parseOneOfChars(ctx: Context, chars: string): string {
        if (ctx.index < ctx.text.length && (chars.indexOf(ctx.text[ctx.index]) >= 0)) {
            return ctx.text[ctx.index++];
        }
        return '';
    }

    export function parseNotOneOfChars(ctx: Context, chars: string): string {
        if (ctx.index < ctx.text.length && (chars.indexOf(ctx.text[ctx.index]) === -1)) {
            return ctx.text[ctx.index++];
        }
        return '';
    }

    export function parseWord(ctx: Context, word: string): string {
        const state = new Snapshot(ctx);
        for (let char of word) {
            if (!parseChar(ctx, char)) {
                return state.revert();
            }
        }
        return state.commit();
    }

    export function parseDecimalsWithUnderscores(ctx: Context): string {
        const state = new Snapshot(ctx);
        if (parseDecimalDigit(ctx)) {
            while (parseDecimalDigit(ctx) || atomic(ctx, () => parseChar(ctx, '_') && parseDecimalDigit(ctx))) {
            }
            if (ctx.text[ctx.index] !== '_') {
                return state.commit();
            }
        }
        return state.revert();
    }

    // https://docs.soliditylang.org/en/v0.8.11/grammar.html#a4.SolidityLexer.Identifier
    export function parseIdentifier(ctx: Context): string {
        const state = new Snapshot(ctx);
        if (parseLetter(ctx) || parseOneOfChars(ctx, '$_')) {
            while (parseLetter(ctx) || parseDecimalDigit(ctx) || parseOneOfChars(ctx, '$_')) {
            }
        }
        return state.commit();
    }

    // https://docs.soliditylang.org/en/v0.8.11/grammar.html#a4.SolidityLexer.HexNumber
    export function parseHexNumber(ctx: Context): string {
        const state = new Snapshot(ctx);
        if (parseWord(ctx, '0x')) {
            if (parseHexDigit(ctx)) {
                while (parseHexDigit(ctx) || atomic(ctx, () => parseChar(ctx, '_') && parseHexDigit(ctx))) {
                }
            }
            if (state.length() > 2 && ctx.text[ctx.index] !== '_') {
                return state.commit();
            }
        }
        return state.revert();
    }

    // https://docs.soliditylang.org/en/v0.8.11/grammar.html#a4.SolidityLexer.DecimalNumber
    export function parseDecimalNumber(ctx: Context): string {
        const state = new Snapshot(ctx);
        if (!parseDecimalsWithUnderscores(ctx)) {
            return state.revert();
        }

        if (parseChar(ctx, '.')) {
            if (!parseDecimalsWithUnderscores(ctx)) {
                return state.revert();
            }
        }

        if (parseOneOfChars(ctx, 'eE')) {
            parseChar(ctx, '-'); // allowed to fail
            if (!parseDecimalsWithUnderscores(ctx)) {
                return state.revert();
            }
        }

        return state.commit();
    }

    // https://docs.soliditylang.org/en/v0.8.11/grammar.html#a4.SolidityParser.booleanLiteral
    export function parseBooleanLiteral(ctx: Context): string {
        const state = new Snapshot(ctx);
        if (parseWord(ctx, 'true') || parseWord(ctx, 'false')) {
            return state.commit();
        }
        return state.revert();
    }

    // https://docs.soliditylang.org/en/v0.8.11/grammar.html#a4.SolidityLexer.HexString
    export function parseHexString(ctx: Context): string {
        const state = new Snapshot(ctx);
        if (parseWord(ctx, 'hex')) {
            while (true) {
                if (parseChar(ctx, '\'')) {
                    if (atomic(ctx, () => parseHexDigit(ctx) && parseHexDigit(ctx))) {
                        while (atomic(ctx, () => parseHexDigit(ctx) && parseHexDigit(ctx))
                            || atomic(ctx, () => parseChar(ctx, '_') && parseHexDigit(ctx) && parseHexDigit(ctx))) {
                        }
                    }
                    if (!parseChar(ctx, '\'')) {
                        return state.revert();
                    }
                }
                else if (parseChar(ctx, '"')) {
                    if (atomic(ctx, () => parseHexDigit(ctx) && parseHexDigit(ctx))) {
                        while (atomic(ctx, () => parseHexDigit(ctx) && parseHexDigit(ctx))
                            || atomic(ctx, () => parseChar(ctx, '_') && parseHexDigit(ctx) && parseHexDigit(ctx))) {
                        }
                    }
                    if (!parseChar(ctx, '"')) {
                        return state.revert();
                    }
                }
                else {
                    break;
                }
            }
        }

        if (state.length() > 3) {
            return state.commit();
        }
        return state.revert();
    }

    // https://docs.soliditylang.org/en/v0.8.11/grammar.html#a4.SolidityLexer.UnicodeStringLiteral
    export function parseUnicodeString(ctx: Context): string {
        const state = new Snapshot(ctx);
        if (parseWord(ctx, 'unicode')) {
            while (true) {
                if (parseChar(ctx, '\'')) {
                    while (parseNotOneOfChars(ctx, '\'\r\n\\') || parseEscapeSequence(ctx)) {
                    }
                    if (!parseChar(ctx, '\'')) {
                        return state.revert();
                    }
                }
                else if (parseChar(ctx, '"')) {
                    while (parseNotOneOfChars(ctx, '"\r\n\\') || parseEscapeSequence(ctx)) {
                    }
                    if (!parseChar(ctx, '"')) {
                        return state.revert();
                    }
                }
                else {
                    break;
                }
            }
        }

        if (state.length() > 7) {
            return state.commit();
        }
        return state.revert();
    }

    // https://docs.soliditylang.org/en/v0.8.11/grammar.html#a4.SolidityLexer.EscapeSequence
    export function parseEscapeSequence(ctx: Context): string {
        const state = new Snapshot(ctx);
        if (parseChar(ctx, '\\')) {
            if (parseOneOfChars(ctx, '\'"\\nrt\n\r')
                || atomic(ctx, () => parseChar(ctx, 'u') && repeat(ctx, 4, () => parseHexDigit(ctx)))
                || atomic(ctx, () => parseChar(ctx, 'x') && repeat(ctx, 2, () => parseHexDigit(ctx)))) {
                return state.commit();
            }
        }
        return state.revert();
    }

    // https://docs.soliditylang.org/en/v0.8.11/grammar.html#a4.SolidityLexer.EmptyStringLiteral
    export function parseEmptyStringLiteral(ctx: Context): string {
        const state = new Snapshot(ctx);
        if (repeat(ctx, 2, () => parseChar(ctx, '"'))
            || repeat(ctx, 2, () => parseChar(ctx, '\''))) {
            return state.commit();
        }
        return state.revert();
    }

    // https://docs.soliditylang.org/en/v0.8.11/grammar.html#a4.SolidityLexer.SingleQuotedPrintable
    export function parseSingleQuotedPrintable(ctx: Context): string {
        if (ctx.index < ctx.text.length) {
            const char = ctx.text[ctx.index];
            if (char >= '\u0020' && char <= '\u0026'
                || char >= '\u0028' && char <= '\u005B'
                || char >= '\u005D' && char <= '\u007E') {
                ctx.index++;
                return char;
            }
        }
        return '';
    }

    // https://docs.soliditylang.org/en/v0.8.11/grammar.html#a4.SolidityLexer.DoubleQuotedPrintable
    export function parseDoubleQuotedPrintable(ctx: Context): string {
        if (ctx.index < ctx.text.length) {
            const char = ctx.text[ctx.index];
            if (char >= '\u0020' && char <= '\u0021'
                || char >= '\u0023' && char <= '\u005B'
                || char >= '\u005D' && char <= '\u007E') {
                ctx.index++;
                return char;
            }
        }
        return '';
    }

    // https://docs.soliditylang.org/en/v0.8.11/grammar.html#a4.SolidityLexer.NonEmptyStringLiteral
    export function parseNonEmptyStringLiteral(ctx: Context): string {
        const state = new Snapshot(ctx);
        if (parseChar(ctx, '"')) {
            while (parseDoubleQuotedPrintable(ctx) || parseEscapeSequence(ctx)) {
            }
            if (!parseChar(ctx, '"')) {
                return state.revert();
            }
        }
        else if (parseChar(ctx, '\'')) {
            while (parseSingleQuotedPrintable(ctx) || parseEscapeSequence(ctx)) {
            }
            if (!parseChar(ctx, '\'')) {
                return state.revert();
            }
        }
        return state.commit();
    }

    // https://docs.soliditylang.org/en/v0.8.11/grammar.html#a4.SolidityLexer.UnsignedIntegerType
    export function parseUnsignedIntegerType(ctx: Context): string {
        const state = new Snapshot(ctx);
        const type = parseIdentifier(ctx);
        const uints = [
            'uint',
            'uint8',
            'uint16',
            'uint24',
            'uint32',
            'uint40',
            'uint48',
            'uint56',
            'uint64',
            'uint72',
            'uint80',
            'uint88',
            'uint96',
            'uint104',
            'uint112',
            'uint120',
            'uint128',
            'uint136',
            'uint144',
            'uint152',
            'uint160',
            'uint168',
            'uint176',
            'uint184',
            'uint192',
            'uint200',
            'uint208',
            'uint216',
            'uint224',
            'uint232',
            'uint240',
            'uint248',
            'uint256',
        ];
        if (uints.indexOf(type)) {
            return state.commit();
        }
        return state.revert();
    }

    // https://docs.soliditylang.org/en/v0.8.11/grammar.html#a4.SolidityLexer.SignedIntegerType
    export function parseSignedIntegerType(ctx: Context): string {
        const state = new Snapshot(ctx);
        const type = parseIdentifier(ctx);
        const ints = [
            'int',
            'int8',
            'int16',
            'int24',
            'int32',
            'int40',
            'int48',
            'int56',
            'int64',
            'int72',
            'int80',
            'int88',
            'int96',
            'int104',
            'int112',
            'int120',
            'int128',
            'int136',
            'int144',
            'int152',
            'int160',
            'int168',
            'int176',
            'int184',
            'int192',
            'int200',
            'int208',
            'int216',
            'int224',
            'int232',
            'int240',
            'int248',
            'int256',
        ];
        if (ints.indexOf(type)) {
            return state.commit();
        }
        return state.revert();
    }

    // https://docs.soliditylang.org/en/v0.8.11/grammar.html#a4.SolidityLexer.NumberUnit
    export function parseNumberUnit(ctx: Context): string {
        const state = new Snapshot(ctx);
        const unit = parseIdentifier(ctx);
        const units = [
            'wei',
            'gwei',
            'ether',
            'seconds',
            'minutes',
            'hours',
            'days',
            'weeks',
            'years',
        ];
        if (units.indexOf(unit)) {
            return state.commit();
        }
        return state.revert();
    }

    // https://docs.soliditylang.org/en/v0.8.11/grammar.html#a4.SolidityLexer.SignedIntegerType
    export function parseFixedBytes(ctx: Context): string {
        const state = new Snapshot(ctx);
        const type = parseIdentifier(ctx);
        const bytes = [
            'bytes1',
            'bytes2',
            'bytes3',
            'bytes4',
            'bytes5',
            'bytes6',
            'bytes7',
            'bytes8',
            'bytes9',
            'bytes10',
            'bytes11',
            'bytes12',
            'bytes13',
            'bytes14',
            'bytes15',
            'bytes16',
            'bytes17',
            'bytes18',
            'bytes19',
            'bytes20',
            'bytes21',
            'bytes22',
            'bytes23',
            'bytes24',
            'bytes25',
            'bytes26',
            'bytes27',
            'bytes28',
            'bytes29',
            'bytes30',
            'bytes31',
            'bytes32',
        ];
        if (bytes.indexOf(type)) {
            return state.commit();
        }
        return state.revert();
    }

    // https://docs.soliditylang.org/en/v0.8.11/grammar.html#a4.SolidityParser.stringLiteral
    export function parseStringLiteral(ctx: Context): string {
        const state = new Snapshot(ctx);
        while (parseNonEmptyStringLiteral(ctx) || parseEmptyStringLiteral(ctx)) {
        }
        return state.revert();
    }

    // https://docs.soliditylang.org/en/v0.8.11/grammar.html#a4.SolidityParser.numberLiteral
    export function parseNumberLiteral(ctx: Context): string {
        const state = new Snapshot(ctx);
        if (parseDecimalNumber(ctx) || parseHexNumber(ctx)) {
        }
        parseNumberUnit(ctx); // allowed to fail
        return state.commit();
    }

    // https://docs.soliditylang.org/en/v0.8.11/grammar.html#a4.SolidityParser.hexStringLiteral
    export function parseHexStringLiteral(ctx: Context): string {
        const state = new Snapshot(ctx);
        while (parseHexString(ctx)) {
        }
        return state.commit();
    }

    // https://docs.soliditylang.org/en/v0.8.11/grammar.html#a4.SolidityParser.unicodeStringLiteral
    export function parseUnicodeStringLiteral(ctx: Context): string {
        const state = new Snapshot(ctx);
        while (parseUnicodeString(ctx)) {
        }
        return state.commit();
    }

    // // https://docs.soliditylang.org/en/v0.8.11/grammar.html#a4.SolidityParser.literal
    // export function parseLiteral(ctx: Context): string {
    //     const state = new Snapshot(ctx);
    //     if (parseStringLiteral(ctx)
    //         || parseNum(ctx)) {
    //     }
    //     if (state.length() > 0) {
    //         return state.commit();
    //     }
    //     return state.revert();
    // }

};
