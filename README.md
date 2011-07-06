Overview
========

A client for retrieving information from the JXM bridge provided by http://www.jolokia.org/.

Usage
-----

Currently, only a subset of commands is supported. Please Please file a case
at https://github.com/jolira/jolokia-client/issues if you want a particular command
to be added.

### Create a new client

```
var jolokia = require("jolokia-client");
var util = require('util'); // used by the examples below

var client = new jolokia("http://my.server.com/jolokia");
```

### List the available mbeans

#### client.list(mbeans, callback)

``mbeans`` is a string that identifies one particular mbean or domain name (such
as ``"JMImplementation"`` or ``"JMImplementation:type=MBeanServerDelegate"``) or an
array or such names (such as ``\["JMImplementation", "Catalina"\]``). The paramter
may also omitted to retrieve information about all mbeans available
on the server.

The ``callback`` method takes one parameter. It is called when data was received
from the server. The data is return as a JavaScript object.

```
// lists all available attributes and operations
client.list(function(response){
  console.log(util.inspect(response, true, 10));
});
// lists available attributes and operations for all JMImplementation mbeans
client.list("JMImplementation", function(response){
  console.log(util.inspect(response, true, 10));
});
// lists available attributes and operations for the JMImplementation:type=MBeanServerDelegate mbean
client.list("JMImplementation:type=MBeanServerDelegate", function(response){
  console.log(util.inspect(response, true, 10));
});
// lists available attributes and operations for all JMImplementation and Catalina mbeans
client.list(["JMImplementation", "Catalina"], function(response){
  console.log(util.inspect(response, true, 10));
});
```

### Read mbean attribute values

#### client.read(mbean, attribute, callback)

``mbean`` is a string that identifies one particular (qualified) mbean (such
``"JMImplementation:type=MBeanServerDelegate"``)

``atrribute`` is a string that identifies one particular attribute (such as
``"ImplementationVersion"``). This parameter may be omitted to return all attributes
of an mbean.

The ``callback`` method takes one parameter. It is called when data was received
from the server. The data is return as a JavaScript object.

```
// read all attributes of "JMImplementation:type=MBeanServerDelegate"
client.read("JMImplementation:type=MBeanServerDelegate", function(response){
  console.log(util.inspect(response, true, 10));
});
// read the "ImplementationVersion" attribute of "JMImplementation:type=MBeanServerDelegate"
client.read("JMImplementation:type=MBeanServerDelegate", "ImplementationVersion", function(response){
  console.log(util.inspect(response, true, 10));
});
```

jmx4node
--------

There is also a jxm2node command line utility included to access JMX information.

### Usage: ``jxm2node <url> <command> \[params\]``

The utility must be invoked with a valid <url>, such as ``http://my.server.com/jolokia``.
Also, a command must be provided. Valid commands are documented below.

#### ``list [<mbean>]``

Describe all mbeans for the given server. If no parameter is passed, all available  mbeans
of the server are part of the output.

Examples are:

```
jmx4node http://my.server.com/jolokia list
jmx4node http://my.server.com/jolokia list JMImplementation
jmx4node http://my.server.com/jolokia list JMImplementation:type=MBeanServerDelegate
```

#### ``read <mbean> [<attribute>]``

Read the attributes of  all mbeans for the given server. If no <attribute> parameter is passed, all 
available attributes of the mbean are part of the output.

Examples are:

```
jmx4node http://my.server.com/jolokia read JMImplementation:type=MBeanServerDelegate
jmx4node http://my.server.com/jolokia read JMImplementation ImplementationVersion:
```

#### ``dump [<mbean>]``

Read all the values of an <mbean>, if a bean is provide, or all the values on the server otherwise

Examples are:

```
jmx4node http://my.server.com/jolokia dump
jmx4node http://my.server.com/jolokia dump JMImplementation
jmx4node http://my.server.com/jolokia dump JMImplementation:type=MBeanServerDelegate
```
