var bootstrap=Require("bootstrap"); 
var Fileinstaller=Require("fileinstaller");
var kde=Require('ksana-document').kde;  // Ksana Database Engine
var kse=Require('ksana-document').kse; // Ksana Search Engine (run at client side)

var Main = React.createClass({
  getInitialState: function() {
    return {results:[],db:null };
  },
  dbid:"mebagidx",
  onReady:function(usage,quota) { 
    var head=this.tocTag||"head";
    if (!this.state.db) kde.open(this.dbid,function(db){
        this.setState({db:db});
        var preloadtags=[["extra","sources"],["extra","names"]];
        db.get([preloadtags],function() {
          var sources=db.get(["extra","sources"]);
          var names=db.get(["extra","names"]);
          this.setState({sources:sources,names:names});
       });
    },this);      
    this.setState({dialog:false,quota:quota,usage:usage});
  },
  getRequire_kdb:function() {//return an array of require db from ksana.js
    var required=[];
    ksana.js.files.map(function(f){
      if (f.indexOf(".kdb")==f.length-4) {
        var slash=f.lastIndexOf("/");
        if (slash>-1) {
          var dbid=f.substring(slash+1,f.length-4);
          required.push({url:f,dbid:dbid,filename:dbid+".kdb"});
        } else {
          var dbid=f.substring(0,f.length-4);
          required.push({url:ksana.js.baseurl+f,dbid:dbid,filename:f});
        }        
      }
    });
    return required;
  },
  openFileinstaller:function(autoclose) {
    var require_kdb=this.getRequire_kdb().map(function(db){
      return {
        url:window.location.origin+window.location.pathname+db.dbid+".kdb",
        dbdb:db.dbid,
        filename:db.filename
      }
    })
    return <Fileinstaller quota="512M" autoclose={autoclose} needed={require_kdb} 
                     onReady={this.onReady}/>
  },
  componentDidUpdate:function() {
  	if (this.refs.tofind) this.refs.tofind.getDOMNode().focus();
  },
  dosearch:function(wh) {
  	if (this.processing||!this.state.db) return;
  	this.processing=true;
  	var names=this.state.db.get(["extra","names"]);
  	var res=[];
  	for (var i=0;i<names.length;i++) {
  		if (names[i].indexOf(wh)>-1){
  			res.push(i);
  			if (res.length>200) break;
		}
  	}
  	var paths=[],resultnames=[];
  	res.map(function(r){paths.push(["extra","data",r]);});
  	var that=this;
  	this.state.db.get(paths,function(data){
  		that.processing=false;
  		if (!data || !data.length)return;
  		data.map(function(d,idx){
  			resultnames.push(names[ res[idx]]);
  		})
  		that.setState({results:data,resultnames:resultnames});
  	});

  },
  tofindChanged:function(e) {
  	if (this.state.processing) return;
  	if (e.target.value) {
  		this.dosearch(e.target.value);  		
  	}
  },
  renderInputs:function() {
  	return <div>字:<input onInput={this.tofindChanged} className="tofind" ref="tofind"></input>
  	</div>
  },
  renderResultItem:function(r,idx) {
  	var sources=this.state.db.get(["extra","sources"]);
  	return (
  		<tr>
  			<td>{this.state.resultnames[idx]}</td> 
  			<td>{sources[r[0]-1]}</td>
  			<td>{r[2]}</td>
  			<td>{r[3]}</td>
  		</tr>);
  },
  renderResults:function() {
  	if (!this.state.db)return;
  	
  	return <table className="table striped results"><thead><tr><td>字</td><td>出處</td>
  	<td>頁碼</td><td>檢字表頁碼</td></tr>
  	</thead>
  		<tbody>{this.state.results.map(this.renderResultItem)}</tbody>
  		</table>;
  	;
  },
  renderLogo:function() {
  	return <h2>引得市</h2>
  },
  renderMainUI:function() {
	return <div>
		{this.renderLogo()}
		{this.renderInputs()}
		{this.renderResults()}
	</div>
  },
  renderPC:function(text,pagename) {
    return <div className="main">
        <div className="col-md-3">
          	{this.renderMainUI()}
        </div>
        <div className="col-md-4">
            
        </div>
        <div className="col-md-5">
            
        </div>
      </div>
  },
  render: function() {  //main render routine
    if (!this.state.quota) { // install required db
        return this.openFileinstaller(true);
    } else {
      var text="";
      var pagename="";
      if (this.state.bodytext) {
        text=this.state.bodytext.text;
        pagename=this.state.bodytext.pagename;
      }
      return this.renderMainUI();
  	}
  } 
});

module.exports=Main;