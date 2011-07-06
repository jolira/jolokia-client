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
array or such names (such as ``["JMImplementation", "Catalina"]``). The paramter
may also be ``undefined`` to retrieve information about all mbeans available
on the server.

The ``callback`` method takes one parameter. It is called when data was received
from the server. The data is return as a JavaScript object.

```
// lists all available attributes and operations
client.list(undefined, function(response){
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
``"ImplementationVersion"``).

The ``callback`` method takes one parameter. It is called when data was received
from the server. The data is return as a JavaScript object.

```
// read all attributes of "JMImplementation:type=MBeanServerDelegate"
client.read("JMImplementation:type=MBeanServerDelegate", undefined, function(response){
  console.log(util.inspect(response, true, 10));
});
// read the "ImplementationVersion" attribute of "JMImplementation:type=MBeanServerDelegate"
client.read("JMImplementation:type=MBeanServerDelegate", "ImplementationVersion", function(response){
  console.log(util.inspect(response, true, 10));
});
```

jmx4node
-----

There is also a jxm2node command line utility included to access JMX information.