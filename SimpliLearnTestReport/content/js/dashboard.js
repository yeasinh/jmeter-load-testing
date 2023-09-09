/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 100.0, "KoPercent": 0.0};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.5545454545454546, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.0, 500, 1500, "Reviews"], "isController": false}, {"data": [0.55, 500, 1500, "Resources-2"], "isController": false}, {"data": [0.0, 500, 1500, "Reviews-2"], "isController": false}, {"data": [0.75, 500, 1500, "Resources-1"], "isController": false}, {"data": [1.0, 500, 1500, "Resources-0"], "isController": false}, {"data": [0.75, 500, 1500, "Reviews-1"], "isController": false}, {"data": [0.3, 500, 1500, "Resources"], "isController": false}, {"data": [1.0, 500, 1500, "Reviews-0"], "isController": false}, {"data": [0.3, 500, 1500, "Home"], "isController": false}, {"data": [1.0, 500, 1500, "Home-0"], "isController": false}, {"data": [0.45, 500, 1500, "Home-1"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 110, 0, 0.0, 3289.190909090909, 42, 23228, 865.0, 13817.200000000006, 16364.15, 23217.88, 3.8299502106472616, 1247.7781256528324, 0.6990747188468368], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["Reviews", 10, 0, 0.0, 15258.199999999997, 8847, 23228, 14274.0, 23195.3, 23228.0, 23228.0, 0.37963630841653695, 491.9891919322539, 0.14421730856839146], "isController": false}, {"data": ["Resources-2", 10, 0, 0.0, 865.4000000000001, 268, 2067, 662.0, 2006.8000000000002, 2067.0, 2067.0, 2.73224043715847, 606.7342789446722, 0.34953466530054644], "isController": false}, {"data": ["Reviews-2", 10, 0, 0.0, 14592.5, 7920, 23136, 13528.5, 22966.5, 23136.0, 23136.0, 0.39348390650822385, 509.43892576434246, 0.04956974994097741], "isController": false}, {"data": ["Resources-1", 10, 0, 0.0, 470.4, 44, 815, 521.5, 813.9, 815.0, 815.0, 5.458515283842795, 2.3587822393558953, 0.7036367358078602], "isController": false}, {"data": ["Resources-0", 10, 0, 0.0, 45.4, 42, 55, 43.0, 55.0, 55.0, 55.0, 5.63063063063063, 3.1837257179054053, 0.7258234797297297], "isController": false}, {"data": ["Reviews-1", 10, 0, 0.0, 510.1, 42, 1131, 464.0, 1126.5, 1131.0, 1131.0, 3.1635558367605188, 2.2055297967415375, 0.4016232995887377], "isController": false}, {"data": ["Resources", 10, 0, 0.0, 1381.8000000000002, 789, 2220, 1310.0, 2213.8, 2220.0, 2220.0, 2.5290844714213456, 564.143410944613, 0.975574576378351], "isController": false}, {"data": ["Reviews-0", 10, 0, 0.0, 155.1, 42, 329, 45.0, 328.9, 329.0, 329.0, 3.168567807351077, 1.7854136961343472, 0.4022595849176172], "isController": false}, {"data": ["Home", 10, 0, 0.0, 1451.7, 1006, 2745, 1363.5, 2629.0000000000005, 2745.0, 2745.0, 3.0571690614490983, 834.1814190996637, 0.728466065423418], "isController": false}, {"data": ["Home-0", 10, 0, 0.0, 129.4, 83, 337, 88.0, 321.50000000000006, 337.0, 337.0, 11.235955056179774, 6.24341643258427, 1.3386587078651686], "isController": false}, {"data": ["Home-1", 10, 0, 0.0, 1321.1, 918, 2408, 1275.0, 2309.9000000000005, 2408.0, 2408.0, 3.2393909944930352, 882.1026178328474, 0.38594306770327175], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": []}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 110, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
