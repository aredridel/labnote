#!/usr/bin/env node

var fs = require('fs');
var spawn = require('child_process').spawn;
var editor = process.env.EDITOR || 'vi';
var date = Date.now();

if (!process.argv[2]) {
    console.warn("use: " + process.argv.join(' ') + ' filename');
    return process.exit(1);
}
var file = process.argv[2];

var out = fs.createWriteStream(process.argv[2], {flags: 'a'});
out.on('finish', editFile);
out.end("\n# " + new Date().toLocaleString() + "\n\n");

function editFile() {
    var child = spawn(editor, /vi/.test(editor) ? [file, '+'] : [file], {
        stdio: 'inherit'
    });

    child.on('exit', function (e, code) {
        if (code > 0) {
            process.exit(1);
        }
    });
}
