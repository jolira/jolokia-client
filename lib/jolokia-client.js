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

function requestJSON(url, content, callback) {
    var client = url.protocol == 'https:' ? https : http;
    var path = url.pathname;

    if (url.search) {
        path += url.search;
    }

    var request = client.request({
        method : "POST",
        host : url.hostname,
        port : url.port,
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

    content["config"] = {
        "maxObjects" : 100000,
        "maxCollectionSize" : 10000,
        "ignoreErrors" : true,
        "maxDepth" : 100
    };
    var _json = JSON.stringify(content);

    request.on('error', function(response) {
        callback(undefined, response);
    });
    request.write(_json);
    request.end();
}

function doList(url, mbean, callback) {
    requestJSON(url, {
        "type" : "LIST",
        "path" : mbean
    }, function(response) {
        callback(response);
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
    this.url = url.parse(target, false);
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

    if (!_.isArray(mbean)) {
        requestJSON(this.url, {
            "type" : "read",
            "mbean" : mbean,
            "attribute" : attribute
        }, function(response) {
            callback(response);
        });
        return;
    }

    var content = [];

    for ( var idx in mbean) {
        var bean = mbean[idx];

        content[idx] = _.isString(bean) ? {
            "type" : "read",
            "mbean" : bean,
            "attribute" : attribute
        } : {
            "type" : "read",
            "mbean" : bean.mbean,
            "attribute" : bean.attribute ? bean.attribute : attribute
        };
    }

    requestJSON(this.url, content, function(response) {
        callback(response);
    });
};

Jolokia.prototype.dump = function(mbean, callback) {
    var self = this;

    this.list(mbean, function(json) {
        var mbeans = collectMBeans(json.value, [], mbean);

        self.read(mbeans, callback);
    });
};

Jolokia.prototype.exec = function(mbean, operation, arguments, callback) {
    //mbean can be an array of mbeans, same operation is taken for all mbeans, arguments is an array. Supply [] for no arguments.
    
    if (!_.isArray(mbean)) {
        requestJSON(this.url, {
            "type" : "exec",
            "mbean" : mbean,
            "operation" : operation,
            "arguments" : arguments
        }, function(response) {
            callback(response);
        });
        return;
    }

    var content = [];

    for ( var idx in mbean) {
        var bean = mbean[idx];

        content[idx] = _.isString(bean) ? {
            "type" : "exec",
            "mbean" : bean,
            "operation" : operation,
            "arguments" : arguments
        } : {
            "type" : "exec",
            "mbean" : bean.mbean,
            "operation" : operation,
            "arguments" : arguments
        };
    }

    requestJSON(this.url, content, function(response) {
        callback(response);
    });
};

// Exports
// ----------------------------------------------------------------------------

module.exports = Jolokia;
