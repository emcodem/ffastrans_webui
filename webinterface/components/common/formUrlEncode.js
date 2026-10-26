function formUrlEncode(obj){
    //same output as $.ajax({data: obj}) in jQuery 3.x (jQuery.param plus %20 -> +), so fetch sends exactly what $.ajax sent.
    //server uses bodyParser.urlencoded({extended:true}): nested objects/arrays arrive as before,
    //all values arrive as strings, null/undefined as "" and empty arrays/objects are omitted
    var parts = [];
    function add(key, value){
        if (typeof value == "function")
            value = value();
        parts.push(encodeURIComponent(key) + "=" + encodeURIComponent(value == null ? "" : value));
    }
    function build(prefix, value){
        if (Array.isArray(value)){
            value.forEach(function(item, i){
                if (/\[\]$/.test(prefix)){
                    add(prefix, item);
                }else{
                    build(prefix + "[" + (typeof item == "object" && item != null ? i : "") + "]", item);
                }
            });
        }else if (value != null && typeof value == "object"){
            for (var name in value)
                build(prefix + "[" + name + "]", value[name]);
        }else{
            add(prefix, value);
        }
    }
    for (var key in obj)
        build(key, obj[key]);
    return parts.join("&").replace(/%20/g, "+");
}
