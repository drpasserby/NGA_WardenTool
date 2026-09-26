// ==UserScript==
// @name         NGA版主管理增强工具
// @namespace    https://greasyfork.org/zh-CN/scripts/582076-nga%E7%89%88%E4%B8%BB%E7%AE%A1%E7%90%86%E5%A2%9E%E5%BC%BA%E5%B7%A5%E5%85%B7
// @version      1.3.8
// @description  NGA玩家社区网页版版主管理增强工具，包含批量加分、锁隐回复树、锁隐作者树、次级NUKE默认值等功能模块
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
    // 模块占位声明（实现在本次 IIFE 末尾赋值）
    // ===================================
    var TREE_FEATURE = null;      // 锁隐回复树 / 锁隐作者树
    var NUKE_DEFAULTS = null;     // 次级 NUKE 默认值

    // ===================================
    // 注入 CSS (NGA配色风格)
    // ===================================
    var styleEl = document.createElement('style');
    styleEl.textContent = [
        // ---- 遮罩与面板容器 ----
        '#nga-warden-overlay{display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:3;justify-content:center;align-items:flex-start;padding-top:40px}',
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
            // 6 个页签在窄屏放不下：横向滚动（iOS 支持惯性滚动），不换行、不被裁掉
            '#nga-warden-tabs{overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;scrollbar-width:none}',
            '#nga-warden-tabs::-webkit-scrollbar{display:none}',
            '#nga-warden-tabs .tab-btn{padding:10px 14px;font-size:14px;flex:0 0 auto;white-space:nowrap}',
            '#nga-warden-body{padding:8px}',
            '.warden-form-row{flex-direction:column;align-items:stretch}',
            '.warden-form-row label{min-width:auto;text-align:left}',
            '.warden-form-row .warden-input{min-width:auto}',
            '.warden-btn{padding:8px 18px;font-size:13px}',
            // 触屏：开关加大，避免 40x22 的小控件点不中
            '.warden-form-row .kw-toggle{width:46px;height:26px}',
            '.warden-form-row .kw-slider:before{height:20px;width:20px}',
            '.warden-form-row .kw-toggle input:checked+.kw-slider:before{transform:translateX(20px)}',
            '#nga-warden-tree-log{max-height:40vh}',
        '}',

        // ---- 锁隐树日志区域 ----
        '#nga-warden-tree-log{background:#fff;border:1px solid #d4c5a9;padding:8px;margin-top:8px;max-height:220px;overflow-y:auto;font-size:12px;font-family:Consolas,monospace;white-space:pre-wrap}',
        '#nga-warden-tree-log .log-line{padding:2px 4px;border-bottom:1px solid #f0f0f0}',
        '#nga-warden-tree-log .log-line.success{color:#1e8449}',
        '#nga-warden-tree-log .log-line.error{color:#c0392b}',
        '#nga-warden-tree-log .log-line.info{color:#1a5276}',

        // ---- 楼层上的"锁隐树"入口按钮 ----
        // NGA 有不少针对楼层内 <a> 的全局规则（配色/字号/换行/溢出），这里用 !important
        // 全部顶掉，否则按钮可能"存在但看不见"。触屏下额外放大点击区域。
        'a.nga-wd-tree-btn{display:inline-block!important;visibility:visible!important;opacity:1!important;',
        'margin:0 0 0 .5em!important;padding:2px 7px!important;cursor:pointer!important;',
        'color:#8b2178!important;background:rgba(139,33,120,.09)!important;',
        'border:1px solid rgba(139,33,120,.38)!important;border-radius:3px!important;',
        'font:700 12px/1.5 "Microsoft YaHei",sans-serif!important;',
        'text-decoration:none!important;white-space:nowrap!important;vertical-align:middle!important;',
        'position:static!important;float:none!important;max-width:none!important;min-width:0!important;',
        'width:auto!important;height:auto!important;line-height:1.5!important;letter-spacing:normal!important;',
        'text-indent:0!important;overflow:visible!important;text-transform:none!important}',
        'a.nga-wd-tree-btn:hover{background:rgba(139,33,120,.18)!important;color:#6d1a5e!important}',
        'a.nga-wd-tree-btn.nga-wd-busy{opacity:.55!important;cursor:default!important}',
        '@media (hover:none),(pointer:coarse){a.nga-wd-tree-btn{padding:6px 10px!important;font-size:14px!important}}',

        // ---- 锁隐树菜单 ----
        '#nga-wd-tree-menu{position:absolute;z-index:2147483646;min-width:11em;max-width:min(86vw,17em);',
        'background:#fffdf6;border:2px solid #8a5a22;border-radius:4px;',
        'box-shadow:0 6px 20px rgba(40,24,8,.32);font:14px/1.5 "Microsoft YaHei",sans-serif;',
        'color:#551200;padding:4px 0}',
        '#nga-wd-tree-menu .nga-wd-tree-menu-title{padding:6px 12px;font-weight:700;color:#8b2178;',
        'border-bottom:1px solid #e0c89a}',
        '#nga-wd-tree-menu .nga-wd-tree-menu-item{display:block;width:100%;box-sizing:border-box;',
        'padding:10px 12px;border:0;background:transparent;color:#551200;font:inherit;text-align:left;cursor:pointer}',
        '#nga-wd-tree-menu .nga-wd-tree-menu-item:hover{background:#f7edf4;color:#8b2178}',
        '#nga-wd-tree-menu .nga-wd-tree-menu-item:disabled{color:#aa9999;cursor:default;background:transparent}',
        '#nga-wd-tree-menu .nga-wd-tree-menu-hint{padding:8px 12px;color:#8b6914;font-size:12px}',

        // ---- 锁隐结果浮窗 ----
        '#nga-wd-toast{position:fixed;z-index:2147483647;right:16px;top:16px;max-width:26em;padding:10px 12px;border-radius:6px;font:13px/1.45 "Microsoft YaHei",sans-serif;color:#fff;box-shadow:0 4px 16px rgba(0,0,0,.35)}',
        '#nga-wd-toast .nga-wd-toast-body{white-space:pre-wrap}',
        '#nga-wd-toast .nga-wd-toast-bar{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;justify-content:flex-end}',
        '#nga-wd-toast button{margin:0;padding:4px 10px;border:1px solid rgba(255,255,255,.45);border-radius:4px;background:transparent;color:#fff;font:13px/1.2 sans-serif;cursor:pointer}',
        '#nga-wd-toast button:disabled{opacity:.55;cursor:default}',
        '@keyframes nga-wd-toast-shrink{from{transform:scaleX(1)}to{transform:scaleX(0)}}'
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
        singleScorePerUser: false, // 单次加分开关：同一用户仅加分一次
        skipCCQ: false,    // 被CCQ用户不加分（声望≤-501）
        skipDeleted: false, // 跳过锁隐楼层（含"删除"标签的楼层不加分）
        minPostCount: 0,   // 最低发帖数（低于此数不加分，0=不限制）
        minPostCountEnabled: false, // 启用最低发帖数筛选
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
        removeWatermark: false,  // 删除NGA水印
        showVotes: false,        // 查看赞踩比
        showPrivateNotes: false, // 显示非公开备注

        // ---- 锁隐回复树 / 锁隐作者树 / 次级NUKE默认值 ----
        treeButtons: true,             // 在楼层操作栏注入"锁隐树"入口
        lockHideReplyTree: true,       // 允许使用"锁隐回复树"
        lockHideAuthor: true,          // 允许使用"锁隐作者树"
        treeMaxPages: 10,              // 单次向后/向前检索页数上限(1-10)
        treeSkipLocked: true,          // 跳过已经是锁隐状态的楼层
        nukeDefaultsOn: true,          // 次级NUKE默认值总开关
        lesserNukeScope: '大区内',      // 范围默认值
        lesserNukeDays: '禁言4天',      // 禁言默认值
        lesserNukeReputation: '不扣减', // 声望默认值
        lesserDeductPrestige: false,   // 同时扣减威望
        lesserDelay: false,            // 延时(禁言延时生效)
        lesserNukeNote: '',            // 默认操作说明(主题)
        lesserNukeNoteLong: '',        // 默认操作说明(短信)
        lesserNukeDeletePost: true     // 勾选"删除此贴"
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

    // 保存单个设置项（读改写，避免覆盖其它模块刚改过的值）
    function setAppSetting(key, value) {
        var settings = loadAppSettings();
        settings[key] = value;
        saveAppSettings(settings);
        return settings;
    }

    // ===================================
    // 锁隐树 / 次级NUKE 公共：页面权限判断
    // ===================================
    // 页面上下文：@grant none 时 window 就是页面 window
    function pageWindow() {
        return window;
    }

    // 当前帖子页是否具备管理权限（与官方按钮 ck() 同源）
    function hasWardenPermission(arg) {
        var w = pageWindow();
        var pb = w.commonui && w.commonui.postBtn;
        function officialAllows(id, a) {
            var spec = pb && pb.d && pb.d[id];
            if (!spec || typeof spec.ck !== 'function' || !a) return false;
            try { return !!spec.ck(a); } catch (e) { return false; }
        }
        if (arg) return officialAllows(41, arg) || officialAllows(14, arg);
        var gp = w.__GP;
        if (gp && gp.admincheck != null && (Number(gp.admincheck) & (2 | 8))) return true;
        var data = (w.commonui && w.commonui.postArg && w.commonui.postArg.data) || null;
        if (!data) return false;
        for (var key in data) {
            if (!data.hasOwnProperty(key)) continue;
            if (officialAllows(41, data[key]) || officialAllows(14, data[key])) return true;
        }
        return false;
    }

    // 当前是否次级NUKE（Lesser Nuke）可用
    function officialLesserAllowed(arg) {
        var w = pageWindow();
        var pb = w.commonui && w.commonui.postBtn;
        var spec = pb && pb.d && pb.d[14];
        if (!spec || typeof spec.ck !== 'function') return false;
        if (!arg) return true;
        try { return !!spec.ck(arg); } catch (e) { return false; }
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


    // ===================================
    // 获取页面参数
    // ===================================f分分
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
            // 获取回复人用户名和UID（多渠道兜底）
            var username = '', authorUid = '';
            // 方案1: 在row内查找 .userlink.author 或 [id^="postauthor"]
            var authorEl = row.querySelector('.userlink.author, [id^="postauthor"]');
            // 方案2: 通过全局ID postauthor{N} 查找
            if (!authorEl) { authorEl = document.getElementById('postauthor' + floor); }
            if (authorEl) {
                username = (authorEl.textContent || authorEl.innerText || '').replace('楼主', '').trim();
                authorUid = authorEl.getAttribute('data-nga-wd-hover-uid') || '';
                if (!authorUid) {
                    var hrefMatch = (authorEl.getAttribute('href') || '').match(/uid=(\d+)/);
                    if (hrefMatch) authorUid = hrefMatch[1];
                }
            }
            // 检测是否包含附件: postattach{N} 元素存在
            var hasAttachment = !!document.getElementById('postattach' + floor);
            // 获取回复内容文本（用于关键词匹配）
            var postContent = '';
            var contentEl = document.getElementById('postcontent' + floor);
            if (contentEl) { postContent = (contentEl.textContent || '').toLowerCase(); }
            // 获取用户声望值（.userval.numericl中有(lv标记的是声望，如-300(lv-1)）
            var reputation = 0;
            var repEls = row.querySelectorAll('.userval.numericl');
            for (var ri = 0; ri < repEls.length; ri++) {
                var txt = repEls[ri].textContent || '';
                if (txt.indexOf('(lv') !== -1 || txt.indexOf('lv') !== -1) {
                    var repMatch = txt.match(/^(-?\d+)/);
                    if (repMatch) reputation = parseInt(repMatch[0]);
                    break;
                }
            }
            // 如果没找到带lv标记的，取最后一个（声望通常在威望之后）
            if (reputation === 0 && repEls.length > 0) {
                var lastTxt = repEls[repEls.length - 1].textContent || '';
                var lastMatch = lastTxt.match(/^(-?\d+)/);
                if (lastMatch) reputation = parseInt(lastMatch[0]);
            }
            // 检测是否为锁隐/删除楼层（含"删除"标签）
            var isDeleted = false;
            var delEls = row.querySelectorAll('.block_txt.white');
            for (var di = 0; di < delEls.length; di++) {
                if ((delEls[di].textContent || '').trim() === '删除') { isDeleted = true; break; }
            }
            // 获取用户发帖数
            var postCount = 0;
            var postNumEl = row.querySelector('[name="postnum"]');
            if (postNumEl) { postCount = parseInt(postNumEl.textContent) || 0; }
            floors.push({ floor: floor, pid: pid, username: username, authorUid: authorUid, hasAttachment: hasAttachment, postContent: postContent, reputation: reputation, isDeleted: isDeleted, postCount: postCount });
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
                // 如果开启了被CCQ用户不加分，声望≤-501则跳过
                if (settings.skipCCQ && f.reputation <= -501) {
                    addScoreLogEntry('info', '楼层#' + f.floor + ' (PID:' + f.pid + ', 声望:' + f.reputation + ') 被CCQ，跳过');
                    continue;
                }
                // 如果开启了跳过锁隐楼层，含"删除"标签则跳过
                if (settings.skipDeleted && f.isDeleted) {
                    addScoreLogEntry('info', '楼层#' + f.floor + ' (PID:' + f.pid + ') 锁隐/删除，跳过');
                    continue;
                }
                // 如果开启了最低发帖数筛选，低于阈值则跳过
                if (settings.minPostCountEnabled && settings.minPostCount > 0 && f.postCount < settings.minPostCount) {
                    addScoreLogEntry('info', '楼层#' + f.floor + ' (PID:' + f.pid + ', 发帖:' + f.postCount + ') 低于设定值' + settings.minPostCount + '，跳过');
                    continue;
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

                // 如果开启了单次加分且UID为空，尝试从DOM二次提取
                if (settings.singleScorePerUser && !floor.authorUid) {
                    var reAuthorEl = document.getElementById('postauthor' + floor.floor);
                    if (reAuthorEl) {
                        floor.authorUid = reAuthorEl.getAttribute('data-nga-wd-hover-uid') || '';
                        if (!floor.authorUid) {
                            var reMatch = (reAuthorEl.getAttribute('href') || '').match(/uid=(\d+)/);
                            if (reMatch) floor.authorUid = reMatch[1];
                        }
                        if (!floor.authorUid) {
                            var reUidEl = document.querySelector('[name="uid"]');
                            if (reUidEl) floor.authorUid = (reUidEl.textContent || '').trim();
                        }
                        if (!floor.username) {
                            floor.username = (reAuthorEl.textContent || '').replace('楼主', '').trim();
                        }
                    }
                }

                // 如果开启了单次加分，同一用户仅加分一次
                if (settings.singleScorePerUser && floor.authorUid) {
                    if ((self.scoredUids || []).indexOf(floor.authorUid) !== -1) {
                        addScoreLogEntry('info', '楼层#' + floor.floor + ' (PID:' + floor.pid + ', UID:' + floor.authorUid + ') 用户' + (floor.username || floor.authorUid) + '已加分过，跳过');
                        result.processed = (result.processed || 0);
                        return sleepAsync(settings.delay).then(function() {
                            return processNext(index + 1);
                        });
                    }
                }

                addScoreLogEntry('info', '正在加分: 楼层#' + floor.floor + ' (PID:' + floor.pid + (floor.authorUid ? ', UID:' + floor.authorUid : '') + ')...');

                return self.scoreFloor(floor.pid, floor.floor, fid, tid, opt, settings.reason, scoreValue)
                    .then(function(resp) {
                        addScoreLogEntry('success', '楼层#' + floor.floor + ' (PID:' + floor.pid + (floor.authorUid ? ', UID:' + floor.authorUid : '') + ') 加分成功!');
                        self.processedFloors.push(floor.floor);
                        if (floor.authorUid && (self.scoredUids || []).indexOf(floor.authorUid) === -1) {
                            if (!self.scoredUids) self.scoredUids = [];
                            self.scoredUids.push(floor.authorUid);
                        }
                        result.processed++;

                        // 更新运行状态（仅增量更新已处理楼层，保留其他字段）
                        var curRS = loadRunningState();
                        saveRunningState({
                            tid: tid,
                            currentPage: currentPage,
                            startPage: curRS ? curRS.startPage : currentPage,
                            processedFloors: self.processedFloors,
                            scoredUids: self.scoredUids || [],
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
                        addScoreLogEntry('error', '楼层#' + floor.floor + ' (PID:' + floor.pid + (floor.authorUid ? ', UID:' + floor.authorUid : '') + ') 加分失败: ' + err.message);
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
            self.scoredUids = [];  // 单次加分已处理的UID列表
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
                scoredUids: [],
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
                    scoredUids: self.scoredUids || [],
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
                            scoredUids: self.scoredUids || [],
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
            self.scoredUids = runningState.scoredUids || [];
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
                    '<div class="tab-btn" data-tab="3">查看本帖举报</div>' +
                    '<div class="tab-btn" data-tab="4">锁隐树</div>' +
                    '<div class="tab-btn" data-tab="5">设置</div>' +
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
                    // ---- 页面3: 查看本帖举报 ----
                    '<div class="warden-page" data-page="3">' +
                        createThreadReportPageHTML() +
                    '</div>' +
                    // ---- 页面5: 设置 ----
                    '<div class="warden-page" data-page="5">' +
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
                            '<h3>次级NUKE默认值</h3>' +
                            '<p style="font-size:12px;color:#8b6914;">打开官方「次级NUKE」弹窗时自动预填下列默认值，不会发送任何额外请求。手动改过弹窗选项后，本次弹窗不再回填。</p>' +
                            '<div class="warden-form-row">' +
                                '<label>启用默认值:</label>' +
                                '<label class="kw-toggle" style="flex:0 0 auto;">' +
                                    '<input type="checkbox" data-nuke-setting="nukeDefaultsOn">' +
                                    '<span class="kw-slider"></span>' +
                                '</label>' +
                                '<span style="font-size:11px;color:#8b6914;">关闭后不再预填任何选项</span>' +
                            '</div>' +
                            '<div class="warden-form-row">' +
                                '<label>默认范围:</label>' +
                                '<select class="warden-input warden-input-short" data-nuke-setting="lesserNukeScope">' +
                                    '<option value="全论坛">全论坛</option>' +
                                    '<option value="本版面">本版面</option>' +
                                    '<option value="本合集">本合集</option>' +
                                    '<option value="本区内">本区内</option>' +
                                    '<option value="大区内">大区内</option>' +
                                '</select>' +
                            '</div>' +
                            '<div class="warden-form-row">' +
                                '<label>默认禁言:</label>' +
                                '<select class="warden-input warden-input-short" data-nuke-setting="lesserNukeDays">' +
                                    '<option value="禁言2天">禁言2天</option>' +
                                    '<option value="禁言4天">禁言4天</option>' +
                                    '<option value="禁言6天">禁言6天</option>' +
                                    '<option value="禁言30天">禁言30天</option>' +
                                '</select>' +
                            '</div>' +
                            '<div class="warden-form-row">' +
                                '<label>默认声望:</label>' +
                                '<select class="warden-input warden-input-short" data-nuke-setting="lesserNukeReputation">' +
                                    '<option value="不扣减">不扣减</option>' +
                                    '<option value="扣减声望">扣减声望</option>' +
                                    '<option value="加倍扣减">加倍扣减</option>' +
                                '</select>' +
                            '</div>' +
                            '<div class="warden-form-row">' +
                                '<label>同时扣减威望:</label>' +
                                '<label class="kw-toggle" style="flex:0 0 auto;">' +
                                    '<input type="checkbox" data-nuke-setting="lesserDeductPrestige">' +
                                    '<span class="kw-slider"></span>' +
                                '</label>' +
                                '<span style="font-size:11px;color:#8b6914;">官方弹窗没有该项时自动跳过</span>' +
                            '</div>' +
                            '<div class="warden-form-row">' +
                                '<label>延时:</label>' +
                                '<label class="kw-toggle" style="flex:0 0 auto;">' +
                                    '<input type="checkbox" data-nuke-setting="lesserDelay">' +
                                    '<span class="kw-slider"></span>' +
                                '</label>' +
                                '<span style="font-size:11px;color:#8b6914;">勾选官方弹窗中的"延时"</span>' +
                            '</div>' +
                            '<div class="warden-form-row">' +
                                '<label>删除此贴:</label>' +
                                '<label class="kw-toggle" style="flex:0 0 auto;">' +
                                    '<input type="checkbox" data-nuke-setting="lesserNukeDeletePost">' +
                                    '<span class="kw-slider"></span>' +
                                '</label>' +
                            '</div>' +
                            '<div class="warden-form-row">' +
                                '<label>默认操作说明(主题):</label>' +
                                '<input type="text" class="warden-input" data-nuke-setting="lesserNukeNote" placeholder="留空则不填">' +
                                '<span style="font-size:11px;color:#8b6914;">仅在官方说明框为空时填入</span>' +
                            '</div>' +
                            '<div class="warden-form-row">' +
                                '<label>默认操作说明(短信):</label>' +
                                '<input type="text" class="warden-input" data-nuke-setting="lesserNukeNoteLong" placeholder="留空则不填">' +
                                '<span style="font-size:11px;color:#8b6914;">仅在官方短信说明框为空时填入</span>' +
                            '</div>' +
                            '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px;">' +
                                '<button class="warden-btn" id="warden-btn-nuke-apply" title="把上面的默认值立刻回填到当前已打开的次级NUKE弹窗">立即应用到已打开的弹窗</button>' +
                            '</div>' +
                        '</div>' +
                        '<div class="warden-section">' +
                            '<h3>关于</h3>' +
                            '<div class="settings-row"><span class="settings-label">NGA版主管理增强工具</span></div>' +
                            '<div class="settings-row"><span class="settings-label">源代码Github仓库：</span><span class="settings-value"><a href="https://github.com/drpasserby/NGA_WardenTool" target="_blank">NGA_WardenTool</a></span></div>'+
                            '<div class="settings-row"><span class="settings-label">开发者：</span><span class="settings-value"><a href="https://bbs.nga.cn/nuke.php?func=ucp&uid=62716817" target="_blank">UST</a>/<a href="http://wulvxinchen.cn/" target="_blank">WLXC</a></span></div>' +
                        '</div>' +
                    '</div>' +
                    // ---- 页面4: 锁隐树 ----
                    // 注意：本区块（版权与致谢）不在 .staging 模块里，重建模块时不要覆盖它。
                    '<div class="warden-page" data-page="4">' +
                        '<div class="warden-section">' +
                            '<h3>版权与致谢</h3>' +
                                                        '<p>本页功能（锁隐回复树 / 锁隐作者树 / 锁隐本页）移植自 <b>NGA Warden Utils</b>，原脚本作者：'
                                + '<a href="https://greasyfork.org/users/73441-watereast" target="_blank" rel="noopener">WaterEast</a>。</p>' +
                            '<p>感谢鸭的代码。</p>' +
                            '<p style="color:#c0392b;">本页仅为<b>优化使用</b>而做的精简移植；'
                                + '想要更完整的体验请直接使用源脚本 NGA Warden Utils。</p>' +
                        '</div>' +
                        '<div class="warden-section">' +
                            '<h3>锁隐回复树 / 锁隐作者树</h3>' +
                            '<p>在帖子页（<b>read.php</b>）的楼层操作栏会出现 <b>锁隐树</b> 入口，点击后可选择：</p>' +
                            '<p>· <b>锁隐回复树</b>：锁隐该楼，以及引用/回复了该楼的后续楼层（递归展开引用链）。</p>' +
                            '<p>· <b>锁隐作者树</b>：锁隐该作者在本帖的发言，以及引用这些发言的楼层。只扫当前的"前一页～后一页"窗口，窗口没盖住首/末页时可在结果浮窗里点"整帖扫描"。</p>' +
                            '<p style="color:#c0392b;" id="warden-tree-perm-hint">需要版主/管理权限：检测中…</p>' +
                        '</div>' +
                        '<div class="warden-section">' +
                            '<h3>功能开关</h3>' +
                            '<div class="warden-form-row">' +
                                '<label>楼层显示锁隐树入口:</label>' +
                                '<label class="kw-toggle" style="flex:0 0 auto;">' +
                                    '<input type="checkbox" data-tree-setting="treeButtons">' +
                                    '<span class="kw-slider"></span>' +
                                '</label>' +
                                '<span style="font-size:11px;color:#8b6914;">关闭后不再往楼层操作栏注入按钮（已注入的刷新页面后消失）</span>' +
                            '</div>' +
                            '<div class="warden-form-row">' +
                                '<label>启用锁隐回复树:</label>' +
                                '<label class="kw-toggle" style="flex:0 0 auto;">' +
                                    '<input type="checkbox" data-tree-setting="lockHideReplyTree">' +
                                    '<span class="kw-slider"></span>' +
                                '</label>' +
                                '<span style="font-size:11px;color:#8b6914;">入口菜单中的"锁隐回复树"是否可用</span>' +
                            '</div>' +
                            '<div class="warden-form-row">' +
                                '<label>启用锁隐作者树:</label>' +
                                '<label class="kw-toggle" style="flex:0 0 auto;">' +
                                    '<input type="checkbox" data-tree-setting="lockHideAuthor">' +
                                    '<span class="kw-slider"></span>' +
                                '</label>' +
                                '<span style="font-size:11px;color:#8b6914;">入口菜单中的"锁隐作者树"是否可用（主楼不显示此项）</span>' +
                            '</div>' +
                        '</div>' +
                        '<div class="warden-section">' +
                            '<h3>高级设置</h3>' +
                            '<div class="warden-form-row">' +
                                '<label>检索页数上限:</label>' +
                                '<input type="number" class="warden-input warden-input-short" data-tree-setting="treeMaxPages" value="10" min="1" max="10" step="1" title="锁隐回复树单次向后页数，同时也是锁隐作者树单次向前/向后页数">' +
                                '<span style="font-size:11px;color:#8b6914;">1~10，超过 10 按 10 处理</span>' +
                            '</div>' +
                            '<div class="warden-form-row">' +
                                '<label>跳过已锁隐楼层:</label>' +
                                '<label class="kw-toggle" style="flex:0 0 auto;">' +
                                    '<input type="checkbox" data-tree-setting="treeSkipLocked">' +
                                    '<span class="kw-slider"></span>' +
                                '</label>' +
                                '<span style="font-size:11px;color:#8b6914;">已经锁隐/删除的楼层不再重复发送请求</span>' +
                            '</div>' +
                        '</div>' +
                        '<div class="warden-section">' +
                            '<h3>操作日志</h3>' +
                            '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
                                '<button class="warden-btn" id="warden-btn-tree-log-clear" title="清空日志显示">清除日志</button>' +
                            '</div>' +
                            '<div id="nga-warden-tree-log">' +
                                '<div class="log-line info">就绪，等待操作...</div>' +
                            '</div>' +
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

        // 单次加分开关
        html += '<div class="warden-form-row">';
        html += '<label>单次加分开关:</label>';
        html += '<label class="kw-toggle" style="flex:0 0 auto;">';
        html += '<input type="checkbox" id="warden-score-single-user">';
        html += '<span class="kw-slider"></span>';
        html += '</label>';
        html += '<span style="font-size:11px;color:#8b6914;">同一用户仅加分一次，检测到已加分用户则跳过（仅对本次加分有效）</span>';
        html += '</div>';

        // 被CCQ用户不加分
        html += '<div class="warden-form-row">';
        html += '<label>被CCQ用户不加分:</label>';
        html += '<label class="kw-toggle" style="flex:0 0 auto;">';
        html += '<input type="checkbox" id="warden-score-skip-ccq">';
        html += '<span class="kw-slider"></span>';
        html += '</label>';
        html += '<span style="font-size:11px;color:#8b6914;">版面声望≤-501的用户不执行加分</span>';
        html += '</div>';

        // 跳过锁隐楼层
        html += '<div class="warden-form-row">';
        html += '<label>跳过锁隐楼层:</label>';
        html += '<label class="kw-toggle" style="flex:0 0 auto;">';
        html += '<input type="checkbox" id="warden-score-skip-deleted">';
        html += '<span class="kw-slider"></span>';
        html += '</label>';
        html += '<span style="font-size:11px;color:#8b6914;">包含"删除"标签的锁隐楼层不加分</span>';
        html += '</div>';

        // 跳过低于发帖数的用户
        html += '<div class="warden-form-row">';
        html += '<label>最低发帖数:</label>';
        html += '<label class="kw-toggle" style="flex:0 0 auto;">';
        html += '<input type="checkbox" id="warden-score-minpost-enable">';
        html += '<span class="kw-slider"></span>';
        html += '</label>';
        html += '<input type="number" class="warden-input warden-input-short" id="warden-score-minpost" value="0" min="0" step="1" title="发帖数低于此值的用户不加分">';
        html += '<span style="font-size:11px;color:#8b6914;">发帖数低于设定值的用户不加分（0=不限制）</span>';
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
    // UI: 查看本帖举报页面
    // ===================================
    function createThreadReportPageHTML() {
        var html = '';
        html += '<div class="warden-section">';
        html += '<h3>查看本帖举报</h3>';
        html += '<p style="font-size:12px;color:#8b6914;">获取当前帖子的举报信息。在帖子页面（read.php）中使用。</p>';
        html += '</div>';

        html += '<div class="warden-section">';
        html += '<div class="warden-form-row">';
        html += '<label>当前TID:</label>';
        html += '<span style="color:#492e1b;font-weight:bold;">' + (getCurrentTid() || '未检测到TID') + '</span>';
        html += '</div>';

        html += '<div style="margin:8px 0;">';
        html += '<button class="warden-btn" id="warden-btn-fetch-reports">刷新举报数据</button>';
        html += '</div>';

        // 举报统计
        html += '<div id="warden-report-stats" style="display:none;margin-bottom:8px;font-size:13px;">';
        html += '共 <strong id="warden-report-count" style="color:#c0392b;">0</strong> 条举报';
        html += '</div>';

        // 举报列表
        html += '<div id="warden-report-list" style="max-height:400px;overflow-y:auto;background:#fff;border:1px solid #d4c5a9;">';
        html += '<div style="padding:20px;text-align:center;color:#8b6914;">点击"刷新举报数据"获取举报信息</div>';
        html += '</div>';

        html += '</div>';

        return html;
    }

    // ===================================
    // 查看本帖举报引擎
    // ===================================
    // 查看本帖举报引擎（使用 admin_log_search 接口）
    var REPORT_PAGE = 1;

    function fetchThreadReports(page) {
        var tid = getCurrentTid();
        if (!tid) { alert('当前页面未检测到TID，请在帖子页面使用'); return; }

        page = page || 1;
        REPORT_PAGE = page;
        updateReportListUI('<div style="padding:20px;text-align:center;color:#8b6914;">正在获取举报数据(第' + page + '页)...</div>');

        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/nuke.php?__lib=admin_log_search&__act=search&from=&to=&id=', true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.timeout = 20000;
        xhr.onload = function() {
            if (xhr.status !== 200) {
                updateReportListUI('<div style="padding:20px;text-align:center;color:#c0392b;">获取失败 (HTTP ' + xhr.status + ')</div>');
                return;
            }
            try {
                // 解析 window.script_muti_get_var_store = {...};
                // 去掉前缀（含赋值语句）和后缀（;</script>之后的内容）
                // 去除前缀
                var raw = xhr.responseText.replace(/^[\s\S]*?window\.script_muti_get_var_store\s*=\s*/, '');
                // 使用括号计数找到JSON结束位置（处理嵌套对象）
                var depth = 0, endIdx = -1;
                for (var ci = 0; ci < raw.length; ci++) {
                    if (raw[ci] === '{') depth++;
                    else if (raw[ci] === '}') { depth--; if (depth === 0) { endIdx = ci; break; } }
                }
                if (endIdx === -1) {
                    updateReportListUI('<div style="padding:20px;text-align:center;color:#c0392b;">响应解析失败：未找到JSON结束位置</div>');
                    return;
                }
                var jsonStr = raw.substring(0, endIdx + 1);
                var data = JSON.parse(jsonStr);
                if (data.error) {
                    updateReportListUI('<div style="padding:20px;text-align:center;color:#c0392b;">API错误: ' + JSON.stringify(data.error) + '</div>');
                    return;
                }
                var reports = parseReportData(data);
                renderThreadReports(reports, tid, page);
            } catch(e) {
                updateReportListUI('<div style="padding:20px;text-align:center;color:#c0392b;">解析失败: ' + e.message + '</div>');
            }
        };
        xhr.onerror = function() { updateReportListUI('<div style="padding:20px;text-align:center;color:#c0392b;">网络请求失败</div>'); };
        xhr.ontimeout = function() { updateReportListUI('<div style="padding:20px;text-align:center;color:#c0392b;">请求超时</div>'); };
        xhr.send('type=3&about=' + tid + '&about2=&page=' + page + '&__output=3');
    }

    function parseReportData(data) {
        var reports = [];
        if (!data.data) return reports;
        // 举报数据在 data.data.0（key为0,1,2...是各条举报）
        var section = data.data['0'];
        if (!section) return reports;
        // 用户UID→昵称映射在 data.data.1
        var userMap = data.data['1'] || {};
        // 遍历举报列表（跳过非数字key如length等）
        for (var k in section) {
            if (section.hasOwnProperty(k) && /^\d+$/.test(k) && k.length < 3) {
                var r = section[k];
                var reporterUid = String(r[2] || '');
                var targetUid = String(r[3] || '');
                var reasonText = r[5] || '';
                // 从理由中解码TID/PID
                var tagInfo = extractTagInfo(reasonText);
                reports.push({
                    id: r[0],
                    reporterUid: reporterUid,
                    reporterNick: userMap[reporterUid] || reporterUid,
                    targetUid: targetUid,
                    targetNick: userMap[targetUid] || targetUid,
                    tid: r[4] || tagInfo.tid,
                    pid: tagInfo.pid || '',
                    reason: reasonText,
                    time: r[6]
                });
            }
        }
        reports.sort(function(a, b) { return b.time - a.time; });
        return reports;
    }

    // 从理由中提取解码后的TID/PID
    function extractTagInfo(reason) {
        var info = { tid: '', pid: '' };
        if (!reason) return info;
        var match = reason.match(/\[TQ:([^\],]+)(?:,([^\]]+))?\]/);
        if (match) {
            if (match[1]) info.tid = base62ReverseCase(match[1]);
            if (match[2]) info.pid = base62ReverseCase(match[2]);
        }
        return info;
    }

    function formatReportTimestamp(ts) {
        var d = new Date(ts * 1000);
        var pad = function(n) { return (n < 10 ? '0' : '') + n; };
        return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate()) + ' ' +
               pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    }

    function renderThreadReports(reports, tid, page) {
        var countEl = document.getElementById('warden-report-count');
        var statsEl = document.getElementById('warden-report-stats');
        if (countEl) countEl.textContent = reports.length;
        if (statsEl) statsEl.style.display = 'block';

        var listEl = document.getElementById('warden-report-list');
        if (!listEl) return;

        if (reports.length === 0) {
            listEl.innerHTML = '<div style="padding:20px;text-align:center;color:#8b6914;">暂无该帖子的举报记录</div>';
            return;
        }

        var html = '<div style="overflow-x:auto;">';
        html += '<table style="width:100%;border-collapse:collapse;font-size:12px;">';
        html += '<thead><tr style="background:#e0cfa6;">';
        html += '<th style="padding:6px 8px;border:1px solid #c4a87c;text-align:left;white-space:nowrap;">时间</th>';
        html += '<th style="padding:6px 8px;border:1px solid #c4a87c;text-align:left;white-space:nowrap;">举报人</th>';
        html += '<th style="padding:6px 8px;border:1px solid #c4a87c;text-align:left;white-space:nowrap;">PID</th>';
        html += '<th style="padding:6px 8px;border:1px solid #c4a87c;text-align:left;white-space:nowrap;">被举报人</th>';
        html += '<th style="padding:6px 8px;border:1px solid #c4a87c;text-align:left;">举报理由</th>';
        html += '<th style="padding:6px 8px;border:1px solid #c4a87c;text-align:center;white-space:nowrap;">操作</th>';
        html += '</tr></thead><tbody>';

        for (var i = 0; i < reports.length; i++) {
            var r = reports[i];
            var pidLink = r.pid ? '<a href="https://bbs.nga.cn/read.php?tid=' + r.tid + '&pid=' + r.pid + '&to=1" target="_blank" style="color:#b56700;">' + r.pid + '</a>' : '-';
            var reporterLink = '<a href="https://bbs.nga.cn/nuke.php?func=ucp&uid=' + r.reporterUid + '" target="_blank" style="color:#b56700;" title="UID:' + r.reporterUid + '">' + escapeHtml(r.reporterNick) + '</a>';
            var targetLink = '<a href="https://bbs.nga.cn/nuke.php?func=ucp&uid=' + r.targetUid + '" target="_blank" style="color:#b56700;" title="UID:' + r.targetUid + '">' + escapeHtml(r.targetNick) + '</a>';
            var bg = (i % 2 === 0) ? '#faf7f0' : '#fff';

            html += '<tr style="background:' + bg + ';">';
            html += '<td style="padding:5px 8px;border:1px solid #d4c5a9;white-space:nowrap;">' + formatReportTimestamp(r.time) + '</td>';
            html += '<td style="padding:5px 8px;border:1px solid #d4c5a9;">' + reporterLink + '</td>';
            html += '<td style="padding:5px 8px;border:1px solid #d4c5a9;">' + pidLink + '</td>';
            html += '<td style="padding:5px 8px;border:1px solid #d4c5a9;">' + targetLink + '</td>';
            html += '<td style="padding:5px 8px;border:1px solid #d4c5a9;">' + escapeHtml(cleanReportReason(r.reason)) + '</td>';
            html += '<td style="padding:5px 8px;border:1px solid #d4c5a9;text-align:center;white-space:nowrap;">';
            var previewPid = r.pid || '0';
            html += '<button class="warden-btn" onclick="commonui.cancelBubble(event);commonui.cancelEvent(event);ubbcode.fastViewPost(event,' + r.tid + ',' + previewPid + ',0,this)" style="padding:2px 8px;font-size:11px;">预览</button> ';
            if (r.pid && r.tid) {
                html += '<button class="warden-btn danger warden-report-lockhide" data-tid="' + r.tid + '" data-pid="' + r.pid + '" style="padding:2px 8px;font-size:11px;">锁隐</button>';
            }
            html += '</td>';
            html += '</tr>';
        }

        html += '</tbody></table></div>';

        // 分页
        html += '<div style="padding:8px;text-align:center;font-size:12px;">';
        if (page > 1) {
            html += '<button class="warden-btn warden-report-prev" data-page="' + (page-1) + '" style="margin-right:4px;">上一页</button>';
        }
        html += '<span style="color:#6b4e2e;">第' + page + '页</span> ';
        if (reports.length >= 20) {
            html += '<button class="warden-btn warden-report-next" data-page="' + (page+1) + '" style="margin-left:4px;">下一页</button>';
        }
        html += '</div>';

        listEl.innerHTML = html;

        // 绑定锁隐按钮事件
        var lockhideBtns = listEl.querySelectorAll('.warden-report-lockhide');
        for (var lh = 0; lh < lockhideBtns.length; lh++) {
            lockhideBtns[lh].addEventListener('click', function() {
                var btnTid = this.getAttribute('data-tid');
                var btnPid = this.getAttribute('data-pid');
                if (!confirm('确定要锁隐 TID:' + btnTid + ' PID:' + btnPid + ' 吗？')) return;
                var xhr = new XMLHttpRequest();
                xhr.open('POST', '/nuke.php', true);
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                xhr.timeout = 15000;
                xhr.onload = function() {
                    if (xhr.status === 200) {
                        try { var resp = JSON.parse(xhr.responseText); if (resp.error) alert('失败: ' + JSON.stringify(resp.error)); else alert('锁隐成功'); }
                        catch(e) { alert('锁隐操作已完成'); }
                    } else { alert('请求失败 HTTP ' + xhr.status); }
                };
                xhr.onerror = function() { alert('网络请求失败'); };
                xhr.send('__lib=topic_lock&__act=set&ids=' + encodeURIComponent(btnTid + ',' + btnPid) +
                         '&ton=0&toff=0&pon=1026&poff=0&pm=0&info=&raw=3');
            });
        }

        // 绑定分页按钮事件
        var prevBtns = listEl.querySelectorAll('.warden-report-prev');
        for (var pi = 0; pi < prevBtns.length; pi++) {
            prevBtns[pi].addEventListener('click', function() {
                fetchThreadReports(parseInt(this.getAttribute('data-page')));
            });
        }
        var nextBtns = listEl.querySelectorAll('.warden-report-next');
        for (var ni = 0; ni < nextBtns.length; ni++) {
            nextBtns[ni].addEventListener('click', function() {
                fetchThreadReports(parseInt(this.getAttribute('data-page')));
            });
        }
    }

    // 解码举报标签 [TQ:3bNdq,Xb6aO] → [Tid:xxx,Pid:xxxx]
    function decodeReportTag(reason) {
        if (!reason) return reason;
        return reason.replace(/\[TQ:([^\],]+)(?:,([^\]]+))?\]/g, function(match, tidCode, pidCode) {
            var tid = tidCode ? base62ReverseCase(tidCode) : '';
            var pid = pidCode ? base62ReverseCase(pidCode) : '';
            if (tid && pid) return '[Tid:' + tid + ',Pid:' + pid + ']';
            if (tid) return '[Tid:' + tid + ']';
            return match;
        });
    }

    // 大小写反转后 base62→decimal
    function base62ReverseCase(code) {
        var reversed = '';
        for (var i = 0; i < code.length; i++) {
            var ch = code.charAt(i);
            if (ch >= 'a' && ch <= 'z') reversed += ch.toUpperCase();
            else if (ch >= 'A' && ch <= 'Z') reversed += ch.toLowerCase();
            else reversed += ch;
        }
        var result = 0;
        for (var j = 0; j < reversed.length; j++) {
            var c = reversed.charAt(j);
            var val;
            if (c >= '0' && c <= '9') val = c.charCodeAt(0) - 48;
            else if (c >= 'A' && c <= 'Z') val = c.charCodeAt(0) - 65 + 10;
            else if (c >= 'a' && c <= 'z') val = c.charCodeAt(0) - 97 + 36;
            else val = 0;
            result = result * 62 + val;
        }
        return result;
    }

    // 清理举报理由：去除 [Tid:xxx,Pid:xxx] 前缀和 [TID:xxx] 后缀
    function cleanReportReason(reason) {
        if (!reason) return '';
        var text = decodeReportTag(reason);
        text = text.replace(/^\[Tid:\d+(?:,Pid:\d+)?\]\s*/, '');
        text = text.replace(/\s*\[TID:\d+\]$/, '');
        return text.trim();
    }

    function updateReportListUI(content) {
        var listEl = document.getElementById('warden-report-list');
        if (listEl) listEl.innerHTML = content;
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
        var singleUserEl = document.getElementById('warden-score-single-user');
        if (singleUserEl) singleUserEl.checked = settings.singleScorePerUser === true;
        var skipCCQEl = document.getElementById('warden-score-skip-ccq');
        if (skipCCQEl) skipCCQEl.checked = settings.skipCCQ === true;
        var skipDeletedEl = document.getElementById('warden-score-skip-deleted');
        if (skipDeletedEl) skipDeletedEl.checked = settings.skipDeleted === true;
        var minPostEnableEl = document.getElementById('warden-score-minpost-enable');
        if (minPostEnableEl) minPostEnableEl.checked = settings.minPostCountEnabled === true;
        var minPostEl = document.getElementById('warden-score-minpost');
        if (minPostEl) minPostEl.value = settings.minPostCount || 0;
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
        var singleUserEl = document.getElementById('warden-score-single-user');
        var skipCCQEl = document.getElementById('warden-score-skip-ccq');
        var skipDeletedEl = document.getElementById('warden-score-skip-deleted');
        var minPostEnableEl = document.getElementById('warden-score-minpost-enable');
        var minPostEl = document.getElementById('warden-score-minpost');

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
        settings.singleScorePerUser = singleUserEl ? singleUserEl.checked : false;
        settings.skipCCQ = skipCCQEl ? skipCCQEl.checked : false;
        settings.skipDeleted = skipDeletedEl ? skipDeletedEl.checked : false;
        settings.minPostCountEnabled = minPostEnableEl ? minPostEnableEl.checked : false;
        settings.minPostCount = minPostEl ? parseInt(minPostEl.value) || 0 : 0;
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

    // 页签顺序与页面 DOM 顺序解耦：索引 = 页签在标签栏里的位置，值 = data-page 编号。
    // 这样要调整页签先后（例如把"锁隐树"放到"设置"前面）不需要搬动大段 HTML。
    var TAB_PAGE = [0, 1, 2, 3, 4, 5];

    function switchTab(index) {
        var tabBtns = document.querySelectorAll('#nga-warden-tabs .tab-btn');
        var pages = document.querySelectorAll('#nga-warden-body .warden-page');
        var want = TAB_PAGE[index];
        for (var i = 0; i < tabBtns.length; i++) {
            tabBtns[i].classList.toggle('active', i === index);
        }
        for (var j = 0; j < pages.length; j++) {
            var page = Number(pages[j].getAttribute('data-page'));
            if (isNaN(page)) page = j;
            pages[j].classList.toggle('active', page === want);
        }
        if (index === 0) {
            updatePageInfoUI();
            loadSettingsToForm();
        }
        if (index === 4) {
            loadTreeSettingsToForm();
            updateTreePermHint();
        }
        if (index === 5) {
            var as = loadAppSettings();
            var removeLoginToggle = document.getElementById('warden-setting-remove-login');
            if (removeLoginToggle) removeLoginToggle.checked = as.removeLoginBtn;
            var watermarkToggle = document.getElementById('warden-setting-watermark');
            if (watermarkToggle) watermarkToggle.checked = as.removeWatermark;
            var votesToggle = document.getElementById('warden-setting-votes');
            if (votesToggle) votesToggle.checked = as.showVotes;
            var notesToggle = document.getElementById('warden-setting-notes');
            if (notesToggle) notesToggle.checked = as.showPrivateNotes;
            loadNukeSettingsToForm();
        }
    }

    // ===================================
    // UI: 锁隐树设置同步
    // ===================================
    function loadTreeSettingsToForm() {
        var as = loadAppSettings();
        var nodes = document.querySelectorAll('[data-tree-setting]');
        for (var i = 0; i < nodes.length; i++) {
            var key = nodes[i].getAttribute('data-tree-setting');
            if (!as.hasOwnProperty(key)) continue;
            if (nodes[i].type === 'checkbox') nodes[i].checked = as[key] === true;
            else nodes[i].value = as[key];
        }
    }

    function updateTreePermHint() {
        var hint = document.getElementById('warden-tree-perm-hint');
        if (!hint) return;
        if (!getCurrentTid()) {
            hint.textContent = '当前不在帖子页（read.php），请进入帖子后再使用锁隐树。';
            hint.style.color = '#8b6914';
            return;
        }
        if (!hasWardenPermission(null)) {
            hint.textContent = '当前账号/版面没有检测到管理权限，楼层上不会出现锁隐树入口。请确认已登录且在本版有版主权限。';
            hint.style.color = '#c0392b';
            return;
        }
        hint.textContent = '已检测到管理权限，楼层操作栏会出现"锁隐树"入口。';
        hint.style.color = '#1e8449';
    }

    function addTreeLogEntry(type, message) {
        var logEl = document.getElementById('nga-warden-tree-log');
        if (!logEl) return;
        var line = document.createElement('div');
        line.className = 'log-line ' + type;
        var now = new Date();
        var hh = ('0' + now.getHours()).slice(-2);
        var mm = ('0' + now.getMinutes()).slice(-2);
        var ss = ('0' + now.getSeconds()).slice(-2);
        line.textContent = '[' + hh + ':' + mm + ':' + ss + '] ' + message;
        logEl.appendChild(line);
        logEl.scrollTop = logEl.scrollHeight;
        while (logEl.children.length > 300) logEl.removeChild(logEl.firstChild);
    }

    function clearTreeLog() {
        var logEl = document.getElementById('nga-warden-tree-log');
        if (logEl) logEl.innerHTML = '';
    }

    // ===================================
    // UI: 次级NUKE默认值设置同步
    // ===================================
    function loadNukeSettingsToForm() {
        var as = loadAppSettings();
        var nodes = document.querySelectorAll('[data-nuke-setting]');
        for (var i = 0; i < nodes.length; i++) {
            var key = nodes[i].getAttribute('data-nuke-setting');
            if (!as.hasOwnProperty(key)) continue;
            if (nodes[i].type === 'checkbox') nodes[i].checked = as[key] === true;
            else nodes[i].value = as[key];
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

        // ========== 锁隐树设置事件 ==========
        var treeNodes = document.querySelectorAll('[data-tree-setting]');
        for (var ti = 0; ti < treeNodes.length; ti++) {
            (function(el) {
                var key = el.getAttribute('data-tree-setting');
                el.addEventListener('change', function() {
                    var value = el.type === 'checkbox' ? el.checked : el.value;
                    if (key === 'treeMaxPages') {
                        var n = parseInt(value, 10);
                        if (!isFinite(n) || n < 1) n = 1;
                        if (n > 10) n = 10;
                        value = n;
                        el.value = n;
                    }
                    setAppSetting(key, value);
                    if (TREE_FEATURE && typeof TREE_FEATURE.onSettingsChanged === 'function') {
                        TREE_FEATURE.onSettingsChanged(key);
                    }
                    addTreeLogEntry('info', '设置已保存：' + key + ' = ' + value);
                });
            })(treeNodes[ti]);
        }
        loadTreeSettingsToForm();

        // ========== 次级NUKE默认值设置事件 ==========
        var nukeNodes = document.querySelectorAll('[data-nuke-setting]');
        for (var ni = 0; ni < nukeNodes.length; ni++) {
            (function(el) {
                var key = el.getAttribute('data-nuke-setting');
                el.addEventListener('change', function() {
                    var value = el.type === 'checkbox' ? el.checked : el.value;
                    setAppSetting(key, value);
                    addTreeLogEntry('info', '次级NUKE默认值已保存：' + key + ' = ' + value);
                    // 官方弹窗正开着时立即生效
                    if (NUKE_DEFAULTS && typeof NUKE_DEFAULTS.applyNow === 'function') {
                        try { NUKE_DEFAULTS.applyNow(); } catch (e) { logError('应用次级NUKE默认值失败', e); }
                    }
                });
            })(nukeNodes[ni]);
        }
        loadNukeSettingsToForm();

        var nukeApplyBtn = document.getElementById('warden-btn-nuke-apply');
        if (nukeApplyBtn) {
            nukeApplyBtn.addEventListener('click', function() {
                if (!NUKE_DEFAULTS || typeof NUKE_DEFAULTS.applyNow !== 'function') {
                    alert('次级NUKE默认值模块未就绪。');
                    return;
                }
                try {
                    NUKE_DEFAULTS.applyNow();
                    addTreeLogEntry('info', '已尝试把默认值应用到当前次级NUKE弹窗');
                } catch (e) {
                    logError('应用次级NUKE默认值失败', e);
                    alert('应用失败：' + (e && e.message ? e.message : e));
                }
            });
        }

        var treeLogClearBtn = document.getElementById('warden-btn-tree-log-clear');
        if (treeLogClearBtn) {
            treeLogClearBtn.addEventListener('click', function() {
                clearTreeLog();
                addTreeLogEntry('info', '日志已清除');
            });
        }

        // ========== 查看本帖举报事件 ==========

        var fetchReportsBtn = document.getElementById('warden-btn-fetch-reports');
        if (fetchReportsBtn) {
            fetchReportsBtn.addEventListener('click', function() {
                fetchThreadReports(1);
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
            if (appSettings.removeWatermark) applyRemoveWatermark();
            if (appSettings.showVotes) applyShowVotes();
            if (appSettings.showPrivateNotes) applyShowPrivateNotes();

            // 锁隐回复树 / 锁隐作者树 / 次级NUKE默认值
            try {
                if (TREE_FEATURE && typeof TREE_FEATURE.install === 'function') {
                    TREE_FEATURE.install();
                }
                if (NUKE_DEFAULTS && typeof NUKE_DEFAULTS.install === 'function') {
                    NUKE_DEFAULTS.install();
                }
            } catch (e) {
                logError('锁隐树/NUKE默认值 初始化异常', e);
            }
            updateTreePermHint();

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

    // ---- 模块构造必须在 init() 之前完成 ----
    // Tampermonkey 在 document-start 注入时 readyState='loading'，init 会等到
    // DOMContentLoaded，那时模块已就绪；但某些管理器的注入时机是 interactive/
    // complete，init() 会在本文件解析过程中被同步调用 —— 如果模块构造写在后面，
    // 那一刻 TREE_FEATURE 还是 null，install() 就被静默跳过（面板照建，功能全废）。
    // 函数声明会被提升，所以这里可以安全地调用下面才定义的构造函数。
    try {
        TREE_FEATURE = typeof buildTreeFeature === 'function' ? buildTreeFeature() : null;
    } catch (e) {
        TREE_FEATURE = null;
        logError('锁隐树模块初始化失败', e);
    }
    try {
        NUKE_DEFAULTS = typeof buildNukeDefaults === 'function' ? buildNukeDefaults() : null;
    } catch (e) {
        NUKE_DEFAULTS = null;
        logError('次级NUKE默认值模块初始化失败', e);
    }
    // 便于调试/自动化校验时获取模块引用（不参与页面逻辑）
    try {
        window.__NGA_WARDEN_MODULES = {
            tree: TREE_FEATURE,
            nukeDefaults: NUKE_DEFAULTS,
            loadSettings: loadAppSettings,
            saveSettings: saveAppSettings,
            setSetting: setAppSetting
        };
    } catch (e) { /* 页面可能禁止写 window */ }

    // 等待页面准备就绪
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ---- spliced module: tree-feature.js ----
        function buildTreeFeature() {
            var PER_PAGE = 20;
            var TOAST_MS = 3000;
            var PON = 1026;
            var running = false;
            var lastOp = null;
            var installed = false;
            var observer = null;
            var debounceTimer = null;
            var poller = null;
            var watchTimer = null;
            var menuEl = null;
            var menuAnchor = null;

            function loadSettings() {
                return loadAppSettings();
            }

            function maxPages() {
                var s = loadSettings();
                var n = Number(s.treeMaxPages);
                var v = Number.isFinite(n) && n > 0 ? n : 10;
                return Math.min(10, Math.max(1, v));
            }

            function skipLocked() {
                var s = loadSettings();
                return !!s.treeSkipLocked;
            }

            // All visual styling lives in the host stylesheet (user.js injects
            // #nga-warden-* CSS, including a.nga-wd-tree-btn / #nga-wd-tree-menu /
            // #nga-wd-toast). Keeping a second copy here caused conflicting rules
            // (10px label, 2px borders) and made the entry hard to see/tap.
            function ensureStyle() {
                /* intentionally empty: styles are owned by the host */
            }

            function readRow(row) {
                var floor = 0;
                var m = row.id && row.id.match(/\d+$/);
                if (m) floor = parseInt(m[0], 10) || 0;
                var pid = 0;
                var pidEl = row.querySelector('[id^="pid"]');
                if (pidEl) {
                    var pm = pidEl.id.match(/^pid(\d+)/);
                    if (pm) pid = parseInt(pm[1], 10) || 0;
                }
                var authorUid = 0;
                var authorEl = row.querySelector('.userlink.author, [id^="postauthor"]');
                if (authorEl) {
                    var uidAttr = authorEl.getAttribute('data-nga-wd-hover-uid');
                    if (uidAttr) authorUid = parseInt(uidAttr, 10) || 0;
                    if (!authorUid) {
                        var href = authorEl.getAttribute('href') || '';
                        var hm = href.match(/uid=(\d+)/);
                        if (hm) authorUid = parseInt(hm[1], 10) || 0;
                    }
                }
                return { row: row, floor: floor, pid: pid, authorUid: authorUid };
            }

            // ============================================================
            // Entry points are registered in NGA's OWN button system
            // (commonui.postBtn.d + genB-created controls), exactly the way NGA Warden
            // Utils does it. That is what makes them appear as native-looking buttons
            // in the hover bar next to 引用/编辑/更多, and again under 更多 -> 管理.
            // Injecting our own <a> into the floor markup (the previous approach) did
            // not survive NGA re-rendering and never looked native.
            // ============================================================
            var BTN_TREE = 91;
            var BTN_AUTHOR = 92;
            var BTN_PAGE = 93;
            var BTN_LESSER = 14;
            var LABEL_TREE = '\u9501\u9690\u56DE\u590D\u6811';
            var LABEL_AUTHOR = '\u9501\u9690\u4F5C\u8005\u6811';
            var LABEL_PAGE = '\u9501\u9690\u672C\u9875';
            var LABEL_TREE_N3 = '.\u9501\u9690.\u56DE\u590D\u6811';
            var LABEL_AUTHOR_N3 = '.\u9501\u9690.\u4F5C\u8005\u6811';
            var LABEL_PAGE_N3 = '.\u9501\u9690.\u672C\u9875';
            var MAX_GENB_WRAPS = 20;
            var entryWraps = 0;

            function postBtnOf() {
                var w = pageWindow();
                return (w.commonui && w.commonui.postBtn) || null;
            }

            function adminList(pb) {
                return (pb && pb.all && pb.all['\u7BA1\u7406']) || null;
            }

            function settings_() {
                return loadSettings() || {};
            }

            // \u7BA1\u7406\u6743\u9650\uff1a\u4f18\u5148\u7528\u5b98\u65b9\u6309\u94ae\u7684 ck()\uff0c
            // \u56DE\u9000\u5230\u5bbf\u4e3b\u63d0\u4f9b\u7684 hasWardenPermission()\u3002
            function argAllowed(id, arg) {
                var pb = postBtnOf();
                var spec = pb && pb.d && pb.d[id];
                if (spec && typeof spec.ck === 'function' && arg) {
                    try { return !!spec.ck(arg); } catch (err) { /* fall through */ }
                }
                return false;
            }

            function surfaceAllowed(arg) {
                if (argAllowed(BTN_LESSER, arg)) return true;
                if (typeof hasWardenPermission === 'function') {
                    try { return !!hasWardenPermission(arg); } catch (err) { return false; }
                }
                return false;
            }

            function isTopicArg(a) {
                if (!a || !a.tid || (a.pid | 0) > 0) return false;
                var floor = (a.i != null) ? (a.i | 0) : (a.lou | 0);
                return floor === 0;
            }

            function argAuthorId(a) {
                if (!a) return 0;
                var direct = (a.pAid | 0) || (a.authorid | 0) || (a.uid | 0);
                if (direct > 0) return direct;
                var pid = a.pid | 0;
                var R = pageWindow().__R;
                if (pid && R) {
                    var vals = Object.values(R);
                    for (var i = 0; i < vals.length; i++) {
                        if (vals[i] && Number(vals[i].pid) === pid) {
                            return Number(vals[i].authorid) || 0;
                        }
                    }
                }
                return 0;
            }

            function argsFromPage() {
                var w = pageWindow();
                var data = w.commonui && w.commonui.postArg && w.commonui.postArg.data;
                var out = [];
                if (data) {
                    var vals = Object.values(data);
                    for (var i = 0; i < vals.length; i++) {
                        if (vals[i] && vals[i].tid) out.push(vals[i]);
                    }
                }
                return out;
            }

            function surfaceUsable(arg) {
                if (!arg || !arg.tid) return false;
                var s = settings_();
                if (isTopicArg(arg)) return s.lockHideReplyTree !== false;
                if ((arg.pid | 0) > 0) return s.lockHideReplyTree !== false;
                return false;
            }

            function markBtn(btn, kind) {
                if (!btn) return btn;
                btn.setAttribute('data-nga-wd-entry', kind);
                return btn;
            }

            function btnFromEvent(e) {
                var t = e && e.target;
                if (!t) return null;
                return t.closest ? t.closest('a') : t;
            }

            // Register / refresh the two official menu entries.
            function registerMenuEntries() {
                var pb = postBtnOf();
                if (!pb || !pb.d || typeof pb.d !== 'object') return false;
                var s = settings_();
                var allow = surfaceAllowed(null) || argsFromPage().some(surfaceAllowed);
                var on = !!s.treeButtons;

                if (on && allow) {
                    pb.d[BTN_TREE] = {
                        n1: LABEL_TREE,
                        n2: '\u56DE\u590D\uff1a\u9501\u9690\u6B64\u697C\u53CA\u5F15\u7528/\u56DE\u590D\u5B83\u7684\u697C\u3002'
                            + '\u4E3B\u9898\uff1a\u9501\u9690\u6574\u5E16\u3002',
                        n3: LABEL_TREE_N3,
                        init: function (btn) { markBtn(btn, 'tree'); },
                        ck: function (a) {
                            return !!(surfaceUsable(a) && surfaceAllowed(a));
                        },
                        on: function (e, a) {
                            if (!a || !a.tid) return;
                            var btn = btnFromEvent(e);
                            if (isTopicArg(a)) runTopicLock(a.tid, btn);
                            else runReplyTree(a.tid, a.pid | 0, btn);
                        }
                    };
                    if (s.lockHideAuthor !== false) {
                        pb.d[BTN_AUTHOR] = {
                            n1: LABEL_AUTHOR,
                            n2: '\u9501\u9690\u8BE5\u4F5C\u8005\u5728\u672C\u5E16\u7684\u53D1\u8A00\u53CA'
                                + '\u5F15\u7528\u8FD9\u4E9B\u53D1\u8A00\u7684\u56DE\u590D\u3002',
                            n3: LABEL_AUTHOR_N3,
                            init: function (btn) { markBtn(btn, 'author'); },
                            ck: function (a) {
                                return !!(surfaceUsable(a) && surfaceAllowed(a) && argAuthorId(a) > 0);
                            },
                            on: function (e, a) {
                                if (!a || !a.tid) return;
                                runAuthorTree(a.tid, a.pid | 0, argAuthorId(a), btnFromEvent(e));
                            }
                        };
                    } else {
                        delete pb.d[BTN_AUTHOR];
                    }
                    // \u9501\u9690\u672C\u9875\uff1a\u4E0E\u4F5C\u8005\u6811\u540C\u4E00\u5957\u5B9E\u73B0\u65B9\u5F0F\uff0c
                    // \u53EA\u662F\u6539\u6210\u626B\u63CF\u5F53\u524D\u9875\u7684\u5168\u90E8\u56DE\u590D\u3002
                    pb.d[BTN_PAGE] = {
                        n1: LABEL_PAGE,
                        n2: '\u9501\u9690\u672C\u9875\u6240\u6709\u56DE\u590D\u697C\u5C42\u3002',
                        n3: LABEL_PAGE_N3,
                        init: function (btn) { markBtn(btn, 'page'); },
                        ck: function (a) {
                            return !!(surfaceUsable(a) && surfaceAllowed(a));
                        },
                        on: function (e, a) {
                            if (!a || !a.tid) return;
                            runPageLock(a.tid, btnFromEvent(e));
                        }
                    };
                } else {
                    delete pb.d[BTN_TREE];
                    delete pb.d[BTN_AUTHOR];
                    delete pb.d[BTN_PAGE];
                }

                var admin = adminList(pb);
                if (admin) {
                    [BTN_TREE, BTN_AUTHOR, BTN_PAGE].forEach(function (id) {
                        var at = admin.indexOf(id);
                        if (at >= 0) admin.splice(at, 1);
                    });
                    if (on && allow) {
                        // unshift \u4ECE\u540E\u5F80\u524D\u63D2\uff0c\u6240\u4EE5\u987A\u5E8F\u8981\u5012\u7740\u5199\uff1a
                        // \u6700\u7EC8\u6392\u5217 = \u9501\u9690\u672C\u9875 | \u9501\u9690\u4F5C\u8005\u6811 | \u9501\u9690\u56DE\u590D\u6811
                        admin.unshift(BTN_PAGE);
                        if (s.lockHideAuthor !== false) admin.unshift(BTN_AUTHOR);
                        admin.unshift(BTN_TREE);
                    }
                }
                return !!(on && allow);
            }

            // \u65e7\u7248\u81ea\u5efa\u5165\u53e3\u7684\u6807\u8BB0\uff1a\u5347\u7EA7\u540e\u628a\u5B83\u6E05\u6389\u3002
            function removeLegacyEntries() {
                var btns = document.querySelectorAll('.nga-wd-tree-btn');
                for (var i = 0; i < btns.length; i++) {
                    var b = btns[i];
                    if (b.parentNode) b.parentNode.removeChild(b);
                }
            }

            // Wrap genB so the two buttons land in the hover bar beside 更多.
            // Faithful to NGA Warden Utils: siblings of the 更多 cell, never children
            // of the table (that shows up outside tbody as a stray first button).
            function wrapHoverBar() {
                var pb = postBtnOf();
                if (!pb || typeof pb.genB !== 'function') return false;
                if (pb.genB._ngaWdBtns || entryWraps >= MAX_GENB_WRAPS) return true;
                var orig = pb.genB.bind(pb);
                pb.genB = function (argid, opt) {
                    var bar = orig(argid, opt);
                    if (!bar || !bar.querySelectorAll) return bar;
                    var arg = this.argCache ? this.argCache[argid] : null;
                    if (!settings_().treeButtons || !surfaceAllowed(arg)) return bar;

                    var links = bar.querySelectorAll('a');
                    var more = null;
                    for (var i = 0; i < links.length; i++) {
                        if ((links[i].textContent || '').replace(/\s+/g, '') === '\u66F4\u591A') {
                            more = links[i];
                        }
                    }
                    var moreTd = more && more.closest ? more.closest('td') : null;

                    function place(btn) {
                        if (!btn) return;
                        var row = (moreTd && moreTd.parentNode)
                            || bar.querySelector('tbody tr') || bar.querySelector('tr');
                        if (row) {
                            var td = document.createElement('td');
                            td.appendChild(btn);
                            if (moreTd) row.insertBefore(td, moreTd);
                            else row.appendChild(td);
                            return;
                        }
                        if (more && more.parentNode) more.parentNode.insertBefore(btn, more);
                        else bar.appendChild(btn);
                    }
                    function findBtn(label) {
                        var found = bar.querySelectorAll('a');
                        for (var i = 0; i < found.length; i++) {
                            var t = (found[i].textContent || '').replace(/\s+/g, '');
                            if (t === label.replace(/\s+/g, '')) return found[i];
                        }
                        return null;
                    }
                    function put(id, label) {
                        var btn = findBtn(label);
                        if (!btn && typeof pb.genA === 'function' && pb.argCache) {
                            btn = pb.genA(pb.argCache[argid], id, 1);
                        }
                        if (!btn) return;
                        markBtn(btn, id === BTN_AUTHOR ? 'author' : 'tree');
                        place(btn);
                    }

                    var s = settings_();
                    // Each put() inserts immediately left of 更多, so we call them in
                    // reverse display order: 锁隐本页 ends up farthest right, next to
                    // 锁隐作者树.
                    put(BTN_PAGE, LABEL_PAGE);
                    if (s.lockHideAuthor !== false && !isTopicArg(arg)) put(BTN_AUTHOR, LABEL_AUTHOR);
                    put(BTN_TREE, LABEL_TREE);
                    return bar;
                };
                pb.genB._ngaWdBtns = true;
                entryWraps++;
                return true;
            }

            // NGA shows a hover bar per floor; drop any cached ones so a repaired bar
            // shows on the next hover.
            function wipeHoverBars() {
                var w = pageWindow();
                var data = w.commonui && w.commonui.postArg && w.commonui.postArg.data;
                if (!data) return;
                var vals = Object.values(data);
                for (var i = 0; i < vals.length; i++) {
                    var host = vals[i] && vals[i].pC;
                    if (host && host._postBtn) {
                        host._postBtn.remove();
                        host._postBtn = null;
                    }
                }
                if (w.commonui && w.commonui.postBtn) w.commonui.postBtn.currentBtn = null;
            }

            function refreshLabels() {
                /* labels are owned by NGA's own renderer now */
            }

            // Idempotent: if the menu is already intact this does NOTHING, so an open
            // or hovered action bar is never torn down (the reference's menuIntact()
            // idea). Only a broken menu is rebuilt, and only then are cached hover
            // bars dropped so a repaired bar appears on the next hover.
            function reparse() {
                if (!getCurrentTid()) return false;
                var settings = loadSettings();
                var state = menuState();
                if (!settings.treeButtons) {
                    if (state.ok) return true;
                    registerMenuEntries();
                    return false;
                }
                removeLegacyEntries();
                if (state.ok) return true;
                var ok = registerMenuEntries();
                if (ok) {
                    wrapHoverBar();
                    wipeHoverBars();
                }
                return ok;
            }

            function scheduleReparse() {
                if (debounceTimer) return;
                debounceTimer = setTimeout(function() {
                    debounceTimer = null;
                    reparse();
                }, 200);
            }

            function isOwnNode(n) {
                return !!(n && n.nodeType === 1
                    && ((n.id && n.id.indexOf('nga-wd-') === 0)
                        || (n.getAttribute && n.getAttribute('data-nga-wd'))));
            }

            // Only re-act when something the entry depends on actually appeared —
            // the same idea as the reference's addedWardenSurface(). Reparsing on every
            // DOM change is what kept rebuilding (and thus clearing) the action bar.
            var SURFACE_SEL = 'tr.topicrow, #topicrows tr, table.forumbox.postbox,'
                + ' .forumbox.postbox, .postbtnsc, .posterInfoLine, .native-none-menu,'
                + ' a[href*="/post.php?action=reply"]';

            function addedWardenSurface(node) {
                if (!node || node.nodeType !== 1) return false;
                try {
                    if (node.matches && node.matches(SURFACE_SEL)) return true;
                    if (node.querySelector && node.querySelector(SURFACE_SEL)) return true;
                } catch (err) { /* detached */ }
                return false;
            }

            function handleMutations(mutations) {
                var hit = false;
                for (var i = 0; i < mutations.length; i++) {
                    var m = mutations[i];
                    if (!m || isOwnNode(m.target)) continue;
                    var added = m.addedNodes;
                    if (!added || !added.length) continue;
                    for (var j = 0; j < added.length; j++) {
                        if (addedWardenSurface(added[j])) {
                            hit = true;
                            break;
                        }
                    }
                    if (hit) break;
                }
                if (hit) scheduleReparse();
            }

            function install() {
                if (installed) return;
                installed = true;
                document.addEventListener('click', onDocClick, true);
                document.addEventListener('keydown', onDocKey, true);
                // IMPORTANT: attach the observer unconditionally.
                // At document-start NGA has no floor rows yet and `window.__T` is still
                // empty, so gating on getCurrentTid() here meant the observer was never
                // installed and nothing was ever injected (entry never appeared).
                observeDocument();
                startFeature();
            }

            function observeDocument() {
                if (observer) return;
                try {
                    observer = new MutationObserver(handleMutations);
                    var root = document.documentElement || document.body || document.head;
                    if (root) observer.observe(root, { childList: true, subtree: true });
                } catch (err) {
                    observer = null;
                    logError('\u9501\u9690\u6811\u76d1\u89c6\u5668\u5b89\u88c5\u5931\u8d25', err);
                }
            }

            function startFeature() {
                if (!installed) return;
                var settings = loadSettings();
                observeDocument();
                if (!settings.treeButtons) {
                    registerMenuEntries();
                    return;
                }
                reparse();
                startWatch();
            }

            // \u53C2\u8003\u5B9E\u73B0\u7684\u505A\u6CD5\uFF1A\u4E0D\u662F\u56FA\u5B9A\u95F4\u9694\u53CD\u590D\u91CD\u88C5\uFF0C\u800C\u662F\u5148\u7528
            // menuIntact() \u505A\u4E00\u6B21\u5EC9\u4EF7\u68C0\u67E5\uFF08\u51E0\u4E2A\u5C5E\u6027\u8BFB\u53D6\uFF09\uFF0C
            // \u5B8C\u597D\u5C31\u4EC0\u4E48\u90FD\u4E0D\u505A\u3002\u91CD\u88C5\u624D\u4F1A\u6E05\u7406\u60AC\u505C\u6761\uFF0C\u5426\u5219\u4F1A\u628A\u6B63\u5728\u60AC\u505C\u7684
            // \u90A3\u6761 bar \u6BCF 500ms \u62C6\u4E00\u6B21\uFF08\u70B9\u4E0D\u4E0A\uFF09\u3002\u8282\u594F\u4E5F\u4EFF\u7167\u5B83\uFF1A
            // \u672A\u5C31\u7EEA 250ms \u91CD\u8BD5\uFF0C\u5C31\u7EEA\u540E 2000ms \u624D\u68C0\u4E00\u6B21\u3002
            var WATCH_IDLE_MS = 2000;
            var WATCH_BUSY_MS = 250;

            function startWatch() {
                if (watchTimer) return;
                (function tick() {
                    watchTimer = null;
                    var state = menuState();
                    if (state.broken) {
                        reparse();
                    }
                    watchTimer = setTimeout(tick, state.ok ? WATCH_IDLE_MS : WATCH_BUSY_MS);
                })();
            }

            function stopWatch() {
                if (watchTimer) {
                    clearTimeout(watchTimer);
                    watchTimer = null;
                }
            }

            // Cheap health check, modelled on the reference's menuIntact():
            // are our ids registered, in the 管理 list, and is genB still wrapped?
            function menuState() {
                var s = settings_();
                var wantOn = !!s.treeButtons;
                var pb = postBtnOf();
                if (!pb || !pb.d) return { ok: false, broken: false, allow: false };
                var allow = surfaceAllowed(null) || argsFromPage().some(surfaceAllowed);
                var admin = adminList(pb);
                var wantAuthor = wantOn && allow && s.lockHideAuthor !== false;
                var ok = (wantOn === (!!pb.d[BTN_TREE]))
                    && (wantOn === (!!pb.d[BTN_PAGE]))
                    && (wantAuthor === (!!pb.d[BTN_AUTHOR]))
                    && (entryWraps >= MAX_GENB_WRAPS
                        || (typeof pb.genB === 'function' && pb.genB._ngaWdBtns));
                if (admin) {
                    ok = ok
                        && ((wantOn && allow) === (admin.indexOf(BTN_TREE) >= 0))
                        && ((wantOn && allow) === (admin.indexOf(BTN_PAGE) >= 0))
                        && (wantAuthor === (admin.indexOf(BTN_AUTHOR) >= 0));
                }
                return { ok: ok, broken: !ok, allow: allow };
            }

            function stopPolling() {
                stopWatch();
            }

            function stopFeature() {
                if (debounceTimer) {
                    clearTimeout(debounceTimer);
                    debounceTimer = null;
                }
                stopPolling();
                if (observer) {
                    observer.disconnect();
                    observer = null;
                }
                closeMenu();
                removeLegacyEntries();
                // unregister our entries so NGA stops rendering them
                var pb = postBtnOf();
                if (pb && pb.d) {
                    delete pb.d[BTN_TREE];
                    delete pb.d[BTN_AUTHOR];
                    delete pb.d[BTN_PAGE];
                }
                var admin = adminList(pb);
                if (admin) {
                    [BTN_TREE, BTN_AUTHOR, BTN_PAGE].forEach(function (id) {
                        var at = admin.indexOf(id);
                        if (at >= 0) admin.splice(at, 1);
                    });
                }
                wipeHoverBars();
            }

            function onSettingsChanged(key) {
                if (key === 'treeButtons') {
                    var settings = loadSettings();
                    if (!settings.treeButtons) {
                        stopFeature();
                    } else {
                        startFeature();
                    }
                    return;
                }
                if (key === 'lockHideReplyTree' || key === 'lockHideAuthor'
                    || key === 'treeMaxPages' || key === 'treeSkipLocked') {
                    scheduleReparse();
                }
            }

            function closeMenu() {
                if (menuEl && menuEl.parentNode) menuEl.parentNode.removeChild(menuEl);
                menuEl = null;
                menuAnchor = null;
            }

            function onDocClick(e) {
                if (!menuEl) return;
                var t = e && e.target;
                if (t) {
                    if (menuEl === t || (menuEl.contains && menuEl.contains(t))) return;
                    if (menuAnchor && (menuAnchor === t || (menuAnchor.contains && menuAnchor.contains(t)))) return;
                }
                closeMenu();
            }

            function onDocKey(e) {
                if (e && e.key === 'Escape') closeMenu();
            }

            function openMenu(btn, info) {
                closeMenu();
                var settings = loadSettings();
                var menu = document.createElement('div');
                menu.id = 'nga-wd-tree-menu';
                menu.className = 'nga-wd-tree-menu';
                menu.setAttribute('data-nga-wd', 'menu');

                var rect = btn.getBoundingClientRect();
                var w = pageWindow();
                var scrollX = w.pageXOffset || document.documentElement.scrollLeft || 0;
                var scrollY = w.pageYOffset || document.documentElement.scrollTop || 0;
                var left = Math.round(rect.left + scrollX);
                var top = Math.round(rect.bottom + scrollY + 4);
                menu.style.left = left + 'px';
                menu.style.top = top + 'px';

                var title = document.createElement('div');
                title.id = 'nga-wd-tree-menu-title';
                title.className = 'nga-wd-tree-menu-title';
                title.setAttribute('data-nga-wd', 'menu-title');
                title.textContent = '\u9501\u9690\u6811';
                menu.appendChild(title);

                var hasPerm = hasWardenPermission();
                if (!hasPerm) {
                    var hint = document.createElement('div');
                    hint.className = 'nga-wd-tree-menu-hint';
                    hint.setAttribute('data-nga-wd', 'menu-hint');
                    hint.textContent = '\u5F53\u524D\u9875\u9762\u6CA1\u6709\u7BA1\u7406\u6743\u9650';
                    menu.appendChild(hint);
                } else {
                    var replyEnabled = !!settings.treeButtons && !!settings.lockHideReplyTree;
                    var replyBtn = document.createElement('button');
                    replyBtn.type = 'button';
                    replyBtn.id = 'nga-wd-tree-menu-reply';
                    replyBtn.className = 'nga-wd-tree-menu-item';
                    replyBtn.setAttribute('data-nga-wd', 'menu-item');
                    if (replyEnabled) {
                        replyBtn.textContent = '\u9501\u9690\u56DE\u590D\u6811';
                        replyBtn.addEventListener('click', function() {
                            closeMenu();
                            var tid = getCurrentTid();
                            if (info.floor === 0) {
                                runTopicLock(tid, btn);
                            } else {
                                runReplyTree(tid, info.pid, btn);
                            }
                        });
                    } else {
                        replyBtn.disabled = true;
                        replyBtn.textContent = '\u9501\u9690\u56DE\u590D\u6811\uFF08\u672A\u5F00\u542F\uFF09';
                    }
                    menu.appendChild(replyBtn);

                    if (info.floor !== 0) {
                        var authorEnabled = !!settings.treeButtons && !!settings.lockHideAuthor;
                        var authorBtn = document.createElement('button');
                        authorBtn.type = 'button';
                        authorBtn.id = 'nga-wd-tree-menu-author';
                        authorBtn.className = 'nga-wd-tree-menu-item';
                        authorBtn.setAttribute('data-nga-wd', 'menu-item');
                        if (authorEnabled) {
                            authorBtn.textContent = '\u9501\u9690\u4F5C\u8005\u6811';
                            authorBtn.addEventListener('click', function() {
                                closeMenu();
                                runAuthorTree(getCurrentTid(), info.pid, info.authorUid, btn);
                            });
                        } else {
                            authorBtn.disabled = true;
                            authorBtn.textContent = '\u9501\u9690\u4F5C\u8005\u6811\uFF08\u672A\u5F00\u542F\uFF09';
                        }
                        menu.appendChild(authorBtn);
                    }
                }

                document.documentElement.appendChild(menu);
                var mh = menu.offsetHeight || 96;
                var viewportH = w.innerHeight || document.documentElement.clientHeight || 0;
                if (top + mh > scrollY + viewportH) {
                    var newTop = Math.round(rect.top + scrollY - mh - 4);
                    if (newTop >= 0) menu.style.top = newTop + 'px';
                }
                menuEl = menu;
                menuAnchor = btn;
            }

            function decodeNga(buffer, contentType) {
                var ctype = contentType || '';
                if (/utf-?8/i.test(ctype)) {
                    return new TextDecoder('utf-8').decode(buffer);
                }
                if (/gb(?:k|2312|18030)/i.test(ctype)) {
                    return new TextDecoder('gb18030').decode(buffer);
                }
                try {
                    return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
                } catch (_) {
                    return new TextDecoder('gb18030').decode(buffer);
                }
            }

            // NGA answers `lite=js` in more than one shape depending on path/version:
            //   1) window.script_muti_get_var_store = {...};
            //   2) window.script_muti_get_var_store = {...};   (with a var declaration)
            //   3) plain JSON body
            //   4) an HTML error / interstitial page
            // The old code threw on shapes 3/4 with a confusing message. Now every
            // shape is recognised, and a failure carries the real reason + a snippet.
            function extractStoreJson(text) {
                if (!text) return null;
                var idx = text.indexOf('script_muti_get_var_store');
                if (idx < 0) return null;
                var start = text.indexOf('=', idx);
                if (start < 0) return null;
                start += 1;
                while (start < text.length && /\s/.test(text.charAt(start))) start++;
                if (text.charAt(start) !== '{') return null;
                var depth = 0;
                var inString = false;
                var quoteChar = '';
                var escaped = false;
                for (var i = start; i < text.length; i++) {
                    var ch = text.charAt(i);
                    if (inString) {
                        if (escaped) {
                            escaped = false;
                        } else if (ch === '\\') {
                            escaped = true;
                        } else if (ch === quoteChar) {
                            inString = false;
                        }
                        continue;
                    }
                    if (ch === '"' || ch === "'") {
                        inString = true;
                        quoteChar = ch;
                        continue;
                    }
                    if (ch === '{') {
                        depth++;
                    } else if (ch === '}') {
                        depth--;
                        if (depth === 0) {
                            var slice = text.slice(start, i + 1);
                            try {
                                return JSON.parse(slice);
                            } catch (err) {
                                return null;
                            }
                        }
                        if (depth < 0) return null;
                    }
                }
                return null;
            }

            // Last resort for responses that are not strict JSON (single quotes,
            // unquoted keys) — the same idea as the reference's `new Function` eval,
            // but it only ever sees text we already accepted as a script store.
            function evalStoreText(text) {
                var idx = text.indexOf('script_muti_get_var_store');
                if (idx < 0) return null;
                var start = text.indexOf('=', idx);
                if (start < 0) return null;
                start += 1;
                var end = text.indexOf(';', start);
                var raw = (end < 0 ? text.slice(start) : text.slice(start, end)).trim();
                if (!raw) return null;
                try {
                    /* eslint-disable no-new-func */
                    var fn = new Function('return (' + raw + ')');
                    var val = fn();
                    return (val && typeof val === 'object') ? val : null;
                } catch (err) {
                    return null;
                }
            }

            function describeBody(text) {
                var t = String(text || '').replace(/\s+/g, ' ').trim();
                return t ? t.slice(0, 120) : '(empty body)';
            }

            function looksLikeHtml(text) {
                var t = String(text || '').trim();
                if (!t) return false;
                if (t.charAt(0) === '{' || t.charAt(0) === '[') return false;
                return /<(?:!doctype|html|head|body|script)\b/i.test(t);
            }

            function parseLite(text) {
                if (!text) throw new Error('\u56DE\u590D\u6570\u636E\u4E3A\u7A7A');
                // 1) plain JSON
                try {
                    var direct = JSON.parse(text);
                    if (direct && typeof direct === 'object') return direct;
                } catch (_) { /* not plain JSON */ }
                // 2) script store, strict
                var parsed = extractStoreJson(text);
                if (parsed) return parsed;
                // 3) script store, lenient
                parsed = evalStoreText(text);
                if (parsed) return parsed;
                // 4) nothing worked: say what we actually got
                if (looksLikeHtml(text)) {
                    throw new Error('\u9875\u9762\u8FD4\u56DE\u4E86 HTML \u800C\u4E0D\u662F\u56DE\u590D\u6570\u636E'
                        + '\uFF08\u53EF\u80FD\u672A\u767B\u5F55\u3001\u65E0\u6743\u9650\u6216\u88AB\u9650\u6D41\uFF09\uFF1A'
                        + describeBody(text));
                }
                throw new Error('\u65E0\u6CD5\u89E3\u6790\u56DE\u590D\u6570\u636E\uFF1A' + describeBody(text));
            }

            function parseNukeJson(text) {
                if (!text) return null;
                try {
                    return JSON.parse(text);
                } catch (_) { /* script store */ }
                return extractStoreJson(text) || evalStoreText(text);
            }

            // Fetch one path that should answer with a script store / JSON.
            function fetchOne(path, extra) {
                return fetch(path, {
                    credentials: 'include',
                    cache: 'no-store'
                }).then(function(r) {
                    if (!r.ok) {
                        var err = new Error(path + ' HTTP ' + r.status);
                        err.status = r.status;
                        throw err;
                    }
                    return r.arrayBuffer().then(function(buf) {
                        var text = decodeNga(buf, r.headers.get('content-type'));
                        try {
                            return parseLite(text);
                        } catch (parseErr) {
                            parseErr.body = text;
                            throw parseErr;
                        }
                    });
                });
            }

            // \u53C2\u8003\u5B9E\u73B0\u53EA\u8BF7\u6C42\u4E00\u79CD\u5F62\u5F0F\uFF08lite=js\uFF09\u3002\u8FD9\u91CC\u591A\u8BD5\u51E0\u79CD
            // \u7B49\u4EF7\u5199\u6CD5\uFF0C\u56E0\u4E3A NGA \u4E0D\u540C\u7AD9\u70B9/\u7248\u672C\u5BF9 lite \u53C2\u6570\u7684\u5904\u7406\u4E0D\u4E00\u81F4\u3002
            function liteVariants(path) {
                var out = [path];
                if (path.indexOf('lite=js') >= 0) {
                    out.push(path.replace('lite=js', 'lite=js&__inchst=UTF8'));
                    out.push(path + '&__output=8');
                }
                return out;
            }

            function fetchLite(path) {
                var variants = liteVariants(path);
                var lastErr = null;
                function attempt(i) {
                    if (i >= variants.length) {
                        throw lastErr || new Error('\u83B7\u53D6\u56DE\u590D\u6570\u636E\u5931\u8D25');
                    }
                    return fetchOne(variants[i], true).catch(function(err) {
                        lastErr = err;
                        return attempt(i + 1);
                    });
                }
                return attempt(0);
            }

            function fetchPidLou(tid, pid) {
                return fetch(
                    '/read.php?tid=' + tid + '&pid=' + pid + '&to=1',
                    { credentials: 'include', cache: 'no-store' }
                ).then(function(r) {
                    if (!r.ok) throw new Error('pid html HTTP ' + r.status);
                    return r.arrayBuffer().then(function(buf) {
                        return louFromPidHtml(decodeNga(buf, r.headers.get('content-type')), pid);
                    });
                });
            }

            function louFromPidHtml(html, pid) {
                var needle = 'pid' + pid + 'Anchor';
                var at = String(html || '').indexOf(needle);
                if (at < 0) return null;
                var around = html.slice(Math.max(0, at - 200), at + 240);
                var named = around.match(/name=['"]l(\d+)['"]/);
                if (named) return Number(named[1]);
                var box = around.match(/id=['"]postcontainer(\d+)['"]/);
                if (box) return Number(box[1]);
                return null;
            }

            function topicTitle() {
                var T = pageWindow().__T;
                return (T && (T.subject || T.title)) || '';
            }

            function liveAuthor(uid) {
                var w = pageWindow();
                var users = w.commonui && w.commonui.userInfo && w.commonui.userInfo.users;
                var u = users && (users[uid] || users[String(uid)]);
                return (u && (u.username || u.infn)) || '';
            }

            function quotedPids(content) {
                var out = [];
                var re = /\[pid=(\d+)/g;
                var m;
                while ((m = re.exec(String(content || '')))) out.push(Number(m[1]));
                return out;
            }

            function slimPost(p, users) {
                var content = String(p.content || '');
                var quoted = quotedPids(content);
                var u = (users && users[String(p.authorid)]) || {};
                var comments = [];
                if (p.comment && typeof p.comment === 'object') {
                    var cv = Object.values(p.comment);
                    for (var i = 0; i < cv.length; i++) {
                        if (cv[i] && cv[i].pid) comments.push(Number(cv[i].pid));
                    }
                }
                return {
                    pid: Number(p.pid) || 0,
                    lou: Number(p.lou) || 0,
                    authorid: p.authorid,
                    author: liveAuthor(p.authorid) || u.username || p.author || '',
                    reply_to: Number(p.reply_to) || 0,
                    quoted: quoted,
                    comments: comments,
                    type: Number(p.type) || 0
                };
            }

            function collectFromStore(store, page) {
                var data = (store && store.data) || {};
                var T = data.__T || {};
                var U = data.__U || {};
                var rows = data.__R || {};
                var posts = Object.keys(rows)
                    .filter(function(k) {
                        var p = rows[k];
                        return p && typeof p === 'object' && p.pid;
                    })
                    .map(function(k) {
                        return Object.assign(slimPost(rows[k], U), { page: page });
                    });
                return {
                    tid: Number(T.tid) || 0,
                    replies: Number(T.replies) || 0,
                    posts: posts
                };
            }

            function threadLastPage(replies) {
                return Math.max(1, Math.ceil((Number(replies) + 1) / PER_PAGE));
            }

            function liveReplies() {
                var T = pageWindow().__T;
                if (T && T.replies != null) return Number(T.replies);
                return 0;
            }

            function liveFloor(pid) {
                var w = pageWindow();
                var data = w.commonui && w.commonui.postArg && w.commonui.postArg.data;
                if (data) {
                    var dv = Object.values(data);
                    for (var i = 0; i < dv.length; i++) {
                        if (dv[i] && Number(dv[i].pid) === pid) return Number(dv[i].i);
                    }
                }
                var R = w.__R;
                if (R) {
                    var rv = Object.values(R);
                    for (var j = 0; j < rv.length; j++) {
                        if (rv[j] && Number(rv[j].pid) === pid) return Number(rv[j].lou);
                    }
                }
                return null;
            }

            function livePageNumber() {
                var w = pageWindow();
                var P = w.__PAGE;
                if (typeof P === 'number' && P > 0) return P;
                if (P && P[2] != null) {
                    var n = Number(P[2]);
                    if (n > 0) return n;
                }
                var m = String((w.location && w.location.search) || '').match(/[?&]page=(\d+)/);
                return m ? Number(m[1]) : 1;
            }

            function liveThreadEnd() {
                var w = pageWindow();
                var P = w.__PAGE;
                if (P && P[1] != null) {
                    var n = Number(P[1]);
                    if (n > 0) return n;
                }
                var replies = liveReplies();
                if (replies) return threadLastPage(replies);
                return 1;
            }

            function livePageChunk() {
                var w = pageWindow();
                if (!w.__R) return null;
                return collectFromStore(
                    { data: { __T: w.__T || {}, __U: w.__U || {}, __R: w.__R } },
                    livePageNumber()
                );
            }

            // \u9501\u9690 = \u9501\u5b9a(1024) | \u9690\u85cf(2) | \u5ba1\u6838(4).
            // Only 1024/4 count as already hidden. Deliberately NOT bit 2: the
            // reference implementation used (2|1024), which also matched 2/4 = \u5ba1\u6838
            // (pending review, type 127) and silently skipped those floors.
            var LOCKED_MASK = 1024 | 4;
            function postAlreadyLocked(p) {
                return !!(Number(p && p.type) & LOCKED_MASK);
            }

            function walkPages(pages, wanted, authorid) {
                var uid = authorid ? Number(authorid) : 0;
                var found = [];
                var seen = new Set();
                var grew = true;
                while (grew) {
                    grew = false;
                    for (var i = 0; i < pages.length; i++) {
                        var posts = pages[i].posts;
                        for (var j = 0; j < posts.length; j++) {
                            var p = posts[j];
                            if (!p.pid || seen.has(p.pid)) continue;
                            var byAuthor = uid && Number(p.authorid) === uid;
                            var hit = byAuthor
                                || wanted.has(p.pid)
                                || wanted.has(p.reply_to)
                                || p.quoted.some(function(q) { return wanted.has(q); });
                            if (!hit) continue;
                            seen.add(p.pid);
                            wanted.add(p.pid);
                            p.comments.forEach(function(c) { if (c) wanted.add(c); });
                            found.push(p);
                            grew = true;
                        }
                    }
                }
                found.sort(function(a, b) { return a.lou - b.lou; });
                return found;
            }

            function fetchPageRange(tid, start, hardEnd, pages, state) {
                if (start > hardEnd) return Promise.resolve();
                addTreeLogEntry('info', '\u68C0\u7D22\u7B2C ' + start + ' \u9875\uFF08tid=' + tid + '\uFF09');
                return fetchLite('/read.php?tid=' + tid + '&page=' + start + '&lite=js')
                    .then(function(store) {
                        var chunk = collectFromStore(store, start);
                        state.replies = chunk.replies || state.replies;
                        pages.push(chunk);
                        state.lastFetched = start;
                        if (!chunk.posts.length) return;
                        if (start >= threadLastPage(state.replies)) return;
                        return fetchPageRange(tid, start + 1, hardEnd, pages, state);
                    });
            }

            function collectRange(tid, seedPid, fromPage, toPage, wantedInit, authorid) {
                var seeds = (wantedInit && wantedInit.length)
                    ? wantedInit.filter(function(id) { return id > 0; })
                    : (authorid ? [] : [seedPid]);
                var wanted = new Set(seeds);
                var pages = [];
                var state = { replies: liveReplies(), lastFetched: fromPage - 1 };
                var start = Math.max(1, fromPage);
                var hardEnd = Math.max(start, toPage);
                return fetchPageRange(tid, start, hardEnd, pages, state).then(function() {
                    var lastPage = state.lastFetched >= start ? state.lastFetched : start;
                    var extra = authorid ? livePageChunk() : null;
                    if (extra && extra.posts.length) {
                        var covered = extra.page > 0 && extra.page >= start && extra.page <= lastPage;
                        if (!covered) pages.push(extra);
                    }
                    var found = walkPages(pages, wanted, authorid);
                    var replies = state.replies;
                    var end = threadLastPage(replies);
                    return {
                        tid: tid,
                        seedPid: seedPid,
                        authorid: authorid || 0,
                        startPage: start,
                        lastPage: lastPage,
                        replies: replies,
                        threadEnd: replies ? end : Math.max(end, lastPage),
                        found: found,
                        wanted: Array.from(wanted)
                    };
                });
            }

            function mergeExtraPosts(tree, extras) {
                for (var i = 0; i < extras.length; i++) {
                    var p = extras[i];
                    if (!p.pid || tree.found.some(function(x) { return x.pid === p.pid; })) continue;
                    tree.found.push(p);
                    if (tree.wanted.indexOf(p.pid) < 0) tree.wanted.push(p.pid);
                }
                tree.found.sort(function(a, b) { return a.lou - b.lou; });
                return tree;
            }

            function pageFromLou(lou) {
                var n = Number(lou);
                if (!Number.isFinite(n) || n < 0) return 0;
                return Math.floor(n / PER_PAGE) + 1;
            }

            // Locate the floor the user clicked. `read.php?tid&pid&lite=js` is the
            // primary source, but it is the fragile one (NGA sometimes answers that
            // exact URL with an HTML page). When it fails we still know the page we
            // are on, so fall back to the live page chunk / the current page URL
            // instead of aborting the whole operation.
            function anchorFromPage(seedPid) {
                var chunk = livePageChunk();
                var seed = null;
                if (chunk) {
                    for (var i = 0; i < chunk.posts.length; i++) {
                        if (chunk.posts[i].pid === seedPid) {
                            seed = chunk.posts[i];
                            break;
                        }
                    }
                }
                var lou = liveFloor(seedPid);
                if ((lou == null || lou <= 0) && seed) lou = seed.lou;
                return {
                    seed: seed,
                    lou: Number(lou) || 0,
                    page: pageFromLou(lou),
                    replies: liveReplies(),
                    threadEnd: liveThreadEnd()
                };
            }

            function resolveSeedAnchor(tid, seedPid) {
                return fetchLite('/read.php?tid=' + tid + '&pid=' + seedPid + '&lite=js')
                    .then(function(store) {
                        var one = collectFromStore(store, 0);
                        var seed = null;
                        for (var i = 0; i < one.posts.length; i++) {
                            if (one.posts[i].pid === seedPid) {
                                seed = one.posts[i];
                                break;
                            }
                        }
                        var lou = liveFloor(seedPid);
                        if (lou == null || lou <= 0) lou = seed && seed.lou;
                        var needHtml = !!seedPid && (lou == null || Number(lou) === 0);
                        function finish() {
                            if (seed && Number(lou) > 0) seed.lou = Number(lou);
                            return {
                                seed: seed,
                                lou: Number(lou) || 0,
                                page: pageFromLou(lou),
                                replies: one.replies || 0,
                                threadEnd: one.replies ? threadLastPage(one.replies) : 0
                            };
                        }
                        if (!needHtml) return finish();
                        return fetchPidLou(tid, seedPid).then(function(htmlLou) {
                            if (htmlLou != null && Number(htmlLou) > 0) lou = htmlLou;
                            return finish();
                        }, function() {
                            return finish();
                        });
                    }, function(err) {
                        addTreeLogEntry('info', '\u5B9A\u4F4D\u697C\u5C42\u5931\u8D25\uFF0C'
                            + '\u6539\u7528\u5F53\u524D\u9875\u6570\u636E\uFF1A' + String(err && err.message || err));
                        return anchorFromPage(seedPid);
                    });
            }

            function collectAuthorWindow(tid, seedPid, authorid) {
                var uid = Number(authorid);
                var live = (livePageChunk() || { posts: [] }).posts.filter(function(p) {
                    return p.pid && Number(p.authorid) === uid;
                });
                // Only the target author's own posts seed the walk. Deliberately NOT
                // seedPid: the seed (the floor the user clicked) may belong to someone
                // else or merely quote the author, and seeding with it would expand the
                // whole quote subtree and lock posts the author never wrote.
                var wantedInit = live.map(function(p) { return p.pid; });
                var current = livePageNumber();
                var endHint = liveThreadEnd();
                var seed = null;
                var chain = Promise.resolve();
                if (seedPid) {
                    chain = resolveSeedAnchor(tid, seedPid).then(function(anchor) {
                        // the anchor only locates the window; it seeds nothing
                        if (anchor.seed) seed = anchor.seed;
                        if (anchor.page > 0) current = anchor.page;
                        if (anchor.threadEnd > 0) endHint = Math.max(endHint, anchor.threadEnd);
                        if (seed && Number(seed.authorid) === uid
                            && wantedInit.indexOf(seed.pid) < 0) {
                            wantedInit.push(seed.pid);
                        }
                    });
                }
                return chain.then(function() {
                    var start = Math.max(1, current - maxPages());
                    var last = Math.min(Math.max(endHint, current), current + maxPages());
                    return collectRange(tid, seedPid, start, last, wantedInit, authorid)
                        .then(function(tree) {
                            mergeExtraPosts(tree, live);
                            // Hard guarantee for "\u9501\u9690\u4F5C\u8005\u6811": only floors actually written by
                            // this author may be locked. collectRange's author filter already
                            // does this, but a stale wanted-set entry or an anchor that
                            // happens to quote the seed could leak other floors in.
                            tree.found = tree.found.filter(function(p) {
                                return p.pid && Number(p.authorid) === uid;
                            });
                            tree.wanted = tree.found.map(function(p) { return p.pid; });
                            tree.authorName = liveAuthor(authorid)
                                || (tree.found.find(function(p) {
                                    return Number(p.authorid) === uid;
                                }) || {}).author
                                || '';
                            if (!tree.replies) tree.replies = liveReplies();
                            tree.threadEnd = tree.replies
                                ? threadLastPage(tree.replies)
                                : Math.max(endHint, tree.threadEnd, tree.lastPage);
                            return tree;
                        });
                });
            }

            function collectFirstWindow(tid, seedPid) {
                return resolveSeedAnchor(tid, seedPid).then(function(anchor) {
                    var seed = anchor.seed;
                    if (!seed) throw new Error('\u627E\u4E0D\u5230 pid ' + seedPid);
                    var startPage = anchor.page > 0 ? anchor.page : 1;
                    var cap = startPage + maxPages() - 1;
                    return collectRange(tid, seedPid, startPage, cap, [seedPid]).then(function(tree) {
                        if (!tree.found.some(function(p) { return p.pid === seedPid; })) {
                            seed.page = startPage;
                            tree.found.unshift(seed);
                            tree.wanted.push(seedPid);
                        }
                        if (!tree.replies) tree.replies = anchor.replies;
                        tree.threadEnd = tree.replies
                            ? threadLastPage(tree.replies)
                            : Math.max(tree.threadEnd, tree.lastPage);
                        return tree;
                    });
                });
            }

            function setBits(tid, pid, pon, poff) {
                var body = new URLSearchParams({
                    __lib: 'topic_lock',
                    __act: 'set',
                    ids: tid + ',' + pid,
                    pon: String(pon),
                    poff: String(poff),
                    ton: '0',
                    toff: '0',
                    pm: '0',
                    info: '',
                    raw: '3',
                    __output: '8',
                    __inchst: 'UTF8'
                });
                return fetch('/nuke.php', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: body
                }).then(function(r) {
                    return r.arrayBuffer().then(function(buf) {
                        return decodeNga(buf, r.headers.get('content-type'));
                    });
                }).then(function(text) {
                    var parsed;
                    try {
                        parsed = JSON.parse(text);
                    } catch (_) {
                        throw new Error('pid ' + pid + ' \u8FD4\u56DE\u65E0\u6CD5\u89E3\u6790: ' + text.slice(0, 120));
                    }
                    if (parsed.error) {
                        var err = parsed.error[0] || JSON.stringify(parsed.error);
                        throw new Error('pid ' + pid + ' ' + err);
                    }
                    return parsed;
                });
            }

            function lineOf(p) {
                var who = p.author || ('uid ' + p.authorid);
                return '#' + p.lou + '  ' + who + '  pid=' + p.pid;
            }

            function resultText(op, fails) {
                var pages = '\u68C0\u7D22\u7B2C ' + op.startPage + '\u2013' + op.lastPage
                    + ' \u9875\uFF08\u5171 ' + op.threadEnd + ' \u9875\uFF09';
                var who = op.authorName || (op.authorid ? ('uid ' + op.authorid) : '');
                var head = op.authorid
                    ? ('\u5DF2\u9501\u9690 ' + op.posts.length + ' \u4E2A\u56DE\u590D\uFF08' + who + ' \u7684\u53D1\u8A00\u53CA\u5F15\u7528\uFF09')
                    : ('\u5DF2\u9501\u9690 ' + op.posts.length + ' \u4E2A\u56DE\u590D');
                var top = op.posts.slice(0, 3).map(lineOf);
                var more = op.posts.length > 3 ? ['...'] : [];
                var err = fails.length ? ['\u5931\u8D25 ' + fails.length + ' \u4E2A'] : [];
                var rest = op.lastPage < op.threadEnd
                    ? ['\u672A\u5230\u672B\u9875\uFF0C\u8FD8\u53EF\u68C0\u7D22\u7B2C ' + (op.lastPage + 1) + '\u2013' + op.threadEnd + ' \u9875']
                    : [];
                return [pages, head].concat(top, more, err, rest).join('\n');
            }

            function closeToast() {
                var old = document.getElementById('nga-wd-toast');
                if (old) old.remove();
            }

            function addBtn(bar, label, onClick) {
                var b = document.createElement('button');
                b.type = 'button';
                b.textContent = label;
                b.style.cssText = [
                    'margin:0', 'padding:4px 10px', 'border:1px solid rgba(255,255,255,.45)',
                    'border-radius:4px', 'background:transparent', 'color:#fff',
                    'font:13px/1.2 sans-serif', 'cursor:pointer'
                ].join(';');
                b.addEventListener('click', onClick);
                bar.appendChild(b);
                return b;
            }

            function notify(text, isErr, actions, ms) {
                ensureStyle();
                closeToast();
                var el = document.createElement('div');
                el.id = 'nga-wd-toast';
                el.setAttribute('data-nga-wd', 'toast');
                el.style.cssText = [
                    'position:fixed', 'z-index:2147483647', 'right:16px', 'top:16px',
                    'max-width:26em', 'padding:10px 12px', 'border-radius:6px',
                    'font:13px/1.45 "Microsoft YaHei",sans-serif', 'color:#fff',
                    'background:' + (isErr ? '#8b1e1e' : '#1f6b3a'),
                    'box-shadow:0 4px 16px rgba(0,0,0,.35)'
                ].join(';');
                var body = document.createElement('div');
                body.className = 'nga-wd-toast-body';
                body.style.whiteSpace = 'pre-wrap';
                body.textContent = text;
                el.appendChild(body);
                if (actions && actions.length) {
                    var bar = document.createElement('div');
                    bar.className = 'nga-wd-toast-bar';
                    bar.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;justify-content:flex-end';
                    actions.forEach(function(a) { addBtn(bar, a.label, a.onClick); });
                    el.appendChild(bar);
                }
                var track = document.createElement('div');
                track.id = 'nga-wd-toast-bar';
                track.setAttribute('data-nga-wd', 'bar');
                track.style.cssText = 'height:3px;margin:10px -12px -10px;background:rgba(255,255,255,.22);overflow:hidden';
                var fill = document.createElement('div');
                fill.id = 'nga-wd-toast-fill';
                fill.style.cssText = [
                    'height:100%', 'width:100%', 'background:rgba(255,255,255,.9)',
                    'transform-origin:left center', 'transform:scaleX(1)'
                ].join(';');
                track.appendChild(fill);
                el.appendChild(track);
                (document.documentElement || document.body).appendChild(el);
                var wait = (ms == null ? TOAST_MS : ms);
                var timer = null;
                function playBar() {
                    fill.style.animation = 'none';
                    void fill.offsetWidth;
                    fill.style.animation = 'nga-wd-toast-shrink ' + wait + 'ms linear forwards';
                    fill.style.animationPlayState = 'running';
                }
                function hold() {
                    if (timer) {
                        clearTimeout(timer);
                        timer = null;
                    }
                    fill.style.animationPlayState = 'paused';
                }
                function arm() {
                    hold();
                    playBar();
                    timer = setTimeout(function() {
                        if (el.parentNode) el.remove();
                    }, wait);
                }
                el.addEventListener('mouseenter', hold);
                el.addEventListener('mouseleave', arm);
                arm();
            }

            function authorWindowOpen(op) {
                return !!(op && op.authorid && !op.fullScan
                    && (op.startPage > 1 || op.lastPage < op.threadEnd));
            }

            function showLockResult(op, fails) {
                lastOp = op;
                var actions = [{ label: '\u786E\u8BA4', onClick: closeToast }];
                if (op.posts.length) {
                    actions.push({ label: '\u64A4\u9500', onClick: function() { undoLast(); } });
                }
                if (authorWindowOpen(op)) {
                    actions.push({ label: '\u6574\u5E16\u626B\u63CF', onClick: function() { scanWholeThread(); } });
                } else if (!op.authorid && op.lastPage < op.threadEnd) {
                    actions.push({ label: '\u7EE7\u7EED\u5230\u672B\u9875', onClick: function() { continueToEnd(); } });
                }
                notify(resultText(op, fails), !op.posts.length && fails.length > 0, actions);
            }

            function makeOp(tree, posts, startPage) {
                return {
                    tid: tree.tid,
                    seedPid: tree.seedPid,
                    authorid: tree.authorid || 0,
                    authorName: tree.authorName || '',
                    startPage: startPage || tree.startPage,
                    lastPage: tree.lastPage,
                    threadEnd: tree.threadEnd,
                    replies: tree.replies,
                    fullScan: !!tree.fullScan,
                    posts: posts.slice(),
                    wanted: tree.wanted ? tree.wanted.slice() : posts.map(function(p) { return p.pid; })
                };
            }

            function serial(items, fn) {
                var chain = Promise.resolve();
                items.forEach(function(item) {
                    chain = chain.then(function() { return fn(item); });
                });
                return chain;
            }

            // Restore a button's own caption after a run (each button has a fixed label).
            function restoreBtn(btn) {
                if (!btn) return;
                var kind = btn.getAttribute('data-nga-wd-entry');
                var id = btn.getAttribute('data-nga-wd-id');
                if (kind === 'author' || id === '92') btn.textContent = LABEL_AUTHOR;
                else if (kind === 'page' || id === '93') btn.textContent = LABEL_PAGE;
                else btn.textContent = LABEL_TREE;
            }

            function logLockOutcome(okList, fails) {
                addTreeLogEntry('success', '\u5DF2\u9501\u9690 ' + okList.length + ' \u4E2A\u56DE\u590D');
                if (fails.length) {
                    addTreeLogEntry('error', '\u5931\u8D25 ' + fails.length + ' \u4E2A\uFF1A' + fails.slice(0, 3).join('\uFF1B'));
                }
            }

            function runTopicLock(tid, btn) {
                if (running) return;
                if (!tid) {
                    notify('\u6CA1\u6709 tid', true);
                    return;
                }
                running = true;
                if (btn) btn.textContent = '\u9501\u9690\u4E2D';
                setBits(tid, 0, PON, 0).then(function() {
                    lastOp = {
                        kind: 'topic',
                        tid: tid,
                        seedPid: 0,
                        posts: [{ pid: 0, lou: 0, author: '', authorid: 0 }],
                        startPage: 1,
                        lastPage: 1,
                        threadEnd: 1,
                        wanted: []
                    };
                    addTreeLogEntry('success', '\u5DF2\u9501\u9690\u4E3B\u9898 ' + tid);
                    notify(['\u5DF2\u9501\u9690\u4E3B\u9898', topicTitle() || ('tid=' + tid)].join('\n'), false, [
                        { label: '\u786E\u8BA4', onClick: closeToast },
                        { label: '\u64A4\u9500', onClick: function() { undoLast(); } }
                    ]);
                }, function(e) {
                    lastOp = null;
                    addTreeLogEntry('error', String((e && e.message) || e));
                    notify(String((e && e.message) || e), true);
                }).then(function() {
                    running = false;
                    restoreBtn(btn);
                });
            }

            // \u9501\u9690\u672C\u9875\uff1a\u626B\u63CF\u5F53\u524D\u9875\u7684\u5168\u90E8\u56DE\u590D\u697C\u5C42\u5E76\u9010\u6761\u9501\u9690\u3002
            // \u4E0E\u4F5C\u8005\u6811\u8D70\u540C\u4E00\u5957\u6D41\u7A0B\uff08\u6E05\u5355 \u2192 \u9010\u6761 setBits \u2192 \u6D6E\u7A97 + \u53EF\u64A4\u9500\uff09\u3002
            function currentPagePosts() {
                var out = [];
                var seen = {};
                var rows = document.querySelectorAll('[id^="postrow"], [id^="post1strow"]');
                for (var i = 0; i < rows.length; i++) {
                    var info = readRow(rows[i]);
                    if (!info.pid || info.floor === 0) continue;
                    if (seen[info.pid]) continue;
                    seen[info.pid] = 1;
                    out.push({
                        pid: info.pid,
                        lou: info.floor,
                        author: liveAuthor(info.authorUid) || '',
                        authorid: info.authorUid || 0,
                        type: 0
                    });
                }
                out.sort(function (a, b) { return a.lou - b.lou; });
                return out;
            }

            function runPageLock(tid, btn) {
                if (running) return;
                if (!tid) {
                    notify('\u6CA1\u6709 tid', true);
                    return;
                }
                var posts = currentPagePosts();
                if (!posts.length) {
                    notify('\u5F53\u524D\u9875\u6CA1\u6709\u627E\u5230\u53EF\u9501\u9690\u7684\u56DE\u590D\u697C\u5C42', true);
                    return;
                }
                var todo = posts.filter(function(p) { return !(skipLocked() && postAlreadyLocked(p)); });
                if (!todo.length) {
                    notify('\u5F53\u524D\u9875\u7684\u56DE\u590D\u5DF2\u7ECF\u90FD\u662F\u9501\u9690\u72B6\u6001', true);
                    return;
                }
                running = true;
                if (btn) btn.textContent = '\u9501\u9690\u4E2D';
                var fails = [];
                var okList = [];
                serial(todo, function(p) {
                    return setBits(tid, p.pid, PON, 0).then(function() {
                        okList.push(p);
                    }, function(e) {
                        fails.push(String((e && e.message) || e));
                    });
                }).then(function() {
                    var page = livePageNumber();
                    var op = {
                        tid: tid,
                        seedPid: okList.length ? okList[0].pid : 0,
                        authorid: 0,
                        authorName: '',
                        startPage: page,
                        lastPage: page,
                        threadEnd: liveThreadEnd(),
                        replies: liveReplies(),
                        posts: okList.slice(),
                        wanted: okList.map(function(p) { return p.pid; })
                    };
                    lastOp = op;
                    addTreeLogEntry('success', '\u5DF2\u9501\u9690\u672C\u9875 ' + okList.length + ' \u4E2A\u56DE\u590D');
                    if (fails.length) {
                        addTreeLogEntry('error', '\u5931\u8D25 ' + fails.length + ' \u4E2A\uFF1A'
                            + fails.slice(0, 3).join('\uFF1B'));
                    }
                    var lines = ['\u5DF2\u9501\u9690\u672C\u9875 ' + okList.length + ' \u4E2A\u56DE\u590D'
                        + '\uFF08\u7B2C ' + page + ' \u9875\uFF09'];
                    okList.slice(0, 3).forEach(function(p) { lines.push(lineOf(p)); });
                    if (okList.length > 3) lines.push('...');
                    if (fails.length) lines.push('\u5931\u8D25 ' + fails.length + ' \u4E2A');
                    var actions = [{ label: '\u786E\u8BA4', onClick: closeToast }];
                    if (okList.length) {
                        actions.push({ label: '\u64A4\u9500', onClick: function() { undoLast(); } });
                    }
                    notify(lines.join('\n'), !okList.length && fails.length > 0, actions);
                }).then(function() {
                    running = false;
                    restoreBtn(btn);
                });
            }

            function runReplyTree(tid, seedPid, btn) {
                if (running) return;
                if (!tid) {
                    notify('\u6CA1\u6709 tid', true);
                    return;
                }
                if (!seedPid) {
                    notify('\u6CA1\u6709 tid/pid', true);
                    return;
                }
                running = true;
                if (btn) btn.textContent = '\u9501\u9690\u4E2D';
                collectFirstWindow(tid, seedPid).then(function(tree) {
                    if (!tree.found.length) {
                        notify('\u5411\u540E ' + maxPages() + ' \u9875\u5185\u6CA1\u6709\u627E\u5230\u8FD9\u4E2A\u56DE\u590D', true);
                        return;
                    }
                    var fails = [];
                    var okList = [];
                    var lockedPosts = tree.found.filter(function(p) {
                        return p.pid && !(skipLocked() && postAlreadyLocked(p));
                    });
                    return serial(lockedPosts, function(p) {
                        return setBits(tree.tid, p.pid, PON, 0).then(function() {
                            okList.push(p);
                        }, function(e) {
                            fails.push(String((e && e.message) || e));
                        });
                    }).then(function() {
                        logLockOutcome(okList, fails);
                        showLockResult(makeOp(tree, okList), fails);
                    });
                }, function(e) {
                    addTreeLogEntry('error', String((e && e.message) || e));
                    notify(String((e && e.message) || e), true);
                }).then(function() {
                    running = false;
                    restoreBtn(btn);
                });
            }

            function runAuthorTree(tid, seedPid, authorid, btn) {
                if (running) return;
                if (!tid) {
                    notify('\u6CA1\u6709 tid', true);
                    return;
                }
                if (!authorid) {
                    notify('\u6CA1\u6709\u4F5C\u8005 uid', true);
                    return;
                }
                running = true;
                if (btn) btn.textContent = '\u9501\u9690\u4E2D';
                collectAuthorWindow(tid, seedPid, authorid).then(function(tree) {
                    if (!tree.found.length) {
                        notify('\u5F53\u524D\u9875\u524D\u540E\u7A97\u53E3\u5185\u6CA1\u6709\u627E\u5230\u8BE5\u4F5C\u8005\u7684\u53D1\u8A00\u6216\u5F15\u7528', true);
                        return;
                    }
                    var fails = [];
                    var okList = [];
                    var lockedPosts = tree.found.filter(function(p) {
                        return p.pid && !(skipLocked() && postAlreadyLocked(p));
                    });
                    return serial(lockedPosts, function(p) {
                        return setBits(tree.tid, p.pid, PON, 0).then(function() {
                            okList.push(p);
                        }, function(e) {
                            fails.push(String((e && e.message) || e));
                        });
                    }).then(function() {
                        logLockOutcome(okList, fails);
                        showLockResult(makeOp(tree, okList), fails);
                    });
                }, function(e) {
                    addTreeLogEntry('error', String((e && e.message) || e));
                    notify(String((e && e.message) || e), true);
                }).then(function() {
                    running = false;
                    restoreBtn(btn);
                });
            }

            function continueToEnd() {
                if (running || !lastOp || lastOp.kind === 'topic') return;
                if (lastOp.lastPage >= lastOp.threadEnd) return;
                running = true;
                var prev = lastOp;
                var toast = document.getElementById('nga-wd-toast');
                var btns = toast ? toast.querySelectorAll('button') : [];
                btns.forEach(function(b) {
                    b.disabled = true;
                    if (b.textContent === '\u7EE7\u7EED\u5230\u672B\u9875') b.textContent = '\u68C0\u7D22\u4E2D';
                });
                var wantedInit = (prev.wanted && prev.wanted.length)
                    ? prev.wanted.slice()
                    : prev.posts.map(function(p) { return p.pid; }).concat([prev.seedPid]);
                addTreeLogEntry('info', '\u7EE7\u7EED\u5230\u672B\u9875\uFF1A\u4ECE\u7B2C ' + (prev.lastPage + 1) + ' \u9875\u5F00\u59CB');
                collectRange(prev.tid, prev.seedPid, prev.lastPage + 1, prev.threadEnd, wantedInit, prev.authorid)
                    .then(function(tree) {
                        var already = new Set(prev.posts.map(function(p) { return p.pid; }));
                        var newFound = tree.found.filter(function(p) {
                            return p.pid && !already.has(p.pid);
                        });
                        var fails = [];
                        var okNew = [];
                        return serial(newFound, function(p) {
                            return setBits(prev.tid, p.pid, PON, 0).then(function() {
                                okNew.push(p);
                            }, function(e) {
                                fails.push(String((e && e.message) || e));
                            });
                        }).then(function() {
                            var posts = prev.posts.concat(okNew);
                            posts.sort(function(a, b) { return a.lou - b.lou; });
                            var seenW = new Set();
                            var wanted = [];
                            (prev.wanted || []).concat(tree.wanted || []).forEach(function(id) {
                                if (!seenW.has(id)) {
                                    seenW.add(id);
                                    wanted.push(id);
                                }
                            });
                            logLockOutcome(okNew, fails);
                            showLockResult({
                                tid: prev.tid,
                                seedPid: prev.seedPid,
                                authorid: prev.authorid || 0,
                                authorName: prev.authorName || '',
                                startPage: prev.startPage,
                                lastPage: Math.max(prev.lastPage, tree.lastPage),
                                threadEnd: tree.threadEnd || prev.threadEnd,
                                replies: tree.replies || prev.replies,
                                posts: posts,
                                wanted: wanted
                            }, fails);
                        });
                    })
                    .catch(function(e) {
                        lastOp = prev;
                        addTreeLogEntry('error', String((e && e.message) || e));
                        var actions = [{ label: '\u786E\u8BA4', onClick: closeToast }];
                        if (prev.posts.length) {
                            actions.push({ label: '\u64A4\u9500', onClick: function() { undoLast(); } });
                        }
                        actions.push({ label: '\u7EE7\u7EED\u5230\u672B\u9875', onClick: function() { continueToEnd(); } });
                        notify(String((e && e.message) || e), true, actions);
                    })
                    .then(function() {
                        running = false;
                    });
            }

            function scanWholeThread() {
                if (running || !lastOp || !lastOp.authorid || lastOp.fullScan) return;
                running = true;
                var prev = lastOp;
                var toast = document.getElementById('nga-wd-toast');
                var btns = toast ? toast.querySelectorAll('button') : [];
                btns.forEach(function(b) {
                    b.disabled = true;
                    if (b.textContent === '\u6574\u5E16\u626B\u63CF') b.textContent = '\u68C0\u7D22\u4E2D';
                });
                var wantedInit = (prev.wanted && prev.wanted.length)
                    ? prev.wanted.slice()
                    : prev.posts.map(function(p) { return p.pid; }).concat([prev.seedPid]);
                addTreeLogEntry('info', '\u6574\u5E16\u626B\u63CF\uFF1Atid=' + prev.tid);
                collectRange(prev.tid, prev.seedPid, 1, prev.threadEnd, wantedInit, prev.authorid)
                    .then(function(tree) {
                        var already = new Set(prev.posts.map(function(p) { return p.pid; }));
                        var newFound = tree.found.filter(function(p) {
                            return p.pid && !already.has(p.pid) && !postAlreadyLocked(p);
                        });
                        var fails = [];
                        var okNew = [];
                        return serial(newFound, function(p) {
                            return setBits(prev.tid, p.pid, PON, 0).then(function() {
                                okNew.push(p);
                            }, function(e) {
                                fails.push(String((e && e.message) || e));
                            });
                        }).then(function() {
                            var posts = prev.posts.concat(okNew);
                            posts.sort(function(a, b) { return a.lou - b.lou; });
                            var seenW = new Set();
                            var wanted = [];
                            (prev.wanted || []).concat(tree.wanted || []).forEach(function(id) {
                                if (!seenW.has(id)) {
                                    seenW.add(id);
                                    wanted.push(id);
                                }
                            });
                            logLockOutcome(okNew, fails);
                            showLockResult({
                                tid: prev.tid,
                                seedPid: prev.seedPid,
                                authorid: prev.authorid || 0,
                                authorName: prev.authorName || '',
                                startPage: 1,
                                lastPage: Math.max(prev.lastPage, tree.lastPage, tree.threadEnd || prev.threadEnd),
                                threadEnd: tree.threadEnd || prev.threadEnd,
                                replies: tree.replies || prev.replies,
                                fullScan: true,
                                posts: posts,
                                wanted: wanted
                            }, fails);
                        });
                    })
                    .catch(function(e) {
                        lastOp = prev;
                        addTreeLogEntry('error', String((e && e.message) || e));
                        var actions = [{ label: '\u786E\u8BA4', onClick: closeToast }];
                        if (prev.posts.length) {
                            actions.push({ label: '\u64A4\u9500', onClick: function() { undoLast(); } });
                        }
                        actions.push({ label: '\u6574\u5E16\u626B\u63CF', onClick: function() { scanWholeThread(); } });
                        notify(String((e && e.message) || e), true, actions);
                    })
                    .then(function() {
                        running = false;
                    });
            }

            function undoLast() {
                if (running || !lastOp) return;
                var op = lastOp;
                if (!(op.posts && op.posts.length)) return;
                running = true;
                lastOp = null;
                var toast = document.getElementById('nga-wd-toast');
                var btns = toast ? toast.querySelectorAll('button') : [];
                btns.forEach(function(b) {
                    b.disabled = true;
                    if (b.textContent === '\u64A4\u9500') b.textContent = '\u64A4\u9500\u4E2D';
                });
                var fails = [];
                var lines = [];
                var posts = op.posts || [];
                var tid = op.tid;
                var undone = [];
                serial(posts, function(p) {
                    return setBits(tid, p.pid, 0, PON).then(function() {
                        undone.push(p);
                    }, function(e) {
                        fails.push(String((e && e.message) || e));
                    });
                }).then(function() {
                    if (op.kind === 'topic') {
                        lines.push('\u5DF2\u64A4\u9500\u4E3B\u9898' + (undone.length ? '' : '\u5931\u8D25'));
                        lines.push(topicTitle() || ('tid=' + tid));
                    } else {
                        lines.push('\u5DF2\u64A4\u9500 ' + undone.length + ' \u4E2A\u56DE\u590D\uFF08\u539F\u68C0\u7D22\u7B2C '
                            + (op.startPage || '?') + '\u2013' + (op.lastPage || '?') + ' \u9875\uFF09');
                        undone.slice(0, 3).forEach(function(p) { lines.push(lineOf(p)); });
                        if (undone.length > 3) lines.push('...');
                    }
                    if (fails.length) lines.push('\u5931\u8D25 ' + fails.length + ' \u4E2A');
                    var ok = lines.some(function(s) { return s.indexOf('\u5DF2\u64A4\u9500') === 0; });
                    if (undone.length) {
                        addTreeLogEntry('success', '\u5DF2\u64A4\u9500 ' + undone.length + ' \u4E2A\u56DE\u590D');
                    }
                    if (fails.length) {
                        addTreeLogEntry('error', '\u64A4\u9500\u5931\u8D25 ' + fails.length + ' \u4E2A\uFF1A' + fails.slice(0, 3).join('\uFF1B'));
                    }
                    notify(lines.join('\n') || '\u64A4\u9500\u5931\u8D25', !ok, [
                        { label: '\u786E\u8BA4', onClick: closeToast }
                    ]);
                }).then(function() {
                    running = false;
                });
            }

            // \u8fd0\u884c\u65f6\u8bca\u65ad\uff1a\u4f9b\u5bbf\u4e3b\u7684"\u9875\u9762\u81ea\u68c0"\u6309\u94ae\u4f7f\u7528\u3002
            function inspect() {
                var out = {
                    installed: installed,
                    observing: !!observer,
                    watching: !!watchTimer,
                    tid: 0,
                    postBtn: false,
                    menuTree: false,
                    menuAuthor: false,
                    menuPage: false,
                    inAdminMenu: false,
                    hoverWrapped: false,
                    surfaceAllowed: false,
                    args: 0,
                    legacyEntries: 0,
                    treeButtons: false
                };
                try { out.tid = Number(getCurrentTid()) || 0; } catch (err) { out.tid = -1; }
                try { out.treeButtons = !!settings_().treeButtons; } catch (err) { out.treeButtons = null; }
                var pb = postBtnOf();
                out.postBtn = !!(pb && pb.d);
                if (pb && pb.d) {
                    out.menuTree = !!pb.d[BTN_TREE];
                    out.menuAuthor = !!pb.d[BTN_AUTHOR];
                    out.menuPage = !!pb.d[BTN_PAGE];
                    var admin = adminList(pb);
                    out.inAdminMenu = !!(admin && admin.indexOf(BTN_TREE) >= 0);
                    out.hoverWrapped = !!(pb.genB && pb.genB._ngaWdBtns);
                }
                var args = argsFromPage();
                out.args = args.length;
                out.surfaceAllowed = args.some(surfaceAllowed);
                out.legacyEntries = document.querySelectorAll('.nga-wd-tree-btn').length;
                return out;
            }

            return {
                install: install,
                onSettingsChanged: onSettingsChanged,
                inspect: inspect
            };
        }
    // ---- end spliced module: tree-feature.js ----

    // ---- spliced module: nuke-defaults.js ----
        function buildNukeDefaults() {
            var NUKE_DELETE_LABEL = '\u5220\u9664\u6b64\u8d34';
            var NUKE_DELETE_LABEL_ALT = '\u5220\u9664\u6b64\u5e16';
            var NUKE_DEFAULTS_MARK = 'data-nga-warden-nuke-defaults';
            var LESSER_USER_EDIT = 'data-nga-lesser-user-edited';
            var LESSER_MODE_NAME = 'nga-warden-lesser-delete-mode';
            var MAIN_NUKE_MARK = '\u6b64\u65f6\u95f4\u540e\u53d1\u5e03\u7684\u4e3b\u9898\u4e0e\u56de\u590d\u5c06\u88ab\u5220\u9664';
            var BTN_LESSER = 14;

            var nukeOpenSeq = 0;
            var nukeAppliedSeq = 0;
            var nukeUserEdited = false;
            var nukeWasSecondary = new WeakMap();
            var nukeShown = new WeakMap();
            var pendingNukeDefaults = new Set();
            var lastLesserTarget = null;
            var nukeReported = new WeakMap();
            var nukeScanTimer = null;
            var nukeHookStarted = false;
            var nukeHookTimer = null;
            var nukePollStarted = false;
            var nukeDefaultsWatchStarted = false;
            var nukeDefaultsWatch = {observer: null};

            function controlLabel(el) {
                var sib = el.nextSibling;
                var s = '';
                var guard = 0;
                while (sib && guard < 8) {
                    if (sib.nodeType === 1) {
                        var tag = String(sib.tagName || '').toUpperCase();
                        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
                            || tag === 'BUTTON') break;
                        if (tag === 'BR' || tag === 'HR') {
                            if (s.trim()) break;
                            sib = sib.nextSibling;
                            guard++;
                            continue;
                        }
                    }
                    var chunk = sib.textContent || '';
                    if (chunk) s += chunk;
                    if (s.trim()) break;
                    sib = sib.nextSibling;
                    guard++;
                }
                return s.replace(/\s+/g, ' ').trim();
            }

            function labelKey(label) {
                return String(label || '')
                    .replace(/\uff08[^\uff09]*\uff09/g, '')
                    .replace(/\([^)]*\)/g, '')
                    .replace(/\s+/g, '');
            }

            function pickByLabel(inputs, prefix) {
                var want = String(prefix || '');
                if (!want) return null;
                var wantKey = labelKey(want);
                for (var i = 0; i < inputs.length; i++) {
                    var lab = controlLabel(inputs[i]);
                    if (lab.indexOf(want) === 0) return inputs[i];
                    var key = labelKey(lab);
                    if (wantKey && key.indexOf(wantKey) === 0) return inputs[i];
                }
                return null;
            }

            function findLesserArg(tid, pid) {
                var data = pageWindow().commonui && pageWindow().commonui.postArg
                    && pageWindow().commonui.postArg.data;
                if (!data) return null;
                var values = Object.values(data);
                for (var i = 0; i < values.length; i++) {
                    var arg = values[i];
                    if (arg && Number(arg.tid) === Number(tid)
                        && Number(arg.pid || 0) === Number(pid || 0)) {
                        return arg;
                    }
                }
                return null;
            }

            function targetLesserAllowed(target) {
                var arg = target && (target.arg || findLesserArg(target.tid, target.pid));
                if (!arg) return false;
                try {
                    return !!officialLesserAllowed(arg);
                } catch (err) {
                    return false;
                }
            }

            // \u5bbf\u4e3b\u63d0\u4f9b\u7684\u901a\u7528\u6743\u9650\u5224\u5b9a\uff08\u5b98\u65b9 postBtn.d[41]/d[14] \u7684 ck()\uff09\u3002
            // \u4e0d\u91cd\u65b0\u5b9a\u4e49\uff0c\u76f4\u63a5\u7528\u5bbf\u4e3b\u7684\uff1b\u62ff\u4e0d\u5230\u5c31\u5f53\u4f5c\u6ca1\u6743\u9650\u3002
            function pageCanManage(arg) {
                try {
                    return !!(arg && hasWardenPermission(arg));
                } catch (err) {
                    return false;
                }
            }

            function targetFromOpenArgs(args) {
                var tid = Number(args && args[1]) || 0;
                var pid = Number(args && args[2]) || 0;
                var fid = Number(args && args[3]) || Number(pageWindow().__CURRENT_FID) || 0;
                var arg = findLesserArg(tid, pid);
                return {tid: tid, pid: pid, fid: fid, arg: arg};
            }

            // Fallback target: the current page's own topic/post.
            // Needed because NGA does not always go through postBtn.d[14].on or
            // commonui.lessernuke (entry points differ between desktop/mobile and
            // NGA versions), and without a target every apply attempt is skipped.
            function targetFromPage() {
                var w = pageWindow();
                var T = w.__T || {};
                // __T is not always populated when the dialog opens (NGA renders post
                // data asynchronously), so fall back to the host's URL-based tid.
                var tid = Number(T.tid) || Number(w.__CURRENT_TID) || 0;
                if (!tid) {
                    try { tid = Number(getCurrentTid()) || 0; } catch (err) { tid = 0; }
                }
                var data = w.commonui && w.commonui.postArg && w.commonui.postArg.data;
                var args = data ? Object.values(data) : [];
                var pid = 0;
                var arg = null;
                for (var i = 0; i < args.length; i++) {
                    var a = args[i];
                    if (!a || Number(a.tid) !== tid) continue;
                    if (!arg) { arg = a; pid = Number(a.pid) || 0; }
                }
                if (!arg && args.length === 1) arg = args[0];
                // the dialog for the topic itself (no reply selected) uses pid 0
                if (arg && !Number(arg.pid)) pid = 0;
                return {
                    tid: tid,
                    pid: pid,
                    fid: Number(w.__CURRENT_FID) || 0,
                    arg: arg
                };
            }

            function beginNukeOpen(target) {
                nukeOpenSeq += 1;
                nukeAppliedSeq = 0;
                nukeUserEdited = false;
                var use = (target && target.tid) ? target : targetFromPage();
                if (use && use.tid) lastLesserTarget = use;
                pendingNukeDefaults.clear();
                var panels = document.querySelectorAll('.commonwindow');
                for (var i = 0; i < panels.length; i++) {
                    panels[i].removeAttribute(LESSER_USER_EDIT);
                }
            }

            function listenNukeUserEdits(panel) {
                if (panel.getAttribute('data-nga-warden-nuke-listen') === '1') return;
                panel.setAttribute('data-nga-warden-nuke-listen', '1');
                function mark(e) {
                    var t = e && e.target;
                    if (!t || !t.matches) return;
                    if (t.matches(
                        'input[name="opt0"], input[name="opt1"], input[name="opt2"],'
                        + ' input[name="' + LESSER_MODE_NAME + '"],'
                        + ' select[data-nga-warden-delete-delay],'
                        + ' input[type="checkbox"], input[type="text"], textarea'
                    )) {
                        nukeUserEdited = true;
                        panel.setAttribute(LESSER_USER_EDIT, '1');
                    }
                }
                panel.addEventListener('click', mark, true);
                panel.addEventListener('change', mark, true);
            }

            function effectiveLesserDefaults() {
                var settings = loadAppSettings() || {};
                if (settings.nukeDefaultsOn === false) return null;
                return {
                    scope: String(settings.lesserNukeScope || '\u5927\u533a\u5185'),
                    days: String(settings.lesserNukeDays || '\u7981\u8a004\u5929'),
                    reputation: String(settings.lesserNukeReputation || '\u4e0d\u6263\u51cf'),
                    deductPrestige: !!settings.lesserDeductPrestige,
                    delay: !!settings.lesserDelay,
                    note: String(settings.lesserNukeNote || ''),
                    noteLong: String(settings.lesserNukeNoteLong || ''),
                    deletePost: settings.lesserNukeDeletePost !== false
                };
            }

            function lesserThemeNote(panel) {
                if (!panel) return null;
                return panel.querySelector('input[data-nga-warden-lesser-note]')
                    || panel.querySelector('input[placeholder*="\u64cd\u4f5c\u8bf4\u660e"]')
                    || panel.querySelector('input[placeholder*="\u5c06\u88ab\u7981\u6b62\u586b\u5199"]')
                    || panel.querySelector('input[maxlength="20"]:not([type="checkbox"]):not([type="radio"])');
            }

            function lesserSmsNote(panel) {
                if (!panel) return null;
                return panel.querySelector('textarea[data-nga-warden-lesser-note-long]')
                    || panel.querySelector('textarea[placeholder*="\u66f4\u957f\u7684\u64cd\u4f5c\u8bf4\u660e"]')
                    || panel.querySelector('textarea[placeholder*="\u77ed\u4fe1"]');
            }

            function markLesserNotes(panel) {
                var note = lesserThemeNote(panel);
                if (note) note.setAttribute('data-nga-warden-lesser-note', '1');
                var noteLong = lesserSmsNote(panel);
                if (noteLong) noteLong.setAttribute('data-nga-warden-lesser-note-long', '1');
                return {note: note, noteLong: noteLong};
            }

            function applyNukeDefaults(panel) {
                try {
                    if (nukeUserEdited || panel.getAttribute(LESSER_USER_EDIT) === '1') return true;
                    // Prefer the target recorded when the dialog was opened; fall back
                    // to the current page's own post so that opening the dialog through
                    // a path we do not hook still gets the defaults applied.
                    var target = lastLesserTarget || targetFromPage();
                    if (!target || !target.tid) return false;
                    if (!targetLesserAllowed(target) && !hasWardenPermission(target.arg)) return true;
                    var eff = effectiveLesserDefaults();
                    if (!eff) return true;
                    var scopeLabel = String(eff.scope || '\u5927\u533a\u5185');
                    var daysLabel = String(eff.days || '\u7981\u8a004\u5929');
                    var deleteOn = eff.deletePost !== false;
                    var scopeInputs = Array.from(panel.querySelectorAll('input[name="opt0"]'));
                    var daysInputs = Array.from(panel.querySelectorAll('input[name="opt1"]'));
                    var repInputs = Array.from(panel.querySelectorAll('input[name="opt2"]'));
                    var boxes = Array.from(panel.querySelectorAll('input[type="checkbox"]'));
                    var scope = pickByLabel(scopeInputs, scopeLabel);
                    var days = pickByLabel(daysInputs, daysLabel);
                    var rep = pickByLabel(repInputs, String(eff.reputation || '\u4e0d\u6263\u51cf'));
                    var prestige = pickByLabel(boxes, '\u540c\u65f6\u6263\u51cf\u5a01\u671b');
                    var muteDelay = pickByLabel(boxes, '\u5ef6\u65f6');
                    var del = pickByLabel(boxes, NUKE_DELETE_LABEL)
                        || pickByLabel(boxes, NUKE_DELETE_LABEL_ALT);
                    var notes = markLesserNotes(panel);
                    var note = notes.note;
                    var noteLong = notes.noteLong;
                    if (scope) {
                        scope.checked = true;
                        scope.setAttribute(NUKE_DEFAULTS_MARK, '');
                    }
                    if (days) {
                        days.checked = true;
                        days.setAttribute(NUKE_DEFAULTS_MARK, '');
                    }
                    if (rep) {
                        rep.checked = true;
                        rep.setAttribute(NUKE_DEFAULTS_MARK, '');
                    }
                    if (prestige) prestige.checked = !!eff.deductPrestige;
                    if (muteDelay) muteDelay.checked = !!eff.delay;
                    if (note && !note.value) note.value = String(eff.note || '');
                    if (noteLong && !noteLong.value) noteLong.value = String(eff.noteLong || '');
                    if (del) {
                        del.checked = deleteOn;
                        del.setAttribute(NUKE_DEFAULTS_MARK, '');
                    }
                    // \u672c\u6a21\u5757\u53ea\u8d1f\u8d23\u9884\u586b\u5b98\u65b9\u5f39\u7a97\uff0c\u4e0d\u53d1\u9001\u4efb\u4f55\u8bf7\u6c42\u3002
                    var done = !!(del && scopeInputs.length && daysInputs.length);
                    if (done) {
                        nukeAppliedSeq = nukeOpenSeq;
                        listenNukeUserEdits(panel);
                        if (nukeReported.get(panel) !== 'success') {
                            nukeReported.set(panel, 'success');
                            addTreeLogEntry('success', '\u5df2\u628a\u6b21\u7ea7NUKE\u9ed8\u8ba4\u503c\u5e94\u7528\u5230\u5f53\u524d\u5f39\u7a97');
                        }
                        return true;
                    }
                    return false;
                } catch (err) {
                    logError('\u5e94\u7528\u6b21\u7ea7NUKE\u9ed8\u8ba4\u503c\u5931\u8d25', err);
                    return false;
                }
            }

            function isSecondaryNukePanel(panel) {
                try {
                    if (!panel) return false;
                    var title = panel.querySelector('.tip_title');
                    if (title && title.textContent.indexOf('\u6b21\u7ea7NUKE') >= 0) return true;
                    if ((panel.textContent || '').indexOf(MAIN_NUKE_MARK) >= 0) return false;
                    var scopeInputs = panel.querySelectorAll('input[name="opt0"]');
                    var daysInputs = Array.from(panel.querySelectorAll('input[name="opt1"]'));
                    if (!scopeInputs.length || !daysInputs.length) return false;
                    var boxes = Array.from(panel.querySelectorAll('input[type="checkbox"]'));
                    return !!(pickByLabel(boxes, NUKE_DELETE_LABEL)
                        || pickByLabel(boxes, NUKE_DELETE_LABEL_ALT)
                        || pickByLabel(daysInputs, '\u7981\u8a00'));
                } catch (err) {
                    return false;
                }
            }

            function watchNukeDefaults(panel) {
                if (!panel || !panel.querySelector) return;
                if (nukeUserEdited || (panel && panel.getAttribute(LESSER_USER_EDIT) === '1')) return;
                if (nukeOpenSeq && nukeAppliedSeq === nukeOpenSeq) return;
                if (pendingNukeDefaults.has(panel)) return;
                pendingNukeDefaults.add(panel);
                var tries = 0;
                var t = setInterval(function () {
                    tries++;
                    if (nukeUserEdited || tries > 25) {
                        clearInterval(t);
                        pendingNukeDefaults.delete(panel);
                        if (!nukeUserEdited && tries > 25
                            && isSecondaryNukePanel(panel)
                            && nukeReported.get(panel) !== 'success') {
                            nukeReported.set(panel, 'error');
                            addTreeLogEntry('error', '\u6b21\u7ea7NUKE\u9ed8\u8ba4\u503c\u5e94\u7528\u5931\u8d25\uff1a\u5f39\u7a97\u9009\u9879\u4e0d\u5b8c\u6574');
                        }
                        return;
                    }
                    if (!isSecondaryNukePanel(panel)) return;
                    var target = lastLesserTarget || targetFromPage();
                    var allow = target && target.tid
                        && (targetLesserAllowed(target) || hasWardenPermission(target.arg));
                    if (allow && applyNukeDefaults(panel)) {
                        clearInterval(t);
                        pendingNukeDefaults.delete(panel);
                    }
                }, 100);
            }

            function noteNukePanel(panel) {
                if (!panel) return;
                try {
                    var now = isSecondaryNukePanel(panel);
                    var was = nukeWasSecondary.get(panel);
                    if (now && !was) beginNukeOpen();
                    nukeWasSecondary.set(panel, now);
                    if (now) {
                        var r = panel.getBoundingClientRect();
                        if (r.width > 2 && r.height > 2) nukeShown.set(panel, true);
                        watchNukeDefaults(panel);
                    }
                } catch (err) {
                    logError('\u8bb0\u5f55\u6b21\u7ea7NUKE\u9762\u677f\u72b6\u6001\u5931\u8d25', err);
                }
            }

            function scanNukeDefaults(node) {
                try {
                    var el = node && (node.nodeType === 1 ? node : node.parentElement);
                    if (!el || !el.closest) return;
                    var own = el.closest('.commonwindow');
                    if (own) noteNukePanel(own);
                    if (el.querySelectorAll) {
                        var panels = el.querySelectorAll('.commonwindow');
                        for (var i = 0; i < panels.length; i++) {
                            noteNukePanel(panels[i]);
                        }
                    }
                } catch (err) {
                    logError('\u626b\u63cf\u6b21\u7ea7NUKE\u9762\u677f\u5931\u8d25', err);
                }
            }

            function debounceScanNukeDefaults() {
                if (nukeScanTimer) return;
                nukeScanTimer = setTimeout(function () {
                    nukeScanTimer = null;
                    try {
                        scanNukeDefaults(document.documentElement);
                    } catch (err) {
                        logError('\u626b\u63cf\u6b21\u7ea7NUKE\u9762\u677f\u5931\u8d25', err);
                    }
                }, 60);
            }

            function hookLesserNukeOpen() {
                var w = pageWindow();
                var common = w.commonui;
                if (!common || !common.postBtn || !common.mainMenuItems) return true;
                var pb = common.postBtn;
                if (!pb.d || typeof pb.d !== 'object') return false;
                var spec = pb.d[BTN_LESSER];
                if (spec && !spec._ngaWdNukeDefaultsOn) {
                    var origOn = spec.on;
                    spec.on = function (event, arg) {
                        var target = arg && arg.tid ? {
                            tid: Number(arg.tid) || 0,
                            pid: Number(arg.pid) || 0,
                            fid: Number(w.__CURRENT_FID) || 0,
                            arg: arg
                        } : null;
                        beginNukeOpen(target);
                        var ret = origOn ? origOn.apply(this, arguments) : undefined;
                        setTimeout(function () { scanNukeDefaults(document.documentElement); }, 0);
                        setTimeout(function () { scanNukeDefaults(document.documentElement); }, 80);
                        return ret;
                    };
                    spec._ngaWdNukeDefaultsOn = true;
                }
                if (typeof common.lessernuke !== 'function') return false;
                if (common.lessernuke._ngaWdNukeDefaults) return true;
                var orig = common.lessernuke.bind(common);
                function wrapped() {
                    beginNukeOpen(targetFromOpenArgs(arguments));
                    var ret = orig.apply(this, arguments);
                    setTimeout(function () { scanNukeDefaults(document.documentElement); }, 0);
                    setTimeout(function () { scanNukeDefaults(document.documentElement); }, 80);
                    return ret;
                }
                wrapped._ngaWdNukeDefaults = true;
                common.lessernuke = wrapped;
                return true;
            }

            function startHookRetry() {
                if (nukeHookStarted) return;
                nukeHookStarted = true;
                var tries = 0;
                (function attempt() {
                    var done = false;
                    try {
                        done = hookLesserNukeOpen();
                    } catch (err) {
                        logError('\u6302\u63a5\u6b21\u7ea7NUKE\u6253\u5f00\u8def\u5f84\u5931\u8d25', err);
                        done = true;
                    }
                    tries += 1;
                    if (done || tries >= 120) return;
                    nukeHookTimer = setTimeout(attempt, 250);
                })();
            }

            var PACK_CHROME_SEL = [
                '[id^="nga-wb-"]',
                '[id^="nga-warden-"]',
                '[id^="nga-lht-"]',
                '[data-nga-wb-compose-split]',
                '[data-nga-wb-compose-preview]',
                '[data-nga-wb-compose-status]',
                '[data-nga-wb-compose-toggle]',
                '[data-nga-wb-compose-toggle-row]',
                '[data-nga-warden-reply]',
                '[data-superlesser-quick-reply]',
                '[data-superlesser-topic-action]'
            ].join(',');

            function nodeIsScriptChrome(el) {
                if (!el || el.nodeType !== 1) return false;
                var id = el.id || '';
                if (id.indexOf('nga-wb-') === 0
                    || id.indexOf('nga-warden-') === 0
                    || id.indexOf('nga-lht-') === 0) {
                    return true;
                }
                try {
                    if (el.matches && el.matches(PACK_CHROME_SEL)) return true;
                    if (el.closest && el.closest(PACK_CHROME_SEL)) return true;
                } catch (_) { /* detached */ }
                return false;
            }

            function pollNukeVisibility() {
                try {
                    var panels = document.querySelectorAll('.commonwindow');
                    for (var i = 0; i < panels.length; i++) {
                        var panel = panels[i];
                        if (!isSecondaryNukePanel(panel)) {
                            nukeShown.set(panel, false);
                            continue;
                        }
                        var r = panel.getBoundingClientRect();
                        var vis = r.width > 2 && r.height > 2;
                        var wasVis = nukeShown.get(panel) === true;
                        nukeShown.set(panel, vis);
                        if (vis && !wasVis) {
                            beginNukeOpen();
                            watchNukeDefaults(panel);
                        }
                    }
                } catch (err) {
                    logError('\u8f6e\u8be2\u6b21\u7ea7NUKE\u9762\u677f\u53ef\u89c1\u6027\u5931\u8d25', err);
                }
            }

            function installNukeDefaultsWatcher() {
                startHookRetry();
                if (nukeDefaultsWatchStarted) return;
                nukeDefaultsWatchStarted = true;
                try {
                    nukeDefaultsWatch.observer = new MutationObserver(function (mutations) {
                        try {
                            var sawNuke = false;
                            for (var i = 0; i < mutations.length; i++) {
                                var m = mutations[i];
                                if (m.target && nodeIsScriptChrome(m.target)) continue;
                                if (m.target && m.target.closest
                                    && m.target.closest('#m_posts')
                                    && !m.target.closest('.commonwindow')) {
                                    continue;
                                }
                                var added = m.addedNodes;
                                for (var j = 0; j < added.length; j++) {
                                    var node = added[j];
                                    if (!node || node.nodeType !== 1) continue;
                                    if (nodeIsScriptChrome(node)) continue;
                                    if ((node.matches && node.matches('.commonwindow'))
                                        || (node.querySelector && node.querySelector('.commonwindow'))) {
                                        sawNuke = true;
                                    }
                                }
                            }
                            if (!sawNuke) return;
                            debounceScanNukeDefaults();
                        } catch (err) {
                            logError('\u89c2\u5bdf\u6b21\u7ea7NUKE\u9762\u677f\u5931\u8d25', err);
                        }
                    });
                    scanNukeDefaults(document.documentElement);
                    nukeDefaultsWatch.observer.observe(document.documentElement, {
                        childList: true,
                        subtree: true
                    });
                    if (!nukePollStarted) {
                        nukePollStarted = true;
                        setInterval(pollNukeVisibility, 300);
                    }
                } catch (err) {
                    logError('\u5b89\u88c5\u6b21\u7ea7NUKE\u9ed8\u8ba4\u503c\u76d1\u89c6\u5668\u5931\u8d25', err);
                }
            }

            function install() {
                try {
                    installNukeDefaultsWatcher();
                } catch (err) {
                    logError('\u5b89\u88c5\u6b21\u7ea7NUKE\u9ed8\u8ba4\u503c\u6a21\u5757\u5931\u8d25', err);
                }
            }

            function applyNow() {
                try {
                    beginNukeOpen(lastLesserTarget || null);
                    scanNukeDefaults(document.documentElement);
                } catch (err) {
                    logError('\u91cd\u65b0\u5e94\u7528\u6b21\u7ea7NUKE\u9ed8\u8ba4\u503c\u5931\u8d25', err);
                }
            }

            return {
                install: install,
                applyNow: applyNow
            };
        }
    // ---- end spliced module: nuke-defaults.js ----

    // ==================== MODULE_SPLICE_POINT ====================

})();
