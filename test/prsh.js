/**
 * External dependencies
 */
import 'mocha';
import { JSDOM } from 'jsdom';
import { h, Fragment, render as preactRender, options } from 'preact';
import { useMemo } from 'preact/hooks';
import { act } from 'preact/test-utils';
import { createStore } from 'redux';
import { strictEqual } from 'assert';
import { createSandbox } from 'sinon';

/**
 * Internal dependencies
 */
import { StoreContext, useSelector, useStore } from '../prsh';

describe( 'useSelector', () => {
	/** @type {Function[]} */
	let subscriptions;

	/** @type {import('jsdom').JSDOM} */
	let dom;

	/** @type {import('redux').Store} */
	let store;

	/** @type {import('sinon').SinonSandbox} */
	let sandbox;

	beforeEach( () => {
		subscriptions = [];
		store = createStore( ( count = 0, action ) =>
			action.type === 'INCREMENT' ? count + 1 : count
		);
		const originalSubscribe = store.subscribe;
		store.subscribe = ( callback ) => {
			subscriptions.push( callback );
			const unsubscribe = originalSubscribe( callback );
			return () => {
				subscriptions.splice( subscriptions.indexOf( callback ), 1 );
				unsubscribe();
			};
		};
		dom = new JSDOM( '<!DOCTYPE html>' );
		// @ts-ignore
		global.window = dom.window;
		// @ts-ignore
		global.document = window.document;
		options.requestAnimationFrame = undefined;
		sandbox = createSandbox();
	} );

	/**
	 * @param {import('preact').VNode} element
	 */
	function render( element ) {
		preactRender(
			h( StoreContext.Provider, { value: store }, element ),
			document.body
		);
	}

	it( 'selects the state on initial render', () => {
		const selector = sandbox.spy( ( state ) => state );
		function MyComponent() {
			const count = useSelector( selector );

			return h( Fragment, null, 'Count: ' + count );
		}

		render( h( MyComponent, null ) );

		strictEqual( 1, subscriptions.length );
		strictEqual( document.body.innerHTML, 'Count: 0' );
		strictEqual( 2, selector.callCount );
	} );

	it( 'selects the state and renders the component when the store updates', () => {
		const selector = sandbox.spy( ( state ) => state );
		function MyComponent() {
			const count = useSelector( selector );

			return h( Fragment, null, 'Count: ' + count );
		}

		render( h( MyComponent, null ) );

		act( () => {
			store.dispatch( { type: 'INCREMENT' } );
		} );

		strictEqual( 1, subscriptions.length );
		strictEqual( document.body.innerHTML, 'Count: 1' );
		strictEqual( 3, selector.callCount );
	} );

	it( 'unsubscribes when the component is unmounted', async () => {
		const selector = sandbox.spy( ( state ) => state );
		function Child() {
			const count = useSelector( selector );

			return h( Fragment, null, 'Count: ' + count );
		}

		/**
		 * @param {Object}  props
		 * @param {boolean} props.shouldRender
		 *
		 * @return {?import('preact').VNode} Rendered element.
		 */
		function Parent( { shouldRender } ) {
			return shouldRender ? h( Child, null ) : null;
		}

		render( h( Parent, { shouldRender: true } ) );

		act( () => {
			render( h( Parent, { shouldRender: false } ) );
		} );

		strictEqual( document.body.innerHTML, '' );
		strictEqual( 0, subscriptions.length );
	} );

	it( 'notices store updates between render and store subscription effect', () => {
		const selector = sandbox.spy( ( state ) => state );
		function MyComponent() {
			const count = useSelector( selector );
			const { dispatch } = useStore();

			if ( count === 0 ) {
				dispatch( { type: 'INCREMENT' } );
			}

			return h( Fragment, null, 'Count: ' + count );
		}

		act( () => {
			render( h( MyComponent, null ) );
		} );

		strictEqual( 1, subscriptions.length );
		strictEqual( document.body.innerHTML, 'Count: 1' );
		strictEqual( 2, selector.callCount );
	} );

	it( 'uses strict equality to prevent unnecessary updates', () => {
		const selector = sandbox.spy( ( state ) => state );

		let renders = 0;
		function MyComponent() {
			const count = useSelector( selector );
			renders++;
			return h( Fragment, null, 'Count: ' + count );
		}

		render( h( MyComponent, null ) );

		act( () => {
			store.dispatch( { type: 'NOOP' } );
		} );

		strictEqual( 1, subscriptions.length );
		strictEqual( document.body.innerHTML, 'Count: 0' );
		strictEqual( 3, selector.callCount );
		strictEqual( 1, renders );
	} );

	it( 'uses the latest selector', () => {
		/**
		 * @param {number} state
		 *
		 * @return {number} Selected state.
		 */
		const selectCount = ( state ) => state;

		/**
		 * @param {number} state
		 *
		 * @return {number} Selected state.
		 */
		const selectNegatedCount = ( state ) => -1 * state;

		/**
		 * @param {Object}   props
		 * @param {Function} props.selector
		 *
		 * @return {import('preact').VNode} Rendered element.
		 */
		function MyComponent( { selector } ) {
			const count = useSelector( selector );

			return h( Fragment, null, 'Count: ' + count );
		}

		render( h( MyComponent, { selector: selectCount } ) );

		act( () => {
			store.dispatch( { type: 'INCREMENT' } );
		} );

		act( () => {
			render( h( MyComponent, { selector: selectNegatedCount } ) );
		} );

		strictEqual( 1, subscriptions.length );
		strictEqual( document.body.innerHTML, 'Count: -1' );
	} );

	it( 'updates in response to dependency changes', () => {
		function MyComponent( { multiplier = 1 } ) {
			// This "works" because the hook receives a new function reference
			// each render. Since the underlying `useLayoutEffect` is provided
			// the function as a dependency, the selector will run each render.
			const countViaChangingSelector = useSelector(
				( state ) => state * multiplier
			);

			// Considering a selector memoized using `useMemo`, while it would
			// be a consistent reference, the workaround would be to provide
			// the prop dependency as a `deps` array member of `useMemo`, to
			// create a new function reference when the dependency changes.
			const memoizedSelector = useMemo(
				() => ( state ) => state * multiplier,
				[ multiplier ]
			);
			const countViaMemoizedSelector = useSelector( memoizedSelector );

			strictEqual( countViaChangingSelector, countViaMemoizedSelector );

			return h( Fragment, null, 'Count: ' + countViaChangingSelector );
		}

		store.dispatch( { type: 'INCREMENT' } );

		render( h( MyComponent, null ) );
		strictEqual( document.body.innerHTML, 'Count: 1' );

		act( () => {
			render( h( MyComponent, { multiplier: 2 } ) );
		} );
		strictEqual( document.body.innerHTML, 'Count: 2' );
	} );
} );
