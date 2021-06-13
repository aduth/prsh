/**
 * External dependencies
 */
import { createContext } from 'preact';
import { useContext, useState, useLayoutEffect } from 'preact/hooks';

/**
 * @type {import('preact').Context<import('redux').Store>}
 */
// @ts-ignore
export var StoreContext = createContext();

/**
 * Hook which returns the current store from context.
 *
 * @template State
 * @return {import('redux').Store<State>} Store from context provider.
 */
export function useStore() {
	return useContext(StoreContext);
}

/**
 * Hook which returns a value derived using a given selector function, updated
 * when state changes.
 *
 * @template State
 * @template SelectorResult
 *
 * @param {(state:State)=>SelectorResult} selector
 *
 * @return {SelectorResult} Selector-derived value.
 */
export function useSelector(selector) {
	var store = useStore(),
		state = useState(getNextResult);

	function getNextResult() {
		return selector(store.getState());
	}

	useLayoutEffect(
		function () {
			function onStateChange() {
				state[1](getNextResult());
			}

			onStateChange();

			return store.subscribe(onStateChange);
		},
		[store, selector]
	);

	return state[0];
}
