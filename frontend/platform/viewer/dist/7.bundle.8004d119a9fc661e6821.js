(window.webpackJsonp=window.webpackJsonp||[]).push([[7],{1388:function(e,t,n){"use strict";n.r(t);var r=n(19),s=n(0),o=n.n(s),a=n(22),i=n(1),u=n.n(i),c=n(1460),p=n.n(c),d=n(268),f=n(1435),l=n(1436),y=n(426);function v(e){return(v="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function I(e,t,n,r,s,o,a){try{var i=e[o](a),u=i.value}catch(e){return void n(e)}i.done?t(u):Promise.resolve(u).then(r,s)}function h(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}function b(e){return(b=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}function m(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}function w(e,t){return(w=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function U(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}var g=a.a.log,D=a.a.metadata,S=a.a.utils.studyMetadataManager,O=D.OHIFStudyMetadata,j=function(e){function t(){var e,n,r,s;!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,t);for(var o=arguments.length,a=new Array(o),i=0;i<o;i++)a[i]=arguments[i];return r=this,n=!(s=(e=b(t)).call.apply(e,[this].concat(a)))||"object"!==v(s)&&"function"!=typeof s?m(r):s,U(m(n),"state",{studies:null,server:null,studyInstanceUIDs:null,seriesInstanceUIDs:null,error:null,loading:!0}),n}var n,r,s,i,u;return function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&w(e,t)}(t,e),n=t,(r=[{key:"parseQueryAndRetrieveDICOMWebData",value:function(e){var t=this;return new Promise((function(n,r){var s=e.url;if(!s)return r(new Error("No URL was specified. Use ?url=$yourURL"));var o=new XMLHttpRequest;o.addEventListener("error",(function(e){g.warn("An error occurred while retrieving the JSON data"),r(e)})),o.addEventListener("load",(function(s){404===s.target.status&&r(new Error("No JSON data found")),o.responseText||(g.warn("Response was undefined"),r(new Error("Response was undefined"))),g.info(JSON.stringify(o.responseText,null,2));var i=JSON.parse(o.responseText);if(i.servers){e.studyInstanceUIDs||(g.warn("No study instance uids specified"),r(new Error("No study instance uids specified")));var u=i.servers.dicomWeb[0];u.type="dicomWeb",g.warn("Activating server",u),t.props.activateServer(u);var c=e.studyInstanceUIDs.split(";"),p=e.seriesInstanceUIDs?e.seriesInstanceUIDs.split(";"):[];n({server:u,studyInstanceUIDs:c,seriesInstanceUIDs:p})}else{var d,f,l=a.a.cornerstone.metadataProvider;i.studies.forEach((function(e){d=e.StudyInstanceUID,e.series.forEach((function(e){f=e.SeriesInstanceUID,e.instances.forEach((function(e){var t=e.url,n=e.metadata;l.addInstance(n),l.addImageIdToUIDs(t,{StudyInstanceUID:d,SeriesInstanceUID:f,SOPInstanceUID:n.SOPInstanceUID})}))}))})),n({studies:i.studies,studyInstanceUIDs:[]})}})),g.info("Sending Request to: ".concat(s)),o.open("GET",s),o.setRequestHeader("Accept","application/json"),o.send()}))}},{key:"componentDidMount",value:(i=regeneratorRuntime.mark((function e(){var t,n,r,s,o,a,i,u,c,d;return regeneratorRuntime.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.prev=0,t=(t=this.props.location.search).slice(1,t.length),n=p.a.parse(t),e.next=6,this.parseQueryAndRetrieveDICOMWebData(n);case 6:r=e.sent,s=r.server,o=r.studies,a=r.studyInstanceUIDs,i=r.seriesInstanceUIDs,o&&(u=R(o),c=u.studies,d=u.studyInstanceUIDs,o=c,a=d),this.setState({studies:o,server:s,studyInstanceUIDs:a,seriesInstanceUIDs:i,loading:!1}),e.next=18;break;case 15:e.prev=15,e.t0=e.catch(0),this.setState({error:e.t0.message,loading:!1});case 18:case"end":return e.stop()}}),e,this,[[0,15]])})),u=function(){var e=this,t=arguments;return new Promise((function(n,r){var s=i.apply(e,t);function o(e){I(s,n,r,o,a,"next",e)}function a(e){I(s,n,r,o,a,"throw",e)}o(void 0)}))},function(){return u.apply(this,arguments)})},{key:"render",value:function(){var e=this.state.error?"Error: ".concat(JSON.stringify(this.state.error)):"Loading...";return this.state.error||this.state.loading?o.a.createElement(y.a,{message:e,showGoBackButton:this.state.error}):this.state.studies?o.a.createElement(f.a,{studies:this.state.studies}):o.a.createElement(l.a,{studyInstanceUIDs:this.state.studyInstanceUIDs,seriesInstanceUIDs:this.state.seriesInstanceUIDs,server:this.state.server})}}])&&h(n.prototype,r),s&&h(n,s),t}(s.Component);U(j,"propTypes",{location:u.a.object,store:u.a.object,setServers:u.a.func});var R=function(e){S.purge();var t=new Set;return{studies:e.map((function(e){var n=new O(e,e.StudyInstanceUID),r=d.c.modules.sopClassHandlerModule;return e.displaySets=e.displaySets||n.createDisplaySets(r),S.add(n),t.add(e.StudyInstanceUID),e})),studyInstanceUIDs:Array.from(t)}},E=j,A=Object(r.b)(null,(function(e){return{activateServer:function(t){e({type:"ACTIVATE_SERVER",server:t})}}}))(E);t.default=A},1460:function(e,t,n){"use strict";t.decode=t.parse=n(1461),t.encode=t.stringify=n(1462)},1461:function(e,t,n){"use strict";function r(e,t){return Object.prototype.hasOwnProperty.call(e,t)}e.exports=function(e,t,n,o){t=t||"&",n=n||"=";var a={};if("string"!=typeof e||0===e.length)return a;var i=/\+/g;e=e.split(t);var u=1e3;o&&"number"==typeof o.maxKeys&&(u=o.maxKeys);var c=e.length;u>0&&c>u&&(c=u);for(var p=0;p<c;++p){var d,f,l,y,v=e[p].replace(i,"%20"),I=v.indexOf(n);I>=0?(d=v.substr(0,I),f=v.substr(I+1)):(d=v,f=""),l=decodeURIComponent(d),y=decodeURIComponent(f),r(a,l)?s(a[l])?a[l].push(y):a[l]=[a[l],y]:a[l]=y}return a};var s=Array.isArray||function(e){return"[object Array]"===Object.prototype.toString.call(e)}},1462:function(e,t,n){"use strict";var r=function(e){switch(typeof e){case"string":return e;case"boolean":return e?"true":"false";case"number":return isFinite(e)?e:"";default:return""}};e.exports=function(e,t,n,i){return t=t||"&",n=n||"=",null===e&&(e=void 0),"object"==typeof e?o(a(e),(function(a){var i=encodeURIComponent(r(a))+n;return s(e[a])?o(e[a],(function(e){return i+encodeURIComponent(r(e))})).join(t):i+encodeURIComponent(r(e[a]))})).join(t):i?encodeURIComponent(r(i))+n+encodeURIComponent(r(e)):""};var s=Array.isArray||function(e){return"[object Array]"===Object.prototype.toString.call(e)};function o(e,t){if(e.map)return e.map(t);for(var n=[],r=0;r<e.length;r++)n.push(t(e[r],r));return n}var a=Object.keys||function(e){var t=[];for(var n in e)Object.prototype.hasOwnProperty.call(e,n)&&t.push(n);return t}}}]);
//# sourceMappingURL=7.bundle.8004d119a9fc661e6821.js.map