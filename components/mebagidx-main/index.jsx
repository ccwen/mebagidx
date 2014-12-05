var bootstrap=Require("bootstrap"); 
var Fileinstaller=Require("fileinstaller");
var kde=Require('ksana-document').kde;  // Ksana Database Engine
var kse=Require('ksana-document').kse; // Ksana Search Engine (run at client side)
var Swipe=Require("swipe");

var Main = React.createClass({
  getInitialState: function() {
    return {results:[],db:null };
  },
  dbid:"mebagidx",
  swipetargets:[],
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
  fidialog:function() {
      this.setState({dialog:true});
  }, 

  syncToc:function(voff) {
    this.setState({goVoff:voff||this.filepage2vpos()});
    this.slideToc();
  },
  slideSearch:function() {
    $("body").scrollTop(0);
    if (this.refs.Swipe) this.refs.Swipe.swipe.slide(2);
  },
  slideToc:function() {
    $("body").scrollTop(0);
    if (this.refs.Swipe) this.refs.Swipe.swipe.slide(0);
  },
  slideText:function() {
    if (this.refs.Swipe) {
      $("body").scrollTop(0);
      this.refs.Swipe.swipe.slide(1);
    }
  },
  onSwipeStart:function(target) {
    if (target && this.swipable(target)) {
      this.swipetargets.push([target,target.style.background]);
      target.style.background="yellow";
    }
    if (this.swipetimer) clearTimeout(this.swipetimer);
    var that=this;
    this.swipetimer=setTimeout(function(){
      if(!that.swipetargets.length) return;
      that.swipetargets.map(function(t){
        t[0].style.background=t[1];
      });
      that.swipetargets=[];
    },3000);
  },
  swipable:function(target) {
    while (target && target.dataset && 
      typeof target.dataset.n=="undefined" && typeof target.dataset.vpos=="undefined" ) {
      target=target.parentNode;
    }
    if (target && target.dataset) return true;
  },
  onSwipeEnd:function(target) {
    if (this.swipetargets.length) {
      this.swipetargets[0][0].style.background=this.swipetargets[0][1];
      this.swipetargets.shift();
    }
  },
  onTransitionEnd:function(index,slide,target) {
    if (!this.tryResultItem(index,target)) this.tryTocNode(index,target);
  },
  renderShowtext:function(text,pagename) {
    var ShowTextComponent=Require("defaultshowtext");
    if (this.showTextComponent) {
      ShowTextComponent=this.showTextComponent;
    }
    return <ShowTextComponent pagename={pagename} text={text}
      dictionaries={this.dictionaries}
      action={this.action}
      nextpage={this.nextpage} setpage={this.setPage} prevpage={this.prevpage} syncToc={this.syncToc}/>
  },
  renderMobile:function(text,pagename) {
     return (
      <div className="main">
        <Swipe ref="Swipe" continuous={true} 
               transitionEnd={this.onTransitionEnd} 
               swipeStart={this.onSwipeStart} swipeEnd={this.onSwipeEnd}>
        <div className="swipediv">
          
        </div>
        <div className="swipediv">                 
          
        </div>
        <div className="swipediv">
          
        </div>
        </Swipe>
      </div>
      );
  },
  componentDidUpdate:function() {
  	this.refs.tofind.getDOMNode().focus();
  },
  dosearch:function(wh) {
  	if (this.processing) return;
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
  	return <div>字:<input onInput={this.tofindChanged} ref="tofind"></input>
  	</div>
  },
  renderResultItem:function(r) {
  	var sources=this.state.db.get(["extra","sources"]);
  	return (
  		<tr>
  			<td>{this.state.resultnames[r[1]]}</td> 
  			<td>{sources[r[0]-1]}</td>
  			<td>{r[2]}</td>
  			<td>{r[3]}</td>
  		</tr>);
  },
  renderResults:function() {
  	if (!this.state.db)return;
  	
  	return <table className="table striped"><thead><tr><td>字</td><td>出處</td>
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
      /*
      if (ksanagap.platform=="chrome" || ksanagap.platform=="node-webkit") {
        return this.renderPC(text,pagename);
      } else {
        return this.renderMobile(text,pagename);
      }
      */
  	}
  } 
});

module.exports=Main;