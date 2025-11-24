"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTarget = exports.targetsEqual = exports.architectures = exports.platforms = void 0;
const platforms = ['windows', 'mac', 'alpine', 'linux'], architectures = ['x86', 'x64', 'arm', 'arm64'];
exports.platforms = platforms;
exports.architectures = architectures;
const prettyPlatform = {
    win32: 'windows',
    windows: 'windows',
    win: 'windows',
    darwin: 'mac',
    macos: 'mac',
    mac: 'mac',
    linux: 'linux',
    static: 'alpine',
    alpine: 'alpine',
};
const prettyArch = {
    x86: 'x86',
    arm6: 'arm',
    arm64: 'arm64',
    arm6l: 'arm',
    arm: 'arm',
    arm7: 'arm',
    arm7l: 'arm',
    amd64: 'x64',
    ia32: 'x86',
    x32: 'x86',
    x64: 'x64',
};
function isVersion(x) {
    if (!x) {
        return false;
    }
    return /^[\d]+$/.test(x.replace(/v|\.|\s+/g, ''));
}
function isPlatform(x) {
    return x in prettyPlatform;
}
function isArch(x) {
    return x in prettyArch;
}
class Target {
    constructor(arch, platform, version) {
        this.arch = arch;
        this.platform = platform;
        this.version = version;
    }
    toJSON() {
        return this.toString();
    }
    toString() {
        return `${this.platform}-${this.arch}-${this.version}`;
    }
}
function targetsEqual(a, b) {
    return a.arch === b.arch && a.platform === b.platform && a.version === b.version;
}
exports.targetsEqual = targetsEqual;
function getTarget(target = '') {
    const currentArch = process.arch;
    let arch = currentArch in prettyArch ? prettyArch[process.arch] : process.arch, platform = prettyPlatform[process.platform], version = process.version.slice(1);
    if (typeof target !== 'string') {
        target = `${target.platform}-${target.arch}-${target.version}`;
    }
    target
        .toLowerCase()
        .split('-')
        .forEach((x) => {
        if (isVersion(x)) {
            version = x.replace(/v/g, '');
        }
        if (isPlatform(x)) {
            platform = prettyPlatform[x];
        }
        if (isArch(x)) {
            arch = prettyArch[x];
        }
    });
    return new Target(arch, platform, version);
}
exports.getTarget = getTarget;
