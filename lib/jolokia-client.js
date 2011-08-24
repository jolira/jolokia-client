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

var http = require('http');
var https = require('https');
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

function requestJSON(target, callback) {
    var parsed = url.parse(target, false);
    var client = parsed.protocol == 'https:' ? https : http;
    var path = parsed.pathname;

    if (parsed.search) {
        path += path.search;
    }

    var request = client.get({
        host : parsed.hostname,
        port : parsed.port,
        path : path
    }, function(response) {
        if (response.statusCode != 200) {
            callback(undefined, response);
            return;
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

    request.on('error', function(response) {
        callback(undefined, response);
    });
    request.end();
}

function doList(url, mbean, callback) {
    var target = url + '/list';
    var parsedMBeanName = mbean ? mbean.split(':') : undefined;

    if (parsedMBeanName) {
        target += "/" + parsedMBeanName.join('/');
    }

    requestJSON(target, function(response) {
        callback(response);
    });
}

function doDump(client, result, mbeans, callback) {
    if (_.isEmpty(mbeans)) {
        callback(result);
        return;
    }

    var mbean = _.first(mbeans);

    client.read(mbean, function(json) {
        result[mbean] = json;

        var rest = _.rest(mbeans);

        doDump(client, result, rest, callback);
    });
}

function collectMBeans(json, alreadyFound, scope) {
    var attr = json["attr"];

    if (attr) {
        alreadyFound.unshift(scope);

        return alreadyFound;
    }

    for ( var name in json) {
        if (name === "op" || name == "desc") {
            continue;
        }

        var _scope = scope ? scope + ":" + name : name;
        var _json = json[name];

        collectMBeans(_json, alreadyFound, _scope);
    }

    return alreadyFound;
}

// Public
// ----------------------------------------------------------------------------

function Jolokia(target) {
    this.url = target;
}

Jolokia.prototype.list = function(arg1, arg2) {
    var mbeans = arg2 ? arg1 : undefined;
    var callback = arg2 ? arg2 : arg1;

    if (!_.isArray(mbeans)) {
        doList(this.url, mbeans, callback);
        return;
    }

    if (mbeans.length < 1) {
        doList(this.url, undefined, callback);
        return;
    }

    var result = {};

    for ( var idx in mbeans) {
        var mbean = mbeans[idx];

        doList(this.url, mbean, function(mbean) {
            return function(json) {
                result[mbean] = json;

                var keys = _.keys(result);

                if (keys.length === mbeans.length) {
                    callback(result);
                }
            };
        }(mbean));
    }
};

Jolokia.prototype.read = function(mbean, arg2, arg3) {
    var attribute = arg3 ? arg2 : undefined;
    var callback = arg3 ? arg3 : arg2;
    var target = this.url + '/read/' + encodeURIComponent(mbean);

    if (attribute) {
        target += "/" + attribute;
    }

    requestJSON(target, function(response) {
        callback(response);
    });
};

Jolokia.prototype.dump = function(mbean, callback) {
    var self = this;

    this.list(mbean, function(json) {
        var mbeans = collectMBeans(json.value, [], mbean);

        doDump(self, {}, mbeans, callback);
    });
};

// Exports
// ----------------------------------------------------------------------------

module.exports = Jolokia;
