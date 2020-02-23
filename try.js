function ExportToTable() {
    var regex = /^([a-zA-Z0-9\s_\\.\-:])+(.xlsx|.xls)$/;
    /*Checks whether the file is a valid excel file*/
    if (regex.test($("#excelfile").val().toLowerCase())) {
        var xlsxflag = false; /*Flag for checking whether excel is .xls format or .xlsx format*/
        if ($("#excelfile").val().toLowerCase().indexOf(".xlsx") > 0) {
            xlsxflag = true;
        }
        /*Checks whether the browser supports HTML5*/
        if (typeof (FileReader) != "undefined") {
            var reader = new FileReader();
            reader.onload = function (e) {
                var data = e.target.result;
                /*Converts the excel data in to object*/
                if (xlsxflag) {
                    var workbook = XLSX.read(data, {
                        type: 'binary'
                    });
                } else {
                    var workbook = XLS.read(data, {
                        type: 'binary'
                    });
                }
                /*Gets all the sheetnames of excel in to a variable*/
                var sheet_name_list = workbook.SheetNames;

                var cnt = 0; /*This is used for restricting the script to consider only first sheet of excel*/
                sheet_name_list.forEach(function (y) {
                    /*Iterate through all sheets*/
                    /*Convert the cell value to Json*/
                    if (xlsxflag) {
                        var exceljson = XLSX.utils.sheet_to_json(workbook.Sheets[y]);
                    } else {
                        var exceljson = XLS.utils.sheet_to_row_object_array(workbook.Sheets[y]);
                    }
                    if (exceljson.length > 0 && cnt == 0) {
                        BindTable(exceljson, '#exceltable');
                        cnt++;
                    }
                });
                $('#exceltable').show();
            }
            if (xlsxflag) {
                /*If excel file is .xlsx extension than creates a Array Buffer from excel*/
                reader.readAsArrayBuffer($("#excelfile")[0].files[0]);
            } else {
                reader.readAsBinaryString($("#excelfile")[0].files[0]);
            }
        } else {
            alert("Sorry! Your browser does not support HTML5!");
        }
    } else {
        alert("Please upload a valid Excel file!");
    }
}

function BindTable(jsondata, tableid) {
    /*Function used to convert the JSON array to Html Table*/
    dbType = document.getElementById("db_type");
    fetch('http://localhost:8080/getlabel' + dbType.value)
        .then(response => {
            return response.json()
        })
        .then(data => {
            let label = data["dataLabel"];
            console.log(data);
            var columns = BindTableHeader(label, jsondata, tableid); /*Gets all the column headings of Excel*/
            for (var i = 0; i < jsondata.length; i++) {
                var row$ = $('<tr/>');
                $(tableid).append(row$);
            }
        })
    // var columns = BindTableHeader(jsondata, tableid); /*Gets all the column headings of Excel*/  
    //  for (var i = 0; i < jsondata.length; i++) {  
    //      var row$ = $('<tr/>');  
    //      $(tableid).append(row$);  
    //  }  
}

function BindTableHeader(label, jsondata, tableid) {
    /*Function used to get all column names from JSON and bind the html table header*/
    var columnSet = [];
    var headerTr$ = $('<tr/>');
    var types = {};
    for (var i = 0; i < jsondata.length; i++) {
        var rowHash = jsondata[i];
        for (var key in rowHash) {
            if (rowHash.hasOwnProperty(key)) {
                if ($.inArray(key, columnSet) == -1) {
                    /*Adding each unique column names to a variable array*/
                    columnSet.push(key);
                    types[key] = {
                        "type": "",
                        "len": 0,
                        notnull: true
                    };
                    headerTr$.append($('<tr/>').html(key));
                }
            }
        }

    }
    console.log(types);

    // let dbType = document.getElementById("db_type");
    // let response = await fetch('http://localhost:8080/getLabel' + dbType.value);
    // let label = await response.json();
    // console.log(label);

    let reInt = new RegExp('^[0-9]+[\.]{0,1}[0-9]+$');
    let reDate = new RegExp('^[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2}$');
    let reBin = new RegExp('^[0-1]{1}$');
    for (var i = 0; i < jsondata.length; i++) {
        rowhash = jsondata[i];
        for (var j = 0; j < columnSet.length; j++) {
            if (rowhash[columnSet[j]] == undefined) {
                types[columnSet[j]].notnull = false;
                continue;
            }
            if (reBin.test(rowhash[columnSet[j]]) && (types[columnSet[j]].type == "bin" || types[columnSet[j]].type == "")) {
                types[columnSet[j]].type = "bin";
            } else if (reDate.test(rowhash[columnSet[j]]) && (types[columnSet[j]].type == "date" || types[columnSet[j]].type == "")) {
                types[columnSet[j]].type = "date";
            } else if (reInt.test(rowhash[columnSet[j]]) && (types[columnSet[j]].type == "int" || types[columnSet[j]].type == "")) {
                types[columnSet[j]].type = "int" ;
            } else {
                types[columnSet[j]].type = "varchar";
            }
            if (rowhash[columnSet[j]].length > types[columnSet[j]].len) {
                types[columnSet[j]].len = rowhash[columnSet[j]].length;
            }
        }
    }
    console.log(label)
    for(let item in types) {
        types[item].type = label[types[item].type];
        // console.log(label);
        //console.log(item.type);
    }
    $(tableid).append(headerTr$);
    let columnSet1 = [];
    if (!document.getElementById("FirstRow").checked) {
        for (var i = 0; i < columnSet.length; i++) {
            columnSet1.push("Column " + String(i + 1));
        }
    }
    var table_html = "<tr><th>Column_Name</th><th>Serial_No</th><th>Type</th><th>Length</th><th>Not_Null</th></tr>";
    for (var i = 0; i < columnSet.length; i++) {
        if (!document.getElementById("FirstRow").checked) {
            table_html = table_html + "<tr><td contenteditable='true' id='name" + String(i) + "'>" + columnSet1[i] + "</td><td contenteditable='true'>" + String(i + 1) + "</td><td contenteditable='true' id='type" + String(i) + "'>" + types[columnSet[i]].type + "</td><td contenteditable='true' id='length" + String(i) + "'>" + String(types[columnSet[i]].len + 1) + "</td><td contenteditable='true' id='not" + String(i) + "'>" + types[columnSet[i]].notnull + "</td></tr>";
        } else {
            table_html = table_html + "<tr><td contenteditable='true' id='name" + String(i) + "'>" + columnSet[i] + "</td><td contenteditable='true'>" + String(i + 1) + "</td><td contenteditable='true' id='type" + String(i) + "'>" + types[columnSet[i]].type + "</td><td contenteditable='true' id='length" + String(i) + "'>" + String(types[columnSet[i]].len + 1) + "</td><td contenteditable='true' id='not" + String(i) + "'>" + types[columnSet[i]].notnull + "</td></tr>";
        }
    }
    document.getElementById("datatable").innerHTML = table_html;
    document.getElementById("dataDiv").style.display = "block";
    columnData = columnSet;
    return columnSet;

};
let columnData = [];

function saveTable() {
    let data = {};
    console.log(columnData);
    for (var i = 0; i < columnData.length; i++) {
        data[columnData[i]] = {};
        data[columnData[i]]['name'] = document.getElementById("name" + String(i)).innerHTML;
        data[columnData[i]]['type'] = document.getElementById("type" + String(i)).innerHTML;
        data[columnData[i]]['length'] = document.getElementById("length" + String(i)).innerHTML;
        data[columnData[i]]['notNull'] = document.getElementById("not" + String(i)).innerHTML;
    }
    console.log(data);
}