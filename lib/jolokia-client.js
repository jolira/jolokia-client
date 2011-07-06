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
var _ = require("underscore");

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

function requestJSON(client, url, hostname, callback) {
    var request = client.request('GET', url, {
        host : hostname
    });

    request.end();
    request.on('response', function(response) {
        if (response.statusCode != 200) {
            throw "call failed with status code " + response.statusCode;
        }

        var body = "";
        var endcoding = extractEncoding(response.headers);

        response.setEncoding(endcoding);
        response.on('data', function(chunk) {
            body += chunk;
        });
        response.on('end', function() {
            var parsed = JSON.parse(body);

            callback(parsed);
        });
    });
}

function doList(client, url, mbean, callback) {
    var target = url.pathname + '/list';
    var parsedMBeanName = mbean ? mbean.split(':') : undefined;

    if (parsedMBeanName) {
        target += "/" + parsedMBeanName.join('/');
    }

    requestJSON(client, target, url.hostname, function(response) {
        callback(response);
    });
}

// Public
// ----------------------------------------------------------------------------

function client(target) {
    this.url = url.parse(target, false);

    if (this.url.protocol != "http:") {
        throw target + " is not a supported URL";
    }

    this.client = http.createClient(80, this.url.hostname);
}

client.prototype.list = function(mbeans, callback) {
    if (!_.isArray(mbeans)) {
        doList(this.client, this.url, mbeans, callback);
        return;
    }

    if (mbeans.length < 1) {
        doList(this.client, this.url, undefined, callback);
        return;
    }

    for (idx in mbeans) {
        doList(this.client, this.url, mbeans[idx], callback);
    }
};

client.prototype.read = function(mbean, attribute, callback) {
    var target = this.url.pathname + '/read/' + mbean;

    if (attribute) {
        target += "/" + attribute;
    }

    requestJSON(this.client, target, url.hostname, function(response) {
        callback(response);
    });
};
// Exports
// ----------------------------------------------------------------------------

module.exports = client;
