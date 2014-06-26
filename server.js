#!/bin/env node

var express  = require('express');
var fs       = require('fs');
var mongoose = require('mongoose');

mongoose.connect(process.env.OPENSHIFT_MONGODB_DB_URL);

var Notification = mongoose.model('Notification', { time: String, text: String });

var SampleApp = function() {
    var self = this;

    self.setupVariables = function() {
        self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
        self.port      = process.env.OPENSHIFT_NODEJS_PORT || 8080;
    };

    self.terminator = function(sig){
        if (typeof sig === "string") {
           console.log('%s: Received %s - terminating sample app ...', Date(Date.now()), sig);
           process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()) );
    };

    self.setupTerminationHandlers = function(){
        process.on('exit', function() { self.terminator(); });
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
         'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function(element, index, array) {
            process.on(element, function() { self.terminator(element); });
        });
    };

    self.initializeServer = function() {
        self.index = fs.readFileSync('index.html');
        console.log(self.index);
        self.app = express();
        self.app.get('/', function(req, res) {
            res.setHeader('Content-Type', 'text/html');
            res.send(self.index);
        });
        self.app.get('/notifications', function(req, res) {
            res.setHeader('Content-Type', 'text/html');
            Notification.find().lean().exec(function(err, notifications) {
                res.end(JSON.stringify(notifications));
            });
        });
    };

    self.initialize = function() {
        self.setupVariables();
        self.setupTerminationHandlers();
        self.initializeServer();
    };

    self.start = function() {
        self.app.listen(self.port, self.ipaddress, function() {
            console.log('%s: Node server started on %s:%d ...', Date(Date.now() ), self.ipaddress, self.port);
        });
    };

};



var sample = new SampleApp();
sample.initialize();
sample.start();

