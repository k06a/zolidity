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

    commit(): string {
        return this.context.text.substring(this.start, this.context.index);
    }

    revert(): string {
        this.context.index = this.start;
        return '';
    }
}

export function parseLetter(ctx: Context): string {
    const ch = ctx.text[ctx.index];
    if (ctx.index < ctx.text.length && (ch >= 'a' && ch <= 'z' || ch >= 'A' && ch <= 'Z')) {
        return ctx.text[ctx.index++];
    }
    return '';
}

export function parseDecimalDigit(ctx: Context): string {
    const ch = ctx.text[ctx.index];
    if (ctx.index < ctx.text.length && (ch >= '0' && ch <= '9')) {
        return ctx.text[ctx.index++];
    }
    return '';
}

export function parseHexDigit(ctx: Context): string {
    const ch = ctx.text[ctx.index];
    if (ctx.index < ctx.text.length && (ch >= '0' && ch <= '9' || ch >= 'a' && ch <= 'f' || ch >= 'A' && ch <= 'F')) {
        return ctx.text[ctx.index++];
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

export function parseDecimalsWithUnderscores(ctx: Context): string {
    const state = new Snapshot(ctx);
    if (parseDecimalDigit(ctx)) {
        while (parseDecimalDigit(ctx) || (parseChar(ctx, '_') && parseDecimalDigit(ctx))) {
        }
        if (ctx.text[ctx.index - 1] !== '_') {
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
    if (parseChar(ctx, '0') && parseChar(ctx, 'x') && parseHexDigit(ctx)) {
        while (parseHexDigit(ctx) || (parseChar(ctx, '_') && parseHexDigit(ctx))) {
        }
        if (ctx.text[ctx.index - 1] !== '_') {
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

};
