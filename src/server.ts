#!/usr/bin/env node

import * as fs from "fs";
import { server as ws_server } from "websocket";
import * as http from "http";
import * as express from "express";

function watch(path: string, filter: (f: string) => boolean, callback: (f: string) => void) {
    const watcher = fs.watch("./", { recursive: false }, (event, filename) => {
        console.log(event, filename);
        if (filter(filename)) {
            callback(filename);
        }
    });
}

function launchWebsocket() {
    var server = http.createServer((req, res) => {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    });
    const wss = new ws_server({ httpServer: server, autoAcceptConnections: true });
    wss.on('connect', function (con) {
        watch("./", () => true, file => {
            con.send(file);
        });
    });

    server.listen(1999);
}

function launchServer() {
    var app = express();
    app.use(function (req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });

    var server = http.createServer(app);
    app.use("/ws", function (req, res) {
        res.send({ msg: "hello" });
    });

    app.get(/dist\/.*.js/, (req, res) => {
        res.type(".js");
        console.log("requesting " + req.path);
        fs.readFile("." + req.path, (err, data) => {
            if (err) { throw err; }
            res.write(data, () => res.end());
        });
    });

    app.get(['/index.html', '/'], (req, res) => {
        res.type(".html");
        fs.readFile(__dirname + "/index.html", (err, data) => {
            if (err) { throw err; }
            res.write(data, () => res.end());
        });
    });

    app.use('/', express.static("./"));

    launchWebsocket();
    server.listen(8080);
    console.log("listening on http://localhost:8080");
}

launchServer();
