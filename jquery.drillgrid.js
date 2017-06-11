/**
 * 
 * 不考虑编辑、footer、checkbox、rownumber
 */
(function($){
	function buildGrid(target){
		var state = $.data(target, 'drillgrid');
		var opts = $.data(target, 'drillgrid').options;
		$(target).datagrid($.extend({}, opts, {
			cls:'drillgrid',
			view:drillview,
			loadFilter:function(data){
				return opts.loadFilter.call(this, data);
			}
		}));
	}
	$.fn.drillgrid = function(options,param){
		if (typeof options == 'string'){
			var method = $.fn.drillgrid.methods[options];
			if (method){
				return method(this, param);
			} else {
				return this.datagrid(options, param);
			}
		}
		
		options = options || {};
		return this.each(function(){
			var state = $.data(this, 'drillgrid');
			if (state){
				$.extend(state.options, options);
			} else {
				var opts = $.extend({}, $.fn.propertygrid.defaults, $.fn.propertygrid.parseOptions(this), options);
				opts.frozenColumns = $.extend(true, [], opts.frozenColumns);
				opts.columns = $.extend(true, [], opts.columns);
				$.data(this, 'drillgrid', {
					options: opts
				});
			}
			buildGrid(this);
		});
	}
	$.fn.drillgrid.method = {
		options: function(jq){
			return $.data(jq[0], 'drillgrid').options;
		},
// 		loadData: function(jq, data) {
//             return jq.each(function() {
//             	var state = $.data(this, 'drillgrid');  
//         		var opts = state.options;
//                 opts.view.loadData.call(opts.view,this, data);
//             });
//        	}
	}
	$.fn.drillgrid.parseOptions = function(target){
		return $.extend({}, $.fn.datagrid.parseOptions(target), $.parser.parseOptions(target,[]));
	};
	$.fn.drillgrid.defaults = $.extend($.fn.datagrid.defaults, {
	    rowHeight: 25,  
	    colWidth:100,
	    maxDivHeight: 10000000,  
	    maxVisibleHeight: 15000000, 
	    maxDivWidth:10000000,
	    maxVisibleWidth:10000000,
	    deltaTopHeight: 0,
	    deltaLeftWidth:0,  
	    rPageSize:30,//行每页条数
	    cPageSize:3,//列每页条数
	    pageSize:30,//每页条数，rPageSize、cPageSize未配置时有效
	    lazyloadDelta:50,//距离下一页多少px时，开始加载下一页
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
	var drillview = $.extend($.fn.datagrid.defaults, {
		rows:[],//当前页的行数据
		rcolumns:[],//当前页列数据
		rindex:0,
		cindex:0,
		renderedPages1:[],//已渲染的页码，连续的放在一起格式:[1,4,'6-8',10,'555-556',1000]
		renderedPages2:[],
		render: function(target, container, frozen){
			var state = $.data(target, 'datagrid');  
	        var opts = state.options;  
	        var dc = state.dc;
	        var rows = this.rows || [];  
	        if (!rows.length) {  
	            return;  
	        }  
	        var fields = $(target).datagrid('getColumnFields', frozen);  
	          
	        if (frozen){  
	            if (!(opts.rownumbers || (opts.frozenColumns && opts.frozenColumns.length))){  
	                return;  
	            }  
	        }  
	          
	        var hWidth = $(container).prev().find('.datagrid-htable').css('width');    
	        var index = this.rindex;
	        var page = this.getClosestRenderedPage(container.is(dc.body2)?this.renderedPages2:this.renderedPages1,this.rpage);
	        var table = [];
	        if(!container.find('table').length){
	        	table.push('<table class="datagrid-btable" cellspacing="0" cellpadding="0" border="0" style="width:'+hWidth+'"><tbody>');
	        }
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
	            table.push('<tr id="' + rowId + '" datagrid-row-index="' + index + '" ' + cls + ' ' + style + ' datagrid-row-pgindex="'+this.rpage+'">');  
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
	        if(!container.find('table').length){
		        table.push('</tbody></table>');  
		        table.push('<div class="datagrid-btable-bottom"></div>');  
	        }
	        
	        
	        if(page){
				container.find('[datagrid-row-pgindex="'+page+'"]').eq(-1).after(table.join(''));
	        }else{
		        $(container).append(table.join(''));
	        }
	        
		},
		renderRow:function(target, fields, frozen, rowIndex, rowData){
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
	                  
	                cc.push('<td field="' + field + '" ' + cls + ' ' + style);  
	                if(col.ddfield){
	                	cc.push('ddfield="'+ col.ddfield+'"');
	                }
	                if(col.dufield){
	                	cc.push('dufield="'+ col.dufield+'"');
	                }  
	                cc.push('>');
                    style = styleValue;  
                    if (col.align){style += ';text-align:' + col.align + ';'}  
                    if (!opts.nowrap){  
                        style += ';white-space:normal;height:auto;';  
                    } else if (opts.autoRowHeight){  
                        style += ';height:auto;';  
                    }  
	                  
	                cc.push('<div style="' + style + '" ');  
                    cc.push('class="datagrid-cell ' + col.cellClass);  
	                cc.push('">');  
	                  
	                if (col.formatter){  
	                    cc.push(col.formatter(value, rowData, rowIndex));  
	                } else {  
	                    cc.push(value);  
	                }  
	                  
	                cc.push('</div>'); 
	                
	                if(col.expander){
	                	cc.push('<div class="drillgrid-cell-expander drillgrid-cell-'+ col.expander+'"></div>' );
	                }
	                cc.push('</td>');  
	            }  
	        }  
	        return cc.join('');
		},
		renderRColumn:function(target, fields,columnIndex,columnData){
			
		},
		//渲染空页
		renderPlaceRow:function(target,container){
			var state = $.data(target, 'datagrid');  
	        var opts = state.options;  
	        var dc = state.dc;
	        var renderedPages = container.is(dc.body1)?this.renderedPages1:this.renderedPages2;
			var len = renderedPages.length;
			var colspan = container.find('table tr').eq(0).find('td').length;
			var pageSize = opts.rPageSize || opts.pageSize;
			container.find('.datagrid-row-place').remove();
			for(var i = 0;i<len-1;i++){
				var e = renderedPages[i];
				var e_ = renderedPages[i+1];
				var type = typeof e;
				var type_ = typeof e_;
				var tr = [];
				
				if(type === 'string'){
					if(type_=== 'string'){
						tr.push('<tr class="datagrid-row-place"><td colspan="'+colspan+'"><div style="height:'+ (e_.split('-')[0]- e.split('-')[1] -1)*pageSize*opts.rowHeight +'px;"></div></tr>');
						container.find('[datagrid-row-pgindex="'+e_.split('-')[0]+'"]').eq(0).before(tr.join(''));
					}
					else if(type_=== 'number'){
						tr.push('<tr class="datagrid-row-place"><td colspan="'+colspan+'"><div style="height:'+ (e_- e.split('-')[1] -1)*pageSize*opts.rowHeight +'px;"></div></tr>');
						container.find('[datagrid-row-pgindex="'+e_+'"]').eq(0).before(tr.join(''));
					}
				}
				else if(type === 'number'){
					if(type_=== 'string'){
						tr.push('<tr class="datagrid-row-place"><td colspan="'+colspan+'"><div style="height:'+ (e_.split('-')[0]- e -1)*pageSize*opts.rowHeight +'px;"></div></tr>');
						container.find('[datagrid-row-pgindex="'+e+'"]').eq(-1).after(tr.join(''));
					}
					else if(type_=== 'number'){
						tr.push('<tr class="datagrid-row-place"><td colspan="'+colspan+'"><div style="height:'+ (e_- e -1)*pageSize*opts.rowHeight +'px;"></div></tr>');
						container.find('[datagrid-row-pgindex="'+e_+'"]').eq(0).before(tr.join(''));
					}
				}
			}
		},
		bindEvents:function(target){
			var state = $.data(target, 'datagrid');  
	        var dc = state.dc;  
	        var opts = state.options;  
	        var body = dc.body1.add(dc.body2);  
	        var clickHandler = ($.data(body[0],'events')||$._data(body[0],'events')).click[0].handler;  
	        body.unbind('click').bind('click', function(e){  
	            var tt = $(e.target);
	            var td = tt.closest('td');
	            var tr = tt.closest('tr.datagrid-row');  
	            if (!tr.length){return}  
//	            if (tt.hasClass('datagrid-row-expander')){  
//	                var rowIndex = parseInt(tr.attr('datagrid-row-index'));  
//	                if (tt.hasClass('datagrid-row-expand')){  
//	                    $(target).datagrid('expandRow', rowIndex);  
//	                } else {  
//	                    $(target).datagrid('collapseRow', rowIndex);  
//	                }  
//	                $(target).datagrid('fixRowHeight');  
//	                  
//	            } else {  
//	                clickHandler(e);  
//	            }  
				if(tt.hasClass('drillgrid-cell-expand')){
					tt.removeClass('drillgrid-cell-expand').addClass('drillgrid-cell-collapse');
				}
				else if(tt.hasClass('drillgrid-cell-collapse')){
					tt.removeClass('drillgrid-cell-collapse').addClass('drillgrid-cell-expand');
				}
	            e.stopPropagation();  
	        });  
		},
		onBeforeRender:function(target){
			var state = $.data(target, 'datagrid');  
	        var opts = state.options;  
	        var dc = state.dc;  
	        var view = this;  
	  		
	  		state.data.rcolumns = opts.rcolumns;
	        state.data.firstRows = state.data.rows;
	        state.data.firstColumns = state.data.rcolumns;  
	        state.data.rows = [];  
	  		state.data.rcolumns = [];
	  		state.data.ctotal = state.data.firstColumns.length;
	  		state.columnIdPrefix = "datagrid-col-c";
	        
	        dc.body1.add(dc.body2).empty();
	        this.rows = []; // the rows to be rendered  
//	        this.r1 = this.r2 = []; // the first part and last part of rows  
	         
	        this.renderedPages = [];
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
   		onAfterRender:function(target){
   			this.bindEvents(target)
// 			$.fn.datagrid.defaults.view.onAfterRender.call(this, target);  
// 	        var dc = $.data(target, 'datagrid').dc;  
// 	        var footer = dc.footer1.add(dc.footer2);  
// 	        footer.find('span.datagrid-row-expander').css('visibility', 'hidden');

   		},
		getClosestRenderedPage:function(renderedPages,page){
			var i,l = renderedPages.length;
			var ret;
			for(var i = 0 ;i < l;i++){
				var e = renderedPages[i];
				var e_ = i<l-1?renderedPages[i+1]:+Infinity;
				var type = typeof e;
				var type_ = typeof e_;
				var min;
				var max;
				if(type === 'string'){
					max = Math.max(e.split('-')[1],page);
					if(max === page){
						if(type_ === 'string'){
							min = Math.min(e_.split('-')[0],page);
							if(min === page){
								ret = e.split('-')[1];
								break;
							}
						}else if(type_ === 'number'){
							min = Math.min(page,e_);
							if(min === page){
								ret = +e.split('-')[1];
								break;
							}
						}
					}
				}
				else if(type === 'number'){
					max = Math.max(e,page);
					if(max === page){
						if(type_ === 'string'){
							min = Math.min(e_.split('-')[0],page);
							if(min === page){
								ret = e;
								break;
							}
						}else if(type_ === 'number'){
							min = Math.min(page,e_);
							if(min === page){
								ret = e;
								break;
							}
						}
					}
				}
			}
			this.reCalcRenderedPages(renderedPages,page,i);
			return ret;
		},
		reCalcRenderedPages:function(renderedPages,page,closestIndex){
			var len = renderedPages.length;
			var e = renderedPages[closestIndex];
			var e_ = renderedPages[closestIndex +1];
			var type = typeof e;
			var type_ = typeof e_;
// 			console.log('recalc page:'+page,'rendered:',this.isRendered(page,renderedPages),'renderedPages:',renderedPages)
			if(this.isRendered(page,renderedPages)){
				return;
			} 
			if(type === 'string'){
				if(page - e.split('-')[1] === 1){
					renderedPages[closestIndex] = [e.split('-')[0],page].join('-');
					if(type_ === "undefined"){
						return;
					}
				}
			}
			else if(type === 'number'){
				if(page - e === 1){
					renderedPages[closestIndex] = [e,page].join('-');
					if(type_ === "undefined"){
						return;
					}
				}
			}
			e = renderedPages[closestIndex];
			type = typeof e;
			if(type_ === 'string'){
				if(e_.split('-')[0] - page === 1){
					if(type === 'string'){
						renderedPages.splice(closestIndex,2,[e.split('-')[0], e_.split('-')[1]].join('-'));
						return;
					}
					else if(type === 'number'){
						renderedPages[closestIndex +1] = [page,e_.split('-')[1]].join('-');
						return;
					}
				}
			}
			else if(type_ === 'number'){
				if(e_ - page === 1){
					if(type === 'string'){
						renderedPages.splice(closestIndex,2,[e.split('-')[0], e_].join('-'));
						return;
					}
					else if(type === 'number'){
						renderedPages[closestIndex +1] = [page,e_].join('-');
						return;
					}
				}
			}
			if(this.isRendered(page,renderedPages)){
				return;
			}
			renderedPages.splice(closestIndex+1,0,page);
			return;
		},
		getScrollDir:function(target){
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
	        
	        return dir;
	  		
		},
		isRendered:function(page,renderedPages){
			renderedPages = renderedPages || this.renderedPages2;
			var len = renderedPages.length;
			for(var i =0;i<len;i++){
				var e = renderedPages[i];
				var type = typeof e;
				if(type === 'string'){
					if((page > +e.split('-')[0] && page < +e.split('-')[1]) || page === +e.split('-')[0] || page === +e.split('-')[1]){
						return true;
					}
				}
				else if(type === 'number'){
					if(page === e){
						return true;
					}
				}
				
			}
			return false;
		},
		loadPage:function(target,page,dir,isreload){
			var state = $.data(target, 'datagrid');  
	        var opts = state.options;
	        var dc = state.dc;
			if(dir === 'y'){
				console.log('load page:' +page);
				this.getRows(target,page,function(rows){
					this.rpage = page;  
	   	            this.rindex = (page-1)*(opts.rPageSize || opts.pageSize);  
	   	            this.rows = rows;
	   	            this.populateRow.call(this, target);
	   	            console.log(this.renderedPages1);
	   	            if(isreload) dc.body2.triggerHandler('scroll.datagrid');
				})
			}
		},
		getRows: function(target, page, callback){
	        var state = $.data(target, 'datagrid');  
	        var opts = state.options;  
	        var pageSize = opts.rPageSize || opts.pageSize;
	        var index = (page-1) * pageSize;  
	  
	        if (index < 0){return}  
	        if (opts.onBeforeFetch.call(target, page) == false){return;}  
	  
	        var rows = state.data.firstRows.slice(index, index+pageSize);  
	        if (rows.length && (rows.length==pageSize || index+rows.length==state.data.total)){  
	            opts.onFetch.call(target, page, rows);  
	            callback.call(this, rows);  
	        } else {  
	            var param = $.extend({}, opts.queryParams, {  
	                page: page,  
	                rows: pageSize  
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
	    getRColumns:function(target, page, callback){
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
	    scrolling: function(target){  
	    	var state = $.data(target, 'datagrid');  
	        var opts = state.options;  
	        var dc = state.dc;  
	        var top = $(dc.body2).scrollTop() + opts.deltaTopHeight;  
	        var index = Math.floor(top/opts.rowHeight);  
	        var pageSize = opts.rPageSize ||　opts.pageSize;
	        var page = Math.floor(index/pageSize) + 1;  
	        // load page
	        if(!this.isRendered(page)){
	        	this.loadPage(target,page,'y');
	        }
	        if(index%pageSize>0 && !this.isRendered(page+1)){
	        	this.loadPage(target,page+1,'y');
	        }
//	        var state = $.data(target, 'datagrid');  
//	        var opts = state.options;  
//	        var dc = state.dc;  
//	        var pageSize = opts.rPageSize || opts.pageSize;
//	        var dir = 'y';
//	        $(target).datagrid('loading');
//	        if (!opts.finder.getRows(target).length){
//	            this.reload.call(this, target);  
//	        } else {  
//	            if (!dc.body2.is(':visible')){return}  
//	            var headerHeight = dc.view2.children('div.datagrid-header').outerHeight();  
//	              
//	            var bottomDiv = dc.body2.children('div.datagrid-btable-bottom');  
//	            if (!bottomDiv.length){return;}  
//	            var csspos = dc.body2.css('position');
//	            var deltaHeight = csspos != 'static'? 0:headerHeight;
//	            var bottom = bottomDiv.position().top - headerHeight;  
//	            bottom = Math.floor(bottom);  
//	  
//	            if (bottom < 0){  
//	                this.reload.call(this, target);  
//	            } else if (top > 0){  
//	                var page = Math.floor(this.index/pageSize);
//	                if(!this.isRendered(page-1)){
//	                	this.loadPage(page-1);
//	                }
//	                if(!this.isRendered(page)){
//		                this.loadPage(target,page);
//	                }
//	            } else if (bottom < dc.body2.height()){  
//	                if (state.data.rows.length+this.rindex >= state.data.total){  
//	                    return;  
//	                }  
//	                var page = Math.floor(this.rindex/pageSize)+2;  
//	                if(!this.isRendered(page)){
//		                this.loadPage(target,page,dir);
//	                }
//// 	                if(!this.isRendered(page+1)){
//// 		                this.loadPage(page+1);
//// 	                }
//	            }  
//	        }  
	    },  
		reload: function(target){  
	        var state = $.data(target, 'datagrid');  
	        var opts = state.options;  
	        var dc = state.dc;  
	        var top = $(dc.body2).scrollTop() + opts.deltaTopHeight;  
	        var index = Math.floor(top/opts.rowHeight);  
	        var page = Math.floor(index/opts.pageSize) + 1;  
	        // load page
	        if(!this.isRendered(page)){
	        	this.loadPage(target,page,'y',true);
	        }
	    }, 
		populateRow:function(target){
			var state = $.data(target, 'datagrid');  
	        var opts = state.options;  
	        var dc = state.dc;  
	        var rowHeight = opts.rowHeight;  
	        var maxHeight = opts.maxDivHeight; 
	        var pageSize = opts.rPageSize || opts.pageSize;
			if (this.rows.length){  
	            opts.view.render.call(opts.view, target, dc.body2, false);  
	            this.renderPlaceRow(target,dc.body2);
	            
	            opts.view.render.call(opts.view, target, dc.body1, true); 
	            this.renderPlaceRow(target,dc.body1); 
	              
	            var body = dc.body1.add(dc.body2);  
	            var bottomDiv = body.children('div.datagrid-btable-bottom');  
	            var bottomHeight = state.data.total*rowHeight - body.find('table.datagrid-btable')._outerHeight();
	            bottomHeight = bottomHeight>0?bottomHeight:0;
	            fillHeight(bottomDiv, bottomHeight);  
	  
	            state.data.rows = this.rows;  
	              
	            var spos = dc.body2.scrollTop() + opts.deltaTopHeight;  
	            if (bottomHeight > opts.maxVisibleHeight){  
	                fillHeight(bottomDiv, opts.maxVisibleHeight);  
	            }  
	  
	            $(target).datagrid('setSelectionState');  
	            dc.body2.scrollTop(spos - opts.deltaTopHeight);  
	  
	            opts.onLoadSuccess.call(target, {  
	                total: state.data.total,  
	                rows: this.rows,
	                columns:this.columns,
	                ctotal:state.data.ctotal
	            });
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
		},
//		populateRColumn:function(){
//			
//		},
		loadData:function(){
			
		}
	})
	
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
})(jQuery);
