"use strict";(self.webpackChunkmap_us=self.webpackChunkmap_us||[]).push([[563],{563:function(t,e,n){n.r(e);var r=n(37),a=n(791),o=n(514),s=n(173),i=n(90),c=n(873),u=n(828),l=n(54),d=n(287),f=n(476),h=n(47),v=n(71),m=n(184);e.default=function(t){var e=t.countyGeometry,n=t.stateGeometry,p=t.baseTopology,Z=t.stateFilter,y=t.handleMouseMove,g=t.handleMouseOut,b=t.handleMouseOver,w=t.setTooltipText,x=t.updateTranslations,k=(0,a.useRef)(),j=(0,a.useRef)(),C=function(t){var e=!(arguments.length>1&&void 0!==arguments[1])||arguments[1],n=t.attr("transform").match(/-?\d+(\.\d+)?/g),a=(0,r.Z)(n,2),o=a[0],s=a[1];if(Math.abs(+o)<.25&&Math.abs(+s)<.25){if(t.attr("transform","translate(0,0)"),M(t),e)return[0,0]}else if(e)return[+o,+s]},M=function(t){t.attr("stroke-width",.1).attr("stroke","lightgray").attr("fill","slategray").on(".drag",null).lower(),(0,i.Z)("#state-".concat(t.attr("state-id"))).lower()},T=(0,d.Z)().on("start",(function(){w(""),(0,i.Z)(this).raise(),(0,c.Z)(".county").attr("pointer-events","none")})).on("drag",(function(t){var e=t.dx,n=t.dy,r=(0,i.Z)(this).node().transform.baseVal[0].matrix,a=r.e,o=r.f;(0,i.Z)(this).attr("transform","translate(".concat(a+e,",").concat(o+n,")"))})).on("end",(function(t){x(t.subject.id,C((0,i.Z)(this))),(0,c.Z)(".county").attr("pointer-events","all")})),G=(0,d.Z)().on("start",(function(){w(""),(0,i.Z)(this).raise(),(0,c.Z)(".county").attr("pointer-events","none")})).on("drag",(function(t){var e=t.dx,n=t.dy,r=(0,i.Z)(this).node().transform.baseVal[0].matrix,a=r.e,o=r.f,s=r.a,c=r.d,u=j.current.instance.transformState.scale,l=a+e/s/u,d=o+n/c/u;(0,i.Z)(this).attr("transform","translate(".concat(l,",").concat(d,")"))})).on("end",(function(t){x(t.subject.id,C((0,i.Z)(this))),(0,c.Z)(".county").attr("pointer-events","all")}));return(0,a.useEffect)((function(){(0,i.Z)(k.current).selectAll("*").remove();var t=window.outerWidth,a=window.innerHeight,o={type:"GeometryCollection",geometries:e},c={type:"GeometryCollection",geometries:n},d=(0,u.Z)().translate([t/2,a/2]).scale(900),m=(0,l.Z)().projection(d),Z=(0,i.Z)(k.current).append("svg").attr("width",t).attr("height",a).attr("viewBox","0 0 ".concat(t," ").concat(a));Z.selectAll(".state").data((0,f.Z)(p,c).features).enter().append("path").attr("class","state").attr("d",m).attr("fill",(function(t){var e=t.id;return h.L[e].color})).attr("id",(function(t){var e=t.id;return"state-".concat(e)}));var w=Z.selectAll(".county").data((0,f.Z)(p,o).features).enter().append("path").attr("class","county").attr("d",m).attr("stroke",(function(t){var e=t.id;return h.L[(0,v.f)(e)].color})).attr("stroke-width",.15).attr("fill","lightgray").attr("id",(function(t){var e=t.id;return"county-".concat(e)})).attr("state-id",(function(t){var e=t.id;return"".concat((0,v.f)(e))})).attr("data-name",(function(t){var e=t.properties;return"".concat(e.name)})).attr("is-hidden",!1).attr("transform",(function(t){var e=(0,r.Z)(t.properties.transpose,2),n=e[0],a=e[1];return"translate(".concat(n,", ").concat(a,")")})).on("mouseover",(function(t,e){"false"===(0,i.Z)(this).attr("is-hidden")&&b(t,e)})).on("mousemove",(function(t){return y(t)})).on("mouseout",g),x="Chrome"===s.KC?T:G;w.call(x).each((function(){C((0,i.Z)(this),!1)}))}),[e]),(0,a.useEffect)((function(){if(Z){var t=(0,i.Z)("#state-".concat(Z)).node();j.current.zoomToElement(t,2,500,"easeOut")}else j.current.resetTransform(500,"easeOut");(0,c.Z)(".county, .state").style("visibility","visible").attr("pointer-events","all").attr("is-hidden",!1),Z.length&&(0,c.Z)(".county, .state").filter((function(t){var e=t.id;return!Z.includes((0,v.f)(e))})).style("visibility","hidden").attr("pointer-events","none").attr("is-hidden",!0)}),[Z,e]),(0,m.jsx)(o.d$,{ref:j,children:(0,m.jsx)(o.Uv,{children:(0,m.jsx)("div",{ref:k,className:"pieces"})})})}}}]);
//# sourceMappingURL=563.6470c469.chunk.js.map