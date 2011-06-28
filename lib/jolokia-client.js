/*
 * Copyright 2011 jolira
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at http://www.apache.org/licenses/LICENSE-2.0. Unless required by
 * applicable law or agreed to in writing, software distributed under the
 * License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS
 * OF ANY KIND, either express or implied. See the License for the specific
 * language governing permissions and limitations under the License.
 */

var util = require('util');
var http = require('http');
var url = require('url');

// Private
// ----------------------------------------------------------------------------

function extractEncoding(headers) {
    var type = headers["content-type"];

    if (!type) {
        return "utf8";
    }

    var split = type.split('=');

    return split.length == 2 ? split[1] : "utf8";
}

function getJSON(client, url, hostname, callback) {
    var request = client.request('GET', url, {
        host : hostname
    });

    request.end();
    request.on('response', function(response) {
        if (response.statusCode != 200) {
            throw "call failed with status code " + 200;
        }

        var endcoding = extractEncoding(response.headers);

        response.setEncoding(endcoding);

        var body = "";

        response.on('data', function(chunk) {
            body += chunk;
        });
        response.on('end', function() {
            callback(JSON.parse(body));
        });
    });
}

// Public
// ----------------------------------------------------------------------------

function client(target) {
    this.url = url.parse(target, false);

    if (this.url.protocol != "http:") {
        throw this.url.protocol + " currently not supported";
    }

    this.client = http.createClient(80, this.url.hostname);
}

client.prototype.list = function(mbean, callback) {
    var target = this.url.pathname + '/list';
    var parsedMBeanName = mbean ? mbean.split(':') : undefined;

    if (parsedMBeanName) {
        target += "/" + parsedMBeanName.join('/');
    }

    getJSON(this.client, target, this.url.hostname, function(response) {
        callback(response);
    });
};

// Exports
// ----------------------------------------------------------------------------

module.exports = client;
