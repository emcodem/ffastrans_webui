
function parseWorkflows(wfArray,config,selectFunction,clickcallback=function(){})
  {
//callback for getWorkflows, builds workflow selection tree
//config example: {"selectMode":2,"dom_id":"workflowtree","extensions":["filter","persist"],"selected":somenodeid} 
function _defaultClick (data){
        if( ! data.node.folder ){
            data.node.toggleSelected();
        }
}

    var finalTreeObj = {
        source:[],
        checkbox:true,
        selectMode: config.selectMode,
        extensions: config.extensions,
        quicksearch: true,
        filter: {
            autoExpand: true, // Expand all branches that contain matches while filtered
            fuzzy: false,      // Match single characters in order, e.g. 'fb' will match 'FooBar'
            hideExpandedCounter: true,  // Hide counter badge if parent is expanded
            hideExpanders: false,       // Hide expanders if all child nodes are hidden by filter
            highlight: true,   // Highlight matches by wrapping inside <mark> tags
            leavesOnly: false, // Match end nodes only
            nodata: true,      // Display a 'no data' status node if result is empty
            mode: "dimm"       // Grayout unmatched nodes (pass "hide" to remove unmatched node instead)
        },
        //debugLevel:4,
        select:selectFunction,
        click: function(event, data) {
            console.log(event.originalEvent);
            if(config.selectMode == 1 &&  (event.originalEvent.target.outerHTML.indexOf("title") != -1)){
                //workaround tree not selecting nodes on click in selectmode 1, works best with checkboxes
                data.node.setSelected(true) 
            }
           if (! data.node.folder){
                //treenode.node.toggleSelected();//in single selection mode, click must emit select
                //a workflow was selected!
                if (localStorage.getItem("lastselectedworkflow")){
                    var tree = $("#"+config["dom_id"]).fancytree("getTree");
                    var n = localStorage.getItem("lastselectedworkflow");
                    if (n && n != "undefined"){
                        //var node = tree.findAll(n)[0];
                        var node = tree.getNodeByKey(localStorage.getItem("lastselectedworkflow"));
                        //console.log("autoselecting ",)
                        if (node && node != "undefined" ){
                            node.setSelected(false);//de-select 
                        }
                    }
                    
                }
                clickcallback(data.node.title,data.node.data["wf_object"],data);
           }
        }
    };
    
//build fancytree showing all workflows

    //BUILD TREE
    var treeObj = {};
    //collect data for fancytree obj
    for (i=0;i<wfArray.length;i++){
        var folder = wfArray[i]["wf_folder"];
        if (folder == ""){
            //workflow in root of tree
            treeObj[wfArray[i]["wf_id"]] = {};
            treeObj[wfArray[i]["wf_id"]].title = wfArray[i]["wf_name"];
            treeObj[wfArray[i]["wf_id"]].key = wfArray[i]["wf_id"]; 
            treeObj[wfArray[i]["wf_id"]]["wf_object"] = wfArray[i];
        }else{
           
            if (treeObj[folder]){   //a workflow in a folder that already exists
                treeObj[folder].children.push({title:wfArray[i]["wf_name"],"key":wfArray[i]["wf_id"],"data":{wf_object:wfArray[i]}});
            }else{  //a workflow in a new folder 
                treeObj[folder] = {};
                treeObj[folder].title = folder;
                if (!folder)
                    var stop = 1
                treeObj[folder].folder = true;
                treeObj[folder].unselectable = true;
                treeObj[folder].children = [{title:wfArray[i]["wf_name"],"key":wfArray[i]["wf_id"],"data":{wf_object:wfArray[i]}}];//
            }
        }
       
    }
    
    //attach final treeObj items
    for (itm in treeObj){
        finalTreeObj.source.push(treeObj[itm]);
    }
    
    $("#"+config["dom_id"]).fancytree(finalTreeObj); //finally render tree on page
    var cmp= function(a, b) {//sort by folder name but folders first
        try{
        var x = (a.folder ? "0" : "1") + a.title.toLowerCase(),                    
            y = (b.folder ? "0" : "1") + b.title.toLowerCase();                 
            return x === y ? 0 : x > y ? 1 : -1;
        }catch(ex){
            return 1;
        }
    };
    var node = $("#"+config["dom_id"]).fancytree("getRootNode");
    node.sortChildren(cmp,true);
    if (config["selected"]){
        var tree = $("#"+config["dom_id"]).fancytree("getTree");
        var node = tree.getNodeByKey(config["selected"]);
        node.setSelected(true);
        clickcallback(node["data"]["wf_name"],node["data"]["wf_obj"],{"node":node});
    } 
    
}


function parseProcessors(nodeArray,config,selectFunction,clickcallback=function(){}){
//builds tree of node array as found in workflow 
//config example: {"selectMode":2,"dom_id":"workflowtree","extensions":["filter","persist"],"startprocs_only":true,"selected":somenodeid,"icon_path":"../images/"}
    
    var finalTreeObj = {
        source:[],
        selectMode: config.selectMode,
        extensions: config.extensions,
        quicksearch: true,
        checkbox:true,
        filter: {
            autoExpand: true, // Expand all branches that contain matches while filtered
            fuzzy: false,      // Match single characters in order, e.g. 'fb' will match 'FooBar'
            hideExpandedCounter: true,  // Hide counter badge if parent is expanded
            hideExpanders: false,       // Hide expanders if all child nodes are hidden by filter
            highlight: true,   // Highlight matches by wrapping inside <mark> tags
            leavesOnly: false, // Match end nodes only
            nodata: true,      // Display a 'no data' status node if result is empty
            mode: "dimm"       // Grayout unmatched nodes (pass "hide" to remove unmatched node instead)
        },
        select:selectFunction,
        click: function(event, data) {
            console.log("OIDA",event.originalEvent.target.outerHTML.indexOf("title") != 0);
            if(config.selectMode == 1 &&  (event.originalEvent.target.outerHTML.indexOf("title") != -1) ){
                //TODO: make the IF work, need to check if click was title not checkbox.
                //workaround tree not selecting nodes on click in selectmode 1, works best with checkboxes
                data.node.setSelected(true) 
            }
            clickcallback(data.node.title,data.node.data["wf_object"],data);
            return true;
        }
    };
    
//build fancytree showing all workflows

    //BUILD TREE
    var treeObj = {};
    //collect data for fancytree obj
    for (var i=0;i<nodeArray.length;i++){
            //workflow in root of tree
            if (config["startprocs_only"] && !nodeArray[i]["start_proc"]){
                continue;
            }
            treeObj[nodeArray[i]["id"]] = {};
            treeObj[nodeArray[i]["id"]].title = nodeArray[i]["name"];
            treeObj[nodeArray[i]["id"]].key = nodeArray[i]["id"]; 
            treeObj[nodeArray[i]["id"]]["full_object"] = nodeArray[i];

            if (config["icon_path"]){
                treeObj[nodeArray[i]["id"]].icon = config["icon_path"] + "/tree_leaf_startproc.png";
            }
    }
    
    //attach final treeObj items
    for (itm in treeObj){
        finalTreeObj.source.push(treeObj[itm]);
    }
    
    $("#"+config["dom_id"]).fancytree(finalTreeObj); //finally render tree on page
    
    var cmp= function(a, b) {//sort by folder name but folders first
        var x = (a.folder ? "0" : "1") + a.title.toLowerCase(),                    
            y = (b.folder ? "0" : "1") + b.title.toLowerCase();                 
            return x === y ? 0 : x > y ? 1 : -1;
    };
    var node = $("#"+config["dom_id"]).fancytree("getRootNode");
    node.sortChildren(cmp,true);

    if (config["selected"]){
        //select default node
        
        var tree = $("#"+config["dom_id"]).fancytree("getTree");
        tree.selectAll(false)
        var node = tree.getNodeByKey(config["selected"]);
        if (node){
            console.log("SETSELECTED")
            node.setSelected(true,{"noEvents":false});
            clickcallback(node["data"]["name"],node["data"]["full_object"],{"node":node});
        }
        
    } 

}