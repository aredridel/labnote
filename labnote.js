#!/usr/bin/env node

var fs = require('fs');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var editor = process.env.EDITOR || 'vi';
var date = Date.now();
var async = require('async');
var iferr = require('iferr');

if (!process.argv[2]) {
    console.warn("use: " + process.argv.join(' ') + ' filename');
    return process.exit(1);
}
var file = process.argv[2];

var clean = false;

function checkIfClean(cb) {
    exec('git status --porcelain', function (err, stdout, stderr) {
        if (!stdout.length) {
            clean = true;
        }
    }).on('exit', handleExit(cb));
}

function addDateToFile(cb) {
    var out = fs.createWriteStream(file, {flags: 'a'});
    out.on('finish', cb);
    out.on('error', cb);
    out.end("\n# " + new Date().toLocaleString() + "\n\n");
}

function editFile(cb) {
    var child = spawn(editor, /vi/.test(editor) ? [file, '+'] : [file], {
        stdio: 'inherit'
    });

    child.on('exit', handleExit(cb));
}

function handleExit(cb) {
    return function (e, code) {
        cb(e ? e : code > 0 ? code : null);
    };
}

var stat;
function statBefore(cb) {
    fs.stat(file, iferr(cb, function (s) {
        stat = s;
        cb();
    }));
}

function commitIfCleanAndChanged(cb) {
    if (!clean) {
        console.warn("Repo was not clean before adding note; not committing");
        return cb();
    } else {
        fs.stat(file, iferr(cb, function (s) {
            if (Number(s.mtime) == Number(stat.mtime)) {
                console.warn("No changes made.");
                exec('git checkout "' + file + '"').on('exit', handleExit(cb));
            } else {
                exec('git commit -am "' + String(date) + '"').on('exit', handleExit(cb));
            }
        }));
    }
}

function push(cb) {
    exec('git push').on('exit', handleExit(cb));
}

function exit(err) {
    if (err) {
        process.exit(1);
    }
}

async.seq(checkIfClean, addDateToFile, statBefore, editFile, commitIfCleanAndChanged, push)(exit);
