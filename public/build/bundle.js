
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let stylesheet;
    let active = 0;
    let current_rules = {};
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        if (!current_rules[name]) {
            if (!stylesheet) {
                const style = element('style');
                document.head.appendChild(style);
                stylesheet = style.sheet;
            }
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        node.style.animation = (node.style.animation || '')
            .split(', ')
            .filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        )
            .join(', ');
        if (name && !--active)
            clear_rules();
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            let i = stylesheet.cssRules.length;
            while (i--)
                stylesheet.deleteRule(i);
            current_rules = {};
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    const seen_callbacks = new Set();
    function flush() {
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    const globals = (typeof window !== 'undefined' ? window : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.18.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400, easing = identity }) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function slide(node, { delay = 0, duration = 400, easing = cubicOut }) {
        const style = getComputedStyle(node);
        const opacity = +style.opacity;
        const height = parseFloat(style.height);
        const padding_top = parseFloat(style.paddingTop);
        const padding_bottom = parseFloat(style.paddingBottom);
        const margin_top = parseFloat(style.marginTop);
        const margin_bottom = parseFloat(style.marginBottom);
        const border_top_width = parseFloat(style.borderTopWidth);
        const border_bottom_width = parseFloat(style.borderBottomWidth);
        return {
            delay,
            duration,
            easing,
            css: t => `overflow: hidden;` +
                `opacity: ${Math.min(t * 20, 1) * opacity};` +
                `height: ${t * height}px;` +
                `padding-top: ${t * padding_top}px;` +
                `padding-bottom: ${t * padding_bottom}px;` +
                `margin-top: ${t * margin_top}px;` +
                `margin-bottom: ${t * margin_bottom}px;` +
                `border-top-width: ${t * border_top_width}px;` +
                `border-bottom-width: ${t * border_bottom_width}px;`
        };
    }

    /* src/FAQItem.svelte generated by Svelte v3.18.1 */
    const file = "src/FAQItem.svelte";

    // (42:2) {:else}
    function create_else_block(ctx) {
    	let div;
    	let label0;
    	let t0;
    	let input0;
    	let t1;
    	let label1;
    	let t2;
    	let input1;
    	let t3;
    	let button;
    	let div_transition;
    	let current;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			label0 = element("label");
    			t0 = text("Question:\n        ");
    			input0 = element("input");
    			t1 = space();
    			label1 = element("label");
    			t2 = text("Answer:\n        ");
    			input1 = element("input");
    			t3 = space();
    			button = element("button");
    			button.textContent = "save (in fact no need to save, store is updated while typing)";
    			attr_dev(input0, "type", "text");
    			add_location(input0, file, 45, 8, 1257);
    			add_location(label0, file, 43, 6, 1223);
    			attr_dev(input1, "type", "text");
    			add_location(input1, file, 49, 8, 1360);
    			add_location(label1, file, 47, 6, 1328);
    			add_location(button, file, 51, 6, 1429);
    			add_location(div, file, 42, 4, 1195);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, label0);
    			append_dev(label0, t0);
    			append_dev(label0, input0);
    			set_input_value(input0, /*faqitem*/ ctx[0].question);
    			append_dev(div, t1);
    			append_dev(div, label1);
    			append_dev(label1, t2);
    			append_dev(label1, input1);
    			set_input_value(input1, /*faqitem*/ ctx[0].answer);
    			append_dev(div, t3);
    			append_dev(div, button);
    			current = true;

    			dispose = [
    				listen_dev(input0, "input", /*input0_input_handler*/ ctx[8]),
    				listen_dev(input1, "input", /*input1_input_handler*/ ctx[9]),
    				listen_dev(button, "click", /*saveFAQItem*/ ctx[4], false, false, false)
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*faqitem*/ 1 && input0.value !== /*faqitem*/ ctx[0].question) {
    				set_input_value(input0, /*faqitem*/ ctx[0].question);
    			}

    			if (dirty & /*faqitem*/ 1 && input1.value !== /*faqitem*/ ctx[0].answer) {
    				set_input_value(input1, /*faqitem*/ ctx[0].answer);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fade, {}, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fade, {}, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_transition) div_transition.end();
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(42:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (35:2) {#if !editmode}
    function create_if_block(ctx) {
    	let h2;
    	let t0_value = /*faqitem*/ ctx[0].question + "";
    	let t0;
    	let t1;
    	let if_block_anchor;
    	let dispose;
    	let if_block = /*answervisible*/ ctx[1] && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			t0 = text(t0_value);
    			t1 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(h2, "class", "svelte-4qn5oh");
    			add_location(h2, file, 35, 4, 1006);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			append_dev(h2, t0);
    			insert_dev(target, t1, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			dispose = listen_dev(h2, "click", /*toggleAnswer*/ ctx[3], false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*faqitem*/ 1 && t0_value !== (t0_value = /*faqitem*/ ctx[0].question + "")) set_data_dev(t0, t0_value);

    			if (/*answervisible*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			transition_in(if_block);
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t1);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(35:2) {#if !editmode}",
    		ctx
    	});

    	return block;
    }

    // (37:4) {#if answervisible}
    function create_if_block_1(ctx) {
    	let p;
    	let t_value = /*faqitem*/ ctx[0].answer + "";
    	let t;
    	let p_transition;
    	let current;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			add_location(p, file, 37, 6, 1088);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*faqitem*/ 1) && t_value !== (t_value = /*faqitem*/ ctx[0].answer + "")) set_data_dev(t, t_value);
    		},
    		i: function intro(local) {
    			if (current) return;

    			if (local) {
    				add_render_callback(() => {
    					if (!p_transition) p_transition = create_bidirectional_transition(p, slide, { duration: 1000 }, true);
    					p_transition.run(1);
    				});
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			if (local) {
    				if (!p_transition) p_transition = create_bidirectional_transition(p, slide, { duration: 1000 }, false);
    				p_transition.run(0);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching && p_transition) p_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(37:4) {#if answervisible}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let li;
    	let div;
    	let button0;
    	let t1;
    	let button1;
    	let t3;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	let dispose;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (!/*editmode*/ ctx[2]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			li = element("li");
    			div = element("div");
    			button0 = element("button");
    			button0.textContent = "delete";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "edit";
    			t3 = space();
    			if_block.c();
    			attr_dev(button0, "class", "destructive svelte-4qn5oh");
    			add_location(button0, file, 31, 4, 869);
    			attr_dev(button1, "class", "svelte-4qn5oh");
    			add_location(button1, file, 32, 4, 917);
    			attr_dev(div, "class", "control svelte-4qn5oh");
    			add_location(div, file, 30, 2, 843);
    			attr_dev(li, "class", "svelte-4qn5oh");
    			add_location(li, file, 29, 0, 836);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, div);
    			append_dev(div, button0);
    			append_dev(div, t1);
    			append_dev(div, button1);
    			append_dev(li, t3);
    			if_blocks[current_block_type_index].m(li, null);
    			current = true;
    			dispose = listen_dev(button1, "click", /*click_handler*/ ctx[7], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(li, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			if_blocks[current_block_type_index].d();
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { faqitem = undefined } = $$props;
    	let { index = undefined } = $$props;
    	let { faqitems = undefined } = $$props; // store must be provided by parent
    	let answervisible = false;
    	let editmode = false;

    	function toggleAnswer(event) {
    		$$invalidate(1, answervisible = !answervisible);
    	}

    	function saveFAQItem(event) {
    		// console.log("faqitem to save", faqitem);
    		// TODO save handler
    		// why isn't it necessary to update the store explicitly with the new faqitem?
    		// if it's really not necessary, the index is superfluous (no, see delete and add new item)
    		// $faqitems[index] = faqitem;
    		$$invalidate(2, editmode = false);

    		$$invalidate(1, answervisible = true);
    	} // console.log("faqitem saved to ", $faqitems);
    	// console.log("index", index);

    	const writable_props = ["faqitem", "index", "faqitems"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<FAQItem> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(2, editmode = !editmode);

    	function input0_input_handler() {
    		faqitem.question = this.value;
    		$$invalidate(0, faqitem);
    	}

    	function input1_input_handler() {
    		faqitem.answer = this.value;
    		$$invalidate(0, faqitem);
    	}

    	$$self.$set = $$props => {
    		if ("faqitem" in $$props) $$invalidate(0, faqitem = $$props.faqitem);
    		if ("index" in $$props) $$invalidate(5, index = $$props.index);
    		if ("faqitems" in $$props) $$invalidate(6, faqitems = $$props.faqitems);
    	};

    	$$self.$capture_state = () => {
    		return {
    			faqitem,
    			index,
    			faqitems,
    			answervisible,
    			editmode
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("faqitem" in $$props) $$invalidate(0, faqitem = $$props.faqitem);
    		if ("index" in $$props) $$invalidate(5, index = $$props.index);
    		if ("faqitems" in $$props) $$invalidate(6, faqitems = $$props.faqitems);
    		if ("answervisible" in $$props) $$invalidate(1, answervisible = $$props.answervisible);
    		if ("editmode" in $$props) $$invalidate(2, editmode = $$props.editmode);
    	};

    	return [
    		faqitem,
    		answervisible,
    		editmode,
    		toggleAnswer,
    		saveFAQItem,
    		index,
    		faqitems,
    		click_handler,
    		input0_input_handler,
    		input1_input_handler
    	];
    }

    class FAQItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { faqitem: 0, index: 5, faqitems: 6 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FAQItem",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get faqitem() {
    		throw new Error("<FAQItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set faqitem(value) {
    		throw new Error("<FAQItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get index() {
    		throw new Error("<FAQItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set index(value) {
    		throw new Error("<FAQItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get faqitems() {
    		throw new Error("<FAQItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set faqitems(value) {
    		throw new Error("<FAQItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/FAQ.svelte generated by Svelte v3.18.1 */
    const file$1 = "src/FAQ.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	child_ctx[9] = i;
    	return child_ctx;
    }

    // (22:2) {#each $faqitems as faqitem, i}
    function create_each_block(ctx) {
    	let current;

    	const faqitem = new FAQItem({
    			props: {
    				faqitem: /*faqitem*/ ctx[7],
    				index: /*i*/ ctx[9],
    				faqitems: /*faqitems*/ ctx[0]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(faqitem.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(faqitem, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const faqitem_changes = {};
    			if (dirty & /*$faqitems*/ 8) faqitem_changes.faqitem = /*faqitem*/ ctx[7];
    			if (dirty & /*faqitems*/ 1) faqitem_changes.faqitems = /*faqitems*/ ctx[0];
    			faqitem.$set(faqitem_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(faqitem.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(faqitem.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(faqitem, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(22:2) {#each $faqitems as faqitem, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let ul;
    	let t0;
    	let div;
    	let label0;
    	let t1;
    	let input0;
    	let t2;
    	let label1;
    	let t3;
    	let input1;
    	let t4;
    	let button;
    	let current;
    	let dispose;
    	let each_value = /*$faqitems*/ ctx[3];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t0 = space();
    			div = element("div");
    			label0 = element("label");
    			t1 = text("Question:\n    ");
    			input0 = element("input");
    			t2 = space();
    			label1 = element("label");
    			t3 = text("Answer:\n    ");
    			input1 = element("input");
    			t4 = space();
    			button = element("button");
    			button.textContent = "add";
    			attr_dev(ul, "class", "svelte-146sbs6");
    			add_location(ul, file$1, 20, 0, 426);
    			attr_dev(input0, "type", "text");
    			add_location(input0, file$1, 31, 4, 653);
    			add_location(label0, file$1, 29, 2, 627);
    			attr_dev(input1, "type", "text");
    			add_location(input1, file$1, 35, 4, 732);
    			add_location(label1, file$1, 33, 2, 708);
    			add_location(button, file$1, 37, 2, 785);
    			attr_dev(div, "class", "svelte-146sbs6");
    			add_location(div, file$1, 28, 0, 619);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, label0);
    			append_dev(label0, t1);
    			append_dev(label0, input0);
    			set_input_value(input0, /*question*/ ctx[1]);
    			append_dev(div, t2);
    			append_dev(div, label1);
    			append_dev(label1, t3);
    			append_dev(label1, input1);
    			set_input_value(input1, /*answer*/ ctx[2]);
    			append_dev(div, t4);
    			append_dev(div, button);
    			current = true;

    			dispose = [
    				listen_dev(input0, "input", /*input0_input_handler*/ ctx[5]),
    				listen_dev(input1, "input", /*input1_input_handler*/ ctx[6]),
    				listen_dev(button, "click", /*createFAQItem*/ ctx[4], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$faqitems, faqitems*/ 9) {
    				each_value = /*$faqitems*/ ctx[3];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(ul, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (dirty & /*question*/ 2 && input0.value !== /*question*/ ctx[1]) {
    				set_input_value(input0, /*question*/ ctx[1]);
    			}

    			if (dirty & /*answer*/ 4 && input1.value !== /*answer*/ ctx[2]) {
    				set_input_value(input1, /*answer*/ ctx[2]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $faqitems,
    		$$unsubscribe_faqitems = noop,
    		$$subscribe_faqitems = () => ($$unsubscribe_faqitems(), $$unsubscribe_faqitems = subscribe(faqitems, $$value => $$invalidate(3, $faqitems = $$value)), faqitems);

    	$$self.$$.on_destroy.push(() => $$unsubscribe_faqitems());
    	let { faqitems = undefined } = $$props; // store must be provided by parent
    	validate_store(faqitems, "faqitems");
    	$$subscribe_faqitems();
    	let question = "";
    	let answer = "";

    	function createFAQItem(event) {
    		// reactivity! updating the store cause the view to update with the new FAQItem
    		faqitems.create({ question, answer });

    		$$invalidate(1, question = "");
    		$$invalidate(2, answer = "");
    	}

    	const writable_props = ["faqitems"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<FAQ> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		question = this.value;
    		$$invalidate(1, question);
    	}

    	function input1_input_handler() {
    		answer = this.value;
    		$$invalidate(2, answer);
    	}

    	$$self.$set = $$props => {
    		if ("faqitems" in $$props) $$subscribe_faqitems($$invalidate(0, faqitems = $$props.faqitems));
    	};

    	$$self.$capture_state = () => {
    		return { faqitems, question, answer, $faqitems };
    	};

    	$$self.$inject_state = $$props => {
    		if ("faqitems" in $$props) $$subscribe_faqitems($$invalidate(0, faqitems = $$props.faqitems));
    		if ("question" in $$props) $$invalidate(1, question = $$props.question);
    		if ("answer" in $$props) $$invalidate(2, answer = $$props.answer);
    		if ("$faqitems" in $$props) faqitems.set($faqitems = $$props.$faqitems);
    	};

    	return [
    		faqitems,
    		question,
    		answer,
    		$faqitems,
    		createFAQItem,
    		input0_input_handler,
    		input1_input_handler
    	];
    }

    class FAQ extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { faqitems: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FAQ",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get faqitems() {
    		throw new Error("<FAQ>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set faqitems(value) {
    		throw new Error("<FAQ>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const faqitems_default = [
        {
            question: 'What does the Plone Foundation do?',
            answer: `The mission of the Plone Foundation is to protect and promote Plone.
            The Foundation provides marketing assistance, awareness, and
            evangelism assistance to the Plone community. The Foundation also
            assists with development funding and coordination of funding for
            large feature implementations. In this way, our role is similar to
            the role of the Apache Software Foundation and its relationship with
            the Apache Project.`
        },
        {
            question: 'Who can join the Plone Foundation?',
            answer: `Everyone contributing to Plone Software, Plone documentation, organizing events or doing something good for PF.`
        }
    ];

    function createFAQItems() {
        const {subscribe, set, update} = writable(faqitems_default);

        return {
            subscribe,
            set,
            create: faqitem => update(items => {
                // console.log('create faqitem', faqitem);
                return [
                    ...items,
                    faqitem
                ]
            }),
            reset: () => set(faqitems_default)
        }
    }

    const faqitemsstore1 = createFAQItems();
    const faqitemsstore2 = createFAQItems();

    /* src/App.svelte generated by Svelte v3.18.1 */

    const { console: console_1 } = globals;
    const file$2 = "src/App.svelte";

    function create_fragment$2(ctx) {
    	let main;
    	let div;
    	let h2;
    	let t1;
    	let button;
    	let t3;
    	let h10;
    	let t4;
    	let t5;
    	let t6;
    	let t7;
    	let t8;
    	let h11;
    	let t10;
    	let current;
    	let dispose;

    	const faq0 = new FAQ({
    			props: { faqitems: faqitemsstore1 },
    			$$inline: true
    		});

    	const faq1 = new FAQ({
    			props: { faqitems: faqitemsstore2 },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			div = element("div");
    			h2 = element("h2");
    			h2.textContent = "DEBUG";
    			t1 = space();
    			button = element("button");
    			button.textContent = "show store faqitemsstore1";
    			t3 = space();
    			h10 = element("h1");
    			t4 = text("FAQ for \"");
    			t5 = text(/*name*/ ctx[0]);
    			t6 = text("\"");
    			t7 = space();
    			create_component(faq0.$$.fragment);
    			t8 = space();
    			h11 = element("h1");
    			h11.textContent = "FAQ for \"Frameworks\"";
    			t10 = space();
    			create_component(faq1.$$.fragment);
    			add_location(h2, file$2, 11, 4, 183);
    			add_location(button, file$2, 12, 4, 202);
    			add_location(div, file$2, 10, 2, 173);
    			attr_dev(h10, "class", "svelte-rgfnp2");
    			add_location(h10, file$2, 15, 2, 333);
    			attr_dev(h11, "class", "svelte-rgfnp2");
    			add_location(h11, file$2, 18, 2, 397);
    			attr_dev(main, "class", "svelte-rgfnp2");
    			add_location(main, file$2, 9, 0, 164);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div);
    			append_dev(div, h2);
    			append_dev(div, t1);
    			append_dev(div, button);
    			append_dev(main, t3);
    			append_dev(main, h10);
    			append_dev(h10, t4);
    			append_dev(h10, t5);
    			append_dev(h10, t6);
    			append_dev(main, t7);
    			mount_component(faq0, main, null);
    			append_dev(main, t8);
    			append_dev(main, h11);
    			append_dev(main, t10);
    			mount_component(faq1, main, null);
    			current = true;
    			dispose = listen_dev(button, "click", /*click_handler*/ ctx[2], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*name*/ 1) set_data_dev(t5, /*name*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(faq0.$$.fragment, local);
    			transition_in(faq1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(faq0.$$.fragment, local);
    			transition_out(faq1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(faq0);
    			destroy_component(faq1);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $faqitemsstore1;
    	validate_store(faqitemsstore1, "faqitemsstore1");
    	component_subscribe($$self, faqitemsstore1, $$value => $$invalidate(1, $faqitemsstore1 = $$value));
    	let { name } = $$props;
    	const writable_props = ["name"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		console.log(faqitemsstore1);
    		console.log($faqitemsstore1);
    	};

    	$$self.$set = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    	};

    	$$self.$capture_state = () => {
    		return { name, $faqitemsstore1 };
    	};

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("$faqitemsstore1" in $$props) faqitemsstore1.set($faqitemsstore1 = $$props.$faqitemsstore1);
    	};

    	return [name, $faqitemsstore1, click_handler];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { name: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !("name" in props)) {
    			console_1.warn("<App> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'Garten'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
