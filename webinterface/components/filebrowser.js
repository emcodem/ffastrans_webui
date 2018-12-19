<html>
<head>
<script src="../dependencies/dhtmlx/dhtmlx.js"></script>
<link rel="stylesheet" href="../dependencies/dhtmlx/dhtmlx.css" type="text/css"> 
<script src="../dependencies/dhtmlx/vault/vault.js"></script>
<link rel="stylesheet" href="../dependencies/dhtmlx/vault/vault.css" type="text/css"> 
<script src="../dependencies/jquery/jquery.js"></script>
<script src="../configuration/staticStrings.js"></script>

<style>
    /* it's important to set width/height to 100% for full-screen init */
    html, body {
        width: 100%;
        height: 100%;
        margin: 0px;
        overflow: hidden;
    }
</style>

<script>

/* GLOBALS */
var m_mainLayout,m_mainForm,m_subForm,m_fileForm,m_fileGrid,m_workflowArray;
var m_realUploadpath = "";

/* build basic page layout and init periodic job loading*/
function init(){
    //load config data from server
    getRealUploadPath();

    //main layout
    m_mainLayout = new dhtmlXLayoutObject({
        parent: document.body,  
        pattern: "2U"           
    });
    m_mainLayout.cells("a").setText("Uploads");
    m_mainLayout.cells("a").setWidth(200)
    m_mainLayout.cells("b").setText("Job Configuration");
    var headerMenu = m_mainLayout.cells("b").attachMenu({                                               
            items:[
                {id:"submit", text:"<b>Start Workflow</b>"},
                 {id:"add", text:"Add Source"},
                 {id:"remove", text:"Remove Source"},
                 
            ]
        });
    
    m_mainLayout.cells("a").attachHTMLString("<div id='vault')/>");
    var vault = new dhx.Vault('vault', {
        uploader:{ 
            target:"/backend/upload" //dhtmlx_vault_server
       }
    });

    //workflow forms
    m_mainLayout.cells("b").attachHTMLString('<div id="fileform" style="width:100%;height:200px;"></div><div id="mainform" style="width:100%;height:150px;"></div><div id="subform" style="width:100%;height:400px;"></div>');

    
    m_mainForm  = new dhtmlXForm("mainform");
    m_mainForm.addItem(null, {type: "label", label: "Workflow"},0);
    m_subForm  = new dhtmlXForm("subform");
    m_fileForm  = new dhtmlXForm("fileform");
    
    m_fileForm.addItem(null, {type: "label", label: "Source Files"},0);
    m_fileForm.addItem(null,     {
                                    type:"container", 
                                    name:"fileGrid", 
                                    label:"", 
                                    inputWidth:330, 
                                    inputHeight:160
                                }   ,1);
    
    m_fileGrid = new dhtmlXGridObject(m_fileForm.getContainer("fileGrid"));
    m_fileGrid.setImagePath("dependencies/dhtmlx/imgs");                 
    m_fileGrid.setHeader("Source,Path");//the headers of columns  
    m_fileGrid.setInitWidthsP("20,80");          //the widths of columns  
    m_fileGrid.setColAlign("left,left");       //the alignment of columns   
    m_fileGrid.setColTypes("ro,ed");                //the types of columns  
    m_fileGrid.setColSorting("str,str");          //the sorting types    
    m_fileGrid.init();      //finishes initialization and renders the grid on the page 
    
    //EVENTS
    //workflow and start proc selected event
    m_mainForm.attachEvent("onChange", function (name, value, state){
            if (name == 'wf_name'){
                on_workflowSelected(value);
            }
            if (name == 'start_proc'){
                on_processorSelected(value);
            }
    });
    
    //file uploaded event
    vault.events.on("UploadComplete", function(files){
        for (i=0;i<files.length;i++){
            var newId = (new Date()).valueOf();
            m_fileGrid.addRow(newId,["Upload",files[i].name]);
            //m_fileForm.addItem(null,{type: "input", value: files[i].name, label: "Uploaded: ", offsetLeft:20 },1);
        }
    });
    
    //file add remove event
    headerMenu.attachEvent("onClick", function(id, zoneId, cas){
            if (id == "add") {
                var box = dhtmlx.modalbox({
                    title:"New File",
                    text: "Enter a Full Path (e.g. UNC) as seen by FFAStrans Server...<br/><input class='inform' type='text'>",
                    buttons:["OK",  "Cancel"],
                    callback: function(result){
                        if (result == 0){
                            var inputs = box.getElementsByTagName("input");
                            var newId = (new Date()).valueOf();
                            m_fileGrid.addRow(newId,["Manual",inputs[0].value]);
                        }
                    }
                });
            }
            if (id == "remove") {
                if (!m_fileGrid.getSelectedRowId()){
                    dhtmlx.alert("Please select a File to delete");
                }
                m_fileGrid.deleteSelectedRows();
            }
            if (id=="submit"){
                startJobs();
            }
         
    });
    
    
    //MAIN 
    //load workflow list from API
    m_mainLayout.cells("b").progressOn();
    getWorkflows();
}

function getRealUploadPath(){
//request data fom server and set global var
    $.ajax({
        url:  "/getfulluploadpath",
        type: "GET",
        crossDomain: true,
        success: function (response) {
           m_realUploadpath = response;
        },
        error: function (xhr, status) {
            dhtmlx.message("ERROR, could not GET getfulluploadpath, contact developer");
        }
    });
    

}

function on_processorSelected(index){
    m_subForm.unload();
    m_subForm = null;
    m_subForm  = new dhtmlXForm("subform");
    m_subForm.addItem(null, {type: "label", label: "User Variables"},0);
   
     
    //called from onChange function of Form
    //populates variables and start  button
    //this.getUserData();
    var wf_index = m_mainForm.getSelect("wf_name").selectedIndex;
    var selectedWorkflow = m_workflowArray[wf_index];
    var selectedProcDropdown = m_mainForm.getInput("start_proc");
    var selectedWfDropdown = m_mainForm.getInput("wf_name");
    
    //due to unknown reason (maybe bug), we have to ask STATIC_GET_WORKFLOWS_URL for workflow variables. The details we already have don't contain the user_vars
    /*for (i=0;i<selectedWorkflow.user_variables.length;i++){
        m_mainForm.addItem(null, {type: "text", name: "user_var"+i, label: "Start Processor:"}, "1"+i)
    }*/
    
    //workaround load user_variables from workflow api call
    $.ajax({
        url:  buildUrl(STATIC_GET_WORKFLOWS_URL + "/" + selectedWorkflow.wf_id),
        type: "GET",
        crossDomain: true,
        dataType: "json",
        success: function (response) {
            if (response['workflows'].length == 0){
                alert("ERROR, contact developer. Did not get Information for workflow " + selectedWorkflow.wf_id);
            }else{
                //ok, we have the workflow info, populate user variables and start btn
                if (!("variables" in response.workflows[0])){
                    dhtmlx.message("This Workflow has no Uservariables")
                }
                for (i=0;i<response.workflows[0].variables.length;i++){
                    //add uservariables inputs
                    var current_var = response.workflows[0].variables[i];
                    var desc = current_var.description  == "" ? current_var.name : current_var.description;
                    m_subForm.addItem(current_var.name, {type: "input", name: current_var.name, label: current_var.name, tooltip:desc, offsetLeft:20 }, "100"+i);
                }
            }
        },
        error: function (xhr, status) {
            dhtmlx.message("ERROR getting workflows, possibly FFASTRANS API is offline. ");
        }
    });
    
}

function on_workflowSelected(index){
    //called from onChange function of Form
    //populates start processor list
    m_mainForm.removeItem("start_proc");
    
    var wfArray = m_workflowArray;
    var options=[];
    //variable.start_procs[]
    for (i=0;i<wfArray[index].variable.start_procs.length;i++){
        var proc = wfArray[index].variable.start_procs[i];
        var proc_name = wfArray[index][proc].properties.custom_node_name ||  proc; 
        options.push({text:proc_name,value:proc});
    }
    
    var itemData = {type: "select",name: "start_proc", label: "Start Processor:", options: options,  offsetLeft:10};   
    m_mainForm.addItem(null, itemData, 2);
    on_processorSelected(0);                                           //auto select first processor
    
}

function parseWorkflows(wfArray){
//callback for getWorkflows
    m_mainLayout.cells("b").progressOff();
    //m_mainForm.setUserData("workflow","array",wfArray);         //store the workflow array in form userdata for later access
    
    //fill drowdowns
    var options = [];
    for (i=0;i<wfArray.length;i++){
        var itm = {userdata:wfArray[i],text:wfArray[i].general.wf_name,value:i};//value is item index for later accessing the wfarray stored in form userdata (in onChange event)
        options.push(itm);
    }
    var itemData = {type: "select", name: "wf_name", label: "Workflow Name:", options: options , offsetLeft:10};   
    m_mainForm.addItem(null, itemData, 1);
    on_workflowSelected(0);
}

function getWorkflows(){

    $.ajax({
        url:  buildUrl(STATIC_GET_WORKFLOW_DETAILS_URL),
        type: "GET",
        crossDomain: true,
        dataType: "json",
        success: function (response) {
            if (response['workflows/details'].length == 0){
                alert("Did not get any workflows from FFASTRANS API");
            }else{
                m_workflowArray = response['workflows/details'];
                parseWorkflows(m_workflowArray);
            }
        },
        error: function (xhr, status) {
            dhtmlx.message("ERROR getting workflows, possibly FFASTRANS API is offline. ");
        }
    });
}

function startJobs(){
//kick off one workflow per file in grid

    m_fileGrid.forEachRow(function(id){
        var source = m_fileGrid.cells(id,0).getValue();
        var _filepath = (m_fileGrid.cells(id,1).getValue());
        if (source == "Upload"){
            _filepath = m_realUploadpath + _filepath;
        }
        
         var postBody = {}; //the JSON STructure for start job api
         var wf_index = m_mainForm.getSelect("wf_name").selectedIndex;
         var selectedWorkflow = m_workflowArray[wf_index];
         postBody.wf_id = selectedWorkflow.wf_id;
         var selectedStartProc = m_mainForm.getSelect("start_proc").selectedOptions[0].value;
         postBody.start_proc = selectedStartProc;
         postBody.inputfile = _filepath;
         postBody.variables = [];
         m_subForm.forEachItem(function(name){
            if (m_subForm.getItemValue(name)){
                postBody.variables.push({"name":name,"content":m_subForm.getItemValue(name)});
            }
        });
         console.log(postBody);
         $.ajax({
            url:  buildUrl(STATIC_START_JOB_URL),
            type: "POST",
            crossDomain: true,
            //dataType: "json",
            data: JSON.stringify(postBody),
            success: function (response) {
                dhtmlx.message(_filepath + " was submitted")
            },
            error: function (xhr, status) {
                dhtmlx.message("Error submitting workflow " + status);
            }
        });
    
    });

}

function buildUrl(what){
    var _url = "http://" + STATIC_API_HOST + ":" + STATIC_API_PORT + what;
    return  _url;
}
</script>

</head>
<body onload="init()">

</body>