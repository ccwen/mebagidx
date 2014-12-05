var fs=require("fs");
var tei=require("ksana-document").tei;

var lst=fs.readFileSync(process.argv[2]||"mebagidx.lst",'utf8')
	      .replace(/\r\n/g,"\n").split("\n");

var finalized=function(session) {
	console.log("VPOS",session.vpos);
	console.log("FINISHED");
}
var warning=function() {
	console.log.apply(console,arguments);
}
var do_head=function(text,tag,attributes,status) {
	var level=parseInt(tag[2]);
	return [
		{path:["head_depth"], value:level }
		,{path:["head"], value:text  }
		,{path:["head_voff"], value: status.vpos }
	];
}

var captureTags={
	"h1":do_head,
	"h2":do_head,
	"h3":do_head,
	"h4":do_head,
	"h5":do_head,
	"h6":do_head,
}
var afterbodyend=function(s,status) {
	var apps=tei(status.starttext+s,status.parsed,status.filename,config,status);
}

var onFile=function(fn) {
	console.log("indexing "+fn);
}
var getMebag=function() {
	var res=require("./master.json");
	return res;
}
var config={
	name:"mebagidx"
	,meta:{
		config:"simple1"	
	},
	extra:  getMebag()
	,glob:lst
	,pageSeparator:"a.n"
	,format:"TEI-P5"
//	,bodystart: "<body>"
//	,bodyend : "</body>"
	,reset:true
//	,setupHandlers:setupHandlers
	,finalized:finalized
//	,finalizeField:finalizeField
	,warning:warning
	,captureTags:captureTags
	,callbacks: {
		onFile:onFile
//		,beforebodystart:beforebodystart
		,afterbodyend:afterbodyend		
//		,beforeParseTag:beforeParseTag
	}
}
setTimeout(function(){ //this might load by gulpfile-app.js
	if (!config.gulp) {
		var kd=require("ksana-document");
		if (kd && kd.build) {
			kd.build();
		}
	}
},100)
module.exports=config;