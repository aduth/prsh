Preact Redux Simple Hooks
---

Preact Redux Simple Hooks (**prsh**) is a tiny implementation of a set of [Preact](https://preactjs.com) [Hooks](https://preactjs.com/guide/v10/hooks) for interacting with a [Redux](https://redux.js.org) store. In the spirit of Preact, it aims to be small and fast, weighing in at only **219 bytes** minified and gzipped ([95% smaller than `react-redux`](https://bundlephobia.com/result?p=react-redux@7.2.0)).

## Example

```jsx
import { createElement } from 'preact';
import { createStore } from 'redux';
import { StoreContext, useSelector, useStore } from 'prsh';

function counter( state = 0, action ) {
	switch ( action.type ) {
		case 'INCREMENT':
			return state + 1;
	}

	return state;
}

const store = createStore( counter );

function CurrentCount() {
	const count = useSelector( ( state ) => state );

	return <div>Current value: { count }</div>;
}

function IncrementButton() {
	const { dispatch } = useStore();

	return (
		<button
			type="button"
			onClick={ () => dispatch( { type: 'INCREMENT' } ) }
		>
			Increment
		</button>
	);
}

function AppRoot() {
	return (
		<StoreContext.Provider value={ store }>
			<CurrentCount />
			<IncrementButton />
		</StoreContext.Provider>
	);
}

render( <AppRoot />, document.body );
```

CodePen: https://codepen.io/aduth/pen/QWbrLWe

## Installation

Using [npm](https://www.npmjs.com/):

```
npm install prsh
```

Or, download a pre-built copy from unpkg:

https://unpkg.com/prsh/dist/prsh.min.js

Or, start using in your browser without any download or build tools:

```html
<script type="module">
import { StoreContext, useSelector } from 'https://unpkg.com/prsh?module';
// ...
</script>
```

## API

### `StoreContext`

The context object which passes a Redux store instance through a component tree.

A `StoreContext.Provider` should be rendered at the top-level of your application:

```jsx
function AppRoot() {
	return (
		<StoreContext.Provider value={ store }>
			<Content />
		</StoreContext.Provider>
	);
}
```

You can also use this in combination with the [`useContext` hook](https://preactjs.com/guide/v10/hooks#context) to get direct access to the store.

```jsx
function ExampleComponent() {
	const store = useContext( StoreContext );

	// ...
}
```

### `useSelector`

A hook which, given a selector function, returns a value from state. The hook creates a subscription to the store and ensures that your component is rerendered whenever the value changes.

```jsx
function DoneTasks() {
	const todos = useSelector( ( state ) => state.todos );
	const doneTasks = todos.filter( ( todo ) => todo.done );

	return <ul>{ doneTasks.map( ( task ) => <li>{ task.text }</li> ) }</ul>;
}
```

`useSelector` uses strict equality `===` to determine whether the component should update. Because of this, you should be careful to note:

- It is fine for a component to have multiple `useSelector` hooks in the same component. Avoid picking multiple parts of state into a single object or array return value, since an object or array will always be strictly unequal to the previous object or array (`{} !== {}`).
- You should ensure that your selector returns a stable value, ideally a direct reference to a state path. Deriving state using operations like [Array#filter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter) should be done separate from the selector result, since `filter` will _always produce a new array value_ and could cause your component to update more frequently than is necessary. If you need to memoize an expensive derivation, you can consider to use [`useMemo`](https://preactjs.com/guide/v10/hooks#usememo) separate from your selector result.

### `useStore`

A hook which returns access to the store of the current context, most commonly to dispatch to the store:

```jsx
function IncrementButton() {
	const { dispatch } = useStore();

	return (
		<button
			type="button"
			onClick={ () => dispatch( { type: 'INCREMENT' } ) }
		>
			Increment
		</button>
	);
}
```

This is simply a shorthand of `useContext( StoreContext );`.

## License

Copyright 2020 Andrew Duthie

Released under the [MIT License](./LICENSE.md).
