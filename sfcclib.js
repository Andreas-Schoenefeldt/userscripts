// ==UserScript==
// @name         SFCC lib
// @namespace    napali.boardriders
// @version      22.9.1.1
// @icon         https://c1.sfdcstatic.com/content/dam/web/en_us/www/images/home/logo-salesforce-m.svg
// @description  let's enhance some stuff (BM & logs ... mainly)
// @author       Benjamin Delichere
// @match        https://*.demandware.net/*
// @grant        none
// @copyright    Benjamin Delichere
// @license      X11 (MIT)
// ==/UserScript==

(function() {
    'use strict';

    ///////////////////////////////
    //////////// MAIN /////////////
    ///////////////////////////////
    // let's get things done

    var runForestRun = function () {
        // LOG LISTING PAGE
        if (isLogPage()) {
            //logsAddSearchBoxes();
            //logsReOrder();
            //logsHighlightToday();
            //logsCleanDates();
        }
        // LOG FILE
        else if (isLogFile()) {
            //logsReverseFile();
            //logsScrollToBottom();
            //logFileCleanDates();
        }
        // BUSINESS MANAGER
        else if (isBmPage()) {
            //NOT READY//bmCleanDates();
            bmSortSites();
            bmSortCustomPref();
            bmAddSettingsDirectLink();
            bmAddDataRepLinks();
            bmAddGlobalExportDirectLinks();
            //NOT READY//bmClickFriendlyMenu();
        }
    },

    ////////////////////////////////
    //////////// TOOLS /////////////
    ////////////////////////////////

    waitForElm = function (selector) {
        return new Promise(resolve => {
            if (document.querySelector(selector)) {return resolve(document.querySelector(selector));}
            const observer = new MutationObserver(mutations => {if (document.querySelector(selector)) {resolve(document.querySelector(selector));observer.disconnect();}});
            observer.observe(document.body, {childList: true,subtree: true});
        });
    },

    ///////////////////////////////
    //////////// LOGS /////////////
    ///////////////////////////////
    // let's enhance logs

    logsReOrder = function () {
        parseLogsTable(function(tableData,rowData,i){
            //if (rowData.length > 500) return false;
            for(var j = 0; j < rowData.length - (i + 1); j++){
                let nextA = rowData.item(j).getElementsByTagName('td');
                let nextB = rowData.item(j+1).getElementsByTagName('td');
                if (nextA.length < 2 || nextB < 2) continue;
                var a = nextA.item(2).innerHTML;
                var b = nextB.item(2).innerHTML;
                if(gmtToDatetime(a) < gmtToDatetime(b)) {
                    tableData.insertBefore(rowData.item(j+1),rowData.item(j));
                }
            }
        });
        console.log('[logsReOrder]');
    },

    logsScrollToBottom = function () {
        window.scrollTo(0,document.body.scrollHeight);
        console.log('[logsScrollToBottom]');
    },

    logsAddSearchBoxes = function () {
        var rightNow = new Date();
        var search_value = rightNow.toISOString().slice(0,10).replace(/-/g,"");
        var filter_out_value = "api|jobs|wwd|syslog|migration|quota|analytics";
        var input_style = 'style="margin-left: 5%; text-align: center; width: 300px;"';
        var input_filter = '<input type="text" id="filter_contains" '+input_style+' value="'+search_value+'">';
        var input_filter_out = '<input type="text" id="filter_does_not_contain" '+input_style+' value="'+filter_out_value+'">';

        document.getElementsByTagName('h1')[0].insertAdjacentHTML('beforeend', input_filter+input_filter_out);

        document.querySelector('#filter_contains').addEventListener('keyup',function(e){if (e.key==="Enter"){filterLogs();}});
        document.querySelector('#filter_does_not_contain').addEventListener('keyup',function(e){if (e.key==="Enter"){filterLogs();}});

        filterLogs();
    },

    logsHighlightToday = function () {
        var d = {};
        var todayCounter = 0;
        d.tableData = document.getElementsByTagName('table').item(0).getElementsByTagName('tbody').item(0);
        d.rowData = d.tableData.getElementsByTagName('tr');
        if (d.rowData.length > 500) return false;
        d.curGrad = "00";
        d.lastSeenTime = '';
        d.pair = true;
        for(var i = 0; i < d.rowData.length - 1; i++){
            let nextTd = d.rowData.item(i).getElementsByTagName('td');
            if (nextTd.length < 2) continue;
            d.a = getDatetime(nextTd.item(2).innerHTML);
            d.latestday = (i == 1) ? d.a.substring(0,8) : d.latestday;
            d.latesttime = (i == 1) ? d.a.substring(0,14) : d.latesttime;
            d.currentday = d.a.substring(0,8);
            d.currenttime = d.a.substring(0,14);

            d.tableData.rows[i].style.backgroundColor = "#ffffff";
            if (d.currentday===d.latestday) {
                if (d.lastSeenTime!==d.currenttime) {
                    d.curGrad = rgbToHex(parseInt(d.curGrad, 16) + 5);
                    d.pair = ! d.pair;
                }
                d.curBase = d.pair ? "f0" : "ff";
                d.tableData.rows[i].style.backgroundColor = "#" + d.curBase + d.curBase + d.curGrad;
                todayCounter++;
            }
            d.lastSeenTime = d.currenttime;
        }
        console.log('[logsHighlightToday] '+todayCounter+' logs today');
    },

    logsCleanDates = function (date) {
        var dateCounter = 0;
        parseLogsTable(function(tableData,rowData,i) {
            let nextTd = rowData.item(i).getElementsByTagName('td');
            if (nextTd.length < 2) return false;
            var a = nextTd.item(2).innerHTML;
            var isoDate = dateToIso(a);
            rowData.item(i).getElementsByTagName('td').item(2).innerHTML = '<span title="'+a+'">'+isoDate+'</span>';
            dateCounter++;
        });
        console.log('[logsCleanDates] '+dateCounter+' dates cleaned');
    },

    filterLogs = function (ignoreString) {
        var filter_contains = document.querySelector('#filter_contains').value;
        if (filter_contains==ignoreString) filter_contains = '';
        var filter_does_not_contain = document.querySelector('#filter_does_not_contain').value;
        var tableData = document.getElementsByTagName('table').item(0).getElementsByTagName('tbody').item(0);
        var rowData = tableData.getElementsByTagName('tr');
        var rowCounter = 0;

        document.cookie = "filter_contains="+filter_contains;
        document.cookie = "filter_does_not_contain="+filter_does_not_contain;

        var cookieValue = document.cookie.replace(/(?:(?:^|.*;\s*)test2\s*\=\s*([^;]*).*$)|^.*$/, "$1");

        function alertCookieValue() {
            alert(cookieValue);
        }

        parseLogsTable(function(tableData,rowData,i){
            var a = rowData.item(i).getElementsByTagName('td').item(0).innerHTML;
            var containsDisplayValue=(RegExp(filter_contains).test(a))?"row":"none";
            var finalDisplayValue=(RegExp(filter_does_not_contain).test(a))?"none":containsDisplayValue;
            rowData.item(i).style = 'display:'+finalDisplayValue+';';
            if (finalDisplayValue==='row') rowCounter++;
        });
        console.log('[filterLogs] '+rowCounter+' rows displayed out of '+rowData.length+' with "'+filter_contains+'" without "'+filter_does_not_contain+'"');
        logsHighlightToday();
    },

    rgbToHex = function (rgb) {
        return (rgb < 16 ? "0" : "") + Number(rgb).toString(16);
    },

    parseLogsTable = function (callback) {
        var tableData = document.getElementsByTagName('table').item(0).getElementsByTagName('tbody').item(0);
        var rowData = tableData.getElementsByTagName('tr');
        for(var i = 1; i < rowData.length; i++){
            callback(tableData,rowData,i);
        }
    },

    logsReverseFile = function () {
        var lines = document.getElementsByTagName('pre')[0];
        lines.innerHTML = lines.innerHTML.split("\n").reverse().join("\n");
    },

    logFileCleanDates = function () {
        var preHtml = document.getElementsByTagName('pre')[0];
        var lines = preHtml.innerHTML.split("\n");
        var dateCounter = 0;
        for(var i = 0; i < lines.length; i++){
            if (hasGMT2Date(lines[i])) {
                lines[i] = gmt2ToDatetime(lines[i])
                dateCounter++;
            }
        }
        preHtml.innerHTML = lines.join("\n");
        console.log('[logFileCleanDates] '+dateCounter+' dates cleaned');
    },

    isLogPage = function () {
        return document.getElementsByTagName('table').length === 1;
    },

    isLogFile = function () {
        return document.location.href.substr(-4)==='.log';
    },


    ////////////////////////////////
    //////////// DATES /////////////
    ////////////////////////////////
    // I hate dates

    utcDate = function (date) {
        return new Date(date).toISOString();
    },

    getMonthFromString = function (mon) {
        var month = new Date(Date.parse(mon +" 1, 1980")).getMonth()+1;
        return month < 10 ? "0"+month : month;
    },

    gmtToDatetime = function (date) { // Fri, 30 Mar 2018 14:58:01 GMT
        var a = date.split(" ");
        if (a.length == 6) date = a[3] + getMonthFromString(a[2]) + a[1] + (a[4]||'').replace(/:/g,'');
        return date;
    },

    gmt2ToDatetime = function (line) { // [2018-05-28 10:29:56.831 GMT]
        var date = line.substring(1,28);
        var dateO = new Date(date);
        var timeOffsetInHours = (new Date().getTimezoneOffset()/60) * (-1);
        dateO.setHours(dateO.getHours() + timeOffsetInHours);
        var options = {
            timeZone: "UTC",
            timeZoneName:"short"};
        var dateF = dateO.toLocaleString('fr-FR',options);
        return line.replace(date,dateF);
    },

    utcToDatetime = function (date) { // 27/05/2018 à 11:23:19
        var a = date.split(" ");
        if (a.length == 3) {
            var time = a[2];
            a=a[0].split('/');
            date = a[2] + a[1] + a[0] + time.replace(':','');
        }
        return date;
    },

    isUsDate = function (dateStr) { // 5/1/18 2:04:45 am
        return new RegExp(/\d{1,2}\/\d{1,2}\/\d{2,4}( |&nbsp;)\d{1,2}:\d{1,2}:\d{1,2} [aApP][mM]/).test(dateStr);
    },

    getUsDate = function (str) { // 5/1/18 2:04:45 am
        var matches = str.match(new RegExp(/\d{1,2}\/\d{1,2}\/\d{2,4}( |&nbsp;)\d{1,2}:\d{1,2}:\d{1,2} [aApP][mM]/));
        if (matches==null) return false;
        return matches[0];
    },

    usToUtc = function (date) { // 5/1/18 2:04:45 am
        var newDate = new Date(date);
        newDate.setTime(newDate.getTime() - newDate.getTimezoneOffset()*60000);
        return newDate;
    },

    gmtToUtc = function (date) { // Fri, 30 Mar 2018 14:58:01 GMT
        var newDate = date.split(' ');
        var time = (newDate[4]||'').split(':');
        newDate = new Date(newDate[3],(getMonthFromString(newDate[2])-1),newDate[1],time[0],time[1],time[2],1);
        newDate.setTime(newDate.getTime() - newDate.getTimezoneOffset()*60000);
        return newDate;
    },

    isDateObject = function (o) {
        if (typeof o === 'undefined' || o == '') return false;
        return Object.prototype.toString.call(o) === '[object Date]';
    },

    isGMTDate = function (o) {
        if (typeof o === 'undefined' || o == '') return false;
        return o.indexOf(' GMT') > -1;
    },

    hasGMT2Date = function (o) { // [2018-05-28 10:29:56.831 GMT]
        if (typeof o === 'undefined' || o == '') return false;
        return o.indexOf('[') === 0 && o.indexOf(' GMT]') > -1;
    },

    toDateObject = function (str) {
        str = str.replace('&nbsp;',' ');
        if (isGMTDate(str)) return gmtToUtc(str);
        else if (isUsDate(str)) return usToUtc(str);
        else return str;
    },

    dateToRFC3339 = function (o) {
        if (!isDateObject(o)) o = toDateObject(o);
        if (!isDateObject(o)) return o;
        var newDate = o.getFullYear() + "/" + ('00' + (o.getMonth()+1)).slice(-2) + "/" + ('00' + o.getDate()).slice(-2);
        var newTime = ('00' + o.getHours()).slice(-2) + ":" + ('00' + o.getMinutes()).slice(-2) + ":" + ('00' + o.getSeconds()).slice(-2);
        return newDate + " " + newTime;
    },

    dateToIso = function (o) {
        if (!isDateObject(o)) o = toDateObject(o);
        if (!isDateObject(o)) return o;
        var newDate = ('00' + o.getDate()).slice(-2) + "/" + ('00' + (o.getMonth()+1)).slice(-2) + "/" + o.getFullYear();
        var newTime = ('00' + o.getHours()).slice(-2) + ":" + ('00' + o.getMinutes()).slice(-2) + ":" + ('00' + o.getSeconds()).slice(-2);
        return newDate + " " + newTime;
    },

    getDatetime = function (date) {
        if (date.split(' ').length == 6) return gmtToDatetime(date);
        else return utcToDatetime(date);
    },


    /////////////////////////////
    //////////// BM /////////////
    /////////////////////////////
    // one lib to manage them all


    bmSortCustomPref = function () {

    },

    bmSortSites = function () {
        // re order select drop-down
        var selectList = document.getElementById('SelectedSiteID');
        var options = selectList.getElementsByTagName('option');
        var siteCounter = -1;
        for(let i = 0; i < options.length; i++){
            for(let j = 0; j < options.length - (i + 1); j++){
                let nextA = options.item(j);
                let nextB = options.item(j+1);
                nextA.innerHTML = nextA.innerHTML.replace('-',' ');
                nextB.innerHTML = nextB.innerHTML.replace('-',' ');
                let a = nextA.innerHTML;
                let b = nextB.innerHTML;
                if(a > b && a != "Select a Site") {
                    selectList.insertBefore(nextB,options.item(j));
                }
            }
            siteCounter++;
        }

        // re order site list page
        if (document.getElementsByClassName('overview_title').length
            && document.getElementsByClassName('overview_title')[0].innerHTML == 'Site List') {
            var siteList = document.getElementsByClassName('table_title_description')[0].parentNode.parentNode;
            var trs = siteList.getElementsByClassName('table_detail_link');
            console.dir(trs);
            for(let i = 0; i < trs.length; i++){
                for(let j = 0; j < trs.length - (i + 1); j++){
                    let nextA = trs.item(j);
                    let nextB = trs.item(j+1);
                    nextA.innerHTML = nextA.innerHTML.replace('-',' ');
                    nextB.innerHTML = nextB.innerHTML.replace('-',' ');
                    let a = nextA.innerHTML;
                    let b = nextB.innerHTML;
                    if(a > b) {
                        siteList.insertBefore(nextB.parentNode.parentNode,trs[j].parentNode.parentNode);
                    }
                }
            }
        }
        console.log('[bmSortSites] '+siteCounter+' sites re-ordered');
    },

    bmAddDataRepLinks = function () {
        const allBrands = {'brd': ['QS','RX','DC'], 'bbg': ['BB','RV','EL']};

        if (jQuery('td:contains("Replication Tasks")').length == 0) return;
        let rows = jQuery('td.dep_check:has(input[name=SelectedGroupID])');
        window.clickAllCheckboxAlike = function(checkboxId,brand) {
            if (brand) {
                jQuery('[name="siteHeader_expanded"] tr:contains("'+brand+'") input[value$="'+checkboxId+'"]').click();
            } else {
                jQuery('input[value$="'+checkboxId+'"]').click();
            }
        };
        rows.each(function(){
            if (jQuery(this).closest('table').find('td.main_dep.n.s.e:contains("Global")').length>0) return;
            var checkboxIdArr = jQuery(this).find('input[type=checkbox]').val().split('_');
            checkboxIdArr.shift();
            var checkboxId = checkboxIdArr.join('_');
            var currentBrand = jQuery(this).closest('table').find('tr:nth-child(2)').find('td:nth-child(4)').text().replace('&nbsp;','').split('-');
            var allLink = jQuery('#SelectAll').clone().text("ALL").attr("onclick",'clickAllCheckboxAlike("'+checkboxId+'")');
            jQuery(this).next('td').append(' ').append(allLink);
            if (currentBrand.length == 2) {
                var sameBrandLink = jQuery('#SelectAll').clone().text(currentBrand[0]).attr("onclick",'clickAllCheckboxAlike("'+checkboxId+'","'+currentBrand[0]+'")');
                jQuery(this).next('td').append(' ').append(sameBrandLink);
            }
        });
    },

    bmAddSettingsDirectLink = function () {
        if (jQuery('td:contains("Storefront Sites")').length == 0) return;
        let rows = jQuery(jQuery('td:contains("Select All")').parents('table')[1]).find('tr:has(input[type=checkbox])');
        if (rows.length == 0 ) rows = jQuery(jQuery('td:contains("Select All")').parents('table')[1]).find('tr:has(a)');
        rows.each(function(){
            var link = jQuery(this).find('a.table_detail_link');
            var settingsLink = link.clone().text("Settings").attr("href",link[0].href.replace('ViewChannel','ViewChannelDetails'));
            var cacheLink = link.clone().text("Cache").attr("href",link[0].href.replace('ViewChannel-Edit','ViewChannelPageCache-Start'));
            link.after(cacheLink).after(" - ").after(settingsLink).after(" - ");
        });
        // Open All
        let openAllGeneral = '<a href="" id="a_open_all_general">General</a>';
        let openAllSettings = '<a href="" id="a_open_all_settings">Settings</a>';
        let openAllCache = '<a href="" id="a_open_all_cache">Cache</a>';
        let openAll=function(linkTxt,event){rows.find('a:contains('+linkTxt+')').each(function(){window.open(jQuery(this).attr('href'),'_blank');});};
        jQuery('table td.table_header:contains("Name")').html('Open All ('+rows.length+') '+openAllGeneral+' - '+openAllSettings+' - '+openAllCache);
        jQuery('#a_open_all_general').on('click',function(e){e.preventDefault();openAll('General',e);});
        jQuery('#a_open_all_settings').on('click',function(e){e.preventDefault();openAll('Settings',e);});
        jQuery('#a_open_all_cache').on('click',function(e){e.preventDefault();openAll('Cache',e);});
    },

    bmAddGlobalExportDirectLinks = function () {
        waitForElm('#unitSelection div').then((elm)=>{
            // TOGGLE
            let dataUnitExportSpan = jQuery('.x-panel-header-text:contains("Data Units to Export")');
            if (dataUnitExportSpan.length==0) return;
            let toggleAllFolders = function() {
                let plusButtons = jQuery('.x-tree-elbow-plus');
                let minusButtons = jQuery('.x-tree-elbow-minus');
                if (plusButtons.length > 0) plusButtons.click();
                else if (minusButtons.length > 0) minusButtons.click();
            };
            dataUnitExportSpan.append(' <a href="" id="a_toggle_all_global_export">fold/unfold</a>');
            jQuery('#a_toggle_all_global_export').on('click',(e)=>{e.preventDefault();toggleAllFolders();});

            // CHECK ALL
            var allSubCheckboxes = jQuery('#unitSelection ul ul ul input[type=checkbox]');
            window.clickAllExportCheckbox = function(id) {
                var nameLike = id.split('_').last();
                jQuery('#unitSelection ul ul ul div[ext\\:tree-node-id$='+nameLike+'] input[type=checkbox]').click();
            };
            window.clickAllBrandExportCheckbox = function(id) {
                let nameStart = id.split('-').first();
                let nameEnd = id.split('_').last();
                jQuery('#unitSelection ul ul ul div[ext\\:tree-node-id^='+nameStart+'][ext\\:tree-node-id$='+nameEnd+'] input[type=checkbox]').click();
            };
            allSubCheckboxes.each(function(){
                // <div ext:tree-node-id="SiteExport_QS-AT_ABTestExport" class="x-tree-node-el x-tree-node-leaf "><div class="x-tree-col" style="width:398px;"><span class="x-tree-node-indent"><img src="/on/demandware.static/Sites-Site/-/default/v4e9c6a5f96a8eb3a9b5553af09725016d2b47531/jscript/ext/resources/images/default/s.gif" class="x-tree-elbow-line"><img src="/on/demandware.static/Sites-Site/-/default/v4e9c6a5f96a8eb3a9b5553af09725016d2b47531/jscript/ext/resources/images/default/s.gif" class="x-tree-elbow-line"></span><img src="/on/demandware.static/Sites-Site/-/default/v4e9c6a5f96a8eb3a9b5553af09725016d2b47531/jscript/ext/resources/images/default/s.gif" class="x-tree-ec-icon x-tree-elbow"><img src="/on/demandware.static/Sites-Site/-/default/v4e9c6a5f96a8eb3a9b5553af09725016d2b47531/jscript/ext/resources/images/default/s.gif" class="x-tree-node-icon tree_file_icon" unselectable="on"><input class="x-tree-node-cb" type="checkbox"><span unselectable="on">A/B Tests</span></div><div class="x-tree-col " style="width:398px;"><div class="x-tree-col-text">A/B tests of site "QS-AT"</div></div><div class="x-clear"></div></div>
                let span = jQuery(this).parent().find('span').last();
                let divId = jQuery(span).parent().parent().attr('ext:tree-node-id');
                let brand = divId.split('_')[1].split('-').first();
                let clickAllBrand = ' <a href="" onclick="window.clickAllBrandExportCheckbox(\''+divId+'\')">'+brand+'-only</a>';
                let clickAll = ' <a href="" onclick="window.clickAllExportCheckbox(\''+divId+'\')">ALL</a>';
                span.append(clickAllBrand);
                span.append(clickAll);
            });

        });
    },

    bmCleanDates = function () {//<td class="table_header e s center" nowrap="nowrap">Start</td>
        bmParseTds(function(allTds,i){
            var c = allTds[i].innerHTML;
            if (c.length > 1000) return false; // because some fracking tables in tables in tables ...
            var d = getUsDate(c);
            if (d && isUsDate(d)) {
                var isoDate = '<span title="'+d+'">'+dateToIso(d)+'</span>';
                allTds[i].innerHTML = allTds[i].innerHTML.replace(d,isoDate);
            }
        });
    },

    bmParseTds = function (callback) {
        var allTds = document.getElementsByTagName('td');
        for(var i = 0; i < allTds.length; i++){
            callback(allTds,i);
        }
    },

    bmClickFriendlyMenu = function() {
        /*window.setTimeout(function() {
        var adminClickHandler = jQuery._data(jQuery('.menu.admin .menu-overview-link-icon').get(0), "events").click[0].handler;
        jQuery('ul.bm-site-navigation-menus li').on('click',function(e){
            adminClickHandler(e);
        });
        }, 500);*/


        waitForElm('div.slds-context-bar ul').then((elm) => {
            console.log('here it is !!!');
            //var adminClickHandler = jQuery._data(jQuery('.menu.admin .menu-overview-link-icon').get(0), "events").click[0].handler;
            jQuery('ul.bm-site-navigation-menus li').on('click',function(e){
                //adminClickHandler(e);
                e.preventDefault();
                jQuery(jQuery('ul.bm-site-navigation-menus li')[1]).find('a')[0].click()
            });
        });
    },

    isBmPage = function () {
        return document.getElementsByClassName('header__logo-image').length>0;
    }

    ;

    // time to RUN !!!
    runForestRun();

})();
