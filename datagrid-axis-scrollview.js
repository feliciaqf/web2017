$.extend($.fn.datagrid.defaults, {  
    rowHeight: 25,  
    colWidth:100,
    maxDivHeight: 10000000,  
    maxVisibleHeight: 15000000, 
    maxDivWidth:10000000,
    maxVisibleWidth:10000000,
    deltaTopHeight: 0,
    deltaLeftWidth:0,  
    xPageSize:30,
    pageSize:30,
    onBeforeFetch: function(page){},  
    onFetch: function(page, rows){},  
    loader: function(param, success, error){  
        var opts = $(this).datagrid('options');  
        if (!opts.url) return false;  
        if (opts.view.type == 'axisScrollview'){  
            param.page = param.page || 1;  
            param.rows = param.rows || opts.pageSize;
            param.columns = param.columns || opts.xPageSize;
        }  
        $.ajax({  
            type: opts.method,  
            url: opts.url,  
            data: param,  
            dataType: 'json',  
            success: function(data){  
                success(data); //data={rows:[{},{}],columns:[{},{}],total:1000,ctotal:11} 
            },  
            error: function(){  
                error.apply(this, arguments);  
            }  
        });  
    }  
});  
$.extend($.fn.datagrid.defaults.finder, {  
    getRow: function(target, p){    // p can be row index or tr object  
        var index = (typeof p == 'object') ? p.attr('datagrid-row-index') : p;  
        var opts = $(target).datagrid('options');  
        if (opts.view.type == 'axisScrollview'){  
            index -= opts.view.rindex;  
        }  
        return $.data(target, 'datagrid').data.rows[index];  
    },
    getColumn:function(target, p){
    	var index = (typeof p == 'object') ? p.attr('datagrid-col-index') : p;  
        var opts = $(target).datagrid('options');  
        if (opts.view.type == 'axisScrollview'){  
            index -= opts.view.cindex;  
        }  
        return $.data(target, 'datagrid').data.columns[index];
    },
    getColumns: function(target) {
        return $.data(target, "datagrid").data.columns;
    }
});  
  
var axisScrollview = $.extend({}, $.fn.datagrid.defaults.view, {  
    type: 'axisScrollview',  
    rindex: 0,
    cindex: 0,
    dir:'',
    r1: [],  
    r2: [],
    c1:[],
    c2:[],
    rows:[], 
    columns:[],
    render: function(target, container, frozen){  
        var state = $.data(target, 'datagrid');  
        var opts = state.options;  
        var dc = state.dc;
        var rows = this.rows || [];  
        var columns = this.columns || [];
        var reHeightCol = false;
        if(container.is(dc.header2)){
        	if(!columns.length){
        		return;
        	}
        	
        	var fields =  opts.axisColumns;
        	var hHeight = dc.header1.css('height');
        	var index = this.cindex;
        	var table = ['<div class="datagrid-htable-left"></div>',
        				'<table class="datagrid-htable" border="0" cellspacing="0" cellpadding="0" style="width:'+hHeight+'"><tbody>'];
        	table.push(this.renderColumn.call(this,target,fields,index,columns));
        	table.push('</tbody></table>');
        	table.push('<div class="datagrid-htable-right"></div>');
        	reHeightCol = true;
        }else{
	        if (!rows.length) {
	            return;  
	        }  
	        
	        var fields = $(target).datagrid('getColumnFields', frozen);
	          
	        if (frozen){  
	            if (!(opts.rownumbers || (opts.frozenColumns && opts.frozenColumns.length))){  
	                return;  
	            }  
	        }else{
	        	fields = [];
	        	columns.forEach(function(e){
					fields.push(e[opts.axisColumns[opts.axisColumns.length -1].field])
				})
	        }
	          
	        var hWidth = $(container).prev().find('.datagrid-htable').css('width');    
	        var index = this.rindex;
	        var table = [];
	        table.push('<div class="datagrid-btable-top"></div>');  
	        if(!frozen){
	        	table.push('<div class="datagrid-btable-left"></div>');
	        }
	        table.push('<table class="datagrid-btable" cellspacing="0" cellpadding="0" border="0"><tbody>');  
	        for(var i=0; i<rows.length; i++) {  
	            var css = opts.rowStyler ? opts.rowStyler.call(target, index, rows[i]) : '';  
	            var classValue = '';  
	            var styleValue = '';  
	            if (typeof css == 'string'){  
	                styleValue = css;  
	            } else if (css){  
	                classValue = css['class'] || '';  
	                styleValue = css['style'] || '';  
	            }  
	            var cls = 'class="datagrid-row ' + (index % 2 && opts.striped ? 'datagrid-row-alt ' : ' ') + classValue + '"';  
	            var style = styleValue ? 'style="' + styleValue + '"' : '';  
	            var rowId = state.rowIdPrefix + '-' + (frozen?1:2) + '-' + index;  
	            table.push('<tr id="' + rowId + '" datagrid-row-index="' + index + '" ' + cls + ' ' + style + '>');  
	            table.push(this.renderRow.call(this, target, fields, frozen, index, rows[i]));  
	            table.push('</tr>');  
	  
	            // render the detail row  
	            if (opts.detailFormatter){  
	                table.push('<tr style="display:none;">');  
	                if (frozen){  
	                    table.push('<td colspan=' + (fields.length+(opts.rownumbers?1:0)) + ' style="border-right:0">');  
	                } else {  
	                    table.push('<td colspan=' + (fields.length) + '>');  
	                }  
	                table.push('<div class="datagrid-row-detail">');  
	                if (frozen){  
	                    table.push(' ');  
	                } else {  
	                    table.push(opts.detailFormatter.call(target, index, rows[i]));  
	                }  
	                table.push('</div>');  
	                table.push('</td>');  
	                table.push('</tr>');  
	            }  
	  
	            index++;  
	        }  
	        table.push('</tbody></table>');  
	        table.push('</div>');  
        	if(!frozen){
        		table.push('<div class="datagrid-btable-right"></div>')
        	}
        	table.push('<div class="datagrid-btable-bottom"></div>');
        }
        
          
        $(container).html(table.join('')); 
        if(reHeightCol){
        	state.panel.panel("resize", opts);
        	if(dc.view2.children("div.datagrid-header").width() >= dc.view2.children("div.datagrid-header").find("table").width()){
        		dc.body2.css("overflow-x", "");
        	}
        }
    },  
      
    renderRow: function(target, fields, frozen, rowIndex, rowData){  
        var opts = $.data(target, 'datagrid').options;  
          
        var cc = [];  
        if (frozen && opts.rownumbers){  
            var rownumber = rowIndex + 1;  
            // if (opts.pagination){  
            //  rownumber += (opts.pageNumber-1)*opts.pageSize;  
            // }  
            cc.push('<td class="datagrid-td-rownumber"><div class="datagrid-cell-rownumber">'+rownumber+'</div></td>');  
        }  
        for(var i=0; i<fields.length; i++){  
            var field = fields[i];  
            var col = $(target).datagrid('getColumnOption', field);
            if (col){  
                var value = rowData[field]; // the field value  
                var css = col.styler ? (col.styler(value, rowData, rowIndex)||'') : '';  
                var classValue = '';  
                var styleValue = '';  
                if (typeof css == 'string'){  
                    styleValue = css;  
                } else if (cc){  
                    classValue = css['class'] || '';  
                    styleValue = css['style'] || '';  
                }  
                var cls = classValue ? 'class="' + classValue + '"' : '';  
                var style = col.hidden ? 'style="display:none;' + styleValue + '"' : (styleValue ? 'style="' + styleValue + '"' : '');  
                  
                cc.push('<td field="' + field + '" ' + cls + ' ' + style + '>');  
                  
                if (col.checkbox){  
                    style = '';  
                } else if (col.expander){  
                    style = "text-align:center;height:16px;";  
                } else {  
                    style = styleValue;  
                    if (col.align){style += ';text-align:' + col.align + ';'}  
                    if (!opts.nowrap){  
                        style += ';white-space:normal;height:auto;';  
                    } else if (opts.autoRowHeight){  
                        style += ';height:auto;';  
                    }  
                }  
                  
                cc.push('<div style="' + style + '" ');  
                if (col.checkbox){  
                    cc.push('class="datagrid-cell-check ');  
                } else {  
                    cc.push('class="datagrid-cell ' + col.cellClass);  
                }  
                cc.push('">');  
                  
                if (col.checkbox){  
                    cc.push('<input type="checkbox" name="' + field + '" value="' + (value!=undefined ? value : '') + '">');  
                } else if (col.expander) {  
                    //cc.push('<div style="text-align:center;width:16px;height:16px;">');  
                    cc.push('<span class="datagrid-row-expander datagrid-row-expand" style="display:inline-block;width:16px;height:16px;cursor:pointer;" />');  
                    //cc.push('</div>');  
                } else if (col.formatter){  
                    cc.push(col.formatter(value, rowData, rowIndex));  
                } else {  
                    cc.push(value);  
                }  
                  
                cc.push('</div>');  
                cc.push('</td>');  
            }else{
            	var value = rowData[field];
            	if(typeof value != undefined){
	                cc.push('<td field="' + field + '">');
	             	cc.push('<div style="width:' + opts.colWidth + 'px;" ');
	             	cc.push('class="datagrid-cell ');
	             	cc.push('">'); 
	             	cc.push(value);
            		cc.push('</div>');  
                	cc.push('</td>');
            	}
            }
        }  
        return cc.join('');  
    },  
     
    renderColumn: function(target, fields,columnIndex){
    	var state = $.data(target, 'datagrid');  
        var opts = state.options;  
        var columns = this.columns;  
        var cc = []; 
        
        for(var i=0; i<fields.length; i++){
    		var _field = fields[i]._field;
    		var field = fields[i].field;
        	var col = $(target).datagrid('getAxisColumnOption', _field);
    		cc.push('<tr class="datagrid-header-row">')
	        for(var j=0; j<columns.length; j++){
	        	var columnData = columns[j];
	        	if (col){  
	                var value = columnData[_field]; // the field value  
	                var css = col.styler ? (col.styler(value, columnData, columnIndex)||'') : '';  
	                var classValue = '';  
	                var styleValue = '';  
	                if (typeof css == 'string'){  
	                    styleValue = css;  
	                } else if (cc){  
	                    classValue = css['class'] || '';  
	                    styleValue = css['style'] || '';  
	                }  
			        var cls = 'class="datagrid-column ' + classValue + '"';  
			        var columnId = state.columnIdPrefix + '-' + 1 + '-' + j;  
	                var style = col.hidden ? 'style="display:none;' + styleValue + '"' : (styleValue ? 'style="' + styleValue + '"' : '');  
	                  
	                cc.push('<td id="' + columnId + '" datagrid-col-index="' + j + '" _field="' + _field + '" ' + (field?('field="' + columnData[field]+'" '):'')+cls + ' ' + style + '>');  
	                  
	                if (col.expander){  
	                    style = "text-align:center;height:16px;";  
	                } else {  
	                    style = styleValue;  
	                    if (col.align){style += ';text-align:' + col.align + ';'}  
	                    if (!opts.nowrap){  
	                        style += ';white-space:normal;';  
	                    }
	                    if(col.height){
	                    	style += ';height:' + col.height + 'px;'
	                    }
	                    if(opts.colWidth){
	                    	style +=';width:' + opts.colWidth +'px;';
	                    }
	                }  
	                
	                cc.push('<div style="' + style + '" ' + (col.resizable?'resizable=true':''));  
                    cc.push('class="datagrid-cell ' + (col.cellClass || '') + (col.sortable?'datagrid-sort':''));  
	                cc.push('">');  
	                  
	                if (col.expander) {  
	                    //cc.push('<div style="text-align:center;width:16px;height:16px;">');  
	                    cc.push('<span class="datagrid-col-expander datagrid-col-expand" style="display:inline-block;width:16px;height:16px;cursor:pointer;" />');  
	                    //cc.push('</div>');  
	                } else if (col.formatter){  
	                    cc.push(col.formatter(value, columnData, columnIndex));  
	                } else {  
	                    cc.push(value);  
	                }  
	                cc.push('</div>');  
	                cc.push('</td>');  
	            }  
	        	
// 	        	cc.push('</td>')
	        }
    		cc.push('</tr>')
    	}
        return cc.join('');  
        
    },
    
    renderLeftRight:function(target){
    	var state = $.data(target, 'datagrid');  
        var opts = state.options;  
        var columns = this.columns;
        var dc = state.dc;  
        var rowHeight = opts.rowHeight;  
        var maxHeight = opts.maxDivHeight; 
        var colWidth = opts.colWidth;
        var maxWidth = opts.maxDivWidth;
        var body = dc.body2.add(dc.header2);  
        var leftDiv = body.children('div.datagrid-btable-left,div.datagrid-htable-left');  
        var rightDiv = body.children('div.datagrid-btable-right,div.datagrid-htable-right');  
        var leftWidth = this.cindex * colWidth;  
        var rightWidth = state.data.ctotal*colWidth - this.columns.length*colWidth - leftWidth;  
        fillWidth(leftDiv, leftWidth);  
        fillWidth(rightDiv, rightWidth);  
  
        state.data.columns = this.columns;  
              
        var spos = dc.body2.scrollLeft() + opts.deltaLeftWidth;  
        if (leftWidth > opts.maxVisibleWidth){  
            opts.deltaLeftWidth = leftWidth - opts.maxVisibleWidth;  
            fillWidth(leftDiv, leftWidth - opts.deltaLeftWidth);  
        } else {  
            opts.deltaTopHeight = 0;  
        }  
        if (rightWidth > opts.maxVisibleWidth){  
            fillWidth(rightDiv, opts.maxVisibleWidth);  
        } else if (rightWidth == 0){  
            var lastCount = state.data.ctotal % opts.xPageSize;  
            if (lastCount){  
                fillWidth(rightDiv, dc.body2.width() - lastCount * colWidth);  
            }  
        }  
  
        dc.body2.scrollLeft(spos - opts.deltaTopHeight);  
  
        function fillWidth(div, width){  
			var count = Math.floor(width/maxWidth);  
			var leftWidth = width - maxWidth*count;  
			if (width < 0){  
				leftWidth = 0;  
			}  
			var cc = [];  
			for(var i=0; i<count; i++){  
				cc.push('<div style="width:'+maxWidth+'px"></div>');  
			}  
			cc.push('<div style="width:'+leftWidth+'px"></div>');  
			$(div).html(cc.join(''));  
		} 
    },
    bindEvents: function(target){  
        var state = $.data(target, 'datagrid');  
        var dc = state.dc;  
        var opts = state.options;  
        var body = dc.body1.add(dc.body2);  
        var clickHandler = ($.data(body[0],'events')||$._data(body[0],'events')).click[0].handler;  
        body.unbind('click').bind('click', function(e){  
            var tt = $(e.target);  
            var tr = tt.closest('tr.datagrid-row');  
            if (!tr.length){return}  
            if (tt.hasClass('datagrid-row-expander')){  
                var rowIndex = parseInt(tr.attr('datagrid-row-index'));  
                if (tt.hasClass('datagrid-row-expand')){  
                    $(target).datagrid('expandRow', rowIndex);  
                } else {  
                    $(target).datagrid('collapseRow', rowIndex);  
                }  
                $(target).datagrid('fixRowHeight');  
                  
            } else {  
                clickHandler(e);  
            }  
            e.stopPropagation();  
        });  
    },  
      
    onBeforeRender: function(target){  
        var state = $.data(target, 'datagrid');  
        var opts = state.options;  
        var dc = state.dc;  
        var view = this;  
  		
  		state.data.columns = opts.cdata;
        state.data.firstRows = state.data.rows;
        state.data.firstColumns = state.data.columns;  
        state.data.rows = [];  
  		state.data.columns = [];
  		state.data.ctotal = state.data.firstColumns.length;
  		state.columnIdPrefix = "datagrid-col-c";
        dc.body1.add(dc.body2).empty();  
        this.rows = []; // the rows to be rendered  
        this.r1 = this.r2 = []; // the first part and last part of rows  
         
  		$.data(target,'sinit',{
  			sleft:dc.body2.scrollLeft(),
  			stop:dc.body2.scrollTop()
  		})
         
        init();  
        createHeaderExpander();  
        if(state.data.ctotal){
        	dc.header2.empty();
        	return;
        }
        function init(){  
            var pager = $(target).datagrid('getPager');  
            pager.pagination({  
                onSelectPage: function(pageNum, pageSize){  
                    opts.pageNumber = pageNum || 1;  
                    opts.pageSize = pageSize;  
                    pager.pagination('refresh',{  
                        pageNumber:pageNum,  
                        pageSize:pageSize  
                    });  
                    $(target).datagrid('gotoPage', opts.pageNumber);  
                }  
            });  
            // erase the onLoadSuccess event, make sure it can't be triggered  
            state.onLoadSuccess = opts.onLoadSuccess;  
            opts.onLoadSuccess = function(){};  
            if (!opts.remoteSort){  
                var onBeforeSortColumn = opts.onBeforeSortColumn;  
                opts.onBeforeSortColumn = function(name, order){  
                    var result = onBeforeSortColumn.call(this, name, order);  
                    if (result == false){  
                        return false;  
                    }  
                    state.data.rows = state.data.firstRows;  
                }  
            }  
            dc.body2.unbind('.datagrid');  
            setTimeout(function(){  
                dc.body2.unbind('.datagrid').bind('scroll.datagrid', function(e){  
                    if (state.onLoadSuccess){  
                        opts.onLoadSuccess = state.onLoadSuccess;   // restore the onLoadSuccess event  
                        state.onLoadSuccess = undefined;  
                    }  
                    if (view.scrollTimer){  
                        clearTimeout(view.scrollTimer);  
                    }  
                    view.scrollTimer = setTimeout(function(){  
                        view.scrolling.call(view, target);  
                    }, 50);  
                });  
                dc.body2.triggerHandler('scroll.datagrid');  
            }, 0);  
        }  
        function createHeaderExpander(){  
            if (!opts.detailFormatter){return}  
              
            var t = $(target);  
            var hasExpander = false;  
            var fields = t.datagrid('getColumnFields',true).concat(t.datagrid('getColumnFields'));  
            for(var i=0; i<fields.length; i++){  
                var col = t.datagrid('getColumnOption', fields[i]);  
                if (col.expander){  
                    hasExpander = true;  
                    break;  
                }  
            }  
            if (!hasExpander){  
                if (opts.frozenColumns && opts.frozenColumns.length){  
                    opts.frozenColumns[0].splice(0,0,{field:'_expander',expander:true,width:24,resizable:false,fixed:true});  
                } else {  
                    opts.frozenColumns = [[{field:'_expander',expander:true,width:24,resizable:false,fixed:true}]];  
                }  
                  
                var t = dc.view1.children('div.datagrid-header').find('table');  
                var td = $('<td rowspan="'+opts.frozenColumns.length+'"><div class="datagrid-header-expander" style="width:24px;"></div></td>');  
                if ($('tr',t).length == 0){  
                    td.wrap('<tr></tr>').parent().appendTo($('tbody',t));  
                } else if (opts.rownumbers){  
                    td.insertAfter(t.find('td:has(div.datagrid-header-rownumber)'));  
                } else {  
                    td.prependTo(t.find('tr:first'));  
                }  
            }  
              
            setTimeout(function(){  
                view.bindEvents(target);  
            },0);  
        }  
    },  
      
    onAfterRender: function(target){  
        $.fn.datagrid.defaults.view.onAfterRender.call(this, target);  
        var dc = $.data(target, 'datagrid').dc;  
        var footer = dc.footer1.add(dc.footer2);  
        footer.find('span.datagrid-row-expander').css('visibility', 'hidden');  
    },  
  
    scrolling: function(target){  
        var state = $.data(target, 'datagrid');  
        var opts = state.options;  
        var dc = state.dc;  
        var sinit = $.data(target,'sinit');
        var sleft = dc.body2.scrollLeft();
        var stop = dc.body2.scrollTop();
        var dir;
        if(sinit.sleft === undefined){
        	dir = undefined;
        }else{
	        if(sleft != sinit.sleft){
	        	dir = 'x';
	        }
	        else if( stop != sinit.stop){
	        	dir = 'y';
	        }
        }
        $.data(target,'sinit',{
  			sleft:sleft,
  			stop:stop
  		})
        
        if(dir === 'y'){//滚动行
	    	this.rowscrolling(target);
	    	return;
        }
        else if(dir === 'x'){//滚动列
       		this.colscrolling(target); 
       		return;
        }
  		this.colscrolling(target);
  		this.rowscrolling(target);
  		 
    },  
    rowscrolling:function(target){
    	var dir = 'y'; 
    	var state = $.data(target, 'datagrid');  
        var opts = state.options;  
        var dc = state.dc;  
        if (!opts.finder.getRows(target).length){  
            this.reload.call(this, target,dir);  
        } else {  
            if (!dc.body2.is(':visible')){return}  
            var headerHeight = dc.view2.children('div.datagrid-header').outerHeight();  
              
            var topDiv = dc.body2.children('div.datagrid-btable-top');  
            var bottomDiv = dc.body2.children('div.datagrid-btable-bottom'); 
            var bodyPosStyle = dc.body2.css('position');
            var deltaHeight = bodyPosStyle != 'static'? 0:headerHeight;
            if (!topDiv.length || !bottomDiv.length){return;}  
            var top = topDiv.position().top + topDiv._outerHeight() - deltaHeight;  
            var bottom = bottomDiv.position().top - deltaHeight;  
            top = Math.floor(top);  
            bottom = Math.floor(bottom);  
  
            if (top > dc.body2.height() || bottom < 0){  
                this.reload.call(this, target,dir);  
            } else if (top > 0){  
                var page = Math.floor(this.rindex/opts.pageSize);  
                this.getRows.call(this, target, page, function(rows){  
                    this.page = page;  
                    this.r2 = this.r1;  
                    this.r1 = rows;  
                    this.rindex = (page-1)*opts.pageSize;  
                    this.rows = this.r1.concat(this.r2);  
                    this.populate.call(this, target,dir);  
                });  
            } else if (bottom < dc.body2.height()){  
                if (state.data.rows.length+this.rindex >= state.data.total){  
                    return;  
                }
                var page = Math.floor(this.rindex/opts.pageSize)+2;  
                if (this.r2.length){  
                    page++;  
                }  
                this.getRows.call(this, target, page, function(rows){  
                    this.page = page;  
                    if (!this.r2.length){  
                        this.r2 = rows;  
                    } else {  
                        this.r1 = this.r2;  
                        this.r2 = rows;  
                        this.rindex += opts.pageSize;  
                    }  
                    this.rows = this.r1.concat(this.r2);  
                    this.populate.call(this, target,dir);  
                });  
            }  
        }
    },
    colscrolling:function(target){
    	var dir = 'x';
    	var state = $.data(target, 'datagrid');  
        var opts = state.options;  
        var dc = state.dc;  
    	if (!opts.finder.getColumns(target).length){  
            this.reload.call(this, target,dir);  
        } else {  
            if (!dc.body2.is(':visible')){return}  
            var headerWidth = dc.view1.children('div.datagrid-header').outerWidth();  
              
            var leftDiv = dc.body2.children('div.datagrid-btable-left');  
            var rightDiv = dc.body2.children('div.datagrid-btable-right');
            var bodyPosStyle = dc.body2.css('position');
//             var deltaWidth = bodyPosStyle != 'static'? 0:headerWidth;
            if (!leftDiv.length || !rightDiv.length){return;}  
            var left = leftDiv.position().left + leftDiv._outerWidth()// - deltaWidth;  
            var right = rightDiv.position().left// - deltaWidth;  
            left = Math.floor(left);  
            right = Math.floor(right);  
  
            if (left > dc.body2._outerWidth() || right < 0){  
                this.reload.call(this, target,dir);  
            } else if (left > 0){  
                var page = Math.floor(this.cindex/opts.xPageSize);  
                this.getColumns.call(this, target, page, function(columns){  
                    this.cpage = page;  
                    this.c2 = this.c1;  
                    this.c1 = columns;  
                    this.cindex = (page-1)*opts.xPageSize;  
                    this.columns = this.c1.concat(this.c2);  
                    this.populate.call(this, target,dir);  
                });  
            } else if (right < dc.body2.width()){  
                if (state.data.columns.length+this.cindex >= state.data.ctotal){  
                    return;  
                }
                var page = Math.floor(this.cindex/opts.xPageSize)+2;  
                if (this.c2.length){  
                    page++;  
                }  
                this.getColumns.call(this, target, page, function(columns){  
                    this.page = page;  
                    if (!this.c2.length){  
                        this.c2 = columns;  
                    } else {  
                        this.c1 = this.c2;  
                        this.c2 = columns;  
                        this.cindex += opts.xPageSize;  
                    }  
                    this.columns = this.c1.concat(this.c2);  
                    this.populate.call(this, target,dir);  
                });  
            }  
        }
    },
    reload: function(target,dir){
        var state = $.data(target, 'datagrid');  
        var opts = state.options;  
        var dc = state.dc;  
        var top = $(dc.body2).scrollTop() + opts.deltaTopHeight;  
        var left = dc.body2.scrollLeft() + opts.deltaLeftWidth;  
        var rindex = Math.floor(top/opts.rowHeight);  
        var rpage = Math.floor(rindex/opts.pageSize) + 1;
        var cindex = Math.floor(left/opts.colWidth);  
        var cpage = Math.floor(cindex/opts.xPageSize) + 1;  
        
       	if(dir === 'x'){
   	        this.getColumns.call(this, target, cpage, function(columns){  
   	            this.cpage = cpage;  
   	            this.cindex = (cpage-1)*opts.xPageSize;  
   	            this.columns = columns;  
   	            this.c1 = columns;  
   	            this.c2 = [];  
   	            this.populate.call(this, target,dir);  
   	            dc.body2.triggerHandler('scroll.datagrid');  
   	        });
   	        return;  
       	}
       	else if(dir === 'y'){
   	        this.getRows.call(this, target, rpage, function(rows){  
   	            this.rpage = rpage;  
   	            this.rindex = (rpage-1)*opts.pageSize;  
   	            this.rows = rows;  
   	            this.r1 = rows;  
   	            this.r2 = [];  
   	            this.populate.call(this, target,dir);  
   	            dc.body2.triggerHandler('scroll.datagrid');  
   	        }); 
   	        return; 
       	} 
        
        this.getColumns.call(this, target, cpage, function(columns){  
            this.cpage = cpage;  
            this.cindex = (cpage-1)*opts.xPageSize;  
            this.columns = columns;  
            this.c1 = columns;  
            this.c2 = [];  
            this.populate.call(this, target,'x');  
            dc.body2.triggerHandler('scroll.datagrid');   
        }); 
        this.getRows.call(this, target, rpage, function(rows){  
            this.rpage = rpage;  
            this.rindex = (rpage-1)*opts.pageSize;  
            this.rows = rows;  
            this.r1 = rows;  
            this.r2 = [];  
            this.populate.call(this, target,'y');  
            dc.body2.triggerHandler('scroll.datagrid');  
        }); 
    },  
      
    getRows: function(target, page, callback){  
        var state = $.data(target, 'datagrid');  
        var opts = state.options;  
        var index = (page-1)*opts.pageSize;  
  
        if (index < 0){return}  
        if (opts.onBeforeFetch.call(target, page) == false){return;}  
  
        var rows = state.data.firstRows.slice(index, index+opts.pageSize);  
        if (rows.length && (rows.length==opts.pageSize || index+rows.length==state.data.total)){  
            opts.onFetch.call(target, page, rows);  
            callback.call(this, rows);  
        } else {  
            var param = $.extend({}, opts.queryParams, {  
                page: page,  
                rows: opts.pageSize  
            });  
            if (opts.sortName){  
                $.extend(param, {  
                    sort: opts.sortName,  
                    order: opts.sortOrder  
                });  
            }  
            if (opts.onBeforeLoad.call(target, param) == false) return;  
              
            $(target).datagrid('loading');  
            var result = opts.loader.call(target, param, function(data){  
                $(target).datagrid('loaded');  
                var data = opts.loadFilter.call(target, data);  
                opts.onFetch.call(target, page, data.rows);  
                if (data.rows && data.rows.length){  
                    callback.call(opts.view, data.rows);  
                } else {  
                    opts.onLoadSuccess.call(target, data);  
                }  
            }, function(){  
                $(target).datagrid('loaded');  
                opts.onLoadError.apply(target, arguments);  
            });  
            if (result == false){  
                $(target).datagrid('loaded');  
                if (!state.data.firstRows.length){  
                    opts.onFetch.call(target, page, state.data.firstRows);  
                    opts.onLoadSuccess.call(target, state.data);  
                }  
            }  
        } 
    },  
    getColumns:function(target, page, callback){
        var state = $.data(target, 'datagrid');  
        var opts = state.options;  
        var index = (page-1)*opts.xPageSize;  
  
        if (index < 0){return}  
        if (opts.onBeforeFetch.call(target, page) == false){return;}  
  
        var columns = state.data.firstColumns.slice(index, index+opts.xPageSize);  
        if (columns.length && (columns.length==opts.xPageSize || index+columns.length==state.data.ctotal)){  
            opts.onFetch.call(target, page, columns);  
            callback.call(this, columns);  
        } else {  
            var param = $.extend({}, opts.queryParams, {  
                page: page,  
                columns: opts.xPageSize  
            });  
            if (opts.sortName){  
                $.extend(param, {  
                    sort: opts.sortName,  
                    order: opts.sortOrder  
                });  
            }  
            if (opts.onBeforeLoad.call(target, param) == false) return;  
              
            $(target).datagrid('loading');  
            var result = opts.loader.call(target, param, function(data){  
                $(target).datagrid('loaded');  
                var data = opts.loadFilter.call(target, data);  
                opts.onFetch.call(target, page, data.rows);  
                if (data.columns && data.columns.length){  
                    callback.call(opts.view, data.columns);  
                } else {  
                    opts.onLoadSuccess.call(target, data);  
                }  
            }, function(){  
                $(target).datagrid('loaded');  
                opts.onLoadError.apply(target, arguments);  
            });  
            if (result == false){  
                $(target).datagrid('loaded');  
                if (!state.data.columns.length){  
                    opts.onFetch.call(target, page, state.data.firstColumns);  
                    opts.onLoadSuccess.call(target, state.data);  
                }  
            }  
        }  
    	
    },
    populate: function(target,dir){
        var state = $.data(target, 'datagrid');  
        var opts = state.options;  
        var dc = state.dc;  
        var rowHeight = opts.rowHeight;  
        var maxHeight = opts.maxDivHeight; 
        var colWidth = opts.colWidth;
        var maxWidth = opts.maxDivWidth;
  		
  		if(dir === 'y'){
	        if (this.rows.length){  
	            opts.view.render.call(opts.view, target, dc.body2, false);  
	            opts.view.render.call(opts.view, target, dc.body1, true);  
	              
	            var body = dc.body1.add(dc.body2);  
	            var topDiv = body.children('div.datagrid-btable-top');  
	            var bottomDiv = body.children('div.datagrid-btable-bottom');  
	            var topHeight = this.rindex * rowHeight;  
	            var bottomHeight = state.data.total*rowHeight - this.rows.length*rowHeight - topHeight;  
	            fillHeight(topDiv, topHeight);  
	            fillHeight(bottomDiv, bottomHeight);  
	  
	            state.data.rows = this.rows;  
	              
	            var spos = dc.body2.scrollTop() + opts.deltaTopHeight;  
	            if (topHeight > opts.maxVisibleHeight){  
	                opts.deltaTopHeight = topHeight - opts.maxVisibleHeight;  
	                fillHeight(topDiv, topHeight - opts.deltaTopHeight);  
	            } else {  
	                opts.deltaTopHeight = 0;  
	            }  
	            if (bottomHeight > opts.maxVisibleHeight){  
	                fillHeight(bottomDiv, opts.maxVisibleHeight);  
	            } else if (bottomHeight == 0){  
	                var lastCount = state.data.total % opts.pageSize;  
	                if (lastCount){  
	                    fillHeight(bottomDiv, dc.body2.height() - lastCount * rowHeight);  
	                }  
	            }  
	  
	            $(target).datagrid('setSelectionState');  
	            dc.body2.scrollTop(spos - opts.deltaTopHeight);  
	  
	            var pager = $(target).datagrid('getPager');  
	            if (pager.length){  
	                var popts = pager.pagination('options');  
	                var displayMsg = popts.displayMsg;  
	                var msg = displayMsg.replace(/{from}/, this.rindex+1);  
	                msg = msg.replace(/{to}/, this.rindex+this.rows.length);  
	                pager.pagination('refresh', {  
	                    pageNumber: this.page,  
	                    displayMsg: msg  
	                });  
	                popts.displayMsg = displayMsg;  
	            }  
	  
	            opts.onLoadSuccess.call(target, {  
	                total: state.data.total,  
	                rows: this.rows,
	                colomuns:this.columns,
	                ctotal:state.data.ctotal
	            });  
	        }  
	        
	        function fillHeight(div, height){  
	            var count = Math.floor(height/maxHeight);  
	            var leftHeight = height - maxHeight*count;  
	            if (height < 0){  
	                leftHeight = 0;  
	            }  
	            var cc = [];  
	            for(var i=0; i<count; i++){  
	                cc.push('<div style="height:'+maxHeight+'px"></div>');  
	            }  
	            cc.push('<div style="height:'+leftHeight+'px"></div>');  
	            $(div).html(cc.join(''));  
	        }  
  		}
  		else if(dir === 'x'){
  			if(this.columns.length){
//	        	opts.view.render.call(opts.view, target, dc.body2, false);  
	            opts.view.render.call(opts.view, target, dc.header2, false);
	            
	            var body = dc.body2.add(dc.header2);  
	            var leftDiv = body.children('div.datagrid-btable-left,div.datagrid-htable-left');  
	            var rightDiv = body.children('div.datagrid-btable-right,div.datagrid-htable-right');  
	            var leftWidth = this.cindex * colWidth;  
	            var rightWidth = state.data.ctotal*colWidth - this.columns.length*colWidth - leftWidth;  
	            fillWidth(leftDiv, leftWidth);  
	            fillWidth(rightDiv, rightWidth);  
	  
	            state.data.columns = this.columns;  
	              
	            var spos = dc.body2.scrollLeft() + opts.deltaLeftWidth;  
	            if (leftWidth > opts.maxVisibleWidth){  
	                opts.deltaLeftWidth = leftWidth - opts.maxVisibleWidth;  
	                fillWidth(leftDiv, leftWidth - opts.deltaLeftWidth);  
	            } else {  
	                opts.deltaTopHeight = 0;  
	            }  
	            if (rightWidth > opts.maxVisibleWidth){  
	                fillWidth(rightDiv, opts.maxVisibleWidth);  
	            } else if (rightWidth == 0){  
	                var lastCount = state.data.ctotal % opts.xPageSize;  
	                if (lastCount){  
	                    fillWidth(rightDiv, dc.body2.width() - lastCount * colWidth);  
	                }  
	            }  
	  
// 	            $(target).datagrid('setSelectionState');  
	            dc.body2.scrollLeft(spos - opts.deltaTopHeight);  
	  
	            var pager = $(target).datagrid('getPager');  
	            if (pager.length){  
	                var popts = pager.pagination('options');  
	                var displayMsg = popts.displayMsg;  
	                var msg = displayMsg.replace(/{from}/, this.cindex+1);  
	                msg = msg.replace(/{to}/, this.cindex+this.columns.length);  
	                pager.pagination('refresh', {  
	                    pageNumber: this.page,  
	                    displayMsg: msg  
	                });  
	                popts.displayMsg = displayMsg;  
	            }  
	  
	            opts.onLoadSuccess.call(target, {  
	                total: state.data.total,  
	                rows: this.rows,
	                columns:this.columns,
	                ctotal:state.data.ctotal  
	            });
	            function fillWidth(div, width){  
					var count = Math.floor(width/maxWidth);  
					var leftWidth = width - maxWidth*count;  
					if (width < 0){  
						leftWidth = 0;  
					}  
					var cc = [];  
					for(var i=0; i<count; i++){  
						cc.push('<div style="width:'+maxWidth+'px"></div>');  
					}  
					cc.push('<div style="width:'+leftWidth+'px"></div>');  
					$(div).html(cc.join(''));  
				} 
	        }
  		}
    },  
  
    updateRow: function(target, rowIndex, row){  
        var opts = $.data(target, 'datagrid').options;  
        var rows = $(target).datagrid('getRows');  
        var rowData = opts.finder.getRow(target, rowIndex);  
  
        var oldStyle = _getRowStyle(rowIndex);  
        $.extend(rowData, row);  
        var newStyle = _getRowStyle(rowIndex);  
        var oldClassValue = oldStyle.c;  
        var styleValue = newStyle.s;  
        var classValue = 'datagrid-row ' + (rowIndex % 2 && opts.striped ? 'datagrid-row-alt ' : ' ') + newStyle.c;  
          
        function _getRowStyle(rowIndex){  
            var css = opts.rowStyler ? opts.rowStyler.call(target, rowIndex, rowData) : '';  
            var classValue = '';  
            var styleValue = '';  
            if (typeof css == 'string'){  
                styleValue = css;  
            } else if (css){  
                classValue = css['class'] || '';  
                styleValue = css['style'] || '';  
            }  
            return {c:classValue, s:styleValue};  
        }  
        function _update(frozen){  
            var fields = $(target).datagrid('getColumnFields', frozen);  
            var tr = opts.finder.getTr(target, rowIndex, 'body', (frozen?1:2));  
            var checked = tr.find('div.datagrid-cell-check input[type=checkbox]').is(':checked');  
            tr.html(this.renderRow.call(this, target, fields, frozen, rowIndex, rowData));  
            tr.attr('style', styleValue).removeClass(oldClassValue).addClass(classValue);  
            if (checked){  
                tr.find('div.datagrid-cell-check input[type=checkbox]')._propAttr('checked', true);  
            }  
        }  
          
        _update.call(this, true);  
        _update.call(this, false);  
        $(target).datagrid('fixRowHeight', rowIndex);  
    },  
    
    insertRow: function(target, index, row){  
        var state = $.data(target, 'datagrid');  
        var opts = state.options;  
        var data = state.data;  
  		var dir = 'y';
        var total = $(target).datagrid('getData').total;  
        if (index == null){index = total;}  
        if (index > total){index = total;}  
        if (data.firstRows && index <= data.firstRows.length){  
            data.firstRows.splice(index, 0, row);  
        }  
        data.total++;  
  
        var rows = this.r1.concat(this.r2);  
        if (index < this.rindex){  
            this.reload.call(this, target,dir);  
        } else if (index <= this.rindex+rows.length){  
            rows.splice(index - this.rindex, 0, row);  
            this.r1 = rows.splice(0, opts.pageSize);  
            if (this.r2.length){  
                this.r2 = rows.splice(0, opts.pageSize);  
            }  
            this.rows = this.r1.concat(this.r2);  
            this.populate.call(this, target,'y');  
            state.dc.body2.triggerHandler('scroll.datagrid');  
        }  
    },  
  
    deleteRow: function(target, index){  
        var state = $.data(target, 'datagrid');  
        var data = state.data;  
        var opts = state.options;  
        var dir = 'y';
        if (data.firstRows){  
            data.firstRows.splice(index, 1);  
        }  
        data.total--;  
  
        var rows = this.r1.concat(this.r2);  
        if (index < this.rindex){  
            this.reload.call(this, target,dir);  
        } else if (index < this.rindex+rows.length){  
            rows.splice(index - this.rindex, 1);  
            this.r1 = rows.splice(0, opts.pageSize);  
            if (this.r1.length < opts.pageSize){  
                this.reload.call(this, target,dir);  
            } else {  
                this.r2 = [];  
                this.rows = this.r1.concat(this.r2);  
                this.populate.call(this, target,'y');  
                state.dc.body2.triggerHandler('scroll.datagrid');  
            }  
        }  
    }  
});  
  
$.fn.datagrid.methods.baseGetRowIndex = $.fn.datagrid.methods.getRowIndex;  
$.fn.datagrid.methods.baseGetColumnIndex = $.fn.datagrid.methods.getColumnIndex;  
$.fn.datagrid.methods.baseScrollTo = $.fn.datagrid.methods.scrollTo;  
$.fn.datagrid.methods.baseGotoPage = $.fn.datagrid.methods.gotoPage;  
$.extend($.fn.datagrid.methods, {  
    getRowIndex: function(jq, id){  
        var opts = jq.datagrid('options');  
        if (opts.view.type == 'axisScrollview'){  
            // return jq.datagrid('baseGetRowIndex', id) + opts.view.index;  
            var index = jq.datagrid('baseGetRowIndex', id);  
            if (index == -1){  
                return -1;  
            } else {  
                return index + opts.view.rindex;  
            }  
        } else {  
            return jq.datagrid('baseGetRowIndex', id);  
        }  
    }, 
    getColumnIndex: function(jq, id){  
        var opts = jq.datagrid('options');  
        if (opts.view.type == 'axisScrollview'){  
            // return jq.datagrid('baseGetRowIndex', id) + opts.view.index;  
            var index = jq.datagrid('baseGetColumnIndex', id);  
            if (index == -1){  
                return -1;  
            } else {  
                return index + opts.view.cindex;  
            }  
        } else {  
            return jq.datagrid('baseGetColumnIndex', id);  
        }  
    },  
    getRow: function(jq, index){  
        return jq.datagrid('options').finder.getRow(jq[0], index);  
    },  
    gotoPage: function(jq, param){  
        return jq.each(function(){  
            var target = this;  
            var opts = $(target).datagrid('options');  
            if (opts.view.type == 'axisScrollview'){  
                var page, callback;  
                if (typeof param == 'object'){  
                    page = param.page;  
                    callback = param.callback;  
                } else {  
                    page = param;  
                }  
                opts.view.getRows.call(opts.view, target, page, function(rows){  
                    this.page = page;  
                    this.rindex = (page-1)*opts.pageSize;  
                    this.rows = rows;  
                    this.r1 = rows;  
                    this.r2 = [];  
                    this.populate.call(this, target,'y');  
                    $(target).data('datagrid').dc.body2.scrollTop(this.rindex * opts.rowHeight - opts.deltaTopHeight);  
                    if (callback){  
                        callback.call(target, page);  
                    }  
                });  
            } else {  
                $(target).datagrid('baseGotoPage', param);  
            }  
        });  
    },  
    scrollTo: function(jq, param){  
        return jq.each(function(){  
            var target = this;  
            var opts = $(target).datagrid('options');  
            var index, callback;  
            if (typeof param == 'object'){  
                index = param.index;  
                callback = param.callback;  
            } else {  
                index = param;  
            }  
            var view = opts.view;  
            if (view.type == 'axisScrollview'){  
                if (index >= view.index && index < view.index+view.rows.length){  
                    $(target).datagrid('baseScrollTo', index);  
                    if (callback){  
                        callback.call(target, index);  
                    }  
                } else if (index >= 0){  
                    var page = Math.floor(index/opts.pageSize) + 1;  
                    $(target).datagrid('gotoPage', {  
                        page: page,  
                        callback: function(){  
                            setTimeout(function(){  
                                $(target).datagrid('baseScrollTo', index);  
                                if (callback){  
                                    callback.call(target, index);  
                                }  
                            }, 0);                            
                        }  
                    });  
                }  
            } else {  
                $(target).datagrid('baseScrollTo', index);  
                if (callback){  
                    callback.call(target, index);  
                }  
            }  
        });  
    }  
});  
  
$.extend($.fn.datagrid.methods, {  
    fixDetailRowHeight: function(jq, index){  
        return jq.each(function(){  
            var opts = $.data(this, 'datagrid').options;  
            var dc = $.data(this, 'datagrid').dc;  
            var tr1 = opts.finder.getTr(this, index, 'body', 1).next();  
            var tr2 = opts.finder.getTr(this, index, 'body', 2).next();  
            // fix the detail row height  
            if (tr2.is(':visible')){  
                tr1.css('height', '');  
                tr2.css('height', '');  
                var height = Math.max(tr1.height(), tr2.height());  
                tr1.css('height', height);  
                tr2.css('height', height);  
            }  
            dc.body2.triggerHandler('scroll');  
        });  
    },  
    getExpander: function(jq, index){   // get row expander object  
        var opts = $.data(jq[0], 'datagrid').options;  
        return opts.finder.getTr(jq[0], index).find('span.datagrid-row-expander');  
    },  
    // get row detail container  
    getRowDetail: function(jq, index){  
        var opts = $.data(jq[0], 'datagrid').options;  
        var tr = opts.finder.getTr(jq[0], index, 'body', 2);  
        return tr.next().find('div.datagrid-row-detail');  
    },  
    expandRow: function(jq, index){  
        return jq.each(function(){  
            var opts = $(this).datagrid('options');  
            var dc = $.data(this, 'datagrid').dc;  
            var expander = $(this).datagrid('getExpander', index);  
            if (expander.hasClass('datagrid-row-expand')){  
                expander.removeClass('datagrid-row-expand').addClass('datagrid-row-collapse');  
                var tr1 = opts.finder.getTr(this, index, 'body', 1).next();  
                var tr2 = opts.finder.getTr(this, index, 'body', 2).next();  
                tr1.show();  
                tr2.show();  
                $(this).datagrid('fixDetailRowHeight', index);  
                if (opts.onExpandRow){  
                    var row = $(this).datagrid('getRows')[index];  
                    opts.onExpandRow.call(this, index, row);  
                }  
            }  
        });  
    },  
    collapseRow: function(jq, index){  
        return jq.each(function(){  
            var opts = $(this).datagrid('options');  
            var dc = $.data(this, 'datagrid').dc;  
            var expander = $(this).datagrid('getExpander', index);  
            if (expander.hasClass('datagrid-row-collapse')){  
                expander.removeClass('datagrid-row-collapse').addClass('datagrid-row-expand');  
                var tr1 = opts.finder.getTr(this, index, 'body', 1).next();  
                var tr2 = opts.finder.getTr(this, index, 'body', 2).next();  
                tr1.hide();  
                tr2.hide();  
                dc.body2.triggerHandler('scroll');  
                if (opts.onCollapseRow){  
                    var row = $(this).datagrid('getRows')[index];  
                    opts.onCollapseRow.call(this, index, row);  
                }  
            }  
        });  
    }  
});
$.extend($.fn.datagrid.methods, {  
	getAxisColumnFields:function(jq,data){
		var state = $.data(jq[0], 'datagrid');  
        var opts = state.options;  
		var fields = [];
		try{
			state.data.columns.forEach(function(e){
				fields.push(e[opts.axisColumns[opts.axisColumns.length -1].field])
			})
		}catch(e){}
		
		return fields;
	},
	getAxisColumnOption:function(jq,field){
		function find(_706) {
            if (_706) {
                for (var i = 0; i < _706.length; i++) {
                    var cc = _706[i];
                    if (cc._field == field) {
                        return cc;
                    }
                }
            }
            return null ;
        }
        var opts = $.data(jq[0], "datagrid").options;
        var col = find(opts.axisColumns);
        if (!col) {
            col = find(opts.columns);
        }
        return col;
	}
})