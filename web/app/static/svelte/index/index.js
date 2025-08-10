
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var indexApp = (function () {
    'use strict';

    function noop() { }
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
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
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
    function set_style(node, key, value, important) {
        if (value == null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    /**
     * Creates an event dispatcher that can be used to dispatch [component events](/docs#template-syntax-component-directives-on-eventname).
     * Event dispatchers are functions that can take two arguments: `name` and `detail`.
     *
     * Component events created with `createEventDispatcher` create a
     * [CustomEvent](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent).
     * These events do not [bubble](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_bubbling_and_capture).
     * The `detail` argument corresponds to the [CustomEvent.detail](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/detail)
     * property and can contain any type of data.
     *
     * https://svelte.dev/docs#run-time-svelte-createeventdispatcher
     */
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail, { cancelable = false } = {}) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail, { cancelable });
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
                return !event.defaultPrevented;
            }
            return true;
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
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
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
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
        set_current_component(saved_component);
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
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
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
        else if (callback) {
            callback();
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
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
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
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
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* app\svelte\index\NavBar.svelte generated by Svelte v3.59.2 */
    const file$3 = "app\\svelte\\index\\NavBar.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	child_ctx[10] = i;
    	return child_ctx;
    }

    // (35:4) {#each navItems as item, idx}
    function create_each_block(ctx) {
    	let span;
    	let t0_value = /*item*/ ctx[8] + "";
    	let t0;
    	let t1;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[5](/*idx*/ ctx[10]);
    	}

    	function keydown_handler(...args) {
    		return /*keydown_handler*/ ctx[6](/*idx*/ ctx[10], ...args);
    	}

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(span, "class", "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-text font-semibold text-lg cursor-pointer select-none");
    			set_style(span, "left", 12.5 + /*idx*/ ctx[10] * 25 + "%");
    			attr_dev(span, "role", "button");
    			attr_dev(span, "tabindex", "0");
    			add_location(span, file$3, 35, 6, 1099);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, t1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(span, "click", click_handler, false, false, false, false),
    					listen_dev(span, "keydown", keydown_handler, false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(35:4) {#each navItems as item, idx}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let nav;
    	let div0;
    	let div0_class_value;
    	let t;
    	let div1;
    	let each_value = /*navItems*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			div0 = element("div");
    			t = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", div0_class_value = `absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-14 w-1/4 bg-secondary rounded-full z-0 shadow-md transition-all duration-300 ${/*highlightPositions*/ ctx[2][/*active*/ ctx[0]]}`);
    			add_location(div0, file$3, 30, 2, 821);
    			attr_dev(div1, "class", "flex-1 relative h-full z-10");
    			add_location(div1, file$3, 33, 2, 1015);
    			attr_dev(nav, "class", "relative mx-8 h-16 bg-primary rounded-full flex items-center shadow-lg border-2 border-accent overflow-visible");
    			add_location(nav, file$3, 27, 0, 688);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, div0);
    			append_dev(nav, t);
    			append_dev(nav, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div1, null);
    				}
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*active*/ 1 && div0_class_value !== (div0_class_value = `absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-14 w-1/4 bg-secondary rounded-full z-0 shadow-md transition-all duration-300 ${/*highlightPositions*/ ctx[2][/*active*/ ctx[0]]}`)) {
    				attr_dev(div0, "class", div0_class_value);
    			}

    			if (dirty & /*setActiveIndex, handleKeydown, navItems*/ 26) {
    				each_value = /*navItems*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('NavBar', slots, []);
    	let { active = 0 } = $$props;
    	const dispatch = createEventDispatcher();
    	const navItems = ["Import", "Data", "View", "Export"];
    	const highlightPositions = ["left-[12.5%]", "left-[37.5%]", "left-[62.5%]", "left-[87.5%]"];

    	function setActiveIndex(idx) {
    		// Dispatch event to parent instead of setting local state
    		dispatch('navigate', { index: idx });
    	}

    	function handleKeydown(event, idx) {
    		if (event.key === "Enter" || event.key === " ") {
    			event.preventDefault();
    			setActiveIndex(idx);
    		}
    	}

    	const writable_props = ['active'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<NavBar> was created with unknown prop '${key}'`);
    	});

    	const click_handler = idx => setActiveIndex(idx);
    	const keydown_handler = (idx, event) => handleKeydown(event, idx);

    	$$self.$$set = $$props => {
    		if ('active' in $$props) $$invalidate(0, active = $$props.active);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		active,
    		dispatch,
    		navItems,
    		highlightPositions,
    		setActiveIndex,
    		handleKeydown
    	});

    	$$self.$inject_state = $$props => {
    		if ('active' in $$props) $$invalidate(0, active = $$props.active);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		active,
    		navItems,
    		highlightPositions,
    		setActiveIndex,
    		handleKeydown,
    		click_handler,
    		keydown_handler
    	];
    }

    class NavBar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { active: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NavBar",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get active() {
    		throw new Error("<NavBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set active(value) {
    		throw new Error("<NavBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* app\svelte\index\Pages\DataPage.svelte generated by Svelte v3.59.2 */

    const file$2 = "app\\svelte\\index\\Pages\\DataPage.svelte";

    function create_fragment$2(ctx) {
    	let div4;
    	let div1;
    	let div0;
    	let p;
    	let t2;
    	let div3;
    	let div2;

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			p = element("p");
    			p.textContent = `Team: ${/*teamNumber*/ ctx[0]}`;
    			t2 = space();
    			div3 = element("div");
    			div2 = element("div");
    			attr_dev(p, "class", "text-text text-3xl font-medium");
    			add_location(p, file$2, 13, 12, 440);
    			attr_dev(div0, "class", "w-[300px] h-[70px] mx-8 mt-8 mb-8 flex-1 bg-primary rounded-3xl border-2 border-accent shadow-lg p-8 min-h-[7vh] flex flex-col items-start justify-center relative");
    			add_location(div0, file$2, 8, 8, 217);
    			attr_dev(div1, "class", "col-span-1 space-y-4");
    			add_location(div1, file$2, 7, 4, 173);
    			attr_dev(div2, "class", "mx-8 mt-8 mb-8 flex-1 bg-primary rounded-3xl border-2 border-accent shadow-lg p-8 min-h-[7vh] flex flex-col items-start justify-center relative");
    			add_location(div2, file$2, 17, 8, 582);
    			attr_dev(div3, "class", "col-span-1 space-y-4");
    			add_location(div3, file$2, 16, 4, 538);
    			attr_dev(div4, "class", "grid grid-cols-3 gap-4");
    			add_location(div4, file$2, 6, 0, 131);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div1);
    			append_dev(div1, div0);
    			append_dev(div0, p);
    			append_dev(div4, t2);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('DataPage', slots, []);
    	let teamNumber = "10000";
    	let leaderboardTeams = [1, 2, 3, 4, 1000, 200, 513, 8645, 948, 9994];
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<DataPage> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ teamNumber, leaderboardTeams });

    	$$self.$inject_state = $$props => {
    		if ('teamNumber' in $$props) $$invalidate(0, teamNumber = $$props.teamNumber);
    		if ('leaderboardTeams' in $$props) leaderboardTeams = $$props.leaderboardTeams;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [teamNumber];
    }

    class DataPage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DataPage",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* app\svelte\index\Pages\ImportPage.svelte generated by Svelte v3.59.2 */

    const { console: console_1 } = globals;
    const file$1 = "app\\svelte\\index\\Pages\\ImportPage.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let input;
    	let t0;
    	let img;
    	let img_src_value;
    	let t1;
    	let p;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			input = element("input");
    			t0 = space();
    			img = element("img");
    			t1 = space();
    			p = element("p");
    			p.textContent = "Drag or click files";
    			attr_dev(input, "type", "file");
    			input.multiple = true;
    			attr_dev(input, "class", "hidden");
    			add_location(input, file$1, 59, 4, 1601);
    			if (!src_url_equal(img.src, img_src_value = "static/images/upload.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "upload");
    			attr_dev(img, "class", "w-64 h-64 object-contain mb-8 mt-[-2rem]");
    			add_location(img, file$1, 67, 4, 1752);
    			attr_dev(p, "class", "text-text text-3xl font-medium mb-4");
    			add_location(p, file$1, 72, 4, 1890);
    			attr_dev(div, "class", "mx-8 mt-8 mb-8 flex-1 bg-primary rounded-3xl border-2 border-accent shadow-lg p-8 min-h-[80vh] flex flex-col items-center justify-center relative cursor-pointer");
    			attr_dev(div, "tabindex", "0");
    			attr_dev(div, "role", "button");
    			add_location(div, file$1, 50, 0, 1270);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input);
    			/*input_binding*/ ctx[4](input);
    			append_dev(div, t0);
    			append_dev(div, img);
    			append_dev(div, t1);
    			append_dev(div, p);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "change", /*onInputChange*/ ctx[3], false, false, false, false),
    					listen_dev(div, "click", /*openFileDialog*/ ctx[2], false, false, false, false),
    					listen_dev(div, "drop", /*onDrop*/ ctx[1], false, false, false, false),
    					listen_dev(div, "dragover", onDragOver, false, false, false, false),
    					listen_dev(div, "paste", onPaste, false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			/*input_binding*/ ctx[4](null);
    			mounted = false;
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

    function handleDroppedLink(link) {
    	console.log(link); //TODO: Change so it downloads yt video
    }

    function onDragOver(event) {
    	event.preventDefault();
    }

    function onPaste(event) {
    	const pastedText = event.clipboardData.getData("text");

    	if (pastedText) {
    		console.log(pastedText);
    	}
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ImportPage', slots, []);
    	let files = [];

    	function handleFiles(selectedFiles) {
    		files = Array.from(selectedFiles);
    		files.forEach(file => console.log(file.name)); //TODO: Change so it serves files to model
    	}

    	function onDrop(event) {
    		event.preventDefault();
    		const dt = event.dataTransfer;

    		if (dt.files && dt.files.length > 0) {
    			handleFiles(dt.files);
    		} else {
    			const text = dt.getData("text/plain");

    			if (text) {
    				handleDroppedLink(text);
    			}
    		}
    	}

    	let fileInput;

    	function openFileDialog() {
    		fileInput.click();
    	}

    	function onInputChange(event) {
    		handleFiles(event.target.files);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<ImportPage> was created with unknown prop '${key}'`);
    	});

    	function input_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			fileInput = $$value;
    			$$invalidate(0, fileInput);
    		});
    	}

    	$$self.$capture_state = () => ({
    		files,
    		handleFiles,
    		handleDroppedLink,
    		onDrop,
    		onDragOver,
    		onPaste,
    		fileInput,
    		openFileDialog,
    		onInputChange
    	});

    	$$self.$inject_state = $$props => {
    		if ('files' in $$props) files = $$props.files;
    		if ('fileInput' in $$props) $$invalidate(0, fileInput = $$props.fileInput);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [fileInput, onDrop, openFileDialog, onInputChange, input_binding];
    }

    class ImportPage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ImportPage",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* app\svelte\index\App.svelte generated by Svelte v3.59.2 */
    const file = "app\\svelte\\index\\App.svelte";

    // (32:34) 
    function create_if_block_1(ctx) {
    	let datapage;
    	let current;
    	datapage = new DataPage({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(datapage.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(datapage, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(datapage.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(datapage.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(datapage, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(32:34) ",
    		ctx
    	});

    	return block;
    }

    // (30:2) {#if route === "/ImportPage"}
    function create_if_block(ctx) {
    	let importpage;
    	let current;
    	importpage = new ImportPage({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(importpage.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(importpage, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(importpage.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(importpage.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(importpage, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(30:2) {#if route === \\\"/ImportPage\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let navbar;
    	let t;
    	let current_block_type_index;
    	let if_block;
    	let current;

    	navbar = new NavBar({
    			props: { active: /*activeIndex*/ ctx[1] },
    			$$inline: true
    		});

    	navbar.$on("navigate", /*handleNavChange*/ ctx[2]);
    	const if_block_creators = [create_if_block, create_if_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*route*/ ctx[0] === "/ImportPage") return 0;
    		if (/*route*/ ctx[0] === "/DataPage") return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(navbar.$$.fragment);
    			t = space();
    			if (if_block) if_block.c();
    			attr_dev(main, "class", "bg-background min-h-screen pt-8");
    			add_location(main, file, 26, 0, 708);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(navbar, main, null);
    			append_dev(main, t);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(main, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const navbar_changes = {};
    			if (dirty & /*activeIndex*/ 2) navbar_changes.active = /*activeIndex*/ ctx[1];
    			navbar.$set(navbar_changes);
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					}

    					transition_in(if_block, 1);
    					if_block.m(main, null);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navbar.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(navbar);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}
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
    	let activeIndex;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let route = "/ImportPage"; // Current route as string

    	// Map routes to navbar indices
    	const routeToIndex = {
    		"/ImportPage": 0,
    		"/DataPage": 1,
    		"/ViewPage": 2,
    		"/ExportPage": 3
    	};

    	// Handle navigation from NavBar
    	function handleNavChange(event) {
    		const newIndex = event.detail.index;
    		const routes = ["/ImportPage", "/DataPage", "/ViewPage", "/ExportPage"];
    		$$invalidate(0, route = routes[newIndex]);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		NavBar,
    		DataPage,
    		ImportPage,
    		route,
    		routeToIndex,
    		handleNavChange,
    		activeIndex
    	});

    	$$self.$inject_state = $$props => {
    		if ('route' in $$props) $$invalidate(0, route = $$props.route);
    		if ('activeIndex' in $$props) $$invalidate(1, activeIndex = $$props.activeIndex);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*route*/ 1) {
    			// Convert route string to active index
    			$$invalidate(1, activeIndex = routeToIndex[route] ?? 0);
    		}
    	};

    	return [route, activeIndex, handleNavChange];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		greetings: 'Hello'
    	}
    });

    return app;

})();
//# sourceMappingURL=index.js.map
