var fs=require("fs");
//master.txt  UTF-8 without BOM , copy and paste from 引得市-資料庫new.xslx
var arr=fs.readFileSync("master.txt","utf8").replace(/\r?\n/g,"\n").split("\n");
var sourceid=0;
var sources={};
var fieldnames=["bookname","stroke","name","photo","b_photo","notes","number","h_page","hitu","IDS"];
var out=[],names=[];
var convert=function(line) {
	var fields=line.split("\t");
	var source=fields[0];
	var id=sources[source];
	if (!sources[source]) {
		sources[source]=++sourceid;
		id=sourceid;
	}
	names.push('"'+fields[2]+'"');
	data=[id,parseInt(fields[1],10),parseInt(fields[6],10),
		parseInt(fields[7],10)||0];
	out.push(JSON.stringify(data));
}
console.log("lines",arr.length);
arr.map(function(line){
	convert(line);
});
var masterout="{\n";
masterout+='"sources":[\n'+Object.keys(sources).map(
	function(r){return '"'+r+'"'}).join(",\n")+"]\n";
masterout+=',"names":[\n'+names.join(",\n")+"]\n";
masterout+=',"data":[\n'+out.join(",\n")+"]\n";
masterout+="}";
fs.writeFileSync("master.json",masterout,"utf8");