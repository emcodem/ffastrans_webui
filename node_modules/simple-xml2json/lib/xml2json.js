/*
xml2json v 1.1
copyright 2005-2007 Thomas Frank

This program is free software under the terms of the 
GNU General Public License version 2 as published by the Free 
Software Foundation. It is distributed without any warranty.
*/

exports.parser = function (xmlcode, ignoretags, debug) {
    if (!ignoretags) { ignoretags = "" }    ;
    xmlcode = xmlcode.replace(/\s*\/>/g, '/>');
    xmlcode = xmlcode.replace(/<\?[^>]*>/g, "");
    var pat = /<!\[CDATA\[.*?\]\]>/g;
    var result = pat.exec(xmlcode);
    while (result) {
        xmlcode = xmlcode.replace(result[0], result[0].substring(9, result[0].lastIndexOf(']]>')));
        pat.lastIndex = 0;
        result = pat.exec(xmlcode);
    }
    xmlcode = xmlcode.replace(/<\![^>]*>/g, "");
    if (!ignoretags.sort) { ignoretags = ignoretags.split(",") }    ;
    var x = exports.no_fast_endings(xmlcode);
    x = exports.attris_to_tags(x);
    x = escape(x);
    x = x.split("%3C").join("<").split("%3E").join(">").split("%3D").join("=").split("%22").join("\"");
    for (var i = 0; i < ignoretags.length; i++) {
        x = x.replace(new RegExp("<" + ignoretags[i] + ">", "g"), "*$**" + ignoretags[i] + "**$*");
        x = x.replace(new RegExp("</" + ignoretags[i] + ">", "g"), "*$***" + ignoretags[i] + "**$*")
    }    ;
    x = '<JSONTAGWRAPPER>' + x + '</JSONTAGWRAPPER>';
    exports.xmlobject = {};
    var y = exports.xml_to_object(x).jsontagwrapper;
    if (debug) { y = exports.show_json_structure(y, debug) }    ;
    return y
}

exports.xml_to_object = function (xmlcode) {
    var x = xmlcode.replace(/<\//g, "�");
    x = x.split("<");
    var y = [];
    var level = 0;
    var opentags = [];
    for (var i = 1; i < x.length; i++) {
        var tagname = x[i].split(">")[0];
        opentags.push(tagname);
        level++
        y.push(level + "<" + x[i].split("�")[0]);
        var currentX = x[i];
        var tagString = "�" + opentags[opentags.length - 1] + ">";
        while (currentX.indexOf(tagString) >= 0) {
            level--;
            opentags.pop();
            var index = currentX.indexOf(tagString) + tagString.length;
            currentX = currentX.substring(index);
            tagString = "�" + opentags[opentags.length - 1] + ">";
        }
    }    ;
    var oldniva = -1;
    var objname = "exports.xmlobject";
    for (var i = 0; i < y.length; i++) {
        var preeval = "";
        var niva = parseInt(y[i].split("<")[0], 10);
        var tagnamn = y[i].split("<")[1].split(">")[0];
        tagnamn = tagnamn.toLowerCase();
        var rest = y[i].split(">")[1];
        if (niva <= oldniva) {
            var tabort = oldniva - niva + 1;
            for (var j = 0; j < tabort; j++) { objname = objname.substring(0, objname.lastIndexOf('["')) }
        }        ;
        objname += '["' + tagnamn + '"]';
        var pobject = objname.substring(0, objname.lastIndexOf("["));
        if (eval("typeof " + pobject) != "object") { preeval += pobject + "={value:" + pobject + "};\n" }        ;
        var objlast = objname.substring(objname.lastIndexOf('["') + 2, objname.length - 2);
        var already = false;
        for (k in eval(pobject)) { if (k == objlast) { already = true } }        ;
        var onlywhites = true;
        for (var s = 0; s < rest.length; s += 3) {
            if (rest.charAt(s) != "%") { onlywhites = false }
        }        ;
        var nextNiva = Number.MAX_VALUE;
        if (i + 1 < y.length) {
            nextNiva = parseInt(y[i + 1].split("<")[0], 10);
        }
        if (rest != "" && (!onlywhites || nextNiva <= niva)) {
            if (rest / 1 != rest) {
                rest = "'" + rest.replace(/\'/g, "\\'") + "'";
                rest = rest.replace(/\*\$\*\*\*/g, "</");
                rest = rest.replace(/\*\$\*\*/g, "<");
                rest = rest.replace(/\*\*\$\*/g, ">")
            }
        } 
        else { rest = "{}" }        ;
        if (rest.charAt(0) == "'") { rest = 'unescape(' + rest + ')' }        ;
        if (already && !eval(objname + ".sort")) { preeval += objname + "=[" + objname + "];\n" }        ;
        var before = "="; after = "";
        if (already) { before = ".push("; after = ")" }        ;
        var toeval = preeval + objname + before + rest + after;
        eval(toeval);
        if (eval(objname + ".sort")) { objname += "[" + eval(objname + ".length-1") + "]" }        ;
        oldniva = niva
    }    ;
    return exports.xmlobject
}

exports.show_json_structure = function (obj, debug, l) {
    var x = '';
    if (obj.sort) { x += "[\n" } else { x += "{\n" }    ;
    for (var i in obj) {
        if (!obj.sort) { x += '"' + i + '":' }        ;
        if (typeof obj[i] == "object") {
            x += exports.show_json_structure(obj[i], false, 1)
        }
        else {
            if (typeof obj[i] == "function") {
                var v = obj[i] + "";
                //v=v.replace(/\t/g,"");
                x += v
            }
            else if (typeof obj[i] != "string") { x += obj[i] + ",\n" }
            else { x += "'" + obj[i].replace(/\'/g, "\\'").replace(/\n/g, "\\n").replace(/\t/g, "\\t").replace(/\r/g, "\\r") + "',\n" }
        }
    }    ;
    if (obj.sort) { x += "],\n" } else { x += "},\n" }    ;
    if (!l) {
        x = x.substring(0, x.lastIndexOf(","));
        x = x.replace(new RegExp(",\n}", "g"), "\n}");
        x = x.replace(new RegExp(",\n]", "g"), "\n]");
        var y = x.split("\n"); x = "";
        var lvl = 0;
        for (var i = 0; i < y.length; i++) {
            if (y[i].indexOf("}") >= 0 || y[i].indexOf("]") >= 0) { lvl-- }            ;
            tabs = ""; for (var j = 0; j < lvl; j++) { tabs += "\t" }            ;
            x += tabs + y[i] + "\n";
            if (y[i].indexOf("{") >= 0 || y[i].indexOf("[") >= 0) { lvl++ }
        }        ;
        if (debug == "html") {
            x = x.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            x = x.replace(/\n/g, "<BR>").replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;")
        }        ;
        if (debug == "compact") { x = x.replace(/\n/g, "").replace(/\t/g, "") }
    }    ;
    return x
}

exports.no_fast_endings = function (x) {
    x = x.split("/>");
    for (var i = 1; i < x.length; i++) {
        var t = x[i - 1].substring(x[i - 1].lastIndexOf("<") + 1).split(" ")[0];
        x[i] = "></" + t + ">" + x[i]
    }    ;
    x = x.join("");
    return x
}

exports.attris_to_tags = function (x) {
    var d = ' ="\''.split("");
    x = x.split(">");
    for (var i = 0; i < x.length; i++) {
        var temp = x[i].split("<");
        for (var r = 0; r < 4; r++) { temp[0] = temp[0].replace(new RegExp(d[r], "g"), "_jsonconvtemp" + r + "_") }        ;
        if (temp[1]) {
            temp[1] = temp[1].replace(/'/g, '"');
            temp[1] = temp[1].split('"');
            for (var j = 1; j < temp[1].length; j += 2) {
                for (var r = 0; r < 4; r++) { temp[1][j] = temp[1][j].replace(new RegExp(d[r], "g"), "_jsonconvtemp" + r + "_") }
            }            ;
            temp[1] = temp[1].join('"')
        }        ;
        x[i] = temp.join("<")
    }    ;
    x = x.join(">");
    x = x.replace(/ ([^=]*)=([^ |>]*)/g, "><$1>$2</$1");
    x = x.replace(/>"/g, ">").replace(/"</g, "<");
    for (var r = 0; r < 4; r++) { x = x.replace(new RegExp("_jsonconvtemp" + r + "_", "g"), d[r]) }    ;
    return x
}


if (!Array.prototype.push) {
    Array.prototype.push = function (x) {
        this[this.length] = x;
        return true
    }
};

if (!Array.prototype.pop) {
    Array.prototype.pop = function () {
        var response = this[this.length - 1];
        this.length--;
        return response
    }
};

