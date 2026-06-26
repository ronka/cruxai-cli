"use strict";
(() => {
  // src/core/constants.ts
  var TOKEN_DATA_AVAILABLE_FROM = "2026-04-01";
  var FF_TOKEN_REPORTING_ENABLED = false;

  // node_modules/@kurkle/color/dist/color.esm.js
  function round(v2) {
    return v2 + 0.5 | 0;
  }
  var lim = (v2, l2, h3) => Math.max(Math.min(v2, h3), l2);
  function p2b(v2) {
    return lim(round(v2 * 2.55), 0, 255);
  }
  function n2b(v2) {
    return lim(round(v2 * 255), 0, 255);
  }
  function b2n(v2) {
    return lim(round(v2 / 2.55) / 100, 0, 1);
  }
  function n2p(v2) {
    return lim(round(v2 * 100), 0, 100);
  }
  var map$1 = { 0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, A: 10, B: 11, C: 12, D: 13, E: 14, F: 15, a: 10, b: 11, c: 12, d: 13, e: 14, f: 15 };
  var hex = [..."0123456789ABCDEF"];
  var h1 = (b2) => hex[b2 & 15];
  var h2 = (b2) => hex[(b2 & 240) >> 4] + hex[b2 & 15];
  var eq = (b2) => (b2 & 240) >> 4 === (b2 & 15);
  var isShort = (v2) => eq(v2.r) && eq(v2.g) && eq(v2.b) && eq(v2.a);
  function hexParse(str) {
    var len = str.length;
    var ret;
    if (str[0] === "#") {
      if (len === 4 || len === 5) {
        ret = {
          r: 255 & map$1[str[1]] * 17,
          g: 255 & map$1[str[2]] * 17,
          b: 255 & map$1[str[3]] * 17,
          a: len === 5 ? map$1[str[4]] * 17 : 255
        };
      } else if (len === 7 || len === 9) {
        ret = {
          r: map$1[str[1]] << 4 | map$1[str[2]],
          g: map$1[str[3]] << 4 | map$1[str[4]],
          b: map$1[str[5]] << 4 | map$1[str[6]],
          a: len === 9 ? map$1[str[7]] << 4 | map$1[str[8]] : 255
        };
      }
    }
    return ret;
  }
  var alpha = (a2, f2) => a2 < 255 ? f2(a2) : "";
  function hexString(v2) {
    var f2 = isShort(v2) ? h1 : h2;
    return v2 ? "#" + f2(v2.r) + f2(v2.g) + f2(v2.b) + alpha(v2.a, f2) : void 0;
  }
  var HUE_RE = /^(hsla?|hwb|hsv)\(\s*([-+.e\d]+)(?:deg)?[\s,]+([-+.e\d]+)%[\s,]+([-+.e\d]+)%(?:[\s,]+([-+.e\d]+)(%)?)?\s*\)$/;
  function hsl2rgbn(h3, s2, l2) {
    const a2 = s2 * Math.min(l2, 1 - l2);
    const f2 = (n3, k2 = (n3 + h3 / 30) % 12) => l2 - a2 * Math.max(Math.min(k2 - 3, 9 - k2, 1), -1);
    return [f2(0), f2(8), f2(4)];
  }
  function hsv2rgbn(h3, s2, v2) {
    const f2 = (n3, k2 = (n3 + h3 / 60) % 6) => v2 - v2 * s2 * Math.max(Math.min(k2, 4 - k2, 1), 0);
    return [f2(5), f2(3), f2(1)];
  }
  function hwb2rgbn(h3, w2, b2) {
    const rgb = hsl2rgbn(h3, 1, 0.5);
    let i2;
    if (w2 + b2 > 1) {
      i2 = 1 / (w2 + b2);
      w2 *= i2;
      b2 *= i2;
    }
    for (i2 = 0; i2 < 3; i2++) {
      rgb[i2] *= 1 - w2 - b2;
      rgb[i2] += w2;
    }
    return rgb;
  }
  function hueValue(r2, g2, b2, d2, max2) {
    if (r2 === max2) {
      return (g2 - b2) / d2 + (g2 < b2 ? 6 : 0);
    }
    if (g2 === max2) {
      return (b2 - r2) / d2 + 2;
    }
    return (r2 - g2) / d2 + 4;
  }
  function rgb2hsl(v2) {
    const range = 255;
    const r2 = v2.r / range;
    const g2 = v2.g / range;
    const b2 = v2.b / range;
    const max2 = Math.max(r2, g2, b2);
    const min2 = Math.min(r2, g2, b2);
    const l2 = (max2 + min2) / 2;
    let h3, s2, d2;
    if (max2 !== min2) {
      d2 = max2 - min2;
      s2 = l2 > 0.5 ? d2 / (2 - max2 - min2) : d2 / (max2 + min2);
      h3 = hueValue(r2, g2, b2, d2, max2);
      h3 = h3 * 60 + 0.5;
    }
    return [h3 | 0, s2 || 0, l2];
  }
  function calln(f2, a2, b2, c2) {
    return (Array.isArray(a2) ? f2(a2[0], a2[1], a2[2]) : f2(a2, b2, c2)).map(n2b);
  }
  function hsl2rgb(h3, s2, l2) {
    return calln(hsl2rgbn, h3, s2, l2);
  }
  function hwb2rgb(h3, w2, b2) {
    return calln(hwb2rgbn, h3, w2, b2);
  }
  function hsv2rgb(h3, s2, v2) {
    return calln(hsv2rgbn, h3, s2, v2);
  }
  function hue(h3) {
    return (h3 % 360 + 360) % 360;
  }
  function hueParse(str) {
    const m2 = HUE_RE.exec(str);
    let a2 = 255;
    let v2;
    if (!m2) {
      return;
    }
    if (m2[5] !== v2) {
      a2 = m2[6] ? p2b(+m2[5]) : n2b(+m2[5]);
    }
    const h3 = hue(+m2[2]);
    const p1 = +m2[3] / 100;
    const p2 = +m2[4] / 100;
    if (m2[1] === "hwb") {
      v2 = hwb2rgb(h3, p1, p2);
    } else if (m2[1] === "hsv") {
      v2 = hsv2rgb(h3, p1, p2);
    } else {
      v2 = hsl2rgb(h3, p1, p2);
    }
    return {
      r: v2[0],
      g: v2[1],
      b: v2[2],
      a: a2
    };
  }
  function rotate(v2, deg) {
    var h3 = rgb2hsl(v2);
    h3[0] = hue(h3[0] + deg);
    h3 = hsl2rgb(h3);
    v2.r = h3[0];
    v2.g = h3[1];
    v2.b = h3[2];
  }
  function hslString(v2) {
    if (!v2) {
      return;
    }
    const a2 = rgb2hsl(v2);
    const h3 = a2[0];
    const s2 = n2p(a2[1]);
    const l2 = n2p(a2[2]);
    return v2.a < 255 ? `hsla(${h3}, ${s2}%, ${l2}%, ${b2n(v2.a)})` : `hsl(${h3}, ${s2}%, ${l2}%)`;
  }
  var map = {
    x: "dark",
    Z: "light",
    Y: "re",
    X: "blu",
    W: "gr",
    V: "medium",
    U: "slate",
    A: "ee",
    T: "ol",
    S: "or",
    B: "ra",
    C: "lateg",
    D: "ights",
    R: "in",
    Q: "turquois",
    E: "hi",
    P: "ro",
    O: "al",
    N: "le",
    M: "de",
    L: "yello",
    F: "en",
    K: "ch",
    G: "arks",
    H: "ea",
    I: "ightg",
    J: "wh"
  };
  var names$1 = {
    OiceXe: "f0f8ff",
    antiquewEte: "faebd7",
    aqua: "ffff",
    aquamarRe: "7fffd4",
    azuY: "f0ffff",
    beige: "f5f5dc",
    bisque: "ffe4c4",
    black: "0",
    blanKedOmond: "ffebcd",
    Xe: "ff",
    XeviTet: "8a2be2",
    bPwn: "a52a2a",
    burlywood: "deb887",
    caMtXe: "5f9ea0",
    KartYuse: "7fff00",
    KocTate: "d2691e",
    cSO: "ff7f50",
    cSnflowerXe: "6495ed",
    cSnsilk: "fff8dc",
    crimson: "dc143c",
    cyan: "ffff",
    xXe: "8b",
    xcyan: "8b8b",
    xgTMnPd: "b8860b",
    xWay: "a9a9a9",
    xgYF: "6400",
    xgYy: "a9a9a9",
    xkhaki: "bdb76b",
    xmagFta: "8b008b",
    xTivegYF: "556b2f",
    xSange: "ff8c00",
    xScEd: "9932cc",
    xYd: "8b0000",
    xsOmon: "e9967a",
    xsHgYF: "8fbc8f",
    xUXe: "483d8b",
    xUWay: "2f4f4f",
    xUgYy: "2f4f4f",
    xQe: "ced1",
    xviTet: "9400d3",
    dAppRk: "ff1493",
    dApskyXe: "bfff",
    dimWay: "696969",
    dimgYy: "696969",
    dodgerXe: "1e90ff",
    fiYbrick: "b22222",
    flSOwEte: "fffaf0",
    foYstWAn: "228b22",
    fuKsia: "ff00ff",
    gaRsbSo: "dcdcdc",
    ghostwEte: "f8f8ff",
    gTd: "ffd700",
    gTMnPd: "daa520",
    Way: "808080",
    gYF: "8000",
    gYFLw: "adff2f",
    gYy: "808080",
    honeyMw: "f0fff0",
    hotpRk: "ff69b4",
    RdianYd: "cd5c5c",
    Rdigo: "4b0082",
    ivSy: "fffff0",
    khaki: "f0e68c",
    lavFMr: "e6e6fa",
    lavFMrXsh: "fff0f5",
    lawngYF: "7cfc00",
    NmoncEffon: "fffacd",
    ZXe: "add8e6",
    ZcSO: "f08080",
    Zcyan: "e0ffff",
    ZgTMnPdLw: "fafad2",
    ZWay: "d3d3d3",
    ZgYF: "90ee90",
    ZgYy: "d3d3d3",
    ZpRk: "ffb6c1",
    ZsOmon: "ffa07a",
    ZsHgYF: "20b2aa",
    ZskyXe: "87cefa",
    ZUWay: "778899",
    ZUgYy: "778899",
    ZstAlXe: "b0c4de",
    ZLw: "ffffe0",
    lime: "ff00",
    limegYF: "32cd32",
    lRF: "faf0e6",
    magFta: "ff00ff",
    maPon: "800000",
    VaquamarRe: "66cdaa",
    VXe: "cd",
    VScEd: "ba55d3",
    VpurpN: "9370db",
    VsHgYF: "3cb371",
    VUXe: "7b68ee",
    VsprRggYF: "fa9a",
    VQe: "48d1cc",
    VviTetYd: "c71585",
    midnightXe: "191970",
    mRtcYam: "f5fffa",
    mistyPse: "ffe4e1",
    moccasR: "ffe4b5",
    navajowEte: "ffdead",
    navy: "80",
    Tdlace: "fdf5e6",
    Tive: "808000",
    TivedBb: "6b8e23",
    Sange: "ffa500",
    SangeYd: "ff4500",
    ScEd: "da70d6",
    pOegTMnPd: "eee8aa",
    pOegYF: "98fb98",
    pOeQe: "afeeee",
    pOeviTetYd: "db7093",
    papayawEp: "ffefd5",
    pHKpuff: "ffdab9",
    peru: "cd853f",
    pRk: "ffc0cb",
    plum: "dda0dd",
    powMrXe: "b0e0e6",
    purpN: "800080",
    YbeccapurpN: "663399",
    Yd: "ff0000",
    Psybrown: "bc8f8f",
    PyOXe: "4169e1",
    saddNbPwn: "8b4513",
    sOmon: "fa8072",
    sandybPwn: "f4a460",
    sHgYF: "2e8b57",
    sHshell: "fff5ee",
    siFna: "a0522d",
    silver: "c0c0c0",
    skyXe: "87ceeb",
    UXe: "6a5acd",
    UWay: "708090",
    UgYy: "708090",
    snow: "fffafa",
    sprRggYF: "ff7f",
    stAlXe: "4682b4",
    tan: "d2b48c",
    teO: "8080",
    tEstN: "d8bfd8",
    tomato: "ff6347",
    Qe: "40e0d0",
    viTet: "ee82ee",
    JHt: "f5deb3",
    wEte: "ffffff",
    wEtesmoke: "f5f5f5",
    Lw: "ffff00",
    LwgYF: "9acd32"
  };
  function unpack() {
    const unpacked = {};
    const keys = Object.keys(names$1);
    const tkeys = Object.keys(map);
    let i2, j2, k2, ok, nk;
    for (i2 = 0; i2 < keys.length; i2++) {
      ok = nk = keys[i2];
      for (j2 = 0; j2 < tkeys.length; j2++) {
        k2 = tkeys[j2];
        nk = nk.replace(k2, map[k2]);
      }
      k2 = parseInt(names$1[ok], 16);
      unpacked[nk] = [k2 >> 16 & 255, k2 >> 8 & 255, k2 & 255];
    }
    return unpacked;
  }
  var names;
  function nameParse(str) {
    if (!names) {
      names = unpack();
      names.transparent = [0, 0, 0, 0];
    }
    const a2 = names[str.toLowerCase()];
    return a2 && {
      r: a2[0],
      g: a2[1],
      b: a2[2],
      a: a2.length === 4 ? a2[3] : 255
    };
  }
  var RGB_RE = /^rgba?\(\s*([-+.\d]+)(%)?[\s,]+([-+.e\d]+)(%)?[\s,]+([-+.e\d]+)(%)?(?:[\s,/]+([-+.e\d]+)(%)?)?\s*\)$/;
  function rgbParse(str) {
    const m2 = RGB_RE.exec(str);
    let a2 = 255;
    let r2, g2, b2;
    if (!m2) {
      return;
    }
    if (m2[7] !== r2) {
      const v2 = +m2[7];
      a2 = m2[8] ? p2b(v2) : lim(v2 * 255, 0, 255);
    }
    r2 = +m2[1];
    g2 = +m2[3];
    b2 = +m2[5];
    r2 = 255 & (m2[2] ? p2b(r2) : lim(r2, 0, 255));
    g2 = 255 & (m2[4] ? p2b(g2) : lim(g2, 0, 255));
    b2 = 255 & (m2[6] ? p2b(b2) : lim(b2, 0, 255));
    return {
      r: r2,
      g: g2,
      b: b2,
      a: a2
    };
  }
  function rgbString(v2) {
    return v2 && (v2.a < 255 ? `rgba(${v2.r}, ${v2.g}, ${v2.b}, ${b2n(v2.a)})` : `rgb(${v2.r}, ${v2.g}, ${v2.b})`);
  }
  var to = (v2) => v2 <= 31308e-7 ? v2 * 12.92 : Math.pow(v2, 1 / 2.4) * 1.055 - 0.055;
  var from = (v2) => v2 <= 0.04045 ? v2 / 12.92 : Math.pow((v2 + 0.055) / 1.055, 2.4);
  function interpolate(rgb1, rgb2, t3) {
    const r2 = from(b2n(rgb1.r));
    const g2 = from(b2n(rgb1.g));
    const b2 = from(b2n(rgb1.b));
    return {
      r: n2b(to(r2 + t3 * (from(b2n(rgb2.r)) - r2))),
      g: n2b(to(g2 + t3 * (from(b2n(rgb2.g)) - g2))),
      b: n2b(to(b2 + t3 * (from(b2n(rgb2.b)) - b2))),
      a: rgb1.a + t3 * (rgb2.a - rgb1.a)
    };
  }
  function modHSL(v2, i2, ratio) {
    if (v2) {
      let tmp = rgb2hsl(v2);
      tmp[i2] = Math.max(0, Math.min(tmp[i2] + tmp[i2] * ratio, i2 === 0 ? 360 : 1));
      tmp = hsl2rgb(tmp);
      v2.r = tmp[0];
      v2.g = tmp[1];
      v2.b = tmp[2];
    }
  }
  function clone(v2, proto) {
    return v2 ? Object.assign(proto || {}, v2) : v2;
  }
  function fromObject(input) {
    var v2 = { r: 0, g: 0, b: 0, a: 255 };
    if (Array.isArray(input)) {
      if (input.length >= 3) {
        v2 = { r: input[0], g: input[1], b: input[2], a: 255 };
        if (input.length > 3) {
          v2.a = n2b(input[3]);
        }
      }
    } else {
      v2 = clone(input, { r: 0, g: 0, b: 0, a: 1 });
      v2.a = n2b(v2.a);
    }
    return v2;
  }
  function functionParse(str) {
    if (str.charAt(0) === "r") {
      return rgbParse(str);
    }
    return hueParse(str);
  }
  var Color = class _Color {
    constructor(input) {
      if (input instanceof _Color) {
        return input;
      }
      const type = typeof input;
      let v2;
      if (type === "object") {
        v2 = fromObject(input);
      } else if (type === "string") {
        v2 = hexParse(input) || nameParse(input) || functionParse(input);
      }
      this._rgb = v2;
      this._valid = !!v2;
    }
    get valid() {
      return this._valid;
    }
    get rgb() {
      var v2 = clone(this._rgb);
      if (v2) {
        v2.a = b2n(v2.a);
      }
      return v2;
    }
    set rgb(obj) {
      this._rgb = fromObject(obj);
    }
    rgbString() {
      return this._valid ? rgbString(this._rgb) : void 0;
    }
    hexString() {
      return this._valid ? hexString(this._rgb) : void 0;
    }
    hslString() {
      return this._valid ? hslString(this._rgb) : void 0;
    }
    mix(color2, weight) {
      if (color2) {
        const c1 = this.rgb;
        const c2 = color2.rgb;
        let w2;
        const p2 = weight === w2 ? 0.5 : weight;
        const w3 = 2 * p2 - 1;
        const a2 = c1.a - c2.a;
        const w1 = ((w3 * a2 === -1 ? w3 : (w3 + a2) / (1 + w3 * a2)) + 1) / 2;
        w2 = 1 - w1;
        c1.r = 255 & w1 * c1.r + w2 * c2.r + 0.5;
        c1.g = 255 & w1 * c1.g + w2 * c2.g + 0.5;
        c1.b = 255 & w1 * c1.b + w2 * c2.b + 0.5;
        c1.a = p2 * c1.a + (1 - p2) * c2.a;
        this.rgb = c1;
      }
      return this;
    }
    interpolate(color2, t3) {
      if (color2) {
        this._rgb = interpolate(this._rgb, color2._rgb, t3);
      }
      return this;
    }
    clone() {
      return new _Color(this.rgb);
    }
    alpha(a2) {
      this._rgb.a = n2b(a2);
      return this;
    }
    clearer(ratio) {
      const rgb = this._rgb;
      rgb.a *= 1 - ratio;
      return this;
    }
    greyscale() {
      const rgb = this._rgb;
      const val = round(rgb.r * 0.3 + rgb.g * 0.59 + rgb.b * 0.11);
      rgb.r = rgb.g = rgb.b = val;
      return this;
    }
    opaquer(ratio) {
      const rgb = this._rgb;
      rgb.a *= 1 + ratio;
      return this;
    }
    negate() {
      const v2 = this._rgb;
      v2.r = 255 - v2.r;
      v2.g = 255 - v2.g;
      v2.b = 255 - v2.b;
      return this;
    }
    lighten(ratio) {
      modHSL(this._rgb, 2, ratio);
      return this;
    }
    darken(ratio) {
      modHSL(this._rgb, 2, -ratio);
      return this;
    }
    saturate(ratio) {
      modHSL(this._rgb, 1, ratio);
      return this;
    }
    desaturate(ratio) {
      modHSL(this._rgb, 1, -ratio);
      return this;
    }
    rotate(deg) {
      rotate(this._rgb, deg);
      return this;
    }
  };

  // node_modules/chart.js/dist/chunks/helpers.dataset.js
  function noop() {
  }
  var uid = /* @__PURE__ */ (() => {
    let id = 0;
    return () => id++;
  })();
  function isNullOrUndef(value) {
    return value === null || value === void 0;
  }
  function isArray(value) {
    if (Array.isArray && Array.isArray(value)) {
      return true;
    }
    const type = Object.prototype.toString.call(value);
    if (type.slice(0, 7) === "[object" && type.slice(-6) === "Array]") {
      return true;
    }
    return false;
  }
  function isObject(value) {
    return value !== null && Object.prototype.toString.call(value) === "[object Object]";
  }
  function isNumberFinite(value) {
    return (typeof value === "number" || value instanceof Number) && isFinite(+value);
  }
  function finiteOrDefault(value, defaultValue) {
    return isNumberFinite(value) ? value : defaultValue;
  }
  function valueOrDefault(value, defaultValue) {
    return typeof value === "undefined" ? defaultValue : value;
  }
  var toPercentage = (value, dimension) => typeof value === "string" && value.endsWith("%") ? parseFloat(value) / 100 : +value / dimension;
  var toDimension = (value, dimension) => typeof value === "string" && value.endsWith("%") ? parseFloat(value) / 100 * dimension : +value;
  function callback(fn, args, thisArg) {
    if (fn && typeof fn.call === "function") {
      return fn.apply(thisArg, args);
    }
  }
  function each(loopable, fn, thisArg, reverse) {
    let i2, len, keys;
    if (isArray(loopable)) {
      len = loopable.length;
      if (reverse) {
        for (i2 = len - 1; i2 >= 0; i2--) {
          fn.call(thisArg, loopable[i2], i2);
        }
      } else {
        for (i2 = 0; i2 < len; i2++) {
          fn.call(thisArg, loopable[i2], i2);
        }
      }
    } else if (isObject(loopable)) {
      keys = Object.keys(loopable);
      len = keys.length;
      for (i2 = 0; i2 < len; i2++) {
        fn.call(thisArg, loopable[keys[i2]], keys[i2]);
      }
    }
  }
  function _elementsEqual(a0, a1) {
    let i2, ilen, v0, v1;
    if (!a0 || !a1 || a0.length !== a1.length) {
      return false;
    }
    for (i2 = 0, ilen = a0.length; i2 < ilen; ++i2) {
      v0 = a0[i2];
      v1 = a1[i2];
      if (v0.datasetIndex !== v1.datasetIndex || v0.index !== v1.index) {
        return false;
      }
    }
    return true;
  }
  function clone2(source) {
    if (isArray(source)) {
      return source.map(clone2);
    }
    if (isObject(source)) {
      const target = /* @__PURE__ */ Object.create(null);
      const keys = Object.keys(source);
      const klen = keys.length;
      let k2 = 0;
      for (; k2 < klen; ++k2) {
        target[keys[k2]] = clone2(source[keys[k2]]);
      }
      return target;
    }
    return source;
  }
  function isValidKey(key) {
    return [
      "__proto__",
      "prototype",
      "constructor"
    ].indexOf(key) === -1;
  }
  function _merger(key, target, source, options) {
    if (!isValidKey(key)) {
      return;
    }
    const tval = target[key];
    const sval = source[key];
    if (isObject(tval) && isObject(sval)) {
      merge(tval, sval, options);
    } else {
      target[key] = clone2(sval);
    }
  }
  function merge(target, source, options) {
    const sources = isArray(source) ? source : [
      source
    ];
    const ilen = sources.length;
    if (!isObject(target)) {
      return target;
    }
    options = options || {};
    const merger = options.merger || _merger;
    let current;
    for (let i2 = 0; i2 < ilen; ++i2) {
      current = sources[i2];
      if (!isObject(current)) {
        continue;
      }
      const keys = Object.keys(current);
      for (let k2 = 0, klen = keys.length; k2 < klen; ++k2) {
        merger(keys[k2], target, current, options);
      }
    }
    return target;
  }
  function mergeIf(target, source) {
    return merge(target, source, {
      merger: _mergerIf
    });
  }
  function _mergerIf(key, target, source) {
    if (!isValidKey(key)) {
      return;
    }
    const tval = target[key];
    const sval = source[key];
    if (isObject(tval) && isObject(sval)) {
      mergeIf(tval, sval);
    } else if (!Object.prototype.hasOwnProperty.call(target, key)) {
      target[key] = clone2(sval);
    }
  }
  var keyResolvers = {
    // Chart.helpers.core resolveObjectKey should resolve empty key to root object
    "": (v2) => v2,
    // default resolvers
    x: (o2) => o2.x,
    y: (o2) => o2.y
  };
  function _splitKey(key) {
    const parts = key.split(".");
    const keys = [];
    let tmp = "";
    for (const part of parts) {
      tmp += part;
      if (tmp.endsWith("\\")) {
        tmp = tmp.slice(0, -1) + ".";
      } else {
        keys.push(tmp);
        tmp = "";
      }
    }
    return keys;
  }
  function _getKeyResolver(key) {
    const keys = _splitKey(key);
    return (obj) => {
      for (const k2 of keys) {
        if (k2 === "") {
          break;
        }
        obj = obj && obj[k2];
      }
      return obj;
    };
  }
  function resolveObjectKey(obj, key) {
    const resolver = keyResolvers[key] || (keyResolvers[key] = _getKeyResolver(key));
    return resolver(obj);
  }
  function _capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  var defined = (value) => typeof value !== "undefined";
  var isFunction = (value) => typeof value === "function";
  var setsEqual = (a2, b2) => {
    if (a2.size !== b2.size) {
      return false;
    }
    for (const item of a2) {
      if (!b2.has(item)) {
        return false;
      }
    }
    return true;
  };
  function _isClickEvent(e2) {
    return e2.type === "mouseup" || e2.type === "click" || e2.type === "contextmenu";
  }
  var PI = Math.PI;
  var TAU = 2 * PI;
  var PITAU = TAU + PI;
  var INFINITY = Number.POSITIVE_INFINITY;
  var RAD_PER_DEG = PI / 180;
  var HALF_PI = PI / 2;
  var QUARTER_PI = PI / 4;
  var TWO_THIRDS_PI = PI * 2 / 3;
  var log10 = Math.log10;
  var sign = Math.sign;
  function almostEquals(x2, y2, epsilon) {
    return Math.abs(x2 - y2) < epsilon;
  }
  function niceNum(range) {
    const roundedRange = Math.round(range);
    range = almostEquals(range, roundedRange, range / 1e3) ? roundedRange : range;
    const niceRange = Math.pow(10, Math.floor(log10(range)));
    const fraction = range / niceRange;
    const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
    return niceFraction * niceRange;
  }
  function _factorize(value) {
    const result = [];
    const sqrt = Math.sqrt(value);
    let i2;
    for (i2 = 1; i2 < sqrt; i2++) {
      if (value % i2 === 0) {
        result.push(i2);
        result.push(value / i2);
      }
    }
    if (sqrt === (sqrt | 0)) {
      result.push(sqrt);
    }
    result.sort((a2, b2) => a2 - b2).pop();
    return result;
  }
  function isNonPrimitive(n3) {
    return typeof n3 === "symbol" || typeof n3 === "object" && n3 !== null && !(Symbol.toPrimitive in n3 || "toString" in n3 || "valueOf" in n3);
  }
  function isNumber(n3) {
    return !isNonPrimitive(n3) && !isNaN(parseFloat(n3)) && isFinite(n3);
  }
  function almostWhole(x2, epsilon) {
    const rounded = Math.round(x2);
    return rounded - epsilon <= x2 && rounded + epsilon >= x2;
  }
  function _setMinAndMaxByKey(array, target, property) {
    let i2, ilen, value;
    for (i2 = 0, ilen = array.length; i2 < ilen; i2++) {
      value = array[i2][property];
      if (!isNaN(value)) {
        target.min = Math.min(target.min, value);
        target.max = Math.max(target.max, value);
      }
    }
  }
  function toRadians(degrees) {
    return degrees * (PI / 180);
  }
  function toDegrees(radians) {
    return radians * (180 / PI);
  }
  function _decimalPlaces(x2) {
    if (!isNumberFinite(x2)) {
      return;
    }
    let e2 = 1;
    let p2 = 0;
    while (Math.round(x2 * e2) / e2 !== x2) {
      e2 *= 10;
      p2++;
    }
    return p2;
  }
  function getAngleFromPoint(centrePoint, anglePoint) {
    const distanceFromXCenter = anglePoint.x - centrePoint.x;
    const distanceFromYCenter = anglePoint.y - centrePoint.y;
    const radialDistanceFromCenter = Math.sqrt(distanceFromXCenter * distanceFromXCenter + distanceFromYCenter * distanceFromYCenter);
    let angle = Math.atan2(distanceFromYCenter, distanceFromXCenter);
    if (angle < -0.5 * PI) {
      angle += TAU;
    }
    return {
      angle,
      distance: radialDistanceFromCenter
    };
  }
  function distanceBetweenPoints(pt1, pt2) {
    return Math.sqrt(Math.pow(pt2.x - pt1.x, 2) + Math.pow(pt2.y - pt1.y, 2));
  }
  function _angleDiff(a2, b2) {
    return (a2 - b2 + PITAU) % TAU - PI;
  }
  function _normalizeAngle(a2) {
    return (a2 % TAU + TAU) % TAU;
  }
  function _angleBetween(angle, start, end, sameAngleIsFullCircle) {
    const a2 = _normalizeAngle(angle);
    const s2 = _normalizeAngle(start);
    const e2 = _normalizeAngle(end);
    const angleToStart = _normalizeAngle(s2 - a2);
    const angleToEnd = _normalizeAngle(e2 - a2);
    const startToAngle = _normalizeAngle(a2 - s2);
    const endToAngle = _normalizeAngle(a2 - e2);
    return a2 === s2 || a2 === e2 || sameAngleIsFullCircle && s2 === e2 || angleToStart > angleToEnd && startToAngle < endToAngle;
  }
  function _limitValue(value, min2, max2) {
    return Math.max(min2, Math.min(max2, value));
  }
  function _int16Range(value) {
    return _limitValue(value, -32768, 32767);
  }
  function _isBetween(value, start, end, epsilon = 1e-6) {
    return value >= Math.min(start, end) - epsilon && value <= Math.max(start, end) + epsilon;
  }
  function _lookup(table, value, cmp) {
    cmp = cmp || ((index3) => table[index3] < value);
    let hi = table.length - 1;
    let lo = 0;
    let mid;
    while (hi - lo > 1) {
      mid = lo + hi >> 1;
      if (cmp(mid)) {
        lo = mid;
      } else {
        hi = mid;
      }
    }
    return {
      lo,
      hi
    };
  }
  var _lookupByKey = (table, key, value, last) => _lookup(table, value, last ? (index3) => {
    const ti = table[index3][key];
    return ti < value || ti === value && table[index3 + 1][key] === value;
  } : (index3) => table[index3][key] < value);
  var _rlookupByKey = (table, key, value) => _lookup(table, value, (index3) => table[index3][key] >= value);
  function _filterBetween(values, min2, max2) {
    let start = 0;
    let end = values.length;
    while (start < end && values[start] < min2) {
      start++;
    }
    while (end > start && values[end - 1] > max2) {
      end--;
    }
    return start > 0 || end < values.length ? values.slice(start, end) : values;
  }
  var arrayEvents = [
    "push",
    "pop",
    "shift",
    "splice",
    "unshift"
  ];
  function listenArrayEvents(array, listener) {
    if (array._chartjs) {
      array._chartjs.listeners.push(listener);
      return;
    }
    Object.defineProperty(array, "_chartjs", {
      configurable: true,
      enumerable: false,
      value: {
        listeners: [
          listener
        ]
      }
    });
    arrayEvents.forEach((key) => {
      const method = "_onData" + _capitalize(key);
      const base = array[key];
      Object.defineProperty(array, key, {
        configurable: true,
        enumerable: false,
        value(...args) {
          const res = base.apply(this, args);
          array._chartjs.listeners.forEach((object) => {
            if (typeof object[method] === "function") {
              object[method](...args);
            }
          });
          return res;
        }
      });
    });
  }
  function unlistenArrayEvents(array, listener) {
    const stub = array._chartjs;
    if (!stub) {
      return;
    }
    const listeners = stub.listeners;
    const index3 = listeners.indexOf(listener);
    if (index3 !== -1) {
      listeners.splice(index3, 1);
    }
    if (listeners.length > 0) {
      return;
    }
    arrayEvents.forEach((key) => {
      delete array[key];
    });
    delete array._chartjs;
  }
  function _arrayUnique(items) {
    const set2 = new Set(items);
    if (set2.size === items.length) {
      return items;
    }
    return Array.from(set2);
  }
  var requestAnimFrame = (function() {
    if (typeof window === "undefined") {
      return function(callback2) {
        return callback2();
      };
    }
    return window.requestAnimationFrame;
  })();
  function throttled(fn, thisArg) {
    let argsToUse = [];
    let ticking = false;
    return function(...args) {
      argsToUse = args;
      if (!ticking) {
        ticking = true;
        requestAnimFrame.call(window, () => {
          ticking = false;
          fn.apply(thisArg, argsToUse);
        });
      }
    };
  }
  function debounce(fn, delay) {
    let timeout;
    return function(...args) {
      if (delay) {
        clearTimeout(timeout);
        timeout = setTimeout(fn, delay, args);
      } else {
        fn.apply(this, args);
      }
      return delay;
    };
  }
  var _toLeftRightCenter = (align) => align === "start" ? "left" : align === "end" ? "right" : "center";
  var _alignStartEnd = (align, start, end) => align === "start" ? start : align === "end" ? end : (start + end) / 2;
  var _textX = (align, left, right, rtl) => {
    const check = rtl ? "left" : "right";
    return align === check ? right : align === "center" ? (left + right) / 2 : left;
  };
  function _getStartAndCountOfVisiblePoints(meta, points, animationsDisabled) {
    const pointCount = points.length;
    let start = 0;
    let count = pointCount;
    if (meta._sorted) {
      const { iScale, vScale, _parsed } = meta;
      const spanGaps = meta.dataset ? meta.dataset.options ? meta.dataset.options.spanGaps : null : null;
      const axis = iScale.axis;
      const { min: min2, max: max2, minDefined, maxDefined } = iScale.getUserBounds();
      if (minDefined) {
        start = Math.min(
          // @ts-expect-error Need to type _parsed
          _lookupByKey(_parsed, axis, min2).lo,
          // @ts-expect-error Need to fix types on _lookupByKey
          animationsDisabled ? pointCount : _lookupByKey(points, axis, iScale.getPixelForValue(min2)).lo
        );
        if (spanGaps) {
          const distanceToDefinedLo = _parsed.slice(0, start + 1).reverse().findIndex((point) => !isNullOrUndef(point[vScale.axis]));
          start -= Math.max(0, distanceToDefinedLo);
        }
        start = _limitValue(start, 0, pointCount - 1);
      }
      if (maxDefined) {
        let end = Math.max(
          // @ts-expect-error Need to type _parsed
          _lookupByKey(_parsed, iScale.axis, max2, true).hi + 1,
          // @ts-expect-error Need to fix types on _lookupByKey
          animationsDisabled ? 0 : _lookupByKey(points, axis, iScale.getPixelForValue(max2), true).hi + 1
        );
        if (spanGaps) {
          const distanceToDefinedHi = _parsed.slice(end - 1).findIndex((point) => !isNullOrUndef(point[vScale.axis]));
          end += Math.max(0, distanceToDefinedHi);
        }
        count = _limitValue(end, start, pointCount) - start;
      } else {
        count = pointCount - start;
      }
    }
    return {
      start,
      count
    };
  }
  function _scaleRangesChanged(meta) {
    const { xScale, yScale, _scaleRanges } = meta;
    const newRanges = {
      xmin: xScale.min,
      xmax: xScale.max,
      ymin: yScale.min,
      ymax: yScale.max
    };
    if (!_scaleRanges) {
      meta._scaleRanges = newRanges;
      return true;
    }
    const changed = _scaleRanges.xmin !== xScale.min || _scaleRanges.xmax !== xScale.max || _scaleRanges.ymin !== yScale.min || _scaleRanges.ymax !== yScale.max;
    Object.assign(_scaleRanges, newRanges);
    return changed;
  }
  var atEdge = (t3) => t3 === 0 || t3 === 1;
  var elasticIn = (t3, s2, p2) => -(Math.pow(2, 10 * (t3 -= 1)) * Math.sin((t3 - s2) * TAU / p2));
  var elasticOut = (t3, s2, p2) => Math.pow(2, -10 * t3) * Math.sin((t3 - s2) * TAU / p2) + 1;
  var effects = {
    linear: (t3) => t3,
    easeInQuad: (t3) => t3 * t3,
    easeOutQuad: (t3) => -t3 * (t3 - 2),
    easeInOutQuad: (t3) => (t3 /= 0.5) < 1 ? 0.5 * t3 * t3 : -0.5 * (--t3 * (t3 - 2) - 1),
    easeInCubic: (t3) => t3 * t3 * t3,
    easeOutCubic: (t3) => (t3 -= 1) * t3 * t3 + 1,
    easeInOutCubic: (t3) => (t3 /= 0.5) < 1 ? 0.5 * t3 * t3 * t3 : 0.5 * ((t3 -= 2) * t3 * t3 + 2),
    easeInQuart: (t3) => t3 * t3 * t3 * t3,
    easeOutQuart: (t3) => -((t3 -= 1) * t3 * t3 * t3 - 1),
    easeInOutQuart: (t3) => (t3 /= 0.5) < 1 ? 0.5 * t3 * t3 * t3 * t3 : -0.5 * ((t3 -= 2) * t3 * t3 * t3 - 2),
    easeInQuint: (t3) => t3 * t3 * t3 * t3 * t3,
    easeOutQuint: (t3) => (t3 -= 1) * t3 * t3 * t3 * t3 + 1,
    easeInOutQuint: (t3) => (t3 /= 0.5) < 1 ? 0.5 * t3 * t3 * t3 * t3 * t3 : 0.5 * ((t3 -= 2) * t3 * t3 * t3 * t3 + 2),
    easeInSine: (t3) => -Math.cos(t3 * HALF_PI) + 1,
    easeOutSine: (t3) => Math.sin(t3 * HALF_PI),
    easeInOutSine: (t3) => -0.5 * (Math.cos(PI * t3) - 1),
    easeInExpo: (t3) => t3 === 0 ? 0 : Math.pow(2, 10 * (t3 - 1)),
    easeOutExpo: (t3) => t3 === 1 ? 1 : -Math.pow(2, -10 * t3) + 1,
    easeInOutExpo: (t3) => atEdge(t3) ? t3 : t3 < 0.5 ? 0.5 * Math.pow(2, 10 * (t3 * 2 - 1)) : 0.5 * (-Math.pow(2, -10 * (t3 * 2 - 1)) + 2),
    easeInCirc: (t3) => t3 >= 1 ? t3 : -(Math.sqrt(1 - t3 * t3) - 1),
    easeOutCirc: (t3) => Math.sqrt(1 - (t3 -= 1) * t3),
    easeInOutCirc: (t3) => (t3 /= 0.5) < 1 ? -0.5 * (Math.sqrt(1 - t3 * t3) - 1) : 0.5 * (Math.sqrt(1 - (t3 -= 2) * t3) + 1),
    easeInElastic: (t3) => atEdge(t3) ? t3 : elasticIn(t3, 0.075, 0.3),
    easeOutElastic: (t3) => atEdge(t3) ? t3 : elasticOut(t3, 0.075, 0.3),
    easeInOutElastic(t3) {
      const s2 = 0.1125;
      const p2 = 0.45;
      return atEdge(t3) ? t3 : t3 < 0.5 ? 0.5 * elasticIn(t3 * 2, s2, p2) : 0.5 + 0.5 * elasticOut(t3 * 2 - 1, s2, p2);
    },
    easeInBack(t3) {
      const s2 = 1.70158;
      return t3 * t3 * ((s2 + 1) * t3 - s2);
    },
    easeOutBack(t3) {
      const s2 = 1.70158;
      return (t3 -= 1) * t3 * ((s2 + 1) * t3 + s2) + 1;
    },
    easeInOutBack(t3) {
      let s2 = 1.70158;
      if ((t3 /= 0.5) < 1) {
        return 0.5 * (t3 * t3 * (((s2 *= 1.525) + 1) * t3 - s2));
      }
      return 0.5 * ((t3 -= 2) * t3 * (((s2 *= 1.525) + 1) * t3 + s2) + 2);
    },
    easeInBounce: (t3) => 1 - effects.easeOutBounce(1 - t3),
    easeOutBounce(t3) {
      const m2 = 7.5625;
      const d2 = 2.75;
      if (t3 < 1 / d2) {
        return m2 * t3 * t3;
      }
      if (t3 < 2 / d2) {
        return m2 * (t3 -= 1.5 / d2) * t3 + 0.75;
      }
      if (t3 < 2.5 / d2) {
        return m2 * (t3 -= 2.25 / d2) * t3 + 0.9375;
      }
      return m2 * (t3 -= 2.625 / d2) * t3 + 0.984375;
    },
    easeInOutBounce: (t3) => t3 < 0.5 ? effects.easeInBounce(t3 * 2) * 0.5 : effects.easeOutBounce(t3 * 2 - 1) * 0.5 + 0.5
  };
  function isPatternOrGradient(value) {
    if (value && typeof value === "object") {
      const type = value.toString();
      return type === "[object CanvasPattern]" || type === "[object CanvasGradient]";
    }
    return false;
  }
  function color(value) {
    return isPatternOrGradient(value) ? value : new Color(value);
  }
  function getHoverColor(value) {
    return isPatternOrGradient(value) ? value : new Color(value).saturate(0.5).darken(0.1).hexString();
  }
  var numbers = [
    "x",
    "y",
    "borderWidth",
    "radius",
    "tension"
  ];
  var colors = [
    "color",
    "borderColor",
    "backgroundColor"
  ];
  function applyAnimationsDefaults(defaults2) {
    defaults2.set("animation", {
      delay: void 0,
      duration: 1e3,
      easing: "easeOutQuart",
      fn: void 0,
      from: void 0,
      loop: void 0,
      to: void 0,
      type: void 0
    });
    defaults2.describe("animation", {
      _fallback: false,
      _indexable: false,
      _scriptable: (name) => name !== "onProgress" && name !== "onComplete" && name !== "fn"
    });
    defaults2.set("animations", {
      colors: {
        type: "color",
        properties: colors
      },
      numbers: {
        type: "number",
        properties: numbers
      }
    });
    defaults2.describe("animations", {
      _fallback: "animation"
    });
    defaults2.set("transitions", {
      active: {
        animation: {
          duration: 400
        }
      },
      resize: {
        animation: {
          duration: 0
        }
      },
      show: {
        animations: {
          colors: {
            from: "transparent"
          },
          visible: {
            type: "boolean",
            duration: 0
          }
        }
      },
      hide: {
        animations: {
          colors: {
            to: "transparent"
          },
          visible: {
            type: "boolean",
            easing: "linear",
            fn: (v2) => v2 | 0
          }
        }
      }
    });
  }
  function applyLayoutsDefaults(defaults2) {
    defaults2.set("layout", {
      autoPadding: true,
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      }
    });
  }
  var intlCache = /* @__PURE__ */ new Map();
  function getNumberFormat(locale, options) {
    options = options || {};
    const cacheKey2 = locale + JSON.stringify(options);
    let formatter = intlCache.get(cacheKey2);
    if (!formatter) {
      formatter = new Intl.NumberFormat(locale, options);
      intlCache.set(cacheKey2, formatter);
    }
    return formatter;
  }
  function formatNumber(num, locale, options) {
    return getNumberFormat(locale, options).format(num);
  }
  var formatters = {
    values(value) {
      return isArray(value) ? value : "" + value;
    },
    numeric(tickValue, index3, ticks) {
      if (tickValue === 0) {
        return "0";
      }
      const locale = this.chart.options.locale;
      let notation;
      let delta = tickValue;
      if (ticks.length > 1) {
        const maxTick = Math.max(Math.abs(ticks[0].value), Math.abs(ticks[ticks.length - 1].value));
        if (maxTick < 1e-4 || maxTick > 1e15) {
          notation = "scientific";
        }
        delta = calculateDelta(tickValue, ticks);
      }
      const logDelta = log10(Math.abs(delta));
      const numDecimal = isNaN(logDelta) ? 1 : Math.max(Math.min(-1 * Math.floor(logDelta), 20), 0);
      const options = {
        notation,
        minimumFractionDigits: numDecimal,
        maximumFractionDigits: numDecimal
      };
      Object.assign(options, this.options.ticks.format);
      return formatNumber(tickValue, locale, options);
    },
    logarithmic(tickValue, index3, ticks) {
      if (tickValue === 0) {
        return "0";
      }
      const remain = ticks[index3].significand || tickValue / Math.pow(10, Math.floor(log10(tickValue)));
      if ([
        1,
        2,
        3,
        5,
        10,
        15
      ].includes(remain) || index3 > 0.8 * ticks.length) {
        return formatters.numeric.call(this, tickValue, index3, ticks);
      }
      return "";
    }
  };
  function calculateDelta(tickValue, ticks) {
    let delta = ticks.length > 3 ? ticks[2].value - ticks[1].value : ticks[1].value - ticks[0].value;
    if (Math.abs(delta) >= 1 && tickValue !== Math.floor(tickValue)) {
      delta = tickValue - Math.floor(tickValue);
    }
    return delta;
  }
  var Ticks = {
    formatters
  };
  function applyScaleDefaults(defaults2) {
    defaults2.set("scale", {
      display: true,
      offset: false,
      reverse: false,
      beginAtZero: false,
      bounds: "ticks",
      clip: true,
      grace: 0,
      grid: {
        display: true,
        lineWidth: 1,
        drawOnChartArea: true,
        drawTicks: true,
        tickLength: 8,
        tickWidth: (_ctx, options) => options.lineWidth,
        tickColor: (_ctx, options) => options.color,
        offset: false
      },
      border: {
        display: true,
        dash: [],
        dashOffset: 0,
        width: 1
      },
      title: {
        display: false,
        text: "",
        padding: {
          top: 4,
          bottom: 4
        }
      },
      ticks: {
        minRotation: 0,
        maxRotation: 50,
        mirror: false,
        textStrokeWidth: 0,
        textStrokeColor: "",
        padding: 3,
        display: true,
        autoSkip: true,
        autoSkipPadding: 3,
        labelOffset: 0,
        callback: Ticks.formatters.values,
        minor: {},
        major: {},
        align: "center",
        crossAlign: "near",
        showLabelBackdrop: false,
        backdropColor: "rgba(255, 255, 255, 0.75)",
        backdropPadding: 2
      }
    });
    defaults2.route("scale.ticks", "color", "", "color");
    defaults2.route("scale.grid", "color", "", "borderColor");
    defaults2.route("scale.border", "color", "", "borderColor");
    defaults2.route("scale.title", "color", "", "color");
    defaults2.describe("scale", {
      _fallback: false,
      _scriptable: (name) => !name.startsWith("before") && !name.startsWith("after") && name !== "callback" && name !== "parser",
      _indexable: (name) => name !== "borderDash" && name !== "tickBorderDash" && name !== "dash"
    });
    defaults2.describe("scales", {
      _fallback: "scale"
    });
    defaults2.describe("scale.ticks", {
      _scriptable: (name) => name !== "backdropPadding" && name !== "callback",
      _indexable: (name) => name !== "backdropPadding"
    });
  }
  var overrides = /* @__PURE__ */ Object.create(null);
  var descriptors = /* @__PURE__ */ Object.create(null);
  function getScope$1(node, key) {
    if (!key) {
      return node;
    }
    const keys = key.split(".");
    for (let i2 = 0, n3 = keys.length; i2 < n3; ++i2) {
      const k2 = keys[i2];
      node = node[k2] || (node[k2] = /* @__PURE__ */ Object.create(null));
    }
    return node;
  }
  function set(root, scope, values) {
    if (typeof scope === "string") {
      return merge(getScope$1(root, scope), values);
    }
    return merge(getScope$1(root, ""), scope);
  }
  var Defaults = class {
    constructor(_descriptors2, _appliers) {
      this.animation = void 0;
      this.backgroundColor = "rgba(0,0,0,0.1)";
      this.borderColor = "rgba(0,0,0,0.1)";
      this.color = "#666";
      this.datasets = {};
      this.devicePixelRatio = (context) => context.chart.platform.getDevicePixelRatio();
      this.elements = {};
      this.events = [
        "mousemove",
        "mouseout",
        "click",
        "touchstart",
        "touchmove"
      ];
      this.font = {
        family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
        size: 12,
        style: "normal",
        lineHeight: 1.2,
        weight: null
      };
      this.hover = {};
      this.hoverBackgroundColor = (ctx, options) => getHoverColor(options.backgroundColor);
      this.hoverBorderColor = (ctx, options) => getHoverColor(options.borderColor);
      this.hoverColor = (ctx, options) => getHoverColor(options.color);
      this.indexAxis = "x";
      this.interaction = {
        mode: "nearest",
        intersect: true,
        includeInvisible: false
      };
      this.maintainAspectRatio = true;
      this.onHover = null;
      this.onClick = null;
      this.parsing = true;
      this.plugins = {};
      this.responsive = true;
      this.scale = void 0;
      this.scales = {};
      this.showLine = true;
      this.drawActiveElementsOnTop = true;
      this.describe(_descriptors2);
      this.apply(_appliers);
    }
    set(scope, values) {
      return set(this, scope, values);
    }
    get(scope) {
      return getScope$1(this, scope);
    }
    describe(scope, values) {
      return set(descriptors, scope, values);
    }
    override(scope, values) {
      return set(overrides, scope, values);
    }
    route(scope, name, targetScope, targetName) {
      const scopeObject = getScope$1(this, scope);
      const targetScopeObject = getScope$1(this, targetScope);
      const privateName = "_" + name;
      Object.defineProperties(scopeObject, {
        [privateName]: {
          value: scopeObject[name],
          writable: true
        },
        [name]: {
          enumerable: true,
          get() {
            const local = this[privateName];
            const target = targetScopeObject[targetName];
            if (isObject(local)) {
              return Object.assign({}, target, local);
            }
            return valueOrDefault(local, target);
          },
          set(value) {
            this[privateName] = value;
          }
        }
      });
    }
    apply(appliers) {
      appliers.forEach((apply) => apply(this));
    }
  };
  var defaults = /* @__PURE__ */ new Defaults({
    _scriptable: (name) => !name.startsWith("on"),
    _indexable: (name) => name !== "events",
    hover: {
      _fallback: "interaction"
    },
    interaction: {
      _scriptable: false,
      _indexable: false
    }
  }, [
    applyAnimationsDefaults,
    applyLayoutsDefaults,
    applyScaleDefaults
  ]);
  function toFontString(font) {
    if (!font || isNullOrUndef(font.size) || isNullOrUndef(font.family)) {
      return null;
    }
    return (font.style ? font.style + " " : "") + (font.weight ? font.weight + " " : "") + font.size + "px " + font.family;
  }
  function _measureText(ctx, data, gc, longest, string) {
    let textWidth = data[string];
    if (!textWidth) {
      textWidth = data[string] = ctx.measureText(string).width;
      gc.push(string);
    }
    if (textWidth > longest) {
      longest = textWidth;
    }
    return longest;
  }
  function _longestText(ctx, font, arrayOfThings, cache2) {
    cache2 = cache2 || {};
    let data = cache2.data = cache2.data || {};
    let gc = cache2.garbageCollect = cache2.garbageCollect || [];
    if (cache2.font !== font) {
      data = cache2.data = {};
      gc = cache2.garbageCollect = [];
      cache2.font = font;
    }
    ctx.save();
    ctx.font = font;
    let longest = 0;
    const ilen = arrayOfThings.length;
    let i2, j2, jlen, thing, nestedThing;
    for (i2 = 0; i2 < ilen; i2++) {
      thing = arrayOfThings[i2];
      if (thing !== void 0 && thing !== null && !isArray(thing)) {
        longest = _measureText(ctx, data, gc, longest, thing);
      } else if (isArray(thing)) {
        for (j2 = 0, jlen = thing.length; j2 < jlen; j2++) {
          nestedThing = thing[j2];
          if (nestedThing !== void 0 && nestedThing !== null && !isArray(nestedThing)) {
            longest = _measureText(ctx, data, gc, longest, nestedThing);
          }
        }
      }
    }
    ctx.restore();
    const gcLen = gc.length / 2;
    if (gcLen > arrayOfThings.length) {
      for (i2 = 0; i2 < gcLen; i2++) {
        delete data[gc[i2]];
      }
      gc.splice(0, gcLen);
    }
    return longest;
  }
  function _alignPixel(chart, pixel, width) {
    const devicePixelRatio = chart.currentDevicePixelRatio;
    const halfWidth = width !== 0 ? Math.max(width / 2, 0.5) : 0;
    return Math.round((pixel - halfWidth) * devicePixelRatio) / devicePixelRatio + halfWidth;
  }
  function clearCanvas(canvas, ctx) {
    if (!ctx && !canvas) {
      return;
    }
    ctx = ctx || canvas.getContext("2d");
    ctx.save();
    ctx.resetTransform();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }
  function drawPoint(ctx, options, x2, y2) {
    drawPointLegend(ctx, options, x2, y2, null);
  }
  function drawPointLegend(ctx, options, x2, y2, w2) {
    let type, xOffset, yOffset, size, cornerRadius, width, xOffsetW, yOffsetW;
    const style = options.pointStyle;
    const rotation = options.rotation;
    const radius = options.radius;
    let rad = (rotation || 0) * RAD_PER_DEG;
    if (style && typeof style === "object") {
      type = style.toString();
      if (type === "[object HTMLImageElement]" || type === "[object HTMLCanvasElement]") {
        ctx.save();
        ctx.translate(x2, y2);
        ctx.rotate(rad);
        ctx.drawImage(style, -style.width / 2, -style.height / 2, style.width, style.height);
        ctx.restore();
        return;
      }
    }
    if (isNaN(radius) || radius <= 0) {
      return;
    }
    ctx.beginPath();
    switch (style) {
      // Default includes circle
      default:
        if (w2) {
          ctx.ellipse(x2, y2, w2 / 2, radius, 0, 0, TAU);
        } else {
          ctx.arc(x2, y2, radius, 0, TAU);
        }
        ctx.closePath();
        break;
      case "triangle":
        width = w2 ? w2 / 2 : radius;
        ctx.moveTo(x2 + Math.sin(rad) * width, y2 - Math.cos(rad) * radius);
        rad += TWO_THIRDS_PI;
        ctx.lineTo(x2 + Math.sin(rad) * width, y2 - Math.cos(rad) * radius);
        rad += TWO_THIRDS_PI;
        ctx.lineTo(x2 + Math.sin(rad) * width, y2 - Math.cos(rad) * radius);
        ctx.closePath();
        break;
      case "rectRounded":
        cornerRadius = radius * 0.516;
        size = radius - cornerRadius;
        xOffset = Math.cos(rad + QUARTER_PI) * size;
        xOffsetW = Math.cos(rad + QUARTER_PI) * (w2 ? w2 / 2 - cornerRadius : size);
        yOffset = Math.sin(rad + QUARTER_PI) * size;
        yOffsetW = Math.sin(rad + QUARTER_PI) * (w2 ? w2 / 2 - cornerRadius : size);
        ctx.arc(x2 - xOffsetW, y2 - yOffset, cornerRadius, rad - PI, rad - HALF_PI);
        ctx.arc(x2 + yOffsetW, y2 - xOffset, cornerRadius, rad - HALF_PI, rad);
        ctx.arc(x2 + xOffsetW, y2 + yOffset, cornerRadius, rad, rad + HALF_PI);
        ctx.arc(x2 - yOffsetW, y2 + xOffset, cornerRadius, rad + HALF_PI, rad + PI);
        ctx.closePath();
        break;
      case "rect":
        if (!rotation) {
          size = Math.SQRT1_2 * radius;
          width = w2 ? w2 / 2 : size;
          ctx.rect(x2 - width, y2 - size, 2 * width, 2 * size);
          break;
        }
        rad += QUARTER_PI;
      /* falls through */
      case "rectRot":
        xOffsetW = Math.cos(rad) * (w2 ? w2 / 2 : radius);
        xOffset = Math.cos(rad) * radius;
        yOffset = Math.sin(rad) * radius;
        yOffsetW = Math.sin(rad) * (w2 ? w2 / 2 : radius);
        ctx.moveTo(x2 - xOffsetW, y2 - yOffset);
        ctx.lineTo(x2 + yOffsetW, y2 - xOffset);
        ctx.lineTo(x2 + xOffsetW, y2 + yOffset);
        ctx.lineTo(x2 - yOffsetW, y2 + xOffset);
        ctx.closePath();
        break;
      case "crossRot":
        rad += QUARTER_PI;
      /* falls through */
      case "cross":
        xOffsetW = Math.cos(rad) * (w2 ? w2 / 2 : radius);
        xOffset = Math.cos(rad) * radius;
        yOffset = Math.sin(rad) * radius;
        yOffsetW = Math.sin(rad) * (w2 ? w2 / 2 : radius);
        ctx.moveTo(x2 - xOffsetW, y2 - yOffset);
        ctx.lineTo(x2 + xOffsetW, y2 + yOffset);
        ctx.moveTo(x2 + yOffsetW, y2 - xOffset);
        ctx.lineTo(x2 - yOffsetW, y2 + xOffset);
        break;
      case "star":
        xOffsetW = Math.cos(rad) * (w2 ? w2 / 2 : radius);
        xOffset = Math.cos(rad) * radius;
        yOffset = Math.sin(rad) * radius;
        yOffsetW = Math.sin(rad) * (w2 ? w2 / 2 : radius);
        ctx.moveTo(x2 - xOffsetW, y2 - yOffset);
        ctx.lineTo(x2 + xOffsetW, y2 + yOffset);
        ctx.moveTo(x2 + yOffsetW, y2 - xOffset);
        ctx.lineTo(x2 - yOffsetW, y2 + xOffset);
        rad += QUARTER_PI;
        xOffsetW = Math.cos(rad) * (w2 ? w2 / 2 : radius);
        xOffset = Math.cos(rad) * radius;
        yOffset = Math.sin(rad) * radius;
        yOffsetW = Math.sin(rad) * (w2 ? w2 / 2 : radius);
        ctx.moveTo(x2 - xOffsetW, y2 - yOffset);
        ctx.lineTo(x2 + xOffsetW, y2 + yOffset);
        ctx.moveTo(x2 + yOffsetW, y2 - xOffset);
        ctx.lineTo(x2 - yOffsetW, y2 + xOffset);
        break;
      case "line":
        xOffset = w2 ? w2 / 2 : Math.cos(rad) * radius;
        yOffset = Math.sin(rad) * radius;
        ctx.moveTo(x2 - xOffset, y2 - yOffset);
        ctx.lineTo(x2 + xOffset, y2 + yOffset);
        break;
      case "dash":
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 + Math.cos(rad) * (w2 ? w2 / 2 : radius), y2 + Math.sin(rad) * radius);
        break;
      case false:
        ctx.closePath();
        break;
    }
    ctx.fill();
    if (options.borderWidth > 0) {
      ctx.stroke();
    }
  }
  function _isPointInArea(point, area, margin) {
    margin = margin || 0.5;
    return !area || point && point.x > area.left - margin && point.x < area.right + margin && point.y > area.top - margin && point.y < area.bottom + margin;
  }
  function clipArea(ctx, area) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(area.left, area.top, area.right - area.left, area.bottom - area.top);
    ctx.clip();
  }
  function unclipArea(ctx) {
    ctx.restore();
  }
  function _steppedLineTo(ctx, previous, target, flip, mode) {
    if (!previous) {
      return ctx.lineTo(target.x, target.y);
    }
    if (mode === "middle") {
      const midpoint = (previous.x + target.x) / 2;
      ctx.lineTo(midpoint, previous.y);
      ctx.lineTo(midpoint, target.y);
    } else if (mode === "after" !== !!flip) {
      ctx.lineTo(previous.x, target.y);
    } else {
      ctx.lineTo(target.x, previous.y);
    }
    ctx.lineTo(target.x, target.y);
  }
  function _bezierCurveTo(ctx, previous, target, flip) {
    if (!previous) {
      return ctx.lineTo(target.x, target.y);
    }
    ctx.bezierCurveTo(flip ? previous.cp1x : previous.cp2x, flip ? previous.cp1y : previous.cp2y, flip ? target.cp2x : target.cp1x, flip ? target.cp2y : target.cp1y, target.x, target.y);
  }
  function setRenderOpts(ctx, opts) {
    if (opts.translation) {
      ctx.translate(opts.translation[0], opts.translation[1]);
    }
    if (!isNullOrUndef(opts.rotation)) {
      ctx.rotate(opts.rotation);
    }
    if (opts.color) {
      ctx.fillStyle = opts.color;
    }
    if (opts.textAlign) {
      ctx.textAlign = opts.textAlign;
    }
    if (opts.textBaseline) {
      ctx.textBaseline = opts.textBaseline;
    }
  }
  function decorateText(ctx, x2, y2, line, opts) {
    if (opts.strikethrough || opts.underline) {
      const metrics = ctx.measureText(line);
      const left = x2 - metrics.actualBoundingBoxLeft;
      const right = x2 + metrics.actualBoundingBoxRight;
      const top = y2 - metrics.actualBoundingBoxAscent;
      const bottom = y2 + metrics.actualBoundingBoxDescent;
      const yDecoration = opts.strikethrough ? (top + bottom) / 2 : bottom;
      ctx.strokeStyle = ctx.fillStyle;
      ctx.beginPath();
      ctx.lineWidth = opts.decorationWidth || 2;
      ctx.moveTo(left, yDecoration);
      ctx.lineTo(right, yDecoration);
      ctx.stroke();
    }
  }
  function drawBackdrop(ctx, opts) {
    const oldColor = ctx.fillStyle;
    ctx.fillStyle = opts.color;
    ctx.fillRect(opts.left, opts.top, opts.width, opts.height);
    ctx.fillStyle = oldColor;
  }
  function renderText(ctx, text, x2, y2, font, opts = {}) {
    const lines = isArray(text) ? text : [
      text
    ];
    const stroke = opts.strokeWidth > 0 && opts.strokeColor !== "";
    let i2, line;
    ctx.save();
    ctx.font = font.string;
    setRenderOpts(ctx, opts);
    for (i2 = 0; i2 < lines.length; ++i2) {
      line = lines[i2];
      if (opts.backdrop) {
        drawBackdrop(ctx, opts.backdrop);
      }
      if (stroke) {
        if (opts.strokeColor) {
          ctx.strokeStyle = opts.strokeColor;
        }
        if (!isNullOrUndef(opts.strokeWidth)) {
          ctx.lineWidth = opts.strokeWidth;
        }
        ctx.strokeText(line, x2, y2, opts.maxWidth);
      }
      ctx.fillText(line, x2, y2, opts.maxWidth);
      decorateText(ctx, x2, y2, line, opts);
      y2 += Number(font.lineHeight);
    }
    ctx.restore();
  }
  function addRoundedRectPath(ctx, rect) {
    const { x: x2, y: y2, w: w2, h: h3, radius } = rect;
    ctx.arc(x2 + radius.topLeft, y2 + radius.topLeft, radius.topLeft, 1.5 * PI, PI, true);
    ctx.lineTo(x2, y2 + h3 - radius.bottomLeft);
    ctx.arc(x2 + radius.bottomLeft, y2 + h3 - radius.bottomLeft, radius.bottomLeft, PI, HALF_PI, true);
    ctx.lineTo(x2 + w2 - radius.bottomRight, y2 + h3);
    ctx.arc(x2 + w2 - radius.bottomRight, y2 + h3 - radius.bottomRight, radius.bottomRight, HALF_PI, 0, true);
    ctx.lineTo(x2 + w2, y2 + radius.topRight);
    ctx.arc(x2 + w2 - radius.topRight, y2 + radius.topRight, radius.topRight, 0, -HALF_PI, true);
    ctx.lineTo(x2 + radius.topLeft, y2);
  }
  var LINE_HEIGHT = /^(normal|(\d+(?:\.\d+)?)(px|em|%)?)$/;
  var FONT_STYLE = /^(normal|italic|initial|inherit|unset|(oblique( -?[0-9]?[0-9]deg)?))$/;
  function toLineHeight(value, size) {
    const matches = ("" + value).match(LINE_HEIGHT);
    if (!matches || matches[1] === "normal") {
      return size * 1.2;
    }
    value = +matches[2];
    switch (matches[3]) {
      case "px":
        return value;
      case "%":
        value /= 100;
        break;
    }
    return size * value;
  }
  var numberOrZero = (v2) => +v2 || 0;
  function _readValueToProps(value, props) {
    const ret = {};
    const objProps = isObject(props);
    const keys = objProps ? Object.keys(props) : props;
    const read = isObject(value) ? objProps ? (prop) => valueOrDefault(value[prop], value[props[prop]]) : (prop) => value[prop] : () => value;
    for (const prop of keys) {
      ret[prop] = numberOrZero(read(prop));
    }
    return ret;
  }
  function toTRBL(value) {
    return _readValueToProps(value, {
      top: "y",
      right: "x",
      bottom: "y",
      left: "x"
    });
  }
  function toTRBLCorners(value) {
    return _readValueToProps(value, [
      "topLeft",
      "topRight",
      "bottomLeft",
      "bottomRight"
    ]);
  }
  function toPadding(value) {
    const obj = toTRBL(value);
    obj.width = obj.left + obj.right;
    obj.height = obj.top + obj.bottom;
    return obj;
  }
  function toFont(options, fallback) {
    options = options || {};
    fallback = fallback || defaults.font;
    let size = valueOrDefault(options.size, fallback.size);
    if (typeof size === "string") {
      size = parseInt(size, 10);
    }
    let style = valueOrDefault(options.style, fallback.style);
    if (style && !("" + style).match(FONT_STYLE)) {
      console.warn('Invalid font style specified: "' + style + '"');
      style = void 0;
    }
    const font = {
      family: valueOrDefault(options.family, fallback.family),
      lineHeight: toLineHeight(valueOrDefault(options.lineHeight, fallback.lineHeight), size),
      size,
      style,
      weight: valueOrDefault(options.weight, fallback.weight),
      string: ""
    };
    font.string = toFontString(font);
    return font;
  }
  function resolve(inputs, context, index3, info) {
    let cacheable = true;
    let i2, ilen, value;
    for (i2 = 0, ilen = inputs.length; i2 < ilen; ++i2) {
      value = inputs[i2];
      if (value === void 0) {
        continue;
      }
      if (context !== void 0 && typeof value === "function") {
        value = value(context);
        cacheable = false;
      }
      if (index3 !== void 0 && isArray(value)) {
        value = value[index3 % value.length];
        cacheable = false;
      }
      if (value !== void 0) {
        if (info && !cacheable) {
          info.cacheable = false;
        }
        return value;
      }
    }
  }
  function _addGrace(minmax, grace, beginAtZero) {
    const { min: min2, max: max2 } = minmax;
    const change = toDimension(grace, (max2 - min2) / 2);
    const keepZero = (value, add) => beginAtZero && value === 0 ? 0 : value + add;
    return {
      min: keepZero(min2, -Math.abs(change)),
      max: keepZero(max2, change)
    };
  }
  function createContext(parentContext, context) {
    return Object.assign(Object.create(parentContext), context);
  }
  function _createResolver(scopes, prefixes = [
    ""
  ], rootScopes, fallback, getTarget = () => scopes[0]) {
    const finalRootScopes = rootScopes || scopes;
    if (typeof fallback === "undefined") {
      fallback = _resolve("_fallback", scopes);
    }
    const cache2 = {
      [Symbol.toStringTag]: "Object",
      _cacheable: true,
      _scopes: scopes,
      _rootScopes: finalRootScopes,
      _fallback: fallback,
      _getTarget: getTarget,
      override: (scope) => _createResolver([
        scope,
        ...scopes
      ], prefixes, finalRootScopes, fallback)
    };
    return new Proxy(cache2, {
      /**
      * A trap for the delete operator.
      */
      deleteProperty(target, prop) {
        delete target[prop];
        delete target._keys;
        delete scopes[0][prop];
        return true;
      },
      /**
      * A trap for getting property values.
      */
      get(target, prop) {
        return _cached(target, prop, () => _resolveWithPrefixes(prop, prefixes, scopes, target));
      },
      /**
      * A trap for Object.getOwnPropertyDescriptor.
      * Also used by Object.hasOwnProperty.
      */
      getOwnPropertyDescriptor(target, prop) {
        return Reflect.getOwnPropertyDescriptor(target._scopes[0], prop);
      },
      /**
      * A trap for Object.getPrototypeOf.
      */
      getPrototypeOf() {
        return Reflect.getPrototypeOf(scopes[0]);
      },
      /**
      * A trap for the in operator.
      */
      has(target, prop) {
        return getKeysFromAllScopes(target).includes(prop);
      },
      /**
      * A trap for Object.getOwnPropertyNames and Object.getOwnPropertySymbols.
      */
      ownKeys(target) {
        return getKeysFromAllScopes(target);
      },
      /**
      * A trap for setting property values.
      */
      set(target, prop, value) {
        const storage = target._storage || (target._storage = getTarget());
        target[prop] = storage[prop] = value;
        delete target._keys;
        return true;
      }
    });
  }
  function _attachContext(proxy, context, subProxy, descriptorDefaults) {
    const cache2 = {
      _cacheable: false,
      _proxy: proxy,
      _context: context,
      _subProxy: subProxy,
      _stack: /* @__PURE__ */ new Set(),
      _descriptors: _descriptors(proxy, descriptorDefaults),
      setContext: (ctx) => _attachContext(proxy, ctx, subProxy, descriptorDefaults),
      override: (scope) => _attachContext(proxy.override(scope), context, subProxy, descriptorDefaults)
    };
    return new Proxy(cache2, {
      /**
      * A trap for the delete operator.
      */
      deleteProperty(target, prop) {
        delete target[prop];
        delete proxy[prop];
        return true;
      },
      /**
      * A trap for getting property values.
      */
      get(target, prop, receiver) {
        return _cached(target, prop, () => _resolveWithContext(target, prop, receiver));
      },
      /**
      * A trap for Object.getOwnPropertyDescriptor.
      * Also used by Object.hasOwnProperty.
      */
      getOwnPropertyDescriptor(target, prop) {
        return target._descriptors.allKeys ? Reflect.has(proxy, prop) ? {
          enumerable: true,
          configurable: true
        } : void 0 : Reflect.getOwnPropertyDescriptor(proxy, prop);
      },
      /**
      * A trap for Object.getPrototypeOf.
      */
      getPrototypeOf() {
        return Reflect.getPrototypeOf(proxy);
      },
      /**
      * A trap for the in operator.
      */
      has(target, prop) {
        return Reflect.has(proxy, prop);
      },
      /**
      * A trap for Object.getOwnPropertyNames and Object.getOwnPropertySymbols.
      */
      ownKeys() {
        return Reflect.ownKeys(proxy);
      },
      /**
      * A trap for setting property values.
      */
      set(target, prop, value) {
        proxy[prop] = value;
        delete target[prop];
        return true;
      }
    });
  }
  function _descriptors(proxy, defaults2 = {
    scriptable: true,
    indexable: true
  }) {
    const { _scriptable = defaults2.scriptable, _indexable = defaults2.indexable, _allKeys = defaults2.allKeys } = proxy;
    return {
      allKeys: _allKeys,
      scriptable: _scriptable,
      indexable: _indexable,
      isScriptable: isFunction(_scriptable) ? _scriptable : () => _scriptable,
      isIndexable: isFunction(_indexable) ? _indexable : () => _indexable
    };
  }
  var readKey = (prefix, name) => prefix ? prefix + _capitalize(name) : name;
  var needsSubResolver = (prop, value) => isObject(value) && prop !== "adapters" && (Object.getPrototypeOf(value) === null || value.constructor === Object);
  function _cached(target, prop, resolve2) {
    if (Object.prototype.hasOwnProperty.call(target, prop) || prop === "constructor") {
      return target[prop];
    }
    const value = resolve2();
    target[prop] = value;
    return value;
  }
  function _resolveWithContext(target, prop, receiver) {
    const { _proxy, _context, _subProxy, _descriptors: descriptors2 } = target;
    let value = _proxy[prop];
    if (isFunction(value) && descriptors2.isScriptable(prop)) {
      value = _resolveScriptable(prop, value, target, receiver);
    }
    if (isArray(value) && value.length) {
      value = _resolveArray(prop, value, target, descriptors2.isIndexable);
    }
    if (needsSubResolver(prop, value)) {
      value = _attachContext(value, _context, _subProxy && _subProxy[prop], descriptors2);
    }
    return value;
  }
  function _resolveScriptable(prop, getValue, target, receiver) {
    const { _proxy, _context, _subProxy, _stack } = target;
    if (_stack.has(prop)) {
      throw new Error("Recursion detected: " + Array.from(_stack).join("->") + "->" + prop);
    }
    _stack.add(prop);
    let value = getValue(_context, _subProxy || receiver);
    _stack.delete(prop);
    if (needsSubResolver(prop, value)) {
      value = createSubResolver(_proxy._scopes, _proxy, prop, value);
    }
    return value;
  }
  function _resolveArray(prop, value, target, isIndexable) {
    const { _proxy, _context, _subProxy, _descriptors: descriptors2 } = target;
    if (typeof _context.index !== "undefined" && isIndexable(prop)) {
      return value[_context.index % value.length];
    } else if (isObject(value[0])) {
      const arr = value;
      const scopes = _proxy._scopes.filter((s2) => s2 !== arr);
      value = [];
      for (const item of arr) {
        const resolver = createSubResolver(scopes, _proxy, prop, item);
        value.push(_attachContext(resolver, _context, _subProxy && _subProxy[prop], descriptors2));
      }
    }
    return value;
  }
  function resolveFallback(fallback, prop, value) {
    return isFunction(fallback) ? fallback(prop, value) : fallback;
  }
  var getScope = (key, parent) => key === true ? parent : typeof key === "string" ? resolveObjectKey(parent, key) : void 0;
  function addScopes(set2, parentScopes, key, parentFallback, value) {
    for (const parent of parentScopes) {
      const scope = getScope(key, parent);
      if (scope) {
        set2.add(scope);
        const fallback = resolveFallback(scope._fallback, key, value);
        if (typeof fallback !== "undefined" && fallback !== key && fallback !== parentFallback) {
          return fallback;
        }
      } else if (scope === false && typeof parentFallback !== "undefined" && key !== parentFallback) {
        return null;
      }
    }
    return false;
  }
  function createSubResolver(parentScopes, resolver, prop, value) {
    const rootScopes = resolver._rootScopes;
    const fallback = resolveFallback(resolver._fallback, prop, value);
    const allScopes = [
      ...parentScopes,
      ...rootScopes
    ];
    const set2 = /* @__PURE__ */ new Set();
    set2.add(value);
    let key = addScopesFromKey(set2, allScopes, prop, fallback || prop, value);
    if (key === null) {
      return false;
    }
    if (typeof fallback !== "undefined" && fallback !== prop) {
      key = addScopesFromKey(set2, allScopes, fallback, key, value);
      if (key === null) {
        return false;
      }
    }
    return _createResolver(Array.from(set2), [
      ""
    ], rootScopes, fallback, () => subGetTarget(resolver, prop, value));
  }
  function addScopesFromKey(set2, allScopes, key, fallback, item) {
    while (key) {
      key = addScopes(set2, allScopes, key, fallback, item);
    }
    return key;
  }
  function subGetTarget(resolver, prop, value) {
    const parent = resolver._getTarget();
    if (!(prop in parent)) {
      parent[prop] = {};
    }
    const target = parent[prop];
    if (isArray(target) && isObject(value)) {
      return value;
    }
    return target || {};
  }
  function _resolveWithPrefixes(prop, prefixes, scopes, proxy) {
    let value;
    for (const prefix of prefixes) {
      value = _resolve(readKey(prefix, prop), scopes);
      if (typeof value !== "undefined") {
        return needsSubResolver(prop, value) ? createSubResolver(scopes, proxy, prop, value) : value;
      }
    }
  }
  function _resolve(key, scopes) {
    for (const scope of scopes) {
      if (!scope) {
        continue;
      }
      const value = scope[key];
      if (typeof value !== "undefined") {
        return value;
      }
    }
  }
  function getKeysFromAllScopes(target) {
    let keys = target._keys;
    if (!keys) {
      keys = target._keys = resolveKeysFromAllScopes(target._scopes);
    }
    return keys;
  }
  function resolveKeysFromAllScopes(scopes) {
    const set2 = /* @__PURE__ */ new Set();
    for (const scope of scopes) {
      for (const key of Object.keys(scope).filter((k2) => !k2.startsWith("_"))) {
        set2.add(key);
      }
    }
    return Array.from(set2);
  }
  function _parseObjectDataRadialScale(meta, data, start, count) {
    const { iScale } = meta;
    const { key = "r" } = this._parsing;
    const parsed = new Array(count);
    let i2, ilen, index3, item;
    for (i2 = 0, ilen = count; i2 < ilen; ++i2) {
      index3 = i2 + start;
      item = data[index3];
      parsed[i2] = {
        r: iScale.parse(resolveObjectKey(item, key), index3)
      };
    }
    return parsed;
  }
  var EPSILON = Number.EPSILON || 1e-14;
  var getPoint = (points, i2) => i2 < points.length && !points[i2].skip && points[i2];
  var getValueAxis = (indexAxis) => indexAxis === "x" ? "y" : "x";
  function splineCurve(firstPoint, middlePoint, afterPoint, t3) {
    const previous = firstPoint.skip ? middlePoint : firstPoint;
    const current = middlePoint;
    const next = afterPoint.skip ? middlePoint : afterPoint;
    const d01 = distanceBetweenPoints(current, previous);
    const d12 = distanceBetweenPoints(next, current);
    let s01 = d01 / (d01 + d12);
    let s12 = d12 / (d01 + d12);
    s01 = isNaN(s01) ? 0 : s01;
    s12 = isNaN(s12) ? 0 : s12;
    const fa = t3 * s01;
    const fb = t3 * s12;
    return {
      previous: {
        x: current.x - fa * (next.x - previous.x),
        y: current.y - fa * (next.y - previous.y)
      },
      next: {
        x: current.x + fb * (next.x - previous.x),
        y: current.y + fb * (next.y - previous.y)
      }
    };
  }
  function monotoneAdjust(points, deltaK, mK) {
    const pointsLen = points.length;
    let alphaK, betaK, tauK, squaredMagnitude, pointCurrent;
    let pointAfter = getPoint(points, 0);
    for (let i2 = 0; i2 < pointsLen - 1; ++i2) {
      pointCurrent = pointAfter;
      pointAfter = getPoint(points, i2 + 1);
      if (!pointCurrent || !pointAfter) {
        continue;
      }
      if (almostEquals(deltaK[i2], 0, EPSILON)) {
        mK[i2] = mK[i2 + 1] = 0;
        continue;
      }
      alphaK = mK[i2] / deltaK[i2];
      betaK = mK[i2 + 1] / deltaK[i2];
      squaredMagnitude = Math.pow(alphaK, 2) + Math.pow(betaK, 2);
      if (squaredMagnitude <= 9) {
        continue;
      }
      tauK = 3 / Math.sqrt(squaredMagnitude);
      mK[i2] = alphaK * tauK * deltaK[i2];
      mK[i2 + 1] = betaK * tauK * deltaK[i2];
    }
  }
  function monotoneCompute(points, mK, indexAxis = "x") {
    const valueAxis = getValueAxis(indexAxis);
    const pointsLen = points.length;
    let delta, pointBefore, pointCurrent;
    let pointAfter = getPoint(points, 0);
    for (let i2 = 0; i2 < pointsLen; ++i2) {
      pointBefore = pointCurrent;
      pointCurrent = pointAfter;
      pointAfter = getPoint(points, i2 + 1);
      if (!pointCurrent) {
        continue;
      }
      const iPixel = pointCurrent[indexAxis];
      const vPixel = pointCurrent[valueAxis];
      if (pointBefore) {
        delta = (iPixel - pointBefore[indexAxis]) / 3;
        pointCurrent[`cp1${indexAxis}`] = iPixel - delta;
        pointCurrent[`cp1${valueAxis}`] = vPixel - delta * mK[i2];
      }
      if (pointAfter) {
        delta = (pointAfter[indexAxis] - iPixel) / 3;
        pointCurrent[`cp2${indexAxis}`] = iPixel + delta;
        pointCurrent[`cp2${valueAxis}`] = vPixel + delta * mK[i2];
      }
    }
  }
  function splineCurveMonotone(points, indexAxis = "x") {
    const valueAxis = getValueAxis(indexAxis);
    const pointsLen = points.length;
    const deltaK = Array(pointsLen).fill(0);
    const mK = Array(pointsLen);
    let i2, pointBefore, pointCurrent;
    let pointAfter = getPoint(points, 0);
    for (i2 = 0; i2 < pointsLen; ++i2) {
      pointBefore = pointCurrent;
      pointCurrent = pointAfter;
      pointAfter = getPoint(points, i2 + 1);
      if (!pointCurrent) {
        continue;
      }
      if (pointAfter) {
        const slopeDelta = pointAfter[indexAxis] - pointCurrent[indexAxis];
        deltaK[i2] = slopeDelta !== 0 ? (pointAfter[valueAxis] - pointCurrent[valueAxis]) / slopeDelta : 0;
      }
      mK[i2] = !pointBefore ? deltaK[i2] : !pointAfter ? deltaK[i2 - 1] : sign(deltaK[i2 - 1]) !== sign(deltaK[i2]) ? 0 : (deltaK[i2 - 1] + deltaK[i2]) / 2;
    }
    monotoneAdjust(points, deltaK, mK);
    monotoneCompute(points, mK, indexAxis);
  }
  function capControlPoint(pt, min2, max2) {
    return Math.max(Math.min(pt, max2), min2);
  }
  function capBezierPoints(points, area) {
    let i2, ilen, point, inArea, inAreaPrev;
    let inAreaNext = _isPointInArea(points[0], area);
    for (i2 = 0, ilen = points.length; i2 < ilen; ++i2) {
      inAreaPrev = inArea;
      inArea = inAreaNext;
      inAreaNext = i2 < ilen - 1 && _isPointInArea(points[i2 + 1], area);
      if (!inArea) {
        continue;
      }
      point = points[i2];
      if (inAreaPrev) {
        point.cp1x = capControlPoint(point.cp1x, area.left, area.right);
        point.cp1y = capControlPoint(point.cp1y, area.top, area.bottom);
      }
      if (inAreaNext) {
        point.cp2x = capControlPoint(point.cp2x, area.left, area.right);
        point.cp2y = capControlPoint(point.cp2y, area.top, area.bottom);
      }
    }
  }
  function _updateBezierControlPoints(points, options, area, loop, indexAxis) {
    let i2, ilen, point, controlPoints;
    if (options.spanGaps) {
      points = points.filter((pt) => !pt.skip);
    }
    if (options.cubicInterpolationMode === "monotone") {
      splineCurveMonotone(points, indexAxis);
    } else {
      let prev = loop ? points[points.length - 1] : points[0];
      for (i2 = 0, ilen = points.length; i2 < ilen; ++i2) {
        point = points[i2];
        controlPoints = splineCurve(prev, point, points[Math.min(i2 + 1, ilen - (loop ? 0 : 1)) % ilen], options.tension);
        point.cp1x = controlPoints.previous.x;
        point.cp1y = controlPoints.previous.y;
        point.cp2x = controlPoints.next.x;
        point.cp2y = controlPoints.next.y;
        prev = point;
      }
    }
    if (options.capBezierPoints) {
      capBezierPoints(points, area);
    }
  }
  function _isDomSupported() {
    return typeof window !== "undefined" && typeof document !== "undefined";
  }
  function _getParentNode(domNode) {
    let parent = domNode.parentNode;
    if (parent && parent.toString() === "[object ShadowRoot]") {
      parent = parent.host;
    }
    return parent;
  }
  function parseMaxStyle(styleValue, node, parentProperty) {
    let valueInPixels;
    if (typeof styleValue === "string") {
      valueInPixels = parseInt(styleValue, 10);
      if (styleValue.indexOf("%") !== -1) {
        valueInPixels = valueInPixels / 100 * node.parentNode[parentProperty];
      }
    } else {
      valueInPixels = styleValue;
    }
    return valueInPixels;
  }
  var getComputedStyle2 = (element) => element.ownerDocument.defaultView.getComputedStyle(element, null);
  function getStyle(el2, property) {
    return getComputedStyle2(el2).getPropertyValue(property);
  }
  var positions = [
    "top",
    "right",
    "bottom",
    "left"
  ];
  function getPositionedStyle(styles, style, suffix) {
    const result = {};
    suffix = suffix ? "-" + suffix : "";
    for (let i2 = 0; i2 < 4; i2++) {
      const pos = positions[i2];
      result[pos] = parseFloat(styles[style + "-" + pos + suffix]) || 0;
    }
    result.width = result.left + result.right;
    result.height = result.top + result.bottom;
    return result;
  }
  var useOffsetPos = (x2, y2, target) => (x2 > 0 || y2 > 0) && (!target || !target.shadowRoot);
  function getCanvasPosition(e2, canvas) {
    const touches = e2.touches;
    const source = touches && touches.length ? touches[0] : e2;
    const { offsetX, offsetY } = source;
    let box = false;
    let x2, y2;
    if (useOffsetPos(offsetX, offsetY, e2.target)) {
      x2 = offsetX;
      y2 = offsetY;
    } else {
      const rect = canvas.getBoundingClientRect();
      x2 = source.clientX - rect.left;
      y2 = source.clientY - rect.top;
      box = true;
    }
    return {
      x: x2,
      y: y2,
      box
    };
  }
  function getRelativePosition(event, chart) {
    if ("native" in event) {
      return event;
    }
    const { canvas, currentDevicePixelRatio } = chart;
    const style = getComputedStyle2(canvas);
    const borderBox = style.boxSizing === "border-box";
    const paddings = getPositionedStyle(style, "padding");
    const borders = getPositionedStyle(style, "border", "width");
    const { x: x2, y: y2, box } = getCanvasPosition(event, canvas);
    const xOffset = paddings.left + (box && borders.left);
    const yOffset = paddings.top + (box && borders.top);
    let { width, height } = chart;
    if (borderBox) {
      width -= paddings.width + borders.width;
      height -= paddings.height + borders.height;
    }
    return {
      x: Math.round((x2 - xOffset) / width * canvas.width / currentDevicePixelRatio),
      y: Math.round((y2 - yOffset) / height * canvas.height / currentDevicePixelRatio)
    };
  }
  function getContainerSize(canvas, width, height) {
    let maxWidth, maxHeight;
    if (width === void 0 || height === void 0) {
      const container = canvas && _getParentNode(canvas);
      if (!container) {
        width = canvas.clientWidth;
        height = canvas.clientHeight;
      } else {
        const rect = container.getBoundingClientRect();
        const containerStyle = getComputedStyle2(container);
        const containerBorder = getPositionedStyle(containerStyle, "border", "width");
        const containerPadding = getPositionedStyle(containerStyle, "padding");
        width = rect.width - containerPadding.width - containerBorder.width;
        height = rect.height - containerPadding.height - containerBorder.height;
        maxWidth = parseMaxStyle(containerStyle.maxWidth, container, "clientWidth");
        maxHeight = parseMaxStyle(containerStyle.maxHeight, container, "clientHeight");
      }
    }
    return {
      width,
      height,
      maxWidth: maxWidth || INFINITY,
      maxHeight: maxHeight || INFINITY
    };
  }
  var round1 = (v2) => Math.round(v2 * 10) / 10;
  function getMaximumSize(canvas, bbWidth, bbHeight, aspectRatio) {
    const style = getComputedStyle2(canvas);
    const margins = getPositionedStyle(style, "margin");
    const maxWidth = parseMaxStyle(style.maxWidth, canvas, "clientWidth") || INFINITY;
    const maxHeight = parseMaxStyle(style.maxHeight, canvas, "clientHeight") || INFINITY;
    const containerSize = getContainerSize(canvas, bbWidth, bbHeight);
    let { width, height } = containerSize;
    if (style.boxSizing === "content-box") {
      const borders = getPositionedStyle(style, "border", "width");
      const paddings = getPositionedStyle(style, "padding");
      width -= paddings.width + borders.width;
      height -= paddings.height + borders.height;
    }
    width = Math.max(0, width - margins.width);
    height = Math.max(0, aspectRatio ? width / aspectRatio : height - margins.height);
    width = round1(Math.min(width, maxWidth, containerSize.maxWidth));
    height = round1(Math.min(height, maxHeight, containerSize.maxHeight));
    if (width && !height) {
      height = round1(width / 2);
    }
    const maintainHeight = bbWidth !== void 0 || bbHeight !== void 0;
    if (maintainHeight && aspectRatio && containerSize.height && height > containerSize.height) {
      height = containerSize.height;
      width = round1(Math.floor(height * aspectRatio));
    }
    return {
      width,
      height
    };
  }
  function retinaScale(chart, forceRatio, forceStyle) {
    const pixelRatio = forceRatio || 1;
    const deviceHeight = round1(chart.height * pixelRatio);
    const deviceWidth = round1(chart.width * pixelRatio);
    chart.height = round1(chart.height);
    chart.width = round1(chart.width);
    const canvas = chart.canvas;
    if (canvas.style && (forceStyle || !canvas.style.height && !canvas.style.width)) {
      canvas.style.height = `${chart.height}px`;
      canvas.style.width = `${chart.width}px`;
    }
    if (chart.currentDevicePixelRatio !== pixelRatio || canvas.height !== deviceHeight || canvas.width !== deviceWidth) {
      chart.currentDevicePixelRatio = pixelRatio;
      canvas.height = deviceHeight;
      canvas.width = deviceWidth;
      chart.ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      return true;
    }
    return false;
  }
  var supportsEventListenerOptions = (function() {
    let passiveSupported = false;
    try {
      const options = {
        get passive() {
          passiveSupported = true;
          return false;
        }
      };
      if (_isDomSupported()) {
        window.addEventListener("test", null, options);
        window.removeEventListener("test", null, options);
      }
    } catch (e2) {
    }
    return passiveSupported;
  })();
  function readUsedSize(element, property) {
    const value = getStyle(element, property);
    const matches = value && value.match(/^(\d+)(\.\d+)?px$/);
    return matches ? +matches[1] : void 0;
  }
  function _pointInLine(p1, p2, t3, mode) {
    return {
      x: p1.x + t3 * (p2.x - p1.x),
      y: p1.y + t3 * (p2.y - p1.y)
    };
  }
  function _steppedInterpolation(p1, p2, t3, mode) {
    return {
      x: p1.x + t3 * (p2.x - p1.x),
      y: mode === "middle" ? t3 < 0.5 ? p1.y : p2.y : mode === "after" ? t3 < 1 ? p1.y : p2.y : t3 > 0 ? p2.y : p1.y
    };
  }
  function _bezierInterpolation(p1, p2, t3, mode) {
    const cp1 = {
      x: p1.cp2x,
      y: p1.cp2y
    };
    const cp2 = {
      x: p2.cp1x,
      y: p2.cp1y
    };
    const a2 = _pointInLine(p1, cp1, t3);
    const b2 = _pointInLine(cp1, cp2, t3);
    const c2 = _pointInLine(cp2, p2, t3);
    const d2 = _pointInLine(a2, b2, t3);
    const e2 = _pointInLine(b2, c2, t3);
    return _pointInLine(d2, e2, t3);
  }
  var getRightToLeftAdapter = function(rectX, width) {
    return {
      x(x2) {
        return rectX + rectX + width - x2;
      },
      setWidth(w2) {
        width = w2;
      },
      textAlign(align) {
        if (align === "center") {
          return align;
        }
        return align === "right" ? "left" : "right";
      },
      xPlus(x2, value) {
        return x2 - value;
      },
      leftForLtr(x2, itemWidth) {
        return x2 - itemWidth;
      }
    };
  };
  var getLeftToRightAdapter = function() {
    return {
      x(x2) {
        return x2;
      },
      setWidth(w2) {
      },
      textAlign(align) {
        return align;
      },
      xPlus(x2, value) {
        return x2 + value;
      },
      leftForLtr(x2, _itemWidth) {
        return x2;
      }
    };
  };
  function getRtlAdapter(rtl, rectX, width) {
    return rtl ? getRightToLeftAdapter(rectX, width) : getLeftToRightAdapter();
  }
  function overrideTextDirection(ctx, direction) {
    let style, original;
    if (direction === "ltr" || direction === "rtl") {
      style = ctx.canvas.style;
      original = [
        style.getPropertyValue("direction"),
        style.getPropertyPriority("direction")
      ];
      style.setProperty("direction", direction, "important");
      ctx.prevTextDirection = original;
    }
  }
  function restoreTextDirection(ctx, original) {
    if (original !== void 0) {
      delete ctx.prevTextDirection;
      ctx.canvas.style.setProperty("direction", original[0], original[1]);
    }
  }
  function propertyFn(property) {
    if (property === "angle") {
      return {
        between: _angleBetween,
        compare: _angleDiff,
        normalize: _normalizeAngle
      };
    }
    return {
      between: _isBetween,
      compare: (a2, b2) => a2 - b2,
      normalize: (x2) => x2
    };
  }
  function normalizeSegment({ start, end, count, loop, style }) {
    return {
      start: start % count,
      end: end % count,
      loop: loop && (end - start + 1) % count === 0,
      style
    };
  }
  function getSegment(segment, points, bounds) {
    const { property, start: startBound, end: endBound } = bounds;
    const { between, normalize } = propertyFn(property);
    const count = points.length;
    let { start, end, loop } = segment;
    let i2, ilen;
    if (loop) {
      start += count;
      end += count;
      for (i2 = 0, ilen = count; i2 < ilen; ++i2) {
        if (!between(normalize(points[start % count][property]), startBound, endBound)) {
          break;
        }
        start--;
        end--;
      }
      start %= count;
      end %= count;
    }
    if (end < start) {
      end += count;
    }
    return {
      start,
      end,
      loop,
      style: segment.style
    };
  }
  function _boundSegment(segment, points, bounds) {
    if (!bounds) {
      return [
        segment
      ];
    }
    const { property, start: startBound, end: endBound } = bounds;
    const count = points.length;
    const { compare, between, normalize } = propertyFn(property);
    const { start, end, loop, style } = getSegment(segment, points, bounds);
    const result = [];
    let inside = false;
    let subStart = null;
    let value, point, prevValue;
    const startIsBefore = () => between(startBound, prevValue, value) && compare(startBound, prevValue) !== 0;
    const endIsBefore = () => compare(endBound, value) === 0 || between(endBound, prevValue, value);
    const shouldStart = () => inside || startIsBefore();
    const shouldStop = () => !inside || endIsBefore();
    for (let i2 = start, prev = start; i2 <= end; ++i2) {
      point = points[i2 % count];
      if (point.skip) {
        continue;
      }
      value = normalize(point[property]);
      if (value === prevValue) {
        continue;
      }
      inside = between(value, startBound, endBound);
      if (subStart === null && shouldStart()) {
        subStart = compare(value, startBound) === 0 ? i2 : prev;
      }
      if (subStart !== null && shouldStop()) {
        result.push(normalizeSegment({
          start: subStart,
          end: i2,
          loop,
          count,
          style
        }));
        subStart = null;
      }
      prev = i2;
      prevValue = value;
    }
    if (subStart !== null) {
      result.push(normalizeSegment({
        start: subStart,
        end,
        loop,
        count,
        style
      }));
    }
    return result;
  }
  function _boundSegments(line, bounds) {
    const result = [];
    const segments = line.segments;
    for (let i2 = 0; i2 < segments.length; i2++) {
      const sub = _boundSegment(segments[i2], line.points, bounds);
      if (sub.length) {
        result.push(...sub);
      }
    }
    return result;
  }
  function findStartAndEnd(points, count, loop, spanGaps) {
    let start = 0;
    let end = count - 1;
    if (loop && !spanGaps) {
      while (start < count && !points[start].skip) {
        start++;
      }
    }
    while (start < count && points[start].skip) {
      start++;
    }
    start %= count;
    if (loop) {
      end += start;
    }
    while (end > start && points[end % count].skip) {
      end--;
    }
    end %= count;
    return {
      start,
      end
    };
  }
  function solidSegments(points, start, max2, loop) {
    const count = points.length;
    const result = [];
    let last = start;
    let prev = points[start];
    let end;
    for (end = start + 1; end <= max2; ++end) {
      const cur = points[end % count];
      if (cur.skip || cur.stop) {
        if (!prev.skip) {
          loop = false;
          result.push({
            start: start % count,
            end: (end - 1) % count,
            loop
          });
          start = last = cur.stop ? end : null;
        }
      } else {
        last = end;
        if (prev.skip) {
          start = end;
        }
      }
      prev = cur;
    }
    if (last !== null) {
      result.push({
        start: start % count,
        end: last % count,
        loop
      });
    }
    return result;
  }
  function _computeSegments(line, segmentOptions) {
    const points = line.points;
    const spanGaps = line.options.spanGaps;
    const count = points.length;
    if (!count) {
      return [];
    }
    const loop = !!line._loop;
    const { start, end } = findStartAndEnd(points, count, loop, spanGaps);
    if (spanGaps === true) {
      return splitByStyles(line, [
        {
          start,
          end,
          loop
        }
      ], points, segmentOptions);
    }
    const max2 = end < start ? end + count : end;
    const completeLoop = !!line._fullLoop && start === 0 && end === count - 1;
    return splitByStyles(line, solidSegments(points, start, max2, completeLoop), points, segmentOptions);
  }
  function splitByStyles(line, segments, points, segmentOptions) {
    if (!segmentOptions || !segmentOptions.setContext || !points) {
      return segments;
    }
    return doSplitByStyles(line, segments, points, segmentOptions);
  }
  function doSplitByStyles(line, segments, points, segmentOptions) {
    const chartContext = line._chart.getContext();
    const baseStyle = readStyle(line.options);
    const { _datasetIndex: datasetIndex, options: { spanGaps } } = line;
    const count = points.length;
    const result = [];
    let prevStyle = baseStyle;
    let start = segments[0].start;
    let i2 = start;
    function addStyle(s2, e2, l2, st) {
      const dir = spanGaps ? -1 : 1;
      if (s2 === e2) {
        return;
      }
      s2 += count;
      while (points[s2 % count].skip) {
        s2 -= dir;
      }
      while (points[e2 % count].skip) {
        e2 += dir;
      }
      if (s2 % count !== e2 % count) {
        result.push({
          start: s2 % count,
          end: e2 % count,
          loop: l2,
          style: st
        });
        prevStyle = st;
        start = e2 % count;
      }
    }
    for (const segment of segments) {
      start = spanGaps ? start : segment.start;
      let prev = points[start % count];
      let style;
      for (i2 = start + 1; i2 <= segment.end; i2++) {
        const pt = points[i2 % count];
        style = readStyle(segmentOptions.setContext(createContext(chartContext, {
          type: "segment",
          p0: prev,
          p1: pt,
          p0DataIndex: (i2 - 1) % count,
          p1DataIndex: i2 % count,
          datasetIndex
        })));
        if (styleChanged(style, prevStyle)) {
          addStyle(start, i2 - 1, segment.loop, prevStyle);
        }
        prev = pt;
        prevStyle = style;
      }
      if (start < i2 - 1) {
        addStyle(start, i2 - 1, segment.loop, prevStyle);
      }
    }
    return result;
  }
  function readStyle(options) {
    return {
      backgroundColor: options.backgroundColor,
      borderCapStyle: options.borderCapStyle,
      borderDash: options.borderDash,
      borderDashOffset: options.borderDashOffset,
      borderJoinStyle: options.borderJoinStyle,
      borderWidth: options.borderWidth,
      borderColor: options.borderColor
    };
  }
  function styleChanged(style, prevStyle) {
    if (!prevStyle) {
      return false;
    }
    const cache2 = [];
    const replacer = function(key, value) {
      if (!isPatternOrGradient(value)) {
        return value;
      }
      if (!cache2.includes(value)) {
        cache2.push(value);
      }
      return cache2.indexOf(value);
    };
    return JSON.stringify(style, replacer) !== JSON.stringify(prevStyle, replacer);
  }
  function getSizeForArea(scale, chartArea, field) {
    return scale.options.clip ? scale[field] : chartArea[field];
  }
  function getDatasetArea(meta, chartArea) {
    const { xScale, yScale } = meta;
    if (xScale && yScale) {
      return {
        left: getSizeForArea(xScale, chartArea, "left"),
        right: getSizeForArea(xScale, chartArea, "right"),
        top: getSizeForArea(yScale, chartArea, "top"),
        bottom: getSizeForArea(yScale, chartArea, "bottom")
      };
    }
    return chartArea;
  }
  function getDatasetClipArea(chart, meta) {
    const clip = meta._clip;
    if (clip.disabled) {
      return false;
    }
    const area = getDatasetArea(meta, chart.chartArea);
    return {
      left: clip.left === false ? 0 : area.left - (clip.left === true ? 0 : clip.left),
      right: clip.right === false ? chart.width : area.right + (clip.right === true ? 0 : clip.right),
      top: clip.top === false ? 0 : area.top - (clip.top === true ? 0 : clip.top),
      bottom: clip.bottom === false ? chart.height : area.bottom + (clip.bottom === true ? 0 : clip.bottom)
    };
  }

  // node_modules/chart.js/dist/chart.js
  var Animator = class {
    constructor() {
      this._request = null;
      this._charts = /* @__PURE__ */ new Map();
      this._running = false;
      this._lastDate = void 0;
    }
    _notify(chart, anims, date, type) {
      const callbacks = anims.listeners[type];
      const numSteps = anims.duration;
      callbacks.forEach((fn) => fn({
        chart,
        initial: anims.initial,
        numSteps,
        currentStep: Math.min(date - anims.start, numSteps)
      }));
    }
    _refresh() {
      if (this._request) {
        return;
      }
      this._running = true;
      this._request = requestAnimFrame.call(window, () => {
        this._update();
        this._request = null;
        if (this._running) {
          this._refresh();
        }
      });
    }
    _update(date = Date.now()) {
      let remaining = 0;
      this._charts.forEach((anims, chart) => {
        if (!anims.running || !anims.items.length) {
          return;
        }
        const items = anims.items;
        let i2 = items.length - 1;
        let draw2 = false;
        let item;
        for (; i2 >= 0; --i2) {
          item = items[i2];
          if (item._active) {
            if (item._total > anims.duration) {
              anims.duration = item._total;
            }
            item.tick(date);
            draw2 = true;
          } else {
            items[i2] = items[items.length - 1];
            items.pop();
          }
        }
        if (draw2) {
          chart.draw();
          this._notify(chart, anims, date, "progress");
        }
        if (!items.length) {
          anims.running = false;
          this._notify(chart, anims, date, "complete");
          anims.initial = false;
        }
        remaining += items.length;
      });
      this._lastDate = date;
      if (remaining === 0) {
        this._running = false;
      }
    }
    _getAnims(chart) {
      const charts2 = this._charts;
      let anims = charts2.get(chart);
      if (!anims) {
        anims = {
          running: false,
          initial: true,
          items: [],
          listeners: {
            complete: [],
            progress: []
          }
        };
        charts2.set(chart, anims);
      }
      return anims;
    }
    listen(chart, event, cb) {
      this._getAnims(chart).listeners[event].push(cb);
    }
    add(chart, items) {
      if (!items || !items.length) {
        return;
      }
      this._getAnims(chart).items.push(...items);
    }
    has(chart) {
      return this._getAnims(chart).items.length > 0;
    }
    start(chart) {
      const anims = this._charts.get(chart);
      if (!anims) {
        return;
      }
      anims.running = true;
      anims.start = Date.now();
      anims.duration = anims.items.reduce((acc, cur) => Math.max(acc, cur._duration), 0);
      this._refresh();
    }
    running(chart) {
      if (!this._running) {
        return false;
      }
      const anims = this._charts.get(chart);
      if (!anims || !anims.running || !anims.items.length) {
        return false;
      }
      return true;
    }
    stop(chart) {
      const anims = this._charts.get(chart);
      if (!anims || !anims.items.length) {
        return;
      }
      const items = anims.items;
      let i2 = items.length - 1;
      for (; i2 >= 0; --i2) {
        items[i2].cancel();
      }
      anims.items = [];
      this._notify(chart, anims, Date.now(), "complete");
    }
    remove(chart) {
      return this._charts.delete(chart);
    }
  };
  var animator = /* @__PURE__ */ new Animator();
  var transparent = "transparent";
  var interpolators = {
    boolean(from2, to2, factor) {
      return factor > 0.5 ? to2 : from2;
    },
    color(from2, to2, factor) {
      const c0 = color(from2 || transparent);
      const c1 = c0.valid && color(to2 || transparent);
      return c1 && c1.valid ? c1.mix(c0, factor).hexString() : to2;
    },
    number(from2, to2, factor) {
      return from2 + (to2 - from2) * factor;
    }
  };
  var Animation = class {
    constructor(cfg, target, prop, to2) {
      const currentValue = target[prop];
      to2 = resolve([
        cfg.to,
        to2,
        currentValue,
        cfg.from
      ]);
      const from2 = resolve([
        cfg.from,
        currentValue,
        to2
      ]);
      this._active = true;
      this._fn = cfg.fn || interpolators[cfg.type || typeof from2];
      this._easing = effects[cfg.easing] || effects.linear;
      this._start = Math.floor(Date.now() + (cfg.delay || 0));
      this._duration = this._total = Math.floor(cfg.duration);
      this._loop = !!cfg.loop;
      this._target = target;
      this._prop = prop;
      this._from = from2;
      this._to = to2;
      this._promises = void 0;
    }
    active() {
      return this._active;
    }
    update(cfg, to2, date) {
      if (this._active) {
        this._notify(false);
        const currentValue = this._target[this._prop];
        const elapsed = date - this._start;
        const remain = this._duration - elapsed;
        this._start = date;
        this._duration = Math.floor(Math.max(remain, cfg.duration));
        this._total += elapsed;
        this._loop = !!cfg.loop;
        this._to = resolve([
          cfg.to,
          to2,
          currentValue,
          cfg.from
        ]);
        this._from = resolve([
          cfg.from,
          currentValue,
          to2
        ]);
      }
    }
    cancel() {
      if (this._active) {
        this.tick(Date.now());
        this._active = false;
        this._notify(false);
      }
    }
    tick(date) {
      const elapsed = date - this._start;
      const duration = this._duration;
      const prop = this._prop;
      const from2 = this._from;
      const loop = this._loop;
      const to2 = this._to;
      let factor;
      this._active = from2 !== to2 && (loop || elapsed < duration);
      if (!this._active) {
        this._target[prop] = to2;
        this._notify(true);
        return;
      }
      if (elapsed < 0) {
        this._target[prop] = from2;
        return;
      }
      factor = elapsed / duration % 2;
      factor = loop && factor > 1 ? 2 - factor : factor;
      factor = this._easing(Math.min(1, Math.max(0, factor)));
      this._target[prop] = this._fn(from2, to2, factor);
    }
    wait() {
      const promises = this._promises || (this._promises = []);
      return new Promise((res, rej) => {
        promises.push({
          res,
          rej
        });
      });
    }
    _notify(resolved) {
      const method = resolved ? "res" : "rej";
      const promises = this._promises || [];
      for (let i2 = 0; i2 < promises.length; i2++) {
        promises[i2][method]();
      }
    }
  };
  var Animations = class {
    constructor(chart, config) {
      this._chart = chart;
      this._properties = /* @__PURE__ */ new Map();
      this.configure(config);
    }
    configure(config) {
      if (!isObject(config)) {
        return;
      }
      const animationOptions = Object.keys(defaults.animation);
      const animatedProps = this._properties;
      Object.getOwnPropertyNames(config).forEach((key) => {
        const cfg = config[key];
        if (!isObject(cfg)) {
          return;
        }
        const resolved = {};
        for (const option of animationOptions) {
          resolved[option] = cfg[option];
        }
        (isArray(cfg.properties) && cfg.properties || [
          key
        ]).forEach((prop) => {
          if (prop === key || !animatedProps.has(prop)) {
            animatedProps.set(prop, resolved);
          }
        });
      });
    }
    _animateOptions(target, values) {
      const newOptions = values.options;
      const options = resolveTargetOptions(target, newOptions);
      if (!options) {
        return [];
      }
      const animations = this._createAnimations(options, newOptions);
      if (newOptions.$shared) {
        awaitAll(target.options.$animations, newOptions).then(() => {
          target.options = newOptions;
        }, () => {
        });
      }
      return animations;
    }
    _createAnimations(target, values) {
      const animatedProps = this._properties;
      const animations = [];
      const running = target.$animations || (target.$animations = {});
      const props = Object.keys(values);
      const date = Date.now();
      let i2;
      for (i2 = props.length - 1; i2 >= 0; --i2) {
        const prop = props[i2];
        if (prop.charAt(0) === "$") {
          continue;
        }
        if (prop === "options") {
          animations.push(...this._animateOptions(target, values));
          continue;
        }
        const value = values[prop];
        let animation = running[prop];
        const cfg = animatedProps.get(prop);
        if (animation) {
          if (cfg && animation.active()) {
            animation.update(cfg, value, date);
            continue;
          } else {
            animation.cancel();
          }
        }
        if (!cfg || !cfg.duration) {
          target[prop] = value;
          continue;
        }
        running[prop] = animation = new Animation(cfg, target, prop, value);
        animations.push(animation);
      }
      return animations;
    }
    update(target, values) {
      if (this._properties.size === 0) {
        Object.assign(target, values);
        return;
      }
      const animations = this._createAnimations(target, values);
      if (animations.length) {
        animator.add(this._chart, animations);
        return true;
      }
    }
  };
  function awaitAll(animations, properties) {
    const running = [];
    const keys = Object.keys(properties);
    for (let i2 = 0; i2 < keys.length; i2++) {
      const anim = animations[keys[i2]];
      if (anim && anim.active()) {
        running.push(anim.wait());
      }
    }
    return Promise.all(running);
  }
  function resolveTargetOptions(target, newOptions) {
    if (!newOptions) {
      return;
    }
    let options = target.options;
    if (!options) {
      target.options = newOptions;
      return;
    }
    if (options.$shared) {
      target.options = options = Object.assign({}, options, {
        $shared: false,
        $animations: {}
      });
    }
    return options;
  }
  function scaleClip(scale, allowedOverflow) {
    const opts = scale && scale.options || {};
    const reverse = opts.reverse;
    const min2 = opts.min === void 0 ? allowedOverflow : 0;
    const max2 = opts.max === void 0 ? allowedOverflow : 0;
    return {
      start: reverse ? max2 : min2,
      end: reverse ? min2 : max2
    };
  }
  function defaultClip(xScale, yScale, allowedOverflow) {
    if (allowedOverflow === false) {
      return false;
    }
    const x2 = scaleClip(xScale, allowedOverflow);
    const y2 = scaleClip(yScale, allowedOverflow);
    return {
      top: y2.end,
      right: x2.end,
      bottom: y2.start,
      left: x2.start
    };
  }
  function toClip(value) {
    let t3, r2, b2, l2;
    if (isObject(value)) {
      t3 = value.top;
      r2 = value.right;
      b2 = value.bottom;
      l2 = value.left;
    } else {
      t3 = r2 = b2 = l2 = value;
    }
    return {
      top: t3,
      right: r2,
      bottom: b2,
      left: l2,
      disabled: value === false
    };
  }
  function getSortedDatasetIndices(chart, filterVisible) {
    const keys = [];
    const metasets = chart._getSortedDatasetMetas(filterVisible);
    let i2, ilen;
    for (i2 = 0, ilen = metasets.length; i2 < ilen; ++i2) {
      keys.push(metasets[i2].index);
    }
    return keys;
  }
  function applyStack(stack, value, dsIndex, options = {}) {
    const keys = stack.keys;
    const singleMode = options.mode === "single";
    let i2, ilen, datasetIndex, otherValue;
    if (value === null) {
      return;
    }
    let found = false;
    for (i2 = 0, ilen = keys.length; i2 < ilen; ++i2) {
      datasetIndex = +keys[i2];
      if (datasetIndex === dsIndex) {
        found = true;
        if (options.all) {
          continue;
        }
        break;
      }
      otherValue = stack.values[datasetIndex];
      if (isNumberFinite(otherValue) && (singleMode || value === 0 || sign(value) === sign(otherValue))) {
        value += otherValue;
      }
    }
    if (!found && !options.all) {
      return 0;
    }
    return value;
  }
  function convertObjectDataToArray(data, meta) {
    const { iScale, vScale } = meta;
    const iAxisKey = iScale.axis === "x" ? "x" : "y";
    const vAxisKey = vScale.axis === "x" ? "x" : "y";
    const keys = Object.keys(data);
    const adata = new Array(keys.length);
    let i2, ilen, key;
    for (i2 = 0, ilen = keys.length; i2 < ilen; ++i2) {
      key = keys[i2];
      adata[i2] = {
        [iAxisKey]: key,
        [vAxisKey]: data[key]
      };
    }
    return adata;
  }
  function isStacked(scale, meta) {
    const stacked = scale && scale.options.stacked;
    return stacked || stacked === void 0 && meta.stack !== void 0;
  }
  function getStackKey(indexScale, valueScale, meta) {
    return `${indexScale.id}.${valueScale.id}.${meta.stack || meta.type}`;
  }
  function getUserBounds(scale) {
    const { min: min2, max: max2, minDefined, maxDefined } = scale.getUserBounds();
    return {
      min: minDefined ? min2 : Number.NEGATIVE_INFINITY,
      max: maxDefined ? max2 : Number.POSITIVE_INFINITY
    };
  }
  function getOrCreateStack(stacks, stackKey, indexValue) {
    const subStack = stacks[stackKey] || (stacks[stackKey] = {});
    return subStack[indexValue] || (subStack[indexValue] = {});
  }
  function getLastIndexInStack(stack, vScale, positive, type) {
    for (const meta of vScale.getMatchingVisibleMetas(type).reverse()) {
      const value = stack[meta.index];
      if (positive && value > 0 || !positive && value < 0) {
        return meta.index;
      }
    }
    return null;
  }
  function updateStacks(controller, parsed) {
    const { chart, _cachedMeta: meta } = controller;
    const stacks = chart._stacks || (chart._stacks = {});
    const { iScale, vScale, index: datasetIndex } = meta;
    const iAxis = iScale.axis;
    const vAxis = vScale.axis;
    const key = getStackKey(iScale, vScale, meta);
    const ilen = parsed.length;
    let stack;
    for (let i2 = 0; i2 < ilen; ++i2) {
      const item = parsed[i2];
      const { [iAxis]: index3, [vAxis]: value } = item;
      const itemStacks = item._stacks || (item._stacks = {});
      stack = itemStacks[vAxis] = getOrCreateStack(stacks, key, index3);
      stack[datasetIndex] = value;
      stack._top = getLastIndexInStack(stack, vScale, true, meta.type);
      stack._bottom = getLastIndexInStack(stack, vScale, false, meta.type);
      const visualValues = stack._visualValues || (stack._visualValues = {});
      visualValues[datasetIndex] = value;
    }
  }
  function getFirstScaleId(chart, axis) {
    const scales = chart.scales;
    return Object.keys(scales).filter((key) => scales[key].axis === axis).shift();
  }
  function createDatasetContext(parent, index3) {
    return createContext(parent, {
      active: false,
      dataset: void 0,
      datasetIndex: index3,
      index: index3,
      mode: "default",
      type: "dataset"
    });
  }
  function createDataContext(parent, index3, element) {
    return createContext(parent, {
      active: false,
      dataIndex: index3,
      parsed: void 0,
      raw: void 0,
      element,
      index: index3,
      mode: "default",
      type: "data"
    });
  }
  function clearStacks(meta, items) {
    const datasetIndex = meta.controller.index;
    const axis = meta.vScale && meta.vScale.axis;
    if (!axis) {
      return;
    }
    items = items || meta._parsed;
    for (const parsed of items) {
      const stacks = parsed._stacks;
      if (!stacks || stacks[axis] === void 0 || stacks[axis][datasetIndex] === void 0) {
        return;
      }
      delete stacks[axis][datasetIndex];
      if (stacks[axis]._visualValues !== void 0 && stacks[axis]._visualValues[datasetIndex] !== void 0) {
        delete stacks[axis]._visualValues[datasetIndex];
      }
    }
  }
  var isDirectUpdateMode = (mode) => mode === "reset" || mode === "none";
  var cloneIfNotShared = (cached, shared) => shared ? cached : Object.assign({}, cached);
  var createStack = (canStack, meta, chart) => canStack && !meta.hidden && meta._stacked && {
    keys: getSortedDatasetIndices(chart, true),
    values: null
  };
  var DatasetController = class {
    static defaults = {};
    static datasetElementType = null;
    static dataElementType = null;
    constructor(chart, datasetIndex) {
      this.chart = chart;
      this._ctx = chart.ctx;
      this.index = datasetIndex;
      this._cachedDataOpts = {};
      this._cachedMeta = this.getMeta();
      this._type = this._cachedMeta.type;
      this.options = void 0;
      this._parsing = false;
      this._data = void 0;
      this._objectData = void 0;
      this._sharedOptions = void 0;
      this._drawStart = void 0;
      this._drawCount = void 0;
      this.enableOptionSharing = false;
      this.supportsDecimation = false;
      this.$context = void 0;
      this._syncList = [];
      this.datasetElementType = new.target.datasetElementType;
      this.dataElementType = new.target.dataElementType;
      this.initialize();
    }
    initialize() {
      const meta = this._cachedMeta;
      this.configure();
      this.linkScales();
      meta._stacked = isStacked(meta.vScale, meta);
      this.addElements();
      if (this.options.fill && !this.chart.isPluginEnabled("filler")) {
        console.warn("Tried to use the 'fill' option without the 'Filler' plugin enabled. Please import and register the 'Filler' plugin and make sure it is not disabled in the options");
      }
    }
    updateIndex(datasetIndex) {
      if (this.index !== datasetIndex) {
        clearStacks(this._cachedMeta);
      }
      this.index = datasetIndex;
    }
    linkScales() {
      const chart = this.chart;
      const meta = this._cachedMeta;
      const dataset = this.getDataset();
      const chooseId = (axis, x2, y2, r2) => axis === "x" ? x2 : axis === "r" ? r2 : y2;
      const xid = meta.xAxisID = valueOrDefault(dataset.xAxisID, getFirstScaleId(chart, "x"));
      const yid = meta.yAxisID = valueOrDefault(dataset.yAxisID, getFirstScaleId(chart, "y"));
      const rid = meta.rAxisID = valueOrDefault(dataset.rAxisID, getFirstScaleId(chart, "r"));
      const indexAxis = meta.indexAxis;
      const iid = meta.iAxisID = chooseId(indexAxis, xid, yid, rid);
      const vid = meta.vAxisID = chooseId(indexAxis, yid, xid, rid);
      meta.xScale = this.getScaleForId(xid);
      meta.yScale = this.getScaleForId(yid);
      meta.rScale = this.getScaleForId(rid);
      meta.iScale = this.getScaleForId(iid);
      meta.vScale = this.getScaleForId(vid);
    }
    getDataset() {
      return this.chart.data.datasets[this.index];
    }
    getMeta() {
      return this.chart.getDatasetMeta(this.index);
    }
    getScaleForId(scaleID) {
      return this.chart.scales[scaleID];
    }
    _getOtherScale(scale) {
      const meta = this._cachedMeta;
      return scale === meta.iScale ? meta.vScale : meta.iScale;
    }
    reset() {
      this._update("reset");
    }
    _destroy() {
      const meta = this._cachedMeta;
      if (this._data) {
        unlistenArrayEvents(this._data, this);
      }
      if (meta._stacked) {
        clearStacks(meta);
      }
    }
    _dataCheck() {
      const dataset = this.getDataset();
      const data = dataset.data || (dataset.data = []);
      const _data = this._data;
      if (isObject(data)) {
        const meta = this._cachedMeta;
        this._data = convertObjectDataToArray(data, meta);
      } else if (_data !== data) {
        if (_data) {
          unlistenArrayEvents(_data, this);
          const meta = this._cachedMeta;
          clearStacks(meta);
          meta._parsed = [];
        }
        if (data && Object.isExtensible(data)) {
          listenArrayEvents(data, this);
        }
        this._syncList = [];
        this._data = data;
      }
    }
    addElements() {
      const meta = this._cachedMeta;
      this._dataCheck();
      if (this.datasetElementType) {
        meta.dataset = new this.datasetElementType();
      }
    }
    buildOrUpdateElements(resetNewElements) {
      const meta = this._cachedMeta;
      const dataset = this.getDataset();
      let stackChanged = false;
      this._dataCheck();
      const oldStacked = meta._stacked;
      meta._stacked = isStacked(meta.vScale, meta);
      if (meta.stack !== dataset.stack) {
        stackChanged = true;
        clearStacks(meta);
        meta.stack = dataset.stack;
      }
      this._resyncElements(resetNewElements);
      if (stackChanged || oldStacked !== meta._stacked) {
        updateStacks(this, meta._parsed);
        meta._stacked = isStacked(meta.vScale, meta);
      }
    }
    configure() {
      const config = this.chart.config;
      const scopeKeys = config.datasetScopeKeys(this._type);
      const scopes = config.getOptionScopes(this.getDataset(), scopeKeys, true);
      this.options = config.createResolver(scopes, this.getContext());
      this._parsing = this.options.parsing;
      this._cachedDataOpts = {};
    }
    parse(start, count) {
      const { _cachedMeta: meta, _data: data } = this;
      const { iScale, _stacked } = meta;
      const iAxis = iScale.axis;
      let sorted = start === 0 && count === data.length ? true : meta._sorted;
      let prev = start > 0 && meta._parsed[start - 1];
      let i2, cur, parsed;
      if (this._parsing === false) {
        meta._parsed = data;
        meta._sorted = true;
        parsed = data;
      } else {
        if (isArray(data[start])) {
          parsed = this.parseArrayData(meta, data, start, count);
        } else if (isObject(data[start])) {
          parsed = this.parseObjectData(meta, data, start, count);
        } else {
          parsed = this.parsePrimitiveData(meta, data, start, count);
        }
        const isNotInOrderComparedToPrev = () => cur[iAxis] === null || prev && cur[iAxis] < prev[iAxis];
        for (i2 = 0; i2 < count; ++i2) {
          meta._parsed[i2 + start] = cur = parsed[i2];
          if (sorted) {
            if (isNotInOrderComparedToPrev()) {
              sorted = false;
            }
            prev = cur;
          }
        }
        meta._sorted = sorted;
      }
      if (_stacked) {
        updateStacks(this, parsed);
      }
    }
    parsePrimitiveData(meta, data, start, count) {
      const { iScale, vScale } = meta;
      const iAxis = iScale.axis;
      const vAxis = vScale.axis;
      const labels = iScale.getLabels();
      const singleScale = iScale === vScale;
      const parsed = new Array(count);
      let i2, ilen, index3;
      for (i2 = 0, ilen = count; i2 < ilen; ++i2) {
        index3 = i2 + start;
        parsed[i2] = {
          [iAxis]: singleScale || iScale.parse(labels[index3], index3),
          [vAxis]: vScale.parse(data[index3], index3)
        };
      }
      return parsed;
    }
    parseArrayData(meta, data, start, count) {
      const { xScale, yScale } = meta;
      const parsed = new Array(count);
      let i2, ilen, index3, item;
      for (i2 = 0, ilen = count; i2 < ilen; ++i2) {
        index3 = i2 + start;
        item = data[index3];
        parsed[i2] = {
          x: xScale.parse(item[0], index3),
          y: yScale.parse(item[1], index3)
        };
      }
      return parsed;
    }
    parseObjectData(meta, data, start, count) {
      const { xScale, yScale } = meta;
      const { xAxisKey = "x", yAxisKey = "y" } = this._parsing;
      const parsed = new Array(count);
      let i2, ilen, index3, item;
      for (i2 = 0, ilen = count; i2 < ilen; ++i2) {
        index3 = i2 + start;
        item = data[index3];
        parsed[i2] = {
          x: xScale.parse(resolveObjectKey(item, xAxisKey), index3),
          y: yScale.parse(resolveObjectKey(item, yAxisKey), index3)
        };
      }
      return parsed;
    }
    getParsed(index3) {
      return this._cachedMeta._parsed[index3];
    }
    getDataElement(index3) {
      return this._cachedMeta.data[index3];
    }
    applyStack(scale, parsed, mode) {
      const chart = this.chart;
      const meta = this._cachedMeta;
      const value = parsed[scale.axis];
      const stack = {
        keys: getSortedDatasetIndices(chart, true),
        values: parsed._stacks[scale.axis]._visualValues
      };
      return applyStack(stack, value, meta.index, {
        mode
      });
    }
    updateRangeFromParsed(range, scale, parsed, stack) {
      const parsedValue = parsed[scale.axis];
      let value = parsedValue === null ? NaN : parsedValue;
      const values = stack && parsed._stacks[scale.axis];
      if (stack && values) {
        stack.values = values;
        value = applyStack(stack, parsedValue, this._cachedMeta.index);
      }
      range.min = Math.min(range.min, value);
      range.max = Math.max(range.max, value);
    }
    getMinMax(scale, canStack) {
      const meta = this._cachedMeta;
      const _parsed = meta._parsed;
      const sorted = meta._sorted && scale === meta.iScale;
      const ilen = _parsed.length;
      const otherScale = this._getOtherScale(scale);
      const stack = createStack(canStack, meta, this.chart);
      const range = {
        min: Number.POSITIVE_INFINITY,
        max: Number.NEGATIVE_INFINITY
      };
      const { min: otherMin, max: otherMax } = getUserBounds(otherScale);
      let i2, parsed;
      function _skip() {
        parsed = _parsed[i2];
        const otherValue = parsed[otherScale.axis];
        return !isNumberFinite(parsed[scale.axis]) || otherMin > otherValue || otherMax < otherValue;
      }
      for (i2 = 0; i2 < ilen; ++i2) {
        if (_skip()) {
          continue;
        }
        this.updateRangeFromParsed(range, scale, parsed, stack);
        if (sorted) {
          break;
        }
      }
      if (sorted) {
        for (i2 = ilen - 1; i2 >= 0; --i2) {
          if (_skip()) {
            continue;
          }
          this.updateRangeFromParsed(range, scale, parsed, stack);
          break;
        }
      }
      return range;
    }
    getAllParsedValues(scale) {
      const parsed = this._cachedMeta._parsed;
      const values = [];
      let i2, ilen, value;
      for (i2 = 0, ilen = parsed.length; i2 < ilen; ++i2) {
        value = parsed[i2][scale.axis];
        if (isNumberFinite(value)) {
          values.push(value);
        }
      }
      return values;
    }
    getMaxOverflow() {
      return false;
    }
    getLabelAndValue(index3) {
      const meta = this._cachedMeta;
      const iScale = meta.iScale;
      const vScale = meta.vScale;
      const parsed = this.getParsed(index3);
      return {
        label: iScale ? "" + iScale.getLabelForValue(parsed[iScale.axis]) : "",
        value: vScale ? "" + vScale.getLabelForValue(parsed[vScale.axis]) : ""
      };
    }
    _update(mode) {
      const meta = this._cachedMeta;
      this.update(mode || "default");
      meta._clip = toClip(valueOrDefault(this.options.clip, defaultClip(meta.xScale, meta.yScale, this.getMaxOverflow())));
    }
    update(mode) {
    }
    draw() {
      const ctx = this._ctx;
      const chart = this.chart;
      const meta = this._cachedMeta;
      const elements = meta.data || [];
      const area = chart.chartArea;
      const active = [];
      const start = this._drawStart || 0;
      const count = this._drawCount || elements.length - start;
      const drawActiveElementsOnTop = this.options.drawActiveElementsOnTop;
      let i2;
      if (meta.dataset) {
        meta.dataset.draw(ctx, area, start, count);
      }
      for (i2 = start; i2 < start + count; ++i2) {
        const element = elements[i2];
        if (element.hidden) {
          continue;
        }
        if (element.active && drawActiveElementsOnTop) {
          active.push(element);
        } else {
          element.draw(ctx, area);
        }
      }
      for (i2 = 0; i2 < active.length; ++i2) {
        active[i2].draw(ctx, area);
      }
    }
    getStyle(index3, active) {
      const mode = active ? "active" : "default";
      return index3 === void 0 && this._cachedMeta.dataset ? this.resolveDatasetElementOptions(mode) : this.resolveDataElementOptions(index3 || 0, mode);
    }
    getContext(index3, active, mode) {
      const dataset = this.getDataset();
      let context;
      if (index3 >= 0 && index3 < this._cachedMeta.data.length) {
        const element = this._cachedMeta.data[index3];
        context = element.$context || (element.$context = createDataContext(this.getContext(), index3, element));
        context.parsed = this.getParsed(index3);
        context.raw = dataset.data[index3];
        context.index = context.dataIndex = index3;
      } else {
        context = this.$context || (this.$context = createDatasetContext(this.chart.getContext(), this.index));
        context.dataset = dataset;
        context.index = context.datasetIndex = this.index;
      }
      context.active = !!active;
      context.mode = mode;
      return context;
    }
    resolveDatasetElementOptions(mode) {
      return this._resolveElementOptions(this.datasetElementType.id, mode);
    }
    resolveDataElementOptions(index3, mode) {
      return this._resolveElementOptions(this.dataElementType.id, mode, index3);
    }
    _resolveElementOptions(elementType, mode = "default", index3) {
      const active = mode === "active";
      const cache2 = this._cachedDataOpts;
      const cacheKey2 = elementType + "-" + mode;
      const cached = cache2[cacheKey2];
      const sharing = this.enableOptionSharing && defined(index3);
      if (cached) {
        return cloneIfNotShared(cached, sharing);
      }
      const config = this.chart.config;
      const scopeKeys = config.datasetElementScopeKeys(this._type, elementType);
      const prefixes = active ? [
        `${elementType}Hover`,
        "hover",
        elementType,
        ""
      ] : [
        elementType,
        ""
      ];
      const scopes = config.getOptionScopes(this.getDataset(), scopeKeys);
      const names2 = Object.keys(defaults.elements[elementType]);
      const context = () => this.getContext(index3, active, mode);
      const values = config.resolveNamedOptions(scopes, names2, context, prefixes);
      if (values.$shared) {
        values.$shared = sharing;
        cache2[cacheKey2] = Object.freeze(cloneIfNotShared(values, sharing));
      }
      return values;
    }
    _resolveAnimations(index3, transition, active) {
      const chart = this.chart;
      const cache2 = this._cachedDataOpts;
      const cacheKey2 = `animation-${transition}`;
      const cached = cache2[cacheKey2];
      if (cached) {
        return cached;
      }
      let options;
      if (chart.options.animation !== false) {
        const config = this.chart.config;
        const scopeKeys = config.datasetAnimationScopeKeys(this._type, transition);
        const scopes = config.getOptionScopes(this.getDataset(), scopeKeys);
        options = config.createResolver(scopes, this.getContext(index3, active, transition));
      }
      const animations = new Animations(chart, options && options.animations);
      if (options && options._cacheable) {
        cache2[cacheKey2] = Object.freeze(animations);
      }
      return animations;
    }
    getSharedOptions(options) {
      if (!options.$shared) {
        return;
      }
      return this._sharedOptions || (this._sharedOptions = Object.assign({}, options));
    }
    includeOptions(mode, sharedOptions) {
      return !sharedOptions || isDirectUpdateMode(mode) || this.chart._animationsDisabled;
    }
    _getSharedOptions(start, mode) {
      const firstOpts = this.resolveDataElementOptions(start, mode);
      const previouslySharedOptions = this._sharedOptions;
      const sharedOptions = this.getSharedOptions(firstOpts);
      const includeOptions = this.includeOptions(mode, sharedOptions) || sharedOptions !== previouslySharedOptions;
      this.updateSharedOptions(sharedOptions, mode, firstOpts);
      return {
        sharedOptions,
        includeOptions
      };
    }
    updateElement(element, index3, properties, mode) {
      if (isDirectUpdateMode(mode)) {
        Object.assign(element, properties);
      } else {
        this._resolveAnimations(index3, mode).update(element, properties);
      }
    }
    updateSharedOptions(sharedOptions, mode, newOptions) {
      if (sharedOptions && !isDirectUpdateMode(mode)) {
        this._resolveAnimations(void 0, mode).update(sharedOptions, newOptions);
      }
    }
    _setStyle(element, index3, mode, active) {
      element.active = active;
      const options = this.getStyle(index3, active);
      this._resolveAnimations(index3, mode, active).update(element, {
        options: !active && this.getSharedOptions(options) || options
      });
    }
    removeHoverStyle(element, datasetIndex, index3) {
      this._setStyle(element, index3, "active", false);
    }
    setHoverStyle(element, datasetIndex, index3) {
      this._setStyle(element, index3, "active", true);
    }
    _removeDatasetHoverStyle() {
      const element = this._cachedMeta.dataset;
      if (element) {
        this._setStyle(element, void 0, "active", false);
      }
    }
    _setDatasetHoverStyle() {
      const element = this._cachedMeta.dataset;
      if (element) {
        this._setStyle(element, void 0, "active", true);
      }
    }
    _resyncElements(resetNewElements) {
      const data = this._data;
      const elements = this._cachedMeta.data;
      for (const [method, arg1, arg2] of this._syncList) {
        this[method](arg1, arg2);
      }
      this._syncList = [];
      const numMeta = elements.length;
      const numData = data.length;
      const count = Math.min(numData, numMeta);
      if (count) {
        this.parse(0, count);
      }
      if (numData > numMeta) {
        this._insertElements(numMeta, numData - numMeta, resetNewElements);
      } else if (numData < numMeta) {
        this._removeElements(numData, numMeta - numData);
      }
    }
    _insertElements(start, count, resetNewElements = true) {
      const meta = this._cachedMeta;
      const data = meta.data;
      const end = start + count;
      let i2;
      const move = (arr) => {
        arr.length += count;
        for (i2 = arr.length - 1; i2 >= end; i2--) {
          arr[i2] = arr[i2 - count];
        }
      };
      move(data);
      for (i2 = start; i2 < end; ++i2) {
        data[i2] = new this.dataElementType();
      }
      if (this._parsing) {
        move(meta._parsed);
      }
      this.parse(start, count);
      if (resetNewElements) {
        this.updateElements(data, start, count, "reset");
      }
    }
    updateElements(element, start, count, mode) {
    }
    _removeElements(start, count) {
      const meta = this._cachedMeta;
      if (this._parsing) {
        const removed = meta._parsed.splice(start, count);
        if (meta._stacked) {
          clearStacks(meta, removed);
        }
      }
      meta.data.splice(start, count);
    }
    _sync(args) {
      if (this._parsing) {
        this._syncList.push(args);
      } else {
        const [method, arg1, arg2] = args;
        this[method](arg1, arg2);
      }
      this.chart._dataChanges.push([
        this.index,
        ...args
      ]);
    }
    _onDataPush() {
      const count = arguments.length;
      this._sync([
        "_insertElements",
        this.getDataset().data.length - count,
        count
      ]);
    }
    _onDataPop() {
      this._sync([
        "_removeElements",
        this._cachedMeta.data.length - 1,
        1
      ]);
    }
    _onDataShift() {
      this._sync([
        "_removeElements",
        0,
        1
      ]);
    }
    _onDataSplice(start, count) {
      if (count) {
        this._sync([
          "_removeElements",
          start,
          count
        ]);
      }
      const newCount = arguments.length - 2;
      if (newCount) {
        this._sync([
          "_insertElements",
          start,
          newCount
        ]);
      }
    }
    _onDataUnshift() {
      this._sync([
        "_insertElements",
        0,
        arguments.length
      ]);
    }
  };
  function getAllScaleValues(scale, type) {
    if (!scale._cache.$bar) {
      const visibleMetas = scale.getMatchingVisibleMetas(type);
      let values = [];
      for (let i2 = 0, ilen = visibleMetas.length; i2 < ilen; i2++) {
        values = values.concat(visibleMetas[i2].controller.getAllParsedValues(scale));
      }
      scale._cache.$bar = _arrayUnique(values.sort((a2, b2) => a2 - b2));
    }
    return scale._cache.$bar;
  }
  function computeMinSampleSize(meta) {
    const scale = meta.iScale;
    const values = getAllScaleValues(scale, meta.type);
    let min2 = scale._length;
    let i2, ilen, curr, prev;
    const updateMinAndPrev = () => {
      if (curr === 32767 || curr === -32768) {
        return;
      }
      if (defined(prev)) {
        min2 = Math.min(min2, Math.abs(curr - prev) || min2);
      }
      prev = curr;
    };
    for (i2 = 0, ilen = values.length; i2 < ilen; ++i2) {
      curr = scale.getPixelForValue(values[i2]);
      updateMinAndPrev();
    }
    prev = void 0;
    for (i2 = 0, ilen = scale.ticks.length; i2 < ilen; ++i2) {
      curr = scale.getPixelForTick(i2);
      updateMinAndPrev();
    }
    return min2;
  }
  function computeFitCategoryTraits(index3, ruler, options, stackCount) {
    const thickness = options.barThickness;
    let size, ratio;
    if (isNullOrUndef(thickness)) {
      size = ruler.min * options.categoryPercentage;
      ratio = options.barPercentage;
    } else {
      size = thickness * stackCount;
      ratio = 1;
    }
    return {
      chunk: size / stackCount,
      ratio,
      start: ruler.pixels[index3] - size / 2
    };
  }
  function computeFlexCategoryTraits(index3, ruler, options, stackCount) {
    const pixels = ruler.pixels;
    const curr = pixels[index3];
    let prev = index3 > 0 ? pixels[index3 - 1] : null;
    let next = index3 < pixels.length - 1 ? pixels[index3 + 1] : null;
    const percent = options.categoryPercentage;
    if (prev === null) {
      prev = curr - (next === null ? ruler.end - ruler.start : next - curr);
    }
    if (next === null) {
      next = curr + curr - prev;
    }
    const start = curr - (curr - Math.min(prev, next)) / 2 * percent;
    const size = Math.abs(next - prev) / 2 * percent;
    return {
      chunk: size / stackCount,
      ratio: options.barPercentage,
      start
    };
  }
  function parseFloatBar(entry, item, vScale, i2) {
    const startValue = vScale.parse(entry[0], i2);
    const endValue = vScale.parse(entry[1], i2);
    const min2 = Math.min(startValue, endValue);
    const max2 = Math.max(startValue, endValue);
    let barStart = min2;
    let barEnd = max2;
    if (Math.abs(min2) > Math.abs(max2)) {
      barStart = max2;
      barEnd = min2;
    }
    item[vScale.axis] = barEnd;
    item._custom = {
      barStart,
      barEnd,
      start: startValue,
      end: endValue,
      min: min2,
      max: max2
    };
  }
  function parseValue(entry, item, vScale, i2) {
    if (isArray(entry)) {
      parseFloatBar(entry, item, vScale, i2);
    } else {
      item[vScale.axis] = vScale.parse(entry, i2);
    }
    return item;
  }
  function parseArrayOrPrimitive(meta, data, start, count) {
    const iScale = meta.iScale;
    const vScale = meta.vScale;
    const labels = iScale.getLabels();
    const singleScale = iScale === vScale;
    const parsed = [];
    let i2, ilen, item, entry;
    for (i2 = start, ilen = start + count; i2 < ilen; ++i2) {
      entry = data[i2];
      item = {};
      item[iScale.axis] = singleScale || iScale.parse(labels[i2], i2);
      parsed.push(parseValue(entry, item, vScale, i2));
    }
    return parsed;
  }
  function isFloatBar(custom) {
    return custom && custom.barStart !== void 0 && custom.barEnd !== void 0;
  }
  function barSign(size, vScale, actualBase) {
    if (size !== 0) {
      return sign(size);
    }
    return (vScale.isHorizontal() ? 1 : -1) * (vScale.min >= actualBase ? 1 : -1);
  }
  function borderProps(properties) {
    let reverse, start, end, top, bottom;
    if (properties.horizontal) {
      reverse = properties.base > properties.x;
      start = "left";
      end = "right";
    } else {
      reverse = properties.base < properties.y;
      start = "bottom";
      end = "top";
    }
    if (reverse) {
      top = "end";
      bottom = "start";
    } else {
      top = "start";
      bottom = "end";
    }
    return {
      start,
      end,
      reverse,
      top,
      bottom
    };
  }
  function setBorderSkipped(properties, options, stack, index3) {
    let edge = options.borderSkipped;
    const res = {};
    if (!edge) {
      properties.borderSkipped = res;
      return;
    }
    if (edge === true) {
      properties.borderSkipped = {
        top: true,
        right: true,
        bottom: true,
        left: true
      };
      return;
    }
    const { start, end, reverse, top, bottom } = borderProps(properties);
    if (edge === "middle" && stack) {
      properties.enableBorderRadius = true;
      if ((stack._top || 0) === index3) {
        edge = top;
      } else if ((stack._bottom || 0) === index3) {
        edge = bottom;
      } else {
        res[parseEdge(bottom, start, end, reverse)] = true;
        edge = top;
      }
    }
    res[parseEdge(edge, start, end, reverse)] = true;
    properties.borderSkipped = res;
  }
  function parseEdge(edge, a2, b2, reverse) {
    if (reverse) {
      edge = swap(edge, a2, b2);
      edge = startEnd(edge, b2, a2);
    } else {
      edge = startEnd(edge, a2, b2);
    }
    return edge;
  }
  function swap(orig, v1, v2) {
    return orig === v1 ? v2 : orig === v2 ? v1 : orig;
  }
  function startEnd(v2, start, end) {
    return v2 === "start" ? start : v2 === "end" ? end : v2;
  }
  function setInflateAmount(properties, { inflateAmount }, ratio) {
    properties.inflateAmount = inflateAmount === "auto" ? ratio === 1 ? 0.33 : 0 : inflateAmount;
  }
  var BarController = class extends DatasetController {
    static id = "bar";
    static defaults = {
      datasetElementType: false,
      dataElementType: "bar",
      categoryPercentage: 0.8,
      barPercentage: 0.9,
      grouped: true,
      animations: {
        numbers: {
          type: "number",
          properties: [
            "x",
            "y",
            "base",
            "width",
            "height"
          ]
        }
      }
    };
    static overrides = {
      scales: {
        _index_: {
          type: "category",
          offset: true,
          grid: {
            offset: true
          }
        },
        _value_: {
          type: "linear",
          beginAtZero: true
        }
      }
    };
    parsePrimitiveData(meta, data, start, count) {
      return parseArrayOrPrimitive(meta, data, start, count);
    }
    parseArrayData(meta, data, start, count) {
      return parseArrayOrPrimitive(meta, data, start, count);
    }
    parseObjectData(meta, data, start, count) {
      const { iScale, vScale } = meta;
      const { xAxisKey = "x", yAxisKey = "y" } = this._parsing;
      const iAxisKey = iScale.axis === "x" ? xAxisKey : yAxisKey;
      const vAxisKey = vScale.axis === "x" ? xAxisKey : yAxisKey;
      const parsed = [];
      let i2, ilen, item, obj;
      for (i2 = start, ilen = start + count; i2 < ilen; ++i2) {
        obj = data[i2];
        item = {};
        item[iScale.axis] = iScale.parse(resolveObjectKey(obj, iAxisKey), i2);
        parsed.push(parseValue(resolveObjectKey(obj, vAxisKey), item, vScale, i2));
      }
      return parsed;
    }
    updateRangeFromParsed(range, scale, parsed, stack) {
      super.updateRangeFromParsed(range, scale, parsed, stack);
      const custom = parsed._custom;
      if (custom && scale === this._cachedMeta.vScale) {
        range.min = Math.min(range.min, custom.min);
        range.max = Math.max(range.max, custom.max);
      }
    }
    getMaxOverflow() {
      return 0;
    }
    getLabelAndValue(index3) {
      const meta = this._cachedMeta;
      const { iScale, vScale } = meta;
      const parsed = this.getParsed(index3);
      const custom = parsed._custom;
      const value = isFloatBar(custom) ? "[" + custom.start + ", " + custom.end + "]" : "" + vScale.getLabelForValue(parsed[vScale.axis]);
      return {
        label: "" + iScale.getLabelForValue(parsed[iScale.axis]),
        value
      };
    }
    initialize() {
      this.enableOptionSharing = true;
      super.initialize();
      const meta = this._cachedMeta;
      meta.stack = this.getDataset().stack;
    }
    update(mode) {
      const meta = this._cachedMeta;
      this.updateElements(meta.data, 0, meta.data.length, mode);
    }
    updateElements(bars, start, count, mode) {
      const reset = mode === "reset";
      const { index: index3, _cachedMeta: { vScale } } = this;
      const base = vScale.getBasePixel();
      const horizontal = vScale.isHorizontal();
      const ruler = this._getRuler();
      const { sharedOptions, includeOptions } = this._getSharedOptions(start, mode);
      for (let i2 = start; i2 < start + count; i2++) {
        const parsed = this.getParsed(i2);
        const vpixels = reset || isNullOrUndef(parsed[vScale.axis]) ? {
          base,
          head: base
        } : this._calculateBarValuePixels(i2);
        const ipixels = this._calculateBarIndexPixels(i2, ruler);
        const stack = (parsed._stacks || {})[vScale.axis];
        const properties = {
          horizontal,
          base: vpixels.base,
          enableBorderRadius: !stack || isFloatBar(parsed._custom) || index3 === stack._top || index3 === stack._bottom,
          x: horizontal ? vpixels.head : ipixels.center,
          y: horizontal ? ipixels.center : vpixels.head,
          height: horizontal ? ipixels.size : Math.abs(vpixels.size),
          width: horizontal ? Math.abs(vpixels.size) : ipixels.size
        };
        if (includeOptions) {
          properties.options = sharedOptions || this.resolveDataElementOptions(i2, bars[i2].active ? "active" : mode);
        }
        const options = properties.options || bars[i2].options;
        setBorderSkipped(properties, options, stack, index3);
        setInflateAmount(properties, options, ruler.ratio);
        this.updateElement(bars[i2], i2, properties, mode);
      }
    }
    _getStacks(last, dataIndex) {
      const { iScale } = this._cachedMeta;
      const metasets = iScale.getMatchingVisibleMetas(this._type).filter((meta) => meta.controller.options.grouped);
      const stacked = iScale.options.stacked;
      const stacks = [];
      const currentParsed = this._cachedMeta.controller.getParsed(dataIndex);
      const iScaleValue = currentParsed && currentParsed[iScale.axis];
      const skipNull = (meta) => {
        const parsed = meta._parsed.find((item) => item[iScale.axis] === iScaleValue);
        const val = parsed && parsed[meta.vScale.axis];
        if (isNullOrUndef(val) || isNaN(val)) {
          return true;
        }
      };
      for (const meta of metasets) {
        if (dataIndex !== void 0 && skipNull(meta)) {
          continue;
        }
        if (stacked === false || stacks.indexOf(meta.stack) === -1 || stacked === void 0 && meta.stack === void 0) {
          stacks.push(meta.stack);
        }
        if (meta.index === last) {
          break;
        }
      }
      if (!stacks.length) {
        stacks.push(void 0);
      }
      return stacks;
    }
    _getStackCount(index3) {
      return this._getStacks(void 0, index3).length;
    }
    _getAxisCount() {
      return this._getAxis().length;
    }
    getFirstScaleIdForIndexAxis() {
      const scales = this.chart.scales;
      const indexScaleId = this.chart.options.indexAxis;
      return Object.keys(scales).filter((key) => scales[key].axis === indexScaleId).shift();
    }
    _getAxis() {
      const axis = {};
      const firstScaleAxisId = this.getFirstScaleIdForIndexAxis();
      for (const dataset of this.chart.data.datasets) {
        axis[valueOrDefault(this.chart.options.indexAxis === "x" ? dataset.xAxisID : dataset.yAxisID, firstScaleAxisId)] = true;
      }
      return Object.keys(axis);
    }
    _getStackIndex(datasetIndex, name, dataIndex) {
      const stacks = this._getStacks(datasetIndex, dataIndex);
      const index3 = name !== void 0 ? stacks.indexOf(name) : -1;
      return index3 === -1 ? stacks.length - 1 : index3;
    }
    _getRuler() {
      const opts = this.options;
      const meta = this._cachedMeta;
      const iScale = meta.iScale;
      const pixels = [];
      let i2, ilen;
      for (i2 = 0, ilen = meta.data.length; i2 < ilen; ++i2) {
        pixels.push(iScale.getPixelForValue(this.getParsed(i2)[iScale.axis], i2));
      }
      const barThickness = opts.barThickness;
      const min2 = barThickness || computeMinSampleSize(meta);
      return {
        min: min2,
        pixels,
        start: iScale._startPixel,
        end: iScale._endPixel,
        stackCount: this._getStackCount(),
        scale: iScale,
        grouped: opts.grouped,
        ratio: barThickness ? 1 : opts.categoryPercentage * opts.barPercentage
      };
    }
    _calculateBarValuePixels(index3) {
      const { _cachedMeta: { vScale, _stacked, index: datasetIndex }, options: { base: baseValue, minBarLength } } = this;
      const actualBase = baseValue || 0;
      const parsed = this.getParsed(index3);
      const custom = parsed._custom;
      const floating = isFloatBar(custom);
      let value = parsed[vScale.axis];
      let start = 0;
      let length = _stacked ? this.applyStack(vScale, parsed, _stacked) : value;
      let head, size;
      if (length !== value) {
        start = length - value;
        length = value;
      }
      if (floating) {
        value = custom.barStart;
        length = custom.barEnd - custom.barStart;
        if (value !== 0 && sign(value) !== sign(custom.barEnd)) {
          start = 0;
        }
        start += value;
      }
      const startValue = !isNullOrUndef(baseValue) && !floating ? baseValue : start;
      let base = vScale.getPixelForValue(startValue);
      if (this.chart.getDataVisibility(index3)) {
        head = vScale.getPixelForValue(start + length);
      } else {
        head = base;
      }
      size = head - base;
      if (Math.abs(size) < minBarLength) {
        size = barSign(size, vScale, actualBase) * minBarLength;
        if (value === actualBase) {
          base -= size / 2;
        }
        const startPixel = vScale.getPixelForDecimal(0);
        const endPixel = vScale.getPixelForDecimal(1);
        const min2 = Math.min(startPixel, endPixel);
        const max2 = Math.max(startPixel, endPixel);
        base = Math.max(Math.min(base, max2), min2);
        head = base + size;
        if (_stacked && !floating) {
          parsed._stacks[vScale.axis]._visualValues[datasetIndex] = vScale.getValueForPixel(head) - vScale.getValueForPixel(base);
        }
      }
      if (base === vScale.getPixelForValue(actualBase)) {
        const halfGrid = sign(size) * vScale.getLineWidthForValue(actualBase) / 2;
        base += halfGrid;
        size -= halfGrid;
      }
      return {
        size,
        base,
        head,
        center: head + size / 2
      };
    }
    _calculateBarIndexPixels(index3, ruler) {
      const scale = ruler.scale;
      const options = this.options;
      const skipNull = options.skipNull;
      const maxBarThickness = valueOrDefault(options.maxBarThickness, Infinity);
      let center, size;
      const axisCount = this._getAxisCount();
      if (ruler.grouped) {
        const stackCount = skipNull ? this._getStackCount(index3) : ruler.stackCount;
        const range = options.barThickness === "flex" ? computeFlexCategoryTraits(index3, ruler, options, stackCount * axisCount) : computeFitCategoryTraits(index3, ruler, options, stackCount * axisCount);
        const axisID = this.chart.options.indexAxis === "x" ? this.getDataset().xAxisID : this.getDataset().yAxisID;
        const axisNumber = this._getAxis().indexOf(valueOrDefault(axisID, this.getFirstScaleIdForIndexAxis()));
        const stackIndex = this._getStackIndex(this.index, this._cachedMeta.stack, skipNull ? index3 : void 0) + axisNumber;
        center = range.start + range.chunk * stackIndex + range.chunk / 2;
        size = Math.min(maxBarThickness, range.chunk * range.ratio);
      } else {
        center = scale.getPixelForValue(this.getParsed(index3)[scale.axis], index3);
        size = Math.min(maxBarThickness, ruler.min * ruler.ratio);
      }
      return {
        base: center - size / 2,
        head: center + size / 2,
        center,
        size
      };
    }
    draw() {
      const meta = this._cachedMeta;
      const vScale = meta.vScale;
      const rects = meta.data;
      const ilen = rects.length;
      let i2 = 0;
      for (; i2 < ilen; ++i2) {
        if (this.getParsed(i2)[vScale.axis] !== null && !rects[i2].hidden) {
          rects[i2].draw(this._ctx);
        }
      }
    }
  };
  function getRatioAndOffset(rotation, circumference, cutout) {
    let ratioX = 1;
    let ratioY = 1;
    let offsetX = 0;
    let offsetY = 0;
    if (circumference < TAU) {
      const startAngle = rotation;
      const endAngle = startAngle + circumference;
      const startX = Math.cos(startAngle);
      const startY = Math.sin(startAngle);
      const endX = Math.cos(endAngle);
      const endY = Math.sin(endAngle);
      const calcMax = (angle, a2, b2) => _angleBetween(angle, startAngle, endAngle, true) ? 1 : Math.max(a2, a2 * cutout, b2, b2 * cutout);
      const calcMin = (angle, a2, b2) => _angleBetween(angle, startAngle, endAngle, true) ? -1 : Math.min(a2, a2 * cutout, b2, b2 * cutout);
      const maxX = calcMax(0, startX, endX);
      const maxY = calcMax(HALF_PI, startY, endY);
      const minX = calcMin(PI, startX, endX);
      const minY = calcMin(PI + HALF_PI, startY, endY);
      ratioX = (maxX - minX) / 2;
      ratioY = (maxY - minY) / 2;
      offsetX = -(maxX + minX) / 2;
      offsetY = -(maxY + minY) / 2;
    }
    return {
      ratioX,
      ratioY,
      offsetX,
      offsetY
    };
  }
  var DoughnutController = class extends DatasetController {
    static id = "doughnut";
    static defaults = {
      datasetElementType: false,
      dataElementType: "arc",
      animation: {
        animateRotate: true,
        animateScale: false
      },
      animations: {
        numbers: {
          type: "number",
          properties: [
            "circumference",
            "endAngle",
            "innerRadius",
            "outerRadius",
            "startAngle",
            "x",
            "y",
            "offset",
            "borderWidth",
            "spacing"
          ]
        }
      },
      cutout: "50%",
      rotation: 0,
      circumference: 360,
      radius: "100%",
      spacing: 0,
      indexAxis: "r"
    };
    static descriptors = {
      _scriptable: (name) => name !== "spacing",
      _indexable: (name) => name !== "spacing" && !name.startsWith("borderDash") && !name.startsWith("hoverBorderDash")
    };
    static overrides = {
      aspectRatio: 1,
      plugins: {
        legend: {
          labels: {
            generateLabels(chart) {
              const data = chart.data;
              const { labels: { pointStyle, textAlign, color: color2, useBorderRadius, borderRadius } } = chart.legend.options;
              if (data.labels.length && data.datasets.length) {
                return data.labels.map((label, i2) => {
                  const meta = chart.getDatasetMeta(0);
                  const style = meta.controller.getStyle(i2);
                  return {
                    text: label,
                    fillStyle: style.backgroundColor,
                    fontColor: color2,
                    hidden: !chart.getDataVisibility(i2),
                    lineDash: style.borderDash,
                    lineDashOffset: style.borderDashOffset,
                    lineJoin: style.borderJoinStyle,
                    lineWidth: style.borderWidth,
                    strokeStyle: style.borderColor,
                    textAlign,
                    pointStyle,
                    borderRadius: useBorderRadius && (borderRadius || style.borderRadius),
                    index: i2
                  };
                });
              }
              return [];
            }
          },
          onClick(e2, legendItem, legend) {
            legend.chart.toggleDataVisibility(legendItem.index);
            legend.chart.update();
          }
        }
      }
    };
    constructor(chart, datasetIndex) {
      super(chart, datasetIndex);
      this.enableOptionSharing = true;
      this.innerRadius = void 0;
      this.outerRadius = void 0;
      this.offsetX = void 0;
      this.offsetY = void 0;
    }
    linkScales() {
    }
    parse(start, count) {
      const data = this.getDataset().data;
      const meta = this._cachedMeta;
      if (this._parsing === false) {
        meta._parsed = data;
      } else {
        let getter = (i3) => +data[i3];
        if (isObject(data[start])) {
          const { key = "value" } = this._parsing;
          getter = (i3) => +resolveObjectKey(data[i3], key);
        }
        let i2, ilen;
        for (i2 = start, ilen = start + count; i2 < ilen; ++i2) {
          meta._parsed[i2] = getter(i2);
        }
      }
    }
    _getRotation() {
      return toRadians(this.options.rotation - 90);
    }
    _getCircumference() {
      return toRadians(this.options.circumference);
    }
    _getRotationExtents() {
      let min2 = TAU;
      let max2 = -TAU;
      for (let i2 = 0; i2 < this.chart.data.datasets.length; ++i2) {
        if (this.chart.isDatasetVisible(i2) && this.chart.getDatasetMeta(i2).type === this._type) {
          const controller = this.chart.getDatasetMeta(i2).controller;
          const rotation = controller._getRotation();
          const circumference = controller._getCircumference();
          min2 = Math.min(min2, rotation);
          max2 = Math.max(max2, rotation + circumference);
        }
      }
      return {
        rotation: min2,
        circumference: max2 - min2
      };
    }
    update(mode) {
      const chart = this.chart;
      const { chartArea } = chart;
      const meta = this._cachedMeta;
      const arcs = meta.data;
      const spacing = this.getMaxBorderWidth() + this.getMaxOffset(arcs) + this.options.spacing;
      const maxSize = Math.max((Math.min(chartArea.width, chartArea.height) - spacing) / 2, 0);
      const cutout = Math.min(toPercentage(this.options.cutout, maxSize), 1);
      const chartWeight = this._getRingWeight(this.index);
      const { circumference, rotation } = this._getRotationExtents();
      const { ratioX, ratioY, offsetX, offsetY } = getRatioAndOffset(rotation, circumference, cutout);
      const maxWidth = (chartArea.width - spacing) / ratioX;
      const maxHeight = (chartArea.height - spacing) / ratioY;
      const maxRadius = Math.max(Math.min(maxWidth, maxHeight) / 2, 0);
      const outerRadius = toDimension(this.options.radius, maxRadius);
      const innerRadius = Math.max(outerRadius * cutout, 0);
      const radiusLength = (outerRadius - innerRadius) / this._getVisibleDatasetWeightTotal();
      this.offsetX = offsetX * outerRadius;
      this.offsetY = offsetY * outerRadius;
      meta.total = this.calculateTotal();
      this.outerRadius = outerRadius - radiusLength * this._getRingWeightOffset(this.index);
      this.innerRadius = Math.max(this.outerRadius - radiusLength * chartWeight, 0);
      this.updateElements(arcs, 0, arcs.length, mode);
    }
    _circumference(i2, reset) {
      const opts = this.options;
      const meta = this._cachedMeta;
      const circumference = this._getCircumference();
      if (reset && opts.animation.animateRotate || !this.chart.getDataVisibility(i2) || meta._parsed[i2] === null || meta.data[i2].hidden) {
        return 0;
      }
      return this.calculateCircumference(meta._parsed[i2] * circumference / TAU);
    }
    updateElements(arcs, start, count, mode) {
      const reset = mode === "reset";
      const chart = this.chart;
      const chartArea = chart.chartArea;
      const opts = chart.options;
      const animationOpts = opts.animation;
      const centerX = (chartArea.left + chartArea.right) / 2;
      const centerY = (chartArea.top + chartArea.bottom) / 2;
      const animateScale = reset && animationOpts.animateScale;
      const innerRadius = animateScale ? 0 : this.innerRadius;
      const outerRadius = animateScale ? 0 : this.outerRadius;
      const { sharedOptions, includeOptions } = this._getSharedOptions(start, mode);
      let startAngle = this._getRotation();
      let i2;
      for (i2 = 0; i2 < start; ++i2) {
        startAngle += this._circumference(i2, reset);
      }
      for (i2 = start; i2 < start + count; ++i2) {
        const circumference = this._circumference(i2, reset);
        const arc = arcs[i2];
        const properties = {
          x: centerX + this.offsetX,
          y: centerY + this.offsetY,
          startAngle,
          endAngle: startAngle + circumference,
          circumference,
          outerRadius,
          innerRadius
        };
        if (includeOptions) {
          properties.options = sharedOptions || this.resolveDataElementOptions(i2, arc.active ? "active" : mode);
        }
        startAngle += circumference;
        this.updateElement(arc, i2, properties, mode);
      }
    }
    calculateTotal() {
      const meta = this._cachedMeta;
      const metaData = meta.data;
      let total = 0;
      let i2;
      for (i2 = 0; i2 < metaData.length; i2++) {
        const value = meta._parsed[i2];
        if (value !== null && !isNaN(value) && this.chart.getDataVisibility(i2) && !metaData[i2].hidden) {
          total += Math.abs(value);
        }
      }
      return total;
    }
    calculateCircumference(value) {
      const total = this._cachedMeta.total;
      if (total > 0 && !isNaN(value)) {
        return TAU * (Math.abs(value) / total);
      }
      return 0;
    }
    getLabelAndValue(index3) {
      const meta = this._cachedMeta;
      const chart = this.chart;
      const labels = chart.data.labels || [];
      const value = formatNumber(meta._parsed[index3], chart.options.locale);
      return {
        label: labels[index3] || "",
        value
      };
    }
    getMaxBorderWidth(arcs) {
      let max2 = 0;
      const chart = this.chart;
      let i2, ilen, meta, controller, options;
      if (!arcs) {
        for (i2 = 0, ilen = chart.data.datasets.length; i2 < ilen; ++i2) {
          if (chart.isDatasetVisible(i2)) {
            meta = chart.getDatasetMeta(i2);
            arcs = meta.data;
            controller = meta.controller;
            break;
          }
        }
      }
      if (!arcs) {
        return 0;
      }
      for (i2 = 0, ilen = arcs.length; i2 < ilen; ++i2) {
        options = controller.resolveDataElementOptions(i2);
        if (options.borderAlign !== "inner") {
          max2 = Math.max(max2, options.borderWidth || 0, options.hoverBorderWidth || 0);
        }
      }
      return max2;
    }
    getMaxOffset(arcs) {
      let max2 = 0;
      for (let i2 = 0, ilen = arcs.length; i2 < ilen; ++i2) {
        const options = this.resolveDataElementOptions(i2);
        max2 = Math.max(max2, options.offset || 0, options.hoverOffset || 0);
      }
      return max2;
    }
    _getRingWeightOffset(datasetIndex) {
      let ringWeightOffset = 0;
      for (let i2 = 0; i2 < datasetIndex; ++i2) {
        if (this.chart.isDatasetVisible(i2)) {
          ringWeightOffset += this._getRingWeight(i2);
        }
      }
      return ringWeightOffset;
    }
    _getRingWeight(datasetIndex) {
      return Math.max(valueOrDefault(this.chart.data.datasets[datasetIndex].weight, 1), 0);
    }
    _getVisibleDatasetWeightTotal() {
      return this._getRingWeightOffset(this.chart.data.datasets.length) || 1;
    }
  };
  var LineController = class extends DatasetController {
    static id = "line";
    static defaults = {
      datasetElementType: "line",
      dataElementType: "point",
      showLine: true,
      spanGaps: false
    };
    static overrides = {
      scales: {
        _index_: {
          type: "category"
        },
        _value_: {
          type: "linear"
        }
      }
    };
    initialize() {
      this.enableOptionSharing = true;
      this.supportsDecimation = true;
      super.initialize();
    }
    update(mode) {
      const meta = this._cachedMeta;
      const { dataset: line, data: points = [], _dataset } = meta;
      const animationsDisabled = this.chart._animationsDisabled;
      let { start, count } = _getStartAndCountOfVisiblePoints(meta, points, animationsDisabled);
      this._drawStart = start;
      this._drawCount = count;
      if (_scaleRangesChanged(meta)) {
        start = 0;
        count = points.length;
      }
      line._chart = this.chart;
      line._datasetIndex = this.index;
      line._decimated = !!_dataset._decimated;
      line.points = points;
      const options = this.resolveDatasetElementOptions(mode);
      if (!this.options.showLine) {
        options.borderWidth = 0;
      }
      options.segment = this.options.segment;
      this.updateElement(line, void 0, {
        animated: !animationsDisabled,
        options
      }, mode);
      this.updateElements(points, start, count, mode);
    }
    updateElements(points, start, count, mode) {
      const reset = mode === "reset";
      const { iScale, vScale, _stacked, _dataset } = this._cachedMeta;
      const { sharedOptions, includeOptions } = this._getSharedOptions(start, mode);
      const iAxis = iScale.axis;
      const vAxis = vScale.axis;
      const { spanGaps, segment } = this.options;
      const maxGapLength = isNumber(spanGaps) ? spanGaps : Number.POSITIVE_INFINITY;
      const directUpdate = this.chart._animationsDisabled || reset || mode === "none";
      const end = start + count;
      const pointsCount = points.length;
      let prevParsed = start > 0 && this.getParsed(start - 1);
      for (let i2 = 0; i2 < pointsCount; ++i2) {
        const point = points[i2];
        const properties = directUpdate ? point : {};
        if (i2 < start || i2 >= end) {
          properties.skip = true;
          continue;
        }
        const parsed = this.getParsed(i2);
        const nullData = isNullOrUndef(parsed[vAxis]);
        const iPixel = properties[iAxis] = iScale.getPixelForValue(parsed[iAxis], i2);
        const vPixel = properties[vAxis] = reset || nullData ? vScale.getBasePixel() : vScale.getPixelForValue(_stacked ? this.applyStack(vScale, parsed, _stacked) : parsed[vAxis], i2);
        properties.skip = isNaN(iPixel) || isNaN(vPixel) || nullData;
        properties.stop = i2 > 0 && Math.abs(parsed[iAxis] - prevParsed[iAxis]) > maxGapLength;
        if (segment) {
          properties.parsed = parsed;
          properties.raw = _dataset.data[i2];
        }
        if (includeOptions) {
          properties.options = sharedOptions || this.resolveDataElementOptions(i2, point.active ? "active" : mode);
        }
        if (!directUpdate) {
          this.updateElement(point, i2, properties, mode);
        }
        prevParsed = parsed;
      }
    }
    getMaxOverflow() {
      const meta = this._cachedMeta;
      const dataset = meta.dataset;
      const border = dataset.options && dataset.options.borderWidth || 0;
      const data = meta.data || [];
      if (!data.length) {
        return border;
      }
      const firstPoint = data[0].size(this.resolveDataElementOptions(0));
      const lastPoint = data[data.length - 1].size(this.resolveDataElementOptions(data.length - 1));
      return Math.max(border, firstPoint, lastPoint) / 2;
    }
    draw() {
      const meta = this._cachedMeta;
      meta.dataset.updateControlPoints(this.chart.chartArea, meta.iScale.axis);
      super.draw();
    }
  };
  var PieController = class extends DoughnutController {
    static id = "pie";
    static defaults = {
      cutout: 0,
      rotation: 0,
      circumference: 360,
      radius: "100%"
    };
  };
  var RadarController = class extends DatasetController {
    static id = "radar";
    static defaults = {
      datasetElementType: "line",
      dataElementType: "point",
      indexAxis: "r",
      showLine: true,
      elements: {
        line: {
          fill: "start"
        }
      }
    };
    static overrides = {
      aspectRatio: 1,
      scales: {
        r: {
          type: "radialLinear"
        }
      }
    };
    getLabelAndValue(index3) {
      const vScale = this._cachedMeta.vScale;
      const parsed = this.getParsed(index3);
      return {
        label: vScale.getLabels()[index3],
        value: "" + vScale.getLabelForValue(parsed[vScale.axis])
      };
    }
    parseObjectData(meta, data, start, count) {
      return _parseObjectDataRadialScale.bind(this)(meta, data, start, count);
    }
    update(mode) {
      const meta = this._cachedMeta;
      const line = meta.dataset;
      const points = meta.data || [];
      const labels = meta.iScale.getLabels();
      line.points = points;
      if (mode !== "resize") {
        const options = this.resolveDatasetElementOptions(mode);
        if (!this.options.showLine) {
          options.borderWidth = 0;
        }
        const properties = {
          _loop: true,
          _fullLoop: labels.length === points.length,
          options
        };
        this.updateElement(line, void 0, properties, mode);
      }
      this.updateElements(points, 0, points.length, mode);
    }
    updateElements(points, start, count, mode) {
      const scale = this._cachedMeta.rScale;
      const reset = mode === "reset";
      for (let i2 = start; i2 < start + count; i2++) {
        const point = points[i2];
        const options = this.resolveDataElementOptions(i2, point.active ? "active" : mode);
        const pointPosition = scale.getPointPositionForValue(i2, this.getParsed(i2).r);
        const x2 = reset ? scale.xCenter : pointPosition.x;
        const y2 = reset ? scale.yCenter : pointPosition.y;
        const properties = {
          x: x2,
          y: y2,
          angle: pointPosition.angle,
          skip: isNaN(x2) || isNaN(y2),
          options
        };
        this.updateElement(point, i2, properties, mode);
      }
    }
  };
  function abstract() {
    throw new Error("This method is not implemented: Check that a complete date adapter is provided.");
  }
  var DateAdapterBase = class _DateAdapterBase {
    /**
    * Override default date adapter methods.
    * Accepts type parameter to define options type.
    * @example
    * Chart._adapters._date.override<{myAdapterOption: string}>({
    *   init() {
    *     console.log(this.options.myAdapterOption);
    *   }
    * })
    */
    static override(members) {
      Object.assign(_DateAdapterBase.prototype, members);
    }
    options;
    constructor(options) {
      this.options = options || {};
    }
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    init() {
    }
    formats() {
      return abstract();
    }
    parse() {
      return abstract();
    }
    format() {
      return abstract();
    }
    add() {
      return abstract();
    }
    diff() {
      return abstract();
    }
    startOf() {
      return abstract();
    }
    endOf() {
      return abstract();
    }
  };
  var adapters = {
    _date: DateAdapterBase
  };
  function binarySearch(metaset, axis, value, intersect) {
    const { controller, data, _sorted } = metaset;
    const iScale = controller._cachedMeta.iScale;
    const spanGaps = metaset.dataset ? metaset.dataset.options ? metaset.dataset.options.spanGaps : null : null;
    if (iScale && axis === iScale.axis && axis !== "r" && _sorted && data.length) {
      const lookupMethod = iScale._reversePixels ? _rlookupByKey : _lookupByKey;
      if (!intersect) {
        const result = lookupMethod(data, axis, value);
        if (spanGaps) {
          const { vScale } = controller._cachedMeta;
          const { _parsed } = metaset;
          const distanceToDefinedLo = _parsed.slice(0, result.lo + 1).reverse().findIndex((point) => !isNullOrUndef(point[vScale.axis]));
          result.lo -= Math.max(0, distanceToDefinedLo);
          const distanceToDefinedHi = _parsed.slice(result.hi).findIndex((point) => !isNullOrUndef(point[vScale.axis]));
          result.hi += Math.max(0, distanceToDefinedHi);
        }
        return result;
      } else if (controller._sharedOptions) {
        const el2 = data[0];
        const range = typeof el2.getRange === "function" && el2.getRange(axis);
        if (range) {
          const start = lookupMethod(data, axis, value - range);
          const end = lookupMethod(data, axis, value + range);
          return {
            lo: start.lo,
            hi: end.hi
          };
        }
      }
    }
    return {
      lo: 0,
      hi: data.length - 1
    };
  }
  function evaluateInteractionItems(chart, axis, position, handler, intersect) {
    const metasets = chart.getSortedVisibleDatasetMetas();
    const value = position[axis];
    for (let i2 = 0, ilen = metasets.length; i2 < ilen; ++i2) {
      const { index: index3, data } = metasets[i2];
      const { lo, hi } = binarySearch(metasets[i2], axis, value, intersect);
      for (let j2 = lo; j2 <= hi; ++j2) {
        const element = data[j2];
        if (!element.skip) {
          handler(element, index3, j2);
        }
      }
    }
  }
  function getDistanceMetricForAxis(axis) {
    const useX = axis.indexOf("x") !== -1;
    const useY = axis.indexOf("y") !== -1;
    return function(pt1, pt2) {
      const deltaX = useX ? Math.abs(pt1.x - pt2.x) : 0;
      const deltaY = useY ? Math.abs(pt1.y - pt2.y) : 0;
      return Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
    };
  }
  function getIntersectItems(chart, position, axis, useFinalPosition, includeInvisible) {
    const items = [];
    if (!includeInvisible && !chart.isPointInArea(position)) {
      return items;
    }
    const evaluationFunc = function(element, datasetIndex, index3) {
      if (!includeInvisible && !_isPointInArea(element, chart.chartArea, 0)) {
        return;
      }
      if (element.inRange(position.x, position.y, useFinalPosition)) {
        items.push({
          element,
          datasetIndex,
          index: index3
        });
      }
    };
    evaluateInteractionItems(chart, axis, position, evaluationFunc, true);
    return items;
  }
  function getNearestRadialItems(chart, position, axis, useFinalPosition) {
    let items = [];
    function evaluationFunc(element, datasetIndex, index3) {
      const { startAngle, endAngle } = element.getProps([
        "startAngle",
        "endAngle"
      ], useFinalPosition);
      const { angle } = getAngleFromPoint(element, {
        x: position.x,
        y: position.y
      });
      if (_angleBetween(angle, startAngle, endAngle)) {
        items.push({
          element,
          datasetIndex,
          index: index3
        });
      }
    }
    evaluateInteractionItems(chart, axis, position, evaluationFunc);
    return items;
  }
  function getNearestCartesianItems(chart, position, axis, intersect, useFinalPosition, includeInvisible) {
    let items = [];
    const distanceMetric = getDistanceMetricForAxis(axis);
    let minDistance = Number.POSITIVE_INFINITY;
    function evaluationFunc(element, datasetIndex, index3) {
      const inRange3 = element.inRange(position.x, position.y, useFinalPosition);
      if (intersect && !inRange3) {
        return;
      }
      const center = element.getCenterPoint(useFinalPosition);
      const pointInArea = !!includeInvisible || chart.isPointInArea(center);
      if (!pointInArea && !inRange3) {
        return;
      }
      const distance = distanceMetric(position, center);
      if (distance < minDistance) {
        items = [
          {
            element,
            datasetIndex,
            index: index3
          }
        ];
        minDistance = distance;
      } else if (distance === minDistance) {
        items.push({
          element,
          datasetIndex,
          index: index3
        });
      }
    }
    evaluateInteractionItems(chart, axis, position, evaluationFunc);
    return items;
  }
  function getNearestItems(chart, position, axis, intersect, useFinalPosition, includeInvisible) {
    if (!includeInvisible && !chart.isPointInArea(position)) {
      return [];
    }
    return axis === "r" && !intersect ? getNearestRadialItems(chart, position, axis, useFinalPosition) : getNearestCartesianItems(chart, position, axis, intersect, useFinalPosition, includeInvisible);
  }
  function getAxisItems(chart, position, axis, intersect, useFinalPosition) {
    const items = [];
    const rangeMethod = axis === "x" ? "inXRange" : "inYRange";
    let intersectsItem = false;
    evaluateInteractionItems(chart, axis, position, (element, datasetIndex, index3) => {
      if (element[rangeMethod] && element[rangeMethod](position[axis], useFinalPosition)) {
        items.push({
          element,
          datasetIndex,
          index: index3
        });
        intersectsItem = intersectsItem || element.inRange(position.x, position.y, useFinalPosition);
      }
    });
    if (intersect && !intersectsItem) {
      return [];
    }
    return items;
  }
  var Interaction = {
    evaluateInteractionItems,
    modes: {
      index(chart, e2, options, useFinalPosition) {
        const position = getRelativePosition(e2, chart);
        const axis = options.axis || "x";
        const includeInvisible = options.includeInvisible || false;
        const items = options.intersect ? getIntersectItems(chart, position, axis, useFinalPosition, includeInvisible) : getNearestItems(chart, position, axis, false, useFinalPosition, includeInvisible);
        const elements = [];
        if (!items.length) {
          return [];
        }
        chart.getSortedVisibleDatasetMetas().forEach((meta) => {
          const index3 = items[0].index;
          const element = meta.data[index3];
          if (element && !element.skip) {
            elements.push({
              element,
              datasetIndex: meta.index,
              index: index3
            });
          }
        });
        return elements;
      },
      dataset(chart, e2, options, useFinalPosition) {
        const position = getRelativePosition(e2, chart);
        const axis = options.axis || "xy";
        const includeInvisible = options.includeInvisible || false;
        let items = options.intersect ? getIntersectItems(chart, position, axis, useFinalPosition, includeInvisible) : getNearestItems(chart, position, axis, false, useFinalPosition, includeInvisible);
        if (items.length > 0) {
          const datasetIndex = items[0].datasetIndex;
          const data = chart.getDatasetMeta(datasetIndex).data;
          items = [];
          for (let i2 = 0; i2 < data.length; ++i2) {
            items.push({
              element: data[i2],
              datasetIndex,
              index: i2
            });
          }
        }
        return items;
      },
      point(chart, e2, options, useFinalPosition) {
        const position = getRelativePosition(e2, chart);
        const axis = options.axis || "xy";
        const includeInvisible = options.includeInvisible || false;
        return getIntersectItems(chart, position, axis, useFinalPosition, includeInvisible);
      },
      nearest(chart, e2, options, useFinalPosition) {
        const position = getRelativePosition(e2, chart);
        const axis = options.axis || "xy";
        const includeInvisible = options.includeInvisible || false;
        return getNearestItems(chart, position, axis, options.intersect, useFinalPosition, includeInvisible);
      },
      x(chart, e2, options, useFinalPosition) {
        const position = getRelativePosition(e2, chart);
        return getAxisItems(chart, position, "x", options.intersect, useFinalPosition);
      },
      y(chart, e2, options, useFinalPosition) {
        const position = getRelativePosition(e2, chart);
        return getAxisItems(chart, position, "y", options.intersect, useFinalPosition);
      }
    }
  };
  var STATIC_POSITIONS = [
    "left",
    "top",
    "right",
    "bottom"
  ];
  function filterByPosition(array, position) {
    return array.filter((v2) => v2.pos === position);
  }
  function filterDynamicPositionByAxis(array, axis) {
    return array.filter((v2) => STATIC_POSITIONS.indexOf(v2.pos) === -1 && v2.box.axis === axis);
  }
  function sortByWeight(array, reverse) {
    return array.sort((a2, b2) => {
      const v0 = reverse ? b2 : a2;
      const v1 = reverse ? a2 : b2;
      return v0.weight === v1.weight ? v0.index - v1.index : v0.weight - v1.weight;
    });
  }
  function wrapBoxes(boxes) {
    const layoutBoxes = [];
    let i2, ilen, box, pos, stack, stackWeight;
    for (i2 = 0, ilen = (boxes || []).length; i2 < ilen; ++i2) {
      box = boxes[i2];
      ({ position: pos, options: { stack, stackWeight = 1 } } = box);
      layoutBoxes.push({
        index: i2,
        box,
        pos,
        horizontal: box.isHorizontal(),
        weight: box.weight,
        stack: stack && pos + stack,
        stackWeight
      });
    }
    return layoutBoxes;
  }
  function buildStacks(layouts2) {
    const stacks = {};
    for (const wrap of layouts2) {
      const { stack, pos, stackWeight } = wrap;
      if (!stack || !STATIC_POSITIONS.includes(pos)) {
        continue;
      }
      const _stack = stacks[stack] || (stacks[stack] = {
        count: 0,
        placed: 0,
        weight: 0,
        size: 0
      });
      _stack.count++;
      _stack.weight += stackWeight;
    }
    return stacks;
  }
  function setLayoutDims(layouts2, params) {
    const stacks = buildStacks(layouts2);
    const { vBoxMaxWidth, hBoxMaxHeight } = params;
    let i2, ilen, layout;
    for (i2 = 0, ilen = layouts2.length; i2 < ilen; ++i2) {
      layout = layouts2[i2];
      const { fullSize } = layout.box;
      const stack = stacks[layout.stack];
      const factor = stack && layout.stackWeight / stack.weight;
      if (layout.horizontal) {
        layout.width = factor ? factor * vBoxMaxWidth : fullSize && params.availableWidth;
        layout.height = hBoxMaxHeight;
      } else {
        layout.width = vBoxMaxWidth;
        layout.height = factor ? factor * hBoxMaxHeight : fullSize && params.availableHeight;
      }
    }
    return stacks;
  }
  function buildLayoutBoxes(boxes) {
    const layoutBoxes = wrapBoxes(boxes);
    const fullSize = sortByWeight(layoutBoxes.filter((wrap) => wrap.box.fullSize), true);
    const left = sortByWeight(filterByPosition(layoutBoxes, "left"), true);
    const right = sortByWeight(filterByPosition(layoutBoxes, "right"));
    const top = sortByWeight(filterByPosition(layoutBoxes, "top"), true);
    const bottom = sortByWeight(filterByPosition(layoutBoxes, "bottom"));
    const centerHorizontal = filterDynamicPositionByAxis(layoutBoxes, "x");
    const centerVertical = filterDynamicPositionByAxis(layoutBoxes, "y");
    return {
      fullSize,
      leftAndTop: left.concat(top),
      rightAndBottom: right.concat(centerVertical).concat(bottom).concat(centerHorizontal),
      chartArea: filterByPosition(layoutBoxes, "chartArea"),
      vertical: left.concat(right).concat(centerVertical),
      horizontal: top.concat(bottom).concat(centerHorizontal)
    };
  }
  function getCombinedMax(maxPadding, chartArea, a2, b2) {
    return Math.max(maxPadding[a2], chartArea[a2]) + Math.max(maxPadding[b2], chartArea[b2]);
  }
  function updateMaxPadding(maxPadding, boxPadding) {
    maxPadding.top = Math.max(maxPadding.top, boxPadding.top);
    maxPadding.left = Math.max(maxPadding.left, boxPadding.left);
    maxPadding.bottom = Math.max(maxPadding.bottom, boxPadding.bottom);
    maxPadding.right = Math.max(maxPadding.right, boxPadding.right);
  }
  function updateDims(chartArea, params, layout, stacks) {
    const { pos, box } = layout;
    const maxPadding = chartArea.maxPadding;
    if (!isObject(pos)) {
      if (layout.size) {
        chartArea[pos] -= layout.size;
      }
      const stack = stacks[layout.stack] || {
        size: 0,
        count: 1
      };
      stack.size = Math.max(stack.size, layout.horizontal ? box.height : box.width);
      layout.size = stack.size / stack.count;
      chartArea[pos] += layout.size;
    }
    if (box.getPadding) {
      updateMaxPadding(maxPadding, box.getPadding());
    }
    const newWidth = Math.max(0, params.outerWidth - getCombinedMax(maxPadding, chartArea, "left", "right"));
    const newHeight = Math.max(0, params.outerHeight - getCombinedMax(maxPadding, chartArea, "top", "bottom"));
    const widthChanged = newWidth !== chartArea.w;
    const heightChanged = newHeight !== chartArea.h;
    chartArea.w = newWidth;
    chartArea.h = newHeight;
    return layout.horizontal ? {
      same: widthChanged,
      other: heightChanged
    } : {
      same: heightChanged,
      other: widthChanged
    };
  }
  function handleMaxPadding(chartArea) {
    const maxPadding = chartArea.maxPadding;
    function updatePos(pos) {
      const change = Math.max(maxPadding[pos] - chartArea[pos], 0);
      chartArea[pos] += change;
      return change;
    }
    chartArea.y += updatePos("top");
    chartArea.x += updatePos("left");
    updatePos("right");
    updatePos("bottom");
  }
  function getMargins(horizontal, chartArea) {
    const maxPadding = chartArea.maxPadding;
    function marginForPositions(positions2) {
      const margin = {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0
      };
      positions2.forEach((pos) => {
        margin[pos] = Math.max(chartArea[pos], maxPadding[pos]);
      });
      return margin;
    }
    return horizontal ? marginForPositions([
      "left",
      "right"
    ]) : marginForPositions([
      "top",
      "bottom"
    ]);
  }
  function fitBoxes(boxes, chartArea, params, stacks) {
    const refitBoxes = [];
    let i2, ilen, layout, box, refit, changed;
    for (i2 = 0, ilen = boxes.length, refit = 0; i2 < ilen; ++i2) {
      layout = boxes[i2];
      box = layout.box;
      box.update(layout.width || chartArea.w, layout.height || chartArea.h, getMargins(layout.horizontal, chartArea));
      const { same, other } = updateDims(chartArea, params, layout, stacks);
      refit |= same && refitBoxes.length;
      changed = changed || other;
      if (!box.fullSize) {
        refitBoxes.push(layout);
      }
    }
    return refit && fitBoxes(refitBoxes, chartArea, params, stacks) || changed;
  }
  function setBoxDims(box, left, top, width, height) {
    box.top = top;
    box.left = left;
    box.right = left + width;
    box.bottom = top + height;
    box.width = width;
    box.height = height;
  }
  function placeBoxes(boxes, chartArea, params, stacks) {
    const userPadding = params.padding;
    let { x: x2, y: y2 } = chartArea;
    for (const layout of boxes) {
      const box = layout.box;
      const stack = stacks[layout.stack] || {
        count: 1,
        placed: 0,
        weight: 1
      };
      const weight = layout.stackWeight / stack.weight || 1;
      if (layout.horizontal) {
        const width = chartArea.w * weight;
        const height = stack.size || box.height;
        if (defined(stack.start)) {
          y2 = stack.start;
        }
        if (box.fullSize) {
          setBoxDims(box, userPadding.left, y2, params.outerWidth - userPadding.right - userPadding.left, height);
        } else {
          setBoxDims(box, chartArea.left + stack.placed, y2, width, height);
        }
        stack.start = y2;
        stack.placed += width;
        y2 = box.bottom;
      } else {
        const height = chartArea.h * weight;
        const width = stack.size || box.width;
        if (defined(stack.start)) {
          x2 = stack.start;
        }
        if (box.fullSize) {
          setBoxDims(box, x2, userPadding.top, width, params.outerHeight - userPadding.bottom - userPadding.top);
        } else {
          setBoxDims(box, x2, chartArea.top + stack.placed, width, height);
        }
        stack.start = x2;
        stack.placed += height;
        x2 = box.right;
      }
    }
    chartArea.x = x2;
    chartArea.y = y2;
  }
  var layouts = {
    addBox(chart, item) {
      if (!chart.boxes) {
        chart.boxes = [];
      }
      item.fullSize = item.fullSize || false;
      item.position = item.position || "top";
      item.weight = item.weight || 0;
      item._layers = item._layers || function() {
        return [
          {
            z: 0,
            draw(chartArea) {
              item.draw(chartArea);
            }
          }
        ];
      };
      chart.boxes.push(item);
    },
    removeBox(chart, layoutItem) {
      const index3 = chart.boxes ? chart.boxes.indexOf(layoutItem) : -1;
      if (index3 !== -1) {
        chart.boxes.splice(index3, 1);
      }
    },
    configure(chart, item, options) {
      item.fullSize = options.fullSize;
      item.position = options.position;
      item.weight = options.weight;
    },
    update(chart, width, height, minPadding) {
      if (!chart) {
        return;
      }
      const padding = toPadding(chart.options.layout.padding);
      const availableWidth = Math.max(width - padding.width, 0);
      const availableHeight = Math.max(height - padding.height, 0);
      const boxes = buildLayoutBoxes(chart.boxes);
      const verticalBoxes = boxes.vertical;
      const horizontalBoxes = boxes.horizontal;
      each(chart.boxes, (box) => {
        if (typeof box.beforeLayout === "function") {
          box.beforeLayout();
        }
      });
      const visibleVerticalBoxCount = verticalBoxes.reduce((total, wrap) => wrap.box.options && wrap.box.options.display === false ? total : total + 1, 0) || 1;
      const params = Object.freeze({
        outerWidth: width,
        outerHeight: height,
        padding,
        availableWidth,
        availableHeight,
        vBoxMaxWidth: availableWidth / 2 / visibleVerticalBoxCount,
        hBoxMaxHeight: availableHeight / 2
      });
      const maxPadding = Object.assign({}, padding);
      updateMaxPadding(maxPadding, toPadding(minPadding));
      const chartArea = Object.assign({
        maxPadding,
        w: availableWidth,
        h: availableHeight,
        x: padding.left,
        y: padding.top
      }, padding);
      const stacks = setLayoutDims(verticalBoxes.concat(horizontalBoxes), params);
      fitBoxes(boxes.fullSize, chartArea, params, stacks);
      fitBoxes(verticalBoxes, chartArea, params, stacks);
      if (fitBoxes(horizontalBoxes, chartArea, params, stacks)) {
        fitBoxes(verticalBoxes, chartArea, params, stacks);
      }
      handleMaxPadding(chartArea);
      placeBoxes(boxes.leftAndTop, chartArea, params, stacks);
      chartArea.x += chartArea.w;
      chartArea.y += chartArea.h;
      placeBoxes(boxes.rightAndBottom, chartArea, params, stacks);
      chart.chartArea = {
        left: chartArea.left,
        top: chartArea.top,
        right: chartArea.left + chartArea.w,
        bottom: chartArea.top + chartArea.h,
        height: chartArea.h,
        width: chartArea.w
      };
      each(boxes.chartArea, (layout) => {
        const box = layout.box;
        Object.assign(box, chart.chartArea);
        box.update(chartArea.w, chartArea.h, {
          left: 0,
          top: 0,
          right: 0,
          bottom: 0
        });
      });
    }
  };
  var BasePlatform = class {
    acquireContext(canvas, aspectRatio) {
    }
    releaseContext(context) {
      return false;
    }
    addEventListener(chart, type, listener) {
    }
    removeEventListener(chart, type, listener) {
    }
    getDevicePixelRatio() {
      return 1;
    }
    getMaximumSize(element, width, height, aspectRatio) {
      width = Math.max(0, width || element.width);
      height = height || element.height;
      return {
        width,
        height: Math.max(0, aspectRatio ? Math.floor(width / aspectRatio) : height)
      };
    }
    isAttached(canvas) {
      return true;
    }
    updateConfig(config) {
    }
  };
  var BasicPlatform = class extends BasePlatform {
    acquireContext(item) {
      return item && item.getContext && item.getContext("2d") || null;
    }
    updateConfig(config) {
      config.options.animation = false;
    }
  };
  var EXPANDO_KEY = "$chartjs";
  var EVENT_TYPES = {
    touchstart: "mousedown",
    touchmove: "mousemove",
    touchend: "mouseup",
    pointerenter: "mouseenter",
    pointerdown: "mousedown",
    pointermove: "mousemove",
    pointerup: "mouseup",
    pointerleave: "mouseout",
    pointerout: "mouseout"
  };
  var isNullOrEmpty = (value) => value === null || value === "";
  function initCanvas(canvas, aspectRatio) {
    const style = canvas.style;
    const renderHeight = canvas.getAttribute("height");
    const renderWidth = canvas.getAttribute("width");
    canvas[EXPANDO_KEY] = {
      initial: {
        height: renderHeight,
        width: renderWidth,
        style: {
          display: style.display,
          height: style.height,
          width: style.width
        }
      }
    };
    style.display = style.display || "block";
    style.boxSizing = style.boxSizing || "border-box";
    if (isNullOrEmpty(renderWidth)) {
      const displayWidth = readUsedSize(canvas, "width");
      if (displayWidth !== void 0) {
        canvas.width = displayWidth;
      }
    }
    if (isNullOrEmpty(renderHeight)) {
      if (canvas.style.height === "") {
        canvas.height = canvas.width / (aspectRatio || 2);
      } else {
        const displayHeight = readUsedSize(canvas, "height");
        if (displayHeight !== void 0) {
          canvas.height = displayHeight;
        }
      }
    }
    return canvas;
  }
  var eventListenerOptions = supportsEventListenerOptions ? {
    passive: true
  } : false;
  function addListener(node, type, listener) {
    if (node) {
      node.addEventListener(type, listener, eventListenerOptions);
    }
  }
  function removeListener(chart, type, listener) {
    if (chart && chart.canvas) {
      chart.canvas.removeEventListener(type, listener, eventListenerOptions);
    }
  }
  function fromNativeEvent(event, chart) {
    const type = EVENT_TYPES[event.type] || event.type;
    const { x: x2, y: y2 } = getRelativePosition(event, chart);
    return {
      type,
      chart,
      native: event,
      x: x2 !== void 0 ? x2 : null,
      y: y2 !== void 0 ? y2 : null
    };
  }
  function nodeListContains(nodeList, canvas) {
    for (const node of nodeList) {
      if (node === canvas || node.contains(canvas)) {
        return true;
      }
    }
  }
  function createAttachObserver(chart, type, listener) {
    const canvas = chart.canvas;
    const observer = new MutationObserver((entries) => {
      let trigger = false;
      for (const entry of entries) {
        trigger = trigger || nodeListContains(entry.addedNodes, canvas);
        trigger = trigger && !nodeListContains(entry.removedNodes, canvas);
      }
      if (trigger) {
        listener();
      }
    });
    observer.observe(document, {
      childList: true,
      subtree: true
    });
    return observer;
  }
  function createDetachObserver(chart, type, listener) {
    const canvas = chart.canvas;
    const observer = new MutationObserver((entries) => {
      let trigger = false;
      for (const entry of entries) {
        trigger = trigger || nodeListContains(entry.removedNodes, canvas);
        trigger = trigger && !nodeListContains(entry.addedNodes, canvas);
      }
      if (trigger) {
        listener();
      }
    });
    observer.observe(document, {
      childList: true,
      subtree: true
    });
    return observer;
  }
  var drpListeningCharts = /* @__PURE__ */ new Map();
  var oldDevicePixelRatio = 0;
  function onWindowResize() {
    const dpr = window.devicePixelRatio;
    if (dpr === oldDevicePixelRatio) {
      return;
    }
    oldDevicePixelRatio = dpr;
    drpListeningCharts.forEach((resize, chart) => {
      if (chart.currentDevicePixelRatio !== dpr) {
        resize();
      }
    });
  }
  function listenDevicePixelRatioChanges(chart, resize) {
    if (!drpListeningCharts.size) {
      window.addEventListener("resize", onWindowResize);
    }
    drpListeningCharts.set(chart, resize);
  }
  function unlistenDevicePixelRatioChanges(chart) {
    drpListeningCharts.delete(chart);
    if (!drpListeningCharts.size) {
      window.removeEventListener("resize", onWindowResize);
    }
  }
  function createResizeObserver(chart, type, listener) {
    const canvas = chart.canvas;
    const container = canvas && _getParentNode(canvas);
    if (!container) {
      return;
    }
    const resize = throttled((width, height) => {
      const w2 = container.clientWidth;
      listener(width, height);
      if (w2 < container.clientWidth) {
        listener();
      }
    }, window);
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      const width = entry.contentRect.width;
      const height = entry.contentRect.height;
      if (width === 0 && height === 0) {
        return;
      }
      resize(width, height);
    });
    observer.observe(container);
    listenDevicePixelRatioChanges(chart, resize);
    return observer;
  }
  function releaseObserver(chart, type, observer) {
    if (observer) {
      observer.disconnect();
    }
    if (type === "resize") {
      unlistenDevicePixelRatioChanges(chart);
    }
  }
  function createProxyAndListen(chart, type, listener) {
    const canvas = chart.canvas;
    const proxy = throttled((event) => {
      if (chart.ctx !== null) {
        listener(fromNativeEvent(event, chart));
      }
    }, chart);
    addListener(canvas, type, proxy);
    return proxy;
  }
  var DomPlatform = class extends BasePlatform {
    acquireContext(canvas, aspectRatio) {
      const context = canvas && canvas.getContext && canvas.getContext("2d");
      if (context && context.canvas === canvas) {
        initCanvas(canvas, aspectRatio);
        return context;
      }
      return null;
    }
    releaseContext(context) {
      const canvas = context.canvas;
      if (!canvas[EXPANDO_KEY]) {
        return false;
      }
      const initial = canvas[EXPANDO_KEY].initial;
      [
        "height",
        "width"
      ].forEach((prop) => {
        const value = initial[prop];
        if (isNullOrUndef(value)) {
          canvas.removeAttribute(prop);
        } else {
          canvas.setAttribute(prop, value);
        }
      });
      const style = initial.style || {};
      Object.keys(style).forEach((key) => {
        canvas.style[key] = style[key];
      });
      canvas.width = canvas.width;
      delete canvas[EXPANDO_KEY];
      return true;
    }
    addEventListener(chart, type, listener) {
      this.removeEventListener(chart, type);
      const proxies = chart.$proxies || (chart.$proxies = {});
      const handlers = {
        attach: createAttachObserver,
        detach: createDetachObserver,
        resize: createResizeObserver
      };
      const handler = handlers[type] || createProxyAndListen;
      proxies[type] = handler(chart, type, listener);
    }
    removeEventListener(chart, type) {
      const proxies = chart.$proxies || (chart.$proxies = {});
      const proxy = proxies[type];
      if (!proxy) {
        return;
      }
      const handlers = {
        attach: releaseObserver,
        detach: releaseObserver,
        resize: releaseObserver
      };
      const handler = handlers[type] || removeListener;
      handler(chart, type, proxy);
      proxies[type] = void 0;
    }
    getDevicePixelRatio() {
      return window.devicePixelRatio;
    }
    getMaximumSize(canvas, width, height, aspectRatio) {
      return getMaximumSize(canvas, width, height, aspectRatio);
    }
    isAttached(canvas) {
      const container = canvas && _getParentNode(canvas);
      return !!(container && container.isConnected);
    }
  };
  function _detectPlatform(canvas) {
    if (!_isDomSupported() || typeof OffscreenCanvas !== "undefined" && canvas instanceof OffscreenCanvas) {
      return BasicPlatform;
    }
    return DomPlatform;
  }
  var Element = class {
    static defaults = {};
    static defaultRoutes = void 0;
    x;
    y;
    active = false;
    options;
    $animations;
    tooltipPosition(useFinalPosition) {
      const { x: x2, y: y2 } = this.getProps([
        "x",
        "y"
      ], useFinalPosition);
      return {
        x: x2,
        y: y2
      };
    }
    hasValue() {
      return isNumber(this.x) && isNumber(this.y);
    }
    getProps(props, final) {
      const anims = this.$animations;
      if (!final || !anims) {
        return this;
      }
      const ret = {};
      props.forEach((prop) => {
        ret[prop] = anims[prop] && anims[prop].active() ? anims[prop]._to : this[prop];
      });
      return ret;
    }
  };
  function autoSkip(scale, ticks) {
    const tickOpts = scale.options.ticks;
    const determinedMaxTicks = determineMaxTicks(scale);
    const ticksLimit = Math.min(tickOpts.maxTicksLimit || determinedMaxTicks, determinedMaxTicks);
    const majorIndices = tickOpts.major.enabled ? getMajorIndices(ticks) : [];
    const numMajorIndices = majorIndices.length;
    const first = majorIndices[0];
    const last = majorIndices[numMajorIndices - 1];
    const newTicks = [];
    if (numMajorIndices > ticksLimit) {
      skipMajors(ticks, newTicks, majorIndices, numMajorIndices / ticksLimit);
      return newTicks;
    }
    const spacing = calculateSpacing(majorIndices, ticks, ticksLimit);
    if (numMajorIndices > 0) {
      let i2, ilen;
      const avgMajorSpacing = numMajorIndices > 1 ? Math.round((last - first) / (numMajorIndices - 1)) : null;
      skip(ticks, newTicks, spacing, isNullOrUndef(avgMajorSpacing) ? 0 : first - avgMajorSpacing, first);
      for (i2 = 0, ilen = numMajorIndices - 1; i2 < ilen; i2++) {
        skip(ticks, newTicks, spacing, majorIndices[i2], majorIndices[i2 + 1]);
      }
      skip(ticks, newTicks, spacing, last, isNullOrUndef(avgMajorSpacing) ? ticks.length : last + avgMajorSpacing);
      return newTicks;
    }
    skip(ticks, newTicks, spacing);
    return newTicks;
  }
  function determineMaxTicks(scale) {
    const offset = scale.options.offset;
    const tickLength = scale._tickSize();
    const maxScale = scale._length / tickLength + (offset ? 0 : 1);
    const maxChart = scale._maxLength / tickLength;
    return Math.floor(Math.min(maxScale, maxChart));
  }
  function calculateSpacing(majorIndices, ticks, ticksLimit) {
    const evenMajorSpacing = getEvenSpacing(majorIndices);
    const spacing = ticks.length / ticksLimit;
    if (!evenMajorSpacing) {
      return Math.max(spacing, 1);
    }
    const factors = _factorize(evenMajorSpacing);
    for (let i2 = 0, ilen = factors.length - 1; i2 < ilen; i2++) {
      const factor = factors[i2];
      if (factor > spacing) {
        return factor;
      }
    }
    return Math.max(spacing, 1);
  }
  function getMajorIndices(ticks) {
    const result = [];
    let i2, ilen;
    for (i2 = 0, ilen = ticks.length; i2 < ilen; i2++) {
      if (ticks[i2].major) {
        result.push(i2);
      }
    }
    return result;
  }
  function skipMajors(ticks, newTicks, majorIndices, spacing) {
    let count = 0;
    let next = majorIndices[0];
    let i2;
    spacing = Math.ceil(spacing);
    for (i2 = 0; i2 < ticks.length; i2++) {
      if (i2 === next) {
        newTicks.push(ticks[i2]);
        count++;
        next = majorIndices[count * spacing];
      }
    }
  }
  function skip(ticks, newTicks, spacing, majorStart, majorEnd) {
    const start = valueOrDefault(majorStart, 0);
    const end = Math.min(valueOrDefault(majorEnd, ticks.length), ticks.length);
    let count = 0;
    let length, i2, next;
    spacing = Math.ceil(spacing);
    if (majorEnd) {
      length = majorEnd - majorStart;
      spacing = length / Math.floor(length / spacing);
    }
    next = start;
    while (next < 0) {
      count++;
      next = Math.round(start + count * spacing);
    }
    for (i2 = Math.max(start, 0); i2 < end; i2++) {
      if (i2 === next) {
        newTicks.push(ticks[i2]);
        count++;
        next = Math.round(start + count * spacing);
      }
    }
  }
  function getEvenSpacing(arr) {
    const len = arr.length;
    let i2, diff;
    if (len < 2) {
      return false;
    }
    for (diff = arr[0], i2 = 1; i2 < len; ++i2) {
      if (arr[i2] - arr[i2 - 1] !== diff) {
        return false;
      }
    }
    return diff;
  }
  var reverseAlign = (align) => align === "left" ? "right" : align === "right" ? "left" : align;
  var offsetFromEdge = (scale, edge, offset) => edge === "top" || edge === "left" ? scale[edge] + offset : scale[edge] - offset;
  var getTicksLimit = (ticksLength, maxTicksLimit) => Math.min(maxTicksLimit || ticksLength, ticksLength);
  function sample(arr, numItems) {
    const result = [];
    const increment = arr.length / numItems;
    const len = arr.length;
    let i2 = 0;
    for (; i2 < len; i2 += increment) {
      result.push(arr[Math.floor(i2)]);
    }
    return result;
  }
  function getPixelForGridLine(scale, index3, offsetGridLines) {
    const length = scale.ticks.length;
    const validIndex2 = Math.min(index3, length - 1);
    const start = scale._startPixel;
    const end = scale._endPixel;
    const epsilon = 1e-6;
    let lineValue = scale.getPixelForTick(validIndex2);
    let offset;
    if (offsetGridLines) {
      if (length === 1) {
        offset = Math.max(lineValue - start, end - lineValue);
      } else if (index3 === 0) {
        offset = (scale.getPixelForTick(1) - lineValue) / 2;
      } else {
        offset = (lineValue - scale.getPixelForTick(validIndex2 - 1)) / 2;
      }
      lineValue += validIndex2 < index3 ? offset : -offset;
      if (lineValue < start - epsilon || lineValue > end + epsilon) {
        return;
      }
    }
    return lineValue;
  }
  function garbageCollect(caches, length) {
    each(caches, (cache2) => {
      const gc = cache2.gc;
      const gcLen = gc.length / 2;
      let i2;
      if (gcLen > length) {
        for (i2 = 0; i2 < gcLen; ++i2) {
          delete cache2.data[gc[i2]];
        }
        gc.splice(0, gcLen);
      }
    });
  }
  function getTickMarkLength(options) {
    return options.drawTicks ? options.tickLength : 0;
  }
  function getTitleHeight(options, fallback) {
    if (!options.display) {
      return 0;
    }
    const font = toFont(options.font, fallback);
    const padding = toPadding(options.padding);
    const lines = isArray(options.text) ? options.text.length : 1;
    return lines * font.lineHeight + padding.height;
  }
  function createScaleContext(parent, scale) {
    return createContext(parent, {
      scale,
      type: "scale"
    });
  }
  function createTickContext(parent, index3, tick) {
    return createContext(parent, {
      tick,
      index: index3,
      type: "tick"
    });
  }
  function titleAlign(align, position, reverse) {
    let ret = _toLeftRightCenter(align);
    if (reverse && position !== "right" || !reverse && position === "right") {
      ret = reverseAlign(ret);
    }
    return ret;
  }
  function titleArgs(scale, offset, position, align) {
    const { top, left, bottom, right, chart } = scale;
    const { chartArea, scales } = chart;
    let rotation = 0;
    let maxWidth, titleX, titleY;
    const height = bottom - top;
    const width = right - left;
    if (scale.isHorizontal()) {
      titleX = _alignStartEnd(align, left, right);
      if (isObject(position)) {
        const positionAxisID = Object.keys(position)[0];
        const value = position[positionAxisID];
        titleY = scales[positionAxisID].getPixelForValue(value) + height - offset;
      } else if (position === "center") {
        titleY = (chartArea.bottom + chartArea.top) / 2 + height - offset;
      } else {
        titleY = offsetFromEdge(scale, position, offset);
      }
      maxWidth = right - left;
    } else {
      if (isObject(position)) {
        const positionAxisID = Object.keys(position)[0];
        const value = position[positionAxisID];
        titleX = scales[positionAxisID].getPixelForValue(value) - width + offset;
      } else if (position === "center") {
        titleX = (chartArea.left + chartArea.right) / 2 - width + offset;
      } else {
        titleX = offsetFromEdge(scale, position, offset);
      }
      titleY = _alignStartEnd(align, bottom, top);
      rotation = position === "left" ? -HALF_PI : HALF_PI;
    }
    return {
      titleX,
      titleY,
      maxWidth,
      rotation
    };
  }
  var Scale = class _Scale extends Element {
    constructor(cfg) {
      super();
      this.id = cfg.id;
      this.type = cfg.type;
      this.options = void 0;
      this.ctx = cfg.ctx;
      this.chart = cfg.chart;
      this.top = void 0;
      this.bottom = void 0;
      this.left = void 0;
      this.right = void 0;
      this.width = void 0;
      this.height = void 0;
      this._margins = {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0
      };
      this.maxWidth = void 0;
      this.maxHeight = void 0;
      this.paddingTop = void 0;
      this.paddingBottom = void 0;
      this.paddingLeft = void 0;
      this.paddingRight = void 0;
      this.axis = void 0;
      this.labelRotation = void 0;
      this.min = void 0;
      this.max = void 0;
      this._range = void 0;
      this.ticks = [];
      this._gridLineItems = null;
      this._labelItems = null;
      this._labelSizes = null;
      this._length = 0;
      this._maxLength = 0;
      this._longestTextCache = {};
      this._startPixel = void 0;
      this._endPixel = void 0;
      this._reversePixels = false;
      this._userMax = void 0;
      this._userMin = void 0;
      this._suggestedMax = void 0;
      this._suggestedMin = void 0;
      this._ticksLength = 0;
      this._borderValue = 0;
      this._cache = {};
      this._dataLimitsCached = false;
      this.$context = void 0;
    }
    init(options) {
      this.options = options.setContext(this.getContext());
      this.axis = options.axis;
      this._userMin = this.parse(options.min);
      this._userMax = this.parse(options.max);
      this._suggestedMin = this.parse(options.suggestedMin);
      this._suggestedMax = this.parse(options.suggestedMax);
    }
    parse(raw, index3) {
      return raw;
    }
    getUserBounds() {
      let { _userMin, _userMax, _suggestedMin, _suggestedMax } = this;
      _userMin = finiteOrDefault(_userMin, Number.POSITIVE_INFINITY);
      _userMax = finiteOrDefault(_userMax, Number.NEGATIVE_INFINITY);
      _suggestedMin = finiteOrDefault(_suggestedMin, Number.POSITIVE_INFINITY);
      _suggestedMax = finiteOrDefault(_suggestedMax, Number.NEGATIVE_INFINITY);
      return {
        min: finiteOrDefault(_userMin, _suggestedMin),
        max: finiteOrDefault(_userMax, _suggestedMax),
        minDefined: isNumberFinite(_userMin),
        maxDefined: isNumberFinite(_userMax)
      };
    }
    getMinMax(canStack) {
      let { min: min2, max: max2, minDefined, maxDefined } = this.getUserBounds();
      let range;
      if (minDefined && maxDefined) {
        return {
          min: min2,
          max: max2
        };
      }
      const metas = this.getMatchingVisibleMetas();
      for (let i2 = 0, ilen = metas.length; i2 < ilen; ++i2) {
        range = metas[i2].controller.getMinMax(this, canStack);
        if (!minDefined) {
          min2 = Math.min(min2, range.min);
        }
        if (!maxDefined) {
          max2 = Math.max(max2, range.max);
        }
      }
      min2 = maxDefined && min2 > max2 ? max2 : min2;
      max2 = minDefined && min2 > max2 ? min2 : max2;
      return {
        min: finiteOrDefault(min2, finiteOrDefault(max2, min2)),
        max: finiteOrDefault(max2, finiteOrDefault(min2, max2))
      };
    }
    getPadding() {
      return {
        left: this.paddingLeft || 0,
        top: this.paddingTop || 0,
        right: this.paddingRight || 0,
        bottom: this.paddingBottom || 0
      };
    }
    getTicks() {
      return this.ticks;
    }
    getLabels() {
      const data = this.chart.data;
      return this.options.labels || (this.isHorizontal() ? data.xLabels : data.yLabels) || data.labels || [];
    }
    getLabelItems(chartArea = this.chart.chartArea) {
      const items = this._labelItems || (this._labelItems = this._computeLabelItems(chartArea));
      return items;
    }
    beforeLayout() {
      this._cache = {};
      this._dataLimitsCached = false;
    }
    beforeUpdate() {
      callback(this.options.beforeUpdate, [
        this
      ]);
    }
    update(maxWidth, maxHeight, margins) {
      const { beginAtZero, grace, ticks: tickOpts } = this.options;
      const sampleSize = tickOpts.sampleSize;
      this.beforeUpdate();
      this.maxWidth = maxWidth;
      this.maxHeight = maxHeight;
      this._margins = margins = Object.assign({
        left: 0,
        right: 0,
        top: 0,
        bottom: 0
      }, margins);
      this.ticks = null;
      this._labelSizes = null;
      this._gridLineItems = null;
      this._labelItems = null;
      this.beforeSetDimensions();
      this.setDimensions();
      this.afterSetDimensions();
      this._maxLength = this.isHorizontal() ? this.width + margins.left + margins.right : this.height + margins.top + margins.bottom;
      if (!this._dataLimitsCached) {
        this.beforeDataLimits();
        this.determineDataLimits();
        this.afterDataLimits();
        this._range = _addGrace(this, grace, beginAtZero);
        this._dataLimitsCached = true;
      }
      this.beforeBuildTicks();
      this.ticks = this.buildTicks() || [];
      this.afterBuildTicks();
      const samplingEnabled = sampleSize < this.ticks.length;
      this._convertTicksToLabels(samplingEnabled ? sample(this.ticks, sampleSize) : this.ticks);
      this.configure();
      this.beforeCalculateLabelRotation();
      this.calculateLabelRotation();
      this.afterCalculateLabelRotation();
      if (tickOpts.display && (tickOpts.autoSkip || tickOpts.source === "auto")) {
        this.ticks = autoSkip(this, this.ticks);
        this._labelSizes = null;
        this.afterAutoSkip();
      }
      if (samplingEnabled) {
        this._convertTicksToLabels(this.ticks);
      }
      this.beforeFit();
      this.fit();
      this.afterFit();
      this.afterUpdate();
    }
    configure() {
      let reversePixels = this.options.reverse;
      let startPixel, endPixel;
      if (this.isHorizontal()) {
        startPixel = this.left;
        endPixel = this.right;
      } else {
        startPixel = this.top;
        endPixel = this.bottom;
        reversePixels = !reversePixels;
      }
      this._startPixel = startPixel;
      this._endPixel = endPixel;
      this._reversePixels = reversePixels;
      this._length = endPixel - startPixel;
      this._alignToPixels = this.options.alignToPixels;
    }
    afterUpdate() {
      callback(this.options.afterUpdate, [
        this
      ]);
    }
    beforeSetDimensions() {
      callback(this.options.beforeSetDimensions, [
        this
      ]);
    }
    setDimensions() {
      if (this.isHorizontal()) {
        this.width = this.maxWidth;
        this.left = 0;
        this.right = this.width;
      } else {
        this.height = this.maxHeight;
        this.top = 0;
        this.bottom = this.height;
      }
      this.paddingLeft = 0;
      this.paddingTop = 0;
      this.paddingRight = 0;
      this.paddingBottom = 0;
    }
    afterSetDimensions() {
      callback(this.options.afterSetDimensions, [
        this
      ]);
    }
    _callHooks(name) {
      this.chart.notifyPlugins(name, this.getContext());
      callback(this.options[name], [
        this
      ]);
    }
    beforeDataLimits() {
      this._callHooks("beforeDataLimits");
    }
    determineDataLimits() {
    }
    afterDataLimits() {
      this._callHooks("afterDataLimits");
    }
    beforeBuildTicks() {
      this._callHooks("beforeBuildTicks");
    }
    buildTicks() {
      return [];
    }
    afterBuildTicks() {
      this._callHooks("afterBuildTicks");
    }
    beforeTickToLabelConversion() {
      callback(this.options.beforeTickToLabelConversion, [
        this
      ]);
    }
    generateTickLabels(ticks) {
      const tickOpts = this.options.ticks;
      let i2, ilen, tick;
      for (i2 = 0, ilen = ticks.length; i2 < ilen; i2++) {
        tick = ticks[i2];
        tick.label = callback(tickOpts.callback, [
          tick.value,
          i2,
          ticks
        ], this);
      }
    }
    afterTickToLabelConversion() {
      callback(this.options.afterTickToLabelConversion, [
        this
      ]);
    }
    beforeCalculateLabelRotation() {
      callback(this.options.beforeCalculateLabelRotation, [
        this
      ]);
    }
    calculateLabelRotation() {
      const options = this.options;
      const tickOpts = options.ticks;
      const numTicks = getTicksLimit(this.ticks.length, options.ticks.maxTicksLimit);
      const minRotation = tickOpts.minRotation || 0;
      const maxRotation = tickOpts.maxRotation;
      let labelRotation = minRotation;
      let tickWidth, maxHeight, maxLabelDiagonal;
      if (!this._isVisible() || !tickOpts.display || minRotation >= maxRotation || numTicks <= 1 || !this.isHorizontal()) {
        this.labelRotation = minRotation;
        return;
      }
      const labelSizes = this._getLabelSizes();
      const maxLabelWidth = labelSizes.widest.width;
      const maxLabelHeight = labelSizes.highest.height;
      const maxWidth = _limitValue(this.chart.width - maxLabelWidth, 0, this.maxWidth);
      tickWidth = options.offset ? this.maxWidth / numTicks : maxWidth / (numTicks - 1);
      if (maxLabelWidth + 6 > tickWidth) {
        tickWidth = maxWidth / (numTicks - (options.offset ? 0.5 : 1));
        maxHeight = this.maxHeight - getTickMarkLength(options.grid) - tickOpts.padding - getTitleHeight(options.title, this.chart.options.font);
        maxLabelDiagonal = Math.sqrt(maxLabelWidth * maxLabelWidth + maxLabelHeight * maxLabelHeight);
        labelRotation = toDegrees(Math.min(Math.asin(_limitValue((labelSizes.highest.height + 6) / tickWidth, -1, 1)), Math.asin(_limitValue(maxHeight / maxLabelDiagonal, -1, 1)) - Math.asin(_limitValue(maxLabelHeight / maxLabelDiagonal, -1, 1))));
        labelRotation = Math.max(minRotation, Math.min(maxRotation, labelRotation));
      }
      this.labelRotation = labelRotation;
    }
    afterCalculateLabelRotation() {
      callback(this.options.afterCalculateLabelRotation, [
        this
      ]);
    }
    afterAutoSkip() {
    }
    beforeFit() {
      callback(this.options.beforeFit, [
        this
      ]);
    }
    fit() {
      const minSize = {
        width: 0,
        height: 0
      };
      const { chart, options: { ticks: tickOpts, title: titleOpts, grid: gridOpts } } = this;
      const display = this._isVisible();
      const isHorizontal = this.isHorizontal();
      if (display) {
        const titleHeight = getTitleHeight(titleOpts, chart.options.font);
        if (isHorizontal) {
          minSize.width = this.maxWidth;
          minSize.height = getTickMarkLength(gridOpts) + titleHeight;
        } else {
          minSize.height = this.maxHeight;
          minSize.width = getTickMarkLength(gridOpts) + titleHeight;
        }
        if (tickOpts.display && this.ticks.length) {
          const { first, last, widest, highest } = this._getLabelSizes();
          const tickPadding = tickOpts.padding * 2;
          const angleRadians = toRadians(this.labelRotation);
          const cos = Math.cos(angleRadians);
          const sin = Math.sin(angleRadians);
          if (isHorizontal) {
            const labelHeight = tickOpts.mirror ? 0 : sin * widest.width + cos * highest.height;
            minSize.height = Math.min(this.maxHeight, minSize.height + labelHeight + tickPadding);
          } else {
            const labelWidth = tickOpts.mirror ? 0 : cos * widest.width + sin * highest.height;
            minSize.width = Math.min(this.maxWidth, minSize.width + labelWidth + tickPadding);
          }
          this._calculatePadding(first, last, sin, cos);
        }
      }
      this._handleMargins();
      if (isHorizontal) {
        this.width = this._length = chart.width - this._margins.left - this._margins.right;
        this.height = minSize.height;
      } else {
        this.width = minSize.width;
        this.height = this._length = chart.height - this._margins.top - this._margins.bottom;
      }
    }
    _calculatePadding(first, last, sin, cos) {
      const { ticks: { align, padding }, position } = this.options;
      const isRotated = this.labelRotation !== 0;
      const labelsBelowTicks = position !== "top" && this.axis === "x";
      if (this.isHorizontal()) {
        const offsetLeft = this.getPixelForTick(0) - this.left;
        const offsetRight = this.right - this.getPixelForTick(this.ticks.length - 1);
        let paddingLeft = 0;
        let paddingRight = 0;
        if (isRotated) {
          if (labelsBelowTicks) {
            paddingLeft = cos * first.width;
            paddingRight = sin * last.height;
          } else {
            paddingLeft = sin * first.height;
            paddingRight = cos * last.width;
          }
        } else if (align === "start") {
          paddingRight = last.width;
        } else if (align === "end") {
          paddingLeft = first.width;
        } else if (align !== "inner") {
          paddingLeft = first.width / 2;
          paddingRight = last.width / 2;
        }
        this.paddingLeft = Math.max((paddingLeft - offsetLeft + padding) * this.width / (this.width - offsetLeft), 0);
        this.paddingRight = Math.max((paddingRight - offsetRight + padding) * this.width / (this.width - offsetRight), 0);
      } else {
        let paddingTop = last.height / 2;
        let paddingBottom = first.height / 2;
        if (align === "start") {
          paddingTop = 0;
          paddingBottom = first.height;
        } else if (align === "end") {
          paddingTop = last.height;
          paddingBottom = 0;
        }
        this.paddingTop = paddingTop + padding;
        this.paddingBottom = paddingBottom + padding;
      }
    }
    _handleMargins() {
      if (this._margins) {
        this._margins.left = Math.max(this.paddingLeft, this._margins.left);
        this._margins.top = Math.max(this.paddingTop, this._margins.top);
        this._margins.right = Math.max(this.paddingRight, this._margins.right);
        this._margins.bottom = Math.max(this.paddingBottom, this._margins.bottom);
      }
    }
    afterFit() {
      callback(this.options.afterFit, [
        this
      ]);
    }
    isHorizontal() {
      const { axis, position } = this.options;
      return position === "top" || position === "bottom" || axis === "x";
    }
    isFullSize() {
      return this.options.fullSize;
    }
    _convertTicksToLabels(ticks) {
      this.beforeTickToLabelConversion();
      this.generateTickLabels(ticks);
      let i2, ilen;
      for (i2 = 0, ilen = ticks.length; i2 < ilen; i2++) {
        if (isNullOrUndef(ticks[i2].label)) {
          ticks.splice(i2, 1);
          ilen--;
          i2--;
        }
      }
      this.afterTickToLabelConversion();
    }
    _getLabelSizes() {
      let labelSizes = this._labelSizes;
      if (!labelSizes) {
        const sampleSize = this.options.ticks.sampleSize;
        let ticks = this.ticks;
        if (sampleSize < ticks.length) {
          ticks = sample(ticks, sampleSize);
        }
        this._labelSizes = labelSizes = this._computeLabelSizes(ticks, ticks.length, this.options.ticks.maxTicksLimit);
      }
      return labelSizes;
    }
    _computeLabelSizes(ticks, length, maxTicksLimit) {
      const { ctx, _longestTextCache: caches } = this;
      const widths = [];
      const heights = [];
      const increment = Math.floor(length / getTicksLimit(length, maxTicksLimit));
      let widestLabelSize = 0;
      let highestLabelSize = 0;
      let i2, j2, jlen, label, tickFont, fontString2, cache2, lineHeight, width, height, nestedLabel;
      for (i2 = 0; i2 < length; i2 += increment) {
        label = ticks[i2].label;
        tickFont = this._resolveTickFontOptions(i2);
        ctx.font = fontString2 = tickFont.string;
        cache2 = caches[fontString2] = caches[fontString2] || {
          data: {},
          gc: []
        };
        lineHeight = tickFont.lineHeight;
        width = height = 0;
        if (!isNullOrUndef(label) && !isArray(label)) {
          width = _measureText(ctx, cache2.data, cache2.gc, width, label);
          height = lineHeight;
        } else if (isArray(label)) {
          for (j2 = 0, jlen = label.length; j2 < jlen; ++j2) {
            nestedLabel = label[j2];
            if (!isNullOrUndef(nestedLabel) && !isArray(nestedLabel)) {
              width = _measureText(ctx, cache2.data, cache2.gc, width, nestedLabel);
              height += lineHeight;
            }
          }
        }
        widths.push(width);
        heights.push(height);
        widestLabelSize = Math.max(width, widestLabelSize);
        highestLabelSize = Math.max(height, highestLabelSize);
      }
      garbageCollect(caches, length);
      const widest = widths.indexOf(widestLabelSize);
      const highest = heights.indexOf(highestLabelSize);
      const valueAt = (idx) => ({
        width: widths[idx] || 0,
        height: heights[idx] || 0
      });
      return {
        first: valueAt(0),
        last: valueAt(length - 1),
        widest: valueAt(widest),
        highest: valueAt(highest),
        widths,
        heights
      };
    }
    getLabelForValue(value) {
      return value;
    }
    getPixelForValue(value, index3) {
      return NaN;
    }
    getValueForPixel(pixel) {
    }
    getPixelForTick(index3) {
      const ticks = this.ticks;
      if (index3 < 0 || index3 > ticks.length - 1) {
        return null;
      }
      return this.getPixelForValue(ticks[index3].value);
    }
    getPixelForDecimal(decimal) {
      if (this._reversePixels) {
        decimal = 1 - decimal;
      }
      const pixel = this._startPixel + decimal * this._length;
      return _int16Range(this._alignToPixels ? _alignPixel(this.chart, pixel, 0) : pixel);
    }
    getDecimalForPixel(pixel) {
      const decimal = (pixel - this._startPixel) / this._length;
      return this._reversePixels ? 1 - decimal : decimal;
    }
    getBasePixel() {
      return this.getPixelForValue(this.getBaseValue());
    }
    getBaseValue() {
      const { min: min2, max: max2 } = this;
      return min2 < 0 && max2 < 0 ? max2 : min2 > 0 && max2 > 0 ? min2 : 0;
    }
    getContext(index3) {
      const ticks = this.ticks || [];
      if (index3 >= 0 && index3 < ticks.length) {
        const tick = ticks[index3];
        return tick.$context || (tick.$context = createTickContext(this.getContext(), index3, tick));
      }
      return this.$context || (this.$context = createScaleContext(this.chart.getContext(), this));
    }
    _tickSize() {
      const optionTicks = this.options.ticks;
      const rot = toRadians(this.labelRotation);
      const cos = Math.abs(Math.cos(rot));
      const sin = Math.abs(Math.sin(rot));
      const labelSizes = this._getLabelSizes();
      const padding = optionTicks.autoSkipPadding || 0;
      const w2 = labelSizes ? labelSizes.widest.width + padding : 0;
      const h3 = labelSizes ? labelSizes.highest.height + padding : 0;
      return this.isHorizontal() ? h3 * cos > w2 * sin ? w2 / cos : h3 / sin : h3 * sin < w2 * cos ? h3 / cos : w2 / sin;
    }
    _isVisible() {
      const display = this.options.display;
      if (display !== "auto") {
        return !!display;
      }
      return this.getMatchingVisibleMetas().length > 0;
    }
    _computeGridLineItems(chartArea) {
      const axis = this.axis;
      const chart = this.chart;
      const options = this.options;
      const { grid, position, border } = options;
      const offset = grid.offset;
      const isHorizontal = this.isHorizontal();
      const ticks = this.ticks;
      const ticksLength = ticks.length + (offset ? 1 : 0);
      const tl = getTickMarkLength(grid);
      const items = [];
      const borderOpts = border.setContext(this.getContext());
      const axisWidth = borderOpts.display ? borderOpts.width : 0;
      const axisHalfWidth = axisWidth / 2;
      const alignBorderValue = function(pixel) {
        return _alignPixel(chart, pixel, axisWidth);
      };
      let borderValue, i2, lineValue, alignedLineValue;
      let tx1, ty1, tx2, ty2, x1, y1, x2, y2;
      if (position === "top") {
        borderValue = alignBorderValue(this.bottom);
        ty1 = this.bottom - tl;
        ty2 = borderValue - axisHalfWidth;
        y1 = alignBorderValue(chartArea.top) + axisHalfWidth;
        y2 = chartArea.bottom;
      } else if (position === "bottom") {
        borderValue = alignBorderValue(this.top);
        y1 = chartArea.top;
        y2 = alignBorderValue(chartArea.bottom) - axisHalfWidth;
        ty1 = borderValue + axisHalfWidth;
        ty2 = this.top + tl;
      } else if (position === "left") {
        borderValue = alignBorderValue(this.right);
        tx1 = this.right - tl;
        tx2 = borderValue - axisHalfWidth;
        x1 = alignBorderValue(chartArea.left) + axisHalfWidth;
        x2 = chartArea.right;
      } else if (position === "right") {
        borderValue = alignBorderValue(this.left);
        x1 = chartArea.left;
        x2 = alignBorderValue(chartArea.right) - axisHalfWidth;
        tx1 = borderValue + axisHalfWidth;
        tx2 = this.left + tl;
      } else if (axis === "x") {
        if (position === "center") {
          borderValue = alignBorderValue((chartArea.top + chartArea.bottom) / 2 + 0.5);
        } else if (isObject(position)) {
          const positionAxisID = Object.keys(position)[0];
          const value = position[positionAxisID];
          borderValue = alignBorderValue(this.chart.scales[positionAxisID].getPixelForValue(value));
        }
        y1 = chartArea.top;
        y2 = chartArea.bottom;
        ty1 = borderValue + axisHalfWidth;
        ty2 = ty1 + tl;
      } else if (axis === "y") {
        if (position === "center") {
          borderValue = alignBorderValue((chartArea.left + chartArea.right) / 2);
        } else if (isObject(position)) {
          const positionAxisID = Object.keys(position)[0];
          const value = position[positionAxisID];
          borderValue = alignBorderValue(this.chart.scales[positionAxisID].getPixelForValue(value));
        }
        tx1 = borderValue - axisHalfWidth;
        tx2 = tx1 - tl;
        x1 = chartArea.left;
        x2 = chartArea.right;
      }
      const limit2 = valueOrDefault(options.ticks.maxTicksLimit, ticksLength);
      const step = Math.max(1, Math.ceil(ticksLength / limit2));
      for (i2 = 0; i2 < ticksLength; i2 += step) {
        const context = this.getContext(i2);
        const optsAtIndex = grid.setContext(context);
        const optsAtIndexBorder = border.setContext(context);
        const lineWidth = optsAtIndex.lineWidth;
        const lineColor = optsAtIndex.color;
        const borderDash = optsAtIndexBorder.dash || [];
        const borderDashOffset = optsAtIndexBorder.dashOffset;
        const tickWidth = optsAtIndex.tickWidth;
        const tickColor = optsAtIndex.tickColor;
        const tickBorderDash = optsAtIndex.tickBorderDash || [];
        const tickBorderDashOffset = optsAtIndex.tickBorderDashOffset;
        lineValue = getPixelForGridLine(this, i2, offset);
        if (lineValue === void 0) {
          continue;
        }
        alignedLineValue = _alignPixel(chart, lineValue, lineWidth);
        if (isHorizontal) {
          tx1 = tx2 = x1 = x2 = alignedLineValue;
        } else {
          ty1 = ty2 = y1 = y2 = alignedLineValue;
        }
        items.push({
          tx1,
          ty1,
          tx2,
          ty2,
          x1,
          y1,
          x2,
          y2,
          width: lineWidth,
          color: lineColor,
          borderDash,
          borderDashOffset,
          tickWidth,
          tickColor,
          tickBorderDash,
          tickBorderDashOffset
        });
      }
      this._ticksLength = ticksLength;
      this._borderValue = borderValue;
      return items;
    }
    _computeLabelItems(chartArea) {
      const axis = this.axis;
      const options = this.options;
      const { position, ticks: optionTicks } = options;
      const isHorizontal = this.isHorizontal();
      const ticks = this.ticks;
      const { align, crossAlign, padding, mirror } = optionTicks;
      const tl = getTickMarkLength(options.grid);
      const tickAndPadding = tl + padding;
      const hTickAndPadding = mirror ? -padding : tickAndPadding;
      const rotation = -toRadians(this.labelRotation);
      const items = [];
      let i2, ilen, tick, label, x2, y2, textAlign, pixel, font, lineHeight, lineCount, textOffset;
      let textBaseline = "middle";
      if (position === "top") {
        y2 = this.bottom - hTickAndPadding;
        textAlign = this._getXAxisLabelAlignment();
      } else if (position === "bottom") {
        y2 = this.top + hTickAndPadding;
        textAlign = this._getXAxisLabelAlignment();
      } else if (position === "left") {
        const ret = this._getYAxisLabelAlignment(tl);
        textAlign = ret.textAlign;
        x2 = ret.x;
      } else if (position === "right") {
        const ret = this._getYAxisLabelAlignment(tl);
        textAlign = ret.textAlign;
        x2 = ret.x;
      } else if (axis === "x") {
        if (position === "center") {
          y2 = (chartArea.top + chartArea.bottom) / 2 + tickAndPadding;
        } else if (isObject(position)) {
          const positionAxisID = Object.keys(position)[0];
          const value = position[positionAxisID];
          y2 = this.chart.scales[positionAxisID].getPixelForValue(value) + tickAndPadding;
        }
        textAlign = this._getXAxisLabelAlignment();
      } else if (axis === "y") {
        if (position === "center") {
          x2 = (chartArea.left + chartArea.right) / 2 - tickAndPadding;
        } else if (isObject(position)) {
          const positionAxisID = Object.keys(position)[0];
          const value = position[positionAxisID];
          x2 = this.chart.scales[positionAxisID].getPixelForValue(value);
        }
        textAlign = this._getYAxisLabelAlignment(tl).textAlign;
      }
      if (axis === "y") {
        if (align === "start") {
          textBaseline = "top";
        } else if (align === "end") {
          textBaseline = "bottom";
        }
      }
      const labelSizes = this._getLabelSizes();
      for (i2 = 0, ilen = ticks.length; i2 < ilen; ++i2) {
        tick = ticks[i2];
        label = tick.label;
        const optsAtIndex = optionTicks.setContext(this.getContext(i2));
        pixel = this.getPixelForTick(i2) + optionTicks.labelOffset;
        font = this._resolveTickFontOptions(i2);
        lineHeight = font.lineHeight;
        lineCount = isArray(label) ? label.length : 1;
        const halfCount = lineCount / 2;
        const color2 = optsAtIndex.color;
        const strokeColor = optsAtIndex.textStrokeColor;
        const strokeWidth = optsAtIndex.textStrokeWidth;
        let tickTextAlign = textAlign;
        if (isHorizontal) {
          x2 = pixel;
          if (textAlign === "inner") {
            if (i2 === ilen - 1) {
              tickTextAlign = !this.options.reverse ? "right" : "left";
            } else if (i2 === 0) {
              tickTextAlign = !this.options.reverse ? "left" : "right";
            } else {
              tickTextAlign = "center";
            }
          }
          if (position === "top") {
            if (crossAlign === "near" || rotation !== 0) {
              textOffset = -lineCount * lineHeight + lineHeight / 2;
            } else if (crossAlign === "center") {
              textOffset = -labelSizes.highest.height / 2 - halfCount * lineHeight + lineHeight;
            } else {
              textOffset = -labelSizes.highest.height + lineHeight / 2;
            }
          } else {
            if (crossAlign === "near" || rotation !== 0) {
              textOffset = lineHeight / 2;
            } else if (crossAlign === "center") {
              textOffset = labelSizes.highest.height / 2 - halfCount * lineHeight;
            } else {
              textOffset = labelSizes.highest.height - lineCount * lineHeight;
            }
          }
          if (mirror) {
            textOffset *= -1;
          }
          if (rotation !== 0 && !optsAtIndex.showLabelBackdrop) {
            x2 += lineHeight / 2 * Math.sin(rotation);
          }
        } else {
          y2 = pixel;
          textOffset = (1 - lineCount) * lineHeight / 2;
        }
        let backdrop;
        if (optsAtIndex.showLabelBackdrop) {
          const labelPadding = toPadding(optsAtIndex.backdropPadding);
          const height = labelSizes.heights[i2];
          const width = labelSizes.widths[i2];
          let top = textOffset - labelPadding.top;
          let left = 0 - labelPadding.left;
          switch (textBaseline) {
            case "middle":
              top -= height / 2;
              break;
            case "bottom":
              top -= height;
              break;
          }
          switch (textAlign) {
            case "center":
              left -= width / 2;
              break;
            case "right":
              left -= width;
              break;
            case "inner":
              if (i2 === ilen - 1) {
                left -= width;
              } else if (i2 > 0) {
                left -= width / 2;
              }
              break;
          }
          backdrop = {
            left,
            top,
            width: width + labelPadding.width,
            height: height + labelPadding.height,
            color: optsAtIndex.backdropColor
          };
        }
        items.push({
          label,
          font,
          textOffset,
          options: {
            rotation,
            color: color2,
            strokeColor,
            strokeWidth,
            textAlign: tickTextAlign,
            textBaseline,
            translation: [
              x2,
              y2
            ],
            backdrop
          }
        });
      }
      return items;
    }
    _getXAxisLabelAlignment() {
      const { position, ticks } = this.options;
      const rotation = -toRadians(this.labelRotation);
      if (rotation) {
        return position === "top" ? "left" : "right";
      }
      let align = "center";
      if (ticks.align === "start") {
        align = "left";
      } else if (ticks.align === "end") {
        align = "right";
      } else if (ticks.align === "inner") {
        align = "inner";
      }
      return align;
    }
    _getYAxisLabelAlignment(tl) {
      const { position, ticks: { crossAlign, mirror, padding } } = this.options;
      const labelSizes = this._getLabelSizes();
      const tickAndPadding = tl + padding;
      const widest = labelSizes.widest.width;
      let textAlign;
      let x2;
      if (position === "left") {
        if (mirror) {
          x2 = this.right + padding;
          if (crossAlign === "near") {
            textAlign = "left";
          } else if (crossAlign === "center") {
            textAlign = "center";
            x2 += widest / 2;
          } else {
            textAlign = "right";
            x2 += widest;
          }
        } else {
          x2 = this.right - tickAndPadding;
          if (crossAlign === "near") {
            textAlign = "right";
          } else if (crossAlign === "center") {
            textAlign = "center";
            x2 -= widest / 2;
          } else {
            textAlign = "left";
            x2 = this.left;
          }
        }
      } else if (position === "right") {
        if (mirror) {
          x2 = this.left + padding;
          if (crossAlign === "near") {
            textAlign = "right";
          } else if (crossAlign === "center") {
            textAlign = "center";
            x2 -= widest / 2;
          } else {
            textAlign = "left";
            x2 -= widest;
          }
        } else {
          x2 = this.left + tickAndPadding;
          if (crossAlign === "near") {
            textAlign = "left";
          } else if (crossAlign === "center") {
            textAlign = "center";
            x2 += widest / 2;
          } else {
            textAlign = "right";
            x2 = this.right;
          }
        }
      } else {
        textAlign = "right";
      }
      return {
        textAlign,
        x: x2
      };
    }
    _computeLabelArea() {
      if (this.options.ticks.mirror) {
        return;
      }
      const chart = this.chart;
      const position = this.options.position;
      if (position === "left" || position === "right") {
        return {
          top: 0,
          left: this.left,
          bottom: chart.height,
          right: this.right
        };
      }
      if (position === "top" || position === "bottom") {
        return {
          top: this.top,
          left: 0,
          bottom: this.bottom,
          right: chart.width
        };
      }
    }
    drawBackground() {
      const { ctx, options: { backgroundColor }, left, top, width, height } = this;
      if (backgroundColor) {
        ctx.save();
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(left, top, width, height);
        ctx.restore();
      }
    }
    getLineWidthForValue(value) {
      const grid = this.options.grid;
      if (!this._isVisible() || !grid.display) {
        return 0;
      }
      const ticks = this.ticks;
      const index3 = ticks.findIndex((t3) => t3.value === value);
      if (index3 >= 0) {
        const opts = grid.setContext(this.getContext(index3));
        return opts.lineWidth;
      }
      return 0;
    }
    drawGrid(chartArea) {
      const grid = this.options.grid;
      const ctx = this.ctx;
      const items = this._gridLineItems || (this._gridLineItems = this._computeGridLineItems(chartArea));
      let i2, ilen;
      const drawLine = (p1, p2, style) => {
        if (!style.width || !style.color) {
          return;
        }
        ctx.save();
        ctx.lineWidth = style.width;
        ctx.strokeStyle = style.color;
        ctx.setLineDash(style.borderDash || []);
        ctx.lineDashOffset = style.borderDashOffset;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        ctx.restore();
      };
      if (grid.display) {
        for (i2 = 0, ilen = items.length; i2 < ilen; ++i2) {
          const item = items[i2];
          if (grid.drawOnChartArea) {
            drawLine({
              x: item.x1,
              y: item.y1
            }, {
              x: item.x2,
              y: item.y2
            }, item);
          }
          if (grid.drawTicks) {
            drawLine({
              x: item.tx1,
              y: item.ty1
            }, {
              x: item.tx2,
              y: item.ty2
            }, {
              color: item.tickColor,
              width: item.tickWidth,
              borderDash: item.tickBorderDash,
              borderDashOffset: item.tickBorderDashOffset
            });
          }
        }
      }
    }
    drawBorder() {
      const { chart, ctx, options: { border, grid } } = this;
      const borderOpts = border.setContext(this.getContext());
      const axisWidth = border.display ? borderOpts.width : 0;
      if (!axisWidth) {
        return;
      }
      const lastLineWidth = grid.setContext(this.getContext(0)).lineWidth;
      const borderValue = this._borderValue;
      let x1, x2, y1, y2;
      if (this.isHorizontal()) {
        x1 = _alignPixel(chart, this.left, axisWidth) - axisWidth / 2;
        x2 = _alignPixel(chart, this.right, lastLineWidth) + lastLineWidth / 2;
        y1 = y2 = borderValue;
      } else {
        y1 = _alignPixel(chart, this.top, axisWidth) - axisWidth / 2;
        y2 = _alignPixel(chart, this.bottom, lastLineWidth) + lastLineWidth / 2;
        x1 = x2 = borderValue;
      }
      ctx.save();
      ctx.lineWidth = borderOpts.width;
      ctx.strokeStyle = borderOpts.color;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.restore();
    }
    drawLabels(chartArea) {
      const optionTicks = this.options.ticks;
      if (!optionTicks.display) {
        return;
      }
      const ctx = this.ctx;
      const area = this._computeLabelArea();
      if (area) {
        clipArea(ctx, area);
      }
      const items = this.getLabelItems(chartArea);
      for (const item of items) {
        const renderTextOptions = item.options;
        const tickFont = item.font;
        const label = item.label;
        const y2 = item.textOffset;
        renderText(ctx, label, 0, y2, tickFont, renderTextOptions);
      }
      if (area) {
        unclipArea(ctx);
      }
    }
    drawTitle() {
      const { ctx, options: { position, title, reverse } } = this;
      if (!title.display) {
        return;
      }
      const font = toFont(title.font);
      const padding = toPadding(title.padding);
      const align = title.align;
      let offset = font.lineHeight / 2;
      if (position === "bottom" || position === "center" || isObject(position)) {
        offset += padding.bottom;
        if (isArray(title.text)) {
          offset += font.lineHeight * (title.text.length - 1);
        }
      } else {
        offset += padding.top;
      }
      const { titleX, titleY, maxWidth, rotation } = titleArgs(this, offset, position, align);
      renderText(ctx, title.text, 0, 0, font, {
        color: title.color,
        maxWidth,
        rotation,
        textAlign: titleAlign(align, position, reverse),
        textBaseline: "middle",
        translation: [
          titleX,
          titleY
        ]
      });
    }
    draw(chartArea) {
      if (!this._isVisible()) {
        return;
      }
      this.drawBackground();
      this.drawGrid(chartArea);
      this.drawBorder();
      this.drawTitle();
      this.drawLabels(chartArea);
    }
    _layers() {
      const opts = this.options;
      const tz = opts.ticks && opts.ticks.z || 0;
      const gz = valueOrDefault(opts.grid && opts.grid.z, -1);
      const bz = valueOrDefault(opts.border && opts.border.z, 0);
      if (!this._isVisible() || this.draw !== _Scale.prototype.draw) {
        return [
          {
            z: tz,
            draw: (chartArea) => {
              this.draw(chartArea);
            }
          }
        ];
      }
      return [
        {
          z: gz,
          draw: (chartArea) => {
            this.drawBackground();
            this.drawGrid(chartArea);
            this.drawTitle();
          }
        },
        {
          z: bz,
          draw: () => {
            this.drawBorder();
          }
        },
        {
          z: tz,
          draw: (chartArea) => {
            this.drawLabels(chartArea);
          }
        }
      ];
    }
    getMatchingVisibleMetas(type) {
      const metas = this.chart.getSortedVisibleDatasetMetas();
      const axisID = this.axis + "AxisID";
      const result = [];
      let i2, ilen;
      for (i2 = 0, ilen = metas.length; i2 < ilen; ++i2) {
        const meta = metas[i2];
        if (meta[axisID] === this.id && (!type || meta.type === type)) {
          result.push(meta);
        }
      }
      return result;
    }
    _resolveTickFontOptions(index3) {
      const opts = this.options.ticks.setContext(this.getContext(index3));
      return toFont(opts.font);
    }
    _maxDigits() {
      const fontSize = this._resolveTickFontOptions(0).lineHeight;
      return (this.isHorizontal() ? this.width : this.height) / fontSize;
    }
  };
  var TypedRegistry = class {
    constructor(type, scope, override) {
      this.type = type;
      this.scope = scope;
      this.override = override;
      this.items = /* @__PURE__ */ Object.create(null);
    }
    isForType(type) {
      return Object.prototype.isPrototypeOf.call(this.type.prototype, type.prototype);
    }
    register(item) {
      const proto = Object.getPrototypeOf(item);
      let parentScope;
      if (isIChartComponent(proto)) {
        parentScope = this.register(proto);
      }
      const items = this.items;
      const id = item.id;
      const scope = this.scope + "." + id;
      if (!id) {
        throw new Error("class does not have id: " + item);
      }
      if (id in items) {
        return scope;
      }
      items[id] = item;
      registerDefaults(item, scope, parentScope);
      if (this.override) {
        defaults.override(item.id, item.overrides);
      }
      return scope;
    }
    get(id) {
      return this.items[id];
    }
    unregister(item) {
      const items = this.items;
      const id = item.id;
      const scope = this.scope;
      if (id in items) {
        delete items[id];
      }
      if (scope && id in defaults[scope]) {
        delete defaults[scope][id];
        if (this.override) {
          delete overrides[id];
        }
      }
    }
  };
  function registerDefaults(item, scope, parentScope) {
    const itemDefaults = merge(/* @__PURE__ */ Object.create(null), [
      parentScope ? defaults.get(parentScope) : {},
      defaults.get(scope),
      item.defaults
    ]);
    defaults.set(scope, itemDefaults);
    if (item.defaultRoutes) {
      routeDefaults(scope, item.defaultRoutes);
    }
    if (item.descriptors) {
      defaults.describe(scope, item.descriptors);
    }
  }
  function routeDefaults(scope, routes) {
    Object.keys(routes).forEach((property) => {
      const propertyParts = property.split(".");
      const sourceName = propertyParts.pop();
      const sourceScope = [
        scope
      ].concat(propertyParts).join(".");
      const parts = routes[property].split(".");
      const targetName = parts.pop();
      const targetScope = parts.join(".");
      defaults.route(sourceScope, sourceName, targetScope, targetName);
    });
  }
  function isIChartComponent(proto) {
    return "id" in proto && "defaults" in proto;
  }
  var Registry = class {
    constructor() {
      this.controllers = new TypedRegistry(DatasetController, "datasets", true);
      this.elements = new TypedRegistry(Element, "elements");
      this.plugins = new TypedRegistry(Object, "plugins");
      this.scales = new TypedRegistry(Scale, "scales");
      this._typedRegistries = [
        this.controllers,
        this.scales,
        this.elements
      ];
    }
    add(...args) {
      this._each("register", args);
    }
    remove(...args) {
      this._each("unregister", args);
    }
    addControllers(...args) {
      this._each("register", args, this.controllers);
    }
    addElements(...args) {
      this._each("register", args, this.elements);
    }
    addPlugins(...args) {
      this._each("register", args, this.plugins);
    }
    addScales(...args) {
      this._each("register", args, this.scales);
    }
    getController(id) {
      return this._get(id, this.controllers, "controller");
    }
    getElement(id) {
      return this._get(id, this.elements, "element");
    }
    getPlugin(id) {
      return this._get(id, this.plugins, "plugin");
    }
    getScale(id) {
      return this._get(id, this.scales, "scale");
    }
    removeControllers(...args) {
      this._each("unregister", args, this.controllers);
    }
    removeElements(...args) {
      this._each("unregister", args, this.elements);
    }
    removePlugins(...args) {
      this._each("unregister", args, this.plugins);
    }
    removeScales(...args) {
      this._each("unregister", args, this.scales);
    }
    _each(method, args, typedRegistry) {
      [
        ...args
      ].forEach((arg) => {
        const reg = typedRegistry || this._getRegistryForType(arg);
        if (typedRegistry || reg.isForType(arg) || reg === this.plugins && arg.id) {
          this._exec(method, reg, arg);
        } else {
          each(arg, (item) => {
            const itemReg = typedRegistry || this._getRegistryForType(item);
            this._exec(method, itemReg, item);
          });
        }
      });
    }
    _exec(method, registry2, component) {
      const camelMethod = _capitalize(method);
      callback(component["before" + camelMethod], [], component);
      registry2[method](component);
      callback(component["after" + camelMethod], [], component);
    }
    _getRegistryForType(type) {
      for (let i2 = 0; i2 < this._typedRegistries.length; i2++) {
        const reg = this._typedRegistries[i2];
        if (reg.isForType(type)) {
          return reg;
        }
      }
      return this.plugins;
    }
    _get(id, typedRegistry, type) {
      const item = typedRegistry.get(id);
      if (item === void 0) {
        throw new Error('"' + id + '" is not a registered ' + type + ".");
      }
      return item;
    }
  };
  var registry = /* @__PURE__ */ new Registry();
  var PluginService = class {
    constructor() {
      this._init = void 0;
    }
    notify(chart, hook, args, filter) {
      if (hook === "beforeInit") {
        this._init = this._createDescriptors(chart, true);
        this._notify(this._init, chart, "install");
      }
      if (this._init === void 0) {
        return;
      }
      const descriptors2 = filter ? this._descriptors(chart).filter(filter) : this._descriptors(chart);
      const result = this._notify(descriptors2, chart, hook, args);
      if (hook === "afterDestroy") {
        this._notify(descriptors2, chart, "stop");
        this._notify(this._init, chart, "uninstall");
        this._init = void 0;
      }
      return result;
    }
    _notify(descriptors2, chart, hook, args) {
      args = args || {};
      for (const descriptor of descriptors2) {
        const plugin = descriptor.plugin;
        const method = plugin[hook];
        const params = [
          chart,
          args,
          descriptor.options
        ];
        if (callback(method, params, plugin) === false && args.cancelable) {
          return false;
        }
      }
      return true;
    }
    invalidate() {
      if (!isNullOrUndef(this._cache)) {
        this._oldCache = this._cache;
        this._cache = void 0;
      }
    }
    _descriptors(chart) {
      if (this._cache) {
        return this._cache;
      }
      const descriptors2 = this._cache = this._createDescriptors(chart);
      this._notifyStateChanges(chart);
      return descriptors2;
    }
    _createDescriptors(chart, all) {
      const config = chart && chart.config;
      const options = valueOrDefault(config.options && config.options.plugins, {});
      const plugins = allPlugins(config);
      return options === false && !all ? [] : createDescriptors(chart, plugins, options, all);
    }
    _notifyStateChanges(chart) {
      const previousDescriptors = this._oldCache || [];
      const descriptors2 = this._cache;
      const diff = (a2, b2) => a2.filter((x2) => !b2.some((y2) => x2.plugin.id === y2.plugin.id));
      this._notify(diff(previousDescriptors, descriptors2), chart, "stop");
      this._notify(diff(descriptors2, previousDescriptors), chart, "start");
    }
  };
  function allPlugins(config) {
    const localIds = {};
    const plugins = [];
    const keys = Object.keys(registry.plugins.items);
    for (let i2 = 0; i2 < keys.length; i2++) {
      plugins.push(registry.getPlugin(keys[i2]));
    }
    const local = config.plugins || [];
    for (let i2 = 0; i2 < local.length; i2++) {
      const plugin = local[i2];
      if (plugins.indexOf(plugin) === -1) {
        plugins.push(plugin);
        localIds[plugin.id] = true;
      }
    }
    return {
      plugins,
      localIds
    };
  }
  function getOpts(options, all) {
    if (!all && options === false) {
      return null;
    }
    if (options === true) {
      return {};
    }
    return options;
  }
  function createDescriptors(chart, { plugins, localIds }, options, all) {
    const result = [];
    const context = chart.getContext();
    for (const plugin of plugins) {
      const id = plugin.id;
      const opts = getOpts(options[id], all);
      if (opts === null) {
        continue;
      }
      result.push({
        plugin,
        options: pluginOpts(chart.config, {
          plugin,
          local: localIds[id]
        }, opts, context)
      });
    }
    return result;
  }
  function pluginOpts(config, { plugin, local }, opts, context) {
    const keys = config.pluginScopeKeys(plugin);
    const scopes = config.getOptionScopes(opts, keys);
    if (local && plugin.defaults) {
      scopes.push(plugin.defaults);
    }
    return config.createResolver(scopes, context, [
      ""
    ], {
      scriptable: false,
      indexable: false,
      allKeys: true
    });
  }
  function getIndexAxis(type, options) {
    const datasetDefaults = defaults.datasets[type] || {};
    const datasetOptions = (options.datasets || {})[type] || {};
    return datasetOptions.indexAxis || options.indexAxis || datasetDefaults.indexAxis || "x";
  }
  function getAxisFromDefaultScaleID(id, indexAxis) {
    let axis = id;
    if (id === "_index_") {
      axis = indexAxis;
    } else if (id === "_value_") {
      axis = indexAxis === "x" ? "y" : "x";
    }
    return axis;
  }
  function getDefaultScaleIDFromAxis(axis, indexAxis) {
    return axis === indexAxis ? "_index_" : "_value_";
  }
  function idMatchesAxis(id) {
    if (id === "x" || id === "y" || id === "r") {
      return id;
    }
  }
  function axisFromPosition(position) {
    if (position === "top" || position === "bottom") {
      return "x";
    }
    if (position === "left" || position === "right") {
      return "y";
    }
  }
  function determineAxis(id, ...scaleOptions) {
    if (idMatchesAxis(id)) {
      return id;
    }
    for (const opts of scaleOptions) {
      const axis = opts.axis || axisFromPosition(opts.position) || id.length > 1 && idMatchesAxis(id[0].toLowerCase());
      if (axis) {
        return axis;
      }
    }
    throw new Error(`Cannot determine type of '${id}' axis. Please provide 'axis' or 'position' option.`);
  }
  function getAxisFromDataset(id, axis, dataset) {
    if (dataset[axis + "AxisID"] === id) {
      return {
        axis
      };
    }
  }
  function retrieveAxisFromDatasets(id, config) {
    if (config.data && config.data.datasets) {
      const boundDs = config.data.datasets.filter((d2) => d2.xAxisID === id || d2.yAxisID === id);
      if (boundDs.length) {
        return getAxisFromDataset(id, "x", boundDs[0]) || getAxisFromDataset(id, "y", boundDs[0]);
      }
    }
    return {};
  }
  function mergeScaleConfig(config, options) {
    const chartDefaults = overrides[config.type] || {
      scales: {}
    };
    const configScales = options.scales || {};
    const chartIndexAxis = getIndexAxis(config.type, options);
    const scales = /* @__PURE__ */ Object.create(null);
    Object.keys(configScales).forEach((id) => {
      const scaleConf = configScales[id];
      if (!isObject(scaleConf)) {
        return console.error(`Invalid scale configuration for scale: ${id}`);
      }
      if (scaleConf._proxy) {
        return console.warn(`Ignoring resolver passed as options for scale: ${id}`);
      }
      const axis = determineAxis(id, scaleConf, retrieveAxisFromDatasets(id, config), defaults.scales[scaleConf.type]);
      const defaultId = getDefaultScaleIDFromAxis(axis, chartIndexAxis);
      const defaultScaleOptions = chartDefaults.scales || {};
      scales[id] = mergeIf(/* @__PURE__ */ Object.create(null), [
        {
          axis
        },
        scaleConf,
        defaultScaleOptions[axis],
        defaultScaleOptions[defaultId]
      ]);
    });
    config.data.datasets.forEach((dataset) => {
      const type = dataset.type || config.type;
      const indexAxis = dataset.indexAxis || getIndexAxis(type, options);
      const datasetDefaults = overrides[type] || {};
      const defaultScaleOptions = datasetDefaults.scales || {};
      Object.keys(defaultScaleOptions).forEach((defaultID) => {
        const axis = getAxisFromDefaultScaleID(defaultID, indexAxis);
        const id = dataset[axis + "AxisID"] || axis;
        scales[id] = scales[id] || /* @__PURE__ */ Object.create(null);
        mergeIf(scales[id], [
          {
            axis
          },
          configScales[id],
          defaultScaleOptions[defaultID]
        ]);
      });
    });
    Object.keys(scales).forEach((key) => {
      const scale = scales[key];
      mergeIf(scale, [
        defaults.scales[scale.type],
        defaults.scale
      ]);
    });
    return scales;
  }
  function initOptions(config) {
    const options = config.options || (config.options = {});
    options.plugins = valueOrDefault(options.plugins, {});
    options.scales = mergeScaleConfig(config, options);
  }
  function initData(data) {
    data = data || {};
    data.datasets = data.datasets || [];
    data.labels = data.labels || [];
    return data;
  }
  function initConfig(config) {
    config = config || {};
    config.data = initData(config.data);
    initOptions(config);
    return config;
  }
  var keyCache = /* @__PURE__ */ new Map();
  var keysCached = /* @__PURE__ */ new Set();
  function cachedKeys(cacheKey2, generate) {
    let keys = keyCache.get(cacheKey2);
    if (!keys) {
      keys = generate();
      keyCache.set(cacheKey2, keys);
      keysCached.add(keys);
    }
    return keys;
  }
  var addIfFound = (set2, obj, key) => {
    const opts = resolveObjectKey(obj, key);
    if (opts !== void 0) {
      set2.add(opts);
    }
  };
  var Config = class {
    constructor(config) {
      this._config = initConfig(config);
      this._scopeCache = /* @__PURE__ */ new Map();
      this._resolverCache = /* @__PURE__ */ new Map();
    }
    get platform() {
      return this._config.platform;
    }
    get type() {
      return this._config.type;
    }
    set type(type) {
      this._config.type = type;
    }
    get data() {
      return this._config.data;
    }
    set data(data) {
      this._config.data = initData(data);
    }
    get options() {
      return this._config.options;
    }
    set options(options) {
      this._config.options = options;
    }
    get plugins() {
      return this._config.plugins;
    }
    update() {
      const config = this._config;
      this.clearCache();
      initOptions(config);
    }
    clearCache() {
      this._scopeCache.clear();
      this._resolverCache.clear();
    }
    datasetScopeKeys(datasetType) {
      return cachedKeys(datasetType, () => [
        [
          `datasets.${datasetType}`,
          ""
        ]
      ]);
    }
    datasetAnimationScopeKeys(datasetType, transition) {
      return cachedKeys(`${datasetType}.transition.${transition}`, () => [
        [
          `datasets.${datasetType}.transitions.${transition}`,
          `transitions.${transition}`
        ],
        [
          `datasets.${datasetType}`,
          ""
        ]
      ]);
    }
    datasetElementScopeKeys(datasetType, elementType) {
      return cachedKeys(`${datasetType}-${elementType}`, () => [
        [
          `datasets.${datasetType}.elements.${elementType}`,
          `datasets.${datasetType}`,
          `elements.${elementType}`,
          ""
        ]
      ]);
    }
    pluginScopeKeys(plugin) {
      const id = plugin.id;
      const type = this.type;
      return cachedKeys(`${type}-plugin-${id}`, () => [
        [
          `plugins.${id}`,
          ...plugin.additionalOptionScopes || []
        ]
      ]);
    }
    _cachedScopes(mainScope, resetCache) {
      const _scopeCache = this._scopeCache;
      let cache2 = _scopeCache.get(mainScope);
      if (!cache2 || resetCache) {
        cache2 = /* @__PURE__ */ new Map();
        _scopeCache.set(mainScope, cache2);
      }
      return cache2;
    }
    getOptionScopes(mainScope, keyLists, resetCache) {
      const { options, type } = this;
      const cache2 = this._cachedScopes(mainScope, resetCache);
      const cached = cache2.get(keyLists);
      if (cached) {
        return cached;
      }
      const scopes = /* @__PURE__ */ new Set();
      keyLists.forEach((keys) => {
        if (mainScope) {
          scopes.add(mainScope);
          keys.forEach((key) => addIfFound(scopes, mainScope, key));
        }
        keys.forEach((key) => addIfFound(scopes, options, key));
        keys.forEach((key) => addIfFound(scopes, overrides[type] || {}, key));
        keys.forEach((key) => addIfFound(scopes, defaults, key));
        keys.forEach((key) => addIfFound(scopes, descriptors, key));
      });
      const array = Array.from(scopes);
      if (array.length === 0) {
        array.push(/* @__PURE__ */ Object.create(null));
      }
      if (keysCached.has(keyLists)) {
        cache2.set(keyLists, array);
      }
      return array;
    }
    chartOptionScopes() {
      const { options, type } = this;
      return [
        options,
        overrides[type] || {},
        defaults.datasets[type] || {},
        {
          type
        },
        defaults,
        descriptors
      ];
    }
    resolveNamedOptions(scopes, names2, context, prefixes = [
      ""
    ]) {
      const result = {
        $shared: true
      };
      const { resolver, subPrefixes } = getResolver(this._resolverCache, scopes, prefixes);
      let options = resolver;
      if (needContext(resolver, names2)) {
        result.$shared = false;
        context = isFunction(context) ? context() : context;
        const subResolver = this.createResolver(scopes, context, subPrefixes);
        options = _attachContext(resolver, context, subResolver);
      }
      for (const prop of names2) {
        result[prop] = options[prop];
      }
      return result;
    }
    createResolver(scopes, context, prefixes = [
      ""
    ], descriptorDefaults) {
      const { resolver } = getResolver(this._resolverCache, scopes, prefixes);
      return isObject(context) ? _attachContext(resolver, context, void 0, descriptorDefaults) : resolver;
    }
  };
  function getResolver(resolverCache, scopes, prefixes) {
    let cache2 = resolverCache.get(scopes);
    if (!cache2) {
      cache2 = /* @__PURE__ */ new Map();
      resolverCache.set(scopes, cache2);
    }
    const cacheKey2 = prefixes.join();
    let cached = cache2.get(cacheKey2);
    if (!cached) {
      const resolver = _createResolver(scopes, prefixes);
      cached = {
        resolver,
        subPrefixes: prefixes.filter((p2) => !p2.toLowerCase().includes("hover"))
      };
      cache2.set(cacheKey2, cached);
    }
    return cached;
  }
  var hasFunction = (value) => isObject(value) && Object.getOwnPropertyNames(value).some((key) => isFunction(value[key]));
  function needContext(proxy, names2) {
    const { isScriptable, isIndexable } = _descriptors(proxy);
    for (const prop of names2) {
      const scriptable = isScriptable(prop);
      const indexable = isIndexable(prop);
      const value = (indexable || scriptable) && proxy[prop];
      if (scriptable && (isFunction(value) || hasFunction(value)) || indexable && isArray(value)) {
        return true;
      }
    }
    return false;
  }
  var version = "4.5.1";
  var KNOWN_POSITIONS = [
    "top",
    "bottom",
    "left",
    "right",
    "chartArea"
  ];
  function positionIsHorizontal(position, axis) {
    return position === "top" || position === "bottom" || KNOWN_POSITIONS.indexOf(position) === -1 && axis === "x";
  }
  function compare2Level(l1, l2) {
    return function(a2, b2) {
      return a2[l1] === b2[l1] ? a2[l2] - b2[l2] : a2[l1] - b2[l1];
    };
  }
  function onAnimationsComplete(context) {
    const chart = context.chart;
    const animationOptions = chart.options.animation;
    chart.notifyPlugins("afterRender");
    callback(animationOptions && animationOptions.onComplete, [
      context
    ], chart);
  }
  function onAnimationProgress(context) {
    const chart = context.chart;
    const animationOptions = chart.options.animation;
    callback(animationOptions && animationOptions.onProgress, [
      context
    ], chart);
  }
  function getCanvas(item) {
    if (_isDomSupported() && typeof item === "string") {
      item = document.getElementById(item);
    } else if (item && item.length) {
      item = item[0];
    }
    if (item && item.canvas) {
      item = item.canvas;
    }
    return item;
  }
  var instances = {};
  var getChart = (key) => {
    const canvas = getCanvas(key);
    return Object.values(instances).filter((c2) => c2.canvas === canvas).pop();
  };
  function moveNumericKeys(obj, start, move) {
    const keys = Object.keys(obj);
    for (const key of keys) {
      const intKey = +key;
      if (intKey >= start) {
        const value = obj[key];
        delete obj[key];
        if (move > 0 || intKey > start) {
          obj[intKey + move] = value;
        }
      }
    }
  }
  function determineLastEvent(e2, lastEvent, inChartArea, isClick) {
    if (!inChartArea || e2.type === "mouseout") {
      return null;
    }
    if (isClick) {
      return lastEvent;
    }
    return e2;
  }
  var Chart = class {
    static defaults = defaults;
    static instances = instances;
    static overrides = overrides;
    static registry = registry;
    static version = version;
    static getChart = getChart;
    static register(...items) {
      registry.add(...items);
      invalidatePlugins();
    }
    static unregister(...items) {
      registry.remove(...items);
      invalidatePlugins();
    }
    constructor(item, userConfig) {
      const config = this.config = new Config(userConfig);
      const initialCanvas = getCanvas(item);
      const existingChart = getChart(initialCanvas);
      if (existingChart) {
        throw new Error("Canvas is already in use. Chart with ID '" + existingChart.id + "' must be destroyed before the canvas with ID '" + existingChart.canvas.id + "' can be reused.");
      }
      const options = config.createResolver(config.chartOptionScopes(), this.getContext());
      this.platform = new (config.platform || _detectPlatform(initialCanvas))();
      this.platform.updateConfig(config);
      const context = this.platform.acquireContext(initialCanvas, options.aspectRatio);
      const canvas = context && context.canvas;
      const height = canvas && canvas.height;
      const width = canvas && canvas.width;
      this.id = uid();
      this.ctx = context;
      this.canvas = canvas;
      this.width = width;
      this.height = height;
      this._options = options;
      this._aspectRatio = this.aspectRatio;
      this._layers = [];
      this._metasets = [];
      this._stacks = void 0;
      this.boxes = [];
      this.currentDevicePixelRatio = void 0;
      this.chartArea = void 0;
      this._active = [];
      this._lastEvent = void 0;
      this._listeners = {};
      this._responsiveListeners = void 0;
      this._sortedMetasets = [];
      this.scales = {};
      this._plugins = new PluginService();
      this.$proxies = {};
      this._hiddenIndices = {};
      this.attached = false;
      this._animationsDisabled = void 0;
      this.$context = void 0;
      this._doResize = debounce((mode) => this.update(mode), options.resizeDelay || 0);
      this._dataChanges = [];
      instances[this.id] = this;
      if (!context || !canvas) {
        console.error("Failed to create chart: can't acquire context from the given item");
        return;
      }
      animator.listen(this, "complete", onAnimationsComplete);
      animator.listen(this, "progress", onAnimationProgress);
      this._initialize();
      if (this.attached) {
        this.update();
      }
    }
    get aspectRatio() {
      const { options: { aspectRatio, maintainAspectRatio }, width, height, _aspectRatio } = this;
      if (!isNullOrUndef(aspectRatio)) {
        return aspectRatio;
      }
      if (maintainAspectRatio && _aspectRatio) {
        return _aspectRatio;
      }
      return height ? width / height : null;
    }
    get data() {
      return this.config.data;
    }
    set data(data) {
      this.config.data = data;
    }
    get options() {
      return this._options;
    }
    set options(options) {
      this.config.options = options;
    }
    get registry() {
      return registry;
    }
    _initialize() {
      this.notifyPlugins("beforeInit");
      if (this.options.responsive) {
        this.resize();
      } else {
        retinaScale(this, this.options.devicePixelRatio);
      }
      this.bindEvents();
      this.notifyPlugins("afterInit");
      return this;
    }
    clear() {
      clearCanvas(this.canvas, this.ctx);
      return this;
    }
    stop() {
      animator.stop(this);
      return this;
    }
    resize(width, height) {
      if (!animator.running(this)) {
        this._resize(width, height);
      } else {
        this._resizeBeforeDraw = {
          width,
          height
        };
      }
    }
    _resize(width, height) {
      const options = this.options;
      const canvas = this.canvas;
      const aspectRatio = options.maintainAspectRatio && this.aspectRatio;
      const newSize = this.platform.getMaximumSize(canvas, width, height, aspectRatio);
      const newRatio = options.devicePixelRatio || this.platform.getDevicePixelRatio();
      const mode = this.width ? "resize" : "attach";
      this.width = newSize.width;
      this.height = newSize.height;
      this._aspectRatio = this.aspectRatio;
      if (!retinaScale(this, newRatio, true)) {
        return;
      }
      this.notifyPlugins("resize", {
        size: newSize
      });
      callback(options.onResize, [
        this,
        newSize
      ], this);
      if (this.attached) {
        if (this._doResize(mode)) {
          this.render();
        }
      }
    }
    ensureScalesHaveIDs() {
      const options = this.options;
      const scalesOptions = options.scales || {};
      each(scalesOptions, (axisOptions, axisID) => {
        axisOptions.id = axisID;
      });
    }
    buildOrUpdateScales() {
      const options = this.options;
      const scaleOpts = options.scales;
      const scales = this.scales;
      const updated = Object.keys(scales).reduce((obj, id) => {
        obj[id] = false;
        return obj;
      }, {});
      let items = [];
      if (scaleOpts) {
        items = items.concat(Object.keys(scaleOpts).map((id) => {
          const scaleOptions = scaleOpts[id];
          const axis = determineAxis(id, scaleOptions);
          const isRadial = axis === "r";
          const isHorizontal = axis === "x";
          return {
            options: scaleOptions,
            dposition: isRadial ? "chartArea" : isHorizontal ? "bottom" : "left",
            dtype: isRadial ? "radialLinear" : isHorizontal ? "category" : "linear"
          };
        }));
      }
      each(items, (item) => {
        const scaleOptions = item.options;
        const id = scaleOptions.id;
        const axis = determineAxis(id, scaleOptions);
        const scaleType = valueOrDefault(scaleOptions.type, item.dtype);
        if (scaleOptions.position === void 0 || positionIsHorizontal(scaleOptions.position, axis) !== positionIsHorizontal(item.dposition)) {
          scaleOptions.position = item.dposition;
        }
        updated[id] = true;
        let scale = null;
        if (id in scales && scales[id].type === scaleType) {
          scale = scales[id];
        } else {
          const scaleClass = registry.getScale(scaleType);
          scale = new scaleClass({
            id,
            type: scaleType,
            ctx: this.ctx,
            chart: this
          });
          scales[scale.id] = scale;
        }
        scale.init(scaleOptions, options);
      });
      each(updated, (hasUpdated, id) => {
        if (!hasUpdated) {
          delete scales[id];
        }
      });
      each(scales, (scale) => {
        layouts.configure(this, scale, scale.options);
        layouts.addBox(this, scale);
      });
    }
    _updateMetasets() {
      const metasets = this._metasets;
      const numData = this.data.datasets.length;
      const numMeta = metasets.length;
      metasets.sort((a2, b2) => a2.index - b2.index);
      if (numMeta > numData) {
        for (let i2 = numData; i2 < numMeta; ++i2) {
          this._destroyDatasetMeta(i2);
        }
        metasets.splice(numData, numMeta - numData);
      }
      this._sortedMetasets = metasets.slice(0).sort(compare2Level("order", "index"));
    }
    _removeUnreferencedMetasets() {
      const { _metasets: metasets, data: { datasets } } = this;
      if (metasets.length > datasets.length) {
        delete this._stacks;
      }
      metasets.forEach((meta, index3) => {
        if (datasets.filter((x2) => x2 === meta._dataset).length === 0) {
          this._destroyDatasetMeta(index3);
        }
      });
    }
    buildOrUpdateControllers() {
      const newControllers = [];
      const datasets = this.data.datasets;
      let i2, ilen;
      this._removeUnreferencedMetasets();
      for (i2 = 0, ilen = datasets.length; i2 < ilen; i2++) {
        const dataset = datasets[i2];
        let meta = this.getDatasetMeta(i2);
        const type = dataset.type || this.config.type;
        if (meta.type && meta.type !== type) {
          this._destroyDatasetMeta(i2);
          meta = this.getDatasetMeta(i2);
        }
        meta.type = type;
        meta.indexAxis = dataset.indexAxis || getIndexAxis(type, this.options);
        meta.order = dataset.order || 0;
        meta.index = i2;
        meta.label = "" + dataset.label;
        meta.visible = this.isDatasetVisible(i2);
        if (meta.controller) {
          meta.controller.updateIndex(i2);
          meta.controller.linkScales();
        } else {
          const ControllerClass = registry.getController(type);
          const { datasetElementType, dataElementType } = defaults.datasets[type];
          Object.assign(ControllerClass, {
            dataElementType: registry.getElement(dataElementType),
            datasetElementType: datasetElementType && registry.getElement(datasetElementType)
          });
          meta.controller = new ControllerClass(this, i2);
          newControllers.push(meta.controller);
        }
      }
      this._updateMetasets();
      return newControllers;
    }
    _resetElements() {
      each(this.data.datasets, (dataset, datasetIndex) => {
        this.getDatasetMeta(datasetIndex).controller.reset();
      }, this);
    }
    reset() {
      this._resetElements();
      this.notifyPlugins("reset");
    }
    update(mode) {
      const config = this.config;
      config.update();
      const options = this._options = config.createResolver(config.chartOptionScopes(), this.getContext());
      const animsDisabled = this._animationsDisabled = !options.animation;
      this._updateScales();
      this._checkEventBindings();
      this._updateHiddenIndices();
      this._plugins.invalidate();
      if (this.notifyPlugins("beforeUpdate", {
        mode,
        cancelable: true
      }) === false) {
        return;
      }
      const newControllers = this.buildOrUpdateControllers();
      this.notifyPlugins("beforeElementsUpdate");
      let minPadding = 0;
      for (let i2 = 0, ilen = this.data.datasets.length; i2 < ilen; i2++) {
        const { controller } = this.getDatasetMeta(i2);
        const reset = !animsDisabled && newControllers.indexOf(controller) === -1;
        controller.buildOrUpdateElements(reset);
        minPadding = Math.max(+controller.getMaxOverflow(), minPadding);
      }
      minPadding = this._minPadding = options.layout.autoPadding ? minPadding : 0;
      this._updateLayout(minPadding);
      if (!animsDisabled) {
        each(newControllers, (controller) => {
          controller.reset();
        });
      }
      this._updateDatasets(mode);
      this.notifyPlugins("afterUpdate", {
        mode
      });
      this._layers.sort(compare2Level("z", "_idx"));
      const { _active, _lastEvent } = this;
      if (_lastEvent) {
        this._eventHandler(_lastEvent, true);
      } else if (_active.length) {
        this._updateHoverStyles(_active, _active, true);
      }
      this.render();
    }
    _updateScales() {
      each(this.scales, (scale) => {
        layouts.removeBox(this, scale);
      });
      this.ensureScalesHaveIDs();
      this.buildOrUpdateScales();
    }
    _checkEventBindings() {
      const options = this.options;
      const existingEvents = new Set(Object.keys(this._listeners));
      const newEvents = new Set(options.events);
      if (!setsEqual(existingEvents, newEvents) || !!this._responsiveListeners !== options.responsive) {
        this.unbindEvents();
        this.bindEvents();
      }
    }
    _updateHiddenIndices() {
      const { _hiddenIndices } = this;
      const changes = this._getUniformDataChanges() || [];
      for (const { method, start, count } of changes) {
        const move = method === "_removeElements" ? -count : count;
        moveNumericKeys(_hiddenIndices, start, move);
      }
    }
    _getUniformDataChanges() {
      const _dataChanges = this._dataChanges;
      if (!_dataChanges || !_dataChanges.length) {
        return;
      }
      this._dataChanges = [];
      const datasetCount = this.data.datasets.length;
      const makeSet = (idx) => new Set(_dataChanges.filter((c2) => c2[0] === idx).map((c2, i2) => i2 + "," + c2.splice(1).join(",")));
      const changeSet = makeSet(0);
      for (let i2 = 1; i2 < datasetCount; i2++) {
        if (!setsEqual(changeSet, makeSet(i2))) {
          return;
        }
      }
      return Array.from(changeSet).map((c2) => c2.split(",")).map((a2) => ({
        method: a2[1],
        start: +a2[2],
        count: +a2[3]
      }));
    }
    _updateLayout(minPadding) {
      if (this.notifyPlugins("beforeLayout", {
        cancelable: true
      }) === false) {
        return;
      }
      layouts.update(this, this.width, this.height, minPadding);
      const area = this.chartArea;
      const noArea = area.width <= 0 || area.height <= 0;
      this._layers = [];
      each(this.boxes, (box) => {
        if (noArea && box.position === "chartArea") {
          return;
        }
        if (box.configure) {
          box.configure();
        }
        this._layers.push(...box._layers());
      }, this);
      this._layers.forEach((item, index3) => {
        item._idx = index3;
      });
      this.notifyPlugins("afterLayout");
    }
    _updateDatasets(mode) {
      if (this.notifyPlugins("beforeDatasetsUpdate", {
        mode,
        cancelable: true
      }) === false) {
        return;
      }
      for (let i2 = 0, ilen = this.data.datasets.length; i2 < ilen; ++i2) {
        this.getDatasetMeta(i2).controller.configure();
      }
      for (let i2 = 0, ilen = this.data.datasets.length; i2 < ilen; ++i2) {
        this._updateDataset(i2, isFunction(mode) ? mode({
          datasetIndex: i2
        }) : mode);
      }
      this.notifyPlugins("afterDatasetsUpdate", {
        mode
      });
    }
    _updateDataset(index3, mode) {
      const meta = this.getDatasetMeta(index3);
      const args = {
        meta,
        index: index3,
        mode,
        cancelable: true
      };
      if (this.notifyPlugins("beforeDatasetUpdate", args) === false) {
        return;
      }
      meta.controller._update(mode);
      args.cancelable = false;
      this.notifyPlugins("afterDatasetUpdate", args);
    }
    render() {
      if (this.notifyPlugins("beforeRender", {
        cancelable: true
      }) === false) {
        return;
      }
      if (animator.has(this)) {
        if (this.attached && !animator.running(this)) {
          animator.start(this);
        }
      } else {
        this.draw();
        onAnimationsComplete({
          chart: this
        });
      }
    }
    draw() {
      let i2;
      if (this._resizeBeforeDraw) {
        const { width, height } = this._resizeBeforeDraw;
        this._resizeBeforeDraw = null;
        this._resize(width, height);
      }
      this.clear();
      if (this.width <= 0 || this.height <= 0) {
        return;
      }
      if (this.notifyPlugins("beforeDraw", {
        cancelable: true
      }) === false) {
        return;
      }
      const layers = this._layers;
      for (i2 = 0; i2 < layers.length && layers[i2].z <= 0; ++i2) {
        layers[i2].draw(this.chartArea);
      }
      this._drawDatasets();
      for (; i2 < layers.length; ++i2) {
        layers[i2].draw(this.chartArea);
      }
      this.notifyPlugins("afterDraw");
    }
    _getSortedDatasetMetas(filterVisible) {
      const metasets = this._sortedMetasets;
      const result = [];
      let i2, ilen;
      for (i2 = 0, ilen = metasets.length; i2 < ilen; ++i2) {
        const meta = metasets[i2];
        if (!filterVisible || meta.visible) {
          result.push(meta);
        }
      }
      return result;
    }
    getSortedVisibleDatasetMetas() {
      return this._getSortedDatasetMetas(true);
    }
    _drawDatasets() {
      if (this.notifyPlugins("beforeDatasetsDraw", {
        cancelable: true
      }) === false) {
        return;
      }
      const metasets = this.getSortedVisibleDatasetMetas();
      for (let i2 = metasets.length - 1; i2 >= 0; --i2) {
        this._drawDataset(metasets[i2]);
      }
      this.notifyPlugins("afterDatasetsDraw");
    }
    _drawDataset(meta) {
      const ctx = this.ctx;
      const args = {
        meta,
        index: meta.index,
        cancelable: true
      };
      const clip = getDatasetClipArea(this, meta);
      if (this.notifyPlugins("beforeDatasetDraw", args) === false) {
        return;
      }
      if (clip) {
        clipArea(ctx, clip);
      }
      meta.controller.draw();
      if (clip) {
        unclipArea(ctx);
      }
      args.cancelable = false;
      this.notifyPlugins("afterDatasetDraw", args);
    }
    isPointInArea(point) {
      return _isPointInArea(point, this.chartArea, this._minPadding);
    }
    getElementsAtEventForMode(e2, mode, options, useFinalPosition) {
      const method = Interaction.modes[mode];
      if (typeof method === "function") {
        return method(this, e2, options, useFinalPosition);
      }
      return [];
    }
    getDatasetMeta(datasetIndex) {
      const dataset = this.data.datasets[datasetIndex];
      const metasets = this._metasets;
      let meta = metasets.filter((x2) => x2 && x2._dataset === dataset).pop();
      if (!meta) {
        meta = {
          type: null,
          data: [],
          dataset: null,
          controller: null,
          hidden: null,
          xAxisID: null,
          yAxisID: null,
          order: dataset && dataset.order || 0,
          index: datasetIndex,
          _dataset: dataset,
          _parsed: [],
          _sorted: false
        };
        metasets.push(meta);
      }
      return meta;
    }
    getContext() {
      return this.$context || (this.$context = createContext(null, {
        chart: this,
        type: "chart"
      }));
    }
    getVisibleDatasetCount() {
      return this.getSortedVisibleDatasetMetas().length;
    }
    isDatasetVisible(datasetIndex) {
      const dataset = this.data.datasets[datasetIndex];
      if (!dataset) {
        return false;
      }
      const meta = this.getDatasetMeta(datasetIndex);
      return typeof meta.hidden === "boolean" ? !meta.hidden : !dataset.hidden;
    }
    setDatasetVisibility(datasetIndex, visible) {
      const meta = this.getDatasetMeta(datasetIndex);
      meta.hidden = !visible;
    }
    toggleDataVisibility(index3) {
      this._hiddenIndices[index3] = !this._hiddenIndices[index3];
    }
    getDataVisibility(index3) {
      return !this._hiddenIndices[index3];
    }
    _updateVisibility(datasetIndex, dataIndex, visible) {
      const mode = visible ? "show" : "hide";
      const meta = this.getDatasetMeta(datasetIndex);
      const anims = meta.controller._resolveAnimations(void 0, mode);
      if (defined(dataIndex)) {
        meta.data[dataIndex].hidden = !visible;
        this.update();
      } else {
        this.setDatasetVisibility(datasetIndex, visible);
        anims.update(meta, {
          visible
        });
        this.update((ctx) => ctx.datasetIndex === datasetIndex ? mode : void 0);
      }
    }
    hide(datasetIndex, dataIndex) {
      this._updateVisibility(datasetIndex, dataIndex, false);
    }
    show(datasetIndex, dataIndex) {
      this._updateVisibility(datasetIndex, dataIndex, true);
    }
    _destroyDatasetMeta(datasetIndex) {
      const meta = this._metasets[datasetIndex];
      if (meta && meta.controller) {
        meta.controller._destroy();
      }
      delete this._metasets[datasetIndex];
    }
    _stop() {
      let i2, ilen;
      this.stop();
      animator.remove(this);
      for (i2 = 0, ilen = this.data.datasets.length; i2 < ilen; ++i2) {
        this._destroyDatasetMeta(i2);
      }
    }
    destroy() {
      this.notifyPlugins("beforeDestroy");
      const { canvas, ctx } = this;
      this._stop();
      this.config.clearCache();
      if (canvas) {
        this.unbindEvents();
        clearCanvas(canvas, ctx);
        this.platform.releaseContext(ctx);
        this.canvas = null;
        this.ctx = null;
      }
      delete instances[this.id];
      this.notifyPlugins("afterDestroy");
    }
    toBase64Image(...args) {
      return this.canvas.toDataURL(...args);
    }
    bindEvents() {
      this.bindUserEvents();
      if (this.options.responsive) {
        this.bindResponsiveEvents();
      } else {
        this.attached = true;
      }
    }
    bindUserEvents() {
      const listeners = this._listeners;
      const platform = this.platform;
      const _add = (type, listener2) => {
        platform.addEventListener(this, type, listener2);
        listeners[type] = listener2;
      };
      const listener = (e2, x2, y2) => {
        e2.offsetX = x2;
        e2.offsetY = y2;
        this._eventHandler(e2);
      };
      each(this.options.events, (type) => _add(type, listener));
    }
    bindResponsiveEvents() {
      if (!this._responsiveListeners) {
        this._responsiveListeners = {};
      }
      const listeners = this._responsiveListeners;
      const platform = this.platform;
      const _add = (type, listener2) => {
        platform.addEventListener(this, type, listener2);
        listeners[type] = listener2;
      };
      const _remove = (type, listener2) => {
        if (listeners[type]) {
          platform.removeEventListener(this, type, listener2);
          delete listeners[type];
        }
      };
      const listener = (width, height) => {
        if (this.canvas) {
          this.resize(width, height);
        }
      };
      let detached;
      const attached = () => {
        _remove("attach", attached);
        this.attached = true;
        this.resize();
        _add("resize", listener);
        _add("detach", detached);
      };
      detached = () => {
        this.attached = false;
        _remove("resize", listener);
        this._stop();
        this._resize(0, 0);
        _add("attach", attached);
      };
      if (platform.isAttached(this.canvas)) {
        attached();
      } else {
        detached();
      }
    }
    unbindEvents() {
      each(this._listeners, (listener, type) => {
        this.platform.removeEventListener(this, type, listener);
      });
      this._listeners = {};
      each(this._responsiveListeners, (listener, type) => {
        this.platform.removeEventListener(this, type, listener);
      });
      this._responsiveListeners = void 0;
    }
    updateHoverStyle(items, mode, enabled) {
      const prefix = enabled ? "set" : "remove";
      let meta, item, i2, ilen;
      if (mode === "dataset") {
        meta = this.getDatasetMeta(items[0].datasetIndex);
        meta.controller["_" + prefix + "DatasetHoverStyle"]();
      }
      for (i2 = 0, ilen = items.length; i2 < ilen; ++i2) {
        item = items[i2];
        const controller = item && this.getDatasetMeta(item.datasetIndex).controller;
        if (controller) {
          controller[prefix + "HoverStyle"](item.element, item.datasetIndex, item.index);
        }
      }
    }
    getActiveElements() {
      return this._active || [];
    }
    setActiveElements(activeElements) {
      const lastActive = this._active || [];
      const active = activeElements.map(({ datasetIndex, index: index3 }) => {
        const meta = this.getDatasetMeta(datasetIndex);
        if (!meta) {
          throw new Error("No dataset found at index " + datasetIndex);
        }
        return {
          datasetIndex,
          element: meta.data[index3],
          index: index3
        };
      });
      const changed = !_elementsEqual(active, lastActive);
      if (changed) {
        this._active = active;
        this._lastEvent = null;
        this._updateHoverStyles(active, lastActive);
      }
    }
    notifyPlugins(hook, args, filter) {
      return this._plugins.notify(this, hook, args, filter);
    }
    isPluginEnabled(pluginId) {
      return this._plugins._cache.filter((p2) => p2.plugin.id === pluginId).length === 1;
    }
    _updateHoverStyles(active, lastActive, replay) {
      const hoverOptions = this.options.hover;
      const diff = (a2, b2) => a2.filter((x2) => !b2.some((y2) => x2.datasetIndex === y2.datasetIndex && x2.index === y2.index));
      const deactivated = diff(lastActive, active);
      const activated = replay ? active : diff(active, lastActive);
      if (deactivated.length) {
        this.updateHoverStyle(deactivated, hoverOptions.mode, false);
      }
      if (activated.length && hoverOptions.mode) {
        this.updateHoverStyle(activated, hoverOptions.mode, true);
      }
    }
    _eventHandler(e2, replay) {
      const args = {
        event: e2,
        replay,
        cancelable: true,
        inChartArea: this.isPointInArea(e2)
      };
      const eventFilter = (plugin) => (plugin.options.events || this.options.events).includes(e2.native.type);
      if (this.notifyPlugins("beforeEvent", args, eventFilter) === false) {
        return;
      }
      const changed = this._handleEvent(e2, replay, args.inChartArea);
      args.cancelable = false;
      this.notifyPlugins("afterEvent", args, eventFilter);
      if (changed || args.changed) {
        this.render();
      }
      return this;
    }
    _handleEvent(e2, replay, inChartArea) {
      const { _active: lastActive = [], options } = this;
      const useFinalPosition = replay;
      const active = this._getActiveElements(e2, lastActive, inChartArea, useFinalPosition);
      const isClick = _isClickEvent(e2);
      const lastEvent = determineLastEvent(e2, this._lastEvent, inChartArea, isClick);
      if (inChartArea) {
        this._lastEvent = null;
        callback(options.onHover, [
          e2,
          active,
          this
        ], this);
        if (isClick) {
          callback(options.onClick, [
            e2,
            active,
            this
          ], this);
        }
      }
      const changed = !_elementsEqual(active, lastActive);
      if (changed || replay) {
        this._active = active;
        this._updateHoverStyles(active, lastActive, replay);
      }
      this._lastEvent = lastEvent;
      return changed;
    }
    _getActiveElements(e2, lastActive, inChartArea, useFinalPosition) {
      if (e2.type === "mouseout") {
        return [];
      }
      if (!inChartArea) {
        return lastActive;
      }
      const hoverOptions = this.options.hover;
      return this.getElementsAtEventForMode(e2, hoverOptions.mode, hoverOptions, useFinalPosition);
    }
  };
  function invalidatePlugins() {
    return each(Chart.instances, (chart) => chart._plugins.invalidate());
  }
  function clipSelf(ctx, element, endAngle) {
    const { startAngle, x: x2, y: y2, outerRadius, innerRadius, options } = element;
    const { borderWidth, borderJoinStyle } = options;
    const outerAngleClip = Math.min(borderWidth / outerRadius, _normalizeAngle(startAngle - endAngle));
    ctx.beginPath();
    ctx.arc(x2, y2, outerRadius - borderWidth / 2, startAngle + outerAngleClip / 2, endAngle - outerAngleClip / 2);
    if (innerRadius > 0) {
      const innerAngleClip = Math.min(borderWidth / innerRadius, _normalizeAngle(startAngle - endAngle));
      ctx.arc(x2, y2, innerRadius + borderWidth / 2, endAngle - innerAngleClip / 2, startAngle + innerAngleClip / 2, true);
    } else {
      const clipWidth = Math.min(borderWidth / 2, outerRadius * _normalizeAngle(startAngle - endAngle));
      if (borderJoinStyle === "round") {
        ctx.arc(x2, y2, clipWidth, endAngle - PI / 2, startAngle + PI / 2, true);
      } else if (borderJoinStyle === "bevel") {
        const r2 = 2 * clipWidth * clipWidth;
        const endX = -r2 * Math.cos(endAngle + PI / 2) + x2;
        const endY = -r2 * Math.sin(endAngle + PI / 2) + y2;
        const startX = r2 * Math.cos(startAngle + PI / 2) + x2;
        const startY = r2 * Math.sin(startAngle + PI / 2) + y2;
        ctx.lineTo(endX, endY);
        ctx.lineTo(startX, startY);
      }
    }
    ctx.closePath();
    ctx.moveTo(0, 0);
    ctx.rect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.clip("evenodd");
  }
  function clipArc(ctx, element, endAngle) {
    const { startAngle, pixelMargin, x: x2, y: y2, outerRadius, innerRadius } = element;
    let angleMargin = pixelMargin / outerRadius;
    ctx.beginPath();
    ctx.arc(x2, y2, outerRadius, startAngle - angleMargin, endAngle + angleMargin);
    if (innerRadius > pixelMargin) {
      angleMargin = pixelMargin / innerRadius;
      ctx.arc(x2, y2, innerRadius, endAngle + angleMargin, startAngle - angleMargin, true);
    } else {
      ctx.arc(x2, y2, pixelMargin, endAngle + HALF_PI, startAngle - HALF_PI);
    }
    ctx.closePath();
    ctx.clip();
  }
  function toRadiusCorners(value) {
    return _readValueToProps(value, [
      "outerStart",
      "outerEnd",
      "innerStart",
      "innerEnd"
    ]);
  }
  function parseBorderRadius$1(arc, innerRadius, outerRadius, angleDelta) {
    const o2 = toRadiusCorners(arc.options.borderRadius);
    const halfThickness = (outerRadius - innerRadius) / 2;
    const innerLimit = Math.min(halfThickness, angleDelta * innerRadius / 2);
    const computeOuterLimit = (val) => {
      const outerArcLimit = (outerRadius - Math.min(halfThickness, val)) * angleDelta / 2;
      return _limitValue(val, 0, Math.min(halfThickness, outerArcLimit));
    };
    return {
      outerStart: computeOuterLimit(o2.outerStart),
      outerEnd: computeOuterLimit(o2.outerEnd),
      innerStart: _limitValue(o2.innerStart, 0, innerLimit),
      innerEnd: _limitValue(o2.innerEnd, 0, innerLimit)
    };
  }
  function rThetaToXY(r2, theta, x2, y2) {
    return {
      x: x2 + r2 * Math.cos(theta),
      y: y2 + r2 * Math.sin(theta)
    };
  }
  function pathArc(ctx, element, offset, spacing, end, circular) {
    const { x: x2, y: y2, startAngle: start, pixelMargin, innerRadius: innerR } = element;
    const outerRadius = Math.max(element.outerRadius + spacing + offset - pixelMargin, 0);
    const innerRadius = innerR > 0 ? innerR + spacing + offset + pixelMargin : 0;
    let spacingOffset = 0;
    const alpha2 = end - start;
    if (spacing) {
      const noSpacingInnerRadius = innerR > 0 ? innerR - spacing : 0;
      const noSpacingOuterRadius = outerRadius > 0 ? outerRadius - spacing : 0;
      const avNogSpacingRadius = (noSpacingInnerRadius + noSpacingOuterRadius) / 2;
      const adjustedAngle = avNogSpacingRadius !== 0 ? alpha2 * avNogSpacingRadius / (avNogSpacingRadius + spacing) : alpha2;
      spacingOffset = (alpha2 - adjustedAngle) / 2;
    }
    const beta = Math.max(1e-3, alpha2 * outerRadius - offset / PI) / outerRadius;
    const angleOffset = (alpha2 - beta) / 2;
    const startAngle = start + angleOffset + spacingOffset;
    const endAngle = end - angleOffset - spacingOffset;
    const { outerStart, outerEnd, innerStart, innerEnd } = parseBorderRadius$1(element, innerRadius, outerRadius, endAngle - startAngle);
    const outerStartAdjustedRadius = outerRadius - outerStart;
    const outerEndAdjustedRadius = outerRadius - outerEnd;
    const outerStartAdjustedAngle = startAngle + outerStart / outerStartAdjustedRadius;
    const outerEndAdjustedAngle = endAngle - outerEnd / outerEndAdjustedRadius;
    const innerStartAdjustedRadius = innerRadius + innerStart;
    const innerEndAdjustedRadius = innerRadius + innerEnd;
    const innerStartAdjustedAngle = startAngle + innerStart / innerStartAdjustedRadius;
    const innerEndAdjustedAngle = endAngle - innerEnd / innerEndAdjustedRadius;
    ctx.beginPath();
    if (circular) {
      const outerMidAdjustedAngle = (outerStartAdjustedAngle + outerEndAdjustedAngle) / 2;
      ctx.arc(x2, y2, outerRadius, outerStartAdjustedAngle, outerMidAdjustedAngle);
      ctx.arc(x2, y2, outerRadius, outerMidAdjustedAngle, outerEndAdjustedAngle);
      if (outerEnd > 0) {
        const pCenter = rThetaToXY(outerEndAdjustedRadius, outerEndAdjustedAngle, x2, y2);
        ctx.arc(pCenter.x, pCenter.y, outerEnd, outerEndAdjustedAngle, endAngle + HALF_PI);
      }
      const p4 = rThetaToXY(innerEndAdjustedRadius, endAngle, x2, y2);
      ctx.lineTo(p4.x, p4.y);
      if (innerEnd > 0) {
        const pCenter = rThetaToXY(innerEndAdjustedRadius, innerEndAdjustedAngle, x2, y2);
        ctx.arc(pCenter.x, pCenter.y, innerEnd, endAngle + HALF_PI, innerEndAdjustedAngle + Math.PI);
      }
      const innerMidAdjustedAngle = (endAngle - innerEnd / innerRadius + (startAngle + innerStart / innerRadius)) / 2;
      ctx.arc(x2, y2, innerRadius, endAngle - innerEnd / innerRadius, innerMidAdjustedAngle, true);
      ctx.arc(x2, y2, innerRadius, innerMidAdjustedAngle, startAngle + innerStart / innerRadius, true);
      if (innerStart > 0) {
        const pCenter = rThetaToXY(innerStartAdjustedRadius, innerStartAdjustedAngle, x2, y2);
        ctx.arc(pCenter.x, pCenter.y, innerStart, innerStartAdjustedAngle + Math.PI, startAngle - HALF_PI);
      }
      const p8 = rThetaToXY(outerStartAdjustedRadius, startAngle, x2, y2);
      ctx.lineTo(p8.x, p8.y);
      if (outerStart > 0) {
        const pCenter = rThetaToXY(outerStartAdjustedRadius, outerStartAdjustedAngle, x2, y2);
        ctx.arc(pCenter.x, pCenter.y, outerStart, startAngle - HALF_PI, outerStartAdjustedAngle);
      }
    } else {
      ctx.moveTo(x2, y2);
      const outerStartX = Math.cos(outerStartAdjustedAngle) * outerRadius + x2;
      const outerStartY = Math.sin(outerStartAdjustedAngle) * outerRadius + y2;
      ctx.lineTo(outerStartX, outerStartY);
      const outerEndX = Math.cos(outerEndAdjustedAngle) * outerRadius + x2;
      const outerEndY = Math.sin(outerEndAdjustedAngle) * outerRadius + y2;
      ctx.lineTo(outerEndX, outerEndY);
    }
    ctx.closePath();
  }
  function drawArc(ctx, element, offset, spacing, circular) {
    const { fullCircles, startAngle, circumference } = element;
    let endAngle = element.endAngle;
    if (fullCircles) {
      pathArc(ctx, element, offset, spacing, endAngle, circular);
      for (let i2 = 0; i2 < fullCircles; ++i2) {
        ctx.fill();
      }
      if (!isNaN(circumference)) {
        endAngle = startAngle + (circumference % TAU || TAU);
      }
    }
    pathArc(ctx, element, offset, spacing, endAngle, circular);
    ctx.fill();
    return endAngle;
  }
  function drawBorder(ctx, element, offset, spacing, circular) {
    const { fullCircles, startAngle, circumference, options } = element;
    const { borderWidth, borderJoinStyle, borderDash, borderDashOffset, borderRadius } = options;
    const inner = options.borderAlign === "inner";
    if (!borderWidth) {
      return;
    }
    ctx.setLineDash(borderDash || []);
    ctx.lineDashOffset = borderDashOffset;
    if (inner) {
      ctx.lineWidth = borderWidth * 2;
      ctx.lineJoin = borderJoinStyle || "round";
    } else {
      ctx.lineWidth = borderWidth;
      ctx.lineJoin = borderJoinStyle || "bevel";
    }
    let endAngle = element.endAngle;
    if (fullCircles) {
      pathArc(ctx, element, offset, spacing, endAngle, circular);
      for (let i2 = 0; i2 < fullCircles; ++i2) {
        ctx.stroke();
      }
      if (!isNaN(circumference)) {
        endAngle = startAngle + (circumference % TAU || TAU);
      }
    }
    if (inner) {
      clipArc(ctx, element, endAngle);
    }
    if (options.selfJoin && endAngle - startAngle >= PI && borderRadius === 0 && borderJoinStyle !== "miter") {
      clipSelf(ctx, element, endAngle);
    }
    if (!fullCircles) {
      pathArc(ctx, element, offset, spacing, endAngle, circular);
      ctx.stroke();
    }
  }
  var ArcElement = class extends Element {
    static id = "arc";
    static defaults = {
      borderAlign: "center",
      borderColor: "#fff",
      borderDash: [],
      borderDashOffset: 0,
      borderJoinStyle: void 0,
      borderRadius: 0,
      borderWidth: 2,
      offset: 0,
      spacing: 0,
      angle: void 0,
      circular: true,
      selfJoin: false
    };
    static defaultRoutes = {
      backgroundColor: "backgroundColor"
    };
    static descriptors = {
      _scriptable: true,
      _indexable: (name) => name !== "borderDash"
    };
    circumference;
    endAngle;
    fullCircles;
    innerRadius;
    outerRadius;
    pixelMargin;
    startAngle;
    constructor(cfg) {
      super();
      this.options = void 0;
      this.circumference = void 0;
      this.startAngle = void 0;
      this.endAngle = void 0;
      this.innerRadius = void 0;
      this.outerRadius = void 0;
      this.pixelMargin = 0;
      this.fullCircles = 0;
      if (cfg) {
        Object.assign(this, cfg);
      }
    }
    inRange(chartX, chartY, useFinalPosition) {
      const point = this.getProps([
        "x",
        "y"
      ], useFinalPosition);
      const { angle, distance } = getAngleFromPoint(point, {
        x: chartX,
        y: chartY
      });
      const { startAngle, endAngle, innerRadius, outerRadius, circumference } = this.getProps([
        "startAngle",
        "endAngle",
        "innerRadius",
        "outerRadius",
        "circumference"
      ], useFinalPosition);
      const rAdjust = (this.options.spacing + this.options.borderWidth) / 2;
      const _circumference = valueOrDefault(circumference, endAngle - startAngle);
      const nonZeroBetween = _angleBetween(angle, startAngle, endAngle) && startAngle !== endAngle;
      const betweenAngles = _circumference >= TAU || nonZeroBetween;
      const withinRadius = _isBetween(distance, innerRadius + rAdjust, outerRadius + rAdjust);
      return betweenAngles && withinRadius;
    }
    getCenterPoint(useFinalPosition) {
      const { x: x2, y: y2, startAngle, endAngle, innerRadius, outerRadius } = this.getProps([
        "x",
        "y",
        "startAngle",
        "endAngle",
        "innerRadius",
        "outerRadius"
      ], useFinalPosition);
      const { offset, spacing } = this.options;
      const halfAngle = (startAngle + endAngle) / 2;
      const halfRadius = (innerRadius + outerRadius + spacing + offset) / 2;
      return {
        x: x2 + Math.cos(halfAngle) * halfRadius,
        y: y2 + Math.sin(halfAngle) * halfRadius
      };
    }
    tooltipPosition(useFinalPosition) {
      return this.getCenterPoint(useFinalPosition);
    }
    draw(ctx) {
      const { options, circumference } = this;
      const offset = (options.offset || 0) / 4;
      const spacing = (options.spacing || 0) / 2;
      const circular = options.circular;
      this.pixelMargin = options.borderAlign === "inner" ? 0.33 : 0;
      this.fullCircles = circumference > TAU ? Math.floor(circumference / TAU) : 0;
      if (circumference === 0 || this.innerRadius < 0 || this.outerRadius < 0) {
        return;
      }
      ctx.save();
      const halfAngle = (this.startAngle + this.endAngle) / 2;
      ctx.translate(Math.cos(halfAngle) * offset, Math.sin(halfAngle) * offset);
      const fix = 1 - Math.sin(Math.min(PI, circumference || 0));
      const radiusOffset = offset * fix;
      ctx.fillStyle = options.backgroundColor;
      ctx.strokeStyle = options.borderColor;
      drawArc(ctx, this, radiusOffset, spacing, circular);
      drawBorder(ctx, this, radiusOffset, spacing, circular);
      ctx.restore();
    }
  };
  function setStyle(ctx, options, style = options) {
    ctx.lineCap = valueOrDefault(style.borderCapStyle, options.borderCapStyle);
    ctx.setLineDash(valueOrDefault(style.borderDash, options.borderDash));
    ctx.lineDashOffset = valueOrDefault(style.borderDashOffset, options.borderDashOffset);
    ctx.lineJoin = valueOrDefault(style.borderJoinStyle, options.borderJoinStyle);
    ctx.lineWidth = valueOrDefault(style.borderWidth, options.borderWidth);
    ctx.strokeStyle = valueOrDefault(style.borderColor, options.borderColor);
  }
  function lineTo(ctx, previous, target) {
    ctx.lineTo(target.x, target.y);
  }
  function getLineMethod(options) {
    if (options.stepped) {
      return _steppedLineTo;
    }
    if (options.tension || options.cubicInterpolationMode === "monotone") {
      return _bezierCurveTo;
    }
    return lineTo;
  }
  function pathVars(points, segment, params = {}) {
    const count = points.length;
    const { start: paramsStart = 0, end: paramsEnd = count - 1 } = params;
    const { start: segmentStart, end: segmentEnd } = segment;
    const start = Math.max(paramsStart, segmentStart);
    const end = Math.min(paramsEnd, segmentEnd);
    const outside = paramsStart < segmentStart && paramsEnd < segmentStart || paramsStart > segmentEnd && paramsEnd > segmentEnd;
    return {
      count,
      start,
      loop: segment.loop,
      ilen: end < start && !outside ? count + end - start : end - start
    };
  }
  function pathSegment(ctx, line, segment, params) {
    const { points, options } = line;
    const { count, start, loop, ilen } = pathVars(points, segment, params);
    const lineMethod = getLineMethod(options);
    let { move = true, reverse } = params || {};
    let i2, point, prev;
    for (i2 = 0; i2 <= ilen; ++i2) {
      point = points[(start + (reverse ? ilen - i2 : i2)) % count];
      if (point.skip) {
        continue;
      } else if (move) {
        ctx.moveTo(point.x, point.y);
        move = false;
      } else {
        lineMethod(ctx, prev, point, reverse, options.stepped);
      }
      prev = point;
    }
    if (loop) {
      point = points[(start + (reverse ? ilen : 0)) % count];
      lineMethod(ctx, prev, point, reverse, options.stepped);
    }
    return !!loop;
  }
  function fastPathSegment(ctx, line, segment, params) {
    const points = line.points;
    const { count, start, ilen } = pathVars(points, segment, params);
    const { move = true, reverse } = params || {};
    let avgX = 0;
    let countX = 0;
    let i2, point, prevX, minY, maxY, lastY;
    const pointIndex = (index3) => (start + (reverse ? ilen - index3 : index3)) % count;
    const drawX = () => {
      if (minY !== maxY) {
        ctx.lineTo(avgX, maxY);
        ctx.lineTo(avgX, minY);
        ctx.lineTo(avgX, lastY);
      }
    };
    if (move) {
      point = points[pointIndex(0)];
      ctx.moveTo(point.x, point.y);
    }
    for (i2 = 0; i2 <= ilen; ++i2) {
      point = points[pointIndex(i2)];
      if (point.skip) {
        continue;
      }
      const x2 = point.x;
      const y2 = point.y;
      const truncX = x2 | 0;
      if (truncX === prevX) {
        if (y2 < minY) {
          minY = y2;
        } else if (y2 > maxY) {
          maxY = y2;
        }
        avgX = (countX * avgX + x2) / ++countX;
      } else {
        drawX();
        ctx.lineTo(x2, y2);
        prevX = truncX;
        countX = 0;
        minY = maxY = y2;
      }
      lastY = y2;
    }
    drawX();
  }
  function _getSegmentMethod(line) {
    const opts = line.options;
    const borderDash = opts.borderDash && opts.borderDash.length;
    const useFastPath = !line._decimated && !line._loop && !opts.tension && opts.cubicInterpolationMode !== "monotone" && !opts.stepped && !borderDash;
    return useFastPath ? fastPathSegment : pathSegment;
  }
  function _getInterpolationMethod(options) {
    if (options.stepped) {
      return _steppedInterpolation;
    }
    if (options.tension || options.cubicInterpolationMode === "monotone") {
      return _bezierInterpolation;
    }
    return _pointInLine;
  }
  function strokePathWithCache(ctx, line, start, count) {
    let path = line._path;
    if (!path) {
      path = line._path = new Path2D();
      if (line.path(path, start, count)) {
        path.closePath();
      }
    }
    setStyle(ctx, line.options);
    ctx.stroke(path);
  }
  function strokePathDirect(ctx, line, start, count) {
    const { segments, options } = line;
    const segmentMethod = _getSegmentMethod(line);
    for (const segment of segments) {
      setStyle(ctx, options, segment.style);
      ctx.beginPath();
      if (segmentMethod(ctx, line, segment, {
        start,
        end: start + count - 1
      })) {
        ctx.closePath();
      }
      ctx.stroke();
    }
  }
  var usePath2D = typeof Path2D === "function";
  function draw(ctx, line, start, count) {
    if (usePath2D && !line.options.segment) {
      strokePathWithCache(ctx, line, start, count);
    } else {
      strokePathDirect(ctx, line, start, count);
    }
  }
  var LineElement = class extends Element {
    static id = "line";
    static defaults = {
      borderCapStyle: "butt",
      borderDash: [],
      borderDashOffset: 0,
      borderJoinStyle: "miter",
      borderWidth: 3,
      capBezierPoints: true,
      cubicInterpolationMode: "default",
      fill: false,
      spanGaps: false,
      stepped: false,
      tension: 0
    };
    static defaultRoutes = {
      backgroundColor: "backgroundColor",
      borderColor: "borderColor"
    };
    static descriptors = {
      _scriptable: true,
      _indexable: (name) => name !== "borderDash" && name !== "fill"
    };
    constructor(cfg) {
      super();
      this.animated = true;
      this.options = void 0;
      this._chart = void 0;
      this._loop = void 0;
      this._fullLoop = void 0;
      this._path = void 0;
      this._points = void 0;
      this._segments = void 0;
      this._decimated = false;
      this._pointsUpdated = false;
      this._datasetIndex = void 0;
      if (cfg) {
        Object.assign(this, cfg);
      }
    }
    updateControlPoints(chartArea, indexAxis) {
      const options = this.options;
      if ((options.tension || options.cubicInterpolationMode === "monotone") && !options.stepped && !this._pointsUpdated) {
        const loop = options.spanGaps ? this._loop : this._fullLoop;
        _updateBezierControlPoints(this._points, options, chartArea, loop, indexAxis);
        this._pointsUpdated = true;
      }
    }
    set points(points) {
      this._points = points;
      delete this._segments;
      delete this._path;
      this._pointsUpdated = false;
    }
    get points() {
      return this._points;
    }
    get segments() {
      return this._segments || (this._segments = _computeSegments(this, this.options.segment));
    }
    first() {
      const segments = this.segments;
      const points = this.points;
      return segments.length && points[segments[0].start];
    }
    last() {
      const segments = this.segments;
      const points = this.points;
      const count = segments.length;
      return count && points[segments[count - 1].end];
    }
    interpolate(point, property) {
      const options = this.options;
      const value = point[property];
      const points = this.points;
      const segments = _boundSegments(this, {
        property,
        start: value,
        end: value
      });
      if (!segments.length) {
        return;
      }
      const result = [];
      const _interpolate = _getInterpolationMethod(options);
      let i2, ilen;
      for (i2 = 0, ilen = segments.length; i2 < ilen; ++i2) {
        const { start, end } = segments[i2];
        const p1 = points[start];
        const p2 = points[end];
        if (p1 === p2) {
          result.push(p1);
          continue;
        }
        const t3 = Math.abs((value - p1[property]) / (p2[property] - p1[property]));
        const interpolated = _interpolate(p1, p2, t3, options.stepped);
        interpolated[property] = point[property];
        result.push(interpolated);
      }
      return result.length === 1 ? result[0] : result;
    }
    pathSegment(ctx, segment, params) {
      const segmentMethod = _getSegmentMethod(this);
      return segmentMethod(ctx, this, segment, params);
    }
    path(ctx, start, count) {
      const segments = this.segments;
      const segmentMethod = _getSegmentMethod(this);
      let loop = this._loop;
      start = start || 0;
      count = count || this.points.length - start;
      for (const segment of segments) {
        loop &= segmentMethod(ctx, this, segment, {
          start,
          end: start + count - 1
        });
      }
      return !!loop;
    }
    draw(ctx, chartArea, start, count) {
      const options = this.options || {};
      const points = this.points || [];
      if (points.length && options.borderWidth) {
        ctx.save();
        draw(ctx, this, start, count);
        ctx.restore();
      }
      if (this.animated) {
        this._pointsUpdated = false;
        this._path = void 0;
      }
    }
  };
  function inRange$1(el2, pos, axis, useFinalPosition) {
    const options = el2.options;
    const { [axis]: value } = el2.getProps([
      axis
    ], useFinalPosition);
    return Math.abs(pos - value) < options.radius + options.hitRadius;
  }
  var PointElement = class extends Element {
    static id = "point";
    parsed;
    skip;
    stop;
    /**
    * @type {any}
    */
    static defaults = {
      borderWidth: 1,
      hitRadius: 1,
      hoverBorderWidth: 1,
      hoverRadius: 4,
      pointStyle: "circle",
      radius: 3,
      rotation: 0
    };
    /**
    * @type {any}
    */
    static defaultRoutes = {
      backgroundColor: "backgroundColor",
      borderColor: "borderColor"
    };
    constructor(cfg) {
      super();
      this.options = void 0;
      this.parsed = void 0;
      this.skip = void 0;
      this.stop = void 0;
      if (cfg) {
        Object.assign(this, cfg);
      }
    }
    inRange(mouseX, mouseY, useFinalPosition) {
      const options = this.options;
      const { x: x2, y: y2 } = this.getProps([
        "x",
        "y"
      ], useFinalPosition);
      return Math.pow(mouseX - x2, 2) + Math.pow(mouseY - y2, 2) < Math.pow(options.hitRadius + options.radius, 2);
    }
    inXRange(mouseX, useFinalPosition) {
      return inRange$1(this, mouseX, "x", useFinalPosition);
    }
    inYRange(mouseY, useFinalPosition) {
      return inRange$1(this, mouseY, "y", useFinalPosition);
    }
    getCenterPoint(useFinalPosition) {
      const { x: x2, y: y2 } = this.getProps([
        "x",
        "y"
      ], useFinalPosition);
      return {
        x: x2,
        y: y2
      };
    }
    size(options) {
      options = options || this.options || {};
      let radius = options.radius || 0;
      radius = Math.max(radius, radius && options.hoverRadius || 0);
      const borderWidth = radius && options.borderWidth || 0;
      return (radius + borderWidth) * 2;
    }
    draw(ctx, area) {
      const options = this.options;
      if (this.skip || options.radius < 0.1 || !_isPointInArea(this, area, this.size(options) / 2)) {
        return;
      }
      ctx.strokeStyle = options.borderColor;
      ctx.lineWidth = options.borderWidth;
      ctx.fillStyle = options.backgroundColor;
      drawPoint(ctx, options, this.x, this.y);
    }
    getRange() {
      const options = this.options || {};
      return options.radius + options.hitRadius;
    }
  };
  function getBarBounds(bar, useFinalPosition) {
    const { x: x2, y: y2, base, width, height } = bar.getProps([
      "x",
      "y",
      "base",
      "width",
      "height"
    ], useFinalPosition);
    let left, right, top, bottom, half;
    if (bar.horizontal) {
      half = height / 2;
      left = Math.min(x2, base);
      right = Math.max(x2, base);
      top = y2 - half;
      bottom = y2 + half;
    } else {
      half = width / 2;
      left = x2 - half;
      right = x2 + half;
      top = Math.min(y2, base);
      bottom = Math.max(y2, base);
    }
    return {
      left,
      top,
      right,
      bottom
    };
  }
  function skipOrLimit(skip2, value, min2, max2) {
    return skip2 ? 0 : _limitValue(value, min2, max2);
  }
  function parseBorderWidth(bar, maxW, maxH) {
    const value = bar.options.borderWidth;
    const skip2 = bar.borderSkipped;
    const o2 = toTRBL(value);
    return {
      t: skipOrLimit(skip2.top, o2.top, 0, maxH),
      r: skipOrLimit(skip2.right, o2.right, 0, maxW),
      b: skipOrLimit(skip2.bottom, o2.bottom, 0, maxH),
      l: skipOrLimit(skip2.left, o2.left, 0, maxW)
    };
  }
  function parseBorderRadius(bar, maxW, maxH) {
    const { enableBorderRadius } = bar.getProps([
      "enableBorderRadius"
    ]);
    const value = bar.options.borderRadius;
    const o2 = toTRBLCorners(value);
    const maxR = Math.min(maxW, maxH);
    const skip2 = bar.borderSkipped;
    const enableBorder = enableBorderRadius || isObject(value);
    return {
      topLeft: skipOrLimit(!enableBorder || skip2.top || skip2.left, o2.topLeft, 0, maxR),
      topRight: skipOrLimit(!enableBorder || skip2.top || skip2.right, o2.topRight, 0, maxR),
      bottomLeft: skipOrLimit(!enableBorder || skip2.bottom || skip2.left, o2.bottomLeft, 0, maxR),
      bottomRight: skipOrLimit(!enableBorder || skip2.bottom || skip2.right, o2.bottomRight, 0, maxR)
    };
  }
  function boundingRects(bar) {
    const bounds = getBarBounds(bar);
    const width = bounds.right - bounds.left;
    const height = bounds.bottom - bounds.top;
    const border = parseBorderWidth(bar, width / 2, height / 2);
    const radius = parseBorderRadius(bar, width / 2, height / 2);
    return {
      outer: {
        x: bounds.left,
        y: bounds.top,
        w: width,
        h: height,
        radius
      },
      inner: {
        x: bounds.left + border.l,
        y: bounds.top + border.t,
        w: width - border.l - border.r,
        h: height - border.t - border.b,
        radius: {
          topLeft: Math.max(0, radius.topLeft - Math.max(border.t, border.l)),
          topRight: Math.max(0, radius.topRight - Math.max(border.t, border.r)),
          bottomLeft: Math.max(0, radius.bottomLeft - Math.max(border.b, border.l)),
          bottomRight: Math.max(0, radius.bottomRight - Math.max(border.b, border.r))
        }
      }
    };
  }
  function inRange(bar, x2, y2, useFinalPosition) {
    const skipX = x2 === null;
    const skipY = y2 === null;
    const skipBoth = skipX && skipY;
    const bounds = bar && !skipBoth && getBarBounds(bar, useFinalPosition);
    return bounds && (skipX || _isBetween(x2, bounds.left, bounds.right)) && (skipY || _isBetween(y2, bounds.top, bounds.bottom));
  }
  function hasRadius(radius) {
    return radius.topLeft || radius.topRight || radius.bottomLeft || radius.bottomRight;
  }
  function addNormalRectPath(ctx, rect) {
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
  }
  function inflateRect(rect, amount, refRect = {}) {
    const x2 = rect.x !== refRect.x ? -amount : 0;
    const y2 = rect.y !== refRect.y ? -amount : 0;
    const w2 = (rect.x + rect.w !== refRect.x + refRect.w ? amount : 0) - x2;
    const h3 = (rect.y + rect.h !== refRect.y + refRect.h ? amount : 0) - y2;
    return {
      x: rect.x + x2,
      y: rect.y + y2,
      w: rect.w + w2,
      h: rect.h + h3,
      radius: rect.radius
    };
  }
  var BarElement = class extends Element {
    static id = "bar";
    static defaults = {
      borderSkipped: "start",
      borderWidth: 0,
      borderRadius: 0,
      inflateAmount: "auto",
      pointStyle: void 0
    };
    static defaultRoutes = {
      backgroundColor: "backgroundColor",
      borderColor: "borderColor"
    };
    constructor(cfg) {
      super();
      this.options = void 0;
      this.horizontal = void 0;
      this.base = void 0;
      this.width = void 0;
      this.height = void 0;
      this.inflateAmount = void 0;
      if (cfg) {
        Object.assign(this, cfg);
      }
    }
    draw(ctx) {
      const { inflateAmount, options: { borderColor, backgroundColor } } = this;
      const { inner, outer } = boundingRects(this);
      const addRectPath = hasRadius(outer.radius) ? addRoundedRectPath : addNormalRectPath;
      ctx.save();
      if (outer.w !== inner.w || outer.h !== inner.h) {
        ctx.beginPath();
        addRectPath(ctx, inflateRect(outer, inflateAmount, inner));
        ctx.clip();
        addRectPath(ctx, inflateRect(inner, -inflateAmount, outer));
        ctx.fillStyle = borderColor;
        ctx.fill("evenodd");
      }
      ctx.beginPath();
      addRectPath(ctx, inflateRect(inner, inflateAmount));
      ctx.fillStyle = backgroundColor;
      ctx.fill();
      ctx.restore();
    }
    inRange(mouseX, mouseY, useFinalPosition) {
      return inRange(this, mouseX, mouseY, useFinalPosition);
    }
    inXRange(mouseX, useFinalPosition) {
      return inRange(this, mouseX, null, useFinalPosition);
    }
    inYRange(mouseY, useFinalPosition) {
      return inRange(this, null, mouseY, useFinalPosition);
    }
    getCenterPoint(useFinalPosition) {
      const { x: x2, y: y2, base, horizontal } = this.getProps([
        "x",
        "y",
        "base",
        "horizontal"
      ], useFinalPosition);
      return {
        x: horizontal ? (x2 + base) / 2 : x2,
        y: horizontal ? y2 : (y2 + base) / 2
      };
    }
    getRange(axis) {
      return axis === "x" ? this.width / 2 : this.height / 2;
    }
  };
  function _segments(line, target, property) {
    const segments = line.segments;
    const points = line.points;
    const tpoints = target.points;
    const parts = [];
    for (const segment of segments) {
      let { start, end } = segment;
      end = _findSegmentEnd(start, end, points);
      const bounds = _getBounds(property, points[start], points[end], segment.loop);
      if (!target.segments) {
        parts.push({
          source: segment,
          target: bounds,
          start: points[start],
          end: points[end]
        });
        continue;
      }
      const targetSegments = _boundSegments(target, bounds);
      for (const tgt of targetSegments) {
        const subBounds = _getBounds(property, tpoints[tgt.start], tpoints[tgt.end], tgt.loop);
        const fillSources = _boundSegment(segment, points, subBounds);
        for (const fillSource of fillSources) {
          parts.push({
            source: fillSource,
            target: tgt,
            start: {
              [property]: _getEdge(bounds, subBounds, "start", Math.max)
            },
            end: {
              [property]: _getEdge(bounds, subBounds, "end", Math.min)
            }
          });
        }
      }
    }
    return parts;
  }
  function _getBounds(property, first, last, loop) {
    if (loop) {
      return;
    }
    let start = first[property];
    let end = last[property];
    if (property === "angle") {
      start = _normalizeAngle(start);
      end = _normalizeAngle(end);
    }
    return {
      property,
      start,
      end
    };
  }
  function _pointsFromSegments(boundary, line) {
    const { x: x2 = null, y: y2 = null } = boundary || {};
    const linePoints = line.points;
    const points = [];
    line.segments.forEach(({ start, end }) => {
      end = _findSegmentEnd(start, end, linePoints);
      const first = linePoints[start];
      const last = linePoints[end];
      if (y2 !== null) {
        points.push({
          x: first.x,
          y: y2
        });
        points.push({
          x: last.x,
          y: y2
        });
      } else if (x2 !== null) {
        points.push({
          x: x2,
          y: first.y
        });
        points.push({
          x: x2,
          y: last.y
        });
      }
    });
    return points;
  }
  function _findSegmentEnd(start, end, points) {
    for (; end > start; end--) {
      const point = points[end];
      if (!isNaN(point.x) && !isNaN(point.y)) {
        break;
      }
    }
    return end;
  }
  function _getEdge(a2, b2, prop, fn) {
    if (a2 && b2) {
      return fn(a2[prop], b2[prop]);
    }
    return a2 ? a2[prop] : b2 ? b2[prop] : 0;
  }
  function _createBoundaryLine(boundary, line) {
    let points = [];
    let _loop = false;
    if (isArray(boundary)) {
      _loop = true;
      points = boundary;
    } else {
      points = _pointsFromSegments(boundary, line);
    }
    return points.length ? new LineElement({
      points,
      options: {
        tension: 0
      },
      _loop,
      _fullLoop: _loop
    }) : null;
  }
  function _shouldApplyFill(source) {
    return source && source.fill !== false;
  }
  function _resolveTarget(sources, index3, propagate) {
    const source = sources[index3];
    let fill2 = source.fill;
    const visited = [
      index3
    ];
    let target;
    if (!propagate) {
      return fill2;
    }
    while (fill2 !== false && visited.indexOf(fill2) === -1) {
      if (!isNumberFinite(fill2)) {
        return fill2;
      }
      target = sources[fill2];
      if (!target) {
        return false;
      }
      if (target.visible) {
        return fill2;
      }
      visited.push(fill2);
      fill2 = target.fill;
    }
    return false;
  }
  function _decodeFill(line, index3, count) {
    const fill2 = parseFillOption(line);
    if (isObject(fill2)) {
      return isNaN(fill2.value) ? false : fill2;
    }
    let target = parseFloat(fill2);
    if (isNumberFinite(target) && Math.floor(target) === target) {
      return decodeTargetIndex(fill2[0], index3, target, count);
    }
    return [
      "origin",
      "start",
      "end",
      "stack",
      "shape"
    ].indexOf(fill2) >= 0 && fill2;
  }
  function decodeTargetIndex(firstCh, index3, target, count) {
    if (firstCh === "-" || firstCh === "+") {
      target = index3 + target;
    }
    if (target === index3 || target < 0 || target >= count) {
      return false;
    }
    return target;
  }
  function _getTargetPixel(fill2, scale) {
    let pixel = null;
    if (fill2 === "start") {
      pixel = scale.bottom;
    } else if (fill2 === "end") {
      pixel = scale.top;
    } else if (isObject(fill2)) {
      pixel = scale.getPixelForValue(fill2.value);
    } else if (scale.getBasePixel) {
      pixel = scale.getBasePixel();
    }
    return pixel;
  }
  function _getTargetValue(fill2, scale, startValue) {
    let value;
    if (fill2 === "start") {
      value = startValue;
    } else if (fill2 === "end") {
      value = scale.options.reverse ? scale.min : scale.max;
    } else if (isObject(fill2)) {
      value = fill2.value;
    } else {
      value = scale.getBaseValue();
    }
    return value;
  }
  function parseFillOption(line) {
    const options = line.options;
    const fillOption = options.fill;
    let fill2 = valueOrDefault(fillOption && fillOption.target, fillOption);
    if (fill2 === void 0) {
      fill2 = !!options.backgroundColor;
    }
    if (fill2 === false || fill2 === null) {
      return false;
    }
    if (fill2 === true) {
      return "origin";
    }
    return fill2;
  }
  function _buildStackLine(source) {
    const { scale, index: index3, line } = source;
    const points = [];
    const segments = line.segments;
    const sourcePoints = line.points;
    const linesBelow = getLinesBelow(scale, index3);
    linesBelow.push(_createBoundaryLine({
      x: null,
      y: scale.bottom
    }, line));
    for (let i2 = 0; i2 < segments.length; i2++) {
      const segment = segments[i2];
      for (let j2 = segment.start; j2 <= segment.end; j2++) {
        addPointsBelow(points, sourcePoints[j2], linesBelow);
      }
    }
    return new LineElement({
      points,
      options: {}
    });
  }
  function getLinesBelow(scale, index3) {
    const below = [];
    const metas = scale.getMatchingVisibleMetas("line");
    for (let i2 = 0; i2 < metas.length; i2++) {
      const meta = metas[i2];
      if (meta.index === index3) {
        break;
      }
      if (!meta.hidden) {
        below.unshift(meta.dataset);
      }
    }
    return below;
  }
  function addPointsBelow(points, sourcePoint, linesBelow) {
    const postponed = [];
    for (let j2 = 0; j2 < linesBelow.length; j2++) {
      const line = linesBelow[j2];
      const { first, last, point } = findPoint(line, sourcePoint, "x");
      if (!point || first && last) {
        continue;
      }
      if (first) {
        postponed.unshift(point);
      } else {
        points.push(point);
        if (!last) {
          break;
        }
      }
    }
    points.push(...postponed);
  }
  function findPoint(line, sourcePoint, property) {
    const point = line.interpolate(sourcePoint, property);
    if (!point) {
      return {};
    }
    const pointValue = point[property];
    const segments = line.segments;
    const linePoints = line.points;
    let first = false;
    let last = false;
    for (let i2 = 0; i2 < segments.length; i2++) {
      const segment = segments[i2];
      const firstValue = linePoints[segment.start][property];
      const lastValue = linePoints[segment.end][property];
      if (_isBetween(pointValue, firstValue, lastValue)) {
        first = pointValue === firstValue;
        last = pointValue === lastValue;
        break;
      }
    }
    return {
      first,
      last,
      point
    };
  }
  var simpleArc = class {
    constructor(opts) {
      this.x = opts.x;
      this.y = opts.y;
      this.radius = opts.radius;
    }
    pathSegment(ctx, bounds, opts) {
      const { x: x2, y: y2, radius } = this;
      bounds = bounds || {
        start: 0,
        end: TAU
      };
      ctx.arc(x2, y2, radius, bounds.end, bounds.start, true);
      return !opts.bounds;
    }
    interpolate(point) {
      const { x: x2, y: y2, radius } = this;
      const angle = point.angle;
      return {
        x: x2 + Math.cos(angle) * radius,
        y: y2 + Math.sin(angle) * radius,
        angle
      };
    }
  };
  function _getTarget(source) {
    const { chart, fill: fill2, line } = source;
    if (isNumberFinite(fill2)) {
      return getLineByIndex(chart, fill2);
    }
    if (fill2 === "stack") {
      return _buildStackLine(source);
    }
    if (fill2 === "shape") {
      return true;
    }
    const boundary = computeBoundary(source);
    if (boundary instanceof simpleArc) {
      return boundary;
    }
    return _createBoundaryLine(boundary, line);
  }
  function getLineByIndex(chart, index3) {
    const meta = chart.getDatasetMeta(index3);
    const visible = meta && chart.isDatasetVisible(index3);
    return visible ? meta.dataset : null;
  }
  function computeBoundary(source) {
    const scale = source.scale || {};
    if (scale.getPointPositionForValue) {
      return computeCircularBoundary(source);
    }
    return computeLinearBoundary(source);
  }
  function computeLinearBoundary(source) {
    const { scale = {}, fill: fill2 } = source;
    const pixel = _getTargetPixel(fill2, scale);
    if (isNumberFinite(pixel)) {
      const horizontal = scale.isHorizontal();
      return {
        x: horizontal ? pixel : null,
        y: horizontal ? null : pixel
      };
    }
    return null;
  }
  function computeCircularBoundary(source) {
    const { scale, fill: fill2 } = source;
    const options = scale.options;
    const length = scale.getLabels().length;
    const start = options.reverse ? scale.max : scale.min;
    const value = _getTargetValue(fill2, scale, start);
    const target = [];
    if (options.grid.circular) {
      const center = scale.getPointPositionForValue(0, start);
      return new simpleArc({
        x: center.x,
        y: center.y,
        radius: scale.getDistanceFromCenterForValue(value)
      });
    }
    for (let i2 = 0; i2 < length; ++i2) {
      target.push(scale.getPointPositionForValue(i2, value));
    }
    return target;
  }
  function _drawfill(ctx, source, area) {
    const target = _getTarget(source);
    const { chart, index: index3, line, scale, axis } = source;
    const lineOpts = line.options;
    const fillOption = lineOpts.fill;
    const color2 = lineOpts.backgroundColor;
    const { above = color2, below = color2 } = fillOption || {};
    const meta = chart.getDatasetMeta(index3);
    const clip = getDatasetClipArea(chart, meta);
    if (target && line.points.length) {
      clipArea(ctx, area);
      doFill(ctx, {
        line,
        target,
        above,
        below,
        area,
        scale,
        axis,
        clip
      });
      unclipArea(ctx);
    }
  }
  function doFill(ctx, cfg) {
    const { line, target, above, below, area, scale, clip } = cfg;
    const property = line._loop ? "angle" : cfg.axis;
    ctx.save();
    let fillColor = below;
    if (below !== above) {
      if (property === "x") {
        clipVertical(ctx, target, area.top);
        fill(ctx, {
          line,
          target,
          color: above,
          scale,
          property,
          clip
        });
        ctx.restore();
        ctx.save();
        clipVertical(ctx, target, area.bottom);
      } else if (property === "y") {
        clipHorizontal(ctx, target, area.left);
        fill(ctx, {
          line,
          target,
          color: below,
          scale,
          property,
          clip
        });
        ctx.restore();
        ctx.save();
        clipHorizontal(ctx, target, area.right);
        fillColor = above;
      }
    }
    fill(ctx, {
      line,
      target,
      color: fillColor,
      scale,
      property,
      clip
    });
    ctx.restore();
  }
  function clipVertical(ctx, target, clipY) {
    const { segments, points } = target;
    let first = true;
    let lineLoop = false;
    ctx.beginPath();
    for (const segment of segments) {
      const { start, end } = segment;
      const firstPoint = points[start];
      const lastPoint = points[_findSegmentEnd(start, end, points)];
      if (first) {
        ctx.moveTo(firstPoint.x, firstPoint.y);
        first = false;
      } else {
        ctx.lineTo(firstPoint.x, clipY);
        ctx.lineTo(firstPoint.x, firstPoint.y);
      }
      lineLoop = !!target.pathSegment(ctx, segment, {
        move: lineLoop
      });
      if (lineLoop) {
        ctx.closePath();
      } else {
        ctx.lineTo(lastPoint.x, clipY);
      }
    }
    ctx.lineTo(target.first().x, clipY);
    ctx.closePath();
    ctx.clip();
  }
  function clipHorizontal(ctx, target, clipX) {
    const { segments, points } = target;
    let first = true;
    let lineLoop = false;
    ctx.beginPath();
    for (const segment of segments) {
      const { start, end } = segment;
      const firstPoint = points[start];
      const lastPoint = points[_findSegmentEnd(start, end, points)];
      if (first) {
        ctx.moveTo(firstPoint.x, firstPoint.y);
        first = false;
      } else {
        ctx.lineTo(clipX, firstPoint.y);
        ctx.lineTo(firstPoint.x, firstPoint.y);
      }
      lineLoop = !!target.pathSegment(ctx, segment, {
        move: lineLoop
      });
      if (lineLoop) {
        ctx.closePath();
      } else {
        ctx.lineTo(clipX, lastPoint.y);
      }
    }
    ctx.lineTo(clipX, target.first().y);
    ctx.closePath();
    ctx.clip();
  }
  function fill(ctx, cfg) {
    const { line, target, property, color: color2, scale, clip } = cfg;
    const segments = _segments(line, target, property);
    for (const { source: src, target: tgt, start, end } of segments) {
      const { style: { backgroundColor = color2 } = {} } = src;
      const notShape = target !== true;
      ctx.save();
      ctx.fillStyle = backgroundColor;
      clipBounds(ctx, scale, clip, notShape && _getBounds(property, start, end));
      ctx.beginPath();
      const lineLoop = !!line.pathSegment(ctx, src);
      let loop;
      if (notShape) {
        if (lineLoop) {
          ctx.closePath();
        } else {
          interpolatedLineTo(ctx, target, end, property);
        }
        const targetLoop = !!target.pathSegment(ctx, tgt, {
          move: lineLoop,
          reverse: true
        });
        loop = lineLoop && targetLoop;
        if (!loop) {
          interpolatedLineTo(ctx, target, start, property);
        }
      }
      ctx.closePath();
      ctx.fill(loop ? "evenodd" : "nonzero");
      ctx.restore();
    }
  }
  function clipBounds(ctx, scale, clip, bounds) {
    const chartArea = scale.chart.chartArea;
    const { property, start, end } = bounds || {};
    if (property === "x" || property === "y") {
      let left, top, right, bottom;
      if (property === "x") {
        left = start;
        top = chartArea.top;
        right = end;
        bottom = chartArea.bottom;
      } else {
        left = chartArea.left;
        top = start;
        right = chartArea.right;
        bottom = end;
      }
      ctx.beginPath();
      if (clip) {
        left = Math.max(left, clip.left);
        right = Math.min(right, clip.right);
        top = Math.max(top, clip.top);
        bottom = Math.min(bottom, clip.bottom);
      }
      ctx.rect(left, top, right - left, bottom - top);
      ctx.clip();
    }
  }
  function interpolatedLineTo(ctx, target, point, property) {
    const interpolatedPoint = target.interpolate(point, property);
    if (interpolatedPoint) {
      ctx.lineTo(interpolatedPoint.x, interpolatedPoint.y);
    }
  }
  var index = {
    id: "filler",
    afterDatasetsUpdate(chart, _args, options) {
      const count = (chart.data.datasets || []).length;
      const sources = [];
      let meta, i2, line, source;
      for (i2 = 0; i2 < count; ++i2) {
        meta = chart.getDatasetMeta(i2);
        line = meta.dataset;
        source = null;
        if (line && line.options && line instanceof LineElement) {
          source = {
            visible: chart.isDatasetVisible(i2),
            index: i2,
            fill: _decodeFill(line, i2, count),
            chart,
            axis: meta.controller.options.indexAxis,
            scale: meta.vScale,
            line
          };
        }
        meta.$filler = source;
        sources.push(source);
      }
      for (i2 = 0; i2 < count; ++i2) {
        source = sources[i2];
        if (!source || source.fill === false) {
          continue;
        }
        source.fill = _resolveTarget(sources, i2, options.propagate);
      }
    },
    beforeDraw(chart, _args, options) {
      const draw2 = options.drawTime === "beforeDraw";
      const metasets = chart.getSortedVisibleDatasetMetas();
      const area = chart.chartArea;
      for (let i2 = metasets.length - 1; i2 >= 0; --i2) {
        const source = metasets[i2].$filler;
        if (!source) {
          continue;
        }
        source.line.updateControlPoints(area, source.axis);
        if (draw2 && source.fill) {
          _drawfill(chart.ctx, source, area);
        }
      }
    },
    beforeDatasetsDraw(chart, _args, options) {
      if (options.drawTime !== "beforeDatasetsDraw") {
        return;
      }
      const metasets = chart.getSortedVisibleDatasetMetas();
      for (let i2 = metasets.length - 1; i2 >= 0; --i2) {
        const source = metasets[i2].$filler;
        if (_shouldApplyFill(source)) {
          _drawfill(chart.ctx, source, chart.chartArea);
        }
      }
    },
    beforeDatasetDraw(chart, args, options) {
      const source = args.meta.$filler;
      if (!_shouldApplyFill(source) || options.drawTime !== "beforeDatasetDraw") {
        return;
      }
      _drawfill(chart.ctx, source, chart.chartArea);
    },
    defaults: {
      propagate: true,
      drawTime: "beforeDatasetDraw"
    }
  };
  var getBoxSize = (labelOpts, fontSize) => {
    let { boxHeight = fontSize, boxWidth = fontSize } = labelOpts;
    if (labelOpts.usePointStyle) {
      boxHeight = Math.min(boxHeight, fontSize);
      boxWidth = labelOpts.pointStyleWidth || Math.min(boxWidth, fontSize);
    }
    return {
      boxWidth,
      boxHeight,
      itemHeight: Math.max(fontSize, boxHeight)
    };
  };
  var itemsEqual = (a2, b2) => a2 !== null && b2 !== null && a2.datasetIndex === b2.datasetIndex && a2.index === b2.index;
  var Legend = class extends Element {
    constructor(config) {
      super();
      this._added = false;
      this.legendHitBoxes = [];
      this._hoveredItem = null;
      this.doughnutMode = false;
      this.chart = config.chart;
      this.options = config.options;
      this.ctx = config.ctx;
      this.legendItems = void 0;
      this.columnSizes = void 0;
      this.lineWidths = void 0;
      this.maxHeight = void 0;
      this.maxWidth = void 0;
      this.top = void 0;
      this.bottom = void 0;
      this.left = void 0;
      this.right = void 0;
      this.height = void 0;
      this.width = void 0;
      this._margins = void 0;
      this.position = void 0;
      this.weight = void 0;
      this.fullSize = void 0;
    }
    update(maxWidth, maxHeight, margins) {
      this.maxWidth = maxWidth;
      this.maxHeight = maxHeight;
      this._margins = margins;
      this.setDimensions();
      this.buildLabels();
      this.fit();
    }
    setDimensions() {
      if (this.isHorizontal()) {
        this.width = this.maxWidth;
        this.left = this._margins.left;
        this.right = this.width;
      } else {
        this.height = this.maxHeight;
        this.top = this._margins.top;
        this.bottom = this.height;
      }
    }
    buildLabels() {
      const labelOpts = this.options.labels || {};
      let legendItems = callback(labelOpts.generateLabels, [
        this.chart
      ], this) || [];
      if (labelOpts.filter) {
        legendItems = legendItems.filter((item) => labelOpts.filter(item, this.chart.data));
      }
      if (labelOpts.sort) {
        legendItems = legendItems.sort((a2, b2) => labelOpts.sort(a2, b2, this.chart.data));
      }
      if (this.options.reverse) {
        legendItems.reverse();
      }
      this.legendItems = legendItems;
    }
    fit() {
      const { options, ctx } = this;
      if (!options.display) {
        this.width = this.height = 0;
        return;
      }
      const labelOpts = options.labels;
      const labelFont = toFont(labelOpts.font);
      const fontSize = labelFont.size;
      const titleHeight = this._computeTitleHeight();
      const { boxWidth, itemHeight } = getBoxSize(labelOpts, fontSize);
      let width, height;
      ctx.font = labelFont.string;
      if (this.isHorizontal()) {
        width = this.maxWidth;
        height = this._fitRows(titleHeight, fontSize, boxWidth, itemHeight) + 10;
      } else {
        height = this.maxHeight;
        width = this._fitCols(titleHeight, labelFont, boxWidth, itemHeight) + 10;
      }
      this.width = Math.min(width, options.maxWidth || this.maxWidth);
      this.height = Math.min(height, options.maxHeight || this.maxHeight);
    }
    _fitRows(titleHeight, fontSize, boxWidth, itemHeight) {
      const { ctx, maxWidth, options: { labels: { padding } } } = this;
      const hitboxes = this.legendHitBoxes = [];
      const lineWidths = this.lineWidths = [
        0
      ];
      const lineHeight = itemHeight + padding;
      let totalHeight = titleHeight;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      let row = -1;
      let top = -lineHeight;
      this.legendItems.forEach((legendItem, i2) => {
        const itemWidth = boxWidth + fontSize / 2 + ctx.measureText(legendItem.text).width;
        if (i2 === 0 || lineWidths[lineWidths.length - 1] + itemWidth + 2 * padding > maxWidth) {
          totalHeight += lineHeight;
          lineWidths[lineWidths.length - (i2 > 0 ? 0 : 1)] = 0;
          top += lineHeight;
          row++;
        }
        hitboxes[i2] = {
          left: 0,
          top,
          row,
          width: itemWidth,
          height: itemHeight
        };
        lineWidths[lineWidths.length - 1] += itemWidth + padding;
      });
      return totalHeight;
    }
    _fitCols(titleHeight, labelFont, boxWidth, _itemHeight) {
      const { ctx, maxHeight, options: { labels: { padding } } } = this;
      const hitboxes = this.legendHitBoxes = [];
      const columnSizes = this.columnSizes = [];
      const heightLimit = maxHeight - titleHeight;
      let totalWidth = padding;
      let currentColWidth = 0;
      let currentColHeight = 0;
      let left = 0;
      let col = 0;
      this.legendItems.forEach((legendItem, i2) => {
        const { itemWidth, itemHeight } = calculateItemSize(boxWidth, labelFont, ctx, legendItem, _itemHeight);
        if (i2 > 0 && currentColHeight + itemHeight + 2 * padding > heightLimit) {
          totalWidth += currentColWidth + padding;
          columnSizes.push({
            width: currentColWidth,
            height: currentColHeight
          });
          left += currentColWidth + padding;
          col++;
          currentColWidth = currentColHeight = 0;
        }
        hitboxes[i2] = {
          left,
          top: currentColHeight,
          col,
          width: itemWidth,
          height: itemHeight
        };
        currentColWidth = Math.max(currentColWidth, itemWidth);
        currentColHeight += itemHeight + padding;
      });
      totalWidth += currentColWidth;
      columnSizes.push({
        width: currentColWidth,
        height: currentColHeight
      });
      return totalWidth;
    }
    adjustHitBoxes() {
      if (!this.options.display) {
        return;
      }
      const titleHeight = this._computeTitleHeight();
      const { legendHitBoxes: hitboxes, options: { align, labels: { padding }, rtl } } = this;
      const rtlHelper = getRtlAdapter(rtl, this.left, this.width);
      if (this.isHorizontal()) {
        let row = 0;
        let left = _alignStartEnd(align, this.left + padding, this.right - this.lineWidths[row]);
        for (const hitbox of hitboxes) {
          if (row !== hitbox.row) {
            row = hitbox.row;
            left = _alignStartEnd(align, this.left + padding, this.right - this.lineWidths[row]);
          }
          hitbox.top += this.top + titleHeight + padding;
          hitbox.left = rtlHelper.leftForLtr(rtlHelper.x(left), hitbox.width);
          left += hitbox.width + padding;
        }
      } else {
        let col = 0;
        let top = _alignStartEnd(align, this.top + titleHeight + padding, this.bottom - this.columnSizes[col].height);
        for (const hitbox of hitboxes) {
          if (hitbox.col !== col) {
            col = hitbox.col;
            top = _alignStartEnd(align, this.top + titleHeight + padding, this.bottom - this.columnSizes[col].height);
          }
          hitbox.top = top;
          hitbox.left += this.left + padding;
          hitbox.left = rtlHelper.leftForLtr(rtlHelper.x(hitbox.left), hitbox.width);
          top += hitbox.height + padding;
        }
      }
    }
    isHorizontal() {
      return this.options.position === "top" || this.options.position === "bottom";
    }
    draw() {
      if (this.options.display) {
        const ctx = this.ctx;
        clipArea(ctx, this);
        this._draw();
        unclipArea(ctx);
      }
    }
    _draw() {
      const { options: opts, columnSizes, lineWidths, ctx } = this;
      const { align, labels: labelOpts } = opts;
      const defaultColor = defaults.color;
      const rtlHelper = getRtlAdapter(opts.rtl, this.left, this.width);
      const labelFont = toFont(labelOpts.font);
      const { padding } = labelOpts;
      const fontSize = labelFont.size;
      const halfFontSize = fontSize / 2;
      let cursor;
      this.drawTitle();
      ctx.textAlign = rtlHelper.textAlign("left");
      ctx.textBaseline = "middle";
      ctx.lineWidth = 0.5;
      ctx.font = labelFont.string;
      const { boxWidth, boxHeight, itemHeight } = getBoxSize(labelOpts, fontSize);
      const drawLegendBox = function(x2, y2, legendItem) {
        if (isNaN(boxWidth) || boxWidth <= 0 || isNaN(boxHeight) || boxHeight < 0) {
          return;
        }
        ctx.save();
        const lineWidth = valueOrDefault(legendItem.lineWidth, 1);
        ctx.fillStyle = valueOrDefault(legendItem.fillStyle, defaultColor);
        ctx.lineCap = valueOrDefault(legendItem.lineCap, "butt");
        ctx.lineDashOffset = valueOrDefault(legendItem.lineDashOffset, 0);
        ctx.lineJoin = valueOrDefault(legendItem.lineJoin, "miter");
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = valueOrDefault(legendItem.strokeStyle, defaultColor);
        ctx.setLineDash(valueOrDefault(legendItem.lineDash, []));
        if (labelOpts.usePointStyle) {
          const drawOptions = {
            radius: boxHeight * Math.SQRT2 / 2,
            pointStyle: legendItem.pointStyle,
            rotation: legendItem.rotation,
            borderWidth: lineWidth
          };
          const centerX = rtlHelper.xPlus(x2, boxWidth / 2);
          const centerY = y2 + halfFontSize;
          drawPointLegend(ctx, drawOptions, centerX, centerY, labelOpts.pointStyleWidth && boxWidth);
        } else {
          const yBoxTop = y2 + Math.max((fontSize - boxHeight) / 2, 0);
          const xBoxLeft = rtlHelper.leftForLtr(x2, boxWidth);
          const borderRadius = toTRBLCorners(legendItem.borderRadius);
          ctx.beginPath();
          if (Object.values(borderRadius).some((v2) => v2 !== 0)) {
            addRoundedRectPath(ctx, {
              x: xBoxLeft,
              y: yBoxTop,
              w: boxWidth,
              h: boxHeight,
              radius: borderRadius
            });
          } else {
            ctx.rect(xBoxLeft, yBoxTop, boxWidth, boxHeight);
          }
          ctx.fill();
          if (lineWidth !== 0) {
            ctx.stroke();
          }
        }
        ctx.restore();
      };
      const fillText = function(x2, y2, legendItem) {
        renderText(ctx, legendItem.text, x2, y2 + itemHeight / 2, labelFont, {
          strikethrough: legendItem.hidden,
          textAlign: rtlHelper.textAlign(legendItem.textAlign)
        });
      };
      const isHorizontal = this.isHorizontal();
      const titleHeight = this._computeTitleHeight();
      if (isHorizontal) {
        cursor = {
          x: _alignStartEnd(align, this.left + padding, this.right - lineWidths[0]),
          y: this.top + padding + titleHeight,
          line: 0
        };
      } else {
        cursor = {
          x: this.left + padding,
          y: _alignStartEnd(align, this.top + titleHeight + padding, this.bottom - columnSizes[0].height),
          line: 0
        };
      }
      overrideTextDirection(this.ctx, opts.textDirection);
      const lineHeight = itemHeight + padding;
      this.legendItems.forEach((legendItem, i2) => {
        ctx.strokeStyle = legendItem.fontColor;
        ctx.fillStyle = legendItem.fontColor;
        const textWidth = ctx.measureText(legendItem.text).width;
        const textAlign = rtlHelper.textAlign(legendItem.textAlign || (legendItem.textAlign = labelOpts.textAlign));
        const width = boxWidth + halfFontSize + textWidth;
        let x2 = cursor.x;
        let y2 = cursor.y;
        rtlHelper.setWidth(this.width);
        if (isHorizontal) {
          if (i2 > 0 && x2 + width + padding > this.right) {
            y2 = cursor.y += lineHeight;
            cursor.line++;
            x2 = cursor.x = _alignStartEnd(align, this.left + padding, this.right - lineWidths[cursor.line]);
          }
        } else if (i2 > 0 && y2 + lineHeight > this.bottom) {
          x2 = cursor.x = x2 + columnSizes[cursor.line].width + padding;
          cursor.line++;
          y2 = cursor.y = _alignStartEnd(align, this.top + titleHeight + padding, this.bottom - columnSizes[cursor.line].height);
        }
        const realX = rtlHelper.x(x2);
        drawLegendBox(realX, y2, legendItem);
        x2 = _textX(textAlign, x2 + boxWidth + halfFontSize, isHorizontal ? x2 + width : this.right, opts.rtl);
        fillText(rtlHelper.x(x2), y2, legendItem);
        if (isHorizontal) {
          cursor.x += width + padding;
        } else if (typeof legendItem.text !== "string") {
          const fontLineHeight = labelFont.lineHeight;
          cursor.y += calculateLegendItemHeight(legendItem, fontLineHeight) + padding;
        } else {
          cursor.y += lineHeight;
        }
      });
      restoreTextDirection(this.ctx, opts.textDirection);
    }
    drawTitle() {
      const opts = this.options;
      const titleOpts = opts.title;
      const titleFont = toFont(titleOpts.font);
      const titlePadding = toPadding(titleOpts.padding);
      if (!titleOpts.display) {
        return;
      }
      const rtlHelper = getRtlAdapter(opts.rtl, this.left, this.width);
      const ctx = this.ctx;
      const position = titleOpts.position;
      const halfFontSize = titleFont.size / 2;
      const topPaddingPlusHalfFontSize = titlePadding.top + halfFontSize;
      let y2;
      let left = this.left;
      let maxWidth = this.width;
      if (this.isHorizontal()) {
        maxWidth = Math.max(...this.lineWidths);
        y2 = this.top + topPaddingPlusHalfFontSize;
        left = _alignStartEnd(opts.align, left, this.right - maxWidth);
      } else {
        const maxHeight = this.columnSizes.reduce((acc, size) => Math.max(acc, size.height), 0);
        y2 = topPaddingPlusHalfFontSize + _alignStartEnd(opts.align, this.top, this.bottom - maxHeight - opts.labels.padding - this._computeTitleHeight());
      }
      const x2 = _alignStartEnd(position, left, left + maxWidth);
      ctx.textAlign = rtlHelper.textAlign(_toLeftRightCenter(position));
      ctx.textBaseline = "middle";
      ctx.strokeStyle = titleOpts.color;
      ctx.fillStyle = titleOpts.color;
      ctx.font = titleFont.string;
      renderText(ctx, titleOpts.text, x2, y2, titleFont);
    }
    _computeTitleHeight() {
      const titleOpts = this.options.title;
      const titleFont = toFont(titleOpts.font);
      const titlePadding = toPadding(titleOpts.padding);
      return titleOpts.display ? titleFont.lineHeight + titlePadding.height : 0;
    }
    _getLegendItemAt(x2, y2) {
      let i2, hitBox, lh;
      if (_isBetween(x2, this.left, this.right) && _isBetween(y2, this.top, this.bottom)) {
        lh = this.legendHitBoxes;
        for (i2 = 0; i2 < lh.length; ++i2) {
          hitBox = lh[i2];
          if (_isBetween(x2, hitBox.left, hitBox.left + hitBox.width) && _isBetween(y2, hitBox.top, hitBox.top + hitBox.height)) {
            return this.legendItems[i2];
          }
        }
      }
      return null;
    }
    handleEvent(e2) {
      const opts = this.options;
      if (!isListened(e2.type, opts)) {
        return;
      }
      const hoveredItem = this._getLegendItemAt(e2.x, e2.y);
      if (e2.type === "mousemove" || e2.type === "mouseout") {
        const previous = this._hoveredItem;
        const sameItem = itemsEqual(previous, hoveredItem);
        if (previous && !sameItem) {
          callback(opts.onLeave, [
            e2,
            previous,
            this
          ], this);
        }
        this._hoveredItem = hoveredItem;
        if (hoveredItem && !sameItem) {
          callback(opts.onHover, [
            e2,
            hoveredItem,
            this
          ], this);
        }
      } else if (hoveredItem) {
        callback(opts.onClick, [
          e2,
          hoveredItem,
          this
        ], this);
      }
    }
  };
  function calculateItemSize(boxWidth, labelFont, ctx, legendItem, _itemHeight) {
    const itemWidth = calculateItemWidth(legendItem, boxWidth, labelFont, ctx);
    const itemHeight = calculateItemHeight(_itemHeight, legendItem, labelFont.lineHeight);
    return {
      itemWidth,
      itemHeight
    };
  }
  function calculateItemWidth(legendItem, boxWidth, labelFont, ctx) {
    let legendItemText = legendItem.text;
    if (legendItemText && typeof legendItemText !== "string") {
      legendItemText = legendItemText.reduce((a2, b2) => a2.length > b2.length ? a2 : b2);
    }
    return boxWidth + labelFont.size / 2 + ctx.measureText(legendItemText).width;
  }
  function calculateItemHeight(_itemHeight, legendItem, fontLineHeight) {
    let itemHeight = _itemHeight;
    if (typeof legendItem.text !== "string") {
      itemHeight = calculateLegendItemHeight(legendItem, fontLineHeight);
    }
    return itemHeight;
  }
  function calculateLegendItemHeight(legendItem, fontLineHeight) {
    const labelHeight = legendItem.text ? legendItem.text.length : 0;
    return fontLineHeight * labelHeight;
  }
  function isListened(type, opts) {
    if ((type === "mousemove" || type === "mouseout") && (opts.onHover || opts.onLeave)) {
      return true;
    }
    if (opts.onClick && (type === "click" || type === "mouseup")) {
      return true;
    }
    return false;
  }
  var plugin_legend = {
    id: "legend",
    _element: Legend,
    start(chart, _args, options) {
      const legend = chart.legend = new Legend({
        ctx: chart.ctx,
        options,
        chart
      });
      layouts.configure(chart, legend, options);
      layouts.addBox(chart, legend);
    },
    stop(chart) {
      layouts.removeBox(chart, chart.legend);
      delete chart.legend;
    },
    beforeUpdate(chart, _args, options) {
      const legend = chart.legend;
      layouts.configure(chart, legend, options);
      legend.options = options;
    },
    afterUpdate(chart) {
      const legend = chart.legend;
      legend.buildLabels();
      legend.adjustHitBoxes();
    },
    afterEvent(chart, args) {
      if (!args.replay) {
        chart.legend.handleEvent(args.event);
      }
    },
    defaults: {
      display: true,
      position: "top",
      align: "center",
      fullSize: true,
      reverse: false,
      weight: 1e3,
      onClick(e2, legendItem, legend) {
        const index3 = legendItem.datasetIndex;
        const ci = legend.chart;
        if (ci.isDatasetVisible(index3)) {
          ci.hide(index3);
          legendItem.hidden = true;
        } else {
          ci.show(index3);
          legendItem.hidden = false;
        }
      },
      onHover: null,
      onLeave: null,
      labels: {
        color: (ctx) => ctx.chart.options.color,
        boxWidth: 40,
        padding: 10,
        generateLabels(chart) {
          const datasets = chart.data.datasets;
          const { labels: { usePointStyle, pointStyle, textAlign, color: color2, useBorderRadius, borderRadius } } = chart.legend.options;
          return chart._getSortedDatasetMetas().map((meta) => {
            const style = meta.controller.getStyle(usePointStyle ? 0 : void 0);
            const borderWidth = toPadding(style.borderWidth);
            return {
              text: datasets[meta.index].label,
              fillStyle: style.backgroundColor,
              fontColor: color2,
              hidden: !meta.visible,
              lineCap: style.borderCapStyle,
              lineDash: style.borderDash,
              lineDashOffset: style.borderDashOffset,
              lineJoin: style.borderJoinStyle,
              lineWidth: (borderWidth.width + borderWidth.height) / 4,
              strokeStyle: style.borderColor,
              pointStyle: pointStyle || style.pointStyle,
              rotation: style.rotation,
              textAlign: textAlign || style.textAlign,
              borderRadius: useBorderRadius && (borderRadius || style.borderRadius),
              datasetIndex: meta.index
            };
          }, this);
        }
      },
      title: {
        color: (ctx) => ctx.chart.options.color,
        display: false,
        position: "center",
        text: ""
      }
    },
    descriptors: {
      _scriptable: (name) => !name.startsWith("on"),
      labels: {
        _scriptable: (name) => ![
          "generateLabels",
          "filter",
          "sort"
        ].includes(name)
      }
    }
  };
  var positioners = {
    average(items) {
      if (!items.length) {
        return false;
      }
      let i2, len;
      let xSet = /* @__PURE__ */ new Set();
      let y2 = 0;
      let count = 0;
      for (i2 = 0, len = items.length; i2 < len; ++i2) {
        const el2 = items[i2].element;
        if (el2 && el2.hasValue()) {
          const pos = el2.tooltipPosition();
          xSet.add(pos.x);
          y2 += pos.y;
          ++count;
        }
      }
      if (count === 0 || xSet.size === 0) {
        return false;
      }
      const xAverage = [
        ...xSet
      ].reduce((a2, b2) => a2 + b2) / xSet.size;
      return {
        x: xAverage,
        y: y2 / count
      };
    },
    nearest(items, eventPosition) {
      if (!items.length) {
        return false;
      }
      let x2 = eventPosition.x;
      let y2 = eventPosition.y;
      let minDistance = Number.POSITIVE_INFINITY;
      let i2, len, nearestElement;
      for (i2 = 0, len = items.length; i2 < len; ++i2) {
        const el2 = items[i2].element;
        if (el2 && el2.hasValue()) {
          const center = el2.getCenterPoint();
          const d2 = distanceBetweenPoints(eventPosition, center);
          if (d2 < minDistance) {
            minDistance = d2;
            nearestElement = el2;
          }
        }
      }
      if (nearestElement) {
        const tp = nearestElement.tooltipPosition();
        x2 = tp.x;
        y2 = tp.y;
      }
      return {
        x: x2,
        y: y2
      };
    }
  };
  function pushOrConcat(base, toPush) {
    if (toPush) {
      if (isArray(toPush)) {
        Array.prototype.push.apply(base, toPush);
      } else {
        base.push(toPush);
      }
    }
    return base;
  }
  function splitNewlines(str) {
    if ((typeof str === "string" || str instanceof String) && str.indexOf("\n") > -1) {
      return str.split("\n");
    }
    return str;
  }
  function createTooltipItem(chart, item) {
    const { element, datasetIndex, index: index3 } = item;
    const controller = chart.getDatasetMeta(datasetIndex).controller;
    const { label, value } = controller.getLabelAndValue(index3);
    return {
      chart,
      label,
      parsed: controller.getParsed(index3),
      raw: chart.data.datasets[datasetIndex].data[index3],
      formattedValue: value,
      dataset: controller.getDataset(),
      dataIndex: index3,
      datasetIndex,
      element
    };
  }
  function getTooltipSize(tooltip, options) {
    const ctx = tooltip.chart.ctx;
    const { body, footer, title } = tooltip;
    const { boxWidth, boxHeight } = options;
    const bodyFont = toFont(options.bodyFont);
    const titleFont = toFont(options.titleFont);
    const footerFont = toFont(options.footerFont);
    const titleLineCount = title.length;
    const footerLineCount = footer.length;
    const bodyLineItemCount = body.length;
    const padding = toPadding(options.padding);
    let height = padding.height;
    let width = 0;
    let combinedBodyLength = body.reduce((count, bodyItem) => count + bodyItem.before.length + bodyItem.lines.length + bodyItem.after.length, 0);
    combinedBodyLength += tooltip.beforeBody.length + tooltip.afterBody.length;
    if (titleLineCount) {
      height += titleLineCount * titleFont.lineHeight + (titleLineCount - 1) * options.titleSpacing + options.titleMarginBottom;
    }
    if (combinedBodyLength) {
      const bodyLineHeight = options.displayColors ? Math.max(boxHeight, bodyFont.lineHeight) : bodyFont.lineHeight;
      height += bodyLineItemCount * bodyLineHeight + (combinedBodyLength - bodyLineItemCount) * bodyFont.lineHeight + (combinedBodyLength - 1) * options.bodySpacing;
    }
    if (footerLineCount) {
      height += options.footerMarginTop + footerLineCount * footerFont.lineHeight + (footerLineCount - 1) * options.footerSpacing;
    }
    let widthPadding = 0;
    const maxLineWidth = function(line) {
      width = Math.max(width, ctx.measureText(line).width + widthPadding);
    };
    ctx.save();
    ctx.font = titleFont.string;
    each(tooltip.title, maxLineWidth);
    ctx.font = bodyFont.string;
    each(tooltip.beforeBody.concat(tooltip.afterBody), maxLineWidth);
    widthPadding = options.displayColors ? boxWidth + 2 + options.boxPadding : 0;
    each(body, (bodyItem) => {
      each(bodyItem.before, maxLineWidth);
      each(bodyItem.lines, maxLineWidth);
      each(bodyItem.after, maxLineWidth);
    });
    widthPadding = 0;
    ctx.font = footerFont.string;
    each(tooltip.footer, maxLineWidth);
    ctx.restore();
    width += padding.width;
    return {
      width,
      height
    };
  }
  function determineYAlign(chart, size) {
    const { y: y2, height } = size;
    if (y2 < height / 2) {
      return "top";
    } else if (y2 > chart.height - height / 2) {
      return "bottom";
    }
    return "center";
  }
  function doesNotFitWithAlign(xAlign, chart, options, size) {
    const { x: x2, width } = size;
    const caret = options.caretSize + options.caretPadding;
    if (xAlign === "left" && x2 + width + caret > chart.width) {
      return true;
    }
    if (xAlign === "right" && x2 - width - caret < 0) {
      return true;
    }
  }
  function determineXAlign(chart, options, size, yAlign) {
    const { x: x2, width } = size;
    const { width: chartWidth, chartArea: { left, right } } = chart;
    let xAlign = "center";
    if (yAlign === "center") {
      xAlign = x2 <= (left + right) / 2 ? "left" : "right";
    } else if (x2 <= width / 2) {
      xAlign = "left";
    } else if (x2 >= chartWidth - width / 2) {
      xAlign = "right";
    }
    if (doesNotFitWithAlign(xAlign, chart, options, size)) {
      xAlign = "center";
    }
    return xAlign;
  }
  function determineAlignment(chart, options, size) {
    const yAlign = size.yAlign || options.yAlign || determineYAlign(chart, size);
    return {
      xAlign: size.xAlign || options.xAlign || determineXAlign(chart, options, size, yAlign),
      yAlign
    };
  }
  function alignX(size, xAlign) {
    let { x: x2, width } = size;
    if (xAlign === "right") {
      x2 -= width;
    } else if (xAlign === "center") {
      x2 -= width / 2;
    }
    return x2;
  }
  function alignY(size, yAlign, paddingAndSize) {
    let { y: y2, height } = size;
    if (yAlign === "top") {
      y2 += paddingAndSize;
    } else if (yAlign === "bottom") {
      y2 -= height + paddingAndSize;
    } else {
      y2 -= height / 2;
    }
    return y2;
  }
  function getBackgroundPoint(options, size, alignment, chart) {
    const { caretSize, caretPadding, cornerRadius } = options;
    const { xAlign, yAlign } = alignment;
    const paddingAndSize = caretSize + caretPadding;
    const { topLeft, topRight, bottomLeft, bottomRight } = toTRBLCorners(cornerRadius);
    let x2 = alignX(size, xAlign);
    const y2 = alignY(size, yAlign, paddingAndSize);
    if (yAlign === "center") {
      if (xAlign === "left") {
        x2 += paddingAndSize;
      } else if (xAlign === "right") {
        x2 -= paddingAndSize;
      }
    } else if (xAlign === "left") {
      x2 -= Math.max(topLeft, bottomLeft) + caretSize;
    } else if (xAlign === "right") {
      x2 += Math.max(topRight, bottomRight) + caretSize;
    }
    return {
      x: _limitValue(x2, 0, chart.width - size.width),
      y: _limitValue(y2, 0, chart.height - size.height)
    };
  }
  function getAlignedX(tooltip, align, options) {
    const padding = toPadding(options.padding);
    return align === "center" ? tooltip.x + tooltip.width / 2 : align === "right" ? tooltip.x + tooltip.width - padding.right : tooltip.x + padding.left;
  }
  function getBeforeAfterBodyLines(callback2) {
    return pushOrConcat([], splitNewlines(callback2));
  }
  function createTooltipContext(parent, tooltip, tooltipItems) {
    return createContext(parent, {
      tooltip,
      tooltipItems,
      type: "tooltip"
    });
  }
  function overrideCallbacks(callbacks, context) {
    const override = context && context.dataset && context.dataset.tooltip && context.dataset.tooltip.callbacks;
    return override ? callbacks.override(override) : callbacks;
  }
  var defaultCallbacks = {
    beforeTitle: noop,
    title(tooltipItems) {
      if (tooltipItems.length > 0) {
        const item = tooltipItems[0];
        const labels = item.chart.data.labels;
        const labelCount = labels ? labels.length : 0;
        if (this && this.options && this.options.mode === "dataset") {
          return item.dataset.label || "";
        } else if (item.label) {
          return item.label;
        } else if (labelCount > 0 && item.dataIndex < labelCount) {
          return labels[item.dataIndex];
        }
      }
      return "";
    },
    afterTitle: noop,
    beforeBody: noop,
    beforeLabel: noop,
    label(tooltipItem) {
      if (this && this.options && this.options.mode === "dataset") {
        return tooltipItem.label + ": " + tooltipItem.formattedValue || tooltipItem.formattedValue;
      }
      let label = tooltipItem.dataset.label || "";
      if (label) {
        label += ": ";
      }
      const value = tooltipItem.formattedValue;
      if (!isNullOrUndef(value)) {
        label += value;
      }
      return label;
    },
    labelColor(tooltipItem) {
      const meta = tooltipItem.chart.getDatasetMeta(tooltipItem.datasetIndex);
      const options = meta.controller.getStyle(tooltipItem.dataIndex);
      return {
        borderColor: options.borderColor,
        backgroundColor: options.backgroundColor,
        borderWidth: options.borderWidth,
        borderDash: options.borderDash,
        borderDashOffset: options.borderDashOffset,
        borderRadius: 0
      };
    },
    labelTextColor() {
      return this.options.bodyColor;
    },
    labelPointStyle(tooltipItem) {
      const meta = tooltipItem.chart.getDatasetMeta(tooltipItem.datasetIndex);
      const options = meta.controller.getStyle(tooltipItem.dataIndex);
      return {
        pointStyle: options.pointStyle,
        rotation: options.rotation
      };
    },
    afterLabel: noop,
    afterBody: noop,
    beforeFooter: noop,
    footer: noop,
    afterFooter: noop
  };
  function invokeCallbackWithFallback(callbacks, name, ctx, arg) {
    const result = callbacks[name].call(ctx, arg);
    if (typeof result === "undefined") {
      return defaultCallbacks[name].call(ctx, arg);
    }
    return result;
  }
  var Tooltip = class extends Element {
    static positioners = positioners;
    constructor(config) {
      super();
      this.opacity = 0;
      this._active = [];
      this._eventPosition = void 0;
      this._size = void 0;
      this._cachedAnimations = void 0;
      this._tooltipItems = [];
      this.$animations = void 0;
      this.$context = void 0;
      this.chart = config.chart;
      this.options = config.options;
      this.dataPoints = void 0;
      this.title = void 0;
      this.beforeBody = void 0;
      this.body = void 0;
      this.afterBody = void 0;
      this.footer = void 0;
      this.xAlign = void 0;
      this.yAlign = void 0;
      this.x = void 0;
      this.y = void 0;
      this.height = void 0;
      this.width = void 0;
      this.caretX = void 0;
      this.caretY = void 0;
      this.labelColors = void 0;
      this.labelPointStyles = void 0;
      this.labelTextColors = void 0;
    }
    initialize(options) {
      this.options = options;
      this._cachedAnimations = void 0;
      this.$context = void 0;
    }
    _resolveAnimations() {
      const cached = this._cachedAnimations;
      if (cached) {
        return cached;
      }
      const chart = this.chart;
      const options = this.options.setContext(this.getContext());
      const opts = options.enabled && chart.options.animation && options.animations;
      const animations = new Animations(this.chart, opts);
      if (opts._cacheable) {
        this._cachedAnimations = Object.freeze(animations);
      }
      return animations;
    }
    getContext() {
      return this.$context || (this.$context = createTooltipContext(this.chart.getContext(), this, this._tooltipItems));
    }
    getTitle(context, options) {
      const { callbacks } = options;
      const beforeTitle = invokeCallbackWithFallback(callbacks, "beforeTitle", this, context);
      const title = invokeCallbackWithFallback(callbacks, "title", this, context);
      const afterTitle = invokeCallbackWithFallback(callbacks, "afterTitle", this, context);
      let lines = [];
      lines = pushOrConcat(lines, splitNewlines(beforeTitle));
      lines = pushOrConcat(lines, splitNewlines(title));
      lines = pushOrConcat(lines, splitNewlines(afterTitle));
      return lines;
    }
    getBeforeBody(tooltipItems, options) {
      return getBeforeAfterBodyLines(invokeCallbackWithFallback(options.callbacks, "beforeBody", this, tooltipItems));
    }
    getBody(tooltipItems, options) {
      const { callbacks } = options;
      const bodyItems = [];
      each(tooltipItems, (context) => {
        const bodyItem = {
          before: [],
          lines: [],
          after: []
        };
        const scoped = overrideCallbacks(callbacks, context);
        pushOrConcat(bodyItem.before, splitNewlines(invokeCallbackWithFallback(scoped, "beforeLabel", this, context)));
        pushOrConcat(bodyItem.lines, invokeCallbackWithFallback(scoped, "label", this, context));
        pushOrConcat(bodyItem.after, splitNewlines(invokeCallbackWithFallback(scoped, "afterLabel", this, context)));
        bodyItems.push(bodyItem);
      });
      return bodyItems;
    }
    getAfterBody(tooltipItems, options) {
      return getBeforeAfterBodyLines(invokeCallbackWithFallback(options.callbacks, "afterBody", this, tooltipItems));
    }
    getFooter(tooltipItems, options) {
      const { callbacks } = options;
      const beforeFooter = invokeCallbackWithFallback(callbacks, "beforeFooter", this, tooltipItems);
      const footer = invokeCallbackWithFallback(callbacks, "footer", this, tooltipItems);
      const afterFooter = invokeCallbackWithFallback(callbacks, "afterFooter", this, tooltipItems);
      let lines = [];
      lines = pushOrConcat(lines, splitNewlines(beforeFooter));
      lines = pushOrConcat(lines, splitNewlines(footer));
      lines = pushOrConcat(lines, splitNewlines(afterFooter));
      return lines;
    }
    _createItems(options) {
      const active = this._active;
      const data = this.chart.data;
      const labelColors = [];
      const labelPointStyles = [];
      const labelTextColors = [];
      let tooltipItems = [];
      let i2, len;
      for (i2 = 0, len = active.length; i2 < len; ++i2) {
        tooltipItems.push(createTooltipItem(this.chart, active[i2]));
      }
      if (options.filter) {
        tooltipItems = tooltipItems.filter((element, index3, array) => options.filter(element, index3, array, data));
      }
      if (options.itemSort) {
        tooltipItems = tooltipItems.sort((a2, b2) => options.itemSort(a2, b2, data));
      }
      each(tooltipItems, (context) => {
        const scoped = overrideCallbacks(options.callbacks, context);
        labelColors.push(invokeCallbackWithFallback(scoped, "labelColor", this, context));
        labelPointStyles.push(invokeCallbackWithFallback(scoped, "labelPointStyle", this, context));
        labelTextColors.push(invokeCallbackWithFallback(scoped, "labelTextColor", this, context));
      });
      this.labelColors = labelColors;
      this.labelPointStyles = labelPointStyles;
      this.labelTextColors = labelTextColors;
      this.dataPoints = tooltipItems;
      return tooltipItems;
    }
    update(changed, replay) {
      const options = this.options.setContext(this.getContext());
      const active = this._active;
      let properties;
      let tooltipItems = [];
      if (!active.length) {
        if (this.opacity !== 0) {
          properties = {
            opacity: 0
          };
        }
      } else {
        const position = positioners[options.position].call(this, active, this._eventPosition);
        tooltipItems = this._createItems(options);
        this.title = this.getTitle(tooltipItems, options);
        this.beforeBody = this.getBeforeBody(tooltipItems, options);
        this.body = this.getBody(tooltipItems, options);
        this.afterBody = this.getAfterBody(tooltipItems, options);
        this.footer = this.getFooter(tooltipItems, options);
        const size = this._size = getTooltipSize(this, options);
        const positionAndSize = Object.assign({}, position, size);
        const alignment = determineAlignment(this.chart, options, positionAndSize);
        const backgroundPoint = getBackgroundPoint(options, positionAndSize, alignment, this.chart);
        this.xAlign = alignment.xAlign;
        this.yAlign = alignment.yAlign;
        properties = {
          opacity: 1,
          x: backgroundPoint.x,
          y: backgroundPoint.y,
          width: size.width,
          height: size.height,
          caretX: position.x,
          caretY: position.y
        };
      }
      this._tooltipItems = tooltipItems;
      this.$context = void 0;
      if (properties) {
        this._resolveAnimations().update(this, properties);
      }
      if (changed && options.external) {
        options.external.call(this, {
          chart: this.chart,
          tooltip: this,
          replay
        });
      }
    }
    drawCaret(tooltipPoint, ctx, size, options) {
      const caretPosition = this.getCaretPosition(tooltipPoint, size, options);
      ctx.lineTo(caretPosition.x1, caretPosition.y1);
      ctx.lineTo(caretPosition.x2, caretPosition.y2);
      ctx.lineTo(caretPosition.x3, caretPosition.y3);
    }
    getCaretPosition(tooltipPoint, size, options) {
      const { xAlign, yAlign } = this;
      const { caretSize, cornerRadius } = options;
      const { topLeft, topRight, bottomLeft, bottomRight } = toTRBLCorners(cornerRadius);
      const { x: ptX, y: ptY } = tooltipPoint;
      const { width, height } = size;
      let x1, x2, x3, y1, y2, y3;
      if (yAlign === "center") {
        y2 = ptY + height / 2;
        if (xAlign === "left") {
          x1 = ptX;
          x2 = x1 - caretSize;
          y1 = y2 + caretSize;
          y3 = y2 - caretSize;
        } else {
          x1 = ptX + width;
          x2 = x1 + caretSize;
          y1 = y2 - caretSize;
          y3 = y2 + caretSize;
        }
        x3 = x1;
      } else {
        if (xAlign === "left") {
          x2 = ptX + Math.max(topLeft, bottomLeft) + caretSize;
        } else if (xAlign === "right") {
          x2 = ptX + width - Math.max(topRight, bottomRight) - caretSize;
        } else {
          x2 = this.caretX;
        }
        if (yAlign === "top") {
          y1 = ptY;
          y2 = y1 - caretSize;
          x1 = x2 - caretSize;
          x3 = x2 + caretSize;
        } else {
          y1 = ptY + height;
          y2 = y1 + caretSize;
          x1 = x2 + caretSize;
          x3 = x2 - caretSize;
        }
        y3 = y1;
      }
      return {
        x1,
        x2,
        x3,
        y1,
        y2,
        y3
      };
    }
    drawTitle(pt, ctx, options) {
      const title = this.title;
      const length = title.length;
      let titleFont, titleSpacing, i2;
      if (length) {
        const rtlHelper = getRtlAdapter(options.rtl, this.x, this.width);
        pt.x = getAlignedX(this, options.titleAlign, options);
        ctx.textAlign = rtlHelper.textAlign(options.titleAlign);
        ctx.textBaseline = "middle";
        titleFont = toFont(options.titleFont);
        titleSpacing = options.titleSpacing;
        ctx.fillStyle = options.titleColor;
        ctx.font = titleFont.string;
        for (i2 = 0; i2 < length; ++i2) {
          ctx.fillText(title[i2], rtlHelper.x(pt.x), pt.y + titleFont.lineHeight / 2);
          pt.y += titleFont.lineHeight + titleSpacing;
          if (i2 + 1 === length) {
            pt.y += options.titleMarginBottom - titleSpacing;
          }
        }
      }
    }
    _drawColorBox(ctx, pt, i2, rtlHelper, options) {
      const labelColor = this.labelColors[i2];
      const labelPointStyle = this.labelPointStyles[i2];
      const { boxHeight, boxWidth } = options;
      const bodyFont = toFont(options.bodyFont);
      const colorX = getAlignedX(this, "left", options);
      const rtlColorX = rtlHelper.x(colorX);
      const yOffSet = boxHeight < bodyFont.lineHeight ? (bodyFont.lineHeight - boxHeight) / 2 : 0;
      const colorY = pt.y + yOffSet;
      if (options.usePointStyle) {
        const drawOptions = {
          radius: Math.min(boxWidth, boxHeight) / 2,
          pointStyle: labelPointStyle.pointStyle,
          rotation: labelPointStyle.rotation,
          borderWidth: 1
        };
        const centerX = rtlHelper.leftForLtr(rtlColorX, boxWidth) + boxWidth / 2;
        const centerY = colorY + boxHeight / 2;
        ctx.strokeStyle = options.multiKeyBackground;
        ctx.fillStyle = options.multiKeyBackground;
        drawPoint(ctx, drawOptions, centerX, centerY);
        ctx.strokeStyle = labelColor.borderColor;
        ctx.fillStyle = labelColor.backgroundColor;
        drawPoint(ctx, drawOptions, centerX, centerY);
      } else {
        ctx.lineWidth = isObject(labelColor.borderWidth) ? Math.max(...Object.values(labelColor.borderWidth)) : labelColor.borderWidth || 1;
        ctx.strokeStyle = labelColor.borderColor;
        ctx.setLineDash(labelColor.borderDash || []);
        ctx.lineDashOffset = labelColor.borderDashOffset || 0;
        const outerX = rtlHelper.leftForLtr(rtlColorX, boxWidth);
        const innerX = rtlHelper.leftForLtr(rtlHelper.xPlus(rtlColorX, 1), boxWidth - 2);
        const borderRadius = toTRBLCorners(labelColor.borderRadius);
        if (Object.values(borderRadius).some((v2) => v2 !== 0)) {
          ctx.beginPath();
          ctx.fillStyle = options.multiKeyBackground;
          addRoundedRectPath(ctx, {
            x: outerX,
            y: colorY,
            w: boxWidth,
            h: boxHeight,
            radius: borderRadius
          });
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = labelColor.backgroundColor;
          ctx.beginPath();
          addRoundedRectPath(ctx, {
            x: innerX,
            y: colorY + 1,
            w: boxWidth - 2,
            h: boxHeight - 2,
            radius: borderRadius
          });
          ctx.fill();
        } else {
          ctx.fillStyle = options.multiKeyBackground;
          ctx.fillRect(outerX, colorY, boxWidth, boxHeight);
          ctx.strokeRect(outerX, colorY, boxWidth, boxHeight);
          ctx.fillStyle = labelColor.backgroundColor;
          ctx.fillRect(innerX, colorY + 1, boxWidth - 2, boxHeight - 2);
        }
      }
      ctx.fillStyle = this.labelTextColors[i2];
    }
    drawBody(pt, ctx, options) {
      const { body } = this;
      const { bodySpacing, bodyAlign, displayColors, boxHeight, boxWidth, boxPadding } = options;
      const bodyFont = toFont(options.bodyFont);
      let bodyLineHeight = bodyFont.lineHeight;
      let xLinePadding = 0;
      const rtlHelper = getRtlAdapter(options.rtl, this.x, this.width);
      const fillLineOfText = function(line) {
        ctx.fillText(line, rtlHelper.x(pt.x + xLinePadding), pt.y + bodyLineHeight / 2);
        pt.y += bodyLineHeight + bodySpacing;
      };
      const bodyAlignForCalculation = rtlHelper.textAlign(bodyAlign);
      let bodyItem, textColor, lines, i2, j2, ilen, jlen;
      ctx.textAlign = bodyAlign;
      ctx.textBaseline = "middle";
      ctx.font = bodyFont.string;
      pt.x = getAlignedX(this, bodyAlignForCalculation, options);
      ctx.fillStyle = options.bodyColor;
      each(this.beforeBody, fillLineOfText);
      xLinePadding = displayColors && bodyAlignForCalculation !== "right" ? bodyAlign === "center" ? boxWidth / 2 + boxPadding : boxWidth + 2 + boxPadding : 0;
      for (i2 = 0, ilen = body.length; i2 < ilen; ++i2) {
        bodyItem = body[i2];
        textColor = this.labelTextColors[i2];
        ctx.fillStyle = textColor;
        each(bodyItem.before, fillLineOfText);
        lines = bodyItem.lines;
        if (displayColors && lines.length) {
          this._drawColorBox(ctx, pt, i2, rtlHelper, options);
          bodyLineHeight = Math.max(bodyFont.lineHeight, boxHeight);
        }
        for (j2 = 0, jlen = lines.length; j2 < jlen; ++j2) {
          fillLineOfText(lines[j2]);
          bodyLineHeight = bodyFont.lineHeight;
        }
        each(bodyItem.after, fillLineOfText);
      }
      xLinePadding = 0;
      bodyLineHeight = bodyFont.lineHeight;
      each(this.afterBody, fillLineOfText);
      pt.y -= bodySpacing;
    }
    drawFooter(pt, ctx, options) {
      const footer = this.footer;
      const length = footer.length;
      let footerFont, i2;
      if (length) {
        const rtlHelper = getRtlAdapter(options.rtl, this.x, this.width);
        pt.x = getAlignedX(this, options.footerAlign, options);
        pt.y += options.footerMarginTop;
        ctx.textAlign = rtlHelper.textAlign(options.footerAlign);
        ctx.textBaseline = "middle";
        footerFont = toFont(options.footerFont);
        ctx.fillStyle = options.footerColor;
        ctx.font = footerFont.string;
        for (i2 = 0; i2 < length; ++i2) {
          ctx.fillText(footer[i2], rtlHelper.x(pt.x), pt.y + footerFont.lineHeight / 2);
          pt.y += footerFont.lineHeight + options.footerSpacing;
        }
      }
    }
    drawBackground(pt, ctx, tooltipSize, options) {
      const { xAlign, yAlign } = this;
      const { x: x2, y: y2 } = pt;
      const { width, height } = tooltipSize;
      const { topLeft, topRight, bottomLeft, bottomRight } = toTRBLCorners(options.cornerRadius);
      ctx.fillStyle = options.backgroundColor;
      ctx.strokeStyle = options.borderColor;
      ctx.lineWidth = options.borderWidth;
      ctx.beginPath();
      ctx.moveTo(x2 + topLeft, y2);
      if (yAlign === "top") {
        this.drawCaret(pt, ctx, tooltipSize, options);
      }
      ctx.lineTo(x2 + width - topRight, y2);
      ctx.quadraticCurveTo(x2 + width, y2, x2 + width, y2 + topRight);
      if (yAlign === "center" && xAlign === "right") {
        this.drawCaret(pt, ctx, tooltipSize, options);
      }
      ctx.lineTo(x2 + width, y2 + height - bottomRight);
      ctx.quadraticCurveTo(x2 + width, y2 + height, x2 + width - bottomRight, y2 + height);
      if (yAlign === "bottom") {
        this.drawCaret(pt, ctx, tooltipSize, options);
      }
      ctx.lineTo(x2 + bottomLeft, y2 + height);
      ctx.quadraticCurveTo(x2, y2 + height, x2, y2 + height - bottomLeft);
      if (yAlign === "center" && xAlign === "left") {
        this.drawCaret(pt, ctx, tooltipSize, options);
      }
      ctx.lineTo(x2, y2 + topLeft);
      ctx.quadraticCurveTo(x2, y2, x2 + topLeft, y2);
      ctx.closePath();
      ctx.fill();
      if (options.borderWidth > 0) {
        ctx.stroke();
      }
    }
    _updateAnimationTarget(options) {
      const chart = this.chart;
      const anims = this.$animations;
      const animX = anims && anims.x;
      const animY = anims && anims.y;
      if (animX || animY) {
        const position = positioners[options.position].call(this, this._active, this._eventPosition);
        if (!position) {
          return;
        }
        const size = this._size = getTooltipSize(this, options);
        const positionAndSize = Object.assign({}, position, this._size);
        const alignment = determineAlignment(chart, options, positionAndSize);
        const point = getBackgroundPoint(options, positionAndSize, alignment, chart);
        if (animX._to !== point.x || animY._to !== point.y) {
          this.xAlign = alignment.xAlign;
          this.yAlign = alignment.yAlign;
          this.width = size.width;
          this.height = size.height;
          this.caretX = position.x;
          this.caretY = position.y;
          this._resolveAnimations().update(this, point);
        }
      }
    }
    _willRender() {
      return !!this.opacity;
    }
    draw(ctx) {
      const options = this.options.setContext(this.getContext());
      let opacity = this.opacity;
      if (!opacity) {
        return;
      }
      this._updateAnimationTarget(options);
      const tooltipSize = {
        width: this.width,
        height: this.height
      };
      const pt = {
        x: this.x,
        y: this.y
      };
      opacity = Math.abs(opacity) < 1e-3 ? 0 : opacity;
      const padding = toPadding(options.padding);
      const hasTooltipContent = this.title.length || this.beforeBody.length || this.body.length || this.afterBody.length || this.footer.length;
      if (options.enabled && hasTooltipContent) {
        ctx.save();
        ctx.globalAlpha = opacity;
        this.drawBackground(pt, ctx, tooltipSize, options);
        overrideTextDirection(ctx, options.textDirection);
        pt.y += padding.top;
        this.drawTitle(pt, ctx, options);
        this.drawBody(pt, ctx, options);
        this.drawFooter(pt, ctx, options);
        restoreTextDirection(ctx, options.textDirection);
        ctx.restore();
      }
    }
    getActiveElements() {
      return this._active || [];
    }
    setActiveElements(activeElements, eventPosition) {
      const lastActive = this._active;
      const active = activeElements.map(({ datasetIndex, index: index3 }) => {
        const meta = this.chart.getDatasetMeta(datasetIndex);
        if (!meta) {
          throw new Error("Cannot find a dataset at index " + datasetIndex);
        }
        return {
          datasetIndex,
          element: meta.data[index3],
          index: index3
        };
      });
      const changed = !_elementsEqual(lastActive, active);
      const positionChanged = this._positionChanged(active, eventPosition);
      if (changed || positionChanged) {
        this._active = active;
        this._eventPosition = eventPosition;
        this._ignoreReplayEvents = true;
        this.update(true);
      }
    }
    handleEvent(e2, replay, inChartArea = true) {
      if (replay && this._ignoreReplayEvents) {
        return false;
      }
      this._ignoreReplayEvents = false;
      const options = this.options;
      const lastActive = this._active || [];
      const active = this._getActiveElements(e2, lastActive, replay, inChartArea);
      const positionChanged = this._positionChanged(active, e2);
      const changed = replay || !_elementsEqual(active, lastActive) || positionChanged;
      if (changed) {
        this._active = active;
        if (options.enabled || options.external) {
          this._eventPosition = {
            x: e2.x,
            y: e2.y
          };
          this.update(true, replay);
        }
      }
      return changed;
    }
    _getActiveElements(e2, lastActive, replay, inChartArea) {
      const options = this.options;
      if (e2.type === "mouseout") {
        return [];
      }
      if (!inChartArea) {
        return lastActive.filter((i2) => this.chart.data.datasets[i2.datasetIndex] && this.chart.getDatasetMeta(i2.datasetIndex).controller.getParsed(i2.index) !== void 0);
      }
      const active = this.chart.getElementsAtEventForMode(e2, options.mode, options, replay);
      if (options.reverse) {
        active.reverse();
      }
      return active;
    }
    _positionChanged(active, e2) {
      const { caretX, caretY, options } = this;
      const position = positioners[options.position].call(this, active, e2);
      return position !== false && (caretX !== position.x || caretY !== position.y);
    }
  };
  var plugin_tooltip = {
    id: "tooltip",
    _element: Tooltip,
    positioners,
    afterInit(chart, _args, options) {
      if (options) {
        chart.tooltip = new Tooltip({
          chart,
          options
        });
      }
    },
    beforeUpdate(chart, _args, options) {
      if (chart.tooltip) {
        chart.tooltip.initialize(options);
      }
    },
    reset(chart, _args, options) {
      if (chart.tooltip) {
        chart.tooltip.initialize(options);
      }
    },
    afterDraw(chart) {
      const tooltip = chart.tooltip;
      if (tooltip && tooltip._willRender()) {
        const args = {
          tooltip
        };
        if (chart.notifyPlugins("beforeTooltipDraw", {
          ...args,
          cancelable: true
        }) === false) {
          return;
        }
        tooltip.draw(chart.ctx);
        chart.notifyPlugins("afterTooltipDraw", args);
      }
    },
    afterEvent(chart, args) {
      if (chart.tooltip) {
        const useFinalPosition = args.replay;
        if (chart.tooltip.handleEvent(args.event, useFinalPosition, args.inChartArea)) {
          args.changed = true;
        }
      }
    },
    defaults: {
      enabled: true,
      external: null,
      position: "average",
      backgroundColor: "rgba(0,0,0,0.8)",
      titleColor: "#fff",
      titleFont: {
        weight: "bold"
      },
      titleSpacing: 2,
      titleMarginBottom: 6,
      titleAlign: "left",
      bodyColor: "#fff",
      bodySpacing: 2,
      bodyFont: {},
      bodyAlign: "left",
      footerColor: "#fff",
      footerSpacing: 2,
      footerMarginTop: 6,
      footerFont: {
        weight: "bold"
      },
      footerAlign: "left",
      padding: 6,
      caretPadding: 2,
      caretSize: 5,
      cornerRadius: 6,
      boxHeight: (ctx, opts) => opts.bodyFont.size,
      boxWidth: (ctx, opts) => opts.bodyFont.size,
      multiKeyBackground: "#fff",
      displayColors: true,
      boxPadding: 0,
      borderColor: "rgba(0,0,0,0)",
      borderWidth: 0,
      animation: {
        duration: 400,
        easing: "easeOutQuart"
      },
      animations: {
        numbers: {
          type: "number",
          properties: [
            "x",
            "y",
            "width",
            "height",
            "caretX",
            "caretY"
          ]
        },
        opacity: {
          easing: "linear",
          duration: 200
        }
      },
      callbacks: defaultCallbacks
    },
    defaultRoutes: {
      bodyFont: "font",
      footerFont: "font",
      titleFont: "font"
    },
    descriptors: {
      _scriptable: (name) => name !== "filter" && name !== "itemSort" && name !== "external",
      _indexable: false,
      callbacks: {
        _scriptable: false,
        _indexable: false
      },
      animation: {
        _fallback: false
      },
      animations: {
        _fallback: "animation"
      }
    },
    additionalOptionScopes: [
      "interaction"
    ]
  };
  var addIfString = (labels, raw, index3, addedLabels) => {
    if (typeof raw === "string") {
      index3 = labels.push(raw) - 1;
      addedLabels.unshift({
        index: index3,
        label: raw
      });
    } else if (isNaN(raw)) {
      index3 = null;
    }
    return index3;
  };
  function findOrAddLabel(labels, raw, index3, addedLabels) {
    const first = labels.indexOf(raw);
    if (first === -1) {
      return addIfString(labels, raw, index3, addedLabels);
    }
    const last = labels.lastIndexOf(raw);
    return first !== last ? index3 : first;
  }
  var validIndex = (index3, max2) => index3 === null ? null : _limitValue(Math.round(index3), 0, max2);
  function _getLabelForValue(value) {
    const labels = this.getLabels();
    if (value >= 0 && value < labels.length) {
      return labels[value];
    }
    return value;
  }
  var CategoryScale = class extends Scale {
    static id = "category";
    static defaults = {
      ticks: {
        callback: _getLabelForValue
      }
    };
    constructor(cfg) {
      super(cfg);
      this._startValue = void 0;
      this._valueRange = 0;
      this._addedLabels = [];
    }
    init(scaleOptions) {
      const added = this._addedLabels;
      if (added.length) {
        const labels = this.getLabels();
        for (const { index: index3, label } of added) {
          if (labels[index3] === label) {
            labels.splice(index3, 1);
          }
        }
        this._addedLabels = [];
      }
      super.init(scaleOptions);
    }
    parse(raw, index3) {
      if (isNullOrUndef(raw)) {
        return null;
      }
      const labels = this.getLabels();
      index3 = isFinite(index3) && labels[index3] === raw ? index3 : findOrAddLabel(labels, raw, valueOrDefault(index3, raw), this._addedLabels);
      return validIndex(index3, labels.length - 1);
    }
    determineDataLimits() {
      const { minDefined, maxDefined } = this.getUserBounds();
      let { min: min2, max: max2 } = this.getMinMax(true);
      if (this.options.bounds === "ticks") {
        if (!minDefined) {
          min2 = 0;
        }
        if (!maxDefined) {
          max2 = this.getLabels().length - 1;
        }
      }
      this.min = min2;
      this.max = max2;
    }
    buildTicks() {
      const min2 = this.min;
      const max2 = this.max;
      const offset = this.options.offset;
      const ticks = [];
      let labels = this.getLabels();
      labels = min2 === 0 && max2 === labels.length - 1 ? labels : labels.slice(min2, max2 + 1);
      this._valueRange = Math.max(labels.length - (offset ? 0 : 1), 1);
      this._startValue = this.min - (offset ? 0.5 : 0);
      for (let value = min2; value <= max2; value++) {
        ticks.push({
          value
        });
      }
      return ticks;
    }
    getLabelForValue(value) {
      return _getLabelForValue.call(this, value);
    }
    configure() {
      super.configure();
      if (!this.isHorizontal()) {
        this._reversePixels = !this._reversePixels;
      }
    }
    getPixelForValue(value) {
      if (typeof value !== "number") {
        value = this.parse(value);
      }
      return value === null ? NaN : this.getPixelForDecimal((value - this._startValue) / this._valueRange);
    }
    getPixelForTick(index3) {
      const ticks = this.ticks;
      if (index3 < 0 || index3 > ticks.length - 1) {
        return null;
      }
      return this.getPixelForValue(ticks[index3].value);
    }
    getValueForPixel(pixel) {
      return Math.round(this._startValue + this.getDecimalForPixel(pixel) * this._valueRange);
    }
    getBasePixel() {
      return this.bottom;
    }
  };
  function generateTicks$1(generationOptions, dataRange) {
    const ticks = [];
    const MIN_SPACING = 1e-14;
    const { bounds, step, min: min2, max: max2, precision, count, maxTicks, maxDigits, includeBounds } = generationOptions;
    const unit = step || 1;
    const maxSpaces = maxTicks - 1;
    const { min: rmin, max: rmax } = dataRange;
    const minDefined = !isNullOrUndef(min2);
    const maxDefined = !isNullOrUndef(max2);
    const countDefined = !isNullOrUndef(count);
    const minSpacing = (rmax - rmin) / (maxDigits + 1);
    let spacing = niceNum((rmax - rmin) / maxSpaces / unit) * unit;
    let factor, niceMin, niceMax, numSpaces;
    if (spacing < MIN_SPACING && !minDefined && !maxDefined) {
      return [
        {
          value: rmin
        },
        {
          value: rmax
        }
      ];
    }
    numSpaces = Math.ceil(rmax / spacing) - Math.floor(rmin / spacing);
    if (numSpaces > maxSpaces) {
      spacing = niceNum(numSpaces * spacing / maxSpaces / unit) * unit;
    }
    if (!isNullOrUndef(precision)) {
      factor = Math.pow(10, precision);
      spacing = Math.ceil(spacing * factor) / factor;
    }
    if (bounds === "ticks") {
      niceMin = Math.floor(rmin / spacing) * spacing;
      niceMax = Math.ceil(rmax / spacing) * spacing;
    } else {
      niceMin = rmin;
      niceMax = rmax;
    }
    if (minDefined && maxDefined && step && almostWhole((max2 - min2) / step, spacing / 1e3)) {
      numSpaces = Math.round(Math.min((max2 - min2) / spacing, maxTicks));
      spacing = (max2 - min2) / numSpaces;
      niceMin = min2;
      niceMax = max2;
    } else if (countDefined) {
      niceMin = minDefined ? min2 : niceMin;
      niceMax = maxDefined ? max2 : niceMax;
      numSpaces = count - 1;
      spacing = (niceMax - niceMin) / numSpaces;
    } else {
      numSpaces = (niceMax - niceMin) / spacing;
      if (almostEquals(numSpaces, Math.round(numSpaces), spacing / 1e3)) {
        numSpaces = Math.round(numSpaces);
      } else {
        numSpaces = Math.ceil(numSpaces);
      }
    }
    const decimalPlaces = Math.max(_decimalPlaces(spacing), _decimalPlaces(niceMin));
    factor = Math.pow(10, isNullOrUndef(precision) ? decimalPlaces : precision);
    niceMin = Math.round(niceMin * factor) / factor;
    niceMax = Math.round(niceMax * factor) / factor;
    let j2 = 0;
    if (minDefined) {
      if (includeBounds && niceMin !== min2) {
        ticks.push({
          value: min2
        });
        if (niceMin < min2) {
          j2++;
        }
        if (almostEquals(Math.round((niceMin + j2 * spacing) * factor) / factor, min2, relativeLabelSize(min2, minSpacing, generationOptions))) {
          j2++;
        }
      } else if (niceMin < min2) {
        j2++;
      }
    }
    for (; j2 < numSpaces; ++j2) {
      const tickValue = Math.round((niceMin + j2 * spacing) * factor) / factor;
      if (maxDefined && tickValue > max2) {
        break;
      }
      ticks.push({
        value: tickValue
      });
    }
    if (maxDefined && includeBounds && niceMax !== max2) {
      if (ticks.length && almostEquals(ticks[ticks.length - 1].value, max2, relativeLabelSize(max2, minSpacing, generationOptions))) {
        ticks[ticks.length - 1].value = max2;
      } else {
        ticks.push({
          value: max2
        });
      }
    } else if (!maxDefined || niceMax === max2) {
      ticks.push({
        value: niceMax
      });
    }
    return ticks;
  }
  function relativeLabelSize(value, minSpacing, { horizontal, minRotation }) {
    const rad = toRadians(minRotation);
    const ratio = (horizontal ? Math.sin(rad) : Math.cos(rad)) || 1e-3;
    const length = 0.75 * minSpacing * ("" + value).length;
    return Math.min(minSpacing / ratio, length);
  }
  var LinearScaleBase = class extends Scale {
    constructor(cfg) {
      super(cfg);
      this.start = void 0;
      this.end = void 0;
      this._startValue = void 0;
      this._endValue = void 0;
      this._valueRange = 0;
    }
    parse(raw, index3) {
      if (isNullOrUndef(raw)) {
        return null;
      }
      if ((typeof raw === "number" || raw instanceof Number) && !isFinite(+raw)) {
        return null;
      }
      return +raw;
    }
    handleTickRangeOptions() {
      const { beginAtZero } = this.options;
      const { minDefined, maxDefined } = this.getUserBounds();
      let { min: min2, max: max2 } = this;
      const setMin = (v2) => min2 = minDefined ? min2 : v2;
      const setMax = (v2) => max2 = maxDefined ? max2 : v2;
      if (beginAtZero) {
        const minSign = sign(min2);
        const maxSign = sign(max2);
        if (minSign < 0 && maxSign < 0) {
          setMax(0);
        } else if (minSign > 0 && maxSign > 0) {
          setMin(0);
        }
      }
      if (min2 === max2) {
        let offset = max2 === 0 ? 1 : Math.abs(max2 * 0.05);
        setMax(max2 + offset);
        if (!beginAtZero) {
          setMin(min2 - offset);
        }
      }
      this.min = min2;
      this.max = max2;
    }
    getTickLimit() {
      const tickOpts = this.options.ticks;
      let { maxTicksLimit, stepSize } = tickOpts;
      let maxTicks;
      if (stepSize) {
        maxTicks = Math.ceil(this.max / stepSize) - Math.floor(this.min / stepSize) + 1;
        if (maxTicks > 1e3) {
          console.warn(`scales.${this.id}.ticks.stepSize: ${stepSize} would result generating up to ${maxTicks} ticks. Limiting to 1000.`);
          maxTicks = 1e3;
        }
      } else {
        maxTicks = this.computeTickLimit();
        maxTicksLimit = maxTicksLimit || 11;
      }
      if (maxTicksLimit) {
        maxTicks = Math.min(maxTicksLimit, maxTicks);
      }
      return maxTicks;
    }
    computeTickLimit() {
      return Number.POSITIVE_INFINITY;
    }
    buildTicks() {
      const opts = this.options;
      const tickOpts = opts.ticks;
      let maxTicks = this.getTickLimit();
      maxTicks = Math.max(2, maxTicks);
      const numericGeneratorOptions = {
        maxTicks,
        bounds: opts.bounds,
        min: opts.min,
        max: opts.max,
        precision: tickOpts.precision,
        step: tickOpts.stepSize,
        count: tickOpts.count,
        maxDigits: this._maxDigits(),
        horizontal: this.isHorizontal(),
        minRotation: tickOpts.minRotation || 0,
        includeBounds: tickOpts.includeBounds !== false
      };
      const dataRange = this._range || this;
      const ticks = generateTicks$1(numericGeneratorOptions, dataRange);
      if (opts.bounds === "ticks") {
        _setMinAndMaxByKey(ticks, this, "value");
      }
      if (opts.reverse) {
        ticks.reverse();
        this.start = this.max;
        this.end = this.min;
      } else {
        this.start = this.min;
        this.end = this.max;
      }
      return ticks;
    }
    configure() {
      const ticks = this.ticks;
      let start = this.min;
      let end = this.max;
      super.configure();
      if (this.options.offset && ticks.length) {
        const offset = (end - start) / Math.max(ticks.length - 1, 1) / 2;
        start -= offset;
        end += offset;
      }
      this._startValue = start;
      this._endValue = end;
      this._valueRange = end - start;
    }
    getLabelForValue(value) {
      return formatNumber(value, this.chart.options.locale, this.options.ticks.format);
    }
  };
  var LinearScale = class extends LinearScaleBase {
    static id = "linear";
    static defaults = {
      ticks: {
        callback: Ticks.formatters.numeric
      }
    };
    determineDataLimits() {
      const { min: min2, max: max2 } = this.getMinMax(true);
      this.min = isNumberFinite(min2) ? min2 : 0;
      this.max = isNumberFinite(max2) ? max2 : 1;
      this.handleTickRangeOptions();
    }
    computeTickLimit() {
      const horizontal = this.isHorizontal();
      const length = horizontal ? this.width : this.height;
      const minRotation = toRadians(this.options.ticks.minRotation);
      const ratio = (horizontal ? Math.sin(minRotation) : Math.cos(minRotation)) || 1e-3;
      const tickFont = this._resolveTickFontOptions(0);
      return Math.ceil(length / Math.min(40, tickFont.lineHeight / ratio));
    }
    getPixelForValue(value) {
      return value === null ? NaN : this.getPixelForDecimal((value - this._startValue) / this._valueRange);
    }
    getValueForPixel(pixel) {
      return this._startValue + this.getDecimalForPixel(pixel) * this._valueRange;
    }
  };
  var log10Floor = (v2) => Math.floor(log10(v2));
  var changeExponent = (v2, m2) => Math.pow(10, log10Floor(v2) + m2);
  function isMajor(tickVal) {
    const remain = tickVal / Math.pow(10, log10Floor(tickVal));
    return remain === 1;
  }
  function steps(min2, max2, rangeExp) {
    const rangeStep = Math.pow(10, rangeExp);
    const start = Math.floor(min2 / rangeStep);
    const end = Math.ceil(max2 / rangeStep);
    return end - start;
  }
  function startExp(min2, max2) {
    const range = max2 - min2;
    let rangeExp = log10Floor(range);
    while (steps(min2, max2, rangeExp) > 10) {
      rangeExp++;
    }
    while (steps(min2, max2, rangeExp) < 10) {
      rangeExp--;
    }
    return Math.min(rangeExp, log10Floor(min2));
  }
  function generateTicks(generationOptions, { min: min2, max: max2 }) {
    min2 = finiteOrDefault(generationOptions.min, min2);
    const ticks = [];
    const minExp = log10Floor(min2);
    let exp = startExp(min2, max2);
    let precision = exp < 0 ? Math.pow(10, Math.abs(exp)) : 1;
    const stepSize = Math.pow(10, exp);
    const base = minExp > exp ? Math.pow(10, minExp) : 0;
    const start = Math.round((min2 - base) * precision) / precision;
    const offset = Math.floor((min2 - base) / stepSize / 10) * stepSize * 10;
    let significand = Math.floor((start - offset) / Math.pow(10, exp));
    let value = finiteOrDefault(generationOptions.min, Math.round((base + offset + significand * Math.pow(10, exp)) * precision) / precision);
    while (value < max2) {
      ticks.push({
        value,
        major: isMajor(value),
        significand
      });
      if (significand >= 10) {
        significand = significand < 15 ? 15 : 20;
      } else {
        significand++;
      }
      if (significand >= 20) {
        exp++;
        significand = 2;
        precision = exp >= 0 ? 1 : precision;
      }
      value = Math.round((base + offset + significand * Math.pow(10, exp)) * precision) / precision;
    }
    const lastTick = finiteOrDefault(generationOptions.max, value);
    ticks.push({
      value: lastTick,
      major: isMajor(lastTick),
      significand
    });
    return ticks;
  }
  var LogarithmicScale = class extends Scale {
    static id = "logarithmic";
    static defaults = {
      ticks: {
        callback: Ticks.formatters.logarithmic,
        major: {
          enabled: true
        }
      }
    };
    constructor(cfg) {
      super(cfg);
      this.start = void 0;
      this.end = void 0;
      this._startValue = void 0;
      this._valueRange = 0;
    }
    parse(raw, index3) {
      const value = LinearScaleBase.prototype.parse.apply(this, [
        raw,
        index3
      ]);
      if (value === 0) {
        this._zero = true;
        return void 0;
      }
      return isNumberFinite(value) && value > 0 ? value : null;
    }
    determineDataLimits() {
      const { min: min2, max: max2 } = this.getMinMax(true);
      this.min = isNumberFinite(min2) ? Math.max(0, min2) : null;
      this.max = isNumberFinite(max2) ? Math.max(0, max2) : null;
      if (this.options.beginAtZero) {
        this._zero = true;
      }
      if (this._zero && this.min !== this._suggestedMin && !isNumberFinite(this._userMin)) {
        this.min = min2 === changeExponent(this.min, 0) ? changeExponent(this.min, -1) : changeExponent(this.min, 0);
      }
      this.handleTickRangeOptions();
    }
    handleTickRangeOptions() {
      const { minDefined, maxDefined } = this.getUserBounds();
      let min2 = this.min;
      let max2 = this.max;
      const setMin = (v2) => min2 = minDefined ? min2 : v2;
      const setMax = (v2) => max2 = maxDefined ? max2 : v2;
      if (min2 === max2) {
        if (min2 <= 0) {
          setMin(1);
          setMax(10);
        } else {
          setMin(changeExponent(min2, -1));
          setMax(changeExponent(max2, 1));
        }
      }
      if (min2 <= 0) {
        setMin(changeExponent(max2, -1));
      }
      if (max2 <= 0) {
        setMax(changeExponent(min2, 1));
      }
      this.min = min2;
      this.max = max2;
    }
    buildTicks() {
      const opts = this.options;
      const generationOptions = {
        min: this._userMin,
        max: this._userMax
      };
      const ticks = generateTicks(generationOptions, this);
      if (opts.bounds === "ticks") {
        _setMinAndMaxByKey(ticks, this, "value");
      }
      if (opts.reverse) {
        ticks.reverse();
        this.start = this.max;
        this.end = this.min;
      } else {
        this.start = this.min;
        this.end = this.max;
      }
      return ticks;
    }
    getLabelForValue(value) {
      return value === void 0 ? "0" : formatNumber(value, this.chart.options.locale, this.options.ticks.format);
    }
    configure() {
      const start = this.min;
      super.configure();
      this._startValue = log10(start);
      this._valueRange = log10(this.max) - log10(start);
    }
    getPixelForValue(value) {
      if (value === void 0 || value === 0) {
        value = this.min;
      }
      if (value === null || isNaN(value)) {
        return NaN;
      }
      return this.getPixelForDecimal(value === this.min ? 0 : (log10(value) - this._startValue) / this._valueRange);
    }
    getValueForPixel(pixel) {
      const decimal = this.getDecimalForPixel(pixel);
      return Math.pow(10, this._startValue + decimal * this._valueRange);
    }
  };
  function getTickBackdropHeight(opts) {
    const tickOpts = opts.ticks;
    if (tickOpts.display && opts.display) {
      const padding = toPadding(tickOpts.backdropPadding);
      return valueOrDefault(tickOpts.font && tickOpts.font.size, defaults.font.size) + padding.height;
    }
    return 0;
  }
  function measureLabelSize(ctx, font, label) {
    label = isArray(label) ? label : [
      label
    ];
    return {
      w: _longestText(ctx, font.string, label),
      h: label.length * font.lineHeight
    };
  }
  function determineLimits(angle, pos, size, min2, max2) {
    if (angle === min2 || angle === max2) {
      return {
        start: pos - size / 2,
        end: pos + size / 2
      };
    } else if (angle < min2 || angle > max2) {
      return {
        start: pos - size,
        end: pos
      };
    }
    return {
      start: pos,
      end: pos + size
    };
  }
  function fitWithPointLabels(scale) {
    const orig = {
      l: scale.left + scale._padding.left,
      r: scale.right - scale._padding.right,
      t: scale.top + scale._padding.top,
      b: scale.bottom - scale._padding.bottom
    };
    const limits = Object.assign({}, orig);
    const labelSizes = [];
    const padding = [];
    const valueCount = scale._pointLabels.length;
    const pointLabelOpts = scale.options.pointLabels;
    const additionalAngle = pointLabelOpts.centerPointLabels ? PI / valueCount : 0;
    for (let i2 = 0; i2 < valueCount; i2++) {
      const opts = pointLabelOpts.setContext(scale.getPointLabelContext(i2));
      padding[i2] = opts.padding;
      const pointPosition = scale.getPointPosition(i2, scale.drawingArea + padding[i2], additionalAngle);
      const plFont = toFont(opts.font);
      const textSize = measureLabelSize(scale.ctx, plFont, scale._pointLabels[i2]);
      labelSizes[i2] = textSize;
      const angleRadians = _normalizeAngle(scale.getIndexAngle(i2) + additionalAngle);
      const angle = Math.round(toDegrees(angleRadians));
      const hLimits = determineLimits(angle, pointPosition.x, textSize.w, 0, 180);
      const vLimits = determineLimits(angle, pointPosition.y, textSize.h, 90, 270);
      updateLimits(limits, orig, angleRadians, hLimits, vLimits);
    }
    scale.setCenterPoint(orig.l - limits.l, limits.r - orig.r, orig.t - limits.t, limits.b - orig.b);
    scale._pointLabelItems = buildPointLabelItems(scale, labelSizes, padding);
  }
  function updateLimits(limits, orig, angle, hLimits, vLimits) {
    const sin = Math.abs(Math.sin(angle));
    const cos = Math.abs(Math.cos(angle));
    let x2 = 0;
    let y2 = 0;
    if (hLimits.start < orig.l) {
      x2 = (orig.l - hLimits.start) / sin;
      limits.l = Math.min(limits.l, orig.l - x2);
    } else if (hLimits.end > orig.r) {
      x2 = (hLimits.end - orig.r) / sin;
      limits.r = Math.max(limits.r, orig.r + x2);
    }
    if (vLimits.start < orig.t) {
      y2 = (orig.t - vLimits.start) / cos;
      limits.t = Math.min(limits.t, orig.t - y2);
    } else if (vLimits.end > orig.b) {
      y2 = (vLimits.end - orig.b) / cos;
      limits.b = Math.max(limits.b, orig.b + y2);
    }
  }
  function createPointLabelItem(scale, index3, itemOpts) {
    const outerDistance = scale.drawingArea;
    const { extra, additionalAngle, padding, size } = itemOpts;
    const pointLabelPosition = scale.getPointPosition(index3, outerDistance + extra + padding, additionalAngle);
    const angle = Math.round(toDegrees(_normalizeAngle(pointLabelPosition.angle + HALF_PI)));
    const y2 = yForAngle(pointLabelPosition.y, size.h, angle);
    const textAlign = getTextAlignForAngle(angle);
    const left = leftForTextAlign(pointLabelPosition.x, size.w, textAlign);
    return {
      visible: true,
      x: pointLabelPosition.x,
      y: y2,
      textAlign,
      left,
      top: y2,
      right: left + size.w,
      bottom: y2 + size.h
    };
  }
  function isNotOverlapped(item, area) {
    if (!area) {
      return true;
    }
    const { left, top, right, bottom } = item;
    const apexesInArea = _isPointInArea({
      x: left,
      y: top
    }, area) || _isPointInArea({
      x: left,
      y: bottom
    }, area) || _isPointInArea({
      x: right,
      y: top
    }, area) || _isPointInArea({
      x: right,
      y: bottom
    }, area);
    return !apexesInArea;
  }
  function buildPointLabelItems(scale, labelSizes, padding) {
    const items = [];
    const valueCount = scale._pointLabels.length;
    const opts = scale.options;
    const { centerPointLabels, display } = opts.pointLabels;
    const itemOpts = {
      extra: getTickBackdropHeight(opts) / 2,
      additionalAngle: centerPointLabels ? PI / valueCount : 0
    };
    let area;
    for (let i2 = 0; i2 < valueCount; i2++) {
      itemOpts.padding = padding[i2];
      itemOpts.size = labelSizes[i2];
      const item = createPointLabelItem(scale, i2, itemOpts);
      items.push(item);
      if (display === "auto") {
        item.visible = isNotOverlapped(item, area);
        if (item.visible) {
          area = item;
        }
      }
    }
    return items;
  }
  function getTextAlignForAngle(angle) {
    if (angle === 0 || angle === 180) {
      return "center";
    } else if (angle < 180) {
      return "left";
    }
    return "right";
  }
  function leftForTextAlign(x2, w2, align) {
    if (align === "right") {
      x2 -= w2;
    } else if (align === "center") {
      x2 -= w2 / 2;
    }
    return x2;
  }
  function yForAngle(y2, h3, angle) {
    if (angle === 90 || angle === 270) {
      y2 -= h3 / 2;
    } else if (angle > 270 || angle < 90) {
      y2 -= h3;
    }
    return y2;
  }
  function drawPointLabelBox(ctx, opts, item) {
    const { left, top, right, bottom } = item;
    const { backdropColor } = opts;
    if (!isNullOrUndef(backdropColor)) {
      const borderRadius = toTRBLCorners(opts.borderRadius);
      const padding = toPadding(opts.backdropPadding);
      ctx.fillStyle = backdropColor;
      const backdropLeft = left - padding.left;
      const backdropTop = top - padding.top;
      const backdropWidth = right - left + padding.width;
      const backdropHeight = bottom - top + padding.height;
      if (Object.values(borderRadius).some((v2) => v2 !== 0)) {
        ctx.beginPath();
        addRoundedRectPath(ctx, {
          x: backdropLeft,
          y: backdropTop,
          w: backdropWidth,
          h: backdropHeight,
          radius: borderRadius
        });
        ctx.fill();
      } else {
        ctx.fillRect(backdropLeft, backdropTop, backdropWidth, backdropHeight);
      }
    }
  }
  function drawPointLabels(scale, labelCount) {
    const { ctx, options: { pointLabels } } = scale;
    for (let i2 = labelCount - 1; i2 >= 0; i2--) {
      const item = scale._pointLabelItems[i2];
      if (!item.visible) {
        continue;
      }
      const optsAtIndex = pointLabels.setContext(scale.getPointLabelContext(i2));
      drawPointLabelBox(ctx, optsAtIndex, item);
      const plFont = toFont(optsAtIndex.font);
      const { x: x2, y: y2, textAlign } = item;
      renderText(ctx, scale._pointLabels[i2], x2, y2 + plFont.lineHeight / 2, plFont, {
        color: optsAtIndex.color,
        textAlign,
        textBaseline: "middle"
      });
    }
  }
  function pathRadiusLine(scale, radius, circular, labelCount) {
    const { ctx } = scale;
    if (circular) {
      ctx.arc(scale.xCenter, scale.yCenter, radius, 0, TAU);
    } else {
      let pointPosition = scale.getPointPosition(0, radius);
      ctx.moveTo(pointPosition.x, pointPosition.y);
      for (let i2 = 1; i2 < labelCount; i2++) {
        pointPosition = scale.getPointPosition(i2, radius);
        ctx.lineTo(pointPosition.x, pointPosition.y);
      }
    }
  }
  function drawRadiusLine(scale, gridLineOpts, radius, labelCount, borderOpts) {
    const ctx = scale.ctx;
    const circular = gridLineOpts.circular;
    const { color: color2, lineWidth } = gridLineOpts;
    if (!circular && !labelCount || !color2 || !lineWidth || radius < 0) {
      return;
    }
    ctx.save();
    ctx.strokeStyle = color2;
    ctx.lineWidth = lineWidth;
    ctx.setLineDash(borderOpts.dash || []);
    ctx.lineDashOffset = borderOpts.dashOffset;
    ctx.beginPath();
    pathRadiusLine(scale, radius, circular, labelCount);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
  function createPointLabelContext(parent, index3, label) {
    return createContext(parent, {
      label,
      index: index3,
      type: "pointLabel"
    });
  }
  var RadialLinearScale = class extends LinearScaleBase {
    static id = "radialLinear";
    static defaults = {
      display: true,
      animate: true,
      position: "chartArea",
      angleLines: {
        display: true,
        lineWidth: 1,
        borderDash: [],
        borderDashOffset: 0
      },
      grid: {
        circular: false
      },
      startAngle: 0,
      ticks: {
        showLabelBackdrop: true,
        callback: Ticks.formatters.numeric
      },
      pointLabels: {
        backdropColor: void 0,
        backdropPadding: 2,
        display: true,
        font: {
          size: 10
        },
        callback(label) {
          return label;
        },
        padding: 5,
        centerPointLabels: false
      }
    };
    static defaultRoutes = {
      "angleLines.color": "borderColor",
      "pointLabels.color": "color",
      "ticks.color": "color"
    };
    static descriptors = {
      angleLines: {
        _fallback: "grid"
      }
    };
    constructor(cfg) {
      super(cfg);
      this.xCenter = void 0;
      this.yCenter = void 0;
      this.drawingArea = void 0;
      this._pointLabels = [];
      this._pointLabelItems = [];
    }
    setDimensions() {
      const padding = this._padding = toPadding(getTickBackdropHeight(this.options) / 2);
      const w2 = this.width = this.maxWidth - padding.width;
      const h3 = this.height = this.maxHeight - padding.height;
      this.xCenter = Math.floor(this.left + w2 / 2 + padding.left);
      this.yCenter = Math.floor(this.top + h3 / 2 + padding.top);
      this.drawingArea = Math.floor(Math.min(w2, h3) / 2);
    }
    determineDataLimits() {
      const { min: min2, max: max2 } = this.getMinMax(false);
      this.min = isNumberFinite(min2) && !isNaN(min2) ? min2 : 0;
      this.max = isNumberFinite(max2) && !isNaN(max2) ? max2 : 0;
      this.handleTickRangeOptions();
    }
    computeTickLimit() {
      return Math.ceil(this.drawingArea / getTickBackdropHeight(this.options));
    }
    generateTickLabels(ticks) {
      LinearScaleBase.prototype.generateTickLabels.call(this, ticks);
      this._pointLabels = this.getLabels().map((value, index3) => {
        const label = callback(this.options.pointLabels.callback, [
          value,
          index3
        ], this);
        return label || label === 0 ? label : "";
      }).filter((v2, i2) => this.chart.getDataVisibility(i2));
    }
    fit() {
      const opts = this.options;
      if (opts.display && opts.pointLabels.display) {
        fitWithPointLabels(this);
      } else {
        this.setCenterPoint(0, 0, 0, 0);
      }
    }
    setCenterPoint(leftMovement, rightMovement, topMovement, bottomMovement) {
      this.xCenter += Math.floor((leftMovement - rightMovement) / 2);
      this.yCenter += Math.floor((topMovement - bottomMovement) / 2);
      this.drawingArea -= Math.min(this.drawingArea / 2, Math.max(leftMovement, rightMovement, topMovement, bottomMovement));
    }
    getIndexAngle(index3) {
      const angleMultiplier = TAU / (this._pointLabels.length || 1);
      const startAngle = this.options.startAngle || 0;
      return _normalizeAngle(index3 * angleMultiplier + toRadians(startAngle));
    }
    getDistanceFromCenterForValue(value) {
      if (isNullOrUndef(value)) {
        return NaN;
      }
      const scalingFactor = this.drawingArea / (this.max - this.min);
      if (this.options.reverse) {
        return (this.max - value) * scalingFactor;
      }
      return (value - this.min) * scalingFactor;
    }
    getValueForDistanceFromCenter(distance) {
      if (isNullOrUndef(distance)) {
        return NaN;
      }
      const scaledDistance = distance / (this.drawingArea / (this.max - this.min));
      return this.options.reverse ? this.max - scaledDistance : this.min + scaledDistance;
    }
    getPointLabelContext(index3) {
      const pointLabels = this._pointLabels || [];
      if (index3 >= 0 && index3 < pointLabels.length) {
        const pointLabel = pointLabels[index3];
        return createPointLabelContext(this.getContext(), index3, pointLabel);
      }
    }
    getPointPosition(index3, distanceFromCenter, additionalAngle = 0) {
      const angle = this.getIndexAngle(index3) - HALF_PI + additionalAngle;
      return {
        x: Math.cos(angle) * distanceFromCenter + this.xCenter,
        y: Math.sin(angle) * distanceFromCenter + this.yCenter,
        angle
      };
    }
    getPointPositionForValue(index3, value) {
      return this.getPointPosition(index3, this.getDistanceFromCenterForValue(value));
    }
    getBasePosition(index3) {
      return this.getPointPositionForValue(index3 || 0, this.getBaseValue());
    }
    getPointLabelPosition(index3) {
      const { left, top, right, bottom } = this._pointLabelItems[index3];
      return {
        left,
        top,
        right,
        bottom
      };
    }
    drawBackground() {
      const { backgroundColor, grid: { circular } } = this.options;
      if (backgroundColor) {
        const ctx = this.ctx;
        ctx.save();
        ctx.beginPath();
        pathRadiusLine(this, this.getDistanceFromCenterForValue(this._endValue), circular, this._pointLabels.length);
        ctx.closePath();
        ctx.fillStyle = backgroundColor;
        ctx.fill();
        ctx.restore();
      }
    }
    drawGrid() {
      const ctx = this.ctx;
      const opts = this.options;
      const { angleLines, grid, border } = opts;
      const labelCount = this._pointLabels.length;
      let i2, offset, position;
      if (opts.pointLabels.display) {
        drawPointLabels(this, labelCount);
      }
      if (grid.display) {
        this.ticks.forEach((tick, index3) => {
          if (index3 !== 0 || index3 === 0 && this.min < 0) {
            offset = this.getDistanceFromCenterForValue(tick.value);
            const context = this.getContext(index3);
            const optsAtIndex = grid.setContext(context);
            const optsAtIndexBorder = border.setContext(context);
            drawRadiusLine(this, optsAtIndex, offset, labelCount, optsAtIndexBorder);
          }
        });
      }
      if (angleLines.display) {
        ctx.save();
        for (i2 = labelCount - 1; i2 >= 0; i2--) {
          const optsAtIndex = angleLines.setContext(this.getPointLabelContext(i2));
          const { color: color2, lineWidth } = optsAtIndex;
          if (!lineWidth || !color2) {
            continue;
          }
          ctx.lineWidth = lineWidth;
          ctx.strokeStyle = color2;
          ctx.setLineDash(optsAtIndex.borderDash);
          ctx.lineDashOffset = optsAtIndex.borderDashOffset;
          offset = this.getDistanceFromCenterForValue(opts.reverse ? this.min : this.max);
          position = this.getPointPosition(i2, offset);
          ctx.beginPath();
          ctx.moveTo(this.xCenter, this.yCenter);
          ctx.lineTo(position.x, position.y);
          ctx.stroke();
        }
        ctx.restore();
      }
    }
    drawBorder() {
    }
    drawLabels() {
      const ctx = this.ctx;
      const opts = this.options;
      const tickOpts = opts.ticks;
      if (!tickOpts.display) {
        return;
      }
      const startAngle = this.getIndexAngle(0);
      let offset, width;
      ctx.save();
      ctx.translate(this.xCenter, this.yCenter);
      ctx.rotate(startAngle);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      this.ticks.forEach((tick, index3) => {
        if (index3 === 0 && this.min >= 0 && !opts.reverse) {
          return;
        }
        const optsAtIndex = tickOpts.setContext(this.getContext(index3));
        const tickFont = toFont(optsAtIndex.font);
        offset = this.getDistanceFromCenterForValue(this.ticks[index3].value);
        if (optsAtIndex.showLabelBackdrop) {
          ctx.font = tickFont.string;
          width = ctx.measureText(tick.label).width;
          ctx.fillStyle = optsAtIndex.backdropColor;
          const padding = toPadding(optsAtIndex.backdropPadding);
          ctx.fillRect(-width / 2 - padding.left, -offset - tickFont.size / 2 - padding.top, width + padding.width, tickFont.size + padding.height);
        }
        renderText(ctx, tick.label, 0, -offset, tickFont, {
          color: optsAtIndex.color,
          strokeColor: optsAtIndex.textStrokeColor,
          strokeWidth: optsAtIndex.textStrokeWidth
        });
      });
      ctx.restore();
    }
    drawTitle() {
    }
  };
  var INTERVALS = {
    millisecond: {
      common: true,
      size: 1,
      steps: 1e3
    },
    second: {
      common: true,
      size: 1e3,
      steps: 60
    },
    minute: {
      common: true,
      size: 6e4,
      steps: 60
    },
    hour: {
      common: true,
      size: 36e5,
      steps: 24
    },
    day: {
      common: true,
      size: 864e5,
      steps: 30
    },
    week: {
      common: false,
      size: 6048e5,
      steps: 4
    },
    month: {
      common: true,
      size: 2628e6,
      steps: 12
    },
    quarter: {
      common: false,
      size: 7884e6,
      steps: 4
    },
    year: {
      common: true,
      size: 3154e7
    }
  };
  var UNITS = /* @__PURE__ */ Object.keys(INTERVALS);
  function sorter(a2, b2) {
    return a2 - b2;
  }
  function parse(scale, input) {
    if (isNullOrUndef(input)) {
      return null;
    }
    const adapter = scale._adapter;
    const { parser, round: round2, isoWeekday } = scale._parseOpts;
    let value = input;
    if (typeof parser === "function") {
      value = parser(value);
    }
    if (!isNumberFinite(value)) {
      value = typeof parser === "string" ? adapter.parse(value, parser) : adapter.parse(value);
    }
    if (value === null) {
      return null;
    }
    if (round2) {
      value = round2 === "week" && (isNumber(isoWeekday) || isoWeekday === true) ? adapter.startOf(value, "isoWeek", isoWeekday) : adapter.startOf(value, round2);
    }
    return +value;
  }
  function determineUnitForAutoTicks(minUnit, min2, max2, capacity) {
    const ilen = UNITS.length;
    for (let i2 = UNITS.indexOf(minUnit); i2 < ilen - 1; ++i2) {
      const interval = INTERVALS[UNITS[i2]];
      const factor = interval.steps ? interval.steps : Number.MAX_SAFE_INTEGER;
      if (interval.common && Math.ceil((max2 - min2) / (factor * interval.size)) <= capacity) {
        return UNITS[i2];
      }
    }
    return UNITS[ilen - 1];
  }
  function determineUnitForFormatting(scale, numTicks, minUnit, min2, max2) {
    for (let i2 = UNITS.length - 1; i2 >= UNITS.indexOf(minUnit); i2--) {
      const unit = UNITS[i2];
      if (INTERVALS[unit].common && scale._adapter.diff(max2, min2, unit) >= numTicks - 1) {
        return unit;
      }
    }
    return UNITS[minUnit ? UNITS.indexOf(minUnit) : 0];
  }
  function determineMajorUnit(unit) {
    for (let i2 = UNITS.indexOf(unit) + 1, ilen = UNITS.length; i2 < ilen; ++i2) {
      if (INTERVALS[UNITS[i2]].common) {
        return UNITS[i2];
      }
    }
  }
  function addTick(ticks, time, timestamps) {
    if (!timestamps) {
      ticks[time] = true;
    } else if (timestamps.length) {
      const { lo, hi } = _lookup(timestamps, time);
      const timestamp = timestamps[lo] >= time ? timestamps[lo] : timestamps[hi];
      ticks[timestamp] = true;
    }
  }
  function setMajorTicks(scale, ticks, map2, majorUnit) {
    const adapter = scale._adapter;
    const first = +adapter.startOf(ticks[0].value, majorUnit);
    const last = ticks[ticks.length - 1].value;
    let major, index3;
    for (major = first; major <= last; major = +adapter.add(major, 1, majorUnit)) {
      index3 = map2[major];
      if (index3 >= 0) {
        ticks[index3].major = true;
      }
    }
    return ticks;
  }
  function ticksFromTimestamps(scale, values, majorUnit) {
    const ticks = [];
    const map2 = {};
    const ilen = values.length;
    let i2, value;
    for (i2 = 0; i2 < ilen; ++i2) {
      value = values[i2];
      map2[value] = i2;
      ticks.push({
        value,
        major: false
      });
    }
    return ilen === 0 || !majorUnit ? ticks : setMajorTicks(scale, ticks, map2, majorUnit);
  }
  var TimeScale = class extends Scale {
    static id = "time";
    static defaults = {
      bounds: "data",
      adapters: {},
      time: {
        parser: false,
        unit: false,
        round: false,
        isoWeekday: false,
        minUnit: "millisecond",
        displayFormats: {}
      },
      ticks: {
        source: "auto",
        callback: false,
        major: {
          enabled: false
        }
      }
    };
    constructor(props) {
      super(props);
      this._cache = {
        data: [],
        labels: [],
        all: []
      };
      this._unit = "day";
      this._majorUnit = void 0;
      this._offsets = {};
      this._normalized = false;
      this._parseOpts = void 0;
    }
    init(scaleOpts, opts = {}) {
      const time = scaleOpts.time || (scaleOpts.time = {});
      const adapter = this._adapter = new adapters._date(scaleOpts.adapters.date);
      adapter.init(opts);
      mergeIf(time.displayFormats, adapter.formats());
      this._parseOpts = {
        parser: time.parser,
        round: time.round,
        isoWeekday: time.isoWeekday
      };
      super.init(scaleOpts);
      this._normalized = opts.normalized;
    }
    parse(raw, index3) {
      if (raw === void 0) {
        return null;
      }
      return parse(this, raw);
    }
    beforeLayout() {
      super.beforeLayout();
      this._cache = {
        data: [],
        labels: [],
        all: []
      };
    }
    determineDataLimits() {
      const options = this.options;
      const adapter = this._adapter;
      const unit = options.time.unit || "day";
      let { min: min2, max: max2, minDefined, maxDefined } = this.getUserBounds();
      function _applyBounds(bounds) {
        if (!minDefined && !isNaN(bounds.min)) {
          min2 = Math.min(min2, bounds.min);
        }
        if (!maxDefined && !isNaN(bounds.max)) {
          max2 = Math.max(max2, bounds.max);
        }
      }
      if (!minDefined || !maxDefined) {
        _applyBounds(this._getLabelBounds());
        if (options.bounds !== "ticks" || options.ticks.source !== "labels") {
          _applyBounds(this.getMinMax(false));
        }
      }
      min2 = isNumberFinite(min2) && !isNaN(min2) ? min2 : +adapter.startOf(Date.now(), unit);
      max2 = isNumberFinite(max2) && !isNaN(max2) ? max2 : +adapter.endOf(Date.now(), unit) + 1;
      this.min = Math.min(min2, max2 - 1);
      this.max = Math.max(min2 + 1, max2);
    }
    _getLabelBounds() {
      const arr = this.getLabelTimestamps();
      let min2 = Number.POSITIVE_INFINITY;
      let max2 = Number.NEGATIVE_INFINITY;
      if (arr.length) {
        min2 = arr[0];
        max2 = arr[arr.length - 1];
      }
      return {
        min: min2,
        max: max2
      };
    }
    buildTicks() {
      const options = this.options;
      const timeOpts = options.time;
      const tickOpts = options.ticks;
      const timestamps = tickOpts.source === "labels" ? this.getLabelTimestamps() : this._generate();
      if (options.bounds === "ticks" && timestamps.length) {
        this.min = this._userMin || timestamps[0];
        this.max = this._userMax || timestamps[timestamps.length - 1];
      }
      const min2 = this.min;
      const max2 = this.max;
      const ticks = _filterBetween(timestamps, min2, max2);
      this._unit = timeOpts.unit || (tickOpts.autoSkip ? determineUnitForAutoTicks(timeOpts.minUnit, this.min, this.max, this._getLabelCapacity(min2)) : determineUnitForFormatting(this, ticks.length, timeOpts.minUnit, this.min, this.max));
      this._majorUnit = !tickOpts.major.enabled || this._unit === "year" ? void 0 : determineMajorUnit(this._unit);
      this.initOffsets(timestamps);
      if (options.reverse) {
        ticks.reverse();
      }
      return ticksFromTimestamps(this, ticks, this._majorUnit);
    }
    afterAutoSkip() {
      if (this.options.offsetAfterAutoskip) {
        this.initOffsets(this.ticks.map((tick) => +tick.value));
      }
    }
    initOffsets(timestamps = []) {
      let start = 0;
      let end = 0;
      let first, last;
      if (this.options.offset && timestamps.length) {
        first = this.getDecimalForValue(timestamps[0]);
        if (timestamps.length === 1) {
          start = 1 - first;
        } else {
          start = (this.getDecimalForValue(timestamps[1]) - first) / 2;
        }
        last = this.getDecimalForValue(timestamps[timestamps.length - 1]);
        if (timestamps.length === 1) {
          end = last;
        } else {
          end = (last - this.getDecimalForValue(timestamps[timestamps.length - 2])) / 2;
        }
      }
      const limit2 = timestamps.length < 3 ? 0.5 : 0.25;
      start = _limitValue(start, 0, limit2);
      end = _limitValue(end, 0, limit2);
      this._offsets = {
        start,
        end,
        factor: 1 / (start + 1 + end)
      };
    }
    _generate() {
      const adapter = this._adapter;
      const min2 = this.min;
      const max2 = this.max;
      const options = this.options;
      const timeOpts = options.time;
      const minor = timeOpts.unit || determineUnitForAutoTicks(timeOpts.minUnit, min2, max2, this._getLabelCapacity(min2));
      const stepSize = valueOrDefault(options.ticks.stepSize, 1);
      const weekday = minor === "week" ? timeOpts.isoWeekday : false;
      const hasWeekday = isNumber(weekday) || weekday === true;
      const ticks = {};
      let first = min2;
      let time, count;
      if (hasWeekday) {
        first = +adapter.startOf(first, "isoWeek", weekday);
      }
      first = +adapter.startOf(first, hasWeekday ? "day" : minor);
      if (adapter.diff(max2, min2, minor) > 1e5 * stepSize) {
        throw new Error(min2 + " and " + max2 + " are too far apart with stepSize of " + stepSize + " " + minor);
      }
      const timestamps = options.ticks.source === "data" && this.getDataTimestamps();
      for (time = first, count = 0; time < max2; time = +adapter.add(time, stepSize, minor), count++) {
        addTick(ticks, time, timestamps);
      }
      if (time === max2 || options.bounds === "ticks" || count === 1) {
        addTick(ticks, time, timestamps);
      }
      return Object.keys(ticks).sort(sorter).map((x2) => +x2);
    }
    getLabelForValue(value) {
      const adapter = this._adapter;
      const timeOpts = this.options.time;
      if (timeOpts.tooltipFormat) {
        return adapter.format(value, timeOpts.tooltipFormat);
      }
      return adapter.format(value, timeOpts.displayFormats.datetime);
    }
    format(value, format) {
      const options = this.options;
      const formats = options.time.displayFormats;
      const unit = this._unit;
      const fmt = format || formats[unit];
      return this._adapter.format(value, fmt);
    }
    _tickFormatFunction(time, index3, ticks, format) {
      const options = this.options;
      const formatter = options.ticks.callback;
      if (formatter) {
        return callback(formatter, [
          time,
          index3,
          ticks
        ], this);
      }
      const formats = options.time.displayFormats;
      const unit = this._unit;
      const majorUnit = this._majorUnit;
      const minorFormat = unit && formats[unit];
      const majorFormat = majorUnit && formats[majorUnit];
      const tick = ticks[index3];
      const major = majorUnit && majorFormat && tick && tick.major;
      return this._adapter.format(time, format || (major ? majorFormat : minorFormat));
    }
    generateTickLabels(ticks) {
      let i2, ilen, tick;
      for (i2 = 0, ilen = ticks.length; i2 < ilen; ++i2) {
        tick = ticks[i2];
        tick.label = this._tickFormatFunction(tick.value, i2, ticks);
      }
    }
    getDecimalForValue(value) {
      return value === null ? NaN : (value - this.min) / (this.max - this.min);
    }
    getPixelForValue(value) {
      const offsets = this._offsets;
      const pos = this.getDecimalForValue(value);
      return this.getPixelForDecimal((offsets.start + pos) * offsets.factor);
    }
    getValueForPixel(pixel) {
      const offsets = this._offsets;
      const pos = this.getDecimalForPixel(pixel) / offsets.factor - offsets.end;
      return this.min + pos * (this.max - this.min);
    }
    _getLabelSize(label) {
      const ticksOpts = this.options.ticks;
      const tickLabelWidth = this.ctx.measureText(label).width;
      const angle = toRadians(this.isHorizontal() ? ticksOpts.maxRotation : ticksOpts.minRotation);
      const cosRotation = Math.cos(angle);
      const sinRotation = Math.sin(angle);
      const tickFontSize = this._resolveTickFontOptions(0).size;
      return {
        w: tickLabelWidth * cosRotation + tickFontSize * sinRotation,
        h: tickLabelWidth * sinRotation + tickFontSize * cosRotation
      };
    }
    _getLabelCapacity(exampleTime) {
      const timeOpts = this.options.time;
      const displayFormats = timeOpts.displayFormats;
      const format = displayFormats[timeOpts.unit] || displayFormats.millisecond;
      const exampleLabel = this._tickFormatFunction(exampleTime, 0, ticksFromTimestamps(this, [
        exampleTime
      ], this._majorUnit), format);
      const size = this._getLabelSize(exampleLabel);
      const capacity = Math.floor(this.isHorizontal() ? this.width / size.w : this.height / size.h) - 1;
      return capacity > 0 ? capacity : 1;
    }
    getDataTimestamps() {
      let timestamps = this._cache.data || [];
      let i2, ilen;
      if (timestamps.length) {
        return timestamps;
      }
      const metas = this.getMatchingVisibleMetas();
      if (this._normalized && metas.length) {
        return this._cache.data = metas[0].controller.getAllParsedValues(this);
      }
      for (i2 = 0, ilen = metas.length; i2 < ilen; ++i2) {
        timestamps = timestamps.concat(metas[i2].controller.getAllParsedValues(this));
      }
      return this._cache.data = this.normalize(timestamps);
    }
    getLabelTimestamps() {
      const timestamps = this._cache.labels || [];
      let i2, ilen;
      if (timestamps.length) {
        return timestamps;
      }
      const labels = this.getLabels();
      for (i2 = 0, ilen = labels.length; i2 < ilen; ++i2) {
        timestamps.push(parse(this, labels[i2]));
      }
      return this._cache.labels = this._normalized ? timestamps : this.normalize(timestamps);
    }
    normalize(values) {
      return _arrayUnique(values.sort(sorter));
    }
  };
  function interpolate2(table, val, reverse) {
    let lo = 0;
    let hi = table.length - 1;
    let prevSource, nextSource, prevTarget, nextTarget;
    if (reverse) {
      if (val >= table[lo].pos && val <= table[hi].pos) {
        ({ lo, hi } = _lookupByKey(table, "pos", val));
      }
      ({ pos: prevSource, time: prevTarget } = table[lo]);
      ({ pos: nextSource, time: nextTarget } = table[hi]);
    } else {
      if (val >= table[lo].time && val <= table[hi].time) {
        ({ lo, hi } = _lookupByKey(table, "time", val));
      }
      ({ time: prevSource, pos: prevTarget } = table[lo]);
      ({ time: nextSource, pos: nextTarget } = table[hi]);
    }
    const span = nextSource - prevSource;
    return span ? prevTarget + (nextTarget - prevTarget) * (val - prevSource) / span : prevTarget;
  }
  var TimeSeriesScale = class extends TimeScale {
    static id = "timeseries";
    static defaults = TimeScale.defaults;
    constructor(props) {
      super(props);
      this._table = [];
      this._minPos = void 0;
      this._tableRange = void 0;
    }
    initOffsets() {
      const timestamps = this._getTimestampsForTable();
      const table = this._table = this.buildLookupTable(timestamps);
      this._minPos = interpolate2(table, this.min);
      this._tableRange = interpolate2(table, this.max) - this._minPos;
      super.initOffsets(timestamps);
    }
    buildLookupTable(timestamps) {
      const { min: min2, max: max2 } = this;
      const items = [];
      const table = [];
      let i2, ilen, prev, curr, next;
      for (i2 = 0, ilen = timestamps.length; i2 < ilen; ++i2) {
        curr = timestamps[i2];
        if (curr >= min2 && curr <= max2) {
          items.push(curr);
        }
      }
      if (items.length < 2) {
        return [
          {
            time: min2,
            pos: 0
          },
          {
            time: max2,
            pos: 1
          }
        ];
      }
      for (i2 = 0, ilen = items.length; i2 < ilen; ++i2) {
        next = items[i2 + 1];
        prev = items[i2 - 1];
        curr = items[i2];
        if (Math.round((next + prev) / 2) !== curr) {
          table.push({
            time: curr,
            pos: i2 / (ilen - 1)
          });
        }
      }
      return table;
    }
    _generate() {
      const min2 = this.min;
      const max2 = this.max;
      let timestamps = super.getDataTimestamps();
      if (!timestamps.includes(min2) || !timestamps.length) {
        timestamps.splice(0, 0, min2);
      }
      if (!timestamps.includes(max2) || timestamps.length === 1) {
        timestamps.push(max2);
      }
      return timestamps.sort((a2, b2) => a2 - b2);
    }
    _getTimestampsForTable() {
      let timestamps = this._cache.all || [];
      if (timestamps.length) {
        return timestamps;
      }
      const data = this.getDataTimestamps();
      const label = this.getLabelTimestamps();
      if (data.length && label.length) {
        timestamps = this.normalize(data.concat(label));
      } else {
        timestamps = data.length ? data : label;
      }
      timestamps = this._cache.all = timestamps;
      return timestamps;
    }
    getDecimalForValue(value) {
      return (interpolate2(this._table, value) - this._minPos) / this._tableRange;
    }
    getValueForPixel(pixel) {
      const offsets = this._offsets;
      const decimal = this.getDecimalForPixel(pixel) / offsets.factor - offsets.end;
      return interpolate2(this._table, decimal * this._tableRange + this._minPos, true);
    }
  };

  // node_modules/chartjs-chart-treemap/dist/chartjs-chart-treemap.esm.js
  var isOlderPart = (act, req) => req > act || act.length > req.length && act.slice(0, req.length) === req;
  var getGroupKey = (lvl) => "" + lvl;
  function scanTreeObject(keys, treeLeafKey, obj, tree = [], lvl = 0, result = []) {
    const objIndex = lvl - 1;
    if (keys[0] in obj && lvl > 0) {
      const record = tree.reduce(function(reduced, item, i2) {
        if (i2 !== objIndex) {
          reduced[getGroupKey(i2)] = item;
        }
        return reduced;
      }, {});
      record[treeLeafKey] = tree[objIndex];
      keys.forEach(function(k2) {
        record[k2] = obj[k2];
      });
      result.push(record);
    } else {
      for (const childKey of Object.keys(obj)) {
        const child = obj[childKey];
        if (isObject(child)) {
          tree.push(childKey);
          scanTreeObject(keys, treeLeafKey, child, tree, lvl + 1, result);
        }
      }
    }
    tree.splice(objIndex, 1);
    return result;
  }
  function normalizeTreeToArray(keys, treeLeafKey, obj) {
    const data = scanTreeObject(keys, treeLeafKey, obj);
    if (!data.length) {
      return data;
    }
    const max2 = data.reduce(function(maxVal, element) {
      const ikeys = Object.keys(element).length - 2;
      return maxVal > ikeys ? maxVal : ikeys;
    });
    data.forEach(function(element) {
      for (let i2 = 0; i2 < max2; i2++) {
        const groupKey = getGroupKey(i2);
        if (!element[groupKey]) {
          element[groupKey] = "";
        }
      }
    });
    return data;
  }
  function flatten(input) {
    const stack = [...input];
    const res = [];
    while (stack.length) {
      const next = stack.pop();
      if (Array.isArray(next)) {
        stack.push(...next);
      } else {
        res.push(next);
      }
    }
    return res.reverse();
  }
  function getPath(groups, value, defaultValue) {
    if (!groups.length) {
      return;
    }
    const path = [];
    for (const grp of groups) {
      const item = value[grp];
      if (item === "") {
        path.push(defaultValue);
        break;
      }
      path.push(item);
    }
    return path.length ? path.join(".") : defaultValue;
  }
  function group(values, grp, keys, treeLeafKey, mainGrp, mainValue, groups = []) {
    const key = keys[0];
    const addKeys = keys.slice(1);
    const tmp = /* @__PURE__ */ Object.create(null);
    const data = /* @__PURE__ */ Object.create(null);
    const ret = [];
    let g2, i2, n3;
    for (i2 = 0, n3 = values.length; i2 < n3; ++i2) {
      const v2 = values[i2];
      if (mainGrp && v2[mainGrp] !== mainValue) {
        continue;
      }
      g2 = v2[grp] || v2[treeLeafKey] || "";
      if (!(g2 in tmp)) {
        const tmpRef2 = tmp[g2] = { value: 0 };
        addKeys.forEach(function(k2) {
          tmpRef2[k2] = 0;
        });
        data[g2] = [];
      }
      tmp[g2].value += +v2[key];
      tmp[g2].label = v2[grp] || "";
      const tmpRef = tmp[g2];
      addKeys.forEach(function(k2) {
        tmpRef[k2] += v2[k2];
      });
      tmp[g2].path = getPath(groups, v2, g2);
      data[g2].push(v2);
    }
    Object.keys(tmp).forEach((k2) => {
      const v2 = { children: data[k2] };
      v2[key] = +tmp[k2].value;
      addKeys.forEach(function(ak) {
        v2[ak] = +tmp[k2][ak];
      });
      v2[grp] = tmp[k2].label;
      v2.label = k2;
      v2.path = tmp[k2].path;
      if (mainGrp) {
        v2[mainGrp] = mainValue;
      }
      ret.push(v2);
    });
    return ret;
  }
  function index2(values, key) {
    let n3 = values.length;
    let i2;
    if (!n3) {
      return key;
    }
    const obj = isObject(values[0]);
    key = obj ? key : "v";
    for (i2 = 0, n3 = values.length; i2 < n3; ++i2) {
      if (obj) {
        values[i2]._idx = i2;
      } else {
        values[i2] = { v: values[i2], _idx: i2 };
      }
    }
    return key;
  }
  function sort(values, key) {
    if (key) {
      values.sort((a2, b2) => +b2[key] - +a2[key]);
    } else {
      values.sort((a2, b2) => +b2 - +a2);
    }
  }
  function sum(values, key) {
    let s2, i2, n3;
    for (s2 = 0, i2 = 0, n3 = values.length; i2 < n3; ++i2) {
      s2 += key ? +values[i2][key] : +values[i2];
    }
    return s2;
  }
  function requireVersion(pkg, min2, ver, strict = true) {
    const parts = ver.split(".");
    let i2 = 0;
    for (const req of min2.split(".")) {
      const act = parts[i2++];
      if (parseInt(req, 10) < parseInt(act, 10)) {
        break;
      }
      if (isOlderPart(act, req)) {
        if (strict) {
          throw new Error(`${pkg} v${ver} is not supported. v${min2} or newer is required.`);
        } else {
          return false;
        }
      }
    }
    return true;
  }
  var widthCache = /* @__PURE__ */ new Map();
  function getBounds(rect, useFinalPosition) {
    const { x: x2, y: y2, width, height } = rect.getProps(["x", "y", "width", "height"], useFinalPosition);
    return { left: x2, top: y2, right: x2 + width, bottom: y2 + height };
  }
  function limit(value, min2, max2) {
    return Math.max(Math.min(value, max2), min2);
  }
  function parseBorderWidth2(value, maxW, maxH) {
    const o2 = toTRBL(value);
    return {
      t: limit(o2.top, 0, maxH),
      r: limit(o2.right, 0, maxW),
      b: limit(o2.bottom, 0, maxH),
      l: limit(o2.left, 0, maxW)
    };
  }
  function parseBorderRadius2(value, maxW, maxH) {
    const o2 = toTRBLCorners(value);
    const maxR = Math.min(maxW, maxH);
    return {
      topLeft: limit(o2.topLeft, 0, maxR),
      topRight: limit(o2.topRight, 0, maxR),
      bottomLeft: limit(o2.bottomLeft, 0, maxR),
      bottomRight: limit(o2.bottomRight, 0, maxR)
    };
  }
  function boundingRects2(rect) {
    const bounds = getBounds(rect);
    const width = bounds.right - bounds.left;
    const height = bounds.bottom - bounds.top;
    const border = parseBorderWidth2(rect.options.borderWidth, width / 2, height / 2);
    const radius = parseBorderRadius2(rect.options.borderRadius, width / 2, height / 2);
    const outer = {
      x: bounds.left,
      y: bounds.top,
      w: width,
      h: height,
      active: rect.active,
      radius
    };
    return {
      outer,
      inner: {
        x: outer.x + border.l,
        y: outer.y + border.t,
        w: outer.w - border.l - border.r,
        h: outer.h - border.t - border.b,
        active: rect.active,
        radius: {
          topLeft: Math.max(0, radius.topLeft - Math.max(border.t, border.l)),
          topRight: Math.max(0, radius.topRight - Math.max(border.t, border.r)),
          bottomLeft: Math.max(0, radius.bottomLeft - Math.max(border.b, border.l)),
          bottomRight: Math.max(0, radius.bottomRight - Math.max(border.b, border.r))
        }
      }
    };
  }
  function inRange2(rect, x2, y2, useFinalPosition) {
    const skipX = x2 === null;
    const skipY = y2 === null;
    const bounds = !rect || skipX && skipY ? false : getBounds(rect, useFinalPosition);
    return bounds && (skipX || x2 >= bounds.left && x2 <= bounds.right) && (skipY || y2 >= bounds.top && y2 <= bounds.bottom);
  }
  function hasRadius2(radius) {
    return radius.topLeft || radius.topRight || radius.bottomLeft || radius.bottomRight;
  }
  function addNormalRectPath2(ctx, rect) {
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
  }
  function shouldDrawCaption(rect, options) {
    if (!options || options.display === false) {
      return false;
    }
    const { w: w2, h: h3 } = rect;
    const font = toFont(options.font);
    const min2 = font.lineHeight;
    const padding = limit(valueOrDefault(options.padding, 3) * 2, 0, Math.min(w2, h3));
    return w2 - padding > min2 && h3 - padding > min2;
  }
  function drawText(ctx, rect, options, item, levels) {
    const { captions, labels } = options;
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    const isLeaf = item && (!defined(item.l) || item.l === levels);
    if (isLeaf && labels.display) {
      drawLabel(ctx, rect, options);
    } else if (!isLeaf && shouldDrawCaption(rect, captions)) {
      drawCaption(ctx, rect, options, item);
    }
    ctx.restore();
  }
  function drawCaption(ctx, rect, options, item) {
    const { captions, spacing, rtl } = options;
    const { color: color2, hoverColor, font, hoverFont, padding, align, formatter } = captions;
    const oColor = (rect.active ? hoverColor : color2) || color2;
    const oAlign = align || (rtl ? "right" : "left");
    const optFont = (rect.active ? hoverFont : font) || font;
    const oFont = toFont(optFont);
    const lh = oFont.lineHeight / 2;
    const x2 = calculateX(rect, oAlign, padding);
    ctx.fillStyle = oColor;
    ctx.font = oFont.string;
    ctx.textAlign = oAlign;
    ctx.textBaseline = "middle";
    ctx.fillText(formatter || item.g, x2, rect.y + padding + spacing + lh);
  }
  function measureLabelSize2(ctx, lines, fonts) {
    const fontsKey = fonts.reduce(function(prev, item) {
      prev += item.string;
      return prev;
    }, "");
    const mapKey = lines.join() + fontsKey + (ctx._measureText ? "-spriting" : "");
    if (!widthCache.has(mapKey)) {
      ctx.save();
      const count = lines.length;
      let width = 0;
      let height = 0;
      for (let i2 = 0; i2 < count; i2++) {
        const font = fonts[Math.min(i2, fonts.length - 1)];
        ctx.font = font.string;
        const text = lines[i2];
        width = Math.max(width, ctx.measureText(text).width);
        height += font.lineHeight;
      }
      ctx.restore();
      widthCache.set(mapKey, { width, height });
    }
    return widthCache.get(mapKey);
  }
  function toFonts(fonts, fitRatio) {
    return fonts.map(function(f2) {
      f2.size = Math.floor(f2.size * fitRatio);
      f2.lineHeight = void 0;
      return toFont(f2);
    });
  }
  function labelToDraw(ctx, rect, options, labelSize) {
    const { overflow, padding } = options;
    const { width, height } = labelSize;
    if (overflow === "hidden") {
      return !(width + padding * 2 > rect.w || height + padding * 2 > rect.h);
    } else if (overflow === "fit") {
      const ratio = Math.min(rect.w / (width + padding * 2), rect.h / (height + padding * 2));
      if (ratio < 1) {
        return ratio;
      }
    }
    return true;
  }
  function getFontFromOptions(rect, labels) {
    const { font, hoverFont } = labels;
    const optFont = (rect.active ? hoverFont : font) || font;
    return isArray(optFont) ? optFont.map((f2) => toFont(f2)) : [toFont(optFont)];
  }
  function drawLabel(ctx, rect, options) {
    const labels = options.labels;
    const content = labels.formatter;
    if (!content) {
      return;
    }
    const contents = isArray(content) ? content : [content];
    let fonts = getFontFromOptions(rect, labels);
    let labelSize = measureLabelSize2(ctx, contents, fonts);
    const lblToDraw = labelToDraw(ctx, rect, labels, labelSize);
    if (!lblToDraw) {
      return;
    }
    if (isNumber(lblToDraw)) {
      labelSize = { width: labelSize.width * lblToDraw, height: labelSize.height * lblToDraw };
      fonts = toFonts(fonts, lblToDraw);
    }
    const { color: color2, hoverColor, align } = labels;
    const optColor = (rect.active ? hoverColor : color2) || color2;
    const colors2 = isArray(optColor) ? optColor : [optColor];
    const xyPoint = calculateXYLabel(rect, labels, labelSize);
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    let lhs = 0;
    contents.forEach(function(l2, i2) {
      const c2 = colors2[Math.min(i2, colors2.length - 1)];
      const f2 = fonts[Math.min(i2, fonts.length - 1)];
      const lh = f2.lineHeight;
      ctx.font = f2.string;
      ctx.fillStyle = c2;
      ctx.fillText(l2, xyPoint.x, xyPoint.y + lh / 2 + lhs);
      lhs += lh;
    });
  }
  function drawDivider(ctx, rect, options, item) {
    const dividers = options.dividers;
    if (!dividers.display || !item._data.children.length) {
      return;
    }
    const { x: x2, y: y2, w: w2, h: h3 } = rect;
    const { lineColor, lineCapStyle, lineDash, lineDashOffset, lineWidth } = dividers;
    ctx.save();
    ctx.strokeStyle = lineColor;
    ctx.lineCap = lineCapStyle;
    ctx.setLineDash(lineDash);
    ctx.lineDashOffset = lineDashOffset;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    if (w2 > h3) {
      const w22 = w2 / 2;
      ctx.moveTo(x2 + w22, y2);
      ctx.lineTo(x2 + w22, y2 + h3);
    } else {
      const h22 = h3 / 2;
      ctx.moveTo(x2, y2 + h22);
      ctx.lineTo(x2 + w2, y2 + h22);
    }
    ctx.stroke();
    ctx.restore();
  }
  function calculateXYLabel(rect, options, labelSize) {
    const { align, position, padding } = options;
    let x2, y2;
    x2 = calculateX(rect, align, padding);
    if (position === "top") {
      y2 = rect.y + padding;
    } else if (position === "bottom") {
      y2 = rect.y + rect.h - padding - labelSize.height;
    } else {
      y2 = rect.y + (rect.h - labelSize.height) / 2 + padding;
    }
    return { x: x2, y: y2 };
  }
  function calculateX(rect, align, padding) {
    if (align === "left") {
      return rect.x + padding;
    } else if (align === "right") {
      return rect.x + rect.w - padding;
    }
    return rect.x + rect.w / 2;
  }
  var TreemapElement = class extends Element {
    constructor(cfg) {
      super();
      this.options = void 0;
      this.width = void 0;
      this.height = void 0;
      if (cfg) {
        Object.assign(this, cfg);
      }
    }
    draw(ctx, data, levels = 0) {
      if (!data) {
        return;
      }
      const options = this.options;
      const { inner, outer } = boundingRects2(this);
      const addRectPath = hasRadius2(outer.radius) ? addRoundedRectPath : addNormalRectPath2;
      ctx.save();
      if (outer.w !== inner.w || outer.h !== inner.h) {
        ctx.beginPath();
        addRectPath(ctx, outer);
        ctx.clip();
        addRectPath(ctx, inner);
        ctx.fillStyle = options.borderColor;
        ctx.fill("evenodd");
      }
      ctx.beginPath();
      addRectPath(ctx, inner);
      ctx.fillStyle = options.backgroundColor;
      ctx.fill();
      drawDivider(ctx, inner, options, data);
      drawText(ctx, inner, options, data, levels);
      ctx.restore();
    }
    inRange(mouseX, mouseY, useFinalPosition) {
      return inRange2(this, mouseX, mouseY, useFinalPosition);
    }
    inXRange(mouseX, useFinalPosition) {
      return inRange2(this, mouseX, null, useFinalPosition);
    }
    inYRange(mouseY, useFinalPosition) {
      return inRange2(this, null, mouseY, useFinalPosition);
    }
    getCenterPoint(useFinalPosition) {
      const { x: x2, y: y2, width, height } = this.getProps(["x", "y", "width", "height"], useFinalPosition);
      return {
        x: x2 + width / 2,
        y: y2 + height / 2
      };
    }
    tooltipPosition() {
      return this.getCenterPoint();
    }
    /**
     * @todo: remove this unused function in v3
     */
    getRange(axis) {
      return axis === "x" ? this.width / 2 : this.height / 2;
    }
  };
  TreemapElement.id = "treemap";
  TreemapElement.defaults = {
    borderRadius: 0,
    borderWidth: 0,
    captions: {
      align: void 0,
      color: "black",
      display: true,
      font: {},
      formatter: (ctx) => ctx.raw.g || ctx.raw._data.label || "",
      padding: 3
    },
    dividers: {
      display: false,
      lineCapStyle: "butt",
      lineColor: "black",
      lineDash: [],
      lineDashOffset: 0,
      lineWidth: 1
    },
    label: void 0,
    labels: {
      align: "center",
      color: "black",
      display: false,
      font: {},
      formatter(ctx) {
        if (ctx.raw.g) {
          return [ctx.raw.g, ctx.raw.v + ""];
        }
        return ctx.raw._data.label ? [ctx.raw._data.label, ctx.raw.v + ""] : ctx.raw.v + "";
      },
      overflow: "cut",
      position: "middle",
      padding: 3
    },
    rtl: false,
    spacing: 0.5,
    unsorted: false
  };
  TreemapElement.descriptors = {
    captions: {
      _fallback: true
    },
    labels: {
      _fallback: true
    },
    _scriptable: true,
    _indexable: false
  };
  TreemapElement.defaultRoutes = {
    backgroundColor: "backgroundColor",
    borderColor: "borderColor"
  };
  function getDims(itm, w2, s2, key) {
    const a2 = itm._normalized;
    const ar = w2 * a2 / s2;
    const d1 = Math.sqrt(a2 * ar);
    const d2 = a2 / d1;
    const w3 = key === "_ix" ? d1 : d2;
    const h3 = key === "_ix" ? d2 : d1;
    return { d1, d2, w: w3, h: h3 };
  }
  var getX = (rect, w2) => rect.rtl ? rect.x + rect.iw - w2 : rect.x + rect._ix;
  function buildRow(rect, itm, dims, sum2) {
    const r2 = {
      x: getX(rect, dims.w),
      y: rect.y + rect._iy,
      w: dims.w,
      h: dims.h,
      a: itm._normalized,
      v: itm.value,
      vs: itm.values,
      s: sum2,
      _data: itm._data
    };
    if (itm.group) {
      r2.g = itm.group;
      r2.l = itm.level;
      r2.gs = itm.groupSum;
    }
    return r2;
  }
  var Rect = class {
    constructor(r2) {
      r2 = r2 || { w: 1, h: 1 };
      this.rtl = !!r2.rtl;
      this.unsorted = !!r2.unsorted;
      this.x = r2.x || r2.left || 0;
      this.y = r2.y || r2.top || 0;
      this._ix = 0;
      this._iy = 0;
      this.w = r2.w || r2.width || r2.right - r2.left;
      this.h = r2.h || r2.height || r2.bottom - r2.top;
    }
    get area() {
      return this.w * this.h;
    }
    get iw() {
      return this.w - this._ix;
    }
    get ih() {
      return this.h - this._iy;
    }
    get dir() {
      const ih = this.ih;
      return ih <= this.iw && ih > 0 ? "y" : "x";
    }
    get side() {
      return this.dir === "x" ? this.iw : this.ih;
    }
    map(arr) {
      const { dir, side } = this;
      const key = dir === "x" ? "_ix" : "_iy";
      const sum2 = arr.nsum;
      const row = arr.get();
      const w2 = side * side;
      const s2 = sum2 * sum2;
      const ret = [];
      let maxd2 = 0;
      let totd1 = 0;
      for (const itm of row) {
        const dims = getDims(itm, w2, s2, key);
        totd1 += dims.d1;
        maxd2 = Math.max(maxd2, dims.d2);
        ret.push(buildRow(this, itm, dims, arr.sum));
        this[key] += dims.d1;
      }
      this[dir === "x" ? "_iy" : "_ix"] += maxd2;
      this[key] -= totd1;
      return ret;
    }
  };
  var min = Math.min;
  var max = Math.max;
  function getStat(sa) {
    return {
      min: sa.min,
      max: sa.max,
      sum: sa.sum,
      nmin: sa.nmin,
      nmax: sa.nmax,
      nsum: sa.nsum
    };
  }
  function getNewStat(sa, o2) {
    const v2 = +o2[sa.key];
    const n3 = v2 * sa.ratio;
    o2._normalized = n3;
    return {
      min: min(sa.min, v2),
      max: max(sa.max, v2),
      sum: sa.sum + v2,
      nmin: min(sa.nmin, n3),
      nmax: max(sa.nmax, n3),
      nsum: sa.nsum + n3
    };
  }
  function setStat(sa, stat) {
    Object.assign(sa, stat);
  }
  function push(sa, o2, stat) {
    sa._arr.push(o2);
    setStat(sa, stat);
  }
  var StatArray = class {
    constructor(key, ratio) {
      const me = this;
      me.key = key;
      me.ratio = ratio;
      me.reset();
    }
    get length() {
      return this._arr.length;
    }
    reset() {
      const me = this;
      me._arr = [];
      me._hist = [];
      me.sum = 0;
      me.nsum = 0;
      me.min = Infinity;
      me.max = -Infinity;
      me.nmin = Infinity;
      me.nmax = -Infinity;
    }
    push(o2) {
      push(this, o2, getNewStat(this, o2));
    }
    pushIf(o2, fn, ...args) {
      const nstat = getNewStat(this, o2);
      if (!fn(getStat(this), nstat, args)) {
        return o2;
      }
      push(this, o2, nstat);
    }
    get() {
      return this._arr;
    }
  };
  function compareAspectRatio(oldStat, newStat, args) {
    if (oldStat.sum === 0) {
      return true;
    }
    const [length] = args;
    const os2 = oldStat.nsum * oldStat.nsum;
    const ns2 = newStat.nsum * newStat.nsum;
    const l2 = length * length;
    const or = Math.max(l2 * oldStat.nmax / os2, os2 / (l2 * oldStat.nmin));
    const nr = Math.max(l2 * newStat.nmax / ns2, ns2 / (l2 * newStat.nmin));
    return nr <= or;
  }
  function squarify(values, rectangle, keys = [], grp, lvl, gsum) {
    values = values || [];
    const rows = [];
    const rect = new Rect(rectangle);
    const row = new StatArray("value", rect.area / sum(values, keys[0]));
    let length = rect.side;
    const n3 = values.length;
    let i2, o2;
    if (!n3) {
      return rows;
    }
    const tmp = values.slice();
    let key = index2(tmp, keys[0]);
    if (!rectangle?.unsorted) {
      sort(tmp, key);
    }
    const val = (idx) => key ? +tmp[idx][key] : +tmp[idx];
    const gval = (idx) => grp && tmp[idx][grp];
    for (i2 = 0; i2 < n3; ++i2) {
      o2 = { value: val(i2), groupSum: gsum, _data: values[tmp[i2]._idx], level: void 0, group: void 0 };
      if (grp) {
        o2.level = lvl;
        o2.group = gval(i2);
        const tmpRef = tmp[i2];
        o2.values = keys.reduce(function(obj, k2) {
          obj[k2] = +tmpRef[k2];
          return obj;
        }, {});
      }
      o2 = row.pushIf(o2, compareAspectRatio, length);
      if (o2) {
        rows.push(rect.map(row));
        length = rect.side;
        row.reset();
        row.push(o2);
      }
    }
    if (row.length) {
      rows.push(rect.map(row));
    }
    return flatten(rows);
  }
  var version2 = "3.1.0";
  function scaleRect(sq, xScale, yScale, sp) {
    const sp2 = sp * 2;
    const x2 = xScale.getPixelForValue(sq.x);
    const y2 = yScale.getPixelForValue(sq.y);
    const w2 = xScale.getPixelForValue(sq.x + sq.w) - x2;
    const h3 = yScale.getPixelForValue(sq.y + sq.h) - y2;
    return {
      x: x2 + sp,
      y: y2 + sp,
      width: w2 - sp2,
      height: h3 - sp2,
      hidden: sp2 > w2 || sp2 > h3
    };
  }
  function rectNotEqual(r1, r2) {
    return !r1 || !r2 || r1.x !== r2.x || r1.y !== r2.y || r1.w !== r2.w || r1.h !== r2.h || r1.rtl !== r2.rtl || r1.unsorted !== r2.unsorted;
  }
  function arrayNotEqual(a2, b2) {
    let i2, n3;
    if (!a2 || !b2) {
      return true;
    }
    if (a2 === b2) {
      return false;
    }
    if (a2.length !== b2.length) {
      return true;
    }
    for (i2 = 0, n3 = a2.length; i2 < n3; ++i2) {
      if (a2[i2] !== b2[i2]) {
        return true;
      }
    }
    return false;
  }
  function buildData(tree, dataset, keys, mainRect) {
    const treeLeafKey = dataset.treeLeafKey || "_leaf";
    if (isObject(tree)) {
      tree = normalizeTreeToArray(keys, treeLeafKey, tree);
    }
    const groups = dataset.groups || [];
    const glen = groups.length;
    const sp = valueOrDefault(dataset.spacing, 0);
    const captions = dataset.captions || {};
    const font = toFont(captions.font);
    const padding = valueOrDefault(captions.padding, 3);
    function recur(treeElements, gidx, rect, parent, gs) {
      const g2 = getGroupKey(groups[gidx]);
      const pg = gidx > 0 && getGroupKey(groups[gidx - 1]);
      const gdata = group(treeElements, g2, keys, treeLeafKey, pg, parent, groups.filter((item, index3) => index3 <= gidx));
      const gsq = squarify(gdata, rect, keys, g2, gidx, gs);
      const ret = gsq.slice();
      if (gidx < glen - 1) {
        gsq.forEach((sq) => {
          const bw = parseBorderWidth2(dataset.borderWidth, sq.w / 2, sq.h / 2);
          const subRect = {
            ...rect,
            x: sq.x + sp + bw.l,
            y: sq.y + sp + bw.t,
            w: sq.w - 2 * sp - bw.l - bw.r,
            h: sq.h - 2 * sp - bw.t - bw.b
          };
          if (shouldDrawCaption(subRect, captions)) {
            subRect.y += font.lineHeight + padding * 2;
            subRect.h -= font.lineHeight + padding * 2;
          }
          gdata.forEach((gEl) => {
            ret.push(...recur(gEl.children, gidx + 1, subRect, sq.g, sq.s));
          });
        });
      }
      return ret;
    }
    return glen ? recur(tree, 0, mainRect) : squarify(tree, mainRect, keys);
  }
  var TreemapController = class extends DatasetController {
    constructor(chart, datasetIndex) {
      super(chart, datasetIndex);
      this._groups = void 0;
      this._keys = void 0;
      this._rect = void 0;
      this._rectChanged = true;
    }
    initialize() {
      this.enableOptionSharing = true;
      super.initialize();
    }
    getMinMax(scale) {
      return {
        min: 0,
        max: scale.axis === "x" ? scale.right - scale.left : scale.bottom - scale.top
      };
    }
    configure() {
      super.configure();
      const { xScale, yScale } = this.getMeta();
      if (!xScale || !yScale) {
        return;
      }
      const w2 = xScale.right - xScale.left;
      const h3 = yScale.bottom - yScale.top;
      const rect = { x: 0, y: 0, w: w2, h: h3, rtl: !!this.options.rtl, unsorted: !!this.options.unsorted };
      if (rectNotEqual(this._rect, rect)) {
        this._rect = rect;
        this._rectChanged = true;
      }
      if (this._rectChanged) {
        xScale.max = w2;
        xScale.configure();
        yScale.max = h3;
        yScale.configure();
      }
    }
    update(mode) {
      const dataset = this.getDataset();
      const { data } = this.getMeta();
      const groups = dataset.groups || [];
      const keys = [dataset.key || ""].concat(dataset.sumKeys || []);
      const tree = dataset.tree = dataset.tree || dataset.data || [];
      if (mode === "reset") {
        this.configure();
      }
      if (this._rectChanged || arrayNotEqual(this._keys, keys) || arrayNotEqual(this._groups, groups) || this._prevTree !== tree) {
        this._groups = groups.slice();
        this._keys = keys.slice();
        this._prevTree = tree;
        this._rectChanged = false;
        dataset.data = buildData(tree, dataset, this._keys, this._rect);
        this._dataCheck();
        this._resyncElements();
      }
      this.updateElements(data, 0, data.length, mode);
    }
    updateElements(rects, start, count, mode) {
      const reset = mode === "reset";
      const dataset = this.getDataset();
      const firstOpts = this._rect.options = this.resolveDataElementOptions(start, mode);
      const sharedOptions = this.getSharedOptions(firstOpts);
      const includeOptions = this.includeOptions(mode, sharedOptions);
      const { xScale, yScale } = this.getMeta(this.index);
      for (let i2 = start; i2 < start + count; i2++) {
        const options = sharedOptions || this.resolveDataElementOptions(i2, mode);
        const properties = scaleRect(dataset.data[i2], xScale, yScale, options.spacing);
        if (reset) {
          properties.width = 0;
          properties.height = 0;
        }
        if (includeOptions) {
          properties.options = options;
        }
        this.updateElement(rects[i2], i2, properties, mode);
      }
      this.updateSharedOptions(sharedOptions, mode, firstOpts);
    }
    draw() {
      const { ctx, chartArea } = this.chart;
      const metadata = this.getMeta().data || [];
      const dataset = this.getDataset();
      const levels = (dataset.groups || []).length - 1;
      const data = dataset.data;
      clipArea(ctx, chartArea);
      for (let i2 = 0, ilen = metadata.length; i2 < ilen; ++i2) {
        const rect = metadata[i2];
        if (!rect.hidden) {
          rect.draw(ctx, data[i2], levels);
        }
      }
      unclipArea(ctx);
    }
  };
  TreemapController.id = "treemap";
  TreemapController.version = version2;
  TreemapController.defaults = {
    dataElementType: "treemap",
    animations: {
      numbers: {
        type: "number",
        properties: ["x", "y", "width", "height"]
      }
    }
  };
  TreemapController.descriptors = {
    _scriptable: true,
    _indexable: false
  };
  TreemapController.overrides = {
    interaction: {
      mode: "point",
      includeInvisible: true,
      intersect: true
    },
    hover: {},
    plugins: {
      tooltip: {
        position: "treemap",
        intersect: true,
        callbacks: {
          title(items) {
            if (items.length) {
              const item = items[0];
              return item.dataset.key || "";
            }
            return "";
          },
          label(item) {
            const dataset = item.dataset;
            const dataItem = dataset.data[item.dataIndex];
            const label = dataItem.g || dataItem._data.label || dataset.label;
            return (label ? label + ": " : "") + dataItem.v;
          }
        }
      }
    },
    scales: {
      x: {
        type: "linear",
        alignToPixels: true,
        bounds: "data",
        display: false
      },
      y: {
        type: "linear",
        alignToPixels: true,
        bounds: "data",
        display: false,
        reverse: true
      }
    }
  };
  TreemapController.beforeRegister = function() {
    requireVersion("chart.js", "3.8", Chart.version);
  };
  TreemapController.afterRegister = function() {
    const tooltipPlugin = registry.plugins.get("tooltip");
    if (tooltipPlugin) {
      tooltipPlugin.positioners.treemap = function(active) {
        if (!active.length) {
          return false;
        }
        const item = active[active.length - 1];
        const el2 = item.element;
        return el2.tooltipPosition();
      };
    } else {
      console.warn("Unable to register the treemap positioner because tooltip plugin is not registered");
    }
  };
  TreemapController.afterUnregister = function() {
    const tooltipPlugin = registry.plugins.get("tooltip");
    if (tooltipPlugin) {
      delete tooltipPlugin.positioners.treemap;
    }
  };

  // src/cli/browser/shared-browser.ts
  var vscode = {
    postMessage: (_msg) => {
    },
    getState: () => null,
    setState: (_s) => {
    }
  };
  function rpc(method, params) {
    const dispatch = window.__cruxRpc;
    if (!dispatch) return Promise.reject(new Error("analyzer.js not loaded yet"));
    return dispatch(method, params);
  }
  async function rpcAllSettled(calls, fallbacks) {
    const results = await Promise.allSettled(calls);
    return results.map(
      (r2, i2) => r2.status === "fulfilled" ? r2.value : fallbacks[i2]
    );
  }
  function initMessageListener(_onProgress, onDataReady2) {
    const cfg = window.__cruxConfig ?? {};
    const workspaceName = cfg.workspace ?? "";
    setTimeout(() => {
      onDataReady2(workspaceName, { skippedFiles: 0, skippedLines: 0 });
      if (cfg.harness) {
        setTimeout(() => {
          const sel = document.getElementById("harness-filter");
          if (sel) {
            sel.value = cfg.harness;
            sel.dispatchEvent(new Event("change"));
          }
        }, 200);
      }
    }, 0);
  }
  Chart.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    RadialLinearScale,
    plugin_tooltip,
    plugin_legend,
    LineController,
    BarController,
    DoughnutController,
    PieController,
    RadarController,
    index,
    TreemapController,
    TreemapElement
  );
  Chart.defaults.color = getComputedStyle(document.documentElement).getPropertyValue("--vscode-descriptionForeground").trim() || "#8b949e";
  Chart.defaults.borderColor = getComputedStyle(document.documentElement).getPropertyValue("--vscode-panel-border").trim() || "#474747";
  Chart.defaults.font.family = getComputedStyle(document.documentElement).getPropertyValue("--vscode-font-family").trim() || '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';
  var charts = [];
  function trackChart(c2) {
    charts.push(c2);
  }
  function destroyCharts() {
    for (const c2 of charts) c2.destroy();
    charts.length = 0;
  }
  function destroyChartById(canvasId) {
    const idx = charts.findIndex((c2) => c2.canvas.id === canvasId);
    if (idx >= 0) {
      charts[idx].destroy();
      charts.splice(idx, 1);
    }
  }
  function $(sel) {
    return document.querySelector(sel);
  }
  function $$(sel) {
    return Array.from(document.querySelectorAll(sel));
  }
  function el(tag, cls, content) {
    const e2 = document.createElement(tag);
    if (cls) e2.className = cls;
    if (content) setHtml(e2, typeof content === "string" ? rawHtml(content) : content);
    return e2;
  }
  var htmlPolicy = window.trustedTypes?.createPolicy("coach-html", {
    createHTML: (s2) => s2.replaceAll(/<(\/?script)/gi, "&lt;$1").replaceAll(/(javascript|vbscript|data):/gi, "$1&#58;")
  });
  function setHtml(element, content) {
    const raw = content.toString();
    element.innerHTML = htmlPolicy ? htmlPolicy.createHTML(raw) : raw;
  }
  function escapeEntities(s2) {
    return s2.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
  }
  function escapeHtml(s2) {
    return escapeEntities(s2).replaceAll("\n", "<br>");
  }
  var SAFE_HTML = /* @__PURE__ */ Symbol("SAFE_HTML");
  function rawHtml(s2) {
    return { [SAFE_HTML]: true, toString: () => s2 };
  }
  function isSafeHtml(v2) {
    return typeof v2 === "object" && v2 !== null && v2[SAFE_HTML] === true;
  }
  function html(strings, ...values) {
    let out = strings[0];
    for (let i2 = 0; i2 < values.length; i2++) {
      out += renderValue(values[i2]) + strings[i2 + 1];
    }
    return rawHtml(out);
  }
  function renderValue(v2) {
    if (v2 == null || v2 === false) return "";
    if (isSafeHtml(v2)) return v2.toString();
    if (Array.isArray(v2)) return v2.map(renderValue).join("");
    if (typeof v2 === "number" || typeof v2 === "bigint" || typeof v2 === "boolean" || typeof v2 === "string") {
      return escapeEntities(String(v2));
    }
    if (v2 instanceof Date || v2 instanceof RegExp || v2 instanceof Error) {
      return escapeEntities(String(v2));
    }
    if (typeof v2 === "object") {
      return escapeEntities(Object.prototype.toString.call(v2));
    }
    if (typeof v2 === "function" || typeof v2 === "symbol") {
      return escapeEntities(v2.toString());
    }
    return "";
  }
  function formatNum(n3) {
    if (n3 >= 1e6) return (n3 / 1e6).toFixed(1) + "M";
    if (n3 >= 1e3) return (n3 / 1e3).toFixed(1) + "K";
    return String(Math.round(n3));
  }
  function formatDate(ts) {
    if (!ts) return "\u2014";
    return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  function formatTime(ts) {
    if (!ts) return "\u2014";
    return new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }
  var COLORS = {
    blue: "#58a6ff",
    green: "#3fb950",
    purple: "#bc8cff",
    yellow: "#d29922",
    red: "#f85149",
    cyan: "#79c0ff",
    orange: "#da7756",
    pink: "#f778ba",
    muted: "#8b949e"
  };
  var PALETTE = [COLORS.blue, COLORS.green, COLORS.purple, COLORS.yellow, COLORS.red, COLORS.cyan, COLORS.orange, COLORS.pink];
  var HARNESS_COLORS = {
    "Local Agent": "#007ACC",
    "Local Agent (Insiders)": "#24bfa5",
    "Xcode": "#147EFB",
    "GitHub Copilot CLI": "#6e40c9",
    "GitHub Copilot App": "#8957e5",
    "Claude": "#d97706",
    "Codex": "#10b981",
    "OpenCode": "#8b5cf6"
  };
  function harnessColor(name, idx) {
    return HARNESS_COLORS[name] || PALETTE[idx % PALETTE.length];
  }
  var SEVERITY_COLORS = {
    high: COLORS.red,
    medium: COLORS.yellow,
    low: COLORS.green
  };
  function createChart(canvasId, type, data, options) {
    const defaults2 = {
      responsive: true,
      maintainAspectRatio: false
    };
    const c2 = new Chart(document.getElementById(canvasId), {
      type,
      data,
      options: { ...defaults2, ...options }
    });
    trackChart(c2);
    return c2;
  }
  var SCORE_EXCELLENT = 80;
  var SCORE_GOOD = 60;
  var SCORE_FAIR = 40;
  var PROGRESS_ALMOST = 70;
  var PROGRESS_STARTED = 30;
  function scoreColor(score) {
    if (score >= SCORE_EXCELLENT) return COLORS.green;
    if (score >= SCORE_GOOD) return COLORS.yellow;
    if (score >= SCORE_FAIR) return COLORS.orange;
    return COLORS.red;
  }
  function scoreLabel(score, variant = "dashboard") {
    if (variant === "antipatterns") {
      if (score >= SCORE_EXCELLENT) return "Great";
      if (score >= SCORE_GOOD) return "Good";
      if (score >= SCORE_FAIR) return "Fair";
      return "Needs Work";
    }
    if (score >= SCORE_EXCELLENT) return "Excellent";
    if (score >= SCORE_GOOD) return "Good";
    if (score >= SCORE_FAIR) return "Needs Work";
    return "Critical";
  }
  function withErrorBoundary(pageName, container, render2) {
    try {
      const result = render2();
      if (result instanceof Promise) {
        result.catch((err) => {
          showErrorFallback(pageName, container, err);
        });
      }
    } catch (err) {
      showErrorFallback(pageName, container, err);
    }
  }
  function showErrorFallback(pageName, container, err) {
    const message = err instanceof Error ? err.message : String(err);
    setHtml(container, html`
    <div class="error-boundary">
      <h3>⚠️ Failed to render ${pageName}</h3>
      <p class="error-message">${message}</p>
      <p class="error-hint">Try re-running \`crux scan\` to regenerate the report.</p>
    </div>`);
  }

  // src/webview/telemetry-strip.ts
  var RING_RADIUS = 26;
  var RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
  function fmtMem(mb) {
    if (mb >= 1024) return `${(mb / 1024).toFixed(mb >= 10240 ? 0 : 1)} GB`;
    return `${Math.round(mb)} MB`;
  }
  function pressureColor(pct) {
    if (pct >= 85) return "var(--accent-red, #f14c4c)";
    if (pct >= 65) return "var(--accent-amber, #d7a000)";
    return "var(--accent-blue)";
  }
  function ringMarkup(idBase) {
    return `<div class="tg-ringwrap"><svg class="tg-ring" viewBox="0 0 64 64" aria-hidden="true"><circle class="tg-track" cx="32" cy="32" r="${RING_RADIUS}"></circle><circle class="tg-arc" id="${idBase}-arc" cx="32" cy="32" r="${RING_RADIUS}" transform="rotate(-90 32 32)" stroke-dasharray="${RING_CIRCUMFERENCE}" stroke-dashoffset="${RING_CIRCUMFERENCE}"></circle></svg><div class="tg-ringpct" id="${idBase}-pct">0%</div></div>`;
  }
  function setRing(idBase, pct, color2) {
    const clamped = Math.max(0, Math.min(100, pct));
    const arc = document.getElementById(idBase + "-arc");
    if (arc) {
      arc.style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - clamped / 100));
      arc.style.stroke = color2;
    }
    const pctEl = document.getElementById(idBase + "-pct");
    if (pctEl) pctEl.textContent = `${Math.round(clamped)}%`;
  }
  function buildTelemetryStrip(host) {
    host.innerHTML = `<div class="tg-gauge">` + ringMarkup("tg-mem") + `<div class="tg-meta"><div class="tg-label">Heap memory</div><div class="tg-value"><span id="tg-mem-used">\u2014</span></div><div class="tg-sub">of <span id="tg-mem-limit">\u2014</span> cap</div></div></div><div class="tg-gauge">` + ringMarkup("tg-cpu") + `<div class="tg-meta"><div class="tg-label">Worker CPU</div><div class="tg-value" id="tg-cpu-load">idle</div><div class="tg-sub">single parse process</div></div></div><div class="tg-tiles"><div class="tg-tile"><span class="tg-tile-label">Process RSS</span><span class="tg-tile-value" id="tg-rss">\u2014</span></div><div class="tg-tile"><span class="tg-tile-label">Session buffers</span><span class="tg-tile-value" id="tg-buf">\u2014</span></div><div class="tg-tile" id="tg-skipped-tile"><span class="tg-tile-label">Skipped</span><span class="tg-tile-value" id="tg-skipped">0</span></div></div>`;
  }
  function updateTelemetry(t3) {
    const host = document.getElementById("loading-telemetry");
    if (!host) return;
    if (!host.dataset.init) {
      host.dataset.init = "1";
      buildTelemetryStrip(host);
    }
    const memPct = t3.heapLimitMB > 0 ? t3.heapUsedMB / t3.heapLimitMB * 100 : 0;
    setRing("tg-mem", memPct, pressureColor(memPct));
    setRing("tg-cpu", t3.cpuPct, pressureColor(t3.cpuPct));
    const set2 = (id, text) => {
      const el2 = document.getElementById(id);
      if (el2) el2.textContent = text;
    };
    set2("tg-mem-used", fmtMem(t3.heapUsedMB));
    set2("tg-mem-limit", fmtMem(t3.heapLimitMB));
    set2("tg-cpu-load", t3.cpuPct >= 70 ? "busy" : t3.cpuPct >= 25 ? "active" : "idle");
    set2("tg-rss", fmtMem(t3.rssMB));
    set2("tg-buf", fmtMem(t3.fileBufMB));
    const skippedFiles = t3.skippedFiles ?? 0;
    const skippedLines = t3.skippedLines ?? 0;
    set2("tg-skipped", skippedLines > 0 ? `${skippedFiles} file${skippedFiles === 1 ? "" : "s"} \xB7 ${skippedLines} line${skippedLines === 1 ? "" : "s"}` : `${skippedFiles} file${skippedFiles === 1 ? "" : "s"}`);
    const skippedTile = document.getElementById("tg-skipped-tile");
    if (skippedTile) skippedTile.classList.toggle("tg-tile-warn", skippedFiles > 0);
    host.classList.toggle("tg-pressure", memPct >= 85);
  }

  // src/webview/loading-grid-model.ts
  function formatStatCount(n3) {
    if (n3 >= 1e6) return `${(n3 / 1e6).toFixed(1)}M`;
    if (n3 >= 1e3) return `${(n3 / 1e3).toFixed(0)}K`;
    return String(n3);
  }
  function computeGridDimensions(n3, width, height) {
    if (n3 === 0 || width < 20 || height < 20) return null;
    const aspect = width / height;
    const rows = Math.max(1, Math.ceil(Math.sqrt(n3 / aspect)));
    const cols = Math.max(1, Math.ceil(n3 / rows));
    const stride = Math.min(width / cols, height / rows);
    const size = Math.max(2, Math.min(16, Math.floor(stride * 0.6)));
    return { rows, cols, size };
  }
  function percentile(values, p2) {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a2, b2) => a2 - b2);
    const idx = (sorted.length - 1) * p2;
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    if (lo === hi) return sorted[lo];
    const weight = idx - lo;
    return sorted[lo] * (1 - weight) + sorted[hi] * weight;
  }
  function sessionIntensityLevel(size, breakpoints) {
    if (size >= breakpoints.q75 && breakpoints.q75 > 0) return 4;
    if (size >= breakpoints.q50 && breakpoints.q50 > 0) return 3;
    if (size >= breakpoints.q25 && breakpoints.q25 > 0) return 2;
    return 1;
  }
  function sessionTileVars(level) {
    const strengths = {
      1: { pending: 6, border: 14, done: 35, glow: 18 },
      2: { pending: 9, border: 18, done: 48, glow: 24 },
      3: { pending: 12, border: 24, done: 62, glow: 30 },
      4: { pending: 16, border: 30, done: 78, glow: 38 }
    }[level];
    return {
      pendingBg: `color-mix(in srgb, var(--accent-blue) ${strengths.pending}%, var(--vscode-editor-background, #1e1e1e))`,
      pendingBorder: `color-mix(in srgb, var(--accent-blue) ${strengths.border}%, var(--border))`,
      doneBg: `color-mix(in srgb, var(--vscode-progressBar-background, var(--accent-blue)) ${strengths.done}%, var(--vscode-editor-background, #1e1e1e))`,
      doneBorder: `color-mix(in srgb, var(--vscode-progressBar-background, var(--accent-blue)) ${Math.min(90, strengths.done + 8)}%, var(--border))`,
      doneGlow: `color-mix(in srgb, var(--vscode-progressBar-background, var(--accent-blue)) ${strengths.glow}%, transparent)`
    };
  }
  function parseWorkspacePlanKey(key, fallbackOrder) {
    try {
      const parsed = JSON.parse(key);
      const order = typeof parsed.order === "number" ? parsed.order : fallbackOrder;
      const date = typeof parsed.date === "string" ? parsed.date : null;
      return {
        key,
        order,
        date,
        month: date ? date.slice(0, 7) : `chunk-${Math.floor(fallbackOrder / 28)}`,
        workspace: typeof parsed.wsId === "string" && parsed.wsId.length > 0 ? parsed.wsId : `Workspace ${fallbackOrder + 1}`,
        workspaceKey: typeof parsed.workspaceKey === "string" && parsed.workspaceKey.length > 0 ? parsed.workspaceKey : `workspace-${fallbackOrder}`,
        size: typeof parsed.size === "number" ? parsed.size : 0
      };
    } catch {
      return {
        key,
        order: fallbackOrder,
        date: null,
        month: `chunk-${Math.floor(fallbackOrder / 28)}`,
        workspace: `Workspace ${fallbackOrder + 1}`,
        workspaceKey: `workspace-${fallbackOrder}`,
        size: 0
      };
    }
  }

  // node_modules/preact/dist/preact.module.js
  var n;
  var l;
  var u;
  var t;
  var i;
  var r;
  var o;
  var e;
  var f;
  var c;
  var a;
  var s;
  var h;
  var p;
  var v;
  var y;
  var d = {};
  var w = [];
  var _ = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;
  var g = Array.isArray;
  function m(n3, l2) {
    for (var u2 in l2) n3[u2] = l2[u2];
    return n3;
  }
  function b(n3) {
    n3 && n3.parentNode && n3.parentNode.removeChild(n3);
  }
  function k(l2, u2, t3) {
    var i2, r2, o2, e2 = {};
    for (o2 in u2) "key" == o2 ? i2 = u2[o2] : "ref" == o2 ? r2 = u2[o2] : e2[o2] = u2[o2];
    if (arguments.length > 2 && (e2.children = arguments.length > 3 ? n.call(arguments, 2) : t3), "function" == typeof l2 && null != l2.defaultProps) for (o2 in l2.defaultProps) void 0 === e2[o2] && (e2[o2] = l2.defaultProps[o2]);
    return x(l2, e2, i2, r2, null);
  }
  function x(n3, t3, i2, r2, o2) {
    var e2 = { type: n3, props: t3, key: i2, ref: r2, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: null == o2 ? ++u : o2, __i: -1, __u: 0 };
    return null == o2 && null != l.vnode && l.vnode(e2), e2;
  }
  function S(n3) {
    return n3.children;
  }
  function C(n3, l2) {
    this.props = n3, this.context = l2;
  }
  function $2(n3, l2) {
    if (null == l2) return n3.__ ? $2(n3.__, n3.__i + 1) : null;
    for (var u2; l2 < n3.__k.length; l2++) if (null != (u2 = n3.__k[l2]) && null != u2.__e) return u2.__e;
    return "function" == typeof n3.type ? $2(n3) : null;
  }
  function I(n3) {
    if (n3.__P && n3.__d) {
      var u2 = n3.__v, t3 = u2.__e, i2 = [], r2 = [], o2 = m({}, u2);
      o2.__v = u2.__v + 1, l.vnode && l.vnode(o2), q(n3.__P, o2, u2, n3.__n, n3.__P.namespaceURI, 32 & u2.__u ? [t3] : null, i2, null == t3 ? $2(u2) : t3, !!(32 & u2.__u), r2), o2.__v = u2.__v, o2.__.__k[o2.__i] = o2, D(i2, o2, r2), u2.__e = u2.__ = null, o2.__e != t3 && P(o2);
    }
  }
  function P(n3) {
    if (null != (n3 = n3.__) && null != n3.__c) return n3.__e = n3.__c.base = null, n3.__k.some(function(l2) {
      if (null != l2 && null != l2.__e) return n3.__e = n3.__c.base = l2.__e;
    }), P(n3);
  }
  function A(n3) {
    (!n3.__d && (n3.__d = true) && i.push(n3) && !H.__r++ || r != l.debounceRendering) && ((r = l.debounceRendering) || o)(H);
  }
  function H() {
    try {
      for (var n3, l2 = 1; i.length; ) i.length > l2 && i.sort(e), n3 = i.shift(), l2 = i.length, I(n3);
    } finally {
      i.length = H.__r = 0;
    }
  }
  function L(n3, l2, u2, t3, i2, r2, o2, e2, f2, c2, a2) {
    var s2, h3, p2, v2, y2, _2, g2, m2 = t3 && t3.__k || w, b2 = l2.length;
    for (f2 = T(u2, l2, m2, f2, b2), s2 = 0; s2 < b2; s2++) null != (p2 = u2.__k[s2]) && (h3 = -1 != p2.__i && m2[p2.__i] || d, p2.__i = s2, _2 = q(n3, p2, h3, i2, r2, o2, e2, f2, c2, a2), v2 = p2.__e, p2.ref && h3.ref != p2.ref && (h3.ref && J(h3.ref, null, p2), a2.push(p2.ref, p2.__c || v2, p2)), null == y2 && null != v2 && (y2 = v2), (g2 = !!(4 & p2.__u)) || h3.__k === p2.__k ? (f2 = j(p2, f2, n3, g2), g2 && h3.__e && (h3.__e = null)) : "function" == typeof p2.type && void 0 !== _2 ? f2 = _2 : v2 && (f2 = v2.nextSibling), p2.__u &= -7);
    return u2.__e = y2, f2;
  }
  function T(n3, l2, u2, t3, i2) {
    var r2, o2, e2, f2, c2, a2 = u2.length, s2 = a2, h3 = 0;
    for (n3.__k = new Array(i2), r2 = 0; r2 < i2; r2++) null != (o2 = l2[r2]) && "boolean" != typeof o2 && "function" != typeof o2 ? ("string" == typeof o2 || "number" == typeof o2 || "bigint" == typeof o2 || o2.constructor == String ? o2 = n3.__k[r2] = x(null, o2, null, null, null) : g(o2) ? o2 = n3.__k[r2] = x(S, { children: o2 }, null, null, null) : void 0 === o2.constructor && o2.__b > 0 ? o2 = n3.__k[r2] = x(o2.type, o2.props, o2.key, o2.ref ? o2.ref : null, o2.__v) : n3.__k[r2] = o2, f2 = r2 + h3, o2.__ = n3, o2.__b = n3.__b + 1, e2 = null, -1 != (c2 = o2.__i = O(o2, u2, f2, s2)) && (s2--, (e2 = u2[c2]) && (e2.__u |= 2)), null == e2 || null == e2.__v ? (-1 == c2 && (i2 > a2 ? h3-- : i2 < a2 && h3++), "function" != typeof o2.type && (o2.__u |= 4)) : c2 != f2 && (c2 == f2 - 1 ? h3-- : c2 == f2 + 1 ? h3++ : (c2 > f2 ? h3-- : h3++, o2.__u |= 4))) : n3.__k[r2] = null;
    if (s2) for (r2 = 0; r2 < a2; r2++) null != (e2 = u2[r2]) && 0 == (2 & e2.__u) && (e2.__e == t3 && (t3 = $2(e2)), K(e2, e2));
    return t3;
  }
  function j(n3, l2, u2, t3) {
    var i2, r2;
    if ("function" == typeof n3.type) {
      for (i2 = n3.__k, r2 = 0; i2 && r2 < i2.length; r2++) i2[r2] && (i2[r2].__ = n3, l2 = j(i2[r2], l2, u2, t3));
      return l2;
    }
    n3.__e != l2 && (t3 && (l2 && n3.type && !l2.parentNode && (l2 = $2(n3)), u2.insertBefore(n3.__e, l2 || null)), l2 = n3.__e);
    do {
      l2 = l2 && l2.nextSibling;
    } while (null != l2 && 8 == l2.nodeType);
    return l2;
  }
  function O(n3, l2, u2, t3) {
    var i2, r2, o2, e2 = n3.key, f2 = n3.type, c2 = l2[u2], a2 = null != c2 && 0 == (2 & c2.__u);
    if (null === c2 && null == e2 || a2 && e2 == c2.key && f2 == c2.type) return u2;
    if (t3 > (a2 ? 1 : 0)) {
      for (i2 = u2 - 1, r2 = u2 + 1; i2 >= 0 || r2 < l2.length; ) if (null != (c2 = l2[o2 = i2 >= 0 ? i2-- : r2++]) && 0 == (2 & c2.__u) && e2 == c2.key && f2 == c2.type) return o2;
    }
    return -1;
  }
  function z(n3, l2, u2) {
    "-" == l2[0] ? n3.setProperty(l2, null == u2 ? "" : u2) : n3[l2] = null == u2 ? "" : "number" != typeof u2 || _.test(l2) ? u2 : u2 + "px";
  }
  function N(n3, l2, u2, t3, i2) {
    var r2, o2;
    n: if ("style" == l2) if ("string" == typeof u2) n3.style.cssText = u2;
    else {
      if ("string" == typeof t3 && (n3.style.cssText = t3 = ""), t3) for (l2 in t3) u2 && l2 in u2 || z(n3.style, l2, "");
      if (u2) for (l2 in u2) t3 && u2[l2] == t3[l2] || z(n3.style, l2, u2[l2]);
    }
    else if ("o" == l2[0] && "n" == l2[1]) r2 = l2 != (l2 = l2.replace(s, "$1")), o2 = l2.toLowerCase(), l2 = o2 in n3 || "onFocusOut" == l2 || "onFocusIn" == l2 ? o2.slice(2) : l2.slice(2), n3.l || (n3.l = {}), n3.l[l2 + r2] = u2, u2 ? t3 ? u2[a] = t3[a] : (u2[a] = h, n3.addEventListener(l2, r2 ? v : p, r2)) : n3.removeEventListener(l2, r2 ? v : p, r2);
    else {
      if ("http://www.w3.org/2000/svg" == i2) l2 = l2.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
      else if ("width" != l2 && "height" != l2 && "href" != l2 && "list" != l2 && "form" != l2 && "tabIndex" != l2 && "download" != l2 && "rowSpan" != l2 && "colSpan" != l2 && "role" != l2 && "popover" != l2 && l2 in n3) try {
        n3[l2] = null == u2 ? "" : u2;
        break n;
      } catch (n4) {
      }
      "function" == typeof u2 || (null == u2 || false === u2 && "-" != l2[4] ? n3.removeAttribute(l2) : n3.setAttribute(l2, "popover" == l2 && 1 == u2 ? "" : u2));
    }
  }
  function V(n3) {
    return function(u2) {
      if (this.l) {
        var t3 = this.l[u2.type + n3];
        if (null == u2[c]) u2[c] = h++;
        else if (u2[c] < t3[a]) return;
        return t3(l.event ? l.event(u2) : u2);
      }
    };
  }
  function q(n3, u2, t3, i2, r2, o2, e2, f2, c2, a2) {
    var s2, h3, p2, v2, y2, d2, _2, k2, x2, M, $3, I2, P2, A2, H2, T2 = u2.type;
    if (void 0 !== u2.constructor) return null;
    128 & t3.__u && (c2 = !!(32 & t3.__u), o2 = [f2 = u2.__e = t3.__e]), (s2 = l.__b) && s2(u2);
    n: if ("function" == typeof T2) try {
      if (k2 = u2.props, x2 = T2.prototype && T2.prototype.render, M = (s2 = T2.contextType) && i2[s2.__c], $3 = s2 ? M ? M.props.value : s2.__ : i2, t3.__c ? _2 = (h3 = u2.__c = t3.__c).__ = h3.__E : (x2 ? u2.__c = h3 = new T2(k2, $3) : (u2.__c = h3 = new C(k2, $3), h3.constructor = T2, h3.render = Q), M && M.sub(h3), h3.state || (h3.state = {}), h3.__n = i2, p2 = h3.__d = true, h3.__h = [], h3._sb = []), x2 && null == h3.__s && (h3.__s = h3.state), x2 && null != T2.getDerivedStateFromProps && (h3.__s == h3.state && (h3.__s = m({}, h3.__s)), m(h3.__s, T2.getDerivedStateFromProps(k2, h3.__s))), v2 = h3.props, y2 = h3.state, h3.__v = u2, p2) x2 && null == T2.getDerivedStateFromProps && null != h3.componentWillMount && h3.componentWillMount(), x2 && null != h3.componentDidMount && h3.__h.push(h3.componentDidMount);
      else {
        if (x2 && null == T2.getDerivedStateFromProps && k2 !== v2 && null != h3.componentWillReceiveProps && h3.componentWillReceiveProps(k2, $3), u2.__v == t3.__v || !h3.__e && null != h3.shouldComponentUpdate && false === h3.shouldComponentUpdate(k2, h3.__s, $3)) {
          u2.__v != t3.__v && (h3.props = k2, h3.state = h3.__s, h3.__d = false), u2.__e = t3.__e, u2.__k = t3.__k, u2.__k.some(function(n4) {
            n4 && (n4.__ = u2);
          }), w.push.apply(h3.__h, h3._sb), h3._sb = [], h3.__h.length && e2.push(h3);
          break n;
        }
        null != h3.componentWillUpdate && h3.componentWillUpdate(k2, h3.__s, $3), x2 && null != h3.componentDidUpdate && h3.__h.push(function() {
          h3.componentDidUpdate(v2, y2, d2);
        });
      }
      if (h3.context = $3, h3.props = k2, h3.__P = n3, h3.__e = false, I2 = l.__r, P2 = 0, x2) h3.state = h3.__s, h3.__d = false, I2 && I2(u2), s2 = h3.render(h3.props, h3.state, h3.context), w.push.apply(h3.__h, h3._sb), h3._sb = [];
      else do {
        h3.__d = false, I2 && I2(u2), s2 = h3.render(h3.props, h3.state, h3.context), h3.state = h3.__s;
      } while (h3.__d && ++P2 < 25);
      h3.state = h3.__s, null != h3.getChildContext && (i2 = m(m({}, i2), h3.getChildContext())), x2 && !p2 && null != h3.getSnapshotBeforeUpdate && (d2 = h3.getSnapshotBeforeUpdate(v2, y2)), A2 = null != s2 && s2.type === S && null == s2.key ? E(s2.props.children) : s2, f2 = L(n3, g(A2) ? A2 : [A2], u2, t3, i2, r2, o2, e2, f2, c2, a2), h3.base = u2.__e, u2.__u &= -161, h3.__h.length && e2.push(h3), _2 && (h3.__E = h3.__ = null);
    } catch (n4) {
      if (u2.__v = null, c2 || null != o2) if (n4.then) {
        for (u2.__u |= c2 ? 160 : 128; f2 && 8 == f2.nodeType && f2.nextSibling; ) f2 = f2.nextSibling;
        o2[o2.indexOf(f2)] = null, u2.__e = f2;
      } else {
        for (H2 = o2.length; H2--; ) b(o2[H2]);
        B(u2);
      }
      else u2.__e = t3.__e, u2.__k = t3.__k, n4.then || B(u2);
      l.__e(n4, u2, t3);
    }
    else null == o2 && u2.__v == t3.__v ? (u2.__k = t3.__k, u2.__e = t3.__e) : f2 = u2.__e = G(t3.__e, u2, t3, i2, r2, o2, e2, c2, a2);
    return (s2 = l.diffed) && s2(u2), 128 & u2.__u ? void 0 : f2;
  }
  function B(n3) {
    n3 && (n3.__c && (n3.__c.__e = true), n3.__k && n3.__k.some(B));
  }
  function D(n3, u2, t3) {
    for (var i2 = 0; i2 < t3.length; i2++) J(t3[i2], t3[++i2], t3[++i2]);
    l.__c && l.__c(u2, n3), n3.some(function(u3) {
      try {
        n3 = u3.__h, u3.__h = [], n3.some(function(n4) {
          n4.call(u3);
        });
      } catch (n4) {
        l.__e(n4, u3.__v);
      }
    });
  }
  function E(n3) {
    return "object" != typeof n3 || null == n3 || n3.__b > 0 ? n3 : g(n3) ? n3.map(E) : void 0 !== n3.constructor ? null : m({}, n3);
  }
  function G(u2, t3, i2, r2, o2, e2, f2, c2, a2) {
    var s2, h3, p2, v2, y2, w2, _2, m2 = i2.props || d, k2 = t3.props, x2 = t3.type;
    if ("svg" == x2 ? o2 = "http://www.w3.org/2000/svg" : "math" == x2 ? o2 = "http://www.w3.org/1998/Math/MathML" : o2 || (o2 = "http://www.w3.org/1999/xhtml"), null != e2) {
      for (s2 = 0; s2 < e2.length; s2++) if ((y2 = e2[s2]) && "setAttribute" in y2 == !!x2 && (x2 ? y2.localName == x2 : 3 == y2.nodeType)) {
        u2 = y2, e2[s2] = null;
        break;
      }
    }
    if (null == u2) {
      if (null == x2) return document.createTextNode(k2);
      u2 = document.createElementNS(o2, x2, k2.is && k2), c2 && (l.__m && l.__m(t3, e2), c2 = false), e2 = null;
    }
    if (null == x2) m2 === k2 || c2 && u2.data == k2 || (u2.data = k2);
    else {
      if (e2 = "textarea" == x2 && null != k2.defaultValue ? null : e2 && n.call(u2.childNodes), !c2 && null != e2) for (m2 = {}, s2 = 0; s2 < u2.attributes.length; s2++) m2[(y2 = u2.attributes[s2]).name] = y2.value;
      for (s2 in m2) y2 = m2[s2], "dangerouslySetInnerHTML" == s2 ? p2 = y2 : "children" == s2 || s2 in k2 || "value" == s2 && "defaultValue" in k2 || "checked" == s2 && "defaultChecked" in k2 || N(u2, s2, null, y2, o2);
      for (s2 in k2) y2 = k2[s2], "children" == s2 ? v2 = y2 : "dangerouslySetInnerHTML" == s2 ? h3 = y2 : "value" == s2 ? w2 = y2 : "checked" == s2 ? _2 = y2 : c2 && "function" != typeof y2 || m2[s2] === y2 || N(u2, s2, y2, m2[s2], o2);
      if (h3) c2 || p2 && (h3.__html == p2.__html || h3.__html == u2.innerHTML) || (u2.innerHTML = h3.__html), t3.__k = [];
      else if (p2 && (u2.innerHTML = ""), L("template" == t3.type ? u2.content : u2, g(v2) ? v2 : [v2], t3, i2, r2, "foreignObject" == x2 ? "http://www.w3.org/1999/xhtml" : o2, e2, f2, e2 ? e2[0] : i2.__k && $2(i2, 0), c2, a2), null != e2) for (s2 = e2.length; s2--; ) b(e2[s2]);
      c2 && "textarea" != x2 || (s2 = "value", "progress" == x2 && null == w2 ? u2.removeAttribute("value") : null != w2 && (w2 !== u2[s2] || "progress" == x2 && !w2 || "option" == x2 && w2 != m2[s2]) && N(u2, s2, w2, m2[s2], o2), s2 = "checked", null != _2 && _2 != u2[s2] && N(u2, s2, _2, m2[s2], o2));
    }
    return u2;
  }
  function J(n3, u2, t3) {
    try {
      if ("function" == typeof n3) {
        var i2 = "function" == typeof n3.__u;
        i2 && n3.__u(), i2 && null == u2 || (n3.__u = n3(u2));
      } else n3.current = u2;
    } catch (n4) {
      l.__e(n4, t3);
    }
  }
  function K(n3, u2, t3) {
    var i2, r2;
    if (l.unmount && l.unmount(n3), (i2 = n3.ref) && (i2.current && i2.current != n3.__e || J(i2, null, u2)), null != (i2 = n3.__c)) {
      if (i2.componentWillUnmount) try {
        i2.componentWillUnmount();
      } catch (n4) {
        l.__e(n4, u2);
      }
      i2.base = i2.__P = null;
    }
    if (i2 = n3.__k) for (r2 = 0; r2 < i2.length; r2++) i2[r2] && K(i2[r2], u2, t3 || "function" != typeof n3.type);
    t3 || b(n3.__e), n3.__c = n3.__ = n3.__e = void 0;
  }
  function Q(n3, l2, u2) {
    return this.constructor(n3, u2);
  }
  function R(u2, t3, i2) {
    var r2, o2, e2, f2;
    t3 == document && (t3 = document.documentElement), l.__ && l.__(u2, t3), o2 = (r2 = "function" == typeof i2) ? null : i2 && i2.__k || t3.__k, e2 = [], f2 = [], q(t3, u2 = (!r2 && i2 || t3).__k = k(S, null, [u2]), o2 || d, d, t3.namespaceURI, !r2 && i2 ? [i2] : o2 ? null : t3.firstChild ? n.call(t3.childNodes) : null, e2, !r2 && i2 ? i2 : o2 ? o2.__e : t3.firstChild, r2, f2), D(e2, u2, f2);
  }
  n = w.slice, l = { __e: function(n3, l2, u2, t3) {
    for (var i2, r2, o2; l2 = l2.__; ) if ((i2 = l2.__c) && !i2.__) try {
      if ((r2 = i2.constructor) && null != r2.getDerivedStateFromError && (i2.setState(r2.getDerivedStateFromError(n3)), o2 = i2.__d), null != i2.componentDidCatch && (i2.componentDidCatch(n3, t3 || {}), o2 = i2.__d), o2) return i2.__E = i2;
    } catch (l3) {
      n3 = l3;
    }
    throw n3;
  } }, u = 0, t = function(n3) {
    return null != n3 && void 0 === n3.constructor;
  }, C.prototype.setState = function(n3, l2) {
    var u2;
    u2 = null != this.__s && this.__s != this.state ? this.__s : this.__s = m({}, this.state), "function" == typeof n3 && (n3 = n3(m({}, u2), this.props)), n3 && m(u2, n3), null != n3 && this.__v && (l2 && this._sb.push(l2), A(this));
  }, C.prototype.forceUpdate = function(n3) {
    this.__v && (this.__e = true, n3 && this.__h.push(n3), A(this));
  }, C.prototype.render = S, i = [], o = "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, e = function(n3, l2) {
    return n3.__v.__b - l2.__v.__b;
  }, H.__r = 0, f = Math.random().toString(8), c = "__d" + f, a = "__a" + f, s = /(PointerCapture)$|Capture$/i, h = 0, p = V(false), v = V(true), y = 0;

  // node_modules/htm/dist/htm.module.js
  var n2 = function(t3, s2, r2, e2) {
    var u2;
    s2[0] = 0;
    for (var h3 = 1; h3 < s2.length; h3++) {
      var p2 = s2[h3++], a2 = s2[h3] ? (s2[0] |= p2 ? 1 : 2, r2[s2[h3++]]) : s2[++h3];
      3 === p2 ? e2[0] = a2 : 4 === p2 ? e2[1] = Object.assign(e2[1] || {}, a2) : 5 === p2 ? (e2[1] = e2[1] || {})[s2[++h3]] = a2 : 6 === p2 ? e2[1][s2[++h3]] += a2 + "" : p2 ? (u2 = t3.apply(a2, n2(t3, a2, r2, ["", null])), e2.push(u2), a2[0] ? s2[0] |= 2 : (s2[h3 - 2] = 0, s2[h3] = u2)) : e2.push(a2);
    }
    return e2;
  };
  var t2 = /* @__PURE__ */ new Map();
  function htm_module_default(s2) {
    var r2 = t2.get(this);
    return r2 || (r2 = /* @__PURE__ */ new Map(), t2.set(this, r2)), (r2 = n2(this, r2.get(s2) || (r2.set(s2, r2 = (function(n3) {
      for (var t3, s3, r3 = 1, e2 = "", u2 = "", h3 = [0], p2 = function(n4) {
        1 === r3 && (n4 || (e2 = e2.replace(/^\s*\n\s*|\s*\n\s*$/g, ""))) ? h3.push(0, n4, e2) : 3 === r3 && (n4 || e2) ? (h3.push(3, n4, e2), r3 = 2) : 2 === r3 && "..." === e2 && n4 ? h3.push(4, n4, 0) : 2 === r3 && e2 && !n4 ? h3.push(5, 0, true, e2) : r3 >= 5 && ((e2 || !n4 && 5 === r3) && (h3.push(r3, 0, e2, s3), r3 = 6), n4 && (h3.push(r3, n4, 0, s3), r3 = 6)), e2 = "";
      }, a2 = 0; a2 < n3.length; a2++) {
        a2 && (1 === r3 && p2(), p2(a2));
        for (var l2 = 0; l2 < n3[a2].length; l2++) t3 = n3[a2][l2], 1 === r3 ? "<" === t3 ? (p2(), h3 = [h3], r3 = 3) : e2 += t3 : 4 === r3 ? "--" === e2 && ">" === t3 ? (r3 = 1, e2 = "") : e2 = t3 + e2[0] : u2 ? t3 === u2 ? u2 = "" : e2 += t3 : '"' === t3 || "'" === t3 ? u2 = t3 : ">" === t3 ? (p2(), r3 = 1) : r3 && ("=" === t3 ? (r3 = 5, s3 = e2, e2 = "") : "/" === t3 && (r3 < 5 || ">" === n3[a2][l2 + 1]) ? (p2(), 3 === r3 && (h3 = h3[0]), r3 = h3, (h3 = h3[0]).push(2, 0, r3), r3 = 0) : " " === t3 || "	" === t3 || "\n" === t3 || "\r" === t3 ? (p2(), r3 = 2) : e2 += t3), 3 === r3 && "!--" === e2 && (r3 = 4, h3 = h3[0]);
      }
      return p2(), h3;
    })(s2)), r2), arguments, [])).length > 1 ? r2 : r2[0];
  }

  // src/webview/render.ts
  var UNSAFE_HTML = /<script|<\/script|javascript:|[\s/]on\w+\s*=/i;
  if (typeof window !== "undefined" && window.trustedTypes) {
    window.trustedTypes.createPolicy("default", {
      createHTML: (s2) => {
        if (UNSAFE_HTML.test(s2)) {
          throw new TypeError("Blocked potentially unsafe HTML in default Trusted Types policy");
        }
        return s2;
      }
    });
  }
  var html2 = htm_module_default.bind(k);
  function render(vnode, container) {
    R(vnode, container);
  }
  function unmount(container) {
    R(null, container);
  }
  function StatCard({ label, value, accent }) {
    return html2`
    <div class="stat-card">
      <div class="stat-card-accent" style=${"background:" + accent}></div>
      <div class="stat-value">${value}</div>
      <div class="stat-label">${label}</div>
    </div>`;
  }
  function CanvasEl({ id, height, title }) {
    return html2`
    <div class="chart-wrap">
      ${title && html2`<div class="chart-title">${title}</div>`}
      <canvas id=${id} height=${height || 300}></canvas>
    </div>`;
  }
  function LoadingScreen({ message }) {
    return html2`<div class="loading-screen"><div class="loading-spinner"></div><div class="loading-text">${message}</div></div>`;
  }
  function ScoreRing({ score, color: color2, size }) {
    const r2 = (size - 6) / 2;
    const c2 = Math.PI * 2 * r2;
    const offset = c2 - score / 100 * c2;
    const fontSize = size > 80 ? 22 : size > 60 ? 20 : 14;
    return html2`
    <svg class="score-ring" width=${size} height=${size} viewBox=${"0 0 " + size + " " + size}>
      <circle cx=${size / 2} cy=${size / 2} r=${r2} fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="5"/>
      <circle cx=${size / 2} cy=${size / 2} r=${r2} fill="none" stroke=${color2} stroke-width="5"
        stroke-dasharray=${c2} stroke-dashoffset=${offset} stroke-linecap="round"
        transform=${"rotate(-90 " + size / 2 + " " + size / 2 + ")"}/>
      <text x=${size / 2} y=${size / 2} text-anchor="middle" dominant-baseline="central"
        fill=${color2} font-size=${fontSize} font-weight="700">${score}</text>
    </svg>`;
  }
  function PctBadge({ pct, label }) {
    if (pct === 0) return html2`<span class="trend-badge trend-stable">${label} 0%</span>`;
    const cls = pct > 0 ? "trend-improving" : "trend-worsening";
    const sign2 = pct > 0 ? "+" : "";
    return html2`<span class="trend-badge ${cls}">${sign2}${pct}% ${label}</span>`;
  }

  // src/webview/loading-grid-view.ts
  var workspacePlan = [];
  var workspaceDone = /* @__PURE__ */ new Set();
  var workspaceRendered = false;
  var workspaceSlotIndex = /* @__PURE__ */ new Map();
  var loadingGridResizeBound = false;
  var workspaceGroupSlots = /* @__PURE__ */ new Map();
  function layoutWorkspaceGrid() {
    const container = document.getElementById("loading-tile-bg");
    const grid = document.getElementById("loading-bg-grid");
    if (!container || !grid) return;
    const dims = computeGridDimensions(workspacePlan.length, container.clientWidth, container.clientHeight);
    if (!dims) return;
    grid.style.setProperty("--bg-rows", String(dims.rows));
    grid.style.setProperty("--bg-cols", String(dims.cols));
    grid.style.setProperty("--bg-cell", `${dims.size}px`);
  }
  function renderWorkspaceGrid(plan) {
    workspacePlan = plan;
    workspaceDone = /* @__PURE__ */ new Set();
    workspaceRendered = true;
    workspaceSlotIndex = /* @__PURE__ */ new Map();
    workspaceGroupSlots = /* @__PURE__ */ new Map();
    const container = document.getElementById("loading-tile-bg");
    if (!container) return;
    if (plan.length === 0) {
      container.style.display = "none";
      return;
    }
    const items = plan.map((key, index3) => parseWorkspacePlanKey(key, index3)).sort((a2, b2) => a2.order - b2.order);
    const sizes = items.map((item) => item.size).filter((size) => size > 0);
    const intensityBreakpoints = {
      q25: percentile(sizes, 0.25),
      q50: percentile(sizes, 0.5),
      q75: percentile(sizes, 0.75)
    };
    for (const item of items) {
      workspaceSlotIndex.set(item.key, item.order);
      const existingSlots = workspaceGroupSlots.get(item.workspaceKey) ?? [];
      existingSlots.push(item.order);
      workspaceGroupSlots.set(item.workspaceKey, existingSlots);
    }
    const gridCells = items.map((item) => {
      const level = sessionIntensityLevel(item.size, intensityBreakpoints);
      const vars = sessionTileVars(level);
      const titleParts = [item.date ? item.date : "", item.workspace, item.size > 0 ? `${Math.round(item.size / 1024)} KB session` : "session"];
      return html2`<div class="cal-cell cal-workspace-cell cal-workspace-pending" data-slot=${item.order} title=${titleParts.filter(Boolean).join(" \u2014 ")} style=${`--pending-bg:${vars.pendingBg};--pending-border:${vars.pendingBorder};--done-bg:${vars.doneBg};--done-border:${vars.doneBorder};--done-glow:${vars.doneGlow};`}></div>`;
    });
    render(html2`<div class="loading-bg-grid" id="loading-bg-grid">${gridCells}</div>`, container);
    container.style.display = "";
    requestAnimationFrame(() => layoutWorkspaceGrid());
    if (!loadingGridResizeBound) {
      window.addEventListener("resize", layoutWorkspaceGrid);
      loadingGridResizeBound = true;
    }
  }
  function updateWorkspaceCell(workspaceKey, detail) {
    if (!workspaceRendered || workspaceDone.has(workspaceKey)) return;
    const slots = workspaceGroupSlots.get(workspaceKey);
    if (!slots || slots.length === 0) return;
    workspaceDone.add(workspaceKey);
    for (const slotIdx of slots) {
      const cell = document.querySelector(`[data-slot="${slotIdx}"]`);
      if (!cell) continue;
      cell.className = "cal-cell cal-workspace-cell cal-workspace-done cal-pop";
      if (detail) cell.title = detail;
    }
  }

  // src/webview/skipped-banner.ts
  function formatSkippedSummary(skippedFiles, skippedLines) {
    const fileLabel = `${skippedFiles} file${skippedFiles === 1 ? "" : "s"}`;
    const lineLabel = skippedLines > 0 ? `, ${skippedLines} line${skippedLines === 1 ? "" : "s"}` : "";
    return `Some history was skipped while parsing (${fileLabel}${lineLabel}). Results may be incomplete.`;
  }
  function buildSkippedBanner(skippedFiles, skippedLines, handlers) {
    const banner = document.createElement("div");
    banner.id = "skipped-banner";
    banner.className = "skipped-banner";
    banner.setAttribute("role", "status");
    const icon2 = document.createElement("span");
    icon2.className = "skipped-banner-icon";
    icon2.setAttribute("aria-hidden", "true");
    icon2.textContent = "\u26A0";
    const text = document.createElement("span");
    text.className = "skipped-banner-text";
    text.textContent = formatSkippedSummary(skippedFiles, skippedLines);
    const details = document.createElement("button");
    details.className = "skipped-banner-link";
    details.type = "button";
    details.textContent = "View details";
    details.addEventListener("click", () => handlers.onViewDetails());
    const dismiss = document.createElement("button");
    dismiss.className = "skipped-banner-dismiss";
    dismiss.setAttribute("aria-label", "Dismiss");
    dismiss.textContent = "\xD7";
    dismiss.addEventListener("click", () => banner.remove());
    banner.append(icon2, text, details, dismiss);
    return banner;
  }

  // src/webview/capabilities.ts
  var caps = { host: "vscode", llm: true };
  async function loadCapabilities() {
    try {
      const result = await rpc("getCapabilities");
      if (result && typeof result === "object") {
        caps = { host: result.host === "canvas" ? "canvas" : "vscode", llm: result.llm !== false };
      }
    } catch {
    }
  }
  function llmAvailable() {
    return caps.llm;
  }
  var LLM_UNAVAILABLE_NOTE = "Open in VS Code with the local Copilot agent to use this.";

  // src/core/types/analytics-types.ts
  var WORK_TYPES = ["feature", "bug fix", "refactor", "code review", "docs", "test", "style", "config", "other"];
  var WORK_TYPE_COLORS = {
    "feature": "#58a6ff",
    "bug fix": "#f85149",
    "refactor": "#d29922",
    "code review": "#da7756",
    "docs": "#3fb950",
    "test": "#bc8cff",
    "style": "#f778ba",
    "config": "#79c0ff",
    "other": "#8b949e"
  };
  var PRACTICE_GROUPS = {
    "prompt-quality": "Prompt Quality",
    "session-hygiene": "Session Hygiene",
    "code-review": "Code Review",
    "tool-mastery": "Tool Mastery",
    "context-management": "Context Management"
  };

  // src/webview/skill-cache.ts
  var cache = /* @__PURE__ */ new Map();
  var MAX_AGE = 10 * 6e4;
  function cacheKey(f2) {
    return `${f2?.workspaceId || "*"}|${f2?.harness || "*"}`;
  }
  function setSkillCache(data, filter) {
    cache.set(cacheKey(filter), data);
  }
  function getSkillCache(filter) {
    const key = cacheKey(filter);
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > MAX_AGE) {
      cache.delete(key);
      return null;
    }
    return entry;
  }

  // src/webview/page-dashboard.ts
  var activeMetric = "requests";
  var DASHBOARD_LANGUAGE_ALIASES = {
    py: "python",
    python3: "python",
    pyw: "python",
    pyi: "python",
    pyx: "python"
  };
  var DASHBOARD_LANGUAGE_LABELS = {
    python: "Python",
    typescript: "TypeScript",
    javascript: "JavaScript",
    shell: "Shell",
    csharp: "C#",
    cpp: "C++",
    plaintext: "Plain Text"
  };
  function SkillCard({ title, subtitle }) {
    return html2`<div style="display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:6px;background:var(--bg-secondary, #0d1117);">
    <span style=${"flex-shrink:0;width:6px;height:6px;border-radius:50%;background:" + COLORS.blue + ";"}></span>
    <div style="min-width:0;">
      <div style="font-size:12px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${title}</div>
      <div style="font-size:11px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${subtitle}</div>
    </div>
  </div>`;
  }
  function funScoreLabel(score) {
    if (score >= 90) return "Merge Wizard";
    if (score >= 75) return "Ship Goblin Deluxe";
    if (score >= 60) return "Vibe Refactor Gremlin";
    if (score >= 40) return "Rubber Duck Ringleader";
    return "Stack Trace Survivor";
  }
  function normalizeDashboardLanguage(label) {
    const normalized = label.trim().toLowerCase();
    return DASHBOARD_LANGUAGE_ALIASES[normalized] || normalized;
  }
  function prettyDashboardLanguage(label) {
    const mapped = DASHBOARD_LANGUAGE_LABELS[label] || (label.length > 0 ? label.charAt(0).toUpperCase() + label.slice(1) : "Unknown");
    if (mapped.length < 4) return mapped.toUpperCase();
    return mapped;
  }
  function PracticeCard({ g: g2 }) {
    const color2 = scoreColor(g2.score);
    const name = PRACTICE_GROUPS[g2.group];
    return html2`
    <a href="#" data-page="anti-patterns" data-nav-hint=${g2.group} class="ap-score-card" style="text-decoration:none;color:inherit;cursor:pointer;">
      <div class="ap-score-card-top">
        <${ScoreRing} score=${g2.score} color=${color2} size=${56} />
        <div>
          <div class="ap-score-card-name">${name}</div>
          <div class="ap-score-card-label" style=${"color:" + color2}>${scoreLabel(g2.score)}</div>
          <div class="ap-score-deltas"><${PctBadge} pct=${g2.wowPct} label="WoW" /><${PctBadge} pct=${g2.momPct} label="MoM" /></div>
        </div>
      </div>
      ${g2.improvements.length > 0 ? html2`<div class="ap-score-tip ap-improvements">${g2.improvements.slice(0, 2).map((i2) => html2`<span>${i2}</span>`)}</div>` : g2.topIssue ? html2`<div class="ap-score-tip">${g2.topIssue}</div>` : html2`<div class="ap-score-tip muted">${g2.patternCount > 0 ? g2.patternCount + " finding" + (g2.patternCount !== 1 ? "s" : "") : "No issues detected"}</div>`}
    </a>`;
  }
  function renderDashboardMarkup(container, stats, daily, harnessBreakdown, scores, langs, totalReqs, totalSessions, totalLoc, skillCache) {
    const harnesses = harnessBreakdown.labels || [];
    const overallScore = scores.length > 0 ? Math.round(scores.reduce((s2, g2) => s2 + g2.score, 0) / scores.length) : 0;
    const overallColor = scoreColor(overallScore);
    render(html2`
    <div class="dash-hero">
      <div class="dash-hero-left">
        <div class="dash-identity">
          <div class="dash-score-ring"><${ScoreRing} score=${overallScore} color=${overallColor} size=${64} /></div>
          <div class="dash-identity-info">
            <div class="dash-identity-label">${funScoreLabel(overallScore)}</div>
            <div class="dash-identity-sub">${scores.length > 0 ? "Dashboard vibes sampled across " + scores.length + " dimensions" : "Calibrating the dashboard vibes..."}</div>
          </div>
        </div>
        ${langs.length > 0 && html2`
        <div class="dash-tech-stack">
          ${langs.map((l2) => html2`<span class="dash-lang-pill" title=${l2.display + ": " + formatNum(l2.loc) + " AI LoC"}>${l2.display}</span>`)}
        </div>`}
      </div>
      <div class="dash-hero-right">
        <div class="dash-hero-stats">
          <div class="dash-stat"><div class="dash-stat-val">${formatNum(totalReqs)}</div><div class="dash-stat-lbl">Requests</div></div>
          <div class="dash-stat"><div class="dash-stat-val">${formatNum(totalSessions)}</div><div class="dash-stat-lbl">Sessions</div></div>
          <div class="dash-stat"><div class="dash-stat-val">${formatNum(totalLoc)}</div><div class="dash-stat-lbl">AI LoC</div></div>
          <div class="dash-stat"><div class="dash-stat-val">${stats.totalWorkspaces}</div><div class="dash-stat-lbl">Workspaces</div></div>
        </div>
        ${harnesses.length > 0 && html2`<div class="dash-harnesses dash-harnesses-right">${harnesses.map((h3, i2) => html2`<span class="dash-harness-tag" style=${"border-color:" + harnessColor(h3, i2) + ";color:" + harnessColor(h3, i2)}>${h3}</span>`)}</div>`}
      </div>
    </div>
    ${!FF_TOKEN_REPORTING_ENABLED && html2`<div class="dash-info-banner"><span class="dash-info-icon">\u2139</span><div><strong>Token Usage & Burndown temporarily hidden</strong><p>These features are disabled until we can verify that reported numbers align with GitHub's billing data. They will be re-enabled once validated.</p></div></div>`}
    ${scores.length > 0 && html2`<section class="dash-section"><div class="dash-section-header"><h3>Anti-Patterns Summary</h3><a href="#" data-page="anti-patterns" style=${"font-size:12px;color:" + COLORS.blue + ";text-decoration:none;"}>View All Anti-Patterns \u2192</a></div><div class="ap-score-grid">${scores.map((g2) => html2`<${PracticeCard} g=${g2} />`)}</div></section>`}
    ${llmAvailable() && html2`<section class="dash-section"><div class="dash-section-header"><h3>Skill Finder</h3><a href="#" data-page="skills" style=${"font-size:12px;color:" + COLORS.blue + ";text-decoration:none;"}>Open Full View \u2192</a></div><p class="dash-section-desc">Scans your prompt history for repeated patterns that waste time re-explaining the same tasks.</p><div id="dashSkillContent" class="dash-card">${!skillCache && html2`<div style="text-align:center;"><p style="color:var(--text-muted);margin:0 0 12px 0;font-size:13px;">Analyze your prompt history to discover skill opportunities.</p><button id="dashScanBtn" class="dash-scan-btn">Scan for Skills</button></div>`}</div></section>`}
    <section class="dash-section"><div style="display:flex;align-items:baseline;gap:16px;margin-bottom:8px;flex-wrap:wrap;"><h3 style="margin:0;">Daily Activity</h3><div id="activityTabs" class="dash-tabs"><button class=${"dash-tab" + (activeMetric === "requests" ? " dash-tab-active" : "")} data-metric="requests">Requests <strong>${formatNum(totalReqs)}</strong></button><button class=${"dash-tab" + (activeMetric === "sessions" ? " dash-tab-active" : "")} data-metric="sessions">Sessions <strong>${formatNum(totalSessions)}</strong></button><button class=${"dash-tab" + (activeMetric === "loc" ? " dash-tab-active" : "")} data-metric="loc">LoC <strong>${formatNum(totalLoc)}</strong></button><button class=${"dash-tab" + (activeMetric === "workspaces" ? " dash-tab-active" : "")} data-metric="workspaces">Workspaces <strong>${formatNum(stats.totalWorkspaces)}</strong></button></div></div><${CanvasEl} id="dailyChart" height=${160} /></section>
    <div class="two-col" style="margin-bottom:16px;"><${CanvasEl} id="wsChart" height=${140} title="Top Workspaces by Requests" /><${CanvasEl} id="harnessChart" height=${140} title="Requests by Harness" /></div>
    <div class="chart-modal-overlay" id="wsChartModal"><div class="chart-modal"><div class="chart-modal-header"><span class="chart-title" style="margin:0;">Top Workspaces by Requests</span><button class="chart-modal-close" id="wsChartModalClose" title="Close">\u00d7</button></div><div class="chart-modal-body"><div style="position:relative;height:360px;"><canvas id="wsChartFull"></canvas></div></div></div></div>
  `, container);
  }
  function renderWorkspaceCharts(wsBreakdown, harnessBreakdown) {
    const wsColors = wsBreakdown.labels.map((_2, i2) => PALETTE[i2 % PALETTE.length]);
    createChart("wsChart", "doughnut", {
      labels: wsBreakdown.labels,
      datasets: [{ data: wsBreakdown.values, backgroundColor: wsColors }]
    }, { plugins: { legend: { position: "right" } } });
    const wsChartWrap = document.getElementById("wsChart")?.closest(".chart-wrap");
    const wsModal = document.getElementById("wsChartModal");
    if (wsChartWrap && wsModal) {
      wsChartWrap.style.cursor = "pointer";
      wsChartWrap.addEventListener("click", () => {
        wsModal.classList.add("chart-modal-open");
        destroyChartById("wsChartFull");
        createChart("wsChartFull", "doughnut", {
          labels: wsBreakdown.labels,
          datasets: [{ data: wsBreakdown.values, backgroundColor: wsColors }]
        }, { plugins: { legend: { position: "bottom", labels: { font: { size: 12 }, padding: 8, boxWidth: 14 } } } });
      });
      document.getElementById("wsChartModalClose")?.addEventListener("click", () => {
        wsModal.classList.remove("chart-modal-open");
        destroyChartById("wsChartFull");
      });
      wsModal.addEventListener("click", (e2) => {
        if (e2.target === wsModal) {
          wsModal.classList.remove("chart-modal-open");
          destroyChartById("wsChartFull");
        }
      });
    }
    createChart("harnessChart", "doughnut", {
      labels: harnessBreakdown.labels,
      datasets: [{
        data: harnessBreakdown.requests,
        backgroundColor: harnessBreakdown.labels.map((l2, i2) => harnessColor(l2, i2))
      }]
    }, { plugins: { legend: { position: "right" } } });
  }
  function renderDashboardSkillFinder(skillCache, currentFilter2) {
    if (skillCache) {
      renderSkillResults(skillCache.triaged, skillCache.clusters, skillCache.catalogMatches);
      return;
    }
    document.getElementById("dashScanBtn")?.addEventListener("click", () => {
      void loadDashSkills(currentFilter2);
    });
  }
  async function renderDashboard(container, currentFilter2) {
    const emptyDaily = { labels: [], values: [], sessions: [], loc: [], workspaces: [], byHarness: [] };
    const emptyCodeProd = { summary: { totalAiLoc: 0, totalUserLoc: 0, totalLoc: 0, aiBlocks: 0, userBlocks: 0, aiRatio: 0, locCost2010: 0, costPerLoc: 0 }, byLanguage: { labels: [], aiLoc: [], userLoc: [] }, dailyTimeline: { labels: [], aiLoc: [], userLoc: [] }, byWorkspace: { labels: [], aiLoc: [], userLoc: [] }, dailyByWorkspace: {}, dailyByModel: {}, dailyByHarness: {} };
    const [stats, daily, wsBreakdown, harnessBreakdown, antiPatterns, codeProd] = await rpcAllSettled([
      rpc("getStats", currentFilter2),
      rpc("getDailyActivity", currentFilter2),
      rpc("getWorkspaceBreakdown", currentFilter2),
      rpc("getHarnessBreakdown", currentFilter2),
      rpc("getAntiPatterns", currentFilter2),
      rpc("getCodeProduction", currentFilter2)
    ], [
      { totalSessions: 0, totalWorkspaces: 0, totalRequests: 0 },
      emptyDaily,
      { labels: [], values: [] },
      { labels: [], requests: [] },
      { patterns: [], totalOccurrences: 0, groupScores: [], weeklyScores: { labels: [], series: [] } },
      emptyCodeProd
    ]);
    const totalLoc = daily.loc.reduce((a2, b2) => a2 + b2, 0);
    const totalReqs = daily.values.reduce((a2, b2) => a2 + b2, 0);
    const totalSessions = daily.sessions.reduce((a2, b2) => a2 + b2, 0);
    const scores = antiPatterns.groupScores || [];
    const mergedLangs = /* @__PURE__ */ new Map();
    for (let i2 = 0; i2 < codeProd.byLanguage.labels.length; i2++) {
      const raw = codeProd.byLanguage.labels[i2] || "";
      const label = normalizeDashboardLanguage(raw);
      const loc = codeProd.byLanguage.aiLoc[i2] ?? 0;
      if (!label || loc <= 0) continue;
      mergedLangs.set(label, (mergedLangs.get(label) || 0) + loc);
    }
    const langs = Array.from(mergedLangs.entries()).map(([label, loc]) => ({ label, display: prettyDashboardLanguage(label), loc })).filter((l2) => !["unknown", "other", "text", "plaintext", "markdown"].includes(l2.label)).sort((a2, b2) => b2.loc - a2.loc).slice(0, 8);
    const skillCache = getSkillCache(currentFilter2);
    renderDashboardMarkup(
      container,
      stats,
      daily,
      harnessBreakdown,
      scores,
      langs,
      totalReqs,
      totalSessions,
      totalLoc,
      skillCache
    );
    function renderActivityChart() {
      destroyChartById("dailyChart");
      const isWorkspaces = activeMetric === "workspaces";
      let chartDatasets;
      let metricLabel;
      let stacked;
      if (isWorkspaces) {
        chartDatasets = [{
          label: "Active Workspaces",
          data: daily.workspaces,
          backgroundColor: COLORS.blue + "B3",
          borderColor: COLORS.blue,
          borderWidth: 1
        }];
        metricLabel = "Workspaces";
        stacked = false;
      } else {
        const metricKey = activeMetric;
        metricLabel = { requests: "Requests", sessions: "Sessions", loc: "Lines of Code" }[metricKey];
        chartDatasets = daily.byHarness.map((h3, i2) => {
          const color2 = harnessColor(h3.harness, i2);
          return {
            label: h3.harness,
            data: h3[metricKey],
            backgroundColor: color2 + "B3",
            borderColor: color2,
            borderWidth: 1
          };
        });
        stacked = true;
      }
      const showLegend = chartDatasets.length > 1;
      createChart("dailyChart", "bar", {
        labels: daily.labels,
        datasets: chartDatasets
      }, {
        plugins: {
          legend: { display: showLegend, position: "top", labels: { boxWidth: 10, font: { size: 10 }, padding: 6 } },
          tooltip: { mode: "index" }
        },
        layout: { padding: { top: showLegend ? 0 : 20 } },
        scales: {
          x: { display: true, stacked, ticks: { maxTicksLimit: 15 } },
          y: { beginAtZero: true, stacked, title: { display: true, text: metricLabel, font: { size: 10 } } }
        }
      });
    }
    renderActivityChart();
    document.getElementById("activityTabs")?.addEventListener("click", (e2) => {
      const btn = e2.target.closest("[data-metric]");
      const metric = btn?.dataset.metric;
      if (!btn || !metric || metric === activeMetric) return;
      activeMetric = metric;
      for (const t3 of document.querySelectorAll(".dash-tab")) t3.classList.remove("dash-tab-active");
      btn.classList.add("dash-tab-active");
      renderActivityChart();
    });
    renderWorkspaceCharts(wsBreakdown, harnessBreakdown);
    if (llmAvailable()) renderDashboardSkillFinder(skillCache, currentFilter2);
  }
  function renderSkillResults(triaged, clusters, catalogMatches) {
    const contentEl = document.getElementById("dashSkillContent");
    if (!contentEl) return;
    const strong = triaged.filter((t3) => t3.verdict === "strong").slice(0, 2);
    const catTop = catalogMatches.slice(0, 2);
    const hasCustom = strong.length > 0;
    const hasCatalog = catTop.length > 0;
    if (!hasCustom && !hasCatalog) {
      render(html2`<p style="color:var(--text-muted);margin:0;font-size:13px;">No skill opportunities found. Your prompts may already be well-served or too diverse.</p>
      <div style="text-align:center;margin-top:10px;"><a href="#" data-page="skills" style=${"font-size:12px;color:" + COLORS.blue + ";text-decoration:none;"}>Open Skill Finder for full analysis \u2192</a></div>`, contentEl);
      return;
    }
    render(html2`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <div>
        <div style="font-size:11px;font-weight:600;color:var(--text-muted);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;">Custom Opportunities</div>
        ${hasCustom ? html2`<div style="display:flex;flex-direction:column;gap:4px;">
              ${strong.map((t3) => {
      const cluster = clusters.find((c2) => c2.id === t3.id);
      const sub = cluster ? cluster.occurrences + " repetitions / " + cluster.sessions + " sessions" : t3.reason.substring(0, 80);
      return html2`<${SkillCard} title=${t3.suggestedSkillName || t3.label} subtitle=${sub} />`;
    })}
              ${triaged.filter((t3) => t3.verdict === "strong").length > 2 && html2`<div style="font-size:11px;color:var(--text-muted);text-align:center;">+${triaged.filter((t3) => t3.verdict === "strong").length - 2} more</div>`}
            </div>` : html2`<p style="color:var(--text-muted);margin:0;font-size:12px;">None detected</p>`}
      </div>
      <div>
        <div style="font-size:11px;font-weight:600;color:var(--text-muted);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;">Community Matches</div>
        ${hasCatalog ? html2`<div style="display:flex;flex-direction:column;gap:4px;">
              ${catTop.map((item) => html2`<${SkillCard} title=${item.title} subtitle=${item.description?.substring(0, 80) || item.kind} />`)}
              ${catalogMatches.length > 2 && html2`<div style="font-size:11px;color:var(--text-muted);text-align:center;">+${catalogMatches.length - 2} more</div>`}
            </div>` : html2`<p style="color:var(--text-muted);margin:0;font-size:12px;">None matched</p>`}
      </div>
    </div>
    <div style="text-align:center;margin-top:10px;">
      <a href="#" data-page="skills" style=${"font-size:12px;color:" + COLORS.blue + ";text-decoration:none;"}>Explore details in Skill Finder \u2192</a>
    </div>`, contentEl);
  }
  async function loadDashSkills(currentFilter2) {
    const contentEl = document.getElementById("dashSkillContent");
    if (!contentEl) return;
    render(html2`<div style="text-align:center;padding:8px;">
    <div class="loading-spinner" style="width:24px;height:24px;margin:0 auto 8px;"></div>
    <p style="color:var(--text-muted);margin:0;font-size:12px;">Scanning prompt history...</p>
  </div>`, contentEl);
    try {
      const data = await rpc("getWorkflowOptimization", currentFilter2);
      const clusters = data.clusters || [];
      let triagedResults = [];
      let catalogMatches = [];
      if (clusters.length > 0) {
        contentEl.querySelector("p").textContent = "AI triage in progress...";
        const top = clusters.slice(0, 20);
        const topClusters = top.map((c2) => ({
          id: c2.id,
          label: c2.label,
          occurrences: c2.occurrences,
          sessions: c2.sessions,
          cancelRate: c2.cancelRate,
          avgCorrectionTurns: c2.avgCorrectionTurns,
          workspaces: c2.workspaces,
          examples: c2.examples.slice(0, 5)
        }));
        const [triageResult, catResult] = await Promise.all([
          rpc("triageSkills", { clusters: topClusters }).catch(() => null),
          rpc("discoverCatalog", {}).catch(() => null)
        ]);
        if (triageResult) {
          triagedResults = (triageResult.triaged || []).filter((t3) => t3.verdict === "strong");
        }
        if (catResult?.items && catResult.items.length > 0) {
          contentEl.querySelector("p").textContent = "Matching community catalog...";
          try {
            const triaged = await rpc("triageCatalog", {
              items: catResult.items,
              clusters: topClusters.map((c2) => ({
                label: c2.label,
                occurrences: c2.occurrences,
                workspaces: c2.workspaces,
                examples: c2.examples.slice(0, 3)
              }))
            });
            catalogMatches = triaged.items || [];
          } catch {
          }
        }
      }
      setSkillCache({ clusters, triaged: triagedResults, catalogMatches, timestamp: Date.now() }, currentFilter2);
      renderSkillResults(triagedResults, clusters, catalogMatches);
    } catch {
      render(html2`<p style="color:var(--text-muted);margin:0;font-size:13px;">Scan failed. Try again later.</p>`, contentEl);
    }
  }

  // src/webview/page-patterns.ts
  function flameColor(t3) {
    if (t3 <= 0) return "rgba(30, 30, 30, 0.3)";
    const stops = [
      [60, 20, 10],
      // dark ember
      [140, 40, 10],
      // deep red
      [200, 80, 10],
      // orange-red
      [240, 150, 20],
      // orange
      [255, 210, 60],
      // warm yellow
      [255, 255, 160]
      // bright
    ];
    const idx = Math.min(t3, 1) * (stops.length - 1);
    const lo = Math.floor(idx);
    const hi = Math.min(lo + 1, stops.length - 1);
    const f2 = idx - lo;
    const r2 = Math.round(stops[lo][0] + (stops[hi][0] - stops[lo][0]) * f2);
    const g2 = Math.round(stops[lo][1] + (stops[hi][1] - stops[lo][1]) * f2);
    const b2 = Math.round(stops[lo][2] + (stops[hi][2] - stops[lo][2]) * f2);
    return `rgb(${r2}, ${g2}, ${b2})`;
  }
  function calendarFlameColor(t3) {
    if (t3 <= 0) return "var(--surface-2, #161b22)";
    if (t3 < 0.25) return "#6b2000";
    if (t3 < 0.5) return "#b33a00";
    if (t3 < 0.75) return "#e06010";
    return "#ffaa20";
  }
  var DAY_START = 7;
  var DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var activeRangeDays = 0;
  var activePatternTab = "hours";
  async function renderPatterns(container, currentFilter2) {
    function buildRangeFilter() {
      const f2 = { ...currentFilter2 };
      if (activeRangeDays > 0) {
        const d2 = /* @__PURE__ */ new Date();
        d2.setDate(d2.getDate() - activeRangeDays);
        f2.fromDate = d2.toISOString().slice(0, 10);
      }
      return f2;
    }
    render(html2`
    <h1>Activity Patterns</h1>

    <div class="cons-range-bar" id="patternsRange">
      <button class=${`cons-range-btn${activeRangeDays === 7 ? " active" : ""}`} data-range="7">Last 7 days</button>
      <button class=${`cons-range-btn${activeRangeDays === 28 ? " active" : ""}`} data-range="28">Last 4 weeks</button>
      <button class=${`cons-range-btn${activeRangeDays === 90 ? " active" : ""}`} data-range="90">Last 3 months</button>
      <button class=${`cons-range-btn${activeRangeDays === 180 ? " active" : ""}`} data-range="180">Last 6 months</button>
      <button class=${`cons-range-btn${activeRangeDays === 0 ? " active" : ""}`} data-range="0">All time</button>
    </div>

    <div class="pattern-tabs" id="patternTabs">
      <button class=${`pattern-tab${activePatternTab === "hours" ? " active" : ""}`} data-tab="hours">Work Hours</button>
      <button class=${`pattern-tab${activePatternTab === "calendar" ? " active" : ""}`} data-tab="calendar">Calendar</button>
      <button class=${`pattern-tab${activePatternTab === "projects" ? " active" : ""}`} data-tab="projects">Projects</button>
    </div>

    <div id="tabHours" class=${`pattern-tab-panel${activePatternTab === "hours" ? " active" : ""}`}></div>
    <div id="tabCalendar" class=${`pattern-tab-panel${activePatternTab === "calendar" ? " active" : ""}`}></div>
    <div id="tabProjects" class=${`pattern-tab-panel${activePatternTab === "projects" ? " active" : ""}`}></div>
  `, container);
    let calendarRendered = false;
    let projectsRendered = false;
    if (activePatternTab === "calendar") {
      calendarRendered = true;
      await renderCalendarTab();
    } else if (activePatternTab === "projects") {
      projectsRendered = true;
      await renderProjectsTab();
    } else await renderHoursTab();
    async function renderHoursTab() {
      const panel = container.querySelector("#tabHours");
      render(html2`<div class="loading-spinner"></div>`, panel);
      const filter = buildRangeFilter();
      const [heatmap, wlb] = await Promise.all([
        rpc("getHeatmap", filter),
        rpc("getWorkLifeBalance", filter)
      ]);
      render(html2`
      <div>
        <div class="heatmap-container" id="heatmapGrid"></div>
        ${wlb ? html2`
        <div class="two-col" style="margin-top:12px;">
          <div class="chart-wrap"><div class="chart-title">Hourly Activity <span class="info-icon" tabindex="0" role="button" aria-label="Hourly activity info">${"\u24D8"}<span class="info-popup">Compares your AI assistant usage by hour of the day on weekdays vs. weekends. Helps identify your most productive coding hours.</span></span></div><${CanvasEl} id="wlbHoursChart" height=${220} /></div>
          <div class="chart-wrap"><div class="chart-title">Weekly Trend <span class="info-icon" tabindex="0" role="button" aria-label="Weekly trend info">${"\u24D8"}<span class="info-popup info-popup-right">Shows your weekly AI assistant request volume split by weekday and weekend. Useful for spotting changes in work cadence over time.</span></span></div><${CanvasEl} id="wlbWeeklyChart" height=${220} /></div>
        </div>` : null}
      </div>
    `, panel);
      renderWorkHoursHeatmap(heatmap);
      if (wlb) {
        const rotateHours = (arr) => [...arr.slice(DAY_START), ...arr.slice(0, DAY_START)];
        createChart("wlbHoursChart", "bar", {
          labels: Array.from({ length: 24 }, (_2, i2) => `${(i2 + DAY_START) % 24}:00`),
          datasets: [
            { label: "Weekday", data: rotateHours(wlb.weekdayHours), backgroundColor: COLORS.blue + "80", borderColor: COLORS.blue, borderWidth: 1 },
            { label: "Weekend", data: rotateHours(wlb.weekendHours), backgroundColor: COLORS.red + "80", borderColor: COLORS.red, borderWidth: 1 }
          ]
        }, {
          plugins: { legend: { position: "top" } },
          scales: { x: { ticks: { maxTicksLimit: 12 } }, y: { beginAtZero: true } }
        });
        const statsAnnotation = `Weekday: ${formatNum(wlb.weekdayReqs)} | Weekend: ${formatNum(wlb.weekendReqs)} | Streak: ${wlb.maxStreak}d | Break: ${wlb.maxBreak}d`;
        createChart("wlbWeeklyChart", "bar", {
          labels: wlb.weeklyTrend.labels,
          datasets: [
            { label: "Weekday", data: wlb.weeklyTrend.weekday, backgroundColor: COLORS.blue, borderRadius: 2 },
            { label: "Weekend", data: wlb.weeklyTrend.weekend, backgroundColor: COLORS.red, borderRadius: 2 }
          ]
        }, {
          plugins: {
            legend: { position: "top" },
            title: {
              display: true,
              text: statsAnnotation,
              color: "var(--text-muted, #8b949e)",
              font: { size: 11, weight: "normal" },
              padding: { bottom: 4 }
            }
          },
          scales: { x: { stacked: true, ticks: { maxTicksLimit: 10 } }, y: { stacked: true, beginAtZero: true } }
        });
      }
    }
    async function renderCalendarTab() {
      const panel = container.querySelector("#tabCalendar");
      render(html2`<div class="loading-spinner"></div>`, panel);
      const filter = buildRangeFilter();
      const [calendar, heatmap] = await Promise.all([
        rpc("getCalendarActivity", filter),
        rpc("getHeatmap", filter)
      ]);
      render(html2`<div class="calendar-heatmap-container" id="calendarGrid"></div>`, panel);
      renderCalendarHeatmap(calendar, heatmap.focusHeatmap);
    }
    async function renderProjectsTab() {
      const panel = container.querySelector("#tabProjects");
      render(html2`<div class="loading-spinner"></div>`, panel);
      const filter = buildRangeFilter();
      const overview = await rpc("getProjectOverview", filter);
      renderProjectOverview(panel, overview);
    }
    const tabs = container.querySelectorAll(".pattern-tab");
    const panels = container.querySelectorAll(".pattern-tab-panel");
    for (const tab of tabs) {
      tab.addEventListener("click", () => {
        void (async () => {
          for (const t3 of tabs) t3.classList.remove("active");
          for (const p2 of panels) p2.classList.remove("active");
          tab.classList.add("active");
          const target = tab.dataset.tab;
          const panel = container.querySelector(`#tab${capitalize(target ?? "hours")}`);
          if (!panel) return;
          panel.classList.add("active");
          if (target) activePatternTab = target;
          if (target === "calendar" && !calendarRendered) {
            calendarRendered = true;
            await renderCalendarTab();
          }
          if (target === "projects" && !projectsRendered) {
            projectsRendered = true;
            await renderProjectsTab();
          }
        })();
      });
    }
    container.querySelector("#patternsRange").addEventListener("click", (e2) => {
      void (async () => {
        const btn = e2.target.closest(".cons-range-btn");
        if (!btn) return;
        for (const t3 of $$("#patternsRange .cons-range-btn")) t3.classList.remove("active");
        btn.classList.add("active");
        activeRangeDays = Number(btn.dataset.range);
        calendarRendered = false;
        projectsRendered = false;
        if (activePatternTab === "hours") await renderHoursTab();
        else if (activePatternTab === "calendar") {
          calendarRendered = true;
          await renderCalendarTab();
        } else if (activePatternTab === "projects") {
          projectsRendered = true;
          await renderProjectsTab();
        }
      })();
    });
  }
  function renderWorkHoursHeatmap(heatmap) {
    const grid = document.getElementById("heatmapGrid");
    const maxVal = Math.max(1, ...heatmap.heatmap.flat());
    const maxFocus = Math.max(1, ...heatmap.focusHeatmap.flat());
    const headerRow = el("div", "heatmap-row header");
    headerRow.appendChild(el("div", "heatmap-label", ""));
    for (let i2 = 0; i2 < 24; i2++) {
      const h3 = (i2 + DAY_START) % 24;
      headerRow.appendChild(el("div", "heatmap-header", `${h3}`));
    }
    grid.appendChild(headerRow);
    for (let d2 = 0; d2 < 7; d2++) {
      const row = el("div", "heatmap-row");
      row.appendChild(el("div", "heatmap-label", DAY_NAMES[d2]));
      for (let i2 = 0; i2 < 24; i2++) {
        const h3 = (i2 + DAY_START) % 24;
        const v2 = heatmap.heatmap[d2][h3];
        const focus = heatmap.focusHeatmap[d2][h3];
        const reqIntensity = v2 / maxVal;
        const focusIntensity = focus / maxFocus;
        const combined = reqIntensity * 0.5 + focusIntensity * 0.5;
        const cell = el("div", "heatmap-cell");
        cell.style.backgroundColor = flameColor(combined);
        cell.style.color = combined > 0.55 ? "#000" : "#fff";
        cell.title = `${DAY_NAMES[d2]} ${h3}:00 \u2014 ${v2} requests, ${focus}% focus`;
        cell.textContent = v2 > 0 ? String(v2) : "";
        row.appendChild(cell);
      }
      grid.appendChild(row);
    }
    const legend = el("div", "heatmap-flame-legend");
    render(html2`
    <span style="color:var(--text-muted);font-size:11px;">Less focus</span>
    <div class="flame-legend-bar"></div>
    <span style="color:var(--text-muted);font-size:11px;">Deep focus</span>
  `, legend);
    grid.appendChild(legend);
  }
  function renderCalendarHeatmap(calendar, _focusHeatmap) {
    const grid = document.getElementById("calendarGrid");
    if (!grid || calendar.days.length === 0) {
      if (grid) render(html2`<p style="color:var(--text-muted);padding:16px;">No activity data available.</p>`, grid);
      return;
    }
    const dayMap = new Map(calendar.days.map((d2) => [d2.date, d2]));
    const firstDate = /* @__PURE__ */ new Date(calendar.days[0].date + "T00:00:00");
    const lastDate = /* @__PURE__ */ new Date(calendar.days[calendar.days.length - 1].date + "T00:00:00");
    const startDate = new Date(firstDate);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    const endDate = new Date(lastDate);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    const allDates = [];
    const cursor = new Date(startDate);
    while (cursor <= endDate) {
      allDates.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    const totalWeeks = Math.ceil(allDates.length / 7);
    const maxReqs = calendar.maxRequests;
    const cellSize = 13;
    const cellGap = 3;
    const labelWidth = 30;
    const monthLabelHeight = 18;
    const svgWidth = labelWidth + totalWeeks * (cellSize + cellGap);
    const svgHeight = monthLabelHeight + 7 * (cellSize + cellGap);
    let svgHtml = `<svg width="${svgWidth}" height="${svgHeight}" style="display:block;">`;
    const shortDays = ["", "Mon", "", "Wed", "", "Fri", ""];
    for (let d2 = 0; d2 < 7; d2++) {
      if (shortDays[d2]) {
        svgHtml += `<text x="0" y="${monthLabelHeight + d2 * (cellSize + cellGap) + cellSize - 2}" fill="var(--text-muted)" font-size="10" font-family="inherit">${shortDays[d2]}</text>`;
      }
    }
    let lastMonthLabel = -1;
    for (let w2 = 0; w2 < totalWeeks; w2++) {
      const weekStart = allDates[w2 * 7];
      const month = weekStart.getMonth();
      if (month !== lastMonthLabel) {
        lastMonthLabel = month;
        const x2 = labelWidth + w2 * (cellSize + cellGap);
        svgHtml += `<text x="${x2}" y="12" fill="var(--text-muted)" font-size="10" font-family="inherit">${MONTH_NAMES[month]}</text>`;
      }
    }
    for (let i2 = 0; i2 < allDates.length; i2++) {
      const date = allDates[i2];
      const week = Math.floor(i2 / 7);
      const dow = i2 % 7;
      const dateStr = toDateStrLocal(date);
      const dayData = dayMap.get(dateStr);
      const x2 = labelWidth + week * (cellSize + cellGap);
      const y2 = monthLabelHeight + dow * (cellSize + cellGap);
      let intensity = 0;
      let title = `${dateStr}: no activity`;
      if (dayData) {
        const reqIntensity = maxReqs > 0 ? dayData.requests / maxReqs : 0;
        intensity = reqIntensity * 0.6 + dayData.focusScore / 100 * 0.4;
        title = `${dateStr}: ${dayData.requests} requests, ${dayData.focusScore}% focus`;
      }
      const color2 = calendarFlameColor(intensity);
      svgHtml += `<rect x="${x2}" y="${y2}" width="${cellSize}" height="${cellSize}" rx="2" ry="2" fill="${color2}" data-date="${dateStr}"><title>${escapeHtml(title)}</title></rect>`;
    }
    svgHtml += "</svg>";
    render(html2`
    <div>
      <div dangerouslySetInnerHTML=${{ __html: svgHtml }}></div>
      <div class="calendar-legend">
        <span style="color:var(--text-muted);font-size:11px;">Less</span>
        <span class="cal-legend-cell" style="background:var(--surface-2, #161b22);"></span>
        <span class="cal-legend-cell" style="background:#6b2000;"></span>
        <span class="cal-legend-cell" style="background:#b33a00;"></span>
        <span class="cal-legend-cell" style="background:#e06010;"></span>
        <span class="cal-legend-cell" style="background:#ffaa20;"></span>
        <span style="color:var(--text-muted);font-size:11px;">More</span>
      </div>
    </div>
  `, grid);
  }
  var LANG_COLORS = {
    typescript: "#3178c6",
    javascript: "#f1e05a",
    python: "#3572a5",
    rust: "#dea584",
    go: "#00add8",
    java: "#b07219",
    "c#": "#178600",
    "c++": "#f34b7d",
    c: "#555555",
    swift: "#f05138",
    kotlin: "#a97bff",
    ruby: "#701516",
    php: "#4f5d95",
    html: "#e34c26",
    css: "#563d7c",
    scss: "#c6538c",
    vue: "#41b883",
    svelte: "#ff3e00",
    shell: "#89e051",
    sql: "#e38c00",
    dart: "#00b4ab",
    scala: "#c22d40",
    markdown: "#083fa1",
    json: "#292929",
    yaml: "#cb171e",
    toml: "#9c4221",
    terraform: "#5c4ee5",
    bicep: "#519aba",
    docker: "#384d54",
    lua: "#000080",
    r: "#198ce7"
  };
  function langTag(lang) {
    const color2 = LANG_COLORS[lang] || "#6e7681";
    return html2`<span class="lang-tag" style="background:${color2}20;color:${color2};border:1px solid ${color2}40;">${lang}</span>`;
  }
  function renderProjectOverview(panel, overview) {
    if (overview.projects.length === 0) {
      render(html2`<p style="color:var(--text-muted);padding:16px;">No project data available.</p>`, panel);
      return;
    }
    const maxHours = Math.max(1, ...overview.projects.map((p2) => p2.estimatedHours));
    render(html2`
    <div class="project-overview-list">
      ${overview.projects.map((proj) => {
      const barWidth = Math.round(proj.estimatedHours / maxHours * 100);
      return html2`
          <div class="project-card" data-ws-id=${proj.workspaceId}>
            <div class="proj-header">
              <div class="proj-name">${proj.workspaceName}</div>
              <div class="proj-meta">
                <span class="proj-hours">${proj.estimatedHours}h</span>
                <span class="proj-requests">${formatNum(proj.totalRequests)} reqs</span>
                ${proj.estimatedLoc > 0 ? html2`<span class="proj-loc">${formatNum(proj.estimatedLoc)} LoC</span>` : null}
                ${proj.gitPath ? html2`<span class="proj-git" title=${proj.gitPath}>\uD83D\uDCC1 ${proj.gitPath.split("/").slice(-2).join("/")}</span>` : null}
              </div>
            </div>
            <div class="proj-bar-track">
              <div class="proj-bar-fill" style="width:${barWidth}%;"></div>
            </div>
            <div class="proj-tags">
              ${proj.languages.map((l2) => langTag(l2))}
              <span class="proj-time-tag">${proj.timePattern}</span>
            </div>
            ${proj.topFiles.length > 0 ? html2`<div class="proj-top-files"><span class="proj-label">Hot files:</span> ${proj.topFiles.map((f2, i2) => html2`${i2 > 0 ? ", " : ""}<code>${f2}</code>`)}</div>` : null}
            <button class="proj-explore-btn" data-ws-id=${proj.workspaceId} data-ws-name=${proj.workspaceName}>Explore more</button>
            <div class="proj-explore-detail" id="explore-${proj.workspaceId}" style="display:none;"></div>
          </div>
        `;
    })}
    </div>
  `, panel);
    for (const btn of panel.querySelectorAll(".proj-explore-btn")) {
      btn.addEventListener("click", () => {
        const wsId = btn.dataset.wsId;
        const wsName = btn.dataset.wsName;
        const detail = panel.querySelector(`#explore-${CSS.escape(wsId)}`);
        if (detail.style.display === "none") {
          detail.style.display = "block";
          btn.textContent = "Collapse";
          renderExploreDetail(detail, wsId, wsName, overview);
        } else {
          detail.style.display = "none";
          btn.textContent = "Explore more";
        }
      });
    }
  }
  function renderExploreDetail(container, wsId, wsName, overview) {
    const proj = overview.projects.find((p2) => p2.workspaceId === wsId);
    if (!proj) {
      render(html2`<p>No data</p>`, container);
      return;
    }
    render(html2`
    <div>
      <div class="explore-section">
        <h4>Tech Stack</h4>
        <div class="explore-lang-list">
          ${proj.languages.length > 0 ? proj.languages.map((lang) => html2`<div class="explore-lang-row">${langTag(lang)}</div>`) : html2`<span style="color:var(--text-muted)">No language data</span>`}
        </div>
      </div>
      <div class="explore-section">
        <h4>Activity Summary</h4>
        <table class="data-table compact">
          <tbody>
            <tr><td>Estimated Hours</td><td><strong>${proj.estimatedHours}h</strong></td></tr>
            <tr><td>Total Requests</td><td><strong>${formatNum(proj.totalRequests)}</strong></td></tr>
            <tr><td>Estimated LoC</td><td><strong>${formatNum(proj.estimatedLoc)}</strong></td></tr>
            <tr><td>Work Pattern</td><td><strong>${proj.timePattern}</strong></td></tr>
            ${proj.gitPath ? html2`<tr><td>Path</td><td><code style="font-size:11px;">${proj.gitPath}</code></td></tr>` : null}
          </tbody>
        </table>
      </div>
      ${proj.topFiles.length > 0 ? html2`
      <div class="explore-section">
        <h4>Busiest Copilot Files</h4>
        <ol class="explore-file-list">
          ${proj.topFiles.map((f2) => html2`<li><code>${f2}</code></li>`)}
        </ol>
      </div>` : null}
    </div>
  `, container);
  }
  function capitalize(s2) {
    return s2.charAt(0).toUpperCase() + s2.slice(1);
  }
  function toDateStrLocal(d2) {
    return `${d2.getFullYear()}-${String(d2.getMonth() + 1).padStart(2, "0")}-${String(d2.getDate()).padStart(2, "0")}`;
  }

  // src/core/helpers.ts
  function isoWeek(d2) {
    const thu = new Date(d2);
    thu.setDate(d2.getDate() - (d2.getDay() + 6) % 7 + 3);
    const yr = thu.getFullYear();
    const wk = Math.ceil(((thu.getTime() - new Date(yr, 0, 4).getTime()) / 864e5 + new Date(yr, 0, 4).getDay() + 1) / 7);
    return `${yr}-W${String(wk).padStart(2, "0")}`;
  }

  // src/webview/page-output.ts
  function aggregationLevel(rangeDays) {
    if (rangeDays === 0) return "monthly";
    if (rangeDays >= 180) return "weekly";
    return "daily";
  }
  function aggregateTimeline(labels, values, level) {
    if (level === "daily") return { labels, values };
    const bucketKey = level === "weekly" ? (dateStr) => isoWeek(/* @__PURE__ */ new Date(dateStr + "T00:00:00")) : (dateStr) => dateStr.slice(0, 7);
    const map2 = /* @__PURE__ */ new Map();
    for (let i2 = 0; i2 < labels.length; i2++) {
      const k2 = bucketKey(labels[i2]);
      map2.set(k2, (map2.get(k2) || 0) + values[i2]);
    }
    const sortedKeys = Array.from(map2.keys()).sort();
    return { labels: sortedKeys, values: sortedKeys.map((k2) => map2.get(k2)) };
  }
  function aggregateByWorkspace(labels, dailyByWs, level) {
    if (level === "daily") return { labels, byWs: dailyByWs };
    const bucketKey = level === "weekly" ? (dateStr) => isoWeek(/* @__PURE__ */ new Date(dateStr + "T00:00:00")) : (dateStr) => dateStr.slice(0, 7);
    const keySet = /* @__PURE__ */ new Set();
    for (const d2 of labels) keySet.add(bucketKey(d2));
    const sortedKeys = Array.from(keySet).sort();
    const keyIndex = new Map(sortedKeys.map((k2, i2) => [k2, i2]));
    const byWs = {};
    for (const [ws, vals] of Object.entries(dailyByWs)) {
      const agg = new Array(sortedKeys.length).fill(0);
      for (let i2 = 0; i2 < labels.length; i2++) {
        agg[keyIndex.get(bucketKey(labels[i2]))] += vals[i2];
      }
      byWs[ws] = agg;
    }
    return { labels: sortedKeys, byWs };
  }
  var activeRangeDays2 = 0;
  var activeTab = "production";
  async function renderOutput(container, currentFilter2) {
    if (!FF_TOKEN_REPORTING_ENABLED && activeTab === "token-usage") {
      activeTab = "production";
    }
    const APPROXIMATION_NOTICE = html2`
    <div class="approximation-notice">
      <strong>Approximation only.</strong>${" "}
      Token usage is estimated from the session data this extension can read
      on your machine. It shows token consumption across all harnesses and
      may not be fully accurate — it cannot reflect activity on other devices,
      cloud-hosted agents, or harnesses this extension doesn't ingest.
      Use it as a workflow optimization signal, not as a billing reference.
    </div>
  `;
    const RANGES = [
      { days: 7, label: "Last 7 days" },
      { days: 28, label: "Last 4 weeks" },
      { days: 90, label: "Last 3 months" },
      { days: 180, label: "Last 6 months" },
      { days: 0, label: "All time" }
    ];
    function rangeStartDate(days) {
      if (days === 0) return "0001-01-01";
      const d2 = /* @__PURE__ */ new Date();
      d2.setDate(d2.getDate() - days);
      return d2.toISOString().slice(0, 10);
    }
    function isRangeDisabled(tab, days) {
      if (tab !== "token-usage") return false;
      return rangeStartDate(days) < TOKEN_DATA_AVAILABLE_FROM;
    }
    function buildRangeFilter() {
      const f2 = { ...currentFilter2 };
      const days = activeRangeDays2;
      if (days > 0) {
        f2.fromDate = rangeStartDate(days);
      }
      if (activeTab === "token-usage") {
        const fromDate = f2.fromDate ?? "";
        if (!fromDate || fromDate < TOKEN_DATA_AVAILABLE_FROM) {
          f2.fromDate = TOKEN_DATA_AVAILABLE_FROM;
        }
      }
      return f2;
    }
    function creditChartTitle() {
      const rangeLabel = RANGES.find((r2) => r2.days === activeRangeDays2)?.label ?? "All time";
      const granularity = activeRangeDays2 > 0 && activeRangeDays2 <= 28 ? "Daily" : "Weekly";
      return `${granularity} Token Consumption \u2014 ${rangeLabel}`;
    }
    function tokenByWsChartTitle() {
      const rangeLabel = RANGES.find((r2) => r2.days === activeRangeDays2)?.label ?? "All time";
      const level = aggregationLevel(activeRangeDays2);
      const granularity = level === "daily" ? "Daily" : level === "weekly" ? "Weekly" : "Monthly";
      return `${granularity} Token Consumption by Workspace \u2014 ${rangeLabel}`;
    }
    function tokenByHarnessChartTitle() {
      const rangeLabel = RANGES.find((r2) => r2.days === activeRangeDays2)?.label ?? "All time";
      const level = aggregationLevel(activeRangeDays2);
      const granularity = level === "daily" ? "Daily" : level === "weekly" ? "Weekly" : "Monthly";
      return `${granularity} Token Consumption by Harness \u2014 ${rangeLabel}`;
    }
    function renderRangeBar() {
      const cur = activeRangeDays2;
      const disabledTitle = `Sessions before ${TOKEN_DATA_AVAILABLE_FROM} did not capture per-request token data, so this range can\u2019t show meaningful coverage. It will become available again once enough recent data falls within the range.`;
      const buttons = RANGES.map((r2) => {
        const disabled = isRangeDisabled(activeTab, r2.days);
        const isActive = cur === r2.days && !disabled;
        const cls = `cons-range-btn${isActive ? " active" : ""}${disabled ? " disabled" : ""}`;
        return disabled ? html2`<button class=${cls} data-range=${r2.days} disabled aria-disabled="true" title=${disabledTitle} style="opacity:0.4;cursor:not-allowed;">${r2.label}</button>` : html2`<button class=${cls} data-range=${r2.days}>${r2.label}</button>`;
      });
      return html2`${buttons}`;
    }
    function refreshRangeBar() {
      const bar = document.getElementById("outputRange");
      if (bar) render(html2`<span>${renderRangeBar()}</span>`, bar);
    }
    function snapActiveRangeIfDisabled() {
      if (!isRangeDisabled(activeTab, activeRangeDays2)) return;
      const enabled = RANGES.filter((r2) => !isRangeDisabled(activeTab, r2.days));
      if (enabled.length === 0) return;
      const longest = enabled.reduce((a2, b2) => {
        const aSpan = a2.days === 0 ? Number.POSITIVE_INFINITY : a2.days;
        const bSpan = b2.days === 0 ? Number.POSITIVE_INFINITY : b2.days;
        return bSpan > aSpan ? b2 : a2;
      });
      activeRangeDays2 = longest.days;
    }
    render(html2`
    <h1>Output</h1>
    <div class="cons-range-bar" id="outputRange"></div>
    <div class="tab-bar" id="output-tabs">
      <button class=${`tab${activeTab === "production" ? " active" : ""}`} data-tab="production">Code Output</button>
      ${FF_TOKEN_REPORTING_ENABLED ? html2`<button class=${`tab${activeTab === "token-usage" ? " active" : ""}`} data-tab="token-usage">Token Usage</button>` : ""}
    </div>
    <div id="output-tab-content"></div>
  `, container);
    refreshRangeBar();
    refreshRangeBar();
    async function renderProductionTab() {
      const target = document.getElementById("output-tab-content");
      render(html2`<div class="loading-spinner"></div>`, target);
      const prod = await rpc("getCodeProduction", buildRangeFilter());
      const s2 = prod.summary;
      const level = aggregationLevel(activeRangeDays2);
      const chartTitle = level === "weekly" ? "Weekly Production" : level === "monthly" ? "Monthly Production" : "Daily Production";
      const yLabel = level === "weekly" ? "LoC/week" : level === "monthly" ? "LoC/month" : "LoC/day";
      render(html2`
      <div class="stat-grid">
        <${StatCard} label="AI-Generated LoC" value=${formatNum(s2.totalAiLoc)} accent="var(--accent-blue)" />
      </div>
      <div class="chart-tabs" style="margin-top:18px">
        <button class="chart-tab active" data-prod-tab="model">Code Output</button>
        <button class="chart-tab" data-prod-tab="workspace">Output by Workspace</button>
        <button class="chart-tab" data-prod-tab="harness">Output by Harness</button>
      </div>
      <div id="prodTabModel" class="chart-tab-panel active"><${CanvasEl} id="prodModelChart" height=${300} title=${chartTitle} /></div>
      <div id="prodTabWorkspace" class="chart-tab-panel"><${CanvasEl} id="prodDailyChart" height=${300} title=${chartTitle} /></div>
      <div id="prodTabHarness" class="chart-tab-panel"><${CanvasEl} id="prodHarnessChart" height=${300} title=${chartTitle} /></div>
      <div class="two-col">
        <${CanvasEl} id="prodLangChart" height=${300} title="By Language" />
        <${CanvasEl} id="prodWsChart" height=${300} title="By Workspace" />
      </div>
    `, target);
      const wsColor = (i2) => PALETTE[i2 % PALETTE.length];
      const { labels: modelLabels, byWs: modelBuckets } = aggregateByWorkspace(
        prod.dailyTimeline.labels,
        prod.dailyByModel,
        level
      );
      const modelNames = Object.keys(modelBuckets).sort((a2, b2) => {
        const sumA = modelBuckets[a2].reduce((sum2, v2) => sum2 + v2, 0);
        const sumB = modelBuckets[b2].reduce((sum2, v2) => sum2 + v2, 0);
        return sumB - sumA;
      });
      const topModels = modelNames.slice(0, 8);
      const otherModels = modelNames.slice(8);
      const otherModelData = modelLabels.map((_2, i2) => otherModels.reduce((sum2, m2) => sum2 + (modelBuckets[m2]?.[i2] ?? 0), 0));
      const modelDatasets = topModels.map((m2, i2) => ({
        label: m2,
        data: modelBuckets[m2],
        backgroundColor: PALETTE[i2 % PALETTE.length] + "99",
        borderColor: PALETTE[i2 % PALETTE.length],
        borderWidth: 1,
        stack: "models"
      }));
      if (otherModels.length > 0) {
        modelDatasets.push({ label: `Other (${otherModels.length})`, data: otherModelData, backgroundColor: COLORS.muted + "60", borderColor: COLORS.muted, borderWidth: 1, stack: "models" });
      }
      if (modelDatasets.length === 0) {
        const { values: aggTotals2 } = aggregateTimeline(prod.dailyTimeline.labels, prod.dailyTimeline.aiLoc, level);
        modelDatasets.push({ label: "AI LoC", data: aggTotals2, backgroundColor: PALETTE[0] + "99", borderColor: PALETTE[0], borderWidth: 1, stack: "models" });
      }
      createChart("prodModelChart", "bar", { labels: modelLabels, datasets: modelDatasets }, {
        plugins: { legend: { position: "top" } },
        scales: { x: { stacked: true, ticks: { maxTicksLimit: 15 } }, y: { stacked: true, beginAtZero: true, title: { display: true, text: yLabel } } }
      });
      const { labels: aggLabels, byWs: aggByWs } = aggregateByWorkspace(
        prod.dailyTimeline.labels,
        prod.dailyByWorkspace,
        level
      );
      const { values: aggTotals } = aggregateTimeline(
        prod.dailyTimeline.labels,
        prod.dailyTimeline.aiLoc,
        level
      );
      const allWsNames = Object.keys(aggByWs).sort((a2, b2) => {
        const sumA = aggByWs[a2].reduce((s3, v2) => s3 + v2, 0);
        const sumB = aggByWs[b2].reduce((s3, v2) => s3 + v2, 0);
        return sumB - sumA;
      });
      const topWsNames = allWsNames.slice(0, 15);
      const otherWsNames = allWsNames.slice(15);
      const otherWsData = aggLabels.map((_2, i2) => otherWsNames.reduce((sum2, ws) => sum2 + (aggByWs[ws]?.[i2] ?? 0), 0));
      const dailyDatasets = topWsNames.filter((ws) => aggByWs[ws]).map((ws, i2) => ({
        label: ws,
        data: aggByWs[ws],
        backgroundColor: wsColor(i2) + "80",
        borderColor: wsColor(i2),
        borderWidth: 1
      }));
      if (otherWsNames.length > 0) {
        dailyDatasets.push({
          label: `Other (${otherWsNames.length})`,
          data: otherWsData,
          backgroundColor: COLORS.muted + "60",
          borderColor: COLORS.muted,
          borderWidth: 1
        });
      }
      if (dailyDatasets.length === 0) {
        dailyDatasets.push({
          label: "AI LoC",
          data: aggTotals,
          backgroundColor: PALETTE[0] + "80",
          borderColor: PALETTE[0],
          borderWidth: 1
        });
      }
      createChart("prodDailyChart", "bar", {
        labels: aggLabels,
        datasets: dailyDatasets
      }, {
        plugins: { legend: { display: dailyDatasets.length > 1, position: "bottom", labels: { boxWidth: 12, padding: 8 } } },
        scales: { x: { stacked: true, ticks: { maxTicksLimit: 15 } }, y: { stacked: true, beginAtZero: true, title: { display: true, text: yLabel } } }
      });
      const { labels: hLabels, byWs: hBuckets } = aggregateByWorkspace(
        prod.dailyTimeline.labels,
        prod.dailyByHarness,
        level
      );
      const hNames = Object.keys(hBuckets).sort((a2, b2) => {
        const sumA = hBuckets[a2].reduce((sum2, v2) => sum2 + v2, 0);
        const sumB = hBuckets[b2].reduce((sum2, v2) => sum2 + v2, 0);
        return sumB - sumA;
      });
      const hDatasets = hNames.map((h3) => ({
        label: h3,
        data: hBuckets[h3],
        backgroundColor: harnessColor2(h3) + "99",
        borderColor: harnessColor2(h3),
        borderWidth: 1,
        stack: "harness"
      }));
      if (hDatasets.length > 0) {
        createChart("prodHarnessChart", "bar", { labels: hLabels, datasets: hDatasets }, {
          plugins: { legend: { position: "top" } },
          scales: { x: { stacked: true, ticks: { maxTicksLimit: 15 } }, y: { stacked: true, beginAtZero: true, title: { display: true, text: yLabel } } }
        });
      }
      createChart("prodLangChart", "bar", {
        labels: prod.byLanguage.labels,
        datasets: [{ label: "AI LoC", data: prod.byLanguage.aiLoc, backgroundColor: PALETTE[0] }]
      }, {
        indexAxis: "y",
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true } }
      });
      const wsBarColors = prod.byWorkspace.labels.map((_2, i2) => wsColor(i2));
      createChart("prodWsChart", "bar", {
        labels: prod.byWorkspace.labels,
        datasets: [{ label: "AI LoC", data: prod.byWorkspace.aiLoc, backgroundColor: wsBarColors }]
      }, {
        indexAxis: "y",
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true } }
      });
      for (const btn of target.querySelectorAll(".chart-tab[data-prod-tab]")) {
        btn.addEventListener("click", () => {
          for (const b2 of target.querySelectorAll(".chart-tab[data-prod-tab]")) b2.classList.remove("active");
          btn.classList.add("active");
          const tab = btn.dataset.prodTab;
          const panelMap = { model: "prodTabModel", workspace: "prodTabWorkspace", harness: "prodTabHarness" };
          for (const p2 of target.querySelectorAll(".chart-tab-panel")) p2.classList.remove("active");
          document.getElementById(panelMap[tab || "model"]).classList.add("active");
        });
      }
    }
    function buildCreditCoverageSummary(data) {
      const trulyMissing = data.finalizableRequests - data.countedRequests - data.partialRequests;
      return {
        missingLabel: data.finalizableRequests > 0 && data.missingPct > 0 ? html2`<span class="missing-badge badge-popup-trigger" tabindex="0">missing ${data.missingPct}%<span class="badge-popup"><strong>Missing (${data.missingPct}%)</strong><br/>${formatNum(trulyMissing)} of ${formatNum(data.finalizableRequests)} finalizable requests have no token data (neither input nor output tokens recorded). These requests are excluded from totals.</span></span>` : data.finalizableRequests === 0 && data.totalRequests > 0 ? html2`<span class="missing-badge badge-popup-trigger" tabindex="0">no finalizable requests<span class="badge-popup"><strong>No finalizable requests</strong><br/>All requests in this period are either still pending (active/aborted sessions) or from sources that don\u2019t record token usage. No token totals can be computed yet.</span></span>` : "",
        partialLabel: data.partialRequests > 0 ? html2` <span class="pending-badge badge-popup-trigger" tabindex="0">+${formatNum(data.partialRequests)} partial<span class="badge-popup"><strong>Partial (${formatNum(data.partialRequests)} requests)</strong><br/>These requests captured output tokens but not input tokens \u2014 cost cannot be estimated exactly. The output token cost is still included in totals, but input cost is unknown. This is common with VS Code Copilot auto-completions and inline suggestions.</span></span>` : "",
        pendingLabel: data.pendingRequests > 0 ? html2` <span class="pending-badge badge-popup-trigger" tabindex="0">+${formatNum(data.pendingRequests)} pending<span class="badge-popup"><strong>Pending (${formatNum(data.pendingRequests)} requests)</strong><br/>Requests in active or aborted sessions where token data was never finalized. These are excluded from the missing % calculation because they may still receive data when sessions close. Common with long-running or interrupted agentic sessions.</span></span>` : "",
        noDataLabel: data.noDataRequests > 0 ? html2` <span class="pending-badge badge-popup-trigger" tabindex="0">+${formatNum(data.noDataRequests)} no-data<span class="badge-popup"><strong>No Data (${formatNum(data.noDataRequests)} requests)</strong><br/>Requests where the harness or source does not record token usage at all (e.g. Xcode, CLI turns aborted before any model output). This is permanent and expected \u2014 these are excluded from the missing % calculation.</span></span>` : ""
      };
    }
    function renderAiCreditsEmptyState(target, data) {
      if (data.countedRequests !== 0 || data.totalRequests === 0) return false;
      const heading = data.pendingRequests > 0 ? "No finalized billing data yet" : data.noDataRequests === data.totalRequests ? "No token-bearing requests in this period" : "No native token data available";
      const body = data.pendingRequests > 0 ? `All ${formatNum(data.totalRequests)} request${data.totalRequests === 1 ? "" : "s"} in this period are still pending or were aborted before any model output. Token data may yet arrive once sessions finalize.` : data.noDataRequests === data.totalRequests ? `All ${formatNum(data.totalRequests)} request${data.totalRequests === 1 ? "" : "s"} are from sources that don't record token usage (e.g. Xcode), so token usage cannot be computed.` : `None of the ${formatNum(data.totalRequests)} request${data.totalRequests === 1 ? "" : "s"} in this period have both input and output token counts reported by the harness, so token usage cannot be computed.`;
      render(html2`${APPROXIMATION_NOTICE}<div class="empty-state"><h2>${heading}</h2><p>${body}</p></div>`, target);
      return true;
    }
    function harnessColor2(h3) {
      return HARNESS_COLORS[h3] || "#6b7280";
    }
    function renderAiCreditsCharts(data) {
      const uncachedInput = Math.max(0, data.totalInputTokens - data.totalCacheReadTokens - data.totalCacheWriteTokens);
      const cacheRead = data.totalCacheReadTokens;
      const cacheWrite = data.totalCacheWriteTokens;
      const hasCached = cacheRead + cacheWrite > 0;
      createChart("creditTokenPie", "bar", {
        labels: hasCached ? ["Input (uncached)", "Cache Read", "Cache Write", "Output"] : ["Input", "Output"],
        datasets: [{
          label: "Tokens",
          data: hasCached ? [uncachedInput, cacheRead, cacheWrite, data.totalOutputTokens] : [data.totalInputTokens, data.totalOutputTokens],
          backgroundColor: hasCached ? [PALETTE[0], PALETTE[2], PALETTE[4] || PALETTE[2], PALETTE[1]] : [PALETTE[0], PALETTE[1]]
        }]
      }, { plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${formatNum(ctx.raw)}` } } }, scales: { y: { beginAtZero: true, ticks: { callback: (v2) => formatNum(v2) } } } });
      const modelEntries = Object.entries(data.costByModel).sort((a2, b2) => b2[1].inputTokens + b2[1].outputTokens - (a2[1].inputTokens + a2[1].outputTokens));
      const useDaily = activeRangeDays2 > 0 && activeRangeDays2 <= 28;
      const series = useDaily ? data.daily : data.weekly;
      const yLabel = useDaily ? "Tokens/day" : "Tokens/week";
      const byModel = series.byModel;
      const modelNames = Object.keys(byModel).sort((a2, b2) => byModel[b2].reduce((s2, v2) => s2 + v2, 0) - byModel[a2].reduce((s2, v2) => s2 + v2, 0));
      const topCreditModels = modelNames.slice(0, 12);
      const otherCreditModels = modelNames.slice(12);
      const otherCreditData = series.labels.map((_2, i2) => otherCreditModels.reduce((sum2, m2) => sum2 + (byModel[m2]?.[i2] ?? 0), 0));
      const creditDatasets = topCreditModels.map((model, i2) => ({ label: model, data: byModel[model], backgroundColor: PALETTE[i2 % PALETTE.length] + "99", borderColor: PALETTE[i2 % PALETTE.length], borderWidth: 1, order: 2, stack: "models" }));
      if (otherCreditModels.length > 0) {
        creditDatasets.push({ label: `Other (${otherCreditModels.length})`, data: otherCreditData, backgroundColor: COLORS.muted + "60", borderColor: COLORS.muted, borderWidth: 1, order: 2, stack: "models" });
      }
      createChart("creditWeeklyChart", "bar", {
        labels: series.labels,
        datasets: [
          ...creditDatasets,
          { label: "Cumulative", data: series.cumulative, type: "line", borderColor: COLORS.yellow, backgroundColor: "transparent", borderWidth: 2, pointRadius: 0, order: 1, yAxisID: "y1" }
        ]
      }, { plugins: { legend: { position: "top" } }, scales: { x: { stacked: true, ticks: { maxTicksLimit: 15 } }, y: { stacked: true, beginAtZero: true, position: "left", title: { display: true, text: yLabel } }, y1: { beginAtZero: true, position: "right", grid: { drawOnChartArea: false }, title: { display: true, text: "Cumulative" } } } });
      const level = aggregationLevel(activeRangeDays2);
      const { labels: wsLabels, byWs: wsBuckets } = aggregateByWorkspace(
        data.dailyTokensByWorkspace.labels,
        data.dailyTokensByWorkspace.byWorkspace,
        level
      );
      const wsNames = Object.keys(wsBuckets).sort((a2, b2) => {
        const sumA = wsBuckets[a2].reduce((s2, v2) => s2 + v2, 0);
        const sumB = wsBuckets[b2].reduce((s2, v2) => s2 + v2, 0);
        return sumB - sumA;
      });
      const topWs = wsNames.slice(0, 20);
      const otherWs = wsNames.slice(20);
      const otherWsData = wsLabels.map((_2, i2) => otherWs.reduce((sum2, ws) => sum2 + (wsBuckets[ws]?.[i2] ?? 0), 0));
      const wsDatasets = topWs.map((ws, i2) => ({
        label: ws,
        data: wsBuckets[ws],
        backgroundColor: PALETTE[i2 % PALETTE.length] + "99",
        borderColor: PALETTE[i2 % PALETTE.length],
        borderWidth: 1,
        stack: "ws"
      }));
      if (otherWs.length > 0) {
        wsDatasets.push({ label: `Other (${otherWs.length})`, data: otherWsData, backgroundColor: COLORS.muted + "60", borderColor: COLORS.muted, borderWidth: 1, stack: "ws" });
      }
      if (wsDatasets.length > 0) {
        const wsYLabel = level === "daily" ? "Tokens/day" : level === "weekly" ? "Tokens/week" : "Tokens/month";
        createChart("creditTokenByWsChart", "bar", {
          labels: wsLabels,
          datasets: wsDatasets
        }, { plugins: { legend: { position: "top" }, tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatNum(ctx.raw)} tokens` } } }, scales: { x: { stacked: true, ticks: { maxTicksLimit: 15 } }, y: { stacked: true, beginAtZero: true, title: { display: true, text: wsYLabel }, ticks: { callback: (v2) => formatNum(v2) } } } });
      }
      const { labels: hLabels, byWs: hBuckets } = aggregateByWorkspace(
        data.dailyTokensByHarness.labels,
        data.dailyTokensByHarness.byHarness,
        level
      );
      const hNames = Object.keys(hBuckets).sort((a2, b2) => {
        const sumA = hBuckets[a2].reduce((s2, v2) => s2 + v2, 0);
        const sumB = hBuckets[b2].reduce((s2, v2) => s2 + v2, 0);
        return sumB - sumA;
      });
      const hDatasets = hNames.map((h3) => ({
        label: h3,
        data: hBuckets[h3],
        backgroundColor: harnessColor2(h3) + "99",
        borderColor: harnessColor2(h3),
        borderWidth: 1,
        stack: "harness"
      }));
      if (hDatasets.length > 0) {
        const hYLabel = level === "daily" ? "Tokens/day" : level === "weekly" ? "Tokens/week" : "Tokens/month";
        createChart("creditTokenByHarnessChart", "bar", {
          labels: hLabels,
          datasets: hDatasets
        }, { plugins: { legend: { position: "top" }, tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatNum(ctx.raw)} tokens` } } }, scales: { x: { stacked: true, ticks: { maxTicksLimit: 15 } }, y: { stacked: true, beginAtZero: true, title: { display: true, text: hYLabel }, ticks: { callback: (v2) => formatNum(v2) } } } });
      }
      return { modelEntries };
    }
    function renderCreditModelTable(target, modelEntries) {
      const visibleModelEntries = modelEntries.filter(([, info]) => info.countedRequests > 0 || info.partialRequests > 0);
      const hiddenModelCount = modelEntries.length - visibleModelEntries.length;
      const anyCached = visibleModelEntries.some(([, info]) => info.cacheReadTokens + info.cacheWriteTokens > 0);
      render(html2`
      <table class="data-table"><thead><tr><th>Model</th><th>Source</th><th>Requests</th><th>Input Tokens</th>${anyCached && html2`<th title="Cached input tokens (read + write).">Cached</th>`}<th>Output Tokens</th><th>Data</th></tr></thead><tbody>
        ${visibleModelEntries.map(([model, info]) => {
        const dataTag = info.finalizableRequests === 0 && info.requests > 0 ? html2`<span class="missing-badge-inline" title="No finalizable requests for this model \u2014 all are pending or from a source that doesn't record tokens.">N/A</span>` : info.missingPct > 0 ? html2`<span class="missing-badge" title=${info.missingPct + "% of finalizable requests for this model have no token data"}>missing ${info.missingPct}%</span>` : "\u2713";
        const cachedTotal = info.cacheReadTokens + info.cacheWriteTokens;
        return html2`<tr>
            <td>${model}</td>
            <td>${(info.harnesses ?? []).map((h3) => html2`<span class="harness-badge" style="--harness-color:${harnessColor2(h3)}" title=${h3}>${h3}</span> `)}</td>
            <td>${formatNum(info.requests)}</td>
            <td>${formatNum(info.inputTokens)}</td>
            ${anyCached && html2`<td>${cachedTotal > 0 ? formatNum(cachedTotal) : html2`<span class="missing-badge-inline">\u2014</span>`}</td>`}
            <td>${formatNum(info.outputTokens)}</td>
            <td>${dataTag}${info.partialRequests > 0 && html2` <span class="pending-badge" title=${formatNum(info.partialRequests) + " output-only requests (input not captured) \u2014 output tokens shown but credits cannot be billed."}>+${formatNum(info.partialRequests)} partial</span>`}${info.pendingRequests > 0 && html2` <span class="pending-badge" title=${formatNum(info.pendingRequests) + " requests in active/aborted sessions (excluded from missing %)"}>+${formatNum(info.pendingRequests)} pending</span>`}${info.noDataRequests > 0 && html2` <span class="pending-badge" title=${formatNum(info.noDataRequests) + " requests where the harness/source did not record token data (excluded from missing %)"}>+${formatNum(info.noDataRequests)} no-data</span>`}</td>
          </tr>`;
      })}
      </tbody></table>
      ${hiddenModelCount > 0 && html2`<p class="credits-note" style="margin-top:6px;"><span title="Models hidden because every request is pending or from a source that doesn't record token data \u2014 there's nothing to display in the cost columns.">${hiddenModelCount} model${hiddenModelCount === 1 ? "" : "s"} hidden (no token data)</span></p>`}
    `, target);
    }
    function showPromptPopup(e2, fullPrompt) {
      document.querySelector(".prompt-popup-overlay")?.remove();
      const overlay = document.createElement("div");
      overlay.className = "prompt-popup-overlay";
      const popup = document.createElement("div");
      popup.className = "prompt-popup";
      const header = document.createElement("div");
      header.className = "prompt-popup-header";
      header.textContent = "Full Prompt";
      const closeBtn = document.createElement("button");
      closeBtn.className = "prompt-popup-close";
      closeBtn.textContent = "\xD7";
      closeBtn.onclick = () => close();
      header.appendChild(closeBtn);
      const body = document.createElement("div");
      body.className = "prompt-popup-body";
      body.textContent = fullPrompt;
      popup.appendChild(header);
      popup.appendChild(body);
      overlay.appendChild(popup);
      document.body.appendChild(overlay);
      const onKey = (ev) => {
        if (ev.key === "Escape") close();
      };
      document.addEventListener("keydown", onKey);
      function close() {
        overlay.remove();
        document.removeEventListener("keydown", onKey);
      }
      overlay.addEventListener("click", (ev) => {
        if (ev.target === overlay) close();
      });
    }
    function renderTopRequestsTable(target, data) {
      render(html2`
      <table class="data-table"><thead><tr><th>Date</th><th>Workspace</th><th>Source</th><th>Model</th><th>Total Tokens</th><th>Prompt</th></tr></thead><tbody>
        ${data.topRequests.map((req) => {
        const d2 = new Date(req.timestamp).toLocaleDateString();
        const aggregated = req.aggregationKind === "session-aggregated";
        const aggTitle = "Estimated share of session-level totals reported by the harness \u2014 exact per-request input is not available.";
        const totalTokens = req.inputTokens + req.outputTokens;
        const tokensCell = req.status === "complete" ? aggregated ? html2`<span class="aggregated-badge" title=${aggTitle}>~${formatNum(totalTokens)}</span>` : formatNum(totalTokens) : req.status === "pending" ? html2`<span class="missing-badge" title="Token data not yet finalized.">pending</span>` : req.status === "no-data" ? html2`<span class="missing-badge" title="Source structurally does not record token counts.">no-data</span>` : req.status === "partial" ? html2`<span class="missing-badge" title="Only output captured \u2014 total incomplete.">partial</span>` : html2`<span class="missing-badge" title="No native token count.">missing</span>`;
        const wsCell = req.workspace || html2`<span class="missing-badge">unknown</span>`;
        const harnessCell = req.harness ? html2`<span class="harness-badge" style="--harness-color:${harnessColor2(req.harness)}" title=${req.harness}>${req.harness}</span>` : "";
        return html2`<tr><td>${d2}</td><td>${wsCell}</td><td>${harnessCell}</td><td>${req.model}</td><td>${tokensCell}</td><td><span class="prompt-preview-trigger" onclick=${(e2) => showPromptPopup(e2, req.fullPrompt)}>${req.preview.slice(0, 50)}\u2026</span></td></tr>`;
      })}
      </tbody></table>
      ${data.topRequests.some((r2) => r2.aggregationKind === "session-aggregated") && html2`<p class="credits-note"><span class="aggregated-badge">~value</span> = derived share of session-level totals (per-request data not reported by harness).</p>`}
    `, target);
    }
    async function renderTokenUsageTab() {
      const target = document.getElementById("output-tab-content");
      render(html2`<div class="loading-spinner"></div>`, target);
      const data = await rpc("getAiCredits", buildRangeFilter());
      const { missingLabel, partialLabel, pendingLabel, noDataLabel } = buildCreditCoverageSummary(data);
      if (renderAiCreditsEmptyState(target, data)) return;
      const totalTokens = data.totalInputTokens + data.totalOutputTokens;
      render(html2`
      ${APPROXIMATION_NOTICE}
      <div class="stat-grid" id="creditStats">
        <${StatCard} label="Total Tokens" value=${formatNum(totalTokens)} accent="var(--accent-blue)" />
        <${StatCard} label="Input Tokens" value=${formatNum(data.totalInputTokens)} accent="var(--accent-green)" />
        <${StatCard} label="Output Tokens" value=${formatNum(data.totalOutputTokens)} accent="var(--accent-purple)" />
      </div>
      <p class="credits-note">Totals reflect ${formatNum(data.countedRequests)} of ${formatNum(data.finalizableRequests)} finalizable requests with token data. Code completions are free and not counted. ${missingLabel}${partialLabel}${pendingLabel}${noDataLabel}</p>
      <div class="chart-tabs" style="margin-top:18px">
        <button class="chart-tab active" data-chart-tab="tokens">Token Consumption</button>
        <button class="chart-tab" data-chart-tab="tokens-ws">Tokens by Workspace</button>
        <button class="chart-tab" data-chart-tab="tokens-harness">Tokens by Harness</button>
      </div>
      <div id="chartTabCredits" class="chart-tab-panel active"><${CanvasEl} id="creditWeeklyChart" height=${300} title=${creditChartTitle()} /></div>
      <div id="chartTabTokensWs" class="chart-tab-panel"><${CanvasEl} id="creditTokenByWsChart" height=${350} title=${tokenByWsChartTitle()} /></div>
      <div id="chartTabTokensHarness" class="chart-tab-panel"><${CanvasEl} id="creditTokenByHarnessChart" height=${350} title=${tokenByHarnessChartTitle()} /></div>
      <div class="chart-wrap"><div class="chart-title">Token Breakdown <span class="info-icon" tabindex="0" role="button" aria-label="Token breakdown info">${"\u24D8"}<span class="info-popup">Cache token breakdown (cache read / cache write) is only available for harnesses that report it natively, such as Claude Code and Copilot CLI. VS Code Copilot chat sessions report a single aggregated input token count and do not break out cached vs. uncached tokens — this is a limitation of the upstream data format, not a bug.</span></span></div><canvas id="creditTokenPie" height=${250}></canvas></div>
      <h2>Model Token Breakdown</h2>
      <div id="creditModelTable"></div>
      <h2>Top Requests by Token Usage</h2>
      <div id="topRequestsTable"></div>
    `, target);
      const { modelEntries } = renderAiCreditsCharts(data);
      renderCreditModelTable(document.getElementById("creditModelTable"), modelEntries);
      renderTopRequestsTable(document.getElementById("topRequestsTable"), data);
      for (const btn of target.querySelectorAll(".chart-tab")) {
        btn.addEventListener("click", () => {
          for (const b2 of target.querySelectorAll(".chart-tab")) b2.classList.remove("active");
          btn.classList.add("active");
          const tab = btn.dataset.chartTab;
          const panels = target.querySelectorAll(".chart-tab-panel");
          for (const p2 of panels) p2.classList.remove("active");
          const panelMap = { tokens: "chartTabCredits", "tokens-ws": "chartTabTokensWs", "tokens-harness": "chartTabTokensHarness" };
          document.getElementById(panelMap[tab || "tokens"]).classList.add("active");
        });
      }
    }
    async function renderActiveTab() {
      if (!FF_TOKEN_REPORTING_ENABLED && activeTab === "token-usage") {
        activeTab = "production";
      }
      if (activeTab === "production") await renderProductionTab();
      else if (!FF_TOKEN_REPORTING_ENABLED) renderTokenUsageGated();
      else await renderTokenUsageTab();
    }
    function renderTokenUsageGated() {
      const target = document.getElementById("output-tab-content");
      render(html2`
      <div class="feature-gated-notice">
        <h2>Token Usage is temporarily disabled</h2>
        <p>
          This feature has been disabled temporarily until we are able to verify
          that the reporting is aligned with what is reported by GitHub.
          It will be re-enabled once the billing system is active and numbers
          can be validated.
        </p>
      </div>
    `, target);
    }
    await renderActiveTab();
    document.body.addEventListener("mouseenter", (e2) => {
      const trigger = e2.target.closest?.(".badge-popup-trigger");
      if (!trigger) return;
      const popup = trigger.querySelector(".badge-popup");
      if (!popup) return;
      popup.style.left = "";
      popup.style.top = "";
      const tr = trigger.getBoundingClientRect();
      const pw = 280;
      const pad = 8;
      let left = tr.left + tr.width / 2 - pw / 2;
      if (left < pad) left = pad;
      if (left + pw > window.innerWidth - pad) left = window.innerWidth - pad - pw;
      const top = tr.top - 6;
      popup.style.left = `${left}px`;
      popup.style.top = `${top}px`;
      popup.style.transform = "translateY(-100%)";
      requestAnimationFrame(() => {
        const pr = popup.getBoundingClientRect();
        if (pr.top < pad) {
          popup.style.top = `${tr.bottom + 6}px`;
          popup.style.transform = "none";
        }
      });
    }, true);
    document.getElementById("outputRange").addEventListener("click", (e2) => {
      const btn = e2.target.closest(".cons-range-btn");
      if (!btn) return;
      if (btn.hasAttribute("disabled")) return;
      const days = Number(btn.dataset.range);
      if (isRangeDisabled(activeTab, days)) return;
      activeRangeDays2 = days;
      refreshRangeBar();
      void renderActiveTab();
    });
    document.getElementById("output-tabs").addEventListener("click", (e2) => {
      void (async () => {
        const btn = e2.target.closest(".tab");
        if (!btn) return;
        for (const t3 of $$("#output-tabs .tab")) t3.classList.remove("active");
        btn.classList.add("active");
        const tab = btn.dataset.tab;
        if (!tab) return;
        if (!FF_TOKEN_REPORTING_ENABLED && tab === "token-usage") return;
        activeTab = tab;
        snapActiveRangeIfDisabled();
        refreshRangeBar();
        await renderActiveTab();
      })();
    });
  }

  // src/webview/page-burndown.ts
  function renderBurndownChartLater(renderBurndownChart) {
    void renderBurndownChart();
  }
  function ExtraInfo({ bd }) {
    const trulyMissing = bd.finalizableRequests - bd.countedRequests - bd.partialRequests;
    return html2`
    <p>
      ${bd.daysUntilExhaustion != null && html2`<strong>Days to exhaustion:</strong> ${bd.daysUntilExhaustion} | `}
      <strong>Safe daily budget:</strong> ${formatNum(Math.round(bd.safeDailyBudget))} tokens/day |${" "}
      ${bd.projectedOverage > 0 && html2`<strong>Projected overage:</strong> ${formatNum(Math.round(bd.projectedOverage))} tokens | `}
      ${bd.finalizableRequests > 0 && bd.missingPct > 0 && html2` <span class="missing-badge" title=${trulyMissing + " of " + bd.finalizableRequests + " finalizable requests have no token data and were not counted."}>missing ${bd.missingPct}%</span>`}
      ${bd.partialRequests > 0 && html2` <span class="pending-badge" title=${bd.partialRequests + " output-only requests in this period (excluded from missing %)"}>+${bd.partialRequests} partial</span>`}
      ${bd.pendingRequests > 0 && html2` <span class="pending-badge" title=${bd.pendingRequests + " requests in active/aborted sessions (excluded from missing %)"}>+${bd.pendingRequests} pending</span>`}
      ${bd.noDataRequests > 0 && html2` <span class="pending-badge" title=${bd.noDataRequests + " requests where the harness/source did not record token data (excluded from missing %)"}>+${bd.noDataRequests} no-data</span>`}
    </p>
  `;
  }
  var _now = /* @__PURE__ */ new Date();
  var selectedYear = _now.getFullYear();
  var selectedMonth = _now.getMonth() + 1;
  var activeBurndownTab = "chart";
  var modelBudgets = loadModelBudgetsFromWebviewState();
  var diskBudgetsLoaded = false;
  var selectedBurndownModel = "all";
  function loadModelBudgetsFromWebviewState() {
    const s2 = vscode.getState();
    return s2?.modelBudgets ?? {};
  }
  function saveModelBudgets() {
    const toSave = {};
    for (const [k2, v2] of Object.entries(modelBudgets)) {
      if (v2 > 0) toSave[k2] = v2;
    }
    const s2 = vscode.getState() ?? {};
    vscode.setState({ ...s2, modelBudgets: toSave });
    rpc("saveModelBudgets", { budgets: toSave }).catch(() => {
    });
  }
  async function loadModelBudgetsFromDisk() {
    if (diskBudgetsLoaded) return;
    diskBudgetsLoaded = true;
    try {
      const saved = await rpc("loadModelBudgets", {});
      if (saved && typeof saved === "object") {
        for (const [k2, v2] of Object.entries(saved)) {
          if (v2 > 0 && !(k2 in modelBudgets && modelBudgets[k2] > 0)) {
            modelBudgets[k2] = v2;
          }
        }
        const s2 = vscode.getState() ?? {};
        const toSave = {};
        for (const [k2, v2] of Object.entries(modelBudgets)) {
          if (v2 > 0) toSave[k2] = v2;
        }
        vscode.setState({ ...s2, modelBudgets: toSave });
      }
    } catch {
    }
  }
  function renderBurndown(container, currentFilter2) {
    if (!FF_TOKEN_REPORTING_ENABLED) {
      render(html2`
      <h1>Burndown</h1>
      <div class="feature-gated-notice">
        <h2>Burndown is temporarily disabled</h2>
        <p>
          This feature has been disabled temporarily until we are able to verify
          that the reporting is aligned with what is reported by GitHub.
          It will be re-enabled once the billing system is active and numbers
          can be validated.
        </p>
      </div>
    `, container);
      return;
    }
    void loadModelBudgetsFromDisk();
    const now = /* @__PURE__ */ new Date();
    function formatMonthLabel(year, month) {
      return new Date(year, month - 1).toLocaleString("default", { month: "long", year: "numeric" });
    }
    function isCurrentMonth() {
      return selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1;
    }
    function navigateMonth(delta) {
      selectedMonth += delta;
      if (selectedMonth < 1) {
        selectedMonth = 12;
        selectedYear--;
      } else if (selectedMonth > 12) {
        selectedMonth = 1;
        selectedYear++;
      }
      document.getElementById("monthLabel").textContent = formatMonthLabel(selectedYear, selectedMonth);
      document.getElementById("nextMonth").disabled = isCurrentMonth();
      renderBurndownChartLater(renderBurndownChart);
    }
    async function fetchHistoricalBudgets() {
      const now2 = /* @__PURE__ */ new Date();
      const months = [];
      months.push(`${now2.getFullYear()}-${String(now2.getMonth() + 1).padStart(2, "0")}`);
      for (let i2 = 1; i2 <= 3; i2++) {
        const d2 = new Date(now2.getFullYear(), now2.getMonth() - i2, 1);
        months.push(`${d2.getFullYear()}-${String(d2.getMonth() + 1).padStart(2, "0")}`);
      }
      const peakByModel = {};
      for (const m2 of months) {
        const [yr, mo] = m2.split("-").map(Number);
        const daysInMonth = new Date(yr, mo, 0).getDate();
        const fromDate = `${m2}-01`;
        const toDate = `${m2}-${String(daysInMonth).padStart(2, "0")}`;
        try {
          const data = await rpc("getAiCredits", { fromDate, toDate });
          for (const [model, entry] of Object.entries(data.costByModel)) {
            const tokens = Math.ceil(entry.inputTokens + entry.outputTokens);
            if (tokens > (peakByModel[model] || 0)) peakByModel[model] = tokens;
          }
        } catch {
        }
      }
      return peakByModel;
    }
    let discoveredModels = {};
    let modelsLoaded = false;
    function renderBudgetTab() {
      const target = document.getElementById("burndown-tab-content");
      if (!modelsLoaded) {
        render(html2`<div class="budget-loading">Loading models\u2026</div>`, target);
        void fetchHistoricalBudgets().then((peak) => {
          discoveredModels = peak;
          modelsLoaded = true;
          for (const model of Object.keys(peak)) {
            if (!(model in modelBudgets)) modelBudgets[model] = 0;
          }
          renderBudgetTab();
        });
        return;
      }
      const allModels = /* @__PURE__ */ new Set([...Object.keys(discoveredModels), ...Object.keys(modelBudgets)]);
      const sortedModels = Array.from(allModels).sort((a2, b2) => {
        const ua = discoveredModels[a2] || 0, ub = discoveredModels[b2] || 0;
        return ub - ua || a2.localeCompare(b2);
      });
      const totalBudget = Object.values(modelBudgets).reduce((a2, b2) => a2 + b2, 0);
      const configuredCount = Object.values(modelBudgets).filter((v2) => v2 > 0).length;
      render(html2`
      <div class="budget-header">
        <div class="stat-grid" style="margin-bottom:0;">
          <${StatCard} label="Total Monthly Budget" value=${formatNum(totalBudget) + " tokens"} accent="var(--accent-blue)" />
          <${StatCard} label="Models with Budget" value=${configuredCount + " / " + sortedModels.length} accent="var(--accent-green)" />
        </div>
      </div>

      <div class="budget-actions">
        <button class="dash-scan-btn budget-autofill-btn" id="btnAutoFill" onClick=${() => {
        for (const [model, val] of Object.entries(discoveredModels)) {
          modelBudgets[model] = Math.ceil(val * 1.2);
        }
        saveModelBudgets();
        renderBudgetTab();
      }}>Auto-fill (+20% of peak)</button>
        <button class="dash-scan-btn budget-clear-btn" onClick=${() => {
        for (const k2 of Object.keys(modelBudgets)) modelBudgets[k2] = 0;
        saveModelBudgets();
        renderBudgetTab();
      }}>Clear all</button>
        <button class="dash-scan-btn" onClick=${() => {
        activeBurndownTab = "chart";
        renderTabs();
        renderBurndownChartLater(renderBurndownChart);
      }}>Apply to Burndown \u2192</button>
      </div>

      <p class="budget-hint">
        Models are auto-discovered from your usage history.
        <strong>Peak usage</strong> shows the highest monthly consumption across the last 4 months.
        Use <strong>Auto-fill</strong> to set budgets at peak + 20% buffer.
      </p>

      <table class="data-table budget-table" id="budgetTable">
        <thead><tr>
          <th>Model</th>
          <th class="budget-usage-col">Peak Usage</th>
          <th class="budget-col">Monthly Budget (tokens)</th>
        </tr></thead>
        <tbody>
          ${sortedModels.map((model) => {
        const val = modelBudgets[model] || 0;
        const peak = discoveredModels[model] || 0;
        const pct = val > 0 && peak > 0 ? Math.min(100, Math.round(peak / val * 100)) : 0;
        const barColor = pct >= 90 ? "var(--accent-red)" : pct >= 70 ? "var(--accent-orange)" : "var(--accent-green)";
        return html2`<tr class=${val > 0 ? "budget-row-active" : ""}>
              <td class="budget-model-name">${model}</td>
              <td class="budget-usage-col">
                <div class="budget-usage-cell">
                  <span class="budget-usage-value">${formatNum(peak)}</span>
                  ${val > 0 && html2`<div class="budget-usage-bar"><div class="budget-usage-bar-fill" style=${`width:${pct}%;background:${barColor}`}></div></div>`}
                </div>
              </td>
              <td class="budget-col">
                <input type="number" class="budget-input" data-model=${model}
                  value=${val || ""}
                  placeholder="\u2014" min="0"
                  onInput=${(e2) => {
          const v2 = Number(e2.target.value);
          if (v2 > 0) modelBudgets[model] = v2;
          else {
            modelBudgets[model] = 0;
          }
          saveModelBudgets();
          const newTotal = Object.values(modelBudgets).reduce((a2, b2) => a2 + b2, 0);
          const newCount = Object.values(modelBudgets).filter((x2) => x2 > 0).length;
          const totalEl = target.querySelector(".stat-grid .stat-card:first-child .stat-value");
          const countEl = target.querySelector(".stat-grid .stat-card:last-child .stat-value");
          if (totalEl) totalEl.textContent = formatNum(newTotal) + " tokens";
          if (countEl) countEl.textContent = newCount + " / " + sortedModels.length;
          const row = e2.target.closest("tr");
          if (row) row.classList.toggle("budget-row-active", v2 > 0);
        }} />
              </td>
            </tr>`;
      })}
        </tbody>
      </table>
    `, target);
    }
    function renderTabs() {
      for (const btn of container.querySelectorAll("#burndown-tabs .tab")) {
        btn.classList.toggle("active", btn.dataset.tab === activeBurndownTab);
      }
      if (activeBurndownTab === "budget") {
        renderBudgetTab();
      } else {
        const target = document.getElementById("burndown-tab-content");
        render(html2`
        <div class="approximation-notice">
          <strong>Approximation only.</strong>
          This shows token consumption across all harnesses and may not be fully
          accurate. It cannot reflect activity on other devices, cloud-hosted
          agents, or harnesses this extension doesn't ingest.
          Use it as a workflow optimization signal, not as a billing reference.
        </div>
        <div class="burndown-controls">
          <div class="month-nav">
            <button id="prevMonth" title="Previous month" onClick=${() => navigateMonth(-1)}>\u2190</button>
            <span id="monthLabel">${formatMonthLabel(selectedYear, selectedMonth)}</span>
            <button id="nextMonth" title="Next month" disabled onClick=${() => navigateMonth(1)}>\u2192</button>
          </div>
          <select id="modelFilter" class="burndown-model-select" onChange=${() => {
          selectedBurndownModel = document.getElementById("modelFilter").value;
          renderBurndownChartLater(renderBurndownChart);
        }}>
            <option value="all" selected=${selectedBurndownModel === "all"}>All Models</option>
          </select>
        </div>
        <${CanvasEl} id="burndownChart" height=${350} />
        <div id="burndownStatus"></div>
      `, target);
        renderBurndownChartLater(renderBurndownChart);
      }
    }
    render(html2`
    <h1>Burndown</h1>
    <div class="tab-bar" id="burndown-tabs">
      <button class=${`tab${activeBurndownTab === "chart" ? " active" : ""}`} data-tab="chart">Burndown Chart</button>
      <button class=${`tab${activeBurndownTab === "budget" ? " active" : ""}`} data-tab="budget">Token Budget</button>
    </div>
    <div id="burndown-tab-content"></div>
  `, container);
    container.querySelector("#burndown-tabs").addEventListener("click", (e2) => {
      const btn = e2.target.closest(".tab");
      if (!btn || !btn.dataset.tab) return;
      activeBurndownTab = btn.dataset.tab;
      renderTabs();
    });
    renderTabs();
    async function renderBurndownChart() {
      const month = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;
      const activeBudgets = {};
      for (const [k2, v2] of Object.entries(modelBudgets)) {
        if (v2 > 0) activeBudgets[k2] = v2;
      }
      const hasBudgets = Object.keys(activeBudgets).length > 0;
      const config = { sku: "pro", month };
      if (hasBudgets) config.modelBudgets = activeBudgets;
      const bd = await rpc("getAiCreditBurndown", { config, filter: { ...currentFilter2, workspaceId: void 0 } });
      destroyChartById("burndownChart");
      const CHART_PALETTE = [COLORS.blue, COLORS.green, COLORS.purple, COLORS.yellow, "#f97316", "#06b6d4", "#ec4899", "#8b5cf6", "#14b8a6", "#f43f5e"];
      const filterSelect = document.getElementById("modelFilter");
      if (filterSelect) {
        const prevVal = selectedBurndownModel;
        filterSelect.innerHTML = "";
        const allOpt = document.createElement("option");
        allOpt.value = "all";
        allOpt.textContent = "All Models";
        filterSelect.appendChild(allOpt);
        const sortedModels = Object.entries(bd.byModel).sort((a2, b2) => (b2[1].cumulative[bd.dayOfMonth - 1] || 0) - (a2[1].cumulative[bd.dayOfMonth - 1] || 0));
        for (const [model] of sortedModels) {
          const opt = document.createElement("option");
          opt.value = model;
          opt.textContent = model;
          filterSelect.appendChild(opt);
        }
        if (prevVal !== "all" && bd.byModel[prevVal]) filterSelect.value = prevVal;
        else {
          filterSelect.value = "all";
          selectedBurndownModel = "all";
        }
      }
      const isSingleModel = selectedBurndownModel !== "all" && bd.byModel[selectedBurndownModel];
      const datasets = [];
      if (isSingleModel) {
        const entry = bd.byModel[selectedBurndownModel];
        const data = entry.cumulative.map((value, idx) => idx < bd.dayOfMonth ? value : null);
        datasets.push({
          label: selectedBurndownModel,
          data,
          borderColor: CHART_PALETTE[0],
          backgroundColor: CHART_PALETTE[0] + "30",
          fill: true,
          borderWidth: 2,
          pointRadius: 1,
          spanGaps: false
        });
        const modelConsumed = entry.cumulative[bd.dayOfMonth - 1] || 0;
        const modelDailyRate = bd.dayOfMonth > 0 ? modelConsumed / bd.dayOfMonth : 0;
        const modelProjectedLine = bd.dailyConsumption.labels.map((_2, i2) => Math.round(modelDailyRate * (i2 + 1)));
        datasets.push({
          label: "Projected",
          data: modelProjectedLine,
          borderColor: COLORS.yellow,
          borderDash: [5, 5],
          borderWidth: 2,
          pointRadius: 0,
          fill: false
        });
        if (entry.budget > 0) {
          datasets.push({
            label: "Budget",
            data: bd.dailyConsumption.labels.map(() => entry.budget),
            borderColor: COLORS.red,
            borderDash: [10, 5],
            borderWidth: 2,
            pointRadius: 0,
            fill: false
          });
        }
      } else {
        const modelEntries = Object.entries(bd.byModel).sort((a2, b2) => (b2[1].cumulative[bd.dayOfMonth - 1] || 0) - (a2[1].cumulative[bd.dayOfMonth - 1] || 0));
        const topModels = modelEntries.slice(0, 10);
        const otherModels = modelEntries.slice(10);
        for (const [model, entry] of topModels) {
          const i2 = topModels.findIndex(([m2]) => m2 === model);
          const data = entry.cumulative.map((value, idx) => idx < bd.dayOfMonth ? value : null);
          datasets.push({
            label: model,
            data,
            borderColor: CHART_PALETTE[i2 % CHART_PALETTE.length],
            backgroundColor: CHART_PALETTE[i2 % CHART_PALETTE.length] + "30",
            fill: true,
            borderWidth: 2,
            pointRadius: 0,
            spanGaps: false,
            stack: "models"
          });
        }
        if (otherModels.length > 0) {
          const otherCumulative = bd.dailyConsumption.labels.map(
            (_2, i2) => otherModels.reduce((sum2, [, entry]) => sum2 + (entry.cumulative[i2] || 0), 0)
          );
          const data = otherCumulative.map((value, idx) => idx < bd.dayOfMonth ? value : null);
          datasets.push({
            label: `Other (${otherModels.length})`,
            data,
            borderColor: COLORS.muted,
            backgroundColor: COLORS.muted + "30",
            fill: true,
            borderWidth: 1,
            pointRadius: 0,
            spanGaps: false,
            stack: "models"
          });
        }
        datasets.push({
          label: "Projected",
          data: bd.projectedLine,
          borderColor: COLORS.yellow,
          borderDash: [5, 5],
          borderWidth: 2,
          pointRadius: 0,
          fill: false
        });
        if (bd.budget > 0) {
          datasets.push({
            label: "Budget",
            data: bd.budgetLine,
            borderColor: COLORS.red,
            borderDash: [10, 5],
            borderWidth: 2,
            pointRadius: 0,
            fill: false
          });
        }
        for (const [model, entry] of topModels) {
          if (entry.budget > 0) {
            const color2 = CHART_PALETTE[topModels.findIndex(([m2]) => m2 === model) % CHART_PALETTE.length];
            datasets.push({
              label: `${model} budget`,
              data: bd.dailyConsumption.labels.map(() => entry.budget),
              borderColor: color2,
              borderDash: [4, 4],
              borderWidth: 1,
              pointRadius: 0,
              fill: false
            });
          }
        }
      }
      createChart("burndownChart", "line", {
        labels: bd.dailyConsumption.labels,
        datasets
      }, {
        plugins: {
          legend: { position: "top", labels: { filter: (item) => !item.text.endsWith(" budget") } },
          tooltip: { callbacks: { label: (ctx) => ctx.raw != null ? `${ctx.dataset.label}: ${formatNum(ctx.raw)} tokens` : "" } }
        },
        scales: {
          x: { ticks: { maxTicksLimit: 31 } },
          y: { beginAtZero: true, stacked: !isSingleModel, ticks: { callback: (v2) => formatNum(v2) } }
        }
      });
      const statusEl = document.getElementById("burndownStatus");
      if (bd.status === "no-data" || bd.status === "pending-only") {
        render(html2`
        <div class="burndown-info status-nodata">
          <p><strong>Status:</strong> ${bd.status} \u2014 ${bd.status === "pending-only" ? "all requests in this period are still pending." : "no native token data available for this period."}</p>
          <${ExtraInfo} bd=${bd} />
          <p>${bd.recommendation}</p>
        </div>
      `, statusEl);
        return;
      }
      const isPartial = bd.missingPct > 0;
      if (isSingleModel) {
        const entry = bd.byModel[selectedBurndownModel];
        const used = entry.cumulative[bd.dayOfMonth - 1] || 0;
        const modelDailyRate = bd.dayOfMonth > 0 ? used / bd.dayOfMonth : 0;
        const modelProjected = Math.round(modelDailyRate * bd.daysInMonth);
        const modelBudget = entry.budget;
        const remaining = modelBudget > 0 ? modelBudget - used : 0;
        const modelSafeDailyBudget = modelBudget > 0 && bd.daysInMonth > bd.dayOfMonth ? Math.round(remaining / (bd.daysInMonth - bd.dayOfMonth)) : 0;
        const modelDaysToExhaustion = modelBudget > 0 && modelDailyRate > 0 ? Math.round(remaining / modelDailyRate) : null;
        const modelOverage = modelBudget > 0 ? Math.max(0, modelProjected - modelBudget) : 0;
        const pct = modelBudget > 0 ? Math.round(used / modelBudget * 100) : 0;
        const modelStatus = modelBudget === 0 ? "no-budget" : pct >= 100 ? "will-exceed" : modelProjected > modelBudget ? "warning" : "on-track";
        const statusClass = modelStatus === "on-track" ? "status-good" : modelStatus === "warning" ? "status-warn" : modelStatus === "no-budget" ? "status-nodata" : "status-bad";
        render(html2`
        <div class=${"burndown-info " + statusClass}>
          <p>
            <strong>${selectedBurndownModel}</strong> |
            <strong>Status:</strong> ${modelStatus} |
            <strong>Consumed:</strong> ${formatNum(Math.round(used))} tokens${modelBudget > 0 ? ` / ${formatNum(modelBudget)}` : ""}${modelBudget > 0 ? ` (${pct}%)` : ""}${isPartial && html2` <span class="missing-badge">lower bound</span>`} |
            <strong>Projected:</strong> ${formatNum(modelProjected)} tokens
          </p>
          ${modelBudget > 0 && html2`<p>
            ${modelDaysToExhaustion != null && html2`<strong>Days to exhaustion:</strong> ${modelDaysToExhaustion} | `}
            <strong>Safe daily budget:</strong> ${formatNum(modelSafeDailyBudget)} tokens/day
            ${modelOverage > 0 && html2` | <strong>Projected overage:</strong> ${formatNum(modelOverage)} tokens`}
          </p>`}
        </div>
      `, statusEl);
      } else {
        const statusClass = bd.status === "on-track" ? "status-good" : bd.status === "warning" ? "status-warn" : "status-bad";
        const budgetedModels = Object.entries(bd.byModel).filter(([, e2]) => e2.budget > 0).sort((a2, b2) => (b2[1].cumulative[bd.dayOfMonth - 1] || 0) - (a2[1].cumulative[bd.dayOfMonth - 1] || 0));
        const modelRows = budgetedModels.map(([model, entry]) => {
          const used = entry.cumulative[bd.dayOfMonth - 1] || 0;
          const modelDailyRate = bd.dayOfMonth > 0 ? used / bd.dayOfMonth : 0;
          const modelProjected = Math.round(modelDailyRate * bd.daysInMonth);
          const remaining = entry.budget - used;
          const safeDailyBudget = bd.daysInMonth > bd.dayOfMonth ? Math.round(remaining / (bd.daysInMonth - bd.dayOfMonth)) : 0;
          const pct = Math.round(used / entry.budget * 100);
          const cls = pct >= 100 ? "status-bad" : modelProjected > entry.budget ? "status-warn" : "status-good";
          return html2`<span class=${"model-budget-pill " + cls} title=${`${model}: ${formatNum(used)} / ${formatNum(entry.budget)} (${pct}%) | safe: ${formatNum(safeDailyBudget)}/day`}>${model}: ${pct}%</span> `;
        });
        render(html2`
        <div class=${"burndown-info " + statusClass}>
          <p>
            <strong>Status:</strong> ${bd.status} |
            <strong>Consumed:</strong> ${formatNum(Math.round(bd.consumed))} tokens${bd.budget > 0 ? ` / ${formatNum(bd.budget)}` : ""}${isPartial && html2` <span class="missing-badge">lower bound</span>`} |
            <strong>Projected:</strong> ${formatNum(Math.round(bd.projected))} tokens
          </p>
          ${modelRows.length > 0 && html2`<div class="model-budget-status">${modelRows}</div>`}
          <${ExtraInfo} bd=${bd} />
          <p>${bd.recommendation}</p>
        </div>
      `, statusEl);
      }
    }
    renderBurndownChartLater(renderBurndownChart);
  }

  // src/webview/page-timeline.ts
  var LANE_COLORS = [
    { bg: "rgba(88,166,255,0.25)", border: "#58a6ff", dot: "#58a6ff" },
    { bg: "rgba(63,185,80,0.25)", border: "#3fb950", dot: "#3fb950" },
    { bg: "rgba(188,140,255,0.25)", border: "#bc8cff", dot: "#bc8cff" },
    { bg: "rgba(210,153,34,0.25)", border: "#d29922", dot: "#d29922" },
    { bg: "rgba(244,112,103,0.25)", border: "#f47067", dot: "#f47067" },
    { bg: "rgba(218,119,86,0.25)", border: "#da7756", dot: "#da7756" },
    { bg: "rgba(121,192,255,0.25)", border: "#79c0ff", dot: "#79c0ff" },
    { bg: "rgba(247,120,186,0.25)", border: "#f778ba", dot: "#f778ba" }
  ];
  var sessionsPage = 1;
  var sessionsSearch = "";
  async function renderTimeline(container, currentFilter2) {
    render(html2`
    <h1>Timeline</h1>
    <div id="timeline-tab-content"></div>
  `, container);
    async function renderGanttTab(dateStr) {
      const target = document.getElementById("timeline-tab-content");
      render(html2`<div class="loading-spinner"></div>`, target);
      const tl = await rpc("getDayTimeline", { date: dateStr, filter: currentFilter2 });
      const totalReqs = tl.sessions.reduce((s2, sess) => s2 + sess.requestCount, 0);
      const activeDateLabel = (/* @__PURE__ */ new Date(tl.date + "T00:00:00")).toLocaleDateString(void 0, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
      render(html2`
      <span id="timelineActiveDate" class="timeline-active-date">${activeDateLabel}</span>
      <div class="timeline-strip-wrap" id="timelineStripWrap"><div id="timelineStrip" class="timeline-strip"></div></div>
      <div class="timeline-stats" id="timelineStats">
        <span>${tl.sessionCount} sessions</span>
        <span>${totalReqs} requests</span>
        <span>Max concurrent: ${tl.maxConcurrent}</span>
      </div>
      <div class="timeline-lanes" id="timelineLanes"></div>
      <div id="timelineDetail"></div>
    `, target);
      const lanes = document.getElementById("timelineLanes");
      const detailEl = document.getElementById("timelineDetail");
      if (tl.activeDates && tl.activeDates.length > 0) {
        let updateScrollFades2 = function() {
          wrap.classList.toggle("can-scroll-left", strip.scrollLeft > 4);
          wrap.classList.toggle("can-scroll-right", strip.scrollLeft < strip.scrollWidth - strip.clientWidth - 4);
        };
        var updateScrollFades = updateScrollFades2;
        const strip = document.getElementById("timelineStrip");
        strip.textContent = "";
        const maxCount = Math.max(...tl.activeDates.map((d2) => d2.count), 1);
        const todayStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
        let activeCard = null;
        const rangeLabel = el("div", "strip-range-label");
        const firstDate = tl.activeDates[0].date;
        const lastDate = tl.activeDates[tl.activeDates.length - 1].date;
        rangeLabel.textContent = `${firstDate} \u2192 ${lastDate} (${tl.activeDates.length} days)`;
        strip.before(rangeLabel);
        for (const d2 of tl.activeDates) {
          const card = el("div", "strip-day");
          card.dataset.date = d2.date;
          if (d2.date === tl.date) {
            card.classList.add("active");
            activeCard = card;
          }
          if (d2.date === todayStr) card.classList.add("today");
          const barH = Math.max(4, d2.count / maxCount * 48);
          const bar = el("div", "strip-bar");
          bar.style.height = barH + "px";
          card.title = `${d2.date} \u2014 ${d2.count} requests`;
          card.appendChild(bar);
          card.addEventListener("mouseenter", () => {
            const hoverLabel = (/* @__PURE__ */ new Date(d2.date + "T00:00:00")).toLocaleDateString(void 0, { weekday: "short", year: "numeric", month: "short", day: "numeric" });
            const dateEl = document.getElementById("timelineActiveDate");
            if (dateEl) dateEl.textContent = hoverLabel;
          });
          card.addEventListener("mouseleave", () => {
            const dateEl = document.getElementById("timelineActiveDate");
            const activeEl = strip.querySelector(".strip-day.active");
            const activeDate = activeEl?.dataset.date;
            if (dateEl && activeDate) {
              dateEl.textContent = (/* @__PURE__ */ new Date(activeDate + "T00:00:00")).toLocaleDateString(void 0, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
            }
          });
          card.addEventListener("click", () => {
            void renderDayDetail(tl, d2.date, currentFilter2, lanes, detailEl);
            for (const c2 of strip.querySelectorAll(".strip-day.active")) c2.classList.remove("active");
            card.classList.add("active");
            const dateEl = document.getElementById("timelineActiveDate");
            if (dateEl) dateEl.textContent = (/* @__PURE__ */ new Date(d2.date + "T00:00:00")).toLocaleDateString(void 0, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
          });
          strip.appendChild(card);
        }
        strip.addEventListener("wheel", (e2) => {
          const delta = Math.abs(e2.deltaY) > Math.abs(e2.deltaX) ? e2.deltaY : e2.deltaX;
          if (delta === 0) return;
          e2.preventDefault();
          strip.scrollLeft += delta * 3;
        }, { passive: false });
        const wrap = document.getElementById("timelineStripWrap");
        strip.addEventListener("scroll", updateScrollFades2, { passive: true });
        requestAnimationFrame(() => {
          if (activeCard) {
            const cardCenter = activeCard.offsetLeft + activeCard.offsetWidth / 2;
            strip.scrollLeft = cardCenter - strip.clientWidth / 2;
          } else {
            strip.scrollLeft = strip.scrollWidth;
          }
          updateScrollFades2();
        });
      }
      if (tl.sessions.length === 0) {
        render(html2`<p class="muted">No sessions on this day.</p>`, lanes);
      } else {
        renderLanes(tl, lanes, detailEl);
      }
    }
    async function _renderListTab() {
      const target = document.getElementById("timeline-tab-content");
      render(html2`<div class="loading-spinner"></div>`, target);
      const list = await rpc("getSessions", { page: sessionsPage, pageSize: 25, filter: currentFilter2, search: sessionsSearch || void 0 });
      render(html2`
      <div class="sessions-toolbar">
        <div class="sessions-search-wrap">
          <input type="text" id="sessionSearch" placeholder="Search sessions..." value=${sessionsSearch} />
        </div>
        <span class="muted">${list.total} sessions</span>
      </div>
      <div class="sessions-layout">
        <div class="sessions-list-panel">
          <div id="sessionList"></div>
          <div class="pagination" id="pagination"></div>
        </div>
        <div class="sessions-detail-panel" id="sessionDetail">
          <div class="sessions-empty-detail">
            <p class="muted">Select a session to view details</p>
          </div>
        </div>
      </div>
    `, target);
      const searchInput = document.getElementById("sessionSearch");
      let searchTimeout = null;
      searchInput.addEventListener("input", () => {
        if (searchTimeout) clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          sessionsSearch = searchInput.value.trim();
          sessionsPage = 1;
          void _renderListTab();
        }, 300);
      });
      const listEl = document.getElementById("sessionList");
      for (const s2 of list.sessions) {
        const item = el("div", "session-item");
        item.dataset.id = s2.sessionId;
        render(html2`
        <div class="session-header">
          <span class="session-ws">${s2.workspaceName}</span>
          <span class="session-count">${s2.requestCount} msgs</span>
        </div>
        <div class="session-date">${formatDate(s2.lastMessageDate)}</div>
        <div class="session-preview">${s2.firstMessage ? s2.firstMessage : html2`<em>empty</em>`}</div>
      `, item);
        item.addEventListener("click", () => {
          for (const i2 of document.querySelectorAll(".session-item")) i2.classList.remove("active");
          item.classList.add("active");
          void showSessionDetail(s2.sessionId);
        });
        listEl.appendChild(item);
      }
      const totalPages = Math.ceil(list.total / list.pageSize);
      const pag = document.getElementById("pagination");
      if (totalPages > 1) {
        if (sessionsPage > 1) {
          const prev = el("button", "page-btn", "&larr; Prev");
          prev.addEventListener("click", () => {
            sessionsPage--;
            void _renderListTab();
          });
          pag.appendChild(prev);
        }
        pag.appendChild(el("span", "page-info", `Page ${sessionsPage} of ${totalPages}`));
        if (sessionsPage < totalPages) {
          const next = el("button", "page-btn", "Next &rarr;");
          next.addEventListener("click", () => {
            sessionsPage++;
            void _renderListTab();
          });
          pag.appendChild(next);
        }
      }
    }
    await renderGanttTab();
  }
  async function renderDayDetail(_currentTl, date, filter, lanes, detailEl) {
    const tl = await rpc("getDayTimeline", { date, filter });
    const totalReqs = tl.sessions.reduce((s2, sess) => s2 + sess.requestCount, 0);
    const statsEl = document.getElementById("timelineStats");
    if (statsEl) {
      render(html2`
      <span>${tl.sessionCount} sessions</span>
      <span>${totalReqs} requests</span>
      <span>Max concurrent: ${tl.maxConcurrent}</span>
    `, statsEl);
    }
    render(null, lanes);
    render(null, detailEl);
    if (tl.sessions.length === 0) {
      render(html2`<p class="muted">No sessions on this day.</p>`, lanes);
      return;
    }
    renderLanes(tl, lanes, detailEl);
  }
  function renderLanes(tl, lanes, detailEl) {
    lanes.textContent = "";
    let rangeStart = 0, rangeEnd = 24;
    if (tl.sessions.length > 0) {
      const firstTs = Math.min(...tl.sessions.map((s2) => s2.firstActivity));
      const lastTs = Math.max(...tl.sessions.map((s2) => s2.lastActivity));
      rangeStart = Math.max(0, Math.floor(new Date(firstTs).getHours()) - 1);
      rangeEnd = Math.min(24, Math.ceil(new Date(lastTs).getHours()) + 2);
      if (rangeEnd - rangeStart < 4) {
        rangeStart = Math.max(0, rangeStart - 2);
        rangeEnd = Math.min(24, rangeEnd + 2);
      }
    }
    const rangeStartMs = tl.dayStart + rangeStart * 36e5;
    const rangeEndMs = tl.dayStart + rangeEnd * 36e5;
    const rangeDuration = rangeEndMs - rangeStartMs;
    const wsColorMap = /* @__PURE__ */ new Map();
    let colorIdx = 0;
    for (const s2 of tl.sessions) {
      if (!wsColorMap.has(s2.workspaceName)) {
        wsColorMap.set(s2.workspaceName, colorIdx % LANE_COLORS.length);
        colorIdx++;
      }
    }
    for (const s2 of tl.sessions) {
      const ci = wsColorMap.get(s2.workspaceName) || 0;
      const color2 = LANE_COLORS[ci];
      const lane = el("div", "timeline-lane");
      const label = el("div", "timeline-lane-label");
      render(html2`<span class="lane-ws">${s2.workspaceName}</span><span class="lane-meta">${s2.requestCount} req</span>`, label);
      lane.appendChild(label);
      const track = el("div", "timeline-lane-track");
      const leftPct = Math.max(0, (s2.firstActivity - rangeStartMs) / rangeDuration * 100);
      const rightPct = Math.min(100, (s2.lastActivity - rangeStartMs) / rangeDuration * 100);
      const widthPct = Math.max(0.5, rightPct - leftPct);
      const bar = el("div", "timeline-bar");
      bar.style.left = leftPct.toFixed(2) + "%";
      bar.style.width = widthPct.toFixed(2) + "%";
      bar.style.background = color2.bg;
      bar.style.border = `1px solid ${color2.border}`;
      bar.title = `${s2.workspaceName}: ${s2.requestCount} requests
${formatTime(s2.firstActivity)} - ${formatTime(s2.lastActivity)}`;
      track.appendChild(bar);
      for (const r2 of s2.requests) {
        const dot = el("div", "timeline-dot");
        const dotPct = (r2.timestamp - rangeStartMs) / rangeDuration * 100;
        dot.style.left = dotPct.toFixed(2) + "%";
        dot.style.background = color2.dot;
        dot.title = `${formatTime(r2.timestamp)}: ${r2.preview}`;
        track.appendChild(dot);
      }
      lane.appendChild(track);
      lane.addEventListener("click", () => {
        for (const l2 of document.querySelectorAll(".timeline-lane")) l2.style.removeProperty("border-color");
        lane.style.borderColor = color2.border;
        render(html2`<div class="timeline-detail">
        <h3>${s2.workspaceName} \u2014 ${s2.sessionName}</h3>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">
          ${formatTime(s2.firstActivity)} - ${formatTime(s2.lastActivity)} | ${s2.requestCount} requests
        </div>
        <div class="timeline-detail-requests">
          ${s2.requests.map((r2) => html2`<div class="timeline-detail-req">
            <span class="timeline-detail-time">${formatTime(r2.timestamp)}</span>
            <span class="timeline-detail-msg">${r2.preview}</span>
          </div>`)}
        </div>
      </div>`, detailEl);
        detailEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
      lanes.appendChild(lane);
    }
    const axis = el("div", "timeline-axis");
    for (let h3 = rangeStart; h3 <= rangeEnd; h3++) {
      const tick = el("span", "timeline-tick");
      tick.style.left = (h3 - rangeStart) / (rangeEnd - rangeStart) * 100 + "%";
      tick.textContent = `${h3}:00`;
      axis.appendChild(tick);
    }
    lanes.appendChild(axis);
  }
  async function showSessionDetail(sessionId) {
    const detail = document.getElementById("sessionDetail");
    render(html2`<div class="sessions-empty-detail"><div class="loading-spinner"></div></div>`, detail);
    const session = await rpc("getSessionDetail", { sessionId });
    if (!session) {
      render(html2`<p>Session not found</p>`, detail);
      return;
    }
    render(html2`<div class="session-detail-inner">
    <div class="session-detail-header">
      <h2>${session.workspaceName}</h2>
      <span class="muted">${formatDate(session.creationDate)} \u00b7 ${session.requestCount} messages \u00b7 ${session.location}</span>
    </div>
    <div class="message-thread">
      ${session.requests.map((r2) => {
      const ts = r2.timestamp ? formatTime(r2.timestamp) : "";
      const meta = [];
      if (r2.modelId) meta.push(r2.modelId);
      if (r2.agentName) meta.push(r2.agentName);
      if (r2.toolsUsed.length) meta.push("Tools: " + r2.toolsUsed.join(", "));
      return html2`
          <div class="msg user-msg">
            <div class="msg-meta">${ts}${meta.length ? " \xB7 " + meta.join(" \xB7 ") : ""}</div>
            <div class="msg-text">${r2.messageText.substring(0, 800)}${r2.messageText.length > 800 ? "..." : ""}</div>
          </div>
          ${r2.responseText && html2`
          <div class="msg ai-msg">
            <div class="msg-text">${r2.responseText.substring(0, 800)}${r2.responseText.length > 800 ? "..." : ""}</div>
          </div>`}
        `;
    })}
    </div>
  </div>`, detail);
  }

  // src/webview/page-antipatterns-heatmap.ts
  var GROUP_COLORS = {
    "prompt-quality": "#3b82f6",
    "session-hygiene": "#f59e0b",
    "code-review": "#ef4444",
    "tool-mastery": "#10b981",
    "context-management": "#8b5cf6"
  };
  function truncate(s2, max2) {
    return s2.length > max2 ? s2.substring(0, max2 - 2) + "\u2026" : s2;
  }
  function computeTotals(data) {
    let maxVal = 0;
    const ruleTotals = {};
    const wsTotals = {};
    for (const r2 of data.rules) {
      const byWs = data.matrix[r2.id] || {};
      let rt = 0;
      for (const ws of data.workspaces) {
        const v2 = byWs[ws] || 0;
        if (v2 > maxVal) maxVal = v2;
        rt += v2;
        wsTotals[ws] = (wsTotals[ws] || 0) + v2;
      }
      ruleTotals[r2.id] = rt;
    }
    return { maxVal, ruleTotals, wsTotals };
  }
  function Loading() {
    return html2`<div class="rule-coverage-loading">Computing coverage...</div>`;
  }
  function ErrorMsg({ message }) {
    return html2`<div class="rule-coverage-error">Error: ${message}</div>`;
  }
  function Empty({ message }) {
    return html2`<div class="rule-coverage-empty">${message}</div>`;
  }
  function HeaderCells({ workspaces, wsTotals }) {
    return html2`
    <div class="rcv-cell rcv-head rcv-head-rule" data-col="0">Rule</div>
    <div class="rcv-cell rcv-head rcv-head-total" data-col="1" title="Total across all workspaces">Total</div>
    ${workspaces.map((ws, i2) => html2`
      <div class="rcv-cell rcv-head rcv-head-ws" data-col=${i2 + 2} title=${ws} key=${ws}>
        <span class="rcv-head-ws-label">${truncate(ws, 22)}</span>
        <span class="rcv-head-ws-total">${wsTotals[ws] || 0}</span>
      </div>
    `)}
  `;
  }
  function DataRow({ rule, rowIdx, workspaces, matrix, ruleTotals, maxVal }) {
    const byWs = matrix[rule.id] || {};
    const groupColor = GROUP_COLORS[rule.group] || "#64748b";
    const rowBg = rowIdx % 2 === 0 ? "rcv-row-even" : "rcv-row-odd";
    return html2`
    <div class=${"rcv-cell rcv-rule " + rowBg} title=${`${rule.id} \u2014 ${rule.group}`}>
      <span class="rcv-rule-dot" style=${"background:" + groupColor}></span>
      <span class="rcv-rule-name">${truncate(rule.name, 32)}</span>
    </div>
    <div class=${"rcv-cell rcv-total " + rowBg}>${ruleTotals[rule.id] || 0}</div>
    ${workspaces.map((ws) => {
      const v2 = byWs[ws] || 0;
      const intensity = maxVal > 0 ? v2 / maxVal : 0;
      const alpha2 = v2 === 0 ? 0 : 0.18 + intensity * 0.72;
      const bg = v2 === 0 ? "transparent" : `rgba(234,179,8,${alpha2.toFixed(2)})`;
      const textColor = intensity > 0.55 ? "#0a0a0a" : "currentColor";
      return html2`
        <div key=${ws}
          class=${"rcv-cell rcv-data " + rowBg}
          style=${"background:" + bg + ";color:" + textColor}
          title=${`${rule.name} \xD7 ${ws}: ${v2}`}
        >${v2 > 0 ? v2 : ""}</div>
      `;
    })}
  `;
  }
  function Heatmap({ data }) {
    const { maxVal, ruleTotals, wsTotals } = computeTotals(data);
    const gridTemplate = `220px 56px repeat(${data.workspaces.length}, 64px)`;
    return html2`
    <div class="rcv-legend">
      <span>Showing <strong>${data.rules.length}</strong> triggered rule(s) \u00d7 <strong>${data.workspaces.length}</strong> workspace(s). Darker = more occurrences.</span>
      <span class="rcv-scale">
        <span class="rcv-scale-label">0</span>
        <span class="rcv-scale-gradient"></span>
        <span class="rcv-scale-label">${maxVal}</span>
      </span>
    </div>
    <div class="rcv-scroll">
      <div class="rcv-grid" style=${"grid-template-columns:" + gridTemplate}>
        <${HeaderCells} workspaces=${data.workspaces} wsTotals=${wsTotals} />
        ${data.rules.map((r2, i2) => html2`
          <${DataRow} key=${r2.id} rule=${r2} rowIdx=${i2}
            workspaces=${data.workspaces} matrix=${data.matrix}
            ruleTotals=${ruleTotals} maxVal=${maxVal} />
        `)}
      </div>
    </div>
  `;
  }
  async function renderCoverageHeatmap(container, currentFilter2) {
    const body = container.querySelector("#rule-coverage-body");
    render(html2`<${Loading} />`, body);
    try {
      const data = await rpc("getRuleCoverage", { filter: currentFilter2 });
      if (data.error) {
        render(html2`<${ErrorMsg} message=${data.error} />`, body);
        return;
      }
      if (data.rules.length === 0) {
        render(html2`<${Empty} message="No rules triggered in the current filter range." />`, body);
        return;
      }
      if (data.workspaces.length === 0) {
        render(html2`<${Empty} message="No workspace data available." />`, body);
        return;
      }
      render(html2`<${Heatmap} data=${data} />`, body);
    } catch (err) {
      render(html2`<${ErrorMsg} message=${err instanceof Error ? err.message : String(err)} />`, body);
    }
  }

  // src/webview/dsl-cheatsheet.ts
  var DSL_CHEATSHEET = `## Rule Structure
\`\`\`markdown
---
id: rule-id
name: Human-Readable Name
group: prompt-quality | session-hygiene | code-review | tool-mastery | context-management
severity: low | medium | high
scope: requests | sessions
version: 1
tags: [tag1, tag2]
thresholds:
  key: number
---

# Description
What this rule detects.

# When Triggered
{{count}} ... out of {{total}} ({{pct}}). Use {{extra.keyName}} for reduce values.

# How to Improve
Actionable advice.

# Examples
"{{message}}..."

# Detection Logic
\\\`\\\`\\\`detect
scan: requests | sessions
match: <boolean expression per row>
aggregate: count | ratio
<reduceKey>: <expression over matched/all/allReqs/allSessions>
emitCount: <number expression for displayed count>
emitTotal: <number expression for displayed total>
check: <boolean trigger condition>
examples: <template per matched row>
severity: <boolean expression for dynamic severity upgrade>
\\\`\\\`\\\`
\`\`\`

## Available Row Fields (requests)
messageText, messageLength, timestamp, totalElapsed, modelId, agentMode, agentName,
slashCommand, referencedFiles (array), customInstructions (array), skillsUsed (array),
toolsUsed (array), toolConfirmations (array), aiCode (array of {language, loc}),
userCode (array), cancelled (boolean), sessionId, workspaceName

## Available Row Fields (sessions)
sessionId, workspaceName, requestCount, requests (array), harness, startTime, endTime,
creationDate, lastMessageDate

## DSL Functions
- hasProfanity(text) - true if text contains profanity
- hasConstraint(text) - true if text has constraint keywords
- matchesAny(text, patterns) - regex match against pattern array
- capsWordRatio(text, minWords) - ratio of ALL-CAPS words
- isSpecDriven(requests) - true if session starts with specs
- isStructured(request) - true if request has bullet points/structure
- hasPlanUsage(requests) - 1 if any request uses plan mode
- countWhere(arr, field, op, value) - count items matching condition
- someWhere(arr, field, value) - true if any item matches
- avgField(arr, field) - average of numeric field
- sumField(arr, field) - sum of numeric field
- flatCount(arr, field) - sum of sub-array lengths
- flatUnique(arr, field) - count of distinct values across sub-arrays
- reasoningEffortStats(reqs[, level]) - premium reasoning-effort usage ratio
- instructionBloatStats(sessions[, maxBytes]) - custom-instructions size analysis

- excessFileContextStats(reqs[, minFiles]) - outliers attaching huge file context
- hasSkillByPattern(reqs, /pattern/) - any skillsUsed matches the regex
- first(arr) - first element
- length(arr) - array length
- round(n), floor(n), ceil(n), abs(n), min(a,b), max(a,b)
- sumAiLoc(requests) - sum of all AI code LoC in requests
- duplicateGroups(reqs, minKeyLen, minCount) -> {totalDupes, distinctCount}
- profanityMatches(reqs) -> {count, total, flaggedWords}
- contextGapCount(reqs) -> {gapCount, gaps[], reqCount}
- modelStats(reqs) -> {topModel, topCount, topShare, modelCount, total}
- flowScoreStats(sessions, minReqs, rapidMs) -> {fragmentedDays, totalDays, avgScore, lowScoreRate}
- adjacentPairCount(sessions, minLoc, maxGapMs) -> {count, avgLoc, avgGap}
- mdRatioByWorkspace(sessions, minLoc, docLangs) -> {lowCount, totalWorkspaces, overallRatio, workspaces[]}
- devcontainerStats(sessions, reqs) -> {terminalReqs, vscodeReqs, sandboxedTerminalReqs, totalTerminalReqs, terminalRate}
- langExplorationWeeks(reqs) -> {weeksSinceNew, totalLangs, recentNew, totalWeeks}
- yoloStats(reqs) -> {autoApproved, totalConfirmations, ratio}
- autoApproveStats(reqs) -> {terminalAutoApproved, autoApprovedTotal}
- groupTopBySum(arr, groupField, sumField) -> {key, sum, share, count}

## Match Expression Operators
AND, OR, NOT, ==, !=, >, <, >=, <=, field.length, field access with dot notation

## Reduce Expressions
After match, use reduce keys to compute aggregates over matched rows.
Use emitCount/emitTotal to override the displayed count/total.
The check expression has access to count, total, ratio, and all reduce keys.`;

  // src/webview/page-antipatterns-editor.ts
  var RULE_EDITOR_SYSTEM_PROMPT = `You are an expert at writing detection rules for the AI Engineer Coach VS Code extension.
Rules are markdown files with YAML frontmatter and a Detection Logic block using a custom DSL.

${DSL_CHEATSHEET}

Output ONLY the raw markdown rule. No code fences around the whole output. No explanation.`;
  function parseThresholdsFromMarkdown(md) {
    const result = {};
    const fmMatch = md.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) return result;
    const threshMatch = fmMatch[1].match(/thresholds:\n((?:\s{2,}\S.*\n?)*)/);
    if (!threshMatch) return result;
    for (const line of threshMatch[1].split("\n")) {
      const m2 = line.match(/^\s+(\w+):\s*([-\d.]+)\s*$/);
      if (m2) {
        const n3 = Number.parseFloat(m2[2]);
        if (!Number.isNaN(n3)) result[m2[1]] = n3;
      }
    }
    return result;
  }
  function applyThresholdOverrides(md, overrides2) {
    return md.replace(/(thresholds:\n)((?:\s{2,}\S.*\n?)*)/, (_full, head, body) => {
      const newBody = body.replaceAll(/^(\s+)(\w+):[ \t]*([-\d.]+)[ \t]*$/gm, (line, indent, key, _val) => {
        if (overrides2[key] !== void 0) {
          const v2 = overrides2[key];
          const formatted = Number.isInteger(v2) ? String(v2) : String(Math.round(v2 * 1e3) / 1e3);
          return `${indent}${key}: ${formatted}`;
        }
        return line;
      });
      return head + newBody;
    });
  }
  function sliderRange(value) {
    if (value >= 0 && value <= 1) return { min: 0, max: 1, step: 0.01 };
    if (value <= 24 && Number.isInteger(value)) return { min: 0, max: 48, step: 1 };
    if (Number.isInteger(value)) return { min: 0, max: Math.max(100, value * 3), step: 1 };
    return { min: 0, max: Math.max(10, value * 3), step: value / 100 };
  }
  function buildThresholdSliders(thresholds, overrides2) {
    const keys = Object.keys(thresholds);
    if (keys.length === 0) return null;
    const rows = keys.map((k2) => {
      const current = overrides2[k2] !== void 0 ? overrides2[k2] : thresholds[k2];
      const { min: min2, max: max2, step } = sliderRange(thresholds[k2]);
      const displayVal = Number.isInteger(step) ? String(current) : current.toString();
      return html2`
      <div class="rule-threshold-slider-row">
        <label class="rule-threshold-slider-label" title=${k2}>${k2}</label>
        <input type="range" class="rule-threshold-slider"
          data-key=${k2}
          min=${min2} max=${max2} step=${step} value=${current} />
        <span class="rule-threshold-slider-value" data-threshold-value=${k2}>${displayVal}</span>
      </div>`;
    });
    return html2`<div class="rule-test-sliders"><div class="rule-test-sliders-title">Tune thresholds (live)</div>${rows}</div>`;
  }
  function formToMarkdown(c2) {
    const val = (id) => c2.querySelector(`#${id}`)?.value?.trim() || "";
    const thresholds = val("rf-thresholds").split("\n").filter((l2) => l2.includes(":")).map((l2) => "  " + l2.trim()).join("\n");
    const tags = val("rf-tags").split(",").map((t3) => t3.trim()).filter(Boolean);
    const patternsRaw = val("rf-patterns");
    const fileTypesRaw = val("rf-filetypes");
    const extraFm = val("rf-extra-fm");
    return `---
id: ${val("rf-id") || "my-custom-rule"}
name: ${val("rf-name") || "My Custom Rule"}
group: ${val("rf-group")}
severity: ${val("rf-severity")}
scope: ${val("rf-scope")}
version: ${val("rf-version") || "1"}
tags: [${tags.join(", ")}]
${thresholds ? `thresholds:
${thresholds}` : "thresholds: {}"}
${patternsRaw ? `patterns:
${patternsRaw}` : ""}${fileTypesRaw ? `
fileTypes:
${fileTypesRaw}` : ""}${extraFm ? `
${extraFm}` : ""}
---

# Description
${val("rf-description") || "Describe what this rule detects."}

# When Triggered
${val("rf-when-triggered") || "{{count}} occurrences detected ({{pct}} of requests)."}

# How to Improve
${val("rf-how-to-improve") || "Explain how to fix this anti-pattern."}

# Examples
${val("rf-examples") || '"{{message}}..."'}

# Detection Logic
\`\`\`detect
${val("rf-detect") || "scan: requests\nmatch: messageLength > 0\naggregate: count\ncheck: count >= 1"}
\`\`\`
`;
  }
  function markdownToForm(c2, md) {
    const set2 = (id, v2) => {
      const el2 = c2.querySelector(`#${id}`);
      if (el2) el2.value = v2;
    };
    const fmMatch = md.match(/^---\n([\s\S]*?)\n---/);
    if (fmMatch) {
      const fm = fmMatch[1];
      const field = (key) => {
        const m2 = fm.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
        return m2 ? m2[1].trim() : "";
      };
      set2("rf-id", field("id"));
      set2("rf-name", field("name"));
      set2("rf-group", field("group"));
      set2("rf-severity", field("severity"));
      set2("rf-scope", field("scope"));
      set2("rf-version", field("version") || "1");
      const tagsMatch = field("tags");
      const tags = tagsMatch.replaceAll(/^\[|\]$/g, "").split(",").map((t3) => t3.trim()).filter(Boolean);
      set2("rf-tags", tags.join(", "));
      const threshMatch = fm.match(/thresholds:\n((?:\s{2,}\S.*\n?)*)/);
      if (threshMatch) {
        set2("rf-thresholds", threshMatch[1].replaceAll(/^ {2}/gm, "").trim());
      } else {
        set2("rf-thresholds", "");
      }
      const patternsMatch = fm.match(/patterns:\n((?:\s{2,}\S.*\n?)*)/);
      set2("rf-patterns", patternsMatch ? patternsMatch[1].trim().replaceAll(/^/gm, "  ") : "");
      const fileTypesMatch = fm.match(/fileTypes:\n((?:\s{2,}\S.*\n?)*)/);
      set2("rf-filetypes", fileTypesMatch ? fileTypesMatch[1].trim().replaceAll(/^/gm, "  ") : "");
      const extraFmParts = [];
      const reqIdeMatch = fm.match(/^requiresIdeContext:\s*(.+)$/m);
      if (reqIdeMatch) extraFmParts.push(`requiresIdeContext: ${reqIdeMatch[1].trim()}`);
      const extendsMatch = fm.match(/^extends:\s*(.+)$/m);
      if (extendsMatch) extraFmParts.push(`extends: ${extendsMatch[1].trim()}`);
      set2("rf-extra-fm", extraFmParts.join("\n"));
    }
    const section = (heading) => {
      const re = new RegExp(`# ${heading}\\n([\\s\\S]*?)(?=\\n# |$)`);
      const m2 = md.match(re);
      return m2 ? m2[1].trim() : "";
    };
    set2("rf-description", section("Description"));
    set2("rf-when-triggered", section("When Triggered"));
    set2("rf-how-to-improve", section("How to Improve"));
    const exSection = section("Examples");
    const exClean = exSection.replaceAll(/```detect[\s\S]*?```/g, "").trim();
    set2("rf-examples", exClean);
    const detectMatch = md.match(/```detect\n([\s\S]*?)```/);
    set2("rf-detect", detectMatch ? detectMatch[1].trim() : "");
  }
  function openRuleEditor(container, existingRuleId, markdown) {
    const modal = container.querySelector("#rule-editor-modal");
    const title = container.querySelector("#rule-editor-modal-title");
    modal.dataset.ruleId = existingRuleId || "";
    title.textContent = existingRuleId ? "Edit Rule" : "New Rule";
    const fields = [
      "rf-id",
      "rf-name",
      "rf-tags",
      "rf-description",
      "rf-when-triggered",
      "rf-how-to-improve",
      "rf-examples",
      "rf-thresholds",
      "rf-detect",
      "rf-patterns",
      "rf-filetypes",
      "rf-extra-fm"
    ];
    for (const id of fields) {
      const el2 = container.querySelector(`#${id}`);
      if (el2) el2.value = "";
    }
    container.querySelector("#rf-group").value = "prompt-quality";
    container.querySelector("#rf-severity").value = "medium";
    container.querySelector("#rf-scope").value = "requests";
    container.querySelector("#rf-version").value = "1";
    container.querySelector("#rule-ai-input").value = "";
    container.querySelector("#rule-ai-status").style.display = "none";
    const testResults = container.querySelector("#rule-test-results");
    if (testResults) {
      testResults.style.display = "none";
      render(null, testResults);
    }
    if (markdown) {
      markdownToForm(container, markdown);
      container.querySelector("#rule-editor-raw").value = markdown;
    } else if (existingRuleId) {
      rpc("getRuleSource", { ruleId: existingRuleId }).then((res) => {
        markdownToForm(container, res.source);
        container.querySelector("#rule-editor-raw").value = res.source;
      }).catch(() => {
      });
    } else {
      container.querySelector("#rule-editor-raw").value = "";
    }
    switchEditorTab(container, "form");
    modal.style.display = "flex";
  }
  function switchEditorTab(container, tab) {
    const tabs = container.querySelectorAll(".rule-editor-tab");
    for (const t3 of tabs) t3.classList.toggle("active", t3.dataset.editorTab === tab);
    const formPanel = container.querySelector("#rule-editor-form");
    const sourcePanel = container.querySelector("#rule-editor-source");
    if (tab === "form") {
      formPanel.style.display = "";
      sourcePanel.style.display = "none";
    } else {
      container.querySelector("#rule-editor-raw").value = formToMarkdown(container);
      formPanel.style.display = "none";
      sourcePanel.style.display = "";
    }
  }
  function wireRuleEditorModal(container, currentFilter2, onSaved) {
    const modal = container.querySelector("#rule-editor-modal");
    container.querySelector("#rule-editor-close")?.addEventListener("click", () => {
      modal.style.display = "none";
    });
    container.querySelector("#rule-editor-cancel")?.addEventListener("click", () => {
      modal.style.display = "none";
    });
    for (const tab of container.querySelectorAll(".rule-editor-tab")) {
      tab.addEventListener("click", () => {
        const t3 = tab.dataset.editorTab;
        if (t3 === "form") {
          const raw = container.querySelector("#rule-editor-raw").value;
          if (raw.trim()) markdownToForm(container, raw);
        }
        switchEditorTab(container, t3);
      });
    }
    container.querySelector("#rule-editor-save")?.addEventListener("click", () => {
      void (async () => {
        const activeTab2 = container.querySelector(".rule-editor-tab.active");
        let markdown;
        if (activeTab2?.dataset.editorTab === "source") {
          markdown = container.querySelector("#rule-editor-raw").value;
        } else {
          markdown = formToMarkdown(container);
        }
        if (!markdown.trim()) return;
        const ruleId = modal.dataset.ruleId || void 0;
        try {
          await rpc("saveRule", { markdown, ruleId });
          modal.style.display = "none";
          await onSaved();
        } catch (err) {
          alert("Failed to save: " + (err instanceof Error ? err.message : String(err)));
        }
      })();
    });
    const runTest = async (overrides2) => {
      const activeTab2 = container.querySelector(".rule-editor-tab.active");
      let markdown;
      if (activeTab2?.dataset.editorTab === "source") {
        markdown = container.querySelector("#rule-editor-raw").value;
      } else {
        markdown = formToMarkdown(container);
      }
      if (!markdown.trim()) return;
      if (overrides2 && Object.keys(overrides2).length > 0) {
        markdown = applyThresholdOverrides(markdown, overrides2);
      }
      const testBtn = container.querySelector("#rule-editor-test");
      const resultsDiv = container.querySelector("#rule-test-results");
      testBtn.disabled = true;
      testBtn.textContent = "Testing...";
      resultsDiv.style.display = "";
      const existingSliders = resultsDiv.querySelector(".rule-test-sliders")?.outerHTML || "";
      if (!existingSliders) {
        resultsDiv.className = "rule-test-results rule-test-loading";
        resultsDiv.textContent = "Running rule against your data...";
      }
      try {
        const result = await rpc("testRuleLive", { markdown, filter: currentFilter2 });
        const thresholds = parseThresholdsFromMarkdown(markdown);
        const slidersVNode = buildThresholdSliders(thresholds, overrides2 || {});
        let bodyVNode;
        let className;
        if (!result.ok) {
          className = "rule-test-results rule-test-error";
          bodyVNode = html2`<strong>Error:</strong> ${result.error || "Unknown error"}`;
        } else if (result.triggered) {
          className = "rule-test-results rule-test-triggered";
          bodyVNode = html2`
          <div class="rule-test-header"><strong>TRIGGERED</strong> \u2014 ${result.pct} (${result.occurrences} / ${result.total})</div>
          <div class="rule-test-desc">${result.description}</div>
          ${result.examples.length > 0 ? html2`<details class="rule-test-examples"><summary>${result.examples.length} example(s)</summary><ul>${result.examples.map((ex) => html2`<li>${ex}</li>`)}</ul></details>` : null}
        `;
        } else {
          className = "rule-test-results rule-test-clean";
          bodyVNode = html2`<div class="rule-test-header"><strong>CLEAN</strong> \u2014 Rule did not trigger (${result.occurrences} / ${result.total})</div>`;
        }
        resultsDiv.className = className;
        render(html2`${slidersVNode}<div class="rule-test-body">${bodyVNode}</div>`, resultsDiv);
        for (const slider of resultsDiv.querySelectorAll(".rule-threshold-slider")) {
          const valSpan = resultsDiv.querySelector(`[data-threshold-value="${slider.dataset.key}"]`);
          slider.addEventListener("input", () => {
            if (valSpan) valSpan.textContent = slider.value;
          });
          slider.addEventListener("change", () => {
            const key = slider.dataset.key;
            if (!key) return;
            const next = { ...overrides2 || {} };
            next[key] = Number.parseFloat(slider.value);
            void runTest(next);
          });
        }
      } catch (err) {
        resultsDiv.className = "rule-test-results rule-test-error";
        render(html2`<strong>Error:</strong> ${err instanceof Error ? err.message : String(err)}`, resultsDiv);
      } finally {
        testBtn.disabled = false;
        testBtn.textContent = "Test Rule";
      }
    };
    container.querySelector("#rule-editor-test")?.addEventListener("click", () => {
      void runTest();
    });
    const aiBtn = container.querySelector("#rule-ai-generate");
    const aiInput = container.querySelector("#rule-ai-input");
    const aiStatus = container.querySelector("#rule-ai-status");
    const doGenerate = async () => {
      const prompt = aiInput.value.trim();
      if (!prompt) return;
      aiBtn.disabled = true;
      aiBtn.textContent = "Generating...";
      aiStatus.style.display = "";
      aiStatus.className = "rule-ai-status rule-ai-status-loading";
      aiStatus.textContent = "AI is generating your rule...";
      try {
        const result = await rpc("generateRule", { prompt });
        const md = result.markdown;
        markdownToForm(container, md);
        container.querySelector("#rule-editor-raw").value = md;
        const idField = container.querySelector("#rf-id");
        if (!idField.value) {
          idField.value = prompt.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/^-|-$/g, "").substring(0, 40);
        }
        aiStatus.className = "rule-ai-status rule-ai-status-ok";
        aiStatus.textContent = "Rule generated. Review and edit the fields below, then save.";
        switchEditorTab(container, "form");
      } catch (err) {
        aiStatus.className = "rule-ai-status rule-ai-status-error";
        aiStatus.textContent = "Failed: " + (err instanceof Error ? err.message : String(err));
      } finally {
        aiBtn.disabled = false;
        aiBtn.textContent = "Generate";
      }
    };
    aiBtn?.addEventListener("click", () => {
      void doGenerate();
    });
    aiInput?.addEventListener("keydown", (e2) => {
      if (e2.key === "Enter") {
        e2.preventDefault();
        void doGenerate();
      }
    });
    container.querySelector("#rule-ai-prompt-info")?.addEventListener("click", () => {
      const promptModal = container.querySelector("#rule-ai-prompt-modal");
      const view = container.querySelector("#rule-ai-prompt-view");
      view.textContent = RULE_EDITOR_SYSTEM_PROMPT;
      promptModal.style.display = "flex";
    });
    container.querySelector("#rule-ai-prompt-close")?.addEventListener("click", () => {
      container.querySelector("#rule-ai-prompt-modal").style.display = "none";
    });
  }

  // src/webview/page-dsl-reference.ts
  async function renderDslReferenceContent(container) {
    const [schemaResult, funcResult, metricResult] = await Promise.allSettled([
      rpc("getFieldSchema", void 0),
      rpc("getFunctionCatalog", void 0),
      rpc("getMetricList", void 0)
    ]);
    const fields = schemaResult.status === "fulfilled" ? schemaResult.value.fields ?? [] : [];
    const functions = funcResult.status === "fulfilled" ? funcResult.value.functions ?? [] : [];
    const metrics = metricResult.status === "fulfilled" ? metricResult.value.metrics ?? [] : [];
    const functionGroups = groupFunctions(functions);
    render(html2`
    <p class="dsl-ref-intro">This reference lists every field, function, and metric available in the rule DSL. Use it while writing or editing rules to look up field names, check function signatures, browse built-in metrics, and verify which fields each log parser supports.</p>

    <div class="dsl-ref-tabs">
      <button class="dsl-tab active" data-tab="fields">Fields</button>
      <button class="dsl-tab" data-tab="functions">Functions</button>
      <button class="dsl-tab" data-tab="metrics">Metrics</button>
      <button class="dsl-tab" data-tab="parser-coverage">Parser Coverage</button>
    </div>

    <div class="dsl-ref-pane" id="dsl-fields">
      <input type="text" class="ref-search" id="dsl-field-search" placeholder="Search fields..." />
      <table class="dsl-table">
        <thead><tr><th>Name</th><th>Type</th><th>Scope</th><th>Description</th></tr></thead>
        <tbody>
          ${fields.map((f2) => html2`
            <tr class="dsl-field-row">
              <td><code>${f2.name}</code></td>
              <td><span class="dsl-type">${f2.type}</span></td>
              <td><span class="ref-scope">${f2.scope}</span></td>
              <td>${f2.description}</td>
            </tr>
          `)}
        </tbody>
      </table>
    </div>

    <div class="dsl-ref-pane" id="dsl-functions" style="display:none">
      ${functionGroups.map(([cat, fns]) => html2`
        <h4 class="dsl-fn-group">${cat}</h4>
        <table class="dsl-table"><thead><tr><th>Signature</th><th>Description</th></tr></thead><tbody>
          ${fns.map((f2) => html2`<tr><td><code>${f2.signature}</code></td><td>${f2.description}</td></tr>`)}
        </tbody></table>
      `)}
    </div>

    <div class="dsl-ref-pane" id="dsl-metrics" style="display:none">
      <table class="dsl-table">
        <thead><tr><th>ID</th><th>Name</th><th>Scope</th><th>Filter Expression</th></tr></thead>
        <tbody>
          ${metrics.map((m2) => html2`
            <tr>
              <td><code>${m2.id}</code></td>
              <td>${m2.name}</td>
              <td><span class="ref-scope">${m2.scope}</span></td>
              <td><code class="dsl-expr">${m2.filterExpr}</code></td>
            </tr>
          `)}
        </tbody>
      </table>
    </div>

    <div class="dsl-ref-pane" id="dsl-parser-coverage" style="display:none">
      <div class="coverage-loading">Loading parser coverage\u2026</div>
    </div>
  `, container);
    wireDslReferenceContent(container);
  }
  function wireDslReferenceContent(root) {
    let coverageLoaded = false;
    for (const tab of root.querySelectorAll(".dsl-tab")) {
      tab.addEventListener("click", () => {
        for (const t3 of root.querySelectorAll(".dsl-tab")) t3.classList.remove("active");
        tab.classList.add("active");
        const tabName = tab.dataset.tab;
        for (const p2 of root.querySelectorAll(".dsl-ref-pane")) {
          p2.style.display = p2.id === `dsl-${tabName}` ? "" : "none";
        }
        if (tabName === "parser-coverage" && !coverageLoaded) {
          coverageLoaded = true;
          void loadParserCoverage(root);
        }
      });
    }
    const fieldSearch = root.querySelector("#dsl-field-search");
    if (fieldSearch) {
      fieldSearch.addEventListener("input", () => {
        const query = fieldSearch.value.toLowerCase();
        for (const el2 of root.querySelectorAll("#dsl-fields .dsl-field-row")) {
          const text = el2.textContent?.toLowerCase() || "";
          el2.style.display = text.includes(query) ? "" : "none";
        }
      });
    }
  }
  function groupFunctions(functions) {
    const groups = /* @__PURE__ */ new Map();
    for (const f2 of functions) {
      const cat = f2.category || "utility";
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat).push(f2);
    }
    return [...groups.entries()];
  }
  async function loadParserCoverage(root) {
    const pane = root.querySelector("#dsl-parser-coverage");
    if (!pane) return;
    render(html2`<div class="loading-spinner"></div>`, pane);
    let coverageData;
    let previewData = null;
    try {
      coverageData = await rpc("getParserCoverage");
    } catch {
      render(html2`<p class="muted">Failed to load parser coverage data.</p>`, pane);
      return;
    }
    if (coverageData.harnesses.length === 0) {
      render(html2`<p class="muted">No harness data found.</p>`, pane);
      return;
    }
    render(html2`
    <div class="coverage-view-toggle">
      <button class="coverage-toggle-btn active" data-view="matrix">Matrix</button>
      <button class="coverage-toggle-btn" data-view="preview">Preview</button>
    </div>
    <div id="coverage-matrix-view"></div>
    <div id="coverage-preview-view" style="display:none"></div>
  `, pane);
    renderMatrixView(pane.querySelector("#coverage-matrix-view"), coverageData);
    const previewEl = pane.querySelector("#coverage-preview-view");
    const onFieldClick = (fieldName) => {
      void (async () => {
        render(html2`<div class="loading-spinner"></div>`, previewEl);
        try {
          previewData = await rpc("getParserPreview", { focusField: fieldName });
          renderPreviewView(previewEl, previewData, fieldName, onFieldClick);
        } catch {
          render(html2`<p class="muted">Failed to load preview data.</p>`, previewEl);
        }
      })();
    };
    for (const btn of pane.querySelectorAll(".coverage-toggle-btn")) {
      btn.addEventListener("click", () => {
        void (async () => {
          for (const b2 of pane.querySelectorAll(".coverage-toggle-btn")) b2.classList.remove("active");
          btn.classList.add("active");
          const view = btn.dataset.view;
          const matrixEl = pane.querySelector("#coverage-matrix-view");
          if (!matrixEl) return;
          matrixEl.style.display = view === "matrix" ? "" : "none";
          previewEl.style.display = view === "preview" ? "" : "none";
          if (view === "preview" && !previewData) {
            render(html2`<div class="loading-spinner"></div>`, previewEl);
            try {
              previewData = await rpc("getParserPreview");
              renderPreviewView(previewEl, previewData, void 0, onFieldClick);
            } catch {
              render(html2`<p class="muted">Failed to load preview data.</p>`, previewEl);
            }
          }
        })();
      });
    }
  }
  function renderMatrixView(container, data) {
    const catLabels = {
      "core": "Core",
      "enrichment": "Enrichment",
      "auto-computed": "Auto-computed"
    };
    let prevCat = "";
    const rows = [];
    for (const field of data.fields) {
      if (field.category !== prevCat) {
        prevCat = field.category;
        rows.push({ type: "cat", label: catLabels[field.category] ?? field.category });
      }
      rows.push({ type: "field", field });
    }
    render(html2`
    <div class="coverage-legend">
      <span class="coverage-cell coverage-full" style="display:inline-block;padding:2px 6px;border-radius:3px;">\u2713 Full</span>
      <span class="coverage-cell coverage-partial" style="display:inline-block;padding:2px 6px;border-radius:3px;">\u25D0 Partial</span>
      <span class="coverage-cell coverage-low" style="display:inline-block;padding:2px 6px;border-radius:3px;">\u25D0 Low</span>
      <span class="coverage-cell coverage-miss" style="display:inline-block;padding:2px 6px;border-radius:3px;">\u2717 Never</span>
      <span class="coverage-cell coverage-none" style="display:inline-block;padding:2px 6px;border-radius:3px;">\u2014 No data</span>
    </div>
    <div style="overflow-x:auto;">
      <table class="coverage-table">
        <thead>
          <tr>
            <th>Field</th>
            ${data.harnesses.map((h3) => html2`<th>${h3}</th>`)}
          </tr>
        </thead>
        <tbody>
          ${rows.map((row) => {
      if (row.type === "cat") {
        return html2`<tr class="coverage-cat-row"><td colspan=${data.harnesses.length + 1} class="coverage-cat">${row.label}</td></tr>`;
      }
      const field = row.field;
      const autoClass = field.category === "auto-computed" ? "coverage-auto" : "";
      return html2`<tr>
              <td class=${autoClass}>${field.label}</td>
              ${data.harnesses.map((h3) => {
        const cell = data.matrix[field.name]?.[h3];
        if (!cell || cell.total === 0) {
          return html2`<td class="coverage-cell coverage-none" title="No data">\u2014</td>`;
        }
        const ratio = cell.populated / cell.total;
        const isAbsoluteZero = cell.populated === 0;
        const cls = isAbsoluteZero ? "coverage-miss" : ratio < 0.5 ? "coverage-low" : ratio < 1 ? "coverage-partial" : "coverage-full";
        const glyph = isAbsoluteZero ? "\u2717" : ratio < 1 ? "\u25D0" : "\u2713";
        const pctStr = (ratio * 100).toFixed(0) + "%";
        return html2`<td class=${"coverage-cell " + cls} title=${cell.populated + "/" + cell.total + " (" + pctStr + ")"}>${glyph} <small>${pctStr}</small></td>`;
      })}
            </tr>`;
    })}
        </tbody>
      </table>
    </div>
  `, container);
  }
  function renderPreviewView(container, data, focusField, onFieldClick) {
    if (data.samples.length === 0) {
      render(html2`<p class="muted">No sample data available.</p>`, container);
      return;
    }
    const focusLabel = focusField ? data.fields.find((f2) => f2.name === focusField)?.label : null;
    const catLabels = { "core": "Core", "enrichment": "Enrichment", "auto-computed": "Auto-computed" };
    let prevCat = "";
    const rows = [];
    for (const field of data.fields) {
      if (field.category !== prevCat) {
        prevCat = field.category;
        rows.push({ type: "cat", label: catLabels[field.category] ?? field.category });
      }
      rows.push({ type: "field", field });
    }
    render(html2`
    <p class="muted" style="margin-bottom:12px;">Best-populated sample per harness${focusLabel ? html2` <span class="preview-focus-badge">focused: ${focusLabel}</span>` : ""} \u2014 click a field name to find best sample for that field.</p>
    <div style="overflow-x:auto;"><table class="coverage-table preview-table"><thead><tr>
      <th>Field</th>
      ${data.samples.map((sample2) => {
      const pct = (sample2.populatedCount / sample2.totalFields * 100).toFixed(0);
      return html2`<th title=${sample2.workspaceName}>${sample2.harness}<br /><small class="muted">${pct}% populated</small></th>`;
    })}
    </tr></thead><tbody>
      ${rows.map((row) => {
      if (row.type === "cat") {
        return html2`<tr class="coverage-cat-row"><td colspan=${data.samples.length + 1} class="coverage-cat">${row.label}</td></tr>`;
      }
      const field = row.field;
      const isActive = field.name === focusField;
      return html2`<tr>
          <td class=${"preview-field-label" + (isActive ? " preview-field-active" : "")} data-field=${field.name}
            onClick=${() => onFieldClick?.(field.name)}><code>${field.label}</code></td>
          ${data.samples.map((sample2) => {
        const f2 = sample2.fields[field.name];
        if (!f2) return html2`<td class="coverage-cell coverage-none">\u2014</td>`;
        if (f2.populated) return html2`<td class="coverage-cell coverage-full preview-value" title=${f2.value}><span class="preview-val">${f2.value}</span></td>`;
        return html2`<td class="coverage-cell coverage-miss preview-value"><span class="preview-missing">\u2014</span></td>`;
      })}
        </tr>`;
    })}
    </tbody></table></div>
  `, container);
  }

  // src/webview/page-antipatterns.ts
  var GROUP_COLORS2 = {
    "prompt-quality": COLORS.blue,
    "session-hygiene": COLORS.cyan,
    "code-review": COLORS.purple,
    "tool-mastery": COLORS.green,
    "context-management": COLORS.orange
  };
  var GROUP_DESCS = {
    "prompt-quality": "How effectively you write prompts, provide context, and structure tasks for AI.",
    "session-hygiene": "How well you manage session length, pacing, and work-life balance.",
    "code-review": "How carefully you review, validate, and sandbox AI-generated output.",
    "tool-mastery": "How broadly you use AI features, models, and editor capabilities.",
    "context-management": "How well you manage context window size, avoid bloat, and handle compaction."
  };
  var SEVERITY_LABELS = {
    high: { icon: "!", color: "var(--red)", label: "High" },
    medium: { icon: "~", color: "var(--yellow)", label: "Medium" },
    low: { icon: "-", color: "var(--text-muted)", label: "Low" }
  };
  var SOURCE_STYLES = {
    "built-in": { icon: "B", color: "var(--text-muted)", label: "Built-in" },
    "personal": { icon: "P", color: COLORS.blue, label: "Personal" },
    "project": { icon: "W", color: COLORS.green, label: "Project" }
  };
  function toEventListener(handler) {
    return (event) => {
      void handler(event);
    };
  }
  function getDatasetValue(element, key) {
    const value = element.dataset[key];
    return typeof value === "string" && value.length > 0 ? value : null;
  }
  function severityIcon(sev) {
    if (sev === "high") return html2`<span class="sev-icon sev-high" title="High impact">!</span>`;
    if (sev === "medium") return html2`<span class="sev-icon sev-medium" title="Medium impact">~</span>`;
    return html2`<span class="sev-icon sev-low" title="Low impact">-</span>`;
  }
  function severityBadge(sev) {
    const s2 = SEVERITY_LABELS[sev] || SEVERITY_LABELS.low;
    return html2`<span class="rule-severity-badge" style="--sev-color:${s2.color}" title="${s2.label} severity">${s2.icon} ${s2.label}</span>`;
  }
  function sourceBadge(source) {
    const s2 = SOURCE_STYLES[source] || SOURCE_STYLES["built-in"];
    return html2`<span class="rule-source-badge" style="--src-color:${s2.color}" title="${s2.label} rule">${s2.label}</span>`;
  }
  function statPill(label, value, color2) {
    return html2`<span class="rule-stat-pill" style=${color2 ? `color:${color2}` : void 0}><span class="rule-stat-value">${value}</span><span class="rule-stat-label">${label}</span></span>`;
  }
  function sparklineSvg(scores, color2) {
    const MAX_WEEKS = 8;
    const pts = scores.slice(-MAX_WEEKS);
    if (pts.length < 2) return null;
    const w2 = 120, h3 = 32, pad = 2;
    const dataMin = Math.min(...pts);
    const dataMax = Math.max(...pts);
    const range = dataMax - dataMin;
    const yPad = Math.max(5, range * 0.2);
    const minV = Math.max(0, dataMin - yPad);
    const maxV = Math.min(100, dataMax + yPad);
    const span = maxV - minV || 1;
    const stepX = (w2 - pad * 2) / (pts.length - 1);
    const coords = pts.map((v2, i2) => {
      const x2 = pad + i2 * stepX;
      const y2 = pad + (1 - (v2 - minV) / span) * (h3 - pad * 2);
      return `${x2},${y2}`;
    });
    const last = pts[pts.length - 1];
    const lastX = pad + (pts.length - 1) * stepX;
    const lastY = pad + (1 - (last - minV) / span) * (h3 - pad * 2);
    return html2`<svg class="sparkline" width=${w2} height=${h3} viewBox=${"0 0 " + w2 + " " + h3}>
    <polyline points=${coords.join(" ")} fill="none" stroke=${color2} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx=${lastX} cy=${lastY} r="2.5" fill=${color2}/>
  </svg>`;
  }
  function miniHistogramSvg(counts, labels, color2) {
    if (counts.length === 0) return null;
    const max2 = Math.max(...counts, 1);
    const w2 = 140, h3 = 36, pad = 2;
    const barW = Math.max(4, (w2 - pad * 2 - (counts.length - 1)) / counts.length);
    const gap = 1;
    const bars = counts.map((count, i2) => {
      const barH = Math.max(1, count / max2 * (h3 - pad * 2 - 10));
      const x2 = pad + i2 * (barW + gap);
      const y2 = h3 - pad - barH;
      const opacity = count > 0 ? 0.85 : 0.15;
      return html2`<rect x=${x2} y=${y2} width=${barW} height=${barH} rx="1" fill=${color2} opacity=${opacity}><title>${(labels[i2] || "") + ": " + count}</title></rect>`;
    });
    return html2`<svg class="mini-histogram" width=${w2} height=${h3} viewBox=${"0 0 " + w2 + " " + h3}>${bars}</svg>`;
  }
  function thresholdRow(key, value, ruleId) {
    return html2`<div class="rule-threshold-row">
    <label class="rule-threshold-label">${key}</label>
    <input type="number" class="rule-threshold-input" data-rule=${ruleId} data-key=${key} value=${value} step="any" />
  </div>`;
  }
  async function renderAntiPatterns(container, currentFilter2) {
    const [apData, ruleData] = await Promise.all([
      rpc("getAntiPatterns", currentFilter2),
      rpc("getRuleEditor", currentFilter2)
    ]);
    const patterns = apData.patterns || [];
    const scores = apData.groupScores || [];
    const rules = ruleData.rules || [];
    const previews = ruleData.previews || [];
    const layers = ruleData.layers || [];
    const pending = ruleData.pending || [];
    const previewMap = new Map(previews.map((p2) => [p2.ruleId, p2]));
    const dateHistograms = ruleData.dateHistograms || {};
    const grouped = /* @__PURE__ */ new Map();
    for (const p2 of patterns) {
      if (!grouped.has(p2.group)) grouped.set(p2.group, []);
      grouped.get(p2.group).push(p2);
    }
    const triggeredRules = previews.filter((p2) => p2.triggered).length;
    render(html2`<div>
    <div class="ap-page-header">
      <h1>Anti-Patterns</h1>
      <p class="ap-page-intro">Review health scores across practice groups, drill into individual findings, and manage the rules that detect them. Switch to the <strong>Rules</strong> tab to browse, create, or edit detection rules using the built-in DSL.</p>
    </div>

    <div class="ap-tab-bar">
      <button class="ap-tab active" data-tab="antipatterns">Anti-Patterns <span class="ap-tab-badge">${patterns.length}</span></button>
      <button class="ap-tab" data-tab="rules">Rules <span class="ap-tab-badge">${rules.length}</span></button>
    </div>

    <!-- Tab: Anti-Patterns -->
    <div class="ap-tab-content" id="tab-antipatterns">
      <div class="ap-score-grid">
        ${scores.map((g2) => {
      const color2 = scoreColor(g2.score);
      const name = PRACTICE_GROUPS[g2.group];
      const series = apData.weeklyScores?.series.find((s2) => s2.group === g2.group);
      const spark = series ? sparklineSvg(series.scores, GROUP_COLORS2[g2.group]) : null;
      return html2`
            <div class="ap-score-card" data-group="${g2.group}">
              <div class="ap-score-card-top">
                <${ScoreRing} score=${g2.score} color=${color2} size=${64} />
                <div>
                  <div class="ap-score-card-name">${name}</div>
                  <div class="ap-score-card-label" style="color:${color2}">${scoreLabel(g2.score, "antipatterns")}</div>
                  <div class="ap-score-deltas">
                    <${PctBadge} pct=${g2.wowPct} label="WoW" /><${PctBadge} pct=${g2.momPct} label="MoM" />
                  </div>
                </div>
              </div>
              ${spark ? html2`<div class="ap-sparkline-row">${spark}</div>` : null}
              ${g2.improvements.length > 0 ? html2`<div class="ap-score-tip ap-improvements">${g2.improvements.map((i2) => html2`<span>${i2}</span>`)}</div>` : g2.topIssue ? html2`<div class="ap-score-tip">${g2.topIssue}</div>` : html2`<div class="ap-score-tip muted">No issues detected</div>`}
            </div>`;
    })}
      </div>
      <div id="apDetails" style="margin-top: 1.5rem;"></div>
    </div>

    <!-- Tab: Rules -->
    <div class="ap-tab-content" id="tab-rules" style="display:none;">
      <div class="ap-rules-header" id="ap-rules-header">
        <div class="ap-rules-title-row">
          <div class="ap-rules-stats">
          ${statPill("Total", rules.length)}${statPill("Triggered", triggeredRules, triggeredRules > 0 ? "var(--yellow)" : "var(--green)")}
          </div>
        </div>
        <div class="ap-rules-actions">
          <button class="rule-btn rule-btn-secondary" id="rule-dsl-ref-btn" title="DSL field, function & parser reference">DSL Reference</button>
          <button class="rule-btn rule-btn-secondary" id="rule-coverage-btn" title="Rule x workspace coverage heatmap">Coverage</button>
          <button class="rule-btn rule-btn-secondary" id="rule-help-btn" title="How rule layers work">? Help</button>
          <button class="rule-btn rule-btn-primary" id="rule-new-btn" title="Create a new custom rule">+ New Rule</button>
        </div>
      </div>

      <div class="rule-search-bar" id="rule-search-bar">
        <input type="text" class="rule-search-input" id="rule-search" placeholder="Search rules by name, group, or tag..." />
        <label class="rule-filter-chip" title="Show only personal + project rules">
          <input type="checkbox" id="rule-filter-local" />
          Local only
        </label>
      </div>

      ${pending.length > 0 ? html2`
      <div class="rule-pending-banner" id="rule-pending-banner">
        <div class="rule-pending-text">
          <strong>${pending.length}</strong> local rule file${pending.length === 1 ? "" : "s"} blocked pending approval.
          These files are present on disk but haven't been approved to run.
          <ul class="rule-pending-list">
            ${pending.slice(0, 5).map((p2) => html2`<li><code>[${p2.layer}/${p2.kind}]</code> ${p2.filePath}</li>`)}
            ${pending.length > 5 ? html2`<li class="muted">+${pending.length - 5} more</li>` : null}
          </ul>
        </div>
        <button class="rule-btn rule-btn-primary" id="rule-review-pending-btn">Review & Approve</button>
      </div>` : null}

      <div class="rule-list" id="rule-list">
        ${renderGroupedRuleCards(rules, previewMap, dateHistograms)}
      </div>

      <!-- Detail panel (hidden by default) -->
      <div class="rule-detail-panel" id="rule-detail-panel" style="display:none;">
        <div class="rule-detail-header">
          <button class="rule-btn rule-btn-back" id="rule-back-btn">${"\u2190"} Back</button>
          <div class="rule-detail-actions">
            <button class="rule-btn rule-btn-secondary" id="rule-edit-source-btn">Edit Source</button>
          </div>
        </div>
        <div id="rule-detail-content"></div>
      </div>
    </div>

    <!-- Unified Rule Editor modal -->
    <div class="rule-source-modal" id="rule-editor-modal" style="display:none;">
      <div class="rule-editor-modal-content">
        <div class="rule-editor-modal-header">
          <h3 id="rule-editor-modal-title">New Rule</h3>
          <div class="rule-editor-modal-tabs">
            <button class="rule-editor-tab active" data-editor-tab="form">Form</button>
            <button class="rule-editor-tab" data-editor-tab="source">Source</button>
          </div>
          <button class="rule-btn rule-btn-secondary" id="rule-editor-close">${"\xD7"}</button>
        </div>

        <!-- AI Assist bar -->
        <div class="rule-ai-bar">
          <input type="text" class="rule-ai-input" id="rule-ai-input"
            placeholder="Describe the anti-pattern to detect... AI will fill the form" />
          <button class="rule-btn rule-btn-ai" id="rule-ai-generate">Generate</button>
          <button class="rule-btn rule-btn-secondary rule-ai-prompt-info" id="rule-ai-prompt-info" title="View the prompt sent to AI">?</button>
        </div>
        <div class="rule-ai-status" id="rule-ai-status" style="display:none;"></div>

        <!-- Form view -->
        <div class="rule-editor-body" id="rule-editor-form" data-editor-panel="form">
          <div class="rule-form-row rule-form-row-2">
            <div class="rule-form-field">
              <label>Rule ID</label>
              <input type="text" id="rf-id" placeholder="my-custom-rule" spellcheck="false" />
            </div>
            <div class="rule-form-field">
              <label>Name</label>
              <input type="text" id="rf-name" placeholder="My Custom Rule" />
            </div>
          </div>
          <div class="rule-form-row rule-form-row-4">
            <div class="rule-form-field">
              <label>Group</label>
              <select id="rf-group">
                <option value="prompt-quality">Prompt Quality</option>
                <option value="session-hygiene">Session Hygiene</option>
                <option value="code-review">Code Review</option>
                <option value="tool-mastery">Tool Mastery</option>
                <option value="context-management">Context Management</option>
              </select>
            </div>
            <div class="rule-form-field">
              <label>Severity</label>
              <select id="rf-severity">
                <option value="low">Low</option>
                <option value="medium" selected>Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div class="rule-form-field">
              <label>Scope</label>
              <select id="rf-scope">
                <option value="requests">Requests</option>
                <option value="sessions">Sessions</option>
              </select>
            </div>
            <div class="rule-form-field">
              <label>Version</label>
              <input type="number" id="rf-version" value="1" min="1" />
            </div>
          </div>
          <div class="rule-form-field">
            <label>Tags <span class="muted">(comma-separated)</span></label>
            <input type="text" id="rf-tags" placeholder="custom, prompt, quality" />
          </div>
          <div class="rule-form-field">
            <label>Description</label>
            <textarea id="rf-description" rows="2" placeholder="What this rule detects."></textarea>
          </div>
          <div class="rule-form-field">
            <label>When Triggered <span class="muted">${"(use {{count}}, {{total}}, {{pct}}, {{extra.key}})"}</span></label>
            <textarea id="rf-when-triggered" rows="2" placeholder="${"{{count}} occurrences detected out of {{total}} ({{pct}})."}"></textarea>
          </div>
          <div class="rule-form-field">
            <label>How to Improve</label>
            <textarea id="rf-how-to-improve" rows="2" placeholder="Actionable advice for the user."></textarea>
          </div>
          <div class="rule-form-field">
            <label>Examples Template</label>
            <input type="text" id="rf-examples" placeholder=${'"{{message}}..."'} />
          </div>
          <div class="rule-form-field">
            <label>Thresholds <span class="muted">(key: value, one per line)</span></label>
            <textarea id="rf-thresholds" rows="2" placeholder="myThreshold: 0.5" class="rule-mono"></textarea>
          </div>
          <div class="rule-form-field">
            <label>Detection Logic <span class="muted">(DSL)</span></label>
            <textarea id="rf-detect" rows="8" class="rule-mono" spellcheck="false" placeholder=${'scan: requests\nmatch: messageLength > 0\naggregate: count\ncheck: count >= thresholds.myThreshold\nexamples: "{{messageText | truncate:60}}"'}></textarea>
          </div>
          <textarea id="rf-patterns" style="display:none"></textarea>
          <textarea id="rf-filetypes" style="display:none"></textarea>
          <textarea id="rf-extra-fm" style="display:none"></textarea>
        </div>

        <!-- Source view -->
        <div class="rule-editor-body" id="rule-editor-source" data-editor-panel="source" style="display:none;">
          <textarea class="rule-source-editor rule-source-full" id="rule-editor-raw" spellcheck="false"></textarea>
        </div>

        <!-- Test results area -->
        <div class="rule-test-results" id="rule-test-results" style="display:none;"></div>

        <div class="rule-editor-footer">
          <button class="rule-btn rule-btn-secondary" id="rule-editor-cancel">Cancel</button>
          <button class="rule-btn rule-btn-test" id="rule-editor-test">Test Rule</button>
          <button class="rule-btn rule-btn-primary" id="rule-editor-save">Save Rule</button>
        </div>
      </div>
    </div>

    <!-- AI Prompt viewer modal -->
    <div class="rule-source-modal" id="rule-ai-prompt-modal" style="display:none;">
      <div class="rule-source-modal-content">
        <div class="rule-source-modal-header">
          <h3>AI System Prompt</h3>
          <button class="rule-btn rule-btn-secondary" id="rule-ai-prompt-close">${"\xD7"}</button>
        </div>
        <pre class="rule-ai-prompt-view" id="rule-ai-prompt-view"></pre>
      </div>
    </div>

    <!-- DSL Reference modal -->
    <div class="rule-source-modal" id="rule-dsl-ref-modal" style="display:none;">
      <div class="rule-source-modal-content rule-dsl-ref-content">
        <div class="rule-source-modal-header">
          <h3>DSL Reference</h3>
          <button class="rule-btn rule-btn-secondary" id="rule-dsl-ref-close">${"\xD7"}</button>
        </div>
        <div class="rule-dsl-ref-body" id="rule-dsl-ref-body">
          <div class="loading-spinner"></div>
        </div>
      </div>
    </div>

    <!-- Coverage heatmap modal -->
    <div class="rule-source-modal" id="rule-coverage-modal" style="display:none;">
      <div class="rule-source-modal-content rule-coverage-content">
        <div class="rule-source-modal-header">
          <h3>Rule Coverage Heatmap</h3>
          <button class="rule-btn rule-btn-secondary" id="rule-coverage-close">${"\xD7"}</button>
        </div>
        <div class="rule-coverage-body" id="rule-coverage-body">
          <div class="rule-coverage-loading">Loading...</div>
        </div>
      </div>
    </div>

    <!-- Help modal -->
    <div class="rule-source-modal" id="rule-help-modal" style="display:none;">
      <div class="rule-source-modal-content rule-help-content">
        <div class="rule-source-modal-header">
          <h3>Rule Layers</h3>
          <button class="rule-btn rule-btn-secondary" id="rule-help-close">${"\xD7"}</button>
        </div>
        <div class="rule-help-body">
          <p>Rules are loaded from three layers. Higher layers override lower ones when rule IDs match.</p>
          <div class="rule-help-layers">
            <div class="rule-help-layer">
              <div class="rule-help-layer-header">
                <span class="rule-source-badge" style="--src-color:${COLORS.green}">Project</span>
                <span class="rule-help-precedence">Highest priority</span>
              </div>
              <p>Workspace-specific rules. Shared with your team via version control.</p>
              <code class="rule-help-path">${"<workspace>/.ai-engineer-coach/rules/*.md"}</code>
              ${renderLayerStatus(layers, "project")}
            </div>
            <div class="rule-help-layer">
              <div class="rule-help-layer-header">
                <span class="rule-source-badge" style="--src-color:${COLORS.blue}">Personal</span>
                <span class="rule-help-precedence">Medium priority</span>
              </div>
              <p>Your personal rules. Applied across all workspaces on this machine.</p>
              <code class="rule-help-path">~/.ai-engineer-coach/rules/*.md</code>
              ${renderLayerStatus(layers, "personal")}
            </div>
            <div class="rule-help-layer">
              <div class="rule-help-layer-header">
                <span class="rule-source-badge" style="--src-color:var(--text-muted)">Built-in</span>
                <span class="rule-help-precedence">Lowest priority</span>
              </div>
              <p>Default rules shipped with the extension. Always available.</p>
              ${renderLayerStatus(layers, "built-in")}
            </div>
          </div>
          <div class="rule-help-howto">
            <h4>Creating a custom rule</h4>
            <p>Create a <code>.md</code> file in any rule directory above. The filename (without extension) becomes the rule ID.</p>
            <p>To override a built-in rule, create a file with the same name (e.g. <code>lazy-prompting.md</code>) in your personal or project rules directory.</p>
          </div>
        </div>
      </div>
    </div>
  </div>`, container);
    renderFindings(container, scores, grouped, apData);
    wireTabBar(container);
    wireRulesSection(container, rules, previewMap, currentFilter2);
  }
  function wireTabBar(container) {
    const tabs = container.querySelectorAll(".ap-tab");
    const panels = container.querySelectorAll(".ap-tab-content");
    for (const tab of tabs) {
      tab.addEventListener("click", () => {
        const target = tab.dataset.tab;
        for (const t3 of tabs) t3.classList.remove("active");
        tab.classList.add("active");
        for (const p2 of panels) {
          p2.style.display = p2.id === `tab-${target}` ? "" : "none";
        }
      });
    }
  }
  function renderFindings(container, scores, grouped, _apData) {
    const detailsContainer = container.querySelector("#apDetails");
    const allGroupKeys = ["prompt-quality", "session-hygiene", "code-review", "tool-mastery"];
    for (const groupKey of allGroupKeys) {
      const gs = scores.find((s2) => s2.group === groupKey);
      const groupPatterns = grouped.get(groupKey) || [];
      const groupName = PRACTICE_GROUPS[groupKey];
      const groupColor = GROUP_COLORS2[groupKey];
      const groupDesc = GROUP_DESCS[groupKey];
      const score = gs?.score ?? 100;
      const summaryColor = scoreColor(score);
      const section = el("details", "ap-group-details");
      render(html2`
      <summary class="ap-group-summary">
        <div class="ap-group-summary-left">
          <span class="ap-group-dot" style="background:${groupColor}"></span>
          <span class="ap-group-name">${groupName}</span>
          <span class="ap-group-score" style="color:${summaryColor}">${score}/100</span>
        </div>
        <div class="ap-group-summary-right">
          <span class="muted">${groupPatterns.length} finding${groupPatterns.length !== 1 ? "s" : ""}</span>
          <span class="ap-expand-hint">${"\u25BE"}</span>
        </div>
      </summary>
      <p class="ap-group-desc">${groupDesc}</p>
    `, section);
      if (groupPatterns.length === 0) {
        const good = el("div", "ap-group-clean");
        good.textContent = "All checks passing -- no anti-patterns detected.";
        section.appendChild(good);
      } else {
        if (gs && gs.improvements.length > 0) {
          const banner = el("div", "ap-improvements-banner");
          render(html2`<span>${gs.improvements.map((i2) => html2`<div class="ap-improvement-item">${i2}</div>`)}</span>`, banner);
          section.appendChild(banner);
        }
        for (const p2 of groupPatterns) {
          const card = el("div", "ap-finding");
          render(html2`<span>
          <div class="ap-finding-header">
            ${severityIcon(p2.severity)}
            <span class="ap-finding-name">${p2.name}</span>
          </div>
          <div class="ap-finding-body">
            <div class="ap-finding-section ap-finding-problem">
              <span class="ap-finding-label">Problem</span>
              <span>${p2.description}</span>
            </div>
            <div class="ap-finding-section ap-finding-action">
              <span class="ap-finding-label">Action</span>
              <span>${p2.suggestion}</span>
            </div>
            ${renderOccurrencePanel(p2)}
          </div>
        </span>`, card);
          section.appendChild(card);
        }
      }
      detailsContainer.appendChild(section);
    }
    const hint = consumeNavHint();
    if (hint) {
      const allDetails = detailsContainer.querySelectorAll(".ap-group-details");
      const groupIndex = allGroupKeys.indexOf(hint);
      if (groupIndex >= 0 && allDetails[groupIndex]) {
        allDetails[groupIndex].open = true;
        setTimeout(() => allDetails[groupIndex].scrollIntoView({ behavior: "smooth", block: "start" }), 100);
      }
    }
    wireExplainButtons(container, _apData);
  }
  async function explainOccurrence(button, filter) {
    const ruleId = getDatasetValue(button, "ruleId");
    const sessionId = getDatasetValue(button, "sessionId");
    if (!ruleId || !sessionId) return;
    const row = button.closest(".occ-session-row");
    const resultDiv = row?.querySelector(".occ-explain-result");
    if (!resultDiv) return;
    if (resultDiv.style.display === "" && resultDiv.dataset.loaded === "true") {
      resultDiv.style.display = "none";
      return;
    }
    button.disabled = true;
    button.textContent = "Thinking...";
    resultDiv.style.display = "";
    resultDiv.className = "occ-explain-result occ-explain-loading";
    resultDiv.textContent = "Asking AI for an explanation...";
    try {
      const request = {
        ruleId,
        sessionId
      };
      if (filter) {
        request.filter = filter;
      }
      const res = await rpc("explainOccurrence", request);
      if (res.ok) {
        resultDiv.className = "occ-explain-result occ-explain-ok";
        const lines = res.explanation.split("\n");
        render(html2`<span>${lines.map((line, i2) => html2`<span>${line}${i2 < lines.length - 1 ? html2`<br/>` : null}</span>`)}</span>`, resultDiv);
        resultDiv.dataset.loaded = "true";
      } else {
        resultDiv.className = "occ-explain-result occ-explain-error";
        resultDiv.textContent = res.error || "Failed to get explanation.";
      }
    } catch (err) {
      resultDiv.className = "occ-explain-result occ-explain-error";
      resultDiv.textContent = err instanceof Error ? err.message : String(err);
    } finally {
      button.disabled = false;
      button.textContent = "Why?";
    }
  }
  function wireExplainButtons(container, _apData) {
    const handleExplainClick = async (e2) => {
      const target = e2.target;
      if (!(target instanceof HTMLElement)) return;
      const button = target.closest(".occ-explain-btn");
      if (!button) return;
      e2.preventDefault();
      e2.stopPropagation();
      await explainOccurrence(button);
    };
    const handler = toEventListener(handleExplainClick);
    const key = "__explainHandler";
    const prev = container[key];
    if (prev) container.removeEventListener("click", prev);
    container.addEventListener("click", handler);
    container[key] = handler;
  }
  function formatOccDate(ts) {
    if (ts <= 0) return "";
    const d2 = new Date(ts);
    return d2.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  function formatOccTime(ts) {
    if (ts <= 0) return "";
    const d2 = new Date(ts);
    return d2.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  function occHistogramSvg(hist, color2) {
    const { labels, counts } = hist;
    if (counts.length === 0) return null;
    const max2 = Math.max(...counts, 1);
    const w2 = 240, h3 = 48, pad = 2;
    const barW = Math.max(6, (w2 - pad * 2 - (counts.length - 1) * 2) / counts.length);
    const gap = 2;
    const bars = [];
    for (let i2 = 0; i2 < counts.length; i2++) {
      const count = counts[i2];
      const barH = Math.max(1, count / max2 * (h3 - pad * 2 - 12));
      const x2 = pad + i2 * (barW + gap);
      const y2 = h3 - pad - barH - 10;
      const opacity = count > 0 ? 0.9 : 0.15;
      const shortLabel = labels[i2]?.replace(/^\d{4}-W/, "W") || "";
      bars.push(html2`<rect x=${x2} y=${y2} width=${barW} height=${barH} rx="2" fill=${color2} opacity=${opacity}><title>${shortLabel + ": " + count}</title></rect>`);
      if (i2 === 0 || i2 === counts.length - 1 || counts.length > 4 && i2 === Math.floor(counts.length / 2)) {
        bars.push(html2`<text x=${x2 + barW / 2} y=${h3 - 1} text-anchor="middle" fill="var(--text-muted)" font-size="7" font-family="var(--vscode-font-family, sans-serif)">${shortLabel}</text>`);
      }
    }
    return html2`<svg class="occ-histogram" width=${w2} height=${h3} viewBox=${"0 0 " + w2 + " " + h3}>${bars}</svg>`;
  }
  function renderExamplesBlock(examples) {
    if (examples.length === 0) return null;
    return html2`
    <details class="ap-examples">
      <summary>${examples.length} example${examples.length !== 1 ? "s" : ""}</summary>
      <ul>${examples.map((ex) => html2`<li>${ex}</li>`)}</ul>
    </details>`;
  }
  function renderOccurrencePanel(p2) {
    const details = p2.details || [];
    const hist = p2.weeklyHist;
    const hasHist = hist && hist.counts.length > 0;
    if (details.length === 0 && !hasHist) {
      return renderExamplesBlock(p2.examples);
    }
    const color2 = GROUP_COLORS2[p2.group] || COLORS.blue;
    const histVNode = hasHist ? occHistogramSvg(hist, color2) : null;
    const isWorkspaceLevel = details.length > 0 && details[0].kind === "workspace";
    if (isWorkspaceLevel) {
      return renderWorkspaceOccurrences(p2, details, histVNode, color2);
    }
    return renderSessionOccurrences(p2, details, histVNode);
  }
  function renderWorkspaceOccurrences(p2, details, histVNode, color2) {
    const hasFlaggedMetric = details.some((d2) => d2.stats?.isLow !== void 0 || d2.stats?.ratio !== void 0);
    const flagged = hasFlaggedMetric ? details.filter((d2) => d2.stats?.isLow || d2.stats?.ratio !== void 0 && d2.stats.ratio < 0.05) : details;
    const healthy = hasFlaggedMetric ? details.filter((d2) => !flagged.includes(d2)) : [];
    const displayFlagged = flagged.slice(0, 30);
    const displayHealthy = healthy.slice(0, 10);
    function wsBar(d2) {
      const s2 = d2.stats || {};
      const codeLoc = s2.codeLoc ?? s2.code ?? 0;
      const mdLoc = s2.mdLoc ?? s2.md ?? 0;
      const total = codeLoc + mdLoc;
      const pct = total > 0 ? Math.round(mdLoc / total * 100) : 0;
      const truncName = d2.workspace.length > 35 ? d2.workspace.substring(0, 33) + "..." : d2.workspace;
      const statsLabel = total > 0 ? `${fmtK(codeLoc)} code, ${fmtK(mdLoc)} md (${pct}%)` : Object.entries(s2).filter(([k2]) => k2 !== "isLow" && k2 !== "ratio").map(([k2, v2]) => `${k2}: ${fmtK(v2)}`).join(", ");
      const isFlagged = hasFlaggedMetric ? pct < 5 && total > 0 : true;
      return html2`
      <div class="occ-ws-row ${isFlagged ? "occ-ws-flagged" : ""}">
        <div class="occ-ws-header">
          <span class="occ-ws-name">${truncName}</span>
          <span class="occ-ws-stats">${statsLabel}</span>
        </div>
        ${d2.message ? html2`<div class="occ-ws-message">${d2.message}</div>` : null}
        ${total > 0 ? html2`<div class="occ-ws-bar"><div class="occ-ws-bar-fill" style=${"width:" + Math.max(pct, 1) + "%;background:" + color2}></div></div>` : null}
      </div>`;
    }
    const totalWs = details.length;
    const moreCount = flagged.length - displayFlagged.length + healthy.length - displayHealthy.length;
    return html2`
    <details class="ap-occurrences">
      <summary class="ap-occ-summary">
        <span>${p2.occurrences} workspace${p2.occurrences !== 1 ? "s" : ""} affected out of ${totalWs}</span>
        ${histVNode}
      </summary>
      <div class="ap-occ-body">
        <div class="occ-ws-list">
          ${displayFlagged.map(wsBar)}
          ${displayHealthy.length > 0 ? html2`<div class="occ-ws-divider">Healthy workspaces</div>${displayHealthy.map(wsBar)}` : null}
          ${moreCount > 0 ? html2`<div class="occ-session-more">+ ${moreCount} more workspaces</div>` : null}
        </div>
        ${renderExamplesBlock(p2.examples)}
      </div>
    </details>`;
  }
  function fmtK(n3) {
    if (n3 >= 1e3) return (n3 / 1e3).toFixed(1).replace(/\.0$/, "") + "k";
    return String(n3);
  }
  function renderSessionOccurrences(p2, details, histVNode) {
    const sessionMap = /* @__PURE__ */ new Map();
    for (const d2 of details) {
      const key = d2.sessionId || d2.workspace || "unknown";
      if (!sessionMap.has(key)) {
        sessionMap.set(key, { workspace: d2.workspace, count: 0, firstTs: d2.timestamp, lastTs: d2.timestamp, messages: [] });
      }
      const entry = sessionMap.get(key);
      entry.count++;
      if (d2.timestamp > 0) {
        if (d2.timestamp < entry.firstTs || entry.firstTs <= 0) entry.firstTs = d2.timestamp;
        if (d2.timestamp > entry.lastTs) entry.lastTs = d2.timestamp;
      }
      if (d2.message && entry.messages.length < 3) entry.messages.push(d2.message);
    }
    const sessionEntries = [...sessionMap.entries()].sort((a2, b2) => b2[1].lastTs - a2[1].lastTs);
    const displayCount = Math.min(sessionEntries.length, 15);
    const totalSessions = sessionEntries.length;
    const sessionItems = sessionEntries.slice(0, displayCount).map(([sid, info]) => {
      const dateStr = formatOccDate(info.lastTs);
      const timeStr = formatOccTime(info.lastTs);
      const truncWs = info.workspace.length > 30 ? info.workspace.substring(0, 28) + "..." : info.workspace;
      return html2`
      <div class="occ-session-row" title=${sid}>
        <div class="occ-session-meta">
          <span class="occ-session-ws">${truncWs}</span>
          <span class="occ-session-date">${dateStr} ${timeStr}</span>
          <span class="occ-session-count">${info.count}x</span>
          ${llmAvailable() ? html2`<button class="occ-explain-btn" data-rule-id=${p2.id} data-session-id=${sid} title="Ask AI why this session triggered the rule">Why?</button>` : null}
        </div>
        ${info.messages.length > 0 ? html2`<div class="occ-msg-preview">${info.messages.map((m2) => html2`<span>${m2.length > 80 ? m2.substring(0, 78) + "..." : m2}</span>`)}</div>` : null}
        <div class="occ-explain-result" data-session-id=${sid} style="display:none;"></div>
      </div>`;
    });
    return html2`
    <details class="ap-occurrences">
      <summary class="ap-occ-summary">
        <span>${p2.occurrences} occurrence${p2.occurrences !== 1 ? "s" : ""} across ${totalSessions} session${totalSessions !== 1 ? "s" : ""}</span>
        ${histVNode}
      </summary>
      <div class="ap-occ-body">
        <div class="occ-session-list">
          ${sessionItems}
          ${totalSessions > displayCount ? html2`<div class="occ-session-more">+ ${totalSessions - displayCount} more sessions</div>` : null}
        </div>
        ${renderExamplesBlock(p2.examples)}
      </div>
    </details>`;
  }
  function renderGroupedRuleCards(rules, previewMap, dateHistograms) {
    const groups = ["prompt-quality", "session-hygiene", "code-review", "tool-mastery", "context-management"];
    const byGroup = /* @__PURE__ */ new Map();
    for (const r2 of rules) {
      if (!byGroup.has(r2.group)) byGroup.set(r2.group, []);
      byGroup.get(r2.group).push(r2);
    }
    return html2`${groups.map((group2) => {
      const groupRules = byGroup.get(group2);
      if (!groupRules || groupRules.length === 0) return null;
      const groupName = PRACTICE_GROUPS[group2];
      const groupColor = GROUP_COLORS2[group2];
      const triggeredCount = groupRules.filter((r2) => previewMap.get(r2.id)?.triggered).length;
      return html2`
      <div class="rule-group-section" data-group=${group2}>
        <div class="rule-group-header">
          <span class="rule-group-dot" style="background:${groupColor}"></span>
          <span class="rule-group-name">${groupName}</span>
          <span class="rule-group-count">${groupRules.length} rules</span>
          ${triggeredCount > 0 ? html2`<span class="rule-group-triggered">${triggeredCount} triggered</span>` : null}
        </div>
        <div class="rule-cards">
          ${groupRules.map((r2) => renderRuleCard(r2, previewMap.get(r2.id), dateHistograms[r2.id], groupColor))}
        </div>
      </div>
    `;
    })}`;
  }
  function renderRuleCard(rule, preview, histogram, groupColor) {
    const triggered = preview?.triggered ?? false;
    const occurrences = preview?.occurrences ?? 0;
    const total = preview?.total ?? 0;
    const pct = preview?.pct ?? 0;
    const statusClass = triggered ? "rule-card-triggered" : "rule-card-clean";
    const histSvg = histogram ? miniHistogramSvg(histogram.counts, histogram.labels, triggered ? COLORS.yellow : groupColor) : null;
    return html2`
    <div class="rule-card ${statusClass}" data-rule-id=${rule.id} data-tags=${rule.tags.join(",")} data-name=${rule.name.toLowerCase()} data-source=${rule.source}>
      <div class="rule-card-top">
        <div class="rule-card-name-row">
          <span class="rule-card-name">${rule.name}</span>
          ${severityBadge(rule.severity)}
          ${sourceBadge(rule.source)}
        </div>
        <div class="rule-card-desc">${rule.description}</div>
      </div>
      <div class="rule-card-bottom">
        <div class="rule-card-stats">
          <div class="rule-card-stat">
            <span class="rule-card-stat-value ${triggered ? "stat-warn" : "stat-ok"}">${occurrences}</span>
            <span class="rule-card-stat-label">flagged</span>
          </div>
          <div class="rule-card-stat">
            <span class="rule-card-stat-value">${total}</span>
            <span class="rule-card-stat-label">total</span>
          </div>
          <div class="rule-card-stat">
            <span class="rule-card-stat-value ${triggered ? "stat-warn" : "stat-ok"}">${pct}%</span>
            <span class="rule-card-stat-label">rate</span>
          </div>
        </div>
        ${histSvg ? html2`<div class="rule-card-histogram" title="Weekly trend">${histSvg}</div>` : null}
      </div>
    </div>
  `;
  }
  function wireRulesSection(container, rules, previewMap, currentFilter2) {
    const searchInput = container.querySelector("#rule-search");
    const localOnly = container.querySelector("#rule-filter-local");
    const applyFilters = () => {
      const query = (searchInput?.value || "").toLowerCase();
      const localOnlyActive = !!localOnly?.checked;
      const cards = container.querySelectorAll(".rule-card");
      const sections = container.querySelectorAll(".rule-group-section");
      for (const card of cards) {
        const name = getDatasetValue(card, "name") || "";
        const tags = getDatasetValue(card, "tags") || "";
        const ruleId = getDatasetValue(card, "ruleId") || "";
        const source = getDatasetValue(card, "source") || "";
        const matchesQuery = !query || name.includes(query) || tags.includes(query) || ruleId.includes(query);
        const matchesLocal = !localOnlyActive || source === "personal" || source === "project";
        card.style.display = matchesQuery && matchesLocal ? "" : "none";
      }
      for (const section of sections) {
        const visible = section.querySelectorAll('.rule-card:not([style*="display: none"])');
        section.style.display = visible.length > 0 ? "" : "none";
      }
    };
    searchInput?.addEventListener("input", applyFilters);
    localOnly?.addEventListener("change", applyFilters);
    container.querySelector("#rule-review-pending-btn")?.addEventListener("click", toEventListener(async () => {
      await rpc("reviewLocalRules");
    }));
    container.querySelector("#rule-list")?.addEventListener("click", (e2) => {
      const target = e2.target;
      if (!(target instanceof HTMLElement)) return;
      const card = target.closest(".rule-card");
      if (!card) return;
      const ruleId = getDatasetValue(card, "ruleId");
      if (ruleId) showRuleDetail(container, ruleId, rules, previewMap, currentFilter2);
    });
    container.querySelector("#rule-back-btn")?.addEventListener("click", () => {
      container.querySelector("#rule-list").style.display = "";
      container.querySelector("#rule-detail-panel").style.display = "none";
      container.querySelector("#rule-search-bar").style.display = "";
      container.querySelector("#ap-rules-header").style.display = "";
    });
    wireRuleEditorModal(container, currentFilter2, () => renderAntiPatterns(container, currentFilter2));
    container.querySelector("#rule-new-btn")?.addEventListener("click", () => {
      openRuleEditor(container, null);
    });
    container.querySelector("#rule-help-btn")?.addEventListener("click", () => {
      container.querySelector("#rule-help-modal").style.display = "flex";
    });
    container.querySelector("#rule-help-close")?.addEventListener("click", () => {
      container.querySelector("#rule-help-modal").style.display = "none";
    });
    let dslRefLoaded = false;
    container.querySelector("#rule-dsl-ref-btn")?.addEventListener("click", toEventListener(async () => {
      const modal = container.querySelector("#rule-dsl-ref-modal");
      modal.style.display = "flex";
      if (!dslRefLoaded) {
        dslRefLoaded = true;
        const body = container.querySelector("#rule-dsl-ref-body");
        try {
          await renderDslReferenceContent(body);
        } catch {
          render(html2`<p style="color:var(--text-muted);padding:16px;">Failed to load DSL reference. Please close and try again.</p>`, body);
          dslRefLoaded = false;
        }
      }
    }));
    container.querySelector("#rule-dsl-ref-close")?.addEventListener("click", () => {
      container.querySelector("#rule-dsl-ref-modal").style.display = "none";
    });
    container.querySelector("#rule-coverage-btn")?.addEventListener("click", () => {
      const modal = container.querySelector("#rule-coverage-modal");
      modal.style.display = "flex";
      void renderCoverageHeatmap(container, currentFilter2);
    });
    container.querySelector("#rule-coverage-close")?.addEventListener("click", () => {
      container.querySelector("#rule-coverage-modal").style.display = "none";
    });
  }
  function renderRulePreviewStats(preview) {
    const flaggedColor = preview?.triggered ? "var(--yellow)" : "var(--green)";
    return html2`${statPill("Flagged", preview?.occurrences ?? 0, flaggedColor)}${statPill("Total", preview?.total ?? 0)}${statPill("Rate", `${preview?.pct ?? 0}%`, flaggedColor)}${statPill("Status", preview?.triggered ? "TRIGGERED" : "CLEAN", flaggedColor)}`;
  }
  function renderRuleDetailContent(rule, preview, ruleId) {
    const thresholdEntries = Object.entries(rule.thresholds);
    return html2`<div>
    <div class="rule-detail-top">
      <div class="rule-detail-name-row">
        <h2>${rule.name}</h2>
        ${severityBadge(rule.severity)}
        ${sourceBadge(rule.source)}
      </div>
      <p class="rule-detail-desc">${rule.description}</p>
      <div class="rule-detail-meta">
        <span>ID: <code>${rule.id}</code></span>
        <span>Scope: <code>${rule.scope}</code></span>
        <span>Version: ${rule.version}</span>
        ${rule.sourceFilePath ? html2`<span>File: <code>${rule.sourceFilePath}</code></span>` : null}
      </div>
    </div>

    <div class="rule-detail-sections">
      <div class="rule-detail-section">
        <h3>Current Data Preview</h3>
        <div class="rule-preview-stats">${renderRulePreviewStats(preview)}</div>
        ${preview?.previewDescription ? html2`<div class="rule-preview-desc">${preview.previewDescription}</div>` : null}
        ${preview && preview.previewExamples.length > 0 ? html2`
          <details class="rule-preview-examples">
            <summary>${preview.previewExamples.length} example(s)</summary>
            <ul>${preview.previewExamples.map((ex) => html2`<li>${ex}</li>`)}</ul>
          </details>
        ` : null}
      </div>

      ${thresholdEntries.length > 0 ? html2`
        <div class="rule-detail-section">
          <h3>Thresholds</h3>
          <p class="rule-threshold-hint">Adjust these values to tune when this rule triggers.</p>
          <div class="rule-thresholds">
            ${thresholdEntries.map(([key, value]) => thresholdRow(key, value, ruleId))}
          </div>
        </div>
      ` : null}

      <div class="rule-detail-section">
        <h3>When Triggered</h3>
        <div class="rule-template-block">${rule.descriptionTemplate}</div>
      </div>

      <div class="rule-detail-section">
        <h3>How to Improve</h3>
        <div class="rule-template-block">${rule.suggestionTemplate}</div>
      </div>

      ${rule.tags.length > 0 ? html2`
        <div class="rule-detail-section">
          <h3>Tags</h3>
          <div class="rule-card-tags">${rule.tags.map((tag) => html2`<span class="rule-tag">${tag}</span>`)}</div>
        </div>
      ` : null}
    </div>
  </div>`;
  }
  function wireRuleThresholdInputs(content, ruleId, currentFilter2) {
    for (const input of content.querySelectorAll(".rule-threshold-input")) {
      input.addEventListener("change", toEventListener(async (e2) => {
        const target = e2.target;
        if (!(target instanceof HTMLInputElement)) return;
        const key = getDatasetValue(target, "key");
        const value = Number.parseFloat(target.value);
        if (!key || Number.isNaN(value)) return;
        try {
          await rpc("updateRuleThreshold", { ruleId, key, value });
          const preview = await rpc("getRulePreview", { ruleId, ...currentFilter2 });
          const stats = content.querySelector(".rule-preview-stats");
          if (stats) {
            render(renderRulePreviewStats(preview), stats);
          }
        } catch {
        }
      }));
    }
  }
  function wireRuleDetailExplainButtons(content, currentFilter2) {
    for (const button of content.querySelectorAll(".occ-explain-btn")) {
      button.addEventListener("click", toEventListener(async (event) => {
        event.stopPropagation();
        await explainOccurrence(button, currentFilter2);
      }));
    }
  }
  function showRuleDetail(container, ruleId, rules, previewMap, currentFilter2) {
    const rule = rules.find((r2) => r2.id === ruleId);
    if (!rule) return;
    const preview = previewMap.get(ruleId);
    container.querySelector("#rule-list").style.display = "none";
    container.querySelector("#rule-search-bar").style.display = "none";
    container.querySelector("#ap-rules-header").style.display = "none";
    const panel = container.querySelector("#rule-detail-panel");
    panel.style.display = "";
    const content = container.querySelector("#rule-detail-content");
    render(renderRuleDetailContent(rule, preview, ruleId), content);
    wireRuleThresholdInputs(content, ruleId, currentFilter2);
    container.querySelector("#rule-edit-source-btn")?.addEventListener("click", () => {
      openRuleEditor(container, ruleId);
    });
    wireRuleDetailExplainButtons(content, currentFilter2);
  }
  function renderLayerStatus(layers, layerName) {
    const info = layers.find((l2) => l2.layer === layerName);
    if (!info) return html2`<span class="rule-help-status rule-help-na">Not applicable</span>`;
    if (!info.exists) return html2`<span class="rule-help-status rule-help-missing">Directory not found</span>`;
    return html2`<span class="rule-help-status rule-help-ok">${info.ruleCount} rule${info.ruleCount !== 1 ? "s" : ""} loaded</span>`;
  }

  // src/webview/page-skills.ts
  var CATALOG_BASE = "https://awesome-copilot.github.com";
  var dismissed = /* @__PURE__ */ new Set();
  var lastTriaged = [];
  var lastClusters = [];
  var lastResultsEl = null;
  var activeFilter = {};
  async function renderSkills(container, currentFilter2) {
    activeFilter = currentFilter2;
    const workspaces = await rpc("getWorkspaces");
    const filterWsId = currentFilter2.workspaceId ? workspaces.find((w2) => w2.id === currentFilter2.workspaceId)?.id || "" : "";
    render(html2`
    <div class="sk-header">
      <h1>Skill Finder</h1>
      <p class="sk-subtitle">Analyze your repeated prompts to discover custom skill opportunities and matching community skills.</p>
    </div>

    <div class="sk-toolbar">
      <div class="sk-toolbar-row">
        <label class="sk-lookback">
          <span>Workspace</span>
          <select id="skWorkspaceSelect" class="sk-select">
            <option value="">All workspaces</option>
            ${workspaces.map((ws) => html2`<option value="${ws.id}" selected="${ws.id === filterWsId || void 0}">${ws.name}</option>`)}
          </select>
        </label>
      </div>
      <div class="sk-toolbar-row">
        <label class="sk-lookback">
          <span>Look back</span>
          <select id="lookbackSelect" class="sk-select">
            <option value="1">1 month</option>
            <option value="3">3 months</option>
            <option value="6" selected>6 months</option>
            <option value="12">12 months</option>
            <option value="0">All time</option>
          </select>
        </label>
      </div>
      <div class="sk-toolbar-row">
        <button id="analyzeBtn" class="sk-btn sk-btn-primary">Analyze</button>
        <span id="analyzeStatus" class="sk-status"></span>
      </div>
    </div>

    <section class="sk-section" id="customSection">
      <h2 class="sk-section-title">Custom Skill Opportunities</h2>
      <div id="customResults">
        <p class="sk-empty">Select a workspace and click Analyze to find repeated patterns that could become skills.</p>
      </div>
    </section>

    <section class="sk-section" id="catalogSection">
      <h2 class="sk-section-title">Community Skills & Agents</h2>
      <p class="sk-section-desc">
        Matching picks from${" "}
        <a href="${CATALOG_BASE}/" target="_blank">awesome-copilot</a>
        ${" "}based on your repeated activities.
      </p>
      <div id="catalogResults">
        <p class="sk-empty">Run the analysis to get personalized community recommendations.</p>
      </div>
    </section>
  `, container);
    document.getElementById("analyzeBtn").addEventListener("click", triggerRunAnalysis);
    const cached = getSkillCache(currentFilter2);
    if (cached && cached.clusters.length > 0) {
      renderCachedResults(cached.clusters, cached.triaged, cached.catalogMatches);
      return;
    }
    const hint = consumeNavHint();
    if (hint === "auto-run") {
      setTimeout(triggerRunAnalysis, 100);
    }
  }
  function renderCachedResults(clusters, triaged, catalogMatches) {
    const statusEl = document.getElementById("analyzeStatus");
    const customEl = document.getElementById("customResults");
    const catalogEl = document.getElementById("catalogResults");
    const strong = triaged.filter((t3) => t3.verdict === "strong").slice(0, 10);
    lastTriaged = strong;
    lastClusters = clusters;
    lastResultsEl = customEl;
    if (strong.length === 0) {
      statusEl.textContent = `Found ${clusters.length} patterns \u2014 no strong skill opportunities.`;
      render(html2`<p class="sk-empty">No repeating agent tasks detected.</p>`, customEl);
    } else {
      statusEl.textContent = `${strong.length} skill ${strong.length === 1 ? "opportunity" : "opportunities"} found (from dashboard scan)`;
      renderTriageResults(customEl, strong, clusters);
    }
    if (catalogMatches.length > 0) {
      renderCatalogList(catalogEl, catalogMatches, catalogMatches.length);
    } else {
      render(html2`<p class="sk-empty">No community matches from dashboard scan. Click Analyze to re-run with full catalog.</p>`, catalogEl);
    }
    updateNavBadge("badge-skills", strong.length + catalogMatches.length);
  }
  async function runAnalysis() {
    const btn = document.getElementById("analyzeBtn");
    const statusEl = document.getElementById("analyzeStatus");
    const customEl = document.getElementById("customResults");
    const catalogEl = document.getElementById("catalogResults");
    const workspaceId = document.getElementById("skWorkspaceSelect").value;
    const workspaceName = workspaceId ? document.getElementById("skWorkspaceSelect").selectedOptions[0]?.textContent || workspaceId : void 0;
    const lookback = Number.parseInt(document.getElementById("lookbackSelect").value, 10);
    btn.disabled = true;
    btn.textContent = "Analyzing...";
    statusEl.textContent = "";
    render(html2`<p class="sk-loading">Scanning for repeated prompts...</p>`, customEl);
    render(html2`<p class="sk-loading">Loading community catalog...</p>`, catalogEl);
    dismissed.clear();
    const filter = {};
    if (lookback > 0) {
      const d2 = /* @__PURE__ */ new Date();
      d2.setMonth(d2.getMonth() - lookback);
      filter.fromDate = d2.toISOString().slice(0, 10);
    }
    if (workspaceId) filter.workspaceId = workspaceId;
    let clusters = [];
    try {
      const data = await rpc("getWorkflowOptimization", filter);
      clusters = data.clusters || [];
      if (clusters.length === 0) {
        render(html2`<p class="sk-empty">No repeated patterns found. Try extending the lookback period or selecting a different workspace.</p>`, customEl);
        render(html2`<p class="sk-empty">No patterns to match against.</p>`, catalogEl);
        return;
      }
      const top20 = clusters.slice(0, 20);
      statusEl.textContent = `Found ${clusters.length} patterns \u2014 sending top ${top20.length} to AI triage...`;
      const result = await rpc("triageSkills", {
        clusters: top20.map((c2) => ({
          id: c2.id,
          label: c2.label,
          occurrences: c2.occurrences,
          sessions: c2.sessions,
          cancelRate: c2.cancelRate,
          avgCorrectionTurns: c2.avgCorrectionTurns,
          workspaces: c2.workspaces,
          examples: c2.examples.slice(0, 5)
        })),
        workspace: workspaceName
      });
      const strong = (result.triaged || []).filter((t3) => t3.verdict === "strong").slice(0, 10);
      lastTriaged = strong;
      lastClusters = clusters;
      lastResultsEl = customEl;
      if (strong.length === 0) {
        statusEl.textContent = "No strong skill opportunities found.";
        render(html2`<p class="sk-empty">No repeating agent tasks detected. Your prompts may already be well-served or too diverse.</p>`, customEl);
      } else {
        statusEl.textContent = `${strong.length} skill ${strong.length === 1 ? "opportunity" : "opportunities"} found`;
        renderTriageResults(customEl, strong, clusters);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Analysis failed";
      render(html2`<p class="sk-error">Error: ${msg}</p>`, customEl);
    } finally {
      btn.disabled = false;
      btn.textContent = "Analyze";
    }
    const catalogMatches = await loadCatalog(catalogEl, clusters, workspaceName);
    setSkillCache({ clusters, triaged: lastTriaged, catalogMatches, timestamp: Date.now() }, activeFilter);
    updateNavBadge("badge-skills", lastTriaged.length + catalogMatches.length);
  }
  function triggerRunAnalysis() {
    void runAnalysis();
  }
  function renderTriageResults(container, triaged, clusters) {
    const visible = triaged.filter((t3) => !dismissed.has(t3.id));
    if (visible.length === 0) {
      render(html2`<p class="sk-empty">All suggestions dismissed. Run analysis again to refresh.</p>`, container);
      return;
    }
    render(html2`<div class="sk-grid">${visible.map((t3, i2) => {
      const cluster = clusters.find((c2) => c2.id === t3.id);
      return html2`
      <div class="sk-card" data-idx="${i2}" data-id="${t3.id}">
        <div class="sk-card-header">
          <span class="sk-rank">${i2 + 1}</span>
          <div class="sk-card-title">${t3.suggestedSkillName || t3.label}</div>
          <button class="sk-btn-dismiss" data-dismiss-id="${t3.id}" title="Dismiss">\u00d7</button>
        </div>
        <div class="sk-card-body">
          <p class="sk-card-reason">${t3.reason}</p>
          ${cluster ? html2`
            <div class="sk-card-meta">
              <span>${cluster.occurrences} repetitions</span>
              <span>${cluster.sessions} sessions</span>
              ${cluster.cancelRate > 0 ? html2`<span>${cluster.cancelRate}% cancelled</span>` : null}
            </div>
            ${cluster.examples.length > 0 ? html2`<div class="sk-card-examples">${cluster.examples.slice(0, 3).map((ex) => html2`<div class="sk-card-example">${ex.length > 120 ? ex.slice(0, 117) + "..." : ex}</div>`)}</div>` : null}
            <div class="sk-card-actions">
              <button class="sk-btn sk-btn-install" data-cluster-idx="${i2}">Install Skill</button>
              <div class="sk-card-preview" data-cluster-idx="${i2}"></div>
            </div>` : null}
        </div>
      </div>`;
    })}</div>`, container);
    for (const btn of container.querySelectorAll(".sk-btn-install")) {
      btn.addEventListener("click", (e2) => {
        void (async () => {
          const el2 = e2.currentTarget;
          const idx = Number.parseInt(el2.dataset.clusterIdx || "0", 10);
          const t3 = visible[idx];
          if (!t3) return;
          const cluster = clusters.find((c2) => c2.id === t3.id);
          if (!cluster) return;
          el2.disabled = true;
          el2.textContent = "Generating...";
          try {
            const res = await rpc("generateSkillContent", {
              label: t3.suggestedSkillName || t3.label,
              pattern: cluster.label,
              occurrences: cluster.occurrences,
              sessions: cluster.sessions,
              examples: cluster.examples.slice(0, 5),
              skillDraft: cluster.skillDraft
            });
            const previewEl = el2.parentElement?.querySelector(".sk-card-preview");
            if (previewEl) {
              render(html2`
              <details class="sk-preview-details" open>
                <summary>Preview: ${res.filename}</summary>
                <pre class="sk-preview-code">${res.content}</pre>
                <div class="sk-preview-actions">
                  <button class="sk-btn sk-btn-confirm">Save & Install</button>
                  <button class="sk-btn sk-btn-secondary sk-btn-cancel">Cancel</button>
                </div>
              </details>`, previewEl);
              previewEl.querySelector(".sk-btn-confirm")?.addEventListener("click", () => {
                void (async () => {
                  try {
                    await rpc("installSkill", { filename: res.filename, content: res.content });
                    el2.textContent = "Installed";
                    el2.classList.add("sk-btn-done");
                    render(html2`<span class="sk-installed-msg">Skill installed to ~/.agents/skills/</span>`, previewEl);
                  } catch (err) {
                    const msg = err instanceof Error ? err.message : "Install failed";
                    render(html2`<span class="sk-error">${msg}</span>`, previewEl);
                  }
                })();
              });
              previewEl.querySelector(".sk-btn-cancel")?.addEventListener("click", () => {
                render(null, previewEl);
                el2.disabled = false;
                el2.textContent = "Install Skill";
              });
            }
            el2.textContent = "Review Below";
          } catch (err) {
            const msg = err instanceof Error ? err.message : "Generation failed";
            el2.textContent = "Install Skill";
            el2.disabled = false;
            const previewEl = el2.parentElement?.querySelector(".sk-card-preview");
            if (previewEl) render(html2`<span class="sk-error">${msg}</span>`, previewEl);
          }
        })();
      });
    }
    for (const btn of container.querySelectorAll(".sk-btn-dismiss")) {
      btn.addEventListener("click", (e2) => {
        const id = e2.currentTarget.dataset.dismissId || "";
        if (!id) return;
        dismissed.add(id);
        if (lastResultsEl) renderTriageResults(lastResultsEl, lastTriaged, lastClusters);
      });
    }
  }
  var kindIcons = {
    skill: "S",
    agent: "A",
    instruction: "I",
    hook: "H"
  };
  var kindColors = {
    skill: COLORS.green,
    agent: COLORS.purple,
    instruction: COLORS.blue,
    hook: COLORS.yellow
  };
  async function loadCatalog(container, clusters, workspace) {
    try {
      const result = await rpc("discoverCatalog", {});
      if (!result.items || result.items.length === 0) {
        render(html2`<p class="sk-empty">No items found in the community catalog.</p>`, container);
        return [];
      }
      render(html2`<p class="sk-loading">AI is reviewing all ${result.items.length} catalog items against your patterns...</p>`, container);
      const topClusters = clusters.sort((a2, b2) => b2.occurrences - a2.occurrences).slice(0, 20).map((c2) => ({ label: c2.label, occurrences: c2.occurrences, workspaces: c2.workspaces, examples: c2.examples.slice(0, 3) }));
      try {
        const triaged = await rpc("triageCatalog", {
          items: result.items,
          clusters: topClusters,
          workspace: workspace || void 0
        });
        const items = triaged.items && triaged.items.length > 0 ? triaged.items : [];
        if (items.length === 0) {
          render(html2`<p class="sk-empty">No community items matched your workflow patterns (${result.totalScanned} reviewed).</p>`, container);
        } else {
          renderCatalogList(container, items, result.totalScanned);
        }
        return items;
      } catch {
        render(html2`<p class="sk-empty">AI triage failed. Try again later.</p>`, container);
        return [];
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load catalog";
      render(html2`<p class="sk-error">Catalog error: ${msg}</p>`, container);
      return [];
    }
  }
  function renderCatalogList(container, items, totalScanned) {
    render(html2`
    <p class="sk-section-count">${items.length} curated from ${totalScanned} catalog items</p>
    <div class="sk-grid">${items.map((item) => renderCatalogCard(item))}</div>
  `, container);
    for (const btn of container.querySelectorAll(".sk-btn-install-catalog")) {
      btn.addEventListener("click", (e2) => {
        void (async () => {
          const el2 = e2.currentTarget;
          const path = el2.dataset.path || "";
          const kind = el2.dataset.kind || "skill";
          const title = el2.dataset.title || "";
          if (!path) return;
          el2.disabled = true;
          el2.textContent = "Fetching...";
          try {
            const res = await rpc("installCatalogItem", {
              path,
              kind,
              title
            });
            el2.textContent = "Installed";
            el2.classList.add("sk-btn-done");
            const parent = el2.closest(".sk-card");
            const msgEl = parent?.querySelector(".sk-install-msg");
            if (msgEl) msgEl.textContent = `Installed as ${res.filename}`;
          } catch (err) {
            const msg = err instanceof Error ? err.message : "Install failed";
            el2.textContent = "Install";
            el2.disabled = false;
            const parent = el2.closest(".sk-card");
            const msgEl = parent?.querySelector(".sk-install-msg");
            if (msgEl) {
              msgEl.textContent = msg;
              msgEl.classList.add("sk-error");
            }
          }
        })();
      });
    }
  }
  function renderCatalogCard(item) {
    const color2 = kindColors[item.kind] || COLORS.blue;
    const icon2 = kindIcons[item.kind] || "?";
    const kindLabel = item.kind.charAt(0).toUpperCase() + item.kind.slice(1);
    const ghUrl = `https://github.com/github/awesome-copilot/blob/main/${encodeURI(item.path)}`;
    return html2`
    <div class="sk-card sk-card-catalog">
      <div class="sk-card-header">
        <span class="sk-kind-icon" style="background:${color2}">${icon2}</span>
        <div>
          <div class="sk-card-title">
            <a href="${ghUrl}" target="_blank">${item.title}</a>
          </div>
          <div class="sk-card-badges">
            <span class="sk-badge" style="color:${color2}">${kindLabel}</span>
            ${item.category ? html2`<span class="sk-badge">${item.category}</span>` : null}
          </div>
        </div>
      </div>
      <div class="sk-card-body">
        <p class="sk-card-desc">${item.description.length > 200 ? item.description.slice(0, 200) + "..." : item.description}</p>
        ${item.matchReasons.length > 0 ? html2`
          <div class="sk-card-reasons">
            ${item.matchReasons.map((r2) => html2`<span class="sk-reason">${r2}</span>`)}
          </div>` : null}
        <div class="sk-card-actions">
          <button class="sk-btn sk-btn-install-catalog" data-path="${item.path}" data-kind="${item.kind}" data-title="${item.title}">Install</button>
          <span class="sk-install-msg"></span>
        </div>
      </div>
    </div>`;
  }

  // src/webview/page-context-mgmt.ts
  var VERDICT_COLORS = {
    optimal: COLORS.green,
    degraded: COLORS.yellow,
    limited: COLORS.red
  };
  function contextColor(utilization, thresholds) {
    if (utilization >= thresholds.limitedUtilization) return COLORS.red;
    if (utilization >= thresholds.optimalUtilization) return COLORS.yellow;
    return COLORS.green;
  }
  function buildContextGradient(canvas, thresholds) {
    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return "rgba(88,166,255,0.1)";
    const grad = ctx2d.createLinearGradient(0, 0, 0, canvas.height);
    const limitedStop = Math.max(0, Math.min(1, 1 - thresholds.limitedUtilization / 100));
    const optimalStop = Math.max(0, Math.min(1, 1 - thresholds.optimalUtilization / 100));
    grad.addColorStop(0, "rgba(248,81,73,0.25)");
    grad.addColorStop(limitedStop, "rgba(248,81,73,0.18)");
    grad.addColorStop(limitedStop, "rgba(210,153,34,0.18)");
    grad.addColorStop(optimalStop, "rgba(210,153,34,0.12)");
    grad.addColorStop(optimalStop, "rgba(63,185,80,0.12)");
    grad.addColorStop(1, "rgba(63,185,80,0.05)");
    return grad;
  }
  function sortWorkspacesBySessions(workspaces) {
    return [...workspaces].sort(
      (a2, b2) => b2.sessionCount - a2.sessionCount || b2.requestsWithTokens - a2.requestsWithTokens || a2.workspaceName.localeCompare(b2.workspaceName)
    );
  }
  async function renderContextManagement(container, currentFilter2) {
    const data = await rpc("getContextManagement", { filter: currentFilter2 });
    if (data.totalSessions === 0) {
      render(html2`
      <div style="text-align:center;padding:60px 20px;color:var(--text-muted);">
        <div style="font-size:40px;margin-bottom:12px;">&#128202;</div>
        <div style="font-size:18px;margin-bottom:8px;">No Session Data</div>
        <div style="max-width:420px;margin:0 auto;line-height:1.5;">
          No sessions found for the selected time period.
          Adjust the date filter or use AI coding tools to generate data.
        </div>
      </div>`, container);
      return;
    }
    const scoreColor2 = data.overallScore >= 70 ? COLORS.green : data.overallScore >= 40 ? COLORS.yellow : COLORS.red;
    const compactionLabel = String(data.totalCompactions);
    render(html2`
    <div>
      <div class="stat-grid">
        <${StatCard} label="Context Score" value=${data.overallScore + "/100"} accent=${scoreColor2} />
        <${StatCard} label="Compactions" value=${compactionLabel} accent=${data.totalCompactions > 10 ? COLORS.red : data.totalCompactions > 0 ? COLORS.yellow : COLORS.green} />
      </div>

      ${renderTips(data.tips)}

      <h3 style="margin-top:24px;display:flex;align-items:center;gap:12px;">
        Context Utilization Trend
        ${data.workspaceTrend.length > 0 && data.trend.length > 1 ? html2`
          <div id="ctxTrendToggle" style="display:inline-flex;border:1px solid var(--border-color, #30363d);border-radius:6px;overflow:hidden;font-size:11px;margin-left:auto;">
            <button class="ctx-trend-mode active" data-mode="avg" style="padding:4px 10px;border:none;background:var(--list-active);color:var(--text-primary, #c9d1d9);cursor:pointer;font-size:11px;">Total Avg</button>
            <button class="ctx-trend-mode" data-mode="workspace" style="padding:4px 10px;border:none;background:transparent;color:var(--text-muted, #8b949e);cursor:pointer;font-size:11px;">Per Workspace</button>
          </div>` : null}
      </h3>
      <p style="color:var(--text-muted);font-size:12px;margin:4px 0 12px;">Weekly average context utilization (% of window) and compaction events over time.</p>
      ${data.trend.length > 1 ? html2`<${CanvasEl} id="ctxMgmtTrendChart" height=${280} />` : html2`<div style="color:var(--text-muted);font-size:13px;padding:20px;">Not enough weekly data for trend chart.</div>`}

      <h3 style="margin-top:24px;">Per-Workspace Context Session Health</h3>
      <p style="color:var(--text-muted);font-size:12px;margin:4px 0 12px;">How efficiently each workspace manages its context window. Click a workspace to expand session-level details inline.</p>
      <div id="ctxMgmtWsTable"></div>
    </div>
  `, container);
    const trendLabels = data.trend.map((t3) => t3.label);
    function renderTrendChart(mode) {
      destroyChartById("ctxMgmtTrendChart");
      if (mode === "workspace" && data.workspaceTrend.length > 0) {
        const datasets = data.workspaceTrend.map((ws, i2) => ({
          label: ws.workspaceName.length > 25 ? ws.workspaceName.slice(0, 23) + "\u2026" : ws.workspaceName,
          data: ws.data,
          borderColor: PALETTE[i2 % PALETTE.length],
          backgroundColor: PALETTE[i2 % PALETTE.length] + "18",
          fill: false,
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 2,
          spanGaps: true
        }));
        createChart("ctxMgmtTrendChart", "line", {
          labels: trendLabels,
          datasets
        }, {
          interaction: { mode: "index", intersect: false },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              title: { display: true, text: "Utilization %", color: "#8b949e" },
              ticks: { color: "#8b949e" },
              grid: { color: "rgba(48,54,61,0.6)" }
            },
            x: {
              ticks: { color: "#8b949e", maxRotation: 45 },
              grid: { color: "rgba(48,54,61,0.3)" }
            }
          },
          plugins: {
            annotation: {
              annotations: {
                warnLine: {
                  type: "line",
                  yMin: 50,
                  yMax: 50,
                  borderColor: "rgba(210,153,34,0.5)",
                  borderWidth: 1,
                  borderDash: [6, 4],
                  label: { display: true, content: `Degraded (${data.thresholds.optimalUtilization}%)`, position: "start", backgroundColor: "transparent", color: COLORS.yellow, font: { size: 10 } }
                },
                dangerLine: {
                  type: "line",
                  yMin: data.thresholds.limitedUtilization,
                  yMax: data.thresholds.limitedUtilization,
                  borderColor: "rgba(248,81,73,0.5)",
                  borderWidth: 1,
                  borderDash: [6, 4],
                  label: { display: true, content: `Limited (${data.thresholds.limitedUtilization}%)`, position: "start", backgroundColor: "transparent", color: COLORS.red, font: { size: 10 } }
                }
              }
            }
          }
        });
      } else {
        const canvas = document.getElementById("ctxMgmtTrendChart");
        let gradientFill = "rgba(88,166,255,0.1)";
        if (canvas) {
          gradientFill = buildContextGradient(canvas, data.thresholds);
        }
        createChart("ctxMgmtTrendChart", "line", {
          labels: trendLabels,
          datasets: [
            {
              label: "Avg Utilization %",
              data: data.trend.map((t3) => t3.avgUtilization),
              borderColor: COLORS.blue,
              backgroundColor: gradientFill,
              fill: true,
              tension: 0.3,
              yAxisID: "y"
            },
            {
              label: "Compactions",
              data: data.trend.map((t3) => t3.compactions),
              borderColor: "#6e7681",
              backgroundColor: "rgba(110,118,129,0.25)",
              type: "bar",
              yAxisID: "y1"
            }
          ]
        }, {
          interaction: { mode: "index", intersect: false },
          scales: {
            y: {
              position: "left",
              beginAtZero: true,
              max: 100,
              title: { display: true, text: "Utilization %", color: "#8b949e" },
              ticks: { color: "#8b949e" },
              grid: { color: "rgba(48,54,61,0.6)" }
            },
            y1: {
              position: "right",
              beginAtZero: true,
              title: { display: true, text: "Compactions", color: "#8b949e" },
              ticks: { color: "#8b949e", stepSize: 1 },
              grid: { drawOnChartArea: false }
            },
            x: {
              ticks: { color: "#8b949e", maxRotation: 45 },
              grid: { color: "rgba(48,54,61,0.3)" }
            }
          },
          plugins: {
            annotation: {
              annotations: {
                warnLine: {
                  type: "line",
                  yMin: data.thresholds.optimalUtilization,
                  yMax: data.thresholds.optimalUtilization,
                  borderColor: "rgba(210,153,34,0.5)",
                  borderWidth: 1,
                  borderDash: [6, 4],
                  label: { display: true, content: `Degraded (${data.thresholds.optimalUtilization}%)`, position: "start", backgroundColor: "transparent", color: COLORS.yellow, font: { size: 10 } }
                },
                dangerLine: {
                  type: "line",
                  yMin: data.thresholds.limitedUtilization,
                  yMax: data.thresholds.limitedUtilization,
                  borderColor: "rgba(248,81,73,0.5)",
                  borderWidth: 1,
                  borderDash: [6, 4],
                  label: { display: true, content: `Limited (${data.thresholds.limitedUtilization}%)`, position: "start", backgroundColor: "transparent", color: COLORS.red, font: { size: 10 } }
                }
              }
            }
          }
        });
      }
    }
    if (data.trend.length > 1) {
      renderTrendChart("avg");
      for (const btn of container.querySelectorAll(".ctx-trend-mode")) {
        btn.addEventListener("click", () => {
          for (const b2 of container.querySelectorAll(".ctx-trend-mode")) {
            b2.classList.remove("active");
            b2.style.background = "transparent";
            b2.style.color = "var(--text-muted, #8b949e)";
          }
          btn.classList.add("active");
          btn.style.background = "var(--list-active)";
          btn.style.color = "var(--text-primary, #c9d1d9)";
          renderTrendChart(btn.dataset.mode);
        });
      }
    }
    const tableWrap = document.getElementById("ctxMgmtWsTable");
    let expandedWs = null;
    let expandedSessionData = null;
    let sessionPage = 0;
    let expandedSessionIdx = null;
    function getFilteredWorkspaces() {
      return sortWorkspacesBySessions(data.workspaces);
    }
    function getFilteredSessions() {
      if (!expandedSessionData) return [];
      return expandedSessionData.sessions;
    }
    function attachWorkspaceClickHandlers() {
      for (const row of tableWrap.querySelectorAll(".ctx-ws-row")) {
        row.addEventListener("click", () => {
          void (async () => {
            const wsId = row.dataset.wsId;
            if (!wsId) return;
            if (expandedWs === wsId) {
              expandedWs = null;
              expandedSessionData = null;
              expandedSessionIdx = null;
              collapseInlineSessions();
              return;
            }
            expandedWs = wsId;
            expandedSessionIdx = null;
            collapseInlineSessions();
            const parentRow = row;
            const loadingTr = document.createElement("tr");
            loadingTr.className = "ctx-session-inline";
            render(html2`<td colspan="9" style="padding:16px;text-align:center;color:var(--text-muted);font-size:12px;">Loading sessions...</td>`, loadingTr);
            parentRow.after(loadingTr);
            const sessionData = await rpc("getWorkspaceContextSessions", { workspaceId: wsId, filter: currentFilter2 });
            expandedSessionData = sessionData;
            sessionPage = 0;
            renderInlineSessions(parentRow);
          })();
        });
      }
    }
    function collapseInlineSessions() {
      destroyChartById("ctxSessionTokenChart");
      expandedSessionIdx = null;
      for (const el2 of tableWrap.querySelectorAll(".ctx-session-inline")) el2.remove();
    }
    function renderInlineSessions(parentRow) {
      collapseInlineSessions();
      const sessions = getFilteredSessions();
      if (!expandedSessionData) return;
      const totalPages = Math.ceil(sessions.length / SESSION_PAGE_SIZE);
      const start = sessionPage * SESSION_PAGE_SIZE;
      const pageItems = sessions.slice(start, start + SESSION_PAGE_SIZE);
      const summaryTr = document.createElement("tr");
      summaryTr.className = "ctx-session-inline";
      const totalSessions = sessions.length;
      const avgUtil = totalSessions > 0 ? sessions.reduce((s2, d2) => s2 + d2.avgUtilization, 0) / totalSessions : 0;
      const totalCompactions = sessions.reduce((s2, d2) => s2 + d2.compactionCount, 0);
      const limitedCount = sessions.filter((s2) => s2.verdict === "limited").length;
      const avgSaturation = totalSessions > 0 ? sessions.reduce((s2, d2) => s2 + d2.saturation, 0) / totalSessions : 0;
      const todoEvents = sessions.reduce((s2, d2) => s2 + d2.events.filter((e2) => e2.type === "todo-add" || e2.type === "todo-complete").length, 0);
      render(html2`<td colspan="9" style="padding:12px 16px;background:rgba(88,166,255,0.03);border-bottom:1px solid var(--border-color, #30363d);">
      <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
        <span style="font-size:12px;color:var(--text-muted);"><strong style="color:var(--text-primary, #c9d1d9);">${totalSessions}</strong> sessions</span>
        <span style="font-size:12px;color:var(--text-muted);">Avg util: <strong style=${"color:" + contextColor(avgUtil, expandedSessionData.thresholds) + ";"}>${avgUtil.toFixed(1)}%</strong></span>
        <span style="font-size:12px;color:var(--text-muted);">Saturation: <strong style=${"color:" + (avgSaturation > 30 ? COLORS.red : avgSaturation > 10 ? COLORS.yellow : COLORS.green) + ";"}>${avgSaturation.toFixed(1)}%</strong></span>
        <span style="font-size:12px;color:var(--text-muted);">Compactions: <strong style=${"color:" + (totalCompactions > 0 ? COLORS.yellow : "var(--text-primary, #c9d1d9)") + ";"}>${totalCompactions}</strong></span>
        ${limitedCount > 0 ? html2`<span style=${"font-size:12px;color:" + COLORS.red + ";"}><strong>${limitedCount}</strong> limited</span>` : null}
        ${todoEvents > 0 ? html2`<span style=${"font-size:12px;color:" + (COLORS.purple ?? COLORS.blue) + ";"}>${todoEvents} todo events</span>` : null}
      </div>
    </td>`, summaryTr);
      parentRow.after(summaryTr);
      const headerTr = document.createElement("tr");
      headerTr.className = "ctx-session-inline";
      render(html2`
      <td colspan="9" style="padding:0;background:rgba(88,166,255,0.02);">
        <table style="width:100%;border-collapse:collapse;font-size:11px;">
          <thead>
            <tr style="border-bottom:1px solid var(--border-color, #30363d);color:var(--text-muted);">
              <th style="text-align:left;padding:6px 10px;font-weight:600;">Date</th>
              <th style="text-align:left;padding:6px 6px;font-weight:600;">Harness</th>
              <th style="text-align:center;padding:6px 6px;font-weight:600;">Verdict</th>
              <th style="text-align:right;padding:6px 6px;font-weight:600;">Reqs</th>
              <th style="text-align:right;padding:6px 6px;font-weight:600;" title="Average native prompt tokens per request">Avg Tokens</th>
              <th style="text-align:center;padding:6px 6px;font-weight:600;">Avg Util</th>
              <th style="text-align:center;padding:6px 6px;font-weight:600;">Sat.</th>
              <th style="text-align:center;padding:6px 6px;font-weight:600;">Events</th>
              <th style="text-align:left;padding:6px 6px;font-weight:600;">Token Curve</th>
            </tr>
          </thead>
          <tbody>
            ${pageItems.map((s2, idx) => renderSessionRow(s2, expandedSessionData.estimatedContextWindow, start + idx, expandedSessionData.thresholds))}
          </tbody>
        </table>
        ${totalPages > 1 ? html2`<div style="display:flex;justify-content:center;gap:6px;padding:8px;">
          ${Array.from({ length: totalPages }, (_2, i2) => {
        const active = i2 === sessionPage;
        return html2`<button class=${"ctx-sess-page-btn cons-range-btn" + (active ? " active" : "")} data-pg=${String(i2)} style="min-width:28px;padding:3px 6px;font-size:10px;">${i2 + 1}</button>`;
      })}
        </div>` : null}
      </td>`, headerTr);
      summaryTr.after(headerTr);
      for (const row of headerTr.querySelectorAll(".ctx-session-row")) {
        row.addEventListener("click", () => {
          const clickable = row.dataset.clickable === "true";
          if (!clickable) return;
          const idx = Number.parseInt(row.dataset.sessionIdx, 10);
          const s2 = sessions[idx];
          if (!s2) return;
          const existingChart = headerTr.querySelector(".ctx-session-chart-row");
          if (existingChart) {
            destroyChartById("ctxSessionTokenChart");
            existingChart.remove();
          }
          if (expandedSessionIdx === idx) {
            expandedSessionIdx = null;
            return;
          }
          expandedSessionIdx = idx;
          const innerRows = headerTr.querySelectorAll(".ctx-session-row");
          const pageRelIdx = idx - start;
          const targetRow = innerRows[pageRelIdx];
          if (!targetRow) return;
          const chartRow = document.createElement("tr");
          chartRow.className = "ctx-session-chart-row";
          const chartId = "ctxSessionTokenChart";
          const todoEvents2 = s2.events.filter((e2) => e2.type !== "compaction");
          render(html2`<td colspan="10" style="padding:12px 16px;background:rgba(22,27,34,0.6);border-bottom:1px solid var(--border-color, #30363d);">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
            <span style="font-size:12px;font-weight:600;color:var(--text-primary,#c9d1d9);">${s2.date} — ${s2.harness}</span>
            <span style="font-size:11px;color:var(--text-muted);">${s2.requestCount} reqs, ${s2.compactionCount} compactions${todoEvents2.length > 0 ? ", " + todoEvents2.length + " todo events" : ""}</span>
          </div>
          <div style="position:relative;height:180px;"><${CanvasEl} id=${chartId} height=${180} /></div>
        </td>`, chartRow);
          targetRow.after(chartRow);
          if (expandedSessionData) {
            renderSessionTokenChart(chartId, s2, expandedSessionData.estimatedContextWindow ?? 1, expandedSessionData.thresholds);
          }
          chartRow.scrollIntoView({ behavior: "smooth", block: "nearest" });
        });
      }
      for (const btn of headerTr.querySelectorAll(".ctx-sess-page-btn")) {
        btn.addEventListener("click", () => {
          sessionPage = Number.parseInt(btn.dataset.pg, 10);
          renderInlineSessions(parentRow);
        });
      }
    }
    let currentPage2 = 0;
    const updateTable = () => {
      expandedWs = null;
      expandedSessionData = null;
      expandedSessionIdx = null;
      const filtered = getFilteredWorkspaces();
      render(html2`<div>${renderWorkspaceTable(filtered, currentPage2, data.thresholds)}</div>`, tableWrap);
      for (const btn of tableWrap.querySelectorAll(".ctx-ws-page-btn")) {
        btn.addEventListener("click", () => {
          currentPage2 = Number.parseInt(btn.dataset.pg, 10);
          updateTable();
        });
      }
      attachWorkspaceClickHandlers();
    };
    updateTable();
  }
  function renderSessionTokenChart(chartId, s2, ctxWindow, thresholds) {
    destroyChartById(chartId);
    const eventMarkers = s2.events.map((ev) => {
      const color2 = ev.type === "compaction" ? COLORS.red : ev.type === "todo-complete" ? COLORS.green : ev.type === "todo-progress" ? COLORS.yellow : COLORS.blue;
      return {
        type: "line",
        xMin: ev.requestIndex,
        xMax: ev.requestIndex,
        borderColor: color2,
        borderWidth: 1.5,
        borderDash: ev.type === "compaction" ? void 0 : [4, 3],
        label: {
          display: true,
          content: ev.label.length > 20 ? ev.label.slice(0, 18) + "\u2026" : ev.label,
          position: "start",
          backgroundColor: "transparent",
          color: color2,
          font: { size: 9 },
          rotation: -90,
          yAdjust: -10
        }
      };
    });
    const annotations = {
      warnLine: {
        type: "line",
        yMin: thresholds.optimalUtilization,
        yMax: thresholds.optimalUtilization,
        borderColor: "rgba(210,153,34,0.4)",
        borderWidth: 1,
        borderDash: [6, 4],
        label: { display: true, content: `${thresholds.optimalUtilization}%`, position: "end", backgroundColor: "transparent", color: COLORS.yellow, font: { size: 9 } }
      },
      dangerLine: {
        type: "line",
        yMin: thresholds.limitedUtilization,
        yMax: thresholds.limitedUtilization,
        borderColor: "rgba(248,81,73,0.4)",
        borderWidth: 1,
        borderDash: [6, 4],
        label: { display: true, content: `${thresholds.limitedUtilization}%`, position: "end", backgroundColor: "transparent", color: COLORS.red, font: { size: 9 } }
      }
    };
    for (const [i2, m2] of eventMarkers.entries()) {
      annotations["ev" + i2] = m2;
    }
    const todoEvts = s2.events.filter((e2) => e2.type !== "compaction");
    if (todoEvts.length > 0) {
      const todoItems = [];
      const todoMap = /* @__PURE__ */ new Map();
      for (const ev of todoEvts) {
        const key = ev.label;
        if (ev.type === "todo-add") {
          if (!todoMap.has(key)) {
            const item = { title: key, addedAt: ev.requestIndex, startedAt: null, completedAt: null };
            todoItems.push(item);
            todoMap.set(key, item);
          }
        } else if (ev.type === "todo-progress") {
          const it = todoMap.get(key);
          if (it && it.startedAt == null) it.startedAt = ev.requestIndex;
        } else if (ev.type === "todo-complete") {
          const it = todoMap.get(key);
          if (it) it.completedAt = ev.requestIndex;
          else {
            const item = { title: key, addedAt: 0, startedAt: null, completedAt: ev.requestIndex };
            todoItems.push(item);
            todoMap.set(key, item);
          }
        }
      }
      const bandH = 3;
      for (const [i2, it] of todoItems.entries()) {
        const yBase = i2 * bandH;
        const endReq = it.completedAt ?? s2.requestCount - 1;
        const barColor = it.completedAt != null ? COLORS.green : it.startedAt != null ? COLORS.yellow : COLORS.blue;
        annotations["todo_" + i2] = {
          type: "box",
          xMin: it.addedAt,
          xMax: endReq,
          yMin: yBase,
          yMax: yBase + bandH - 0.5,
          backgroundColor: barColor + "30",
          borderColor: barColor + "80",
          borderWidth: 1,
          borderRadius: 2,
          label: {
            display: true,
            content: (it.completedAt != null ? "\u2714 " : it.startedAt != null ? "\u25B6 " : "") + (it.title.length > 30 ? it.title.slice(0, 28) + "\u2026" : it.title),
            position: "start",
            color: barColor,
            font: { size: 8 },
            padding: { left: 2, top: 0, bottom: 0, right: 0 }
          }
        };
      }
    }
    const utilData = s2.tokenCurve.map((t3) => t3 == null ? null : Math.round(t3 / ctxWindow * 1e3) / 10);
    const queries = s2.requestQueries;
    const canvas = document.getElementById(chartId);
    let gradientFill = "rgba(88,166,255,0.08)";
    if (canvas) {
      gradientFill = buildContextGradient(canvas, thresholds);
    }
    const pointColors = utilData.map((v2) => v2 == null ? "transparent" : contextColor(v2, thresholds));
    createChart(chartId, "line", {
      labels: utilData.map((_2, i2) => `R${i2 + 1}`),
      datasets: [{
        label: "Utilization %",
        data: utilData,
        borderColor: COLORS.blue,
        backgroundColor: gradientFill,
        fill: true,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: pointColors,
        pointBorderColor: pointColors,
        // Bridge requests that lack native token data so the trend reads as a
        // continuous line. Missing points stay invisible (transparent point
        // colors) so users can still see *where* data is missing — but the
        // line keeps flowing across them rather than fragmenting the chart.
        spanGaps: true
      }]
    }, {
      interaction: { mode: "index", intersect: false },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: { display: true, text: "Utilization %", color: "#8b949e" },
          ticks: { color: "#8b949e" },
          grid: { color: "rgba(48,54,61,0.6)" }
        },
        x: {
          ticks: { color: "#8b949e", maxRotation: 0 },
          grid: { color: "rgba(48,54,61,0.3)" }
        }
      },
      plugins: {
        legend: { display: false },
        annotation: { annotations },
        tooltip: {
          callbacks: {
            title: (items) => {
              if (items.length === 0) return "";
              const i2 = items[0].dataIndex;
              return `Request ${i2 + 1}`;
            },
            afterTitle: (items) => {
              if (items.length === 0) return "";
              const i2 = items[0].dataIndex;
              const q2 = queries[i2];
              return q2 ? q2 : "";
            },
            label: (item) => {
              const val = item.parsed.y;
              const tokens = s2.tokenCurve[item.dataIndex];
              if (val == null || tokens == null) return "no token data";
              const zone = val >= thresholds.limitedUtilization ? "limited" : val >= thresholds.optimalUtilization ? "degraded" : "optimal";
              return `${val.toFixed(1)}% (${formatNum(tokens)} tokens) \u2014 ${zone}`;
            }
          }
        }
      }
    });
  }
  function renderTips(tips) {
    if (tips.length === 0) return null;
    return html2`
    <div style="margin:16px 0;padding:14px 16px;border-radius:8px;background:rgba(88,166,255,0.06);border:1px solid rgba(88,166,255,0.2);">
      <div style="font-weight:600;font-size:13px;margin-bottom:8px;color:${COLORS.blue};">Insights</div>
      ${tips.map((t3) => html2`<div style="font-size:12px;color:var(--text-secondary, #8b949e);line-height:1.5;margin-bottom:4px;">• ${t3}</div>`)}
    </div>`;
  }
  var WS_PAGE_SIZE = 10;
  function renderWorkspaceTable(workspaces, page, thresholds) {
    if (workspaces.length === 0) {
      return html2`<div style="color:var(--text-muted);font-size:13px;padding:20px;">No workspaces with token data found.</div>`;
    }
    const totalPages = Math.ceil(workspaces.length / WS_PAGE_SIZE);
    const start = page * WS_PAGE_SIZE;
    const pageItems = workspaces.slice(start, start + WS_PAGE_SIZE);
    const utilBar = (pct) => {
      const clamp = Math.min(pct, 100);
      const barColor = contextColor(pct, thresholds);
      return html2`<div style="display:flex;align-items:center;gap:4px;justify-content:center;">
      <div style=${"width:40px;height:6px;border-radius:3px;background:rgba(48,54,61,0.6);overflow:hidden;"}>
        <div style=${"width:" + clamp + "%;height:100%;border-radius:3px;background:" + barColor + ";"}></div>
      </div>
      <span>${pct.toFixed(1)}%</span>
    </div>`;
    };
    return html2`
    <div style="overflow-x:auto;margin:8px 0 4px;">
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead>
          <tr style="border-bottom:1px solid var(--border-color, #30363d);color:var(--text-muted);">
            <th style="text-align:left;padding:8px 12px;font-weight:600;">Workspace</th>
            <th style="text-align:center;padding:8px 6px;font-weight:600;">Score</th>
            <th style="text-align:center;padding:8px 6px;font-weight:600;">Verdict</th>
            <th style="text-align:right;padding:8px 6px;font-weight:600;" title="Average native prompt tokens per request">Avg Tokens</th>
            <th style="text-align:center;padding:8px 6px;font-weight:600;">Avg Util</th>
            <th style="text-align:center;padding:8px 6px;font-weight:600;">Saturation</th>
            <th style="text-align:center;padding:8px 6px;font-weight:600;">Compactions</th>
            <th style="text-align:right;padding:8px 6px;font-weight:600;">Sessions</th>
          </tr>
        </thead>
        <tbody>
          ${pageItems.map((w2) => {
      const vc = VERDICT_COLORS[w2.verdict] || COLORS.muted;
      const sc = w2.score >= 70 ? COLORS.green : w2.score >= 40 ? COLORS.yellow : COLORS.red;
      const satColor = w2.saturation > 30 ? COLORS.red : w2.saturation > 10 ? COLORS.yellow : COLORS.green;
      return html2`
              <tr class="ctx-ws-row" data-ws-id=${w2.workspaceId} style="border-bottom:1px solid var(--border-color, #30363d);cursor:pointer;transition:background 0.15s;"
                onMouseOver=${(e2) => {
        e2.currentTarget.style.background = "rgba(88,166,255,0.06)";
      }}
                onMouseOut=${(e2) => {
        e2.currentTarget.style.background = "transparent";
      }}>
                <td style=${"padding:8px 12px;font-weight:500;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:" + COLORS.blue + ";"} title=${w2.workspaceName}>${w2.workspaceName}</td>
                <td style=${"text-align:center;padding:8px 6px;font-weight:700;color:" + sc + ";"}>${w2.score}</td>
                <td style="text-align:center;padding:8px 6px;"><span style=${"padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;background:" + vc + "22;color:" + vc + ";text-transform:capitalize;"}>${w2.verdict}</span></td>
                <td style="text-align:right;padding:8px 6px;">${formatNum(w2.avgPromptTokens)}</td>
                <td style="padding:8px 6px;">${utilBar(w2.avgUtilization)}</td>
                <td style=${"text-align:center;padding:8px 6px;color:" + satColor + ";font-weight:" + (w2.saturation > 10 ? "600" : "400") + ";"}>${w2.saturation.toFixed(1)}%</td>
                <td style=${"text-align:center;padding:8px 6px;" + (w2.compactionCount > 0 ? "color:" + COLORS.yellow + ";font-weight:600;" : "")}>${w2.compactionCount}</td>
                <td style="text-align:right;padding:8px 6px;">${w2.sessionCount}</td>
              </tr>`;
    })}
        </tbody>
      </table>
    </div>
    ${totalPages > 1 ? html2`
      <div style="display:flex;justify-content:center;gap:6px;margin:12px 0 4px;">
        ${Array.from({ length: totalPages }, (_2, i2) => {
      const active = i2 === page;
      return html2`<button class=${"ctx-ws-page-btn cons-range-btn" + (active ? " active" : "")} data-pg=${String(i2)} style="min-width:32px;padding:4px 8px;font-size:11px;">${i2 + 1}</button>`;
    })}
      </div>` : null}`;
  }
  var SESSION_PAGE_SIZE = 10;
  function renderSessionRow(s2, ctxWindow, idx, thresholds) {
    const vc = VERDICT_COLORS[s2.verdict] || COLORS.muted;
    const utilBar = (pct) => {
      const clamp = Math.min(pct, 100);
      const barColor = contextColor(pct, thresholds);
      return html2`<div style="display:flex;align-items:center;gap:4px;justify-content:center;">
      <div style=${"width:36px;height:5px;border-radius:3px;background:rgba(48,54,61,0.6);overflow:hidden;"}>
        <div style=${"width:" + clamp + "%;height:100%;border-radius:3px;background:" + barColor + ";"}></div>
      </div>
      <span>${pct.toFixed(1)}%</span>
    </div>`;
    };
    const satColor = s2.saturation > 30 ? COLORS.red : s2.saturation > 10 ? COLORS.yellow : COLORS.green;
    const compEvts = s2.events.filter((e2) => e2.type === "compaction").length;
    const todoEvts = s2.events.filter((e2) => e2.type === "todo-add" || e2.type === "todo-complete").length;
    const evtContent = compEvts > 0 || todoEvts > 0 ? html2`<span>${compEvts > 0 ? html2`<span style=${"color:" + COLORS.yellow + ";"} title=${compEvts + " compaction(s)"}>${compEvts}C</span>` : null}${compEvts > 0 && todoEvts > 0 ? " " : ""}${todoEvts > 0 ? html2`<span style=${"color:" + COLORS.blue + ";"} title=${todoEvts + " todo event(s)"}>${todoEvts}T</span>` : null}</span>` : html2`<span style="color:var(--text-muted);">-</span>`;
    const clickable = s2.hasPerRequestTokens;
    const cursorStyle = clickable ? "cursor:pointer;" : "cursor:default;opacity:0.85;";
    const sparklineContent = clickable ? renderSparkline(s2.tokenCurve, s2.contextWindow || ctxWindow, thresholds) : html2`<span style="color:var(--text-muted);font-size:10px;" title="Session-level data only — no per-turn breakdown available">—</span>`;
    const utilContent = clickable ? utilBar(s2.avgUtilization) : html2`<span style="color:var(--text-muted);" title="No per-turn token data">—</span>`;
    const satContent = clickable ? html2`<span style=${"color:" + satColor + ";font-weight:" + (s2.saturation > 10 ? "600" : "400") + ";"}>${s2.saturation.toFixed(1)}%</span>` : html2`<span style="color:var(--text-muted);">—</span>`;
    const tokensContent = clickable ? formatNum(s2.avgPromptTokens) : html2`<span style="color:var(--text-muted);">—</span>`;
    return html2`
    <tr class="ctx-session-row" data-session-idx=${String(idx)} data-clickable=${String(clickable)} style=${"border-bottom:1px solid var(--border-color, #30363d);" + cursorStyle + "transition:background 0.15s;"}
      onMouseOver=${(e2) => {
      e2.currentTarget.style.background = "rgba(88,166,255,0.06)";
    }}
      onMouseOut=${(e2) => {
      e2.currentTarget.style.background = "transparent";
    }}>
      <td style="padding:6px 10px;white-space:nowrap;">${s2.date}</td>
      <td style="padding:6px 6px;max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title=${s2.harness}>${s2.harness}</td>
      <td style="text-align:center;padding:6px 6px;"><span style=${"padding:1px 6px;border-radius:8px;font-size:10px;font-weight:600;background:" + vc + "22;color:" + vc + ";text-transform:capitalize;"}>${s2.verdict}</span></td>
      <td style="text-align:right;padding:6px 6px;">${s2.requestCount}</td>
      <td style="text-align:right;padding:6px 6px;">${tokensContent}</td>
      <td style="padding:6px 6px;">${utilContent}</td>
      <td style="text-align:center;padding:6px 6px;">${satContent}</td>
      <td style="text-align:center;padding:6px 6px;font-size:10px;">${evtContent}</td>
      <td style="padding:6px 6px;">${sparklineContent}</td>
    </tr>`;
  }
  function renderSparkline(tokenCurve, ctxWindow, thresholds) {
    const validValues = tokenCurve.filter((v2) => v2 != null && v2 > 0);
    if (validValues.length === 0) return html2`<span style="color:var(--text-muted);">-</span>`;
    const width = 80;
    const height = 20;
    const maxVal = Math.max(ctxWindow, ...validValues);
    const step = tokenCurve.length > 1 ? width / (tokenCurve.length - 1) : 0;
    const points = [];
    for (const [i2, v2] of tokenCurve.entries()) {
      if (v2 == null || v2 <= 0) continue;
      const x2 = tokenCurve.length === 1 ? width / 2 : i2 * step;
      const y2 = height - v2 / maxVal * height;
      points.push({ x: x2, y: y2 });
    }
    if (points.length === 0) return html2`<span style="color:var(--text-muted);">-</span>`;
    const peakUtil = Math.max(...validValues) / ctxWindow * 100;
    const color2 = contextColor(peakUtil, thresholds);
    const pointsStr = points.map((p2) => `${p2.x.toFixed(1)},${p2.y.toFixed(1)}`).join(" ");
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    const fillPath = `M${firstX.toFixed(1)},${height} ${points.map((p2) => `L${p2.x.toFixed(1)},${p2.y.toFixed(1)}`).join(" ")} L${lastX.toFixed(1)},${height} Z`;
    return html2`<svg width=${width} height=${height} style="vertical-align:middle;" title=${"Token usage across " + validValues.length + " of " + tokenCurve.length + " requests"}>
    <path d=${fillPath} fill=${color2} fill-opacity="0.15"/>
    <polyline points=${pointsStr} fill="none" stroke=${color2} stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
  </svg>`;
  }

  // src/webview/page-config.ts
  var HC = { "Local Agent": "#007acc", "Local Agent (Insiders)": "#24bfa5", "Xcode": "#147efb", "Claude Code": "#d97706", "GitHub Copilot CLI": "#8b5cf6", "GitHub Copilot App": "#a371f7", "Codex CLI": "#ec4899", "OpenCode": "#10b981" };
  function hc(h3) {
    return HC[h3] || COLORS.muted;
  }
  var activeTreemapChart = null;
  var currentProvisionRows = [];
  var activeSubTab = "config-quality";
  var activeRangeDays3 = {
    "config-quality": 30,
    "context-mgmt": 30
  };
  var ALL_RANGES = [
    { days: 30, label: "Last 1 month" },
    { days: 90, label: "Last 3 months" },
    { days: 180, label: "Last 6 months" },
    { days: 365, label: "Last 12 months" },
    { days: 0, label: "All time" }
  ];
  async function renderConfigHealth(container, currentFilter2) {
    function rangeStartDate(days) {
      if (days === 0) return "0001-01-01";
      const d2 = /* @__PURE__ */ new Date();
      d2.setDate(d2.getDate() - days);
      return d2.toISOString().slice(0, 10);
    }
    function isRangeDisabledByCutoff(days) {
      return rangeStartDate(days) < TOKEN_DATA_AVAILABLE_FROM;
    }
    function buildRangeFilter() {
      const f2 = { ...currentFilter2 };
      const days = activeRangeDays3[activeSubTab];
      if (days > 0) {
        f2.fromDate = rangeStartDate(days);
      }
      if (!f2.fromDate || f2.fromDate < TOKEN_DATA_AVAILABLE_FROM) {
        f2.fromDate = TOKEN_DATA_AVAILABLE_FROM;
      }
      return f2;
    }
    let visibleRanges = ALL_RANGES;
    let emptyRangeMessage = "No token-bearing context data available.";
    if (activeSubTab === "context-mgmt") {
      try {
        const avail = await rpc(
          "getContextRangeAvailability",
          { filter: { ...currentFilter2, fromDate: void 0, toDate: void 0 } }
        );
        const allowed = new Set(avail.rangesWithTokens);
        visibleRanges = ALL_RANGES.filter((r2) => allowed.has(r2.days));
        if (visibleRanges.length > 0 && !allowed.has(activeRangeDays3["context-mgmt"])) {
          const sortedAvail = [...avail.rangesWithTokens].map((r2) => r2 === 0 ? Number.POSITIVE_INFINITY : r2).sort((a2, b2) => a2 - b2);
          const cur2 = activeRangeDays3["context-mgmt"] === 0 ? Number.POSITIVE_INFINITY : activeRangeDays3["context-mgmt"];
          const nextBroader = sortedAvail.find((r2) => r2 >= cur2) ?? sortedAvail[sortedAvail.length - 1];
          activeRangeDays3["context-mgmt"] = nextBroader === Number.POSITIVE_INFINITY ? 0 : nextBroader;
        }
        if (visibleRanges.length === 0) {
          if (avail.matchingSessions === 0) {
            emptyRangeMessage = currentFilter2.harness ? `No sessions found for ${currentFilter2.harness}.` : "No sessions match the current filter.";
          } else if (avail.sessionsWithRequestTokens === 0 && avail.harnessesWithoutRequestTokens.length > 0) {
            const harnesses = avail.harnessesWithoutRequestTokens.join(", ");
            emptyRangeMessage = `${harnesses} only emits session-aggregated tokens, not per-request \u2014 Context Management requires per-request data to chart utilization. Try a different harness, or view consumption in the Output tab.`;
          } else {
            emptyRangeMessage = "No token-bearing context data available.";
          }
        }
      } catch {
      }
    }
    const enabledByCutoff = visibleRanges.filter((r2) => !isRangeDisabledByCutoff(r2.days));
    if (enabledByCutoff.length > 0 && isRangeDisabledByCutoff(activeRangeDays3[activeSubTab])) {
      const longest = enabledByCutoff.reduce((a2, b2) => {
        const aSpan = a2.days === 0 ? Number.POSITIVE_INFINITY : a2.days;
        const bSpan = b2.days === 0 ? Number.POSITIVE_INFINITY : b2.days;
        return bSpan > aSpan ? b2 : a2;
      });
      activeRangeDays3[activeSubTab] = longest.days;
    }
    const tabBarStyle = "display:flex;gap:0;border-bottom:1px solid var(--border-color, #30363d);margin-bottom:0;";
    const tabStyle = (active) => `padding:8px 18px;font-size:13px;font-weight:${active ? "600" : "500"};cursor:pointer;border:none;background:transparent;color:${active ? "var(--text-primary, #c9d1d9)" : "var(--text-muted, #8b949e)"};border-bottom:2px solid ${active ? COLORS.blue : "transparent"};transition:color 0.15s,border-color 0.15s;`;
    const cur = activeRangeDays3[activeSubTab];
    const cutoffTitle = `Sessions before ${TOKEN_DATA_AVAILABLE_FROM} did not capture per-request token data, so this range can't show meaningful context analytics. It will become available again once enough recent data falls within the range.`;
    const rangeButtons = visibleRanges.length > 0 ? visibleRanges.map((r2) => {
      const disabled = isRangeDisabledByCutoff(r2.days);
      const isActive = cur === r2.days && !disabled;
      const cls = `cons-range-btn${isActive ? " active" : ""}${disabled ? " disabled" : ""}`;
      return disabled ? html2`<button class=${cls} data-range=${String(r2.days)} disabled aria-disabled="true" title=${cutoffTitle} style="opacity:0.4;cursor:not-allowed;">${r2.label}</button>` : html2`<button class=${cls} data-range=${String(r2.days)}>${r2.label}</button>`;
    }) : html2`<span style="color:var(--text-muted);font-size:12px;padding:4px 8px;line-height:1.4;">${emptyRangeMessage}</span>`;
    render(html2`
    <div style=${tabBarStyle}>
      <button id="ctxSubTabConfig" class="ctx-sub-tab" data-tab="config-quality" style=${tabStyle(activeSubTab === "config-quality")}>Context Quality</button>
      <button id="ctxSubTabMgmt" class="ctx-sub-tab" data-tab="context-mgmt" style=${tabStyle(activeSubTab === "context-mgmt")}>Context Management</button>
    </div>
    <div class="cons-range-bar" id="ctxRangeBar" style="margin-top:12px;display:flex;align-items:center;gap:0;flex-wrap:wrap;">
      ${rangeButtons}
    </div>
    <div id="ctxSubTabContent"></div>`, container);
    const contentEl = document.getElementById("ctxSubTabContent");
    for (const btn of container.querySelectorAll("#ctxRangeBar .cons-range-btn")) {
      btn.addEventListener("click", () => {
        const el2 = btn;
        if (el2.hasAttribute("disabled")) return;
        const days = Number.parseInt(el2.dataset.range, 10);
        if (isRangeDisabledByCutoff(days)) return;
        if (days === activeRangeDays3[activeSubTab]) return;
        activeRangeDays3[activeSubTab] = days;
        destroyCharts();
        void renderConfigHealth(container, currentFilter2);
      });
    }
    for (const btn of container.querySelectorAll(".ctx-sub-tab")) {
      btn.addEventListener("click", () => {
        const tab = btn.dataset.tab;
        if (tab === activeSubTab) return;
        activeSubTab = tab;
        destroyCharts();
        void renderConfigHealth(container, currentFilter2);
      });
    }
    const effectiveFilter = buildRangeFilter();
    render(html2`<div class="loading-spinner" style="margin:40px auto;"></div>`, contentEl);
    if (activeSubTab === "context-mgmt") {
      await renderContextManagement(contentEl, effectiveFilter);
    } else {
      await renderConfigQuality(contentEl, effectiveFilter);
    }
  }
  async function renderConfigQuality(container, currentFilter2) {
    const data = await rpc("getConfigHealth", currentFilter2);
    data.workspaces = data.workspaces.filter((w2) => w2.requestCount > 0);
    const overallColor = data.overallScore >= 45 ? COLORS.green : data.overallScore >= 25 ? COLORS.yellow : COLORS.red;
    const ar = data.agenticReadiness;
    const arColor = ar.score >= 45 ? COLORS.green : ar.score >= 25 ? COLORS.yellow : COLORS.red;
    const wsCount = data.workspaces.length;
    const withInstructions = data.workspaces.filter((w2) => w2.hasInstructions).length;
    const harnesses = [...new Set(data.workspaces.flatMap((w2) => w2.harness.split(", ")))].sort();
    render(html2`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px;">
      <h2 style="margin:0;">Context Health</h2>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <select id="ctxHarnessFilter" style="padding:4px 8px;border-radius:6px;background:var(--card-bg, #161b22);border:1px solid var(--border-color, #30363d);color:var(--text-primary, #c9d1d9);font-size:12px;">
          <option value="">All Harnesses</option>
          ${harnesses.map((h3) => html2`<option value=${h3} selected=${currentFilter2.harness === h3 || void 0}>${h3}</option>`)}
        </select>
        <button id="ctxReviewBtn" style="padding:5px 14px;border-radius:6px;background:var(--accent-blue);color:#fff;border:none;font-size:12px;font-weight:600;cursor:pointer;transition:opacity 0.15s;${llmAvailable() ? "" : "opacity:0.45;cursor:not-allowed;"}" disabled=${!llmAvailable() || void 0} title=${llmAvailable() ? "AI reviews your context files and scores them" : LLM_UNAVAILABLE_NOTE}>Review Context Files</button>
        ${llmAvailable() ? html2`<select id="ctxReviewCount" style="padding:4px 6px;border-radius:6px;background:var(--card-bg, #161b22);border:1px solid var(--border-color, #30363d);color:var(--text-primary, #c9d1d9);font-size:12px;" title="Number of workspaces to review">
          <option value="3">Top 3</option>
          <option value="5" selected>Top 5</option>
          <option value="10">Top 10</option>
          <option value="15">Top 15</option>
        </select>` : null}
      </div>
    </div>
    <div class="stat-grid">
      <${StatCard} label="Overall Score" value=${data.overallScore + "/100"} accent=${overallColor} />
      <${StatCard} label="Agentic Readiness" value=${ar.score + "/100"} accent=${arColor} />
      <${StatCard} label="Active Workspaces" value=${String(wsCount)} accent=${COLORS.blue} />
      <${StatCard} label="With Context Files" value=${`${withInstructions}/${wsCount}`} accent=${withInstructions === wsCount && wsCount > 0 ? COLORS.green : COLORS.yellow} />
    </div>
    ${renderAgenticReadiness(ar)}
    ${renderContextProvision(data.contextProvisionByHarness)}
    <div id="ctxReviewResults"></div>
    <h3 style="margin-top:24px;">Workspace Context Map</h3>
    <p style="color:var(--text-muted);font-size:12px;margin:4px 0 12px;">Size = request volume. Color = instruction quality score. <b>Click a tile</b> for details & suggestions.</p>
    <div id="ctxTreemapWrap" style="min-height:200px;position:relative;"><canvas id="ctxTreemapCanvas" height="350"></canvas></div>
    <div id="ctxTileDetail" style="display:none;"></div>
    ${wsCount === 0 ? html2`<div style="text-align:center;padding:40px 20px;color:var(--text-muted);"><div style="font-size:18px;margin-bottom:8px;">No active workspaces found</div><div>Requires workspaces with 50+ requests in the selected timeframe.</div></div>` : null}`, container);
    if (data.workspaces.length > 0) renderTreemap(data.workspaces, container);
    document.getElementById("ctxHarnessFilter")?.addEventListener("change", (e2) => {
      void renderConfigQuality(container, { ...currentFilter2, harness: e2.target.value || void 0 });
    });
    for (const el2 of container.querySelectorAll(".ctx-provision-row")) {
      el2.addEventListener("click", () => {
        const rowEl = el2;
        const idx = Number.parseInt(rowEl.dataset.provisionIdx || "-1", 10);
        const detail = currentProvisionRows[idx];
        const panel = container.querySelector("#ctxProvisionDetailPanel");
        if (!detail || !panel) return;
        const isActive = rowEl.dataset.active === "true";
        for (const otherEl of container.querySelectorAll(".ctx-provision-row")) {
          otherEl.dataset.active = "false";
          otherEl.style.background = "transparent";
        }
        if (isActive) {
          panel.style.display = "none";
          render(null, panel);
          return;
        }
        rowEl.dataset.active = "true";
        rowEl.style.background = "rgba(88,166,255,0.06)";
        panel.style.display = "block";
        render(renderProvisionDetailPanel(detail), panel);
      });
    }
    document.getElementById("ctxReviewBtn")?.addEventListener("click", () => {
      void runContextReview(data.workspaces);
    });
  }
  function renderAgenticReadiness(ar) {
    if (ar.signals.length === 0) return null;
    const present = ar.signals.filter((s2) => s2.present).length;
    const total = ar.signals.length;
    return html2`
    <h3 style="margin-top:24px;">Agentic Readiness</h3>
    <p style="color:var(--text-muted);font-size:12px;margin:4px 0 8px;">${present}/${total} signals detected. Are your projects ready for AI agents?</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;margin:8px 0 16px;">
      ${ar.signals.map((s2) => {
      const ic = s2.present ? COLORS.green : COLORS.red;
      const icon2 = s2.present ? "\u2713" : "\u2717";
      const bg = s2.present ? "rgba(63,185,80,0.08)" : "rgba(248,81,73,0.06)";
      const border = s2.present ? "rgba(63,185,80,0.3)" : "rgba(248,81,73,0.2)";
      return html2`<div style="padding:10px 12px;border-radius:8px;background:${bg};border:1px solid ${border};" title=${s2.detail}>
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
            <span style="color:${ic};font-size:14px;">${icon2}</span>
            <span style="font-weight:600;font-size:13px;">${s2.label}</span>
            <span style="margin-left:auto;font-size:10px;color:var(--text-muted);font-weight:500;">${s2.weight}pt</span>
          </div>
          <div style="font-size:11px;color:var(--text-muted);line-height:1.3;">${s2.detail}</div>
        </div>`;
    })}
    </div>`;
  }
  var CATEGORY_LABELS = {
    clarity: "Clarity",
    specificity: "Specificity",
    structure: "Structure",
    completeness: "Completeness",
    staleness: "Staleness",
    redundancy: "Redundancy",
    actionability: "Actionability"
  };
  var CATEGORY_TOOLTIPS = {
    clarity: "How easy it is for the AI to understand your instructions without ambiguity.",
    specificity: "How precisely your instructions target concrete behaviors, tools, or patterns.",
    structure: "How well-organized your instructions are with headings, lists, and logical sections.",
    completeness: "How thoroughly your instructions cover the necessary topics and edge cases.",
    staleness: "Whether your instructions are up-to-date and free of outdated references.",
    redundancy: "How free your instructions are from duplicate or overlapping content.",
    actionability: "How directly the AI can act on your instructions without needing clarification."
  };
  var GRADE_COLORS = {
    A: COLORS.green,
    B: "#58a6ff",
    C: COLORS.yellow,
    D: COLORS.orange,
    F: COLORS.red
  };
  async function runContextReview(workspaces) {
    if (!llmAvailable()) return;
    const btn = document.getElementById("ctxReviewBtn");
    const countSelect = document.getElementById("ctxReviewCount");
    const resultsEl = document.getElementById("ctxReviewResults");
    if (!resultsEl) return;
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Reviewing...";
      btn.style.opacity = "0.6";
    }
    const reviewCount = countSelect ? Number.parseInt(countSelect.value, 10) : 5;
    const toReview = workspaces.slice(0, reviewCount);
    const wsIds = toReview.map((w2) => w2.workspaceId);
    if (activeTreemapChart) {
      const ds = activeTreemapChart.data.datasets[0];
      ds._origBg = ds.backgroundColor;
      ds.backgroundColor = () => "rgba(128, 128, 128, 0.3)";
      activeTreemapChart.update("none");
    }
    render(html2`
    <div style="margin:20px 0;padding:24px;border-radius:8px;background:var(--card-bg, #161b22);border:1px solid var(--border-color, #30363d);display:flex;align-items:center;gap:12px;">
      <div class="loading-spinner" style="width:20px;height:20px;border-width:2px;flex-shrink:0;"></div>
      <div>
        <div style="font-size:14px;font-weight:600;color:var(--text-primary, #c9d1d9);">Reviewing context files\u2026</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">Analyzing ${toReview.length} workspace${toReview.length > 1 ? "s" : ""}</div>
      </div>
    </div>`, resultsEl);
    try {
      const result = await rpc("reviewContextFiles", { workspaceIds: wsIds, count: reviewCount });
      if (result.error) {
        render(html2`<div style="margin:16px 0;padding:12px 16px;border-radius:6px;border-left:3px solid ${COLORS.red};background:rgba(248,81,73,0.06);font-size:13px;color:${COLORS.red};">Review failed: ${result.error}</div>`, resultsEl);
        return;
      }
      const reviews = result.reviews || [];
      if (reviews.length === 0) {
        render(html2`<div style="margin:16px 0;padding:12px;text-align:center;color:var(--text-muted);font-size:13px;">No review results returned.</div>`, resultsEl);
        return;
      }
      render(html2`
      <h3 style="margin-top:24px;">Context File Review</h3>
      <p style="color:var(--text-muted);font-size:12px;margin:4px 0 12px;">AI-powered review of your instruction files across ${reviews.length} workspace(s).</p>
      ${reviews.map((r2) => renderReviewCard(r2))}`, resultsEl);
      for (const el2 of resultsEl.querySelectorAll(".ctx-review-header")) {
        el2.addEventListener("click", () => {
          const body = el2.nextElementSibling;
          if (!body) return;
          const open = body.style.display !== "none";
          body.style.display = open ? "none" : "block";
          const arrow = el2.querySelector(".ctx-review-arrow");
          if (arrow) arrow.textContent = open ? "\u25B6" : "\u25BC";
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Review failed";
      render(html2`<div style="margin:16px 0;padding:12px 16px;border-radius:6px;border-left:3px solid ${COLORS.red};background:rgba(248,81,73,0.06);font-size:13px;color:${COLORS.red};">Error: ${msg}</div>`, resultsEl);
    } finally {
      if (activeTreemapChart) {
        const ds = activeTreemapChart.data.datasets[0];
        if (ds._origBg) {
          ds.backgroundColor = ds._origBg;
          delete ds._origBg;
        }
        activeTreemapChart.update("none");
      }
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Review Context Files";
        btn.style.opacity = "1";
      }
    }
  }
  function renderReviewCard(review) {
    const gc = GRADE_COLORS[review.overallGrade] || COLORS.muted;
    const cats = Object.entries(review.categoryScores);
    const findings = review.findings || [];
    const goodCount = findings.filter((f2) => f2.severity === "good").length;
    const warnCount = findings.filter((f2) => f2.severity === "warning").length;
    const critCount = findings.filter((f2) => f2.severity === "critical").length;
    return html2`
    <div style="margin:10px 0;border-radius:8px;background:var(--card-bg, #161b22);border:1px solid var(--border-color, #30363d);overflow:hidden;">
      <div class="ctx-review-header" style="display:flex;align-items:center;padding:12px 16px;cursor:pointer;user-select:none;gap:12px;">
        <span class="ctx-review-arrow" style="font-size:11px;color:var(--text-muted);">${"\u25BC"}</span>
        <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:0;">
          <span style="font-size:24px;font-weight:800;color:${gc};line-height:1;">${review.overallGrade}</span>
          <div>
            <div style="font-weight:600;font-size:14px;">${review.workspaceName}</div>
            <div style="font-size:11px;color:var(--text-muted);">${review.overallScore}/100 \u2014 ${goodCount} good, ${warnCount} warnings, ${critCount} critical</div>
          </div>
        </div>
        <div style="display:flex;gap:4px;flex-shrink:0;">
          ${cats.map(([cat, score]) => {
      const c2 = score >= 45 ? COLORS.green : score >= 25 ? COLORS.yellow : COLORS.red;
      const tip = CATEGORY_TOOLTIPS[cat] || "";
      return html2`<div style="text-align:center;min-width:42px;" data-tip=${tip || void 0} tabindex=${tip ? 0 : void 0} aria-label=${tip || void 0}><div style="font-size:12px;font-weight:700;color:${c2};">${score}</div><div style="font-size:8px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.3px;">${(CATEGORY_LABELS[cat] || cat).slice(0, 5)}</div></div>`;
    })}
        </div>
      </div>
      <div style="display:block;padding:0 16px 16px;border-top:1px solid var(--border-color, #30363d);">
        <div style="padding:10px 0 8px;font-size:12px;color:var(--text-muted);line-height:1.5;font-style:italic;">${review.summary}</div>
        ${renderCategoryBars(cats)}
        <div style="margin-top:12px;">
          <div style="font-weight:600;font-size:13px;margin-bottom:8px;">Findings</div>
          ${findings.map((f2) => renderFinding(f2))}
        </div>
      </div>
    </div>`;
  }
  function renderCategoryBars(cats) {
    return html2`<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0 4px;">
    ${cats.map(([cat, score]) => sBar(CATEGORY_LABELS[cat] || cat, score, CATEGORY_TOOLTIPS[cat]))}
  </div>`;
  }
  function renderFinding(f2) {
    const sevIcon = f2.severity === "good" ? html2`<span style="color:${COLORS.green};">${"\u2713"}</span>` : f2.severity === "critical" ? html2`<span style="color:${COLORS.red};">${"\u2717"}</span>` : html2`<span style="color:${COLORS.yellow};">${"\u26A0"}</span>`;
    const catLabel = CATEGORY_LABELS[f2.category] || f2.category;
    const bg = f2.severity === "good" ? "rgba(63,185,80,0.05)" : f2.severity === "critical" ? "rgba(248,81,73,0.06)" : "rgba(210,153,34,0.06)";
    return html2`
    <div style="padding:8px 10px;margin:4px 0;border-radius:6px;background:${bg};font-size:12px;">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
        ${sevIcon}
        <span style="font-weight:600;">${catLabel}</span>
        ${f2.file ? html2`<span style="color:var(--text-muted);font-family:monospace;font-size:11px;">${f2.file}</span>` : null}
      </div>
      <div style="color:var(--text-secondary, #c9d1d9);line-height:1.4;">${f2.finding}</div>
      ${f2.suggestion ? html2`<div style="color:var(--text-muted);margin-top:3px;font-style:italic;">${f2.suggestion}</div>` : null}
    </div>`;
  }
  function renderTreemap(workspaces, container) {
    const canvas = document.getElementById("ctxTreemapCanvas");
    if (!canvas) return;
    if (workspaces.length === 0) return;
    const treeData = workspaces.map((w2) => {
      const uniqueHarnesses = [...new Set(w2.harness.split(", "))].join(", ");
      const badges = [];
      if (w2.hasInstructions) badges.push("Instructions");
      if (w2.hasPrompts) badges.push("Prompts");
      if (w2.hasAgents) badges.push("Agents");
      if (w2.hasSkills) badges.push("Skills");
      if (w2.hasHooks) badges.push("Hooks");
      return {
        name: w2.workspaceName,
        requests: w2.requestCount,
        sessions: w2.sessionCount,
        score: w2.progressiveDisclosureScore,
        qualityScore: w2.instructionQualityScore,
        files: w2.configFiles.length,
        harness: uniqueHarnesses,
        stale: w2.staleContext,
        staleDays: w2.staleDays,
        badges,
        lastActivity: w2.lastActivity ? new Date(w2.lastActivity).toLocaleDateString() : "N/A"
      };
    });
    function scoreColor2(score, alpha2 = 0.7) {
      const t3 = Math.max(0, Math.min(100, score)) / 100;
      let r2, g2, b2;
      if (t3 < 0.35) {
        const f2 = t3 / 0.35;
        r2 = 248 + (210 - 248) * f2;
        g2 = 81 + (153 - 81) * f2;
        b2 = 73 + (34 - 73) * f2;
      } else {
        const f2 = (t3 - 0.35) / 0.65;
        r2 = 210 + (63 - 210) * f2;
        g2 = 153 + (185 - 153) * f2;
        b2 = 34 + (80 - 34) * f2;
      }
      return `rgba(${Math.round(r2)}, ${Math.round(g2)}, ${Math.round(b2)}, ${alpha2})`;
    }
    const chart = new Chart(canvas, {
      type: "treemap",
      data: {
        datasets: [{
          tree: treeData,
          key: "requests",
          labels: { display: true, formatter: (ctx) => {
            const d2 = ctx.raw._data;
            if (!d2) return "";
            const w2 = ctx.raw.w || 0;
            const h3 = ctx.raw.h || 0;
            if (w2 < 80 || h3 < 35) return d2.name.length > 10 ? d2.name.slice(0, 9) + "\u2026" : d2.name;
            return [d2.name, `${d2.score}pts`];
          }, color: "#fff", font: (ctx) => {
            const w2 = ctx.raw?.w || 0;
            const h3 = ctx.raw?.h || 0;
            if (w2 < 80 || h3 < 35) return { size: 9, weight: "bold" };
            return { size: 11, weight: "bold" };
          }, padding: 4 },
          backgroundColor: (ctx) => {
            const d2 = ctx.raw?._data;
            return d2 ? scoreColor2(d2.qualityScore, ctx.active ? 0.9 : 0.72) : "#888";
          },
          borderColor: (ctx) => {
            const d2 = ctx.raw?._data;
            return d2 ? ctx.active ? "rgba(240,246,252,0.92)" : scoreColor2(d2.qualityScore, 1) : "#666";
          },
          borderWidth: (ctx) => ctx.active ? 3 : 2,
          borderRadius: 6,
          spacing: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        onHover: (event, elements) => {
          const target = event.native?.target;
          if (target) target.style.cursor = elements.length > 0 ? "pointer" : "default";
        },
        onClick: (_event, elements) => {
          if (elements.length === 0) return;
          const idx = elements[0].index;
          const ws = workspaces[idx];
          if (!ws) return;
          showTileDetail(ws, container);
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            displayColors: false,
            backgroundColor: "rgba(13,17,23,0.96)",
            borderColor: "rgba(240,246,252,0.08)",
            borderWidth: 1,
            cornerRadius: 10,
            titleColor: "#f0f6fc",
            bodyColor: "#c9d1d9",
            bodySpacing: 4,
            titleSpacing: 4,
            titleMarginBottom: 6,
            padding: 12,
            caretPadding: 10,
            callbacks: {
              title: (items) => items[0]?.raw?._data?.name || "",
              label: (ctx) => {
                const d2 = ctx.raw?._data;
                if (!d2) return "";
                return [
                  `Harness: ${d2.harness}`,
                  `Requests: ${d2.requests.toLocaleString()} / Sessions: ${d2.sessions}`,
                  `Context Score: ${d2.score}/100 / Quality: ${d2.qualityScore}/100`,
                  `Config Files: ${d2.files}${d2.badges.length > 0 ? ` (${d2.badges.join(", ")})` : ""}`,
                  `Last Active: ${d2.lastActivity}`,
                  d2.stale ? d2.staleDays != null ? `Stale context (${d2.staleDays} days)` : "No context files" : "",
                  "",
                  "Click for details & suggestions"
                ].filter(Boolean);
              }
            }
          }
        }
      }
    });
    trackChart(chart);
    activeTreemapChart = chart;
  }
  function showTileDetail(ws, container) {
    const detailEl = container.querySelector("#ctxTileDetail");
    if (!detailEl) return;
    const pdC = ws.progressiveDisclosureScore >= 45 ? COLORS.green : ws.progressiveDisclosureScore >= 25 ? COLORS.yellow : COLORS.red;
    const iqC = ws.instructionQualityScore >= 45 ? COLORS.green : ws.instructionQualityScore >= 25 ? COLORS.yellow : COLORS.red;
    const uniqueHarness = [...new Set(ws.harness.split(", "))].join(", ");
    const badges = [];
    if (ws.hasInstructions) badges.push(bdg("Instructions", COLORS.blue));
    if (ws.hasPrompts) badges.push(bdg("Prompts", COLORS.purple));
    if (ws.hasAgents) badges.push(bdg("Agents", COLORS.cyan));
    if (ws.hasSkills) badges.push(bdg("Skills", COLORS.green));
    if (ws.hasHooks) badges.push(bdg("Hooks", COLORS.orange));
    if (ws.staleContext) badges.push(bdg(ws.staleDays != null ? `Stale (${ws.staleDays}d)` : "No context", COLORS.red));
    if (badges.length === 0) badges.push(bdg("No config files", COLORS.muted));
    const lastAct = ws.lastActivity ? new Date(ws.lastActivity).toLocaleDateString() : "N/A";
    detailEl.style.display = "block";
    render(html2`
    <div style="margin:12px 0;border-radius:8px;background:var(--card-bg, #161b22);border:1px solid var(--border-color, #30363d);overflow:hidden;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;">
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-weight:600;font-size:14px;">${ws.workspaceName}</span>
            <span style="font-size:11px;color:${hc(uniqueHarness.split(", ")[0])};">${uniqueHarness}</span>
          </div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${ws.requestCount} requests / ${ws.sessionCount} sessions / last: ${lastAct}</div>
        </div>
        <div style="display:flex;gap:16px;text-align:center;flex-shrink:0;">
          <div><div style="font-size:16px;font-weight:700;color:${pdC};">${ws.progressiveDisclosureScore}</div><div style="font-size:10px;color:var(--text-muted);">Disclosure</div></div>
          <div><div style="font-size:16px;font-weight:700;color:${iqC};">${ws.instructionQualityScore}</div><div style="font-size:10px;color:var(--text-muted);">Quality</div></div>
        </div>
        <button id="ctxTileClose" style="margin-left:12px;background:none;border:none;color:var(--text-muted);font-size:18px;cursor:pointer;padding:4px 8px;line-height:1;">${"\xD7"}</button>
      </div>
      <div style="padding:0 16px 16px;border-top:1px solid var(--border-color, #30363d);">
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin:12px 0 8px;">${badges}</div>
        ${ws.configFiles.length > 0 ? renderCfgFiles(ws.configFiles) : html2`<div style="padding:8px 0;font-size:12px;color:var(--text-muted);">No context files found.</div>`}
        ${ws.hookCoverage ? renderHooks(ws.hookCoverage) : null}
        ${ws.suggestions.length > 0 ? renderSuggestions(ws.suggestions) : null}
      </div>
    </div>`, detailEl);
    detailEl.querySelector("#ctxTileClose")?.addEventListener("click", () => {
      detailEl.style.display = "none";
    });
    detailEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  function renderContextProvision(byHarness) {
    const entries = Object.values(byHarness);
    if (entries.length === 0) return null;
    currentProvisionRows = entries.map((e2) => ({
      entry: e2,
      fp: e2.totalRequests > 0 ? Math.round(e2.withFileRefs / e2.totalRequests * 100) : 0,
      ip: e2.totalRequests > 0 ? Math.round(e2.withCustomInstructions / e2.totalRequests * 100) : 0,
      sp: e2.totalRequests > 0 ? Math.round(e2.withSkills / e2.totalRequests * 100) : 0,
      tp: e2.totalRequests > 0 ? Math.round(e2.withTools / e2.totalRequests * 100) : 0
    }));
    return html2`
    <h3 style="margin-top:24px;">Context Provision by Harness</h3>
    <p style="color:var(--text-muted);font-size:12px;margin:4px 0 8px;">Click a row to show the detailed breakdown below.</p>
    <div style="overflow-x:auto;margin:12px 0;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead><tr style="text-align:left;border-bottom:1px solid var(--border-color, #30363d);">
          <th style="padding:8px;">Harness</th><th style="padding:8px;">Requests</th>
          <th style="padding:8px;">File Refs</th><th style="padding:8px;">Instructions</th>
          <th style="padding:8px;">Skills</th><th style="padding:8px;">Tools</th>
          <th style="padding:8px;">Avg Context</th><th style="padding:8px;">Score</th>
        </tr></thead>
        <tbody>${currentProvisionRows.map((row, idx) => {
      const e2 = row.entry;
      const sc = e2.score >= 45 ? COLORS.green : e2.score >= 25 ? COLORS.yellow : COLORS.red;
      const pFmt = (n3) => e2.totalRequests > 0 ? `${n3} (${Math.round(n3 / e2.totalRequests * 100)}%)` : "0";
      return html2`
            <tr class="ctx-provision-row" data-provision-idx=${String(idx)} data-active="false" style="border-bottom:1px solid var(--border-color, #30363d);cursor:pointer;transition:background 0.15s;" title="Click for breakdown">
              <td style="padding:8px;font-weight:500;color:${hc(e2.harness)};">${e2.harness}</td>
              <td style="padding:8px;">${e2.totalRequests.toLocaleString()}</td>
              <td style="padding:8px;">${pFmt(e2.withFileRefs)}</td>
              <td style="padding:8px;">${pFmt(e2.withCustomInstructions)}</td>
              <td style="padding:8px;">${pFmt(e2.withSkills)}</td>
              <td style="padding:8px;">${pFmt(e2.withTools)}</td>
              <td style="padding:8px;">${e2.avgContextItems.toFixed(1)}</td>
              <td style="padding:8px;font-weight:600;color:${sc};">${Math.round(e2.score)}/100</td>
            </tr>`;
    })}</tbody>
      </table>
    </div>
    <div id="ctxProvisionDetailPanel" style="display:none;margin-top:12px;"></div>`;
  }
  function renderProvisionDetailPanel(row) {
    return html2`<div style="border:1px solid var(--border-color, #30363d);border-radius:10px;overflow:hidden;background:var(--card-bg, #161b22);">
    ${renderProvisionDetail(row.entry, row.fp, row.ip, row.sp, row.tp)}
  </div>`;
  }
  function renderProvisionDetail(e2, fp, ip, sp, tp) {
    const sc = e2.score >= 45 ? COLORS.green : e2.score >= 25 ? COLORS.yellow : COLORS.red;
    const cancelColor = e2.cancelRate > 30 ? COLORS.red : e2.cancelRate > 15 ? COLORS.yellow : COLORS.green;
    const promptQuality = e2.avgPromptLength >= 200 ? "Detailed" : e2.avgPromptLength >= 80 ? "Moderate" : "Brief";
    const promptColor = e2.avgPromptLength >= 200 ? COLORS.green : e2.avgPromptLength >= 80 ? COLORS.yellow : COLORS.red;
    return html2`
    <div style="padding:16px 20px;background:var(--bg-secondary, #0d1117);">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
        <span style="font-size:20px;font-weight:700;color:${sc};">${Math.round(e2.score)}</span>
        <span style="font-size:12px;color:var(--text-muted);">/100</span>
        <span style="font-weight:600;font-size:14px;color:${hc(e2.harness)};">${e2.harness}</span>
        <span style="margin-left:auto;font-size:11px;color:var(--text-muted);">${e2.totalSessions.toLocaleString()} sessions \u00B7 ${e2.totalRequests.toLocaleString()} requests</span>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:14px;margin-bottom:18px;">
        ${sBar("File References (30%)", fp)}${sBar("Custom Instructions (30%)", ip)}
        ${sBar("Skills Used (20%)", sp)}${sBar("Tool Usage (20%)", tp)}
      </div>

      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px;">
        ${metricCard("Avg Reqs / Session", String(e2.avgRequestsPerSession), "var(--text-primary, #c9d1d9)")}
        ${metricCard("Avg Prompt Length", `${e2.avgPromptLength.toLocaleString()} chars`, promptColor, promptQuality)}
        ${metricCard("Avg Response Length", `${e2.avgResponseLength.toLocaleString()} chars`, "var(--text-primary, #c9d1d9)")}
        ${metricCard("Cancel Rate", `${e2.cancelRate}%`, cancelColor)}
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:16px;">
        ${rankList("Mode Distribution", e2.modeDistribution.map((m2) => ({ label: m2.mode, count: m2.count })), e2.totalRequests)}
        ${rankList("Top Models", e2.topModels.map((m2) => ({ label: m2.model, count: m2.count })), e2.totalRequests)}
        ${rankList("Top Tools", e2.topTools.map((t3) => ({ label: t3.tool, count: t3.count })), e2.totalRequests)}
        ${rankList("Top Referenced Files", e2.topReferencedFiles.map((f2) => ({ label: f2.file, count: f2.count })), e2.withFileRefs || 1)}
      </div>
    </div>`;
  }
  function metricCard(label, value, color2, subtitle) {
    return html2`<div style="padding:8px 10px;border-radius:6px;background:var(--bg-tertiary, #161b22);">
    <div style="font-size:10px;color:var(--text-muted);margin-bottom:2px;">${label}</div>
    <div style="font-size:15px;font-weight:600;color:${color2};">${value}</div>
    ${subtitle ? html2`<div style="font-size:10px;color:var(--text-muted);margin-top:1px;">${subtitle}</div>` : null}
  </div>`;
  }
  function rankList(title, items, total) {
    if (items.length === 0) return html2`<div style="padding:8px 10px;border-radius:6px;background:var(--bg-tertiary, #161b22);"><div style="font-size:11px;font-weight:500;color:var(--text-muted);margin-bottom:6px;">${title}</div><div style="font-size:11px;color:var(--text-muted);font-style:italic;">No data</div></div>`;
    return html2`<div style="padding:8px 10px;border-radius:6px;background:var(--bg-tertiary, #161b22);">
    <div style="font-size:11px;font-weight:500;color:var(--text-muted);margin-bottom:6px;">${title}</div>
    ${items.map((it) => {
      const pct = total > 0 ? Math.round(it.count / total * 100) : 0;
      return html2`<div class="tip-left" style="display:flex;align-items:center;gap:6px;margin-bottom:4px;" data-tip=${it.label} tabindex=${0} aria-label=${it.label}>
        <div style="flex:1;min-width:0;">
          <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:1px;min-width:0;">
            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;">${it.label}</span>
            <span style="color:var(--text-muted);flex-shrink:0;margin-left:4px;">${it.count} (${pct}%)</span>
          </div>
          <div style="height:3px;border-radius:2px;background:var(--bg-secondary, #0d1117);overflow:hidden;">
            <div style="width:${pct}%;height:100%;background:${COLORS.blue};border-radius:2px;"></div>
          </div>
        </div>
      </div>`;
    })}
  </div>`;
  }
  function sBar(label, pct, tooltip) {
    const c2 = pct >= 45 ? COLORS.green : pct >= 25 ? COLORS.yellow : COLORS.red;
    return html2`<div data-tip=${tooltip || void 0} tabindex=${tooltip ? 0 : void 0} aria-label=${tooltip || void 0}><div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px;"><span>${label}</span><span style="color:${c2};font-weight:600;">${pct}%</span></div><div style="height:6px;border-radius:3px;background:var(--bg-secondary, #161b22);overflow:hidden;"><div style="width:${pct}%;height:100%;background:${c2};border-radius:3px;"></div></div></div>`;
  }
  function renderCfgFiles(files) {
    return html2`<div style="margin:8px 0;"><div style="font-weight:500;font-size:13px;margin-bottom:6px;color:var(--text-secondary, #c9d1d9);">Config Files</div><div style="display:flex;flex-direction:column;gap:4px;">${files.map((f2) => {
      const sc = f2.sizeVerdict === "oversized" ? COLORS.red : f2.sizeVerdict === "moderate" ? COLORS.yellow : COLORS.green;
      const sl = f2.sizeVerdict === "oversized" ? "OVERSIZED" : f2.sizeVerdict === "moderate" ? "moderate" : "compact";
      const ki = fKindIcon(f2.kind);
      const ic = f2.markdownIssues.length;
      return html2`<div style="display:flex;align-items:center;gap:8px;padding:4px 8px;border-radius:4px;background:var(--bg-secondary, #0d1117);font-size:12px;">
      <span style="width:16px;text-align:center;">${ki}</span>
      <span style="flex:1;font-family:monospace;">${f2.relativePath}</span>
      <span style="color:var(--text-muted);">${f2.lines} lines</span>
      <span style="color:var(--text-muted);">${fmtSz(f2.chars)}</span>
      <span style="color:${sc};font-size:11px;font-weight:500;">${sl}</span>
      ${f2.lastModified ? html2`<span style="color:var(--text-muted);font-size:11px;" title="Last modified">${new Date(f2.lastModified).toLocaleDateString()}</span>` : null}
      ${ic > 0 ? html2`<span style="color:${COLORS.yellow};font-size:11px;" title=${f2.markdownIssues.join("; ")}>${ic} issue${ic > 1 ? "s" : ""}</span>` : null}
    </div>`;
    })}</div></div>`;
  }
  function renderHooks(hooks) {
    const evts = [
      { n: "PreToolUse", a: hooks.hasPreToolUse, d: "Security boundaries" },
      { n: "PostToolUse", a: hooks.hasPostToolUse, d: "Auto-formatting, audit logging" },
      { n: "SessionStart", a: hooks.hasSessionStart, d: "Environment sync" },
      { n: "PermissionRequest", a: hooks.hasPermissionRequest, d: "Auto-approve/deny" }
    ];
    const extra = hooks.hookEvents.filter((e2) => !["PreToolUse", "PostToolUse", "SessionStart", "PermissionRequest"].includes(e2));
    return html2`<div style="margin:8px 0;"><div style="font-weight:500;font-size:13px;margin-bottom:6px;color:var(--text-secondary);">Hook Coverage (${hooks.totalHooks})</div><div style="display:flex;flex-wrap:wrap;gap:6px;">${evts.map((e2) => {
      const c2 = e2.a ? COLORS.green : COLORS.muted;
      return html2`<div style="padding:4px 10px;border-radius:4px;background:var(--bg-secondary, #0d1117);font-size:12px;display:flex;align-items:center;gap:4px;" title=${e2.d}><span style="color:${c2};">${e2.a ? "\u2713" : "\u2717"}</span><span style="color:${e2.a ? "var(--text-primary)" : "var(--text-muted)"};">${e2.n}</span></div>`;
    })}</div>${extra.length > 0 ? html2`<div style="margin-top:4px;font-size:11px;color:var(--text-muted);">Additional: ${extra.join(", ")}</div>` : null}</div>`;
  }
  function renderSuggestions(suggestions) {
    return html2`<div style="margin:8px 0;padding:8px 12px;border-radius:6px;border-left:3px solid ${COLORS.yellow};background:rgba(210,153,34,0.05);"><div style="font-size:12px;font-weight:500;color:${COLORS.yellow};margin-bottom:4px;">Suggestions</div><ul style="margin:0;padding-left:16px;font-size:12px;color:var(--text-secondary, #8b949e);">${suggestions.slice(0, 5).map((s2) => html2`<li style="margin:2px 0;">${s2}</li>`)}</ul></div>`;
  }
  function bdg(label, color2) {
    return html2`<span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:500;color:${color2};border:1px solid ${color2};opacity:0.9;">${label}</span>`;
  }
  function fKindIcon(kind) {
    switch (kind) {
      case "instruction":
        return "\u{1F4DC}";
      case "prompt":
        return "\u{1F4AC}";
      case "agent":
        return "\u{1F916}";
      case "skill":
        return "\u26A1";
      case "hook-config":
        return "\u{1F517}";
      case "claude-md":
        return "\u{1F4D6}";
      default:
        return "\u{1F4C4}";
    }
  }
  function fmtSz(chars) {
    return chars < 1e3 ? `${chars}c` : `${(chars / 1e3).toFixed(1)}k`;
  }

  // src/webview/svg-icons.ts
  var icon = (d2) => html2`<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" dangerouslySetInnerHTML=${{ __html: d2 }}></svg>`;
  var SVG = {
    /* ── Level Up / Feature Icons ─────────────────────────────────── */
    gear: icon('<path d="M8 10a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" stroke-width="1.3"/><path d="M13.3 6.5l-.9-.2a4.8 4.8 0 00-.5-1.2l.5-.8a.5.5 0 00-.1-.6l-.9-.9a.5.5 0 00-.6-.1l-.8.5a4.8 4.8 0 00-1.2-.5l-.2-.9a.5.5 0 00-.5-.4H6.8a.5.5 0 00-.5.4l-.2.9c-.4.1-.8.3-1.2.5l-.8-.5a.5.5 0 00-.6.1l-.9.9a.5.5 0 00-.1.6l.5.8c-.2.4-.4.8-.5 1.2l-.9.2a.5.5 0 00-.4.5v1.3a.5.5 0 00.4.5l.9.2c.1.4.3.8.5 1.2l-.5.8a.5.5 0 00.1.6l.9.9a.5.5 0 00.6.1l.8-.5c.4.2.8.4 1.2.5l.2.9a.5.5 0 00.5.4h1.3a.5.5 0 00.5-.4l.2-.9c.4-.1.8-.3 1.2-.5l.8.5a.5.5 0 00.6-.1l.9-.9a.5.5 0 00.1-.6l-.5-.8c.2-.4.4-.8.5-1.2l.9-.2a.5.5 0 00.4-.5V7a.5.5 0 00-.4-.5z" stroke="currentColor" stroke-width="1.2"/>'),
    trophy: icon('<path d="M5 2h6v5a3 3 0 01-6 0V2z" stroke="currentColor" stroke-width="1.3"/><path d="M5 4H3a1 1 0 00-1 1v1a2 2 0 002 2h1M11 4h2a1 1 0 011 1v1a2 2 0 01-2 2h-1" stroke="currentColor" stroke-width="1.2"/><path d="M6 10.5v1.5h4v-1.5M5 14h6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>'),
    brain: icon('<path d="M8 14V8M8 8C8 6 6.5 4.5 5 4.5S2 5.5 2 7c0 1 .5 1.8 1.2 2.3M8 8c0-2 1.5-3.5 3-3.5S14 5.5 14 7c0 1-.5 1.8-1.2 2.3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M3.2 9.3C2.5 10 2.5 11 3 11.8c.5.7 1.5 1 2.3.8M12.8 9.3c.7.7.7 1.7.2 2.5-.5.7-1.5 1-2.3.8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>'),
    clipboard: icon('<path d="M5 2h1a2 2 0 014 0h1a1 1 0 011 1v10a1 1 0 01-1 1H5a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" stroke-width="1.3"/><path d="M6.5 2.5a1.5 1.5 0 013 0" stroke="currentColor" stroke-width="1.2"/><path d="M6 7h4M6 9.5h3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>'),
    refresh: icon('<path d="M2.5 8a5.5 5.5 0 019.5-3.5M13.5 8a5.5 5.5 0 01-9.5 3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M12 2v3h-3M4 14v-3h3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>'),
    barChart: icon('<rect x="1" y="9" width="3" height="5" rx="0.5" fill="currentColor"/><rect x="5.5" y="5" width="3" height="9" rx="0.5" fill="currentColor"/><rect x="10" y="2" width="3" height="12" rx="0.5" fill="currentColor"/>'),
    /* ── Achievements ───────────────────────────────────────────── */
    penguin: icon('<ellipse cx="8" cy="10" rx="4" ry="5" stroke="currentColor" stroke-width="1.3" fill="none"/><ellipse cx="8" cy="10" rx="2" ry="3.5" stroke="currentColor" stroke-width="1" fill="none"/><circle cx="6.5" cy="7.5" r="0.7" fill="currentColor"/><circle cx="9.5" cy="7.5" r="0.7" fill="currentColor"/><path d="M7 4C7 2.5 8 1.5 8 1.5s1 1 1 2.5" stroke="currentColor" stroke-width="1"/>'),
    fire: icon('<path d="M8 2c0 2-2 3.5-2 6a2.5 2.5 0 005 0c0-2.5-2-4-2-6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 10a1.5 1.5 0 003 0c0-1-1-2-1.5-3-.5 1-1.5 2-1.5 3z" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/>'),
    runner: icon('<circle cx="10" cy="3" r="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M4 8l3-1.5L9 8l2.5-2M7 6.5L5.5 11l2 .5M9 8l1 3.5 2-.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>'),
    chat: icon('<path d="M2 3a1 1 0 011-1h10a1 1 0 011 1v7a1 1 0 01-1 1H6l-3 2.5V11H3a1 1 0 01-1-1V3z" stroke="currentColor" stroke-width="1.3"/><path d="M5 5.5h6M5 8h4" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>'),
    robot: icon('<rect x="3" y="4" width="10" height="8" rx="2" stroke="currentColor" stroke-width="1.3"/><circle cx="6" cy="8" r="1" fill="currentColor"/><circle cx="10" cy="8" r="1" fill="currentColor"/><path d="M8 2v2M6 12v2M10 12v2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M1 7h2M13 7h2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>'),
    flexBicep: icon('<path d="M4 8h2l1-4h2l1 4h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 8v4M11 8v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M5 12h6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>'),
    crown: icon('<path d="M2 11l2-5 2 3 2-4 2 4 2-3 2 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><rect x="2" y="11" width="12" height="2.5" rx="0.5" stroke="currentColor" stroke-width="1.2"/>'),
    globe: icon('<circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.3"/><ellipse cx="8" cy="8" rx="3" ry="6" stroke="currentColor" stroke-width="1.1"/><path d="M2 8h12M3 5 h10M3 11h10" stroke="currentColor" stroke-width="0.8"/>'),
    wrench: icon('<rect x="3" y="6" width="10" height="5" rx="1" stroke="currentColor" stroke-width="1.3"/><path d="M6 6V4a2 2 0 014 0v2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><circle cx="8" cy="8.5" r="1" fill="currentColor"/>'),
    microscope: icon('<circle cx="8" cy="5" r="3" stroke="currentColor" stroke-width="1.3"/><path d="M11 5h2M3 5H5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><path d="M8 8v2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><rect x="5" y="10" width="6" height="3" rx="1" stroke="currentColor" stroke-width="1.2"/>'),
    dinosaur: icon('<path d="M11 3c1-1 3-.5 3 1s-1 2-2 2h-1l-1 2-2 1v3l-1 2H5l1-2V9L4 8 3 6l1-1 3-.5L9 3h2z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><circle cx="12" cy="4.5" r="0.5" fill="currentColor"/>'),
    owl: icon('<circle cx="8" cy="8" r="5.5" stroke="currentColor" stroke-width="1.3"/><circle cx="6" cy="7" r="1.8" stroke="currentColor" stroke-width="1.1"/><circle cx="10" cy="7" r="1.8" stroke="currentColor" stroke-width="1.1"/><circle cx="6" cy="7" r="0.6" fill="currentColor"/><circle cx="10" cy="7" r="0.6" fill="currentColor"/><path d="M7.2 10l.8.8.8-.8" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 3.5L6 5.5M12 3.5L10 5.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>'),
    beach: icon('<circle cx="11" cy="3" r="2" stroke="currentColor" stroke-width="1.2"/><path d="M1 13c2-2 4-3 7-3s5 1 7 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M6 10V5L4 6M6 5l2 1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>'),
    meditation: icon('<circle cx="8" cy="3.5" r="2" stroke="currentColor" stroke-width="1.2"/><path d="M4 14c0-3 1.5-4 4-4s4 1 4 4M5 9l-2 1M11 9l2 1" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>'),
    handshake: icon('<path d="M1 7l3-3h2l2 2 2-2h2l3 3-2 2-2.5-1L8 10 5.5 8 3 9z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M6 10l-1 3M10 10l1 3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>'),
    bolt: icon('<path d="M9 1.5L4 8.5h4L7 14.5l5-7H8z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>'),
    /* ── Achievement categories ─────────────────────────────────── */
    boxPackage: icon('<path d="M2 5l6-3 6 3v7l-6 3-6-3V5z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M2 5l6 3 6-3M8 8v7" stroke="currentColor" stroke-width="1.1"/>'),
    calendar: icon('<rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M2 6.5h12M5 1.5v3M11 1.5v3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>'),
    rainbow: icon('<path d="M2 13a6 6 0 0112 0" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M4 13a4 4 0 018 0" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><path d="M6 13a2 2 0 014 0" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>'),
    confetti: icon('<path d="M2 14L6 4l2 3 3-2z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><circle cx="11" cy="3" r="0.8" fill="currentColor"/><circle cx="13" cy="6" r="0.8" fill="currentColor"/><circle cx="10" cy="7" r="0.8" fill="currentColor"/><path d="M9 2l1 1M12 4l1-1M13 8l-1 1" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>'),
    target: icon('<circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="8" r="3.5" stroke="currentColor" stroke-width="1.1"/><circle cx="8" cy="8" r="1" fill="currentColor"/>'),
    /* ── Learning system ────────────────────────────────────────── */
    snake: icon('<path d="M3 4c1-2 4-2 5 0s2 3 4 2 2-3 1-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M3 4c-1 2 0 4 2 5s4 0 5 2 0 4-2 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="12.5" cy="2.5" r="0.6" fill="currentColor"/>'),
    pencilDoc: icon('<path d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" stroke-width="1.2"/><path d="M10 2v3h3" stroke="currentColor" stroke-width="1.1"/><path d="M5 8h5M5 10.5h3" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>'),
    lightbulb: icon('<path d="M6 12h4M6.5 13.5h3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><path d="M5.5 9.5C4 8.5 3.5 7 4 5.5A4 4 0 018 2.5a4 4 0 014 3c.5 1.5 0 3-1.5 4v1h-5v-1z" stroke="currentColor" stroke-width="1.3"/>'),
    tree: icon('<path d="M8 14V8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M8 2L3 7h2.5L3 10h3v2h4v-2h3l-2.5-3H13z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>'),
    book: icon('<path d="M2 2.5C3 2 5 1.5 8 3c3-1.5 5-1 6-.5v10c-1-.5-3-1-6 .5-3-1.5-5-1-6-.5v-10z" stroke="currentColor" stroke-width="1.3"/><path d="M8 3v10" stroke="currentColor" stroke-width="1.1"/>'),
    gamepad: icon('<rect x="1" y="5" width="14" height="8" rx="3" stroke="currentColor" stroke-width="1.3"/><path d="M4.5 7.5v3M3 9h3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><circle cx="11" cy="8" r="0.7" fill="currentColor"/><circle cx="13" cy="10" r="0.7" fill="currentColor"/>'),
    checkCircle: icon('<circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.3"/><path d="M5.5 8l2 2 3.5-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>'),
    xCircle: icon('<circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.3"/><path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>'),
    arrowRight: icon('<path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>'),
    arrowLeft: icon('<path d="M13 8H3M7 4L3 8l4 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>'),
    warning: icon('<path d="M8 1.5L1 14h14L8 1.5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M8 6v4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><circle cx="8" cy="12" r="0.7" fill="currentColor"/>'),
    /* ── Xbox-style achievement extras ─────────────────────────── */
    share: icon('<path d="M4 9v4a1 1 0 001 1h6a1 1 0 001-1V9" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 2v8M5 5l3-3 3 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>'),
    lock: icon('<rect x="4" y="7" width="8" height="7" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M6 7V5a2 2 0 014 0v2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>'),
    unlock: icon('<rect x="4" y="7" width="8" height="7" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M6 7V5a2 2 0 014 0" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>'),
    star: icon('<path d="M8 1.5l2 4.1 4.5.6-3.3 3.2.8 4.5L8 11.7l-4 2.2.8-4.5L1.5 6.2l4.5-.6z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>'),
    starFilled: icon('<path d="M8 1.5l2 4.1 4.5.6-3.3 3.2.8 4.5L8 11.7l-4 2.2.8-4.5L1.5 6.2l4.5-.6z" fill="currentColor" stroke="currentColor" stroke-width="0.5"/>'),
    clock: icon('<circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.3"/><path d="M8 4v4l2.5 2.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>'),
    shield: icon('<path d="M8 1.5L2.5 4v4c0 3.5 2.5 5.5 5.5 6.5 3-1 5.5-3 5.5-6.5V4z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>'),
    shieldCheck: icon('<path d="M8 1.5L2.5 4v4c0 3.5 2.5 5.5 5.5 6.5 3-1 5.5-3 5.5-6.5V4z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M5.5 8l2 2 3.5-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>'),
    diamond: icon('<path d="M8 1L2 6l6 9 6-9z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M2 6h12" stroke="currentColor" stroke-width="1.1"/>'),
    hexagon: icon('<path d="M8 1.5L13.5 4.5v5L8 14.5L2.5 11.5v-5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>'),
    sparkle: icon('<path d="M8 1v3M8 12v3M1 8h3M12 8h3M3 3l2 2M11 11l2 2M13 3l-2 2M5 11l-2 2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>'),
    code: icon('<path d="M5 4L1.5 8 5 12M11 4l3.5 4L11 12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.5 2.5l-3 11" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>'),
    compass: icon('<circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.3"/><path d="M10.5 5.5L9 9 5.5 10.5 7 7z" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round" fill="currentColor" fill-opacity="0.3"/>'),
    layers: icon('<path d="M8 2L2 5.5 8 9l6-3.5z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M2 8l6 3.5L14 8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 10.5L8 14l6-3.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>'),
    zap: icon('<path d="M9 1L4 9h4l-1 6 5-8H8z" fill="currentColor" stroke="currentColor" stroke-width="0.5" stroke-linejoin="round"/>'),
    map: icon('<path d="M1.5 3.5l4-1.5v11l-4 1.5zm4-1.5l5 2v11l-5-2zm5 2l4-1.5v11l-4 1.5z" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/>'),
    terminal: icon('<rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M4 7l2.5 2L4 11M8 11h3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>'),
    repeat: icon('<path d="M11 2l2 2-2 2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 8V6a2 2 0 012-2h8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M5 14l-2-2 2-2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M13 8v2a2 2 0 01-2 2H3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>'),
    graduationCap: icon('<path d="M8 3L1 6.5 8 10l7-3.5z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M3 8v3.5c0 1.5 2.5 2.5 5 2.5s5-1 5-2.5V8" stroke="currentColor" stroke-width="1.2"/><path d="M14 6.5v4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>'),
    trendingUp: icon('<path d="M1.5 12l4-4 3 2 6-6.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 3.5h4.5V8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>'),
    externalLink: icon('<path d="M12 9v3.5a1.5 1.5 0 01-1.5 1.5h-7A1.5 1.5 0 012 12.5v-7A1.5 1.5 0 013.5 4H7" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M10 2h4v4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 9l7-7" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>')
  };

  // src/webview/page-achievements.ts
  function getAchState() {
    const s2 = vscode.getState();
    const as = s2?.achievementState ?? {};
    return { unlockDates: as.unlockDates ?? {} };
  }
  function saveAchState(state) {
    const s2 = vscode.getState() ?? {};
    vscode.setState({ ...s2, achievementState: state });
  }
  var LINUX_KERNEL_LOC = 278e5;
  var TIER_LABELS = {
    bronze: "Bronze",
    silver: "Silver",
    gold: "Gold",
    diamond: "Diamond"
  };
  var TIER_COLORS = {
    bronze: "#cd7f32",
    silver: "#8b949e",
    gold: "#d29922",
    diamond: "#58a6ff"
  };
  var CATEGORY_LABELS2 = {
    volume: "Volume",
    consistency: "Consistency",
    diversity: "Diversity",
    humor: "Fun & Quirky",
    mastery: "Mastery"
  };
  var CATEGORY_ICONS = {
    volume: SVG.layers,
    consistency: SVG.repeat,
    diversity: SVG.compass,
    humor: SVG.confetti,
    mastery: SVG.shieldCheck
  };
  function thresholdEval(field, target, labelFn) {
    return (s2) => {
      const value = s2[field];
      const pct = Math.min(100, value / target * 100);
      return { progress: pct, label: labelFn(value, target), unlocked: pct >= 100 };
    };
  }
  var ACHIEVEMENTS = [
    // Volume
    {
      id: "linux-kernel-1x",
      title: "Kernel Hacker",
      icon: SVG.penguin,
      tier: "gold",
      xp: 50,
      category: "volume",
      description: `Generated one Linux kernel worth of AI code (${formatNum(LINUX_KERNEL_LOC)} LoC)`,
      evaluate: thresholdEval("totalAiLoc", LINUX_KERNEL_LOC, (v2, t3) => `${formatNum(v2)} / ${formatNum(t3)} LoC`)
    },
    {
      id: "linux-kernel-5x",
      title: "Linus v2",
      icon: SVG.fire,
      tier: "diamond",
      xp: 100,
      category: "volume",
      description: "Generated 5x Linux kernels worth of AI code",
      evaluate: thresholdEval("totalAiLoc", LINUX_KERNEL_LOC * 5, (v2) => `${(v2 / LINUX_KERNEL_LOC).toFixed(1)}x kernels`)
    },
    {
      id: "thousand-sessions",
      title: "Session Marathoner",
      icon: SVG.runner,
      tier: "silver",
      xp: 25,
      category: "volume",
      description: "Started 1,000 coding agent sessions",
      evaluate: thresholdEval("totalSessions", 1e3, (v2) => `${formatNum(v2)} / 1,000`)
    },
    {
      id: "ten-k-requests",
      title: "10K Club",
      icon: SVG.chat,
      tier: "bronze",
      xp: 15,
      category: "volume",
      description: "Sent 10,000 requests to AI agents",
      evaluate: thresholdEval("totalRequests", 1e4, (v2) => `${formatNum(v2)} / 10K`)
    },
    {
      id: "hundred-k-requests",
      title: "The Machine",
      icon: SVG.robot,
      tier: "gold",
      xp: 50,
      category: "volume",
      description: "Sent 100,000 requests to AI agents",
      evaluate: thresholdEval("totalRequests", 1e5, (v2) => `${formatNum(v2)} / 100K`)
    },
    // Consistency
    {
      id: "streak-7",
      title: "Week Warrior",
      icon: SVG.flexBicep,
      tier: "bronze",
      xp: 10,
      category: "consistency",
      description: "7-day coding streak with AI",
      evaluate: thresholdEval("maxStreak", 7, (v2) => `${v2} / 7 days`)
    },
    {
      id: "streak-30",
      title: "Monthly Machine",
      icon: SVG.fire,
      tier: "silver",
      xp: 30,
      category: "consistency",
      description: "30-day coding streak with AI",
      evaluate: thresholdEval("maxStreak", 30, (v2) => `${v2} / 30 days`)
    },
    {
      id: "streak-100",
      title: "Centurion",
      icon: SVG.crown,
      tier: "diamond",
      xp: 75,
      category: "consistency",
      description: "100-day coding streak with AI",
      evaluate: thresholdEval("maxStreak", 100, (v2) => `${v2} / 100 days`)
    },
    // Diversity
    {
      id: "polyglot",
      title: "Polyglot",
      icon: SVG.globe,
      tier: "silver",
      xp: 25,
      category: "diversity",
      description: "Used AI with 10+ programming languages",
      evaluate: thresholdEval("uniqueLanguages", 10, (v2) => `${v2} / 10 languages`)
    },
    {
      id: "model-explorer",
      title: "Model Explorer",
      icon: SVG.microscope,
      tier: "silver",
      xp: 20,
      category: "diversity",
      description: "Used 5+ different AI models",
      evaluate: thresholdEval("uniqueModels", 5, (v2) => `${v2} / 5 models`)
    },
    // Mastery
    {
      id: "tool-master",
      title: "Toolsmith",
      icon: SVG.wrench,
      tier: "gold",
      xp: 40,
      category: "mastery",
      description: "Used 20+ different AI tools",
      evaluate: thresholdEval("uniqueTools", 20, (v2) => `${v2} / 20 tools`)
    },
    {
      id: "patient-one",
      title: "The Patient One",
      icon: SVG.meditation,
      tier: "gold",
      xp: 40,
      category: "mastery",
      description: "Cancel rate below 5% over 1000+ requests",
      evaluate: (s2) => {
        if (s2.totalRequests < 1e3) return { progress: Math.min(100, s2.totalRequests / 1e3 * 100), label: `${formatNum(s2.totalRequests)}/1K needed`, unlocked: false };
        const pct = s2.cancelRate < 5 ? 100 : Math.max(0, 100 - (s2.cancelRate - 5) * 20);
        return { progress: pct, label: `${s2.cancelRate.toFixed(1)}% cancel rate`, unlocked: s2.cancelRate < 5 };
      }
    },
    {
      id: "pair-programmer",
      title: "True Pair Programmer",
      icon: SVG.handshake,
      tier: "silver",
      xp: 25,
      category: "mastery",
      description: "Average 20+ requests per session",
      evaluate: thresholdEval("avgSessionRequests", 20, (v2) => `${v2.toFixed(1)} avg reqs/session`)
    },
    // Humor / Fun
    {
      id: "dinosaur",
      title: "Digital Dinosaur",
      icon: SVG.dinosaur,
      tier: "silver",
      xp: 20,
      category: "humor",
      description: "Used AI with legacy tech (COBOL, Fortran, jQuery...)",
      evaluate: (s2) => {
        const pct = s2.oldTechCount > 0 ? 100 : 0;
        return { progress: pct, label: s2.oldTechCount > 0 ? `${s2.oldTechCount} legacy sessions` : "No legacy tech", unlocked: pct >= 100 };
      }
    },
    {
      id: "night-owl",
      title: "Night Owl",
      icon: SVG.owl,
      tier: "bronze",
      xp: 15,
      category: "humor",
      description: "500+ requests between midnight and 5am",
      evaluate: thresholdEval("lateNightRequests", 500, (v2) => `${v2} / 500`)
    },
    {
      id: "weekend-warrior",
      title: "Weekend Warrior",
      icon: SVG.beach,
      tier: "bronze",
      xp: 15,
      category: "humor",
      description: "1,000+ requests on weekends",
      evaluate: thresholdEval("weekendRequests", 1e3, (v2) => `${formatNum(v2)} / 1,000`)
    },
    {
      id: "speed-demon",
      title: "Speed Demon",
      icon: SVG.bolt,
      tier: "silver",
      xp: 20,
      category: "humor",
      description: "Peak hour with 50+ requests",
      evaluate: thresholdEval("hourlyPeak", 50, (v2) => `${v2} / 50 peak/hr`)
    }
  ];
  var LEGACY_TECH = /* @__PURE__ */ new Set([
    "cobol",
    "fortran",
    "perl",
    "basic",
    "vb6",
    "visualbasic",
    "pascal",
    "delphi",
    "assembly",
    "asm",
    "ada",
    "mumps",
    "rpg",
    "clipper",
    "foxpro",
    "tcl",
    "awk"
  ]);
  var LEGACY_KEYWORDS = ["jquery", "backbone", "knockout", "extjs", "prototype.js", "mootools", "coffeescript"];
  function formatDate2(ts) {
    const d2 = new Date(ts);
    const now = /* @__PURE__ */ new Date();
    const diffDays = Math.floor((now.getTime() - d2.getTime()) / 864e5);
    if (diffDays === 0) return "today";
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return d2.toLocaleDateString("en-US", { month: "short", day: "numeric", year: d2.getFullYear() !== now.getFullYear() ? "numeric" : void 0 });
  }
  function estimateUnlockDate(id, stats) {
    const locThresholds = {
      "linux-kernel-1x": LINUX_KERNEL_LOC,
      "linux-kernel-5x": LINUX_KERNEL_LOC * 5
    };
    const requestThresholds = {
      "ten-k-requests": 1e4,
      "hundred-k-requests": 1e5
    };
    const sessionThresholds = {
      "thousand-sessions": 1e3
    };
    const streakThresholds = {
      "streak-7": 7,
      "streak-30": 30,
      "streak-100": 100
    };
    const gradualAchievements = /* @__PURE__ */ new Set([
      "polyglot",
      "model-explorer",
      "tool-master",
      "night-owl",
      "weekend-warrior",
      "speed-demon",
      "patient-one",
      "pair-programmer",
      "dinosaur"
    ]);
    if (id in locThresholds) return findThresholdDate(stats.dailyLabels, stats.dailyCumulativeLoc, locThresholds[id]);
    if (id in requestThresholds) return findThresholdDate(stats.dailyLabels, stats.dailyCumulativeReqs, requestThresholds[id]);
    if (id in sessionThresholds) return findThresholdDate(stats.dailyLabels, stats.dailyCumulativeSessions, sessionThresholds[id]);
    if (id in streakThresholds) return findStreakDate(stats.dailyLabels, streakThresholds[id]);
    if (!gradualAchievements.has(id) || stats.dailyLabels.length === 0) return null;
    const idx = Math.floor(stats.dailyLabels.length * 0.75);
    return (/* @__PURE__ */ new Date(stats.dailyLabels[Math.min(idx, stats.dailyLabels.length - 1)] + "T12:00:00")).getTime();
  }
  function findStreakDate(labels, target) {
    if (labels.length === 0) return null;
    let streak = 1;
    for (let i2 = 1; i2 < labels.length; i2++) {
      const prev = new Date(labels[i2 - 1]);
      const curr = new Date(labels[i2]);
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / 864e5);
      if (diffDays === 1) {
        streak++;
        if (streak >= target) {
          return (/* @__PURE__ */ new Date(labels[i2] + "T12:00:00")).getTime();
        }
      } else {
        streak = 1;
      }
    }
    return null;
  }
  function findThresholdDate(labels, cumulative, threshold) {
    for (let i2 = 0; i2 < cumulative.length; i2++) {
      if (cumulative[i2] >= threshold) {
        return (/* @__PURE__ */ new Date(labels[i2] + "T12:00:00")).getTime();
      }
    }
    return null;
  }
  function buildDailyCumulative(labels, loc, reqs, sessions) {
    const dailyCumulativeLoc = [];
    const dailyCumulativeReqs = [];
    const dailyCumulativeSessions = [];
    let cumLoc = 0;
    let cumReqs = 0;
    let cumSess = 0;
    for (let i2 = 0; i2 < labels.length; i2++) {
      cumLoc += loc[i2] ?? 0;
      cumReqs += reqs[i2] ?? 0;
      cumSess += sessions[i2] ?? 0;
      dailyCumulativeLoc.push(cumLoc);
      dailyCumulativeReqs.push(cumReqs);
      dailyCumulativeSessions.push(cumSess);
    }
    return { dailyLabels: labels, dailyCumulativeLoc, dailyCumulativeReqs, dailyCumulativeSessions };
  }
  function evaluateAchievements(stats) {
    const achState = getAchState();
    const now = Date.now();
    const evaluated = ACHIEVEMENTS.map((ach) => {
      const result = ach.evaluate(stats);
      if (result.unlocked && !achState.unlockDates[ach.id]) {
        achState.unlockDates[ach.id] = estimateUnlockDate(ach.id, stats) ?? now;
      }
      return { ...ach, result, unlockedAt: achState.unlockDates[ach.id] ?? null };
    });
    saveAchState(achState);
    return {
      evaluated,
      unlocked: evaluated.filter((a2) => a2.result.unlocked),
      locked: evaluated.filter((a2) => !a2.result.unlocked).sort((a2, b2) => b2.result.progress - a2.result.progress)
    };
  }
  function renderAchievementPage(container, achievementStats, evaluated, unlocked, locked) {
    const totalXP = unlocked.reduce((sum2, a2) => sum2 + a2.xp, 0);
    const maxXP = evaluated.reduce((sum2, a2) => sum2 + a2.xp, 0);
    const kernelCount = achievementStats.totalAiLoc / LINUX_KERNEL_LOC;
    const completePct = unlocked.length / evaluated.length * 100;
    const recentUnlock = unlocked.length > 0 ? [...unlocked].sort((a2, b2) => (b2.unlockedAt ?? 0) - (a2.unlockedAt ?? 0))[0] : null;
    const tierCounts = {
      bronze: { unlocked: 0, total: 0 },
      silver: { unlocked: 0, total: 0 },
      gold: { unlocked: 0, total: 0 },
      diamond: { unlocked: 0, total: 0 }
    };
    for (const a2 of evaluated) {
      tierCounts[a2.tier].total++;
      if (a2.result.unlocked) tierCounts[a2.tier].unlocked++;
    }
    const categories = ["volume", "consistency", "diversity", "mastery", "humor"];
    const roadmapSections = categories.map((cat) => {
      const catAchs = evaluated.filter((a2) => a2.category === cat);
      const catUnlocked = catAchs.filter((a2) => a2.result.unlocked).length;
      return { cat, label: CATEGORY_LABELS2[cat], icon: CATEGORY_ICONS[cat], achievements: catAchs, unlocked: catUnlocked, total: catAchs.length };
    });
    render(html2`
    <div class="ach-page">
      <div class="ach-hero">
        <div class="ach-hero-left">
          <div class="ach-hero-icon">${SVG.trophy}</div>
          <div class="ach-hero-info">
            <h2 class="ach-hero-title">AI Engineer Roadmap</h2>
            <p class="ach-hero-sub">Your journey to mastering AI-assisted development</p>
          </div>
        </div>
        <div class="ach-hero-score">
          <div class="ach-hero-gs-value">${totalXP}</div>
          <div class="ach-hero-gs-label">/ ${maxXP} XP</div>
        </div>
      </div>
      <div class="ach-xp-bar">
        <div class="ach-xp-fill" style=${"width:" + completePct.toFixed(1) + "%"}></div>
        <div class="ach-xp-text">
          <span>${unlocked.length} / ${evaluated.length} Unlocked</span>
          <span>${completePct.toFixed(0)}%</span>
        </div>
      </div>
      <div class="ach-stat-row">
        <div class="ach-stat-tile"><div class="ach-stat-icon">${SVG.penguin}</div><div class="ach-stat-val">${kernelCount.toFixed(2)}x</div><div class="ach-stat-lbl">Linux Kernels</div></div>
        <div class="ach-stat-tile"><div class="ach-stat-icon">${SVG.code}</div><div class="ach-stat-val">${formatNum(achievementStats.totalAiLoc)}</div><div class="ach-stat-lbl">AI Lines of Code</div></div>
        <div class="ach-stat-tile"><div class="ach-stat-icon">${SVG.calendar}</div><div class="ach-stat-val">${achievementStats.maxStreak}d</div><div class="ach-stat-lbl">Longest Streak</div></div>
        <div class="ach-stat-tile"><div class="ach-stat-icon">${SVG.zap}</div><div class="ach-stat-val">${achievementStats.hourlyPeak}</div><div class="ach-stat-lbl">Peak Reqs/Hr</div></div>
      </div>
      <div class="ach-rarity-row">
        ${["bronze", "silver", "gold", "diamond"].map((t3) => html2`
          <div class="ach-rarity-chip" style=${"--rarity-color:" + TIER_COLORS[t3]}>
            <span class="ach-rarity-dot"></span>
            <span class="ach-rarity-name">${TIER_LABELS[t3]}</span>
            <span class="ach-rarity-count">${tierCounts[t3].unlocked}/${tierCounts[t3].total}</span>
          </div>`)}
      </div>
      ${recentUnlock && html2`
      <div class="ach-showcase">
        <div class="ach-showcase-badge">Latest Unlock</div>
        <div class="ach-showcase-inner">
          <div class="ach-showcase-icon" style=${"--rarity-color:" + TIER_COLORS[recentUnlock.tier]}>${recentUnlock.icon}</div>
          <div class="ach-showcase-info">
            <div class="ach-showcase-top">
              <span class="ach-showcase-title">${recentUnlock.title}</span>
              <span class="ach-rarity-tag" style=${"--rarity-color:" + TIER_COLORS[recentUnlock.tier]}>${TIER_LABELS[recentUnlock.tier]}</span>
              <span class="ach-gs-tag">${recentUnlock.xp} XP</span>
            </div>
            <div class="ach-showcase-desc">${recentUnlock.description}</div>
            <div class="ach-showcase-date">${SVG.clock} Unlocked ${recentUnlock.unlockedAt ? formatDate2(recentUnlock.unlockedAt) : "just now"}</div>
          </div>
          <button class="ach-share-btn" data-ach-id=${recentUnlock.id} title="Share">${SVG.share}</button>
        </div>
      </div>`}
      <div class="ach-roadmap" id="ach-roadmap">
        ${roadmapSections.map((section, si) => html2`
          <div class="ach-roadmap-section">
            <div class="ach-roadmap-header">
              <div class="ach-roadmap-header-left">
                <span class="ach-roadmap-icon">${section.icon}</span>
                <h3 class="ach-roadmap-title">${section.label}</h3>
              </div>
              <span class="ach-roadmap-count">${section.unlocked}/${section.total}</span>
            </div>
            <div class="ach-roadmap-track">
              ${section.achievements.map((ach, ai) => {
      const tierColor = TIER_COLORS[ach.tier];
      const done = ach.result.unlocked;
      const isLast = ai === section.achievements.length - 1;
      return html2`
                <div class=${"ach-roadmap-node" + (done ? " ach-node-done" : "")} data-category=${ach.category}>
                  ${!isLast && html2`<div class="ach-roadmap-connector" style=${"--progress-pct:" + (done ? 100 : ach.result.progress) + "%"}></div>`}
                  <div class="ach-roadmap-dot" style=${"--tier-color:" + tierColor}>${ach.icon}</div>
                  <div class="ach-roadmap-info">
                    <div class="ach-roadmap-info-top">
                      <span class="ach-roadmap-name">${ach.title}</span>
                      <span class="ach-tier-tag" style=${"--tier-color:" + tierColor}>${TIER_LABELS[ach.tier]}</span>
                      <span class="ach-xp-tag">${ach.xp} XP</span>
                    </div>
                    <div class="ach-roadmap-desc">${ach.description}</div>
                    <div class="ach-roadmap-bar-wrap">
                      <div class="ach-roadmap-bar">
                        <div class="ach-roadmap-bar-fill" style=${"width:" + ach.result.progress + "%;background:" + (done ? COLORS.green : ach.result.progress >= PROGRESS_ALMOST ? COLORS.yellow : ach.result.progress >= PROGRESS_STARTED ? COLORS.blue : "var(--border)")}></div>
                      </div>
                      <span class="ach-roadmap-bar-label">${ach.result.label}</span>
                    </div>
                    ${done && ach.unlockedAt && html2`<div class="ach-roadmap-date">${SVG.clock} ${formatDate2(ach.unlockedAt)}</div>`}
                  </div>
                  ${done ? html2`<button class="ach-share-btn" data-ach-id=${ach.id} title="Copy to clipboard">${SVG.share}</button>` : html2`<div class="ach-roadmap-lock">${SVG.lock}</div>`}
                </div>`;
    })}
            </div>
          </div>
          ${si < roadmapSections.length - 1 && html2`<div class="ach-roadmap-divider"></div>`}`)}
      </div>
      <div class="ach-tabs" id="ach-tabs">
        <button class="ach-tab ach-tab-active" data-cat="all">All (${evaluated.length})</button>
        ${categories.map((cat) => {
      const catAll = evaluated.filter((a2) => a2.category === cat);
      const catUnlocked = catAll.filter((a2) => a2.result.unlocked);
      return html2`<button class="ach-tab" data-cat=${cat}>${CATEGORY_ICONS[cat]} ${CATEGORY_LABELS2[cat]} (${catUnlocked.length}/${catAll.length})</button>`;
    })}
      </div>
      <div class="ach-list" id="ach-list">${renderAchList(unlocked, locked)}</div>
    </div>
  `, container);
  }
  async function renderAchievements(container, filter) {
    render(html2`<${LoadingScreen} message="Computing achievements..." />`, container);
    const [stats, production, balance, antiPatterns, hourly] = await rpcAllSettled([
      rpc("getStats", filter),
      rpc("getCodeProduction", filter),
      rpc("getWorkLifeBalance", filter),
      rpc("getAntiPatterns", filter),
      rpc("getHourlyDistribution", filter)
    ], [
      { totalSessions: 0, totalRequests: 0, totalWorkspaces: 0 },
      { summary: { totalAiLoc: 0, totalUserLoc: 0 } },
      null,
      { totalOccurrences: 0 },
      { hours: [] }
    ]);
    const sessions = await rpc("getSessions", { page: 1, pageSize: 100, filter });
    const dailyActivity = await rpc("getDailyActivity", filter);
    const allSessions = await rpc("getSessions", { page: 1, pageSize: 1, filter });
    const codeByLang = await rpc("getCodeProduction", filter);
    const consumption = await rpc("getConsumption", filter);
    const workflows = await rpc("getWorkflowOptimization", filter);
    const avgReqsPerSession = allSessions.total > 0 ? stats.totalRequests / allSessions.total : 0;
    const cancelRate = antiPatterns.totalOccurrences > 0 ? antiPatterns.totalOccurrences / stats.totalRequests * 100 : 0;
    const languages = codeByLang.byLanguage.labels.map((l2) => l2.toLowerCase());
    let oldTechCount = 0;
    for (const lang of languages) {
      if (LEGACY_TECH.has(lang)) oldTechCount++;
    }
    for (const sess of sessions.sessions) {
      const msg = sess.firstMessage?.toLowerCase() ?? "";
      for (const kw of LEGACY_KEYWORDS) {
        if (msg.includes(kw)) {
          oldTechCount++;
          break;
        }
      }
    }
    const achievementStats = {
      totalRequests: stats.totalRequests,
      totalAiLoc: production.summary.totalAiLoc,
      totalSessions: allSessions.total,
      totalDays: dailyActivity.labels.length,
      maxStreak: balance?.maxStreak ?? 0,
      uniqueLanguages: codeByLang.byLanguage.labels.length,
      uniqueModels: Object.keys(consumption.modelTotals).length,
      uniqueTools: workflows.clusters.length,
      weekendRequests: balance?.weekendReqs ?? 0,
      lateNightRequests: balance?.timeDistribution.lateNight ?? 0,
      avgSessionRequests: avgReqsPerSession,
      totalUserLoc: production.summary.totalUserLoc,
      cancelRate,
      topLanguage: codeByLang.byLanguage.labels[0] ?? "Unknown",
      oldTechCount,
      hourlyPeak: Math.max(...hourly.hours ?? [0]),
      ...buildDailyCumulative(dailyActivity.labels, dailyActivity.loc, dailyActivity.values, dailyActivity.sessions)
    };
    const { evaluated, unlocked, locked } = evaluateAchievements(achievementStats);
    renderAchievementPage(container, achievementStats, evaluated, unlocked, locked);
    const tabs = container.querySelectorAll(".ach-tab");
    const list = container.querySelector("#ach-list");
    for (const tab of tabs) {
      tab.addEventListener("click", () => {
        for (const t3 of tabs) t3.classList.remove("ach-tab-active");
        tab.classList.add("ach-tab-active");
        const cat = tab.dataset.cat;
        const filtered = cat === "all" ? evaluated : evaluated.filter((a2) => a2.category === cat);
        const fUnlocked = filtered.filter((a2) => a2.result.unlocked);
        const fLocked = filtered.filter((a2) => !a2.result.unlocked).sort((a2, b2) => b2.result.progress - a2.result.progress);
        render(renderAchList(fUnlocked, fLocked), list);
        wireShareButtons(container);
      });
    }
    wireShareButtons(container);
  }
  function wireShareButtons(container) {
    for (const btn of container.querySelectorAll(".ach-share-btn")) {
      btn.addEventListener("click", (e2) => {
        e2.stopPropagation();
        const achId = btn.dataset.achId;
        const ach = ACHIEVEMENTS.find((a2) => a2.id === achId);
        if (!ach) return;
        const text = `I unlocked "${ach.title}" in AI Engineer Coach! ${ach.description}`;
        void navigator.clipboard.writeText(text).then(() => {
          render(html2`${SVG.checkCircle}`, btn);
          btn.classList.add("ach-share-copied");
          setTimeout(() => {
            render(html2`${SVG.share}`, btn);
            btn.classList.remove("ach-share-copied");
          }, 2e3);
        });
      });
    }
  }
  function renderAchList(unlocked, locked) {
    return html2`
    ${unlocked.map((a2) => achievementRow(a2, true))}
    ${locked.length > 0 && html2`<div class="ach-locked-divider"><span class="ach-locked-label">${SVG.lock} Locked (${locked.length})</span></div>`}
    ${locked.map((a2) => achievementRow(a2, false))}
  `;
  }
  function achievementRow(ach, unlocked) {
    const tierColor = TIER_COLORS[ach.tier];
    const pColor = unlocked ? COLORS.green : ach.result.progress >= PROGRESS_ALMOST ? COLORS.yellow : ach.result.progress >= PROGRESS_STARTED ? COLORS.blue : "var(--border)";
    return html2`
    <div class=${"ach-row " + (unlocked ? "ach-row-unlocked" : "ach-row-locked")} data-category=${ach.category}>
      <div class=${"ach-row-icon" + (unlocked ? "" : " ach-row-icon-dim")} style=${"--rarity-color:" + tierColor}>
        ${ach.icon}
      </div>
      <div class="ach-row-body">
        <div class="ach-row-top">
          <span class="ach-row-title">${ach.title}</span>
          <span class="ach-rarity-tag" style=${"--rarity-color:" + tierColor}>${TIER_LABELS[ach.tier]}</span>
          <span class="ach-gs-tag">${ach.xp} XP</span>
        </div>
        <div class="ach-row-desc">${ach.description}</div>
        <div class="ach-row-progress">
          <div class="ach-row-bar">
            <div class="ach-row-bar-fill" style=${"width:" + ach.result.progress + "%;background:" + pColor}></div>
          </div>
          <span class="ach-row-bar-label">${ach.result.label}</span>
        </div>
        ${unlocked && ach.unlockedAt && html2`<div class="ach-row-date">${SVG.clock} ${formatDate2(ach.unlockedAt)}</div>`}
      </div>
      ${unlocked ? html2`<button class="ach-share-btn" data-ach-id=${ach.id} title="Copy to clipboard">${SVG.share}</button>` : html2`<div class="ach-row-lock">${SVG.lock}</div>`}
    </div>`;
  }

  // src/webview/page-learning-state.ts
  var DEFAULT_CONCEPTS = [
    { id: "syntax", name: "Syntax & Idioms", tier: 0, prereqs: [], desc: "Core syntax, naming conventions, idiomatic patterns" },
    { id: "data-structs", name: "Data Structures", tier: 0, prereqs: [], desc: "Built-in collections, arrays, maps, sets, standard library types" },
    { id: "control-flow", name: "Control Flow", tier: 0, prereqs: [], desc: "Conditionals, loops, iterators, switches, pattern matching" },
    { id: "error-handling", name: "Error Handling", tier: 1, prereqs: ["control-flow"], desc: "Exceptions, Result/Option types, error propagation strategies" },
    { id: "type-system", name: "Type System", tier: 1, prereqs: ["syntax"], desc: "Types, interfaces, traits, type inference, type guards" },
    { id: "modules", name: "Modules & Packages", tier: 1, prereqs: ["syntax"], desc: "Module system, package management, import/export, namespaces" },
    { id: "async", name: "Async & Concurrency", tier: 2, prereqs: ["error-handling"], desc: "Promises, async/await, threads, channels, parallelism" },
    { id: "generics", name: "Generics & Metaprogramming", tier: 2, prereqs: ["type-system"], desc: "Generic types, macros, decorators, reflection" },
    { id: "testing", name: "Testing & QA", tier: 2, prereqs: ["modules"], desc: "Unit/integration tests, mocking, coverage" },
    { id: "performance", name: "Performance", tier: 3, prereqs: ["async", "data-structs"], desc: "Profiling, optimization, memory management" },
    { id: "patterns", name: "Design Patterns", tier: 3, prereqs: ["type-system", "modules"], desc: "GoF patterns, SOLID principles" },
    { id: "security", name: "Security", tier: 3, prereqs: ["error-handling", "modules"], desc: "Input validation, auth, OWASP" },
    { id: "architecture", name: "System Architecture", tier: 4, prereqs: ["patterns", "async"], desc: "Large-scale design, distributed systems, API design" },
    { id: "internals", name: "Language Internals", tier: 4, prereqs: ["performance", "generics"], desc: "Runtime internals, FFI, memory model" }
  ];
  var EXCLUDED_LANGS = /* @__PURE__ */ new Set(["unknown", "other", "text", "plaintext", "binary"]);
  var LANG_ALIASES = {
    py: "Python",
    python: "Python",
    js: "JavaScript",
    javascript: "JavaScript",
    ts: "TypeScript",
    typescript: "TypeScript",
    rb: "Ruby",
    ruby: "Ruby",
    cs: "C#",
    csharp: "C#",
    cpp: "C++",
    rs: "Rust",
    rust: "Rust",
    go: "Go",
    golang: "Go",
    kt: "Kotlin",
    kotlin: "Kotlin",
    sh: "Shell",
    bash: "Shell",
    zsh: "Shell",
    yml: "YAML",
    yaml: "YAML"
  };
  function normalizeLang(label) {
    return LANG_ALIASES[label.toLowerCase()] ?? label;
  }
  function mergeLanguages(raw) {
    const merged = /* @__PURE__ */ new Map();
    for (const entry of raw) {
      const canonical = normalizeLang(entry.label);
      const existing = merged.get(canonical);
      if (existing) {
        existing.loc += entry.loc;
      } else {
        merged.set(canonical, { label: canonical, loc: entry.loc });
      }
    }
    return [...merged.values()];
  }
  var DEFAULT_LEARNING_STATE = {
    solved: 0,
    failed: 0,
    streak: 0,
    bestStreak: 0,
    solvedSamples: [],
    failedSamples: [],
    currentDifficulty: "medium",
    snakeUnlocked: false,
    snakeHighScore: 0,
    totalQuizTimeMs: 0,
    quizCount: 0,
    selectedLanguage: null,
    focusedConcepts: [],
    learningPath: [],
    langProgress: {},
    cachedQuizzes: [],
    cachedQuizKey: "",
    cachedResources: [],
    cachedResourceKey: "",
    cachedSkillTrees: {},
    cachedCodeReview: [],
    cachedCodeReviewKey: "",
    codeReviewCorrect: 0,
    codeReviewTotal: 0,
    codeReviewSeenTopics: [],
    cachedDidYouKnow: [],
    cachedDidYouKnowKey: "",
    didYouKnowSeenFacts: [],
    selectedProjects: []
  };
  function getState() {
    const s2 = vscode.getState();
    const ls = s2?.learningState ?? {};
    return {
      ...DEFAULT_LEARNING_STATE,
      ...ls,
      solvedSamples: [...ls.solvedSamples ?? DEFAULT_LEARNING_STATE.solvedSamples],
      failedSamples: [...ls.failedSamples ?? DEFAULT_LEARNING_STATE.failedSamples],
      focusedConcepts: [...ls.focusedConcepts ?? DEFAULT_LEARNING_STATE.focusedConcepts],
      learningPath: [...ls.learningPath ?? DEFAULT_LEARNING_STATE.learningPath],
      langProgress: { ...ls.langProgress ?? DEFAULT_LEARNING_STATE.langProgress },
      cachedQuizzes: [...ls.cachedQuizzes ?? DEFAULT_LEARNING_STATE.cachedQuizzes],
      cachedResources: [...ls.cachedResources ?? DEFAULT_LEARNING_STATE.cachedResources],
      cachedSkillTrees: { ...ls.cachedSkillTrees ?? DEFAULT_LEARNING_STATE.cachedSkillTrees },
      cachedCodeReview: [...ls.cachedCodeReview ?? DEFAULT_LEARNING_STATE.cachedCodeReview],
      codeReviewSeenTopics: [...ls.codeReviewSeenTopics ?? DEFAULT_LEARNING_STATE.codeReviewSeenTopics],
      cachedDidYouKnow: [...ls.cachedDidYouKnow ?? DEFAULT_LEARNING_STATE.cachedDidYouKnow],
      didYouKnowSeenFacts: [...ls.didYouKnowSeenFacts ?? DEFAULT_LEARNING_STATE.didYouKnowSeenFacts],
      selectedProjects: [...ls.selectedProjects ?? DEFAULT_LEARNING_STATE.selectedProjects]
    };
  }
  function saveState(ls) {
    const s2 = vscode.getState() ?? {};
    vscode.setState({ ...s2, learningState: ls });
  }
  function removeFromLearningPath(state, lang, conceptId) {
    state.learningPath = state.learningPath.filter((e2) => !(e2.lang === lang && e2.conceptId === conceptId));
    state.focusedConcepts = [...new Set(state.learningPath.map((e2) => e2.conceptId))];
  }
  function clearLearningPath(state) {
    state.learningPath = [];
    state.focusedConcepts = [];
  }
  function groupLearningPath(state) {
    const groups = /* @__PURE__ */ new Map();
    for (const entry of state.learningPath) {
      const arr = groups.get(entry.lang) ?? [];
      arr.push(entry);
      groups.set(entry.lang, arr);
    }
    return groups;
  }
  function getConceptsForLang(lang, state) {
    return state.cachedSkillTrees[lang] ?? DEFAULT_CONCEPTS;
  }
  function findConcept(cid, state, langHint) {
    if (langHint) {
      const tree = getConceptsForLang(langHint, state);
      const found = tree.find((c2) => c2.id === cid);
      if (found) return found;
    }
    for (const tree of Object.values(state.cachedSkillTrees)) {
      const found = tree.find((c2) => c2.id === cid);
      if (found) return found;
    }
    return DEFAULT_CONCEPTS.find((c2) => c2.id === cid);
  }
  function quizCacheKey(langs, focus, difficulty, lang) {
    return `q:${lang ?? langs.join(",")}|${focus.join(",")}|${difficulty}`;
  }
  function resourceCacheKey(langs, gaps, focus) {
    return `r:${langs.join(",")}|${gaps.join(",")}|${focus.join(",")}`;
  }
  function codeReviewCacheKey(langs, difficulty) {
    return `cr:${langs.join(",")}|${difficulty}`;
  }
  function didYouKnowCacheKey(langs, workspaces) {
    return `dyk:${langs.join(",")}|${workspaces.join(",")}`;
  }

  // src/webview/page-learning-snake.ts
  function renderSnakeGame(container, state, onBack) {
    const GRID = 20;
    const CELL = 16;
    const SIZE = GRID * CELL;
    render(html2`
    <div class="learn-snake-wrap">
      <div class="learn-snake-header">
        <h3>${SVG.snake} Snake Reward</h3>
        <p>Earned by getting 5 correct answers in a row. Arrow keys to play.</p>
        <div class="learn-snake-scores">
          <span>High Score: <strong id="snake-high">${state.snakeHighScore}</strong></span>
          <span>Score: <strong id="snake-score">0</strong></span>
        </div>
      </div>
      <canvas id="snake-canvas" width=${SIZE} height=${SIZE} tabindex="0"></canvas>
      <button class="btn btn-secondary" id="snake-back">${SVG.arrowLeft} Back</button>
    </div>`, container);
    const canvas = document.getElementById("snake-canvas");
    const ctx = canvas.getContext("2d");
    const scoreEl = document.getElementById("snake-score");
    const highEl = document.getElementById("snake-high");
    let snake = [{ x: 10, y: 10 }];
    let dir = { x: 1, y: 0 };
    let food = spawnFood();
    let score = 0;
    let gameOver = false;
    function spawnFood() {
      let pos;
      do {
        pos = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
      } while (snake.some((segment) => segment.x === pos.x && segment.y === pos.y));
      return pos;
    }
    function draw2() {
      ctx.fillStyle = "#0d1117";
      ctx.fillRect(0, 0, SIZE, SIZE);
      ctx.strokeStyle = "#21262d";
      ctx.lineWidth = 0.5;
      for (let i2 = 0; i2 <= GRID; i2++) {
        ctx.beginPath();
        ctx.moveTo(i2 * CELL, 0);
        ctx.lineTo(i2 * CELL, SIZE);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i2 * CELL);
        ctx.lineTo(SIZE, i2 * CELL);
        ctx.stroke();
      }
      ctx.fillStyle = "#f85149";
      ctx.beginPath();
      ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2 - 2, 0, Math.PI * 2);
      ctx.fill();
      for (let i2 = 0; i2 < snake.length; i2++) {
        const pct = 1 - i2 / snake.length;
        ctx.fillStyle = `rgb(59, ${Math.round(185 + pct * 70)}, 80)`;
        ctx.fillRect(snake[i2].x * CELL + 1, snake[i2].y * CELL + 1, CELL - 2, CELL - 2);
      }
      if (gameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(0, 0, SIZE, SIZE);
        ctx.fillStyle = "#f85149";
        ctx.font = "bold 24px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Game Over!", SIZE / 2, SIZE / 2 - 10);
        ctx.fillStyle = "#8b949e";
        ctx.font = "14px sans-serif";
        ctx.fillText(`Score: ${score}  |  Press Space to restart`, SIZE / 2, SIZE / 2 + 20);
      }
    }
    function tick() {
      if (gameOver) return;
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
      if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID) {
        endGame();
        return;
      }
      if (snake.some((segment) => segment.x === head.x && segment.y === head.y)) {
        endGame();
        return;
      }
      snake.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        score++;
        scoreEl.textContent = String(score);
        food = spawnFood();
      } else {
        snake.pop();
      }
      draw2();
    }
    function endGame() {
      gameOver = true;
      if (score > state.snakeHighScore) {
        state.snakeHighScore = score;
        highEl.textContent = String(score);
        saveState(state);
      }
      draw2();
    }
    canvas.focus();
    canvas.addEventListener("keydown", (event) => {
      if (gameOver && event.key === " ") {
        snake = [{ x: 10, y: 10 }];
        dir = { x: 1, y: 0 };
        food = spawnFood();
        score = 0;
        gameOver = false;
        scoreEl.textContent = "0";
        return;
      }
      switch (event.key) {
        case "ArrowUp":
          if (dir.y === 0) dir = { x: 0, y: -1 };
          break;
        case "ArrowDown":
          if (dir.y === 0) dir = { x: 0, y: 1 };
          break;
        case "ArrowLeft":
          if (dir.x === 0) dir = { x: -1, y: 0 };
          break;
        case "ArrowRight":
          if (dir.x === 0) dir = { x: 1, y: 0 };
          break;
      }
      event.preventDefault();
    });
    draw2();
    const interval = setInterval(tick, 120);
    document.getElementById("snake-back")?.addEventListener("click", () => {
      clearInterval(interval);
      onBack();
    });
    container.__snakeInterval = interval;
    window.addEventListener("unload", () => clearInterval(interval));
  }

  // src/webview/page-learning-templates.ts
  var DYK_CAT_ICONS = {
    performance: SVG.zap,
    api: SVG.code,
    pitfall: SVG.warning,
    config: SVG.gear,
    debug: SVG.microscope
  };
  function renderResourcesHtml(resources) {
    if (resources.length === 0) return html2`<span class="text-muted" style="font-size:11px">No resources generated.</span>`;
    return resources.map((resource) => html2`
    <a href=${resource.url} class="learn-resource-link" target="_blank" title=${resource.reason}>
      ${SVG.externalLink} ${resource.title}
    </a>`);
  }
  function renderCodeReviewRound(rounds, index3, state) {
    if (index3 >= rounds.length) {
      const pct = state.codeReviewTotal > 0 ? Math.round(state.codeReviewCorrect / state.codeReviewTotal * 100) : 0;
      return html2`
      <div class="learn-cr-done">
        <p><strong>Round complete!</strong> You picked the better code ${state.codeReviewCorrect} out of ${state.codeReviewTotal} times (${pct}%).</p>
        <button class="btn btn-primary btn-sm" id="cr-more-btn">${SVG.refresh} New Round</button>
      </div>`;
    }
    const round2 = rounds[index3];
    const catColors = {
      performance: COLORS.yellow,
      safety: COLORS.red,
      readability: COLORS.blue,
      correctness: COLORS.green,
      security: COLORS.red
    };
    const catColor = catColors[round2.category] ?? COLORS.blue;
    return html2`
    <div class="learn-cr-round" data-index=${String(index3)}>
      <div class="learn-cr-meta">
        <span class="learn-cr-cat" style=${`background:${catColor}20;color:${catColor}`}>${round2.category}</span>
        <span class=${`learn-cr-diff learn-quiz-diff-${round2.difficulty}`}>${round2.difficulty}</span>
        <span class="learn-quiz-num">${index3 + 1}/${rounds.length}</span>
      </div>
      <p class="learn-cr-title">${round2.title}</p>
      <div class="learn-cr-pair">
        <div class="learn-cr-snippet" data-pick="A">
          <div class="learn-cr-snippet-label">A</div>
          <pre><code>${round2.snippetA}</code></pre>
        </div>
        <div class="learn-cr-vs">VS</div>
        <div class="learn-cr-snippet" data-pick="B">
          <div class="learn-cr-snippet-label">B</div>
          <pre><code>${round2.snippetB}</code></pre>
        </div>
      </div>
      <p class="learn-cr-prompt">Which one isn't slop?</p>
      <div class="learn-cr-feedback" id="cr-feedback" style="display:none"></div>
    </div>`;
  }
  function renderDidYouKnowHtml(facts) {
    if (facts.length === 0) return html2`<span class="text-muted" style="font-size:11px">No facts generated.</span>`;
    return facts.map((fact) => {
      const icon2 = DYK_CAT_ICONS[fact.category] ?? SVG.lightbulb;
      return html2`<div class="learn-dyk-item">
      <div class="learn-dyk-icon">${icon2}</div>
      <div class="learn-dyk-body">
        <div class="learn-dyk-fact">${fact.fact}</div>
        <div class="learn-dyk-project">${fact.project}</div>
      </div>
    </div>`;
    });
  }
  function renderQuiz(questions, index3) {
    if (index3 >= questions.length) {
      return html2`
      <div class="learn-quiz-done">
        <span class="learn-quiz-done-icon">${SVG.checkCircle}</span>
        <p>Round complete!</p>
        <button class="btn btn-primary btn-sm" id="quiz-more-btn">More Challenges</button>
      </div>`;
    }
    const question = questions[index3];
    return html2`
    <div class="learn-quiz-card" key=${index3} data-index=${String(index3)}>
      <div class="learn-quiz-meta">
        <span class=${`learn-quiz-diff learn-quiz-diff-${question.difficulty}`}>${question.difficulty}</span>
        <span class="learn-quiz-topic">${question.topic}</span>
        <span class="learn-quiz-num">${index3 + 1}/${questions.length}</span>
      </div>
      <div class="learn-quiz-question">${question.question}</div>
      <div class="learn-quiz-choices">
        ${question.choices.map((choice, i2) => html2`<button class="learn-quiz-choice" data-choice=${String(i2)}>${choice}</button>`)}
      </div>
      <div class="learn-quiz-actions">
        <button class="btn btn-secondary btn-sm learn-quiz-skip">${SVG.arrowRight} Skip</button>
      </div>
      <div class="learn-quiz-feedback" id="quiz-feedback" style="display:none"></div>
    </div>`;
  }

  // src/webview/page-learning.ts
  async function generateQuizCached(state, context) {
    const key = quizCacheKey(context.languages, context.focusConcepts, context.difficulty, context.selectedLanguage);
    if (state.cachedQuizKey === key && state.cachedQuizzes.length > 0) {
      return { questions: state.cachedQuizzes, fromCache: true };
    }
    const result = await rpc("generateLearningQuiz", {
      languages: context.languages,
      topics: context.focusConcepts,
      difficulty: context.difficulty,
      solved: state.solved,
      failed: state.failed,
      solvedSamples: state.solvedSamples.slice(-5),
      failedSamples: state.failedSamples.slice(-5),
      focusSkills: context.focusConcepts,
      packageDeps: context.packageDeps,
      customGoals: context.selectedLanguage ? [`Deep dive into ${context.selectedLanguage}: ${context.focusConcepts.join(", ") || "advanced topics"}${context.selectedProjects.length > 0 ? ` (projects: ${context.selectedProjects.join(", ")})` : ""}`] : []
    });
    const questions = result.questions ?? [];
    state.cachedQuizzes = questions;
    state.cachedQuizKey = key;
    saveState(state);
    return { questions, fromCache: false };
  }
  function updateSidebar(container, state, gaps) {
    const sidebar = container.querySelector(".learn-sidebar");
    if (!sidebar) return;
    const queueSection = document.getElementById("learn-queue-section");
    if (state.learningPath.length > 0) {
      const groups = groupLearningPath(state);
      const markup = html2`
      <div class="learn-section-head"><h3>${SVG.target} Learning Path</h3></div>
      <div class="learn-focus-queue">
        ${[...groups.entries()].map(([lang, entries]) => html2`
          <div class="learn-path-group">
            <div class="learn-path-lang">${lang}</div>
            ${entries.map((e2) => {
        const cdef = findConcept(e2.conceptId, state, lang);
        return html2`<div class="learn-queue-item">
                <span>${cdef?.name ?? e2.conceptId}</span>
                <button class="learn-queue-remove" data-concept=${e2.conceptId} data-lang=${lang} title="Remove">&times;</button>
              </div>`;
      })}
          </div>`)}
      </div>
      <button class="btn btn-secondary btn-sm" id="clear-focus-btn" style="margin-top:6px">Clear All</button>`;
      if (queueSection) {
        render(markup, queueSection);
      } else {
        const section = document.createElement("div");
        section.className = "learn-section";
        section.id = "learn-queue-section";
        sidebar.insertBefore(section, sidebar.firstChild);
        render(markup, section);
      }
    } else if (queueSection) {
      queueSection.remove();
    }
    const gapsSection = document.getElementById("learn-gaps-section");
    if (gaps.length > 0) {
      const gapsMarkup = html2`
      <div class="learn-section-head"><h3>${SVG.warning} Knowledge Gaps</h3></div>
      <div class="learn-gap-list">
        ${gaps.slice(0, 6).map((g2) => html2`
          <div class="learn-gap-item">
            <span class="learn-gap-name">${g2.concept}</span>
            <span class="learn-gap-ratio" style="color:${COLORS.red}">${g2.passed}/${g2.total} in ${g2.lang}</span>
          </div>`)}
      </div>`;
      if (gapsSection) {
        render(gapsMarkup, gapsSection);
      } else {
        const section = document.createElement("div");
        section.className = "learn-section";
        section.id = "learn-gaps-section";
        const queueEl = document.getElementById("learn-queue-section");
        const insertBefore = queueEl ? queueEl.nextSibling : sidebar.firstChild;
        sidebar.insertBefore(section, insertBefore);
        render(gapsMarkup, section);
      }
    } else if (gapsSection) {
      gapsSection.remove();
    }
    wireSidebarEvents(container, state);
  }
  function updateStats(state) {
    const totalAttempts = state.solved + state.failed;
    const accuracy = totalAttempts > 0 ? Math.round(state.solved / totalAttempts * 100) : 0;
    const vals = document.querySelectorAll(".learn-stat-val");
    if (vals.length >= 6) {
      vals[0].textContent = String(state.solved);
      vals[1].textContent = String(state.failed);
      vals[2].textContent = `${accuracy}%`;
      vals[3].textContent = `${state.streak}/${state.bestStreak}`;
      vals[4].textContent = state.currentDifficulty;
      vals[5].textContent = String(state.learningPath.length);
    }
  }
  function buildLearningMarkup(state, languages, workspaceNames, flowState, gaps, diffColors) {
    const totalAttempts = state.solved + state.failed;
    const accuracy = totalAttempts > 0 ? Math.round(state.solved / totalAttempts * 100) : 0;
    return html2`
    <div class="learn-page">
      <div class="learn-hero"><div class="learn-hero-left"><div class="learn-hero-icon">${SVG.graduationCap}</div><div><h2 class="learn-hero-title">Learning Center</h2><p class="learn-hero-sub">Your AI-personalized upskilling program, built from your actual Copilot usage. The skill tree adapts to your languages, dependencies, and projects -- so everything you learn is directly applicable to your work. Explore freely, but pass quizzes to level up.</p></div></div></div>
      <div class="learn-stats">
        <div class="learn-stat"><div class="learn-stat-val" style="color:${COLORS.green}">${state.solved}</div><div class="learn-stat-lbl">Correct</div></div>
        <div class="learn-stat"><div class="learn-stat-val" style="color:${COLORS.red}">${state.failed}</div><div class="learn-stat-lbl">Incorrect</div></div>
        <div class="learn-stat"><div class="learn-stat-val" style="color:${COLORS.blue}">${accuracy}%</div><div class="learn-stat-lbl">Accuracy</div></div>
        <div class="learn-stat"><div class="learn-stat-val" style="color:${COLORS.yellow}">${state.streak}/${state.bestStreak}</div><div class="learn-stat-lbl">Streak / Best</div></div>
        <div class="learn-stat"><div class="learn-stat-val" style="color:${diffColors[state.currentDifficulty]}">${state.currentDifficulty}</div><div class="learn-stat-lbl">Difficulty</div></div>
        <div class="learn-stat"><div class="learn-stat-val">${state.learningPath.length}</div><div class="learn-stat-lbl">Learning Path</div></div>
      </div>
      ${state.streak >= 5 ? html2`<div class="learn-reward-bar"><span>${SVG.snake}</span><span>5-answer streak! You earned a Snake game break.</span><button class="btn btn-primary btn-sm" id="play-snake-btn">Play</button></div>` : state.streak >= 3 ? html2`<div class="learn-streak-bar">${SVG.fire} ${state.streak}-answer streak! ${5 - state.streak} more for a reward.</div>` : null}
      <div class="learn-columns">
        <div class="learn-main">
          <div class="learn-section learn-context-bar" id="learn-context-bar"><div class="learn-context-row"><div class="learn-lang-picker" id="global-lang-picker"><label class="learn-lang-picker-label">Language</label><div class="learn-lang-picker-options">${languages.map((l2) => html2`<button class="learn-lang-pill ${l2.label === state.selectedLanguage ? "learn-lang-pill-active" : ""}" data-lang=${l2.label}>${l2.label}</button>`)}</div></div>${workspaceNames.length > 0 ? html2`<div class="learn-project-picker" id="global-project-picker"><label class="learn-lang-picker-label">Projects</label><div class="learn-lang-picker-options">${workspaceNames.map((w2) => html2`<button class="learn-lang-pill learn-project-pill ${state.selectedProjects.includes(w2) ? "learn-lang-pill-active" : ""}" data-project=${w2}>${w2}</button>`)}</div></div>` : null}</div></div>
          <div class="learn-section" id="quiz-section"><div class="learn-section-head"><h3>${SVG.terminal} ${state.selectedLanguage ? state.selectedLanguage + " Challenge" : "Coding Challenge"}</h3><span class="learn-diff-badge" style="background:${diffColors[state.currentDifficulty]}20;color:${diffColors[state.currentDifficulty]}">${state.currentDifficulty}</span></div><div id="quiz-container"><div class="learn-quiz-placeholder"><p class="text-muted">${state.selectedLanguage ? `Generate ${state.selectedLanguage} coding challenges.` : "Pick a language above, then generate."}</p><button class="btn btn-primary btn-sm" id="quiz-generate-btn" disabled=${!state.selectedLanguage}>${SVG.brain} Generate Quiz</button></div></div></div>
          <div class="learn-section" id="cr-section"><div class="learn-section-head"><h3>${SVG.code} Slop or Not</h3><span class="learn-cr-score-badge" id="cr-score">${state.codeReviewCorrect}/${state.codeReviewTotal}</span></div><div id="cr-container"><div class="learn-quiz-placeholder"><p class="text-muted">${state.selectedLanguage ? `Spot the slop in ${state.selectedLanguage} code.` : "Pick a language above, then spot the slop."}</p><button class="btn btn-primary btn-sm" id="cr-generate-btn" disabled=${!state.selectedLanguage}>${SVG.code} Play Slop or Not</button></div></div></div>
        </div>
        <div class="learn-sidebar">
          ${state.learningPath.length > 0 ? html2`<div class="learn-section" id="learn-queue-section"><div class="learn-section-head"><h3>${SVG.target} Learning Path</h3></div><div class="learn-focus-queue">${[...groupLearningPath(state).entries()].map(([lang, entries]) => html2`<div class="learn-path-group"><div class="learn-path-lang">${lang}</div>${entries.map((e2) => {
      const cdef = findConcept(e2.conceptId, state, lang);
      return html2`<div class="learn-queue-item"><span>${cdef?.name ?? e2.conceptId}</span><button class="learn-queue-remove" data-concept=${e2.conceptId} data-lang=${lang} title="Remove">&times;</button></div>`;
    })}</div>`)}</div><button class="btn btn-secondary btn-sm" id="clear-focus-btn" style="margin-top:6px">Clear All</button></div>` : null}
          ${gaps.length > 0 ? html2`<div class="learn-section" id="learn-gaps-section"><div class="learn-section-head"><h3>${SVG.warning} Knowledge Gaps</h3></div><div class="learn-gap-list">${gaps.slice(0, 6).map((g2) => html2`<div class="learn-gap-item"><span class="learn-gap-name">${g2.concept}</span><span class="learn-gap-ratio" style="color:${COLORS.red}">${g2.passed}/${g2.total} in ${g2.lang}</span></div>`)}</div></div>` : null}
          <div class="learn-section"><div class="learn-section-head"><h3>${SVG.book} Recommended Resources</h3></div><div class="learn-resource-list" id="learn-resources-container"><button class="btn btn-secondary btn-sm" id="resources-generate-btn" style="margin-top:2px">${SVG.refresh} Load Resources</button></div></div>
          <div class="learn-section"><div class="learn-section-head"><h3>${SVG.lightbulb} Did You Know?</h3></div><div class="learn-dyk-list" id="dyk-container"><button class="btn btn-secondary btn-sm" id="dyk-generate-btn" style="margin-top:2px">${SVG.lightbulb} Generate Tips</button></div></div>
          ${flowState.suggestions.length > 0 ? html2`<div class="learn-section"><div class="learn-section-head"><h3>${SVG.zap} Focus Tips</h3></div><div class="learn-focus-list">${flowState.suggestions.slice(0, 4).map((s2) => html2`<div class="learn-focus-item">${SVG.lightbulb} ${s2}</div>`)}</div></div>` : null}
          <div class="learn-section"><div class="learn-section-head"><h3>${SVG.gamepad} Rewards</h3></div><div class="learn-reward-card ${state.snakeUnlocked ? "learn-reward-unlocked" : ""}"><span class="learn-reward-icon">${SVG.snake}</span><div><div class="learn-reward-title">Snake Game</div><div class="learn-reward-desc">${state.snakeUnlocked ? `High score: ${state.snakeHighScore}` : "Get 5 correct in a row"}</div></div></div></div>
        </div>
      </div>
    </div>`;
  }
  function restoreLearningSections(container, state, languages, workspaceNames, gaps, uniqueDeps) {
    const quizLangs = state.selectedLanguage ? [state.selectedLanguage] : languages.map((l2) => l2.label);
    const focusNames = state.focusedConcepts.map((cid) => findConcept(cid, state)?.name ?? cid);
    const quizKey = quizCacheKey(quizLangs, focusNames, state.currentDifficulty, state.selectedLanguage);
    if (state.cachedQuizKey === quizKey && state.cachedQuizzes.length > 0) {
      const quizEl = document.getElementById("quiz-container");
      if (quizEl) {
        render(renderQuiz(state.cachedQuizzes, 0), quizEl);
        wireQuizHandlers(container, state.cachedQuizzes, 0, state, uniqueDeps);
      }
    } else {
      showQuizPlaceholder();
    }
    const crKey = codeReviewCacheKey(quizLangs, state.currentDifficulty);
    if (state.cachedCodeReviewKey === crKey && state.cachedCodeReview.length > 0) {
      const crEl = document.getElementById("cr-container");
      if (crEl) {
        render(renderCodeReviewRound(state.cachedCodeReview, 0, state), crEl);
        wireCodeReviewHandlers(container, state.cachedCodeReview, 0, state);
      }
    } else {
      showCodeReviewPlaceholder();
    }
    const resKey = resourceCacheKey(languages.map((l2) => l2.label), gaps.map((g2) => `${g2.concept}-${g2.lang}`), focusNames);
    if (state.cachedResourceKey === resKey && state.cachedResources.length > 0) {
      const resEl = document.getElementById("learn-resources-container");
      if (resEl) render(renderResourcesHtml(state.cachedResources), resEl);
    } else {
      showResourcesPlaceholder();
    }
    const dykKey = didYouKnowCacheKey(quizLangs, workspaceNames);
    if (state.cachedDidYouKnowKey === dykKey && state.cachedDidYouKnow.length > 0) {
      const dykEl = document.getElementById("dyk-container");
      if (dykEl) render(renderDidYouKnowHtml(state.cachedDidYouKnow), dykEl);
    } else {
      showDidYouKnowPlaceholder();
    }
  }
  var _pageCtx = {
    filter: {},
    container: null,
    languages: [],
    deps: [],
    workspaces: []
  };
  function wireSidebarEvents(container, state) {
    for (const btn of container.querySelectorAll(".learn-queue-remove")) {
      btn.addEventListener("click", (e2) => {
        e2.stopPropagation();
        const cid = btn.dataset.concept;
        if (cid) {
          const entryLang = btn.dataset.lang ?? state.selectedLanguage ?? "";
          removeFromLearningPath(state, entryLang, cid);
          saveState(state);
          updateSidebar(container, state, computeGaps(state));
          updateStats(state);
        }
      });
    }
    document.getElementById("clear-focus-btn")?.addEventListener("click", () => {
      clearLearningPath(state);
      saveState(state);
      updateSidebar(container, state, computeGaps(state));
      updateStats(state);
    });
  }
  function computeGaps(state) {
    const gaps = [];
    for (const [lang, concepts] of Object.entries(state.langProgress)) {
      for (const [cid, cp] of Object.entries(concepts)) {
        if (cp.failed > cp.passed && cp.passed + cp.failed > 0) {
          const cdef = findConcept(cid, state, lang);
          gaps.push({ lang, concept: cdef?.name ?? cid, passed: cp.passed, total: cp.passed + cp.failed });
        }
      }
    }
    return gaps;
  }
  function wireGlobalPickers(container, languages, state) {
    const langPicker = document.getElementById("global-lang-picker");
    if (langPicker) {
      for (const pill of langPicker.querySelectorAll(".learn-lang-pill")) {
        pill.addEventListener("click", () => {
          const lang = pill.dataset.lang;
          if (!lang) return;
          for (const p2 of langPicker.querySelectorAll(".learn-lang-pill")) p2.classList.remove("learn-lang-pill-active");
          pill.classList.add("learn-lang-pill-active");
          state.selectedLanguage = lang;
          if (!state.langProgress[lang]) state.langProgress[lang] = {};
          saveState(state);
          updateSidebar(container, state, computeGaps(state));
          updateStats(state);
          showQuizPlaceholder();
          showCodeReviewPlaceholder();
          const quizTitle = container.querySelector("#quiz-section .learn-section-head h3");
          if (quizTitle) render(html2`${SVG.terminal} ${lang} Challenge`, quizTitle);
          const crTitle = container.querySelector("#cr-section .learn-section-head h3");
          if (crTitle) render(html2`${SVG.code} Slop or Not`, crTitle);
        });
      }
    }
    const projectPicker = document.getElementById("global-project-picker");
    if (projectPicker) {
      for (const pill of projectPicker.querySelectorAll(".learn-project-pill")) {
        pill.addEventListener("click", () => {
          const project = pill.dataset.project;
          if (!project) return;
          const idx = state.selectedProjects.indexOf(project);
          if (idx >= 0) {
            state.selectedProjects.splice(idx, 1);
            pill.classList.remove("learn-lang-pill-active");
          } else {
            state.selectedProjects.push(project);
            pill.classList.add("learn-lang-pill-active");
          }
          saveState(state);
        });
      }
    }
  }
  function showQuizPlaceholder() {
    const quizEl = document.getElementById("quiz-container");
    if (!quizEl) return;
    const state = getState();
    const hasLang = !!state.selectedLanguage;
    render(html2`
    <div class="learn-quiz-placeholder">
      <p class="text-muted">${hasLang ? `Generate ${state.selectedLanguage} coding challenges.` : "Pick a language above, then generate."}</p>
      <button class="btn btn-primary btn-sm" id="quiz-generate-btn" disabled=${!hasLang}>${SVG.brain} Generate Quiz</button>
    </div>`, quizEl);
    document.getElementById("quiz-generate-btn")?.addEventListener("click", () => {
      const s2 = getState();
      if (!s2.selectedLanguage) return;
      s2.cachedQuizKey = "";
      saveState(s2);
      if (_pageCtx.container) void loadQuizAsync(_pageCtx.container, s2);
    });
  }
  function showResourcesPlaceholder() {
    const el2 = document.getElementById("learn-resources-container");
    if (!el2) return;
    render(html2`
    <button class="btn btn-secondary btn-sm" id="resources-generate-btn" style="margin-top:2px">${SVG.refresh} Load Resources</button>`, el2);
    document.getElementById("resources-generate-btn")?.addEventListener("click", () => {
      const state = getState();
      state.cachedResourceKey = "";
      saveState(state);
      void loadResourcesAsync(state, _pageCtx.languages, computeGaps(state), _pageCtx.deps);
    });
  }
  function wireCodeReviewHandlers(container, rounds, currentIndex, state) {
    const crContainer = document.getElementById("cr-container");
    if (!crContainer) return;
    document.getElementById("cr-more-btn")?.addEventListener("click", () => {
      state.cachedCodeReviewKey = "";
      saveState(state);
      void loadCodeReviewAsync(container, state);
    });
    for (const card of crContainer.querySelectorAll(".learn-cr-snippet")) {
      card.addEventListener("click", () => {
        if (currentIndex >= rounds.length) return;
        const pick = card.dataset.pick;
        const r2 = rounds[currentIndex];
        const correct = pick === r2.betterSnippet;
        state.codeReviewTotal++;
        if (correct) state.codeReviewCorrect++;
        if (!state.codeReviewSeenTopics.includes(r2.title)) {
          state.codeReviewSeenTopics.push(r2.title);
          if (state.codeReviewSeenTopics.length > 20) state.codeReviewSeenTopics.shift();
        }
        saveState(state);
        for (const s2 of crContainer.querySelectorAll(".learn-cr-snippet")) {
          s2.classList.add("learn-cr-disabled");
          if (s2.dataset.pick === r2.betterSnippet) s2.classList.add("learn-cr-winner");
          if (s2.dataset.pick === pick && !correct) s2.classList.add("learn-cr-loser");
        }
        const scoreEl = document.getElementById("cr-score");
        if (scoreEl) scoreEl.textContent = `${state.codeReviewCorrect}/${state.codeReviewTotal}`;
        const feedback = document.getElementById("cr-feedback");
        if (feedback) {
          feedback.style.display = "block";
          feedback.className = `learn-cr-feedback ${correct ? "learn-cr-fb-correct" : "learn-cr-fb-wrong"}`;
          render(html2`
          <strong>${correct ? html2`${SVG.checkCircle} Correct!` : html2`${SVG.xCircle} Not quite`}</strong> Snippet ${r2.betterSnippet} is better.
          <p>${r2.explanation}</p>
          <button class="btn btn-secondary btn-sm learn-cr-next">${SVG.arrowRight} Next</button>`, feedback);
          feedback.querySelector(".learn-cr-next")?.addEventListener("click", () => {
            const next = currentIndex + 1;
            render(renderCodeReviewRound(rounds, next, state), crContainer);
            wireCodeReviewHandlers(container, rounds, next, state);
          });
        }
      });
    }
  }
  function showCodeReviewPlaceholder() {
    const el2 = document.getElementById("cr-container");
    if (!el2) return;
    const state = getState();
    const hasLang = !!state.selectedLanguage;
    render(html2`
    <div class="learn-quiz-placeholder">
      <p class="text-muted">${hasLang ? `Spot the slop in ${state.selectedLanguage} code.` : "Pick a language above, then spot the slop."}</p>
      <button class="btn btn-primary btn-sm" id="cr-generate-btn" disabled=${!hasLang}>${SVG.code} Play Slop or Not</button>
    </div>`, el2);
    document.getElementById("cr-generate-btn")?.addEventListener("click", () => {
      const s2 = getState();
      if (!s2.selectedLanguage) return;
      s2.cachedCodeReviewKey = "";
      saveState(s2);
      if (_pageCtx.container) void loadCodeReviewAsync(_pageCtx.container, s2);
    });
  }
  async function loadCodeReviewAsync(container, state) {
    const el2 = document.getElementById("cr-container");
    if (!el2) return;
    const langs = state.selectedLanguage ? [state.selectedLanguage] : _pageCtx.languages.map((l2) => l2.label);
    const key = codeReviewCacheKey(langs, state.currentDifficulty);
    if (state.cachedCodeReviewKey === key && state.cachedCodeReview.length > 0) {
      render(renderCodeReviewRound(state.cachedCodeReview, 0, state), el2);
      wireCodeReviewHandlers(container, state.cachedCodeReview, 0, state);
      return;
    }
    render(html2`
    <div class="learn-quiz-loading">
      <div class="learn-shimmer"></div>
      <div class="learn-shimmer" style="width:80%"></div>
      <div class="learn-shimmer" style="width:60%"></div>
      <div class="learn-quiz-loading-text">${SVG.code} Generating slop or not rounds\u2026</div>
    </div>`, el2);
    try {
      const result = await rpc("generateCodeComparison", {
        languages: langs,
        packageDeps: _pageCtx.deps,
        difficulty: state.currentDifficulty,
        seenTopics: state.codeReviewSeenTopics,
        workspaces: state.selectedProjects.length > 0 ? state.selectedProjects : _pageCtx.workspaces
      });
      const rounds = result.rounds ?? [];
      if (rounds.length > 0) {
        state.cachedCodeReview = rounds;
        state.cachedCodeReviewKey = key;
        saveState(state);
        render(renderCodeReviewRound(rounds, 0, state), el2);
        wireCodeReviewHandlers(container, rounds, 0, state);
      } else {
        render(html2`<p class="text-muted">No comparisons generated.</p><button class="btn btn-secondary btn-sm" id="cr-retry-btn">Retry</button>`, el2);
        document.getElementById("cr-retry-btn")?.addEventListener("click", () => {
          state.cachedCodeReviewKey = "";
          saveState(state);
          void loadCodeReviewAsync(container, state);
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Code review generation failed";
      render(html2`<div class="learn-quiz-error">${SVG.warning} ${msg}<br /><button class="btn btn-secondary btn-sm" id="cr-retry-btn">Retry</button></div>`, el2);
      document.getElementById("cr-retry-btn")?.addEventListener("click", () => {
        void loadCodeReviewAsync(container, state);
      });
    }
  }
  function showDidYouKnowPlaceholder() {
    const el2 = document.getElementById("dyk-container");
    if (!el2) return;
    render(html2`
    <button class="btn btn-secondary btn-sm" id="dyk-generate-btn" style="margin-top:2px">${SVG.lightbulb} Generate Tips</button>`, el2);
    document.getElementById("dyk-generate-btn")?.addEventListener("click", () => {
      const state = getState();
      state.cachedDidYouKnowKey = "";
      saveState(state);
      void loadDidYouKnowAsync(state);
    });
  }
  async function loadDidYouKnowAsync(state) {
    const el2 = document.getElementById("dyk-container");
    if (!el2) return;
    const langs = state.selectedLanguage ? [state.selectedLanguage] : _pageCtx.languages.map((l2) => l2.label);
    const effectiveWorkspaces = state.selectedProjects.length > 0 ? state.selectedProjects : _pageCtx.workspaces;
    const key = didYouKnowCacheKey(langs, effectiveWorkspaces);
    if (state.cachedDidYouKnowKey === key && state.cachedDidYouKnow.length > 0) {
      render(renderDidYouKnowHtml(state.cachedDidYouKnow), el2);
      return;
    }
    render(html2`
    <div class="learn-shimmer" style="width:100%;height:30px;margin-bottom:4px"></div>
    <div class="learn-shimmer" style="width:85%;height:30px;margin-bottom:4px"></div>
    <div class="learn-shimmer" style="width:70%;height:30px"></div>`, el2);
    try {
      const result = await rpc("generateDidYouKnow", {
        languages: langs,
        packageDeps: _pageCtx.deps,
        workspaces: state.selectedProjects.length > 0 ? state.selectedProjects : _pageCtx.workspaces,
        seenFacts: state.didYouKnowSeenFacts
      });
      const facts = result.facts ?? [];
      state.cachedDidYouKnow = facts;
      state.cachedDidYouKnowKey = key;
      for (const f2 of facts) {
        if (!state.didYouKnowSeenFacts.includes(f2.fact)) {
          state.didYouKnowSeenFacts.push(f2.fact);
          if (state.didYouKnowSeenFacts.length > 30) state.didYouKnowSeenFacts.shift();
        }
      }
      saveState(state);
      render(renderDidYouKnowHtml(facts), el2);
    } catch {
      render(html2`<span class="text-muted" style="font-size:11px">Could not generate tips.</span>`, el2);
    }
  }
  async function loadQuizAsync(container, state) {
    const quizEl = document.getElementById("quiz-container");
    if (!quizEl) return;
    const quizLangs = state.selectedLanguage ? [state.selectedLanguage] : _pageCtx.languages.map((l2) => l2.label);
    const focusNames = state.focusedConcepts.map((cid) => findConcept(cid, state)?.name ?? cid);
    const quizTitle = container.querySelector("#quiz-section .learn-section-head h3");
    if (quizTitle) {
      render(html2`${SVG.terminal} ${state.selectedLanguage ? state.selectedLanguage + " Challenge" : "Coding Challenge"}`, quizTitle);
    }
    const key = quizCacheKey(quizLangs, focusNames, state.currentDifficulty, state.selectedLanguage);
    if (state.cachedQuizKey === key && state.cachedQuizzes.length > 0) {
      render(renderQuiz(state.cachedQuizzes, 0), quizEl);
      wireQuizHandlers(container, state.cachedQuizzes, 0, state, _pageCtx.deps);
      return;
    }
    render(html2`
    <div class="learn-quiz-loading">
      <div class="learn-shimmer"></div>
      <div class="learn-shimmer" style="width:80%"></div>
      <div class="learn-shimmer" style="width:60%"></div>
      <div class="learn-quiz-loading-text">${SVG.brain} Generating personalized ${state.currentDifficulty} challenges\u2026</div>
    </div>`, quizEl);
    try {
      const { questions } = await generateQuizCached(state, {
        languages: quizLangs,
        focusConcepts: focusNames,
        difficulty: state.currentDifficulty,
        selectedLanguage: state.selectedLanguage,
        packageDeps: _pageCtx.deps,
        selectedProjects: state.selectedProjects
      });
      if (questions.length > 0) {
        render(renderQuiz(questions, 0), quizEl);
        wireQuizHandlers(container, questions, 0, state, _pageCtx.deps);
      } else {
        render(html2`<p class="text-muted">No quizzes generated.</p><button class="btn btn-secondary btn-sm" id="quiz-retry-btn">Generate</button>`, quizEl);
        document.getElementById("quiz-retry-btn")?.addEventListener("click", () => {
          state.cachedQuizKey = "";
          saveState(state);
          void loadQuizAsync(container, state);
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Quiz generation failed";
      render(html2`<div class="learn-quiz-error">${SVG.warning} ${msg}<br /><button class="btn btn-secondary btn-sm" id="quiz-retry-btn">Retry</button></div>`, quizEl);
      document.getElementById("quiz-retry-btn")?.addEventListener("click", () => {
        void loadQuizAsync(container, state);
      });
    }
  }
  function loadResourcesAsync(state, languages, gaps, uniqueDeps) {
    const el2 = document.getElementById("learn-resources-container");
    if (!el2) return;
    const filteredLangs = state.selectedLanguage ? languages.filter((l2) => l2.label === state.selectedLanguage) : languages;
    const effectiveLangs = filteredLangs.length > 0 ? filteredLangs : languages;
    const effectiveWorkspaces = state.selectedProjects.length > 0 ? state.selectedProjects : _pageCtx.workspaces;
    const focusNames = state.focusedConcepts.map((cid) => findConcept(cid, state)?.name ?? cid);
    const key = resourceCacheKey(effectiveLangs.map((l2) => l2.label), gaps.map((g2) => `${g2.concept}-${g2.lang}`), focusNames);
    if (state.cachedResourceKey === key && state.cachedResources.length > 0) {
      render(renderResourcesHtml(state.cachedResources), el2);
      return;
    }
    render(html2`
    <div class="learn-shimmer" style="width:100%;height:30px;margin-bottom:4px"></div>
    <div class="learn-shimmer" style="width:85%;height:30px;margin-bottom:4px"></div>
    <div class="learn-shimmer" style="width:70%;height:30px"></div>`, el2);
    rpc("generateLearningResources", {
      languages: effectiveLangs.map((l2) => l2.label),
      gaps: gaps.map((g2) => `${g2.concept} (${g2.lang})`),
      focusConcepts: focusNames,
      packageDeps: uniqueDeps,
      workspaces: effectiveWorkspaces
    }).then((data) => {
      if (!document.getElementById("learn-resources-container")) return;
      const resources = data.resources ?? [];
      state.cachedResources = resources;
      state.cachedResourceKey = key;
      saveState(state);
      render(renderResourcesHtml(resources), el2);
    }).catch(() => {
      if (document.getElementById("learn-resources-container")) {
        render(html2`<span class="text-muted" style="font-size:11px">Could not generate resources.</span>`, el2);
      }
    });
  }
  async function renderLearning(container, filter) {
    const existing = container.__snakeInterval;
    if (existing) {
      clearInterval(existing);
      delete container.__snakeInterval;
    }
    const state = getState();
    _pageCtx.filter = filter;
    _pageCtx.container = container;
    const isFirstRender = !container.querySelector(".learn-page");
    if (isFirstRender) {
      render(html2`<${LoadingScreen} message=${"Loading learning system..."} />`, container);
    }
    const [codeByLang, flowState, depsResult, wsBreakdown] = await Promise.all([
      rpc("getCodeProduction", filter),
      rpc("getFlowState", filter),
      rpc("getWorkspaceDeps", {}),
      rpc("getWorkspaceBreakdown", filter)
    ]);
    const rawLanguages = codeByLang.byLanguage.labels.map((l2, i2) => ({ label: l2, loc: codeByLang.byLanguage.aiLoc[i2] ?? 0 })).filter((l2) => !EXCLUDED_LANGS.has(l2.label.toLowerCase()));
    const languages = mergeLanguages(rawLanguages).slice(0, 12);
    _pageCtx.languages = languages;
    const allDeps = [];
    for (const d2 of depsResult.deps ?? []) {
      allDeps.push(...d2.dependencies ?? [], ...d2.devDependencies ?? []);
    }
    const uniqueDeps = [...new Set(allDeps)].slice(0, 30);
    _pageCtx.deps = uniqueDeps;
    const workspaceNames = (wsBreakdown.labels ?? []).slice(0, 20);
    _pageCtx.workspaces = workspaceNames;
    if (state.selectedLanguage && !languages.find((l2) => l2.label === state.selectedLanguage)) {
      state.selectedLanguage = null;
    }
    if (!state.selectedLanguage && languages.length > 0) {
      state.selectedLanguage = languages[0].label;
      if (!state.langProgress[languages[0].label]) state.langProgress[languages[0].label] = {};
    }
    saveState(state);
    const diffColors = { easy: COLORS.green, medium: COLORS.yellow, hard: COLORS.red };
    const gaps = computeGaps(state);
    render(buildLearningMarkup(state, languages, workspaceNames, flowState, gaps, diffColors), container);
    document.getElementById("play-snake-btn")?.addEventListener("click", () => {
      state.snakeUnlocked = true;
      saveState(state);
      renderSnakeGame(container, state, () => {
        void renderLearning(container, {});
      });
    });
    wireSidebarEvents(container, state);
    wireGlobalPickers(container, languages, state);
    restoreLearningSections(container, state, languages, workspaceNames, gaps, uniqueDeps);
  }
  function handleCorrectAnswer(state, q2) {
    state.solved++;
    state.streak++;
    if (state.streak > state.bestStreak) state.bestStreak = state.streak;
    state.solvedSamples.push(q2.question);
    if (state.solvedSamples.length > 20) state.solvedSamples.shift();
    if (state.streak >= 5 && state.currentDifficulty === "easy") state.currentDifficulty = "medium";
    if (state.streak >= 10 && state.currentDifficulty === "medium") state.currentDifficulty = "hard";
  }
  function handleWrongAnswer(state, q2) {
    state.failed++;
    state.streak = 0;
    state.failedSamples.push(q2.question);
    if (state.failedSamples.length > 20) state.failedSamples.shift();
    if (state.currentDifficulty === "hard") state.currentDifficulty = "medium";
  }
  function updateConceptProgress(state, q2, correct) {
    if (!state.selectedLanguage) return;
    if (!state.langProgress[state.selectedLanguage]) state.langProgress[state.selectedLanguage] = {};
    const topic = q2.topic.toLowerCase();
    const langConcepts = getConceptsForLang(state.selectedLanguage, state);
    const matchedConcept = langConcepts.find(
      (c2) => c2.name.toLowerCase() === topic || c2.id === topic || c2.name.toLowerCase().includes(topic) || topic.includes(c2.name.toLowerCase())
    );
    if (!matchedConcept) return;
    const cp = state.langProgress[state.selectedLanguage][matchedConcept.id] ?? { passed: 0, failed: 0 };
    if (correct) cp.passed++;
    else cp.failed++;
    state.langProgress[state.selectedLanguage][matchedConcept.id] = cp;
  }
  function wireQuizHandlers(container, questions, currentIndex, state, packageDeps) {
    const quizContainer = document.getElementById("quiz-container");
    if (!quizContainer) return;
    quizContainer.querySelector(".learn-quiz-skip")?.addEventListener("click", () => {
      const nextIndex = currentIndex + 1;
      render(renderQuiz(questions, nextIndex), quizContainer);
      if (nextIndex < questions.length) {
        wireQuizHandlers(container, questions, nextIndex, state, packageDeps);
      } else {
        document.getElementById("quiz-more-btn")?.addEventListener("click", () => {
          state.cachedQuizKey = "";
          saveState(state);
          void loadQuizAsync(container, state);
        });
      }
    });
    for (const btn of quizContainer.querySelectorAll(".learn-quiz-choice")) {
      btn.addEventListener("click", () => {
        const q2 = questions[currentIndex];
        const chosen = Number.parseInt(btn.dataset.choice ?? "0", 10);
        const correct = chosen === q2.correctIndex;
        for (const b2 of quizContainer.querySelectorAll(".learn-quiz-choice")) {
          b2.disabled = true;
          if (Number.parseInt(b2.dataset.choice ?? "-1", 10) === q2.correctIndex) b2.classList.add("learn-quiz-choice-correct");
          if (Number.parseInt(b2.dataset.choice ?? "-1", 10) === chosen && !correct) b2.classList.add("learn-quiz-choice-wrong");
        }
        if (correct) handleCorrectAnswer(state, q2);
        else handleWrongAnswer(state, q2);
        updateConceptProgress(state, q2, correct);
        saveState(state);
        updateStats(state);
        const feedback = document.getElementById("quiz-feedback");
        if (feedback) {
          feedback.style.display = "block";
          feedback.className = `learn-quiz-feedback ${correct ? "learn-quiz-fb-correct" : "learn-quiz-fb-wrong"}`;
          render(html2`
          <strong>${correct ? html2`${SVG.checkCircle} Correct!` : html2`${SVG.xCircle} Wrong`}</strong>
          <p>${q2.explanation}</p>
          <button class="btn btn-secondary btn-sm learn-quiz-next">${SVG.arrowRight} Next</button>
        `, feedback);
          feedback.querySelector(".learn-quiz-next")?.addEventListener("click", () => {
            const nextIndex = currentIndex + 1;
            render(renderQuiz(questions, nextIndex), quizContainer);
            if (nextIndex < questions.length) {
              wireQuizHandlers(container, questions, nextIndex, state, packageDeps);
            } else {
              document.getElementById("quiz-more-btn")?.addEventListener("click", () => {
                state.cachedQuizKey = "";
                saveState(state);
                void loadQuizAsync(container, state);
              });
            }
          });
        }
      });
    }
  }

  // src/webview/page-sdlc.ts
  function classifyWorkType(msg) {
    const patterns = [
      [/\b(fix|bug|error|issue|crash|exception|debug|problem|broken|fail|wrong)\b/i, "bug fix"],
      [/\b(refactor|rename|extract|move|cleanup|simplify|restructure|reorganize)\b/i, "refactor"],
      [/\b(review|pr|pull request|code review|comment on|feedback|approve)\b/i, "code review"],
      [/\b(test|spec|expect|assert|mock|stub|coverage|vitest|jest|pytest|unittest)\b/i, "test"],
      [/\b(doc|readme|comment|explain|jsdoc|typedoc|docstring|swagger|openapi)\b/i, "docs"],
      [/\b(style|css|scss|sass|theme|layout|padding|margin|font|color|design|ui)\b/i, "style"],
      [/\b(config|setup|install|dependency|package|ci|cd|pipeline|deploy|docker|k8s|terraform|bicep|env|yaml|yml)\b/i, "config"],
      [/\b(add|create|implement|build|feature|new|scaffold|generate|develop)\b/i, "feature"]
    ];
    for (const [re, wt] of patterns) {
      if (re.test(msg)) return wt;
    }
    return "other";
  }
  function getDiversityBonus(diverse) {
    if (diverse >= 5) return 10;
    if (diverse >= 3) return 5;
    return 0;
  }
  function getMcpBonus(mcpCount) {
    if (mcpCount >= 3) return 15;
    if (mcpCount >= 1) return 10;
    return 0;
  }
  function getPhaseScore(dist, total, mcpCount, hasAw, hasWorkflows, hasContext) {
    if (total === 0) return { label: "No data", score: 0, color: COLORS.muted };
    const reviewBonus = (dist["code review"] ?? 0) > 0 ? 15 : 0;
    const testBonus = (dist["test"] ?? 0) > 0 ? 15 : 0;
    const docsBonus = (dist["docs"] ?? 0) > 0 ? 10 : 0;
    const configBonus = (dist["config"] ?? 0) > 0 ? 10 : 0;
    const diverse = Object.values(dist).filter((v2) => v2 > 0).length;
    const score = reviewBonus + testBonus + docsBonus + configBonus + getDiversityBonus(diverse) + getMcpBonus(mcpCount) + (hasAw ? 15 : 0) + (hasWorkflows ? 10 : 0) + (hasContext ? 10 : 0);
    const color2 = score >= 70 ? COLORS.green : score >= 40 ? COLORS.yellow : COLORS.red;
    const label = score >= 70 ? "Excellent" : score >= 40 ? "Good" : "Needs Improvement";
    return { label, score, color: color2 };
  }
  async function renderSdlc(container, filter) {
    render(html2`<${LoadingScreen} message="Analyzing SDLC patterns..." />`, container);
    const [sessions, toolAnalysis, repoScan] = await Promise.all([
      rpc("getSessions", { page: 1, pageSize: 500, filter }),
      rpc("getSdlcToolAnalysis", { filter }),
      rpc("getSdlcRepoScan", {})
    ]);
    const workTypeDistribution = {};
    for (const wt of WORK_TYPES) workTypeDistribution[wt] = 0;
    for (const s2 of sessions.sessions) {
      if (!s2.firstMessage) continue;
      const wt = classifyWorkType(s2.firstMessage);
      workTypeDistribution[wt]++;
    }
    const classifiedTotal = Object.values(workTypeDistribution).reduce((a2, b2) => a2 + b2, 0);
    const mcpServers = (toolAnalysis.mcpServers || []).filter((s2) => s2.isSdlcRelevant);
    const allRepos = repoScan.repos || [];
    const reposWithAw = allRepos.filter((r2) => r2.agenticWorkflows.length > 0);
    const reposWithoutAw = allRepos.filter((r2) => r2.agenticWorkflows.length === 0);
    const repos = [...reposWithAw, ...reposWithoutAw].slice(0, 20);
    const awCount = allRepos.filter((r2) => r2.agenticWorkflows.length > 0).length;
    const wfCount = allRepos.filter((r2) => r2.workflows.length > 0).length;
    const ctxCount = allRepos.filter((r2) => r2.contextFiles.length > 0).length;
    const finalScore = getPhaseScore(
      workTypeDistribution,
      sessions.total,
      mcpServers.length,
      awCount > 0,
      wfCount > 0,
      ctxCount > 0
    );
    const recs = generateRecommendations(workTypeDistribution, classifiedTotal, mcpServers, awCount, wfCount, ctxCount);
    render(html2`
    <div class="sdlc-page">
      <!-- Header -->
      <div class="sdlc-hero">
        <div class="sdlc-hero-left">
          <div class="sdlc-hero-icon">${SVG.refresh}</div>
          <div>
            <h2 class="sdlc-hero-title">Agentic SDLC</h2>
            <p class="sdlc-hero-sub">How well are you using AI agents across the software development lifecycle?</p>
          </div>
        </div>
        <div class="sdlc-hero-right">
          <div class="sdlc-score-ring" style=${"--score:" + finalScore.score + ";--score-color:" + finalScore.color}>
            <div class="sdlc-score-val">${finalScore.score}</div>
          </div>
          <div class="sdlc-score-label">${finalScore.label}</div>
        </div>
      </div>

      <!-- Stats row -->
      <div class="sdlc-stats">
        <div class="sdlc-stat"><div class="sdlc-stat-val">${sessions.total}</div><div class="sdlc-stat-lbl">Total Sessions</div></div>
        <div class="sdlc-stat"><div class="sdlc-stat-val" style=${"color:" + COLORS.blue}>${mcpServers.length}</div><div class="sdlc-stat-lbl">MCP Servers</div></div>
        <div class="sdlc-stat"><div class="sdlc-stat-val" style=${"color:" + COLORS.green}>${awCount}</div><div class="sdlc-stat-lbl">Agentic Workflows</div></div>
        <div class="sdlc-stat"><div class="sdlc-stat-val" style=${"color:" + COLORS.blue}>${wfCount}</div><div class="sdlc-stat-lbl">CI/CD Workflows</div></div>
        <div class="sdlc-stat"><div class="sdlc-stat-val" style=${"color:" + COLORS.purple}>${ctxCount}</div><div class="sdlc-stat-lbl">Context Configs</div></div>
      </div>

      <div class="sdlc-columns">
        <!-- Main content -->
        <div class="sdlc-main">
          <!-- MCP Server Integration -->
          <div class="sdlc-section">
            <h3 class="sdlc-section-title">${SVG.globe} MCP Server Integration</h3>
            ${mcpServers.length === 0 ? html2`<div class="sdlc-empty">No SDLC MCP servers detected in your sessions. Add tools like GitHub, Atlassian, or Azure DevOps MCP servers to your setup.</div>` : html2`<div class="sdlc-mcp-grid">
                  ${mcpServers.map((s2) => html2`
                    <div class="sdlc-mcp-card sdlc-mcp-relevant">
                      <div class="sdlc-mcp-top">
                        <span class="sdlc-mcp-name">${s2.label}</span>
                        <span class="sdlc-mcp-badge">${s2.category}</span>
                      </div>
                      <div class="sdlc-mcp-calls">${s2.toolCalls} tool calls</div>
                    </div>`)}
                </div>`}
          </div>

          <!-- Work Type Distribution -->
          <div class="sdlc-section">
            <h3 class="sdlc-section-title">${SVG.barChart} Work Type Distribution</h3>
            <div class="sdlc-phase-grid">
              ${WORK_TYPES.filter((wt) => wt !== "other").map((wt) => {
      const count = workTypeDistribution[wt];
      const pct = classifiedTotal > 0 ? count / classifiedTotal * 100 : 0;
      return html2`
                <div class="sdlc-phase-card">
                  <div class="sdlc-phase-top">
                    <span class="sdlc-phase-dot" style=${"background:" + WORK_TYPE_COLORS[wt]}></span>
                    <span class="sdlc-phase-name">${wt}</span>
                    <span class="sdlc-phase-count">${count}</span>
                  </div>
                  <div class="sdlc-phase-bar">
                    <div class="sdlc-phase-bar-fill" style=${"width:" + pct + "%;background:" + WORK_TYPE_COLORS[wt]}></div>
                  </div>
                  <div class="sdlc-phase-pct">${pct.toFixed(1)}%</div>
                </div>`;
    })}
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="sdlc-sidebar">
          <!-- GitHub Config per Repo -->
          <div class="sdlc-section">
            <h3 class="sdlc-section-title">${SVG.robot} GitHub Configuration</h3>
            ${repos.length === 0 ? html2`<div class="sdlc-empty">No workspace repos resolved. Open projects in VS Code to scan.</div>` : html2`<div class="sdlc-ghaw-list">
                  ${repos.map((r2) => {
      const hasAny = r2.agenticWorkflows.length > 0 || r2.workflows.length > 0 || r2.contextFiles.length > 0;
      return html2`
                    <div class=${"sdlc-ghaw-item" + (hasAny ? " sdlc-ghaw-active" : "")}>
                      <div class="sdlc-ghaw-info">
                        <div class="sdlc-ghaw-name">${r2.workspace}</div>
                        ${r2.agenticWorkflows.length > 0 && html2`<div class="sdlc-ghaw-detail sdlc-ghaw-aw">${SVG.bolt} <strong>Agentic Workflows</strong> (.github/aw): ${r2.agenticWorkflows.join(", ")}</div>`}
                        ${r2.workflows.length > 0 && html2`<div class="sdlc-ghaw-detail sdlc-ghaw-wf">${SVG.gear} <strong>Workflows</strong> (.github/workflows): ${r2.workflows.join(", ")}</div>`}
                        ${r2.contextFiles.length > 0 && html2`<div class="sdlc-ghaw-detail sdlc-ghaw-ctx">${SVG.pencilDoc} <strong>Context Files</strong>: ${r2.contextFiles.join(", ")}</div>`}
                        ${!hasAny && html2`<div class="sdlc-ghaw-detail">No .github/ config found</div>`}
                      </div>
                    </div>`;
    })}
                </div>`}
          </div>

          <!-- Recommendations -->
          <div class="sdlc-section">
            <h3 class="sdlc-section-title">${SVG.lightbulb} Recommendations</h3>
            <div class="sdlc-rec-list">
              ${recs.map((r2) => html2`
                <div class="sdlc-rec-item">
                  <span class="sdlc-rec-icon">${r2.icon}</span>
                  <div>
                    <div class="sdlc-rec-title">${r2.title}</div>
                    <div class="sdlc-rec-desc">${r2.description}</div>
                  </div>
                </div>`)}
            </div>
          </div>
        </div>
      </div>
    </div>
  `, container);
  }
  function generateRecommendations(dist, total, mcpServers, awCount, wfCount, ctxCount) {
    const recs = [];
    if (total === 0) return [{ icon: SVG.lightbulb, title: "Start using AI", description: "Begin using GitHub Copilot to see SDLC insights." }];
    const reviewPct = (dist["code review"] ?? 0) / total * 100;
    if (reviewPct < 5) {
      recs.push({ icon: SVG.warning, title: "Add AI Reviews", description: "Less than 5% of sessions involve code review. Use Copilot as a reviewer for PRs." });
    }
    const testPct = (dist["test"] ?? 0) / total * 100;
    if (testPct < 10) {
      recs.push({ icon: SVG.warning, title: "More AI Testing", description: "Low test session ratio. Ask Copilot to write tests alongside features." });
    }
    if (mcpServers.length === 0) {
      recs.push({ icon: SVG.globe, title: "Add SDLC MCP Servers", description: "Connect GitHub, Atlassian, or Azure DevOps MCP servers for deeper integration." });
    }
    if (awCount === 0) {
      recs.push({ icon: SVG.bolt, title: "Enable Agentic Workflows", description: "Set up GitHub Agentic Workflows in .github/aw/ for automated agent-driven tasks." });
    }
    if (ctxCount === 0) {
      recs.push({ icon: SVG.pencilDoc, title: "Add Context Files", description: "Create .github/agents/ or copilot-instructions.md to give Copilot project-specific guidance." });
    }
    if (wfCount === 0) {
      recs.push({ icon: SVG.gear, title: "Add CI/CD Workflows", description: "Set up GitHub Actions in .github/workflows/ for automated testing and deployment." });
    }
    if (recs.length === 0) {
      recs.push({ icon: SVG.checkCircle, title: "Well-integrated SDLC", description: "You are using AI agents across multiple phases with MCP integration. Keep it up!" });
    }
    return recs.slice(0, 5);
  }

  // src/webview/page-peers.ts
  var REPO_URL = "https://github.com/microsoft/AI-Engineering-Coach";
  function getShareText(data) {
    return `My AI coding stats: ${formatNum(data.totalLoc)} lines of code, ${data.currentStreak}-day streak, Flow Score ${data.flowScore}. Track yours with AI Engineer Coach \u{1F447}

${REPO_URL}`;
  }
  function getTwitterShareUrl(data) {
    const text = getShareText(data);
    return `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
  }
  function getLinkedInShareUrl(data) {
    const text = `My AI coding stats:
\u{1F525} ${data.currentStreak}-day streak
\u{1F4BB} ${formatNum(data.totalLoc)} AI lines of code
\u26A1 Flow Score ${data.flowScore}

Track yours \u2192 ${REPO_URL}

#AI #CodingStats #GitHub #Copilot`;
    return `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`;
  }
  function getRedditShareUrl(data) {
    const title = `My AI coding stats: ${formatNum(data.totalLoc)} lines, ${data.currentStreak}-day streak (AI Engineer Coach)`;
    return `https://www.reddit.com/submit?url=${encodeURIComponent(REPO_URL)}&title=${encodeURIComponent(title)}`;
  }
  function getHNShareUrl() {
    return `https://news.ycombinator.com/submitlink?u=${encodeURIComponent(REPO_URL)}&t=${encodeURIComponent("AI Engineer Coach - Local analytics for AI coding sessions")}`;
  }
  function drawShareCard(canvas, data) {
    const W = 600;
    const H2 = 280;
    canvas.width = W * 2;
    canvas.height = H2 * 2;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H2}px`;
    const ctx = canvas.getContext("2d");
    ctx.scale(2, 2);
    const bg = ctx.createLinearGradient(0, 0, W, H2);
    bg.addColorStop(0, "#0d1117");
    bg.addColorStop(1, "#161b22");
    ctx.fillStyle = bg;
    roundRect(ctx, 0, 0, W, H2, 16);
    ctx.fill();
    ctx.strokeStyle = "#30363d";
    ctx.lineWidth = 1;
    roundRect(ctx, 0.5, 0.5, W - 1, H2 - 1, 16);
    ctx.stroke();
    const accent = ctx.createLinearGradient(0, 0, W, 0);
    accent.addColorStop(0, "#58a6ff");
    accent.addColorStop(0.5, "#3fb950");
    accent.addColorStop(1, "#bc8cff");
    ctx.fillStyle = accent;
    ctx.fillRect(24, 0, W - 48, 4);
    ctx.fillStyle = "#e6edf3";
    ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText("Agentic Engineering Stats", 28, 36);
    if (data.currentStreak >= 7) {
      const titleW = ctx.measureText("Agentic Engineering Stats").width;
      const streakText = `\u{1F525} ${data.currentStreak}d`;
      const streakColor = data.currentStreak >= 100 ? "#ff4500" : data.currentStreak >= 30 ? "#f85149" : "#d29922";
      ctx.fillStyle = streakColor + "20";
      const stw = ctx.measureText(streakText).width + 12;
      roundRect(ctx, 28 + titleW + 10, 22, stw, 20, 10);
      ctx.fill();
      ctx.fillStyle = streakColor;
      ctx.font = "bold 12px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText(streakText, 28 + titleW + 16, 36);
    }
    ctx.fillStyle = "#8b949e";
    ctx.font = "12px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText(`Since ${data.firstDay} \xB7 ${data.activeDays} active days`, 28, 56);
    const stats = [
      { label: "AI Lines of Code", value: formatNum(data.totalLoc), color: "#3fb950" },
      { label: "Sessions", value: formatNum(data.totalSessions), color: "#e6edf3" },
      { label: "Flow Score", value: String(data.flowScore), color: "#58a6ff" },
      { label: "Requests", value: formatNum(data.totalRequests), color: "#bc8cff" },
      { label: "Best Streak", value: `${data.bestStreak}d`, color: "#d29922" },
      { label: "Active Days", value: String(data.activeDays), color: "#8b949e" }
    ];
    const colW = (W - 56) / 3;
    const rowH = 56;
    const startY = 72;
    for (const [i2, s2] of stats.entries()) {
      const col = i2 % 3;
      const row = Math.floor(i2 / 3);
      const x2 = 28 + col * colW;
      const y2 = startY + row * rowH;
      ctx.fillStyle = s2.color;
      ctx.font = "bold 26px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText(s2.value, x2, y2 + 22);
      ctx.fillStyle = "#8b949e";
      ctx.font = "11px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText(s2.label, x2, y2 + 38);
    }
    const langY = startY + 2 * rowH + 8;
    ctx.fillStyle = "#8b949e";
    ctx.font = "11px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText("Top Languages", 28, langY + 14);
    let pillX = 126;
    const langColors = ["#58a6ff", "#3fb950", "#d29922", "#bc8cff", "#f85149"];
    for (const [i2, lang] of data.topLanguages.slice(0, 5).entries()) {
      const tw = ctx.measureText(lang).width + 14;
      ctx.fillStyle = langColors[i2 % langColors.length] + "22";
      roundRect(ctx, pillX, langY + 2, tw, 20, 10);
      ctx.fill();
      ctx.fillStyle = langColors[i2 % langColors.length];
      ctx.font = "bold 10px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText(lang, pillX + 7, langY + 15);
      pillX += tw + 5;
    }
    ctx.fillStyle = "#484f58";
    ctx.font = "10px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText("ai-engineer-coach", 28, H2 - 14);
    const dateStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const dateW = ctx.measureText(dateStr).width;
    ctx.fillText(dateStr, W - 28 - dateW, H2 - 14);
    ctx.fillStyle = "#58a6ff";
    ctx.font = "10px -apple-system, BlinkMacSystemFont, sans-serif";
    const repoShort = "github.com/microsoft/AI-Engineering-Coach";
    const repoW = ctx.measureText(repoShort).width;
    ctx.fillText(repoShort, (W - repoW) / 2, H2 - 14);
  }
  function roundRect(ctx, x2, y2, w2, h3, r2) {
    ctx.beginPath();
    ctx.moveTo(x2 + r2, y2);
    ctx.lineTo(x2 + w2 - r2, y2);
    ctx.quadraticCurveTo(x2 + w2, y2, x2 + w2, y2 + r2);
    ctx.lineTo(x2 + w2, y2 + h3 - r2);
    ctx.quadraticCurveTo(x2 + w2, y2 + h3, x2 + w2 - r2, y2 + h3);
    ctx.lineTo(x2 + r2, y2 + h3);
    ctx.quadraticCurveTo(x2, y2 + h3, x2, y2 + h3 - r2);
    ctx.lineTo(x2, y2 + r2);
    ctx.quadraticCurveTo(x2, y2, x2 + r2, y2);
    ctx.closePath();
  }
  function computeCurrentStreak(labels, values) {
    if (labels.length === 0 || values.length === 0) return 0;
    const toUtcDay = (label) => {
      const [year, month, day] = label.split("-").map(Number);
      return Date.UTC(year, month - 1, day);
    };
    const today = /* @__PURE__ */ new Date();
    const todayUtcDay = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    const lastActivityUtcDay = toUtcDay(labels[labels.length - 1]);
    const gapFromToday = Math.round((todayUtcDay - lastActivityUtcDay) / 864e5);
    if (gapFromToday > 1) return 0;
    let streak = 0;
    for (let i2 = labels.length - 1; i2 >= 0; i2--) {
      if (values[i2] <= 0) break;
      if (i2 < labels.length - 1) {
        const curr = toUtcDay(labels[i2]);
        const next = toUtcDay(labels[i2 + 1]);
        const gap = Math.round((next - curr) / 864e5);
        if (gap !== 1) break;
      }
      streak++;
    }
    return streak;
  }
  async function renderShareCard(container, filter) {
    render(html2`<${LoadingScreen} message="Generating share card..." />`, container);
    const [stats, production, balance, flowState, codeByLang, dailyActivity, antiPatterns] = await Promise.all([
      rpc("getStats", filter),
      rpc("getCodeProduction", filter),
      rpc("getWorkLifeBalance", filter),
      rpc("getFlowState", filter),
      rpc("getCodeProduction", filter),
      rpc("getDailyActivity", filter),
      rpc("getAntiPatterns", filter)
    ]);
    const currentStreak = computeCurrentStreak(dailyActivity.labels, dailyActivity.values);
    const bestStreak = balance?.maxStreak ?? 0;
    const activeDays = dailyActivity.values.filter((v2) => v2 > 0).length;
    const firstDay = dailyActivity.labels[0] ?? "Unknown";
    const antiPatternCount = antiPatterns?.patterns?.length ?? 0;
    const langDedup = deduplicateLanguages(codeByLang.byLanguage.labels);
    const cardData = {
      totalLoc: production.summary.totalAiLoc,
      totalSessions: stats.totalSessions,
      totalRequests: stats.totalRequests,
      currentStreak,
      bestStreak: Math.max(bestStreak, currentStreak),
      flowScore: flowState.overallFlowScore,
      topLanguages: langDedup.slice(0, 5),
      activeDays,
      firstDay,
      antiPatternCount,
      dailyQuality: { labels: [], values: [] }
    };
    const shareCtx = {
      ...cardData,
      antiPatternCount
    };
    render(html2`
    <div class="share-page">
      <div class="share-card-wrap">
        <canvas id="share-card-canvas"></canvas>
      </div>

      <div class="share-actions">
        <button class="btn btn-primary" id="share-download-btn">${SVG.share} Download PNG</button>
        <button class="btn btn-secondary" id="share-copy-btn">${SVG.clipboard} Copy</button>
        <button class="btn btn-secondary" id="share-export-summary-btn">${SVG.share} Export Summary</button>
      </div>

      <div class="share-social">
        <button class="btn-social btn-social-x" id="share-x">𝕏 Post</button>
        <button class="btn-social btn-social-linkedin" id="share-linkedin">in LinkedIn</button>
        <button class="btn-social btn-social-reddit" id="share-reddit">Reddit</button>
        <button class="btn-social btn-social-hn" id="share-hn">Y Hacker News</button>
      </div>

      <div class="share-hint" id="share-toast" style="display:none"></div>
    </div>
  `, container);
    const canvas = document.getElementById("share-card-canvas");
    drawShareCard(canvas, cardData);
    document.getElementById("share-download-btn")?.addEventListener("click", () => {
      if (!canvas) return;
      const link = document.createElement("a");
      link.download = `agentic-engineering-stats-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      showToast("Downloaded! Now share it.");
    });
    document.getElementById("share-copy-btn")?.addEventListener("click", () => {
      void (async () => {
        if (!canvas) return;
        try {
          const blob = await new Promise((resolve2) => {
            canvas.toBlob((b2) => resolve2(b2), "image/png");
          });
          await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
          showToast("Copied! Paste it anywhere.");
        } catch {
          showToast("Copy failed \u2014 try downloading instead");
        }
      })();
    });
    document.getElementById("share-export-summary-btn")?.addEventListener("click", () => {
      void (async () => {
        try {
          const result = await rpc("exportSummary", { filter });
          if (result.cancelled) return;
          showToast(result.ok ? "Summary exported." : "Export cancelled.");
        } catch {
          showToast("Export failed.");
        }
      })();
    });
    const openUrl = (url) => {
      void rpc("openExternal", { url }).catch(() => {
        showToast("Unable to open link right now.");
      });
    };
    document.getElementById("share-x")?.addEventListener("click", () => openUrl(getTwitterShareUrl(shareCtx)));
    document.getElementById("share-linkedin")?.addEventListener("click", () => {
      void (async () => {
        try {
          const blob = await new Promise((resolve2) => {
            canvas.toBlob((b2) => resolve2(b2), "image/png");
          });
          await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
          showToast("Image copied! Paste it in your LinkedIn post.");
        } catch {
        }
        openUrl(getLinkedInShareUrl(shareCtx));
      })();
    });
    document.getElementById("share-reddit")?.addEventListener("click", () => openUrl(getRedditShareUrl(shareCtx)));
    document.getElementById("share-hn")?.addEventListener("click", () => openUrl(getHNShareUrl()));
  }
  function deduplicateLanguages(langs) {
    const aliases = {
      py: "python",
      ts: "typescript",
      js: "javascript",
      rb: "ruby",
      rs: "rust",
      cs: "csharp",
      sh: "shell",
      bash: "shell",
      zsh: "shell",
      yml: "yaml"
    };
    const seen = /* @__PURE__ */ new Set();
    const result = [];
    for (const lang of langs) {
      const normalized = aliases[lang.toLowerCase()] ?? lang.toLowerCase();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        result.push(lang);
      }
    }
    return result;
  }
  function showToast(msg) {
    const el2 = document.getElementById("share-toast");
    if (!el2) return;
    el2.textContent = msg;
    el2.style.display = "block";
    setTimeout(() => {
      el2.style.display = "none";
    }, 2500);
  }

  // src/webview/page-experiments.ts
  var EXPERIMENT_KEYS = [
    "achievements",
    "learning",
    "sdlc",
    "shareCard"
  ];
  var EXPERIMENTS = [
    {
      key: "achievements",
      title: "Achievement System",
      icon: SVG.trophy,
      description: `Unlock fun milestones on your path to becoming a true AI Engineer. Track how many times you've "rewritten the Linux kernel" in LoC, earn dinosaur badges for using legacy tech, and more.`,
      tag: "Fun"
    },
    {
      key: "learning",
      title: "Learning System / Focus Helper",
      icon: SVG.brain,
      description: "While the AI agent works, sharpen your skills with coding riddles, quizzes, and a personalized skill tree. Earn a Snake game reward after a 5-answer streak. Recommendations from the web included.",
      tag: "Learn"
    },
    {
      key: "sdlc",
      title: "Agentic SDLC Tracker",
      icon: SVG.refresh,
      description: "Measure how well you leverage the Agentic Software Development Life Cycle: agent-powered reviews, cloud agents for issue delegation, AI triage workflows, and more.",
      tag: "Process"
    },
    {
      key: "shareCard",
      title: "Share Card",
      icon: SVG.share,
      description: "Generate a personalized stats card with your streaks, achievements, and AI coding stats. Download as an image to share with your team.",
      tag: "Social"
    }
  ];
  var LAB_TABS = [
    { id: "learning", label: "Learning", icon: SVG.brain, experiment: "learning", badgeId: "lu-badge-learning", render: renderLearning },
    { id: "achievements", label: "Achievements", icon: SVG.trophy, experiment: "achievements", badgeId: "lu-badge-achievements", render: renderAchievements },
    { id: "sdlc", label: "SDLC", icon: SVG.refresh, experiment: "sdlc", badgeId: "lu-badge-sdlc", render: renderSdlc },
    { id: "share", label: "Share", icon: SVG.share, experiment: "shareCard", render: renderShareCard }
  ];
  function getExperiments() {
    const state = vscode.getState();
    const saved = state?.experiments ?? {};
    const result = {};
    for (const key of EXPERIMENT_KEYS) {
      result[key] = saved[key] !== false;
    }
    return result;
  }
  function setExperiment(key, enabled) {
    const state = vscode.getState() ?? {};
    const experiments = { ...state.experiments ?? {}, [key]: enabled };
    vscode.setState({ ...state, experiments });
  }
  function getActiveLabTab() {
    const state = vscode.getState();
    return state?.activeLabTab || "learning";
  }
  function setActiveLabTab(id) {
    const state = vscode.getState() ?? {};
    vscode.setState({ ...state, activeLabTab: id });
  }
  async function renderLevelUp(container, filter) {
    const experiments = getExperiments();
    let activeTab2 = getActiveLabTab();
    if (!LAB_TABS.find((t3) => t3.id === activeTab2)) activeTab2 = "learning";
    render(html2`
    <div class="experiments-page">
      <div class="lab-tab-bar">
        ${LAB_TABS.map((tab) => {
      const on = experiments[tab.experiment];
      return html2`<button class=${"lab-tab" + (tab.id === activeTab2 ? " lab-tab-active" : "") + (on ? "" : " lab-tab-disabled")} data-lab-tab=${tab.id}>
            <span class="lab-tab-icon">${tab.icon}</span>
            <span class="lab-tab-label">${tab.label}</span>
            ${!on ? html2`<span class="lab-tab-badge">OFF</span>` : tab.badgeId ? html2`<span class="lab-tab-count" id=${tab.badgeId}></span>` : null}
          </button>`;
    })}
      </div>
      <div id="lab-tab-content"></div>
    </div>
  `, container);
    const tabContent = container.querySelector("#lab-tab-content");
    async function renderTab(tabId) {
      const tab = LAB_TABS.find((t3) => t3.id === tabId);
      const isEnabled = experiments[tab.experiment];
      for (const btn of container.querySelectorAll(".lab-tab")) {
        btn.classList.toggle("lab-tab-active", btn.dataset.labTab === tabId);
      }
      if (isEnabled) {
        render(null, tabContent);
        await tab.render(tabContent, filter);
      } else {
        const exp = EXPERIMENTS.find((e2) => e2.key === tab.experiment);
        render(html2`
        <div class="lab-enable-prompt">
          <div class="experiment-card" data-experiment=${exp.key}>
            <div class="experiment-card-header">
              <span class="experiment-icon">${exp.icon}</span>
              <span class="experiment-tag">${exp.tag}</span>
            </div>
            <div class="experiment-card-body">
              <h3 class="experiment-title">${exp.title}</h3>
              <p class="experiment-desc">${exp.description}</p>
            </div>
            <div class="experiment-card-footer">
              <label class="experiment-toggle">
                <input type="checkbox" data-key=${exp.key} />
                <span class="toggle-slider"></span>
                <span class="toggle-label">Disabled</span>
              </label>
            </div>
          </div>
        </div>
      `, tabContent);
        tabContent.querySelector("input[data-key]")?.addEventListener("change", (e2) => {
          void (async () => {
            const input = e2.target;
            const key = input.dataset.key;
            setExperiment(key, true);
            experiments[key] = true;
            const tabBtn = container.querySelector(`.lab-tab[data-lab-tab="${tabId}"]`);
            if (tabBtn) {
              tabBtn.classList.remove("lab-tab-disabled");
              const badge = tabBtn.querySelector(".lab-tab-badge");
              badge?.remove();
            }
            window.dispatchEvent(new CustomEvent("experiments-changed"));
            await renderTab(tabId);
          })();
        });
      }
    }
    for (const btn of container.querySelectorAll(".lab-tab")) {
      btn.addEventListener("click", () => {
        void (async () => {
          const tabId = btn.dataset.labTab;
          if (!tabId) return;
          setActiveLabTab(tabId);
          activeTab2 = tabId;
          await renderTab(tabId);
        })();
      });
    }
    await renderTab(activeTab2);
    refreshTabBadges(filter);
  }
  function refreshTabBadges(filter) {
    const ls = vscode.getState();
    const solved = ls?.learningState?.solved ?? 0;
    setBadgeText("lu-badge-learning", solved);
    const achState = ls?.achievementState?.unlockDates ?? {};
    const unlocked = Object.keys(achState).length;
    setBadgeText("lu-badge-achievements", unlocked);
    rpc("getSdlcToolAnalysis", filter).then((d2) => {
      const relevant = d2.mcpServers.filter((s2) => s2.isSdlcRelevant).length;
      setBadgeText("lu-badge-sdlc", relevant);
    }).catch(() => {
    });
  }
  function setBadgeText(id, value) {
    const el2 = document.getElementById(id);
    if (!el2) return;
    if (!value || value === 0) {
      el2.style.display = "none";
      return;
    }
    el2.textContent = String(value);
    el2.style.display = "";
  }

  // src/webview/page-data-explorer.ts
  async function renderDataExplorer(content, filter) {
    const data = await rpc("getDataExplorerFields", filter);
    const fields = data.fields ?? [];
    const reqFields = fields.filter((f2) => f2.scope === "request");
    const sessionFields = fields.filter((f2) => f2.scope === "session");
    render(html2`
    <div class="explorer-header">
      <h2>Data Explorer</h2>
      <p class="explorer-subtitle">${data.requestCount.toLocaleString()} requests, ${data.sessionCount.toLocaleString()} sessions</p>
    </div>

    <div class="explorer-search">
      <input type="text" id="explorer-filter" placeholder="Filter fields..." />
    </div>

    <div class="explorer-layout">
      <div class="explorer-sidebar" id="explorer-field-list">
        <h3>Request Fields (${reqFields.length})</h3>
        ${reqFields.map((f2) => html2`<${FieldItem} field=${f2} />`)}
        <h3>Session Fields (${sessionFields.length})</h3>
        ${sessionFields.map((f2) => html2`<${FieldItem} field=${f2} />`)}
      </div>
      <div class="explorer-detail" id="explorer-detail">
        <div class="explorer-empty">Select a field to explore its distribution</div>
      </div>
    </div>
  `, content);
    for (const el2 of content.querySelectorAll(".explorer-field-item")) {
      el2.addEventListener("click", () => {
        for (const item of content.querySelectorAll(".explorer-field-item")) item.classList.remove("active");
        el2.classList.add("active");
        const fieldName = el2.dataset.field || "";
        void showFieldDetail(fieldName, filter, content);
      });
    }
    const filterInput = content.querySelector("#explorer-filter");
    if (filterInput) {
      filterInput.addEventListener("input", () => {
        const query = filterInput.value.toLowerCase();
        for (const el2 of content.querySelectorAll(".explorer-field-item")) {
          const name = (el2.dataset.field || "").toLowerCase();
          const desc = el2.querySelector(".field-desc")?.textContent?.toLowerCase() || "";
          el2.style.display = name.includes(query) || desc.includes(query) ? "" : "none";
        }
      });
    }
  }
  function FieldItem({ field: f2 }) {
    const fillColor = f2.fillRate > 80 ? COLORS.green : f2.fillRate > 40 ? COLORS.yellow : COLORS.red;
    return html2`
    <div class="explorer-field-item" data-field=${f2.name}>
      <div class="field-name">${f2.name}</div>
      <div class="field-desc">${f2.description}</div>
      <div class="field-meta">
        <span class="field-type">${f2.type}</span>
        <span class="field-fill" style=${"color:" + fillColor}>${f2.fillRate}% filled</span>
      </div>
    </div>
  `;
  }
  async function showFieldDetail(fieldName, filter, content) {
    const detail = content.querySelector("#explorer-detail");
    if (!detail) return;
    render(html2`<div class="loading-spinner"></div>`, detail);
    const data = await rpc("getDataExplorer", { field: fieldName, filter });
    if (data.error) {
      render(html2`<div class="error-msg">${data.error}</div>`, detail);
      return;
    }
    const field = data.field;
    const stats = data.stats ?? null;
    const histogram = data.histogram;
    const topValues = data.topValues;
    render(html2`
    <h3>${field.name}</h3>
    <p class="field-type-label">${field.type} \u2014 ${field.description}</p>

    ${stats && html2`
      <div class="explorer-stats-grid">
        <${MiniStat} label="Min" value=${stats.min} />
        <${MiniStat} label="Max" value=${stats.max} />
        <${MiniStat} label="Avg" value=${stats.avg} />
        <${MiniStat} label="P25" value=${stats.p25} />
        <${MiniStat} label="P50" value=${stats.p50} />
        <${MiniStat} label="P75" value=${stats.p75} />
      </div>
    `}

    ${histogram && histogram.length > 0 && html2`
      <div class="explorer-histogram">
        ${histogram.map((bin) => {
      const maxCount = Math.max(...histogram.map((b2) => b2.count));
      const pct = maxCount > 0 ? bin.count / maxCount * 100 : 0;
      return html2`
            <div class="histogram-bar-row">
              <span class="histogram-label">${bin.label}</span>
              <div class="histogram-bar" style=${"width:" + pct + "%;background:" + COLORS.blue}></div>
              <span class="histogram-count">${bin.count}</span>
            </div>
          `;
    })}
      </div>
    `}

    ${data.trueCount !== void 0 && html2`
      <div class="explorer-stats-grid">
        <${MiniStat} label="True" value=${data.trueCount} />
        <${MiniStat} label="False" value=${data.falseCount ?? 0} />
        <${MiniStat} label="True Rate" value=${(data.trueRate ?? 0) + "%"} />
      </div>
    `}

    ${topValues && topValues.length > 0 && html2`
      <h4>Top Values (${data.uniqueCount} unique)</h4>
      <table class="explorer-table">
        <thead><tr><th>Value</th><th>Count</th><th>%</th></tr></thead>
        <tbody>
          ${topValues.map((tv) => html2`<tr><td>${tv.value}</td><td>${tv.count}</td><td>${tv.pct}%</td></tr>`)}
        </tbody>
      </table>
    `}

    ${data.avgLength !== void 0 && html2`
      <div class="explorer-stats-grid">
        <${MiniStat} label="Avg Length" value=${data.avgLength} />
        <${MiniStat} label="Empty" value=${(data.emptyRate ?? 0) + "%"} />
      </div>
    `}

    <div class="explorer-actions">
      <button class="btn-secondary" data-action="playground" data-field=${fieldName}
        onClick=${() => document.querySelector('[data-page="rule-playground"]')?.click()}>
        Open in Playground
      </button>
    </div>
  `, detail);
  }
  function MiniStat({ label, value }) {
    const display = typeof value === "number" ? value.toLocaleString() : value;
    return html2`<div class="stat-card"><div class="stat-value">${display}</div><div class="stat-label">${label}</div></div>`;
  }

  // src/webview/page-rule-playground.ts
  async function renderRulePlayground(content, filter) {
    const [schemaData, funcData, metricData] = await Promise.all([
      rpc("getFieldSchema", void 0),
      rpc("getFunctionCatalog", void 0),
      rpc("getMetricList", void 0)
    ]);
    const fields = schemaData.fields ?? [];
    const functions = funcData.functions ?? [];
    const metrics = metricData.metrics ?? [];
    const funcGroups = groupPlaygroundFunctions(functions);
    render(html2`
    <div class="playground-header">
      <h2>Rule Playground</h2>
      <p class="playground-subtitle">Test DSL expressions against your real data</p>
    </div>

    <div class="playground-layout">
      <div class="playground-editor">
        <div class="playground-input-area">
          <label>Filter Expression</label>
          <textarea id="playground-expr" rows="3" placeholder="messageLength < 30 AND messageLength > 0" spellcheck="false"></textarea>
          <div class="playground-controls">
            <select id="playground-scope">
              <option value="requests">Requests</option>
              <option value="sessions">Sessions</option>
            </select>
            <button class="btn-primary" id="playground-run">Run</button>
            <button class="btn-secondary" id="playground-nl">From Description...</button>
          </div>
          <div id="playground-error" class="playground-error" style="display:none"></div>
        </div>

        <div id="playground-results" class="playground-results">
          <div class="playground-empty">Write an expression and click Run to see results</div>
        </div>

        <div class="playground-save-area" id="playground-save-area" style="display:none">
          <button class="btn-primary" id="playground-save">Save as Rule</button>
        </div>
      </div>

      <div class="playground-reference">
        <div class="playground-ref-tabs">
          <button class="ref-tab active" data-tab="fields">Fields</button>
          <button class="ref-tab" data-tab="functions">Functions</button>
          <button class="ref-tab" data-tab="metrics">Metrics</button>
        </div>

        <div class="playground-ref-content" id="ref-fields">
          <input type="text" class="ref-search" id="ref-field-search" placeholder="Search fields..." />
          <div class="ref-list">
            ${fields.map((f2) => html2`
              <div class="ref-item" data-insert=${f2.name}>
                <span class="ref-name">${f2.name}</span>
                <span class="ref-type">${f2.type}</span>
                <span class="ref-scope">${f2.scope}</span>
                <span class="ref-desc">${f2.description}</span>
              </div>
            `)}
          </div>
        </div>

        <div class="playground-ref-content" id="ref-functions" style="display:none">
          ${funcGroups.map(([cat, fns]) => html2`
            <h4>${cat}</h4><div class="ref-list">
              ${fns.map((f2) => html2`
                <div class="ref-item" data-insert=${f2.name + "()"}>
                  <code class="ref-name">${f2.signature}</code>
                  <span class="ref-desc">${f2.description}</span>
                </div>
              `)}
            </div>
          `)}
        </div>

        <div class="playground-ref-content" id="ref-metrics" style="display:none">
          <div class="ref-list">
            ${metrics.map((m2) => html2`
              <div class="ref-item" data-insert=${m2.filterExpr}>
                <span class="ref-name">${m2.id}</span>
                <span class="ref-desc">${m2.name} (${m2.scope})</span>
                <code class="ref-expr">${m2.filterExpr}</code>
              </div>
            `)}
          </div>
        </div>

      </div>
    </div>
  `, content);
    wirePlayground(content, filter);
  }
  function groupPlaygroundFunctions(functions) {
    const groups = /* @__PURE__ */ new Map();
    for (const f2 of functions) {
      const cat = f2.category || "utility";
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat).push(f2);
    }
    return [...groups.entries()];
  }
  function wirePlayground(content, filter) {
    const exprInput = content.querySelector("#playground-expr");
    const scopeSelect = content.querySelector("#playground-scope");
    const runBtn = content.querySelector("#playground-run");
    const nlBtn = content.querySelector("#playground-nl");
    const errorDiv = content.querySelector("#playground-error");
    const resultsDiv = content.querySelector("#playground-results");
    const saveArea = content.querySelector("#playground-save-area");
    const saveBtn = content.querySelector("#playground-save");
    let lastExpr = "";
    async function runExpression() {
      const expr = exprInput.value.trim();
      if (!expr) return;
      lastExpr = expr;
      errorDiv.style.display = "none";
      render(html2`<div class="loading-spinner"></div>`, resultsDiv);
      const result = await rpc("evaluateExpression", {
        expr,
        scope: scopeSelect.value,
        filter
      });
      if (result.error) {
        errorDiv.textContent = result.error;
        errorDiv.style.display = "";
        render(null, resultsDiv);
        saveArea.style.display = "none";
        return;
      }
      render(html2`
      <div class="playground-stats">
        <div class="stat-card"><div class="stat-value">${(result.matched ?? 0).toLocaleString()}</div><div class="stat-label">Matched</div></div>
        <div class="stat-card"><div class="stat-value">${(result.total ?? 0).toLocaleString()}</div><div class="stat-label">Total</div></div>
        <div class="stat-card"><div class="stat-value" style=${"color:" + ((result.ratio ?? 0) > 30 ? COLORS.red : COLORS.green)}>${result.ratio}%</div><div class="stat-label">Rate</div></div>
      </div>
      ${result.examples && result.examples.length > 0 ? html2`
        <h4>Sample Matches</h4>
        <div class="playground-examples">
          ${result.examples.map((ex) => html2`<div class="playground-example">${ex}</div>`)}
        </div>
      ` : null}
    `, resultsDiv);
      saveArea.style.display = "";
    }
    runBtn.addEventListener("click", () => {
      void runExpression();
    });
    exprInput.addEventListener("keydown", (e2) => {
      if (e2.key === "Enter" && (e2.metaKey || e2.ctrlKey)) {
        e2.preventDefault();
        void runExpression();
      }
    });
    nlBtn.addEventListener("click", () => {
      void (async () => {
        const prompt = window.prompt("Describe the pattern you want to detect:");
        if (!prompt) return;
        render(html2`<div class="loading-spinner"></div>`, resultsDiv);
        const result = await rpc("compileNlRule", {
          prompt,
          scope: scopeSelect.value
        });
        if (result.error) {
          errorDiv.textContent = result.error;
          errorDiv.style.display = "";
          return;
        }
        const filterMatch = result.markdown?.match(/# Filter\s*\n([\s\S]*?)(?=\n#|$)/);
        if (filterMatch) {
          exprInput.value = filterMatch[1].trim();
        }
        render(html2`
        <div class="playground-nl-result">
          <div class="nl-badge">${result.usedLlm ? "LLM Generated" : "Heuristic Template"}</div>
          ${result.notes && result.notes.length > 0 ? html2`<div class="nl-notes">${result.notes.join("\n")}</div>` : null}
          <pre class="nl-preview">${result.markdown || ""}</pre>
          <button class="btn-primary" id="nl-use">Use This Rule</button>
        </div>
      `, resultsDiv);
        content.querySelector("#nl-use")?.addEventListener("click", () => {
          void (async () => {
            if (!result.markdown) return;
            const saved = await rpc("saveRule", { markdown: result.markdown });
            if (saved.ok) {
              render(html2`<div class="playground-success">Rule saved. Switch to Rule Editor to view it.</div>`, resultsDiv);
            }
          })();
        });
      })();
    });
    saveBtn.addEventListener("click", () => {
      void (async () => {
        const compiled = await rpc("compileNlRule", {
          prompt: lastExpr,
          scope: scopeSelect.value
        });
        if (compiled.markdown) {
          let md = compiled.markdown;
          const filterMatch = md.match(/# Filter\s*\n[\s\S]*?(?=\n#|$)/);
          if (filterMatch) {
            md = md.replace(filterMatch[0], `# Filter
${lastExpr}`);
          }
          const saved = await rpc("saveRule", { markdown: md });
          if (saved.ok) {
            render(html2`<span class="playground-success">Rule saved.</span>`, saveArea);
          }
        }
      })();
    });
    for (const tab of content.querySelectorAll(".ref-tab")) {
      tab.addEventListener("click", () => {
        for (const t3 of content.querySelectorAll(".ref-tab")) t3.classList.remove("active");
        tab.classList.add("active");
        const tabName = tab.dataset.tab;
        for (const c2 of content.querySelectorAll(".playground-ref-content")) {
          c2.style.display = c2.id === `ref-${tabName}` ? "" : "none";
        }
      });
    }
    for (const item of content.querySelectorAll(".ref-item[data-insert]")) {
      item.addEventListener("click", () => {
        const insert = item.dataset.insert || "";
        const start = exprInput.selectionStart;
        const end = exprInput.selectionEnd;
        exprInput.value = exprInput.value.substring(0, start) + insert + exprInput.value.substring(end);
        exprInput.focus();
        exprInput.setSelectionRange(start + insert.length, start + insert.length);
      });
    }
    const fieldSearch = content.querySelector("#ref-field-search");
    if (fieldSearch) {
      fieldSearch.addEventListener("input", () => {
        const query = fieldSearch.value.toLowerCase();
        for (const el2 of content.querySelectorAll("#ref-fields .ref-item")) {
          const text = el2.textContent?.toLowerCase() || "";
          el2.style.display = text.includes(query) ? "" : "none";
        }
      });
    }
  }

  // src/webview/page-image-gallery.ts
  function scoreStory(s2, now) {
    let score = 0;
    score += Math.min(s2.totalImages * 5, 35);
    score += Math.min(s2.moments.length * 3, 20);
    if (s2.totalAiLoc > 100) score += 20;
    else if (s2.totalAiLoc > 20) score += 10;
    if (s2.moments.length > 0) {
      const ageDays = (now - s2.moments[0].timestamp) / 864e5;
      if (ageDays < 3) score += 35;
      else if (ageDays < 7) score += 25;
      else if (ageDays < 14) score += 12;
    }
    if (s2.editedFiles.length > 5) score += 10;
    if (s2.moments.length >= 3 && s2.totalImages >= 5) score += 15;
    return score;
  }
  function pickTopStories(stories, n3) {
    const now = Date.now();
    return [...stories].filter((s2) => s2.moments.length >= 2).map((s2) => ({ story: s2, score: scoreStory(s2, now) })).sort((a2, b2) => b2.score - a2.score).slice(0, n3).map((x2) => x2.story);
  }
  function rankMomentsForGallery(moments) {
    const now = Date.now();
    const bySession = /* @__PURE__ */ new Map();
    for (const m2 of moments) {
      const list = bySession.get(m2.sessionId) || [];
      list.push(m2);
      bySession.set(m2.sessionId, list);
    }
    const scored = [];
    for (const [, sessionMoments] of bySession) {
      const sz = sessionMoments.length;
      for (const m2 of sessionMoments) {
        let score = 0;
        if (sz >= 5) score += 30;
        else if (sz >= 3) score += 20;
        else if (sz >= 2) score += 10;
        const ageDays = (now - m2.timestamp) / 864e5;
        if (ageDays < 3) score += 25;
        else if (ageDays < 7) score += 18;
        else if (ageDays < 14) score += 10;
        else if (ageDays < 30) score += 5;
        if (m2.aiLoc > 50) score += 10;
        else if (m2.aiLoc > 0) score += 3;
        if (m2.promptExcerpt && m2.promptExcerpt.length > 30) score += 3;
        scored.push({ moment: m2, score });
      }
    }
    scored.sort((a2, b2) => b2.score - a2.score);
    return scored.map((x2) => x2.moment);
  }
  var IMAGE_TIME_RANGES = [
    { days: 7, label: "Last 7 days" },
    { days: 28, label: "Last 4 weeks" },
    { days: 90, label: "Last 3 months" },
    { days: 180, label: "Last 6 months" },
    { days: 0, label: "All time" }
  ];
  function rangeStartTimestamp(days, now = Date.now()) {
    return days <= 0 ? 0 : now - days * 864e5;
  }
  function filterMomentsByRange(moments, days, now = Date.now()) {
    const start = rangeStartTimestamp(days, now);
    return start === 0 ? moments : moments.filter((m2) => m2.timestamp >= start);
  }
  var activeRangeDays4 = 0;
  var PAGE_SIZE = 30;
  var IMAGE_PREFETCH_BATCH_SIZE = 8;
  async function renderImageGallery(container, currentFilter2) {
    renderImageGalleryLoading(container, "Finding coding moments...", 0, 0);
    const data = await rpc("getImageGallery", currentFilter2);
    if (!data || data.moments.length === 0) {
      render(html2`
      <div class="page-empty">
        <div class="page-empty-icon"><svg width="48" height="48" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" stroke-width="1" opacity="0.4"/><circle cx="5.5" cy="6.5" r="1.2" stroke="currentColor" stroke-width="0.8" opacity="0.4"/><path d="M2 11l3-3 2 2 4-4 3 3" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/></svg></div>
        <h2>No Coding Moments Yet</h2>
        <p class="text-muted">Start using screenshots and images in your AI coding sessions to see them here.</p>
      </div>`, container);
      return;
    }
    let galleryFilter = "all";
    let storyPlayerStory = null;
    let storyPlayerFrame = 0;
    let storyTimerId;
    let visibleCount = PAGE_SIZE;
    const imageCache = /* @__PURE__ */ new Map();
    const noImageSet = /* @__PURE__ */ new Set();
    const confirmedImageSet = /* @__PURE__ */ new Set();
    const workspacesWithImages = /* @__PURE__ */ new Set();
    let isDiscoveringImages = false;
    async function loadImages(sessionId, requestId) {
      if (imageCache.has(requestId)) return imageCache.get(requestId);
      try {
        const result = await rpc("getSessionImages", { sessionId, requestId });
        const images = result?.images || [];
        imageCache.set(requestId, images);
        if (images.length === 0) noImageSet.add(requestId);
        else confirmedImageSet.add(requestId);
        return images;
      } catch {
        imageCache.set(requestId, []);
        noImageSet.add(requestId);
        return [];
      }
    }
    async function loadAndRender(el2, sessionId, requestId) {
      const images = await loadImages(sessionId, requestId);
      if (el2.classList.contains("img-loaded")) return;
      el2.classList.add("img-loaded");
      if (images.length > 0) {
        const img = document.createElement("img");
        img.src = images[0];
        img.className = "img-card-img";
        img.alt = "Screenshot";
        el2.textContent = "";
        el2.appendChild(img);
      }
    }
    const rankedMoments = rankMomentsForGallery(data.moments);
    const storyBySession = /* @__PURE__ */ new Map();
    for (const s2 of data.stories) storyBySession.set(s2.sessionId, s2);
    function getConfirmedStories() {
      const start = rangeStartTimestamp(activeRangeDays4);
      return pickTopStories(data.stories, 8).map((s2) => {
        const moments = s2.moments.filter(
          (m2) => confirmedImageSet.has(m2.id) && (start === 0 || m2.timestamp >= start)
        );
        return { ...s2, moments, totalImages: moments.length };
      }).filter((s2) => s2.moments.length >= 2).slice(0, 5);
    }
    let cachedRangeDays = null;
    let cachedInRange = rankedMoments;
    function timeFilteredMoments() {
      if (cachedRangeDays === activeRangeDays4) return cachedInRange;
      cachedRangeDays = activeRangeDays4;
      cachedInRange = filterMomentsByRange(rankedMoments, activeRangeDays4);
      return cachedInRange;
    }
    function getFilterBase() {
      const base = timeFilteredMoments();
      return galleryFilter === "all" ? base : base.filter((m2) => m2.workspace === galleryFilter);
    }
    function hasUndiscoveredImages(base) {
      return base.some((m2) => !confirmedImageSet.has(m2.id) && !noImageSet.has(m2.id));
    }
    async function discoverImagesUntil(targetCount, showInitialLoading = false) {
      if (isDiscoveringImages) return;
      isDiscoveringImages = true;
      try {
        const base = getFilterBase();
        let checked = base.filter((m2) => confirmedImageSet.has(m2.id) || noImageSet.has(m2.id)).length;
        let confirmed = base.filter((m2) => confirmedImageSet.has(m2.id)).length;
        let cursor = 0;
        while (confirmed < targetCount) {
          const batch = [];
          while (cursor < base.length && batch.length < IMAGE_PREFETCH_BATCH_SIZE) {
            const moment = base[cursor++];
            if (!moment || confirmedImageSet.has(moment.id) || noImageSet.has(moment.id)) continue;
            batch.push(moment);
          }
          if (batch.length === 0) break;
          if (showInitialLoading) renderImageGalleryLoading(container, "Loading screenshots...", checked, base.length);
          await Promise.all(batch.map((m2) => loadImages(m2.sessionId, m2.id)));
          checked += batch.length;
          confirmed = base.filter((m2) => confirmedImageSet.has(m2.id)).length;
        }
      } finally {
        for (const m2 of rankedMoments) {
          if (confirmedImageSet.has(m2.id)) workspacesWithImages.add(m2.workspace);
        }
        isDiscoveringImages = false;
      }
    }
    function getFiltered() {
      return getFilterBase().filter((m2) => confirmedImageSet.has(m2.id)).slice(0, visibleCount);
    }
    function canLoadMore() {
      const base = getFilterBase();
      const confirmedCount = base.filter((m2) => confirmedImageSet.has(m2.id)).length;
      return confirmedCount > visibleCount || hasUndiscoveredImages(base);
    }
    function renderRangeBar() {
      const count = getFilterBase().length;
      return html2`
      <div class="cons-range-bar img-range-bar" id="img-range">
        ${IMAGE_TIME_RANGES.map((r2) => html2`
          <button class=${`cons-range-btn${activeRangeDays4 === r2.days ? " active" : ""}`}
                  onClick=${() => {
        if (activeRangeDays4 === r2.days) return;
        activeRangeDays4 = r2.days;
        visibleCount = PAGE_SIZE;
        void loadMoreAndRender(true);
      }}>${r2.label}</button>`)}
        <span class="img-range-count">${count} ${count === 1 ? "moment" : "moments"}</span>
      </div>`;
    }
    function rerenderPage() {
      const filtered = getFiltered();
      const inRange3 = timeFilteredMoments();
      const workspaces = [...new Set(inRange3.map((m2) => m2.workspace))];
      render(html2`
      <div class="img-gallery-page">
        ${renderHeader(data)}
        ${renderRangeBar()}
        ${renderStoryReels(getConfirmedStories(), (s2) => {
        openStoryPlayer(s2);
      })}
        ${renderWorkspaceFilter(workspaces, galleryFilter, inRange3, workspacesWithImages, (f2) => {
        galleryFilter = f2;
        visibleCount = PAGE_SIZE;
        void loadMoreAndRender(true);
      })}
        <div class="img-grid" id="img-grid">
          ${filtered.map((m2) => renderMomentCard(m2, (mm) => {
        const story = storyBySession.get(mm.sessionId);
        if (story) {
          const filtered2 = { ...story, moments: story.moments.filter((x2) => confirmedImageSet.has(x2.id)) };
          if (filtered2.moments.length >= 2) openStoryPlayer(filtered2);
        }
      }))}
        </div>
        ${inRange3.length === 0 ? html2`
          <div class="page-empty">
            <h2>No Coding Moments In This Range</h2>
            <p class="text-muted">No screenshots were captured in the selected time range. Try a wider range.</p>
          </div>` : filtered.length === 0 && !canLoadMore() ? html2`
          <div class="page-empty">
            <h2>No Loadable Images Found</h2>
            <p class="text-muted">These sessions referenced images, but the raw screenshots could not be loaded.</p>
          </div>` : null}
        ${canLoadMore() ? html2`<div class="img-load-more" id="img-sentinel"><div class="loading-spinner" style="margin:20px auto;"></div></div>` : null}
        ${storyPlayerStory ? renderStoryPlayer(storyPlayerStory, storyPlayerFrame) : null}
      </div>`, container);
      setupLazyImages(container, loadImages, noImageSet, workspacesWithImages, rankedMoments);
      if (storyPlayerStory) {
        const visual = container.querySelector(".img-story-player-visual.img-lazy:not(.img-loaded)");
        if (visual) {
          const sid = visual.dataset.sessionId || "";
          const rid = visual.dataset.requestId || "";
          if (sid && rid) void loadAndRender(visual, sid, rid);
        }
      }
      setupInfiniteScroll();
    }
    let scrollObserver = null;
    function setupInfiniteScroll() {
      if (scrollObserver) scrollObserver.disconnect();
      const sentinel = container.querySelector("#img-sentinel");
      if (!sentinel) return;
      scrollObserver = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting && canLoadMore()) {
          visibleCount += PAGE_SIZE;
          void loadMoreAndRender();
        }
      }, { rootMargin: "300px" });
      scrollObserver.observe(sentinel);
    }
    async function loadMoreAndRender(showLoading = false) {
      if (showLoading) renderImageGalleryLoading(container, "Loading screenshots...", 0, getFilterBase().length);
      await discoverImagesUntil(visibleCount, showLoading);
      rerenderPage();
    }
    function openStoryPlayer(story) {
      storyPlayerStory = story;
      storyPlayerFrame = 0;
      rerenderPage();
      startStoryTimer();
    }
    function closeStoryPlayer() {
      if (storyTimerId) clearTimeout(storyTimerId);
      storyPlayerStory = null;
      storyPlayerFrame = 0;
      rerenderPage();
    }
    function advanceStoryFrame(delta) {
      if (!storyPlayerStory) return;
      const next = storyPlayerFrame + delta;
      if (next < 0 || next >= storyPlayerStory.moments.length) {
        closeStoryPlayer();
        return;
      }
      storyPlayerFrame = next;
      if (storyTimerId) clearTimeout(storyTimerId);
      rerenderPage();
      startStoryTimer();
    }
    function startStoryTimer() {
      if (storyTimerId) clearTimeout(storyTimerId);
      storyTimerId = setTimeout(() => advanceStoryFrame(1), 5e3);
    }
    function renderStoryPlayer(story, frameIdx) {
      const moment = story.moments[frameIdx];
      if (!moment) return null;
      const hue2 = hashToHue(story.sessionId);
      return html2`
      <div class="img-story-overlay" onClick=${(e2) => {
        if (e2.target.classList.contains("img-story-overlay")) closeStoryPlayer();
      }}>
        <div class="img-story-player">
          <div class="img-story-progress">
            ${story.moments.map((_m, i2) => html2`
              <div class=${`img-story-progress-bar ${i2 < frameIdx ? "done" : ""} ${i2 === frameIdx ? "active" : ""}`}>
                <div class="img-story-progress-fill"></div>
              </div>
            `)}
          </div>
          <div class="img-story-player-header">
            <div class="img-story-player-avatar" style=${`background: linear-gradient(135deg, hsl(${hue2}, 50%, 35%), hsl(${hue2 + 40}, 40%, 25%));`}></div>
            <div class="img-story-player-info">
              <span class="img-story-player-name">${shortWorkspace(story.workspace)}</span>
              <span class="img-story-player-time">${formatDate3(moment.timestamp)}</span>
            </div>
            <button class="img-story-player-close" onClick=${() => closeStoryPlayer()}>\u00D7</button>
          </div>
          <div class="img-story-player-visual img-lazy" key=${moment.id} data-session-id=${moment.sessionId} data-request-id=${moment.id}
               style=${`background: linear-gradient(135deg, hsl(${hue2}, 40%, 12%), hsl(${hue2 + 30}, 30%, 8%));`}>
            <div class="img-lazy-placeholder">
              <span class="img-lazy-spinner"></span>
            </div>
          </div>
          <div class="img-story-tap-prev" onClick=${() => advanceStoryFrame(-1)}></div>
          <div class="img-story-tap-next" onClick=${() => advanceStoryFrame(1)}></div>
          <div class="img-story-player-caption">
            <span class="img-story-player-caption-text">${moment.promptExcerpt || ""}</span>
          </div>
        </div>
      </div>`;
    }
    await discoverImagesUntil(PAGE_SIZE, true);
    rerenderPage();
  }
  function renderImageGalleryLoading(container, label, checked, total) {
    const pct = total > 0 ? Math.min(100, Math.round(checked / total * 100)) : 0;
    render(html2`
    <div class="img-gallery-page">
      <div class="img-loading-screen">
        <div class="loading-spinner"></div>
        <h2>${label}</h2>
        <p class="text-muted">Preparing screenshots for the gallery.</p>
        ${total > 0 ? html2`
          <div class="progress-bar-track img-loading-progress">
            <div class="progress-bar-fill" style=${`width:${pct}%`}></div>
          </div>
          <div class="img-loading-count">${checked} / ${total} checked</div>
        ` : null}
      </div>
    </div>`, container);
  }
  function renderHeader(_data) {
    return html2`
    <div class="img-header">
      <h1>\uD83D\uDC95 Coding Moments</h1>
      <p class="img-header-slogan">Relive the screenshots that shaped your code</p>
    </div>`;
  }
  function renderStoryReels(stories, playStory) {
    if (stories.length === 0) return null;
    return html2`
    <div class="img-story-reels">
      ${stories.map((s2) => {
      const hue2 = hashToHue(s2.sessionId);
      return html2`
          <button class="img-reel-circle"
                  onClick=${() => playStory(s2)}
                  title=${`${shortWorkspace(s2.workspace)} - ${s2.totalImages} images`}>
            <div class="img-reel-ring" style=${`--ring-hue: ${hue2};`}>
              <div class="img-reel-avatar" style=${`background: linear-gradient(135deg, hsl(${hue2}, 50%, 30%), hsl(${hue2 + 40}, 40%, 20%));`}>
                <span class="img-reel-count">${s2.totalImages}</span>
              </div>
            </div>
            <span class="img-reel-label">${shortWorkspace(s2.workspace)}</span>
          </button>`;
    })}
    </div>`;
  }
  function renderWorkspaceFilter(workspaces, filter, allMoments, confirmedWorkspaces, setFilter) {
    const shown = confirmedWorkspaces.size > 0 ? workspaces.filter((ws) => confirmedWorkspaces.has(ws)) : workspaces;
    if (shown.length <= 1) return null;
    return html2`
    <div class="img-ws-filter">
      <button class=${`img-ws-pill ${filter === "all" ? "active" : ""}`}
              onClick=${() => setFilter("all")}>
        All <span class="img-ws-pill-count">${allMoments.length}</span>
      </button>
      ${shown.map((ws) => {
      const count = allMoments.filter((m2) => m2.workspace === ws).length;
      const hue2 = hashToHue(ws);
      return html2`
          <button class=${`img-ws-pill ${filter === ws ? "active" : ""}`}
                  onClick=${() => setFilter(ws)}>
            <span class="img-ws-pill-dot" style=${`background: hsl(${hue2}, 55%, 50%);`}></span>
            ${shortWorkspace(ws)} <span class="img-ws-pill-count">${count}</span>
          </button>`;
    })}
    </div>`;
  }
  function renderMomentCard(m2, onClick) {
    const hue2 = hashToHue(m2.id);
    return html2`
    <div class="img-card" data-request-id=${m2.id} tabindex="0"
         onClick=${() => onClick(m2)}
         onKeyDown=${(e2) => {
      if (e2.key === "Enter") onClick(m2);
    }}>
      <div class="img-card-visual img-lazy" data-session-id=${m2.sessionId} data-request-id=${m2.id}>
        <div class="img-lazy-placeholder" style=${`background: linear-gradient(135deg, hsl(${hue2}, 55%, 18%) 0%, hsl(${hue2 + 40}, 45%, 12%) 100%);`}>
          <span class="img-lazy-spinner"></span>
        </div>
      </div>
      <div class="img-card-overlay">
        <span class="img-card-overlay-ws">${shortWorkspace(m2.workspace)}</span>
      </div>
    </div>`;
  }
  function setupLazyImages(container, loadImages, noImageSet, workspacesWithImages, allMoments) {
    const lazyEls = container.querySelectorAll(".img-lazy:not(.img-loaded)");
    if (lazyEls.length === 0) return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el2 = entry.target;
        observer.unobserve(el2);
        const sessionId = el2.dataset.sessionId || "";
        const requestId = el2.dataset.requestId || "";
        if (!sessionId || !requestId) return;
        void loadImages(sessionId, requestId).then((images) => {
          el2.classList.add("img-loaded");
          if (images.length > 0) {
            const img = document.createElement("img");
            img.src = images[0];
            img.className = "img-card-img";
            img.alt = "Screenshot";
            img.loading = "lazy";
            el2.textContent = "";
            el2.appendChild(img);
            const m2 = allMoments.find((mm) => mm.id === requestId);
            if (m2) workspacesWithImages.add(m2.workspace);
          } else {
            noImageSet.add(requestId);
            const card = el2.closest(".img-card");
            if (card) card.style.display = "none";
          }
        });
      }
    }, { rootMargin: "400px" });
    for (const el2 of lazyEls) observer.observe(el2);
  }
  function shortWorkspace(ws) {
    if (!ws) return "Unknown";
    const parts = ws.replaceAll("\\", "/").split("/");
    return parts[parts.length - 1] || ws;
  }
  function formatDate3(ts) {
    if (!ts) return "";
    const d2 = new Date(ts);
    const month = d2.toLocaleString("en-US", { month: "short" });
    const day = d2.getDate();
    const time = d2.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    return `${month} ${day}, ${time}`;
  }
  function hashToHue(str) {
    let hash = 0;
    for (let i2 = 0; i2 < str.length; i2++) {
      hash = (hash << 5) - hash + str.charCodeAt(i2) | 0;
    }
    return Math.abs(hash) % 360;
  }

  // src/webview/app.ts
  function normalizePageForFeatureFlags(page) {
    if (!FF_TOKEN_REPORTING_ENABLED && page === "burndown") return "dashboard";
    return page;
  }
  if (!FF_TOKEN_REPORTING_ENABLED) {
    const burndownLink = document.querySelector('[data-page="burndown"]');
    burndownLink?.parentElement?.remove();
  }
  var currentPage = "dashboard";
  var currentFilter = {};
  var _dataIsReady = false;
  var matchedWorkspaceId;
  var lastSkippedFiles = 0;
  var lastSkippedLines = 0;
  var navHint;
  function setNavHint(hint) {
    navHint = hint;
  }
  function consumeNavHint() {
    const h3 = navHint;
    navHint = void 0;
    return h3;
  }
  function setBadge(id, value) {
    const el2 = document.getElementById(id);
    if (!el2) return;
    const text = typeof value === "number" ? value > 9999 ? `${(value / 1e3).toFixed(1)}k` : String(value) : value;
    el2.textContent = text;
    el2.classList.add("visible");
  }
  function updateNavBadge(id, value) {
    setBadge(id, value);
  }
  function refreshNavBadges(filter) {
    void rpc("getStats", filter).then((s2) => {
      setBadge("badge-sessions", s2.totalSessions);
    }).catch(() => {
    });
    void rpc("getAntiPatterns", filter).then((d2) => {
      setBadge("badge-antipatterns", d2.patterns.length);
    }).catch(() => {
    });
    void rpc("getCodeProduction", filter).then((d2) => {
      const loc = d2.summary.totalAiLoc;
      const label = loc >= 1e6 ? `${(loc / 1e6).toFixed(1)}M` : loc >= 1e3 ? `${(loc / 1e3).toFixed(loc >= 1e4 ? 0 : 1)}K` : String(loc);
      setBadge("badge-output", label);
    }).catch(() => {
    });
  }
  var PHASE_LABELS = [
    "Discovering log directories",
    "Checking cache",
    "Parsing session logs",
    "Scanning external harnesses",
    "Preparing analytics",
    "Ready"
  ];
  var loadStartTime = 0;
  var elapsedTimerId = 0;
  function setShellLoadingMode(isLoading) {
    const app = document.getElementById("app");
    if (!app) return;
    app.classList.toggle("loading-mode", isLoading);
  }
  function ensureLoadingUI() {
    const content = $("#content");
    if (!content) return;
    if (document.getElementById("load-progress-bar")) return;
    setShellLoadingMode(true);
    loadStartTime = Date.now();
    render(html2`
    <div class="loading-screen">
      <div class="loading-tile-bg" id="loading-tile-bg"></div>
      <div class="loading-tile-vignette"></div>
      <div class="loading-card-wrap">
        <div class="loading-status-card">
          <div class="loading-telemetry" id="loading-telemetry"></div>
          <div class="loading-status-head">
            <div class="loading-hero">
              <div class="loading-kicker">Building Activity Index</div>
              <div class="loading-title" id="loading-phase-title">${PHASE_LABELS[0]}</div>
              <div class="loading-phase-detail" id="loading-phase-detail">Preparing parser and workspace inventory.</div>
            </div>
            <div class="loading-meta">
              <span class="loading-pct" id="loading-pct">0%</span>
              <span class="loading-sessions" id="loading-sessions"></span>
              <span class="loading-elapsed" id="loading-elapsed"></span>
            </div>
          </div>
          <div class="progress-bar-track"><div class="progress-bar-fill" id="load-progress-bar"></div></div>
          <div class="loading-stats-ticker" id="loading-stats-ticker"></div>
          <div class="loading-body">
            <ul class="progress-checklist" id="progress-checklist">
              ${PHASE_LABELS.map((label, i2) => html2`<li class="progress-step" id=${"pstep-" + i2}><span class="step-icon">\u25CB</span> <span class="step-label">${label}</span></li>`)}
            </ul>
            <div class="loading-log" id="loading-log"><div class="loading-log-placeholder">Parser events will appear here as workspaces are scanned.</div></div>
          </div>
        </div>
      </div>
    </div>`, content);
    clearInterval(elapsedTimerId);
    elapsedTimerId = window.setInterval(() => {
      const el2 = document.getElementById("loading-elapsed");
      if (!el2) return;
      const sec = Math.round((Date.now() - loadStartTime) / 1e3);
      el2.textContent = sec > 0 ? `${sec}s` : "";
    }, 1e3);
  }
  function renderPageLater(page) {
    void renderPage(page);
  }
  function updateLoadingLog(phase, detail) {
    const log = document.getElementById("loading-log");
    if (!log) return;
    log.querySelector(".loading-log-placeholder")?.remove();
    const line = document.createElement("div");
    line.className = "log-line";
    if (detail.includes("Skipped ") || detail.includes("skipping in ")) line.classList.add("log-skip");
    else if (detail.match(/\(\d+\.\d+s\)/)) line.classList.add("log-slow");
    const now = /* @__PURE__ */ new Date();
    const ts = `${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
    line.textContent = `[${ts}] ${phase}${detail ? " \u2014 " + detail : ""}`;
    log.appendChild(line);
    while (log.children.length > 200) log.removeChild(log.firstChild);
    log.scrollTop = log.scrollHeight;
  }
  function updatePhaseChecklist(currentPhase) {
    for (let i2 = 0; i2 < PHASE_LABELS.length; i2++) {
      const stepEl = document.getElementById(`pstep-${i2}`);
      if (!stepEl) continue;
      const icon2 = stepEl.querySelector(".step-icon");
      if (!icon2) continue;
      if (i2 < currentPhase) {
        stepEl.className = "progress-step step-done";
        icon2.textContent = "\u2713";
      } else if (i2 === currentPhase) {
        stepEl.className = "progress-step step-active";
        icon2.textContent = "\u25B6";
      } else {
        stepEl.className = "progress-step";
        icon2.textContent = "\u25CB";
      }
    }
  }
  var STATS_TICKER_TEMPLATE = [
    `<span class="ticker-stat" id="ts-loc"><svg class="ticker-icon" viewBox="0 0 16 16" fill="none"><path d="M4 2h5l3 3v9H4V2z" stroke="currentColor" stroke-width="1.3"/><path d="M6 8h4M6 10.5h3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg><span class="ticker-value" id="tv-loc">0</span> lines generated</span>`,
    `<span class="ticker-stat" id="ts-tools"><svg class="ticker-icon" viewBox="0 0 16 16" fill="none"><path d="M10.3 2.5a2.2 2.2 0 0 0-3 3.1L3.5 9.4l-.9 3.1 3.1-.9 3.8-3.8a2.2 2.2 0 0 0 3.1-3l-1.6 1.6-1.1-1.1L11.5 3.7z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="ticker-value" id="tv-tools">0</span> tool calls</span>`,
    `<span class="ticker-stat" id="ts-images"><svg class="ticker-icon" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" stroke-width="1.2"/><circle cx="5.5" cy="6.5" r="1.2" stroke="currentColor" stroke-width="1"/><path d="M2 11l3-3 2 2 4-4 3 3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="ticker-value" id="tv-images">0</span> images analyzed</span>`,
    `<span class="ticker-stat" id="ts-files"><svg class="ticker-icon" viewBox="0 0 16 16" fill="none"><path d="M2 4.5A1.5 1.5 0 0 1 3.5 3H7l1 1.5h4.5A1.5 1.5 0 0 1 14 6v5.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 11.5V4.5z" stroke="currentColor" stroke-width="1.2"/></svg><span class="ticker-value" id="tv-files">0</span> files touched</span>`,
    `<span class="ticker-stat" id="ts-reqs"><svg class="ticker-icon" viewBox="0 0 16 16" fill="none"><path d="M3 3h10a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H5l-3 2.5V4a1 1 0 0 1 1-1z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg><span class="ticker-value" id="tv-reqs">0</span> prompts sent</span>`
  ].join("");
  function renderStatsTicker(msg) {
    const tickerEl = document.getElementById("loading-stats-ticker");
    if (!tickerEl || !msg.sessions || msg.sessions <= 0) return;
    if (!tickerEl.dataset.init) {
      tickerEl.dataset.init = "1";
      tickerEl.innerHTML = STATS_TICKER_TEMPLATE;
    }
    const locEl = document.getElementById("tv-loc");
    const toolsEl = document.getElementById("tv-tools");
    const imagesEl = document.getElementById("tv-images");
    const filesEl = document.getElementById("tv-files");
    const reqsEl = document.getElementById("tv-reqs");
    if (locEl && msg.linesOfCode) locEl.textContent = formatStatCount(msg.linesOfCode);
    if (toolsEl && msg.toolCalls) toolsEl.textContent = msg.toolCalls.toLocaleString();
    if (imagesEl && msg.imagesAnalyzed) imagesEl.textContent = msg.imagesAnalyzed.toLocaleString();
    if (filesEl && msg.filesEdited) filesEl.textContent = msg.filesEdited.toLocaleString();
    if (reqsEl && msg.requests) reqsEl.textContent = msg.requests.toLocaleString();
    document.getElementById("ts-loc")?.classList.toggle("ticker-hidden", !msg.linesOfCode);
    document.getElementById("ts-tools")?.classList.toggle("ticker-hidden", !msg.toolCalls);
    document.getElementById("ts-images")?.classList.toggle("ticker-hidden", !msg.imagesAnalyzed);
    document.getElementById("ts-files")?.classList.toggle("ticker-hidden", !msg.filesEdited);
    document.getElementById("ts-reqs")?.classList.toggle("ticker-hidden", !msg.requests);
  }
  function handleProgress(msg) {
    ensureLoadingUI();
    const phase = PHASE_LABELS[msg.phase] ?? `Phase ${msg.phase}`;
    const detail = msg.detail ?? "";
    if (msg.telemetry) updateTelemetry(msg.telemetry);
    if (msg.telemetry) {
      lastSkippedFiles = msg.telemetry.skippedFiles ?? lastSkippedFiles;
      lastSkippedLines = msg.telemetry.skippedLines ?? lastSkippedLines;
    }
    if (msg.workspacePlan) renderWorkspaceGrid(msg.workspacePlan);
    if (msg.workspaceDone) updateWorkspaceCell(msg.workspaceDone, msg.detail);
    const phaseTitleEl = document.getElementById("loading-phase-title");
    if (phaseTitleEl) phaseTitleEl.textContent = phase;
    const phaseDetailEl = document.getElementById("loading-phase-detail");
    if (phaseDetailEl) phaseDetailEl.textContent = detail || "Working through your workspace history.";
    const bar = document.getElementById("load-progress-bar");
    if (bar) bar.style.width = `${Math.min(100, msg.pct)}%`;
    const pctEl = document.getElementById("loading-pct");
    if (pctEl) pctEl.textContent = `${Math.min(100, msg.pct)}%`;
    const sessEl = document.getElementById("loading-sessions");
    if (sessEl && msg.sessions && msg.sessions > 0) {
      sessEl.textContent = `${msg.sessions.toLocaleString()} sessions`;
    }
    renderStatsTicker(msg);
    updateLoadingLog(phase, detail);
    updatePhaseChecklist(msg.phase);
  }
  function onDataReady(currentWorkspace, skipped) {
    _dataIsReady = true;
    if (skipped) {
      if (skipped.skippedFiles > 0) lastSkippedFiles = skipped.skippedFiles;
      if (skipped.skippedLines > 0) lastSkippedLines = skipped.skippedLines;
    }
    clearInterval(elapsedTimerId);
    setShellLoadingMode(false);
    void rpc("getWorkspaces").then((wss) => {
      wsOptions = wss;
      for (const ws of wss) {
        if (currentWorkspace && ws.name.toLowerCase().includes(currentWorkspace.toLowerCase())) {
          matchedWorkspaceId = ws.id;
          break;
        }
      }
      updateToggleState();
    }).catch(() => {
    });
    void rpc("getHarnesses").then((harnesses) => {
      if (!harnessFilter) return;
      harnessFilter.length = 1;
      for (const h3 of harnesses) {
        harnessFilter.add(new Option(h3, h3));
      }
    }).catch(() => {
    });
    void loadCapabilities().finally(() => {
      navigateTo(currentPage);
      refreshNavBadges(currentFilter);
      maybeShowSkippedBanner();
    });
  }
  function maybeShowSkippedBanner() {
    if (lastSkippedFiles <= 0) return;
    if (document.getElementById("skipped-banner")) return;
    const content = document.getElementById("content");
    const col = document.getElementById("content-col");
    if (!content || !col) return;
    const banner = buildSkippedBanner(lastSkippedFiles, lastSkippedLines, {
      onViewDetails: () => {
        void rpc("showOutput");
      }
    });
    col.insertBefore(banner, content);
  }
  initMessageListener(handleProgress, onDataReady);
  document.addEventListener("click", (e2) => {
    const target = e2.target;
    const link = target.closest("[data-page]");
    if (link) {
      e2.preventDefault();
      const hint = link.dataset.navHint;
      if (hint) setNavHint(hint);
      const page = link.dataset.page;
      if (page) navigateTo(page);
    }
  });
  function navigateTo(page) {
    page = normalizePageForFeatureFlags(page);
    if (!llmAvailable() && (page === "skills" || page === "level-up")) page = "dashboard";
    currentPage = page;
    for (const a2 of $$(".nav-links a")) a2.classList.toggle("active", a2.dataset.page === page);
    void renderPage(page);
  }
  var wsFilterHidden = document.getElementById("ws-filter");
  var wsFilterInput = document.getElementById("ws-filter-input");
  var wsFilterList = document.getElementById("ws-filter-list");
  var wsCombobox = document.getElementById("ws-combobox");
  var wsToggle = document.getElementById("ws-toggle");
  var harnessFilter = document.getElementById("harness-filter");
  var wsOptions = [];
  function updateToggleState() {
    if (!wsToggle) return;
    const btns = wsToggle.querySelectorAll(".ws-toggle-btn");
    for (const b2 of btns) b2.classList.remove("active");
    if (currentFilter.workspaceId && currentFilter.workspaceId === matchedWorkspaceId) {
      btns[0]?.classList.add("active");
    } else if (!currentFilter.workspaceId) {
      btns[1]?.classList.add("active");
    }
  }
  function setWsSelection(value, label) {
    if (wsFilterHidden) wsFilterHidden.value = value;
    if (wsFilterInput) wsFilterInput.value = value ? label : "";
    currentFilter.workspaceId = value || void 0;
    if (wsCombobox) wsCombobox.classList.remove("open");
    updateToggleState();
    renderPageLater(currentPage);
    refreshNavBadges(currentFilter);
  }
  function renderWsList(query) {
    if (!wsFilterList) return;
    const q2 = query.toLowerCase();
    const harnessScoped = currentFilter.harness ? wsOptions.filter((ws) => ws.harnesses?.includes(currentFilter.harness)) : wsOptions;
    const filtered = q2 ? harnessScoped.filter((ws) => ws.name.toLowerCase().includes(q2)) : harnessScoped;
    const show = filtered.slice(0, 100);
    const vnodes = [html2`<div class="combobox-item" data-value="">All Workspaces</div>`];
    if (!q2) {
      const recent = show.filter((ws) => ws.recent);
      const rest = show.filter((ws) => !ws.recent);
      if (recent.length > 0) {
        vnodes.push(html2`<div class="combobox-section-header">Recent</div>`);
        vnodes.push(...recent.map(
          (ws) => html2`<div class=${"combobox-item" + (ws.id === currentFilter.workspaceId ? " selected" : "")} data-value=${ws.id}>${ws.name}</div>`
        ));
        if (rest.length > 0) {
          vnodes.push(html2`<div class="combobox-section-header">All Workspaces</div>`);
        }
      }
      vnodes.push(...rest.map(
        (ws) => html2`<div class=${"combobox-item" + (ws.id === currentFilter.workspaceId ? " selected" : "")} data-value=${ws.id}>${ws.name}</div>`
      ));
    } else {
      vnodes.push(...show.map((ws) => {
        const label = highlightMatch(ws.name, q2);
        return html2`<div class=${"combobox-item" + (ws.id === currentFilter.workspaceId ? " selected" : "")} data-value=${ws.id}>${label}</div>`;
      }));
    }
    if (filtered.length > 100) {
      vnodes.push(html2`<div class="combobox-item" style="color:var(--text-muted);pointer-events:none;">${filtered.length - 100} more — keep typing to narrow</div>`);
    }
    render(html2`<span>${vnodes}</span>`, wsFilterList);
  }
  function highlightMatch(text, query) {
    const idx = text.toLowerCase().indexOf(query);
    if (idx < 0) return text;
    return [text.slice(0, idx), html2`<mark>${text.slice(idx, idx + query.length)}</mark>`, text.slice(idx + query.length)];
  }
  if (wsFilterInput && wsCombobox && wsFilterList) {
    wsFilterInput.addEventListener("focus", () => {
      renderWsList(wsFilterInput.value);
      wsCombobox.classList.add("open");
    });
    wsFilterInput.addEventListener("input", () => {
      renderWsList(wsFilterInput.value);
      wsCombobox.classList.add("open");
    });
    wsFilterList.addEventListener("click", (e2) => {
      const item = e2.target.closest(".combobox-item");
      if (!item || item.style.pointerEvents === "none") return;
      const val = item.dataset.value || "";
      const label = val ? wsOptions.find((w2) => w2.id === val)?.name || val : "";
      setWsSelection(val, label);
    });
    document.addEventListener("click", (e2) => {
      if (!wsCombobox.contains(e2.target)) {
        wsCombobox.classList.remove("open");
        if (currentFilter.workspaceId) {
          const ws = wsOptions.find((w2) => w2.id === currentFilter.workspaceId);
          if (ws) wsFilterInput.value = ws.name;
        } else {
          wsFilterInput.value = "";
        }
      }
    });
    wsFilterInput.addEventListener("keydown", (e2) => {
      if (e2.key === "Escape") {
        wsCombobox.classList.remove("open");
        wsFilterInput.blur();
      }
    });
  }
  if (wsToggle) {
    wsToggle.addEventListener("click", (e2) => {
      const btn = e2.target.closest(".ws-toggle-btn");
      if (!btn) return;
      if (btn.dataset.ws === "current" && matchedWorkspaceId) {
        const ws = wsOptions.find((w2) => w2.id === matchedWorkspaceId);
        setWsSelection(matchedWorkspaceId, ws?.name || matchedWorkspaceId);
      } else {
        setWsSelection("", "");
      }
    });
  }
  if (harnessFilter) {
    harnessFilter.addEventListener("change", () => {
      currentFilter.harness = harnessFilter.value || void 0;
      if (currentFilter.workspaceId && currentFilter.harness) {
        const ws = wsOptions.find((w2) => w2.id === currentFilter.workspaceId);
        if (ws && !ws.harnesses?.includes(currentFilter.harness)) {
          setWsSelection("", "");
        }
      }
      renderPageLater(currentPage);
      refreshNavBadges(currentFilter);
    });
  }
  function renderPage(page) {
    page = normalizePageForFeatureFlags(page);
    currentPage = page;
    const content = $("#content");
    unmount(content);
    content.textContent = "";
    render(html2`
    <div class="loading-screen">
      <div class="loading-spinner"></div>
      <div class="loading-text">Loading\u2026</div>
    </div>`, content);
    destroyCharts();
    switch (page) {
      case "dashboard":
        withErrorBoundary("Dashboard", content, () => renderDashboard(content, currentFilter));
        break;
      case "patterns":
        withErrorBoundary("Patterns", content, () => renderPatterns(content, currentFilter));
        break;
      case "output":
        withErrorBoundary("Output", content, () => renderOutput(content, currentFilter));
        break;
      case "burndown":
        withErrorBoundary("Burndown", content, () => renderBurndown(content, currentFilter));
        break;
      case "timeline":
        withErrorBoundary("Timeline", content, () => renderTimeline(content, currentFilter));
        break;
      case "anti-patterns":
        withErrorBoundary("Anti-Patterns", content, () => renderAntiPatterns(content, currentFilter));
        break;
      case "rule-editor":
        withErrorBoundary("Rule Editor", content, () => renderAntiPatterns(content, currentFilter));
        break;
      case "skills":
        withErrorBoundary("Skills", content, () => renderSkills(content, currentFilter));
        break;
      case "config-health":
        withErrorBoundary("Config Health", content, () => renderConfigHealth(content, currentFilter));
        break;
      case "level-up":
        withErrorBoundary("Level Up", content, () => renderLevelUp(content, currentFilter));
        break;
      case "data-explorer":
        withErrorBoundary("Data Explorer", content, () => renderDataExplorer(content, currentFilter));
        break;
      case "rule-playground":
        withErrorBoundary("Rule Playground", content, () => renderRulePlayground(content, currentFilter));
        break;
      case "image-gallery":
        withErrorBoundary("Image Gallery", content, () => renderImageGallery(content, currentFilter));
        break;
      default:
        render(html2`<p>Unknown page</p>`, content);
    }
  }
})();
/*! Bundled license information:

@kurkle/color/dist/color.esm.js:
  (*!
   * @kurkle/color v0.3.4
   * https://github.com/kurkle/color#readme
   * (c) 2024 Jukka Kurkela
   * Released under the MIT License
   *)

chart.js/dist/chunks/helpers.dataset.js:
chart.js/dist/chart.js:
chart.js/dist/helpers.js:
  (*!
   * Chart.js v4.5.1
   * https://www.chartjs.org
   * (c) 2025 Chart.js Contributors
   * Released under the MIT License
   *)

chartjs-chart-treemap/dist/chartjs-chart-treemap.esm.js:
  (*!
   * chartjs-chart-treemap v3.1.0
   * https://chartjs-chart-treemap.pages.dev/
   * (c) 2024 Jukka Kurkela
   * Released under the MIT license
   *)
*/
//# sourceMappingURL=app.js.map
