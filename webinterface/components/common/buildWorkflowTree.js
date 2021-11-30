
function parseWorkflows(wfArray,config,selectFunction,clickcallback){
//callback for getWorkflows, builds workflow selection tree
    var finalTreeObj = {
        source:[],
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
        select:selectFunction,
        click: function(event, data) {
           if (! data.node.folder){
                //a workflow was selected!
                if (localStorage.getItem("lastselectedworkflow")){
                    var tree = $("#"+config["dom_id"]).fancytree("getTree");
                    var n = localStorage.getItem("lastselectedworkflow");
                    
                    if (n && n != "undefined"){
                        //var node = tree.findAll(n)[0];
                        var node = tree.getNodeByKey(localStorage.getItem("lastselectedworkflow"));
                        if (node && node != "undefined" ){
                            node.setSelected(false);//de-select 
                        }
                    }
                    
                }
                clickcallback(data.node.title,data.node.data["wf_object"]);
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
                treeObj[folder].folder = true;
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
        var x = (a.folder ? "0" : "1") + a.title.toLowerCase(),                    
            y = (b.folder ? "0" : "1") + b.title.toLowerCase();                 
            return x === y ? 0 : x > y ? 1 : -1;
    };
    var node = $("#workflowtree").fancytree("getRootNode");
    node.sortChildren(cmp,true);
    

}