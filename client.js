window.__ModuleLoader__.load({
  id: '@local/dsh-guided-image-generation',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const FIELDS = [
      ['subject', '主体', '例如：两座摩天大楼之间的巨大海水墙和三头鲸鱼'],
      ['scene', '场景', '例如：现代市中心，深夜，暴雨，满月'],
      ['composition', '构图', '例如：街道中央视角，单点透视，中央消失点'],
      ['style', '风格', '例如：超写实、电影级灾难奇幻'],
      ['lighting', '光线', '例如：月光、建筑窗光、红色汽车尾灯'],
      ['color', '色调', '例如：深海军蓝、钢蓝色，高对比度'],
      ['details', '细节', '例如：雨丝、体积雾、街道蒸汽、湿地倒影'],
      ['negative', '排除项', '例如：文字、水印、Logo、卡通风格'],
    ];
    const INITIAL = {};
    for (const field of FIELDS) INITIAL[field[0]] = '';

    const RATIOS = [
      { id: '1:1', label: '1:1 方图', size: '1024x1024' },
      { id: '3:2', label: '3:2 横图', size: '1536x1024' },
      { id: '2:3', label: '2:3 竖图', size: '1024x1536' },
      { id: '16:9', label: '16:9 宽幅（实验）', size: '1792x1024' },
      { id: '9:16', label: '9:16 竖屏（实验）', size: '1024x1792' },
    ];

    const TEMPLATES = [
      { id: '', name: '— 选择模板 —', values: null },
      {
        id: 'portrait', name: '写实人像',
        values: {
          subject: '一位成年人的半身肖像', scene: '简洁浅色背景，室内柔和日光',
          composition: '正面稍侧，85mm 镜头，浅景深', style: '写实人像摄影',
          lighting: '柔和自然窗光，面部受光均匀', color: '中性肤色，低饱和背景',
          details: '皮肤质感自然，发丝清晰，眼神有光',
          negative: '塑料感皮肤、过度磨皮、畸形手指、文字、水印',
        },
      },
      {
        id: 'city', name: '城市夜景',
        values: {
          subject: '雨中城市街道与建筑群', scene: '现代市中心，深夜，暴雨，霓虹反光',
          composition: '街道视角，单点透视，低机位', style: '超写实电影级摄影',
          lighting: '路灯、招牌、汽车尾灯，湿地面反光', color: '深蓝与青橙对比，高反差',
          details: '雨丝、体积雾、街道蒸汽、镜面倒影',
          negative: '文字、水印、卡通风格、过曝高光',
        },
      },
      {
        id: 'product', name: '产品静物',
        values: {
          subject: '单个产品置于台面中央', scene: '极简棚拍，纯净背景',
          composition: '居中构图，45 度俯视，微距', style: '商业产品摄影',
          lighting: '柔光箱加轮廓光，阴影干净', color: '中性白平衡，低饱和',
          details: '材质纹理清晰，边缘轮廓光突出体积',
          negative: '杂乱背景、反光脏点、文字、水印',
        },
      },
      {
        id: 'concept', name: '概念场景',
        values: {
          subject: '超现实主体与巨大尺度对比', scene: '虚构环境，宏大远景',
          composition: '广角，主体偏中，强纵深', style: '电影概念艺术，写实渲染',
          lighting: '低角度逆光，大气散射', color: '冷暖对撞，雾气分层',
          details: '体积光、尘埃、远景空气透视',
          negative: '插画笔触、平面色块、文字、水印',
        },
      },
    ];

    const POS_KEY = 'dsh.guidedImage.position';
    const SETTINGS_KEY = 'dsh.guidedImage.settings';
    const HISTORY_KEY = 'dsh.guidedImage.history';
    const PROVIDER_KEY = 'dsh.guidedImage.provider';
    const PROVIDER_DEFAULT = {
      baseUrl: 'https://api.openai.com/v1',
      apiKey: '',
      model1: 'gpt-image-1',
      model2: '',
    };
    const FALLBACK_MODELS = [
      'gpt-image-1',
      'gpt-image-1.5',
      'gpt-image-2',
      'gpt-image-2.5-flare',
      'gpt-image-2.5-sunburst',
    ];
    const FAB_SIZE = { width: 138, height: 40 };
    const BRIDGE = 'http://127.0.0.1:8769';

    const bus = { listeners: new Set() };
    function emitToggle() {
      for (const listener of bus.listeners) {
        try { listener(); } catch (error) { /* noop */ }
      }
    }

    const CARD = {
      background: '#171a21',
      color: '#f3f5f9',
      border: '1px solid rgba(255,255,255,.18)',
      borderRadius: 14,
      boxShadow: '0 18px 48px rgba(0,0,0,.55)',
      colorScheme: 'dark',
    };
    const INPUT = {
      width: '100%', boxSizing: 'border-box', padding: '7px 9px',
      border: '1px solid rgba(255,255,255,.22)', borderRadius: 8,
      background: '#0f1219', color: '#f3f5f9', font: 'inherit', fontSize: 13,
      outline: 'none', colorScheme: 'dark',
    };
    const ACTION = {
      border: '1px solid rgba(255,255,255,.22)', borderRadius: 8,
      padding: '7px 12px', background: '#242a35', color: '#f3f5f9',
      font: 'inherit', fontSize: 13, cursor: 'pointer',
    };
    const PRIMARY = Object.assign({}, ACTION, {
      background: '#2f6feb', borderColor: '#2f6feb', color: '#ffffff', fontWeight: 600,
    });
    const LABEL = { fontSize: 12, fontWeight: 500, color: '#b8c0cf' };
    const PROMPT_BOX = {
      width: '100%', boxSizing: 'border-box', minHeight: 128, maxHeight: 240,
      resize: 'vertical', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      fontSize: 12, lineHeight: 1.6, padding: 10, borderRadius: 8,
      background: '#0f1219', color: '#dfe4ec',
      border: '1px solid rgba(255,255,255,.22)', fontFamily: 'inherit',
      outline: 'none', colorScheme: 'dark',
    };

    function clamp(value, min, max) { return Math.min(Math.max(value, min), max); }

    function stamp() {
      return new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    }

    function explain(raw) {
      const text = String(raw || '');
      if (/failed to fetch|networkerror|load failed/i.test(text)) return '本机桥接未响应（127.0.0.1:8769），请重启 DSH 或重新启动桥接服务';
      if (/UNEXPECTED_EOF|SSL|EOF occurred|Connection reset|aborted/i.test(text)) return '与上游的连接被中断（多为限流或网络波动），等待 30 秒后重试';
      if (/rate-limited|429|rate_limit/i.test(text)) return '上游账号池限流，稍后重试或换 Key';
      if (/insufficient balance|余额|billing/i.test(text)) return '账号余额不足';
      if (/not supported|invalid.?model|model_not_found|does not exist/i.test(text)) return '模型不可用，可能已下线或改名';
      if (/OPENAI_API_KEY/i.test(text)) return '未配置 API Key：点右上角「⚙ 供应商」填入你自己的 Key';
      if (/timeout|timed out|ETIMEDOUT/i.test(text)) return '请求超时，可重试';
      if (/content.?policy|safety/i.test(text)) return '内容被策略拦截，请调整提示词';
      if (/HTTP 400/.test(text)) return '上游拒绝了这次请求（多为提示词触发内容过滤，或参数不被接受）';
      return text;
    }

    function loadHistory() {
      try {
        const raw = window.localStorage.getItem(HISTORY_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed.slice(0, 12) : [];
      } catch (error) { return []; }
    }

    function saveHistory(items) {
      try { window.localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 12))); }
      catch (error) { /* noop */ }
    }

    function loadSettings() {
      const fallback = { ratio: '3:2', quality: 'high' };
      try {
        const raw = window.localStorage.getItem(SETTINGS_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        if (!parsed) return fallback;
        return {
          ratio: RATIOS.some(function (item) { return item.id === parsed.ratio; }) ? parsed.ratio : fallback.ratio,
          quality: ['high', 'medium', 'low'].indexOf(parsed.quality) >= 0 ? parsed.quality : fallback.quality,
        };
      } catch (error) { return fallback; }
    }

    function defaultPos() {
      const width = typeof window === 'undefined' ? 1280 : window.innerWidth;
      const height = typeof window === 'undefined' ? 840 : window.innerHeight;
      return { x: 24, y: height - FAB_SIZE.height - 28 };
    }

    function loadPos() {
      const fallback = defaultPos();
      try {
        const raw = window.localStorage.getItem(POS_KEY);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        if (typeof parsed.x !== 'number' || typeof parsed.y !== 'number') return fallback;
        return {
          x: clamp(parsed.x, 8, Math.max(8, window.innerWidth - FAB_SIZE.width - 8)),
          y: clamp(parsed.y, 8, Math.max(8, window.innerHeight - FAB_SIZE.height - 8)),
        };
      } catch (error) { return fallback; }
    }

    function savePos(next) {
      try { window.localStorage.setItem(POS_KEY, JSON.stringify({ x: Math.round(next.x), y: Math.round(next.y) })); }
      catch (error) { /* noop */ }
    }

    function loadProvider() {
      try {
        const raw = window.localStorage.getItem(PROVIDER_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        if (!parsed) return Object.assign({}, PROVIDER_DEFAULT);
        return {
          baseUrl: typeof parsed.baseUrl === 'string' && parsed.baseUrl ? parsed.baseUrl : PROVIDER_DEFAULT.baseUrl,
          apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : '',
          model1: typeof parsed.model1 === 'string' && parsed.model1 ? parsed.model1 : PROVIDER_DEFAULT.model1,
          model2: typeof parsed.model2 === 'string' && parsed.model2 ? parsed.model2 : PROVIDER_DEFAULT.model2,
        };
      } catch (error) { return Object.assign({}, PROVIDER_DEFAULT); }
    }

    function saveProvider(next) {
      try { window.localStorage.setItem(PROVIDER_KEY, JSON.stringify(next)); }
      catch (error) { /* noop */ }
    }

    function FloatingGenerator() {
      const settings = loadSettings();
      const [open, setOpen] = React.useState(false);
      const [pos, setPos] = React.useState(loadPos);
      const [values, setValues] = React.useState(INITIAL);
      const [override, setOverride] = React.useState(null);
      const [ratio, setRatio] = React.useState(settings.ratio);
      const [quality, setQuality] = React.useState(settings.quality);
      const [count, setCount] = React.useState(1);
      const [template, setTemplate] = React.useState('');
      const [output, setOutput] = React.useState('output/image-' + stamp() + '.png');
      const [status, setStatus] = React.useState('');
      const [busy, setBusy] = React.useState(false);
      const [results, setResults] = React.useState([]);
      const [history, setHistory] = React.useState(loadHistory);
      const [copyState, setCopyState] = React.useState('');
      const [grabbing, setGrabbing] = React.useState(false);
      const [showHistory, setShowHistory] = React.useState(false);
      const [view, setView] = React.useState(function () {
        return { w: window.innerWidth, h: window.innerHeight };
      });
      const [provider, setProvider] = React.useState(loadProvider);
      const [showProvider, setShowProvider] = React.useState(false);
      const [checkState, setCheckState] = React.useState('');
      const [modelList, setModelList] = React.useState([]);
      const [modelState, setModelState] = React.useState('');

      function loadModels() {
        setModelState('读取模型列表…');
        const query = 'base=' + encodeURIComponent(provider.baseUrl || PROVIDER_DEFAULT.baseUrl)
          + '&key=' + encodeURIComponent(provider.apiKey || '');
        fetch(BRIDGE + '/models?' + query)
          .then(function (response) { return response.json(); })
          .then(function (data) {
            if (!data.ok) { setModelState('读取失败：' + (data.error || '未知错误')); return; }
            const all = data.models || [];
            const imageOnly = all.filter(function (id) { return /image/i.test(id); });
            const list = imageOnly.length ? imageOnly : all;
            setModelList(list);
            setModelState('共 ' + list.length + ' 个可用模型');
          })
          .catch(function () { setModelState('读取失败：本机桥接未响应'); });
      }

      function modelOptions(current, allowNone) {
        const list = [];
        const push = function (value) { if (list.indexOf(value) < 0) list.push(value); };
        if (allowNone) push('');
        (modelList.length ? modelList : FALLBACK_MODELS).forEach(push);
        if (current) push(current);
        return list;
      }

      function chooseDir() {
        fetch(BRIDGE + '/pickdir')
          .then(function (response) { return response.json(); })
          .then(function (data) {
            if (!data.ok || !data.path) { setStatus('未选择文件夹'); return; }
            const separator = data.path.indexOf('\\') >= 0 ? '\\' : '/';
            setOutput(data.path + separator + 'image-' + stamp() + '.png');
          })
          .catch(function () { setStatus('选择文件夹失败：本机桥接未响应'); });
      }

      function patchProvider(patch) {
        const next = Object.assign({}, provider, patch);
        setProvider(next);
        saveProvider(next);
      }

      function checkProvider() {
        setCheckState('测试中…');
        const query = 'base=' + encodeURIComponent(provider.baseUrl || PROVIDER_DEFAULT.baseUrl)
          + '&key=' + encodeURIComponent(provider.apiKey || '');
        fetch(BRIDGE + '/check?' + query)
          .then(function (response) { return response.json(); })
          .then(function (data) {
            if (data.ok) setCheckState('连接正常（HTTP ' + data.status + '）');
            else setCheckState('连接失败：' + (data.body || data.error || ('HTTP ' + data.status)));
          })
          .catch(function () { setCheckState('测试失败：本机桥接未响应'); });
      }

      const posRef = React.useRef(pos);
      const drag = React.useRef({ active: false, moved: false, startX: 0, startY: 0, originX: 0, originY: 0 });
      const usedRef = React.useRef(new Set());
      const modelFetched = React.useRef(false);
      posRef.current = pos;

      const display = {
        x: clamp(pos.x, 8, Math.max(8, view.w - FAB_SIZE.width - 8)),
        y: clamp(pos.y, 8, Math.max(8, view.h - FAB_SIZE.height - 8)),
      };
      const displayRef = React.useRef(display);
      displayRef.current = display;

      React.useEffect(function () {
        const listener = function () { setOpen(function (value) { return !value; }); };
        bus.listeners.add(listener);
        return function () { bus.listeners.delete(listener); };
      }, []);

      React.useEffect(function () {
        const onResize = function () {
          setView({ w: window.innerWidth, h: window.innerHeight });
        };
        window.addEventListener('resize', onResize);
        onResize();
        return function () { window.removeEventListener('resize', onResize); };
      }, []);

      React.useEffect(function () {
        if (showProvider && !modelFetched.current) {
          modelFetched.current = true;
          loadModels();
        }
      }, [showProvider]);

      const size = (RATIOS.find(function (item) { return item.id === ratio; }) || RATIOS[1]).size;

      function persistSettings(nextRatio, nextQuality) {
        try {
          window.localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ratio: nextRatio, quality: nextQuality }));
        } catch (error) { /* noop */ }
      }

      function moveTo(x, y) {
        const next = {
          x: clamp(x, 8, Math.max(8, window.innerWidth - FAB_SIZE.width - 8)),
          y: clamp(y, 8, Math.max(8, window.innerHeight - FAB_SIZE.height - 8)),
        };
        posRef.current = next;
        setPos(next);
      }

      function onPointerDown(event) {
        if (event.button !== 0) return;
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = {
          active: true, moved: false,
          startX: event.clientX, startY: event.clientY,
          originX: displayRef.current.x, originY: displayRef.current.y,
        };
        setGrabbing(true);
      }

      function onPointerMove(event) {
        const state = drag.current;
        if (!state.active) return;
        const dx = event.clientX - state.startX;
        const dy = event.clientY - state.startY;
        if (!state.moved && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) state.moved = true;
        if (state.moved) moveTo(state.originX + dx, state.originY + dy);
      }

      function onPointerUp(event) {
        const state = drag.current;
        if (!state.active) return;
        state.active = false;
        setGrabbing(false);
        try { event.currentTarget.releasePointerCapture(event.pointerId); } catch (error) { /* noop */ }
        if (state.moved) savePos(posRef.current);
        else setOpen(!open);
      }

      let draft = '';
      for (const field of FIELDS) {
        if (values[field[0]]) draft += field[1] + '：' + values[field[0]] + '\n';
      }
      draft += '\n真实摄影，细节丰富，电影级曝光与景深。无文字、无水印、无 Logo、无边框、无插画风格。';
      const prompt = override === null ? draft : override;

      function targetFor(base, index, total) {
        if (total <= 1) return base;
        const dot = base.lastIndexOf('.');
        if (dot < 0) return base + '-' + (index + 1);
        return base.slice(0, dot) + '-' + (index + 1) + base.slice(dot);
      }

      function uniqueBase(requested) {
        let base = (requested || '').trim() || ('output/image-' + stamp() + '.png');
        if (!usedRef.current.has(base)) return base;
        const dot = base.lastIndexOf('.');
        const withStamp = dot < 0
          ? base + '-' + stamp()
          : base.slice(0, dot) + '-' + stamp() + base.slice(dot);
        return withStamp;
      }

      function generate() {
        const total = Math.max(1, Math.min(4, count));
        const base = uniqueBase(output);
        for (let i = 0; i < total; i += 1) usedRef.current.add(targetFor(base, i, total));
        setBusy(true);
        setResults([]);
        setStatus(total > 1 ? '正在生成 1/' + total + '…' : '正在生成…');
        const collected = [];

        function step(index) {
          if (index >= total) {
            setBusy(false);
            setStatus(collected.length ? '完成：' + collected.length + ' 张' : '生成失败');
            if (collected.length) {
              const merged = collected.concat(history).slice(0, 12);
              setHistory(merged);
              saveHistory(merged);
            }
            return;
          }
          setStatus('正在生成 ' + (index + 1) + '/' + total + '…');
          fetch(BRIDGE + '/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: prompt,
              size: size,
              quality: quality,
              output: targetFor(base, index, total),
              base_url: provider.baseUrl || undefined,
              api_key: provider.apiKey || undefined,
              models: [provider.model1, provider.model2].filter(function (item) { return !!item; }),
            }),
          })
            .then(function (response) {
              return response.json().then(function (data) {
                if (!response.ok) throw new Error(explain(data.error));
                collected.push({ path: data.path, time: Date.now(), prompt: prompt, ratio: ratio });
                setResults(collected.slice());
                step(index + 1);
              });
            })
            .catch(function (error) {
              const reason = explain(error.message);
              if (/API Key/.test(reason)) setShowProvider(true);
              setStatus('第 ' + (index + 1) + ' 张失败：' + reason);
              setBusy(false);
              if (collected.length) {
                const merged = collected.concat(history).slice(0, 12);
                setHistory(merged);
                saveHistory(merged);
              }
            });
        }

        step(0);
      }

      function openFolder() {
        const target = results.length ? results[results.length - 1].path : output;
        fetch(BRIDGE + '/open?path=' + encodeURIComponent(target)).catch(function () {});
      }

      function build() {
        const fab = h('button', {
          type: 'button',
          title: '拖动可移动，点击展开（Ctrl+Shift+G）',
          onPointerDown: onPointerDown,
          onPointerMove: onPointerMove,
          onPointerUp: onPointerUp,
          onPointerCancel: onPointerUp,
          style: Object.assign({}, PRIMARY, {
            position: 'fixed', left: display.x, top: display.y, zIndex: 2147482000,
            width: FAB_SIZE.width, height: FAB_SIZE.height, padding: 0,
            borderRadius: 999, cursor: grabbing ? 'grabbing' : 'grab',
            userSelect: 'none', touchAction: 'none',
            boxShadow: '0 10px 26px rgba(0,0,0,.4)',
          }),
        }, open ? '× 收起' : '🎨 图片生成');

        if (!open) return fab;

        const panelLeft = clamp(display.x, 8, Math.max(8, view.w - 448));
        const panelBottom = clamp(view.h - display.y + 10, 8, Math.max(8, view.h - 240));

        const rows = FIELDS.map(function (field) {
          const key = field[0];
          return h('label', { key: key, style: { display: 'grid', gap: 4, fontSize: 12 } },
            h('span', { style: LABEL }, field[1]),
            h('input', {
              style: INPUT, value: values[key], placeholder: field[2],
              onChange: function (event) {
                setValues(Object.assign({}, values, { [key]: event.target.value }));
              },
            }));
        });

        const thumbs = results.map(function (item, index) {
          return h('img', {
            key: item.path + index,
            src: BRIDGE + '/image?path=' + encodeURIComponent(item.path),
            alt: '生成结果',
            title: item.path,
            style: { display: 'block', width: '100%', borderRadius: 10, marginTop: index ? 8 : 0 },
          });
        });

        const historyThumbs = history.map(function (item, index) {
          return h('img', {
            key: item.path + index,
            src: BRIDGE + '/image?path=' + encodeURIComponent(item.path),
            alt: '历史生成',
            title: item.path,
            style: { width: 64, height: 64, objectFit: 'cover', borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(255,255,255,.18)' },
            onClick: function () { setResults([item]); setPreviewPath(item.path); },
          });
        });

        function setPreviewPath(path) { setStatus('已选：' + path); }

        const panel = h('div', {
          style: Object.assign({}, CARD, {
            position: 'fixed', left: panelLeft, bottom: panelBottom, zIndex: 2147482000,
            width: 'min(440px, calc(100vw - 48px))', maxHeight: 'min(74vh, 660px)',
            overflowY: 'auto', padding: 16, pointerEvents: 'auto', display: 'grid', gap: 10,
          }),
        },
          h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 } },
            h('div', { style: { fontWeight: 600, fontSize: 14, color: '#f3f5f9' } }, '图片生成引导'),
            h('div', { style: { display: 'flex', gap: 6 } },
              h('button', { type: 'button', style: Object.assign({}, ACTION, { padding: '3px 8px', fontSize: 11 }), onClick: function () { setShowProvider(!showProvider); } },
                showProvider ? '收起设置' : '⚙ 供应商'),
              h('button', { type: 'button', style: Object.assign({}, ACTION, { padding: '3px 8px', fontSize: 11 }), onClick: function () { setShowHistory(!showHistory); } },
                showHistory ? '收起历史' : '历史 ' + history.length))),

          showProvider
            ? h('div', { style: { display: 'grid', gap: 8, padding: 10, borderRadius: 10, background: '#11141b', border: '1px solid rgba(255,255,255,.14)' } },
                h('div', { style: { fontSize: 11, color: '#8fb7ff', lineHeight: 1.5 } },
                  '填入你自己的供应商地址与 Key，仅保存在本机浏览器；留空则使用 DSH 内置 Key。'),
                h('label', { style: { display: 'grid', gap: 4, fontSize: 12 } },
                  h('span', { style: LABEL }, '接口地址（含 /v1）'),
                  h('input', {
                    style: INPUT, value: provider.baseUrl, placeholder: PROVIDER_DEFAULT.baseUrl,
                    onChange: function (e) { patchProvider({ baseUrl: e.target.value }); },
                  })),
                h('label', { style: { display: 'grid', gap: 4, fontSize: 12 } },
                  h('span', { style: LABEL }, 'API Key'),
                  h('input', {
                    style: INPUT, type: 'password', value: provider.apiKey, placeholder: '留空则用 DSH 内置 Key',
                    onChange: function (e) { patchProvider({ apiKey: e.target.value }); },
                  })),
                h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 } },
                  h('label', { style: { display: 'grid', gap: 4, fontSize: 12 } },
                    h('span', { style: LABEL }, '首选模型'),
                    h('select', {
                      style: INPUT, value: provider.model1,
                      onChange: function (e) { patchProvider({ model1: e.target.value }); },
                    }, modelOptions(provider.model1, false).map(function (id) { return h('option', { key: id, value: id }, id); }))),
                  h('label', { style: { display: 'grid', gap: 4, fontSize: 12 } },
                    h('span', { style: LABEL }, '回退模型'),
                    h('select', {
                      style: INPUT, value: provider.model2,
                      onChange: function (e) { patchProvider({ model2: e.target.value }); },
                    }, modelOptions(provider.model2, true).map(function (id) {
                      return h('option', { key: id || 'none', value: id }, id || '（不启用回退）');
                    })))),
                h('div', { style: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' } },
                  h('button', { type: 'button', style: ACTION, onClick: loadModels }, '读取模型列表'),
                  h('button', { type: 'button', style: ACTION, onClick: checkProvider }, '测试连接'),
                  h('button', {
                    type: 'button', style: ACTION,
                    onClick: function () {
                      const next = Object.assign({}, PROVIDER_DEFAULT);
                      setProvider(next);
                      saveProvider(next);
                      setCheckState('已恢复默认');
                      setModelList([]);
                      setModelState('');
                    },
                  }, '恢复默认'),
                  checkState ? h('span', { style: { fontSize: 11, color: '#cfd6e2', wordBreak: 'break-all' } }, checkState) : null,
                  modelState ? h('span', { style: { fontSize: 11, color: '#8fb7ff', wordBreak: 'break-all' } }, modelState) : null))
            : null,

          h('label', { style: { display: 'grid', gap: 4, fontSize: 12 } },
            h('span', { style: LABEL }, '模板'),
            h('select', {
              style: INPUT, value: template,
              onChange: function (event) {
                const id = event.target.value;
                setTemplate(id);
                const found = TEMPLATES.find(function (item) { return item.id === id; });
                if (found && found.values) {
                  setValues(Object.assign({}, INITIAL, found.values));
                  setOverride(null);
                }
              },
            }, TEMPLATES.map(function (item) { return h('option', { key: item.id, value: item.id }, item.name); }))),

          rows,

          h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 } },
            h('label', { style: { display: 'grid', gap: 4, fontSize: 12 } },
              h('span', { style: LABEL }, '比例'),
              h('select', {
                style: INPUT, value: ratio,
                onChange: function (event) { setRatio(event.target.value); persistSettings(event.target.value, quality); },
              }, RATIOS.map(function (item) {
                return h('option', { key: item.id, value: item.id }, item.label + '  ' + item.size);
              }))),
            h('label', { style: { display: 'grid', gap: 4, fontSize: 12 } },
              h('span', { style: LABEL }, '质量'),
              h('select', {
                style: INPUT, value: quality,
                onChange: function (event) { setQuality(event.target.value); persistSettings(ratio, event.target.value); },
              }, h('option', { value: 'high' }, 'high'),
                 h('option', { value: 'medium' }, 'medium'),
                 h('option', { value: 'low' }, 'low')))),

          h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 } },
            h('label', { style: { display: 'grid', gap: 4, fontSize: 12 } },
              h('span', { style: LABEL }, '数量'),
              h('select', {
                style: INPUT, value: count,
                onChange: function (event) { setCount(Number(event.target.value)); },
              }, h('option', { value: 1 }, '1 张'),
                 h('option', { value: 2 }, '2 张'),
                 h('option', { value: 3 }, '3 张'),
                 h('option', { value: 4 }, '4 张'))),
            h('label', { style: { display: 'grid', gap: 4, fontSize: 12 } },
              h('span', { style: LABEL }, '输出文件夹与文件名'),
              h('div', { style: { display: 'flex', gap: 6 } },
                h('input', { style: INPUT, value: output, onChange: function (e) { setOutput(e.target.value); } }),
                h('button', { type: 'button', style: Object.assign({}, ACTION, { whiteSpace: 'nowrap' }), onClick: chooseDir }, '选择…')))),

          h('div', { style: { display: 'grid', gap: 6 } },
            h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 } },
              h('span', { style: LABEL }, '提示词（可直接编辑）'),
              h('button', {
                type: 'button', style: Object.assign({}, ACTION, { padding: '3px 8px', fontSize: 11 }),
                onClick: function () { setOverride(null); },
              }, '按引导重填')),
            h('textarea', {
              style: PROMPT_BOX, value: prompt, spellCheck: false,
              onChange: function (event) { setOverride(event.target.value); },
            }),
            h('span', { style: { fontSize: 11, color: override === null ? '#7f8899' : '#8fb7ff' } },
              override === null ? '由上方引导自动生成；直接修改后即以你的文本为准。' : '正在使用你编辑的文本。')),

          h('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } },
            h('button', { type: 'button', style: PRIMARY, disabled: busy, onClick: generate },
              busy ? '生成中…' : '生成图片'),
            h('button', {
              type: 'button', style: ACTION, disabled: busy,
              onClick: function () {
                navigator.clipboard.writeText(prompt).then(function () {
                  setCopyState('已复制');
                  setTimeout(function () { setCopyState(''); }, 1500);
                }).catch(function () { setCopyState('复制失败'); });
              },
            }, copyState || '复制提示词'),
            h('button', { type: 'button', style: ACTION, onClick: openFolder }, '打开文件夹'),
            h('button', { type: 'button', style: ACTION, onClick: function () { setOpen(false); } }, '关闭')),

          status ? h('div', { role: 'status', style: { fontSize: 12, lineHeight: 1.6, wordBreak: 'break-all', color: '#cfd6e2' } }, status) : null,

          thumbs.length ? h('div', null, thumbs) : null,

          showHistory && historyThumbs.length
            ? h('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 4, borderTop: '1px solid rgba(255,255,255,.14)' } }, historyThumbs)
            : null);

        return h('div', null, fab, panel);
      }

      try {
        return build();
      } catch (error) {
        return h('div', {
          style: { position: 'fixed', left: 24, bottom: 24, zIndex: 2147482000, padding: 10, fontSize: 12, color: '#fff', background: '#b91c1c' },
        }, '图片生成面板出错：' + error.message);
      }
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        fetch(BRIDGE + '/ping?stage=apply').catch(function () {});
        ctx.effect(function () {
          const onKey = function (event) {
            if (event.ctrlKey && event.shiftKey && (event.key === 'G' || event.key === 'g')) {
              event.preventDefault();
              emitToggle();
            }
          };
          window.addEventListener('keydown', onKey);
          return function () { window.removeEventListener('keydown', onKey); };
        });
        ctx.slots.inject('shell.overlay', () => ctx.slots.register(
          { name: 'shell.overlay', id: 'guided-image-generation', order: 1000 },
          FloatingGenerator,
        ));
      },
    };
  },
});
