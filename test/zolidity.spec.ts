import { expect } from 'chai';
import { zolidity } from '../src/index';

describe('Zolidity', async function () {
    describe('parseIdentifier()', async function () {
        it('should work on valid identifiers', async function () {
            expect(zolidity.parseIdentifier({ text: 'a', index: 0 })).to.be.equal('a');
            expect(zolidity.parseIdentifier({ text: 'a0', index: 0 })).to.be.equal('a0');
            expect(zolidity.parseIdentifier({ text: 'ab0', index: 0 })).to.be.equal('ab0');
        });

        it('shouldn\'t work on invalid identifiers', async function () {
            expect(zolidity.parseIdentifier({ text: '0', index: 0 })).to.be.equal('');
            expect(zolidity.parseIdentifier({ text: '1a', index: 0 })).to.be.equal('');
        });
    });

    describe('parseHexNumber()', async function () {
        it('should work on valid hex numbers', async function () {
            expect(zolidity.parseHexNumber({ text: '0x0', index: 0 })).to.be.equal('0x0');
            expect(zolidity.parseHexNumber({ text: '0xa', index: 0 })).to.be.equal('0xa');
            expect(zolidity.parseHexNumber({ text: '0xa_0', index: 0 })).to.be.equal('0xa_0');
        });

        it('shouldn\'t work on invalid hex numbers', async function () {
            expect(zolidity.parseHexNumber({ text: '0', index: 0 })).to.be.equal('');
            expect(zolidity.parseHexNumber({ text: '0x', index: 0 })).to.be.equal('');
            expect(zolidity.parseHexNumber({ text: '0xa_', index: 0 })).to.be.equal('');
            expect(zolidity.parseHexNumber({ text: '0xg', index: 0 })).to.be.equal('');
        });
    });

    describe('parseDecimalNumber()', async function () {
        it('should work on valid decimal numbers', async function () {
            expect(zolidity.parseDecimalNumber({ text: '0', index: 0 })).to.be.equal('0');
            expect(zolidity.parseDecimalNumber({ text: '0_0', index: 0 })).to.be.equal('0_0');
            expect(zolidity.parseDecimalNumber({ text: '0_0_0', index: 0 })).to.be.equal('0_0_0');

            expect(zolidity.parseDecimalNumber({ text: '0.0', index: 0 })).to.be.equal('0.0');
            expect(zolidity.parseDecimalNumber({ text: '0_0.0_0', index: 0 })).to.be.equal('0_0.0_0');
            expect(zolidity.parseDecimalNumber({ text: '0_0_0.0_0_0', index: 0 })).to.be.equal('0_0_0.0_0_0');

            expect(zolidity.parseDecimalNumber({ text: '0e0', index: 0 })).to.be.equal('0e0');
            expect(zolidity.parseDecimalNumber({ text: '0e0_0', index: 0 })).to.be.equal('0e0_0');
            expect(zolidity.parseDecimalNumber({ text: '0e-0_0', index: 0 })).to.be.equal('0e-0_0');

            expect(zolidity.parseDecimalNumber({ text: '0.0e0', index: 0 })).to.be.equal('0.0e0');
            expect(zolidity.parseDecimalNumber({ text: '0_0.0_0e0_0', index: 0 })).to.be.equal('0_0.0_0e0_0');
            expect(zolidity.parseDecimalNumber({ text: '0_0.0_0e-0_0', index: 0 })).to.be.equal('0_0.0_0e-0_0');
        });

        it('shouldn\'t work on invalid decimal numbers', async function () {
            expect(zolidity.parseDecimalNumber({ text: '0_', index: 0 })).to.be.equal('');
            expect(zolidity.parseDecimalNumber({ text: '_0', index: 0 })).to.be.equal('');
            expect(zolidity.parseDecimalNumber({ text: '0__0', index: 0 })).to.be.equal('');
            expect(zolidity.parseDecimalNumber({ text: '0_0_', index: 0 })).to.be.equal('');

            expect(zolidity.parseDecimalNumber({ text: '0.', index: 0 })).to.be.equal('');
            expect(zolidity.parseDecimalNumber({ text: '0.0_', index: 0 })).to.be.equal('');
            expect(zolidity.parseDecimalNumber({ text: '0.0e', index: 0 })).to.be.equal('');
            expect(zolidity.parseDecimalNumber({ text: '0e', index: 0 })).to.be.equal('');
            expect(zolidity.parseDecimalNumber({ text: '0e0_', index: 0 })).to.be.equal('');
        });
    });
});

