// ==UserScript==
// @name         NGA版主管理增强工具
// @namespace    https://greasyfork.org/zh-CN/scripts/582076-nga%E7%89%88%E4%B8%BB%E7%AE%A1%E7%90%86%E5%A2%9E%E5%BC%BA%E5%B7%A5%E5%85%B7
// @version      1.2.1
// @description  NGA玩家社区网页版版主管理增强工具，包含批量加分等功能模块
// @author       UST
// @match        *://bbs.nga.cn/*
// @match        *://g.nga.cn/*
// @match        *://nga.178.com/*
// @match        *://ngabbs.com/*
// @match        *://ngacn.cc/*
// @license      GPL-3.0
// @icon         http://bbs.nga.cn/favicon.ico
// @downloadURL  https://update.greasyfork.org/scripts/582076/nga%E7%89%88%E4%B8%BB%E7%AE%A1%E7%90%86%E5%A2%9E%E5%BC%BA%E5%B7%A5%E5%85%B7.user.js
// @updateURL    https://update.greasyfork.org/scripts/582076/nga%E7%89%88%E4%B8%BB%E7%AE%A1%E7%90%86%E5%A2%9E%E5%BC%BA%E5%B7%A5%E5%85%B7.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // ===================================
    // 日志工具
    // ===================================
    var LOG_PREFIX = '[NGA版主管理工具]';
    function log(msg, data) {
        console.log(LOG_PREFIX, msg, data || '');
    }
    function logError(msg, err) {
        console.error(LOG_PREFIX, msg, err || '');
    }

    log('脚本已加载');

    // ===================================
    // 注入 CSS (NGA配色风格)
    // ===================================
    var styleEl = document.createElement('style');
    styleEl.textContent = [
        // ---- 遮罩与面板容器 ----
        '#nga-warden-overlay{display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:99999;justify-content:center;align-items:flex-start;padding-top:40px}',
        '#nga-warden-overlay.show{display:flex}',
        '#nga-warden-panel{width:960px;max-width:98vw;max-height:85vh;background:#fdf5e6;border:2px solid #ba8b5a;border-radius:3px;display:flex;flex-direction:column;box-shadow:0 0 20px rgba(0,0,0,0.4);font-family:"Microsoft YaHei","PingFang SC","Helvetica Neue",Arial,sans-serif;font-size:13px;color:#492e1b}',

        // ---- 面板头部 ----
        '#nga-warden-header{background:#492e1b;color:#fdf5e6;padding:8px 14px;display:flex;justify-content:space-between;align-items:center;flex-shrink:0}',
        '#nga-warden-header span{font-size:15px;font-weight:bold}',
        '#nga-warden-close{cursor:pointer;font-size:18px;color:#e0c090;line-height:1}',
        '#nga-warden-close:hover{color:#fff}',

        // ---- 标签页导航 ----
        '#nga-warden-tabs{display:flex;background:#e8d8b8;border-bottom:2px solid #ba8b5a;flex-shrink:0}',
        '#nga-warden-tabs .tab-btn{padding:8px 22px;cursor:pointer;color:#492e1b;font-size:13px;font-weight:bold;border-right:1px solid #c4a87c;background:#e8d8b8;transition:background 0.15s}',
        '#nga-warden-tabs .tab-btn:hover{background:#f0e0c0}',
        '#nga-warden-tabs .tab-btn.active{background:#fdf5e6;border-bottom:2px solid #fdf5e6;margin-bottom:-2px}',

        // ---- 面板主体 ----
        '#nga-warden-body{flex:1;overflow-y:auto;padding:10px}',
        '.warden-page{display:none}',
        '.warden-page.active{display:block}',

        // ---- 设置区块 ----
        '.warden-section{margin-bottom:16px;padding:10px;background:#faf7f0;border:1px solid #d4c5a9;border-radius:2px}',
        '.warden-section h3{font-size:14px;color:#492e1b;margin:0 0 8px 0;padding-bottom:6px;border-bottom:1px solid #d4c5a9}',
        '.warden-section p{font-size:12px;color:#8b6914;margin:4px 0}',

        // ---- 表单行 ----
        '.warden-form-row{display:flex;align-items:center;padding:6px 0;gap:8px;flex-wrap:wrap}',
        '.warden-form-row label{color:#492e1b;font-size:13px;min-width:90px;text-align:right;font-weight:bold}',
        // ---- 开关样式 ----
        '.kw-toggle{position:relative;display:inline-block;width:40px;height:22px;flex-shrink:0}',
        '.kw-toggle input{opacity:0;width:0;height:0}',
        '.kw-slider{position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background-color:#ccc;transition:.2s;border-radius:22px}',
        '.kw-slider:before{position:absolute;content:"";height:16px;width:16px;left:3px;bottom:3px;background-color:#fff;transition:.2s;border-radius:50%}',
        '.kw-toggle input:checked+.kw-slider{background-color:#27ae60}',
        '.kw-toggle input:checked+.kw-slider:before{transform:translateX(18px)}',
        // ---- 表单行中的开关覆盖 ----
        '.warden-form-row .kw-toggle{min-width:0;width:40px;text-align:left;font-weight:normal;flex-shrink:0}',
        '.warden-form-row .warden-input{padding:5px 10px;font-size:13px;border:1px solid #c4a87c;border-radius:2px;color:#492e1b;background:#fff;flex:1;min-width:120px}',
        '.warden-form-row .warden-input:focus{outline:none;border-color:#8b6914;box-shadow:0 0 3px rgba(139,105,20,0.3)}',
        '.warden-form-row .warden-input-short{width:100px;flex:0 0 auto}',
        '.warden-form-row select.warden-input{padding:5px 8px}',

        // ---- 按钮 ----
        '.warden-btn{padding:6px 18px;font-size:13px;font-weight:bold;cursor:pointer;border:1px solid #c4a87c;background:#fdf5e6;color:#6b4e2e;border-radius:2px;white-space:nowrap}',
        '.warden-btn:hover{background:#e8d8b8;border-color:#8b6914}',
        '.warden-btn.primary{background:#492e1b;color:#fdf5e6;border-color:#6b4e2e}',
        '.warden-btn.primary:hover{background:#6b4e2e}',
        '.warden-btn.danger{background:#fadbd8;border-color:#e6a8a0;color:#c0392b}',
        '.warden-btn.danger:hover{background:#f5b7b1}',
        '.warden-btn.success{background:#d5f5e3;border-color:#82b366;color:#1e8449}',
        '.warden-btn.success:hover{background:#abebc6}',
        '.warden-btn.warn{background:#f9e79f;border-color:#d4ac0d;color:#7d6608}',
        '.warden-btn.warn:hover{background:#f5d76e}',
        '.warden-btn:disabled{background:#eee;color:#bbb;border-color:#ddd;cursor:default}',

        // ---- 状态栏 ----
        '#nga-warden-score-status{background:#faf3e6;border:1px solid #d4c5a9;padding:8px 12px;margin-bottom:10px;display:none}',
        '#nga-warden-score-status.running{display:block;background:#fef9e7;border-color:#f9e79f}',
        '#nga-warden-score-status.stopped{display:block;background:#fdedec;border-color:#f5b7b1}',
        '#nga-warden-score-status.done{display:block;background:#eafaf1;border-color:#a9dfbf}',

        // ---- 日志区域 ----
        '#nga-warden-score-log{background:#fff;border:1px solid #d4c5a9;padding:8px;margin-top:8px;max-height:200px;overflow-y:auto;font-size:12px;font-family:Consolas,monospace}',
        '#nga-warden-score-log .log-line{padding:2px 4px;border-bottom:1px solid #f0f0f0}',
        '#nga-warden-score-log .log-line.success{color:#1e8449}',
        '#nga-warden-score-log .log-line.error{color:#c0392b}',
        '#nga-warden-score-log .log-line.info{color:#1a5276}',

        // ---- 快捷预设按钮组 ----
        '.warden-preset-group{display:flex;gap:4px;flex-wrap:wrap;margin-top:4px}',
        '.warden-preset-btn{padding:3px 10px;font-size:11px;cursor:pointer;background:#f0e8d5;border:1px solid #d4c5a9;color:#6b4e2e;border-radius:2px}',
        '.warden-preset-btn:hover{background:#e8d8b8;border-color:#8b6914}',

        // ---- 进度条 ----
        '.warden-progress-bar{width:100%;height:16px;background:#e0cfa6;border-radius:8px;overflow:hidden;margin:4px 0}',
        '.warden-progress-bar .fill{height:100%;background:#492e1b;border-radius:8px;transition:width 0.3s}',

        // ---- 滚动条 ----
        '#nga-warden-body::-webkit-scrollbar{width:8px}',
        '#nga-warden-body::-webkit-scrollbar-track{background:#f5eedb}',
        '#nga-warden-body::-webkit-scrollbar-thumb{background:#c4a87c;border-radius:4px}',

        // ---- 手机端适配 (屏幕宽度 ≤ 768px) ----
        '@media (max-width:768px){',
            '#nga-warden-overlay{padding-top:0;align-items:stretch}',
            '#nga-warden-panel{width:100%;max-width:100%;max-height:100vh;border:none;border-radius:0;font-size:14px}',
            '#nga-warden-header{padding:10px 14px}',
            '#nga-warden-header span{font-size:16px}',
            '#nga-warden-close{font-size:22px;padding:4px}',
            '#nga-warden-tabs .tab-btn{padding:10px 14px;font-size:14px}',
            '#nga-warden-body{padding:8px}',
            '.warden-form-row{flex-direction:column;align-items:stretch}',
            '.warden-form-row label{min-width:auto;text-align:left}',
            '.warden-form-row .warden-input{min-width:auto}',
            '.warden-btn{padding:8px 18px;font-size:13px}',
        '}'
    ].join('\n');
    document.head.appendChild(styleEl);

    // ===================================
    // localStorage 存储键
    // ===================================
    var STORAGE_PREFIX = 'nga_warden_';
    var KEY_SCORE_SETTINGS = STORAGE_PREFIX + 'score_settings';
    var KEY_SCORE_RUNNING = STORAGE_PREFIX + 'score_running';
    var KEY_SCORE_LOG = STORAGE_PREFIX + 'score_log';
    var KEY_APP_SETTINGS = STORAGE_PREFIX + 'app_settings';

    // ===================================
    // 默认设置
    // ===================================
    var DEFAULT_SCORE_SETTINGS = {
        tid: '',           // 目标帖子TID
        scoreValue: '30',  // 加减声望值（正数加分，负数扣分，范围-1500~1500）
        addMoney: false,   // 增加/扣除金钱（默认关闭）
        addPrestige: false,// 增加威望（默认关闭）
        sendPM: true,      // 给作者发送PM（默认开启）
        reason: '',        // 加分理由
        onlyAttachment: false, // 只加分包含附件的楼层
        filterKeywords: '',  // 包含关键词，多个用顿号、分隔
        filterKeywordEnabled: false, // 启用包含关键词加分
        excludeKeywords: '', // 排除关键词，多个用顿号、分隔
        excludeKeywordEnabled: false, // 启用排除关键词加分
        maxPages: 0,       // 加分页数量，包括当前页，0表示不限制
        stopFloor: 0,      // 停止楼层，0表示不限制
        delay: 50          // 每次加分间隔(ms)
    };

    // 评分操作opt位域（来自js_admin.js的adminui.addpoint）
    var OPT_BASE = 4194304;    // act=加减声望模式
    var OPT_MONEY = 1;         // 增加/扣除金钱
    var OPT_PRESTIGE = 2;      // 增加威望
    var OPT_PM = 4;            // 给作者发送PM

    // ===================================
    // 工具函数
    // ===================================
    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    function sleepAsync(ms) {
        return new Promise(function(resolve) {
            setTimeout(resolve, ms);
        });
    }

    function formatTime() {
        var d = new Date();
        var pad = function(n) { return (n < 10 ? '0' : '') + n; };
        return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    }

    // 从URL中解析参数
    function getUrlParam(name) {
        var match = window.location.search.match(new RegExp('[?&]' + name + '=([^&]*)'));
        return match ? decodeURIComponent(match[1]) : null;
    }

    // ===================================
    // 设置管理
    // ===================================
    function loadScoreSettings() {
        try {
            var raw = localStorage.getItem(KEY_SCORE_SETTINGS);
            if (raw) {
                var saved = JSON.parse(raw);
                var result = {};
                for (var k in DEFAULT_SCORE_SETTINGS) {
                    if (DEFAULT_SCORE_SETTINGS.hasOwnProperty(k)) {
                        result[k] = saved.hasOwnProperty(k) ? saved[k] : DEFAULT_SCORE_SETTINGS[k];
                    }
                }
                return result;
            }
        } catch (e) {
            logError('读取设置失败', e);
        }
        return JSON.parse(JSON.stringify(DEFAULT_SCORE_SETTINGS));
    }

    function saveScoreSettings(settings) {
        try {
            localStorage.setItem(KEY_SCORE_SETTINGS, JSON.stringify(settings));
        } catch (e) {
            logError('保存设置失败', e);
        }
    }

    // 运行状态管理（用于跨页面自动继续）
    function loadRunningState() {
        try {
            var raw = localStorage.getItem(KEY_SCORE_RUNNING);
            return raw ? JSON.parse(raw) : null;
        } catch (e) { return null; }
    }

    function saveRunningState(state) {
        try {
            localStorage.setItem(KEY_SCORE_RUNNING, JSON.stringify(state));
        } catch (e) {
            logError('保存运行状态失败', e);
        }
    }

    function clearRunningState() {
        try {
            localStorage.removeItem(KEY_SCORE_RUNNING);
        } catch (e) {}
    }

    // 日志管理
    function loadScoreLog() {
        try {
            var raw = localStorage.getItem(KEY_SCORE_LOG);
            return raw ? JSON.parse(raw) : [];
        } catch (e) { return []; }
    }

    function saveScoreLog(logArr) {
        // 只保留最近200条
        if (logArr.length > 200) {
            logArr = logArr.slice(-200);
        }
        try {
            localStorage.setItem(KEY_SCORE_LOG, JSON.stringify(logArr));
        } catch (e) {}
    }

    function addScoreLogEntry(type, message) {
        var logArr = loadScoreLog();
        logArr.push({
            time: formatTime(),
            type: type, // 'success' | 'error' | 'info'
            message: message
        });
        saveScoreLog(logArr);
        // 同时更新页面上的日志显示
        appendLogToUI(type, message);
    }

    function clearScoreLog() {
        try {
            localStorage.setItem(KEY_SCORE_LOG, JSON.stringify([]));
        } catch (e) {}
    }

    // ===================================
    // 应用设置管理
    // ===================================
    var DEFAULT_APP_SETTINGS = {
        removeLoginBtn: false,   // 删除登录按钮
        enableHideAll: false,    // 一键锁隐作者按钮
        removeWatermark: false,  // 删除NGA水印
        showVotes: false,        // 查看赞踩比
        showPrivateNotes: false  // 显示非公开备注
    };

    function loadAppSettings() {
        try {
            var raw = localStorage.getItem(KEY_APP_SETTINGS);
            if (raw) {
                var saved = JSON.parse(raw);
                var result = {};
                for (var k in DEFAULT_APP_SETTINGS) {
                    if (DEFAULT_APP_SETTINGS.hasOwnProperty(k)) {
                        result[k] = saved.hasOwnProperty(k) ? saved[k] : DEFAULT_APP_SETTINGS[k];
                    }
                }
                return result;
            }
        } catch (e) {}
        return JSON.parse(JSON.stringify(DEFAULT_APP_SETTINGS));
    }

    function saveAppSettings(settings) {
        try {
            localStorage.setItem(KEY_APP_SETTINGS, JSON.stringify(settings));
        } catch (e) {}
    }

    function applyRemoveLoginBtn(enabled) {
        var loginLinks = document.querySelectorAll('a.mmdefault.gray[title="登录"], a.mmdefault[title="登录"]');
        for (var i = 0; i < loginLinks.length; i++) {
            var td = loginLinks[i].parentNode;
            if (td && td.className.indexOf('td') !== -1) {
                td.style.display = enabled ? 'none' : '';
            }
        }
    }

    // 删除NGA水印：清除.c2元素的内联style
    function applyRemoveWatermark() {
        var c2Elements = document.getElementsByClassName('c2');
        for (var i = 0; i < c2Elements.length; i++) {
            c2Elements[i].setAttribute('style', 'vertical-align:top');
        }
    }

    // 查看赞踩比：在每层显示like/dislike计数
    var _votesInjected = false;
    function applyShowVotes() {
        if (_votesInjected) return;
        if (!window.commonui || !commonui.postArg || !commonui.postArg.data) return;
        for (var key in commonui.postArg.data) {
            var ll = document.getElementById('postcontentandsubject' + key);
            if (!ll) { ll = document.getElementById('postcommentcontentandsubject' + key); }
            if (!ll) { ll = document.getElementById('postcomment_' + key); }
            if (!ll) continue;
            var whiteEls = ll.getElementsByClassName('white');
            for (var i = 0; i < whiteEls.length; i++) {
                if (whiteEls[i].getAttribute('title') === '反对') {
                    var span = document.createElement('span');
                    span.innerHTML = '&nbsp;&nbsp;&nbsp;赞:' + commonui.postArg.data[key].score + '&nbsp;/&nbsp;踩:' + commonui.postArg.data[key].score_2;
                    span.classList.add('white');
                    span.title = '只能在有对应版面的权限才能看到这个点踩数';
                    whiteEls[i].parentNode.appendChild(span, whiteEls[i]);
                }
            }
        }
        _votesInjected = true;
    }

    // 显示非公开备注：将版主备注始终可见，修改提示文字
    function applyShowPrivateNotes() {
        // 需要GREATER权限
        if (!window.__GP || !window.__GP.greater) return;

        setTimeout(function() {
            if (document.location.href.indexOf('read.php') !== -1) {
                var blocks = document.querySelectorAll('.block_txt_c3');
                for (var i = 0; i < blocks.length; i++) {
                    if (blocks[i].className === 'block_txt block_txt_c3 nobr' && blocks[i].title.indexOf('公开备注') === -1) {
                        blocks[i].onmouseout = '';
                        blocks[i].title = '非公开的备注 仅版主可见';
                        blocks[i].firstChild.style = '';
                    }
                }
            } else {
                var grayBlocks = document.querySelectorAll('.gray');
                var intent;
                for (var j = 0; j < grayBlocks.length; j++) {
                    if (grayBlocks[j].innerHTML === '版主可见,用户信息备忘,添加/删除备注可能在一天后方能生效') {
                        intent = grayBlocks[j].parentNode.children[1].children[0].children;
                        break;
                    }
                }
                if (!intent) return;
                for (var k = 0; k < intent.length; k++) {
                    if (intent[k].onmouseout !== null) {
                        intent[k].title = '非公开的备注 仅版主可见';
                        intent[k].onmouseout = '';
                        intent[k].firstChild.style = '';
                    }
                }
            }
        }, 100);
    }

    // 一键锁隐作者：在每个楼层注入"锁隐all"按钮
    var _hideAllInjected = false;
    function injectHideAllButtons() {
        if (_hideAllInjected) return;
        // 仅在 read.php 页面且是管理员时注入
        if (!getCurrentTid()) return;
        if (!window.__GP || !window.__GP.admincheck) return;

        var postInfos = document.querySelectorAll('.postInfo');
        if (postInfos.length === 0) return;

        // 取第一个按钮作为模板
        var templateBtn = postInfos[0].querySelector('.small_colored_text_btn.block_txt_c0.stxt');
        if (!templateBtn) return;

        var uidElements = document.getElementsByName('uid');

        for (var i = 0; i < postInfos.length; i++) {
            var pi = postInfos[i];
            // 跳过评论
            if (pi.id && pi.id.indexOf('comment') === 0) continue;

            var fp = pi.parentElement.id; // postInfo{N}
            if (!fp) continue;
            var fpMatch = fp.match(/\d+$/);
            if (!fpMatch) continue;
            var floor = parseInt(fpMatch[0]);
            var uidIdx = floor % 20;
            var uid = '';
            if (uidElements[uidIdx]) {
                uid = (uidElements[uidIdx].textContent || '').trim();
            }
            if (!uid) continue;

            // 克隆按钮
            var btn = templateBtn.cloneNode(true);
            btn.innerHTML = '锁隐all';
            btn.title = '锁隐该用户楼内全部回复';
            btn.style.marginLeft = '0.5em';
            btn.href = 'javascript:void(0)';
            btn.onclick = (function(uidVal, tidVal) {
                return function(e) {
                    e.preventDefault();
                    if (!confirm('将锁隐用户 ' + uidVal + ' 在该楼内的全部回复。是否继续？')) return;
                    executeHideAll(uidVal, tidVal);
                };
            })(uid, getCurrentTid());

            pi.appendChild(btn);
        }
        _hideAllInjected = true;
    }

    // 执行批量锁隐：获取该用户所有PID，批量发送锁隐请求
    function executeHideAll(authorUid, tid) {
        var allPids = [];
        var fid = getCurrentFid();

        function fetchPage(page) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', '/read.php?tid=' + tid + '&authorid=' + authorUid + '&__output=11&page=' + page, true);
            xhr.timeout = 15000;
            xhr.onload = function() {
                if (xhr.status !== 200) { alert('获取回复列表失败'); return; }
                try {
                    var resp = JSON.parse(xhr.responseText);
                    var data = resp.data;
                    if (!data || !data.__R) { alert('解析回复数据失败'); return; }
                    for (var i = 0; i < data.__R.length; i++) {
                        allPids.push(data.__R[i].pid);
                    }
                    // 检查是否还有下一页
                    if (data.__R__ROWS_PAGE && data.__ROWS && data.__R__ROWS_PAGE * page < data.__ROWS) {
                        fetchPage(page + 1);
                    } else {
                        doBatchLockHide(allPids, tid, fid);
                    }
                } catch(e) {
                    alert('解析失败: ' + e.message);
                }
            };
            xhr.onerror = function() { alert('网络请求失败'); };
            xhr.send();
        }

        fetchPage(1);
    }

    // 批量发送锁隐请求
    function doBatchLockHide(pids, tid, fid) {
        var total = pids.length;
        if (total === 0) { alert('未找到该用户的回复'); return; }
        alert('共找到 ' + total + ' 条回复，操作已加入队列。完成之前请勿刷新页面。');

        var processed = 0, errors = 0;

        function processNext(index) {
            if (index >= total) {
                alert('操作完毕！成功' + processed + '条, 失败' + errors + '条。PIDs: ' + pids.join(' '));
                return;
            }
            var pid = pids[index];
            var xhr = new XMLHttpRequest();
            xhr.open('POST', '/nuke.php', true);
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            xhr.timeout = 15000;
            xhr.onload = function() {
                if (xhr.status === 200) {
                    try { var r = JSON.parse(xhr.responseText); if (!r.error) processed++; else errors++; }
                    catch(e) { processed++; }
                } else { errors++; }
                processNext(index + 1);
            };
            xhr.onerror = function() { errors++; processNext(index + 1); };
            xhr.send('__lib=topic_lock&__act=set&ids=' + encodeURIComponent(tid + ',' + pid) +
                     '&ton=0&toff=0&pon=1026&poff=0&pm=0&info=&raw=3');
        }

        processNext(0);
    }

    // ===================================
    // 获取页面参数
    // ===================================
    function getCurrentPage() {
        var page = getUrlParam('page');
        return page ? parseInt(page) : 1;
    }

    function getCurrentTid() {
        var tid = getUrlParam('tid');
        return tid ? parseInt(tid) : 0;
    }

    function getCurrentFid() {
        // 尝试多种方式获取fid
        if (window.__CURRENT_FID) return window.__CURRENT_FID;
        if (typeof commonui !== 'undefined' && commonui.postArg && commonui.postArg.def && commonui.postArg.def.fid) {
            return commonui.postArg.def.fid;
        }
        var fid = getUrlParam('fid');
        if (fid) return parseInt(fid);
        // 从页面meta或隐藏字段获取
        var fidEl = document.querySelector('input[name="fid"]');
        if (fidEl) return parseInt(fidEl.value);
        return 0;
    }

    // 获取当前页面所有楼层信息
    function getCurrentPageFloors() {
        var floors = [];
        // NGA页面结构: postrow或post1strow开头的元素
        var postRows = document.querySelectorAll('[id^="postrow"], [id^="post1strow"]');
        for (var i = 0; i < postRows.length; i++) {
            var row = postRows[i];
            var floorMatch = row.id.match(/\d+$/);
            if (!floorMatch) continue;
            var floor = parseInt(floorMatch[0]);
            // 跳过楼主(floor 0)
            if (floor === 0) continue;
            // 查找pid元素
            var pidEl = row.querySelector('[id^="pid"]');
            if (!pidEl) continue;
            // pid元素的id格式为 "pid12345678" 或 "pid12345678Anchor"
            var pidMatch = pidEl.id.match(/^pid(\d+)/);
            if (!pidMatch) continue;
            var pid = pidMatch[1];
            // 获取回复人用户名
            var username = '';
            var authorEl = row.querySelector('.userlink.author, [id^="postauthor"]');
            if (authorEl) { username = authorEl.textContent || ''; }
            // 检测是否包含附件: postattach{N} 元素存在
            var hasAttachment = !!document.getElementById('postattach' + floor);
            // 获取回复内容文本（用于关键词匹配）
            var postContent = '';
            var contentEl = document.getElementById('postcontent' + floor);
            if (contentEl) { postContent = (contentEl.textContent || '').toLowerCase(); }
            floors.push({ floor: floor, pid: pid, username: username, hasAttachment: hasAttachment, postContent: postContent });
        }
        return floors;
    }

    // ===================================
    // 加分核心引擎
    // ===================================
    var SCORE_ENGINE = {
        isRunning: false,
        stopRequested: false,
        currentPage: 0,
        processedFloors: [],
        settings: null,

        // 构建opt（根据开关设置组合位域，来自js_admin.js的adminui.addpoint）
        buildOpt: function(settings) {
            var opt = OPT_BASE; // act=加减声望模式
            if (settings.addMoney !== false) opt |= OPT_MONEY;
            if (settings.addPrestige !== false) opt |= OPT_PRESTIGE;
            if (settings.sendPM !== false) opt |= OPT_PM;
            return opt;
        },

        // 对单个楼层加分
        scoreFloor: function(pid, floor, fid, tid, opt, reason, valueParam) {
            var self = this;
            return new Promise(function(resolve, reject) {
                var xhr = new XMLHttpRequest();
                xhr.open('POST', '/nuke.php', true);
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                xhr.timeout = 15000;

                // 对加分说明进行UrlEncode编码
                var infoEncoded = encodeURIComponent(reason || '');
                // value参数：自定义声望值（正数加分，负数扣分）
                var scoreValue = valueParam || '0';
                var params = '__lib=add_point_v3&__act=add' +
                    '&opt=' + opt +
                    '&fid=' + encodeURIComponent(fid) +
                    '&tid=' + encodeURIComponent(tid) +
                    '&pid=' + encodeURIComponent(pid) +
                    '&info=' + infoEncoded +
                    '&value=' + encodeURIComponent(scoreValue) +
                    '&raw=3';

                xhr.onload = function() {
                    if (xhr.status === 200) {
                        try {
                            var resp = JSON.parse(xhr.responseText);
                            if (resp.error) {
                                reject(new Error('服务器错误: ' + JSON.stringify(resp.error)));
                            } else {
                                resolve(resp);
                            }
                        } catch (e) {
                            // 非JSON响应，检查是否包含成功标志
                            if (xhr.responseText.indexOf('"error"') === -1) {
                                resolve({ success: true });
                            } else {
                                reject(new Error('响应解析失败'));
                            }
                        }
                    } else {
                        reject(new Error('HTTP ' + xhr.status));
                    }
                };

                xhr.onerror = function() {
                    reject(new Error('网络请求失败'));
                };

                xhr.ontimeout = function() {
                    reject(new Error('请求超时'));
                };

                xhr.send(params);
            });
        },

        // 处理当前页所有楼层
        processCurrentPage: function() {
            var self = this;
            var settings = self.settings;
            var tid = parseInt(settings.tid);
            var fid = getCurrentFid();

            if (!fid) {
                return Promise.reject(new Error('无法获取版块ID(fid)，请确认在NGA论坛页面中运行'));
            }
            if (!tid) {
                return Promise.reject(new Error('请先设置目标帖子TID'));
            }

            // 根据开关构建opt位域
            var opt = self.buildOpt(settings);
            // value参数：自定义声望值
            var scoreValue = settings.scoreValue || '0';

            var floors = getCurrentPageFloors();
            var currentPage = getCurrentPage();
            self.currentPage = currentPage;

            log('当前第' + currentPage + '页，获取到 ' + floors.length + ' 个待处理楼层');

            // 更新面板状态
            updateScoreStatusUI('running', '正在处理第 ' + currentPage + ' 页，共 ' + floors.length + ' 个楼层...');

            // 过滤掉已处理的楼层和超过停止楼层的
            var pendingFloors = [];
            for (var i = 0; i < floors.length; i++) {
                var f = floors[i];
                // 如果设定了停止楼层，跳过超过的
                if (settings.stopFloor > 0 && f.floor > settings.stopFloor) {
                    addScoreLogEntry('info', '楼层#' + f.floor + ' 超出停止楼层，跳过');
                    continue;
                }
                // 如果开启了只加分附件楼层，跳过无附件的
                if (settings.onlyAttachment && !f.hasAttachment) {
                    addScoreLogEntry('info', '楼层#' + f.floor + ' (PID:' + f.pid + ') 不含附件，跳过');
                    continue;
                }
                // 如果开启了关键词筛选，跳过不含关键词的楼层
                if (settings.filterKeywordEnabled && settings.filterKeywords) {
                    var keywords = settings.filterKeywords.split('、');
                    var matched = false;
                    var content = f.postContent || '';
                    for (var ki = 0; ki < keywords.length; ki++) {
                        var kw = keywords[ki].trim().toLowerCase();
                        if (kw && content.indexOf(kw) !== -1) {
                            matched = true;
                            break;
                        }
                    }
                    if (!matched) {
                        addScoreLogEntry('info', '楼层#' + f.floor + ' (PID:' + f.pid + ') 不含指定关键词，跳过');
                        continue;
                    }
                }
                // 如果开启了排除关键词，跳过包含排除关键词的楼层
                if (settings.excludeKeywordEnabled && settings.excludeKeywords) {
                    var exKeywords = settings.excludeKeywords.split('、');
                    var exMatched = false;
                    var exContent = f.postContent || '';
                    for (var ei = 0; ei < exKeywords.length; ei++) {
                        var ekw = exKeywords[ei].trim().toLowerCase();
                        if (ekw && exContent.indexOf(ekw) !== -1) {
                            exMatched = true;
                            break;
                        }
                    }
                    if (exMatched) {
                        addScoreLogEntry('info', '楼层#' + f.floor + ' (PID:' + f.pid + ') 命中排除关键词，跳过');
                        continue;
                    }
                }
                // 跳过已处理的
                if (self.processedFloors.indexOf(f.floor) >= 0) {
                    addScoreLogEntry('info', '楼层#' + f.floor + ' (PID:' + f.pid + ') 已处理，跳过');
                    continue;
                }
                pendingFloors.push(f);
            }

            if (pendingFloors.length === 0) {
                addScoreLogEntry('info', '第' + currentPage + '页没有待处理楼层');
                return Promise.resolve({ noFloors: true });
            }

            // 顺序处理每个楼层
            var result = { processed: 0, errors: 0, reachedStopFloor: false };

            function processNext(index) {
                if (index >= pendingFloors.length) {
                    return Promise.resolve(result);
                }
                if (self.stopRequested) {
                    addScoreLogEntry('info', '用户手动停止');
                    return Promise.resolve(result);
                }

                var floor = pendingFloors[index];

                addScoreLogEntry('info', '正在加分: 楼层#' + floor.floor + ' (PID:' + floor.pid + ')...');

                return self.scoreFloor(floor.pid, floor.floor, fid, tid, opt, settings.reason, scoreValue)
                    .then(function(resp) {
                        addScoreLogEntry('success', '楼层#' + floor.floor + ' (PID:' + floor.pid + ') 加分成功!');
                        self.processedFloors.push(floor.floor);
                        result.processed++;

                        // 更新运行状态（仅增量更新已处理楼层，保留其他字段）
                        var curRS = loadRunningState();
                        saveRunningState({
                            tid: tid,
                            currentPage: currentPage,
                            startPage: curRS ? curRS.startPage : currentPage,
                            processedFloors: self.processedFloors,
                            processedCount: (curRS ? (curRS.processedCount || 0) : 0) + 1,
                            lastFloorSet: curRS ? (curRS.lastFloorSet || '') : ''
                        });

                        // 检查是否到达停止楼层
                        if (settings.stopFloor > 0 && floor.floor >= settings.stopFloor) {
                            addScoreLogEntry('info', '已到达停止楼层#' + settings.stopFloor + '，停止加分');
                            result.reachedStopFloor = true;
                            return result;
                        }

                        // 间隔延迟
                        return sleepAsync(settings.delay).then(function() {
                            if (self.stopRequested) {
                                return result;
                            }
                            return processNext(index + 1);
                        });
                    })
                    .catch(function(err) {
                        addScoreLogEntry('error', '楼层#' + floor.floor + ' (PID:' + floor.pid + ') 加分失败: ' + err.message);
                        result.errors++;

                        // 出错后也延迟再继续
                        return sleepAsync(settings.delay).then(function() {
                            if (self.stopRequested) {
                                return result;
                            }
                            return processNext(index + 1);
                        });
                    });
            }

            return processNext(0);
        },

        // 导航到指定TID的指定页
        navigateToPage: function(tid, page) {
            var url = '/read.php?tid=' + tid + '&page=' + page;
            log('跳转到: ' + url);
            window.location.href = url;
        },

        // 启动批量加分
        start: function(settings) {
            var self = this;
            self.settings = settings;
            self.isRunning = true;
            self.stopRequested = false;
            self.processedFloors = [];
            self.currentPage = 0;

            // 清除旧日志（每次启动新加分任务时清空日志）
            clearScoreLog();
            clearLogUI();

            // 保存设置
            saveScoreSettings(settings);

            // 显示状态栏
            updateScoreStatusUI('running', '准备开始批量加分...');

            addScoreLogEntry('info', '========== 批量加分开始 ==========');
            addScoreLogEntry('info', '目标TID: ' + settings.tid);
            var startOpt = self.buildOpt(settings);
            addScoreLogEntry('info', '声望值: ' + settings.scoreValue);
            addScoreLogEntry('info', '加分opt: ' + startOpt + ' (金钱:' + (settings.addMoney !== false) + ' 威望:' + (settings.addPrestige !== false) + ' PM:' + (settings.sendPM !== false) + ')');
            addScoreLogEntry('info', '加分理由: ' + (settings.reason || '(未设置)'));
            if (settings.maxPages > 0) {
                addScoreLogEntry('info', '加分页数量: ' + settings.maxPages);
            }
            if (settings.stopFloor > 0) {
                addScoreLogEntry('info', '停止楼层: #' + settings.stopFloor);
            }

            // 确定起始页：如果在目标帖子页面则从当前页开始，否则跳转到第1页
            var currentTid = getCurrentTid();
            var startPage = 1;
            if (currentTid === parseInt(settings.tid)) {
                startPage = getCurrentPage() || 1;
                addScoreLogEntry('info', '当前已在目标帖子，从第' + startPage + '页开始加分');
            } else {
                addScoreLogEntry('info', '不在目标帖子，跳转到第1页开始...');
            }

            saveRunningState({
                tid: parseInt(settings.tid),
                currentPage: startPage,
                startPage: startPage,
                processedFloors: [],
                processedCount: 0,
                startTime: Date.now()
            });

            self.navigateToPage(settings.tid, startPage);
            // 页面跳转后会通过resume自动继续
        },

        // 页面循环处理
        // currentPage: 当前URL所在的页码
        // startPage: 批量加分起始页码
        _runPageLoop: function(tid, currentPage, startPage) {
            var self = this;
            var settings = self.settings;

            function processPage() {
                if (self.stopRequested) {
                    self.isRunning = false;
                    clearRunningState();
                    updateScoreStatusUI('stopped', '批量加分已手动停止');
                    addScoreLogEntry('info', '========== 批量加分已停止 ==========');
                    updateControlButtons(false);
                    return;
                }

                // 检查页数限制: 包括当前页在内共加N页
                if (settings.maxPages > 0 && currentPage > startPage + settings.maxPages - 1) {
                    self.isRunning = false;
                    clearRunningState();
                    updateScoreStatusUI('done', '批量加分完成！已达到加分页数量(' + settings.maxPages + '页，起始' + startPage + '→' + (startPage + settings.maxPages - 1) + '页)');
                    addScoreLogEntry('info', '========== 批量加分完成(达到页数限制) ==========');
                    updateControlButtons(false);
                    scheduleScorePageRefresh();
                    return;
                }

                self.currentPage = currentPage;
                updateScoreStatusUI('running', '正在处理第 ' + currentPage + ' 页 (起始第' + startPage + '页, 共加' + (settings.maxPages || '∞') + '页)...');
                addScoreLogEntry('info', '--- 开始处理第 ' + currentPage + ' 页 ---');

                // 更新运行状态（保留lastFloorSet防止被覆盖丢失）
                var prevRS = loadRunningState();
                saveRunningState({
                    tid: tid,
                    currentPage: currentPage,
                    startPage: startPage,
                    processedFloors: self.processedFloors,
                    processedCount: prevRS ? (prevRS.processedCount || 0) : 0,
                    lastFloorSet: prevRS ? (prevRS.lastFloorSet || '') : ''
                });

                self.processCurrentPage()
                    .then(function(result) {
                        if (self.stopRequested) {
                            self.isRunning = false;
                            clearRunningState();
                            updateScoreStatusUI('stopped', '批量加分已手动停止');
                            updateControlButtons(false);
                            return;
                        }

                        if (result.reachedStopFloor) {
                            self.isRunning = false;
                            clearRunningState();
                            updateScoreStatusUI('done', '批量加分完成！已到达指定楼层');
                            addScoreLogEntry('info', '========== 批量加分完成(到达停止楼层) ==========');
                            updateControlButtons(false);
                            scheduleScorePageRefresh();
                            return;
                        }

                        addScoreLogEntry('info', '第 ' + currentPage + ' 页处理完成: 成功' + result.processed + '条, 失败' + result.errors + '条');

                        // 检查页数限制（当前页处理完后检查: 包括起始页共maxPages页）
                        if (settings.maxPages > 0 && currentPage - startPage + 1 >= settings.maxPages) {
                            self.isRunning = false;
                            clearRunningState();
                            updateScoreStatusUI('done', '批量加分完成！已达到加分页数量(' + settings.maxPages + '页，起始' + startPage + '→' + currentPage + '页)');
                            addScoreLogEntry('info', '========== 批量加分完成(达到页数限制) ==========');
                            updateControlButtons(false);
                            scheduleScorePageRefresh();
                            return;
                        }

                        // 检查是否有更多页/是否已过最后一页
                        var floors = getCurrentPageFloors();
                        // 情况1: 页面完全没有楼层
                        if (floors.length === 0) {
                            self.isRunning = false;
                            clearRunningState();
                            updateScoreStatusUI('done', '批量加分完成！已处理到最后一页');
                            addScoreLogEntry('info', '========== 批量加分完成(已到最后一页) ==========');
                            updateControlButtons(false);
                            scheduleScorePageRefresh();
                            return;
                        }
                        // 情况2: 页面内容与上一页完全相同（NGA将超范围page返回最后一页）
                        // 比较当前页与上一页的楼层集合，若完全一致则已到底
                        var prevFloorSet = (loadRunningState() || {}).lastFloorSet || '';
                        var curFloorSet = floors.map(function(f) { return f.floor; }).sort(function(a, b) { return a - b; }).join(',');
                        if (prevFloorSet && prevFloorSet === curFloorSet) {
                            self.isRunning = false;
                            clearRunningState();
                            updateScoreStatusUI('done', '批量加分完成！已到达最后一页');
                            addScoreLogEntry('info', '========== 批量加分完成(最后一页,页面内容重复) ==========');
                            updateControlButtons(false);
                            scheduleScorePageRefresh();
                            return;
                        }

                        // 检查是否所有楼层都已超过停止楼层
                        if (settings.stopFloor > 0) {
                            var allBeyond = true;
                            for (var i = 0; i < floors.length; i++) {
                                if (floors[i].floor <= settings.stopFloor) {
                                    allBeyond = false;
                                    break;
                                }
                            }
                            if (allBeyond) {
                                self.isRunning = false;
                                clearRunningState();
                                updateScoreStatusUI('done', '批量加分完成！所有楼层均超过停止楼层');
                                addScoreLogEntry('info', '========== 批量加分完成(超过停止楼层) ==========');
                                updateControlButtons(false);
                                scheduleScorePageRefresh();
                                return;
                            }
                        }

                        // 更新运行状态为下一页，然后跳转
                        var nextPage = currentPage + 1;
                        // 保存当前页楼层集合签名，用于下一页检测内容是否重复（防死循环）
                        var curFloors = getCurrentPageFloors();
                        var curSet = curFloors.map(function(f) { return f.floor; }).sort(function(a, b) { return a - b; }).join(',');
                        saveRunningState({
                            tid: tid,
                            currentPage: nextPage,
                            startPage: startPage,
                            processedFloors: self.processedFloors,
                            processedCount: (loadRunningState() ? (loadRunningState().processedCount || 0) : 0),
                            lastFloorSet: curSet
                        });
                        addScoreLogEntry('info', '正在跳转到第 ' + nextPage + ' 页...');
                        self.navigateToPage(tid, nextPage);
                    })
                    .catch(function(err) {
                        addScoreLogEntry('error', '处理第' + currentPage + '页时出错: ' + err.message);
                        self.isRunning = false;
                        clearRunningState();
                        updateScoreStatusUI('stopped', '批量加分出错: ' + err.message);
                        updateControlButtons(false);
                    });
            }

            processPage();
        },

        // 恢复批量加分（页面加载后自动调用）
        resume: function() {
            var self = this;
            var runningState = loadRunningState();
            if (!runningState) return false;

            var settings = loadScoreSettings();
            self.settings = settings;

            var currentTid = getCurrentTid();
            if (currentTid !== runningState.tid) {
                // 不在目标帖子页面，可能是用户手动导航走了，等待用户返回
                log('当前页面TID(' + currentTid + ')与目标TID(' + runningState.tid + ')不匹配，等待用户返回');
                return false;
            }

            // 使用URL中的当前页码（我们已经导航到这个页面了）
            var currentPageFromUrl = getCurrentPage();
            var resumePage = currentPageFromUrl || runningState.currentPage || 1;
            var startPage = runningState.startPage || resumePage;

            self.isRunning = true;
            self.stopRequested = false;
            self.processedFloors = runningState.processedFloors || [];
            self.currentPage = resumePage;

            addScoreLogEntry('info', '========== 恢复批量加分 ==========');
            addScoreLogEntry('info', '继续处理第 ' + resumePage + ' 页 (起始页' + startPage + ')');

            // 仅当面板已打开时才更新UI状态（防止自动弹出面板）
            updateScoreStatusUI('running', '正在恢复批量加分...');
            updateControlButtons(true);

            // 继续从当前页处理
            self._runPageLoop(runningState.tid, resumePage, startPage);
            return true;
        },

        // 停止批量加分
        stop: function() {
            this.stopRequested = true;
            this.isRunning = false;
            clearRunningState();
            updateScoreStatusUIForce('stopped', '正在停止...');
            addScoreLogEntry('info', '========== 收到停止指令 ==========');
            updateControlButtonsForce(false);
        }
    };

    // 加分完成后刷新页面（延迟2秒，等最后的请求完成）
    function scheduleScorePageRefresh() {
        setTimeout(function() {
            window.location.reload();
        }, 2000);
    }

    // ===================================
    // 贴内批量操作引擎
    // ===================================
    var REPLY_ENGINE = {
        isRunning: false,
        stopRequested: false,
        replyList: [],       // { tid, pid, floor, checked }
        currentIndex: 0,

        // 扫描当前页面所有回复
        scanReplies: function() {
            var self = this;
            self.replyList = [];
            var tid = getCurrentTid();

            if (!tid) {
                addReplyLogEntry('error', '当前页面没有检测到TID，请在帖子页面中使用');
                return [];
            }

            // 获取当前页面所有楼层
            var floors = getCurrentPageFloors();
            for (var i = 0; i < floors.length; i++) {
                self.replyList.push({
                    tid: tid,
                    pid: floors[i].pid,
                    floor: floors[i].floor,
                    checked: true
                });
            }

            addReplyLogEntry('info', '扫描完成：共找到 ' + self.replyList.length + ' 个回复楼层');
            return self.replyList;
        },

        // 对单个回复执行锁隐/锁定/隐藏/编辑/下沉/审核操作
        lockReply: function(tid, pid, pon, poff) {
            return new Promise(function(resolve, reject) {
                var xhr = new XMLHttpRequest();
                xhr.open('POST', '/nuke.php', true);
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                xhr.timeout = 15000;

                var params = '__lib=topic_lock&__act=set' +
                    '&ids=' + encodeURIComponent(tid + ',' + pid) +
                    '&ton=0&toff=0' +
                    '&pon=' + (pon || 0) +
                    '&poff=' + (poff || 0) +
                    '&pm=0&info=&raw=3';

                xhr.onload = function() {
                    if (xhr.status === 200) {
                        try {
                            var resp = JSON.parse(xhr.responseText);
                            if (resp.error) {
                                reject(new Error(JSON.stringify(resp.error)));
                            } else {
                                resolve(resp);
                            }
                        } catch (e) {
                            if (xhr.responseText.indexOf('"error"') === -1) {
                                resolve({ success: true });
                            } else {
                                reject(new Error('响应解析失败'));
                            }
                        }
                    } else {
                        reject(new Error('HTTP ' + xhr.status));
                    }
                };
                xhr.onerror = function() { reject(new Error('网络请求失败')); };
                xhr.ontimeout = function() { reject(new Error('请求超时')); };
                xhr.send(params);
            });
        },

        // 执行批量操作
        execute: function(checkedList, pon, poff, delay) {
            var self = this;
            self.isRunning = true;
            self.stopRequested = false;
            self.currentIndex = 0;

            var total = checkedList.length;
            var processed = 0;
            var errors = 0;

            // 取操作码对应的名称
            var opCode = pon || poff || 0;
            var opNames = {1026:'锁定隐藏', 1024:'单锁定', 2:'单隐藏', 128:'编辑', 16777216:'下沉', 512:'审核', 16384:'屏蔽'};
            var opName = (opNames[opCode] || ('码=' + opCode)) + (pon ? '[操作]' : '[解除]');

            updateReplyStatusUI('running', '正在执行' + opName + '... (0/' + total + ')');
            addReplyLogEntry('info', '========== 开始批量操作 ==========');
            addReplyLogEntry('info', '操作类型: ' + opName + ' (pon=' + pon + ' poff=' + poff + ')');
            addReplyLogEntry('info', '目标数量: ' + total + ' 个回复');

            function processNext(index) {
                if (index >= total || self.stopRequested) {
                    self.isRunning = false;
                    if (self.stopRequested) {
                        updateReplyStatusUI('stopped', '操作已手动停止 (完成' + processed + '/失败' + errors + ')');
                        addReplyLogEntry('info', '========== 操作已停止 ==========');
                    } else {
                        updateReplyStatusUI('done', '操作完成！成功' + processed + '条, 失败' + errors + '条');
                        addReplyLogEntry('info', '========== 操作完成 ==========');
                    }
                    updateReplyButtons(false);
                    return;
                }

                var item = checkedList[index];
                self.currentIndex = index;
                updateReplyStatusUI('running', '正在' + opName + ': PID=' + item.pid + ' 楼层#' + item.floor + ' (' + (index + 1) + '/' + total + ')');

                return self.lockReply(item.tid, item.pid, pon, poff)
                    .then(function() {
                        processed++;
                        addReplyLogEntry('success', 'PID=' + item.pid + ' 楼层#' + item.floor + ' ' + opName + '成功');
                        return sleepAsync(delay).then(function() {
                            return processNext(index + 1);
                        });
                    })
                    .catch(function(err) {
                        errors++;
                        addReplyLogEntry('error', 'PID=' + item.pid + ' 楼层#' + item.floor + ' ' + opName + '失败: ' + err.message);
                        return sleepAsync(delay).then(function() {
                            return processNext(index + 1);
                        });
                    });
            }

            processNext(0);
        },

        stop: function() {
            this.stopRequested = true;
            this.isRunning = false;
            updateReplyStatusUI('stopped', '正在停止...');
            addReplyLogEntry('info', '========== 收到停止指令 ==========');
            updateReplyButtons(false);
        }
    };

    // 贴内批量操作日志
    function addReplyLogEntry(type, message) {
        var logEl = document.getElementById('nga-warden-reply-log');
        if (!logEl) return;
        var line = document.createElement('div');
        line.className = 'log-line ' + type;
        line.textContent = '[' + formatTime() + '] ' + message;
        logEl.appendChild(line);
        logEl.scrollTop = logEl.scrollHeight;
    }

    function clearReplyLogUI() {
        var logEl = document.getElementById('nga-warden-reply-log');
        if (logEl) logEl.innerHTML = '';
    }

    function updateReplyStatusUI(state, message) {
        if (!isPanelVisible()) return;
        var statusEl = document.getElementById('nga-warden-reply-status');
        var textEl = document.getElementById('warden-reply-status-text');
        var countEl = document.getElementById('warden-reply-status-count');
        if (statusEl) {
            statusEl.className = state;
            statusEl.style.display = 'block';
        }
        if (textEl) textEl.textContent = message;
        if (countEl && REPLY_ENGINE.isRunning) {
            countEl.textContent = '进度: ' + (REPLY_ENGINE.currentIndex + 1) + '/' + REPLY_ENGINE.replyList.length;
        }
    }

    function updateReplyButtons(isRunning) {
        if (!isPanelVisible()) return;
        var execBtn = document.getElementById('warden-btn-execute-reply');
        var stopBtn = document.getElementById('warden-btn-stop-reply');
        if (execBtn) execBtn.disabled = isRunning;
        if (stopBtn) stopBtn.disabled = !isRunning;
    }

    function renderReplyList(replies) {
        var container = document.getElementById('warden-reply-list');
        var countEl = document.getElementById('warden-reply-count');
        if (!container) return;

        if (replies.length === 0) {
            container.innerHTML = '<span style="color:#8b6914;">未找到回复楼层</span>';
            if (countEl) countEl.textContent = '0';
            return;
        }

        if (countEl) countEl.textContent = replies.length;

        var html = '';
        for (var i = 0; i < replies.length; i++) {
            var r = replies[i];
            html += '<label style="display:flex;align-items:center;padding:3px 4px;cursor:pointer;border-bottom:1px solid #f0f0f0;font-size:12px;">';
            html += '<input type="checkbox" class="warden-reply-checkbox" data-index="' + i + '"' + (r.checked ? ' checked' : '') + ' style="margin-right:6px;">';
            html += '<span style="color:#1a5276;">楼层#' + r.floor + '</span>';
            html += '<span style="color:#8b6914;margin-left:8px;">PID:' + r.pid + '</span>';
            html += '<span style="color:#6b4e2e;margin-left:8px;">TID:' + r.tid + '</span>';
            html += '</label>';
        }
        container.innerHTML = html;

        // 启用执行按钮
        var execBtn = document.getElementById('warden-btn-execute-reply');
        if (execBtn) execBtn.disabled = false;
    }

    function getCheckedReplies() {
        var checkboxes = document.querySelectorAll('.warden-reply-checkbox');
        var checked = [];
        for (var i = 0; i < checkboxes.length; i++) {
            if (checkboxes[i].checked) {
                var idx = parseInt(checkboxes[i].getAttribute('data-index'));
                if (REPLY_ENGINE.replyList[idx]) {
                    checked.push(REPLY_ENGINE.replyList[idx]);
                }
            }
        }
        return checked;
    }

    function selectAllReplies(checked) {
        var checkboxes = document.querySelectorAll('.warden-reply-checkbox');
        for (var i = 0; i < checkboxes.length; i++) {
            checkboxes[i].checked = checked;
        }
    }

    // ===================================
    // UI: 创建主面板
    // ===================================
    function createPanel() {
        log('创建面板DOM');
        var overlay = document.createElement('div');
        overlay.id = 'nga-warden-overlay';
        overlay.innerHTML =
            '<div id="nga-warden-panel">' +
                '<div id="nga-warden-header">' +
                    '<span>NGA版主管理增强工具</span>' +
                    '<span id="nga-warden-close" title="关闭">✕</span>' +
                '</div>' +
                '<div id="nga-warden-tabs">' +
                    '<div class="tab-btn active" data-tab="0">批量加分</div>' +
                    '<div class="tab-btn" data-tab="1">贴内批量操作</div>' +
                    '<div class="tab-btn" data-tab="2">用户回复操作</div>' +
                    '<div class="tab-btn" data-tab="3">设置</div>' +
                '</div>' +
                '<div id="nga-warden-body">' +
                    // ---- 页面0: 批量加分 ----
                    '<div class="warden-page active" data-page="0">' +
                        createBatchScorePageHTML() +
                    '</div>' +
                    // ---- 页面1: 贴内批量操作 ----
                    '<div class="warden-page" data-page="1">' +
                        createReplyOpsPageHTML() +
                    '</div>' +
                    // ---- 页面2: 用户回复操作 ----
                    '<div class="warden-page" data-page="2">' +
                        createUserReplyPageHTML() +
                    '</div>' +
                    // ---- 页面3: 设置 ----
                    '<div class="warden-page" data-page="3">' +
                        '<div class="warden-section">' +
                            '<h3>设置</h3>' +
                            '<div class="warden-form-row">' +
                                '<label>删除登录按钮:</label>' +
                                '<label class="kw-toggle" style="flex:0 0 auto;">' +
                                    '<input type="checkbox" id="warden-setting-remove-login">' +
                                    '<span class="kw-slider"></span>' +
                                '</label>' +
                                '<span style="font-size:11px;color:#8b6914;">开启后移除导航栏中的"登录"按钮</span>' +
                            '</div>' +
                            '<div class="warden-form-row">' +
                                '<label>一键锁隐作者:</label>' +
                                '<label class="kw-toggle" style="flex:0 0 auto;">' +
                                    '<input type="checkbox" id="warden-setting-hideall">' +
                                    '<span class="kw-slider"></span>' +
                                '</label>' +
                                '<span style="font-size:11px;color:#8b6914;">每个楼层添加"锁隐all"按钮，一键锁隐该用户楼内全部回复</span>' +
                            '</div>' +
                            '<div class="warden-form-row">' +
                                '<label>删除NGA水印:</label>' +
                                '<label class="kw-toggle" style="flex:0 0 auto;">' +
                                    '<input type="checkbox" id="warden-setting-watermark">' +
                                    '<span class="kw-slider"></span>' +
                                '</label>' +
                                '<span style="font-size:11px;color:#8b6914;">开启后清除.c2元素内联样式，移除NGA页面的水印</span>' +
                            '</div>' +
                            '<div class="warden-form-row">' +
                                '<label>查看赞踩比:</label>' +
                                '<label class="kw-toggle" style="flex:0 0 auto;">' +
                                    '<input type="checkbox" id="warden-setting-votes">' +
                                    '<span class="kw-slider"></span>' +
                                '</label>' +
                                '<span style="font-size:11px;color:#8b6914;">开启后每个楼层显示赞/踩计数（需在read.php页面使用）</span>' +
                            '</div>' +
                            '<div class="warden-form-row">' +
                                '<label>显示非公开备注:</label>' +
                                '<label class="kw-toggle" style="flex:0 0 auto;">' +
                                    '<input type="checkbox" id="warden-setting-notes">' +
                                    '<span class="kw-slider"></span>' +
                                '</label>' +
                                '<span style="font-size:11px;color:#8b6914;">将版主备注始终可见，无需鼠标悬停（需GREATER权限）</span>' +
                            '</div>' +
                        '</div>' +
                        '<div class="warden-section">' +
                            '<h3>关于</h3>' +
                            '<div class="settings-row"><span class="settings-label">NGA版主管理增强工具</span></div>' +
                            '<div class="settings-row"><span class="settings-label">源代码Github仓库：</span><span class="settings-value"><a href="https://github.com/drpasserby/NGA_WardenTool" target="_blank">NGA_WardenTool</a></span></div>'+
                            '<div class="settings-row"><span class="settings-label">开发者：</span><span class="settings-value"><a href="https://bbs.nga.cn/nuke.php?func=ucp&uid=62716817" target="_blank">UST</a>/<a href="http://wulvxinchen.cn/" target="_blank">WLXC</a></span></div>'
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';
        document.body.appendChild(overlay);
        log('面板DOM已创建');
        return overlay;
    }

    function createBatchScorePageHTML() {
        var html = '';
        html += '<div class="warden-section">';
        html += '<h3>批量加分设置</h3>';

        // TID
        html += '<div class="warden-form-row">';
        html += '<label>TID (帖子ID):</label>';
        html += '<input type="text" class="warden-input" id="warden-score-tid" placeholder="输入目标帖子TID" title="要加分的帖子ID，可从URL中获取(如read.php?tid=123456)">';
        html += '<button class="warden-btn" id="warden-btn-get-tid" title="自动获取当前页面的帖子TID" style="flex:0 0 auto;">获取TID</button>';
        html += '</div>';

        // 声望值（自定义加减）
        html += '<div class="warden-form-row">';
        html += '<label>声望值:</label>';
        html += '<input type="number" class="warden-input warden-input-short" id="warden-score-value" value="30" min="-1500" max="1500" step="1" title="正数加分，负数扣分，范围-1500~1500">';
        html += '<span style="font-size:11px;color:#8b6914;">正数=加分，负数=扣分 (-1500~1500)</span>';
        html += '</div>';

        // 增加/扣除金钱 开关
        html += '<div class="warden-form-row">';
        html += '<label>增加/扣除金钱:</label>';
        html += '<label class="kw-toggle" style="flex:0 0 auto;">';
        html += '<input type="checkbox" id="warden-score-money">';
        html += '<span class="kw-slider"></span>';
        html += '</label>';
        html += '<span style="font-size:11px;color:#8b6914;">100声望合1金币，扣减声望时可扣除金钱</span>';
        html += '</div>';

        // 增加威望 开关
        html += '<div class="warden-form-row">';
        html += '<label>增加威望:</label>';
        html += '<label class="kw-toggle" style="flex:0 0 auto;">';
        html += '<input type="checkbox" id="warden-score-prestige">';
        html += '<span class="kw-slider"></span>';
        html += '</label>';
        html += '<span style="font-size:11px;color:#8b6914;">150声望合1威望</span>';
        html += '</div>';

        // 给作者发送PM 开关
        html += '<div class="warden-form-row">';
        html += '<label>给作者发送PM:</label>';
        html += '<label class="kw-toggle" style="flex:0 0 auto;">';
        html += '<input type="checkbox" id="warden-score-pm" checked>';
        html += '<span class="kw-slider"></span>';
        html += '</label>';
        html += '</div>';

        // 加分理由
        html += '<div class="warden-form-row">';
        html += '<label>加分说明:</label>';
        html += '<input type="text" class="warden-input" id="warden-score-reason" placeholder="输入加分说明" title="将被记录在加分操作的info字段中">';
        html += '<span style="font-size:11px;color:#c0392b;">使用中文可能会有乱码</span>';
        html += '</div>';

        // 加分间隔
        html += '<div class="warden-form-row">';
        html += '<label>加分间隔(ms):</label>';
        html += '<input type="number" class="warden-input warden-input-short" id="warden-score-delay" value="50" min="50" max="5000" step="50" title="每次加分之间的延迟时间，建议50-1000ms">';
        html += '<span style="font-size:11px;color:#8b6914;">建议50-1000ms，太快可能被限制</span>';
        html += '</div>';

        // 停止条件
        html += '<div class="warden-form-row">';
        html += '<label>加分页数量:</label>';
        html += '<input type="number" class="warden-input warden-input-short" id="warden-score-maxpages" value="0" min="0" title="包括当前页在内共加N页，0表示不限制">';
        html += '<span style="font-size:11px;color:#8b6914;">0=不限制，设为N则加N页后停止</span>';
        html += '</div>';

        html += '<div class="warden-form-row">';
        html += '<label>停止楼层:</label>';
        html += '<input type="number" class="warden-input warden-input-short" id="warden-score-stopfloor" value="0" min="0" title="加到该楼层后自动停止，0表示不限制">';
        html += '<span style="font-size:11px;color:#8b6914;">0=不限制，设为N则加到第N层停止</span>';
        html += '</div>';

        html += '</div>'; // end warden-section

        // 高级设置
        html += '<div class="warden-section">';
        html += '<h3>高级设置</h3>';
        html += '<div class="warden-form-row">';
        html += '<label>只加分含附件楼层:</label>';
        html += '<label class="kw-toggle" style="flex:0 0 auto;">';
        html += '<input type="checkbox" id="warden-score-only-attach">';
        html += '<span class="kw-slider"></span>';
        html += '</label>';
        html += '<span style="font-size:11px;color:#8b6914;">开启后仅对包含附件的楼层加分（只有图片无附件不算,防止表情包刷分）</span>';
        html += '</div>';

        // 关键词筛选
        html += '<div class="warden-form-row">';
        html += '<label>包含关键词加分:</label>';
        html += '<label class="kw-toggle" style="flex:0 0 auto;">';
        html += '<input type="checkbox" id="warden-score-filter-keyword">';
        html += '<span class="kw-slider"></span>';
        html += '</label>';
        html += '<span style="font-size:11px;color:#8b6914;">开启后仅对包含指定关键词的楼层加分</span>';
        html += '</div>';
        html += '<div class="warden-form-row">';
        html += '<label>关键词列表:</label>';
        html += '<input type="text" class="warden-input" id="warden-score-keywords" placeholder="多个关键词用中文顿号、分隔（如：抽奖、roll、roll点）">';
        html += '</div>';

        // 排除关键词
        html += '<div class="warden-form-row">';
        html += '<label>排除关键词加分:</label>';
        html += '<label class="kw-toggle" style="flex:0 0 auto;">';
        html += '<input type="checkbox" id="warden-score-exclude-keyword">';
        html += '<span class="kw-slider"></span>';
        html += '</label>';
        html += '<span style="font-size:11px;color:#8b6914;">开启后跳过包含指定关键词的楼层</span>';
        html += '</div>';
        html += '<div class="warden-form-row">';
        html += '<label>排除关键词:</label>';
        html += '<input type="text" class="warden-input" id="warden-score-exclude-keywords" placeholder="多个关键词用中文顿号、分隔（如：打卡、签到）">';
        html += '</div>';
        html += '</div>';

        // 当前页面信息
        html += '<div class="warden-section">';
        html += '<h3>当前页面信息</h3>';
        html += '<div class="warden-form-row">';
        html += '<label>当前TID:</label>';
        html += '<span style="color:#492e1b;font-weight:bold;" id="warden-current-tid">' + (getCurrentTid() || '不在帖子页面') + '</span>';
        html += '</div>';
        html += '<div class="warden-form-row">';
        html += '<label>当前FID:</label>';
        html += '<span style="color:#492e1b;font-weight:bold;" id="warden-current-fid">' + (getCurrentFid() || '无法获取') + '</span>';
        html += '</div>';
        html += '<div class="warden-form-row">';
        html += '<label>当前页数:</label>';
        html += '<span style="color:#492e1b;font-weight:bold;" id="warden-current-page">第' + getCurrentPage() + '页</span>';
        html += '</div>';
        html += '<div class="warden-form-row">';
        html += '<label>当前页楼层:</label>';
        html += '<span style="color:#492e1b;font-weight:bold;" id="warden-current-floors">检测中...</span>';
        html += '</div>';
        html += '</div>';

        // 进度状态
        html += '<div id="nga-warden-score-status">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">';
        html += '<span id="warden-score-status-text" style="font-weight:bold;"></span>';
        html += '<span id="warden-score-status-count" style="font-size:12px;color:#8b6914;"></span>';
        html += '</div>';
        html += '<div class="warden-progress-bar" style="display:none;" id="warden-progress-container">';
        html += '<div class="fill" id="warden-progress-fill" style="width:0%"></div>';
        html += '</div>';
        html += '</div>';

        // 控制按钮
        html += '<div style="display:flex;gap:8px;margin:8px 0;flex-wrap:wrap;">';
        html += '<button class="warden-btn success" id="warden-btn-start" title="开始批量加分">▶ 启动加分</button>';
        html += '<button class="warden-btn danger" id="warden-btn-stop" disabled title="停止批量加分">■ 停止加分</button>';
        html += '<button class="warden-btn" id="warden-btn-clear-log" title="清除日志显示">清除日志</button>';
        html += '</div>';

        // 日志区域
        html += '<div style="font-size:12px;color:#6b4e2e;margin-top:8px;font-weight:bold;">运行日志:</div>';
        html += '<div id="nga-warden-score-log">';
        html += '<div class="log-line info">就绪，等待操作...</div>';
        html += '</div>';

        return html;
    }

    // ===================================
    // UI: 贴内批量操作页面
    // ===================================
    function createReplyOpsPageHTML() {
        var html = '';
        html += '<div class="warden-section">';
        html += '<h3>贴内批量操作</h3>';
        html += '<p style="font-size:12px;color:#8b6914;">对当前页面上的所有回复楼层进行批量锁隐/锁定操作。使用 <b>topic_lock</b> API。</p>';
        html += '</div>';

        // 操作类型
        html += '<div class="warden-section">';
        html += '<h3>操作设置</h3>';

        html += '<div class="warden-form-row">';
        html += '<label>操作类型:</label>';
        html += '<select class="warden-input" id="warden-reply-op-type" style="width:auto;">';
        html += '<option value="1026" selected>锁定隐藏 (1026)</option>';
        html += '<option value="1024">单锁定 (1024)</option>';
        html += '<option value="2">单隐藏 (2)</option>';
        html += '<option value="128">编辑 (128)</option>';
        html += '<option value="16777216">下沉 (16777216)</option>';
        html += '<option value="512">审核 (512)</option>';
        html += '<option value="16384">屏蔽 (16384)</option>';
        html += '</select>';
        html += '</div>';

        // 操作/解除开关
        html += '<div class="warden-form-row">';
        html += '<label>操作/解除:</label>';
        html += '<label class="kw-toggle" style="flex:0 0 auto;">';
        html += '<input type="checkbox" id="warden-reply-op-mode" checked>';
        html += '<span class="kw-slider"></span>';
        html += '</label>';
        html += '<span style="font-size:11px;color:#8b6914;" id="warden-reply-op-mode-label">操作(pon)</span>';
        html += '</div>';

        html += '<div class="warden-form-row">';
        html += '<label>操作间隔(ms):</label>';
        html += '<input type="number" class="warden-input warden-input-short" id="warden-reply-op-delay" value="50" min="50" max="5000" step="50" title="每次操作之间的延迟时间">';
        html += '<span style="font-size:11px;color:#8b6914;">建议50ms-200ms</span>';
        html += '</div>';

        html += '</div>';

        // 当前页面回复列表
        html += '<div class="warden-section">';
        html += '<h3>当前页面回复列表</h3>';
        html += '<div class="warden-form-row">';
        html += '<label>回复数量:</label>';
        html += '<span style="color:#492e1b;font-weight:bold;" id="warden-reply-count">未扫描</span>';
        html += '</div>';
        html += '<div style="margin-top:8px;">';
        html += '<button class="warden-btn" id="warden-btn-scan-replies" title="扫描当前页面所有回复">扫描当前页回复</button>';
        html += '<button class="warden-btn" id="warden-btn-select-all" title="全选" style="margin-left:4px;">全选</button>';
        html += '<button class="warden-btn" id="warden-btn-deselect-all" title="取消全选" style="margin-left:4px;">取消全选</button>';
        html += '</div>';

        // 回复列表（可勾选）
        html += '<div id="warden-reply-list" style="max-height:250px;overflow-y:auto;background:#fff;border:1px solid #d4c5a9;padding:8px;margin-top:8px;font-size:12px;">';
        html += '<span style="color:#8b6914;">点击"扫描当前页回复"按钮获取回复列表</span>';
        html += '</div>';

        html += '</div>';

        // 进度状态
        html += '<div id="nga-warden-reply-status" style="background:#faf3e6;border:1px solid #d4c5a9;padding:8px 12px;margin-bottom:10px;display:none;">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">';
        html += '<span id="warden-reply-status-text" style="font-weight:bold;"></span>';
        html += '<span id="warden-reply-status-count" style="font-size:12px;color:#8b6914;"></span>';
        html += '</div>';
        html += '<div class="warden-progress-bar" style="display:none;" id="warden-reply-progress-container">';
        html += '<div class="fill" id="warden-reply-progress-fill" style="width:0%"></div>';
        html += '</div>';
        html += '</div>';

        // 控制按钮
        html += '<div style="display:flex;gap:8px;margin:8px 0;flex-wrap:wrap;">';
        html += '<button class="warden-btn danger" id="warden-btn-execute-reply" title="执行批量锁隐/锁定操作" disabled>▶ 执行操作</button>';
        html += '<button class="warden-btn" id="warden-btn-stop-reply" disabled title="停止操作">■ 停止</button>';
        html += '</div>';

        // 日志
        html += '<div style="font-size:12px;color:#6b4e2e;margin-top:8px;font-weight:bold;">操作日志:</div>';
        html += '<div id="nga-warden-reply-log" style="background:#fff;border:1px solid #d4c5a9;padding:8px;margin-top:8px;max-height:200px;overflow-y:auto;font-size:12px;font-family:Consolas,monospace;">';
        html += '<div class="log-line info">就绪，等待操作...</div>';
        html += '</div>';

        return html;
    }

    // ===================================
    // UI: 用户回复操作页面
    // ===================================
    function createUserReplyPageHTML() {
        var html = '';
        html += '<div class="warden-section">';
        html += '<h3>用户回复操作</h3>';
        html += '<p style="font-size:12px;color:#8b6914;">在用户回复页（<b>thread.php?authorid=</b>）扫描该用户的所有回复和主题，支持批量锁隐和复制。</p>';
        html += '</div>';

        // 操作间隔
        html += '<div class="warden-section">';
        html += '<h3>操作设置</h3>';
        html += '<div class="warden-form-row">';
        html += '<label>操作间隔(ms):</label>';
        html += '<input type="number" class="warden-input warden-input-short" id="warden-ur-op-delay" value="100" min="50" max="5000" step="50" title="每次操作之间的延迟时间">';
        html += '<span style="font-size:11px;color:#8b6914;">建议50ms-200ms</span>';
        html += '</div>';
        html += '</div>';

        // 扫描控制
        html += '<div class="warden-section">';
        html += '<h3>扫描页面</h3>';
        html += '<div style="margin-bottom:8px;">';
        html += '<button class="warden-btn" id="warden-btn-scan-ur" title="扫描当前用户回复页">扫描当前页面</button>';
        html += '</div>';

        // 回复列表区域
        html += '<div style="margin-bottom:12px;">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">';
        html += '<span style="font-weight:bold;color:#492e1b;">回复列表：<span id="warden-ur-reply-count" style="color:#c0392b;">0</span> 个回复</span>';
        html += '<div>';
        html += '<button class="warden-btn" id="warden-btn-ur-reply-selectall">全选</button>';
        html += '<button class="warden-btn" id="warden-btn-ur-reply-deselectall" style="margin-left:4px;">取消全选</button>';
        html += '<button class="warden-btn" id="warden-btn-copy-ur-replies" title="复制已勾选回复" style="margin-left:4px;">复制已选</button>';
        html += '<button class="warden-btn danger" id="warden-btn-lockhide-ur-replies" title="批量锁隐已勾选回复" style="margin-left:4px;">批量锁隐回复</button>';
        html += '</div>';
        html += '</div>';
        html += '<div id="warden-ur-reply-list" style="max-height:220px;overflow-y:auto;background:#fff;border:1px solid #d4c5a9;padding:4px;font-size:12px;">';
        html += '<span style="color:#8b6914;">点击"扫描当前页面"按钮获取回复列表</span>';
        html += '</div>';
        html += '</div>';

        // 主题列表区域
        html += '<div style="margin-bottom:12px;">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">';
        html += '<span style="font-weight:bold;color:#492e1b;">主题列表：<span id="warden-ur-topic-count" style="color:#c0392b;">0</span> 个主题(已去重)</span>';
        html += '<div>';
        html += '<button class="warden-btn" id="warden-btn-ur-topic-selectall">全选</button>';
        html += '<button class="warden-btn" id="warden-btn-ur-topic-deselectall" style="margin-left:4px;">取消全选</button>';
        html += '<button class="warden-btn" id="warden-btn-copy-ur-topics" title="复制已勾选主题" style="margin-left:4px;">复制已选</button>';
        html += '<button class="warden-btn danger" id="warden-btn-lock-ur-topics" title="批量单锁定已勾选主题贴" style="margin-left:4px;">批量单锁定主题贴</button>';
        html += '</div>';
        html += '</div>';
        html += '<div id="warden-ur-topic-list" style="max-height:180px;overflow-y:auto;background:#fff;border:1px solid #d4c5a9;padding:4px;font-size:12px;">';
        html += '<span style="color:#8b6914;">点击"扫描当前页面"按钮获取主题列表</span>';
        html += '</div>';
        html += '</div>';

        html += '</div>';

        // 进度状态
        html += '<div id="nga-warden-ur-status" style="background:#faf3e6;border:1px solid #d4c5a9;padding:8px 12px;margin-bottom:10px;display:none;">';
        html += '<span id="warden-ur-status-text" style="font-weight:bold;"></span>';
        html += '</div>';

        // 日志
        html += '<div style="font-size:12px;color:#6b4e2e;margin-top:8px;font-weight:bold;">操作日志:</div>';
        html += '<div id="nga-warden-ur-log" style="background:#fff;border:1px solid #d4c5a9;padding:8px;margin-top:8px;max-height:200px;overflow-y:auto;font-size:12px;font-family:Consolas,monospace;">';
        html += '<div class="log-line info">就绪，等待操作...</div>';
        html += '</div>';

        return html;
    }

    // ===================================
    // 用户回复操作引擎
    // ===================================
    var USER_REPLY_ENGINE = {
        isRunning: false,
        stopRequested: false,
        replies: [],    // [{tid, pid}]
        topics: [],     // [tid] unique

        // 扫描thread.php?authorid=页面
        scanPage: function() {
            var self = this;
            self.replies = [];
            self.topics = [];

            // 扫描回复: #topicrows .topic_content a[href*="pid="]
            var replyIds = {};
            var replyLinks = document.querySelectorAll('#topicrows .topic_content a[href*="pid="]');
            for (var i = 0; i < replyLinks.length; i++) {
                try {
                    var url = new URL(replyLinks[i].href, window.location.href);
                    var tid = url.searchParams.get('tid');
                    var pid = url.searchParams.get('pid');
                    if (tid && pid) {
                        var key = tid + ',' + pid;
                        if (!replyIds[key]) {
                            replyIds[key] = true;
                            self.replies.push({ tid: tid, pid: pid });
                        }
                    }
                } catch(e) {}
            }

            // 扫描主题（去重）: #topicrows .topic_content a[href*="tid="]
            var topicIds = {};
            var topicLinks = document.querySelectorAll('#topicrows .topic_content a[href*="tid="]');
            for (var j = 0; j < topicLinks.length; j++) {
                try {
                    var tUrl = new URL(topicLinks[j].href, window.location.href);
                    var tTid = tUrl.searchParams.get('tid');
                    if (tTid && !topicIds[tTid]) {
                        topicIds[tTid] = true;
                        self.topics.push(tTid);
                    }
                } catch(e) {}
            }

            addUrLogEntry('info', '扫描完成：回复' + self.replies.length + '条，主题' + self.topics.length + '个(已去重)');
            return { replies: self.replies, topics: self.topics };
        },

        // 批量执行锁隐回复 (pon=1026) - list由外部传入（已勾选的）
        executeLockHideReplies: function(list, delay) {
            var self = this;
            self.isRunning = true;
            self.stopRequested = false;
            var total = list.length;
            var processed = 0, errors = 0;

            updateUrStatusUI('running', '正在批量锁隐回复... (0/' + total + ')');
            addUrLogEntry('info', '========== 批量锁隐回复开始 ==========');
            addUrLogEntry('info', '目标: ' + total + ' 条回复');

            function processNext(index) {
                if (index >= total || self.stopRequested) {
                    self.isRunning = false;
                    var msg = self.stopRequested ? '已停止' : '完成';
                    updateUrStatusUI(self.stopRequested ? 'stopped' : 'done', msg + '！成功' + processed + '/失败' + errors);
                    addUrLogEntry('info', '========== 批量锁隐回复' + msg + ' ==========');
                    return;
                }
                var item = list[index];
                updateUrStatusUI('running', '锁隐: TID=' + item.tid + ' PID=' + item.pid + ' (' + (index + 1) + '/' + total + ')');

                return REPLY_ENGINE.lockReply(item.tid, item.pid, 1026, 0)
                    .then(function() {
                        processed++;
                        addUrLogEntry('success', 'TID=' + item.tid + ' PID=' + item.pid + ' 锁隐成功');
                        return sleepAsync(delay).then(function() { processNext(index + 1); });
                    })
                    .catch(function(err) {
                        errors++;
                        addUrLogEntry('error', 'TID=' + item.tid + ' PID=' + item.pid + ' 失败: ' + err.message);
                        return sleepAsync(delay).then(function() { processNext(index + 1); });
                    });
            }
            processNext(0);
        },

        // 批量执行单锁定主题 (pon=1024, pid=0) - list由外部传入（已勾选的）
        executeLockTopics: function(list, delay) {
            var self = this;
            self.isRunning = true;
            self.stopRequested = false;
            var total = list.length;
            var processed = 0, errors = 0;

            updateUrStatusUI('running', '正在批量单锁定主题... (0/' + total + ')');
            addUrLogEntry('info', '========== 批量单锁定主题开始 ==========');
            addUrLogEntry('info', '目标: ' + total + ' 个主题');

            function processNext(index) {
                if (index >= total || self.stopRequested) {
                    self.isRunning = false;
                    var msg = self.stopRequested ? '已停止' : '完成';
                    updateUrStatusUI(self.stopRequested ? 'stopped' : 'done', msg + '！成功' + processed + '/失败' + errors);
                    addUrLogEntry('info', '========== 批量单锁定主题' + msg + ' ==========');
                    return;
                }
                var tid = list[index];
                updateUrStatusUI('running', '单锁定: TID=' + tid + ' (' + (index + 1) + '/' + total + ')');

                return REPLY_ENGINE.lockReply(tid, '0', 1024, 0)
                    .then(function() {
                        processed++;
                        addUrLogEntry('success', 'TID=' + tid + ' 单锁定成功');
                        return sleepAsync(delay).then(function() { processNext(index + 1); });
                    })
                    .catch(function(err) {
                        errors++;
                        addUrLogEntry('error', 'TID=' + tid + ' 失败: ' + err.message);
                        return sleepAsync(delay).then(function() { processNext(index + 1); });
                    });
            }
            processNext(0);
        },

        stop: function() {
            this.stopRequested = true;
            this.isRunning = false;
            updateUrStatusUI('stopped', '正在停止...');
            addUrLogEntry('info', '========== 收到停止指令 ==========');
        }
    };

    // 用户回复操作日志
    function addUrLogEntry(type, message) {
        var logEl = document.getElementById('nga-warden-ur-log');
        if (!logEl) return;
        var line = document.createElement('div');
        line.className = 'log-line ' + type;
        line.textContent = '[' + formatTime() + '] ' + message;
        logEl.appendChild(line);
        logEl.scrollTop = logEl.scrollHeight;
    }

    function clearUrLogUI() {
        var logEl = document.getElementById('nga-warden-ur-log');
        if (logEl) logEl.innerHTML = '';
    }

    function updateUrStatusUI(state, message) {
        if (!isPanelVisible()) return;
        var statusEl = document.getElementById('nga-warden-ur-status');
        var textEl = document.getElementById('warden-ur-status-text');
        if (statusEl) { statusEl.className = state; statusEl.style.display = 'block'; }
        if (textEl) textEl.textContent = message;
    }

    function renderUrResults(result) {
        var replyListEl = document.getElementById('warden-ur-reply-list');
        var replyCountEl = document.getElementById('warden-ur-reply-count');
        var topicListEl = document.getElementById('warden-ur-topic-list');
        var topicCountEl = document.getElementById('warden-ur-topic-count');

        // 渲染回复列表（勾选框）
        if (replyCountEl) replyCountEl.textContent = result.replies.length;
        if (replyListEl) {
            if (result.replies.length === 0) {
                replyListEl.innerHTML = '<span style="color:#8b6914;">未找到回复</span>';
            } else {
                var replyHtml = '';
                for (var i = 0; i < result.replies.length; i++) {
                    var r = result.replies[i];
                    replyHtml += '<label style="display:flex;align-items:center;padding:2px 4px;cursor:pointer;border-bottom:1px solid #f0f0f0;">';
                    replyHtml += '<input type="checkbox" class="warden-ur-reply-cb" data-index="' + i + '" checked style="margin-right:6px;flex-shrink:0;">';
                    replyHtml += '<span style="color:#1a5276;">TID:' + r.tid + '</span>';
                    replyHtml += '<span style="color:#8b6914;margin-left:8px;">PID:' + r.pid + '</span>';
                    replyHtml += '</label>';
                }
                replyListEl.innerHTML = replyHtml;
            }
        }

        // 渲染主题列表（勾选框）
        if (topicCountEl) topicCountEl.textContent = result.topics.length;
        if (topicListEl) {
            if (result.topics.length === 0) {
                topicListEl.innerHTML = '<span style="color:#8b6914;">未找到主题</span>';
            } else {
                var topicHtml = '';
                for (var j = 0; j < result.topics.length; j++) {
                    var t = result.topics[j];
                    topicHtml += '<label style="display:flex;align-items:center;padding:2px 4px;cursor:pointer;border-bottom:1px solid #f0f0f0;">';
                    topicHtml += '<input type="checkbox" class="warden-ur-topic-cb" data-index="' + j + '" checked style="margin-right:6px;flex-shrink:0;">';
                    topicHtml += '<span style="color:#1a5276;">TID:' + t + '</span>';
                    topicHtml += '</label>';
                }
                topicListEl.innerHTML = topicHtml;
            }
        }
    }

    function selectAllUrReplies(checked) {
        var cbs = document.querySelectorAll('.warden-ur-reply-cb');
        for (var i = 0; i < cbs.length; i++) { cbs[i].checked = checked; }
    }

    function selectAllUrTopics(checked) {
        var cbs = document.querySelectorAll('.warden-ur-topic-cb');
        for (var i = 0; i < cbs.length; i++) { cbs[i].checked = checked; }
    }

    function getCheckedUrReplies() {
        var cbs = document.querySelectorAll('.warden-ur-reply-cb');
        var checked = [];
        for (var i = 0; i < cbs.length; i++) {
            if (cbs[i].checked) {
                var idx = parseInt(cbs[i].getAttribute('data-index'));
                if (USER_REPLY_ENGINE.replies[idx]) {
                    checked.push(USER_REPLY_ENGINE.replies[idx]);
                }
            }
        }
        return checked;
    }

    function getCheckedUrTopics() {
        var cbs = document.querySelectorAll('.warden-ur-topic-cb');
        var checked = [];
        for (var i = 0; i < cbs.length; i++) {
            if (cbs[i].checked) {
                var idx = parseInt(cbs[i].getAttribute('data-index'));
                if (USER_REPLY_ENGINE.topics[idx]) {
                    checked.push(USER_REPLY_ENGINE.topics[idx]);
                }
            }
        }
        return checked;
    }

    function copyToClipboard(text) {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); return true; } catch(e) { return false; }
        finally { document.body.removeChild(ta); }
    }

    // ===================================
    // UI: 创建打开按钮
    // ===================================
    function createOpenButton() {
        log('创建打开按钮');
        var btnWrap = document.createElement('div');
        btnWrap.className = 'td';
        var a = document.createElement('a');
        a.className = 'mmdefault';
        a.href = 'javascript:void(0);';
        a.style.whiteSpace = 'nowrap';
        a.textContent = '版主工具';
        btnWrap.appendChild(a);

        // 桌面端: .right / 手机端: #m_nav, .nav, .top_nav
        var container = document.querySelector('.right');
        if (!container) {
            container = document.querySelector('#m_nav, #nav, .nav, .top_nav, #ucp_menu, .header-user, .user-menu, .m-top-bar');
        }
        if (container) {
            container.insertBefore(btnWrap, container.firstChild);
            log('按钮已添加到导航栏');
        } else {
            log('未找到合适的按钮容器，附加到 body');
            btnWrap.style.position = 'fixed';
            btnWrap.style.bottom = '20px';
            btnWrap.style.right = '20px';
            btnWrap.style.zIndex = '99990';
            document.body.appendChild(btnWrap);
        }
        return btnWrap;
    }

    // ===================================
    // UI: 更新函数
    // ===================================
    function isPanelVisible() {
        var overlay = document.getElementById('nga-warden-overlay');
        return overlay && overlay.classList.contains('show');
    }

    function updateScoreStatusUI(state, message) {
        // 仅当面板可见时才更新UI，防止自动弹出面板
        if (!isPanelVisible()) return;
        var statusEl = document.getElementById('nga-warden-score-status');
        var textEl = document.getElementById('warden-score-status-text');
        var countEl = document.getElementById('warden-score-status-count');

        if (statusEl) {
            statusEl.className = state; // running | stopped | done
            statusEl.style.display = 'block';
        }
        if (textEl) textEl.textContent = message;
        if (countEl && SCORE_ENGINE.isRunning) {
            countEl.textContent = '已处理: ' + SCORE_ENGINE.processedFloors.length + ' 个楼层';
        }
    }

    // 无条件更新UI（用于用户手动操作时）
    function updateScoreStatusUIForce(state, message) {
        var statusEl = document.getElementById('nga-warden-score-status');
        var textEl = document.getElementById('warden-score-status-text');
        var countEl = document.getElementById('warden-score-status-count');

        if (statusEl) {
            statusEl.className = state;
            statusEl.style.display = 'block';
        }
        if (textEl) textEl.textContent = message;
        if (countEl && SCORE_ENGINE.isRunning) {
            countEl.textContent = '已处理: ' + SCORE_ENGINE.processedFloors.length + ' 个楼层';
        }
    }

    function updateControlButtons(isRunning) {
        // 仅当面板可见时才更新UI
        if (!isPanelVisible()) return;
        var startBtn = document.getElementById('warden-btn-start');
        var stopBtn = document.getElementById('warden-btn-stop');
        if (startBtn) startBtn.disabled = isRunning;
        if (stopBtn) stopBtn.disabled = !isRunning;
    }

    function updateControlButtonsForce(isRunning) {
        var startBtn = document.getElementById('warden-btn-start');
        var stopBtn = document.getElementById('warden-btn-stop');
        if (startBtn) startBtn.disabled = isRunning;
        if (stopBtn) stopBtn.disabled = !isRunning;
    }

    function appendLogToUI(type, message) {
        // 日志始终追加（即使面板不可见），下次打开面板时可以看到
        var logEl = document.getElementById('nga-warden-score-log');
        if (!logEl) return;
        var line = document.createElement('div');
        line.className = 'log-line ' + type;
        line.textContent = '[' + formatTime() + '] ' + message;
        logEl.appendChild(line);
        // 自动滚动到底部
        logEl.scrollTop = logEl.scrollHeight;
    }

    function clearLogUI() {
        var logEl = document.getElementById('nga-warden-score-log');
        if (logEl) {
            logEl.innerHTML = '';
        }
    }

    function updatePageInfoUI() {
        var tidEl = document.getElementById('warden-current-tid');
        var fidEl = document.getElementById('warden-current-fid');
        var pageEl = document.getElementById('warden-current-page');
        var floorsEl = document.getElementById('warden-current-floors');

        if (tidEl) tidEl.textContent = getCurrentTid() || '不在帖子页面';
        if (fidEl) fidEl.textContent = getCurrentFid() || '无法获取';
        if (pageEl) pageEl.textContent = '第' + getCurrentPage() + '页';

        if (floorsEl) {
            var floors = getCurrentPageFloors();
            if (floors.length > 0) {
                floorsEl.textContent = floors.length + '个回复楼层 (#1-' + floors[floors.length - 1].floor + ')';
            } else {
                floorsEl.textContent = '未检测到楼层（可能不在帖子页面）';
            }
        }
    }

    function loadSettingsToForm() {
        var settings = loadScoreSettings();
        var tidEl = document.getElementById('warden-score-tid');
        var valueEl = document.getElementById('warden-score-value');
        var moneyEl = document.getElementById('warden-score-money');
        var prestigeEl = document.getElementById('warden-score-prestige');
        var pmEl = document.getElementById('warden-score-pm');
        var reasonEl = document.getElementById('warden-score-reason');
        var delayEl = document.getElementById('warden-score-delay');
        var maxPagesEl = document.getElementById('warden-score-maxpages');
        var stopFloorEl = document.getElementById('warden-score-stopfloor');

        if (tidEl) tidEl.value = settings.tid || '';
        if (valueEl) valueEl.value = settings.scoreValue || '30';
        if (moneyEl) moneyEl.checked = settings.addMoney !== false;
        if (prestigeEl) prestigeEl.checked = settings.addPrestige !== false;
        if (pmEl) pmEl.checked = settings.sendPM !== false;
        if (reasonEl) reasonEl.value = settings.reason || '';
        if (delayEl) delayEl.value = settings.delay || 50;
        if (maxPagesEl) maxPagesEl.value = settings.maxPages || 0;
        if (stopFloorEl) stopFloorEl.value = settings.stopFloor || 0;
        var onlyAttachEl = document.getElementById('warden-score-only-attach');
        if (onlyAttachEl) onlyAttachEl.checked = settings.onlyAttachment === true;
        var filterKwEl = document.getElementById('warden-score-filter-keyword');
        if (filterKwEl) filterKwEl.checked = settings.filterKeywordEnabled === true;
        var keywordsEl = document.getElementById('warden-score-keywords');
        if (keywordsEl) keywordsEl.value = settings.filterKeywords || '';
        var excludeKwEl = document.getElementById('warden-score-exclude-keyword');
        if (excludeKwEl) excludeKwEl.checked = settings.excludeKeywordEnabled === true;
        var excludeKeywordsEl = document.getElementById('warden-score-exclude-keywords');
        if (excludeKeywordsEl) excludeKeywordsEl.value = settings.excludeKeywords || '';
    }

    function collectSettingsFromForm() {
        var settings = loadScoreSettings();
        var tidEl = document.getElementById('warden-score-tid');
        var valueEl = document.getElementById('warden-score-value');
        var moneyEl = document.getElementById('warden-score-money');
        var prestigeEl = document.getElementById('warden-score-prestige');
        var pmEl = document.getElementById('warden-score-pm');
        var reasonEl = document.getElementById('warden-score-reason');
        var delayEl = document.getElementById('warden-score-delay');
        var maxPagesEl = document.getElementById('warden-score-maxpages');
        var stopFloorEl = document.getElementById('warden-score-stopfloor');
        var onlyAttachEl = document.getElementById('warden-score-only-attach');
        var filterKwEl = document.getElementById('warden-score-filter-keyword');
        var keywordsEl = document.getElementById('warden-score-keywords');
        var excludeKwEl = document.getElementById('warden-score-exclude-keyword');
        var excludeKeywordsEl = document.getElementById('warden-score-exclude-keywords');

        settings.tid = tidEl ? tidEl.value.trim() : '';
        settings.scoreValue = valueEl ? valueEl.value.trim() : '0';
        settings.addMoney = moneyEl ? moneyEl.checked : true;
        settings.addPrestige = prestigeEl ? prestigeEl.checked : true;
        settings.sendPM = pmEl ? pmEl.checked : true;
        settings.reason = reasonEl ? reasonEl.value.trim() : '';
        settings.onlyAttachment = onlyAttachEl ? onlyAttachEl.checked : false;
        settings.filterKeywordEnabled = filterKwEl ? filterKwEl.checked : false;
        settings.filterKeywords = keywordsEl ? keywordsEl.value.trim() : '';
        settings.excludeKeywordEnabled = excludeKwEl ? excludeKwEl.checked : false;
        settings.excludeKeywords = excludeKeywordsEl ? excludeKeywordsEl.value.trim() : '';
        settings.delay = delayEl ? parseInt(delayEl.value) || 50 : 50;
        settings.maxPages = maxPagesEl ? parseInt(maxPagesEl.value) || 0 : 0;
        settings.stopFloor = stopFloorEl ? parseInt(stopFloorEl.value) || 0 : 0;

        return settings;
    }

    // ===================================
    // UI: 面板显示/隐藏
    // ===================================
    function showPanel() {
        log('显示面板');
        var overlay = document.getElementById('nga-warden-overlay');
        if (overlay) {
            overlay.classList.add('show');
            switchTab(0);
            loadSettingsToForm();
            updatePageInfoUI();

            // 从localStorage恢复日志显示
            restoreLogFromStorage();

            // 检查是否有正在运行的任务
            var runningState = loadRunningState();
            if (runningState) {
                updateScoreStatusUIForce('running', '检测到未完成的加分任务(TID:' + runningState.tid + ', 当前第' + runningState.currentPage + '页)');
                addScoreLogEntry('info', '检测到未完成的加分任务(TID:' + runningState.tid + ', 起始页' + (runningState.startPage || 1) + ', 当前第' + runningState.currentPage + '页)');
                updateControlButtonsForce(false); // 让用户决定是否继续
            }
        }
    }

    function restoreLogFromStorage() {
        var logArr = loadScoreLog();
        var logEl = document.getElementById('nga-warden-score-log');
        if (!logEl || logArr.length === 0) return;
        // 只在日志为空时恢复（避免重复）
        if (logEl.children.length > 1) return;
        logEl.innerHTML = '';
        for (var i = 0; i < logArr.length; i++) {
            var entry = logArr[i];
            var line = document.createElement('div');
            line.className = 'log-line ' + entry.type;
            line.textContent = '[' + entry.time + '] ' + entry.message;
            logEl.appendChild(line);
        }
        logEl.scrollTop = logEl.scrollHeight;
    }

    function hidePanel() {
        var overlay = document.getElementById('nga-warden-overlay');
        if (overlay) { overlay.classList.remove('show'); }
    }

    function switchTab(index) {
        var tabBtns = document.querySelectorAll('#nga-warden-tabs .tab-btn');
        var pages = document.querySelectorAll('#nga-warden-body .warden-page');
        for (var i = 0; i < tabBtns.length; i++) {
            tabBtns[i].classList.toggle('active', i === index);
        }
        for (var j = 0; j < pages.length; j++) {
            pages[j].classList.toggle('active', j === index);
        }
        if (index === 0) {
            updatePageInfoUI();
            loadSettingsToForm();
        }
        if (index === 3) {
            var as = loadAppSettings();
            var removeLoginToggle = document.getElementById('warden-setting-remove-login');
            if (removeLoginToggle) removeLoginToggle.checked = as.removeLoginBtn;
            var hideAllToggle = document.getElementById('warden-setting-hideall');
            if (hideAllToggle) hideAllToggle.checked = as.enableHideAll;
            var watermarkToggle = document.getElementById('warden-setting-watermark');
            if (watermarkToggle) watermarkToggle.checked = as.removeWatermark;
            var votesToggle = document.getElementById('warden-setting-votes');
            if (votesToggle) votesToggle.checked = as.showVotes;
            var notesToggle = document.getElementById('warden-setting-notes');
            if (notesToggle) notesToggle.checked = as.showPrivateNotes;
        }
    }

    // ===================================
    // 事件绑定
    // ===================================
    function bindEvents() {
        log('绑定事件');

        // 关闭面板
        document.getElementById('nga-warden-close').addEventListener('click', hidePanel);

        // 点击遮罩关闭
        document.getElementById('nga-warden-overlay').addEventListener('click', function(e) {
            if (e.target === this) hidePanel();
        });

        // 标签页切换
        document.getElementById('nga-warden-tabs').addEventListener('click', function(e) {
            var btn = e.target.closest ? e.target.closest('.tab-btn') : null;
            if (!btn) return;
            var idx = parseInt(btn.getAttribute('data-tab'));
            if (!isNaN(idx)) switchTab(idx);
        });

        // 获取TID按钮
        var getTidBtn = document.getElementById('warden-btn-get-tid');
        if (getTidBtn) {
            getTidBtn.addEventListener('click', function() {
                var tid = getCurrentTid();
                var tidEl = document.getElementById('warden-score-tid');
                if (tid) {
                    if (tidEl) tidEl.value = tid;
                    updatePageInfoUI();
                    addScoreLogEntry('info', '已自动填入当前页面TID: ' + tid);
                } else {
                    alert('当前页面没有检测到TID，请确认在帖子页面中。');
                }
            });
        }

        // 启动加分按钮
        var startBtn = document.getElementById('warden-btn-start');
        if (startBtn) {
            startBtn.addEventListener('click', function() {
                var settings = collectSettingsFromForm();
                if (!settings.tid) {
                    alert('请先输入目标帖子TID！');
                    return;
                }
                if (!settings.scoreValue || settings.scoreValue === '0') {
                    alert('请输入有效的声望值（非零值）！');
                    return;
                }
                log('启动批量加分', settings);
                saveScoreSettings(settings);
                updateControlButtons(true);
                SCORE_ENGINE.start(settings);
            });
        }

        // 停止加分按钮
        var stopBtn = document.getElementById('warden-btn-stop');
        if (stopBtn) {
            stopBtn.addEventListener('click', function() {
                log('手动停止批量加分');
                SCORE_ENGINE.stop();
            });
        }

        // 清除日志按钮
        var clearLogBtn = document.getElementById('warden-btn-clear-log');
        if (clearLogBtn) {
            clearLogBtn.addEventListener('click', function() {
                clearScoreLog();
                clearLogUI();
                addScoreLogEntry('info', '日志已清除');
            });
        }

        // ========== 贴内批量操作事件 ==========

        // 操作/解除切换时更新标签文字
        var opModeToggle = document.getElementById('warden-reply-op-mode');
        if (opModeToggle) {
            opModeToggle.addEventListener('change', function() {
                var label = document.getElementById('warden-reply-op-mode-label');
                if (label) label.textContent = this.checked ? '操作(pon)' : '解除(poff)';
            });
        }

        // 扫描当前页回复
        var scanBtn = document.getElementById('warden-btn-scan-replies');
        if (scanBtn) {
            scanBtn.addEventListener('click', function() {
                clearReplyLogUI();
                var replies = REPLY_ENGINE.scanReplies();
                renderReplyList(replies);
            });
        }

        // 全选
        var selectAllBtn = document.getElementById('warden-btn-select-all');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', function() {
                selectAllReplies(true);
            });
        }

        // 取消全选
        var deselectAllBtn = document.getElementById('warden-btn-deselect-all');
        if (deselectAllBtn) {
            deselectAllBtn.addEventListener('click', function() {
                selectAllReplies(false);
            });
        }

        // 执行批量操作
        var executeBtn = document.getElementById('warden-btn-execute-reply');
        if (executeBtn) {
            executeBtn.addEventListener('click', function() {
                var checkedList = getCheckedReplies();
                if (checkedList.length === 0) {
                    alert('请先选择要操作的回复！');
                    return;
                }
                var ponEl = document.getElementById('warden-reply-op-type');
                var modeEl = document.getElementById('warden-reply-op-mode');
                var delayEl = document.getElementById('warden-reply-op-delay');
                var opCode = parseInt(ponEl ? ponEl.value : 1026) || 0;
                var isApply = modeEl ? modeEl.checked : true; // true=操作(pon), false=解除(poff)
                var pon = isApply ? opCode : 0;
                var poff = isApply ? 0 : opCode;
                var delay = delayEl ? parseInt(delayEl.value) || 50 : 50;

                var opLabel = (ponEl ? ponEl.options[ponEl.selectedIndex].text : '操作') +
                              (isApply ? '[操作]' : '[解除]');

                if (!confirm('确定要对 ' + checkedList.length + ' 个回复执行【' + opLabel + '】吗？')) {
                    return;
                }

                updateReplyButtons(true);
                REPLY_ENGINE.execute(checkedList, pon, poff, delay);
            });
        }

        // 停止操作
        var stopReplyBtn = document.getElementById('warden-btn-stop-reply');
        if (stopReplyBtn) {
            stopReplyBtn.addEventListener('click', function() {
                REPLY_ENGINE.stop();
            });
        }

        // ========== 用户回复操作事件 ==========

        // 扫描用户回复页
        var scanUrBtn = document.getElementById('warden-btn-scan-ur');
        if (scanUrBtn) {
            scanUrBtn.addEventListener('click', function() {
                clearUrLogUI();
                var result = USER_REPLY_ENGINE.scanPage();
                renderUrResults(result);
            });
        }

        // 回复全选
        var urReplySelectAll = document.getElementById('warden-btn-ur-reply-selectall');
        if (urReplySelectAll) {
            urReplySelectAll.addEventListener('click', function() { selectAllUrReplies(true); });
        }

        // 回复取消全选
        var urReplyDeselectAll = document.getElementById('warden-btn-ur-reply-deselectall');
        if (urReplyDeselectAll) {
            urReplyDeselectAll.addEventListener('click', function() { selectAllUrReplies(false); });
        }

        // 复制已选回复
        var copyUrRepliesBtn = document.getElementById('warden-btn-copy-ur-replies');
        if (copyUrRepliesBtn) {
            copyUrRepliesBtn.addEventListener('click', function() {
                var checked = getCheckedUrReplies();
                if (checked.length === 0) { alert('请先扫描页面并勾选回复！'); return; }
                var lines = [];
                for (var i = 0; i < checked.length; i++) {
                    lines.push(checked[i].tid + ',' + checked[i].pid);
                }
                if (copyToClipboard(lines.join('\n'))) {
                    addUrLogEntry('info', '已复制 ' + checked.length + ' 条回复到剪贴板');
                }
            });
        }

        // 批量锁隐已选回复
        var lockhideUrBtn = document.getElementById('warden-btn-lockhide-ur-replies');
        if (lockhideUrBtn) {
            lockhideUrBtn.addEventListener('click', function() {
                var checked = getCheckedUrReplies();
                if (checked.length === 0) { alert('请先扫描页面并勾选回复！'); return; }
                if (!confirm('确定要对 ' + checked.length + ' 条回复执行【锁隐】操作吗？')) return;
                var delayEl = document.getElementById('warden-ur-op-delay');
                var delay = delayEl ? parseInt(delayEl.value) || 100 : 100;
                USER_REPLY_ENGINE.executeLockHideReplies(checked, delay);
            });
        }

        // 主题全选
        var urTopicSelectAll = document.getElementById('warden-btn-ur-topic-selectall');
        if (urTopicSelectAll) {
            urTopicSelectAll.addEventListener('click', function() { selectAllUrTopics(true); });
        }

        // 主题取消全选
        var urTopicDeselectAll = document.getElementById('warden-btn-ur-topic-deselectall');
        if (urTopicDeselectAll) {
            urTopicDeselectAll.addEventListener('click', function() { selectAllUrTopics(false); });
        }

        // 复制已选主题
        var copyUrTopicsBtn = document.getElementById('warden-btn-copy-ur-topics');
        if (copyUrTopicsBtn) {
            copyUrTopicsBtn.addEventListener('click', function() {
                var checked = getCheckedUrTopics();
                if (checked.length === 0) { alert('请先扫描页面并勾选主题！'); return; }
                if (copyToClipboard(checked.join('\n'))) {
                    addUrLogEntry('info', '已复制 ' + checked.length + ' 个主题到剪贴板');
                }
            });
        }

        // 批量单锁定已选主题
        var lockUrTopicsBtn = document.getElementById('warden-btn-lock-ur-topics');
        if (lockUrTopicsBtn) {
            lockUrTopicsBtn.addEventListener('click', function() {
                var checked = getCheckedUrTopics();
                if (checked.length === 0) { alert('请先扫描页面并勾选主题！'); return; }
                if (!confirm('确定要对 ' + checked.length + ' 个主题执行【单锁定】操作吗？')) return;
                var delayEl = document.getElementById('warden-ur-op-delay');
                var delay = delayEl ? parseInt(delayEl.value) || 100 : 100;
                USER_REPLY_ENGINE.executeLockTopics(checked, delay);
            });
        }

        // ========== 设置页事件 ==========

        // 删除登录按钮开关
        var removeLoginToggle = document.getElementById('warden-setting-remove-login');
        if (removeLoginToggle) {
            // 加载当前设置状态
            var appSettings = loadAppSettings();
            removeLoginToggle.checked = appSettings.removeLoginBtn;

            removeLoginToggle.addEventListener('change', function() {
                appSettings.removeLoginBtn = this.checked;
                saveAppSettings(appSettings);
                applyRemoveLoginBtn(this.checked);
                if (this.checked) {
                    addScoreLogEntry('info', '已开启：删除登录按钮');
                }
            });
        }

        // 一键锁隐作者开关
        var hideAllToggle = document.getElementById('warden-setting-hideall');
        if (hideAllToggle) {
            hideAllToggle.checked = loadAppSettings().enableHideAll;

            hideAllToggle.addEventListener('change', function() {
                var as = loadAppSettings();
                as.enableHideAll = this.checked;
                saveAppSettings(as);
                if (this.checked) {
                    injectHideAllButtons();
                    addScoreLogEntry('info', '已开启：一键锁隐作者');
                } else {
                    addScoreLogEntry('info', '已关闭：一键锁隐作者，刷新页面后生效');
                }
            });
        }

        // 删除NGA水印开关
        var watermarkToggle = document.getElementById('warden-setting-watermark');
        if (watermarkToggle) {
            watermarkToggle.checked = loadAppSettings().removeWatermark;

            watermarkToggle.addEventListener('change', function() {
                var as = loadAppSettings();
                as.removeWatermark = this.checked;
                saveAppSettings(as);
                if (this.checked) {
                    applyRemoveWatermark();
                }
                addScoreLogEntry('info', this.checked ? '已开启：删除NGA水印' : '已关闭：删除NGA水印，刷新页面后生效');
            });
        }

        // 查看赞踩比开关
        var votesToggle = document.getElementById('warden-setting-votes');
        if (votesToggle) {
            votesToggle.checked = loadAppSettings().showVotes;

            votesToggle.addEventListener('change', function() {
                var as = loadAppSettings();
                as.showVotes = this.checked;
                saveAppSettings(as);
                if (this.checked) {
                    applyShowVotes();
                }
                addScoreLogEntry('info', this.checked ? '已开启：查看赞踩比' : '已关闭：查看赞踩比，刷新页面后生效');
            });
        }

        // 显示非公开备注开关
        var notesToggle = document.getElementById('warden-setting-notes');
        if (notesToggle) {
            notesToggle.checked = loadAppSettings().showPrivateNotes;

            notesToggle.addEventListener('change', function() {
                var as = loadAppSettings();
                as.showPrivateNotes = this.checked;
                saveAppSettings(as);
                if (this.checked) {
                    applyShowPrivateNotes();
                }
                addScoreLogEntry('info', this.checked ? '已开启：显示非公开备注' : '已关闭：显示非公开备注，刷新页面后生效');
            });
        }

        // ESC关闭面板
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                var overlay = document.getElementById('nga-warden-overlay');
                if (overlay && overlay.classList.contains('show')) {
                    hidePanel();
                }
            }
        });

        log('事件绑定完成');
    }

    // ===================================
    // 初始化
    // ===================================
    function init() {
        log('开始初始化');
        try {
            createPanel();
            bindEvents();

            // 应用初始设置
            var appSettings = loadAppSettings();
            applyRemoveLoginBtn(appSettings.removeLoginBtn);
            if (appSettings.enableHideAll) injectHideAllButtons();
            if (appSettings.removeWatermark) applyRemoveWatermark();
            if (appSettings.showVotes) applyShowVotes();
            if (appSettings.showPrivateNotes) applyShowPrivateNotes();

            var btnWrap = createOpenButton();
            btnWrap.addEventListener('click', showPanel);

            // 检查是否需要自动恢复加分任务
            var runningState = loadRunningState();
            if (runningState) {
                var currentTid = getCurrentTid();
                if (currentTid === runningState.tid) {
                    log('检测到未完成的加分任务，准备恢复...');
                    // 自动打开面板并切换到批量加分模块
                    showPanel();
                    switchTab(0);
                    // 延迟恢复，确保页面完全加载及DOM就绪
                    setTimeout(function() {
                        log('自动恢复批量加分...');
                        var resumed = SCORE_ENGINE.resume();
                        if (!resumed) {
                            log('恢复失败，状态可能已变更');
                        }
                    }, 2000);
                } else {
                    log('检测到未完成的加分任务但当前不在目标页面(TID=' + currentTid + ', 目标TID=' + runningState.tid + ')，等待用户操作');
                }
            }

            log('初始化完成');
        } catch (e) {
            logError('初始化异常', e);
        }
    }

    // 等待页面准备就绪
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
