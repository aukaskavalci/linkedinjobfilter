// ==UserScript==
// @name         linkedinjobfilter
// @namespace    aysenur90
// @version      0.1
// @homepage     https://github.com/aysenur90
// @description  Job posts are filtered according to their languages and the expert levels.
// @author       Aysenur Kaskavalci
// @match        *://www.linkedin.com/*
// @connect      detectlanguage.com
// @grant        GM_xmlhttpRequest
// @require      https://code.jquery.com/jquery-3.2.1.min.js
// ==/UserScript==

(function() {
    'use strict';
    var api_key = 'a446085c1c1affeec7a99b710daac268';
    var language_url = 'https://ws.detectlanguage.com/0.2/detect';

    var filter_lang = 'en';

    var blacklist = [
        "senior",
        "lead",
        "architect",
        "director",
        "phd",
        "graduation",
        "experienced",
        "internship"
    ];

    var cached_descriptions = {};

    function doFilter() {
        $('.job-card').each(function(index, element, items){
            var self = this;
            if (!($(this).is(":visible"))) return;
            var title = $('.job-card-search__title',this).text().toLowerCase();
            for (var i=0; i<blacklist.length; i++) {
                if (title.includes(blacklist[i])) {
                    $(this).hide();
                    return;
                }
            }
            var description = $('.job-card__description-snippet',this).text();
            //console.log('description: '+description);
            var shouldFetch = (cached_descriptions[self.id] !== 'ready' && description) ? true : false;
            if (shouldFetch) {
                cached_descriptions[self.id] = 'pending';
                var data = new FormData();
                data.append('key', api_key);
                data.append('q', title + ' ' + description);
                GM_xmlhttpRequest({
                    method: "POST",
                    url: language_url,
                    data: data,
                    onload: function(response) {
                        cached_descriptions[self.id] = 'ready';
                        var resp = JSON.parse(response.responseText);
                        if (resp.data.detections.length && !resp.data.detections[0].language.includes(filter_lang)) {
                            //todo make filter on whole response, it can be returned as list.(Also isReliable field on JSON can be use to improve filter mechanism.)
                            $(self).hide();
                        }
                    },
                    onerror: function(response) {
                        console.log('error fetching language: ' + response.responseText);
                    }
                });
            }
        });
    }

    $(document).ready(function() {
        if (window.location.pathname.includes('jobs')) {
            if ($('.job-card').length) {
                setInterval(doFilter, 1000);
            }
        }
    });
})();
