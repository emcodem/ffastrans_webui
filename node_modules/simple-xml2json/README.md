##xml2json Node.js Library
Node.js based version of xml to json

### How to use：  
Installation：  
<pre>
$ npm install -g simple-xml2json
</pre>

Title：  
<pre>
var xml2json = require(&quot;simple-xml2json&quot;);
var xml      = &quot;&lt;xml&gt;hello&lt;/xml&gt;&quot;;
var json     = xml2json.parser( xml );
console.log( json.xml )
</pre>

Detailed usage：  
[http://www.thomasfrank.se/xml_to_json.html](http://www.thomasfrank.se/xml_to_json.html)

Test：  
<pre>
..\node_modules\node-xml2json\test\node test.js
</pre>

## Major changes:
* Support for CDATA
* Support of hyphens in the node names

## Contact：
* mayankdedhia@gmail.com

## Licensing：
Licensed under MIT
